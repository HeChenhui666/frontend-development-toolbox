import type { Theme } from '../utils/theme';

const muyingTheme: Theme = {
    name: 'muying',
    displayName: '暮樱·晚樱粉',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#DB2777',
      secondary: '#F472B6',
      accent: '#FB7185',
      background: '#FEFBFC',
      surface: '#F9F0F4',
      surfaceHover: '#F3E4EC',
      text: '#3D1A2A',
      textSecondary: '#6B3D52',
      textMuted: '#A88A98',
      border: '#EBDCE3',
      borderLight: '#F4ECF0',
      active: '#DB2777',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(219, 39, 119, 0.08)',
      scrollbarTrack: '#F9F0F4',
      scrollbarThumb: '#DFC8D4',
      scrollbarThumbHover: '#DB2777',
      inputBackground: '#FFFFFF',
      inputBorder: '#E5D5DD',
      inputText: '#3D1A2A',
      inputFocusBorder: '#DB2777',
      buttonPrimary: '#DB2777',
      buttonPrimaryHover: '#BE185D',
      buttonText: '#FFFFFF',
      success: '#10B981',
      successBackground: '#ECFDF5',
      error: '#E11D48',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #DB2777 0%, #F472B6 100%)',
        subtle: 'linear-gradient(135deg, rgba(219, 39, 119, 0.06) 0%, rgba(244, 114, 182, 0.03) 100%)',
        surface: 'linear-gradient(135deg, #F9F0F4 0%, #FDF8FA 100%)',
        text: 'linear-gradient(to right, #BE185D, #DB2777)',
        border: 'linear-gradient(135deg, #DB2777, #F472B6)',
      }
    },
  };

export default muyingTheme;
