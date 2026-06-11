import React, { useEffect, useMemo, useState } from 'react';
import './index.css';

type Difficulty = 'easy' | 'normal' | 'hard' | 'custom';
type GameStatus = 'ready' | 'playing' | 'won' | 'lost';

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacent: number;
}

const PRESETS: Record<Exclude<Difficulty, 'custom'>, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  normal: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

const createEmptyGrid = (rows: number, cols: number): Cell[][] =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacent: 0,
    }))
  );

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const Minesweeper: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [customRows, setCustomRows] = useState(10);
  const [customCols, setCustomCols] = useState(10);
  const [customMines, setCustomMines] = useState(15);
  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid(PRESETS.easy.rows, PRESETS.easy.cols));
  const [status, setStatus] = useState<GameStatus>('ready');
  const [flags, setFlags] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const { rows, cols, mines } = useMemo(() => {
    if (difficulty === 'custom') {
      const safeRows = clamp(customRows, 5, 40);
      const safeCols = clamp(customCols, 5, 40);
      const maxMines = safeRows * safeCols - 1;
      const safeMines = clamp(customMines, 1, Math.max(1, maxMines));
      return { rows: safeRows, cols: safeCols, mines: safeMines };
    }
    return PRESETS[difficulty];
  }, [difficulty, customRows, customCols, customMines]);

  const cellSize = useMemo(() => {
    if (cols >= 30) return 20;
    if (cols >= 20) return 22;
    return 24;
  }, [cols]);

  const storageKey = useMemo(() => {
    if (difficulty === 'custom') {
      return `minesweeper-best-custom-${rows}x${cols}-${mines}`;
    }
    return `minesweeper-best-${difficulty}`;
  }, [difficulty, rows, cols, mines]);

  const loadBestTime = () => {
    try {
      const value = localStorage.getItem(storageKey);
      const parsed = value ? Number(value) : null;
      return parsed && !Number.isNaN(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const saveBestTime = (time: number) => {
    try {
      localStorage.setItem(storageKey, String(time));
    } catch {
      // ignore storage errors
    }
  };

  const resetGame = () => {
    setGrid(createEmptyGrid(rows, cols));
    setStatus('ready');
    setFlags(0);
    setInitialized(false);
    setStartedAt(null);
    setElapsed(0);
    setBestTime(loadBestTime());
  };

  const getNeighbors = (row: number, col: number) => {
    const neighbors: Cell[] = [];
    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r === row && c === col) continue;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          neighbors.push(grid[r][c]);
        }
      }
    }
    return neighbors;
  };

  const buildGridWithMines = (safeRow: number, safeCol: number) => {
    const nextGrid = createEmptyGrid(rows, cols);
    let placed = 0;
    while (placed < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      if ((row === safeRow && col === safeCol) || nextGrid[row][col].isMine) continue;
      nextGrid[row][col].isMine = true;
      placed += 1;
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (nextGrid[row][col].isMine) continue;
        let count = 0;
        for (let r = row - 1; r <= row + 1; r++) {
          for (let c = col - 1; c <= col + 1; c++) {
            if (r === row && c === col) continue;
            if (r >= 0 && r < rows && c >= 0 && c < cols && nextGrid[r][c].isMine) {
              count += 1;
            }
          }
        }
        nextGrid[row][col].adjacent = count;
      }
    }
    return nextGrid;
  };

  const revealFlood = (startRow: number, startCol: number, nextGrid: Cell[][]) => {
    const stack: Cell[] = [nextGrid[startRow][startCol]];
    while (stack.length > 0) {
      const cell = stack.pop();
      if (!cell || cell.isRevealed || cell.isFlagged) continue;
      cell.isRevealed = true;
      if (cell.adjacent === 0) {
        for (let r = cell.row - 1; r <= cell.row + 1; r++) {
          for (let c = cell.col - 1; c <= cell.col + 1; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              const neighbor = nextGrid[r][c];
              if (!neighbor.isRevealed && !neighbor.isMine) {
                stack.push(neighbor);
              }
            }
          }
        }
      }
    }
  };

  const checkWin = (nextGrid: Cell[][]) => {
    let revealedCount = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (nextGrid[row][col].isRevealed) revealedCount += 1;
      }
    }
    return revealedCount === rows * cols - mines;
  };

  const handleReveal = (row: number, col: number) => {
    if (status === 'won' || status === 'lost') return;
    let nextGrid = grid.map((gridRow) => gridRow.map((cell) => ({ ...cell })));
    if (!initialized) {
      nextGrid = buildGridWithMines(row, col);
      setInitialized(true);
      setStatus('playing');
      setStartedAt(Date.now());
      setElapsed(0);
    }
    const target = nextGrid[row][col];
    if (target.isFlagged || target.isRevealed) return;

    if (target.isMine) {
      target.isRevealed = true;
      nextGrid.forEach((gridRow) =>
        gridRow.forEach((cell) => {
          if (cell.isMine) cell.isRevealed = true;
        })
      );
      setGrid(nextGrid);
      setStatus('lost');
      return;
    }

    revealFlood(row, col, nextGrid);
    setGrid(nextGrid);

    if (checkWin(nextGrid)) {
      setStatus('won');
      const finalElapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : elapsed;
      setElapsed(finalElapsed);
      if (bestTime === null || finalElapsed < bestTime) {
        setBestTime(finalElapsed);
        saveBestTime(finalElapsed);
      }
    }
  };

  const handleToggleFlag = (event: React.MouseEvent, row: number, col: number) => {
    event.preventDefault();
    if (status === 'won' || status === 'lost') return;
    const nextGrid = grid.map((gridRow) => gridRow.map((cell) => ({ ...cell })));
    const target = nextGrid[row][col];
    if (target.isRevealed) return;
    target.isFlagged = !target.isFlagged;
    setFlags((prev) => prev + (target.isFlagged ? 1 : -1));
    setGrid(nextGrid);
  };

  const handleDifficultyChange = (nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty);
  };

  useEffect(() => {
    setBestTime(loadBestTime());
  }, [storageKey]);

  useEffect(() => {
    resetGame();
  }, [rows, cols, mines]);

  useEffect(() => {
    if (status !== 'playing' || !startedAt) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [status, startedAt]);

  return (
    <div className="minesweeper">
      <div className="minesweeper-toolbar">
        <div className="minesweeper-controls">
          <select
            className="minesweeper-select"
            value={difficulty}
            onChange={(event) => handleDifficultyChange(event.target.value as Difficulty)}
          >
            <option value="easy">简单</option>
            <option value="normal">普通</option>
            <option value="hard">困难</option>
            <option value="custom">自定义</option>
          </select>

          {difficulty === 'custom' && (
            <>
              <input
                className="minesweeper-input"
                type="number"
                min={5}
                max={40}
                value={customRows}
                onChange={(event) => setCustomRows(Number(event.target.value))}
                placeholder="行"
              />
              <input
                className="minesweeper-input"
                type="number"
                min={5}
                max={40}
                value={customCols}
                onChange={(event) => setCustomCols(Number(event.target.value))}
                placeholder="列"
              />
              <input
                className="minesweeper-input"
                type="number"
                min={1}
                max={rows * cols - 1}
                value={customMines}
                onChange={(event) => setCustomMines(Number(event.target.value))}
                placeholder="雷数"
              />
            </>
          )}

          <button className="minesweeper-button" onClick={resetGame}>
            {status === 'ready' ? '开始' : '重置'}
          </button>
        </div>

        <div className="minesweeper-status">
          <span className="minesweeper-status-pill">剩余雷: {Math.max(mines - flags, 0)}</span>
          <span className="minesweeper-status-pill">状态: {status === 'ready' ? '待开始' : status === 'playing' ? '进行中' : status === 'won' ? '胜利' : '失败'}</span>
          <span className="minesweeper-status-pill">用时: {formatTime(elapsed)}</span>
          <span className="minesweeper-status-pill">最佳: {bestTime === null ? '--' : formatTime(bestTime)}</span>
        </div>
      </div>

      <div className="minesweeper-hint">左键翻开，右键插旗。首次点击保证安全。</div>
      {status === 'won' && (
        <div className="minesweeper-win-banner">
          🎉 恭喜通关！用时 {formatTime(elapsed)}{bestTime !== null && elapsed === bestTime ? '，刷新最佳记录！' : ''}
        </div>
      )}

      <div className="minesweeper-board-wrapper">
        <div
          className="minesweeper-board"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            ['--ms-cell-size' as never]: `${cellSize}px`,
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const numberClass = cell.adjacent > 0 ? `ms-number-${cell.adjacent}` : '';
              const cellClassName = [
                'minesweeper-cell',
                cell.isRevealed ? 'revealed' : '',
                cell.isFlagged ? 'flagged' : '',
                cell.isRevealed && cell.isMine ? 'mine' : '',
                numberClass,
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={cellClassName}
                  onClick={() => handleReveal(rowIndex, colIndex)}
                  onContextMenu={(event) => handleToggleFlag(event, rowIndex, colIndex)}
                >
                  {cell.isRevealed && cell.isMine && '💣'}
                  {cell.isFlagged && !cell.isRevealed && '🚩'}
                  {cell.isRevealed && !cell.isMine && cell.adjacent > 0 && cell.adjacent}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Minesweeper;
