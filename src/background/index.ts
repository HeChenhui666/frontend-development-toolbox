/**
 * Chrome 扩展后台脚本（Service Worker）
 * 处理请求重定向规则
 */

import { getRedirectRules, applyRulesToDeclarativeNetRequest } from '../utils/redirectRules';

// 扩展安装或更新时初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('扩展已安装/更新:', details.reason);
  
  if (details.reason === 'install') {
    // 首次安装，初始化默认规则（如果有）
    await applyRulesToDeclarativeNetRequest();
  } else if (details.reason === 'update') {
    // 更新时重新应用规则
    await applyRulesToDeclarativeNetRequest();
  }
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
