import React, { useState, useCallback } from 'react';
import { Input, Button, Typography, Alert, Radio, message as antdMessage } from 'antd';
import { SwapOutlined, CopyOutlined } from '@ant-design/icons';
import './index.css';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * 简易 JSON ↔ YAML 转换器（纯前端实现，不依赖外部库）
 */
const jsonToYaml = (data: unknown, indent: number = 0): string => {
  const prefix = '  '.repeat(indent);

  if (data === null || data === undefined) return 'null';
  if (typeof data === 'boolean') return data ? 'true' : 'false';
  if (typeof data === 'number') return String(data);
  if (typeof data === 'string') {
    if (data === '' || data.includes('\n') || data.includes(':') || data.includes('#') ||
        data.includes('{') || data.includes('}') || data.includes('[') || data.includes(']') ||
        data.includes(',') || data.includes('&') || data.includes('*') || data.includes('?') ||
        data.includes('|') || data.includes('>') || data.includes("'") || data.includes('"') ||
        data.startsWith(' ') || data.endsWith(' ') || data === 'true' || data === 'false' ||
        data === 'null' || data === 'yes' || data === 'no' || /^[\d.eE+-]+$/.test(data)) {
      return JSON.stringify(data);
    }
    return data;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    const lines = data.map((item) => {
      if (item && typeof item === 'object') {
        const inner = jsonToYaml(item, indent + 1);
        const firstNewline = inner.indexOf('\n');
        if (firstNewline === -1) {
          // 单行对象/数组，直接内联
          return `${prefix}- ${inner}`;
        }
        // 多行对象：第一行内联到 "- " 后，后续行保持缩进
        const firstLine = inner.slice(0, firstNewline).trimStart();
        const restLines = inner.slice(firstNewline + 1);
        return `${prefix}- ${firstLine}\n${restLines}`;
      }
      return `${prefix}- ${jsonToYaml(item, indent + 1)}`;
    });
    return lines.join('\n');
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const lines = entries.map(([key, value]) => {
      const safeKey = /^[\w.-]+$/.test(key) ? key : JSON.stringify(key);
      if (value && typeof value === 'object') {
        const inner = jsonToYaml(value, indent + 1);
        return `${prefix}${safeKey}:\n${inner}`;
      }
      return `${prefix}${safeKey}: ${jsonToYaml(value, indent + 1)}`;
    });
    return lines.join('\n');
  }

  return String(data);
};

const yamlToJson = (yaml: string): unknown => {
  const lines = yaml.split('\n');
  const result = parseYamlLines(lines, 0, 0).value;
  return result;
};

interface ParseResult {
  value: unknown;
  nextLine: number;
}

const getIndent = (line: string): number => {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
};

const parseYamlLines = (lines: string[], startLine: number, baseIndent: number): ParseResult => {
  if (startLine >= lines.length) return { value: null, nextLine: startLine };

  const firstContent = lines[startLine].trim();

  // 空行或注释
  if (!firstContent || firstContent.startsWith('#')) {
    return parseYamlLines(lines, startLine + 1, baseIndent);
  }

  // 数组
  if (firstContent.startsWith('- ') || firstContent === '-') {
    return parseYamlArray(lines, startLine, baseIndent);
  }

  // 对象
  if (firstContent.includes(':')) {
    return parseYamlObject(lines, startLine, baseIndent);
  }

  // 标量
  return { value: parseYamlScalar(firstContent), nextLine: startLine + 1 };
};

const parseYamlArray = (lines: string[], startLine: number, baseIndent: number): ParseResult => {
  const result: unknown[] = [];
  let lineNum = startLine;

  while (lineNum < lines.length) {
    const line = lines[lineNum];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) { lineNum++; continue; }

    const indent = getIndent(line);
    if (indent < baseIndent) break;

    if (trimmed.startsWith('- ')) {
      const afterDash = trimmed.slice(2).trim();
      if (afterDash.includes(':') && !afterDash.startsWith('{') && !afterDash.startsWith('"')) {
        // inline object inside array item
        const tempLines = [afterDash, ...getChildLines(lines, lineNum + 1, indent + 2)];
        const parsed = parseYamlObject(tempLines, 0, 0);
        result.push(parsed.value);
        lineNum += 1 + getChildLines(lines, lineNum + 1, indent + 2).length;
      } else {
        result.push(parseYamlScalar(afterDash));
        lineNum++;
      }
    } else if (trimmed === '-') {
      const childLines = getChildLines(lines, lineNum + 1, indent + 2);
      if (childLines.length > 0) {
        const parsed = parseYamlLines(childLines, 0, 0);
        result.push(parsed.value);
        lineNum += 1 + childLines.length;
      } else {
        result.push(null);
        lineNum++;
      }
    } else {
      break;
    }
  }

  return { value: result, nextLine: lineNum };
};

const parseYamlObject = (lines: string[], startLine: number, baseIndent: number): ParseResult => {
  const result: Record<string, unknown> = {};
  let lineNum = startLine;

  while (lineNum < lines.length) {
    const line = lines[lineNum];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) { lineNum++; continue; }

    const indent = getIndent(line);
    if (lineNum > startLine && indent < baseIndent) break;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) { lineNum++; continue; }

    let key = trimmed.slice(0, colonIdx).trim();
    // 去除引号
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
      key = key.slice(1, -1);
    }

    const afterColon = trimmed.slice(colonIdx + 1).trim();

    if (afterColon) {
      result[key] = parseYamlScalar(afterColon);
      lineNum++;
    } else {
      // 子级
      const childLines = getChildLines(lines, lineNum + 1, indent + 2);
      if (childLines.length > 0) {
        const parsed = parseYamlLines(childLines, 0, 0);
        result[key] = parsed.value;
        lineNum += 1 + childLines.length;
      } else {
        result[key] = null;
        lineNum++;
      }
    }
  }

  return { value: result, nextLine: lineNum };
};

const getChildLines = (lines: string[], startLine: number, minIndent: number): string[] => {
  const result: string[] = [];
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) { result.push(line); continue; }
    const indent = getIndent(line);
    if (indent < minIndent) break;
    result.push(line.slice(minIndent));
  }
  // 去除末尾空行
  while (result.length > 0 && !result[result.length - 1].trim()) result.pop();
  return result;
};

const parseYamlScalar = (value: string): unknown => {
  if (!value || value === 'null' || value === '~') return null;
  if (value === 'true' || value === 'yes') return true;
  if (value === 'false' || value === 'no') return false;

  // 带引号的字符串
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // inline JSON
  if (value.startsWith('{') || value.startsWith('[')) {
    try { return JSON.parse(value); } catch { return value; }
  }

  // 数字
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

  return value;
};

const JSONYamlConverter: React.FC = () => {
  const [mode, setMode] = useState<'json2yaml' | 'yaml2json'>('json2yaml');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState('');

  const convert = useCallback(() => {
    if (!inputText.trim()) { setError('请输入内容'); return; }
    setError('');

    try {
      if (mode === 'json2yaml') {
        const data = JSON.parse(inputText);
        setOutputText(jsonToYaml(data));
      } else {
        const data = yamlToJson(inputText);
        setOutputText(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      setError(`转换失败: ${err instanceof Error ? err.message : '格式错误'}`);
      setOutputText('');
    }
  }, [inputText, mode]);

  const copyOutput = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      antdMessage.success('已复制');
    } catch { antdMessage.error('复制失败'); }
  };

  return (
    <div className="json-yaml-converter">
      <div className="jyc-toolbar">
        <Radio.Group value={mode} onChange={(e) => { setMode(e.target.value); setOutputText(''); setError(''); }} size="small">
          <Radio.Button value="json2yaml">JSON → YAML</Radio.Button>
          <Radio.Button value="yaml2json">YAML → JSON</Radio.Button>
        </Radio.Group>
      </div>

      <div className="jyc-panels">
        <div className="jyc-panel">
          <Text style={{ fontSize: 11, fontWeight: 600 }}>{mode === 'json2yaml' ? 'JSON' : 'YAML'} 输入</Text>
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={mode === 'json2yaml' ? '{"name": "test", "value": 123}' : 'name: test\nvalue: 123'}
            rows={8}
            style={{ fontFamily: 'monospace', fontSize: 11 }}
          />
        </div>
      </div>

      <Button type="primary" size="small" icon={<SwapOutlined />} onClick={convert} block>
        转换
      </Button>

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ fontSize: 11 }} />}

      {outputText && (
        <div className="jyc-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: 600 }}>{mode === 'json2yaml' ? 'YAML' : 'JSON'} 输出</Text>
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={copyOutput} />
          </div>
          <pre className="jyc-output">{outputText}</pre>
        </div>
      )}
    </div>
  );
};

export default JSONYamlConverter;
