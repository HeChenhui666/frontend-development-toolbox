/**
 * 解析 Google translate_a/single（dt=t）返回的 JSON。
 * data[0] 为分段数组，每段一般为 [原文片段, 译文片段, ...]，需拼接所有段的译文。
 */
export function parseGoogleTranslateSingleResult(data: unknown): string | null {
  if (!data || !Array.isArray(data) || !Array.isArray(data[0])) {
    return null;
  }

  const segments = data[0] as unknown[];
  const parts: string[] = [];

  for (const seg of segments) {
    if (!Array.isArray(seg)) continue;
    // 译文在索引 0；仅有一段或异常结构时退回索引 1（与旧逻辑兼容）
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
