import type { Theme } from '../utils/theme';
import type { ThemeName } from '../utils/theme';
import { generateCustomTheme, getCustomPrimaryColor } from '../utils/themeGenerator';
import defaultTheme from './default';
import brightTheme from './bright';
import dreamyTheme from './dreamy';
import qinglanTheme from './qinglan';
import muyingTheme from './muying';
import caramelLatteTheme from './caramel-latte';
import songyanTheme from './songyan';
import rockStrataTheme from './rock-strata';
import forestWhisperTheme from './forest-whisper';
import jieqiZheTheme from './jieqi-zhe';
import palaceCinnabarTheme from './palace-cinnabar';
import ruPorcelainTheme from './ru-porcelain';
import hanBrocadeTheme from './han-brocade';

/**
 * 所有可用主题的集合（custom 主题基于用户保存的 primary 色动态生成）
 */
export const themes: Record<ThemeName, Theme> = {
  custom: generateCustomTheme(getCustomPrimaryColor()),
  default: defaultTheme,
  bright: brightTheme,
  dreamy: dreamyTheme,
  qinglan: qinglanTheme,
  muying: muyingTheme,
  'caramel-latte': caramelLatteTheme,
  songyan: songyanTheme,
  'rock-strata': rockStrataTheme,
  'forest-whisper': forestWhisperTheme,
  'jieqi-zhe': jieqiZheTheme,
  'palace-cinnabar': palaceCinnabarTheme,
  'ru-porcelain': ruPorcelainTheme,
  'han-brocade': hanBrocadeTheme,
};

/** 更新 custom 主题的 primary 色并刷新 themes 集合 */
export const refreshCustomTheme = (primaryColor: string): void => {
  themes.custom = generateCustomTheme(primaryColor);
};
