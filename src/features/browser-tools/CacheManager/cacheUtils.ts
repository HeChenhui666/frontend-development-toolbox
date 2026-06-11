/**
 * CacheManager 工具函数
 * 封装 Cookie 操作、浏览数据清理、域名解析等底层逻辑
 */

// ── 常量 ──────────────────────────────────────────────────────────────────────

export const CUSTOM_SITE_KEY = 'cachemanager-custom-sites';
export const INCLUDE_HISTORY_KEY = 'cachemanager-include-history';
export const INCLUDE_CUSTOM_KEY = 'cachemanager-include-custom';
export const INCLUDE_PARENT_COOKIE_KEY = 'cachemanager-include-parent-cookie';
export const HISTORY_DAYS_DEFAULT = 7;
export const HISTORY_DAYS_KEY = 'cachemanager-history-days';
export const HISTORY_MAX = 2000;

const MULTI_PART_TLDS = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
  'com.cn', 'net.cn', 'org.cn', 'gov.cn',
  'co.jp', 'ne.jp', 'or.jp', 'co.kr',
  'com.au', 'net.au', 'org.au',
  'com.br', 'com.sg', 'com.hk', 'com.tw',
]);

// ── 类型 ──────────────────────────────────────────────────────────────────────

export type DomainEntry = {
  domain: string;
  cookieCount: number;
  tabCount: number;
  historyCount: number;
  fromCookies: boolean;
  fromTabs: boolean;
  fromHistory: boolean;
  fromCustom: boolean;
};

// ── 环境检测 ──────────────────────────────────────────────────────────────────

export const isExtensionEnv = (): boolean =>
  typeof chrome !== 'undefined' &&
  !!chrome.cookies &&
  !!chrome.browsingData &&
  !!chrome.tabs &&
  !!chrome.scripting;

// ── 域名工具 ──────────────────────────────────────────────────────────────────

export const normalizeDomain = (domain: string): string => {
  const trimmed = domain.trim().toLowerCase();
  return trimmed.startsWith('.') ? trimmed.slice(1) : trimmed;
};

export const extractHost = (url?: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return null;
    return normalizeDomain(parsed.hostname);
  } catch {
    return null;
  }
};

export const isIPAddress = (host: string): boolean =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

export const getBaseDomain = (domain: string): string => {
  const normalized = normalizeDomain(domain);
  if (!normalized || normalized === 'localhost' || isIPAddress(normalized)) return normalized;
  const parts = normalized.split('.');
  if (parts.length <= 2) return normalized;
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return lastTwo;
};

export const matchDomain = (domain: string, host: string, includeSubdomains: boolean): boolean => {
  if (domain === host) return true;
  if (!includeSubdomains) return false;
  return host.endsWith(`.${domain}`);
};

export const buildOriginsForDomain = (domain: string): string[] => {
  const normalized = normalizeDomain(domain);
  return [`https://${normalized}`, `http://${normalized}`];
};

export const uniqueDomains = (domains: string[]): string[] => {
  const seen = new Set<string>();
  domains.forEach((domain) => {
    if (!domain) return;
    seen.add(normalizeDomain(domain));
  });
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
};

// ── Chrome API 封装 ──────────────────────────────────────────────────────────

export const getAllCookies = (): Promise<chrome.cookies.Cookie[]> =>
  new Promise((resolve, reject) => {
    chrome.cookies.getAll({}, (cookies) => {
      if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
      resolve(cookies || []);
    });
  });

export const getAllTabs = (): Promise<chrome.tabs.Tab[]> =>
  new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
      resolve(tabs || []);
    });
  });

export const searchHistory = (startTime: number): Promise<chrome.history.HistoryItem[]> =>
  new Promise((resolve, reject) => {
    chrome.history.search({ text: '', startTime, maxResults: HISTORY_MAX }, (items) => {
      if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
      resolve(items || []);
    });
  });

export const removeCookie = (cookie: chrome.cookies.Cookie): Promise<void> =>
  new Promise((resolve, reject) => {
    const domain = normalizeDomain(cookie.domain);
    const scheme = cookie.secure ? 'https' : 'http';
    const url = `${scheme}://${domain}${cookie.path}`;
    chrome.cookies.remove({ url, name: cookie.name, storeId: cookie.storeId }, () => {
      if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
      resolve();
    });
  });

export const removeBrowsingDataForOrigins = (origins: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    chrome.browsingData.remove(
      { origins },
      { cache: true, cacheStorage: true, indexedDB: true, localStorage: true, serviceWorkers: true, webSQL: true },
      () => {
        if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
        resolve();
      }
    );
  });

export const clearSessionStorageInTabs = (tabIds: number[]): Promise<void> => {
  if (tabIds.length === 0) return Promise.resolve();
  const tasks = tabIds.map(
    (tabId) =>
      new Promise<void>((resolve, reject) => {
        chrome.scripting.executeScript(
          { target: { tabId }, func: () => { sessionStorage.clear(); } },
          () => {
            if (chrome.runtime.lastError) { reject(chrome.runtime.lastError); return; }
            resolve();
          }
        );
      })
  );
  return Promise.allSettled(tasks).then(() => undefined);
};

// ── 偏好读写 ──────────────────────────────────────────────────────────────────

export const readBoolPreference = (key: string, fallback: boolean): boolean => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    return saved === 'true';
  } catch {
    return fallback;
  }
};

export const saveBoolPreference = (key: string, value: boolean): void => {
  try { localStorage.setItem(key, String(value)); } catch { /* ignore */ }
};

export const readNumberPreference = (key: string, fallback: number): number => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    const parsed = Number(saved);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const readCustomSites = (): string[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_SITE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => normalizeDomain(String(item))).filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
};
