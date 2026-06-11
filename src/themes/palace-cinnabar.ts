import type { Theme } from '../utils/theme';

const palaceCinnabarTheme: Theme = {
    name: 'palace-cinnabar',
    displayName: '宫墙·朱砂',
    style: {
      radius: 'sharp',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#B91C1C',
      secondary: '#F59E0B',
      accent: '#DC2626',
      background: '#FEFAFA',
      surface: '#F7EFEF',
      surfaceHover: '#EFE3E3',
      text: '#2E1414',
      textSecondary: '#6B3A3A',
      textMuted: '#A68888',
      border: '#E4D4D4',
      borderLight: '#F0E6E6',
      active: '#B91C1C',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(185, 28, 28, 0.08)',
      scrollbarTrack: '#F7EFEF',
      scrollbarThumb: '#D6C2C2',
      scrollbarThumbHover: '#B91C1C',
      inputBackground: '#FFFFFF',
      inputBorder: '#DDD0D0',
      inputText: '#2E1414',
      inputFocusBorder: '#F59E0B',
      buttonPrimary: '#B91C1C',
      buttonPrimaryHover: '#991B1B',
      buttonText: '#FFFFFF',
      success: '#047857',
      successBackground: '#ECFDF5',
      error: '#991B1B',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #991B1B 0%, #B91C1C 50%, #F59E0B 100%)',
        subtle: 'linear-gradient(135deg, rgba(185, 28, 28, 0.06) 0%, rgba(245, 158, 11, 0.03) 100%)',
        surface: 'linear-gradient(160deg, #F7EFEF 0%, #FBF7F0 100%)',
        text: 'linear-gradient(to right, #991B1B, #B91C1C)',
        border: 'linear-gradient(135deg, #B91C1C, #F59E0B)',
      }
    },
  };

export default palaceCinnabarTheme;
