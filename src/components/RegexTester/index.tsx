import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, Input, Button, Space, Checkbox, message as antdMessage } from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import RandExp from 'randexp';
import CompatibilityWarning from '../CompatibilityWarning';
import { useCompatibility } from '../../hooks/useCompatibility';
import './index.css';

type ActionType = 'extract' | 'filter' | 'remove' | 'replace' | 'transform';

interface PresetRegex {
  name: string;
  pattern: string;
  description: string;
  hasAction?: boolean;
  actionType?: ActionType;
}

const PRESET_REGEXES: PresetRegex[] = [
  { name: '中国大陆手机号', pattern: '^1[3-9]\\d{9}$', description: '匹配11位中国大陆手机号码（1开头，第二位3-9）' },
  { name: '国际手机号格式', pattern: '^\\+?[\\d\\s\\-\\(\\)]+$', description: '匹配国际手机号格式（可包含+、数字、空格、横线、括号）' },
  { name: '邮箱校验', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', description: '匹配常见邮箱格式' },
  { name: '严格邮箱验证', pattern: '^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\\.[a-zA-Z]{2,}$', description: '更严格的邮箱验证（首尾不能是特殊字符）' },
  { name: '中国身份证号码', pattern: '^(\\d{15}|\\d{17}[\\dXx])$', description: '匹配15位或18位中国身份证号码（支持X结尾）' },
  { name: '强密码（8位+大小写+数字+特殊字符）', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', description: '至少8位，包含数字、大小写字母、特殊字符' },
  { name: '简单密码（6-20位字母数字）', pattern: '^[A-Za-z0-9]{6,20}$', description: '6-20位字母数字组合' },
  { name: '正整数', pattern: '^[1-9]\\d*$', description: '匹配正整数（不包括0）' },
  { name: '非负整数', pattern: '^\\d+$', description: '匹配非负整数（包括0）' },
  { name: '浮点数', pattern: '^-?(\\d+(\\.\\d+)?|\\.\\d+)$', description: '匹配浮点数（可正可负，支持.5格式）' },
  { name: '最多两位小数', pattern: '^\\d+(\\.\\d{1,2})?$', description: '匹配最多两位小数的数字' },
  { name: '百分比（0-100）', pattern: '^(100(\\.0+)?|[0-9]?\\d(\\.\\d+)?)$', description: '匹配0-100的百分比数值' },
  { name: 'URL链接', pattern: '^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z]{2,6})(?:\\/([\\w\\.-]+(?:\\/[\\w\\.-]*)*))?\\/?$', description: '匹配URL链接格式' },
  { name: '包含端口的URL', pattern: '^https?:\\/\\/(?:[-\\w.])+(?::[0-9]{1,5})?(?:\\/(?:[\\w\\/_.-])*(?:\\?(?:[\\w&=%.])*)?(?:\\#(?:[\\w.-])*)?)?$', description: '匹配包含端口的URL链接' },
  { name: 'IP地址', pattern: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$', description: '匹配IPv4地址格式' },
  { name: '十六进制颜色', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', description: '匹配十六进制颜色值（#RGB或#RRGGBB）' },
  { name: 'RGB颜色', pattern: '^rgb\\(\\s*((?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?))\\s*,\\s*((?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?))\\s*,\\s*((?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?))\\s*\\)$', description: '匹配RGB颜色格式 rgb(r, g, b)' },
  { name: 'RGBA颜色', pattern: '^rgba\\(\\s*((?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?))\\s*,\\s*((?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?))\\s*,\\s*((?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?))\\s*,\\s*((?:0|1|0\\.\\d+|1\\.0+))\\s*\\)$', description: '匹配RGBA颜色格式' },
  { name: '24小时制时间', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$', description: '匹配24小时制时间格式 HH:MM' },
  { name: '12小时制时间', pattern: '^(0?[1-9]|1[0-2]):([0-5]\\d)\\s?(AM|am|PM|pm)$', description: '匹配12小时制时间格式 HH:MM AM/PM' },
  { name: '日期格式（YYYY-MM-DD）', pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$', description: '匹配日期格式 YYYY-MM-DD' },
  { name: '日期时间格式', pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\s+([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$', description: '匹配日期时间格式 YYYY-MM-DD HH:MM:SS' },
  { name: '纯中文', pattern: '^[\\u4e00-\\u9fa5]+$', description: '匹配纯中文字符串' },
  { name: '中文姓名（2-4个汉字）', pattern: '^[\\u4e00-\\u9fa5]{2,4}$', description: '匹配2-4个汉字的中文姓名' },
  { name: '包含中文', pattern: '[\\u4e00-\\u9fa5]', description: '匹配包含中文字符的字符串' },
  { name: '过滤特殊字符', pattern: '[~`!@#$%^&*()_\\-+=|\\\\[\\]{};\'\\":<>/?]', description: '匹配特殊字符（用于过滤）', hasAction: true, actionType: 'filter' },
  { name: '字母数字下划线', pattern: '^[a-zA-Z0-9_]+$', description: '只允许字母、数字、下划线' },
  { name: '过滤HTML标签', pattern: '<[^>]*>', description: '匹配HTML标签（用于过滤）', hasAction: true, actionType: 'filter' },
  { name: '去除首尾空格', pattern: '^\\s+|\\s+$', description: '匹配首尾空格（用于去除）', hasAction: true, actionType: 'remove' },
  { name: '去除所有空格', pattern: '\\s', description: '匹配所有空格（用于去除）', hasAction: true, actionType: 'remove' },
  { name: '去除多余空格', pattern: '\\s+', description: '匹配多个连续空格（用于保留一个）', hasAction: true, actionType: 'replace' },
  { name: '文件扩展名', pattern: '\\.(jpg|jpeg|png|gif|pdf|doc|docx)$', description: '匹配文件扩展名' },
  { name: 'Windows文件名', pattern: '^[^<>:"/\\\\|?*\\x00-\\x1f]*$', description: '匹配Windows合法文件名' },
  { name: '人民币金额', pattern: '^¥?(\\d{1,3}(?:,\\d{3})*|\\d+)(\\.\\d{2})?$', description: '匹配人民币金额格式' },
  { name: '美元金额', pattern: '^[\\$]?(\\d{1,3}(?:,\\d{3})*|\\d+)(\\.\\d{2})?$', description: '匹配美元金额格式' },
  { name: '中国车牌号', pattern: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]$', description: '匹配中国车牌号格式' },
  { name: '银行卡号', pattern: '^\\d{16,19}$', description: '匹配银行卡号（16-19位数字）' },
  { name: '提取数字', pattern: '\\d+', description: '匹配数字（用于提取）', hasAction: true, actionType: 'extract' },
  { name: '提取中文', pattern: '[\\u4e00-\\u9fa5]+', description: '匹配中文字符（用于提取）', hasAction: true, actionType: 'extract' },
  { name: '检测连续重复字符', pattern: '(.)\\1{2,}', description: '检测连续重复3次及以上的字符' },
  { name: '驼峰转短横线', pattern: '([a-z])([A-Z])', description: '匹配驼峰命名中的大小写转换点（用于转换）', hasAction: true, actionType: 'transform' },
  { name: '短横线转驼峰', pattern: '-([a-z])', description: '匹配短横线命名中的短横线（用于转换）', hasAction: true, actionType: 'transform' },
  { name: 'JSON对象结构', pattern: '^\\s*\\{.*\\}\\s*$', description: '简单JSON对象结构验证' },
];

const RegexTester: React.FC = () => {
  const { isCompatible } = useCompatibility({ featureName: '正则表达式测试', requiredFeatures: ['RegExp'], checkTypes: ['regex', 'basic'] });
  const [regexPattern, setRegexPattern] = useState<string>('');
  const [testText, setTestText] = useState<string>('');
  const [flags, setFlags] = useState<string>('g');
  const [isMatch, setIsMatch] = useState<boolean | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [actionResult, setActionResult] = useState<string>('');

  const applyPreset = useCallback((presetName: string) => {
    const preset = PRESET_REGEXES.find((p) => p.name === presetName);
    if (preset) { setRegexPattern(preset.pattern); setSelectedPreset(preset.name); setFlags('g'); }
  }, []);

  const handlePresetChange = useCallback((value: string) => { applyPreset(value); }, [applyPreset]);

  const handleGenerateText = useCallback(() => {
    if (!regexPattern.trim()) { setError('请输入正则表达式'); setIsMatch(null); setIsValid(true); return; }
    try {
      setError('');
      setIsValid(true);
      const regex = new RegExp(regexPattern, flags);
      const randexp = new RandExp(regex);
      randexp.max = 10;
      const generated = randexp.gen();
      if (generated) setTestText(generated);
      else setError('无法生成匹配的文本');
    } catch (err) {
      setIsValid(false);
      const msg = err instanceof Error ? err.message : '未知错误';
      setError(msg.includes('lookbehind') || msg.includes('lookahead')
        ? '该正则含不支持的语法（lookbehind/lookahead），无法生成示例'
        : `生成失败: ${msg}`);
    }
  }, [regexPattern, flags]);

  const toggleFlag = useCallback((flag: string, checked: boolean) => {
    const set = new Set(flags.split('').filter(f => f));
    if (checked) set.add(flag);
    else set.delete(flag);
    setFlags([...set].join(''));
  }, [flags]);

  const testRegex = useCallback(() => {
    if (!regexPattern.trim()) { setError('请输入正则表达式'); setIsMatch(null); setIsValid(true); return; }
    if (!testText.trim()) { setError('请输入测试文本'); setIsMatch(null); setIsValid(true); return; }
    const REDOS_PATTERN = /(\(.*[+*?]\).*[+*?]|\(\?:.*[+*?]\).*[+*?])/;
    if (REDOS_PATTERN.test(regexPattern)) {
      antdMessage.warning('检测到可能导致灾难性回溯的正则表达式，已阻止执行');
      return;
    }
    if (testText.length > 50000) {
      antdMessage.warning('测试文本过长（最大 50000 字符），请缩短后重试');
      return;
    }
    try {
      setError('');
      setIsValid(true);
      const regex = new RegExp(regexPattern, flags);
      setIsMatch(regex.test(testText));
    } catch (err) {
      setIsValid(false);
      setError(`正则表达式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setIsMatch(null);
    }
  }, [regexPattern, testText, flags]);

  const performAction = useCallback(() => {
    if (!testText.trim()) { setActionResult(''); return; }
    const preset = PRESET_REGEXES.find((p) => p.name === selectedPreset);
    if (!preset || !preset.hasAction || !preset.actionType) { setActionResult(''); return; }
    const REDOS_PATTERN = /(\(.*[+*?]\).*[+*?]|\(\?:.*[+*?]\).*[+*?])/;
    if (REDOS_PATTERN.test(regexPattern)) {
      antdMessage.warning('检测到可能导致灾难性回溯的正则表达式，已阻止执行');
      return;
    }
    if (testText.length > 50000) {
      antdMessage.warning('测试文本过长（最大 50000 字符），请缩短后重试');
      return;
    }
    try {
      const regex = new RegExp(preset.pattern, flags);
      let result = '';
      switch (preset.actionType) {
        case 'extract': {
          const matches: string[] = [];
          let match;
          if (flags.includes('g')) {
            const gr = new RegExp(preset.pattern, flags);
            while ((match = gr.exec(testText)) !== null) {
              if (matches.length >= 10000) {
                antdMessage.warning('匹配结果超过 10000 条，已截断');
                break;
              }
              matches.push(match[0]);
              if (match[0].length === 0) gr.lastIndex++;
            }
          } else {
            match = testText.match(regex);
            if (match) matches.push(match[0]);
          }
          result = matches.length > 0 ? matches.join('\n') : '未找到匹配内容';
          break;
        }
        case 'filter':
        case 'remove':
          result = testText.replace(regex, '');
          break;
        case 'replace':
          result = preset.name === '去除多余空格' ? testText.replace(/\s+/g, ' ') : testText.replace(regex, '');
          break;
        case 'transform':
          if (preset.name === '驼峰转短横线') result = testText.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
          else if (preset.name === '短横线转驼峰') result = testText.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
          else result = testText;
          break;
        default:
          result = testText;
      }
      setActionResult(result);
    } catch (err) {
      setActionResult(`操作失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [testText, selectedPreset, flags]);

  useEffect(() => {
    const preset = PRESET_REGEXES.find((p) => p.name === selectedPreset);
    if (preset && preset.hasAction && testText.trim()) performAction();
    else setActionResult('');
  }, [testText, selectedPreset, flags, performAction]);

  const copyActionResult = useCallback(async () => {
    if (!actionResult) return;
    try {
      await navigator.clipboard.writeText(actionResult);
      antdMessage.success('已复制到剪贴板');
    } catch {
      antdMessage.error('复制失败');
    }
  }, [actionResult]);

  const clearAll = useCallback(() => {
    setRegexPattern('');
    setTestText('');
    setIsMatch(null);
    setError('');
    setIsValid(true);
    setSelectedPreset('');
    setActionResult('');
  }, []);

  const presetOptions = useMemo(() =>
    PRESET_REGEXES.map((p) => ({ value: p.name, label: p.name })).filter((o) => o.value && o.label), []);

  const currentPreset = useMemo(() =>
    selectedPreset ? PRESET_REGEXES.find((p) => p.name === selectedPreset) : null, [selectedPreset]);

  return (
    <div className="regex-tester">
      {!isCompatible && (
        <CompatibilityWarning featureName="正则表达式测试" requiredFeatures={['RegExp']} />
      )}

      {/* 预设选择 */}
      <div className="rx-row">
        <Select
          placeholder="选择预设正则表达式"
          value={selectedPreset || null}
          onChange={(value) => { if (value) handlePresetChange(value); }}
          onClear={() => { setSelectedPreset(''); setRegexPattern(''); }}
          allowClear
          showSearch
          filterOption={(input, option) => {
            if (!option || !option.value) return false;
            const preset = PRESET_REGEXES.find((p) => p.name === option.value);
            const label = String(option.label || option.value || '').toLowerCase();
            const desc = preset?.description?.toLowerCase() ?? '';
            const s = input.toLowerCase();
            return label.includes(s) || desc.includes(s);
          }}
          style={{ flex: 1 }}
          size="small"
          options={presetOptions}
        />
      </div>
      {currentPreset?.description && (
        <div className="rx-preset-desc">{currentPreset.description}</div>
      )}

      {/* 正则输入行 */}
      <div className="rx-section">
        <div className="rx-section-header">
          <span className="rx-label">正则表达式</span>
          <div className="rx-flags">
            <Checkbox checked={flags.includes('g')} onChange={(e) => toggleFlag('g', e.target.checked)}>g</Checkbox>
            <Checkbox checked={flags.includes('i')} onChange={(e) => toggleFlag('i', e.target.checked)}>i</Checkbox>
            <Checkbox checked={flags.includes('m')} onChange={(e) => toggleFlag('m', e.target.checked)}>m</Checkbox>
          </div>
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={regexPattern || ''}
            onChange={(e) => { setRegexPattern(e.target.value || ''); setSelectedPreset(''); }}
            placeholder="输入正则表达式，例如: ^\\d+$"
            status={!isValid ? 'error' : ''}
            onPressEnter={testRegex}
            size="small"
          />
          <Button size="small" onClick={testRegex} type="primary">测试</Button>
          <Button size="small" icon={<ThunderboltOutlined />} onClick={handleGenerateText} disabled={!regexPattern.trim()}>生成</Button>
        </Space.Compact>
      </div>

      {/* 测试文本 */}
      <div className="rx-section">
        <span className="rx-label">测试文本</span>
        <Input.TextArea
          value={testText || ''}
          onChange={(e) => { setTestText(e.target.value || ''); }}
          placeholder="输入要测试的文本..."
          rows={4}
          size="small"
        />
      </div>

      {/* 错误 */}
      {error && <div className="rx-error">{error}</div>}

      {/* 匹配结果 */}
      {isMatch !== null && (
        <div className={`rx-match-result ${isMatch ? 'rx-match-success' : 'rx-match-fail'}`}>
          {isMatch
            ? <><CheckCircleOutlined /> 匹配成功</>
            : <><CloseCircleOutlined /> 匹配失败</>
          }
        </div>
      )}

      {/* 操作结果 */}
      {currentPreset?.hasAction && (
        <div className="rx-section">
          <div className="rx-section-header">
            <span className="rx-label">操作结果</span>
            {actionResult && (
              <Button size="small" icon={<CopyOutlined />} onClick={copyActionResult} type="text">复制</Button>
            )}
          </div>
          {actionResult
            ? <Input.TextArea value={actionResult} readOnly rows={3} size="small" />
            : <div className="rx-placeholder">操作结果将显示在这里…</div>
          }
        </div>
      )}

      {/* 清空 */}
      <Button icon={<ClearOutlined />} onClick={clearAll} size="small" block>清空</Button>
    </div>
  );
};

export default RegexTester;
