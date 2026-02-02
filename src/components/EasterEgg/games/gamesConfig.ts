import React from 'react';
import Game2048 from './Game2048';
import Tetris from './Tetris';
import Snake from './Snake';
import Minesweeper from './Minesweeper';

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
  // 可以在这里添加更多游戏
];

