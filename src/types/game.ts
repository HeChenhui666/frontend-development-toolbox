/**
 * 游戏相关类型定义
 */
import type React from 'react';

/** 游戏配置 */
export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: React.ComponentType;
}

/** 游戏分数记录 */
export interface GameScoreRecord {
  gameId: string;
  score: number;
  timestamp: number;
}
