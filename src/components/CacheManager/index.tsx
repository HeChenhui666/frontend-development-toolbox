import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Tag,
  Tabs,
  Typography,
  message as antdMessage,
} from 'antd';
import { ReloadOutlined, DeleteOutlined, ClearOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

const CUSTOM_SITE_KEY = 'cachemanager-custom-sites';
const INCLUDE_HISTORY_KEY = 'cachemanager-include-history';
const INCLUDE_CUSTOM_KEY = 'cachemanager-include-custom';
const INCLUDE_PARENT_COOKIE_KEY = 'cachemanager-include-parent-cookie';
const HISTORY_DAYS_DEFAULT = 7;
const HISTORY_DAYS_KEY = 'cachemanager-history-days';
const HISTORY_MAX = 2000;
const MULTI_PART_TLDS = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'com.cn',
  'net.cn',
  'org.cn',
  'gov.cn',
  'co.jp',
  'ne.jp',
  'or.jp',
  'co.kr',
  'com.au',
  'net.au',
  'org.au',
  'com.br',
  'com.sg',
  'com.hk',
  'com.tw',
]);

type DomainEntry = {
  domain: string;
  cookieCount: number;
  tabCount: number;
  historyCount: number;
  fromCookies: boolean;
  fromTabs: boolean;
  fromHistory: boolean;
  fromCustom: boolean;
};

const isExtensionEnv = () =>
  typeof chrome !== 'undefined' &&
  !!chrome.cookies &&
  !!chrome.browsingData &&
  !!chrome.tabs &&
  !!chrome.scripting;

const normalizeDomain = (domain: string): string => {
  const trimmed = domain.trim().toLowerCase();
  return trimmed.startsWith('.') ? trimmed.slice(1) : trimmed;
};

const extractHost = (url?: string): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname) return null;
    return normalizeDomain(parsed.hostname);
  } catch {
    return null;
  }
};

const isIPAddress = (host: string): boolean => {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
};

const getBaseDomain = (domain: string): string => {
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

const matchDomain = (domain: string, host: string, includeSubdomains: boolean): boolean => {
  if (domain === host) return true;
  if (!includeSubdomains) return false;
  return host.endsWith(`.${domain}`);
};

const getAllCookies = (): Promise<chrome.cookies.Cookie[]> =>
  new Promise((resolve, reject) => {
    chrome.cookies.getAll({}, (cookies) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(cookies || []);
    });
  });

const getAllTabs = (): Promise<chrome.tabs.Tab[]> =>
  new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(tabs || []);
    });
  });

const searchHistory = (startTime: number): Promise<chrome.history.HistoryItem[]> =>
  new Promise((resolve, reject) => {
    chrome.history.search({ text: '', startTime, maxResults: HISTORY_MAX }, (items) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(items || []);
    });
  });

const removeCookie = (cookie: chrome.cookies.Cookie): Promise<void> =>
  new Promise((resolve, reject) => {
    const domain = normalizeDomain(cookie.domain);
    const scheme = cookie.secure ? 'https' : 'http';
    const url = `${scheme}://${domain}${cookie.path}`;
    chrome.cookies.remove({ url, name: cookie.name, storeId: cookie.storeId }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });

const removeBrowsingDataForOrigins = (origins: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    chrome.browsingData.remove(
      { origins },
      {
        cache: true,
        cacheStorage: true,
        indexedDB: true,
        localStorage: true,
        serviceWorkers: true,
        webSQL: true,
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      }
    );
  });

const clearSessionStorageInTabs = (tabIds: number[]): Promise<void> => {
  if (tabIds.length === 0) return Promise.resolve();
  const tasks = tabIds.map(
    (tabId) =>
      new Promise<void>((resolve, reject) => {
        chrome.scripting.executeScript(
          {
            target: { tabId },
            func: () => {
              sessionStorage.clear();
            },
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            resolve();
          }
        );
      })
  );
  return Promise.allSettled(tasks).then(() => undefined);
};

const buildOriginsForDomain = (domain: string): string[] => {
  const normalized = normalizeDomain(domain);
  return [`https://${normalized}`, `http://${normalized}`];
};

const readBoolPreference = (key: string, fallback: boolean): boolean => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    return saved === 'true';
  } catch {
    return fallback;
  }
};

const saveBoolPreference = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.error('Failed to save preference:', error);
  }
};

const readNumberPreference = (key: string, fallback: number): number => {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    const parsed = Number(saved);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const readCustomSites = (): string[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_SITE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => normalizeDomain(String(item))).filter(Boolean);
    }
  } catch (error) {
    console.error('Failed to read custom sites:', error);
  }
  return [];
};

const uniqueDomains = (domains: string[]): string[] => {
  const seen = new Set<string>();
  domains.forEach((domain) => {
    if (!domain) return;
    seen.add(normalizeDomain(domain));
  });
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
};

const CacheManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const includeHistory = useMemo(
    () => readBoolPreference(INCLUDE_HISTORY_KEY, true),
    []
  );
  const includeCustomSites = useMemo(
    () => readBoolPreference(INCLUDE_CUSTOM_KEY, true),
    []
  );
  const customSites = useMemo(() => readCustomSites(), []);
  const historyDays = useMemo(
    () => readNumberPreference(HISTORY_DAYS_KEY, HISTORY_DAYS_DEFAULT),
    []
  );
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchClearCookies, setBatchClearCookies] = useState(true);
  const [batchClearSiteData, setBatchClearSiteData] = useState(true);
  const [batchClearSession, setBatchClearSession] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailDomain, setDetailDomain] = useState<DomainEntry | null>(null);
  const [detailCookies, setDetailCookies] = useState<chrome.cookies.Cookie[]>([]);
  const [detailTabs, setDetailTabs] = useState<chrome.tabs.Tab[]>([]);
  const [detailHistory, setDetailHistory] = useState<chrome.history.HistoryItem[]>([]);
  const [detailLocalStorage, setDetailLocalStorage] = useState<
    Array<{ tabId: number; title?: string; url?: string; key: string; value: string; size: number }>
  >([]);
  const [detailSessionStorage, setDetailSessionStorage] = useState<
    Array<{ tabId: number; title?: string; url?: string; key: string; value: string; size: number }>
  >([]);
  const [groupByBaseDomain, setGroupByBaseDomain] = useState(false);
  const [includeParentCookies, setIncludeParentCookies] = useState(() =>
    readBoolPreference(INCLUDE_PARENT_COOKIE_KEY, true)
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<
    | { storageType: 'local' | 'session'; tabId: number; key: string; value: string }
    | { storageType: 'cookie'; cookie: chrome.cookies.Cookie }
    | { storageType: 'tab'; tabId: number; url: string; title?: string }
    | null
  >(null);
  const [editValue, setEditValue] = useState('');
  const [cookieEditDomain, setCookieEditDomain] = useState('');
  const [cookieEditPath, setCookieEditPath] = useState('');
  const [cookieEditSameSite, setCookieEditSameSite] = useState<chrome.cookies.SameSiteStatus>('no_restriction');
  const [cookieEditSecure, setCookieEditSecure] = useState(false);
  const [cookieEditHttpOnly, setCookieEditHttpOnly] = useState(false);
  const [cookieEditIsSession, setCookieEditIsSession] = useState(true);
  const [cookieEditExpiry, setCookieEditExpiry] = useState<number | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string[]>(['tabs']);
  const [sourceMatchMode, setSourceMatchMode] = useState<'any' | 'all'>('any');
  const [minCookies, setMinCookies] = useState<number | null>(null);
  const [minTabs, setMinTabs] = useState<number | null>(null);
  const [minHistory, setMinHistory] = useState<number | null>(null);
  const [maxCookies, setMaxCookies] = useState<number | null>(null);
  const [maxTabs, setMaxTabs] = useState<number | null>(null);
  const [maxHistory, setMaxHistory] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<'domain' | 'cookies' | 'tabs' | 'history'>('domain');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const refreshData = useCallback(async () => {
    if (!isExtensionEnv()) return;
    setLoading(true);
    try {
      const [cookies, tabs] = await Promise.all([getAllCookies(), getAllTabs()]);
      const historyDomains: string[] = [];
      const historyCountMap = new Map<string, number>();
      if (includeHistory) {
        const startTime = Date.now() - historyDays * 24 * 60 * 60 * 1000;
        const historyItems = await searchHistory(startTime);
        historyItems.forEach((item) => {
          const host = extractHost(item.url);
          if (host) {
            historyDomains.push(host);
            historyCountMap.set(host, (historyCountMap.get(host) || 0) + 1);
          }
        });
      }
      const domainMap = new Map<
        string,
        {
          cookieCount: number;
          tabCount: number;
          historyCount: number;
          fromCookies: boolean;
          fromTabs: boolean;
          fromHistory: boolean;
          fromCustom: boolean;
        }
      >();

      const keyFromDomain = (domain: string) =>
        groupByBaseDomain ? getBaseDomain(domain) : normalizeDomain(domain);

      cookies.forEach((cookie) => {
        const domain = keyFromDomain(cookie.domain);
        const current =
          domainMap.get(domain) || {
            cookieCount: 0,
            tabCount: 0,
            historyCount: 0,
            fromCookies: false,
            fromTabs: false,
            fromHistory: false,
            fromCustom: false,
          };
        current.cookieCount += 1;
        current.fromCookies = true;
        domainMap.set(domain, current);
      });

      tabs.forEach((tab) => {
        const host = extractHost(tab.url || tab.pendingUrl);
        if (!host) return;
        const key = keyFromDomain(host);
        const current =
          domainMap.get(key) || {
            cookieCount: 0,
            tabCount: 0,
            historyCount: 0,
            fromCookies: false,
            fromTabs: false,
            fromHistory: false,
            fromCustom: false,
          };
        current.tabCount += 1;
        current.fromTabs = true;
        domainMap.set(key, current);
      });

      if (includeHistory) {
        uniqueDomains(historyDomains).forEach((domain) => {
          const key = keyFromDomain(domain);
          const current =
            domainMap.get(key) || {
              cookieCount: 0,
              tabCount: 0,
              historyCount: 0,
              fromCookies: false,
              fromTabs: false,
              fromHistory: false,
              fromCustom: false,
            };
          current.historyCount = (current.historyCount || 0) + (historyCountMap.get(domain) || 0);
          current.fromHistory = true;
          domainMap.set(key, current);
        });
      }

      if (includeCustomSites) {
        customSites.forEach((domain) => {
          const normalized = normalizeDomain(domain);
          if (!normalized) return;
          const key = keyFromDomain(normalized);
          const current =
            domainMap.get(key) || {
              cookieCount: 0,
              tabCount: 0,
              historyCount: 0,
              fromCookies: false,
              fromTabs: false,
              fromHistory: false,
              fromCustom: false,
            };
          current.fromCustom = true;
          domainMap.set(key, current);
        });
      }

      const list: DomainEntry[] = Array.from(domainMap.entries()).map(([domain, info]) => ({
        domain,
        cookieCount: info.cookieCount,
        tabCount: info.tabCount,
        historyCount: info.historyCount,
        fromCookies: info.fromCookies,
        fromTabs: info.fromTabs,
        fromHistory: info.fromHistory,
        fromCustom: info.fromCustom,
      }));

      list.sort((a, b) => a.domain.localeCompare(b.domain));
      setDomains(list);
      setLastUpdatedAt(new Date());
    } catch (error) {
      antdMessage.error('加载域名缓存信息失败');
      console.error('Failed to load cache info:', error);
    } finally {
      setLoading(false);
    }
  }, [includeCustomSites, includeHistory, customSites, historyDays, groupByBaseDomain]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const filteredDomains = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    return domains.filter((item) => {
      if (trimmed && !item.domain.includes(trimmed)) return false;
      if (sourceFilter.length > 0) {
        if (sourceMatchMode === 'any') {
          const anyMatch =
            (sourceFilter.includes('cookies') && item.fromCookies) ||
            (sourceFilter.includes('tabs') && item.fromTabs) ||
            (sourceFilter.includes('history') && item.fromHistory) ||
            (sourceFilter.includes('custom') && item.fromCustom);
          if (!anyMatch) return false;
        } else {
          const allMatch =
            (!sourceFilter.includes('cookies') || item.fromCookies) &&
            (!sourceFilter.includes('tabs') || item.fromTabs) &&
            (!sourceFilter.includes('history') || item.fromHistory) &&
            (!sourceFilter.includes('custom') || item.fromCustom);
          if (!allMatch) return false;
        }
      }
      if (minCookies !== null && item.cookieCount < minCookies) return false;
      if (minTabs !== null && item.tabCount < minTabs) return false;
      if (minHistory !== null && item.historyCount < minHistory) return false;
      if (maxCookies !== null && item.cookieCount > maxCookies) return false;
      if (maxTabs !== null && item.tabCount > maxTabs) return false;
      if (maxHistory !== null && item.historyCount > maxHistory) return false;
      return true;
    });
  }, [
    domains,
    keyword,
    sourceFilter,
    sourceMatchMode,
    minCookies,
    minTabs,
    minHistory,
    maxCookies,
    maxTabs,
    maxHistory,
  ]);

  const sortedDomains = useMemo(() => {
    const list = [...filteredDomains];
    list.sort((a, b) => {
      let result = 0;
      switch (sortKey) {
        case 'cookies':
          result = a.cookieCount - b.cookieCount;
          break;
        case 'tabs':
          result = a.tabCount - b.tabCount;
          break;
        case 'history':
          result = a.historyCount - b.historyCount;
          break;
        case 'domain':
        default:
          result = a.domain.localeCompare(b.domain);
          break;
      }
      return sortOrder === 'asc' ? result : -result;
    });
    return list;
  }, [filteredDomains, sortKey, sortOrder]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(sortedDomains.length / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [sortedDomains.length, pageSize, currentPage]);

  const pagedDomains = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDomains.slice(start, start + pageSize);
  }, [sortedDomains, currentPage, pageSize]);

  const handleClearCookies = useCallback(async (domain: string) => {
    Modal.confirm({
      title: `清理 ${domain} 的 Cookie`,
      content: '此操作将删除该域名下的所有 Cookie，可能导致需要重新登录。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const cookies = await getAllCookies();
          const targetDomain = normalizeDomain(domain);
          const targetCookies = cookies.filter((cookie) => {
            const cookieDomain = normalizeDomain(cookie.domain);
            if (groupByBaseDomain) {
              return cookieDomain === targetDomain || cookieDomain.endsWith(`.${targetDomain}`);
            }
            return cookieDomain === targetDomain;
          });
          await Promise.all(targetCookies.map(removeCookie));
          antdMessage.success('Cookie 已清理');
          refreshData();
        } catch (error) {
          antdMessage.error('清理 Cookie 失败');
          console.error('Failed to clear cookies:', error);
        }
      },
    });
  }, [refreshData, groupByBaseDomain]);

  const handleClearSiteData = useCallback(async (domain: string) => {
    Modal.confirm({
      title: `清理 ${domain} 的站点数据`,
      content: '将清除该域名的本地存储、IndexedDB、缓存等数据。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          let origins = buildOriginsForDomain(domain);
          if (groupByBaseDomain) {
            const tabs = await getAllTabs();
            const targetHosts = tabs
              .map((tab) => extractHost(tab.url || tab.pendingUrl))
              .filter((host): host is string => !!host && matchDomain(domain, host, true));
            const hostOrigins = targetHosts.flatMap(buildOriginsForDomain);
            origins = Array.from(new Set([...origins, ...hostOrigins]));
          }
          await removeBrowsingDataForOrigins(origins);
          antdMessage.success('站点数据已清理');
          refreshData();
        } catch (error) {
          antdMessage.error('清理站点数据失败');
          console.error('Failed to clear site data:', error);
        }
      },
    });
  }, [refreshData, groupByBaseDomain]);

  const handleClearSession = useCallback(async (domain: string) => {
    Modal.confirm({
      title: `清理 ${domain} 的会话存储`,
      content: '仅对已打开的页面生效，清理后可能导致页面状态丢失。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const tabs = await getAllTabs();
          const targetTabIds = tabs
            .filter((tab) => {
              const host = extractHost(tab.url || tab.pendingUrl);
              if (!host) return false;
              return matchDomain(normalizeDomain(domain), host, groupByBaseDomain);
            })
            .map((tab) => tab.id)
            .filter((id): id is number => typeof id === 'number');
          await clearSessionStorageInTabs(targetTabIds);
          antdMessage.success('会话存储已清理');
        } catch (error) {
          antdMessage.error('清理会话存储失败');
          console.error('Failed to clear session storage:', error);
        }
      },
    });
  }, [groupByBaseDomain]);

  const handleOpenDetail = async (entry: DomainEntry) => {
    setDetailDomain(entry);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const [cookies, tabs] = await Promise.all([getAllCookies(), getAllTabs()]);
      const detailDomain = normalizeDomain(entry.domain);
      const includeSubdomains = groupByBaseDomain;
      const targetCookies = cookies.filter((cookie) => {
        const cookieDomain = normalizeDomain(cookie.domain);
        if (includeParentCookies) {
          return (
            cookieDomain === detailDomain ||
            detailDomain.endsWith(`.${cookieDomain}`) ||
            cookieDomain.endsWith(`.${detailDomain}`)
          );
        }
        return cookieDomain === detailDomain;
      });
      const targetTabs = tabs.filter((tab) => {
        const host = extractHost(tab.url || tab.pendingUrl);
        if (!host) return false;
        return matchDomain(detailDomain, host, includeSubdomains);
      });
      const targetTabIds = targetTabs
        .map((tab) => tab.id)
        .filter((id): id is number => typeof id === 'number');
      const storageFromTabs = await getStorageFromTabs(targetTabIds);
      setDetailLocalStorage(storageFromTabs.localStorage);
      setDetailSessionStorage(storageFromTabs.sessionStorage);
      let historyItems: chrome.history.HistoryItem[] = [];
      if (includeHistory) {
        const startTime = Date.now() - historyDays * 24 * 60 * 60 * 1000;
        const searched = await searchHistory(startTime);
        historyItems = searched.filter((item) => {
          const host = extractHost(item.url);
          if (!host) return false;
          return matchDomain(detailDomain, host, includeSubdomains);
        });
      }

      setDetailCookies(targetCookies);
      setDetailTabs(targetTabs);
      setDetailHistory(historyItems);
    } catch (error) {
      antdMessage.error('加载详细信息失败');
      console.error('Failed to load detail info:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const getStorageFromTabs = async (tabIds: number[]) => {
    if (tabIds.length === 0) {
      return { localStorage: [], sessionStorage: [] };
    }
    const tasks = tabIds.map(
      (tabId) =>
        new Promise<{
          tabId: number;
          localStorage: Array<{ key: string; value: string }>;
          sessionStorage: Array<{ key: string; value: string }>;
        }>((resolve) => {
          chrome.scripting.executeScript(
            {
              target: { tabId },
              func: () => ({
                localStorage: Object.keys(localStorage).map((key) => ({
                  key,
                  value: localStorage.getItem(key) || '',
                })),
                sessionStorage: Object.keys(sessionStorage).map((key) => ({
                  key,
                  value: sessionStorage.getItem(key) || '',
                })),
              }),
            },
            (results) => {
              if (chrome.runtime.lastError) {
                resolve({ tabId, localStorage: [], sessionStorage: [] });
                return;
              }
              const result = results?.[0]?.result || { localStorage: [], sessionStorage: [] };
              resolve({ tabId, localStorage: result.localStorage, sessionStorage: result.sessionStorage });
            }
          );
        })
    );
    const results = await Promise.all(tasks);
    const tabs = await getAllTabs();
    const tabMap = new Map<number, chrome.tabs.Tab>();
    tabs.forEach((tab) => {
      if (typeof tab.id === 'number') tabMap.set(tab.id, tab);
    });
    const localStorageRows: Array<{ tabId: number; title?: string; url?: string; key: string; value: string; size: number }> = [];
    const sessionStorageRows: Array<{ tabId: number; title?: string; url?: string; key: string; value: string; size: number }> = [];

    results.forEach((item) => {
      const tab = tabMap.get(item.tabId);
      const title = tab?.title;
      const url = tab?.url || tab?.pendingUrl;
      item.localStorage.forEach((entry) => {
        localStorageRows.push({
          tabId: item.tabId,
          title,
          url,
          key: entry.key,
          value: entry.value,
          size: new Blob([entry.value]).size,
        });
      });
      item.sessionStorage.forEach((entry) => {
        sessionStorageRows.push({
          tabId: item.tabId,
          title,
          url,
          key: entry.key,
          value: entry.value,
          size: new Blob([entry.value]).size,
        });
      });
    });

    return { localStorage: localStorageRows, sessionStorage: sessionStorageRows };
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB'];
    const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const size = Math.round((bytes / Math.pow(1024, idx)) * 100) / 100;
    return `${size} ${units[idx]}`;
  };

  const formatCookieExpiry = (cookie: chrome.cookies.Cookie) => {
    if (!cookie.expirationDate) return '会话';
    const date = new Date(cookie.expirationDate * 1000);
    return date.toLocaleString();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      antdMessage.success(`${label}已复制`);
    } catch (error) {
      antdMessage.error('复制失败');
      console.error('Copy failed:', error);
    }
  };

  const handleEditValue = (storageType: 'local' | 'session', row: { tabId: number; key: string; value: string }) => {
    setEditTarget({ storageType, tabId: row.tabId, key: row.key, value: row.value });
    setEditValue(row.value);
    setEditOpen(true);
  };

  const handleEditCookieValue = (cookie: chrome.cookies.Cookie) => {
    setEditTarget({ storageType: 'cookie', cookie });
    setEditValue(cookie.value);
    setCookieEditDomain(cookie.domain || '');
    setCookieEditPath(cookie.path || '/');
    setCookieEditSameSite(cookie.sameSite || 'no_restriction');
    setCookieEditSecure(!!cookie.secure);
    setCookieEditHttpOnly(!!cookie.httpOnly);
    setCookieEditIsSession(!cookie.expirationDate);
    setCookieEditExpiry(cookie.expirationDate ? Math.floor(cookie.expirationDate) : null);
    setEditOpen(true);
  };

  const handleEditTabUrl = (tab: chrome.tabs.Tab) => {
    if (!tab.id) return;
    setEditTarget({ storageType: 'tab', tabId: tab.id, url: tab.url || '', title: tab.title });
    setEditValue(tab.url || '');
    setEditOpen(true);
  };

  const handleDeleteStorageItem = async (
    storageType: 'local' | 'session',
    row: { tabId: number; key: string }
  ) => {
    try {
      await new Promise<void>((resolve, reject) => {
        chrome.scripting.executeScript(
          {
            target: { tabId: row.tabId },
            func: (payload: { key: string; storageType: 'local' | 'session' }) => {
              const storage = payload.storageType === 'local' ? localStorage : sessionStorage;
              storage.removeItem(payload.key);
            },
            args: [{ key: row.key, storageType }],
          },
          () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            resolve();
          }
        );
      });
      if (storageType === 'local') {
        setDetailLocalStorage((prev) => prev.filter((item) => !(item.tabId === row.tabId && item.key === row.key)));
      } else {
        setDetailSessionStorage((prev) => prev.filter((item) => !(item.tabId === row.tabId && item.key === row.key)));
      }
      antdMessage.success('缓存已删除');
    } catch (error) {
      antdMessage.error('删除失败');
      console.error('Delete storage item failed:', error);
    }
  };

  const handleDeleteCookie = async (cookie: chrome.cookies.Cookie) => {
    try {
      await removeCookie(cookie);
      setDetailCookies((prev) =>
        prev.filter(
          (item) => !(item.name === cookie.name && item.domain === cookie.domain && item.path === cookie.path)
        )
      );
      antdMessage.success('Cookie 已删除');
    } catch (error) {
      antdMessage.error('删除 Cookie 失败');
      console.error('Delete cookie failed:', error);
    }
  };

  const applyStorageUpdate = async () => {
    if (!editTarget) return;
    const nextValue = editValue;
    try {
      if (editTarget.storageType === 'local' || editTarget.storageType === 'session') {
        const { tabId, key, storageType } = editTarget;
        await new Promise<void>((resolve, reject) => {
          chrome.scripting.executeScript(
            {
              target: { tabId },
              func: (payload: { key: string; value: string; storageType: 'local' | 'session' }) => {
                const storage = payload.storageType === 'local' ? localStorage : sessionStorage;
                storage.setItem(payload.key, payload.value);
              },
              args: [{ key, value: nextValue, storageType }],
            },
            () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
              }
              resolve();
            }
          );
        });
        if (storageType === 'local') {
          setDetailLocalStorage((prev) =>
            prev.map((row) =>
              row.tabId === tabId && row.key === key
                ? { ...row, value: nextValue, size: new Blob([nextValue]).size }
                : row
            )
          );
        } else {
          setDetailSessionStorage((prev) =>
            prev.map((row) =>
              row.tabId === tabId && row.key === key
                ? { ...row, value: nextValue, size: new Blob([nextValue]).size }
                : row
            )
          );
        }
        antdMessage.success('缓存值已更新');
      } else if (editTarget.storageType === 'cookie') {
        const cookie = editTarget.cookie;
        const domainValue = cookieEditDomain || cookie.domain;
        const pathValue = cookieEditPath || cookie.path || '/';
        const normalizedDomain = normalizeDomain(domainValue);
        const url = `${cookieEditSecure ? 'https' : 'http'}://${normalizedDomain}${pathValue}`;
        const details: chrome.cookies.SetDetails = {
          url,
          name: cookie.name,
          value: nextValue,
          path: pathValue,
          secure: cookieEditSecure,
          httpOnly: cookieEditHttpOnly,
          sameSite: cookieEditSameSite,
          storeId: cookie.storeId,
        };
        if (!cookieEditIsSession && cookieEditExpiry) {
          details.expirationDate = cookieEditExpiry;
        }
        if (domainValue && domainValue.startsWith('.')) {
          details.domain = domainValue;
        }
        await new Promise<void>((resolve, reject) => {
          chrome.cookies.set(details, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            resolve();
          });
        });
        setDetailCookies((prev) =>
          prev.map((item) =>
            item.name === cookie.name && item.domain === cookie.domain && item.path === cookie.path
              ? {
                  ...item,
                  value: nextValue,
                  domain: domainValue,
                  path: pathValue,
                  secure: cookieEditSecure,
                  httpOnly: cookieEditHttpOnly,
                  sameSite: cookieEditSameSite,
                  expirationDate: cookieEditIsSession ? undefined : cookieEditExpiry || undefined,
                }
              : item
          )
        );
        antdMessage.success('Cookie 已更新');
      } else if (editTarget.storageType === 'tab') {
        const { tabId } = editTarget;
        await new Promise<void>((resolve, reject) => {
          chrome.tabs.update(tabId, { url: nextValue }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            resolve();
          });
        });
        setDetailTabs((prev) =>
          prev.map((tab) => (tab.id === tabId ? { ...tab, url: nextValue } : tab))
        );
        antdMessage.success('标签页已更新');
      }
      setEditOpen(false);
    } catch (error) {
      antdMessage.error('更新失败');
      console.error('Update storage failed:', error);
    }
  };

  const handleToggleParentCookies = (value: boolean) => {
    setIncludeParentCookies(value);
    saveBoolPreference(INCLUDE_PARENT_COOKIE_KEY, value);
  };

  const editValueLabel = editTarget?.storageType === 'tab' ? 'URL' : 'Value（值）';


  const clearCookiesForDomains = async (targetDomains: string[]) => {
    const cookies = await getAllCookies();
    const targetSet = new Set(targetDomains.map(normalizeDomain));
    const targetCookies = cookies.filter((cookie) => {
      const cookieDomain = normalizeDomain(cookie.domain);
      if (!groupByBaseDomain) {
        return targetSet.has(cookieDomain);
      }
      return Array.from(targetSet).some(
        (domain) => cookieDomain === domain || cookieDomain.endsWith(`.${domain}`)
      );
    });
    await Promise.all(targetCookies.map(removeCookie));
  };

  const clearSessionForDomains = async (targetDomains: string[]) => {
    const tabs = await getAllTabs();
    const targetSet = new Set(targetDomains.map(normalizeDomain));
    const targetTabIds = tabs
      .filter((tab) => {
        const host = extractHost(tab.url || tab.pendingUrl);
        if (!host) return false;
        if (!groupByBaseDomain) return targetSet.has(host);
        return Array.from(targetSet).some((domain) => matchDomain(domain, host, true));
      })
      .map((tab) => tab.id)
      .filter((id): id is number => typeof id === 'number');
    await clearSessionStorageInTabs(targetTabIds);
  };

  const clearSiteDataForDomains = async (targetDomains: string[]) => {
    let origins = targetDomains.flatMap(buildOriginsForDomain);
    if (groupByBaseDomain) {
      const tabs = await getAllTabs();
      const targetHosts = tabs
        .map((tab) => extractHost(tab.url || tab.pendingUrl))
        .filter((host): host is string => !!host)
        .filter((host) => targetDomains.some((domain) => matchDomain(domain, host, true)));
      const hostOrigins = targetHosts.flatMap(buildOriginsForDomain);
      origins = Array.from(new Set([...origins, ...hostOrigins]));
    }
    if (origins.length === 0) return;
    await removeBrowsingDataForOrigins(origins);
  };

  const handleBatchClear = async (clearAll: boolean) => {
    const targetDomains = filteredDomains.map((item) => item.domain);
    if (targetDomains.length === 0) {
      antdMessage.info('当前筛选结果为空');
      return;
    }

    const hasAnyType = batchClearCookies || batchClearSiteData || batchClearSession;
    if (!clearAll && !hasAnyType) {
      antdMessage.warning('请至少选择一种清理类型');
      return;
    }

    const title = clearAll ? '清理所有域名' : '批量清理';
    const content = clearAll
      ? '将清除当前筛选结果内所有域名的 Cookie、站点数据，并清理已打开页面的会话存储。'
      : '将清理当前筛选结果内所有域名的指定数据类型。';

    Modal.confirm({
      title,
      content,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const cookiesEnabled = clearAll ? true : batchClearCookies;
          const siteEnabled = clearAll ? true : batchClearSiteData;
          const sessionEnabled = clearAll ? true : batchClearSession;

          if (cookiesEnabled) await clearCookiesForDomains(targetDomains);
          if (siteEnabled) await clearSiteDataForDomains(targetDomains);
          if (sessionEnabled) await clearSessionForDomains(targetDomains);

          antdMessage.success('批量清理完成');
          refreshData();
        } catch (error) {
          antdMessage.error('批量清理失败');
          console.error('Batch clear failed:', error);
        }
      },
    });
  };

  if (!isExtensionEnv()) {
    return (
      <div className="cache-manager">
        <Card size="small" className="cache-manager-card">
          <Text type="secondary">此功能仅在浏览器扩展环境中可用。</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="cache-manager">
      <div className="cache-manager-header">
        <Space wrap>
          <Input
            placeholder="按域名搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            size="small"
            className="cache-manager-search"
          />
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={refreshData}
            loading={loading}
          >
            刷新
          </Button>
          <Button size="small" onClick={() => setBatchOpen(true)}>
            按类型批量清理
          </Button>
          <Button size="small" danger onClick={() => handleBatchClear(true)}>
            清理所有域名
          </Button>
        </Space>
        <Text type="secondary" className="cache-manager-updated">
          {lastUpdatedAt ? `更新于 ${lastUpdatedAt.toLocaleTimeString()}` : '未加载'}
        </Text>
      </div>


      <Card size="small" className="cache-manager-card">
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary">筛选与排序</Text>
          <Space wrap className="cache-manager-filters">
            <Space size="small" className="cache-manager-filter-switch">
              <Text>按主域名聚合</Text>
              <Switch checked={groupByBaseDomain} onChange={setGroupByBaseDomain} size="small" />
            </Space>
            <Space size="small" className="cache-manager-filter-switch">
              <Text>详情包含父域 Cookie</Text>
              <Switch checked={includeParentCookies} onChange={handleToggleParentCookies} size="small" />
            </Space>
            <Select
              mode="multiple"
              allowClear
              placeholder="来源筛选"
              value={sourceFilter}
              onChange={(value) => {
                setSourceFilter(value);
                setCurrentPage(1);
              }}
              className="cache-manager-filter-select"
              options={[
                { label: 'Cookie', value: 'cookies' },
                { label: '标签页', value: 'tabs' },
                { label: '历史记录', value: 'history' },
                { label: '自定义', value: 'custom' },
              ]}
            />
            <Select
              value={sourceMatchMode}
              onChange={(value) => setSourceMatchMode(value)}
              className="cache-manager-filter-select"
              options={[
                { label: '任一来源', value: 'any' },
                { label: '全部来源', value: 'all' },
              ]}
            />
            <InputNumber
              size="small"
              min={0}
              placeholder="最少 Cookie"
              value={minCookies}
              onChange={(value) => {
                setMinCookies(value === null ? null : Math.max(0, Math.floor(value)));
                setCurrentPage(1);
              }}
              className="cache-manager-filter-number"
            />
            <InputNumber
              size="small"
              min={0}
              placeholder="最多 Cookie"
              value={maxCookies}
              onChange={(value) => {
                setMaxCookies(value === null ? null : Math.max(0, Math.floor(value)));
                setCurrentPage(1);
              }}
              className="cache-manager-filter-number"
            />
            <InputNumber
              size="small"
              min={0}
              placeholder="最少标签页"
              value={minTabs}
              onChange={(value) => {
                setMinTabs(value === null ? null : Math.max(0, Math.floor(value)));
                setCurrentPage(1);
              }}
              className="cache-manager-filter-number"
            />
            <InputNumber
              size="small"
              min={0}
              placeholder="最多标签页"
              value={maxTabs}
              onChange={(value) => {
                setMaxTabs(value === null ? null : Math.max(0, Math.floor(value)));
                setCurrentPage(1);
              }}
              className="cache-manager-filter-number"
            />
            <InputNumber
              size="small"
              min={0}
              placeholder="最少历史"
              value={minHistory}
              onChange={(value) => {
                setMinHistory(value === null ? null : Math.max(0, Math.floor(value)));
                setCurrentPage(1);
              }}
              className="cache-manager-filter-number"
              disabled={!includeHistory}
            />
            <InputNumber
              size="small"
              min={0}
              placeholder="最多历史"
              value={maxHistory}
              onChange={(value) => {
                setMaxHistory(value === null ? null : Math.max(0, Math.floor(value)));
                setCurrentPage(1);
              }}
              className="cache-manager-filter-number"
              disabled={!includeHistory}
            />
            <Select
              value={`${sortKey}-${sortOrder}`}
              onChange={(value) => {
                const [key, order] = value.split('-') as [
                  'domain' | 'cookies' | 'tabs' | 'history',
                  'asc' | 'desc',
                ];
                setSortKey(key);
                setSortOrder(order);
              }}
              className="cache-manager-filter-select"
              options={[
                { label: '域名 A→Z', value: 'domain-asc' },
                { label: '域名 Z→A', value: 'domain-desc' },
                { label: 'Cookie 多→少', value: 'cookies-desc' },
                { label: 'Cookie 少→多', value: 'cookies-asc' },
                { label: '标签页 多→少', value: 'tabs-desc' },
                { label: '标签页 少→多', value: 'tabs-asc' },
                { label: '历史 多→少', value: 'history-desc' },
                { label: '历史 少→多', value: 'history-asc' },
              ]}
            />
          </Space>
        </Space>
      </Card>

      <div className="cache-manager-list">
        {sortedDomains.length === 0 ? (
          <Card size="small" className="cache-manager-card">
            <Text type="secondary">暂无可展示的域名。</Text>
          </Card>
        ) : (
          pagedDomains.map((item) => (
            <Card
              key={item.domain}
              size="small"
              className="cache-manager-card cache-manager-card-clickable"
              onClick={() => handleOpenDetail(item)}
            >
              <div className="cache-manager-item">
                <div className="cache-manager-info">
                  <Text strong>{item.domain}</Text>
                  <Space size="small" wrap>
                    <Tag color="blue">Cookie: {item.cookieCount}</Tag>
                    <Tag color={item.tabCount > 0 ? 'green' : 'default'}>
                      打开标签页: {item.tabCount}
                    </Tag>
                    {item.fromHistory && <Tag color="purple">历史: {item.historyCount}</Tag>}
                    {item.fromCustom && <Tag>自定义</Tag>}
                  </Space>
                </div>
                <Space wrap>
                  <Button
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSiteData(item.domain);
                    }}
                  >
                    清理站点数据
                  </Button>
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearCookies(item.domain);
                    }}
                    disabled={item.cookieCount === 0}
                  >
                    清理 Cookie
                  </Button>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSession(item.domain);
                    }}
                    disabled={item.tabCount === 0}
                  >
                    清理会话
                  </Button>
                </Space>
              </div>
            </Card>
          ))
        )}
      </div>

      {sortedDomains.length > 0 && (
        <div className="cache-manager-pagination">
          <Pagination
            size="small"
            current={currentPage}
            pageSize={pageSize}
            total={sortedDomains.length}
            showSizeChanger
            pageSizeOptions={[10, 20, 50]}
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size !== pageSize) {
                setPageSize(size);
                setCurrentPage(1);
              }
            }}
            showTotal={(total) => `共 ${total} 个域名`}
          />
        </div>
      )}

      <Modal
        title="按数据类型批量清理"
        open={batchOpen}
        onCancel={() => setBatchOpen(false)}
        onOk={() => {
          setBatchOpen(false);
          handleBatchClear(false);
        }}
        okText="开始清理"
        cancelText="取消"
        centered
        destroyOnClose
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary">将对当前列表中的所有域名执行以下操作：</Text>
          <Checkbox checked={batchClearCookies} onChange={(e) => setBatchClearCookies(e.target.checked)}>
            清理 Cookie
          </Checkbox>
          <Checkbox checked={batchClearSiteData} onChange={(e) => setBatchClearSiteData(e.target.checked)}>
            清理站点数据（本地存储、IndexedDB、缓存等）
          </Checkbox>
          <Checkbox checked={batchClearSession} onChange={(e) => setBatchClearSession(e.target.checked)}>
            清理已打开页面的会话存储
          </Checkbox>
        </Space>
      </Modal>

      <Modal
        title={detailDomain ? `缓存详情 - ${detailDomain.domain}` : '缓存详情'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
        centered
        destroyOnClose
      >
        {detailDomain && (
          <div className="cache-manager-detail">
            <Space wrap>
              <Tag color="blue">Cookie: {detailDomain.cookieCount}</Tag>
              <Tag color={detailDomain.tabCount > 0 ? 'green' : 'default'}>
                打开标签页: {detailDomain.tabCount}
              </Tag>
              {detailDomain.fromHistory && <Tag color="purple">历史: {detailDomain.historyCount}</Tag>}
              {detailDomain.fromCustom && <Tag>自定义</Tag>}
            </Space>

            <Tabs
              className="cache-manager-detail-tabs"
              items={[
                {
                  key: 'cookies',
                  label: 'Cookie',
                  children: (
                    <div className="cache-manager-detail-panel">
                      {detailLoading ? (
                        <Text type="secondary">加载中...</Text>
                      ) : detailCookies.length === 0 ? (
                        <Text type="secondary">无 Cookie</Text>
                      ) : (
                        <div className="cache-manager-simple-list">
                          {detailCookies.map((cookie) => (
                            <div
                              key={`${cookie.name}-${cookie.domain}-${cookie.path}`}
                              className="cache-manager-row-card"
                            >
                              <div className="cache-manager-row-header">
                                <Text className="cache-manager-key">{cookie.name}</Text>
                                <div className="cache-manager-row-actions">
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditCookieValue(cookie)}
                                  />
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteCookie(cookie)}
                                  />
                                </div>
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  Value: {cookie.value}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(cookie.value, 'Cookie值')}
                                />
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  Domain: {cookie.domain}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(cookie.domain, 'Domain')}
                                />
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  Path: {cookie.path}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(cookie.path, 'Path')}
                                />
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  {cookie.secure ? 'Secure' : 'Non-secure'} · {formatCookieExpiry(cookie)}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() =>
                                    copyToClipboard(
                                      `${cookie.secure ? 'Secure' : 'Non-secure'} · ${formatCookieExpiry(cookie)}`,
                                      '属性'
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'local',
                  label: 'localStorage',
                  children: (
                    <div className="cache-manager-detail-panel">
                      {detailLoading ? (
                        <Text type="secondary">加载中...</Text>
                      ) : detailLocalStorage.length === 0 ? (
                        <Text type="secondary">无本地存储</Text>
                      ) : (
                        <div className="cache-manager-simple-list">
                          {detailLocalStorage.map((row) => (
                            <div key={`${row.tabId}-${row.key}`} className="cache-manager-row-card">
                              <div className="cache-manager-row-header">
                                <Text className="cache-manager-key">{row.key}</Text>
                                <div className="cache-manager-row-actions">
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditValue('local', row)}
                                  />
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteStorageItem('local', row)}
                                  />
                                </div>
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  Value: {row.value}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(row.value, 'Value')}
                                />
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  大小: {formatBytes(row.size)}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(formatBytes(row.size), '大小')}
                                />
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  来源: {row.title || row.url || '-'}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(row.title || row.url || '-', '来源')}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'session',
                  label: 'sessionStorage',
                  children: (
                    <div className="cache-manager-detail-panel">
                      {detailLoading ? (
                        <Text type="secondary">加载中...</Text>
                      ) : detailSessionStorage.length === 0 ? (
                        <Text type="secondary">无会话存储</Text>
                      ) : (
                        <div className="cache-manager-simple-list">
                          {detailSessionStorage.map((row) => (
                            <div key={`${row.tabId}-${row.key}`} className="cache-manager-row-card">
                              <div className="cache-manager-row-header">
                                <Text className="cache-manager-key">{row.key}</Text>
                                <div className="cache-manager-row-actions">
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditValue('session', row)}
                                  />
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteStorageItem('session', row)}
                                  />
                                </div>
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  Value: {row.value}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(row.value, 'Value')}
                                />
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  大小: {formatBytes(row.size)}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(formatBytes(row.size), '大小')}
                                />
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  来源: {row.title || row.url || '-'}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(row.title || row.url || '-', '来源')}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'tabs',
                  label: '打开标签页',
                  children: (
                    <div className="cache-manager-detail-panel">
                      {detailLoading ? (
                        <Text type="secondary">加载中...</Text>
                      ) : detailTabs.length === 0 ? (
                        <Text type="secondary">无打开标签页</Text>
                      ) : (
                        <div className="cache-manager-simple-list">
                          {detailTabs.map((tab) => (
                            <div key={String(tab.id)} className="cache-manager-row-card">
                              <div className="cache-manager-row-header">
                                <Text className="cache-manager-key">{tab.title || tab.url || '-'}</Text>
                                <div className="cache-manager-row-actions">
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEditTabUrl(tab)}
                                  />
                                </div>
                              </div>
                              <div className="cache-manager-row-line">
                                <Text type="secondary" className="cache-manager-row-text">
                                  URL: {tab.url}
                                </Text>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyToClipboard(tab.url || '', 'URL')}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'history',
                  label: '历史记录',
                  children: (
                    <div className="cache-manager-detail-panel">
                      {!includeHistory ? (
                        <Text type="secondary">未开启历史记录来源</Text>
                      ) : detailLoading ? (
                        <Text type="secondary">加载中...</Text>
                      ) : detailHistory.length === 0 ? (
                        <Text type="secondary">无历史记录</Text>
                      ) : (
                        <>
                          <div className="cache-manager-simple-list">
                            {detailHistory.slice(0, 10).map((item) => (
                              <div key={`${item.id}-${item.url}`} className="cache-manager-row-card">
                                <div className="cache-manager-row-header">
                                  <Text className="cache-manager-key">{item.title || item.url}</Text>
                                </div>
                                <div className="cache-manager-row-line">
                                  <Text type="secondary" className="cache-manager-row-text">
                                    URL: {item.url}
                                  </Text>
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<CopyOutlined />}
                                    onClick={() => copyToClipboard(item.url || '', 'URL')}
                                  />
                                </div>
                                <div className="cache-manager-row-line">
                                  <Text type="secondary" className="cache-manager-row-text">
                                    访问时间: {item.lastVisitTime ? new Date(item.lastVisitTime).toLocaleString() : '-'}
                                  </Text>
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<CopyOutlined />}
                                    onClick={() =>
                                      copyToClipboard(
                                        item.lastVisitTime
                                          ? new Date(item.lastVisitTime).toLocaleString()
                                          : '-',
                                        '访问时间'
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          {detailHistory.length > 10 && (
                            <Text type="secondary">仅展示最近 10 条</Text>
                          )}
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={
          editTarget
            ? editTarget.storageType === 'tab'
              ? `编辑标签页`
              : editTarget.storageType === 'cookie'
                ? `编辑 Cookie`
                : `编辑 ${editTarget.key}`
            : '编辑缓存'
        }
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={applyStorageUpdate}
        okText="保存"
        cancelText="取消"
        centered
        destroyOnClose
      >
        <div className="cache-manager-edit-form">
          <Text type="secondary" className="cache-manager-edit-hint">
            {editTarget?.storageType === 'tab'
              ? '修改后将跳转到新的 URL。'
              : '仅对当前已打开的页面生效。'}
          </Text>
          {editTarget?.storageType === 'cookie' ? (
            <div className="cache-manager-cookie-form">
              <div className="cache-manager-cookie-field">
                <Text type="secondary">Domain（作用域）</Text>
                <Input
                  value={cookieEditDomain}
                  onChange={(e) => setCookieEditDomain(e.target.value)}
                  placeholder="例如 .example.com 或 example.com"
                />
              </div>
              <div className="cache-manager-cookie-field">
                <Text type="secondary">Path（路径）</Text>
                <Input
                  value={cookieEditPath}
                  onChange={(e) => setCookieEditPath(e.target.value)}
                  placeholder="例如 /"
                />
              </div>
              <div className="cache-manager-cookie-field">
                <Text type="secondary">SameSite（跨站策略）</Text>
                <Select
                  size="small"
                  value={cookieEditSameSite}
                  onChange={(value) => setCookieEditSameSite(value)}
                  options={[
                    { label: 'None', value: 'no_restriction' },
                    { label: 'Lax', value: 'lax' },
                    { label: 'Strict', value: 'strict' },
                  ]}
                />
              </div>
              <div className="cache-manager-cookie-field">
                <Text type="secondary">Expires（过期时间，Unix 秒）</Text>
                <InputNumber
                  min={0}
                  value={cookieEditExpiry}
                  onChange={(value) => setCookieEditExpiry(value === null ? null : Math.floor(value))}
                  placeholder="例如 1735689600"
                  style={{ width: '100%' }}
                  disabled={cookieEditIsSession}
                />
              </div>
              <div className="cache-manager-cookie-switches">
                <div className="cache-manager-cookie-switch">
                  <Text type="secondary">Secure</Text>
                  <Switch checked={cookieEditSecure} onChange={setCookieEditSecure} />
                </div>
                <div className="cache-manager-cookie-switch">
                  <Text type="secondary">HttpOnly</Text>
                  <Switch checked={cookieEditHttpOnly} onChange={setCookieEditHttpOnly} />
                </div>
                <div className="cache-manager-cookie-switch">
                  <Text type="secondary">持久化</Text>
                  <Switch
                    checked={!cookieEditIsSession}
                    onChange={(value) => setCookieEditIsSession(!value)}
                  />
                </div>
              </div>
              <div className="cache-manager-cookie-field cache-manager-cookie-value">
                <Text type="secondary">Value（值）</Text>
                <Input.TextArea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoSize={{ minRows: 4, maxRows: 10 }}
                  placeholder="请输入新的 Cookie 值"
                />
              </div>
            </div>
          ) : (
            <div className="cache-manager-edit-field">
              <Text type="secondary">{editValueLabel}</Text>
              <Input.TextArea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoSize={{ minRows: 4, maxRows: 10 }}
                placeholder="请输入新的缓存值"
                className="cache-manager-edit-textarea"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CacheManager;
