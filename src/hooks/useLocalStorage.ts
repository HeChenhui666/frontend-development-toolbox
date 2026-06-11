import { useState, useCallback, useEffect } from 'react';

/**
 * 类型安全的 localStorage 读写 Hook，支持自动序列化/反序列化。
 * 监听同源跨标签页的 storage 事件以保持同步。
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const readValue = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const nextValue = value instanceof Function ? value(readValue()) : value;
        localStorage.setItem(key, JSON.stringify(nextValue));
        setStoredValue(nextValue);
      } catch {
        // quota exceeded or other storage errors
      }
    },
    [key, readValue],
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch {
      // ignore
    }
  }, [key, defaultValue]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(readValue());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, readValue]);

  return [storedValue, setValue, removeValue];
}
