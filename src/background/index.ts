/**
 * Chrome 扩展后台脚本（Service Worker）
 * 处理请求重定向规则
 */

import { getRedirectRules, applyRulesToDeclarativeNetRequest } from '../utils/redirectRules';

const OPEN_SIDE_PANEL_MENU_ID = 'open-xiaohuohuo-side-panel';
const FALLBACK_WINDOW_WIDTH = 420;
const MIN_FALLBACK_WINDOW_WIDTH = 320;
const FALLBACK_WINDOW_ID_KEY = 'fallback-side-panel-window-id';
const FALLBACK_WINDOW_WIDTH_KEY = 'fallback-side-panel-window-width';
const SIDE_PANEL_NOTICE_KEY = 'side-panel-unavailable-notice-at';
const SIDE_PANEL_NOTICE_COOLDOWN_MS = 60 * 60 * 1000;
const GUIDE_PAGE_URL = 'pages/sidepanel-guide.html';
const SIDE_PANEL_PATH = 'index.html?mode=sidepanel';
const STANDALONE_PATH = 'index.html?mode=standalone';

const getActiveTabId = async (): Promise<number | undefined> => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.id);
    });
  });
};

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

const notifySidePanelUnavailable = async () => {
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
    title: '当前浏览器不支持扩展侧边栏',
    message: '已改用侧边浮窗模式。点击通知查看如何从浏览器右上角侧边栏入口打开。'
  });
};

const openSidePanelGuide = async () => {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL(GUIDE_PAGE_URL) });
  } catch (error) {
    console.error('[后台脚本] 打开侧边栏引导页失败:', error);
  }
};

const openFallbackPanelWindow = async () => {
  await notifySidePanelUnavailable();
  const { windowId, width } = await getFallbackState();
  const targetWidth = Math.max(MIN_FALLBACK_WINDOW_WIDTH, width ?? FALLBACK_WINDOW_WIDTH);

  return new Promise<void>((resolve) => {
    chrome.windows.getCurrent({}, (currentWindow) => {
      const top = currentWindow.top ?? 0;
      const left = (currentWindow.left ?? 0) + (currentWindow.width ?? 0) - targetWidth;
      const height = currentWindow.height ?? 720;

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

const openSidePanelForTab = async (tabId?: number) => {
  const sidePanel = (chrome as any).sidePanel as
    | {
        open?: (options: { tabId?: number; windowId?: number }) => Promise<void> | void;
        setOptions?: (options: { tabId?: number; path?: string; enabled?: boolean }) => Promise<void> | void;
      }
    | undefined;

  if (!sidePanel?.open) {
    console.warn('[后台脚本] 当前浏览器不支持 sidePanel API');
    await openFallbackPanelWindow();
    return;
  }

  const resolvedTabId = tabId ?? (await getActiveTabId());
  try {
    if (sidePanel.setOptions) {
      await sidePanel.setOptions({ tabId: resolvedTabId, path: SIDE_PANEL_PATH, enabled: true });
    }
    await sidePanel.open({ tabId: resolvedTabId });
  } catch (error) {
    console.error('[后台脚本] 打开侧边栏失败:', error);
    await openFallbackPanelWindow();
  }
};

// 扩展安装或更新时初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('扩展已安装/更新:', details.reason);
  
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: OPEN_SIDE_PANEL_MENU_ID,
      title: '打开小火火浮窗',
      contexts: ['page']
    });
  });

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
  if (info.menuItemId === OPEN_SIDE_PANEL_MENU_ID) {
    openSidePanelForTab(tab?.id);
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
