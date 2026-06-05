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
    primaryGradient: string;
    primaryGradientEnd: string;
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
  const { primary, primaryGradientEnd, surface, background, text } = colors;
  const palette: Record<number, string> = {
    2: mixHexColors(surface, background, 0.7),
    4: mixHexColors(surface, primary, 0.18),
    8: mixHexColors(primary, surface, 0.3),
    16: mixHexColors(primary, surface, 0.4),
    32: mixHexColors(primary, surface, 0.5),
    64: mixHexColors(primary, surface, 0.6),
    128: mixHexColors(primaryGradientEnd, primary, 0.45),
    256: mixHexColors(primaryGradientEnd, primary, 0.6),
    512: mixHexColors(primaryGradientEnd, primary, 0.72),
    1024: mixHexColors(primaryGradientEnd, primary, 0.82),
    2048: mixHexColors(primaryGradientEnd, primary, 0.92),
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
    displayName: '默认',
    style: {
      radius: 'round',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#ff6b3d',
      primaryGradient: '#ff6b3d',
      primaryGradientEnd: '#ff9800',
      background: '#fff7f2',
      surface: '#ffece2',
      surfaceHover: '#ffdccc',
      text: '#4a1f12',
      textSecondary: '#8b4a30',
      textMuted: '#c07a5a',
      border: '#ffd7c2',
      borderLight: '#ffbf9e',
      active: '#ff6b3d',
      activeBackground: '#ffffff',
      activeHover: 'rgba(255, 107, 61, 0.12)',
      scrollbarTrack: '#fff1e8',
      scrollbarThumb: '#ffc4a6',
      scrollbarThumbHover: '#ffac7c',
      inputBackground: '#fff8f3',
      inputBorder: '#ffbf9e',
      inputText: '#4a1f12',
      inputFocusBorder: '#ff6b3d',
      buttonPrimary: '#ff6b3d',
      buttonPrimaryHover: '#ff5722',
      buttonText: '#ffffff',
      success: '#10b981',
      successBackground: '#d1fae5',
      error: '#ef4444',
      errorBackground: '#fee2e2',
    },
  },
  bright: {
    name: 'bright',
    displayName: '明亮',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'border',
    },
    colors: {
      primary: '#667eea',
      primaryGradient: '#667eea',
      primaryGradientEnd: '#764ba2',
      background: '#ffffff',
      surface: '#f8f9fa',
      surfaceHover: '#e8ecf0',
      text: '#334155',
      textSecondary: '#64748b',
      textMuted: '#94a3b8',
      border: '#e8ecf0',
      borderLight: '#cbd5e1',
      active: '#667eea',
      activeBackground: '#ffffff',
      activeHover: 'rgba(102, 126, 234, 0.08)',
      scrollbarTrack: '#f8f9fa',
      scrollbarThumb: '#cbd5e1',
      scrollbarThumbHover: '#94a3b8',
      inputBackground: '#ffffff',
      inputBorder: '#cbd5e1',
      inputText: '#334155',
      inputFocusBorder: '#667eea',
      buttonPrimary: '#667eea',
      buttonPrimaryHover: '#5568d3',
      buttonText: '#ffffff',
      success: '#10b981',
      successBackground: '#d1fae5',
      error: '#ef4444',
      errorBackground: '#fee2e2',
    },
  },
  dreamy: {
    name: 'dreamy',
    displayName: '梦幻粉紫',
    style: {
      radius: 'round',
      shadow: 'glow',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
      headerGradient: 'linear-gradient(135deg, #6b21a8 0%, #db2777 100%)',
    },
    colors: {
      primary: '#c084fc',
      primaryGradient: '#f472b6',
      primaryGradientEnd: '#a78bfa',
      background: '#faf5ff',
      surface: '#f3e8ff',
      surfaceHover: '#e9d5ff',
      text: '#581c87',
      textSecondary: '#7c3aed',
      textMuted: '#a78bfa',
      border: '#e9d5ff',
      borderLight: '#ddd6fe',
      active: '#c084fc',
      activeBackground: '#ffffff',
      activeHover: 'rgba(192, 132, 252, 0.15)',
      scrollbarTrack: '#f3e8ff',
      scrollbarThumb: '#ddd6fe',
      scrollbarThumbHover: '#c4b5fd',
      inputBackground: '#fdf8ff',
      inputBorder: '#ddd6fe',
      inputText: '#581c87',
      inputFocusBorder: '#c084fc',
      buttonPrimary: '#c084fc',
      buttonPrimaryHover: '#a78bfa',
      buttonText: '#ffffff',
      success: '#10b981',
      successBackground: '#d1fae5',
      error: '#ef4444',
      errorBackground: '#fee2e2',
    },
  },
  qinglan: {
    name: 'qinglan',
    displayName: '青岚',
    style: {
      radius: 'default',
      shadow: 'subtle',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
    },
    colors: {
      primary: '#4A90E2',
      primaryGradient: '#4A90E2',
      primaryGradientEnd: '#66B2B2',
      background: '#F5F7FA',
      surface: '#EDF2F7',
      surfaceHover: '#E6EBF2',
      text: '#333333',
      textSecondary: '#4B5563',
      textMuted: '#7C8A9A',
      border: '#E0E5EC',
      borderLight: '#E6EBF2',
      active: '#4A90E2',
      activeBackground: '#ffffff',
      activeHover: 'rgba(74, 144, 226, 0.12)',
      scrollbarTrack: '#EDF2F7',
      scrollbarThumb: '#CBD5E1',
      scrollbarThumbHover: '#94A3B8',
      inputBackground: '#ffffff',
      inputBorder: '#E0E5EC',
      inputText: '#333333',
      inputFocusBorder: '#4A90E2',
      buttonPrimary: '#4A90E2',
      buttonPrimaryHover: '#3F7FC9',
      buttonText: '#ffffff',
      success: '#10b981',
      successBackground: '#d1fae5',
      error: '#ef4444',
      errorBackground: '#fee2e2',
    },
  },
  muying: {
    name: 'muying',
    displayName: '暮樱',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
      headerGradient: 'linear-gradient(135deg, #7c3d5e 0%, #c4829e 100%)',
    },
    colors: {
      primary: '#D4A5C5',
      primaryGradient: '#D4A5C5',
      primaryGradientEnd: '#B8C4D1',
      background: '#F8F4F0',
      surface: '#F0ECEC',
      surfaceHover: '#E9E3E6',
      text: '#5A5A5A',
      textSecondary: '#707070',
      textMuted: '#8A8A8A',
      border: '#E5E0E5',
      borderLight: '#EFE7EE',
      active: '#D4A5C5',
      activeBackground: '#ffffff',
      activeHover: 'rgba(212, 165, 197, 0.18)',
      scrollbarTrack: '#F0ECEC',
      scrollbarThumb: '#D9CDD7',
      scrollbarThumbHover: '#C8BBC6',
      inputBackground: '#fdf9fc',
      inputBorder: '#E5E0E5',
      inputText: '#5A5A5A',
      inputFocusBorder: '#D4A5C5',
      buttonPrimary: '#D4A5C5',
      buttonPrimaryHover: '#C895B6',
      buttonText: '#ffffff',
      success: '#10b981',
      successBackground: '#d1fae5',
      error: '#E77B7B',
      errorBackground: 'rgba(231, 123, 123, 0.18)',
    },
  },
  'caramel-latte': {
    name: 'caramel-latte',
    displayName: '焦糖拿铁',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#8B5A2B',
      primaryGradient: '#8B5A2B',
      primaryGradientEnd: '#D2B48C',
      background: '#F9F5F0',
      surface: '#EFE7DD',
      surfaceHover: '#E5D9CB',
      text: '#4A4A4A',
      textSecondary: '#6A5F54',
      textMuted: '#8A7B6C',
      border: '#D9D1C8',
      borderLight: '#E4DBD1',
      active: '#C19A6B',
      activeBackground: '#ffffff',
      activeHover: 'rgba(193, 154, 107, 0.2)',
      scrollbarTrack: '#EFE7DD',
      scrollbarThumb: '#CBBBAA',
      scrollbarThumbHover: '#B8A591',
      inputBackground: '#fdf9f5',
      inputBorder: '#D9D1C8',
      inputText: '#4A4A4A',
      inputFocusBorder: '#C19A6B',
      buttonPrimary: '#8B5A2B',
      buttonPrimaryHover: '#7a4f26',
      buttonText: '#ffffff',
      success: '#10b981',
      successBackground: '#d1fae5',
      error: '#E0775B',
      errorBackground: 'rgba(224, 119, 91, 0.2)',
    },
  },
  songyan: {
    name: 'songyan',
    displayName: '松烟',
    style: {
      radius: 'sharp',
      shadow: 'flat',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
      headerGradient: 'linear-gradient(135deg, #141414 0%, #2e3436 100%)',
    },
    colors: {
      primary: '#2E3436',
      primaryGradient: '#2E3436',
      primaryGradientEnd: '#5D8AA8',
      background: '#F9F7F3',
      surface: '#F0ECE6',
      surfaceHover: '#E8E1D8',
      text: '#3A3A3A',
      textSecondary: '#4E4E4E',
      textMuted: '#6A6A6A',
      border: '#E0DDD5',
      borderLight: '#E8E1D8',
      active: '#5D8AA8',
      activeBackground: '#ffffff',
      activeHover: 'rgba(93, 138, 168, 0.18)',
      scrollbarTrack: '#F0ECE6',
      scrollbarThumb: '#CFC6B8',
      scrollbarThumbHover: '#B8AD9F',
      inputBackground: '#f7f5f1',
      inputBorder: '#E0DDD5',
      inputText: '#3A3A3A',
      inputFocusBorder: '#5D8AA8',
      buttonPrimary: '#2E3436',
      buttonPrimaryHover: '#24282a',
      buttonText: '#ffffff',
      success: '#4F8A6B',
      successBackground: 'rgba(79, 138, 107, 0.18)',
      error: '#C17B47',
      errorBackground: 'rgba(193, 123, 71, 0.2)',
    },
  },
  suyan: {
    name: 'suyan',
    displayName: '素砚',
    style: {
      radius: 'sharp',
      shadow: 'subtle',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
    },
    colors: {
      primary: '#4A5568',
      primaryGradient: '#4A5568',
      primaryGradientEnd: '#718096',
      background: '#FAFBFC',
      surface: '#F2F4F7',
      surfaceHover: '#E8ECF2',
      text: '#2D3748',
      textSecondary: '#4A5568',
      textMuted: '#6B7280',
      border: '#E2E8F0',
      borderLight: '#EDF2F7',
      active: '#3182CE',
      activeBackground: '#ffffff',
      activeHover: 'rgba(49, 130, 206, 0.18)',
      scrollbarTrack: '#F2F4F7',
      scrollbarThumb: '#CBD5E1',
      scrollbarThumbHover: '#A0AEC0',
      inputBackground: '#ffffff',
      inputBorder: '#E2E8F0',
      inputText: '#2D3748',
      inputFocusBorder: '#3182CE',
      buttonPrimary: '#3182CE',
      buttonPrimaryHover: '#2B6CB0',
      buttonText: '#ffffff',
      success: '#38A169',
      successBackground: 'rgba(56, 161, 105, 0.18)',
      error: '#DD6B20',
      errorBackground: 'rgba(221, 107, 32, 0.2)',
    },
  },
  'rock-strata': {
    name: 'rock-strata',
    displayName: '岩层',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'border',
      headerGradient: 'linear-gradient(135deg, #2d1a12 0%, #7D5A50 100%)',
    },
    colors: {
      primary: '#7D5A50',
      primaryGradient: '#7D5A50',
      primaryGradientEnd: '#4A7B6B',
      background: '#F5F0EC',
      surface: '#EFE7E1',
      surfaceHover: '#E5DBD2',
      text: '#4E4E4E',
      textSecondary: '#5E5E5E',
      textMuted: '#7A7A7A',
      border: '#D9D1C7',
      borderLight: '#E3DBD2',
      active: '#D4A373',
      activeBackground: '#ffffff',
      activeHover: 'rgba(212, 163, 115, 0.18)',
      scrollbarTrack: '#EFE7E1',
      scrollbarThumb: '#C8BEB2',
      scrollbarThumbHover: '#B4A99C',
      inputBackground: '#f8f3ef',
      inputBorder: '#D9D1C7',
      inputText: '#4E4E4E',
      inputFocusBorder: '#D4A373',
      buttonPrimary: '#7D5A50',
      buttonPrimaryHover: '#6b4d45',
      buttonText: '#ffffff',
      success: '#4A7B6B',
      successBackground: 'rgba(74, 123, 107, 0.18)',
      error: '#C17B47',
      errorBackground: 'rgba(193, 123, 71, 0.2)',
    },
  },
  'stardust-mist': {
    name: 'stardust-mist',
    displayName: '星尘薄雾',
    style: {
      radius: 'round',
      shadow: 'glow',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
      headerGradient: 'linear-gradient(135deg, #120a2e 0%, #3d1278 100%)',
    },
    colors: {
      primary: '#8A5CF0',
      primaryGradient: '#8A5CF0',
      primaryGradientEnd: '#E0D6F0',
      background: '#FCFBFF',
      surface: '#F4F1FB',
      surfaceHover: '#ECE6F7',
      text: '#5E5E7A',
      textSecondary: '#6B6B86',
      textMuted: '#82829A',
      border: '#E4DDF1',
      borderLight: '#EFE7F8',
      active: '#6BD5E5',
      activeBackground: '#ffffff',
      activeHover: 'rgba(107, 213, 229, 0.18)',
      scrollbarTrack: '#F4F1FB',
      scrollbarThumb: '#CFC3E4',
      scrollbarThumbHover: '#BBAED6',
      inputBackground: '#fdfcff',
      inputBorder: '#E4DDF1',
      inputText: '#5E5E7A',
      inputFocusBorder: '#8A5CF0',
      buttonPrimary: '#8A5CF0',
      buttonPrimaryHover: '#7a4ee0',
      buttonText: '#ffffff',
      success: '#6BD5E5',
      successBackground: 'rgba(107, 213, 229, 0.2)',
      error: '#F5C3D1',
      errorBackground: 'rgba(245, 195, 209, 0.25)',
    },
  },
  dunhuang: {
    name: 'dunhuang',
    displayName: '敦煌飞天',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'border',
      headerGradient: 'linear-gradient(135deg, #2a1600 0%, #8B4513 100%)',
    },
    colors: {
      primary: '#8B4513',
      primaryGradient: '#8B4513',
      primaryGradientEnd: '#5D8AA8',
      background: '#F5EAD6',
      surface: '#EFE1CC',
      surfaceHover: '#E6D6BF',
      text: '#4A3C2E',
      textSecondary: '#6A5846',
      textMuted: '#7D6A55',
      border: '#D9CAB8',
      borderLight: '#E4D7C7',
      active: '#E6B800',
      activeBackground: '#ffffff',
      activeHover: 'rgba(230, 184, 0, 0.2)',
      scrollbarTrack: '#EFE1CC',
      scrollbarThumb: '#CDBBA4',
      scrollbarThumbHover: '#BDA58C',
      inputBackground: '#f8f0e2',
      inputBorder: '#D9CAB8',
      inputText: '#4A3C2E',
      inputFocusBorder: '#E6B800',
      buttonPrimary: '#8B4513',
      buttonPrimaryHover: '#7A3D11',
      buttonText: '#ffffff',
      success: '#5D8AA8',
      successBackground: 'rgba(93, 138, 168, 0.18)',
      error: '#C17B47',
      errorBackground: 'rgba(193, 123, 71, 0.2)',
    },
  },
  'forest-whisper': {
    name: 'forest-whisper',
    displayName: '森语',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'normal',
      inputFocus: 'glow',
      headerGradient: 'linear-gradient(135deg, #0a1e0f 0%, #2d5e3a 100%)',
    },
    colors: {
      primary: '#4A7B5F',
      primaryGradient: '#4A7B5F',
      primaryGradientEnd: '#C9D6B5',
      background: '#F8F9F6',
      surface: '#EEF1EC',
      surfaceHover: '#E5E9E1',
      text: '#2D3A32',
      textSecondary: '#3E4C43',
      textMuted: '#5A6A61',
      border: '#E0E5DD',
      borderLight: '#E8ECE3',
      active: '#C9D6B5',
      activeBackground: '#ffffff',
      activeHover: 'rgba(201, 214, 181, 0.2)',
      scrollbarTrack: '#EEF1EC',
      scrollbarThumb: '#C7D0C5',
      scrollbarThumbHover: '#B2BDB0',
      inputBackground: '#f5f7f3',
      inputBorder: '#E0E5DD',
      inputText: '#2D3A32',
      inputFocusBorder: '#4A7B5F',
      buttonPrimary: '#4A7B5F',
      buttonPrimaryHover: '#3F6B52',
      buttonText: '#ffffff',
      success: '#5D7B6A',
      successBackground: 'rgba(93, 123, 106, 0.18)',
      error: '#7D6B5A',
      errorBackground: 'rgba(125, 107, 90, 0.2)',
    },
  },
  glacier: {
    name: 'glacier',
    displayName: '冰川',
    style: {
      radius: 'sharp',
      shadow: 'subtle',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
      headerGradient: 'linear-gradient(135deg, #0d1e2d 0%, #3A5B72 100%)',
    },
    colors: {
      primary: '#3A5B72',
      primaryGradient: '#3A5B72',
      primaryGradientEnd: '#6A8CA7',
      background: '#E8F0F5',
      surface: '#DEE8EF',
      surfaceHover: '#D3DEE7',
      text: '#2E4254',
      textSecondary: '#425B72',
      textMuted: '#5B7082',
      border: '#C8D6E0',
      borderLight: '#D6E1E8',
      active: '#6A8CA7',
      activeBackground: '#ffffff',
      activeHover: 'rgba(106, 140, 167, 0.18)',
      scrollbarTrack: '#DEE8EF',
      scrollbarThumb: '#B8C7D3',
      scrollbarThumbHover: '#A3B4C2',
      inputBackground: '#edf4f9',
      inputBorder: '#C8D6E0',
      inputText: '#2E4254',
      inputFocusBorder: '#6A8CA7',
      buttonPrimary: '#3A5B72',
      buttonPrimaryHover: '#335066',
      buttonText: '#ffffff',
      success: '#6A8CA7',
      successBackground: 'rgba(106, 140, 167, 0.18)',
      error: '#A96B6B',
      errorBackground: 'rgba(169, 107, 107, 0.18)',
    },
  },
  'ink-lapis': {
    name: 'ink-lapis',
    displayName: '水墨石青',
    style: {
      radius: 'sharp',
      shadow: 'flat',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
      headerGradient: 'linear-gradient(135deg, #141411 0%, #2d3d4d 100%)',
    },
    colors: {
      primary: '#5D8AA8',
      primaryGradient: '#8AA8C8',
      primaryGradientEnd: '#5D8AA8',
      background: '#F9F7F3',
      surface: '#E8E6E0',
      surfaceHover: '#DEDAD3',
      text: '#4A4A4A',
      textSecondary: '#2D2D2D',
      textMuted: '#7A7A7A',
      border: '#D0CCC5',
      borderLight: '#E0DCD5',
      active: '#8AA8C8',
      activeBackground: '#ffffff',
      activeHover: 'rgba(138, 168, 200, 0.18)',
      scrollbarTrack: '#E8E6E0',
      scrollbarThumb: '#C5C1BA',
      scrollbarThumbHover: '#B1ACA4',
      inputBackground: '#f5f3ef',
      inputBorder: '#D0CCC5',
      inputText: '#4A4A4A',
      inputFocusBorder: '#5D8AA8',
      buttonPrimary: '#3A5F7D',
      buttonPrimaryHover: '#2F506A',
      buttonText: '#F9F7F3',
      success: '#5D8AA8',
      successBackground: 'rgba(93, 138, 168, 0.18)',
      error: '#9A6B5B',
      errorBackground: 'rgba(154, 107, 91, 0.2)',
    },
  },
  'jieqi-zhe': {
    name: 'jieqi-zhe',
    displayName: '节气·惊蛰',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
      headerGradient: 'linear-gradient(135deg, #1a0e04 0%, #5a3a1a 100%)',
    },
    colors: {
      primary: '#A67B5B',
      primaryGradient: '#A67B5B',
      primaryGradientEnd: '#6B8E6B',
      background: '#F7F3EC',
      surface: '#EFE9E0',
      surfaceHover: '#E6DED3',
      text: '#3E3E3E',
      textSecondary: '#5A5A5A',
      textMuted: '#7A7A7A',
      border: '#DDD2C5',
      borderLight: '#E7DED3',
      active: '#E8C4B8',
      activeBackground: '#ffffff',
      activeHover: 'rgba(232, 196, 184, 0.2)',
      scrollbarTrack: '#EFE9E0',
      scrollbarThumb: '#CDBFB1',
      scrollbarThumbHover: '#BBAA9B',
      inputBackground: '#f5f0e8',
      inputBorder: '#DDD2C5',
      inputText: '#3E3E3E',
      inputFocusBorder: '#A67B5B',
      buttonPrimary: '#A67B5B',
      buttonPrimaryHover: '#906a4e',
      buttonText: '#ffffff',
      success: '#6B8E6B',
      successBackground: 'rgba(107, 142, 107, 0.18)',
      error: '#C0735C',
      errorBackground: 'rgba(192, 115, 92, 0.2)',
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
      inputFocus: 'border',
      headerGradient: 'linear-gradient(135deg, #1a0500 0%, #9E3A26 100%)',
    },
    colors: {
      primary: '#9E3A26',
      primaryGradient: '#9E3A26',
      primaryGradientEnd: '#C6A961',
      background: '#F0E8DD',
      surface: '#E9DECF',
      surfaceHover: '#E0D2C1',
      text: '#2A2A2A',
      textSecondary: '#4A4A4A',
      textMuted: '#6A6A6A',
      border: '#D8CBBE',
      borderLight: '#E3D8CC',
      active: '#C6A961',
      activeBackground: '#ffffff',
      activeHover: 'rgba(198, 169, 97, 0.2)',
      scrollbarTrack: '#E9DECF',
      scrollbarThumb: '#C6B8A9',
      scrollbarThumbHover: '#B2A393',
      inputBackground: '#ede4d8',
      inputBorder: '#D8CBBE',
      inputText: '#2A2A2A',
      inputFocusBorder: '#9E3A26',
      buttonPrimary: '#9E3A26',
      buttonPrimaryHover: '#8a3221',
      buttonText: '#ffffff',
      success: '#4A6D8C',
      successBackground: 'rgba(74, 109, 140, 0.18)',
      error: '#B85A4A',
      errorBackground: 'rgba(184, 90, 74, 0.2)',
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
      primary: '#8AA8C8',
      primaryGradient: '#8AA8C8',
      primaryGradientEnd: '#B0C4D6',
      background: '#F7F5F1',
      surface: '#EDE8E1',
      surfaceHover: '#E2DBD3',
      text: '#4A4A4A',
      textSecondary: '#5E5E5E',
      textMuted: '#7A7A7A',
      border: '#D9D2C8',
      borderLight: '#E5DED5',
      active: '#8AA8C8',
      activeBackground: '#ffffff',
      activeHover: 'rgba(138, 168, 200, 0.2)',
      scrollbarTrack: '#EDE8E1',
      scrollbarThumb: '#C7BFB4',
      scrollbarThumbHover: '#B3AA9E',
      inputBackground: '#f4f1ec',
      inputBorder: '#D9D2C8',
      inputText: '#4A4A4A',
      inputFocusBorder: '#8AA8C8',
      buttonPrimary: '#8AA8C8',
      buttonPrimaryHover: '#7a96b2',
      buttonText: '#ffffff',
      success: '#6A7D8F',
      successBackground: 'rgba(106, 125, 143, 0.18)',
      error: '#9A6B5B',
      errorBackground: 'rgba(154, 107, 91, 0.2)',
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
      inputFocus: 'border',
      headerGradient: 'linear-gradient(135deg, #1a0a00 0%, #5a3020 100%)',
    },
    colors: {
      primary: '#7D5A50',
      primaryGradient: '#7D5A50',
      primaryGradientEnd: '#B8A9C1',
      background: '#F5EAD6',
      surface: '#EEE0C9',
      surfaceHover: '#E4D4BC',
      text: '#3A3A3A',
      textSecondary: '#4A4A4A',
      textMuted: '#6A6A6A',
      border: '#D6C9B8',
      borderLight: '#E2D6C6',
      active: '#4E7A7D',
      activeBackground: '#ffffff',
      activeHover: 'rgba(78, 122, 125, 0.18)',
      scrollbarTrack: '#EEE0C9',
      scrollbarThumb: '#CBBEA9',
      scrollbarThumbHover: '#B7A88F',
      inputBackground: '#f0e4cc',
      inputBorder: '#D6C9B8',
      inputText: '#3A3A3A',
      inputFocusBorder: '#4E7A7D',
      buttonPrimary: '#7D5A50',
      buttonPrimaryHover: '#6b4d45',
      buttonText: '#ffffff',
      success: '#4E7A7D',
      successBackground: 'rgba(78, 122, 125, 0.18)',
      error: '#A65A4C',
      errorBackground: 'rgba(166, 90, 76, 0.2)',
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
  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });

  const { primary, primaryGradient, primaryGradientEnd, background, surface, surfaceHover, border, borderLight, text, error, success } = themeConfig.colors;
  const onPrimary = getReadableTextColor(primary, '#ffffff', text);
  const { palette: game2048Palette, textPalette: game2048TextPalette } = build2048Palette(themeConfig.colors);

  const derivedVariables: Record<string, string> = {
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
    '--theme-game-2048-accent': primaryGradientEnd,
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

  // 圆角
  const radiusTokens = {
    sharp:   { base: '3px',  sm: '2px', lg: '5px',  pill: '6px'  },
    default: { base: '6px',  sm: '4px', lg: '10px', pill: '20px' },
    round:   { base: '10px', sm: '6px', lg: '14px', pill: '24px' },
  }[radius];
  root.style.setProperty('--app-radius', radiusTokens.base);
  root.style.setProperty('--theme-radius-sm', radiusTokens.sm);
  root.style.setProperty('--theme-radius-lg', radiusTokens.lg);
  root.style.setProperty('--theme-radius-pill', radiusTokens.pill);

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

  // 渐变色 tokens（背景/表面/强调色/边框）
  const accentGradient = `linear-gradient(90deg, ${primaryGradient} 0%, ${primaryGradientEnd} 100%)`;
  const bgShift = mixHexColors(background, surface, 0.75);
  const surfaceShift = mixHexColors(surface, surfaceHover, 0.6);
  root.style.setProperty('--theme-accentGradient', accentGradient);
  root.style.setProperty('--theme-backgroundGradient', `linear-gradient(150deg, ${background} 0%, ${bgShift} 100%)`);
  root.style.setProperty('--theme-surfaceGradient', `linear-gradient(135deg, ${surface} 0%, ${surfaceShift} 100%)`);
  root.style.setProperty('--theme-borderGradient', `linear-gradient(135deg, ${border} 0%, ${borderLight} 100%)`);

  root.removeAttribute('data-theme');
};
