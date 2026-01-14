import React, { useState } from 'react';
import { Select, Button } from 'antd';
import './index.css';

// 支持的语言列表
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

// 翻译API函数
async function translateText(text: string, targetLang: string = 'zh'): Promise<string | null> {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {
    console.error('翻译失败:', error);
    return null;
  }
}

const Translator: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // 执行翻译
  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('请输入要翻译的文本');
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      const result = await translateText(inputText, targetLang);
      if (result) {
        setTranslatedText(result);
      } else {
        setError('翻译失败，请稍后重试');
      }
    } catch (err) {
      setError(`翻译出错: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // 复制翻译结果到剪贴板
  const handleCopy = async () => {
    if (!translatedText) return;

    try {
      await navigator.clipboard.writeText(translatedText);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = translatedText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      } catch (e) {
        console.error('复制失败:', e);
      }
      document.body.removeChild(textArea);
    }
  };

  // 清空所有内容
  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setError('');
  };

  // 交换输入和输出（复制翻译结果到输入框）
  const handleSwap = () => {
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText('');
    }
  };

  return (
    <div className="translator">
      {/* 目标语言选择 */}
      <div className="language-section">
        <div className="section-header">
          <label>目标语言：</label>
        </div>
        <Select
          value={targetLang}
          onChange={setTargetLang}
          className="language-select"
          size="small"
          options={languages.map((lang) => ({
            value: lang.code,
            label: lang.name,
          }))}
        />
        <div className="service-notice">
          <span className="service-notice-text">使用免费版 Google 翻译服务</span>
        </div>
      </div>

      {/* 错误提示 */}
      {error && <div className="error">{error}</div>}

      {/* 主内容区域：左中右布局 */}
      <div className="main-content">
        {/* 左侧：输入文本区域 */}
        <div className="input-section">
          <div className="section-header">
            <label>输入文本：</label>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入要翻译的文本..."
            className="input-textarea"
          />
        </div>

        {/* 中间：翻译按钮 */}
        <div className="button-center">
          <Button
            type="primary"
            onClick={handleTranslate}
            loading={isTranslating}
            className="translate-btn"
            size="small"
          >
            {isTranslating ? '翻译中...' : '翻译'}
          </Button>
          <div className="secondary-actions">
            <Button onClick={handleSwap} className="swap-btn" size="small" disabled={!translatedText}>
              交换
            </Button>
            <Button onClick={handleClear} className="clear-btn" size="small">
              清空
            </Button>
          </div>
        </div>

        {/* 右侧：翻译结果区域 */}
        <div className="output-section">
          <div className="section-header">
            <label>翻译结果：</label>
            <Button
              onClick={handleCopy}
              disabled={!translatedText}
              className="copy-btn"
              size="small"
              title="复制翻译结果"
            >
              <span className="copy-btn-text">{copySuccess ? '✓ 已复制' : '📋 复制'}</span>
            </Button>
          </div>
          <div className="output-textarea">
            {translatedText || <span className="placeholder-text">翻译结果将显示在这里...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translator;
