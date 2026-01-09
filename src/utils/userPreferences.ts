export type DefaultTab = 'qrcode' | 'urlparams' | 'timestamp' | 'gradient' | 'json' | 'regex' | 'randomimage' | 'css';
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
  'css',
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
        // 检查是否有新的标签页需要添加（即使当前顺序看起来完整）
        const missingTabs = DEFAULT_TAB_ORDER.filter(tab => !validParsed.includes(tab));
        if (missingTabs.length > 0) {
          // 如果有缺失的标签页，补充到末尾并保存
          const newOrder = [...validParsed, ...missingTabs] as FeatureTab[];
          saveTabOrder(newOrder);
          return newOrder;
        }
        // 如果顺序完整且包含所有默认标签页，直接返回
        if (validParsed.length === DEFAULT_TAB_ORDER.length) {
          return validParsed as FeatureTab[];
        }
        // 如果顺序不完整，补充缺失的标签页
        const missing = DEFAULT_TAB_ORDER.filter(tab => !validParsed.includes(tab));
        return [...validParsed, ...missing] as FeatureTab[];
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

export type CacheType = 'theme' | 'presets' | 'games' | 'preferences';

export const clearCacheByType = (type: CacheType): void => {
  try {
    switch (type) {
      case 'theme':
        localStorage.removeItem('app-theme');
        break;
      case 'presets':
        localStorage.removeItem('url-preset-params');
        break;
      case 'games':
        const gameIds = ['tetris', 'snake', '2048'];
        gameIds.forEach((gameId) => {
          localStorage.removeItem(`game-high-score-${gameId}`);
        });
        break;
      case 'preferences':
        localStorage.removeItem(DEFAULT_TAB_KEY);
        localStorage.removeItem(TAB_ORDER_KEY);
        break;
    }
    console.log(`Cache type "${type}" cleared successfully`);
  } catch (error) {
    console.error(`Failed to clear cache type "${type}":`, error);
    throw error;
  }
};

export const getCacheTypeInfo = (): Record<CacheType, { name: string; keys: string[]; size: number }> => {
  const info: Record<CacheType, { name: string; keys: string[]; size: number }> = {
    theme: { name: '主题设置', keys: ['app-theme'], size: 0 },
    presets: { name: 'URL预设参数', keys: ['url-preset-params'], size: 0 },
    games: { name: '游戏积分', keys: ['game-high-score-tetris', 'game-high-score-snake', 'game-high-score-2048'], size: 0 },
    preferences: { name: '用户偏好', keys: [DEFAULT_TAB_KEY, TAB_ORDER_KEY], size: 0 },
  };

  try {
    Object.keys(info).forEach((type) => {
      const cacheType = type as CacheType;
      const keys = info[cacheType].keys;
      let totalSize = 0;
      
      keys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      });
      
      info[cacheType].size = totalSize;
    });
  } catch (error) {
    console.error('Failed to get cache type info:', error);
  }

  return info;
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

