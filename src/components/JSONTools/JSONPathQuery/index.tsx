import React, { useState, useCallback } from 'react';
import { Input, Button, Space, Typography, Alert, message as antdMessage } from 'antd';
import { SearchOutlined, CopyOutlined } from '@ant-design/icons';
import './index.css';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * 简易 JSONPath 查询器
 * 支持: $.store.book[0].title, $..author, $.store.book[*].price 等基础语法
 */
const queryJsonPath = (data: unknown, path: string): unknown[] => {
  const results: unknown[] = [];

  const segments = parsePath(path);
  if (segments.length === 0) return [data];

  const traverse = (current: unknown, segs: string[], depth: number) => {
    if (depth >= segs.length) {
      results.push(current);
      return;
    }

    const seg = segs[depth];

    if (seg === '**') {
      // 递归下降 (..)
      traverse(current, segs, depth + 1);
      if (current && typeof current === 'object') {
        const entries = Array.isArray(current)
          ? current.map((v, i) => [String(i), v] as const)
          : Object.entries(current as Record<string, unknown>);
        for (const [, value] of entries) {
          traverse(value, segs, depth);
        }
      }
      return;
    }

    if (seg === '*') {
      if (current && typeof current === 'object') {
        const values = Array.isArray(current) ? current : Object.values(current as Record<string, unknown>);
        for (const value of values) {
          traverse(value, segs, depth + 1);
        }
      }
      return;
    }

    const arrayMatch = seg.match(/^(\w+)\[(\d+|[*])\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      const obj = current as Record<string, unknown>;
      if (obj && typeof obj === 'object' && key in obj) {
        const arr = obj[key];
        if (Array.isArray(arr)) {
          if (index === '*') {
            for (const item of arr) {
              traverse(item, segs, depth + 1);
            }
          } else {
            const idx = parseInt(index, 10);
            if (idx >= 0 && idx < arr.length) {
              traverse(arr[idx], segs, depth + 1);
            }
          }
        }
      }
      return;
    }

    // 普通 key 或数组索引
    if (current && typeof current === 'object') {
      if (Array.isArray(current)) {
        const idx = parseInt(seg, 10);
        if (!isNaN(idx) && idx >= 0 && idx < current.length) {
          traverse(current[idx], segs, depth + 1);
        }
      } else {
        const obj = current as Record<string, unknown>;
        if (seg in obj) {
          traverse(obj[seg], segs, depth + 1);
        }
      }
    }
  };

  traverse(data, segments, 0);
  return results;
};

const parsePath = (path: string): string[] => {
  let normalized = path.trim();
  if (normalized.startsWith('$')) normalized = normalized.slice(1);
  if (normalized.startsWith('.')) normalized = normalized.slice(1);

  if (!normalized) return [];

  const segments: string[] = [];
  let current = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (char === '.' && normalized[i + 1] === '.') {
      if (current) { segments.push(current); current = ''; }
      segments.push('**');
      i++; // skip second dot
      continue;
    }

    if (char === '.') {
      if (current) { segments.push(current); current = ''; }
      continue;
    }

    if (char === '[') {
      const closeIdx = normalized.indexOf(']', i);
      if (closeIdx > i) {
        const indexStr = normalized.slice(i + 1, closeIdx).replace(/['"]/g, '');
        if (current) {
          segments.push(`${current}[${indexStr}]`);
          current = '';
        } else {
          segments.push(indexStr);
        }
        i = closeIdx;
        continue;
      }
    }

    current += char;
  }

  if (current) segments.push(current);
  return segments;
};

const JSONPathQuery: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [pathExpression, setPathExpression] = useState('');
  const [queryResult, setQueryResult] = useState('');
  const [error, setError] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  const executeQuery = useCallback(() => {
    if (!jsonInput.trim()) { setError('请输入 JSON 数据'); return; }
    if (!pathExpression.trim()) { setError('请输入 JSONPath 表达式'); return; }

    try {
      const data = JSON.parse(jsonInput);
      setError('');
      const results = queryJsonPath(data, pathExpression);
      setMatchCount(results.length);

      if (results.length === 0) {
        setQueryResult('// 未匹配到任何结果');
      } else if (results.length === 1) {
        setQueryResult(JSON.stringify(results[0], null, 2));
      } else {
        setQueryResult(JSON.stringify(results, null, 2));
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('JSON 格式错误: ' + err.message);
      } else {
        setError('查询执行失败');
      }
      setQueryResult('');
      setMatchCount(0);
    }
  }, [jsonInput, pathExpression]);

  const copyResult = async () => {
    if (!queryResult) return;
    try {
      await navigator.clipboard.writeText(queryResult);
      antdMessage.success('已复制到剪贴板');
    } catch {
      antdMessage.error('复制失败');
    }
  };

  return (
    <div className="jsonpath-query">
      <div className="jsonpath-input-section">
        <Text style={{ fontSize: 11, fontWeight: 600 }}>JSON 数据</Text>
        <TextArea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{"store":{"book":[{"title":"A","price":10},{"title":"B","price":20}]}}'
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: 11 }}
        />
      </div>

      <div className="jsonpath-path-section">
        <Text style={{ fontSize: 11, fontWeight: 600 }}>JSONPath 表达式</Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={pathExpression}
            onChange={(e) => setPathExpression(e.target.value)}
            placeholder="$.store.book[0].title"
            size="small"
            onPressEnter={executeQuery}
            style={{ fontFamily: 'monospace' }}
          />
          <Button size="small" type="primary" icon={<SearchOutlined />} onClick={executeQuery}>
            查询
          </Button>
        </Space.Compact>
        <div className="jsonpath-presets">
          {[
            { label: '$.key', path: '$.store' },
            { label: '$..key', path: '$..title' },
            { label: '[0]', path: '$.store.book[0]' },
            { label: '[*]', path: '$.store.book[*].title' },
          ].map((preset) => (
            <span
              key={preset.label}
              className="jsonpath-preset-tag"
              onClick={() => setPathExpression(preset.path)}
            >
              {preset.label}
            </span>
          ))}
        </div>
      </div>

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ fontSize: 11 }} />}

      {queryResult && (
        <div className="jsonpath-result-section">
          <div className="jsonpath-result-header">
            <Text style={{ fontSize: 11, fontWeight: 600 }}>
              查询结果 <span style={{ color: 'var(--theme-primary)', fontWeight: 400 }}>({matchCount} 条匹配)</span>
            </Text>
            <Button size="small" type="text" icon={<CopyOutlined />} onClick={copyResult} />
          </div>
          <pre className="jsonpath-result-code">{queryResult}</pre>
        </div>
      )}
    </div>
  );
};

export default JSONPathQuery;
