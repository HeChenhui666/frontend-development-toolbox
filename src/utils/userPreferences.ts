export type { DefaultTab, FeatureTab, CacheType } from '../types/feature';
import type { DefaultTab, FeatureTab, CacheType } from '../types/feature';

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
        const validParsed = parsed.filter((item: unknown) => typeof item === 'string' && DEFAULT_TAB_ORDER.includes(item as FeatureTab));
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
            const systemPresets = (templates as Array<{ id?: string }>).filter((t) => t.id && t.id.startsWith('preset-'));
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

/** 导入类别 → localStorage key 映射 */
export const IMPORT_CATEGORY_KEYS: Record<CacheType, string[]> = {
  theme: ['app-theme'],
  presets: ['url-preset-params'],
  games: ['game-high-score-tetris', 'game-high-score-snake', 'game-high-score-2048'],
  preferences: [DEFAULT_TAB_KEY, TAB_ORDER_KEY, ACTIVE_TAB_KEY, 'translator-page-translate-enabled'],
  apiTemplates: ['apiTemplates'],
};

/** 所有可导入的合法 key 集合 */
const ALL_VALID_IMPORT_KEYS = Object.values(IMPORT_CATEGORY_KEYS).flat();

/** 需要 JSON 校验的 key */
const JSON_VALIDATED_KEYS = new Set([TAB_ORDER_KEY, 'apiTemplates', 'app-theme']);

/**
 * 解析导入配置文件，返回可选的类别及其包含的条目数。
 * 用于在 UI 上展示「选择性导入」复选框。
 */
export const parseImportCategories = (
  jsonString: string
): { success: boolean; message: string; categories?: Record<CacheType, number> } => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.config || typeof data.config !== 'object') {
      return { success: false, message: '配置文件格式无效' };
    }

    const categories = {} as Record<CacheType, number>;
    for (const [category, keys] of Object.entries(IMPORT_CATEGORY_KEYS)) {
      const count = keys.filter((k) => data.config[k] !== undefined && data.config[k] !== null).length;
      if (count > 0) categories[category as CacheType] = count;
    }

    if (Object.keys(categories).length === 0) {
      return { success: false, message: '配置中没有可导入的数据' };
    }
    return { success: true, message: '', categories };
  } catch {
    return { success: false, message: '配置文件 JSON 格式无效' };
  }
};

/**
 * 导入用户配置。
 * @param jsonString  配置 JSON 字符串
 * @param selectedCategories  可选，指定只导入哪些类别；不传则全量导入
 */
export const importUserConfig = (
  jsonString: string,
  selectedCategories?: CacheType[]
): { success: boolean; message: string } => {
  try {
    const data = JSON.parse(jsonString);

    if (!data.config || typeof data.config !== 'object') {
      return { success: false, message: '配置文件格式无效' };
    }

    // 计算本次允许导入的 key 集合
    const allowedKeys = selectedCategories
      ? selectedCategories.flatMap((cat) => IMPORT_CATEGORY_KEYS[cat] ?? [])
      : ALL_VALID_IMPORT_KEYS;

    let importedCount = 0;
    for (const [key, value] of Object.entries(data.config)) {
      if (!allowedKeys.includes(key) || value === null || typeof value !== 'string') continue;
      if (JSON_VALIDATED_KEYS.has(key)) {
        try { JSON.parse(value as string); } catch { continue; }
      }
      try {
        localStorage.setItem(key, value as string);
        importedCount++;
      } catch (error) {
        console.error(`Failed to import key "${key}":`, error);
      }
    }

    if (importedCount === 0) {
      return { success: false, message: '没有有效的配置项可导入' };
    }
    return { success: true, message: `成功导入 ${importedCount} 项配置` };
  } catch (error) {
    console.error('Failed to import user config:', error);
    return { success: false, message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}` };
  }
};
