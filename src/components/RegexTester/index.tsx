import React, { useState } from 'react';
import { Select } from 'antd';
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
    // 手机号相关
    {
      name: '中国大陆手机号',
      pattern: '^1[3-9]\\d{9}$',
      description: '匹配11位中国大陆手机号码（1开头，第二位3-9）',
    },
    {
      name: '国际手机号格式',
      pattern: '^\\+?[\\d\\s\\-\\(\\)]+$',
      description: '匹配国际手机号格式（可包含+、数字、空格、横线、括号）',
    },
    // 邮箱相关
    {
      name: '邮箱校验',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      description: '匹配常见邮箱格式',
    },
    {
      name: '严格邮箱验证',
      pattern: '^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\\.[a-zA-Z]{2,}$',
      description: '更严格的邮箱验证（首尾不能是特殊字符）',
    },
    // 身份证相关
    {
      name: '中国身份证号码',
      pattern: '(^\\d{15}$)|(^\\d{18}$)|(^\\d{17}(\\d|X|x)$)',
      description: '匹配15位或18位中国身份证号码（支持X结尾）',
    },
    // 密码相关
    {
      name: '强密码（8位+大小写+数字+特殊字符）',
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
      description: '至少8位，包含数字、大小写字母、特殊字符',
    },
    {
      name: '简单密码（6-20位字母数字）',
      pattern: '^[A-Za-z0-9]{6,20}$',
      description: '6-20位字母数字组合',
    },
    // 数字相关
    {
      name: '正整数',
      pattern: '^[1-9]\\d*$',
      description: '匹配正整数（不包括0）',
    },
    {
      name: '非负整数',
      pattern: '^\\d+$',
      description: '匹配非负整数（包括0）',
    },
    {
      name: '浮点数',
      pattern: '^(-?\\d+)(\\.\\d+)?$',
      description: '匹配浮点数（可正可负）',
    },
    {
      name: '最多两位小数',
      pattern: '^\\d+(\\.\\d{1,2})?$',
      description: '匹配最多两位小数的数字',
    },
    {
      name: '百分比（0-100）',
      pattern: '^(100|[1-9]?\\d(\\.\\d+)?)$',
      description: '匹配0-100的百分比数值',
    },
    // URL相关
    {
      name: 'URL链接',
      pattern: '^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$',
      description: '匹配URL链接格式',
    },
    {
      name: '包含端口的URL',
      pattern: '^https?:\\/\\/(?:[-\\w.])+(?::[0-9]+)?(?:\\/(?:[\\w\\/_.])*(?:\\?(?:[\\w&=%.])*)?(?:\\#(?:[\\w.])*)?)?$',
      description: '匹配包含端口的URL链接',
    },
    {
      name: 'IP地址',
      pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
      description: '匹配IPv4地址格式',
    },
    // 颜色相关
    {
      name: '十六进制颜色',
      pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
      description: '匹配十六进制颜色值（#RGB或#RRGGBB）',
    },
    {
      name: 'RGB颜色',
      pattern: '^rgb\\(\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*\\)$',
      description: '匹配RGB颜色格式 rgb(r, g, b)',
    },
    {
      name: 'RGBA颜色',
      pattern: '^rgba\\(\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(\\d{1,3})\\s*,\\s*(0|1|0\\.\\d+)\\s*\\)$',
      description: '匹配RGBA颜色格式 rgba(r, g, b, a)',
    },
    // 时间日期相关
    {
      name: '24小时制时间',
      pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
      description: '匹配24小时制时间格式 HH:MM',
    },
    {
      name: '12小时制时间',
      pattern: '^(0?[1-9]|1[0-2]):([0-5]\\d)\\s?(AM|am|PM|pm)$',
      description: '匹配12小时制时间格式 HH:MM AM/PM',
    },
    {
      name: '日期格式（YYYY-MM-DD）',
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      description: '匹配日期格式 YYYY-MM-DD',
    },
    {
      name: '日期时间格式',
      pattern: '^\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2}$',
      description: '匹配日期时间格式 YYYY-MM-DD HH:MM:SS',
    },
    // 中文相关
    {
      name: '纯中文',
      pattern: '^[\\u4e00-\\u9fa5]+$',
      description: '匹配纯中文字符串',
    },
    {
      name: '中文姓名（2-4个汉字）',
      pattern: '^[\\u4e00-\\u9fa5]{2,4}$',
      description: '匹配2-4个汉字的中文姓名',
    },
    {
      name: '包含中文',
      pattern: '[\\u4e00-\\u9fa5]',
      description: '匹配包含中文字符的字符串',
    },
    // 字符过滤相关
    {
      name: '过滤特殊字符',
      pattern: '[~`!@#$%^&*()_\\-+=|\\\\[\\]{};\'\\":<>/?]',
      description: '匹配特殊字符（用于过滤）',
    },
    {
      name: '字母数字下划线',
      pattern: '^[a-zA-Z0-9_]+$',
      description: '只允许字母、数字、下划线',
    },
    {
      name: '过滤HTML标签',
      pattern: '<[^>]*>',
      description: '匹配HTML标签（用于过滤）',
    },
    {
      name: '去除首尾空格',
      pattern: '^\\s+|\\s+$',
      description: '匹配首尾空格（用于去除）',
    },
    {
      name: '去除所有空格',
      pattern: '\\s',
      description: '匹配所有空格（用于去除）',
    },
    {
      name: '去除多余空格',
      pattern: '\\s+',
      description: '匹配多个连续空格（用于保留一个）',
    },
    // 文件相关
    {
      name: '文件扩展名',
      pattern: '\\.(jpg|jpeg|png|gif|pdf|doc|docx)$',
      description: '匹配文件扩展名（jpg, jpeg, png, gif, pdf, doc, docx）',
    },
    {
      name: 'Windows文件名',
      pattern: '^[^<>:"/\\\\|?*]*$',
      description: '匹配Windows合法文件名（不包含非法字符）',
    },
    // 金额相关
    {
      name: '人民币金额',
      pattern: '^¥?(\\d{1,3},?)*(\\.\\d{2})?$',
      description: '匹配人民币金额格式',
    },
    {
      name: '美元金额',
      pattern: '^\\$?(\\d{1,3},?)*(\\.\\d{2})?$',
      description: '匹配美元金额格式',
    },
    // 其他
    {
      name: '中国车牌号',
      pattern: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]$',
      description: '匹配中国车牌号格式',
    },
    {
      name: '银行卡号',
      pattern: '^\\d{16,19}$',
      description: '匹配银行卡号（16-19位数字）',
    },
    {
      name: '提取数字',
      pattern: '\\d+',
      description: '匹配数字（用于提取）',
    },
    {
      name: '提取中文',
      pattern: '[\\u4e00-\\u9fa5]',
      description: '匹配中文字符（用于提取）',
    },
    {
      name: '检测连续重复字符',
      pattern: '(.)\\1{2,}',
      description: '检测连续重复3次及以上的字符',
    },
    {
      name: '驼峰转短横线',
      pattern: '([a-z])([A-Z])',
      description: '匹配驼峰命名中的大小写转换点（用于转换）',
    },
    {
      name: '短横线转驼峰',
      pattern: '-([a-z])',
      description: '匹配短横线命名中的短横线（用于转换）',
    },
    {
      name: 'JSON对象结构',
      pattern: '^\\s*\\{.*\\}\\s*$',
      description: '简单JSON对象结构验证',
    },
  ];

  // 应用预设正则表达式
  const applyPreset = (presetName: string) => {
    const preset = presetRegexes.find(p => p.name === presetName);
    if (preset) {
      setRegexPattern(preset.pattern);
      setSelectedPreset(preset.name);
      setFlags('g');
    }
  };

  // 处理预设选择变化
  const handlePresetChange = (value: string) => {
    applyPreset(value);
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
        <Select
          placeholder="选择预设正则表达式"
          value={selectedPreset || undefined}
          onChange={handlePresetChange}
          onClear={() => {
            setSelectedPreset('');
            setRegexPattern('');
          }}
          allowClear
          showSearch
          filterOption={(input, option) => {
            const preset = presetRegexes.find(p => p.name === option?.value);
            const label = (option?.label ?? '').toLowerCase();
            const description = preset?.description?.toLowerCase() ?? '';
            const searchText = input.toLowerCase();
            return label.includes(searchText) || description.includes(searchText);
          }}
          className="preset-select"
          size="small"
          options={presetRegexes.map((preset) => ({
            value: preset.name,
            label: preset.name,
          }))}
        />
        {selectedPreset && (
          <div className="preset-description">
            {presetRegexes.find(p => p.name === selectedPreset)?.description}
          </div>
        )}
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

