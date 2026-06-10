import React, { useState, useCallback, useEffect } from 'react';
import { Input, Button, Space, Typography, List, Tag, Popconfirm, Tabs, Modal, message as antdMessage } from 'antd';
import { ReloadOutlined, DeleteOutlined, CopyOutlined, EditOutlined, PlusOutlined, SearchOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;
const { TextArea } = Input;

interface StorageEntry {
  key: string;
  value: string;
  size: number;
  type: 'local' | 'session';
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

const getStorageEntries = (storage: Storage, type: 'local' | 'session'): StorageEntry[] => {
  const entries: StorageEntry[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key === null) continue;
      const value = storage.getItem(key) || '';
      entries.push({
        key,
        value,
        size: new Blob([key + value]).size,
        type,
      });
    }
  } catch { /* storage access denied */ }
  return entries.sort((a, b) => a.key.localeCompare(b.key));
};

const isJsonString = (str: string): boolean => {
  try { JSON.parse(str); return true; }
  catch { return false; }
};

const formatValue = (value: string, maxLength: number = 80): string => {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + '…';
};

const StorageManager: React.FC = () => {
  const [localEntries, setLocalEntries] = useState<StorageEntry[]>([]);
  const [sessionEntries, setSessionEntries] = useState<StorageEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editEntry, setEditEntry] = useState<StorageEntry | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [activeTab, setActiveTab] = useState<'local' | 'session'>('local');

  const loadEntries = useCallback(() => {
    // 在扩展环境中需要通过 content script 注入获取页面 Storage
    // 先尝试直接访问（standalone/popup 模式下访问的是扩展自身的 Storage）
    setLocalEntries(getStorageEntries(localStorage, 'local'));
    try {
      setSessionEntries(getStorageEntries(sessionStorage, 'session'));
    } catch {
      setSessionEntries([]);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const currentEntries = activeTab === 'local' ? localEntries : sessionEntries;
  const currentStorage = activeTab === 'local' ? localStorage : sessionStorage;

  const filteredEntries = searchTerm.trim()
    ? currentEntries.filter((e) => e.key.toLowerCase().includes(searchTerm.toLowerCase()) || e.value.toLowerCase().includes(searchTerm.toLowerCase()))
    : currentEntries;

  const totalSize = currentEntries.reduce((sum, e) => sum + e.size, 0);

  const deleteEntry = (key: string) => {
    try {
      currentStorage.removeItem(key);
      loadEntries();
      antdMessage.success(`已删除 "${key}"`);
    } catch {
      antdMessage.error('删除失败');
    }
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      antdMessage.success('已复制');
    } catch {
      antdMessage.error('复制失败');
    }
  };

  const startEdit = (entry: StorageEntry) => {
    setEditEntry(entry);
    if (isJsonString(entry.value)) {
      try { setEditValue(JSON.stringify(JSON.parse(entry.value), null, 2)); }
      catch { setEditValue(entry.value); }
    } else {
      setEditValue(entry.value);
    }
  };

  const saveEdit = () => {
    if (!editEntry) return;
    try {
      currentStorage.setItem(editEntry.key, editValue);
      loadEntries();
      setEditEntry(null);
      antdMessage.success('已保存');
    } catch (err) {
      antdMessage.error('保存失败，可能是存储空间已满');
    }
  };

  const addEntry = () => {
    if (!newKey.trim()) { antdMessage.warning('请输入 Key'); return; }
    try {
      currentStorage.setItem(newKey.trim(), newValue);
      loadEntries();
      setNewKey('');
      setNewValue('');
      antdMessage.success('已添加');
    } catch {
      antdMessage.error('添加失败');
    }
  };

  const clearAllStorage = () => {
    try {
      currentStorage.clear();
      loadEntries();
      antdMessage.success(`${activeTab === 'local' ? 'LocalStorage' : 'SessionStorage'} 已清空`);
    } catch {
      antdMessage.error('清空失败');
    }
  };

  const exportStorage = () => {
    const data: Record<string, string> = {};
    currentEntries.forEach((e) => { data[e.key] = e.value; });
    const jsonStr = JSON.stringify(data, null, 2);
    navigator.clipboard?.writeText(jsonStr).then(() => antdMessage.success('已复制到剪贴板'));
  };

  const downloadStorage = () => {
    const data: Record<string, string> = {};
    currentEntries.forEach((e) => { data[e.key] = e.value; });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `${activeTab}_storage_${new Date().toISOString().slice(0, 10)}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importStorage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (typeof data !== 'object' || data === null) {
          antdMessage.error('JSON 格式错误，需要一个对象');
          return;
        }
        let count = 0;
        for (const [key, value] of Object.entries(data)) {
          currentStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          count++;
        }
        loadEntries();
        antdMessage.success(`成功导入 ${count} 条数据`);
      } catch {
        antdMessage.error('导入失败，请检查文件格式');
      }
    };
    input.click();
  };

  const renderEntryList = () => (
    <div className="sm-entry-list">
      {filteredEntries.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 11, padding: 8 }}>
          {searchTerm ? '未找到匹配的条目' : '暂无数据'}
        </Text>
      ) : (
        <List
          size="small"
          dataSource={filteredEntries}
          renderItem={(entry) => (
            <List.Item
              className="sm-entry-item"
              actions={[
                <Button key="copy" size="small" type="text" icon={<CopyOutlined />} onClick={() => copyValue(entry.value)} />,
                <Button key="edit" size="small" type="text" icon={<EditOutlined />} onClick={() => startEdit(entry)} />,
                <Popconfirm key="del" title={`删除 "${entry.key}"？`} onConfirm={() => deleteEntry(entry.key)} okText="确认" cancelText="取消">
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>,
              ]}
            >
              <div className="sm-entry-content">
                <div className="sm-entry-key">
                  <code>{entry.key}</code>
                  <Tag style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>{formatSize(entry.size)}</Tag>
                  {isJsonString(entry.value) && <Tag color="blue" style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>JSON</Tag>}
                </div>
                <div className="sm-entry-value">{formatValue(entry.value)}</div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <div className="storage-manager">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'local' | 'session')}
        size="small"
        items={[
          { key: 'local', label: `LocalStorage (${localEntries.length})` },
          { key: 'session', label: `SessionStorage (${sessionEntries.length})` },
        ]}
      />

      {/* 工具栏 */}
      <div className="sm-toolbar">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索 Key 或 Value"
          size="small"
          prefix={<SearchOutlined />}
          allowClear
          style={{ flex: 1 }}
        />
        <Button size="small" icon={<ReloadOutlined />} onClick={loadEntries} title="刷新" />
      </div>

      {/* 统计 */}
      <div className="sm-stats">
        <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>
          共 {filteredEntries.length} 条{searchTerm ? `（筛选自 ${currentEntries.length} 条）` : ''} · 总大小 {formatSize(totalSize)}
        </Text>
        <Space size={4}>
          <Button size="small" type="text" icon={<DownloadOutlined />} onClick={downloadStorage} title="下载" />
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={exportStorage} title="复制 JSON" />
          <Button size="small" type="text" icon={<UploadOutlined />} onClick={importStorage} title="导入" />
          {currentEntries.length > 0 && (
            <Popconfirm title={`清空所有 ${activeTab === 'local' ? 'LocalStorage' : 'SessionStorage'}？`} onConfirm={clearAllStorage} okText="确认" cancelText="取消">
              <Button size="small" type="text" danger icon={<DeleteOutlined />} title="清空" />
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* 新增条目 */}
      <div className="sm-add-row">
        <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Key" size="small" style={{ flex: 1 }} />
        <Input value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value" size="small" style={{ flex: 2 }} onPressEnter={addEntry} />
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addEntry} />
      </div>

      {/* 条目列表 */}
      {renderEntryList()}

      {/* 编辑弹窗 */}
      <Modal
        open={!!editEntry}
        title={`编辑: ${editEntry?.key}`}
        onCancel={() => setEditEntry(null)}
        onOk={saveEdit}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <TextArea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          rows={10}
          style={{ fontFamily: 'monospace', fontSize: 11 }}
        />
      </Modal>
    </div>
  );
};

export default StorageManager;
