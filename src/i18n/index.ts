import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

/** 支持的语言列表 */
export const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en-US', label: 'English' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const LANGUAGE_STORAGE_KEY = 'app-language';

/** 获取用户保存的语言偏好，回退到浏览器语言，最终回退到中文 */
function getInitialLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(lang => lang.code === saved)) {
      return saved as LanguageCode;
    }
  } catch {
    // ignore
  }
  const browserLang = navigator.language;
  if (browserLang.startsWith('en')) return 'en-US';
  return 'zh-CN';
}

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
});

/** 切换语言并持久化 */
export function changeLanguage(languageCode: LanguageCode): void {
  i18n.changeLanguage(languageCode);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch {
    // ignore
  }
}

export default i18n;
