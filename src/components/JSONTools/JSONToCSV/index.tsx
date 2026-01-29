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
  DownloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../utils/message';

const JSONToCSV: React.FC = () => {
  const [inputJson, setInputJson] = useState<string>('');
  const [outputCSV, setOutputCSV] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 转义CSV字段
  const escapeCSVField = (field: any): string => {
    if (field === null || field === undefined) {
      return '';
    }
    const str = String(field);
    // 如果包含逗号、引号或换行符，需要用引号包裹并转义引号
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // 将JSON数组转换为CSV
  const jsonToCSV = (data: any[]): string => {
    if (data.length === 0) {
      return '';
    }

    // 收集所有可能的键
    const allKeys = new Set<string>();
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    const headers = Array.from(allKeys);

    // 生成CSV行
    const rows: string[] = [];

    // 表头
    rows.push(headers.map(escapeCSVField).join(','));

    // 数据行
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        const row = headers.map(header => {
          const value = item[header];
          // 如果值是对象或数组，转换为JSON字符串
          if (typeof value === 'object' && value !== null) {
            return escapeCSVField(JSON.stringify(value));
          }
          return escapeCSVField(value);
        });
        rows.push(row.join(','));
      } else {
        // 如果数组元素不是对象，创建一个单列
        rows.push(escapeCSVField(item));
      }
    });

    return rows.join('\n');
  };

  // 处理转换
  const handleConvert = () => {
    if (!inputJson.trim()) {
      setError('请输入JSON字符串');
      setOutputCSV('');
      return;
    }

    try {
      setError('');
      const parsed = JSON.parse(inputJson);

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setError('JSON数组为空');
          setOutputCSV('');
          return;
        }
        const csv = jsonToCSV(parsed);
        setOutputCSV(csv);
        antdMessage.success('转换成功');
      } else if (typeof parsed === 'object' && parsed !== null) {
        // 如果是单个对象，转换为单行CSV
        const csv = jsonToCSV([parsed]);
        setOutputCSV(csv);
        antdMessage.success('转换成功');
      } else {
        setError('请输入JSON对象或数组');
        setOutputCSV('');
      }
    } catch (err) {
      setError(`JSON格式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setOutputCSV('');
    }
  };

  // 下载CSV文件
  const downloadCSV = () => {
    if (!outputCSV) {
      return;
    }

    const blob = new Blob(['\ufeff' + outputCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    antdMessage.success('文件下载成功');
  };

  // 复制结果
  const copyResult = () => {
    if (outputCSV) {
      navigator.clipboard.writeText(outputCSV);
      antdMessage.success('已复制到剪贴板');
    }
  };

  // 清空
  const clearAll = () => {
    setInputJson('');
    setOutputCSV('');
    setError('');
  };

  return (
    <div className="json-to-csv" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      <Card size="small">
        <Space>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleConvert}
          >
            转换为CSV
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={clearAll}
          >
            清空
          </Button>
        </Space>
      </Card>

      <Card size="small" title="输入JSON（对象或数组）">
        <Input.TextArea
          value={inputJson || ''}
          onChange={(e) => {
            if (e && e.target) {
              setInputJson(e.target.value || '');
            }
          }}
          placeholder='请输入JSON数组或对象，例如：[{"name":"张三","age":25},{"name":"李四","age":30}]'
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

      {outputCSV && (
        <Card 
          size="small" 
          title="转换后的CSV"
          extra={
            <Space>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={copyResult}
              >
                复制
              </Button>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={downloadCSV}
              >
                下载
              </Button>
            </Space>
          }
        >
          <Input.TextArea
            value={outputCSV || ''}
            readOnly
            rows={8}
            style={{ fontFamily: 'monospace' }}
          />
        </Card>
      )}
    </div>
  );
};

export default JSONToCSV;

