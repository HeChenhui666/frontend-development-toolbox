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
import { showMessage } from '../../../../utils/message';

const JSONSchemaGenerator: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>('');
  const [outputSchema, setOutputSchema] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 推断值的类型
  const inferType = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'array';
      // 检查数组元素类型
      const types = new Set(value.map(item => inferType(item)));
      if (types.size === 1) {
        return `array<${Array.from(types)[0]}>`;
      }
      return 'array';
    }
    return typeof value;
  };

  // 生成JSON Schema
  const generateSchema = (obj: unknown, title: string = 'Root'): Record<string, unknown> => {
    const schema: Record<string, unknown> = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title,
      type: inferType(obj),
    };

    if (obj === null) {
      return { ...schema, type: 'null' };
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        const firstItem = obj[0];
        schema.items = generateSchema(firstItem, 'Item');
      } else {
        schema.items = {};
      }
      return schema;
    }

    if (typeof obj === 'object' && obj !== null) {
      schema.type = 'object';
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
          properties[key] = generateSchema(value, key);
          required.push(key);
        }
      }

      schema.properties = properties;
      if (required.length > 0) {
        schema.required = required;
      }
    } else {
      // 基本类型
      switch (typeof obj) {
        case 'string':
          schema.type = 'string';
          break;
        case 'number':
          schema.type = Number.isInteger(obj) ? 'integer' : 'number';
          break;
        case 'boolean':
          schema.type = 'boolean';
          break;
      }
    }

    return schema;
  };

  // 处理生成
  const handleGenerate = () => {
    if (!inputJson.trim()) {
      setError('请输入JSON字符串');
      setOutputSchema('');
      return;
    }

    try {
      setError('');
      const parsed = JSON.parse(inputJson);
      const schema = generateSchema(parsed);
      setOutputSchema(JSON.stringify(schema, null, 2));
      antdMessage.success('Schema生成成功');
    } catch (err) {
      setError(`JSON格式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setOutputSchema('');
    }
  };

  // 复制结果
  const copyResult = () => {
    if (outputSchema) {
      navigator.clipboard.writeText(outputSchema);
      antdMessage.success('已复制到剪贴板');
    }
  };

  // 清空
  const clearAll = () => {
    setInputJson('');
    setOutputSchema('');
    setError('');
  };

  return (
    <div className="json-schema-generator" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      <Card size="small">
        <Space>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleGenerate}
          >
            生成Schema
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={clearAll}
          >
            清空
          </Button>
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

      {outputSchema && (
        <Card 
          size="small" 
          title="生成的Schema"
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
            value={outputSchema || ''}
            readOnly
            rows={8}
            style={{ fontFamily: 'monospace' }}
          />
        </Card>
      )}
    </div>
  );
};

export default JSONSchemaGenerator;

