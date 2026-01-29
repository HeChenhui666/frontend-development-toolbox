import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Alert,
  Segmented,
  message as antdMessage,
} from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
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
      antdMessage.success('已复制到剪贴板');
    }
  };

  // 清空
  const clearAll = () => {
    setInputJson('');
    setOutputJson('');
    setError('');
  };

  return (
    <div className="json-parser" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
      <Card size="small" title="处理模式">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Segmented
            options={[
              { label: '格式化', value: 'format' },
              { label: '压缩', value: 'minify' },
              { label: '转义', value: 'escape' },
              { label: '去转义', value: 'unescape' },
            ]}
            value={mode || 'format'}
            onChange={(value) => {
              if (value) {
                setMode(value as typeof mode);
              }
            }}
            block
          />
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleValidate}
            >
              校验并处理
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

      {outputJson && (
        <Card 
          size="small" 
          title="输出结果"
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
            value={outputJson || ''}
            readOnly
            rows={8}
            style={{ fontFamily: 'monospace' }}
          />
        </Card>
      )}
    </div>
  );
};

export default JSONParser;

