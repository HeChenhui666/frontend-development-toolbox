/** 局域网聊天相关偏好（localStorage），与消息页、设置页共用 */

export const CHAT_PREFS_CHANGED_EVENT = 'lanChatPreferencesChanged' as const;

export function notifyChatPreferencesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CHAT_PREFS_CHANGED_EVENT));
}

/** 与客户端/中继 sanitize 规则一致，用于比较「当前是否已在目标房间」 */
export function sanitizeRelayRoomId(room: string): string {
  return String(room || '')
    .trim()
    .slice(0, 64)
    .replace(/[^\w\u4e00-\u9fff-]/g, '-') || 'default';
}

export const CHAT_LS_WS_URL = 'lan-chat-ws-url';

const LS_AUTO_CONNECT = 'lan-chat-auto-connect';
const LS_SAVE_CHAT_HISTORY = 'lan-chat-save-history';
const LS_AUTO_JOIN_PUBLIC = 'lan-chat-auto-join-public';
const LS_PUBLIC_ROOM = 'lan-chat-public-room-id';
const LS_PUBLIC_PASS = 'lan-chat-public-room-pass';

export const DEFAULT_PUBLIC_ROOM_ID = 'public';
export const DEFAULT_PUBLIC_ROOM_PASS = '88888888';

export function getChatAutoConnect(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(LS_AUTO_CONNECT) === '1';
}

export function setChatAutoConnect(value: boolean): void {
  try {
    window.localStorage.setItem(LS_AUTO_CONNECT, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** 是否把解密后的聊天记录写入本机；默认开启 */
export function getChatSaveHistoryEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const v = window.localStorage.getItem(LS_SAVE_CHAT_HISTORY);
  if (v === null) return true;
  return v === '1';
}

export function setChatSaveHistoryEnabled(value: boolean): void {
  try {
    window.localStorage.setItem(LS_SAVE_CHAT_HISTORY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function getChatAutoJoinPublic(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(LS_AUTO_JOIN_PUBLIC) === '1';
}

export function setChatAutoJoinPublic(value: boolean): void {
  try {
    window.localStorage.setItem(LS_AUTO_JOIN_PUBLIC, value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function getChatPublicRoomId(): string {
  if (typeof window === 'undefined') return DEFAULT_PUBLIC_ROOM_ID;
  const v = window.localStorage.getItem(LS_PUBLIC_ROOM);
  return v != null && v.trim() !== '' ? v.trim() : DEFAULT_PUBLIC_ROOM_ID;
}

export function setChatPublicRoomId(value: string): void {
  try {
    window.localStorage.setItem(LS_PUBLIC_ROOM, value.trim());
  } catch {
    /* ignore */
  }
}

export function getChatPublicRoomPassphrase(): string {
  if (typeof window === 'undefined') return DEFAULT_PUBLIC_ROOM_PASS;
  const v = window.localStorage.getItem(LS_PUBLIC_PASS);
  return v != null && v !== '' ? v : DEFAULT_PUBLIC_ROOM_PASS;
}

export function setChatPublicRoomPassphrase(value: string): void {
  try {
    window.localStorage.setItem(LS_PUBLIC_PASS, value);
  } catch {
    /* ignore */
  }
}
