import React from 'react';
import Game2048 from './Game2048';
import Tetris from './Tetris';
import Snake from './Snake';
import Minesweeper from './Minesweeper';
import Sudoku from './Sudoku';
import ReactionTest from './ReactionTest';
import Breakout from './Breakout';
import FlappyBird from './FlappyBird';
import InfiniteRunner from './InfiniteRunner';
import MemoryMatch from './MemoryMatch';

export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: React.ComponentType;
}

export const games: GameConfig[] = [
  {
    id: 'Game2048',
    name: '2048',
    icon: '🔢',
    description: '经典数字合并游戏',
    component: Game2048,
  },
  {
    id: 'Tetris',
    name: '俄罗斯方块',
    icon: '🇷🇺',
    description: '经典消除游戏',
    component: Tetris,
  },
  {
    id: 'Snake',
    name: '贪吃蛇',
    icon: '🐍',
    description: '经典贪吃蛇游戏',
    component: Snake,
  },
  {
    id: 'Minesweeper',
    name: '扫雷',
    icon: '💣',
    description: '可选难度的经典扫雷',
    component: Minesweeper,
  },
  {
    id: 'Sudoku',
    name: '数独',
    icon: '🧩',
    description: '可选难度的逻辑推理游戏',
    component: Sudoku,
  },
  {
    id: 'ReactionTest',
    name: '反应测试',
    icon: '🎯',
    description: '测试你的反应速度',
    component: ReactionTest,
  },
  {
    id: 'Breakout',
    name: '打砖块',
    icon: '🧱',
    description: '经典打砖块，支持道具掉落',
    component: Breakout,
  },
  {
    id: 'FlappyBird',
    name: 'Flappy Bird',
    icon: '🐦',
    description: '点击跳跃通过管道',
    component: FlappyBird,
  },
  {
    id: 'InfiniteRunner',
    name: '无尽跑酷',
    icon: '🏃',
    description: '躲避 Bug 的横版跑酷',
    component: InfiniteRunner,
  },
  {
    id: 'MemoryMatch',
    name: '记忆翻牌',
    icon: '🃏',
    description: 'Emoji 配对记忆游戏',
    component: MemoryMatch,
  },
];

