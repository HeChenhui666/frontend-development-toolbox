// 主题配置
export type ThemeName =
  | 'default'
  | 'bright'
  | 'dreamy'
  | 'qinglan'
  | 'muying'
  | 'caramel-latte'
  | 'songyan'
  | 'suyan'
  | 'rock-strata'
  | 'stardust-mist'
  | 'dunhuang'
  | 'forest-whisper'
  | 'glacier'
  | 'ink-lapis'
  | 'jieqi-zhe'
  | 'palace-cinnabar'
  | 'ru-porcelain'
  | 'han-brocade'
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

export const themes: Record<ThemeName, Theme> = {
  default: {
    name: 'default',
    displayName: '默认·暖橙',
    style: {
      radius: 'round',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#FF7F50',
      secondary: '#FFA500', // Orange for accents/borders
      accent: '#FF6B6B',
      background: '#FFFBF8',
      surface: '#FFF5F0',
      surfaceHover: '#FFE8DE',
      text: '#2D2420',
      textSecondary: '#6B564C',
      textMuted: '#A8948C',
      border: '#F0DCCF',
      borderLight: '#F7ECE4',
      // 关键优化：使用辅助色作为边框和光晕，增加层次
      active: '#FF7F50',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(255, 165, 0, 0.2)', // Use secondary for hover tint
      scrollbarTrack: '#FFF5F0',
      scrollbarThumb: '#E0C4B8',
      scrollbarThumbHover: '#FFA500', // Thumb hover becomes secondary color
      inputBackground: '#FFFFFF',
      inputBorder: '#E0D0C5',
      inputText: '#2D2420',
      inputFocusBorder: '#FFA500', // Focus border uses secondary
      buttonPrimary: '#FF7F50',
      buttonPrimaryHover: '#E56A3D',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#EF4444',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #FF7F50 0%, #FFA500 100%)',
        subtle: 'linear-gradient(135deg, rgba(255, 127, 80, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)',
        surface: 'linear-gradient(160deg, #FFF5F0 0%, #FFFBEB 100%)',
        text: 'linear-gradient(to right, #FF7F50, #FF4500)',
        border: 'linear-gradient(135deg, #FF7F50, #FFA500)',
      }
    },
  },
  bright: {
    name: 'bright',
    displayName: '明亮·科技蓝',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'border',
    },
    colors: {
      primary: '#2563EB',
      secondary: '#06B6D4', // Cyan
      accent: '#6366F1',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceHover: '#F1F5F9',
      text: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      border: '#E2E8F0',
      borderLight: '#F1F5F9',
      active: '#2563EB',
      activeBackground: '#EFF6FF',
      activeHover: 'rgba(6, 182, 212, 0.1)', // Cyan tint on hover
      scrollbarTrack: '#F8FAFC',
      scrollbarThumb: '#CBD5E1',
      scrollbarThumbHover: '#06B6D4',
      inputBackground: '#FFFFFF',
      inputBorder: '#CBD5E1',
      inputText: '#0F172A',
      inputFocusBorder: '#06B6D4', // Focus reveals the Cyan
      buttonPrimary: '#2563EB',
      buttonPrimaryHover: '#1D4ED8',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#EF4444',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
        subtle: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
        surface: 'linear-gradient(160deg, #EFF6FF 0%, #ECFEFF 100%)',
        text: 'linear-gradient(to right, #2563EB, #06B6D4)',
        border: 'linear-gradient(135deg, #2563EB, #06B6D4)',
      }
    },
  },
  dreamy: {
    name: 'dreamy',
    displayName: '梦幻·霓虹紫',
    style: {
      radius: 'round',
      shadow: 'glow',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899', // Pink
      accent: '#F472B6',
      background: '#FAF5FF',
      surface: '#F3E8FF',
      surfaceHover: '#E9D5FF',
      text: '#4C1D95',
      textSecondary: '#6D28D9',
      textMuted: '#A78BFA',
      border: '#DDD6FE',
      borderLight: '#EDE9FE',
      active: '#8B5CF6',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(236, 72, 153, 0.15)', // Pink hover
      scrollbarTrack: '#F3E8FF',
      scrollbarThumb: '#C4B5FD',
      scrollbarThumbHover: '#EC4899',
      inputBackground: '#FFFFFF',
      inputBorder: '#DDD6FE',
      inputText: '#4C1D95',
      inputFocusBorder: '#EC4899', // Pink focus
      buttonPrimary: '#8B5CF6',
      buttonPrimaryHover: '#7C3AED',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#F43F5E',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        subtle: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
        surface: 'linear-gradient(160deg, #FAF5FF 0%, #FFF0F9 100%)',
        text: 'linear-gradient(to right, #8B5CF6, #EC4899)',
        border: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      }
    },
  },
  qinglan: {
    name: 'qinglan',
    displayName: '青岚·雨过天青',
    style: {
      radius: 'default',
      shadow: 'subtle',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
    },
    colors: {
      primary: '#0EA5E9',
      secondary: '#14B8A6', // Teal
      accent: '#6366F1',
      background: '#F0F9FF',
      surface: '#E0F2FE',
      surfaceHover: '#BAE6FD',
      text: '#0C4A6E',
      textSecondary: '#0369A1',
      textMuted: '#7DD3FC',
      border: '#BAE6FD',
      borderLight: '#E0F2FE',
      active: '#0EA5E9',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(20, 184, 166, 0.12)', // Teal hover
      scrollbarTrack: '#E0F2FE',
      scrollbarThumb: '#7DD3FC',
      scrollbarThumbHover: '#14B8A6',
      inputBackground: '#FFFFFF',
      inputBorder: '#BAE6FD',
      inputText: '#0C4A6E',
      inputFocusBorder: '#14B8A6', // Teal focus
      buttonPrimary: '#0EA5E9',
      buttonPrimaryHover: '#0284C7',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#EF4444',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
        subtle: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%)',
        surface: 'linear-gradient(160deg, #F0F9FF 0%, #F0FDFA 100%)',
        text: 'linear-gradient(to right, #0284C7, #0D9488)',
        border: 'linear-gradient(135deg, #0EA5E9, #14B8A6)',
      }
    },
  },
  muying: {
    name: 'muying',
    displayName: '暮樱·晚樱粉',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#DB2777',
      secondary: '#F472B6',
      accent: '#FB7185',
      background: '#FDF2F8',
      surface: '#FCE7F3',
      surfaceHover: '#FBCFE8',
      text: '#831843',
      textSecondary: '#9D174D',
      textMuted: '#F472B6',
      border: '#FBCFE8',
      borderLight: '#FDF2F8',
      active: '#DB2777',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(244, 114, 182, 0.12)',
      scrollbarTrack: '#FCE7F3',
      scrollbarThumb: '#F9A8D4',
      scrollbarThumbHover: '#F472B6',
      inputBackground: '#FFFFFF',
      inputBorder: '#FBCFE8',
      inputText: '#831843',
      inputFocusBorder: '#F472B6',
      buttonPrimary: '#DB2777',
      buttonPrimaryHover: '#BE185D',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#E11D48',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #DB2777 0%, #F472B6 100%)',
        subtle: 'linear-gradient(135deg, rgba(219, 39, 119, 0.1) 0%, rgba(244, 114, 182, 0.05) 100%)',
        surface: 'linear-gradient(135deg, #FCE7F3 0%, #FDF2F8 100%)',
        text: 'linear-gradient(to right, #BE185D, #DB2777)',
        border: 'linear-gradient(135deg, #DB2777, #F472B6)',
      }
    },
  },
  'caramel-latte': {
    name: 'caramel-latte',
    displayName: '焦糖·拿铁',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#B45309',
      secondary: '#D97706',
      accent: '#92400E',
      background: '#FFFBEB',
      surface: '#FEF3C7',
      surfaceHover: '#FDE68A',
      text: '#451A03',
      textSecondary: '#78350F',
      textMuted: '#B45309',
      border: '#FCD34D',
      borderLight: '#FEF3C7',
      active: '#B45309',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(217, 119, 6, 0.15)',
      scrollbarTrack: '#FEF3C7',
      scrollbarThumb: '#FCD34D',
      scrollbarThumbHover: '#D97706',
      inputBackground: '#FFFBEB',
      inputBorder: '#FCD34D',
      inputText: '#451A03',
      inputFocusBorder: '#D97706',
      buttonPrimary: '#B45309',
      buttonPrimaryHover: '#92400E',
      buttonText: '#FFFFFF',
      success: '#059669',
      successBackground: '#ECFDF5',
      error: '#DC2626',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
        subtle: 'linear-gradient(135deg, rgba(180, 83, 9, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
        surface: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
        text: 'linear-gradient(to right, #92400E, #B45309)',
        border: 'linear-gradient(135deg, #B45309, #D97706)',
      }
    },
  },
  songyan: {
    name: 'songyan',
    displayName: '松烟·墨色',
    style: {
      radius: 'sharp',
      shadow: 'flat',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
    },
    colors: {
      primary: '#292524',
      secondary: '#57534E',
      accent: '#78716C',
      background: '#FAFAF9',
      surface: '#F5F5F4',
      surfaceHover: '#E7E5E4',
      text: '#1C1917',
      textSecondary: '#44403C',
      textMuted: '#A8A29E',
      border: '#D6D3D1',
      borderLight: '#E7E5E4',
      active: '#292524',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(87, 83, 78, 0.1)',
      scrollbarTrack: '#F5F5F4',
      scrollbarThumb: '#D6D3D1',
      scrollbarThumbHover: '#57534E',
      inputBackground: '#FFFFFF',
      inputBorder: '#D6D3D1',
      inputText: '#1C1917',
      inputFocusBorder: '#57534E',
      buttonPrimary: '#292524',
      buttonPrimaryHover: '#1C1917',
      buttonText: '#FFFFFF',
      success: '#3F6212',
      successBackground: '#F7FEE7',
      error: '#991B1B',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #292524 0%, #57534E 100%)',
        subtle: 'linear-gradient(135deg, rgba(41, 37, 36, 0.08) 0%, rgba(87, 83, 78, 0.04) 100%)',
        surface: 'linear-gradient(180deg, #F5F5F4 0%, #FAFAF9 100%)',
        text: 'linear-gradient(to right, #1C1917, #44403C)',
        border: 'linear-gradient(135deg, #292524, #57534E)',
      }
    },
  },
  suyan: {
    name: 'suyan',
    displayName: '素砚·极简灰',
    style: {
      radius: 'sharp',
      shadow: 'subtle',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
    },
    colors: {
      primary: '#52525B',
      secondary: '#71717A',
      accent: '#A1A1AA',
      background: '#FFFFFF',
      surface: '#F4F4F5',
      surfaceHover: '#E4E4E7',
      text: '#18181B',
      textSecondary: '#3F3F46',
      textMuted: '#A1A1AA',
      border: '#E4E4E7',
      borderLight: '#F4F4F5',
      active: '#52525B',
      activeBackground: '#FAFAFA',
      activeHover: 'rgba(113, 113, 122, 0.1)',
      scrollbarTrack: '#F4F4F5',
      scrollbarThumb: '#D4D4D8',
      scrollbarThumbHover: '#71717A',
      inputBackground: '#FFFFFF',
      inputBorder: '#E4E4E7',
      inputText: '#18181B',
      inputFocusBorder: '#71717A',
      buttonPrimary: '#52525B',
      buttonPrimaryHover: '#3F3F46',
      buttonText: '#FFFFFF',
      success: '#166534',
      successBackground: '#F0FDF4',
      error: '#991B1B',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #52525B 0%, #71717A 100%)',
        subtle: 'linear-gradient(135deg, rgba(82, 82, 91, 0.08) 0%, rgba(113, 113, 122, 0.04) 100%)',
        surface: 'linear-gradient(180deg, #F4F4F5 0%, #FFFFFF 100%)',
        text: 'linear-gradient(to right, #3F3F46, #52525B)',
        border: 'linear-gradient(135deg, #52525B, #71717A)',
      }
    },
  },
  'rock-strata': {
    name: 'rock-strata',
    displayName: '岩层·赤陶',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'border',
    },
    colors: {
      primary: '#C2410C',
      secondary: '#EA580C',
      accent: '#9A3412',
      background: '#FFF7ED',
      surface: '#FFEDD5',
      surfaceHover: '#FED7AA',
      text: '#431407',
      textSecondary: '#7C2D12',
      textMuted: '#EA580C',
      border: '#FDBA74',
      borderLight: '#FFEDD5',
      active: '#C2410C',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(234, 88, 12, 0.15)',
      scrollbarTrack: '#FFEDD5',
      scrollbarThumb: '#FDBA74',
      scrollbarThumbHover: '#EA580C',
      inputBackground: '#FFF7ED',
      inputBorder: '#FDBA74',
      inputText: '#431407',
      inputFocusBorder: '#EA580C',
      buttonPrimary: '#C2410C',
      buttonPrimaryHover: '#9A3412',
      buttonText: '#FFFFFF',
      success: '#3F6212',
      successBackground: '#F7FEE7',
      error: '#9F1239',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #9A3412 0%, #C2410C 100%)',
        subtle: 'linear-gradient(135deg, rgba(154, 52, 18, 0.1) 0%, rgba(194, 65, 12, 0.05) 100%)',
        surface: 'linear-gradient(135deg, #FFEDD5 0%, #FFF7ED 100%)',
        text: 'linear-gradient(to right, #7C2D12, #C2410C)',
        border: 'linear-gradient(135deg, #9A3412, #C2410C)',
      }
    },
  },
  'stardust-mist': {
    name: 'stardust-mist',
    displayName: '星尘·幻紫',
    style: {
      radius: 'round',
      shadow: 'glow',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#7C3AED',
      secondary: '#C084FC',
      accent: '#A78BFA',
      background: '#F5F3FF',
      surface: '#EDE9FE',
      surfaceHover: '#DDD6FE',
      text: '#2E1065',
      textSecondary: '#4C1D95',
      textMuted: '#8B5CF6',
      border: '#C4B5FD',
      borderLight: '#DDD6FE',
      active: '#7C3AED',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(192, 132, 252, 0.15)',
      scrollbarTrack: '#EDE9FE',
      scrollbarThumb: '#C4B5FD',
      scrollbarThumbHover: '#C084FC',
      inputBackground: '#FFFFFF',
      inputBorder: '#C4B5FD',
      inputText: '#2E1065',
      inputFocusBorder: '#C084FC',
      buttonPrimary: '#7C3AED',
      buttonPrimaryHover: '#6D28D9',
      buttonText: '#FFFFFF',
      success: '#059669',
      successBackground: '#ECFDF5',
      error: '#E11D48',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 50%, #C084FC 100%)',
        subtle: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(192, 132, 252, 0.1) 100%)',
        surface: 'linear-gradient(160deg, #EDE9FE 0%, #F7F0FF 100%)',
        text: 'linear-gradient(to right, #6D28D9, #A78BFA)',
        border: 'linear-gradient(135deg, #7C3AED, #C084FC)',
      }
    },
  },
  dunhuang: {
    name: 'dunhuang',
    displayName: '敦煌·飞天',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow', // Changed to glow to show off the green ring
    },
    colors: {
      primary: '#B45309', // Ocher
      secondary: '#15803D', // Malachite Green - NOW USED FOR BORDERS/FOCUS
      accent: '#D97706',
      background: '#FEFCE8',
      surface: '#FEF3C7',
      surfaceHover: '#FDE68A',
      text: '#422006',
      textSecondary: '#78350F',
      textMuted: '#B45309',
      border: '#FCD34D', // Gold-ish border base
      borderLight: '#FEF3C7',
      active: '#D97706',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(21, 128, 61, 0.15)', // Green tint hover
      scrollbarTrack: '#FEF3C7',
      scrollbarThumb: '#FCD34D',
      scrollbarThumbHover: '#15803D', // Green thumb on hover
      inputBackground: '#FFFBEB',
      inputBorder: '#FCD34D',
      inputText: '#422006',
      inputFocusBorder: '#15803D', // KEY: Focus ring is GREEN
      buttonPrimary: '#B45309',
      buttonPrimaryHover: '#92400E',
      buttonText: '#FFFFFF',
      success: '#15803D', // Success is also Green to reinforce theme
      successBackground: '#F0FDF4',
      error: '#991B1B',
      errorBackground: '#FEF2F2',
      gradients: {
        // Ocher to Green gradient for large areas
        main: 'linear-gradient(135deg, #B45309 0%, #D97706 40%, #15803D 100%)',
        subtle: 'linear-gradient(135deg, rgba(180, 83, 9, 0.1) 0%, rgba(21, 128, 61, 0.08) 100%)',
        surface: 'linear-gradient(160deg, #FEF3C7 0%, #F0FFF4 100%)',
        text: 'linear-gradient(to right, #92400E, #15803D)',
        border: 'linear-gradient(135deg, #D97706, #15803D)',
      }
    },
  },
  'forest-whisper': {
    name: 'forest-whisper',
    displayName: '森语·苔藓',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#15803D',
      secondary: '#16A34A',
      accent: '#4ADE80',
      background: '#F0FDF4',
      surface: '#DCFCE7',
      surfaceHover: '#BBF7D0',
      text: '#14532D',
      textSecondary: '#166534',
      textMuted: '#4ADE80',
      border: '#BBF7D0',
      borderLight: '#DCFCE7',
      active: '#15803D',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(22, 163, 74, 0.12)',
      scrollbarTrack: '#DCFCE7',
      scrollbarThumb: '#86EFAC',
      scrollbarThumbHover: '#16A34A',
      inputBackground: '#F0FDF4',
      inputBorder: '#BBF7D0',
      inputText: '#14532D',
      inputFocusBorder: '#16A34A',
      buttonPrimary: '#15803D',
      buttonPrimaryHover: '#166534',
      buttonText: '#FFFFFF',
      success: '#15803D',
      successBackground: '#DCFCE7',
      error: '#991B1B',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #14532D 0%, #15803D 100%)',
        subtle: 'linear-gradient(135deg, rgba(21, 128, 61, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)',
        surface: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 100%)',
        text: 'linear-gradient(to right, #166534, #15803D)',
        border: 'linear-gradient(135deg, #15803D, #16A34A)',
      }
    },
  },
  glacier: {
    name: 'glacier',
    displayName: '冰川·凛冬',
    style: {
      radius: 'sharp',
      shadow: 'subtle',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
    },
    colors: {
      primary: '#0284C7',
      secondary: '#0EA5E9',
      accent: '#38BDF8',
      background: '#F0F9FF',
      surface: '#E0F2FE',
      surfaceHover: '#BAE6FD',
      text: '#082F49',
      textSecondary: '#075985',
      textMuted: '#38BDF8',
      border: '#BAE6FD',
      borderLight: '#E0F2FE',
      active: '#0284C7',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(14, 165, 233, 0.12)',
      scrollbarTrack: '#E0F2FE',
      scrollbarThumb: '#7DD3FC',
      scrollbarThumbHover: '#0EA5E9',
      inputBackground: '#F0F9FF',
      inputBorder: '#BAE6FD',
      inputText: '#082F49',
      inputFocusBorder: '#0EA5E9',
      buttonPrimary: '#0284C7',
      buttonPrimaryHover: '#0369A1',
      buttonText: '#FFFFFF',
      success: '#059669',
      successBackground: '#ECFDF5',
      error: '#BE123C',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)',
        subtle: 'linear-gradient(135deg, rgba(3, 105, 161, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)',
        surface: 'linear-gradient(180deg, #E8F4FD 0%, #F5FBFF 100%)',
        text: 'linear-gradient(to right, #075985, #0284C7)',
        border: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
      }
    },
  },
  'ink-lapis': {
    name: 'ink-lapis',
    displayName: '水墨·石青',
    style: {
      radius: 'sharp',
      shadow: 'flat',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
    },
    colors: {
      primary: '#1E40AF',
      secondary: '#3B82F6',
      accent: '#60A5FA',
      background: '#F8FAFC',
      surface: '#F1F5F9',
      surfaceHover: '#E2E8F0',
      text: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#94A3B8',
      border: '#CBD5E1',
      borderLight: '#E2E8F0',
      active: '#1E40AF',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(59, 130, 246, 0.12)',
      scrollbarTrack: '#F1F5F9',
      scrollbarThumb: '#CBD5E1',
      scrollbarThumbHover: '#3B82F6',
      inputBackground: '#FFFFFF',
      inputBorder: '#CBD5E1',
      inputText: '#0F172A',
      inputFocusBorder: '#3B82F6',
      buttonPrimary: '#1E40AF',
      buttonPrimaryHover: '#1E3A8A',
      buttonText: '#FFFFFF',
      success: '#047857',
      successBackground: '#ECFDF5',
      error: '#9F1239',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
        subtle: 'linear-gradient(135deg, rgba(30, 64, 175, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        surface: 'linear-gradient(160deg, #F0F4FB 0%, #F5F8FF 100%)',
        text: 'linear-gradient(to right, #1E40AF, #3B82F6)',
        border: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
      }
    },
  },
  'jieqi-zhe': {
    name: 'jieqi-zhe',
    displayName: '惊蛰·春雷',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#65A30D',
      secondary: '#84CC16',
      accent: '#A3E635',
      background: '#F7FEE7',
      surface: '#ECFCCB',
      surfaceHover: '#D9F99D',
      text: '#365314',
      textSecondary: '#4D7C0F',
      textMuted: '#A3E635',
      border: '#D9F99D',
      borderLight: '#ECFCCB',
      active: '#65A30D',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(132, 204, 22, 0.15)',
      scrollbarTrack: '#ECFCCB',
      scrollbarThumb: '#BEF264',
      scrollbarThumbHover: '#84CC16',
      inputBackground: '#F7FEE7',
      inputBorder: '#D9F99D',
      inputText: '#365314',
      inputFocusBorder: '#84CC16',
      buttonPrimary: '#65A30D',
      buttonPrimaryHover: '#4D7C0F',
      buttonText: '#FFFFFF',
      success: '#65A30D',
      successBackground: '#ECFCCB',
      error: '#B91C1C',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #4D7C0F 0%, #65A30D 100%)',
        subtle: 'linear-gradient(135deg, rgba(101, 163, 13, 0.1) 0%, rgba(132, 204, 22, 0.05) 100%)',
        surface: 'linear-gradient(160deg, #ECFCCB 0%, #F7FFF5 100%)',
        text: 'linear-gradient(to right, #4D7C0F, #65A30D)',
        border: 'linear-gradient(135deg, #65A30D, #84CC16)',
      }
    },
  },
  'palace-cinnabar': {
    name: 'palace-cinnabar',
    displayName: '宫墙·朱砂',
    style: {
      radius: 'sharp',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#B91C1C', // Red
      secondary: '#F59E0B', // Gold
      accent: '#DC2626',
      background: '#FEF2F2',
      surface: '#FEE2E2',
      surfaceHover: '#FECACA',
      text: '#450A0A',
      textSecondary: '#7F1D1D',
      textMuted: '#F87171',
      border: '#FECACA',
      borderLight: '#FEE2E2',
      active: '#B91C1C',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(245, 158, 11, 0.12)', // Gold hover
      scrollbarTrack: '#FEE2E2',
      scrollbarThumb: '#FCA5A5',
      scrollbarThumbHover: '#F59E0B', // Gold thumb
      inputBackground: '#FEF2F2',
      inputBorder: '#FECACA',
      inputText: '#450A0A',
      inputFocusBorder: '#F59E0B', // KEY: Focus ring is GOLD
      buttonPrimary: '#B91C1C',
      buttonPrimaryHover: '#991B1B',
      buttonText: '#FFFFFF',
      success: '#047857',
      successBackground: '#ECFDF5',
      error: '#991B1B',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #991B1B 0%, #B91C1C 50%, #F59E0B 100%)',
        subtle: 'linear-gradient(135deg, rgba(185, 28, 28, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
        surface: 'linear-gradient(160deg, #FEE2E2 0%, #FFFDF0 100%)',
        text: 'linear-gradient(to right, #991B1B, #B91C1C)',
        border: 'linear-gradient(135deg, #B91C1C, #F59E0B)',
      }
    },
  },
  'ru-porcelain': {
    name: 'ru-porcelain',
    displayName: '宋瓷·天青',
    style: {
      radius: 'default',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'border',
    },
    colors: {
      primary: '#64748B',
      secondary: '#94A3B8',
      accent: '#CBD5E1',
      background: '#F8FAFC',
      surface: '#F1F5F9',
      surfaceHover: '#E2E8F0',
      text: '#334155',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      border: '#CBD5E1',
      borderLight: '#E2E8F0',
      active: '#64748B',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(148, 163, 184, 0.12)',
      scrollbarTrack: '#F1F5F9',
      scrollbarThumb: '#CBD5E1',
      scrollbarThumbHover: '#94A3B8',
      inputBackground: '#FFFFFF',
      inputBorder: '#CBD5E1',
      inputText: '#334155',
      inputFocusBorder: '#94A3B8',
      buttonPrimary: '#64748B',
      buttonPrimaryHover: '#475569',
      buttonText: '#FFFFFF',
      success: '#059669',
      successBackground: '#ECFDF5',
      error: '#DC2626',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)',
        subtle: 'linear-gradient(135deg, rgba(100, 116, 139, 0.08) 0%, rgba(148, 163, 184, 0.04) 100%)',
        surface: 'linear-gradient(160deg, #EEF3F8 0%, #F5F9FC 100%)',
        text: 'linear-gradient(to right, #475569, #64748B)',
        border: 'linear-gradient(135deg, #64748B, #94A3B8)',
      }
    },
  },
  'han-brocade': {
    name: 'han-brocade',
    displayName: '汉锦·藻井',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#7E22CE', // Purple
      secondary: '#BE185D', // Magenta
      accent: '#F59E0B', // Gold
      background: '#FAF5FF',
      surface: '#F3E8FF',
      surfaceHover: '#E9D5FF',
      text: '#3B0764',
      textSecondary: '#6B21A8',
      textMuted: '#A855F7',
      border: '#E9D5FF',
      borderLight: '#F3E8FF',
      active: '#7E22CE',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(190, 24, 93, 0.15)', // Magenta hover
      scrollbarTrack: '#F3E8FF',
      scrollbarThumb: '#D8B4FE',
      scrollbarThumbHover: '#BE185D',
      inputBackground: '#FAF5FF',
      inputBorder: '#E9D5FF',
      inputText: '#3B0764',
      inputFocusBorder: '#BE185D', // Magenta focus
      buttonPrimary: '#7E22CE',
      buttonPrimaryHover: '#6B21A8',
      buttonText: '#FFFFFF',
      success: '#059669',
      successBackground: '#ECFDF5',
      error: '#BE123C',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #581C87 0%, #7E22CE 50%, #BE185D 100%)',
        subtle: 'linear-gradient(135deg, rgba(126, 34, 206, 0.15) 0%, rgba(190, 24, 93, 0.1) 100%)',
        surface: 'linear-gradient(160deg, #F3E8FF 0%, #FFF0F8 100%)',
        text: 'linear-gradient(to right, #6B21A8, #BE185D)',
        border: 'linear-gradient(135deg, #7E22CE, #BE185D)',
      }
    },
  },
};

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

  const { primary, secondary, accent, background, surface, surfaceHover, border, borderLight, text, error, success } = themeConfig.colors;
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
  const { radius, shadow, tabIndicator, transition, inputFocus, headerGradient } = themeConfig.style;

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
