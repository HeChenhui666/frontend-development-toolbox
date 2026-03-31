/** 若改拖尾 DOM 逻辑，请同步 content/mouseTrailContentBundle.ts。 */
import type { MouseTrailStoredConfig } from './mouseTrailStorage';

const CONTAINER_ID = 'xiaohuohuo-mouse-trail-root';

/** 图片拖尾相对指针热点向右下偏移（px），避免盖住箭头尖端 */
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

export interface MouseTrailHandle {
  update: (config: MouseTrailStoredConfig) => void;
  unmount: () => void;
}

/**
 * 在指定 document 上挂载鼠标拖尾（容器 pointer-events: none，不阻挡点击）
 */
export function mountMouseTrail(doc: Document, initialConfig: MouseTrailStoredConfig): MouseTrailHandle {
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
