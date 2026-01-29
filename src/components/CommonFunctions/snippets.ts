export interface FunctionSnippet {
  id: string;
  title: string;
  description?: string;
  code: string;
}

export interface FunctionSnippetsByCategory {
  data: FunctionSnippet[];
  dom: FunctionSnippet[];
  async: FunctionSnippet[];
  storage: FunctionSnippet[];
}

export const FUNCTION_SNIPPETS: FunctionSnippetsByCategory = {
  data: [
    {
      id: 'is-nil',
      title: '空值判断',
      description: '判断是否为 null 或 undefined',
      code: `const isNil = (value) => value === null || value === undefined;`,
    },
    {
      id: 'is-plain-object',
      title: '纯对象判断',
      description: '排除数组/函数/日期等，仅判断普通对象',
      code: `const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';`,
    },
    {
      id: 'is-empty',
      title: '空值/空集合判断',
      description: '支持 string / array / object / map / set',
      code: `const isEmpty = (value) => {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};`,
    },
    {
      id: 'unique-array',
      title: '数组去重',
      description: '保留原顺序的去重',
      code: `const uniqueArray = (arr) => Array.from(new Set(arr));`,
    },
    {
      id: 'chunk-array',
      title: '数组分块',
      description: '将数组按固定大小拆分成多个小数组',
      code: `const chunk = (arr, size = 1) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};`,
    },
    {
      id: 'flatten-deep',
      title: '数组深度扁平化',
      description: '递归扁平化多层数组',
      code: `const flattenDeep = (arr) =>
  arr.reduce(
    (acc, item) => acc.concat(Array.isArray(item) ? flattenDeep(item) : item),
    []
  );`,
    },
    {
      id: 'group-by',
      title: '数组分组',
      description: '按字段或函数分组',
      code: `const groupBy = (list, getKey) =>
  list.reduce((acc, item) => {
    const key = getKey(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {});`,
    },
    {
      id: 'pick',
      title: '对象挑选字段',
      description: '返回只包含指定字段的新对象',
      code: `const pick = (obj, keys = []) =>
  keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});`,
    },
    {
      id: 'omit',
      title: '对象剔除字段',
      description: '返回剔除指定字段的新对象',
      code: `const omit = (obj, keys = []) =>
  Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) acc[key] = obj[key];
    return acc;
  }, {});`,
    },
    {
      id: 'clamp',
      title: '数值限制区间',
      description: '将数值限制在 min/max 之间',
      code: `const clamp = (value, min, max) => Math.min(max, Math.max(min, value));`,
    },
  ],
  dom: [
    {
      id: 'on-off',
      title: '事件绑定/解绑',
      description: '统一的 add/remove 事件封装',
      code: `const on = (el, type, handler, options) => {
  if (!el) return;
  el.addEventListener(type, handler, options);
};

const off = (el, type, handler, options) => {
  if (!el) return;
  el.removeEventListener(type, handler, options);
};`,
    },
    {
      id: 'once',
      title: '一次性事件监听',
      description: '触发一次后自动移除',
      code: `const once = (el, type, handler, options) => {
  const listener = (event) => {
    handler(event);
    el.removeEventListener(type, listener, options);
  };
  el.addEventListener(type, listener, options);
};`,
    },
    {
      id: 'delegate',
      title: '事件委托',
      description: '在父节点上监听子元素事件',
      code: `const delegate = (el, selector, type, handler) => {
  const listener = (event) => {
    const target = event.target.closest(selector);
    if (target && el.contains(target)) handler(event, target);
  };
  el.addEventListener(type, listener);
  return () => el.removeEventListener(type, listener);
};`,
    },
    {
      id: 'qs-qsa',
      title: '快速查询元素',
      description: '快捷封装 querySelector / querySelectorAll',
      code: `const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));`,
    },
    {
      id: 'get-style',
      title: '获取样式',
      description: '读取 computed style',
      code: `const getStyle = (el, prop) =>
  window.getComputedStyle(el).getPropertyValue(prop);`,
    },
    {
      id: 'set-styles',
      title: '批量设置样式',
      description: '一次性设置多个内联样式',
      code: `const setStyles = (el, styles) => {
  Object.entries(styles).forEach(([key, value]) => {
    el.style[key] = value;
  });
};`,
    },
    {
      id: 'toggle-class',
      title: '切换 class',
      description: '支持强制开关的 class 切换',
      code: `const toggleClass = (el, className, force) =>
  el.classList.toggle(className, force);`,
    },
    {
      id: 'get-offset',
      title: '获取元素偏移',
      description: '获取元素相对于页面的坐标',
      code: `const getOffset = (el) => {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
  };
};`,
    },
    {
      id: 'in-viewport',
      title: '是否在视口内',
      description: '判断元素是否进入可视区域',
      code: `const isInViewport = (el, offset = 0) => {
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= window.innerHeight + offset &&
    rect.bottom >= -offset &&
    rect.left <= window.innerWidth + offset &&
    rect.right >= -offset
  );
};`,
    },
  ],
  async: [
    {
      id: 'sleep',
      title: '睡眠函数',
      description: '等待指定时间',
      code: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));`,
    },
    {
      id: 'with-timeout',
      title: '超时包装',
      description: '为任意 Promise 增加超时控制',
      code: `const withTimeout = (promise, ms, error = new Error('Timeout')) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(error), ms)),
  ]);`,
    },
    {
      id: 'retry',
      title: '请求重试',
      description: '支持延迟与最大重试次数',
      code: `const retry = async (fn, times = 3, delay = 300) => {
  let lastError;
  for (let i = 0; i < times; i += 1) {
    try {
      return await fn(i);
    } catch (error) {
      lastError = error;
      if (i < times - 1) await sleep(delay);
    }
  }
  throw lastError;
};`,
    },
    {
      id: 'retry-backoff',
      title: '指数退避重试',
      description: '退避等待时间逐次放大',
      code: `const retryWithBackoff = async (fn, times = 3, baseDelay = 300) => {
  let lastError;
  for (let i = 0; i < times; i += 1) {
    try {
      return await fn(i);
    } catch (error) {
      lastError = error;
      if (i < times - 1) await sleep(baseDelay * 2 ** i);
    }
  }
  throw lastError;
};`,
    },
    {
      id: 'async-pool',
      title: '并发控制',
      description: '限制并发数量执行任务',
      code: `const asyncPool = async (limit, tasks) => {
  const ret = [];
  const executing = [];
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    ret.push(p);
    if (limit <= tasks.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
};`,
    },
    {
      id: 'poll',
      title: '轮询',
      description: '按间隔持续执行，返回停止函数',
      code: `const poll = (fn, interval = 1000) => {
  let timer;
  const run = async () => {
    await fn();
    timer = setTimeout(run, interval);
  };
  run();
  return () => clearTimeout(timer);
};`,
    },
    {
      id: 'queue',
      title: '异步队列',
      description: '串行执行异步任务',
      code: `const createQueue = () => {
  let chain = Promise.resolve();
  return (task) => {
    chain = chain.then(() => task());
    return chain;
  };
};`,
    },
    {
      id: 'debounce-promise',
      title: '异步防抖',
      description: '延迟执行并返回同一个 Promise',
      code: `const debouncePromise = (fn, delay = 300) => {
  let timer;
  let pendingReject = null;
  return (...args) =>
    new Promise((resolve, reject) => {
      if (pendingReject) pendingReject(new Error('Cancelled'));
      pendingReject = reject;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        pendingReject = null;
        try {
          resolve(await fn(...args));
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
};`,
    },
  ],
  storage: [
    {
      id: 'storage-json',
      title: '存储 JSON',
      description: '自动 JSON 序列化/反序列化',
      code: `const storage = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};`,
    },
    {
      id: 'storage-expire',
      title: '带过期的本地缓存',
      description: '支持 TTL 的 localStorage 缓存',
      code: `const setCache = (key, value, ttl = 3600_000) => {
  const expires = Date.now() + ttl;
  localStorage.setItem(key, JSON.stringify({ value, expires }));
};

const getCache = (key) => {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const { value, expires } = JSON.parse(raw);
  if (Date.now() > expires) {
    localStorage.removeItem(key);
    return null;
  }
  return value;
};`,
    },
    {
      id: 'memoize',
      title: '内存缓存',
      description: '对计算结果进行内存缓存',
      code: `const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};`,
    },
    {
      id: 'lru-cache',
      title: '简单 LRU 缓存',
      description: '限制容量的内存缓存',
      code: `const createLRUCache = (limit = 50) => {
  const cache = new Map();
  return {
    get(key) {
      if (!cache.has(key)) return undefined;
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    },
    set(key, value) {
      if (cache.has(key)) cache.delete(key);
      cache.set(key, value);
      if (cache.size > limit) {
        cache.delete(cache.keys().next().value);
      }
    },
    clear() {
      cache.clear();
    },
  };
};`,
    },
    {
      id: 'cache-fetch',
      title: '请求缓存',
      description: '缓存请求结果并支持 TTL',
      code: `const createCacheFetch = (ttl = 30_000) => {
  const cache = new Map();
  return async (key, fetcher) => {
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && cached.expires > now) return cached.value;
    const value = await fetcher();
    cache.set(key, { value, expires: now + ttl });
    return value;
  };
};`,
    },
    {
      id: 'storage-space',
      title: '安全写入 localStorage',
      description: '捕获存储满时的异常',
      code: `const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('localStorage 写入失败', error);
    return false;
  }
};`,
    },
    {
      id: 'session-storage',
      title: 'sessionStorage 封装',
      description: '和 localStorage 一致的 API',
      code: `const session = {
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  get(key, fallback = null) {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },
  remove(key) {
    sessionStorage.removeItem(key);
  },
};`,
    },
  ],
};
