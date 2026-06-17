/**
 * CORS 跨域响应头注入工具
 * 通过 declarativeNetRequest 修改响应头，模拟 CORS Access-Control-Allow-Origin 插件行为
 */

export interface CorsConfig {
  enabled: boolean;
  /** 匹配 URL 模式，空字符串 = 所有 URL */
  urlPattern: string;
  allowOrigin: string;
  allowMethods: string;
  allowHeaders: string;
}

export const DEFAULT_CORS_CONFIG: CorsConfig = {
  enabled: false,
  urlPattern: '',
  allowOrigin: '*',
  allowMethods: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  allowHeaders: '*',
};

export const CORS_STORAGE_KEY = 'cors-config';

/** 最低支持 initiatorUrlFilter 的 Chrome 版本 */
export const INITIATOR_URL_FILTER_MIN_CHROME = 130;

/** 从 userAgent 解析 Chrome 主版本号，非 Chrome 环境返回 0 */
export function getChromeVersion(): number {
  const match = navigator.userAgent.match(/Chrome\/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 将用户输入的域名/URL 规范化为 eTLD+1 域名字符串（去除 scheme 和端口）。
 * Chrome declarativeNetRequest initiatorDomains 仅接受纯域名，不含端口。
 */
export function normalizeDomain(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    return url.hostname;
  } catch {
    return trimmed.split(':')[0].split('/')[0].toLowerCase();
  }
}

/** CORS 规则使用固定 ID，不与重定向规则(10000-20000)冲突 */
const CORS_RULE_ID = 20001;

export async function getCorsConfig(): Promise<CorsConfig> {
  try {
    const result = await chrome.storage.local.get(CORS_STORAGE_KEY);
    const stored = result[CORS_STORAGE_KEY];
    if (!stored) return { ...DEFAULT_CORS_CONFIG };
    return { ...DEFAULT_CORS_CONFIG, ...stored };
  } catch {
    return { ...DEFAULT_CORS_CONFIG };
  }
}

export async function saveCorsConfig(config: CorsConfig): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [CORS_STORAGE_KEY]: config });
    return true;
  } catch {
    return false;
  }
}

const ALL_RESOURCE_TYPES: chrome.declarativeNetRequest.ResourceType[] = [
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'media',
  'websocket',
  'other',
] as chrome.declarativeNetRequest.ResourceType[];

function buildCorsRule(config: CorsConfig): chrome.declarativeNetRequest.Rule {
  const condition: chrome.declarativeNetRequest.RuleCondition = {
    resourceTypes: ALL_RESOURCE_TYPES,
  };

  const pattern = config.urlPattern.trim();
  if (pattern) {
    condition.urlFilter = pattern;
  }

  const responseHeaders: chrome.declarativeNetRequest.ModifyHeaderInfo[] = [
    {
      header: 'Access-Control-Allow-Origin',
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: config.allowOrigin || '*',
    },
    {
      header: 'Access-Control-Allow-Methods',
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: config.allowMethods || DEFAULT_CORS_CONFIG.allowMethods,
    },
    {
      header: 'Access-Control-Allow-Headers',
      operation: chrome.declarativeNetRequest.HeaderOperation.SET,
      value: config.allowHeaders || '*',
    },
  ];

  return {
    id: CORS_RULE_ID,
    priority: 2, // 高于重定向规则默认优先级
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      responseHeaders,
    },
    condition,
  };
}

export async function applyCorsRules(): Promise<boolean> {
  try {
    if (!chrome.declarativeNetRequest) return false;

    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const corsRuleIds = existingRules
      .filter((r) => r.id === CORS_RULE_ID)
      .map((r) => r.id);

    const config = await getCorsConfig();

    if (!config.enabled) {
      if (corsRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: corsRuleIds,
        });
      }
      return true;
    }

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: corsRuleIds,
      addRules: [buildCorsRule(config)],
    });
    return true;
  } catch (error) {
    console.error('[CORS] applyCorsRules 失败:', error);
    return false;
  }
}
