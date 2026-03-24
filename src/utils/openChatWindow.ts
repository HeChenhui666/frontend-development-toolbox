/** 聊天浮窗尺寸（与产品约定一致时可在此调整） */
export const CHAT_WINDOW_WIDTH = 760;
export const CHAT_WINDOW_HEIGHT = 650;

const CHAT_HASH = '#/messages';

function getChatPageUrl(): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return `${chrome.runtime.getURL('chat.html')}${CHAT_HASH}`;
  }
  const { origin, pathname } = window.location;
  if (pathname.endsWith('index.html')) {
    return `${origin}${pathname.replace(/index\.html$/i, 'chat.html')}${CHAT_HASH}`;
  }
  return `${origin}/chat.html${CHAT_HASH}`;
}

/**
 * 在扩展环境中使用 popup 窗口打开聊天页；否则回退为 window.open。
 */
export function openChatWindow(): void {
  const url = getChatPageUrl();

  if (typeof chrome !== 'undefined' && chrome.windows?.create) {
    chrome.windows.create({
      url,
      type: 'popup',
      width: CHAT_WINDOW_WIDTH,
      height: CHAT_WINDOW_HEIGHT,
      focused: true,
    });
    return;
  }

  window.open(
    url,
    'toolbox-chat',
    `width=${CHAT_WINDOW_WIDTH},height=${CHAT_WINDOW_HEIGHT},scrollbars=yes,resizable=yes,noopener,noreferrer`
  );
}
