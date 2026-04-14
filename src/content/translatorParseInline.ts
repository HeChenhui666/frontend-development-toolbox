/**
 * 仅供 content/translator.ts 使用；与 utils/parseGoogleTranslateResult 保持一致。
 * 勿从 ../utils 引用，否则 Vite 会拆出 assets chunk，页面内脚本报 import 错误。
 */
export function parseGoogleTranslateSingleResult(data: unknown): string | null {
  if (!data || !Array.isArray(data) || !Array.isArray(data[0])) {
    return null;
  }

  const segments = data[0] as unknown[];
  const parts: string[] = [];

  for (const seg of segments) {
    if (!Array.isArray(seg)) continue;
    const translated = seg[0];
    const original = seg[1];
    const piece =
      typeof translated === 'string'
        ? translated
        : typeof original === 'string'
          ? original
          : '';
    parts.push(piece);
  }

  const out = parts.join('');
  return out.length > 0 ? out : null;
}
