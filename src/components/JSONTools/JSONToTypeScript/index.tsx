import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Alert,
  message as antdMessage,
} from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../utils/message';

const JSONToTypeScript: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>('');
  const [outputTypeScript, setOutputTypeScript] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [interfaceName, setInterfaceName] = useState<string>('Root');

  // 推断TypeScript类型
  const inferTypeScriptType = (value: any): string => {
    if (value === null) {
      return 'null';
    }
    if (value === undefined) {
      return 'undefined';
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'any[]';
      }
      const firstItem = value[0];
      const itemType = inferTypeScriptType(firstItem);
      return `${itemType}[]`;
    }
    if (typeof value === 'object') {
      // 生成内联类型
      const props: string[] = [];
      for (const [key, val] of Object.entries(value)) {
        const propName = isValidIdentifier(key) ? key : `"${key}"`;
        const propType = inferTypeScriptType(val);
        props.push(`  ${propName}: ${propType};`);
      }
      return `{\n${props.join('\n')}\n}`;
    }
    return getTypeScriptType(value);
  };

  // 生成TypeScript接口定义
  const generateTypeScript = (obj: any, name: string = 'Root'): string => {
    if (obj === null || obj === undefined) {
      return `interface ${name} {\n  value: null;\n}`;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        return `interface ${name} {\n  items: any[];\n}`;
      }
      const firstItem = obj[0];
      const itemType = inferTypeScriptType(firstItem);
      return `interface ${name} {\n  items: ${itemType}[];\n}`;
    }

    if (typeof obj === 'object') {
      const lines: string[] = [];
      lines.push(`interface ${name} {`);
      
      for (const [key, value] of Object.entries(obj)) {
        const propName = isValidIdentifier(key) ? key : `"${key}"`;
        const propType = inferTypeScriptType(value);
        lines.push(`  ${propName}: ${propType};`);
      }
      
      lines.push('}');
      return lines.join('\n');
    }

    // 基本类型，包装成接口
    return `interface ${name} {\n  value: ${getTypeScriptType(obj)};\n}`;
  };

  // 获取TypeScript基本类型
  const getTypeScriptType = (value: any): string => {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value === null) return 'null';
    return 'any';
  };

  // 检查是否为有效的标识符
  const isValidIdentifier = (str: string): boolean => {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
  };

  // 处理生成
  const handleGenerate = () => {
    if (!inputJson.trim()) {
      setError('请输入JSON字符串');
      setOutputTypeScript('');
      return;
    }

    if (!interfaceName.trim()) {
      setError('请输入接口名称');
      setOutputTypeScript('');
      return;
    }

    try {
      setError('');
      const parsed = JSON.parse(inputJson);
      const tsInterface = generateTypeScript(parsed, interfaceName);
      setOutputTypeScript(tsInterface);
      antdMessage.success('TypeScript接口生成成功');
    } catch (err) {
      setError(`JSON格式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setOutputTypeScript('');
    }
  };

  // 复制结果
  const copyResult = () => {
    if (outputTypeScript) {
      navigator.clipboard.writeText(outputTypeScript);
      antdMessage.success('已复制到剪贴板');
    }
  };

  // 清空
  const clearAll = () => {
    setInputJson('');
    setOutputTypeScript('');
    setError('');
    setInterfaceName('Root');
  };

  return (
    <div className="json-to-typescript" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      <Card size="small" title="生成配置">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              addonBefore="接口名称"
              value={interfaceName || ''}
              onChange={(e) => {
                if (e && e.target) {
                  setInterfaceName(e.target.value || '');
                }
              }}
              placeholder="Root"
            />
          </Space.Compact>
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleGenerate}
            >
              生成TypeScript
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={clearAll}
            >
              清空
            </Button>
          </Space>
        </Space>
      </Card>

      <Card size="small" title="输入JSON">
        <Input.TextArea
          value={inputJson || ''}
          onChange={(e) => {
            if (e && e.target) {
              setInputJson(e.target.value || '');
            }
          }}
          placeholder="请输入JSON字符串..."
          rows={8}
          style={{ fontFamily: 'monospace' }}
        />
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

      {outputTypeScript && (
        <Card 
          size="small" 
          title="生成的TypeScript接口"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={copyResult}
            >
              复制
            </Button>
          }
        >
          <Input.TextArea
            value={outputTypeScript || ''}
            readOnly
            rows={8}
            style={{ fontFamily: 'monospace' }}
          />
        </Card>
      )}
    </div>
  );
};

export default JSONToTypeScript;

