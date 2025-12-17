import React, { useState } from 'react';
import './index.css';

interface PresetRegex {
  name: string;
  pattern: string;
  description: string;
}

const RegexTester: React.FC = () => {
  const [regexPattern, setRegexPattern] = useState<string>('');
  const [testText, setTestText] = useState<string>('');
  const [flags, setFlags] = useState<string>('g');
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  // 预设正则表达式
  const presetRegexes: PresetRegex[] = [
    {
      name: '中国大陆手机号',
      pattern: '^1[3-9]\\d{9}$',
      description: '匹配11位中国大陆手机号码（1开头，第二位3-9）',
    },
    {
      name: '中国大陆身份证',
      pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$',
      description: '匹配18位中国大陆身份证号码',
    },
    {
      name: '邮箱校验',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      description: '匹配常见邮箱格式',
    },
    {
      name: '网页链接',
      pattern: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$',
      description: '匹配HTTP/HTTPS网页链接',
    },
  ];

  // 应用预设正则表达式
  const applyPreset = (preset: PresetRegex) => {
    setRegexPattern(preset.pattern);
    setSelectedPreset(preset.name);
    setFlags('g');
  };

  // 测试正则表达式
  const testRegex = () => {
    if (!regexPattern.trim()) {
      setError('请输入正则表达式');
      setIsMatch(null);
      setIsValid(true);
      return;
    }

    if (!testText.trim()) {
      setError('请输入测试文本');
      setIsMatch(null);
      setIsValid(true);
      return;
    }

    try {
      setError('');
      setIsValid(true);
      const regex = new RegExp(regexPattern, flags);
      const result = regex.test(testText);
      setIsMatch(result);
    } catch (err) {
      setIsValid(false);
      setError(`正则表达式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setIsMatch(null);
    }
  };



  // 清空
  const clearAll = () => {
    setRegexPattern('');
    setTestText('');
    setIsMatch(null);
    setError('');
    setIsValid(true);
    setSelectedPreset('');
  };

  return (
    <div className="regex-tester">
      {/* 预设正则表达式 */}
      <div className="preset-section">
        <div className="section-header">
          <label>预设正则表达式：</label>
        </div>
        <div className="preset-list">
          {presetRegexes.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className={`preset-btn ${selectedPreset === preset.name ? 'active' : ''}`}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 正则表达式输入 */}
      <div className="regex-input-section">
        <div className="section-header">
          <label>正则表达式：</label>
          <div className="flags-control">
            <label className="flag-label">
              <input
                type="checkbox"
                checked={flags.includes('g')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFlags(flags.replace(/[im]/g, '') + 'g');
                  } else {
                    setFlags(flags.replace(/g/g, ''));
                  }
                }}
              />
              <span>全局(g)</span>
            </label>
            <label className="flag-label">
              <input
                type="checkbox"
                checked={flags.includes('i')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFlags(flags + 'i');
                  } else {
                    setFlags(flags.replace(/i/g, ''));
                  }
                }}
              />
              <span>忽略大小写(i)</span>
            </label>
            <label className="flag-label">
              <input
                type="checkbox"
                checked={flags.includes('m')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFlags(flags + 'm');
                  } else {
                    setFlags(flags.replace(/m/g, ''));
                  }
                }}
              />
              <span>多行(m)</span>
            </label>
          </div>
        </div>
        <div className="input-wrapper">
          <input
            type="text"
            value={regexPattern}
            onChange={(e) => {
              setRegexPattern(e.target.value);
              setSelectedPreset('');
            }}
            placeholder="输入正则表达式，例如: ^\\d+$"
            className={`regex-input ${!isValid ? 'error' : ''}`}
          />
          <button onClick={testRegex} className="test-btn">
            测试
          </button>
        </div>
        {selectedPreset && (
          <div className="preset-description">
            {presetRegexes.find(p => p.name === selectedPreset)?.description}
          </div>
        )}
      </div>

      {/* 测试文本输入 */}
      <div className="test-text-section">
        <div className="section-header">
          <label>测试文本：</label>
        </div>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="输入要测试的文本..."
          className="test-textarea"
        />
      </div>

      {/* 错误提示 */}
      {error && <div className="error">{error}</div>}

      {/* 匹配结果 */}
      {isMatch !== null && (
        <div className="results-section">
          <div className={`match-result ${isMatch ? 'success' : 'failure'}`}>
            {isMatch ? (
              <>
                <span className="result-icon">✅</span>
                <span className="result-text">测试文本满足正则表达式</span>
              </>
            ) : (
              <>
                <span className="result-icon">❌</span>
                <span className="result-text">测试文本不满足正则表达式</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="actions">
        <button onClick={clearAll} className="clear-btn">
          清空
        </button>
      </div>
    </div>
  );
};

export default RegexTester;

