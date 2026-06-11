import React, { useState, useCallback } from 'react';
import { Button, Input, List, Typography, Popconfirm, Tag, message as antdMessage } from 'antd';
import { CopyOutlined, DeleteOutlined, SearchOutlined, ClearOutlined, PlusOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;
const { TextArea } = Input;

const STORAGE_KEY = 'memo_notes';
const MAX_NOTES = 100;

interface MemoEntry {
  id: string;
  content: string;
  timestamp: number;
  pinned: boolean;
}

const loadNotes = (): MemoEntry[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

const saveNotes = (entries: MemoEntry[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
  catch { /* ignore */ }
};

const formatTime = (ts: number): string => {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return new Date(ts).toLocaleDateString();
};

const MemoNotes: React.FC = () => {
  const [entries, setEntries] = useState<MemoEntry[]>(loadNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState('');

  const addNote = useCallback(() => {
    if (!newNote.trim()) return;
    setEntries((prev) => {
      const entry: MemoEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        content: newNote.trim(),
        timestamp: Date.now(),
        pinned: false,
      };
      const updated = [entry, ...prev].slice(0, MAX_NOTES);
      saveNotes(updated);
      return updated;
    });
    setNewNote('');
    antdMessage.success('已保存');
  }, [newNote]);

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      antdMessage.success('已复制到剪贴板');
    } catch {
      antdMessage.error('复制失败');
    }
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      saveNotes(updated);
      return updated;
    });
  }, []);

  const togglePin = useCallback((id: string) => {
    setEntries((prev) => {
      const updated = prev.map((e) => e.id === id ? { ...e, pinned: !e.pinned } : e);
      updated.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.timestamp - a.timestamp;
      });
      saveNotes(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    const pinned = entries.filter((e) => e.pinned);
    setEntries(pinned);
    saveNotes(pinned);
    antdMessage.success(pinned.length > 0 ? `已清空（保留 ${pinned.length} 条置顶）` : '已清空');
  }, [entries]);

  const filteredEntries = searchTerm.trim()
    ? entries.filter((e) => e.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : entries;

  return (
    <div className="clipboard-history">
      {/* 新增备忘 */}
      <div className="ch-manual-add" style={{ flexDirection: 'column' }}>
        <TextArea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="记点什么... 支持多行文本"
          autoSize={{ minRows: 2, maxRows: 6 }}
          style={{ fontSize: 12 }}
        />
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addNote} block disabled={!newNote.trim()}>
          保存备忘
        </Button>
      </div>

      {/* 搜索和操作 */}
      <div className="ch-toolbar">
        <Input
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索备忘..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ flex: 1 }}
        />
        {entries.length > 0 && (
          <Popconfirm title="清空所有非置顶备忘？" onConfirm={clearAll} okText="确认" cancelText="取消">
            <Button size="small" danger icon={<ClearOutlined />} />
          </Popconfirm>
        )}
      </div>

      <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>
        共 {filteredEntries.length} 条备忘{searchTerm ? `（筛选自 ${entries.length} 条）` : ''}
      </Text>

      {/* 备忘列表 */}
      <div className="ch-list">
        {filteredEntries.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 11, textAlign: 'center', padding: 16 }}>
            {searchTerm ? '未找到匹配项' : '暂无备忘，在上方输入并保存'}
          </Text>
        ) : (
          <List
            size="small"
            dataSource={filteredEntries}
            renderItem={(entry) => (
              <List.Item
                className={`ch-item ${entry.pinned ? 'ch-item--pinned' : ''}`}
                actions={[
                  <Button key="pin" size="small" type="text" onClick={() => togglePin(entry.id)}>
                    {entry.pinned ? '📌' : '📎'}
                  </Button>,
                  <Button key="copy" size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(entry.content)} />,
                  <Popconfirm key="del" title="删除？" onConfirm={() => deleteEntry(entry.id)} okText="确认" cancelText="取消">
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <div className="ch-item-content">
                  <div className="ch-item-text">{entry.content.length > 150 ? entry.content.slice(0, 150) + '…' : entry.content}</div>
                  <div className="ch-item-meta">
                    <span>{formatTime(entry.timestamp)}</span>
                    <Tag style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>{entry.content.length} 字符</Tag>
                    {entry.pinned && <Tag color="orange" style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>置顶</Tag>}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default MemoNotes;
