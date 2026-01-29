import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  message as antdMessage,
} from 'antd';
import {
  CopyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../utils/message';

const { Text } = Typography;

const TimestampConverter: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [currentTimestampMs, setCurrentTimestampMs] = useState<number>(0);
  const [inputTimestamp, setInputTimestamp] = useState<string>('');
  const [inputDateTime, setInputDateTime] = useState<string>('');
  const [convertedTime, setConvertedTime] = useState<string>('');
  const [convertedTimestamp, setConvertedTimestamp] = useState<string>('');
  const [convertedTimestampMs, setConvertedTimestampMs] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 实时更新当前时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timestamp = Math.floor(now.getTime() / 1000);
      const timestampMs = now.getTime();
      const formattedTime = formatDateTime(now);
      
      setCurrentTime(formattedTime);
      setCurrentTimestamp(timestamp);
      setCurrentTimestampMs(timestampMs);
    };

    // 立即更新一次
    updateTime();
    // 延迟启动定时器，避免阻塞初始渲染
    let interval: NodeJS.Timeout | null = null;
    const timer = setTimeout(() => {
      interval = setInterval(updateTime, 1000);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // 格式化日期时间为 YYYY-MM-DD HH:mm:ss
  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 时间戳转日期时间
  const timestampToDateTime = (timestamp: string) => {
    try {
      setError('');
      const ts = parseInt(timestamp.trim(), 10);
      
      if (isNaN(ts)) {
        setError('请输入有效的时间戳（数字）');
        setConvertedTime('');
        return;
      }

      // 判断是秒级还是毫秒级时间戳
      const date = ts > 9999999999 ? new Date(ts) : new Date(ts * 1000);
      
      if (isNaN(date.getTime())) {
        setError('无效的时间戳');
        setConvertedTime('');
        return;
      }

      setConvertedTime(formatDateTime(date));
    } catch (err) {
      setError('转换失败，请检查输入');
      setConvertedTime('');
    }
  };

  // 日期时间转时间戳
  const dateTimeToTimestamp = (dateTime: string) => {
    try {
      setError('');
      
      if (!dateTime.trim()) {
        setError('请输入日期时间');
        setConvertedTimestamp('');
        setConvertedTimestampMs('');
        return;
      }

      // 支持多种格式
      let date: Date;
      
      // YYYY-MM-DD HH:mm:ss
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTime)) {
        date = new Date(dateTime.replace(' ', 'T'));
      }
      // YYYY-MM-DD HH:mm
      else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateTime)) {
        date = new Date(dateTime.replace(' ', 'T') + ':00');
      }
      // YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateTime)) {
        date = new Date(dateTime + 'T00:00:00');
      }
      // 尝试直接解析
      else {
        date = new Date(dateTime);
      }

      if (isNaN(date.getTime())) {
        setError('无效的日期时间格式，请使用 YYYY-MM-DD HH:mm:ss');
        setConvertedTimestamp('');
        setConvertedTimestampMs('');
        return;
      }

      const timestamp = Math.floor(date.getTime() / 1000);
      const timestampMs = date.getTime();
      setConvertedTimestamp(timestamp.toString());
      setConvertedTimestampMs(timestampMs.toString());
    } catch (err) {
      setError('转换失败，请检查输入格式');
      setConvertedTimestamp('');
      setConvertedTimestampMs('');
    }
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    antdMessage.success('已复制到剪贴板');
  };

  // 使用当前时间戳（10位）
  const useCurrentTimestamp = () => {
    setInputTimestamp(currentTimestamp.toString());
    timestampToDateTime(currentTimestamp.toString());
  };

  // 使用当前时间戳（13位）
  const useCurrentTimestampMs = () => {
    setInputTimestamp(currentTimestampMs.toString());
    timestampToDateTime(currentTimestampMs.toString());
  };

  // 使用当前时间
  const useCurrentTime = () => {
    setInputDateTime(currentTime);
    dateTimeToTimestamp(currentTime);
  };

  return (
    <div className="timestamp-converter" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
      {/* 实时时间显示 */}
      <Card 
        size="small" 
        title={
          <Space>
            <ClockCircleOutlined />
            <Text strong>当前时间</Text>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text>标准格式：</Text>
            <Space.Compact>
              <Text code>{currentTime}</Text>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(currentTime)}
              />
            </Space.Compact>
          </Space>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text>时间戳(10位)：</Text>
            <Space.Compact>
              <Text code>{currentTimestamp}</Text>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(currentTimestamp.toString())}
              />
            </Space.Compact>
          </Space>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text>时间戳(13位)：</Text>
            <Space.Compact>
              <Text code>{currentTimestampMs}</Text>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(currentTimestampMs.toString())}
              />
            </Space.Compact>
          </Space>
        </Space>
      </Card>

      {/* 时间戳转日期时间 */}
      <Card 
        size="small" 
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>时间戳 → 日期时间</Text>
            <Space>
              <Button size="small" onClick={useCurrentTimestamp}>10位</Button>
              <Button size="small" onClick={useCurrentTimestampMs}>13位</Button>
            </Space>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            value={inputTimestamp}
            onChange={(e) => {
              setInputTimestamp(e.target.value);
              if (e.target.value.trim()) {
                timestampToDateTime(e.target.value);
              } else {
                setConvertedTime('');
                setError('');
              }
            }}
            placeholder="输入时间戳（10位或13位）"
          />
          {convertedTime && (
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={convertedTime}
                readOnly
                style={{ flex: 1 }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(convertedTime)}
              />
            </Space.Compact>
          )}
        </Space>
      </Card>

      {/* 日期时间转时间戳 */}
      <Card 
        size="small" 
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>日期时间 → 时间戳</Text>
            <Button size="small" onClick={useCurrentTime}>使用当前</Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            value={inputDateTime}
            onChange={(e) => {
              setInputDateTime(e.target.value);
              if (e.target.value.trim()) {
                dateTimeToTimestamp(e.target.value);
              } else {
                setConvertedTimestamp('');
                setConvertedTimestampMs('');
                setError('');
              }
            }}
            placeholder="输入日期时间 (YYYY-MM-DD HH:mm:ss)"
          />
          {convertedTimestamp && (
            <>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={convertedTimestamp}
                  readOnly
                  addonBefore="10位时间戳"
                  style={{ flex: 1 }}
                />
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(convertedTimestamp)}
                />
              </Space.Compact>
              {convertedTimestampMs && (
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    value={convertedTimestampMs}
                    readOnly
                    addonBefore="13位时间戳"
                    style={{ flex: 1 }}
                  />
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(convertedTimestampMs)}
                  />
                </Space.Compact>
              )}
            </>
          )}
        </Space>
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
    </div>
  );
};

export default TimestampConverter;

