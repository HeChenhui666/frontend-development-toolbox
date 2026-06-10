export type DefaultTab =
  | 'qrcode'
  | 'urlparams'
  | 'timestamp'
  | 'gradient'
  | 'json'
  | 'regex'
  | 'randomimage'
  | 'translator'
  | 'apitester'
  | 'redirector'
  | 'cachemanager'
  | 'webactions'
  | 'mousetrail'
  | 'codec'
  | 'markdown'
  | 'diff'
  | 'fontpreview'
  | 'clipboard'
  | 'asciiart';
export type FeatureTab = DefaultTab; // FeatureTab is now the same as DefaultTab for consistency

const DEFAULT_TAB_KEY = 'app-default-tab';
const TAB_ORDER_KEY = 'app-tab-order';
const ACTIVE_TAB_KEY = 'app-active-tab'; // 当前活动的tab（用于恢复上次使用的tab）

const DEFAULT_TAB_ORDER: FeatureTab[] = [
  'qrcode',
  'urlparams',
  'timestamp',
  'randomimage',
  'json',
  'gradient',
  'regex',
  'translator',
  'apitester',
  'redirector',
  'cachemanager',
  'webactions',
  'mousetrail',
  'codec',
  'markdown',
  'diff',
  'fontpreview',
  'clipboard',
  'asciiart',
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

// 保存当前活动的tab（用于恢复上次使用的tab）
export const saveActiveTab = (tab: FeatureTab): void => {
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
  } catch (error) {
    console.error('Failed to save active tab:', error);
  }
};

// 获取上次使用的活动tab
export const getActiveTab = (): FeatureTab | null => {
  try {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY);
    if (saved && DEFAULT_TAB_ORDER.includes(saved as FeatureTab)) {
      return saved as FeatureTab;
    }
  } catch (error) {
    console.error('Failed to get active tab:', error);
  }
  return null;
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
        return validParsed as FeatureTab[];
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
    localStorage.removeItem(ACTIVE_TAB_KEY);

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

export type CacheType = 'theme' | 'presets' | 'games' | 'preferences' | 'apiTemplates';

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
        localStorage.removeItem(ACTIVE_TAB_KEY);
        break;
      case 'apiTemplates':
        // 清理API模板时，保留所有系统预设模板（id以preset-开头的）
        try {
          const saved = localStorage.getItem('apiTemplates');
          if (saved) {
            const templates = JSON.parse(saved);
            const systemPresets = templates.filter((t: any) => t.id && t.id.startsWith('preset-'));
            if (systemPresets.length > 0) {
              localStorage.setItem('apiTemplates', JSON.stringify(systemPresets));
            } else {
              localStorage.removeItem('apiTemplates');
            }
          }
        } catch (e) {
          localStorage.removeItem('apiTemplates');
        }
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
    preferences: { name: '用户偏好', keys: [DEFAULT_TAB_KEY, TAB_ORDER_KEY, ACTIVE_TAB_KEY], size: 0 },
    apiTemplates: { name: 'API模板', keys: ['apiTemplates'], size: 0 },
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

// 导出所有用户配置
export const exportUserConfig = (): string => {
  const config: Record<string, string | null> = {};
  
  try {
    // 收集所有相关的localStorage项
    const keysToExport = [
      'app-theme',
      'url-preset-params',
      DEFAULT_TAB_KEY,
      TAB_ORDER_KEY,
      ACTIVE_TAB_KEY,
      'game-high-score-tetris',
      'game-high-score-snake',
      'game-high-score-2048',
      'translator-page-translate-enabled', // 翻译功能开关
      'apiTemplates', // API模板
    ];
    
    keysToExport.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        config[key] = value;
      }
    });
    
    // 添加元数据
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      config,
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export user config:', error);
    throw error;
  }
};

// 导入用户配置
export const importUserConfig = (jsonString: string): { success: boolean; message: string } => {
  try {
    const data = JSON.parse(jsonString);
    
    // 验证数据格式
    if (!data.config || typeof data.config !== 'object') {
      return { success: false, message: '配置文件格式无效' };
    }
    
    // 导入配置
    let importedCount = 0;
    const validKeys = [
      'app-theme',
      'url-preset-params',
      DEFAULT_TAB_KEY,
      TAB_ORDER_KEY,
      ACTIVE_TAB_KEY,
      'game-high-score-tetris',
      'game-high-score-snake',
      'game-high-score-2048',
      'translator-page-translate-enabled',
      'apiTemplates', // API模板
    ];
    
    const jsonKeys = [TAB_ORDER_KEY, 'apiTemplates', 'app-theme'];

    Object.entries(data.config).forEach(([key, value]) => {
      // 只导入有效的key
      if (validKeys.includes(key) && value !== null && typeof value === 'string') {
        if (jsonKeys.includes(key)) {
          try { JSON.parse(value as string); } catch { return; }
        }
        try {
          localStorage.setItem(key, value);
          importedCount++;
        } catch (error) {
          console.error(`Failed to import key "${key}":`, error);
        }
      }
    });
    
    if (importedCount === 0) {
      return { success: false, message: '没有有效的配置项可导入' };
    }
    
    return { success: true, message: `成功导入 ${importedCount} 项配置` };
  } catch (error) {
    console.error('Failed to import user config:', error);
    return { success: false, message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}` };
  }
};
