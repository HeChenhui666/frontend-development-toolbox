import type { Theme } from '../utils/theme';

const hanBrocadeTheme: Theme = {
    name: 'han-brocade',
    displayName: '汉锦·藻井',
    style: {
      radius: 'default',
      shadow: 'medium',
      tabIndicator: 'underline',
      transition: 'normal',
      inputFocus: 'glow',
    },
    colors: {
      primary: '#7E22CE',
      secondary: '#BE185D',
      accent: '#F59E0B',
      background: '#FDFBFE',
      surface: '#F5F0FA',
      surfaceHover: '#ECE4F4',
      text: '#261340',
      textSecondary: '#53406A',
      textMuted: '#968AAD',
      border: '#E0D6EB',
      borderLight: '#EDE8F3',
      active: '#7E22CE',
      activeBackground: '#FFFFFF',
      activeHover: 'rgba(126, 34, 206, 0.08)',
      scrollbarTrack: '#F5F0FA',
      scrollbarThumb: '#D0C4DE',
      scrollbarThumbHover: '#7E22CE',
      inputBackground: '#FFFFFF',
      inputBorder: '#D9CEE8',
      inputText: '#261340',
      inputFocusBorder: '#7E22CE',
      buttonPrimary: '#7E22CE',
      buttonPrimaryHover: '#6B21A8',
      buttonText: '#FFFFFF',
      success: '#059669',
      successBackground: '#ECFDF5',
      error: '#BE123C',
      errorBackground: '#FFF1F2',
      gradients: {
        main: 'linear-gradient(135deg, #581C87 0%, #7E22CE 50%, #BE185D 100%)',
        subtle: 'linear-gradient(135deg, rgba(126, 34, 206, 0.06) 0%, rgba(190, 24, 93, 0.03) 100%)',
        surface: 'linear-gradient(160deg, #F5F0FA 0%, #FBF6FC 100%)',
        text: 'linear-gradient(to right, #6B21A8, #BE185D)',
        border: 'linear-gradient(135deg, #7E22CE, #BE185D)',
      }
    },
  };

export default hanBrocadeTheme;
