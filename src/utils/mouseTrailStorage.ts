/** 若改键名/默认值/校验，请同步 content/mouseTrailContentBundle.ts（内容脚本不能引用本文件）。 */
export const MOUSE_TRAIL_STORAGE_KEY = 'mouse-trail-config';

export type MouseTrailMode = 'css' | 'image';

export interface MouseTrailStoredConfig {
  enabled: boolean;
  applyGlobally: boolean;
  mode: MouseTrailMode;
  /** CSS clip-path，如 circle(50% at 50% 50%) 或 polygon(...) */
  clipPath: string;
  /** CSS background，支持颜色、渐变等；followTheme 为 true 时由扩展页面运行时自动替换为主题渐变 */
  background: string;
  /** CSS 模式：自动跟随当前主题的强调色渐变（仅扩展页面生效，内容脚本不可读扩展 CSS 变量） */
  followTheme: boolean;
  /** CSS 模式下拖尾块基准尺寸（px） */
  trailSize: number;
  imageDataUrl: string | null;
  /** 图片拖尾：http(s) 直链；与 imageDataUrl 二选一，同时存在时以本地 data 为准 */
  imageRemoteUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  particleCount: number;
  /** 高负载 GIF 自动降采样保护 */
  gifPerfGuardEnabled: boolean;
  /** 跟随平滑系数，越大越贴光标 */
  lerpFactor: number;
}

export const DEFAULT_MOUSE_TRAIL_CONFIG: MouseTrailStoredConfig = {
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
    typeof o.imageDataUrl === 'string' && o.imageDataUrl.startsWith('data:image/')
      ? o.imageDataUrl
      : null;
  let imageRemoteUrl = sanitizeImageRemoteUrl(o.imageRemoteUrl);
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

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** 当前用于拖尾显示的图片地址（data: 或 http(s)），无则 null */
export function getEffectiveImageTrailBase(config: MouseTrailStoredConfig): string | null {
  if (config.mode !== 'image') return null;
  if (typeof config.imageDataUrl === 'string' && config.imageDataUrl.startsWith('data:image/')) {
    return config.imageDataUrl;
  }
  if (typeof config.imageRemoteUrl === 'string') {
    const t = config.imageRemoteUrl.trim();
    if (t) return t;
  }
  return null;
}

/** 设置页 / 保存前校验；仅允许 http(s) */
export function sanitizeHttpImageUrlForTrail(raw: string): string | null {
  const s = raw.trim().slice(0, 2048);
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  return u.href;
}

/** 用于 GIF 瞄准限速等；外链按路径/参数粗略判断 .gif */
export function isAnimatedGifTrailSource(base: string): boolean {
  if (/^data:image\/gif/i.test(base)) return true;
  try {
    const u = new URL(base);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return /\.gif(\?|#|$)/i.test(u.pathname + u.search);
  } catch {
    return /\.gif(\?|#|$)/i.test(base);
  }
}

function sanitizeImageRemoteUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  return sanitizeHttpImageUrlForTrail(raw);
}

export async function getMouseTrailConfig(): Promise<MouseTrailStoredConfig> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
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
    });
  }

  try {
    const saved = localStorage.getItem(MOUSE_TRAIL_STORAGE_KEY);
    if (saved) {
      return sanitizeConfig(JSON.parse(saved));
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_MOUSE_TRAIL_CONFIG };
}

export function saveMouseTrailConfig(config: MouseTrailStoredConfig): Promise<void> {
  const payload = JSON.stringify(config);
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [MOUSE_TRAIL_STORAGE_KEY]: payload }, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
          return;
        }
        resolve();
      });
    });
  }

  try {
    localStorage.setItem(MOUSE_TRAIL_STORAGE_KEY, payload);
  } catch (e) {
    return Promise.reject(e instanceof Error ? e : new Error(String(e)));
  }
  return Promise.resolve();
}

/** 监听配置变化（扩展环境用 chrome.storage；否则仅 storage 事件无法跨页，开发态可省略） */
export function subscribeMouseTrailConfig(onChange: (config: MouseTrailStoredConfig) => void): () => void {
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

  const onStorage = (e: StorageEvent) => {
    if (e.key !== MOUSE_TRAIL_STORAGE_KEY || e.newValue == null) return;
    try {
      onChange(sanitizeConfig(JSON.parse(e.newValue)));
    } catch {
      /* ignore */
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
