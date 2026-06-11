import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 彩蛋触发 Hook — 连续点击指定次数后触发彩蛋。
 * @param threshold 触发所需的连续点击次数，默认 10
 * @param timeout 连续点击的超时时间（ms），默认 2000
 */
export function useEasterEggTrigger(threshold = 10, timeout = 2000) {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTriggerClick = useCallback(() => {
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= threshold) {
      setShowEasterEgg(true);
      setClickCount(0);
    } else {
      clickTimeoutRef.current = setTimeout(() => setClickCount(0), timeout);
    }
  }, [clickCount, threshold, timeout]);

  const closeEasterEgg = useCallback(() => setShowEasterEgg(false), []);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  return { showEasterEgg, handleTriggerClick, closeEasterEgg };
}
