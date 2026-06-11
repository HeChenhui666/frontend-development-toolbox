import type { Theme } from '../utils/theme';

const qinglanTheme: Theme = {
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
      secondary: '#14B8A6',
      accent: '#6366F1',
      background: '#F8FCFE',
      surface: '#EFF7FB',
      surfaceHover: '#E2F0F7',
      text: '#0F3B54',
      textSecondary: '#3D6B82',
      textMuted: '#8FAAB8',
      border: '#D5E5EE',
      borderLight: '#E8F1F6',
      active: '#0EA5E9',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(14, 165, 233, 0.1)',
      scrollbarTrack: '#EFF7FB',
      scrollbarThumb: '#C3D9E5',
      scrollbarThumbHover: '#0EA5E9',
      inputBackground: '#FFFFFF',
      inputBorder: '#D0E3ED',
      inputText: '#0F3B54',
      inputFocusBorder: '#0EA5E9',
      buttonPrimary: '#0EA5E9',
      buttonPrimaryHover: '#0284C7',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#EF4444',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #0EA5E9 0%, #14B8A6 100%)',
        subtle: 'linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(20, 184, 166, 0.03) 100%)',
        surface: 'linear-gradient(160deg, #EFF7FB 0%, #F2FAF8 100%)',
        text: 'linear-gradient(to right, #0284C7, #0D9488)',
        border: 'linear-gradient(135deg, #0EA5E9, #14B8A6)',
      }
    },
  };

export default qinglanTheme;
