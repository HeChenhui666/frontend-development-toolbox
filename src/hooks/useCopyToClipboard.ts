import { useCallback, useState } from 'react';

interface CopyResult {
  copied: boolean;
  error: string | null;
}

/**
 * 复制文本到剪贴板的 Hook。
 * 返回 [copyFn, result]，result.copied 在成功复制后短暂为 true（可用于 UI 反馈）。
 */
export function useCopyToClipboard(resetDelay = 2000): [(text: string) => Promise<boolean>, CopyResult] {
  const [result, setResult] = useState<CopyResult>({ copied: false, error: null });

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setResult({ copied: true, error: null });
        setTimeout(() => setResult({ copied: false, error: null }), resetDelay);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Copy failed';
        setResult({ copied: false, error: errorMessage });
        return false;
      }
    },
    [resetDelay],
  );

  return [copy, result];
}
