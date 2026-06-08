import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message as antdMessage } from 'antd';
import type { ClientToServer, ServerToClient } from './protocol';
import {
  decryptChatEnvelope,
  deriveDmAesKey,
  deriveRoomKey,
  encryptChatEnvelope,
  exportEcdhPublicSpki,
  generateEcdhKeyPair,
  importEcdhPeerPublic,
} from './crypto';
import {
  CHAT_LS_WS_URL,
  CHAT_PREFS_CHANGED_EVENT,
  getChatDisplayName,
  getChatSaveHistoryEnabled,
  setChatDisplayName,
} from '../../utils/chatPreferences';
import {
  CHAT_HISTORY_RELOAD_EVENT,
  CHAT_HISTORY_STORAGE_KEY,
  clearStoredChatHistory,
  loadChatHistory,
  scheduleSaveChatHistory,
  type LinesByKeyMap,
} from './chatHistoryStorage';

export type RelayChatLine = {
  id: string;
  fromSelf: boolean;
  text: string;
  system?: boolean;
  fromId?: string;
};

export type RelayPeer = { id: string; name: string; pub: string | null };

export type ActiveTarget = { kind: 'group' } | { kind: 'dm'; peerId: string };

function sanitizeRoom(room: string): string {
  return String(room || '')
    .trim()
    .slice(0, 64)
    .replace(/[^\w\u4e00-\u9fff-]/g, '-') || 'default';
}

export function logKeyGroup(room: string) {
  return `g:${room}`;
}

export function logKeyDm(peerId: string) {
  return `d:${peerId}`;
}

export function useLanRelayChat() {
  const [wsUrl, setWsUrlState] = useState(() => {
    if (typeof window === 'undefined') return 'ws://127.0.0.1:8765';
    return window.localStorage.getItem(CHAT_LS_WS_URL) || 'ws://127.0.0.1:8765';
  });
  const [displayName, setDisplayNameState] = useState(() =>
    typeof window === 'undefined' ? '访客' : getChatDisplayName()
  );

  const [connection, setConnection] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [peers, setPeers] = useState<Record<string, RelayPeer>>({});
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [roomPassDraft, setRoomPassDraft] = useState('');
  const [roomIdDraft, setRoomIdDraft] = useState('default');
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>({ kind: 'group' });
  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState(() => getChatSaveHistoryEnabled());
  const [linesByKey, setLinesByKey] = useState<Record<string, RelayChatLine[]>>(() => {
    const loaded = loadChatHistory();
    return loaded as Record<string, RelayChatLine[]>;
  });
  const [unreadByKey, setUnreadByKey] = useState<Record<string, number>>({});

  const messagesTabVisibleRef = useRef(false);
  const activeTargetRef = useRef<ActiveTarget>({ kind: 'group' });

  const wsRef = useRef<WebSocket | null>(null);
  const ecdhPrivateRef = useRef<CryptoKey | null>(null);
  const roomKeyRef = useRef<CryptoKey | null>(null);
  const joinedRoomRef = useRef<string | null>(null);
  const selfIdRef = useRef<string | null>(null);
  const peersRef = useRef<Record<string, RelayPeer>>({});
  const dmKeyCacheRef = useRef<Map<string, CryptoKey>>(new Map());
  const handlePayloadRef = useRef<(raw: string) => Promise<void>>(async () => {});
  const connectQuietRef = useRef(false);
  /** 连接成功后用于再次发送 hello 以同步改名 */
  const helloSpkiRef = useRef<string | null>(null);
  const renameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 防抖结束时取最新输入，避免快速输入时闭包仍是旧字符串 */
  const renameLatestRef = useRef<string>('');

  /** 与 state 同步，避免子组件在 useEffect 中读到上一帧会话（未读清除延迟、appendLine 误判） */
  joinedRoomRef.current = joinedRoomId;
  activeTargetRef.current = activeTarget;

  useEffect(() => {
    selfIdRef.current = selfId;
  }, [selfId]);
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  const setMessagesTabVisible = useCallback((visible: boolean) => {
    messagesTabVisibleRef.current = visible;
  }, []);

  const markConversationRead = useCallback((key: string) => {
    setUnreadByKey((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const markActiveConversationRead = useCallback(() => {
    const at = activeTargetRef.current;
    const jr = joinedRoomRef.current;
    let key: string | null = null;
    if (at.kind === 'group' && jr) key = logKeyGroup(jr);
    else if (at.kind === 'dm') key = logKeyDm(at.peerId);
    if (key) markConversationRead(key);
  }, [markConversationRead]);

  const setWsUrl = useCallback((v: string) => {
    setWsUrlState(v);
    try {
      window.localStorage.setItem(CHAT_LS_WS_URL, v);
    } catch {
      /* ignore */
    }
  }, []);

  const setDisplayName = useCallback((v: string) => {
    setDisplayNameState(v);
    renameLatestRef.current = v;
    const ws = wsRef.current;
    const spki = helloSpkiRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !spki) return;

    if (renameDebounceRef.current) clearTimeout(renameDebounceRef.current);
    renameDebounceRef.current = setTimeout(() => {
      renameDebounceRef.current = null;
      const name = renameLatestRef.current.trim() || '访客';
      setChatDisplayName(renameLatestRef.current);
      try {
        ws.send(JSON.stringify({ t: 'hello', name, pub: spki } satisfies ClientToServer));
      } catch {
        /* ignore */
      }
    }, 350);
  }, []);

  const appendLine = useCallback((key: string, line: Omit<RelayChatLine, 'id'>) => {
    let isActiveConversation = false;
    if (messagesTabVisibleRef.current) {
      const at = activeTargetRef.current;
      const jr = joinedRoomRef.current;
      if (key.startsWith('g:')) {
        const room = key.slice(2);
        isActiveConversation = at.kind === 'group' && jr === room;
      } else if (key.startsWith('d:')) {
        const pid = key.slice(2);
        isActiveConversation = at.kind === 'dm' && at.peerId === pid;
      }
    }
    const shouldCountUnread = !line.system && !line.fromSelf && !isActiveConversation;
    if (shouldCountUnread) {
      setUnreadByKey((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + 1,
      }));
    }
    setLinesByKey((prev) => {
      const next = { ...prev };
      const list = [...(next[key] || [])];
      list.push({
        ...line,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      });
      next[key] = list.length > 500 ? list.slice(-500) : list;
      return next;
    });
  }, []);

  const invalidateDmKeysForPeer = useCallback((leftId: string) => {
    const cache = dmKeyCacheRef.current;
    for (const k of [...cache.keys()]) {
      const parts = k.split('|');
      if (parts[0] === leftId || parts[1] === leftId) cache.delete(k);
    }
  }, []);

  const ensureDmKey = useCallback(async (peerId: string): Promise<CryptoKey | null> => {
    const priv = ecdhPrivateRef.current;
    const sid = selfIdRef.current;
    const peer = peersRef.current[peerId];
    if (!priv || !sid || !peer?.pub) return null;
    const cacheKey = [sid, peerId].sort().join('|');
    const cached = dmKeyCacheRef.current.get(cacheKey);
    if (cached) return cached;
    try {
      const peerPub = await importEcdhPeerPublic(peer.pub);
      const k = await deriveDmAesKey(priv, peerPub, sid, peerId);
      dmKeyCacheRef.current.set(cacheKey, k);
      return k;
    } catch {
      return null;
    }
  }, []);

  const teardownSocket = useCallback(() => {
    if (renameDebounceRef.current) {
      clearTimeout(renameDebounceRef.current);
      renameDebounceRef.current = null;
    }
    helloSpkiRef.current = null;
    try {
      wsRef.current?.close();
    } catch {
      /* ignore */
    }
    wsRef.current = null;
    ecdhPrivateRef.current = null;
    roomKeyRef.current = null;
    dmKeyCacheRef.current.clear();
    setSelfId(null);
    setPeers({});
    setJoinedRoomId(null);
    joinedRoomRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    teardownSocket();
    setConnection('idle');
    setLastError(null);
  }, [teardownSocket]);

  const handleServerPayload = useCallback(
    async (raw: string) => {
      let msg: ServerToClient;
      try {
        msg = JSON.parse(raw) as ServerToClient;
      } catch {
        return;
      }

      if (msg.t === 'welcome') {
        setSelfId(msg.id);
        return;
      }

      if (msg.t === 'peer') {
        const p = msg.peer;
        setPeers((prev) => ({
          ...prev,
          [p.id]: { id: p.id, name: p.name, pub: p.pub },
        }));
        return;
      }

      if (msg.t === 'peer_left') {
        invalidateDmKeysForPeer(msg.id);
        setPeers((prev) => {
          const next = { ...prev };
          delete next[msg.id];
          return next;
        });
        return;
      }

      if (msg.t === 'joined') {
        return;
      }

      if (msg.t === 'room') {
        const room = msg.room;
        if (room !== joinedRoomRef.current || !roomKeyRef.current) return;
        if (msg.from === selfIdRef.current) return;
        try {
          const env = await decryptChatEnvelope(roomKeyRef.current, msg.cipher);
          const sid = selfIdRef.current;
          appendLine(logKeyGroup(room), {
            fromSelf: msg.from === sid,
            text: env.text,
            fromId: msg.from,
          });
        } catch {
          appendLine(logKeyGroup(room), {
            fromSelf: false,
            text: '无法解密该条群消息（房间口令或房间名是否与发送方一致？）',
            system: true,
          });
        }
        return;
      }

      if (msg.t === 'dm') {
        const from = msg.from;
        const sid = selfIdRef.current;
        const priv = ecdhPrivateRef.current;
        if (!sid || !priv) return;
        const peerPubStr = peersRef.current[from]?.pub;
        if (!peerPubStr) {
          appendLine(logKeyDm(from), {
            fromSelf: false,
            text: '收到私聊密文，但尚无对方公钥缓存，请待对方在线后重试。',
            system: true,
          });
          return;
        }
        try {
          const peerPub = await importEcdhPeerPublic(peerPubStr);
          const k = await deriveDmAesKey(priv, peerPub, sid, from);
          const env = await decryptChatEnvelope(k, msg.cipher);
          appendLine(logKeyDm(from), {
            fromSelf: false,
            text: env.text,
            fromId: from,
          });
        } catch {
          appendLine(logKeyDm(from), {
            fromSelf: false,
            text: '无法解密私聊消息。',
            system: true,
          });
        }
      }
    },
    [appendLine, invalidateDmKeysForPeer]
  );

  handlePayloadRef.current = handleServerPayload;

  const connect = useCallback(async (options?: { quiet?: boolean }) => {
    const url = wsUrl.trim();
    if (!url) {
      antdMessage.warning('请填写 WebSocket 地址');
      return;
    }
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      setLastError('WebSocket 地址必须以 ws:// 或 wss:// 开头');
      antdMessage.warning('WebSocket 地址必须以 ws:// 或 wss:// 开头');
      return;
    }
    if (connection === 'connecting') return;

    connectQuietRef.current = !!options?.quiet;
    teardownSocket();
    setConnection('connecting');
    setLastError(null);

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      const m = e instanceof Error ? e.message : '无法创建连接';
      setLastError(m);
      setConnection('error');
      antdMessage.error(m);
      return;
    }

    wsRef.current = ws;

    ws.onopen = async () => {
      const quietConnect = connectQuietRef.current;
      try {
        const pair = await generateEcdhKeyPair();
        ecdhPrivateRef.current = pair.privateKey;
        const spki = await exportEcdhPublicSpki(pair.publicKey);
        helloSpkiRef.current = spki;
        const hello: ClientToServer = {
          t: 'hello',
          name: displayName.trim() || '访客',
          pub: spki,
        };
        ws.send(JSON.stringify(hello));
        setConnection('connected');
        if (!quietConnect) {
          antdMessage.info('已连接：请加入群聊房间或选择成员私聊（消息均为端到端加密）');
        }
      } catch (e) {
        helloSpkiRef.current = null;
        const m = e instanceof Error ? e.message : '初始化加密密钥失败';
        setLastError(m);
        setConnection('error');
        antdMessage.error(m);
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      }
    };

    ws.onmessage = (ev) => {
      const data = typeof ev.data === 'string' ? ev.data : '';
      if (!data) return;
      void handlePayloadRef.current(data);
    };

    ws.onerror = () => {
      setLastError('WebSocket 错误');
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        helloSpkiRef.current = null;
        if (renameDebounceRef.current) {
          clearTimeout(renameDebounceRef.current);
          renameDebounceRef.current = null;
        }
        wsRef.current = null;
        ecdhPrivateRef.current = null;
        roomKeyRef.current = null;
        dmKeyCacheRef.current.clear();
        setConnection('idle');
        setSelfId(null);
        setPeers({});
        setJoinedRoomId(null);
      }
    };
  }, [wsUrl, displayName, connection, teardownSocket]);

  const joinRoomWithCredentials = useCallback(
    async (roomIdInput: string, passphrase: string, options?: { quiet?: boolean }) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        if (!options?.quiet) antdMessage.warning('请先连接中继');
        return;
      }
      const pass = passphrase.trim();
      if (!pass) {
        if (!options?.quiet) antdMessage.warning('请填写房间口令（与群成员约定一致）');
        return;
      }
      const room = sanitizeRoom(roomIdInput);
      const prev = joinedRoomRef.current;
      if (prev && prev !== room) {
        ws.send(JSON.stringify({ t: 'leave', room: prev } satisfies ClientToServer));
      }
      try {
        const key = await deriveRoomKey(room, pass);
        roomKeyRef.current = key;
        joinedRoomRef.current = room;
        ws.send(JSON.stringify({ t: 'join', room } satisfies ClientToServer));
        setJoinedRoomId(room);
        setRoomIdDraft(room);
        setRoomPassDraft(pass);
        setActiveTarget({ kind: 'group' });
        if (options?.quiet) {
          appendLine(logKeyGroup(room), {
            fromSelf: false,
            text: `已根据设置自动加入房间「${room}」。`,
            system: true,
          });
        } else {
          appendLine(logKeyGroup(room), {
            fromSelf: false,
            text: `已加入房间「${room}」，群消息使用 AES-GCM 加密后由中继转发（中继无法读取明文）。`,
            system: true,
          });
          antdMessage.success('已加入群聊房间');
        }
      } catch (e) {
        const m = e instanceof Error ? e.message : '加入房间失败';
        antdMessage.error(m);
      }
    },
    [appendLine]
  );

  const joinRoom = useCallback(async () => {
    await joinRoomWithCredentials(roomIdDraft, roomPassDraft);
  }, [roomIdDraft, roomPassDraft, joinRoomWithCredentials]);

  const leaveRoom = useCallback(() => {
    const ws = wsRef.current;
    const room = joinedRoomRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && room) {
      ws.send(JSON.stringify({ t: 'leave', room } satisfies ClientToServer));
    }
    roomKeyRef.current = null;
    joinedRoomRef.current = null;
    setJoinedRoomId(null);
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        antdMessage.warning('未连接');
        return;
      }
      const t = text.trim();
      if (!t) return;

      if (activeTarget.kind === 'group') {
        const room = joinedRoomId;
        const rk = roomKeyRef.current;
        if (!room || !rk) {
          antdMessage.warning('请先加入群聊房间');
          return;
        }
        const cipher = await encryptChatEnvelope(rk, t);
        ws.send(JSON.stringify({ t: 'room', room, cipher } satisfies ClientToServer));
        appendLine(logKeyGroup(room), { fromSelf: true, text: t });
        return;
      }

      const peerId = activeTarget.peerId;
      const k = await ensureDmKey(peerId);
      if (!k) {
        antdMessage.warning('无法与对方建立私聊密钥（需双方在线且已交换公钥）');
        return;
      }
      const cipher = await encryptChatEnvelope(k, t);
      ws.send(JSON.stringify({ t: 'dm', to: peerId, cipher } satisfies ClientToServer));
      appendLine(logKeyDm(peerId), { fromSelf: true, text: t });
    },
    [activeTarget, joinedRoomId, appendLine, ensureDmKey]
  );

  const clearActiveLog = useCallback(() => {
    const key =
      activeTarget.kind === 'group' && joinedRoomId
        ? logKeyGroup(joinedRoomId)
        : activeTarget.kind === 'dm'
          ? logKeyDm(activeTarget.peerId)
          : null;
    if (!key) return;
    setUnreadByKey((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setLinesByKey((prev) => ({ ...prev, [key]: [] }));
  }, [activeTarget, joinedRoomId]);

  const clearAllLocalChatHistory = useCallback(() => {
    setLinesByKey({});
    setUnreadByKey({});
    clearStoredChatHistory();
  }, []);

  const activeLines: RelayChatLine[] =
    activeTarget.kind === 'group' && joinedRoomId
      ? linesByKey[logKeyGroup(joinedRoomId)] || []
      : activeTarget.kind === 'dm'
        ? linesByKey[logKeyDm(activeTarget.peerId)] || []
        : [];

  const peerList = Object.values(peers).filter((p) => p.id !== selfId);

  const totalUnread = useMemo(
    () => Object.values(unreadByKey).reduce((a, n) => a + n, 0),
    [unreadByKey]
  );

  useEffect(() => () => teardownSocket(), [teardownSocket]);

  useEffect(() => {
    const onPrefs = () => {
      try {
        const u = window.localStorage.getItem(CHAT_LS_WS_URL);
        if (u != null) setWsUrlState(u);
      } catch {
        /* ignore */
      }
      setSaveHistoryEnabled(getChatSaveHistoryEnabled());
      const nextName = getChatDisplayName();
      setDisplayNameState(nextName);
      renameLatestRef.current = nextName;
    };
    window.addEventListener(CHAT_PREFS_CHANGED_EVENT, onPrefs);
    return () => window.removeEventListener(CHAT_PREFS_CHANGED_EVENT, onPrefs);
  }, []);

  useEffect(() => {
    if (!saveHistoryEnabled) return;
    scheduleSaveChatHistory(linesByKey as LinesByKeyMap);
  }, [linesByKey, saveHistoryEnabled]);

  useEffect(() => {
    const syncFromStorage = () => {
      setLinesByKey(loadChatHistory() as Record<string, RelayChatLine[]>);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key !== CHAT_HISTORY_STORAGE_KEY) return;
      syncFromStorage();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(CHAT_HISTORY_RELOAD_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CHAT_HISTORY_RELOAD_EVENT, syncFromStorage);
    };
  }, []);

  return {
    wsUrl,
    setWsUrl,
    displayName,
    setDisplayName,
    connection,
    lastError,
    selfId,
    peers,
    peerList,
    joinedRoomId,
    roomIdDraft,
    setRoomIdDraft,
    roomPassDraft,
    setRoomPassDraft,
    activeTarget,
    setActiveTarget,
    activeLines,
    linesByKey,
    saveHistoryEnabled,
    clearAllLocalChatHistory,
    connect,
    disconnect,
    joinRoom,
    joinRoomWithCredentials,
    leaveRoom,
    sendText,
    clearActiveLog,
    unreadByKey,
    totalUnread,
    markConversationRead,
    markActiveConversationRead,
    setMessagesTabVisible,
  };
}
