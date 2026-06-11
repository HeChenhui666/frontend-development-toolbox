/**
 * 主题系统相关类型定义
 */

/** 所有可用主题名称 */
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
  | 'custom';

/** 主题颜色样式 */
export interface ThemeStyle {
  primary: string;
  secondary: string;
  accent: string;
  primaryGradient: string;
  primaryGradientEnd: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  active: string;
  activeBackground: string;
  activeHover: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputFocusBorder: string;
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonText: string;
  success: string;
  successBackground: string;
  error: string;
  errorBackground: string;
}

/** 主题渐变系统 */
export interface ThemeGradients {
  main: string;
  subtle: string;
  text: string;
  header: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
}

/** 主题完整定义 */
export interface Theme {
  name: ThemeName;
  label: string;
  style: ThemeStyle;
  gradients?: ThemeGradients;
}
