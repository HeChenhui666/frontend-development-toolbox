import type { Theme } from '../utils/theme';

const jieqiZheTheme: Theme = {
    name: 'jieqi-zhe',
    displayName: '惊蛰·春雷',
    style: {
      radius: 'round',
      shadow: 'subtle',
      tabIndicator: 'pill',
      transition: 'smooth',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#65A30D',
      secondary: '#84CC16',
      accent: '#A3E635',
      background: '#FAFDF5',
      surface: '#F2F6EA',
      surfaceHover: '#E6EDDA',
      text: '#263A14',
      textSecondary: '#4A5E38',
      textMuted: '#8D9E7C',
      border: '#D6E0C8',
      borderLight: '#E8EFDD',
      active: '#65A30D',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(101, 163, 13, 0.08)',
      scrollbarTrack: '#F2F6EA',
      scrollbarThumb: '#C5D3B2',
      scrollbarThumbHover: '#65A30D',
      inputBackground: '#FFFFFF',
      inputBorder: '#CDD9BC',
      inputText: '#263A14',
      inputFocusBorder: '#65A30D',
      buttonPrimary: '#65A30D',
      buttonPrimaryHover: '#4D7C0F',
      buttonText: '#FFFFFF',
      success: '#65A30D',
      successBackground: '#ECFDF5',
      error: '#B91C1C',
      errorBackground: '#FEF2F2',
      gradients: {
        main: 'linear-gradient(135deg, #4D7C0F 0%, #65A30D 100%)',
        subtle: 'linear-gradient(135deg, rgba(101, 163, 13, 0.06) 0%, rgba(132, 204, 22, 0.03) 100%)',
        surface: 'linear-gradient(160deg, #F2F6EA 0%, #F9FCF5 100%)',
        text: 'linear-gradient(to right, #4D7C0F, #65A30D)',
        border: 'linear-gradient(135deg, #65A30D, #84CC16)',
      }
    },
  };

export default jieqiZheTheme;
