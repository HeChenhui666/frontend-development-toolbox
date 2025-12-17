import React from 'react';
import Game2048 from './Game2048';

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
    icon: '🎮',
    description: '经典数字合并游戏',
    component: Game2048,
  },
  // 可以在这里添加更多游戏
];

