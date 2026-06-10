import React, { useState, useCallback, useEffect } from 'react';
import './index.css';

// 简易五字母英文单词库
const WORD_LIST = [
  'apple','beach','brain','chair','dance','eagle','flame','ghost','heart','juice',
  'knife','lemon','mango','night','ocean','peace','queen','river','smile','tiger',
  'ultra','vivid','water','youth','zebra','above','blank','cloud','dream','earth',
  'field','grape','house','ivory','jolly','kneel','light','music','nerve','olive',
  'piano','quiet','radar','solar','train','unity','value','waste','xenon','yield',
  'angel','brave','craft','drift','elite','focus','glory','honor','image','judge',
  'labor','magic','noble','opera','power','quest','royal','steam','trace','urban',
];

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

interface LetterCell {
  letter: string;
  state: LetterState;
}

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

const Wordle: React.FC = () => {
  const [answer, setAnswer] = useState('');
  const [guesses, setGuesses] = useState<LetterCell[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('');
  const [usedLetters, setUsedLetters] = useState<Record<string, LetterState>>({});

  const startNewGame = useCallback(() => {
    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toUpperCase();
    setAnswer(word);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
    setMessage('');
    setUsedLetters({});
  }, []);

  useEffect(() => { startNewGame(); }, [startNewGame]);

  const evaluateGuess = useCallback((guess: string): LetterCell[] => {
    const result: LetterCell[] = [];
    const answerChars = answer.split('');
    const guessChars = guess.split('');
    const used = new Array(WORD_LENGTH).fill(false);

    // 先标记正确位置
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessChars[i] === answerChars[i]) {
        result[i] = { letter: guessChars[i], state: 'correct' };
        used[i] = true;
      }
    }

    // 再标记存在但位置不对
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (result[i]) continue;
      const foundIndex = answerChars.findIndex((ch, j) => ch === guessChars[i] && !used[j] && !result[j]?.state);
      if (foundIndex >= 0) {
        result[i] = { letter: guessChars[i], state: 'present' };
        used[foundIndex] = true;
      } else {
        result[i] = { letter: guessChars[i], state: 'absent' };
      }
    }

    return result;
  }, [answer]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH || gameOver) return;

    const evaluation = evaluateGuess(currentGuess);
    const newGuesses = [...guesses, evaluation];
    setGuesses(newGuesses);

    // 更新键盘字母状态
    const newUsed = { ...usedLetters };
    evaluation.forEach(({ letter, state }) => {
      const existing = newUsed[letter];
      if (state === 'correct') newUsed[letter] = 'correct';
      else if (state === 'present' && existing !== 'correct') newUsed[letter] = 'present';
      else if (!existing) newUsed[letter] = state;
    });
    setUsedLetters(newUsed);

    if (currentGuess === answer) {
      setGameOver(true);
      setWon(true);
      setMessage(`🎉 恭喜！你猜对了！用了 ${newGuesses.length} 次`);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      setMessage(`😔 游戏结束！答案是 ${answer}`);
    }

    setCurrentGuess('');
  }, [currentGuess, gameOver, guesses, answer, usedLetters, evaluateGuess]);

  const handleKeyPress = useCallback((key: string) => {
    if (gameOver) return;
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACK') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((prev) => prev + key);
    }
  }, [gameOver, currentGuess, submitGuess]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') handleKeyPress('ENTER');
      else if (e.key === 'Backspace') handleKeyPress('BACK');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const KEYBOARD_ROWS = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','BACK'],
  ];

  const renderGrid = () => {
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < MAX_GUESSES; i++) {
      const cells: React.ReactNode[] = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        if (i < guesses.length) {
          const cell = guesses[i][j];
          cells.push(
            <div key={j} className={`wordle-cell wordle-cell--${cell.state}`}>
              {cell.letter}
            </div>
          );
        } else if (i === guesses.length) {
          cells.push(
            <div key={j} className={`wordle-cell ${j < currentGuess.length ? 'wordle-cell--filled' : ''}`}>
              {currentGuess[j] || ''}
            </div>
          );
        } else {
          cells.push(<div key={j} className="wordle-cell" />);
        }
      }
      rows.push(<div key={i} className="wordle-row">{cells}</div>);
    }
    return rows;
  };

  return (
    <div className="wordle-game">
      <div className="wordle-header">
        <h3>Wordle 猜词</h3>
        <button className="wordle-new-btn" onClick={startNewGame}>新游戏</button>
      </div>
      {message && <div className={`wordle-message ${won ? 'wordle-message--won' : ''}`}>{message}</div>}
      <div className="wordle-grid">{renderGrid()}</div>
      <div className="wordle-keyboard">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="wordle-keyboard-row">
            {row.map((key) => (
              <button
                key={key}
                className={`wordle-key ${key.length > 1 ? 'wordle-key--wide' : ''} ${usedLetters[key] ? `wordle-key--${usedLetters[key]}` : ''}`}
                onClick={() => handleKeyPress(key)}
              >
                {key === 'BACK' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wordle;
