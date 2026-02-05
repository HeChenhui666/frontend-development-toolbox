import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './index.css';

type Difficulty = 'easy' | 'normal' | 'hard';
type GameStatus = 'playing' | 'won';

interface Cell {
  row: number;
  col: number;
  value: number | null;
  fixed: boolean;
  notes: number[];
}

const SETTINGS: Record<Difficulty, { removeCount: number }> = {
  easy: { removeCount: 36 },
  normal: { removeCount: 46 },
  hard: { removeCount: 54 },
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const shuffle = <T,>(items: T[]) => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const generateSolvedGrid = () => {
  const baseRow = [0, 1, 2];
  const rowOrder = shuffle(baseRow).flatMap((band) =>
    shuffle(baseRow).map((row) => band * 3 + row)
  );
  const colOrder = shuffle(baseRow).flatMap((stack) =>
    shuffle(baseRow).map((col) => stack * 3 + col)
  );
  const numberOrder = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const pattern = (row: number, col: number) => (row * 3 + Math.floor(row / 3) + col) % 9;

  return rowOrder.map((row) =>
    colOrder.map((col) => numberOrder[pattern(row, col)])
  );
};

const generatePuzzleValues = (difficulty: Difficulty) => {
  const solved = generateSolvedGrid();
  const puzzle: (number | null)[][] = solved.map((row) => row.map((value) => value));
  const positions = shuffle(Array.from({ length: 81 }, (_, index) => index));
  const removeCount = SETTINGS[difficulty].removeCount;
  for (let i = 0; i < removeCount; i += 1) {
    const position = positions[i];
    const row = Math.floor(position / 9);
    const col = position % 9;
    puzzle[row][col] = null;
  }
  return { puzzle, solved };
};

const INITIAL_GAME = generatePuzzleValues('easy');

const buildBoard = (values: (number | null)[][]): Cell[][] =>
  values.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      row: rowIndex,
      col: colIndex,
      value,
      fixed: value !== null,
      notes: [],
    }))
  );

const cloneBoard = (board: Cell[][]): Cell[][] =>
  board.map((row) => row.map((cell) => ({ ...cell, notes: [...cell.notes] })));

const Sudoku: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [initialValues, setInitialValues] = useState<(number | null)[][]>(
    () => INITIAL_GAME.puzzle
  );
  const [solutionValues, setSolutionValues] = useState<number[][]>(
    () => INITIAL_GAME.solved
  );
  const [board, setBoard] = useState<Cell[][]>(() => buildBoard(initialValues));
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [noteMode, setNoteMode] = useState(false);
  const [history, setHistory] = useState<Cell[][]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const storageKey = useMemo(() => `sudoku-best-${difficulty}`, [difficulty]);

  const loadBestTime = useCallback(() => {
    try {
      const value = localStorage.getItem(storageKey);
      const parsed = value ? Number(value) : null;
      return parsed && !Number.isNaN(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const saveBestTime = useCallback(
    (time: number) => {
      try {
        localStorage.setItem(storageKey, String(time));
      } catch {
        // ignore storage errors
      }
    },
    [storageKey]
  );

  const startNewGame = useCallback((nextDifficulty: Difficulty) => {
    const { puzzle, solved } = generatePuzzleValues(nextDifficulty);
    setDifficulty(nextDifficulty);
    setInitialValues(puzzle);
    setSolutionValues(solved);
    setBoard(buildBoard(puzzle));
    setSelected(null);
    setStatus('playing');
    setNoteMode(false);
    setHistory([]);
    setStartedAt(Date.now());
    setElapsed(0);
  }, []);

  const resetBoard = useCallback(() => {
    setBoard(buildBoard(initialValues));
    setSelected(null);
    setStatus('playing');
    setHistory([]);
    setStartedAt(Date.now());
    setElapsed(0);
  }, [initialValues]);

  const emptyCount = useMemo(
    () => board.flat().filter((cell) => cell.value === null).length,
    [board]
  );

  const conflictMap = useMemo(() => {
    const conflicts = Array.from({ length: 9 }, () => Array(9).fill(false));
    for (let row = 0; row < 9; row += 1) {
      const seen = new Map<number, number[]>();
      for (let col = 0; col < 9; col += 1) {
        const value = board[row][col].value;
        if (!value) continue;
        const positions = seen.get(value) ?? [];
        positions.push(col);
        seen.set(value, positions);
      }
      seen.forEach((cols) => {
        if (cols.length > 1) {
          cols.forEach((col) => {
            conflicts[row][col] = true;
          });
        }
      });
    }
    for (let col = 0; col < 9; col += 1) {
      const seen = new Map<number, number[]>();
      for (let row = 0; row < 9; row += 1) {
        const value = board[row][col].value;
        if (!value) continue;
        const positions = seen.get(value) ?? [];
        positions.push(row);
        seen.set(value, positions);
      }
      seen.forEach((rows) => {
        if (rows.length > 1) {
          rows.forEach((row) => {
            conflicts[row][col] = true;
          });
        }
      });
    }
    for (let boxRow = 0; boxRow < 3; boxRow += 1) {
      for (let boxCol = 0; boxCol < 3; boxCol += 1) {
        const seen = new Map<number, Array<[number, number]>>();
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row += 1) {
          for (let col = boxCol * 3; col < boxCol * 3 + 3; col += 1) {
            const value = board[row][col].value;
            if (!value) continue;
            const positions = seen.get(value) ?? [];
            positions.push([row, col]);
            seen.set(value, positions);
          }
        }
        seen.forEach((positions) => {
          if (positions.length > 1) {
            positions.forEach(([row, col]) => {
              conflicts[row][col] = true;
            });
          }
        });
      }
    }
    return conflicts;
  }, [board]);

  const isComplete = useMemo(() => {
    if (emptyCount > 0) return false;
    return !conflictMap.some((row) => row.some((value) => value));
  }, [emptyCount, conflictMap]);

  const highlights = useMemo(() => {
    if (!selected) {
      return { peers: new Set<string>(), sameValue: new Set<string>() };
    }
    const key = (row: number, col: number) => `${row}-${col}`;
    const peers = new Set<string>();
    for (let index = 0; index < 9; index += 1) {
      peers.add(key(selected.row, index));
      peers.add(key(index, selected.col));
    }
    const startRow = Math.floor(selected.row / 3) * 3;
    const startCol = Math.floor(selected.col / 3) * 3;
    for (let row = startRow; row < startRow + 3; row += 1) {
      for (let col = startCol; col < startCol + 3; col += 1) {
        peers.add(key(row, col));
      }
    }
    const selectedValue = board[selected.row][selected.col].value;
    const sameValue = new Set<string>();
    if (selectedValue) {
      for (let row = 0; row < 9; row += 1) {
        for (let col = 0; col < 9; col += 1) {
          if (board[row][col].value === selectedValue) {
            sameValue.add(key(row, col));
          }
        }
      }
    }
    return { peers, sameValue };
  }, [selected, board]);

  const pushHistory = useCallback((snapshot: Cell[][]) => {
    setHistory((prev) => {
      const next = [cloneBoard(snapshot), ...prev];
      return next.slice(0, 60);
    });
  }, []);

  const applyValue = useCallback(
    (value: number | null) => {
      if (!selected) return;
      if (status === 'won') return;
      setBoard((prev) => {
        const target = prev[selected.row][selected.col];
        if (target.fixed) return prev;
        if (target.value === value && (value !== null || target.notes.length === 0)) return prev;
        pushHistory(prev);
        return prev.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (rowIndex === selected.row && colIndex === selected.col) {
              return {
                ...cell,
                value,
                notes: [],
              };
            }
            return cell;
          })
        );
      });
    },
    [selected, status, pushHistory]
  );

  const applyNote = useCallback(
    (value: number | null) => {
      if (!selected) return;
      if (status === 'won') return;
      setBoard((prev) => {
        const target = prev[selected.row][selected.col];
        if (target.fixed) return prev;
        if (target.value !== null) return prev;
        if (value === null && target.notes.length === 0) return prev;
        pushHistory(prev);
        return prev.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (rowIndex !== selected.row || colIndex !== selected.col) return cell;
            if (value === null) {
              return { ...cell, notes: [] };
            }
            const exists = cell.notes.includes(value);
            const nextNotes = exists
              ? cell.notes.filter((item) => item !== value)
              : [...cell.notes, value].sort((a, b) => a - b);
            return { ...cell, notes: nextNotes };
          })
        );
      });
    },
    [selected, status, pushHistory]
  );

  const handleUndo = useCallback(() => {
    if (status === 'won') return;
    setHistory((prev) => {
      const [latest, ...rest] = prev;
      if (!latest) return prev;
      setBoard(cloneBoard(latest));
      return rest;
    });
  }, [status]);

  const handleHint = useCallback(() => {
    if (status === 'won') return;
    let target =
      selected &&
      !board[selected.row][selected.col].fixed &&
      board[selected.row][selected.col].value === null
        ? selected
        : null;
    if (!target) {
      const firstEmpty = board.flat().find((cell) => cell.value === null && !cell.fixed);
      if (firstEmpty) target = { row: firstEmpty.row, col: firstEmpty.col };
    }
    if (!target) return;
    const { row, col } = target;
    setSelected({ row, col });
    setBoard((prev) => {
      const target = prev[row][col];
      if (target.fixed) return prev;
      if (target.value !== null && target.value === solutionValues[row][col]) return prev;
      pushHistory(prev);
      return prev.map((rowCells, rowIndex) =>
        rowCells.map((cell, colIndex) =>
          rowIndex === row && colIndex === col
            ? { ...cell, value: solutionValues[row][col], notes: [] }
            : cell
        )
      );
    });
  }, [status, board, selected, solutionValues, pushHistory]);


  useEffect(() => {
    setBestTime(loadBestTime());
  }, [loadBestTime]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [status, startedAt]);

  useEffect(() => {
    if (!isComplete || status === 'won') return;
    setStatus('won');
    const finalElapsed = Math.floor((Date.now() - startedAt) / 1000);
    setElapsed(finalElapsed);
    if (bestTime === null || finalElapsed < bestTime) {
      setBestTime(finalElapsed);
      saveBestTime(finalElapsed);
    }
  }, [isComplete, status, startedAt, bestTime, saveBestTime]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!selected) return;
      if (status === 'won') return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        const value = Number(event.key);
        if (noteMode) {
          applyNote(value);
        } else {
          applyValue(value);
        }
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
        event.preventDefault();
        if (noteMode) {
          applyNote(null);
        } else {
          applyValue(null);
        }
        return;
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setNoteMode((prev) => !prev);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setSelected(null);
        return;
      }
      const moveMap: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };
      const move = moveMap[event.key];
      if (move) {
        event.preventDefault();
        setSelected((prev) => {
          if (!prev) return prev;
          const nextRow = (prev.row + move[0] + 9) % 9;
          const nextCol = (prev.col + move[1] + 9) % 9;
          return { row: nextRow, col: nextCol };
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [applyValue, applyNote, selected, status, noteMode]);

  return (
    <div className="sudoku">
      <div className="sudoku-toolbar">
        <div className="sudoku-controls">
          <select
            className="sudoku-select"
            value={difficulty}
            onChange={(event) => startNewGame(event.target.value as Difficulty)}
          >
            <option value="easy">简单</option>
            <option value="normal">普通</option>
            <option value="hard">困难</option>
          </select>
          <button className="sudoku-button" onClick={() => startNewGame(difficulty)}>
            新局
          </button>
          <button className="sudoku-button ghost" onClick={resetBoard}>
            重置
          </button>
          <button
            className={`sudoku-button ghost ${noteMode ? 'active' : ''}`}
            onClick={() => setNoteMode((prev) => !prev)}
          >
            笔记
          </button>
          <button
            className="sudoku-button ghost"
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            撤销
          </button>
          <button className="sudoku-button ghost" onClick={handleHint}>
            提示
          </button>
        </div>
        <div className="sudoku-status">
          <span className="sudoku-status-pill">空格: {emptyCount}</span>
          <span className="sudoku-status-pill">用时: {formatTime(elapsed)}</span>
          <span className="sudoku-status-pill">
            最佳: {bestTime === null ? '--' : formatTime(bestTime)}
          </span>
          <span className="sudoku-status-pill">
            笔记: {noteMode ? '开' : '关'}
          </span>
        </div>
      </div>

      <div className="sudoku-board-wrapper">
        <div className="sudoku-board">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
              const isPeer = highlights.peers.has(key);
              const isSameValue = highlights.sameValue.has(key);
              const isConflict = conflictMap[rowIndex][colIndex];
              const className = [
                'sudoku-cell',
                cell.fixed ? 'fixed' : '',
                isSelected ? 'selected' : '',
                isPeer && !isSelected ? 'peer' : '',
                isSameValue && !isSelected ? 'same-value' : '',
                isConflict ? 'conflict' : '',
              ]
                .filter(Boolean)
                .join(' ');
              const borderRight =
                (colIndex + 1) % 3 === 0 && colIndex !== 8
                  ? '2px solid var(--theme-borderStrong, #334155)'
                  : '1px solid var(--theme-borderLight, #e2e8f0)';
              const borderBottom =
                (rowIndex + 1) % 3 === 0 && rowIndex !== 8
                  ? '2px solid var(--theme-borderStrong, #334155)'
                  : '1px solid var(--theme-borderLight, #e2e8f0)';
              return (
                <button
                  key={key}
                  className={className}
                  onClick={() => setSelected({ row: rowIndex, col: colIndex })}
                  style={{
                    borderRight,
                    borderBottom,
                  }}
                >
                  {cell.value ?? (
                    <span className="sudoku-notes">
                      {Array.from({ length: 9 }, (_, idx) => {
                        const value = idx + 1;
                        return (
                          <span
                            key={value}
                            className={`sudoku-note ${cell.notes.includes(value) ? 'active' : ''}`}
                          >
                            {value}
                          </span>
                        );
                      })}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {status === 'won' && (
        <div className="sudoku-win-banner">🎉 完成数独！用时 {formatTime(elapsed)}</div>
      )}

      <div className="sudoku-pad">
        {Array.from({ length: 9 }, (_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              className="sudoku-pad-button"
              onClick={() => (noteMode ? applyNote(value) : applyValue(value))}
            >
              {value}
            </button>
          );
        })}
        <button
          className="sudoku-pad-button danger"
          onClick={() => (noteMode ? applyNote(null) : applyValue(null))}
        >
          清空
        </button>
      </div>

      <div className="sudoku-hint">
        点击格子输入数字，支持键盘数字与方向键移动，按 N 切换笔记模式。
      </div>
    </div>
  );
};

export default Sudoku;
