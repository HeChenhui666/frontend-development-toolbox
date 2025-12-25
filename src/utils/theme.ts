// 主题配置
export type ThemeName = 'default' | 'red-orange' | 'cyber' | 'blue-purple' | 'dreamy-pink-purple' | 'rainbow-cloud';

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    // 主色调
    primary: string;
    primaryGradient: string; // 渐变起始色
    primaryGradientEnd: string; // 渐变结束色
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

export const themes: Record<ThemeName, Theme> = {
  default: {
    name: 'default',
    displayName: '默认',
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
  'red-orange': {
    name: 'red-orange',
    displayName: '红橙暖色',
    colors: {
      primary: '#ff6b6b',
      primaryGradient: '#ff6b6b',
      primaryGradientEnd: '#ffa500',
      background: '#ffffff',
      surface: '#fff5f5',
      surfaceHover: '#ffe0e0',
      text: '#2d1b1b',
      textSecondary: '#8b5a5a',
      textMuted: '#c4a0a0',
      border: '#ffe0e0',
      borderLight: '#ffb3b3',
      active: '#ff6b6b',
      activeBackground: '#ffffff',
      activeHover: 'rgba(255, 107, 107, 0.1)',
      scrollbarTrack: '#fff5f5',
      scrollbarThumb: '#ffb3b3',
      scrollbarThumbHover: '#ff8c8c',
      inputBackground: '#ffffff',
      inputBorder: '#ffb3b3',
      inputText: '#2d1b1b',
      inputFocusBorder: '#ff6b6b',
      buttonPrimary: '#ff6b6b',
      buttonPrimaryHover: '#ff5252',
      buttonText: '#ffffff',
      success: '#10b981',
      successBackground: '#d1fae5',
      error: '#ef4444',
      errorBackground: '#fee2e2',
    },
  },
  cyber: {
    name: 'cyber',
    displayName: '荧光赛博',
    colors: {
      primary: '#00ff88',
      primaryGradient: '#00ff88',
      primaryGradientEnd: '#00d4ff',
      background: '#0a0e27',
      surface: '#151932',
      surfaceHover: '#1e2442',
      text: '#e0ffe7',
      textSecondary: '#00d4ff',
      textMuted: '#4a90a4',
      border: '#1e2442',
      borderLight: '#2a3452',
      active: '#00ff88',
      activeBackground: '#151932',
      activeHover: 'rgba(0, 255, 136, 0.15)',
      scrollbarTrack: '#151932',
      scrollbarThumb: '#2a3452',
      scrollbarThumbHover: '#3a4462',
      inputBackground: '#1e293b',
      inputBorder: '#2a3452',
      inputText: '#e0ffe7',
      inputFocusBorder: '#00ff88',
      buttonPrimary: '#00ff88',
      buttonPrimaryHover: '#00e677',
      buttonText: '#0a0e27',
      success: '#00ff88',
      successBackground: 'rgba(0, 255, 136, 0.2)',
      error: '#ff4444',
      errorBackground: 'rgba(255, 68, 68, 0.2)',
    },
  },
  'blue-purple': {
    name: 'blue-purple',
    displayName: '未来科幻',
    colors: {
      primary: '#00d9ff',
      primaryGradient: '#00d9ff',
      primaryGradientEnd: '#a855f7',
      background: '#0a0a1a',
      surface: '#1a1a2e',
      surfaceHover: '#2a2a3e',
      text: '#e0f2fe',
      textSecondary: '#7dd3fc',
      textMuted: '#38bdf8',
      border: '#2a2a3e',
      borderLight: '#3a3a4e',
      active: '#00d9ff',
      activeBackground: '#1a1a2e',
      activeHover: 'rgba(0, 217, 255, 0.2)',
      scrollbarTrack: '#1a1a2e',
      scrollbarThumb: '#3a3a4e',
      scrollbarThumbHover: '#4a4a5e',
      inputBackground: '#1a1a2e',
      inputBorder: '#3a3a4e',
      inputText: '#e0f2fe',
      inputFocusBorder: '#00d9ff',
      buttonPrimary: '#00d9ff',
      buttonPrimaryHover: '#00b8d9',
      buttonText: '#0a0a1a',
      success: '#00ff88',
      successBackground: 'rgba(0, 255, 136, 0.2)',
      error: '#ff4444',
      errorBackground: 'rgba(255, 68, 68, 0.2)',
    },
  },
  'dreamy-pink-purple': {
    name: 'dreamy-pink-purple',
    displayName: '梦幻粉紫',
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
      inputBackground: '#ffffff',
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
  'rainbow-cloud': {
    name: 'rainbow-cloud',
    displayName: '云端彩虹',
    colors: {
      primary: '#a855f7',
      primaryGradient: '#ff6b6b',
      primaryGradientEnd: '#9c27b0',
      background: '#ffffff',
      surface: '#fff5f8',
      surfaceHover: '#ffeef5',
      text: '#1a0a2e',
      textSecondary: '#6b4a7a',
      textMuted: '#9b7aab',
      border: '#ffe0f0',
      borderLight: '#ffd0e8',
      active: '#a855f7',
      activeBackground: '#ffffff',
      activeHover: 'rgba(168, 85, 247, 0.15)',
      scrollbarTrack: '#fff5f8',
      scrollbarThumb: '#ffd0e8',
      scrollbarThumbHover: '#ffc0e0',
      inputBackground: '#ffffff',
      inputBorder: '#ffd0e8',
      inputText: '#1a0a2e',
      inputFocusBorder: '#a855f7',
      buttonPrimary: '#a855f7',
      buttonPrimaryHover: '#9333ea',
      buttonText: '#ffffff',
      success: '#10b981',
      successBackground: '#d1fae5',
      error: '#ef4444',
      errorBackground: '#fee2e2',
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

  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value);
  });

  // 为云端彩虹主题设置特殊的彩虹渐变
  if (theme === 'rainbow-cloud') {
    root.style.setProperty(
      '--theme-header-gradient',
      'linear-gradient(135deg, #ff6b6b 0%, #ff8c00 16.66%, #ffd700 33.33%, #4caf50 50%, #00bcd4 66.66%, #2196f3 83.33%, #9c27b0 100%)'
    );
    root.setAttribute('data-theme', 'rainbow-cloud');
  } else {
    root.removeAttribute('data-theme');
    root.style.removeProperty('--theme-header-gradient');
  }
};

