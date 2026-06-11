import type { Theme } from '../utils/theme';

const songyanTheme: Theme = {
    name: 'songyan',
    displayName: '松烟·墨色',
    style: {
      radius: 'sharp',
      shadow: 'flat',
      tabIndicator: 'underline',
      transition: 'snappy',
      inputFocus: 'border',
    },
    colors: {
      primary: '#292524',
      secondary: '#57534E',
      accent: '#78716C',
      background: '#FAFAF9',
      surface: '#F5F5F4',
      surfaceHover: '#E7E5E4',
      text: '#1C1917',
      textSecondary: '#44403C',
      textMuted: '#A8A29E',
      border: '#D6D3D1',
      borderLight: '#E7E5E4',
      active: '#292524',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(87, 83, 78, 0.1)',
      scrollbarTrack: '#F5F5F4',
      scrollbarThumb: '#D6D3D1',
      scrollbarThumbHover: '#57534E',
      inputBackground: '#FFFFFF',
      inputBorder: '#D6D3D1',
      inputText: '#1C1917',
      inputFocusBorder: '#57534E',
      buttonPrimary: '#292524',
      buttonPrimaryHover: '#1C1917',
      buttonText: '#FFFFFF',
      success: '#3F6212',
      successBackground: '#F7FEE7',
      error: '#991B1B',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #292524 0%, #57534E 100%)',
        subtle: 'linear-gradient(135deg, rgba(41, 37, 36, 0.08) 0%, rgba(87, 83, 78, 0.04) 100%)',
        surface: 'linear-gradient(180deg, #F5F5F4 0%, #FAFAF9 100%)',
        text: 'linear-gradient(to right, #1C1917, #44403C)',
        border: 'linear-gradient(135deg, #292524, #57534E)',
      }
    },
  };

export default songyanTheme;
