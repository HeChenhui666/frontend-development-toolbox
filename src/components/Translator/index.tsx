import React, { useState, useEffect } from 'react';
import {
  Select,
  Input,
  Button,
  Switch,
  Card,
  Space,
  Typography,
  Alert,
} from 'antd';
import {
  SwapOutlined,
  ClearOutlined,
  CopyOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 安全地访问嵌套数组
    if (data && Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0][0] && Array.isArray(data[0][0]) && data[0][0][0]) {
      return data[0][0][0];
    }
    
    throw new Error('翻译结果格式不正确');
  } catch (error) {
    console.error('翻译失败:', error);
    return null;
  }
}

// 页面内翻译开关的storage key
const PAGE_TRANSLATE_ENABLED_KEY = 'translator-page-translate-enabled';

// 获取页面内翻译开关状态
const getPageTranslateEnabled = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([PAGE_TRANSLATE_ENABLED_KEY], (result) => {
        const enabled = result[PAGE_TRANSLATE_ENABLED_KEY] !== false; // 默认开启
        resolve(enabled);
      });
    } else {
      // 降级到localStorage
      try {
        const saved = localStorage.getItem(PAGE_TRANSLATE_ENABLED_KEY);
        resolve(saved !== null ? saved === 'true' : true);
      } catch (error) {
        console.error('获取页面内翻译开关状态失败:', error);
        resolve(true);
      }
    }
  });
};

// 保存页面内翻译开关状态
const setPageTranslateEnabled = (enabled: boolean): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [PAGE_TRANSLATE_ENABLED_KEY]: enabled }, () => {
        resolve();
      });
    } else {
      // 降级到localStorage
      try {
        localStorage.setItem(PAGE_TRANSLATE_ENABLED_KEY, enabled.toString());
      } catch (error) {
        console.error('保存页面内翻译开关状态失败:', error);
      }
      resolve();
    }
  });
};

const Translator: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [pageTranslateEnabled, setPageTranslateEnabledState] = useState<boolean>(true);

  // 初始化时读取开关状态
  useEffect(() => {
    getPageTranslateEnabled().then((enabled) => {
      setPageTranslateEnabledState(enabled);
    });
  }, []);

  // 处理开关变化
  const handlePageTranslateToggle = async (checked: boolean) => {
    setPageTranslateEnabledState(checked);
    await setPageTranslateEnabled(checked);
    
    // 通知所有标签页的content script
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_PAGE_TRANSLATE',
              enabled: checked,
            }).catch(() => {
              // 忽略错误（可能是content script未加载）
            });
          }
        });
      });
    }
  };

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
    <div className="translator" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
      <Card size="small" title="翻译设置">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Text strong>目标语言</Text>
            <Select
              value={targetLang || 'en'}
              onChange={(value) => {
                if (value) {
                  setTargetLang(value);
                }
              }}
              style={{ width: '100%' }}
              size="small"
              options={languages
                .filter((lang) => lang.code && lang.name)
                .map((lang) => ({
                  value: lang.code,
                  label: lang.name,
                }))}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              使用免费版 Google 翻译服务
            </Text>
          </Space>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>页面内翻译</Text>
              <Switch
                checked={pageTranslateEnabled ?? true}
                onChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    handlePageTranslateToggle(checked);
                  }
                }}
                size="small"
              />
            </Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              开启后，在网页上选中文本时会显示翻译按钮
            </Text>
          </Space>
        </Space>
      </Card>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: '1 1 auto', minHeight: '300px' }}>
        {/* 上：输入文本区域 */}
        <Card 
          size="small" 
          title="输入文本" 
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
          bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '12px' }}
        >
          <Input.TextArea
            value={inputText || ''}
            onChange={(e) => {
              if (e && e.target) {
                setInputText(e.target.value || '');
              }
            }}
            placeholder="请输入要翻译的文本..."
            rows={12}
            style={{ resize: 'none', flex: 1 }}
          />
        </Card>

        {/* 中：翻译按钮 */}
        <Card size="small" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Space direction="horizontal" size="middle" style={{ width: '100%', justifyContent: 'center' }} wrap>
            <Button
              type="primary"
              icon={<TranslationOutlined />}
              onClick={handleTranslate}
              loading={isTranslating}
              style={{ width: '160px' }}
            >
              {isTranslating ? '翻译中...' : '翻译'}
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={handleSwap}
              disabled={!translatedText}
              style={{ width: '160px' }}
            >
              交换
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              style={{ width: '160px' }}
            >
              清空
            </Button>
          </Space>
        </Card>

        {/* 下：翻译结果区域 */}
        <Card 
          size="small" 
          title="翻译结果"
          extra={
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!translatedText}
              size="small"
              type="default"
            >
              {copySuccess ? '已复制' : '复制'}
            </Button>
          }
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}
          bodyStyle={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '12px' }}
        >
          <Input.TextArea
            value={translatedText || ''}
            readOnly
            placeholder="翻译结果将显示在这里..."
            rows={12}
            style={{ resize: 'none', flex: 1 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default Translator;
