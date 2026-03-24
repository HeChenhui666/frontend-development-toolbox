/**
 * 局域网聊天：明文记录存本机 localStorage（与浏览器/扩展数据同源，勿存敏感场景请谨慎）。
 * 每个会话 key（如 g:public、d:peerId）单独一条数组，单会话最多保留 MAX_LINES_PER_KEY 条。
 */

export const CHAT_HISTORY_STORAGE_KEY = 'lan-chat-history-v1';

/** 同页设置里改写了聊天记录后通知消息页同步（storage 事件不会在写入的同一 document 触发） */
export const CHAT_HISTORY_RELOAD_EVENT = 'lanChatHistoryReloadFromStorage' as const;

export function notifyChatHistoryStorageMayHaveChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CHAT_HISTORY_RELOAD_EVENT));
}
export const CHAT_MAX_LINES_PER_KEY = 500;

export type StoredChatLine = {
  id: string;
  fromSelf: boolean;
  text: string;
  system?: boolean;
  fromId?: string;
};

export type LinesByKeyMap = Record<string, StoredChatLine[]>;

function isValidLine(x: unknown): x is StoredChatLine {
  if (x == null || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.fromSelf === 'boolean' && typeof o.text === 'string';
}

export function loadChatHistory(): LinesByKeyMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: LinesByKeyMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k !== 'string' || !Array.isArray(v)) continue;
      const lines = v.filter(isValidLine).slice(-CHAT_MAX_LINES_PER_KEY);
      if (lines.length > 0) out[k] = lines;
    }
    return out;
  } catch {
    return {};
  }
}

function trimMap(data: LinesByKeyMap): LinesByKeyMap {
  const trimmed: LinesByKeyMap = {};
  for (const [k, arr] of Object.entries(data)) {
    if (!Array.isArray(arr) || arr.length === 0) continue;
    trimmed[k] = arr.slice(-CHAT_MAX_LINES_PER_KEY);
  }
  return trimmed;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSaveChatHistory(data: LinesByKeyMap): void {
  if (typeof window === 'undefined') return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveChatHistory(data);
  }, 450);
}

export function saveChatHistory(data: LinesByKeyMap): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = trimMap(data);
    if (Object.keys(trimmed).length === 0) {
      window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[lan-chat] 保存聊天记录失败（可能超出配额）', e);
  }
}

export function clearStoredChatHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
