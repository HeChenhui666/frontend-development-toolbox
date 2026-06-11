import type { Theme } from '../utils/theme';

const ruPorcelainTheme: Theme = {
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
  };

export default ruPorcelainTheme;
