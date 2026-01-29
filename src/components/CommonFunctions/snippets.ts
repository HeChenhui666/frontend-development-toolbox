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
  Object.prototype.toString.call(value) === '[object Object]'; // 兼容跨 iframe`,
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
}; // 注意：对非集合类型返回 false`,
    },
    {
      id: 'unique-array',
      title: '数组去重',
      description: '保留原顺序的去重',
      code: `const uniqueArray = (arr) => Array.from(new Set(arr)); // 兼容 ES6+`,
    },
    {
      id: 'unique-array-es5',
      title: '数组去重（ES5兼容版）',
      description: '不依赖 Set，适合旧浏览器',
      code: `function uniqueArrayES5(arr) {
  var result = [];
  var seen = {};
  for (var i = 0; i < arr.length; i += 1) {
    var item = arr[i];
    var key = typeof item + '_' + item; // 简单区分类型
    if (!seen[key]) {
      seen[key] = true;
      result.push(item);
    }
  }
  return result;
}`,
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
    acc[key] = acc[key] || []; // 兼容旧浏览器（避免 ||=）
    acc[key].push(item);
    return acc;
  }, {});`,
    },
    {
      id: 'group-by-es5',
      title: '数组分组（ES5兼容版）',
      description: '不依赖 reduce / 箭头函数',
      code: `function groupByES5(list, getKey) {
  var acc = {};
  for (var i = 0; i < list.length; i += 1) {
    var item = list[i];
    var key = getKey(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
  }
  return acc;
}`,
    },
    {
      id: 'pick',
      title: '对象挑选字段',
      description: '返回只包含指定字段的新对象',
      code: `const pick = (obj, keys = []) =>
  keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {}); // 兼容：避免 Object.fromEntries`,
    },
    {
      id: 'pick-es5',
      title: '对象挑选字段（ES5兼容版）',
      description: '使用 for 循环实现',
      code: `function pickES5(obj, keys) {
  var result = {};
  for (var i = 0; i < keys.length; i += 1) {
    var key = keys[i];
    if (key in obj) result[key] = obj[key];
  }
  return result;
}`,
    },
    {
      id: 'omit',
      title: '对象剔除字段',
      description: '返回剔除指定字段的新对象',
      code: `const omit = (obj, keys = []) =>
  Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) acc[key] = obj[key];
    return acc;
  }, {}); // 兼容：避免 Object.fromEntries`,
    },
    {
      id: 'omit-es5',
      title: '对象剔除字段（ES5兼容版）',
      description: '不依赖 includes',
      code: `function omitES5(obj, keys) {
  var result = {};
  var keySet = {};
  for (var i = 0; i < keys.length; i += 1) {
    keySet[keys[i]] = true;
  }
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && !keySet[key]) {
      result[key] = obj[key];
    }
  }
  return result;
}`,
    },
    {
      id: 'clamp',
      title: '数值限制区间',
      description: '将数值限制在 min/max 之间',
      code: `const clamp = (value, min, max) => Math.min(max, Math.max(min, value)); // 兼容所有浏览器`,
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
    const target = event.target.closest
      ? event.target.closest(selector)
      : closestPolyfill(event.target, selector); // 兼容不支持 closest 的浏览器
    if (target && el.contains(target)) handler(event, target);
  };
  el.addEventListener(type, listener);
  return () => el.removeEventListener(type, listener);
};

const closestPolyfill = (node, selector) => {
  let current = node;
  while (current && current.nodeType === 1) {
    if (current.matches && current.matches(selector)) return current;
    current = current.parentElement;
  }
  return null;
};`,
    },
    {
      id: 'delegate-es5',
      title: '事件委托（ES5兼容版）',
      description: '不依赖 closest / const / 箭头函数',
      code: `function delegateES5(el, selector, type, handler) {
  function matches(el, selector) {
    var fn = el.matches || el.msMatchesSelector || el.webkitMatchesSelector;
    return fn ? fn.call(el, selector) : false;
  }
  function closest(el, selector) {
    var current = el;
    while (current && current.nodeType === 1) {
      if (matches(current, selector)) return current;
      current = current.parentElement;
    }
    return null;
  }
  function listener(event) {
    var target = closest(event.target, selector);
    if (target && el.contains(target)) handler(event, target);
  }
  el.addEventListener(type, listener, false);
  return function () {
    el.removeEventListener(type, listener, false);
  };
}`,
    },
    {
      id: 'qs-qsa',
      title: '快速查询元素',
      description: '快捷封装 querySelector / querySelectorAll',
      code: `const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) =>
  Array.prototype.slice.call(root.querySelectorAll(selector)); // 兼容旧浏览器`,
    },
    {
      id: 'qsa-es5',
      title: 'querySelectorAll（ES5兼容版）',
      description: '无默认参数写法',
      code: `function qsaES5(selector, root) {
  var ctx = root || document;
  return Array.prototype.slice.call(ctx.querySelectorAll(selector));
}`,
    },
    {
      id: 'get-style',
      title: '获取样式',
      description: '读取 computed style',
      code: `const getStyle = (el, prop) => {
  // IE9+ / 现代浏览器
  if (window.getComputedStyle) {
    return window.getComputedStyle(el).getPropertyValue(prop);
  }
  // 旧版 IE 兜底
  return el.currentStyle ? el.currentStyle[prop] : '';
};`,
    },
    {
      id: 'set-styles',
      title: '批量设置样式',
      description: '一次性设置多个内联样式',
      code: `const setStyles = (el, styles) => {
  Object.entries(styles).forEach(([key, value]) => {
    el.style[key] = value;
  });
}; // 兼容：如果不支持 Object.entries，可改 for...in`,
    },
    {
      id: 'set-styles-es5',
      title: '批量设置样式（ES5兼容版）',
      description: '使用 for...in 遍历',
      code: `function setStylesES5(el, styles) {
  for (var key in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, key)) {
      el.style[key] = styles[key];
    }
  }
}`,
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
}; // 兼容：滚动偏移在旧浏览器可用 pageYOffset/pageXOffset`,
    },
    {
      id: 'get-offset-es5',
      title: '获取元素偏移（ES5兼容版）',
      description: '兼容旧浏览器滚动偏移',
      code: `function getOffsetES5(el) {
  var rect = el.getBoundingClientRect();
  var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
  };
}`,
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
}; // 兼容：可用 document.documentElement.clientWidth/Height`,
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
      id: 'sleep-callback',
      title: '睡眠函数（回调版）',
      description: '不依赖 Promise 的版本',
      code: `function sleepCb(ms, cb) {
  return setTimeout(cb, ms);
}`,
    },
    {
      id: 'with-timeout',
      title: '超时包装',
      description: '为任意 Promise 增加超时控制',
      code: `const withTimeout = (promise, ms, error = new Error('Timeout')) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(error), ms)),
  ]); // 兼容：Promise.race 需 ES6+`,
    },
    {
      id: 'with-timeout-callback',
      title: '超时包装（回调版）',
      description: '回调风格的超时控制',
      code: `function withTimeoutCb(fn, ms, cb) {
  var done = false;
  var timer = setTimeout(function () {
    if (done) return;
    done = true;
    cb(new Error('Timeout'));
  }, ms);
  fn(function (err, data) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    cb(err, data);
  });
}`,
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
      if (i < times - 1) await sleep(delay); // 兼容：可替换为 Promise+setTimeout
    }
  }
  throw lastError;
}; // 注意：async/await 需 ES2017+`,
    },
    {
      id: 'retry-callback',
      title: '请求重试（回调版）',
      description: '不依赖 async/await',
      code: `function retryCb(fn, times, delay, cb) {
  var attempt = 0;
  function run() {
    fn(attempt, function (err, data) {
      if (!err) return cb(null, data);
      attempt += 1;
      if (attempt >= times) return cb(err);
      setTimeout(run, delay);
    });
  }
  run();
}`,
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
}; // 兼容：指数运算符需 ES2016+，可改 Math.pow`,
    },
    {
      id: 'retry-backoff-es5',
      title: '指数退避重试（ES5兼容版）',
      description: '用 Math.pow 计算退避时间',
      code: `function retryBackoffES5(fn, times, baseDelay, cb) {
  var attempt = 0;
  function run() {
    fn(attempt, function (err, data) {
      if (!err) return cb(null, data);
      attempt += 1;
      if (attempt >= times) return cb(err);
      var delay = baseDelay * Math.pow(2, attempt - 1);
      setTimeout(run, delay);
    });
  }
  run();
}`,
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
}; // 兼容：for...of 需 ES6+`,
    },
    {
      id: 'async-pool-es5',
      title: '并发控制（Promise 版）',
      description: '避免 for...of，适配较低版本',
      code: `function asyncPoolES5(limit, tasks) {
  var ret = [];
  var executing = [];
  function enqueue(task) {
    var p = Promise.resolve().then(task);
    ret.push(p);
    var e = p.then(function () {
      executing.splice(executing.indexOf(e), 1);
    });
    executing.push(e);
    if (executing.length >= limit) {
      return Promise.race(executing);
    }
    return Promise.resolve();
  }
  var chain = Promise.resolve();
  for (var i = 0; i < tasks.length; i += 1) {
    chain = chain.then(enqueue.bind(null, tasks[i]));
  }
  return chain.then(function () {
    return Promise.all(ret);
  });
}`,
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
      id: 'poll-es5',
      title: '轮询（ES5兼容版）',
      description: '回调式轮询',
      code: `function pollES5(fn, interval) {
  var timer;
  function run() {
    fn(function () {
      timer = setTimeout(run, interval);
    });
  }
  run();
  return function () {
    clearTimeout(timer);
  };
}`,
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
}; // 兼容：Promise 需 ES6+`,
    },
    {
      id: 'queue-es5',
      title: '异步队列（回调版）',
      description: '无 Promise 的串行队列',
      code: `function createQueueES5() {
  var running = false;
  var list = [];
  function runNext() {
    if (running || list.length === 0) return;
    running = true;
    var task = list.shift();
    task(function () {
      running = false;
      runNext();
    });
  }
  return function (task) {
    list.push(task);
    runNext();
  };
}`,
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
}; // 兼容：可在不支持 Promise 的环境做降级`,
    },
    {
      id: 'debounce-callback',
      title: '防抖（回调版）',
      description: '不依赖 Promise 的防抖',
      code: `function debounceCb(fn, delay) {
  var timer;
  return function () {
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(null, args);
    }, delay);
  };
}`,
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
}; // 兼容：JSON 需 ES5+`,
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
}; // 兼容：Date.now 需 ES5+`,
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
}; // 兼容：Map 需 ES6+`,
    },
    {
      id: 'memoize-es5',
      title: '内存缓存（ES5兼容版）',
      description: '使用普通对象存储',
      code: `function memoizeES5(fn) {
  var cache = {};
  return function () {
    var key = JSON.stringify(arguments);
    if (cache.hasOwnProperty(key)) return cache[key];
    var result = fn.apply(null, arguments);
    cache[key] = result;
    return result;
  };
}`,
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
}; // 兼容：Map 需 ES6+`,
    },
    {
      id: 'lru-cache-es5',
      title: '简单 LRU 缓存（ES5兼容版）',
      description: '数组+对象实现，适配旧环境',
      code: `function createLRUCacheES5(limit) {
  var keys = [];
  var values = {};
  return {
    get: function (key) {
      if (!values.hasOwnProperty(key)) return undefined;
      var index = keys.indexOf(key);
      if (index > -1) keys.splice(index, 1);
      keys.push(key);
      return values[key];
    },
    set: function (key, value) {
      if (values.hasOwnProperty(key)) {
        var index = keys.indexOf(key);
        if (index > -1) keys.splice(index, 1);
      }
      values[key] = value;
      keys.push(key);
      if (keys.length > limit) {
        var oldest = keys.shift();
        delete values[oldest];
      }
    },
    clear: function () {
      keys = [];
      values = {};
    },
  };
}`,
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
}; // 兼容：Map/async 需 ES6+/ES2017+`,
    },
    {
      id: 'cache-fetch-es5',
      title: '请求缓存（ES5兼容版）',
      description: '回调风格缓存',
      code: `function createCacheFetchES5(ttl) {
  var cache = {};
  return function (key, fetcher, cb) {
    var now = Date.now();
    var cached = cache[key];
    if (cached && cached.expires > now) return cb(null, cached.value);
    fetcher(function (err, value) {
      if (err) return cb(err);
      cache[key] = { value: value, expires: now + ttl };
      cb(null, value);
    });
  };
}`,
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
}; // 兼容：Safari 无痕模式可能抛错`,
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
}; // 兼容：JSON 需 ES5+`,
    },
  ],
};
