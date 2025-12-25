// 游戏最高分缓存工具

const STORAGE_PREFIX = 'game-high-score-';

/**
 * 获取游戏的历史最高分
 * @param gameId 游戏ID (tetris, snake, 2048)
 * @returns 历史最高分，如果没有则返回0
 */
export const getHighScore = (gameId: string): number => {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
    if (saved) {
      const score = parseInt(saved, 10);
      return isNaN(score) ? 0 : score;
    }
  } catch (error) {
    console.error(`Failed to get high score for ${gameId}:`, error);
  }
  return 0;
};

/**
 * 保存游戏的历史最高分
 * @param gameId 游戏ID
 * @param score 分数
 */
export const saveHighScore = (gameId: string, score: number): void => {
  try {
    const currentHighScore = getHighScore(gameId);
    if (score > currentHighScore) {
      localStorage.setItem(`${STORAGE_PREFIX}${gameId}`, score.toString());
    }
  } catch (error) {
    console.error(`Failed to save high score for ${gameId}:`, error);
  }
};

/**
 * 更新并返回新的最高分（如果当前分数更高）
 * @param gameId 游戏ID
 * @param currentScore 当前分数
 * @returns 更新后的最高分
 */
export const updateHighScore = (gameId: string, currentScore: number): number => {
  const currentHighScore = getHighScore(gameId);
  if (currentScore > currentHighScore) {
    saveHighScore(gameId, currentScore);
    return currentScore;
  }
  return currentHighScore;
};

