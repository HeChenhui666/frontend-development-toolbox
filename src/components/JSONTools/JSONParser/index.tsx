import React, { useState } from 'react';
import './index.css';
import { showMessage } from '../../../utils/message';

const JSONParser: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>('');
  const [outputJson, setOutputJson] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<'format' | 'minify' | 'escape' | 'unescape'>('format');

  // 格式化JSON
  const formatJSON = (json: string): string => {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch (err) {
      throw new Error('无效的JSON格式');
    }
  };

  // 压缩JSON
  const minifyJSON = (json: string): string => {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed);
    } catch (err) {
      throw new Error('无效的JSON格式');
    }
  };

  // 转义JSON
  const escapeJSON = (json: string): string => {
    return JSON.stringify(json);
  };

  // 去转义JSON
  const unescapeJSON = (json: string): string => {
    try {
      const parsed = JSON.parse(json);
      // 如果解析后是字符串，直接返回；如果是对象，转换为格式化的JSON字符串
      if (typeof parsed === 'string') {
        return parsed;
      } else {
        return JSON.stringify(parsed, null, 2);
      }
    } catch (err) {
      throw new Error('无效的转义JSON格式');
    }
  };

  // 校验JSON
  const validateJSON = (json: string): boolean => {
    try {
      JSON.parse(json);
      return true;
    } catch (err) {
      return false;
    }
  };

  // 处理JSON
  const handleProcess = () => {
    if (!inputJson.trim()) {
      setError('请输入JSON字符串');
      setOutputJson('');
      return;
    }

    try {
      setError('');
      let result = '';

      switch (mode) {
        case 'format':
          result = formatJSON(inputJson);
          break;
        case 'minify':
          result = minifyJSON(inputJson);
          break;
        case 'escape':
          result = escapeJSON(inputJson);
          break;
        case 'unescape':
          result = unescapeJSON(inputJson);
          break;
      }

      setOutputJson(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败');
      setOutputJson('');
    }
  };

  // 校验并处理JSON
  const handleValidate = () => {
    if (!inputJson.trim()) {
      setError('请输入JSON字符串');
      setOutputJson('');
      return;
    }

    const isValid = validateJSON(inputJson);
    if (isValid) {
      setError('');
      // 校验通过后自动执行处理
      handleProcess();
    } else {
      try {
        JSON.parse(inputJson);
      } catch (err) {
        setError(`❌ JSON格式错误: ${err instanceof Error ? err.message : '未知错误'}`);
        setOutputJson('');
      }
    }
  };

  // 复制结果
  const copyResult = () => {
    if (outputJson) {
      navigator.clipboard.writeText(outputJson);
      showMessage.success('已复制到剪贴板');
    }
  };

  // 清空
  const clearAll = () => {
    setInputJson('');
    setOutputJson('');
    setError('');
  };

  return (
    <div className="json-parser">
      <div className="parser-controls">
        <div className="mode-buttons">
          <button
            className={`mode-btn ${mode === 'format' ? 'active' : ''}`}
            onClick={() => setMode('format')}
          >
            格式化
          </button>
          <button
            className={`mode-btn ${mode === 'minify' ? 'active' : ''}`}
            onClick={() => setMode('minify')}
          >
            压缩
          </button>
          <button
            className={`mode-btn ${mode === 'escape' ? 'active' : ''}`}
            onClick={() => setMode('escape')}
          >
            转义
          </button>
          <button
            className={`mode-btn ${mode === 'unescape' ? 'active' : ''}`}
            onClick={() => setMode('unescape')}
          >
            去转义
          </button>
        </div>
        <div className="action-buttons">
          <button onClick={handleValidate} className="action-btn validate-btn">
            校验并处理
          </button>
          <button onClick={clearAll} className="action-btn clear-btn">
            清空
          </button>
        </div>
      </div>

      <div className="json-input-section">
        <div className="section-header">
          <label>输入JSON：</label>
        </div>
        <textarea
          value={inputJson}
          onChange={(e) => setInputJson(e.target.value)}
          placeholder="请输入JSON字符串..."
          className="json-textarea"
        />
      </div>

      {error && <div className="error">{error}</div>}

      {outputJson && (
        <div className="json-output-section">
          <div className="section-header">
            <label>输出结果：</label>
            <button onClick={copyResult} className="copy-btn">
              📋 复制
            </button>
          </div>
          <textarea
            value={outputJson}
            readOnly
            className="json-textarea output"
          />
        </div>
      )}
    </div>
  );
};

export default JSONParser;

