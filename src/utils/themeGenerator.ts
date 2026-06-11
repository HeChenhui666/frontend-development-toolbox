/**
 * 自定义主题生成工具 — 独立文件，避免与 themes/index.ts 形成循环依赖
 */
import type { Theme } from './theme';

const clampChannel = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

const parseHexColor = (color: string): { r: number; g: number; b: number } | null => {
  const hex = color.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const toRgbaColor = (color: string, alpha: number): string => {
  const rgb = parseHexColor(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
};

const hslToHex = (h: number, s: number, l: number): string => {
  const hue2rgb = (p: number, q: number, t: number) => {
    const tt = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  if (s === 0) {
    const val = clampChannel(l * 255);
    return `#${[val, val, val].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;
  const r = clampChannel(hue2rgb(p, q, hNorm + 1 / 3) * 255);
  const g = clampChannel(hue2rgb(p, q, hNorm) * 255);
  const b = clampChannel(hue2rgb(p, q, hNorm - 1 / 3) * 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/** 基于单个 primary 色自动派生完整主题 */
export const generateCustomTheme = (primaryHex: string): Theme => {
  const hsl = hexToHsl(primaryHex);
  const h = hsl?.h ?? 220;
  const s = hsl?.s ?? 0.6;

  const secondary = hslToHex((h + 30) % 360, Math.min(s * 0.9, 0.7), 0.5);
  const accent = hslToHex((h + 15) % 360, Math.min(s * 0.8, 0.6), 0.55);

  const background = hslToHex(h, Math.min(s * 0.08, 0.05), 0.985);
  const surface = hslToHex(h, Math.min(s * 0.1, 0.06), 0.965);
  const surfaceHover = hslToHex(h, Math.min(s * 0.1, 0.06), 0.94);

  const text = hslToHex(h, Math.min(s * 0.2, 0.15), 0.15);
  const textSecondary = hslToHex(h, Math.min(s * 0.15, 0.1), 0.35);
  const textMuted = hslToHex(h, Math.min(s * 0.08, 0.06), 0.6);

  const border = hslToHex(h, Math.min(s * 0.1, 0.06), 0.88);
  const borderLight = hslToHex(h, Math.min(s * 0.08, 0.05), 0.92);

  const scrollbarTrack = surface;
  const scrollbarThumb = hslToHex(h, Math.min(s * 0.08, 0.06), 0.82);
  const inputBorder = hslToHex(h, Math.min(s * 0.1, 0.06), 0.85);

  return {
    name: 'custom',
    displayName: '自定义主题',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'border',
    },
    colors: {
      primary: primaryHex,
      secondary,
      accent,
      background,
      surface,
      surfaceHover,
      text,
      textSecondary,
      textMuted,
      border,
      borderLight,
      active: primaryHex,
      activeBackground: '#FFFFFF',
      activeHover: toRgbaColor(primaryHex, 0.1),
      scrollbarTrack,
      scrollbarThumb,
      scrollbarThumbHover: primaryHex,
      inputBackground: '#FFFFFF',
      inputBorder,
      inputText: text,
      inputFocusBorder: primaryHex,
      buttonPrimary: primaryHex,
      buttonPrimaryHover: hslToHex(h, s, Math.max((hsl?.l ?? 0.4) - 0.08, 0.2)),
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#EF4444',
      errorBackground: '#FEF2F2',
      gradients: {
        main: `linear-gradient(135deg, ${primaryHex} 0%, ${secondary} 100%)`,
        subtle: `linear-gradient(135deg, ${toRgbaColor(primaryHex, 0.06)} 0%, ${toRgbaColor(secondary, 0.03)} 100%)`,
        surface: `linear-gradient(160deg, ${surface} 0%, ${background} 100%)`,
        text: `linear-gradient(to right, ${primaryHex}, ${secondary})`,
        border: `linear-gradient(135deg, ${primaryHex}, ${secondary})`,
      },
    },
  };
};

/** 保存自定义主题色到 localStorage */
export const saveCustomPrimaryColor = (color: string): void => {
  try {
    localStorage.setItem('custom-theme-primary', color);
  } catch { /* ignore */ }
};

/** 读取保存的自定义主题色 */
export const getCustomPrimaryColor = (): string => {
  try {
    return localStorage.getItem('custom-theme-primary') || '#6366F1';
  } catch {
    return '#6366F1';
  }
};

/** 序列化主题颜色配置为可读 JSON 文本 */
export const serializeThemeColors = (theme: Theme): string => {
  const output: Record<string, string | Record<string, string>> = {};
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      output[key] = value;
    } else if (typeof value === 'object') {
      output[key] = value as Record<string, string>;
    }
  });
  return JSON.stringify({ name: theme.displayName, primary: theme.colors.primary, colors: output }, null, 2);
};
