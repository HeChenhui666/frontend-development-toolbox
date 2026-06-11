import React, { useState, useCallback } from 'react';
import { Input, Button, Space, Typography, Alert, InputNumber, message as antdMessage } from 'antd';
import { ThunderboltOutlined, CopyOutlined } from '@ant-design/icons';
import './index.css';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * 根据 JSON 结构/Schema 自动生成 Mock 数据
 * 分析值的类型和命名规则，生成合理的随机数据
 */

const FIRST_NAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
const LAST_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '勇', '军'];
const DOMAINS = ['example.com', 'test.org', 'demo.cn', 'mock.io'];
const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '重庆'];
const WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do'];
const STATUS_VALUES = ['active', 'inactive', 'pending', 'completed', 'cancelled'];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals: number = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomPick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomString = (length: number) => Array.from({ length }, () => 'abcdefghijklmnopqrstuvwxyz'[randomInt(0, 25)]).join('');
const randomDate = () => {
  const start = new Date(2020, 0, 1).getTime();
  const end = new Date(2026, 11, 31).getTime();
  return new Date(randomInt(start, end)).toISOString();
};
const randomName = () => `${randomPick(FIRST_NAMES)}${randomPick(LAST_NAMES)}`;
const randomEmail = () => `${randomString(6)}@${randomPick(DOMAINS)}`;
const randomPhone = () => `1${randomInt(3, 9)}${String(randomInt(100000000, 999999999))}`;
const randomUrl = () => `https://${randomPick(DOMAINS)}/${randomString(5)}/${randomString(8)}`;
const randomId = () => `${randomString(8)}-${randomString(4)}-${randomString(4)}-${randomString(12)}`;
const randomSentence = () => Array.from({ length: randomInt(3, 8) }, () => randomPick(WORDS)).join(' ') + '.';

const inferMockValue = (key: string, sampleValue: unknown): unknown => {
  const keyLower = key.toLowerCase();

  // 根据 key 名推断
  if (keyLower === 'id' || keyLower.endsWith('_id') || keyLower.endsWith('Id')) return randomId();
  if (keyLower === 'name' || keyLower === 'username' || keyLower.includes('name')) return randomName();
  if (keyLower === 'email' || keyLower.includes('email')) return randomEmail();
  if (keyLower === 'phone' || keyLower === 'mobile' || keyLower === 'tel') return randomPhone();
  if (keyLower === 'url' || keyLower === 'link' || keyLower === 'href' || keyLower.includes('url')) return randomUrl();
  if (keyLower === 'avatar' || keyLower === 'image' || keyLower === 'img' || keyLower === 'photo') return `https://picsum.photos/200?random=${randomInt(1, 1000)}`;
  if (keyLower === 'city' || keyLower === 'address' || keyLower.includes('city')) return randomPick(CITIES);
  if (keyLower === 'status' || keyLower === 'state') return randomPick(STATUS_VALUES);
  if (keyLower === 'title' || keyLower === 'subject') return randomSentence();
  if (keyLower === 'description' || keyLower === 'content' || keyLower === 'text' || keyLower === 'bio') {
    return Array.from({ length: randomInt(2, 4) }, () => randomSentence()).join(' ');
  }
  if (keyLower.includes('date') || keyLower.includes('time') || keyLower === 'created' || keyLower === 'updated') return randomDate();
  if (keyLower === 'age') return randomInt(18, 65);
  if (keyLower === 'price' || keyLower === 'amount' || keyLower === 'cost') return randomFloat(1, 9999);
  if (keyLower === 'count' || keyLower === 'total' || keyLower === 'quantity' || keyLower === 'num') return randomInt(0, 1000);
  if (keyLower === 'score' || keyLower === 'rating') return randomFloat(1, 5, 1);
  if (keyLower === 'enabled' || keyLower === 'active' || keyLower === 'visible' || keyLower.startsWith('is_') || keyLower.startsWith('has_')) return Math.random() > 0.5;
  if (keyLower === 'tags' || keyLower === 'labels' || keyLower === 'categories') {
    return Array.from({ length: randomInt(1, 4) }, () => randomPick(WORDS));
  }

  // 根据 sample 值的类型推断
  if (typeof sampleValue === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(sampleValue)) return randomDate();
    if (sampleValue.includes('@')) return randomEmail();
    if (sampleValue.startsWith('http')) return randomUrl();
    if (sampleValue.length > 50) return randomSentence();
    return randomString(Math.max(4, sampleValue.length));
  }
  if (typeof sampleValue === 'number') {
    if (Number.isInteger(sampleValue)) return randomInt(0, 1000);
    return randomFloat(0, 1000);
  }
  if (typeof sampleValue === 'boolean') return Math.random() > 0.5;
  if (sampleValue === null) return null;

  return randomString(8);
};

const generateMockFromSample = (sample: unknown): unknown => {
  if (sample === null || sample === undefined) return null;

  if (Array.isArray(sample)) {
    if (sample.length === 0) return [];
    const templateItem = sample[0];
    return Array.from({ length: randomInt(1, 5) }, () => generateMockFromSample(templateItem));
  }

  if (typeof sample === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(sample as Record<string, unknown>)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = generateMockFromSample(value);
      } else if (Array.isArray(value)) {
        result[key] = generateMockFromSample(value);
      } else {
        result[key] = inferMockValue(key, value);
      }
    }
    return result;
  }

  return sample;
};

const JSONMockGenerator: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [mockOutput, setMockOutput] = useState('');
  const [error, setError] = useState('');
  const [arrayCount, setArrayCount] = useState<number>(3);
  const [generateAsArray, setGenerateAsArray] = useState(false);

  const generate = useCallback(() => {
    if (!jsonInput.trim()) { setError('请输入 JSON 样本数据'); return; }

    try {
      const sample = JSON.parse(jsonInput);
      setError('');

      if (generateAsArray && typeof sample === 'object' && !Array.isArray(sample)) {
        const results = Array.from({ length: arrayCount }, () => generateMockFromSample(sample));
        setMockOutput(JSON.stringify(results, null, 2));
      } else {
        const result = generateMockFromSample(sample);
        setMockOutput(JSON.stringify(result, null, 2));
      }
    } catch (err) {
      setError(`JSON 格式错误: ${err instanceof Error ? err.message : '解析失败'}`);
      setMockOutput('');
    }
  }, [jsonInput, arrayCount, generateAsArray]);

  const copyOutput = async () => {
    if (!mockOutput) return;
    try {
      await navigator.clipboard.writeText(mockOutput);
      antdMessage.success('已复制');
    } catch { antdMessage.error('复制失败'); }
  };

  return (
    <div className="json-mock-generator">
      <div className="jmg-input">
        <Text style={{ fontSize: 11, fontWeight: 600 }}>JSON 样本（根据结构和字段名自动生成 Mock 数据）</Text>
        <TextArea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={'{\n  "id": 1,\n  "name": "张三",\n  "email": "test@example.com",\n  "age": 25,\n  "created_at": "2024-01-01"\n}'}
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: 11 }}
        />
      </div>

      <div className="jmg-options">
        <Button
          size="small"
          type={generateAsArray ? 'primary' : 'default'}
          onClick={() => setGenerateAsArray(!generateAsArray)}
        >
          {generateAsArray ? '📦 生成数组' : '📄 单条'}
        </Button>
        {generateAsArray && (
          <Space size={4}>
            <Text style={{ fontSize: 11 }}>数量</Text>
            <InputNumber
              value={arrayCount}
              onChange={(v) => setArrayCount(v || 3)}
              min={1}
              max={50}
              size="small"
              style={{ width: 60 }}
            />
          </Space>
        )}
        <Button type="primary" size="small" icon={<ThunderboltOutlined />} onClick={generate} style={{ marginLeft: 'auto' }}>
          生成 Mock
        </Button>
      </div>

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} style={{ fontSize: 11 }} />}

      {mockOutput && (
        <div className="jmg-output">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: 600 }}>Mock 数据</Text>
            <Space size={4}>
              <Button size="small" onClick={generate}>🔄 重新生成</Button>
              <Button size="small" type="text" icon={<CopyOutlined />} onClick={copyOutput} />
            </Space>
          </div>
          <pre className="jmg-code">{mockOutput}</pre>
        </div>
      )}
    </div>
  );
};

export default JSONMockGenerator;
