import React, { useMemo } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Badge } from 'antd';
import { useLanRelayChatContext } from './LanRelayChatProvider';

const ChatShell: React.FC = () => {
  const location = useLocation();
  const chat = useLanRelayChatContext();
  const onMessagesTab = useMemo(
    () => location.pathname === '/messages' || location.pathname.endsWith('/messages'),
    [location.pathname]
  );
  const messagesRailCount = !onMessagesTab && chat.totalUnread > 0 ? chat.totalUnread : 0;

  return (
    <div className="chat-app">
      <aside className="chat-app-rail" aria-label="聊天室主导航">
        <NavLink
          to="/messages"
          className={({ isActive }) => `chat-rail-item${isActive ? ' chat-rail-item--active' : ''}`}
        >
          <Badge count={messagesRailCount} size="small" overflowCount={99} offset={[-4, 2]}>
            <span className="chat-rail-item-badge-wrap">
              <span className="chat-rail-icon" aria-hidden>
                💬
              </span>
              <span className="chat-rail-label">消息</span>
            </span>
          </Badge>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `chat-rail-item${isActive ? ' chat-rail-item--active' : ''}`}
        >
          <span className="chat-rail-icon" aria-hidden>
            👤
          </span>
          <span className="chat-rail-label">我的</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `chat-rail-item${isActive ? ' chat-rail-item--active' : ''}`}
        >
          <span className="chat-rail-icon" aria-hidden>
            ⚙️
          </span>
          <span className="chat-rail-label">设置</span>
        </NavLink>
      </aside>
      <main className="chat-app-body">
        <Outlet />
      </main>
    </div>
  );
};

export default ChatShell;
