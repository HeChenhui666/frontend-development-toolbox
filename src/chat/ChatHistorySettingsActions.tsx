import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Modal, Select, Space, Typography, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import {
  loadChatHistory,
  notifyChatHistoryStorageMayHaveChanged,
  saveChatHistory,
  clearStoredChatHistory,
} from './lan/chatHistoryStorage';
import { useLanRelayChatContext } from './LanRelayChatProvider';

const { Text } = Typography;

function ChatClearActiveWithContext() {
  const chat = useLanRelayChatContext();
  const handleClear = useCallback(() => {
    Modal.confirm({
      title: '清空当前会话？',
      content: '仅清空当前群聊或私聊在列表中的记录（与消息页「当前会话」一致）。',
      okText: '清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        chat.clearActiveLog();
        message.success('已清空当前会话');
      },
    });
  }, [chat]);

  return (
    <Button size="small" onClick={handleClear}>
      清空当前会话
    </Button>
  );
}

function ChatClearOneSessionSelect() {
  const [keys, setKeys] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | undefined>();

  const refreshKeys = useCallback(() => {
    const k = Object.keys(loadChatHistory());
    setKeys(k);
    setSelected((prev) => (prev && k.includes(prev) ? prev : undefined));
  }, []);

  useEffect(() => {
    refreshKeys();
  }, [refreshKeys]);

  const handleClear = useCallback(() => {
    if (!selected) {
      message.info('请选择要清空的会话');
      return;
    }
    Modal.confirm({
      title: `清空会话「${selected}」的本地记录？`,
      content: '不可恢复；若聊天窗口已打开，列表会随存储同步更新。',
      okText: '清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const data = { ...loadChatHistory() };
        delete data[selected];
        saveChatHistory(data);
        notifyChatHistoryStorageMayHaveChanged();
        refreshKeys();
        message.success('已清空该会话');
      },
    });
  }, [selected, refreshKeys]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        主窗口设置中无法获知「当前」会话，请从下列已存会话中选择后清空。
      </Text>
      <Space wrap style={{ width: '100%' }}>
        <Select
          size="small"
          style={{ minWidth: 220 }}
          placeholder="选择会话 key（如 g:public）"
          value={selected}
          onChange={setSelected}
          options={keys.map((k) => ({ label: k, value: k }))}
          allowClear
        />
        <Button size="small" onClick={handleClear} disabled={!keys.length}>
          清空所选会话
        </Button>
      </Space>
    </Space>
  );
}

export function ChatHistorySettingsActions({ chatRelayPanelInTab }: { chatRelayPanelInTab: boolean }) {
  const handleExport = useCallback(() => {
    const data = loadChatHistory();
    if (Object.keys(data).length === 0) {
      message.info('暂无聊天记录可导出');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lan-chat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('已导出 JSON 文件');
  }, []);

  const handleClearAll = useCallback(() => {
    Modal.confirm({
      title: '清空全部本地聊天记录？',
      content: '将删除本机保存的所有群聊/私聊记录，且不可恢复。',
      okText: '清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        clearStoredChatHistory();
        notifyChatHistoryStorageMayHaveChanged();
        message.success('已清空本地记录');
      },
    });
  }, []);

  return (
    <Card size="small" title="聊天记录">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Text type="secondary" style={{ fontSize: 12 }}>
          导出备份、按会话或全部清空本地存储；与消息页使用同一套数据。
        </Text>
        <Space wrap>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>
            导出全部记录
          </Button>
          <Button size="small" danger onClick={handleClearAll}>
            清空全部本地
          </Button>
        </Space>
        {chatRelayPanelInTab ? (
          <Space align="center" wrap>
            <Text style={{ fontSize: 12 }}>当前会话：</Text>
            <ChatClearActiveWithContext />
          </Space>
        ) : (
          <ChatClearOneSessionSelect />
        )}
      </Space>
    </Card>
  );
}
