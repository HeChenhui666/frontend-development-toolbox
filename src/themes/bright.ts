import type { Theme } from '../utils/theme';

const brightTheme: Theme = {
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
  };

export default brightTheme;
