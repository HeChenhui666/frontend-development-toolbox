import type { Theme } from '../utils/theme';

const rockStrataTheme: Theme = {
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
      background: '#FEFBF8',
      surface: '#F7F0EA',
      surfaceHover: '#EFE4DA',
      text: '#33200F',
      textSecondary: '#6B4A34',
      textMuted: '#A68F7D',
      border: '#E4D6C8',
      borderLight: '#F0E6DC',
      active: '#C2410C',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(194, 65, 12, 0.08)',
      scrollbarTrack: '#F7F0EA',
      scrollbarThumb: '#D6C5B5',
      scrollbarThumbHover: '#C2410C',
      inputBackground: '#FFFFFF',
      inputBorder: '#DDD0C2',
      inputText: '#33200F',
      inputFocusBorder: '#C2410C',
      buttonPrimary: '#C2410C',
      buttonPrimaryHover: '#9A3412',
      buttonText: '#FFFFFF',
      success: '#3F6212',
      successBackground: '#F7FEE7',
      error: '#9F1239',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #9A3412 0%, #C2410C 100%)',
        subtle: 'linear-gradient(135deg, rgba(154, 52, 18, 0.06) 0%, rgba(194, 65, 12, 0.03) 100%)',
        surface: 'linear-gradient(135deg, #F7F0EA 0%, #FDF9F5 100%)',
        text: 'linear-gradient(to right, #7C2D12, #C2410C)',
        border: 'linear-gradient(135deg, #9A3412, #C2410C)',
      }
    },
  };

export default rockStrataTheme;
