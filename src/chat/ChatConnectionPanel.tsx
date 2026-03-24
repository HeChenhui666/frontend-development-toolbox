import React from 'react';
import { Button, Input, Space, Typography } from 'antd';
import { LinkOutlined, LogoutOutlined } from '@ant-design/icons';
import { useLanRelayChatContext } from './LanRelayChatProvider';

const { Text } = Typography;

/**
 * 局域网中继：WebSocket、昵称、连接/断开
 *（群聊进房由下方「自动加入公共房间」等配置与逻辑完成）
 */
const ChatConnectionPanel: React.FC = () => {
  const chat = useLanRelayChatContext();
  const connected = chat.connection === 'connected';

  return (
    <div className="chat-settings-connection-panel" aria-label="局域网连接">
      <div className="chat-settings-connection-title">局域网连接</div>

      <div className="chat-relay-connect chat-relay-connect--settings">
        <Text type="secondary" className="chat-relay-label">
          WebSocket
        </Text>
        <Input
          value={chat.wsUrl}
          onChange={(e) => chat.setWsUrl(e.target.value)}
          placeholder="ws://192.168.x.x:8765"
          disabled={connected}
          size="small"
        />
        <Text type="secondary" className="chat-relay-label">
          显示昵称
        </Text>
        <Input
          value={chat.displayName}
          onChange={(e) => chat.setDisplayName(e.target.value)}
          placeholder="默认「访客」，可改；不写入持久缓存"
          size="small"
        />
        <Space size={8} wrap className="chat-relay-actions">
          {!connected ? (
            <Button
              type="primary"
              size="small"
              icon={<LinkOutlined />}
              loading={chat.connection === 'connecting'}
              onClick={() => void chat.connect()}
            >
              连接
            </Button>
          ) : (
            <Button size="small" danger icon={<LogoutOutlined />} onClick={chat.disconnect}>
              断开
            </Button>
          )}
        </Space>
        {chat.lastError && chat.connection === 'error' && (
          <Text type="danger" className="chat-relay-error">
            {chat.lastError}
          </Text>
        )}
      </div>
    </div>
  );
};

export default ChatConnectionPanel;
