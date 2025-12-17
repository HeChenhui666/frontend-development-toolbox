import React, { useState, useEffect } from 'react';
import './index.css';
import { showMessage } from '../../utils/message';

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
    showMessage.success('已复制到剪贴板');
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
    <div className="timestamp-converter">
      {/* 实时时间显示 */}
      <div className="current-time-section">
        <div className="current-time-label">当前时间：</div>
        <div className="current-time-display">
          <div className="time-item">
            <span className="time-label">标准格式：</span>
            <span className="time-value">{currentTime}</span>
            <button 
              onClick={() => copyToClipboard(currentTime)} 
              className="copy-time-btn"
              title="复制"
            >
              📋
            </button>
          </div>
          <div className="time-item">
            <span className="time-label">时间戳(10位)：</span>
            <span className="time-value">{currentTimestamp}</span>
            <button 
              onClick={() => copyToClipboard(currentTimestamp.toString())} 
              className="copy-time-btn"
              title="复制"
            >
              📋
            </button>
          </div>
          <div className="time-item">
            <span className="time-label">时间戳(13位)：</span>
            <span className="time-value">{currentTimestampMs}</span>
            <button 
              onClick={() => copyToClipboard(currentTimestampMs.toString())} 
              className="copy-time-btn"
              title="复制"
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {/* 时间戳转日期时间 */}
      <div className="converter-section">
        <div className="converter-header">
          <label>时间戳 → 日期时间</label>
          <div className="use-current-buttons">
            <button onClick={useCurrentTimestamp} className="use-current-btn">
              10位
            </button>
            <button onClick={useCurrentTimestampMs} className="use-current-btn">
              13位
            </button>
          </div>
        </div>
        <div className="converter-input-group">
          <input
            type="text"
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
            className="converter-input"
          />
          {convertedTime && (
            <div className="converted-result">
              <span className="result-label">结果：</span>
              <span className="result-value">{convertedTime}</span>
              <button 
                onClick={() => copyToClipboard(convertedTime)} 
                className="copy-result-btn"
                title="复制"
              >
                📋
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 日期时间转时间戳 */}
      <div className="converter-section">
        <div className="converter-header">
          <label>日期时间 → 时间戳</label>
          <button onClick={useCurrentTime} className="use-current-btn">
            使用当前
          </button>
        </div>
        <div className="converter-input-group">
          <input
            type="text"
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
            className="converter-input"
          />
          {convertedTimestamp && (
            <>
              <div className="converted-result">
                <span className="result-label">10位时间戳：</span>
                <span className="result-value">{convertedTimestamp}</span>
                <button 
                  onClick={() => copyToClipboard(convertedTimestamp)} 
                  className="copy-result-btn"
                  title="复制"
                >
                  📋
                </button>
              </div>
              {convertedTimestampMs && (
                <div className="converted-result">
                  <span className="result-label">13位时间戳：</span>
                  <span className="result-value">{convertedTimestampMs}</span>
                  <button 
                    onClick={() => copyToClipboard(convertedTimestampMs)} 
                    className="copy-result-btn"
                    title="复制"
                  >
                    📋
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default TimestampConverter;

