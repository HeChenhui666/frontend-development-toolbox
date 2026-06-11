import type { Theme } from '../utils/theme';

const forestWhisperTheme: Theme = {
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
      background: '#F9FDF9',
      surface: '#F0F6F0',
      surfaceHover: '#E3EDE3',
      text: '#1A3322',
      textSecondary: '#3D5E45',
      textMuted: '#8CA494',
      border: '#D4E2D6',
      borderLight: '#E6EFE7',
      active: '#15803D',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(21, 128, 61, 0.08)',
      scrollbarTrack: '#F0F6F0',
      scrollbarThumb: '#C2D5C6',
      scrollbarThumbHover: '#15803D',
      inputBackground: '#FFFFFF',
      inputBorder: '#CCDDCF',
      inputText: '#1A3322',
      inputFocusBorder: '#15803D',
      buttonPrimary: '#15803D',
      buttonPrimaryHover: '#166534',
      buttonText: '#FFFFFF',
      success: '#15803D',
      successBackground: '#ECFDF5',
      error: '#991B1B',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #14532D 0%, #15803D 100%)',
        subtle: 'linear-gradient(135deg, rgba(21, 128, 61, 0.06) 0%, rgba(22, 163, 74, 0.03) 100%)',
        surface: 'linear-gradient(135deg, #F0F6F0 0%, #F8FCF8 100%)',
        text: 'linear-gradient(to right, #166534, #15803D)',
        border: 'linear-gradient(135deg, #15803D, #16A34A)',
      }
    },
  };

export default forestWhisperTheme;
