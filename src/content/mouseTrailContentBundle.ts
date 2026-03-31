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
  trailSize: number;
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  particleCount: number;
  lerpFactor: number;
}

const MOUSE_TRAIL_STORAGE_KEY = 'mouse-trail-config';

const DEFAULT_MOUSE_TRAIL_CONFIG: MouseTrailStoredConfig = {
  enabled: false,
  applyGlobally: false,
  mode: 'css',
  clipPath: 'circle(50% at 50% 50%)',
  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.92), rgba(118, 75, 162, 0.82))',
  trailSize: 14,
  imageDataUrl: null,
  imageWidth: 36,
  imageHeight: 36,
  particleCount: 18,
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
  const imageDataUrl =
    typeof o.imageDataUrl === 'string' && o.imageDataUrl.startsWith('data:')
      ? o.imageDataUrl
      : null;

  return {
    enabled: o.enabled === true,
    applyGlobally: o.applyGlobally === true,
    mode,
    clipPath,
    background,
    trailSize,
    imageDataUrl,
    imageWidth,
    imageHeight,
    particleCount,
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

const CONTAINER_ID = 'xiaohuohuo-mouse-trail-root';
const IMAGE_TRAIL_OFFSET_X = 10;
const IMAGE_TRAIL_OFFSET_Y = 10;

function useImageBottomRightAnchor(config: MouseTrailStoredConfig): boolean {
  return config.mode === 'image' && !!config.imageDataUrl;
}

function applyParticleStyle(el: HTMLDivElement, config: MouseTrailStoredConfig): void {
  const { mode, clipPath, background, trailSize, imageDataUrl, imageWidth, imageHeight } = config;

  if (mode === 'image' && imageDataUrl) {
    el.style.clipPath = 'none';
    el.style.background = 'transparent';
    el.style.backgroundImage = `url(${JSON.stringify(imageDataUrl)})`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundPosition = 'top left';
    el.style.width = `${imageWidth}px`;
    el.style.height = `${imageHeight}px`;
    return;
  }

  el.style.backgroundImage = '';
  el.style.backgroundSize = '';
  el.style.backgroundRepeat = '';
  el.style.backgroundPosition = '';
  el.style.width = `${trailSize}px`;
  el.style.height = `${trailSize}px`;
  el.style.clipPath = clipPath.trim() || 'none';
  el.style.background = background;
}

interface MouseTrailHandle {
  update: (config: MouseTrailStoredConfig) => void;
  unmount: () => void;
}

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
    contain: 'strict',
  } as unknown as Partial<CSSStyleDeclaration>);

  const n = Math.min(50, Math.max(1, Math.round(config.particleCount)));
  const particles: HTMLDivElement[] = [];

  for (let i = 0; i < n; i++) {
    const el = doc.createElement('div');
    Object.assign(el.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      willChange: 'transform, opacity',
      transform: 'translate3d(-9999px,-9999px,0)',
      opacity: String(1 - (i / Math.max(1, n - 1)) * 0.72),
      borderRadius: '0',
    } as unknown as Partial<CSSStyleDeclaration>);
    applyParticleStyle(el, config);
    container.appendChild(el);
    particles.push(el);
  }

  doc.documentElement.appendChild(container);

  const px = new Float32Array(n);
  const py = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    px[i] = -9999;
    py[i] = -9999;
  }

  let mouseX = -9999;
  let mouseY = -9999;
  let raf = 0;
  let active = true;

  const lerp = () => {
    const factor = Math.min(0.95, Math.max(0.05, config.lerpFactor));
    let tx = mouseX;
    let ty = mouseY;
    for (let i = 0; i < n; i++) {
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
    for (let i = 0; i < particles.length; i++) {
      applyParticleStyle(particles[i], config);
      particles[i].style.opacity = String(1 - (i / Math.max(1, particles.length - 1)) * 0.72);
    }
  };

  const unmount = () => {
    active = false;
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
