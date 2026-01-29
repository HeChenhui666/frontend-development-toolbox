import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Tag,
  message as antdMessage,
  Spin,
  Empty,
} from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../utils/message';

const { TextArea, Text } = Typography;

interface CompatibilityResult {
  property: string;
  supported: boolean;
  prefix?: string;
  notes?: string;
}

const CSSCompatibility: React.FC = () => {
  const [cssInput, setCssInput] = useState<string>('');
  const [results, setResults] = useState<CompatibilityResult[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // 检测CSS属性是否支持
  const checkCSSProperty = (property: string): CompatibilityResult => {
    const element = document.createElement('div');
    const style = element.style as any;
    
    // 检查标准属性
    if (property in style) {
      return {
        property,
        supported: true,
      };
    }

    // 检查带前缀的属性
    const prefixes = ['webkit', 'moz', 'ms', 'o'];
    for (const prefix of prefixes) {
      const prefixedProperty = prefix + property.charAt(0).toUpperCase() + property.slice(1);
      if (prefixedProperty in style) {
        return {
          property,
          supported: true,
          prefix: `-${prefix}-`,
        };
      }
    }

    // 检查CSS.supports API（如果可用）
    if (typeof CSS !== 'undefined' && CSS.supports) {
      try {
        if (CSS.supports(property, 'initial')) {
          return {
            property,
            supported: true,
          };
        }
      } catch (e) {
        // 忽略错误
      }
    }

    return {
      property,
      supported: false,
      notes: '该属性在当前浏览器中不支持',
    };
  };

  // 检测CSS值/函数是否支持
  const checkCSSValue = (value: string): CompatibilityResult => {
    if (typeof CSS !== 'undefined' && CSS.supports) {
      try {
        // 尝试检测一些常见的CSS函数和值
        const testProperties = [
          `display: ${value}`,
          `width: ${value}`,
          `transform: ${value}`,
        ];

        for (const testProp of testProperties) {
          if (CSS.supports(testProp)) {
            return {
              property: value,
              supported: true,
            };
          }
        }
      } catch (e) {
        // 忽略错误
      }
    }

    // 尝试在元素上应用
    const element = document.createElement('div');
    try {
      element.style.cssText = `width: ${value}`;
      const computed = window.getComputedStyle(element);
      if (computed.width !== '') {
        return {
          property: value,
          supported: true,
        };
      }
    } catch (e) {
      // 忽略错误
    }

    return {
      property: value,
      supported: false,
      notes: '该值在当前浏览器中可能不支持',
    };
  };

  // 解析CSS并检测
  const checkCompatibility = () => {
    if (!cssInput.trim()) {
      antdMessage.warning('请输入要检测的CSS代码');
      return;
    }

    setIsChecking(true);
    const results: CompatibilityResult[] = [];

    try {
      // 提取CSS属性
      const propertyRegex = /([a-z-]+)\s*:/gi;
      const matches = cssInput.matchAll(propertyRegex);

      const properties = new Set<string>();
      for (const match of matches) {
        const property = match[1].trim();
        if (property && !property.startsWith('@')) {
          properties.add(property);
        }
      }

      // 检测每个属性
      for (const property of properties) {
        results.push(checkCSSProperty(property));
      }

      // 提取CSS函数和特殊值
      const valueRegex = /(?:calc|clamp|min|max|var|rgba?|hsla?|linear-gradient|radial-gradient|url|attr)\([^)]*\)/gi;
      const valueMatches = cssInput.matchAll(valueRegex);

      const values = new Set<string>();
      for (const match of valueMatches) {
        values.add(match[0]);
      }

      // 检测每个值
      for (const value of values) {
        results.push(checkCSSValue(value));
      }

      // 如果没有找到任何属性或值，尝试检测整个CSS规则
      if (results.length === 0) {
        // 尝试作为整体检测
        if (typeof CSS !== 'undefined' && CSS.supports) {
          try {
            const testElement = document.createElement('div');
            testElement.style.cssText = cssInput;
            const supported = testElement.style.cssText.length > 0;
            results.push({
              property: 'CSS规则',
              supported,
              notes: supported ? '整体规则在当前浏览器中可用' : '整体规则可能不完全支持',
            });
          } catch (e) {
            results.push({
              property: 'CSS规则',
              supported: false,
              notes: '无法检测该CSS规则',
            });
          }
        }
      }

      setResults(results);
      if (results.length > 0) {
        const supportedCount = results.filter(r => r.supported).length;
        antdMessage.success(`检测完成：${supportedCount}/${results.length} 项支持`);
      } else {
        antdMessage.warning('未检测到有效的CSS属性或值');
      }
    } catch (error) {
      antdMessage.error('检测过程中出现错误');
      setResults([]);
    } finally {
      setIsChecking(false);
    }
  };

  // 清空
  const clearAll = () => {
    setCssInput('');
    setResults([]);
  };

  // 复制结果
  const copyResults = () => {
    if (results.length === 0) {
      antdMessage.warning('没有可复制的结果');
      return;
    }

    const resultText = results
      .map(r => `${r.property}: ${r.supported ? '✅ 支持' : '❌ 不支持'}${r.prefix ? ` (需要前缀: ${r.prefix})` : ''}${r.notes ? ` - ${r.notes}` : ''}`)
      .join('\n');

    navigator.clipboard.writeText(resultText);
    antdMessage.success('结果已复制到剪贴板');
  };

  // 获取浏览器信息
  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = '未知';
    let version = '未知';

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      if (match) version = match[1];
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      if (match) version = match[1];
    } else if (ua.includes('Edg')) {
      browser = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      if (match) version = match[1];
    }

    return { browser, version };
  };

  const browserInfo = getBrowserInfo();

  return (
    <div className="css-compatibility" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
      <Card size="small" title="浏览器信息">
        <Space>
          <Text>浏览器：<Text strong>{browserInfo.browser}</Text></Text>
          <Text>版本：<Text strong>{browserInfo.version}</Text></Text>
        </Space>
      </Card>

      <Card 
        size="small" 
        title="输入CSS代码"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={checkCompatibility}
              loading={isChecking}
            >
              检测兼容性
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={clearAll}
            >
              清空
            </Button>
          </Space>
        }
      >
        <TextArea
          value={cssInput}
          onChange={(e) => setCssInput(e.target.value)}
          placeholder="请输入CSS代码，例如：display: flex; backdrop-filter: blur(10px);"
          rows={6}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {results.length > 0 && (
        <Card 
          size="small" 
          title="检测结果"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={copyResults}
            >
              复制结果
            </Button>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {results.map((result, index) => (
              <Alert
                key={index}
                message={
                  <Space>
                    {result.supported ? (
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    <Text strong>{result.property}</Text>
                    {result.prefix && (
                      <Tag color="warning">需要前缀: {result.prefix}</Tag>
                    )}
                  </Space>
                }
                description={result.notes}
                type={result.supported ? 'success' : 'error'}
                showIcon={false}
              />
            ))}
          </Space>
        </Card>
      )}

      {results.length === 0 && !isChecking && (
        <Card size="small">
          <Empty
            description={
              <Space direction="vertical" size="small">
                <Text>输入CSS代码后点击"检测兼容性"按钮</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  支持检测CSS属性和CSS函数（如 calc、clamp、linear-gradient 等）
                </Text>
              </Space>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};

export default CSSCompatibility;

