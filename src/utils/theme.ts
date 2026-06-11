// 主题配置
export type ThemeName =
  | 'default'
  | 'bright'
  | 'dreamy'
  | 'qinglan'
  | 'muying'
  | 'caramel-latte'
  | 'songyan'
  | 'rock-strata'
  | 'forest-whisper'
  | 'jieqi-zhe'
  | 'palace-cinnabar'
  | 'ru-porcelain'
  | 'han-brocade'
  | 'custom'
;

/**
 * 主题风格维度：控制圆角、阴影、Tab 指示器、过渡速度、输入框聚焦等视觉个性。
 * 这些维度与颜色无关，让不同主题在结构层面也有明显区别。
 */
export interface ThemeStyle {
  /** 全局圆角风格
   *  - sharp:   2–4px，方正利落，适合水墨/工业/严肃感主题
   *  - default: 6–8px，标准现代风
   *  - round:   10–14px，柔和圆润，适合梦幻/自然系主题
   */
  radius: 'sharp' | 'default' | 'round';

  /** 阴影风格
   *  - flat:   无阴影，极简扁平
   *  - subtle: 极轻阴影，0.05 不透明度
   *  - medium: 标准层次感
   *  - glow:   主色调彩色光晕，适合霓虹/梦幻主题
   */
  shadow: 'flat' | 'subtle' | 'medium' | 'glow';

  /** Tab 激活指示器
   *  - underline: 底部 2px 色线（工具感强）
   *  - pill:      纯色块背景，无底线（柔和感）
   */
  tabIndicator: 'underline' | 'pill';

  /** 过渡速度
   *  - snappy: 100ms ease，即时响应
   *  - normal: 150ms ease，标准节奏
   *  - smooth: 220ms cubic-bezier，平滑舒缓
   */
  transition: 'snappy' | 'normal' | 'smooth';

  /** 输入框聚焦效果
   *  - border: 2px 实线描边（清晰精确）
   *  - glow:   3px 半透明光晕（柔和温暖）
   */
  inputFocus: 'border' | 'glow';

  /** 自定义 Header 渐变背景，不设则由 primaryGradient/primaryGradientEnd 自动派生 */
  headerGradient?: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  /** 风格维度：独立于颜色的视觉个性配置 */
  style: ThemeStyle;
  colors: {
    // 主色调
    primary: string;
    secondary: string;
    accent: string;
    // 背景色
    background: string;
    surface: string;
    surfaceHover: string;
    // 文字色
    text: string;
    textSecondary: string;
    textMuted: string;
    // 边框和分割线
    border: string;
    borderLight: string;
    // 激活状态
    active: string;
    activeBackground: string;
    activeHover: string;
    // 滚动条
    scrollbarTrack: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
    // 输入框和表单元素
    inputBackground: string;
    inputBorder: string;
    inputText: string;
    inputFocusBorder: string;
    // 按钮
    buttonPrimary: string;
    buttonPrimaryHover: string;
    buttonText: string;
    // 特殊状态
    success: string;
    successBackground: string;
    error: string;
    errorBackground: string;
    // 渐变系统
    gradients: {
      main: string;
      subtle: string;
      text: string;
      surface: string;
      border?: string;
    };
  };
}

const clampChannel = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

const parseHexColor = (color: string): { r: number; g: number; b: number } | null => {
  const hex = color.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const normalized = hex.length === 3
    ? hex.split('').map((char) => char + char).join('')
    : hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
};

const parseRgbColor = (color: string): { r: number; g: number; b: number } | null => {
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const [r, g, b] = match[1]
    .split(',')
    .map((part) => Number.parseFloat(part.trim()))
    .filter((value) => !Number.isNaN(value));
  if ([r, g, b].some((value) => value === undefined)) return null;
  return { r, g, b };
};

const toRgbaColor = (color: string, alpha: number): string => {
  const rgb = parseHexColor(color) ?? parseRgbColor(color);
  if (!rgb) return color;
  return `rgba(${clampChannel(rgb.r)}, ${clampChannel(rgb.g)}, ${clampChannel(rgb.b)}, ${alpha})`;
};

const mixHexColors = (colorA: string, colorB: string, weight: number): string => {
  const rgbA = parseHexColor(colorA);
  const rgbB = parseHexColor(colorB);
  if (!rgbA || !rgbB) return colorA;
  const ratio = Math.min(1, Math.max(0, weight));
  const r = clampChannel(rgbA.r * ratio + rgbB.r * (1 - ratio));
  const g = clampChannel(rgbA.g * ratio + rgbB.g * (1 - ratio));
  const b = clampChannel(rgbA.b * ratio + rgbB.b * (1 - ratio));
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

const getReadableTextColor = (color: string, light: string, dark: string): string => {
  const rgb = parseHexColor(color) ?? parseRgbColor(color);
  if (!rgb) return light;
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.65 ? dark : light;
};

const build2048Palette = (colors: Theme['colors']) => {
  const { primary, secondary, surface, background, text } = colors;
  const palette: Record<number, string> = {
    2: mixHexColors(surface, background, 0.7),
    4: mixHexColors(surface, primary, 0.18),
    8: mixHexColors(primary, surface, 0.3),
    16: mixHexColors(primary, surface, 0.4),
    32: mixHexColors(primary, surface, 0.5),
    64: mixHexColors(primary, surface, 0.6),
    128: mixHexColors(secondary, primary, 0.45),
    256: mixHexColors(secondary, primary, 0.6),
    512: mixHexColors(secondary, primary, 0.72),
    1024: mixHexColors(secondary, primary, 0.82),
    2048: mixHexColors(secondary, primary, 0.92),
  };

  const textPalette: Record<number, string> = {};
  Object.entries(palette).forEach(([key, value]) => {
    textPalette[Number(key)] = getReadableTextColor(value, '#f9f6f2', text);
  });

  return { palette, textPalette };
};


import { themes } from '../themes';
export { themes };


// 从 localStorage 获取保存的主题
export const getSavedTheme = (): ThemeName => {
  try {
    const saved = localStorage.getItem('app-theme');
    if (saved && saved in themes) {
      return saved as ThemeName;
    }
  } catch (error) {
    console.error('Failed to get saved theme:', error);
  }
  return 'default';
};

// 保存主题到 localStorage
export const saveTheme = (theme: ThemeName): void => {
  try {
    localStorage.setItem('app-theme', theme);
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
};

// 应用主题到 DOM
export const applyTheme = (theme: ThemeName): void => {
  const themeConfig = themes[theme];
  const root = document.documentElement;

  // ── 颜色 tokens ──────────────────────────────────────────────────────────
  // 仅写入 string 类型的扁平色值，跳过 gradients 嵌套对象
  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    if (typeof value === 'string') root.style.setProperty(`--theme-${key}`, value);
  });

  const { primary, secondary, accent, background, surface, surfaceHover: _surfaceHover, border, borderLight, text, error, success } = themeConfig.colors;
  const { gradients } = themeConfig.colors;
  const onPrimary = getReadableTextColor(primary, '#ffffff', text);
  const { palette: game2048Palette, textPalette: game2048TextPalette } = build2048Palette(themeConfig.colors);

  const derivedVariables: Record<string, string> = {
    // 向后兼容旧变量名（CSS 中仍有引用）
    '--theme-primaryGradient': secondary,
    '--theme-primaryGradientEnd': accent,
    // 派生 soft / shadow 色调
    '--theme-primarySoft': toRgbaColor(primary, 0.12),
    '--theme-primarySoftHover': toRgbaColor(primary, 0.2),
    '--theme-primarySoftActive': toRgbaColor(primary, 0.28),
    '--theme-primaryOutline': toRgbaColor(primary, 0.4),
    '--theme-primaryShadow': toRgbaColor(primary, 0.25),
    '--theme-onPrimary': onPrimary,
    '--theme-surfaceElevated': mixHexColors(surface, background, 0.6),
    '--theme-surfaceSunken': mixHexColors(surface, border, 0.7),
    '--theme-borderStrong': mixHexColors(border, text, 0.25),
    '--theme-borderMuted': mixHexColors(border, background, 0.6),
    '--theme-overlay': toRgbaColor(text, 0.45),
    '--theme-overlayLight': toRgbaColor(onPrimary, 0.7),
    '--theme-headerGlow': toRgbaColor(onPrimary, 0.12),
    '--theme-headerControlBg': toRgbaColor(onPrimary, 0.2),
    '--theme-headerControlHover': toRgbaColor(onPrimary, 0.32),
    '--theme-shadowSubtle': toRgbaColor(primary, 0.08),
    '--theme-shadowSoft': toRgbaColor(primary, 0.18),
    '--theme-shadowStrong': toRgbaColor(primary, 0.32),
    '--theme-errorShadow': toRgbaColor(error, 0.18),
    '--theme-successShadow': toRgbaColor(success, 0.18),
    '--theme-game-2048-accent': secondary,
    // 渐变系统（来自主题定义的 gradients 字段）
    '--theme-gradient-main': gradients.main,
    '--theme-gradient-subtle': gradients.subtle,
    '--theme-gradient-text': gradients.text,
    '--theme-gradient-header': gradients.surface,
    '--theme-accentGradient': gradients.main,
    '--theme-backgroundGradient': gradients.surface,
  };

  Object.entries(game2048Palette).forEach(([key, value]) => {
    derivedVariables[`--theme-game-2048-${key}`] = value;
  });
  Object.entries(game2048TextPalette).forEach(([key, value]) => {
    derivedVariables[`--theme-game-2048-text-${key}`] = value;
  });
  Object.entries(derivedVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // ── 风格维度 tokens ───────────────────────────────────────────────────────
  const { radius: _radius, shadow, tabIndicator, transition, inputFocus, headerGradient } = themeConfig.style;

  // 圆角（全局固定 3px，不随主题 radius 风格变化）
  root.style.setProperty('--app-radius', '3px');
  root.style.setProperty('--theme-radius-sm', '3px');
  root.style.setProperty('--theme-radius-lg', '3px');
  root.style.setProperty('--theme-radius-pill', '3px');

  // 阴影
  const rgb = parseHexColor(primary) ?? { r: 102, g: 102, b: 102 };
  const rgbStr = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  const shadowTokens = {
    flat: {
      card:   'none',
      popup:  '0 2px 8px rgba(0,0,0,0.08)',
      btn:    'none',
      active: '0 1px 4px rgba(0,0,0,0.08)',
    },
    subtle: {
      card:   '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      popup:  '0 4px 12px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
      btn:    '0 1px 2px rgba(0,0,0,0.06)',
      active: `0 2px 6px rgba(${rgbStr},0.15)`,
    },
    medium: {
      card:   '0 2px 8px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)',
      popup:  '0 8px 24px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)',
      btn:    `0 2px 5px rgba(${rgbStr},0.22)`,
      active: `0 3px 10px rgba(${rgbStr},0.2)`,
    },
    glow: {
      card:   `0 4px 20px rgba(${rgbStr},0.18), 0 1px 4px rgba(0,0,0,0.05)`,
      popup:  `0 8px 32px rgba(${rgbStr},0.22), 0 2px 8px rgba(0,0,0,0.07)`,
      btn:    `0 4px 14px rgba(${rgbStr},0.4)`,
      active: `0 4px 16px rgba(${rgbStr},0.28)`,
    },
  }[shadow];
  root.style.setProperty('--theme-shadow-card', shadowTokens.card);
  root.style.setProperty('--theme-shadow-popup', shadowTokens.popup);
  root.style.setProperty('--theme-shadow-btn', shadowTokens.btn);
  root.style.setProperty('--theme-shadow-active', shadowTokens.active);

  // 过渡速度
  root.style.setProperty('--theme-transition', {
    snappy: '100ms ease',
    normal: '150ms ease',
    smooth: '220ms cubic-bezier(0.4, 0, 0.2, 1)',
  }[transition]);

  // Tab 激活指示器
  root.style.setProperty('--theme-tab-active-shadow', 'none');
  root.style.setProperty('--theme-tab-indicator-opacity', tabIndicator === 'underline' ? '1' : '0');

  // 输入框聚焦阴影
  root.style.setProperty(
    '--theme-input-focus-shadow',
    inputFocus === 'glow'
      ? `0 0 0 3px rgba(${rgbStr}, 0.18), 0 1px 2px rgba(0,0,0,0.04)`
      : `0 0 0 2px rgba(${rgbStr}, 0.28)`
  );

  // Header 渐变
  if (headerGradient) {
    root.style.setProperty('--theme-header-gradient', headerGradient);
  } else {
    root.style.removeProperty('--theme-header-gradient');
  }

  // 渐变色 tokens：侧边栏渐变融入 12% secondary 色，让双色主题的次色在侧边栏底部可见
  const surfaceShift = mixHexColors(surface, secondary, 0.88);
  root.style.setProperty('--theme-surfaceGradient', `linear-gradient(180deg, ${surface} 0%, ${surfaceShift} 100%)`);
  root.style.setProperty('--theme-borderGradient', `linear-gradient(135deg, ${border} 0%, ${borderLight} 100%)`);

  root.removeAttribute('data-theme');
};

// 自定义主题工具函数从 ./themeGenerator.ts 导出，避免循环依赖
export { generateCustomTheme, saveCustomPrimaryColor, getCustomPrimaryColor, serializeThemeColors } from './themeGenerator';
