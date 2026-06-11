import type { Theme } from '../utils/theme';

const dreamyTheme: Theme = {
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
      secondary: '#EC4899',
      accent: '#F472B6',
      background: '#FDFCFE',
      surface: '#F6F2FB',
      surfaceHover: '#EEE8F6',
      text: '#2D1B4E',
      textSecondary: '#5B4A72',
      textMuted: '#9B8FB0',
      border: '#E4DDF0',
      borderLight: '#F0ECF6',
      active: '#8B5CF6',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(139, 92, 246, 0.1)',
      scrollbarTrack: '#F6F2FB',
      scrollbarThumb: '#D4CBE5',
      scrollbarThumbHover: '#8B5CF6',
      inputBackground: '#FFFFFF',
      inputBorder: '#DDD6EE',
      inputText: '#2D1B4E',
      inputFocusBorder: '#8B5CF6',
      buttonPrimary: '#8B5CF6',
      buttonPrimaryHover: '#7C3AED',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#F43F5E',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
        subtle: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.04) 100%)',
        surface: 'linear-gradient(160deg, #F6F2FB 0%, #FBF5FC 100%)',
        text: 'linear-gradient(to right, #8B5CF6, #EC4899)',
        border: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      }
    },
  };

export default dreamyTheme;
