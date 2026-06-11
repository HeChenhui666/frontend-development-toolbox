import { useRef, useCallback, useEffect } from 'react';

/**
 * 返回一个节流版本的回调函数，在指定间隔内最多执行一次。
 */
export function useThrottledCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  interval: number,
): (...args: Args) => void {
  const lastCallRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      const now = Date.now();
      const remaining = interval - (now - lastCallRef.current);

      if (remaining <= 0) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          timerRef.current = null;
          callbackRef.current(...args);
        }, remaining);
      }
    },
    [interval],
  );
}
