import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Alert,
  Tag,
  message as antdMessage,
} from 'antd';
import {
  ClearOutlined,
  SwapOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../utils/message';

interface DiffResult {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
}

const JSONCompare: React.FC = () => {
  const [json1, setJson1] = useState<string>('');
  const [json2, setJson2] = useState<string>('');
  const [diffs, setDiffs] = useState<DiffResult[]>([]);
  const [error, setError] = useState<string>('');

  // 比较两个JSON对象
  const compareJSON = (obj1: any, obj2: any, path: string = ''): DiffResult[] => {
    const differences: DiffResult[] = [];

    // 获取所有键的并集
    const allKeys = new Set([
      ...Object.keys(obj1 || {}),
      ...Object.keys(obj2 || {}),
    ]);

    allKeys.forEach((key) => {
      const currentPath = path ? `${path}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      // 如果键在obj1中不存在，说明是新增的
      if (!(key in (obj1 || {}))) {
        differences.push({
          path: currentPath,
          type: 'added',
          newValue: val2,
        });
      }
      // 如果键在obj2中不存在，说明是删除的
      else if (!(key in (obj2 || {}))) {
        differences.push({
          path: currentPath,
          type: 'removed',
          oldValue: val1,
        });
      }
      // 如果两个值都是对象，递归比较
      else if (
        typeof val1 === 'object' &&
        val1 !== null &&
        !Array.isArray(val1) &&
        typeof val2 === 'object' &&
        val2 !== null &&
        !Array.isArray(val2)
      ) {
        differences.push(...compareJSON(val1, val2, currentPath));
      }
      // 如果两个值都是数组，比较数组
      else if (Array.isArray(val1) && Array.isArray(val2)) {
        const maxLength = Math.max(val1.length, val2.length);
        for (let i = 0; i < maxLength; i++) {
          const arrayPath = `${currentPath}[${i}]`;
          if (i >= val1.length) {
            differences.push({
              path: arrayPath,
              type: 'added',
              newValue: val2[i],
            });
          } else if (i >= val2.length) {
            differences.push({
              path: arrayPath,
              type: 'removed',
              oldValue: val1[i],
            });
          } else if (
            typeof val1[i] === 'object' &&
            val1[i] !== null &&
            !Array.isArray(val1[i]) &&
            typeof val2[i] === 'object' &&
            val2[i] !== null &&
            !Array.isArray(val2[i])
          ) {
            differences.push(...compareJSON(val1[i], val2[i], arrayPath));
          } else if (JSON.stringify(val1[i]) !== JSON.stringify(val2[i])) {
            differences.push({
              path: arrayPath,
              type: 'modified',
              oldValue: val1[i],
              newValue: val2[i],
            });
          }
        }
      }
      // 比较基本值
      else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        differences.push({
          path: currentPath,
          type: 'modified',
          oldValue: val1,
          newValue: val2,
        });
      }
    });

    return differences;
  };

  // 处理比对
  const handleCompare = () => {
    if (!json1.trim() || !json2.trim()) {
      setError('请输入两组JSON字符串');
      setDiffs([]);
      return;
    }

    try {
      setError('');
      const obj1 = JSON.parse(json1);
      const obj2 = JSON.parse(json2);

      const differences = compareJSON(obj1, obj2);
      setDiffs(differences);

      if (differences.length === 0) {
        antdMessage.success('两个JSON完全相同');
      }
    } catch (err) {
      setError(`JSON格式错误: ${err instanceof Error ? err.message : '未知错误'}`);
      setDiffs([]);
    }
  };

  // 格式化值显示
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // 清空
  const clearAll = () => {
    setJson1('');
    setJson2('');
    setDiffs([]);
    setError('');
  };

  return (
    <div className="json-compare" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      <Card size="small">
        <Space>
          <Button
            type="primary"
            icon={<SwapOutlined />}
            onClick={handleCompare}
          >
            开始比对
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={clearAll}
          >
            清空
          </Button>
        </Space>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px'}}>
        <Card size="small" title="JSON 1">
          <Input.TextArea
            value={json1 || ''}
            onChange={(e) => {
              if (e && e.target) {
                setJson1(e.target.value || '');
              }
            }}
            placeholder="请输入第一组JSON..."
            rows={10}
            style={{ fontFamily: 'monospace' }}
          />
        </Card>

        <Card size="small" title="JSON 2">
          <Input.TextArea
            value={json2 || ''}
            onChange={(e) => {
              if (e && e.target) {
                setJson2(e.target.value || '');
              }
            }}
            placeholder="请输入第二组JSON..."
            rows={10}
            style={{ fontFamily: 'monospace' }}
          />
        </Card>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      {diffs.length > 0 && (
        <Card size="small" title={`差异结果（共 ${diffs.length} 处）`}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {diffs.map((diff, index) => {
              const diffColor =
                diff.type === 'added'
                  ? 'var(--theme-success, #52c41a)'
                  : diff.type === 'removed'
                    ? 'var(--theme-error, #ff4d4f)'
                    : 'var(--theme-active, #1890ff)';
              return (
                <Card key={index} size="small" style={{ borderLeft: `4px solid ${diffColor}` }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Space>
                    <Tag color={diff.type === 'added' ? 'success' : diff.type === 'removed' ? 'error' : 'processing'}>
                      {diff.type === 'added' ? '新增' : diff.type === 'removed' ? '删除' : '修改'}
                    </Tag>
                    <code>{diff.path}</code>
                  </Space>
                  {diff.type === 'removed' && (
                    <Alert
                      message={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <strong>旧值：</strong>
                          <pre style={{ margin: 6, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{formatValue(diff.oldValue)}</pre>
                        </Space>
                      }
                      type="error"
                      showIcon={false}
                    />
                  )}
                  {diff.type === 'added' && (
                    <Alert
                      message={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <strong>新值：</strong>
                          <pre style={{ margin: 6, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{formatValue(diff.newValue)}</pre>
                        </Space>
                      }
                      type="success"
                      showIcon={false}
                    />
                  )}
                  {diff.type === 'modified' && (
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Alert
                        message={
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <strong>旧值：</strong>
                            <pre style={{ margin: 6, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{formatValue(diff.oldValue)}</pre>
                          </Space>
                        }
                        type="error"
                        showIcon={false}
                      />
                      <Alert
                        message={
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <strong>新值：</strong>
                            <pre style={{ margin: 6, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{formatValue(diff.newValue)}</pre>
                          </Space>
                        }
                        type="success"
                        showIcon={false}
                      />
                    </Space>
                  )}
                </Space>
              </Card>
            );
            })}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default JSONCompare;

