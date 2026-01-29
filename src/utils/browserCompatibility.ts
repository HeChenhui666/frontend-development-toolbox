/**
 * 浏览器兼容性检测工具
 * 用于检测各种浏览器 API 和功能的支持情况
 */

export interface CompatibilityCheck {
  feature: string;
  supported: boolean;
  message?: string;
  fallback?: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isIE: boolean;
}

/**
 * 检测浏览器信息
 */
export function getBrowserInfo(): BrowserInfo {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '0';
  let isChrome = false;
  let isFirefox = false;
  let isSafari = false;
  let isEdge = false;
  let isIE = false;

  // Chrome
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    isChrome = true;
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '0';
  }
  // Edge
  else if (ua.includes('Edg')) {
    isEdge = true;
    name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/);
    version = match ? match[1] : '0';
  }
  // Firefox
  else if (ua.includes('Firefox')) {
    isFirefox = true;
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    version = match ? match[1] : '0';
  }
  // Safari
  else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    isSafari = true;
    name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    version = match ? match[1] : '0';
  }
  // IE
  else if (ua.includes('MSIE') || ua.includes('Trident')) {
    isIE = true;
    name = 'Internet Explorer';
    const match = ua.match(/(?:MSIE |rv:)(\d+)/);
    version = match ? match[1] : '0';
  }

  return {
    name,
    version,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isIE,
  };
}

/**
 * 检测基础 API 支持
 */
export function checkBasicAPIs(): CompatibilityCheck[] {
  const checks: CompatibilityCheck[] = [];

  // Clipboard API
  checks.push({
    feature: 'Clipboard API',
    supported: typeof navigator !== 'undefined' && !!navigator.clipboard,
    message: typeof navigator !== 'undefined' && navigator.clipboard
      ? undefined
      : '剪贴板 API 不支持，复制功能可能无法使用',
    fallback: '可以使用 document.execCommand("copy") 作为降级方案',
  });

  // FileReader API
  checks.push({
    feature: 'FileReader API',
    supported: typeof FileReader !== 'undefined',
    message:
      typeof FileReader !== 'undefined'
        ? undefined
        : 'FileReader API 不支持，文件读取功能无法使用',
  });

  // URL API
  checks.push({
    feature: 'URL API',
    supported: typeof URL !== 'undefined',
    message:
      typeof URL !== 'undefined'
        ? undefined
        : 'URL API 不支持，URL 解析功能可能无法使用',
  });

  // URLSearchParams API
  checks.push({
    feature: 'URLSearchParams API',
    supported: typeof URLSearchParams !== 'undefined',
    message:
      typeof URLSearchParams !== 'undefined'
        ? undefined
        : 'URLSearchParams API 不支持，URL 参数编辑功能无法使用',
  });

  // Canvas API
  const canvas = document.createElement('canvas');
  const hasCanvasContext = typeof canvas.getContext === 'function';
  checks.push({
    feature: 'Canvas API',
    supported: hasCanvasContext,
    message: hasCanvasContext
      ? undefined
      : 'Canvas API 不支持，图片处理功能无法使用',
  });

  // LocalStorage
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    checks.push({
      feature: 'LocalStorage',
      supported: true,
    });
  } catch (e) {
    checks.push({
      feature: 'LocalStorage',
      supported: false,
      message: 'LocalStorage 不可用，设置保存功能无法使用',
    });
  }

  return checks;
}

/**
 * 检测媒体设备 API
 */
export function checkMediaAPIs(): CompatibilityCheck[] {
  const checks: CompatibilityCheck[] = [];

  // MediaDevices API
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  checks.push({
    feature: 'MediaDevices API',
    supported: hasMediaDevices,
    message: hasMediaDevices
      ? undefined
      : '摄像头 API 不支持，二维码扫描功能无法使用',
    fallback: '可以使用旧版 navigator.getUserMedia 作为降级方案',
  });

  // 检查 passive 事件监听器支持
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
        return false;
      },
    });
    window.addEventListener('test', () => {}, opts);
    window.removeEventListener('test', () => {}, opts);
  } catch (e) {
    // 忽略错误
  }

  checks.push({
    feature: 'Passive Event Listeners',
    supported: supportsPassive,
    message: supportsPassive
      ? undefined
      : 'Passive 事件监听器不支持，某些滚动功能可能受影响',
  });

  return checks;
}

/**
 * 检测 Chrome Extension API
 */
export function checkChromeExtensionAPIs(): CompatibilityCheck[] {
  const checks: CompatibilityCheck[] = [];

  const hasChrome = typeof chrome !== 'undefined';
  if (!hasChrome) {
    checks.push({
      feature: 'Chrome Extension API',
      supported: false,
      message: '不在 Chrome 扩展环境中，某些功能可能无法使用',
    });
    return checks;
  }

  // chrome.tabs API
  checks.push({
    feature: 'chrome.tabs API',
    supported: !!(chrome.tabs && typeof chrome.tabs.query === 'function'),
    message:
      chrome.tabs && typeof chrome.tabs.query === 'function'
        ? undefined
        : 'chrome.tabs API 不可用，标签页相关功能无法使用',
  });

  // chrome.storage API
  checks.push({
    feature: 'chrome.storage API',
    supported: !!(chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === 'function'),
    message:
      chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === 'function'
        ? undefined
        : 'chrome.storage API 不可用，数据存储功能无法使用',
  });

  // chrome.runtime API
  checks.push({
    feature: 'chrome.runtime API',
    supported: !!(chrome.runtime && chrome.runtime.id),
    message:
      chrome.runtime && chrome.runtime.id
        ? undefined
        : 'chrome.runtime API 不可用',
  });

  // chrome.declarativeNetRequest API
  const hasDeclarativeNetRequest = !!(chrome.declarativeNetRequest && 
    typeof chrome.declarativeNetRequest.updateDynamicRules === 'function');
  checks.push({
    feature: 'chrome.declarativeNetRequest API',
    supported: hasDeclarativeNetRequest,
    message: hasDeclarativeNetRequest
      ? undefined
      : 'chrome.declarativeNetRequest API 不可用，请求重定向功能无法使用',
  });

  return checks;
}

/**
 * 检测二维码相关功能
 */
export function checkQRCodeFeatures(): CompatibilityCheck[] {
  const checks: CompatibilityCheck[] = [];

  // Canvas 支持（用于二维码生成和解码）
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  checks.push({
    feature: 'Canvas 2D Context',
    supported: !!ctx,
    message: ctx ? undefined : 'Canvas 2D 不支持，二维码功能无法使用',
  });

  // Image 对象支持
  checks.push({
    feature: 'Image Object',
    supported: typeof Image !== 'undefined',
    message:
      typeof Image !== 'undefined'
        ? undefined
        : 'Image 对象不支持，二维码解码功能无法使用',
  });

  return checks;
}

/**
 * 检测 JSON 相关功能
 */
export function checkJSONFeatures(): CompatibilityCheck[] {
  const checks: CompatibilityCheck[] = [];

  // JSON.parse
  try {
    JSON.parse('{}');
    checks.push({
      feature: 'JSON.parse',
      supported: true,
    });
  } catch (e) {
    checks.push({
      feature: 'JSON.parse',
      supported: false,
      message: 'JSON.parse 不支持，JSON 工具无法使用',
    });
  }

  // JSON.stringify
  try {
    JSON.stringify({});
    checks.push({
      feature: 'JSON.stringify',
      supported: true,
    });
  } catch (e) {
    checks.push({
      feature: 'JSON.stringify',
      supported: false,
      message: 'JSON.stringify 不支持，JSON 工具无法使用',
    });
  }

  return checks;
}

/**
 * 检测正则表达式功能
 */
export function checkRegexFeatures(): CompatibilityCheck[] {
  const checks: CompatibilityCheck[] = [];

  try {
    new RegExp('test');
    checks.push({
      feature: 'RegExp Constructor',
      supported: true,
    });
  } catch (e) {
    checks.push({
      feature: 'RegExp Constructor',
      supported: false,
      message: 'RegExp 构造函数不支持，正则表达式工具无法使用',
    });
  }

  // 检查一些现代正则特性
  try {
    // 测试命名捕获组支持
    const testPattern = '(?<name>test)';
    new RegExp(testPattern);
    checks.push({
      feature: 'Named Capture Groups',
      supported: true,
    });
  } catch (e) {
    checks.push({
      feature: 'Named Capture Groups',
      supported: false,
      message: '命名捕获组不支持，某些高级正则功能可能无法使用',
    });
  }

  return checks;
}

/**
 * 综合检测所有功能
 */
export function checkAllFeatures(): {
  browser: BrowserInfo;
  checks: CompatibilityCheck[];
  hasCriticalIssues: boolean;
} {
  const browser = getBrowserInfo();
  const checks: CompatibilityCheck[] = [
    ...checkBasicAPIs(),
    ...checkMediaAPIs(),
    ...checkChromeExtensionAPIs(),
    ...checkQRCodeFeatures(),
    ...checkJSONFeatures(),
    ...checkRegexFeatures(),
  ];

  const hasCriticalIssues = checks.some(
    (check) => !check.supported && !check.fallback
  );

  return {
    browser,
    checks,
    hasCriticalIssues,
  };
}

/**
 * 生成兼容性报告消息
 */
export function generateCompatibilityMessage(
  checks: CompatibilityCheck[]
): string | null {
  const unsupported = checks.filter((check) => !check.supported);
  if (unsupported.length === 0) {
    return null;
  }

  const critical = unsupported.filter((check) => !check.fallback);
  if (critical.length > 0) {
    return `检测到 ${critical.length} 个不兼容的功能，可能影响使用：${critical
      .map((c) => c.feature)
      .join('、')}`;
  }

  return `部分功能可能受限，但已提供降级方案`;
}
