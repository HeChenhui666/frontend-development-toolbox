import React, { useState, useEffect, useCallback } from 'react';
import { Select, Switch, Collapse, Tabs, Button, Input, Space, Typography, Popconfirm, List, message as antdMessage } from 'antd';
import { CheckOutlined, SwapOutlined, BookOutlined, DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;
import './index.css';
import { parseGoogleTranslateSingleResult } from '../../utils/parseGoogleTranslateResult';

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: '英语' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'es', name: '西班牙语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'ru', name: '俄语' },
  { code: 'ar', name: '阿拉伯语' },
  { code: 'it', name: '意大利语' },
  { code: 'nl', name: '荷兰语' },
  { code: 'pl', name: '波兰语' },
  { code: 'tr', name: '土耳其语' },
  { code: 'vi', name: '越南语' },
  { code: 'th', name: '泰语' },
  { code: 'hi', name: '印地语' },
];

async function translateText(text: string, targetLang: string = 'zh'): Promise<string | null> {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const translated = parseGoogleTranslateSingleResult(data);
    if (translated !== null) return translated;
    throw new Error('翻译结果格式不正确');
  } catch (error) {
    console.error('翻译失败:', error);
    return null;
  }
}

const PAGE_TRANSLATE_ENABLED_KEY = 'translator-page-translate-enabled';

const getPageTranslateEnabled = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([PAGE_TRANSLATE_ENABLED_KEY], (result) => {
        resolve(result[PAGE_TRANSLATE_ENABLED_KEY] !== false);
      });
    } else {
      try {
        const saved = localStorage.getItem(PAGE_TRANSLATE_ENABLED_KEY);
        resolve(saved !== null ? saved === 'true' : true);
      } catch {
        resolve(true);
      }
    }
  });

const setPageTranslateEnabled = (enabled: boolean): Promise<void> =>
  new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [PAGE_TRANSLATE_ENABLED_KEY]: enabled }, () => resolve());
    } else {
      try {
        localStorage.setItem(PAGE_TRANSLATE_ENABLED_KEY, enabled.toString());
      } catch {
        /* ignore */
      }
      resolve();
    }
  });

const Translator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [pageTranslateEnabled, setPageTranslateEnabledState] = useState(true);

  useEffect(() => {
    getPageTranslateEnabled().then((enabled) => setPageTranslateEnabledState(enabled));
  }, []);

  const handlePageTranslateToggle = async (checked: boolean) => {
    setPageTranslateEnabledState(checked);
    await setPageTranslateEnabled(checked);
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PAGE_TRANSLATE', enabled: checked }).catch(() => {});
          }
        });
      });
    }
  };

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) { setError('请输入要翻译的文本'); return; }
    setIsTranslating(true);
    setError('');
    try {
      const result = await translateText(inputText, targetLang);
      if (result) setTranslatedText(result);
      else setError('翻译失败，请稍后重试');
    } catch (err) {
      setError(`翻译出错: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsTranslating(false);
    }
  }, [inputText, targetLang]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleTranslate();
    }
  }, [handleTranslate]);

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = translatedText;
      el.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (e) {
        console.error('复制失败:', e);
      }
      document.body.removeChild(el);
    }
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setError('');
  };

  const handleSwap = () => {
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText('');
    }
  };

  const targetLangName = languages.find((l) => l.code === targetLang)?.name ?? targetLang;

  return (
    <div className="translator">
      {/* 语言栏 */}
      <div className="tl-lang-bar">
        <div className="tl-lang-row">
          <span className="tl-lang-auto">自动检测</span>
          <button className="tl-swap-btn" onClick={handleSwap} disabled={!translatedText} title="互换文本">
            <SwapOutlined className="tl-swap-icon" />
          </button>
          <Select
            value={targetLang}
            onChange={(v) => setTargetLang(v)}
            size="small"
            style={{ width: 90 }}
            options={languages.map((l) => ({ value: l.code, label: l.name }))}
            className="tl-lang-select"
          />
        </div>
        <div className="tl-page-row">
          <span className="tl-label">页面翻译</span>
          <Switch
            checked={pageTranslateEnabled}
            onChange={(checked) => handlePageTranslateToggle(checked)}
            size="small"
          />
        </div>
      </div>

      {error && (
        <div className="tl-error" onClick={() => setError('')}>
          {error}
          <span className="tl-error-close">✕</span>
        </div>
      )}

      {/* 输入区 */}
      <div className="tl-input-section">
        <div className="tl-section-header">
          <span className="tl-section-label">原文</span>
          <span className="tl-char-count">{inputText.length}</span>
        </div>
        <textarea
          className="tl-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入要翻译的文本…"
          rows={5}
        />
      </div>

      {/* 操作栏 */}
      <div className="tl-action-bar">
        <button className="tl-translate-btn" onClick={handleTranslate} disabled={isTranslating}>
          {isTranslating && <span className="tl-spinner" />}
          {isTranslating ? '翻译中…' : '翻译'}
        </button>
        <button className="tl-ghost-btn" onClick={handleClear} disabled={!inputText && !translatedText}>
          清空
        </button>
        <span className="tl-shortcut-hint">⌘↵</span>
      </div>

      {/* 输出区 */}
      <div className="tl-output-section">
        <div className="tl-section-header">
          <span className="tl-section-label">{targetLangName}</span>
          {translatedText && (
            <button className="tl-copy-btn" onClick={handleCopy}>
              {copySuccess ? <><CheckOutlined /> 已复制</> : '复制'}
            </button>
          )}
        </div>
        <div className="tl-output">
          {isTranslating ? (
            <div className="tl-skeleton">
              <div className="tl-skeleton-line tl-skeleton-line--80" />
              <div className="tl-skeleton-line tl-skeleton-line--60" />
              <div className="tl-skeleton-line tl-skeleton-line--70" />
            </div>
          ) : translatedText ? (
            <span>{translatedText}</span>
          ) : (
            <span className="tl-placeholder">翻译结果显示在此…</span>
          )}
        </div>
      </div>

      {/* 扩展工具 */}
      <TranslatorExtendedTools
        lastSource={inputText}
        lastTarget={translatedText}
        lastTargetLang={targetLang}
        onRestoreHistory={(source, target) => {
          setInputText(source);
          setTranslatedText(target);
        }}
      />
    </div>
  );
};

/* ─── 翻译扩展工具常量 ─── */
const GLOSSARY_STORAGE_KEY = 'translator_glossary';
const HISTORY_STORAGE_KEY = 'translator_history';
const MAX_HISTORY = 50;

interface GlossaryEntry {
  id: string;
  source: string;
  target: string;
}

interface TranslationHistoryItem {
  id: string;
  source: string;
  target: string;
  targetLang: string;
  timestamp: number;
}

const loadGlossary = (): GlossaryEntry[] => {
  try {
    const raw = localStorage.getItem(GLOSSARY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveGlossary = (entries: GlossaryEntry[]) => {
  try { localStorage.setItem(GLOSSARY_STORAGE_KEY, JSON.stringify(entries)); }
  catch { /* ignore */ }
};

const loadTranslationHistory = (): TranslationHistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveTranslationHistory = (items: TranslationHistoryItem[]) => {
  try { localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY))); }
  catch { /* ignore */ }
};

/* ─── 翻译扩展工具组件 ─── */
const TranslatorExtendedTools: React.FC<{
  lastSource: string;
  lastTarget: string;
  lastTargetLang: string;
  onRestoreHistory: (source: string, target: string) => void;
}> = ({ lastSource, lastTarget, lastTargetLang, onRestoreHistory }) => {
  // 术语表
  const [glossary, setGlossary] = useState<GlossaryEntry[]>(loadGlossary);
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState('');
  const [editTarget, setEditTarget] = useState('');

  // 历史
  const [history, setHistory] = useState<TranslationHistoryItem[]>(loadTranslationHistory);

  // 自动记录翻译历史
  useEffect(() => {
    if (lastSource.trim() && lastTarget.trim()) {
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.source !== lastSource);
        const newHistory = [
          { id: `${Date.now()}`, source: lastSource, target: lastTarget, targetLang: lastTargetLang, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_HISTORY);
        saveTranslationHistory(newHistory);
        return newHistory;
      });
    }
  }, [lastTarget]);

  const addGlossaryEntry = () => {
    if (!newSource.trim() || !newTarget.trim()) {
      antdMessage.warning('请填写原文和译文');
      return;
    }
    const exists = glossary.some((e) => e.source.toLowerCase() === newSource.trim().toLowerCase());
    if (exists) {
      antdMessage.warning('该术语已存在');
      return;
    }
    const entry: GlossaryEntry = { id: `${Date.now()}`, source: newSource.trim(), target: newTarget.trim() };
    const updated = [...glossary, entry];
    setGlossary(updated);
    saveGlossary(updated);
    setNewSource('');
    setNewTarget('');
    antdMessage.success('术语已添加');
  };

  const deleteGlossaryEntry = (id: string) => {
    const updated = glossary.filter((e) => e.id !== id);
    setGlossary(updated);
    saveGlossary(updated);
  };

  const startEditing = (entry: GlossaryEntry) => {
    setEditingId(entry.id);
    setEditSource(entry.source);
    setEditTarget(entry.target);
  };

  const saveEditing = () => {
    if (!editSource.trim() || !editTarget.trim()) return;
    const updated = glossary.map((e) =>
      e.id === editingId ? { ...e, source: editSource.trim(), target: editTarget.trim() } : e
    );
    setGlossary(updated);
    saveGlossary(updated);
    setEditingId(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    antdMessage.success('翻译历史已清空');
  };

  const glossaryTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <Input
          value={newSource}
          onChange={(e) => setNewSource(e.target.value)}
          placeholder="原文术语"
          size="small"
          style={{ flex: 1 }}
        />
        <Input
          value={newTarget}
          onChange={(e) => setNewTarget(e.target.value)}
          placeholder="期望译文"
          size="small"
          style={{ flex: 1 }}
          onPressEnter={addGlossaryEntry}
        />
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={addGlossaryEntry} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>
        添加技术术语映射，避免翻译引擎错误翻译（如 component → 组件 而非 零件）
      </div>
      {glossary.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 11 }}>暂无术语，点击 + 添加</Text>
      ) : (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          <List
            size="small"
            dataSource={glossary}
            renderItem={(entry) => (
              <List.Item
                style={{ padding: '3px 0' }}
                actions={[
                  <Button key="edit" size="small" type="text" icon={<EditOutlined />} onClick={() => startEditing(entry)} />,
                  <Popconfirm key="del" title="删除此术语？" onConfirm={() => deleteGlossaryEntry(entry.id)} okText="确认" cancelText="取消">
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                {editingId === entry.id ? (
                  <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                    <Input size="small" value={editSource} onChange={(e) => setEditSource(e.target.value)} style={{ flex: 1 }} />
                    <Input size="small" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} style={{ flex: 1 }} onPressEnter={saveEditing} />
                    <Button size="small" type="primary" onClick={saveEditing}>保存</Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
                    <code style={{ padding: '1px 4px', background: 'var(--theme-surfaceElevated)', borderRadius: 2 }}>{entry.source}</code>
                    <span style={{ color: 'var(--theme-textMuted)' }}>→</span>
                    <span style={{ fontWeight: 600 }}>{entry.target}</span>
                  </div>
                )}
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );

  const historyTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {history.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 11 }}>暂无翻译历史</Text>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Popconfirm title="清空所有翻译历史？" onConfirm={clearHistory} okText="确认" cancelText="取消">
              <Button size="small" danger type="text" icon={<DeleteOutlined />}>清空</Button>
            </Popconfirm>
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            <List
              size="small"
              dataSource={history}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '4px 0', cursor: 'pointer' }}
                  onClick={() => onRestoreHistory(item.source, item.target)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, width: '100%' }}>
                    <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.source}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--theme-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      → {item.target}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--theme-textMuted)' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <Collapse
      size="small"
      items={[{
        key: 'extended',
        label: <Space size={4}><BookOutlined /><span style={{ fontSize: 12 }}>翻译工具箱</span></Space>,
        children: (
          <Tabs
            size="small"
            items={[
              { key: 'glossary', label: `术语表(${glossary.length})`, children: glossaryTab },
              { key: 'history', label: `历史(${history.length})`, children: historyTab },
            ]}
            style={{ marginTop: -8 }}
          />
        ),
      }]}
    />
  );
};

export default Translator;
