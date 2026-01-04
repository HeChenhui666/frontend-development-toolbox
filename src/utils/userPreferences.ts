export type DefaultTab = 'qrcode' | 'urlparams' | 'timestamp' | 'gradient' | 'json' | 'regex' | 'randomimage';
export type FeatureTab = DefaultTab; // FeatureTab is now the same as DefaultTab for consistency

const DEFAULT_TAB_KEY = 'app-default-tab';
const TAB_ORDER_KEY = 'app-tab-order';

const DEFAULT_TAB_ORDER: FeatureTab[] = [
  'qrcode',
  'urlparams',
  'timestamp',
  'randomimage',
  'json',
  'gradient',
  'regex',
];

export const getDefaultTab = (): DefaultTab => {
  try {
    const saved = localStorage.getItem(DEFAULT_TAB_KEY);
    if (saved && DEFAULT_TAB_ORDER.includes(saved as FeatureTab)) {
      return saved as DefaultTab;
    }
  } catch (error) {
    console.error('Failed to get default tab:', error);
  }
  return 'qrcode';
};

export const saveDefaultTab = (tab: DefaultTab): void => {
  try {
    localStorage.setItem(DEFAULT_TAB_KEY, tab);
  } catch (error) {
    console.error('Failed to save default tab:', error);
  }
};

export const getTabOrder = (): FeatureTab[] => {
  try {
    const saved = localStorage.getItem(TAB_ORDER_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 验证所有项都是有效的标签页
        const validParsed = parsed.filter((item: any) => DEFAULT_TAB_ORDER.includes(item));
        if (validParsed.length === DEFAULT_TAB_ORDER.length) {
          // 如果解析出的顺序包含了所有默认标签页，直接返回
          return validParsed as FeatureTab[];
        }
        // 如果有缺失的标签页，补充到末尾
        const missingTabs = DEFAULT_TAB_ORDER.filter(tab => !validParsed.includes(tab));
        return [...validParsed, ...missingTabs] as FeatureTab[];
      }
    }
  } catch (error) {
    console.error('Failed to get tab order:', error);
  }
  return DEFAULT_TAB_ORDER;
};

export const saveTabOrder = (order: FeatureTab[]): void => {
  try {
    localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(order));
  } catch (error) {
    console.error('Failed to save tab order:', error);
  }
};

export const resetTabOrder = (): void => {
  try {
    localStorage.removeItem(TAB_ORDER_KEY);
  } catch (error) {
    console.error('Failed to reset tab order:', error);
  }
};

export const clearAllCache = (): void => {
  try {
    localStorage.removeItem('app-theme');
    localStorage.removeItem('url-preset-params');
    localStorage.removeItem(DEFAULT_TAB_KEY);
    localStorage.removeItem(TAB_ORDER_KEY);

    const gameIds = ['tetris', 'snake', '2048'];
    gameIds.forEach((gameId) => {
      localStorage.removeItem(`game-high-score-${gameId}`);
    });

    console.log('All cache cleared successfully');
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
};

export const getStorageInfo = (): { used: number; total: number; items: Array<{ key: string; size: number }> } => {
  const items: Array<{ key: string; size: number }> = [];
  let totalSize = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('app-') || key.startsWith('game-') || key.startsWith('url-'))) {
        const value = localStorage.getItem(key);
        if (value) {
          const size = new Blob([value]).size;
          items.push({ key, size });
          totalSize += size;
        }
      }
    }
  } catch (error) {
    console.error('Failed to get storage info:', error);
  }

  const estimatedTotal = 5 * 1024 * 1024; // 5MB

  return {
    used: totalSize,
    total: estimatedTotal,
    items: items.sort((a, b) => b.size - a.size),
  };
};

