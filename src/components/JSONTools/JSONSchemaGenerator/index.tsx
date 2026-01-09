import React, { useState } from 'react';
import './index.css';
import { showMessage } from '../../../utils/message';

const JSONSchemaGenerator: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>('');
  const [outputSchema, setOutputSchema] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 推断值的类型
  const inferType = (value: any): string => {
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
  const generateSchema = (obj: any, title: string = 'Root'): any => {
    const schema: any = {
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
      schema.properties = {};
      schema.required = [];

      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
          schema.properties[key] = generateSchema(value, key);
          schema.required.push(key);
        }
      }

      if (schema.required.length === 0) {
        delete schema.required;
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
      showMessage.success('✅ Schema生成成功');
    } catch (err) {
      setError(`JSON格式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setOutputSchema('');
    }
  };

  // 复制结果
  const copyResult = () => {
    if (outputSchema) {
      navigator.clipboard.writeText(outputSchema);
      showMessage.success('已复制到剪贴板');
    }
  };

  // 清空
  const clearAll = () => {
    setInputJson('');
    setOutputSchema('');
    setError('');
  };

  return (
    <div className="json-schema-generator">
      <div className="generator-controls">
        <button onClick={handleGenerate} className="action-btn process-btn">
          生成Schema
        </button>
        <button onClick={clearAll} className="action-btn clear-btn">
          清空
        </button>
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

      {outputSchema && (
        <div className="json-output-section">
          <div className="section-header">
            <label>生成的Schema：</label>
            <button onClick={copyResult} className="copy-btn">
              📋 复制
            </button>
          </div>
          <textarea
            value={outputSchema}
            readOnly
            className="json-textarea output"
          />
        </div>
      )}
    </div>
  );
};

export default JSONSchemaGenerator;

