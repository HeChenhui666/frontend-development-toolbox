/**
 * Chrome 扩展后台脚本（Service Worker）
 * 处理请求重定向规则
 */

import { getRedirectRules, applyRulesToDeclarativeNetRequest } from '../utils/redirectRules';

/**
 * sidePanel 仅在本扩展的 Service Worker / 部分扩展页面中注入。
 * 在普通网页、localhost 调试页、内容脚本的 window 里访问 chrome.sidePanel 会得到 undefined，与 Chrome 版本无关。
 */
console.log(
  '[小火火后台] chrome.sidePanel:',
  typeof chrome !== 'undefined' && chrome.sidePanel
    ? '可用'
    : 'undefined（请打开 chrome://extensions → 本扩展 →「Service Worker」控制台查看；勿在网页控制台测）'
);

const MENU_OPEN_SIDE_PANEL = 'xiaohuohuo-menu-open-side-panel';
const MENU_OPEN_FLOAT_WINDOW = 'xiaohuohuo-menu-open-float-window';
/** 独立浮窗尺寸：比 popup 更宽，给工具提供充足空间，同时不占满全屏 */
const FALLBACK_WINDOW_WIDTH = 560;
const MIN_FALLBACK_WINDOW_WIDTH = 400;
const FALLBACK_WINDOW_HEIGHT = 740;
const MIN_FALLBACK_WINDOW_HEIGHT = 580;
const FALLBACK_WINDOW_ID_KEY = 'fallback-side-panel-window-id';
const FALLBACK_WINDOW_WIDTH_KEY = 'fallback-side-panel-window-width';
const SIDE_PANEL_NOTICE_KEY = 'side-panel-unavailable-notice-at';
const SIDE_PANEL_NOTICE_COOLDOWN_MS = 60 * 60 * 1000;
const GUIDE_PAGE_URL = 'pages/sidepanel-guide.html';
const SIDE_PANEL_PATH = 'sidepanel.html';
const STANDALONE_PATH = 'standalone.html';

const getFallbackState = async (): Promise<{ windowId?: number; width?: number }> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([FALLBACK_WINDOW_ID_KEY, FALLBACK_WINDOW_WIDTH_KEY], (result) => {
      resolve({
        windowId: typeof result[FALLBACK_WINDOW_ID_KEY] === 'number' ? result[FALLBACK_WINDOW_ID_KEY] : undefined,
        width: typeof result[FALLBACK_WINDOW_WIDTH_KEY] === 'number' ? result[FALLBACK_WINDOW_WIDTH_KEY] : undefined
      });
    });
  });
};

const setFallbackWindowId = async (windowId?: number) => {
  if (typeof windowId === 'number') {
    await chrome.storage.local.set({ [FALLBACK_WINDOW_ID_KEY]: windowId });
  } else {
    await chrome.storage.local.remove(FALLBACK_WINDOW_ID_KEY);
  }
};

const setFallbackWindowWidth = async (width: number) => {
  await chrome.storage.local.set({ [FALLBACK_WINDOW_WIDTH_KEY]: width });
};

/** 右键「侧边栏」不可用或打开失败时提示（与「浮窗」菜单互不替代） */
const notifyCannotOpenSidePanelFromMenu = async () => {
  if (!chrome.notifications?.create) {
    return;
  }

  const now = Date.now();
  const result = await new Promise<{ [key: string]: number | undefined }>((resolve) => {
    chrome.storage.local.get([SIDE_PANEL_NOTICE_KEY], (stored) => resolve(stored));
  });
  const lastNoticeAt = typeof result[SIDE_PANEL_NOTICE_KEY] === 'number' ? result[SIDE_PANEL_NOTICE_KEY] : 0;
  if (now - lastNoticeAt < SIDE_PANEL_NOTICE_COOLDOWN_MS) {
    return;
  }

  await chrome.storage.local.set({ [SIDE_PANEL_NOTICE_KEY]: now });
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '无法通过右键打开侧边栏',
    message: '请从浏览器右上角「侧边栏」入口选择本扩展，或使用右键菜单「打开小火火浮窗」。点击通知查看图文说明。'
  });
};

const openSidePanelGuide = async () => {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL(GUIDE_PAGE_URL) });
  } catch (error) {
    console.error('[后台脚本] 打开侧边栏引导页失败:', error);
  }
};

/** 独立小窗（popup 窗口），专用于右键「打开小火火浮窗」 */
const openFallbackPanelWindow = async () => {
  const { windowId, width } = await getFallbackState();
  const targetWidth = Math.max(MIN_FALLBACK_WINDOW_WIDTH, width ?? FALLBACK_WINDOW_WIDTH);

  return new Promise<void>((resolve) => {
    chrome.windows.getCurrent({}, (currentWindow) => {
      const top = currentWindow.top ?? 0;
      const left = (currentWindow.left ?? 0) + (currentWindow.width ?? 0) - targetWidth;
      const parentH = currentWindow.height ?? 800;
      const maxHeight = Math.max(MIN_FALLBACK_WINDOW_HEIGHT, parentH - 48);
      const height = Math.min(FALLBACK_WINDOW_HEIGHT, maxHeight);

      if (typeof windowId === 'number') {
        chrome.windows.get(windowId, (existingWindow) => {
          if (chrome.runtime.lastError || !existingWindow) {
            chrome.windows.create(
              {
                url: STANDALONE_PATH,
                type: 'popup',
                width: targetWidth,
                height,
                top,
                left
              },
              (createdWindow) => {
                if (createdWindow?.id) {
                  setFallbackWindowId(createdWindow.id);
                }
                resolve();
              }
            );
            return;
          }

          chrome.windows.update(
            windowId,
            {
              focused: true,
              width: targetWidth,
              height,
              top,
              left
            },
            () => resolve()
          );
        });
        return;
      }

      chrome.windows.create(
        {
          url: STANDALONE_PATH,
          type: 'popup',
          width: targetWidth,
          height,
          top,
          left
        },
        (createdWindow) => {
          if (createdWindow?.id) {
            setFallbackWindowId(createdWindow.id);
          }
          resolve();
        }
      );
    });
  });
};

/**
 * 在用户手势的同步调用栈内打开 Side Panel。
 * Chrome 要求：sidePanel.open() 不得出现在 await 之后，否则会报
 * "may only be called in response to a user gesture"。
 * 默认路径由 manifest.side_panel 与 onInstalled 里的 setOptions 注册，此处不再 await setOptions。
 * @see https://developer.chrome.com/docs/extensions/reference/api/sidePanel
 */
const openSidePanelFromUserGesture = (tab?: chrome.tabs.Tab) => {
  if (!chrome.sidePanel?.open) {
    console.warn('[后台脚本] 当前环境不支持 chrome.sidePanel（需 Chrome 116+）');
    void notifyCannotOpenSidePanelFromMenu();
    return;
  }

  const tabId = tab?.id;
  if (typeof tabId === 'number') {
    chrome.sidePanel.open({ tabId }).catch((error) => {
      console.error('[后台脚本] 打开侧边栏失败:', error);
      void notifyCannotOpenSidePanelFromMenu();
    });
    return;
  }

  const windowId = tab?.windowId;
  if (typeof windowId === 'number') {
    chrome.sidePanel.open({ windowId }).catch((error) => {
      console.error('[后台脚本] 打开侧边栏失败:', error);
      void notifyCannotOpenSidePanelFromMenu();
    });
    return;
  }

  void notifyCannotOpenSidePanelFromMenu();
};

const registerContextMenus = () => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_OPEN_SIDE_PANEL,
      title: '使用侧边栏打开',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: MENU_OPEN_FLOAT_WINDOW,
      title: '使用小窗口打开',
      contexts: ['page']
    });
  });
};

// 扩展安装或更新时初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('扩展已安装/更新:', details.reason);

  if (chrome.sidePanel?.setOptions) {
    try {
      await chrome.sidePanel.setOptions({ path: SIDE_PANEL_PATH, enabled: true });
    } catch (e) {
      console.warn('[后台脚本] sidePanel.setOptions 默认路径注册失败:', e);
    }
  }

  registerContextMenus();

  if (details.reason === 'install') {
    // 首次安装，初始化默认规则（如果有）
    await applyRulesToDeclarativeNetRequest();
  } else if (details.reason === 'update') {
    // 更新时重新应用规则
    await applyRulesToDeclarativeNetRequest();
  }
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[后台脚本] 收到消息:', message.type);
  
  if (message.type === 'APPLY_RULES') {
    console.log('[后台脚本] 开始应用规则...');
    // 应用规则到 declarativeNetRequest
    applyRulesToDeclarativeNetRequest()
      .then((success) => {
        console.log('[后台脚本] 规则应用完成，结果:', success);
        sendResponse({ success });
      })
      .catch((error) => {
        console.error('[后台脚本] 应用规则失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 保持消息通道开放
  }
  
  if (message.type === 'GET_RULES') {
    getRedirectRules()
      .then((rules) => {
        sendResponse({ rules });
      })
      .catch((error) => {
        sendResponse({ rules: [], error: error.message });
      });
    return true;
  }
  
  return false;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_OPEN_SIDE_PANEL) {
    openSidePanelFromUserGesture(tab);
    return;
  }
  if (info.menuItemId === MENU_OPEN_FLOAT_WINDOW) {
    void openFallbackPanelWindow();
  }
});

chrome.notifications.onClicked.addListener(() => {
  openSidePanelGuide();
});

chrome.windows.onBoundsChanged.addListener((window) => {
  if (!window.id || typeof window.width !== 'number') {
    return;
  }
  chrome.storage.local.get([FALLBACK_WINDOW_ID_KEY], (result) => {
    if (result[FALLBACK_WINDOW_ID_KEY] === window.id) {
      setFallbackWindowWidth(window.width ?? FALLBACK_WINDOW_WIDTH);
    }
  });
});

chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.local.get([FALLBACK_WINDOW_ID_KEY], (result) => {
    if (result[FALLBACK_WINDOW_ID_KEY] === windowId) {
      setFallbackWindowId(undefined);
    }
  });
});

// 监听存储变化，自动更新规则
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes['redirect-rules']) {
    // 规则发生变化，延迟重新应用（避免频繁更新）
    setTimeout(() => {
      applyRulesToDeclarativeNetRequest().catch((error) => {
        console.error('自动应用规则失败:', error);
      });
    }, 300);
  }
});

// 启动时应用规则
chrome.runtime.onStartup.addListener(async () => {
  await applyRulesToDeclarativeNetRequest();
});

// 初始化时应用规则
applyRulesToDeclarativeNetRequest().catch((error) => {
  console.error('初始化规则失败:', error);
});
