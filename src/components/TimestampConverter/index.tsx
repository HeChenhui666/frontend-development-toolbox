import React, { useState, useEffect, useRef } from 'react';
import { Input, Collapse, Tabs, Select, Button, Space, Typography, message as antdMessage } from 'antd';
import { CopyOutlined, ClockCircleOutlined, FieldTimeOutlined, CalendarOutlined, PlayCircleOutlined, PauseCircleOutlined, UndoOutlined } from '@ant-design/icons';
import './index.css';

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

      {/* 扩展工具 */}
      <TimestampExtendedTools formatDateTime={formatDateTime} copyToClipboard={copyToClipboard} />
    </div>
  );
};

/* ─── 时区数据 ─── */
const TIMEZONE_OPTIONS = [
  { value: 'Asia/Shanghai', label: '🇨🇳 北京/上海 (CST)' },
  { value: 'Asia/Tokyo', label: '🇯🇵 东京 (JST)' },
  { value: 'Asia/Seoul', label: '🇰🇷 首尔 (KST)' },
  { value: 'Asia/Singapore', label: '🇸🇬 新加坡 (SGT)' },
  { value: 'Asia/Kolkata', label: '🇮🇳 新德里 (IST)' },
  { value: 'Asia/Dubai', label: '🇦🇪 迪拜 (GST)' },
  { value: 'Europe/London', label: '🇬🇧 伦敦 (GMT/BST)' },
  { value: 'Europe/Paris', label: '🇫🇷 巴黎 (CET)' },
  { value: 'Europe/Berlin', label: '🇩🇪 柏林 (CET)' },
  { value: 'Europe/Moscow', label: '🇷🇺 莫斯科 (MSK)' },
  { value: 'America/New_York', label: '🇺🇸 纽约 (EST)' },
  { value: 'America/Chicago', label: '🇺🇸 芝加哥 (CST)' },
  { value: 'America/Los_Angeles', label: '🇺🇸 洛杉矶 (PST)' },
  { value: 'America/Sao_Paulo', label: '🇧🇷 圣保罗 (BRT)' },
  { value: 'Pacific/Auckland', label: '🇳🇿 奥克兰 (NZST)' },
  { value: 'Australia/Sydney', label: '🇦🇺 悉尼 (AEST)' },
];

/* ─── Cron 解析器 ─── */
const CRON_FIELDS = ['分', '时', '日', '月', '周'];

const parseCronField = (field: string, fieldIndex: number): string => {
  const names: Record<number, string[]> = { 4: ['日', '一', '二', '三', '四', '五', '六'] };
  const fieldName = CRON_FIELDS[fieldIndex];

  if (field === '*') return `每${fieldName}`;
  if (field.includes('/')) {
    const [base, step] = field.split('/');
    return base === '*' ? `每隔 ${step} ${fieldName}` : `从第 ${base} ${fieldName}起，每隔 ${step} ${fieldName}`;
  }
  if (field.includes('-')) {
    const [start, end] = field.split('-');
    return `${fieldName} ${start}-${end}`;
  }
  if (field.includes(',')) {
    const values = field.split(',').map((v) => {
      if (fieldIndex === 4 && names[4][parseInt(v)]) return `周${names[4][parseInt(v)]}`;
      return v;
    });
    return `${fieldName}: ${values.join(', ')}`;
  }
  if (fieldIndex === 4 && names[4][parseInt(field)]) return `周${names[4][parseInt(field)]}`;
  return `${fieldName}: ${field}`;
};

const explainCron = (expression: string): string => {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return '无效的 Cron 表达式（需要 5-6 个字段）';
  const explanations = parts.slice(0, 5).map((part, index) => parseCronField(part, index));
  return explanations.join(' · ');
};

const getNextCronExecutions = (expression: string, count: number = 5): Date[] => {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return [];

  const matchField = (value: number, field: string): boolean => {
    if (field === '*') return true;
    if (field.includes('/')) {
      const [base, step] = field.split('/');
      const start = base === '*' ? 0 : parseInt(base);
      const stepNum = parseInt(step);
      return (value - start) % stepNum === 0 && value >= start;
    }
    if (field.includes('-')) {
      const [start, end] = field.split('-');
      return value >= parseInt(start) && value <= parseInt(end);
    }
    if (field.includes(',')) return field.split(',').map(Number).includes(value);
    return value === parseInt(field);
  };

  const results: Date[] = [];
  const now = new Date();
  const candidate = new Date(now.getTime() + 60000); // 从下一分钟开始
  candidate.setSeconds(0, 0);

  const maxIterations = 525600; // 最多查 1 年
  for (let iteration = 0; iteration < maxIterations && results.length < count; iteration++) {
    const minute = candidate.getMinutes();
    const hour = candidate.getHours();
    const day = candidate.getDate();
    const month = candidate.getMonth() + 1;
    const weekday = candidate.getDay();

    if (matchField(minute, parts[0]) && matchField(hour, parts[1]) && matchField(day, parts[2]) && matchField(month, parts[3]) && matchField(weekday, parts[4])) {
      results.push(new Date(candidate));
    }
    candidate.setMinutes(candidate.getMinutes() + 1);
  }
  return results;
};

/* ─── 扩展工具子组件 ─── */
const TimestampExtendedTools: React.FC<{
  formatDateTime: (date: Date) => string;
  copyToClipboard: (text: string) => void;
}> = ({ formatDateTime, copyToClipboard }) => {
  // 多时区
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>(['Asia/Shanghai', 'America/New_York', 'Europe/London']);
  const [tzNow, setTzNow] = useState(Date.now());

  // Cron
  const [cronExpression, setCronExpression] = useState('');
  const [cronExplanation, setCronExplanation] = useState('');
  const [cronNextRuns, setCronNextRuns] = useState<Date[]>([]);

  // 倒计时
  const [timerMode, setTimerMode] = useState<'countdown' | 'stopwatch'>('stopwatch');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerElapsed, setTimerElapsed] = useState(0); // ms
  const [countdownTarget, setCountdownTarget] = useState('');
  const [countdownRemaining, setCountdownRemaining] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartRef = useRef<number>(0);
  const timerAccRef = useRef<number>(0);

  // 相对时间
  const [dateA, setDateA] = useState('');
  const [dateB, setDateB] = useState('');
  const [dateDiffResult, setDateDiffResult] = useState('');

  // 时区时钟刷新
  useEffect(() => {
    const interval = setInterval(() => setTzNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 计时器逻辑
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startStopwatch = () => {
    if (timerRunning) return;
    timerStartRef.current = Date.now();
    setTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimerElapsed(timerAccRef.current + (Date.now() - timerStartRef.current));
    }, 50);
  };

  const pauseStopwatch = () => {
    if (!timerRunning) return;
    timerAccRef.current += Date.now() - timerStartRef.current;
    setTimerRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTimerElapsed(timerAccRef.current);
  };

  const resetStopwatch = () => {
    setTimerRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    timerAccRef.current = 0;
    timerStartRef.current = 0;
    setTimerElapsed(0);
  };

  const formatElapsed = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  // 倒计时
  useEffect(() => {
    if (timerMode !== 'countdown' || !countdownTarget) { setCountdownRemaining(''); return; }
    const target = new Date(countdownTarget.includes('T') ? countdownTarget : countdownTarget.replace(' ', 'T'));
    if (isNaN(target.getTime())) { setCountdownRemaining('无效日期'); return; }

    const update = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setCountdownRemaining('已到达目标时间！'); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const parts = [];
      if (days > 0) parts.push(`${days} 天`);
      if (hours > 0) parts.push(`${hours} 小时`);
      parts.push(`${minutes} 分 ${seconds} 秒`);
      setCountdownRemaining(parts.join(' '));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timerMode, countdownTarget]);

  const parseCron = () => {
    if (!cronExpression.trim()) { antdMessage.warning('请输入 Cron 表达式'); return; }
    setCronExplanation(explainCron(cronExpression));
    setCronNextRuns(getNextCronExecutions(cronExpression));
  };

  const calculateDateDiff = () => {
    if (!dateA.trim() || !dateB.trim()) { antdMessage.warning('请输入两个日期'); return; }
    const parseDate = (str: string): Date => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + 'T00:00:00');
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(str)) return new Date(str.replace(' ', 'T'));
      return new Date(str);
    };
    const a = parseDate(dateA.trim());
    const b = parseDate(dateB.trim());
    if (isNaN(a.getTime()) || isNaN(b.getTime())) { setDateDiffResult('日期格式无效'); return; }

    const diffMs = Math.abs(b.getTime() - a.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;

    const parts = [];
    if (weeks > 0) parts.push(`${weeks} 周`);
    if (remainingDays > 0) parts.push(`${remainingDays} 天`);
    if (remainingHours > 0) parts.push(`${remainingHours} 小时`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} 分钟`);

    const direction = b.getTime() >= a.getTime() ? '后' : '前';
    setDateDiffResult(`相差: ${parts.join(' ') || '0'}\n共 ${totalDays} 天 / ${totalHours} 小时 / ${totalMinutes} 分钟\nB 在 A 之${direction}`);
  };

  const formatInTimezone = (tz: string): string => {
    try {
      return new Date(tzNow).toLocaleString('zh-CN', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return '不支持的时区'; }
  };

  const getTimezoneOffset = (tz: string): string => {
    try {
      const formatted = new Date(tzNow).toLocaleString('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
      const match = formatted.match(/GMT([+-]\d+)?/);
      return match ? (match[1] ? `UTC${match[1]}` : 'UTC+0') : '';
    } catch { return ''; }
  };

  const timezoneTab = (
    <div className="ts-ext-content">
      <Select
        mode="multiple"
        value={selectedTimezones}
        onChange={setSelectedTimezones}
        options={TIMEZONE_OPTIONS}
        placeholder="选择要显示的时区"
        size="small"
        style={{ width: '100%', marginBottom: 6 }}
        maxTagCount={2}
      />
      <div className="ts-tz-list">
        {selectedTimezones.map((tz) => {
          const option = TIMEZONE_OPTIONS.find((o) => o.value === tz);
          return (
            <div key={tz} className="ts-tz-item">
              <div className="ts-tz-name">{option?.label || tz}</div>
              <div className="ts-tz-time">
                <span className="ts-tz-offset">{getTimezoneOffset(tz)}</span>
                <span className="ts-tz-value">{formatInTimezone(tz)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const cronTab = (
    <div className="ts-ext-content">
      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={cronExpression}
          onChange={(e) => setCronExpression(e.target.value)}
          placeholder="如: */5 * * * * (每5分钟)"
          size="small"
          onPressEnter={parseCron}
        />
        <Button size="small" type="primary" onClick={parseCron}>解析</Button>
      </Space.Compact>
      <div style={{ fontSize: 10, color: 'var(--theme-textMuted)', marginTop: 2 }}>
        格式: 分 时 日 月 周 &nbsp;|&nbsp;
        <span style={{ cursor: 'pointer', color: 'var(--theme-primary)' }} onClick={() => { setCronExpression('0 9 * * 1-5'); }}>工作日9点</span>
        &nbsp;·&nbsp;
        <span style={{ cursor: 'pointer', color: 'var(--theme-primary)' }} onClick={() => { setCronExpression('*/30 * * * *'); }}>每30分钟</span>
        &nbsp;·&nbsp;
        <span style={{ cursor: 'pointer', color: 'var(--theme-primary)' }} onClick={() => { setCronExpression('0 0 1 * *'); }}>每月1号</span>
      </div>
      {cronExplanation && (
        <div className="ts-cron-result">
          <div className="ts-cron-explain">{cronExplanation}</div>
          {cronNextRuns.length > 0 && (
            <div className="ts-cron-runs">
              <Text style={{ fontSize: 10, fontWeight: 600, color: 'var(--theme-primary)' }}>未来执行时间:</Text>
              {cronNextRuns.map((date, index) => (
                <div key={index} style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--theme-text)' }}>
                  {index + 1}. {formatDateTime(date)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const timerTab = (
    <div className="ts-ext-content">
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <Button size="small" type={timerMode === 'stopwatch' ? 'primary' : 'default'} onClick={() => { setTimerMode('stopwatch'); resetStopwatch(); }}>⏱ 秒表</Button>
        <Button size="small" type={timerMode === 'countdown' ? 'primary' : 'default'} onClick={() => { setTimerMode('countdown'); resetStopwatch(); }}>⏳ 倒计时</Button>
      </div>
      {timerMode === 'stopwatch' ? (
        <div className="ts-timer-display">
          <div className="ts-timer-value">{formatElapsed(timerElapsed)}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!timerRunning ? (
              <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={startStopwatch}>开始</Button>
            ) : (
              <Button size="small" icon={<PauseCircleOutlined />} onClick={pauseStopwatch}>暂停</Button>
            )}
            <Button size="small" icon={<UndoOutlined />} onClick={resetStopwatch}>重置</Button>
            {timerElapsed > 0 && (
              <Button size="small" type="text" onClick={() => copyToClipboard(formatElapsed(timerElapsed))}>
                <CopyOutlined />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="ts-timer-display">
          <Input
            value={countdownTarget}
            onChange={(e) => setCountdownTarget(e.target.value)}
            placeholder="目标时间: 2026-12-31 23:59:59"
            size="small"
          />
          {countdownRemaining && (
            <div className="ts-countdown-result">
              <FieldTimeOutlined style={{ color: 'var(--theme-primary)' }} />
              <span>{countdownRemaining}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const dateDiffTab = (
    <div className="ts-ext-content">
      <div>
        <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>日期 A</Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input value={dateA} onChange={(e) => setDateA(e.target.value)} placeholder="2026-01-01" size="small" />
          <Button size="small" onClick={() => setDateA(formatDateTime(new Date()))}>当前</Button>
        </Space.Compact>
      </div>
      <div>
        <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>日期 B</Text>
        <Space.Compact style={{ width: '100%' }}>
          <Input value={dateB} onChange={(e) => setDateB(e.target.value)} placeholder="2026-12-31" size="small" />
          <Button size="small" onClick={() => setDateB(formatDateTime(new Date()))}>当前</Button>
        </Space.Compact>
      </div>
      <Button size="small" type="primary" icon={<CalendarOutlined />} onClick={calculateDateDiff} block>计算差值</Button>
      {dateDiffResult && (
        <div className="ts-datediff-result">
          {dateDiffResult.split('\n').map((line, index) => (
            <div key={index} style={{ fontSize: 11, fontFamily: index > 0 ? 'monospace' : undefined }}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Collapse
      size="small"
      items={[{
        key: 'extended',
        label: <Space size={4}><ClockCircleOutlined /><span style={{ fontSize: 12 }}>扩展工具</span></Space>,
        children: (
          <Tabs
            size="small"
            items={[
              { key: 'timezone', label: '多时区', children: timezoneTab },
              { key: 'cron', label: 'Cron', children: cronTab },
              { key: 'timer', label: '计时器', children: timerTab },
              { key: 'datediff', label: '日期差', children: dateDiffTab },
            ]}
            style={{ marginTop: -8 }}
          />
        ),
      }]}
    />
  );
};

export default TimestampConverter;
