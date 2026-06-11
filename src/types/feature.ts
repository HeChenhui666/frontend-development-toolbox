/**
 * 功能模块相关类型定义
 */

/** 所有已实现的功能标签页 ID */
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

/** 功能标签页 ID（与 DefaultTab 一致，保留扩展性） */
export type FeatureTab = DefaultTab;

/** 扩展的标签页 ID（含预留 future 位） */
export type ExtendedFeatureTab = FeatureTab | 'future1' | 'future2';

/** 功能元信息 */
export interface FeatureMeta {
  id: ExtendedFeatureTab;
  name: string;
  icon: string;
}

/** 二维码/缓存管理的子标签页 */
export type SubTab = 'generate' | 'decode' | 'barcode' | 'storage';

/** 缓存类型 */
export type CacheType = 'theme' | 'presets' | 'games' | 'preferences' | 'apiTemplates';

/** 缓存类型详情 */
export interface CacheTypeInfo {
  name: string;
  keys: string[];
  size: number;
}

/** 存储项信息 */
export interface StorageItem {
  key: string;
  size: number;
}

/** 存储信息概览 */
export interface StorageInfo {
  used: number;
  total: number;
  items: StorageItem[];
}

/** 用户配置导入结果 */
export interface ImportResult {
  success: boolean;
  message: string;
}

/** 运行模式 */
export interface RunMode {
  isPopupMode: boolean;
  isSidePanelMode: boolean;
}
