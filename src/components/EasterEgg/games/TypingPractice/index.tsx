import React, { useState, useCallback, useEffect, useRef } from 'react';
import './index.css';

const SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Pack my box with five dozen liquor jugs.',
  'How vexingly quick daft zebras jump!',
  'React makes it painless to create interactive UIs.',
  'TypeScript adds optional static typing to JavaScript.',
  'A journey of a thousand miles begins with a single step.',
  'To be or not to be, that is the question.',
  'All that glitters is not gold.',
  'Code is like humor. When you have to explain it, it is bad.',
  'First, solve the problem. Then, write the code.',
  'Simplicity is the soul of efficiency.',
  'Talk is cheap. Show me the code.',
  'Programs must be written for people to read.',
  'Any fool can write code that a computer can understand.',
  'The best error message is the one that never shows up.',
  'Make it work, make it right, make it fast.',
];

const TypingPractice: React.FC = () => {
  const [targetText, setTargetText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickNewSentence = useCallback(() => {
    const sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    setTargetText(sentence);
    setTypedText('');
    setStarted(false);
    setFinished(false);
    setStartTime(0);
    setEndTime(0);
    setErrors(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => { pickNewSentence(); }, [pickNewSentence]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (finished) return;
    const value = e.target.value;

    if (!started) {
      setStarted(true);
      setStartTime(Date.now());
    }

    setTypedText(value);

    // 计算错误字符数
    let errorCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== targetText[i]) errorCount++;
    }
    setErrors(errorCount);

    if (value.length >= targetText.length) {
      setFinished(true);
      setEndTime(Date.now());
    }
  }, [started, finished, targetText]);

  const elapsedSeconds = finished
    ? (endTime - startTime) / 1000
    : started ? (Date.now() - startTime) / 1000 : 0;

  const wordsPerMinute = finished && elapsedSeconds > 0
    ? Math.round((targetText.split(' ').length / elapsedSeconds) * 60)
    : 0;

  const accuracy = typedText.length > 0
    ? Math.round(((typedText.length - errors) / typedText.length) * 100)
    : 100;

  const renderTargetText = () => {
    return targetText.split('').map((char, index) => {
      let className = 'tp-char';
      if (index < typedText.length) {
        className += typedText[index] === char ? ' tp-char--correct' : ' tp-char--wrong';
      } else if (index === typedText.length) {
        className += ' tp-char--cursor';
      }
      return <span key={index} className={className}>{char}</span>;
    });
  };

  return (
    <div className="typing-practice">
      <div className="tp-header">
        <h3>打字练习</h3>
        <button className="tp-new-btn" onClick={pickNewSentence}>换一句</button>
      </div>

      <div className="tp-target">{renderTargetText()}</div>

      <input
        ref={inputRef}
        className="tp-input"
        value={typedText}
        onChange={handleInput}
        disabled={finished}
        placeholder="在此开始打字..."
        spellCheck={false}
        autoComplete="off"
      />

      <div className="tp-stats">
        {finished ? (
          <>
            <div className="tp-stat">
              <span className="tp-stat-value">{wordsPerMinute}</span>
              <span className="tp-stat-label">WPM</span>
            </div>
            <div className="tp-stat">
              <span className="tp-stat-value">{accuracy}%</span>
              <span className="tp-stat-label">准确率</span>
            </div>
            <div className="tp-stat">
              <span className="tp-stat-value">{elapsedSeconds.toFixed(1)}s</span>
              <span className="tp-stat-label">用时</span>
            </div>
            <div className="tp-stat">
              <span className="tp-stat-value">{errors}</span>
              <span className="tp-stat-label">错误</span>
            </div>
          </>
        ) : started ? (
          <span className="tp-hint">输入中...</span>
        ) : (
          <span className="tp-hint">点击输入框开始打字</span>
        )}
      </div>

      {finished && (
        <button className="tp-retry-btn" onClick={pickNewSentence}>
          🔄 再来一次
        </button>
      )}
    </div>
  );
};

export default TypingPractice;
