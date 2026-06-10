import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Select, Input, Button, Space, Checkbox, Collapse, Tabs, Typography, Tag, Alert, message as antdMessage } from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';

const { Text } = Typography;
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

      {/* 扩展工具 */}
      <RegexExtendedTools pattern={regexPattern} />

      {/* 清空 */}
      <Button icon={<ClearOutlined />} onClick={clearAll} size="small" block>清空</Button>
    </div>
  );
};

/* ─── 正则可视化：将正则 AST 转为铁路图 SVG ─── */
interface RailroadNode {
  type: 'literal' | 'charset' | 'group' | 'quantifier' | 'alternation' | 'anchor' | 'any' | 'backreference';
  value: string;
  children?: RailroadNode[];
  min?: number;
  max?: number;
  greedy?: boolean;
}

const tokenizeRegex = (pattern: string): RailroadNode[] => {
  const nodes: RailroadNode[] = [];
  let index = 0;

  while (index < pattern.length) {
    const char = pattern[index];

    if (char === '\\') {
      index++;
      if (index >= pattern.length) break;
      const escaped = pattern[index];
      const escapeMap: Record<string, string> = {
        'd': '数字 [0-9]', 'D': '非数字', 'w': '字母数字 [a-zA-Z0-9_]', 'W': '非字母数字',
        's': '空白字符', 'S': '非空白', 'b': '单词边界', 'B': '非单词边界',
        'n': '换行符', 't': '制表符', 'r': '回车符',
      };
      if (escapeMap[escaped]) {
        nodes.push({ type: 'charset', value: escapeMap[escaped] });
      } else if (/\d/.test(escaped)) {
        nodes.push({ type: 'backreference', value: `反向引用 \\${escaped}` });
      } else {
        nodes.push({ type: 'literal', value: escaped });
      }
      index++;
      continue;
    }

    if (char === '[') {
      const closeIdx = pattern.indexOf(']', index + 1);
      if (closeIdx > index) {
        const content = pattern.slice(index, closeIdx + 1);
        nodes.push({ type: 'charset', value: content });
        index = closeIdx + 1;
        continue;
      }
    }

    if (char === '(') {
      let depth = 1;
      let groupEnd = index + 1;
      while (groupEnd < pattern.length && depth > 0) {
        if (pattern[groupEnd] === '(' && pattern[groupEnd - 1] !== '\\') depth++;
        if (pattern[groupEnd] === ')' && pattern[groupEnd - 1] !== '\\') depth--;
        groupEnd++;
      }
      const groupContent = pattern.slice(index + 1, groupEnd - 1);
      let groupLabel = '捕获组';
      let innerContent = groupContent;

      if (groupContent.startsWith('?:')) { groupLabel = '非捕获组'; innerContent = groupContent.slice(2); }
      else if (groupContent.startsWith('?=')) { groupLabel = '正向前瞻'; innerContent = groupContent.slice(2); }
      else if (groupContent.startsWith('?!')) { groupLabel = '负向前瞻'; innerContent = groupContent.slice(2); }
      else if (groupContent.startsWith('?<=')) { groupLabel = '正向后瞻'; innerContent = groupContent.slice(3); }
      else if (groupContent.startsWith('?<!')) { groupLabel = '负向后瞻'; innerContent = groupContent.slice(3); }

      nodes.push({ type: 'group', value: groupLabel, children: tokenizeRegex(innerContent) });
      index = groupEnd;
      continue;
    }

    if (char === '|') {
      const remaining = tokenizeRegex(pattern.slice(index + 1));
      return [{ type: 'alternation', value: '或', children: [{ type: 'group', value: '', children: nodes }, { type: 'group', value: '', children: remaining }] }];
    }

    if (char === '.' ) { nodes.push({ type: 'any', value: '任意字符' }); index++; continue; }
    if (char === '^') { nodes.push({ type: 'anchor', value: '行首' }); index++; continue; }
    if (char === '$') { nodes.push({ type: 'anchor', value: '行尾' }); index++; continue; }

    if ((char === '*' || char === '+' || char === '?' || char === '{') && nodes.length > 0) {
      const lastNode = nodes[nodes.length - 1];
      let min = 0, max = Infinity;
      let nextIdx = index + 1;

      if (char === '*') { min = 0; max = Infinity; }
      else if (char === '+') { min = 1; max = Infinity; }
      else if (char === '?') { min = 0; max = 1; }
      else if (char === '{') {
        const braceEnd = pattern.indexOf('}', index);
        if (braceEnd > index) {
          const range = pattern.slice(index + 1, braceEnd);
          const parts = range.split(',');
          min = parseInt(parts[0], 10) || 0;
          max = parts.length > 1 ? (parts[1] ? parseInt(parts[1], 10) : Infinity) : min;
          nextIdx = braceEnd + 1;
        }
      }

      const greedy = !(nextIdx < pattern.length && pattern[nextIdx] === '?');
      if (!greedy) nextIdx++;

      nodes[nodes.length - 1] = { type: 'quantifier', value: formatQuantifier(min, max, greedy), min, max, greedy, children: [lastNode] };
      index = nextIdx;
      continue;
    }

    nodes.push({ type: 'literal', value: char });
    index++;
  }

  return nodes;
};

const formatQuantifier = (min: number, max: number, greedy: boolean): string => {
  const lazyStr = greedy ? '' : ' (惰性)';
  if (min === 0 && max === Infinity) return `0 或多次${lazyStr}`;
  if (min === 1 && max === Infinity) return `1 或多次${lazyStr}`;
  if (min === 0 && max === 1) return `可选${lazyStr}`;
  if (min === max) return `恰好 ${min} 次${lazyStr}`;
  if (max === Infinity) return `至少 ${min} 次${lazyStr}`;
  return `${min}-${max} 次${lazyStr}`;
};

const renderRailroadText = (nodes: RailroadNode[], depth: number = 0): string => {
  const indent = '  '.repeat(depth);
  return nodes.map((node) => {
    switch (node.type) {
      case 'literal': return `${indent}── "${node.value}" ──`;
      case 'charset': return `${indent}── [${node.value}] ──`;
      case 'any': return `${indent}── . ${node.value} ──`;
      case 'anchor': return `${indent}◆ ${node.value}`;
      case 'backreference': return `${indent}← ${node.value}`;
      case 'quantifier':
        return `${indent}┌─ ${node.value} ─┐\n${node.children ? renderRailroadText(node.children, depth + 1) : ''}\n${indent}└──────────┘`;
      case 'group': {
        const label = node.value ? `${node.value}` : '';
        const inner = node.children ? renderRailroadText(node.children, depth + 1) : '';
        return label ? `${indent}┌─ (${label}) ─┐\n${inner}\n${indent}└──────────┘` : inner;
      }
      case 'alternation': {
        if (!node.children || node.children.length < 2) return '';
        return node.children.map((child, index) => {
          const inner = child.children ? renderRailroadText(child.children, depth + 1) : '';
          return `${indent}${index === 0 ? '┬' : '├'}─ 分支 ${index + 1} ──\n${inner}`;
        }).join('\n') + `\n${indent}└──────────┘`;
      }
      default: return `${indent}── ${node.value} ──`;
    }
  }).join('\n');
};

/* ─── 正则自然语言解释 ─── */
const explainNode = (node: RailroadNode): string => {
  switch (node.type) {
    case 'literal': return `匹配字符 "${node.value}"`;
    case 'charset': return `匹配 ${node.value}`;
    case 'any': return '匹配任意字符（除换行符）';
    case 'anchor': return node.value === '行首' ? '从字符串开头匹配' : '匹配到字符串结尾';
    case 'backreference': return node.value;
    case 'quantifier': {
      const inner = node.children ? node.children.map(explainNode).join('') : '';
      return `${inner}，重复 ${node.value}`;
    }
    case 'group': {
      const inner = node.children ? node.children.map(explainNode).join('，然后 ') : '';
      if (!node.value) return inner;
      if (node.value === '正向前瞻') return `后面紧跟着 ${inner}`;
      if (node.value === '负向前瞻') return `后面不跟着 ${inner}`;
      if (node.value === '正向后瞻') return `前面是 ${inner}`;
      if (node.value === '负向后瞻') return `前面不是 ${inner}`;
      return `(${node.value}: ${inner})`;
    }
    case 'alternation': {
      if (!node.children) return '';
      return node.children.map((child) => {
        return child.children ? child.children.map(explainNode).join('，然后 ') : '';
      }).filter(Boolean).join('；或者 ');
    }
    default: return node.value;
  }
};

const explainRegex = (pattern: string): string => {
  if (!pattern.trim()) return '';
  try {
    const nodes = tokenizeRegex(pattern);
    const explanations = nodes.map(explainNode).filter(Boolean);
    return explanations.join('，然后 ');
  } catch {
    return '无法解析该正则表达式';
  }
};

/* ─── ReDoS 检测 ─── */
interface RedosResult {
  safe: boolean;
  risks: string[];
  severity: 'safe' | 'low' | 'medium' | 'high';
}

const detectRedos = (pattern: string): RedosResult => {
  const risks: string[] = [];

  // 1. 嵌套量词 (a+)+ or (a*)*
  if (/\([^)]*[+*]\)[+*]/.test(pattern)) {
    risks.push('检测到嵌套量词（如 (a+)+ ），这是最常见的 ReDoS 模式');
  }

  // 2. 重叠的量词交替 (a|a)+
  const altInQuantGroup = /\(([^)]+)\|([^)]+)\)[+*]/;
  const altMatch = pattern.match(altInQuantGroup);
  if (altMatch) {
    const [, branchA, branchB] = altMatch;
    // 简单的重叠检查：如果两个分支有相同的字符
    if (branchA && branchB) {
      const charsA = new Set(branchA.replace(/\\./g, '').split(''));
      const charsB = new Set(branchB.replace(/\\./g, '').split(''));
      const overlap = [...charsA].some((c) => charsB.has(c));
      if (overlap) {
        risks.push(`交替分支 "${branchA}" 和 "${branchB}" 存在字符重叠，在量词内可能导致回溯`);
      }
    }
  }

  // 3. .*后跟可选模式再重复
  if (/\.\*.*\.\*/.test(pattern)) {
    risks.push('检测到多个 .* 贪婪匹配，可能产生大量回溯');
  }

  // 4. 字符类后紧跟相同或重叠的字符类+量词
  if (/\[([^\]]+)\][+*].*\[([^\]]+)\][+*]/.test(pattern)) {
    risks.push('检测到多个量化的字符类，可能存在重叠导致回溯');
  }

  // 5. 超长回溯链
  const quantifierCount = (pattern.match(/[+*{]/g) || []).length;
  if (quantifierCount > 5) {
    risks.push(`检测到 ${quantifierCount} 个量词，复杂度较高，建议简化`);
  }

  // 6. 指数级回溯模式: (\w+\s+)+ 等
  if (/\([^)]*\\[wdsDW][+*][^)]*\\[sdwSDW][+*][^)]*\)[+*]/.test(pattern)) {
    risks.push('检测到典型的指数级回溯模式（如 (\\w+\\s+)+）');
  }

  let severity: RedosResult['severity'] = 'safe';
  if (risks.length === 1) severity = 'low';
  else if (risks.length === 2) severity = 'medium';
  else if (risks.length >= 3) severity = 'high';
  if (risks.some((r) => r.includes('嵌套量词') || r.includes('指数级'))) severity = 'high';

  return { safe: risks.length === 0, risks, severity };
};

/* ─── 正则扩展工具组件 ─── */
const RegexExtendedTools: React.FC<{ pattern: string }> = ({ pattern }) => {
  const [activeTab, setActiveTab] = useState('visualize');

  const railroadText = useMemo(() => {
    if (!pattern.trim()) return '';
    try {
      const nodes = tokenizeRegex(pattern);
      return renderRailroadText(nodes);
    } catch {
      return '解析失败';
    }
  }, [pattern]);

  const explanation = useMemo(() => explainRegex(pattern), [pattern]);

  const redosResult = useMemo(() => {
    if (!pattern.trim()) return null;
    return detectRedos(pattern);
  }, [pattern]);

  const severityColorMap: Record<string, string> = {
    safe: 'green', low: 'gold', medium: 'orange', high: 'red',
  };
  const severityLabelMap: Record<string, string> = {
    safe: '安全', low: '低风险', medium: '中风险', high: '高风险',
  };

  if (!pattern.trim()) return null;

  const visualizeTab = (
    <div className="rx-ext-content">
      <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>正则结构（文本铁路图）</Text>
      <pre className="rx-railroad-text">{railroadText || '请输入正则表达式'}</pre>
    </div>
  );

  const explainTab = (
    <div className="rx-ext-content">
      <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>自然语言解释</Text>
      <div className="rx-explanation">{explanation || '请输入正则表达式'}</div>
    </div>
  );

  const redosTab = (
    <div className="rx-ext-content">
      {redosResult && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color={severityColorMap[redosResult.severity]}>{severityLabelMap[redosResult.severity]}</Tag>
            <Text style={{ fontSize: 11 }}>
              {redosResult.safe ? '未检测到明显的 ReDoS 风险' : `检测到 ${redosResult.risks.length} 个潜在风险`}
            </Text>
          </div>
          {redosResult.risks.length > 0 && (
            <div className="rx-redos-risks">
              {redosResult.risks.map((risk, index) => (
                <Alert key={index} message={risk} type="warning" showIcon style={{ fontSize: 11 }} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Collapse
      size="small"
      items={[{
        key: 'extended',
        label: <Space size={4}><ExperimentOutlined /><span style={{ fontSize: 12 }}>正则分析工具</span></Space>,
        children: (
          <Tabs
            size="small"
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'visualize', label: '结构图', children: visualizeTab },
              { key: 'explain', label: '解释', children: explainTab },
              { key: 'redos', label: 'ReDoS', children: redosTab },
            ]}
            style={{ marginTop: -8 }}
          />
        ),
      }]}
    />
  );
};

export default RegexTester;
