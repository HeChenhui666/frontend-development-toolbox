import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanRelayChat } from './lan/useLanRelayChat';
import {
  CHAT_PREFS_CHANGED_EVENT,
  getChatAutoConnect,
  getChatAutoJoinPublic,
  getChatPublicRoomId,
  getChatPublicRoomPassphrase,
  sanitizeRelayRoomId,
} from '../utils/chatPreferences';

export type LanRelayChatContextValue = ReturnType<typeof useLanRelayChat>;

const LanRelayChatContext = createContext<LanRelayChatContextValue | null>(null);

export function LanRelayChatProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const chat = useLanRelayChat();
  const { setMessagesTabVisible, markActiveConversationRead } = chat;
  const autoConnectOnce = useRef(false);

  useEffect(() => {
    const onMessagesTab =
      location.pathname === '/messages' || location.pathname.endsWith('/messages');
    setMessagesTabVisible(onMessagesTab);
    if (onMessagesTab) {
      markActiveConversationRead();
    }
  }, [location.pathname, setMessagesTabVisible, markActiveConversationRead]);

  useEffect(() => {
    if (!getChatAutoConnect()) return;
    if (autoConnectOnce.current) return;
    autoConnectOnce.current = true;
    void chat.connect({ quiet: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chat.connection !== 'connected') return;
    if (!getChatAutoJoinPublic()) return;
    const target = sanitizeRelayRoomId(getChatPublicRoomId());
    if (chat.joinedRoomId === target) return;
    void chat.joinRoomWithCredentials(getChatPublicRoomId(), getChatPublicRoomPassphrase(), {
      quiet: true,
    });
  }, [chat.connection, chat.joinedRoomId, chat.joinRoomWithCredentials]);

  useEffect(() => {
    const onPrefs = () => {
      if (chat.connection !== 'connected' || !getChatAutoJoinPublic()) return;
      const target = sanitizeRelayRoomId(getChatPublicRoomId());
      if (chat.joinedRoomId === target) return;
      void chat.joinRoomWithCredentials(getChatPublicRoomId(), getChatPublicRoomPassphrase(), {
        quiet: true,
      });
    };
    window.addEventListener(CHAT_PREFS_CHANGED_EVENT, onPrefs);
    return () => window.removeEventListener(CHAT_PREFS_CHANGED_EVENT, onPrefs);
  }, [chat.connection, chat.joinedRoomId, chat.joinRoomWithCredentials]);

  return <LanRelayChatContext.Provider value={chat}>{children}</LanRelayChatContext.Provider>;
}

export function useLanRelayChatContext(): LanRelayChatContextValue {
  const v = useContext(LanRelayChatContext);
  if (!v) {
    throw new Error('useLanRelayChatContext 须在 LanRelayChatProvider 内使用');
  }
  return v;
}
