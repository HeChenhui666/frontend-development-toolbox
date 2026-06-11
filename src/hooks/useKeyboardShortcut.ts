import { useEffect, useRef } from 'react';

interface ShortcutOptions {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
}

/**
 * 全局键盘快捷键注册 Hook。
 * @param key 按键名（如 'k'、'Enter'、'Escape'）
 * @param callback 触发时的回调
 * @param options 修饰键要求和行为配置
 */
export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {},
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const { ctrl = false, shift = false, alt = false, meta = false, preventDefault = true } = options;

      if (ctrl && !event.ctrlKey && !event.metaKey) return;
      if (shift && !event.shiftKey) return;
      if (alt && !event.altKey) return;
      if (meta && !event.metaKey) return;

      if (event.key.toLowerCase() === key.toLowerCase()) {
        if (preventDefault) event.preventDefault();
        callbackRef.current(event);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, options.ctrl, options.shift, options.alt, options.meta, options.preventDefault]);
}
