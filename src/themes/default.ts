import type { Theme } from '../utils/theme';

const defaultTheme: Theme = {
    name: 'default',
    displayName: '默认·暖橙',
    style: {
      radius: 'round',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#FF7F50',
      secondary: '#FFA500', // Orange for accents/borders
      accent: '#FF6B6B',
      background: '#FFFBF8',
      surface: '#FFF5F0',
      surfaceHover: '#FFE8DE',
      text: '#2D2420',
      textSecondary: '#6B564C',
      textMuted: '#A8948C',
      border: '#F0DCCF',
      borderLight: '#F7ECE4',
      // 关键优化：使用辅助色作为边框和光晕，增加层次
      active: '#FF7F50',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(255, 165, 0, 0.2)', // Use secondary for hover tint
      scrollbarTrack: '#FFF5F0',
      scrollbarThumb: '#E0C4B8',
      scrollbarThumbHover: '#FFA500', // Thumb hover becomes secondary color
      inputBackground: '#FFFFFF',
      inputBorder: '#E0D0C5',
      inputText: '#2D2420',
      inputFocusBorder: '#FFA500', // Focus border uses secondary
      buttonPrimary: '#FF7F50',
      buttonPrimaryHover: '#E56A3D',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#EF4444',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #FF7F50 0%, #FFA500 100%)',
        subtle: 'linear-gradient(135deg, rgba(255, 127, 80, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)',
        surface: 'linear-gradient(160deg, #FFF5F0 0%, #FFFBEB 100%)',
        text: 'linear-gradient(to right, #FF7F50, #FF4500)',
        border: 'linear-gradient(135deg, #FF7F50, #FFA500)',
      }
    },
  };

export default defaultTheme;
