import React, { useState, useEffect } from 'react';
import { Input, message as antdMessage } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import './index.css';

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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timestamp = Math.floor(now.getTime() / 1000);
      const timestampMs = now.getTime();
      setCurrentTime(formatDateTime(now));
      setCurrentTimestamp(timestamp);
      setCurrentTimestampMs(timestampMs);
    };
    updateTime();
    let interval: NodeJS.Timeout | null = null;
    const timer = setTimeout(() => {
      interval = setInterval(updateTime, 1000);
    }, 100);
    return () => {
      clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, []);

  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const timestampToDateTime = (timestamp: string) => {
    try {
      setError('');
      const tsStr = timestamp.trim();
      const ts = parseInt(tsStr, 10);
      if (isNaN(ts)) { setError('请输入有效的时间戳（数字）'); setConvertedTime(''); return; }
      const len = tsStr.replace('-', '').length;
      const date = len >= 13 ? new Date(ts) : new Date(ts * 1000);
      if (isNaN(date.getTime())) { setError('无效的时间戳'); setConvertedTime(''); return; }
      setConvertedTime(formatDateTime(date));
    } catch {
      setError('转换失败，请检查输入');
      setConvertedTime('');
    }
  };

  const dateTimeToTimestamp = (dateTime: string) => {
    try {
      setError('');
      if (!dateTime.trim()) {
        setError('请输入日期时间');
        setConvertedTimestamp('');
        setConvertedTimestampMs('');
        return;
      }
      let date: Date;
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTime)) {
        date = new Date(dateTime.replace(' ', 'T'));
      } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateTime)) {
        date = new Date(dateTime.replace(' ', 'T') + ':00');
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateTime)) {
        date = new Date(dateTime + 'T00:00:00');
      } else {
        date = new Date(dateTime);
      }
      if (isNaN(date.getTime())) {
        setError('无效的日期时间格式，请使用 YYYY-MM-DD HH:mm:ss');
        setConvertedTimestamp('');
        setConvertedTimestampMs('');
        return;
      }
      setConvertedTimestamp(Math.floor(date.getTime() / 1000).toString());
      setConvertedTimestampMs(date.getTime().toString());
    } catch {
      setError('转换失败，请检查输入格式');
      setConvertedTimestamp('');
      setConvertedTimestampMs('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => antdMessage.success('已复制到剪贴板'))
      .catch(() => antdMessage.error('复制失败，请手动复制'));
  };

  const useCurrentTimestamp = () => {
    setInputTimestamp(currentTimestamp.toString());
    timestampToDateTime(currentTimestamp.toString());
  };

  const useCurrentTimestampMs = () => {
    setInputTimestamp(currentTimestampMs.toString());
    timestampToDateTime(currentTimestampMs.toString());
  };

  const useCurrentTime = () => {
    setInputDateTime(currentTime);
    dateTimeToTimestamp(currentTime);
  };

  return (
    <div className="timestamp-converter">
      {/* 实时时间条 */}
      <div className="ts-clock-strip">
        <div className="ts-clock-main">
          <span className="ts-clock-time">{currentTime}</span>
          <button className="ts-copy-btn" onClick={() => copyToClipboard(currentTime)} title="复制">
            <CopyOutlined />
          </button>
        </div>
        <div className="ts-clock-stamps">
          <div className="ts-stamp-item">
            <span className="ts-stamp-label">10位</span>
            <span className="ts-stamp-value">{currentTimestamp}</span>
            <button className="ts-copy-btn" onClick={() => copyToClipboard(currentTimestamp.toString())}>
              <CopyOutlined />
            </button>
          </div>
          <div className="ts-stamp-item">
            <span className="ts-stamp-label">13位</span>
            <span className="ts-stamp-value">{currentTimestampMs}</span>
            <button className="ts-copy-btn" onClick={() => copyToClipboard(currentTimestampMs.toString())}>
              <CopyOutlined />
            </button>
          </div>
        </div>
      </div>

      {/* 时间戳 → 日期时间 */}
      <div className="ts-section">
        <div className="ts-section-header">
          <span className="ts-section-title">时间戳 → 日期时间</span>
          <div className="ts-fill-group">
            <button className="ts-fill-btn" onClick={useCurrentTimestamp}>填入10位</button>
            <button className="ts-fill-btn" onClick={useCurrentTimestampMs}>填入13位</button>
          </div>
        </div>
        <Input
          value={inputTimestamp}
          onChange={(e) => {
            setInputTimestamp(e.target.value);
            if (e.target.value.trim()) timestampToDateTime(e.target.value);
            else { setConvertedTime(''); setError(''); }
          }}
          placeholder="输入时间戳（10位或13位）"
          size="small"
        />
        {convertedTime && (
          <div className="ts-result-row">
            <span className="ts-result-value">{convertedTime}</span>
            <button className="ts-copy-btn ts-copy-btn--inline" onClick={() => copyToClipboard(convertedTime)}>
              <CopyOutlined />
            </button>
          </div>
        )}
      </div>

      {/* 日期时间 → 时间戳 */}
      <div className="ts-section">
        <div className="ts-section-header">
          <span className="ts-section-title">日期时间 → 时间戳</span>
          <button className="ts-fill-btn" onClick={useCurrentTime}>填入当前</button>
        </div>
        <Input
          value={inputDateTime}
          onChange={(e) => {
            setInputDateTime(e.target.value);
            if (e.target.value.trim()) dateTimeToTimestamp(e.target.value);
            else { setConvertedTimestamp(''); setConvertedTimestampMs(''); setError(''); }
          }}
          placeholder="YYYY-MM-DD HH:mm:ss"
          size="small"
        />
        {convertedTimestamp && (
          <>
            <div className="ts-result-row">
              <span className="ts-result-label">10位</span>
              <span className="ts-result-value">{convertedTimestamp}</span>
              <button className="ts-copy-btn ts-copy-btn--inline" onClick={() => copyToClipboard(convertedTimestamp)}>
                <CopyOutlined />
              </button>
            </div>
            {convertedTimestampMs && (
              <div className="ts-result-row">
                <span className="ts-result-label">13位</span>
                <span className="ts-result-value">{convertedTimestampMs}</span>
                <button className="ts-copy-btn ts-copy-btn--inline" onClick={() => copyToClipboard(convertedTimestampMs)}>
                  <CopyOutlined />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default TimestampConverter;
