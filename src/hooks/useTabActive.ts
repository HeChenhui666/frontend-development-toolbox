import { useState, useEffect } from 'react';

/**
 * 检测当前标签页是否处于可见/激活状态。
 * 可用于暂停不可见时的动画、计时器等。
 */
export function useTabActive(): boolean {
  const [isActive, setIsActive] = useState(() => document.visibilityState === 'visible');

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isActive;
}
