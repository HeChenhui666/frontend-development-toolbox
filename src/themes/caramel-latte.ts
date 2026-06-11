import type { Theme } from '../utils/theme';

const caramelLatteTheme: Theme = {
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
      background: '#FEFCF8',
      surface: '#F8F3EB',
      surfaceHover: '#F0E8DA',
      text: '#362110',
      textSecondary: '#6B4D35',
      textMuted: '#A69280',
      border: '#E6DAC8',
      borderLight: '#F0E8DA',
      active: '#B45309',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(180, 83, 9, 0.08)',
      scrollbarTrack: '#F8F3EB',
      scrollbarThumb: '#D9CBBA',
      scrollbarThumbHover: '#B45309',
      inputBackground: '#FFFFFF',
      inputBorder: '#DDD0BF',
      inputText: '#362110',
      inputFocusBorder: '#B45309',
      buttonPrimary: '#B45309',
      buttonPrimaryHover: '#92400E',
      buttonText: '#FFFFFF',
      success: '#059669',
      successBackground: '#ECFDF5',
      error: '#DC2626',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #B45309 0%, #D97706 100%)',
        subtle: 'linear-gradient(135deg, rgba(180, 83, 9, 0.06) 0%, rgba(217, 119, 6, 0.03) 100%)',
        surface: 'linear-gradient(135deg, #F8F3EB 0%, #FDFAF5 100%)',
        text: 'linear-gradient(to right, #92400E, #B45309)',
        border: 'linear-gradient(135deg, #B45309, #D97706)',
      }
    },
  };

export default caramelLatteTheme;
