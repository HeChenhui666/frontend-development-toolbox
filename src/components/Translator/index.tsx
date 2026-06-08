import React, { useState, useEffect, useCallback } from 'react';
import { Select, Switch } from 'antd';
import { CheckOutlined, SwapOutlined } from '@ant-design/icons';
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
    </div>
  );
};

export default Translator;
