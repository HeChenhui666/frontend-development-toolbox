/**
 * 仅供 content script 使用：必须与 utils/mouseTrailStorage、utils/mouseTrailRuntime 行为一致。
 * 不可从 ../utils 引用，否则 Vite 会打出共享 chunk，Chrome 只注入 manifest 里的单个 JS，拖尾在网页上不生效。
 */

type MouseTrailMode = 'css' | 'image';

interface MouseTrailStoredConfig {
  enabled: boolean;
  applyGlobally: boolean;
  mode: MouseTrailMode;
  clipPath: string;
  background: string;
  /** 内容脚本忽略此字段（无法读取扩展页面 CSS 变量），仅做兼容解析 */
  followTheme: boolean;
  trailSize: number;
  imageDataUrl: string | null;
  imageRemoteUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  particleCount: number;
  gifPerfGuardEnabled: boolean;
  lerpFactor: number;
}

const MOUSE_TRAIL_STORAGE_KEY = 'mouse-trail-config';

const DEFAULT_MOUSE_TRAIL_CONFIG: MouseTrailStoredConfig = {
  enabled: false,
  applyGlobally: false,
  mode: 'css',
  clipPath: 'circle(50% at 50% 50%)',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.92), rgba(118, 75, 162, 0.82))',
  followTheme: true,
  trailSize: 14,
  imageDataUrl: null,
  imageRemoteUrl: null,
  imageWidth: 36,
  imageHeight: 36,
  particleCount: 18,
  gifPerfGuardEnabled: true,
  lerpFactor: 0.32,
};

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeConfig(raw: unknown): MouseTrailStoredConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_MOUSE_TRAIL_CONFIG };
  }
  const o = raw as Record<string, unknown>;
  const mode = o.mode === 'image' ? 'image' : 'css';
  const clipPath = typeof o.clipPath === 'string' ? o.clipPath : DEFAULT_MOUSE_TRAIL_CONFIG.clipPath;
  const background =
    typeof o.background === 'string' ? o.background : DEFAULT_MOUSE_TRAIL_CONFIG.background;
  const trailSize = clampNum(o.trailSize, 4, 128, DEFAULT_MOUSE_TRAIL_CONFIG.trailSize);
  const imageWidth = clampNum(o.imageWidth, 8, 256, DEFAULT_MOUSE_TRAIL_CONFIG.imageWidth);
  const imageHeight = clampNum(o.imageHeight, 8, 256, DEFAULT_MOUSE_TRAIL_CONFIG.imageHeight);
  const particleCount = clampNum(o.particleCount, 1, 50, DEFAULT_MOUSE_TRAIL_CONFIG.particleCount);
  const lerpFactor = clampNum(o.lerpFactor, 0.05, 0.95, DEFAULT_MOUSE_TRAIL_CONFIG.lerpFactor);
  const gifPerfGuardEnabled = o.gifPerfGuardEnabled !== false;
  const imageDataUrl =
    typeof o.imageDataUrl === 'string' && o.imageDataUrl.startsWith('data:')
      ? o.imageDataUrl
      : null;
  let imageRemoteUrl: string | null = null;
  if (typeof o.imageRemoteUrl === 'string') {
    const s = o.imageRemoteUrl.trim().slice(0, 2048);
    if (s) {
      try {
        const u = new URL(s);
        if (u.protocol === 'http:' || u.protocol === 'https:') {
          imageRemoteUrl = u.href;
        }
      } catch {
        /* ignore */
      }
    }
  }
  if (imageDataUrl) {
    imageRemoteUrl = null;
  }

  const followTheme = typeof o.followTheme === 'boolean' ? o.followTheme : true;

  return {
    enabled: o.enabled === true,
    applyGlobally: o.applyGlobally === true,
    mode,
    clipPath,
    background,
    followTheme,
    trailSize,
    imageDataUrl,
    imageRemoteUrl,
    imageWidth,
    imageHeight,
    particleCount,
    gifPerfGuardEnabled,
    lerpFactor,
  };
}

function getMouseTrailConfig(): Promise<MouseTrailStoredConfig> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([MOUSE_TRAIL_STORAGE_KEY], (result) => {
        const raw = result[MOUSE_TRAIL_STORAGE_KEY];
        if (raw == null) {
          resolve({ ...DEFAULT_MOUSE_TRAIL_CONFIG });
          return;
        }
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          resolve(sanitizeConfig(parsed));
        } catch {
          resolve({ ...DEFAULT_MOUSE_TRAIL_CONFIG });
        }
      });
      return;
    }
    resolve({ ...DEFAULT_MOUSE_TRAIL_CONFIG });
  });
}

function subscribeMouseTrailConfig(onChange: (config: MouseTrailStoredConfig) => void): () => void {
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local' || !changes[MOUSE_TRAIL_STORAGE_KEY]) return;
      const nv = changes[MOUSE_TRAIL_STORAGE_KEY].newValue;
      if (nv == null) {
        onChange({ ...DEFAULT_MOUSE_TRAIL_CONFIG });
        return;
      }
      try {
        const parsed = typeof nv === 'string' ? JSON.parse(nv) : nv;
        onChange(sanitizeConfig(parsed));
      } catch {
        onChange({ ...DEFAULT_MOUSE_TRAIL_CONFIG });
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
  return () => {};
}

/* --- runtime（与 mouseTrailRuntime 一致）--- */

function getEffectiveImageTrailBase(config: MouseTrailStoredConfig): string | null {
  if (config.mode !== 'image') return null;
  if (typeof config.imageDataUrl === 'string' && config.imageDataUrl.startsWith('data:')) {
    return config.imageDataUrl;
  }
  if (typeof config.imageRemoteUrl === 'string') {
    const t = config.imageRemoteUrl.trim();
    if (t) return t;
  }
  return null;
}

function isAnimatedGifTrailSource(base: string): boolean {
  if (/^data:image\/gif/i.test(base)) return true;
  try {
    const u = new URL(base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return /\.gif(\?|#|$)/i.test(u.pathname + u.search);
  } catch {
    return /\.gif(\?|#|$)/i.test(base);
  }
}

const CONTAINER_ID = 'xiaohuohuo-mouse-trail-root';

const TRAIL_PARTICLE_IMG_CLASS = 'xiaohuohuo-mouse-trail-particle-img';
const TRAIL_PARTICLE_CANVAS_CLASS = 'xiaohuohuo-mouse-trail-particle-canvas';

/** 图片拖尾相对指针热点向右下偏移（px），避免盖住箭头尖端 */
const IMAGE_TRAIL_OFFSET_X = 10;
const IMAGE_TRAIL_OFFSET_Y = 10;

/** 快速甩鼠标时 GIF 链头限速追指针（px/帧） */
const GIF_AIM_MAX_STEP_PX = 76;

const GIF_FRAME_FALLBACK_MS = 100;
const GIF_FRAME_MIN_MS = 20;
const GIF_PERF_GUARD_PARTICLE_THRESHOLD = 20;
const GIF_PERF_GUARD_FRAME_THRESHOLD = 36;
const GIF_PERF_GUARD_STRIDE = 2;

type ParticleKind = 'css' | 'image-img' | 'image-gif-canvas';

interface DecodedGifState {
  base: string;
  frames: ImageBitmap[];
  frameDurationsMs: number[];
  cumulativeDurationsMs: number[];
  totalDurationMs: number;
  startedAtMs: number;
}

function imageTrailHasContent(config: MouseTrailStoredConfig): boolean {
  return getEffectiveImageTrailBase(config) != null;
}

/** 有图片内容时用右下角锚点；无内容时与 CSS 相同居中 */
function useImageBottomRightAnchor(config: MouseTrailStoredConfig): boolean {
  return imageTrailHasContent(config);
}

function trailStackOpacity(i: number, n: number): string {
  return String(1 - ((n - 1 - i) / Math.max(1, n - 1)) * 0.72);
}

function getImageDecoderCtor(): (new (...args: any[]) => any) | null {
  const maybe = (globalThis as { ImageDecoder?: new (...args: any[]) => any }).ImageDecoder;
  return typeof maybe === 'function' ? maybe : null;
}

/** 仅对本地 data:gif 开启自定义逐帧时钟，彻底绕开浏览器原生 GIF 播放停帧 */
function canUseDecodedGifClock(base: string): boolean {
  return /^data:image\/gif/i.test(base) && !!getImageDecoderCtor() && typeof createImageBitmap === 'function';
}

function resolveParticleKind(config: MouseTrailStoredConfig): ParticleKind {
  const base = getEffectiveImageTrailBase(config);
  if (!base) return 'css';
  if (canUseDecodedGifClock(base)) return 'image-gif-canvas';
  return 'image-img';
}

function disposeDecodedGif(state: DecodedGifState | null): void {
  if (!state) return;
  for (let i = 0; i < state.frames.length; i++) {
    state.frames[i].close();
  }
}

function applyParticleStyle(el: HTMLElement, config: MouseTrailStoredConfig, kind: ParticleKind): void {
  const { clipPath, background, trailSize, imageWidth, imageHeight } = config;
  const base = getEffectiveImageTrailBase(config);

  if (kind === 'image-img' && el instanceof HTMLImageElement) {
    if (!base) return;
    el.style.clipPath = 'none';
    el.style.width = `${imageWidth}px`;
    el.style.height = `${imageHeight}px`;
    el.style.objectFit = 'contain';

    const idx = Number(el.dataset.trailParticleIndex ?? '0');
    const imgUrl = `${base}#xiaohuohuo-trail-${idx}`;
    if (el.dataset.trailApplied !== imgUrl) {
      el.src = imgUrl;
      el.dataset.trailApplied = imgUrl;
    }
    return;
  }

  if (kind === 'image-gif-canvas' && el instanceof HTMLCanvasElement) {
    el.style.width = `${imageWidth}px`;
    el.style.height = `${imageHeight}px`;
    if (el.width !== imageWidth || el.height !== imageHeight) {
      el.width = imageWidth;
      el.height = imageHeight;
    }
    return;
  }

  if (!(el instanceof HTMLDivElement)) {
    return;
  }

  el.style.clipPath = clipPath.trim() || 'none';
  el.style.background = background;
  el.style.width = `${trailSize}px`;
  el.style.height = `${trailSize}px`;
}

interface MouseTrailHandle {
  update: (config: MouseTrailStoredConfig) => void;
  unmount: () => void;
}

/**
 * 在指定 document 上挂载鼠标拖尾（容器 pointer-events: none，不阻挡点击）
 */
function mountMouseTrail(doc: Document, initialConfig: MouseTrailStoredConfig): MouseTrailHandle {
  let config = { ...initialConfig };

  const existing = doc.getElementById(CONTAINER_ID);
  if (existing) {
    existing.remove();
  }

  const container = doc.createElement('div');
  container.id = CONTAINER_ID;
  Object.assign(container.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '2147483646',
    overflow: 'hidden',
  } as unknown as Partial<CSSStyleDeclaration>);

  const n = Math.min(50, Math.max(1, Math.round(config.particleCount)));
  const particles: HTMLElement[] = [];
  const gifCanvasCtx: (CanvasRenderingContext2D | null)[] = Array.from({ length: n }, () => null);
  const px = new Float32Array(n);
  const py = new Float32Array(n);

  let particleKind: ParticleKind = resolveParticleKind(config);
  let decodedGif: DecodedGifState | null = null;
  let decodeSeq = 0;
  let lastDrawnFrameIdx = -1;

  const fillParticles = (): void => {
    for (let i = 0; i < particles.length; i++) {
      particles[i].remove();
      gifCanvasCtx[i] = null;
    }
    particles.length = 0;

    for (let i = 0; i < n; i++) {
      let el: HTMLElement;
      if (particleKind === 'image-img') {
        const im = doc.createElement('img');
        im.className = TRAIL_PARTICLE_IMG_CLASS;
        im.alt = '';
        im.draggable = false;
        im.loading = 'eager';
        el = im;
      } else if (particleKind === 'image-gif-canvas') {
        const cv = doc.createElement('canvas');
        cv.className = TRAIL_PARTICLE_CANVAS_CLASS;
        el = cv;
      } else {
        const d = doc.createElement('div');
        d.style.willChange = 'transform, opacity';
        el = d;
      }

      el.dataset.trailParticleIndex = String(i);
      Object.assign(el.style, {
        position: 'absolute',
        left: '0',
        top: '0',
        transform: 'translate3d(-9999px,-9999px,0)',
        opacity: trailStackOpacity(i, n),
        borderRadius: '0',
        pointerEvents: 'none',
        userSelect: 'none',
      } as unknown as Partial<CSSStyleDeclaration>);

      applyParticleStyle(el, config, particleKind);
      container.appendChild(el);
      particles.push(el);
    }

    for (let i = 0; i < n; i++) {
      px[i] = -9999;
      py[i] = -9999;
    }
    lastDrawnFrameIdx = -1;

    if (particleKind === 'image-gif-canvas') {
      for (let i = 0; i < particles.length; i++) {
        const cv = particles[i];
        gifCanvasCtx[i] = cv instanceof HTMLCanvasElement ? cv.getContext('2d', { alpha: true }) : null;
      }
    }
  };

  const startGifDecodeIfNeeded = async (): Promise<void> => {
    const base = getEffectiveImageTrailBase(config);
    if (particleKind !== 'image-gif-canvas' || !base || !canUseDecodedGifClock(base)) {
      decodeSeq += 1;
      disposeDecodedGif(decodedGif);
      decodedGif = null;
      return;
    }
    if (decodedGif && decodedGif.base === base) {
      return;
    }

    const seq = ++decodeSeq;
    disposeDecodedGif(decodedGif);
    decodedGif = null;

    try {
      const ImageDecoderCtor = getImageDecoderCtor();
      if (!ImageDecoderCtor) return;

      const resp = await fetch(base);
      const arr = await resp.arrayBuffer();
      if (seq !== decodeSeq) return;

      const decoder = new ImageDecoderCtor({ data: new Uint8Array(arr), type: 'image/gif', preferAnimation: true });
      if (decoder.tracks?.ready) {
        await decoder.tracks.ready;
      }
      if (seq !== decodeSeq) {
        decoder.close?.();
        return;
      }

      const track = decoder.tracks?.selectedTrack;
      const frameCount = Math.max(1, Number(track?.frameCount ?? 1));

      const frames: ImageBitmap[] = [];
      const durations: number[] = [];
      for (let i = 0; i < frameCount; i++) {
        const out = await decoder.decode({ frameIndex: i });
        const vf = out.image;
        const bmp = await createImageBitmap(vf);
        vf.close?.();
        frames.push(bmp);

        const durUs = Number(vf.duration ?? GIF_FRAME_FALLBACK_MS * 1000);
        const durMs = Math.max(GIF_FRAME_MIN_MS, Math.round(durUs / 1000) || GIF_FRAME_FALLBACK_MS);
        durations.push(durMs);

        if (seq !== decodeSeq) {
          decoder.close?.();
          for (let j = 0; j < frames.length; j++) frames[j].close();
          return;
        }
      }
      decoder.close?.();

      const cumulative: number[] = [];
      let total = 0;
      for (let i = 0; i < durations.length; i++) {
        total += durations[i];
        cumulative.push(total);
      }
      if (total < GIF_FRAME_MIN_MS) {
        total = GIF_FRAME_FALLBACK_MS;
      }

      if (seq !== decodeSeq) {
        for (let i = 0; i < frames.length; i++) frames[i].close();
        return;
      }

      decodedGif = {
        base,
        frames,
        frameDurationsMs: durations,
        cumulativeDurationsMs: cumulative,
        totalDurationMs: total,
        startedAtMs: (doc.defaultView?.performance ?? performance).now(),
      };
      lastDrawnFrameIdx = -1;
    } catch {
      // 若解码失败则自动回退为 img 粒子，保证可见。
      if (seq !== decodeSeq) return;
      particleKind = 'image-img';
      fillParticles();
    }
  };

  fillParticles();
  void startGifDecodeIfNeeded();

  doc.documentElement.appendChild(container);

  const syncWillChangeForMode = (): void => {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p instanceof HTMLDivElement) {
        p.style.willChange = 'transform, opacity';
      } else {
        p.style.removeProperty('will-change');
      }
    }
  };
  syncWillChangeForMode();

  let mouseX = -9999;
  let mouseY = -9999;
  let aimX = -10000;
  let aimY = -10000;
  let raf = 0;
  let active = true;

  const drawDecodedGif = (nowMs: number): void => {
    if (!decodedGif || particleKind !== 'image-gif-canvas' || decodedGif.frames.length < 1) return;

    const elapsed = ((nowMs - decodedGif.startedAtMs) % decodedGif.totalDurationMs + decodedGif.totalDurationMs) % decodedGif.totalDurationMs;
    let frameIdx = 0;
    for (let i = 0; i < decodedGif.cumulativeDurationsMs.length; i++) {
      if (elapsed < decodedGif.cumulativeDurationsMs[i]) {
        frameIdx = i;
        break;
      }
    }
    const enablePerfGuard = config.gifPerfGuardEnabled !== false;
    const shouldDownsample =
      enablePerfGuard && n >= GIF_PERF_GUARD_PARTICLE_THRESHOLD && decodedGif.frames.length >= GIF_PERF_GUARD_FRAME_THRESHOLD;
    if (shouldDownsample) {
      frameIdx -= frameIdx % GIF_PERF_GUARD_STRIDE;
    }

    if (frameIdx === lastDrawnFrameIdx) {
      return;
    }
    lastDrawnFrameIdx = frameIdx;

    const frame = decodedGif.frames[Math.min(frameIdx, decodedGif.frames.length - 1)];

    for (let i = 0; i < particles.length; i++) {
      const cv = particles[i];
      if (!(cv instanceof HTMLCanvasElement)) continue;
      const ctx = gifCanvasCtx[i] ?? cv.getContext('2d', { alpha: true });
      gifCanvasCtx[i] = ctx;
      if (!ctx) continue;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(frame, 0, 0, cv.width, cv.height);
    }
  };

  const lerp = () => {
    const base = getEffectiveImageTrailBase(config);
    const gifAimSmooth = !!base && isAnimatedGifTrailSource(base);
    const mouseOk = mouseX > -4000 && mouseY > -4000;

    if (!gifAimSmooth) {
      aimX = mouseX;
      aimY = mouseY;
    } else if (mouseOk) {
      if (aimX < -5000) {
        aimX = mouseX;
        aimY = mouseY;
      } else {
        const dx = mouseX - aimX;
        const dy = mouseY - aimY;
        const d = Math.hypot(dx, dy);
        if (d > GIF_AIM_MAX_STEP_PX && d > 0) {
          aimX += (dx / d) * GIF_AIM_MAX_STEP_PX;
          aimY += (dy / d) * GIF_AIM_MAX_STEP_PX;
        } else {
          aimX = mouseX;
          aimY = mouseY;
        }
      }
    }

    const factor = Math.min(0.95, Math.max(0.05, config.lerpFactor));
    let tx = aimX;
    let ty = aimY;
    for (let i = n - 1; i >= 0; i--) {
      px[i] += (tx - px[i]) * factor;
      py[i] += (ty - py[i]) * factor;
      tx = px[i];
      ty = py[i];
    }

    const imageAnchor = useImageBottomRightAnchor(config);
    for (let i = 0; i < n; i++) {
      const el = particles[i];
      if (imageAnchor) {
        el.style.transform = `translate3d(${px[i] + IMAGE_TRAIL_OFFSET_X}px,${py[i] + IMAGE_TRAIL_OFFSET_Y}px,0)`;
      } else {
        el.style.transform = `translate3d(${px[i]}px,${py[i]}px,0) translate(-50%,-50%)`;
      }
    }

    drawDecodedGif((doc.defaultView?.performance ?? performance).now());

    if (active) {
      raf = doc.defaultView?.requestAnimationFrame(lerp) ?? requestAnimationFrame(lerp);
    }
  };

  const onMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };

  doc.addEventListener('mousemove', onMove, { passive: true });
  raf = doc.defaultView?.requestAnimationFrame(lerp) ?? requestAnimationFrame(lerp);

  const update = (next: MouseTrailStoredConfig) => {
    config = { ...next };

    const nextKind = resolveParticleKind(config);
    if (nextKind !== particleKind) {
      particleKind = nextKind;
      fillParticles();
      void startGifDecodeIfNeeded();
    }

    const total = particles.length;
    for (let i = 0; i < total; i++) {
      applyParticleStyle(particles[i], config, particleKind);
      particles[i].style.opacity = trailStackOpacity(i, total);
    }
    syncWillChangeForMode();

    // 同 kind 但图片源变更时也要重解码
    if (particleKind === 'image-gif-canvas') {
      void startGifDecodeIfNeeded();
    }
  };

  const unmount = () => {
    active = false;
    decodeSeq += 1;
    disposeDecodedGif(decodedGif);
    decodedGif = null;
    if (raf) {
      (doc.defaultView ?? window).cancelAnimationFrame(raf);
    }
    doc.removeEventListener('mousemove', onMove);
    container.remove();
  };

  return { update, unmount };
}
export function bootMouseTrailContentScript(): void {
  let handle: MouseTrailHandle | null = null;
  let lastParticleCount = -1;

  const apply = (cfg: MouseTrailStoredConfig) => {
    if (!cfg.enabled || !cfg.applyGlobally) {
      handle?.unmount();
      handle = null;
      lastParticleCount = -1;
      return;
    }

    const n = Math.min(50, Math.max(1, Math.round(cfg.particleCount)));
    if (!handle || lastParticleCount !== n) {
      handle?.unmount();
      handle = mountMouseTrail(document, cfg);
      lastParticleCount = n;
    } else {
      handle.update(cfg);
    }
  };

  void getMouseTrailConfig().then(apply);
  subscribeMouseTrailConfig(apply);
}
