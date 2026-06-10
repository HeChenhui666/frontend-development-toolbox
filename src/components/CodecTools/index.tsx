import React, { useCallback, useMemo, useState } from 'react';
import { Button, Input, Select, Space } from 'antd';
import { ClearOutlined, CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { showMessage } from '../../utils/message';
import './index.css';

const { TextArea } = Input;

type Category = 'unicode' | 'utf8' | 'base64' | 'jwt' | 'hash' | 'html';
type UnicodeOp = 'ascii2uni' | 'uni2ascii' | 'uni2cn' | 'cn2uni';
type Utf8Op = 'utf82cn' | 'cn2utf8';
type Base64Op = 'encode' | 'decode';
type HtmlOp = 'encode' | 'decode';
type HashOp = 'md5' | 'sha1' | 'sha256' | 'sha512';

function asciiToUnicodeEscape(input: string): { ok: true; out: string } | { ok: false; err: string } {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    if (c <= 0x7f) {
      out += `\\u${c.toString(16).padStart(4, '0')}`;
    } else {
      return { ok: false, err: '「ASCII 转 Unicode」仅支持 ASCII 字符（码点 ≤ 127），请去掉中文等非 ASCII 内容或使用「中文转 Unicode」' };
    }
  }
  return { ok: true, out };
}

function decodeUnicodeEscapes(input: string): string {
  return input.replace(/\\(\\u[0-9a-fA-F]{4}|u[0-9a-fA-F]{4})/gi, (_, g: string) => {
    if (g.startsWith('\\u')) return g;
    return String.fromCharCode(parseInt(g.slice(1), 16));
  });
}

function isAllAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 127) return false;
  }
  return true;
}

function textToUnicodeEscapes(input: string): string {
  let out = '';
  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    if (cp > 0xffff) {
      const h = Math.floor((cp - 0x10000) / 0x400) + 0xd800;
      const l = ((cp - 0x10000) % 0x400) + 0xdc00;
      out += `\\u${h.toString(16).padStart(4, '0')}\\u${l.toString(16).padStart(4, '0')}`;
    } else {
      out += `\\u${cp.toString(16).padStart(4, '0')}`;
    }
  }
  return out;
}

function parseUtf8HexBytes(input: string): Uint8Array {
  const hexOnly = input.replace(/\\x/gi, '').replace(/0x/gi, '').replace(/[^0-9a-fA-F]/gi, '');
  if (hexOnly.length === 0) throw new Error('未解析到有效的十六进制字节');
  if (hexOnly.length % 2 !== 0) throw new Error('十六进制长度须为偶数（整字节）');
  const bytes = new Uint8Array(hexOnly.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const b = parseInt(hexOnly.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(b)) throw new Error('含非法十六进制字符');
    bytes[i] = b;
  }
  return bytes;
}

function parseUtf8InputToBytes(input: string): Uint8Array {
  const trimmed = input.trim();
  const percentSeq = trimmed.match(/%[0-9a-fA-F]{2}/gi);
  if (percentSeq && percentSeq.length > 0) {
    const bytes = new Uint8Array(percentSeq.length);
    for (let i = 0; i < percentSeq.length; i++) {
      bytes[i] = parseInt(percentSeq[i].slice(1), 16);
    }
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      return bytes;
    } catch { /* fallback */ }
  }
  return parseUtf8HexBytes(trimmed);
}

function utf8BytesToHexLines(bytes: Uint8Array): string {
  const upper = [...bytes].map((b) => b.toString(16).toUpperCase().padStart(2, '0'));
  return `十六进制（空格分隔）：${upper.join(' ')}\n转义序列：${upper.map((h) => `\\x${h}`).join('')}\n百分号编码：${upper.map((h) => `%${h}`).join('')}`;
}

/* ─── Base64 编解码 ─── */
function base64Encode(input: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64Decode(input: string): string {
  const binary = atob(input.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/* ─── JWT 解析 ─── */
function parseJwt(token: string): string {
  const parts = token.trim().split('.');
  if (parts.length < 2 || parts.length > 3) {
    throw new Error('无效的 JWT 格式，需要 2-3 个用点分隔的部分');
  }
  const decodeBase64Url = (str: string): string => {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return base64Decode(base64);
  };
  const headerJson = JSON.parse(decodeBase64Url(parts[0]));
  const payloadJson = JSON.parse(decodeBase64Url(parts[1]));

  const lines: string[] = [];
  lines.push('=== Header ===');
  lines.push(JSON.stringify(headerJson, null, 2));
  lines.push('');
  lines.push('=== Payload ===');
  lines.push(JSON.stringify(payloadJson, null, 2));

  // 解析时间字段
  const timeFields = ['iat', 'exp', 'nbf', 'auth_time'];
  for (const field of timeFields) {
    if (typeof payloadJson[field] === 'number') {
      const date = new Date(payloadJson[field] * 1000);
      lines.push('');
      lines.push(`${field}: ${payloadJson[field]} → ${date.toLocaleString()} (${date.toISOString()})`);
      if (field === 'exp') {
        const now = Date.now();
        const expMs = payloadJson[field] * 1000;
        lines.push(expMs > now ? `  ⏳ 距离过期还有 ${Math.round((expMs - now) / 60000)} 分钟` : '  ⚠️ 已过期');
      }
    }
  }

  if (parts[2]) {
    lines.push('');
    lines.push('=== Signature ===');
    lines.push(parts[2]);
    lines.push('（签名验证需要密钥，此处仅展示）');
  }

  return lines.join('\n');
}

/* ─── Hash 计算 ─── */
async function computeHash(input: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const algoMap: Record<string, string> = {
    sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512',
  };
  if (algorithm === 'md5') {
    // Web Crypto 不支持 MD5，使用简单实现
    return simpleMd5(data);
  }
  const hashBuffer = await crypto.subtle.digest(algoMap[algorithm], data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 简易 MD5 实现（纯计算，无安全用途）
function simpleMd5(input: Uint8Array): string {
  const md5cycle = (x: number[], k: number[]) => {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    const ff = (a: number, b: number, c: number, d: number, s: number, t: number, k: number) => {
      a = (a + ((b & c) | (~b & d)) + k + t) | 0;
      return ((a << s) | (a >>> (32 - s))) + b | 0;
    };
    const gg = (a: number, b: number, c: number, d: number, s: number, t: number, k: number) => {
      a = (a + ((b & d) | (c & ~d)) + k + t) | 0;
      return ((a << s) | (a >>> (32 - s))) + b | 0;
    };
    const hh = (a: number, b: number, c: number, d: number, s: number, t: number, k: number) => {
      a = (a + (b ^ c ^ d) + k + t) | 0;
      return ((a << s) | (a >>> (32 - s))) + b | 0;
    };
    const ii = (a: number, b: number, c: number, d: number, s: number, t: number, k: number) => {
      a = (a + (c ^ (b | ~d)) + k + t) | 0;
      return ((a << s) | (a >>> (32 - s))) + b | 0;
    };
    a=ff(a,b,c,d,7,-680876936,k[0]);d=ff(d,a,b,c,12,-389564586,k[1]);c=ff(c,d,a,b,17,606105819,k[2]);b=ff(b,c,d,a,22,-1044525330,k[3]);
    a=ff(a,b,c,d,7,-176418897,k[4]);d=ff(d,a,b,c,12,1200080426,k[5]);c=ff(c,d,a,b,17,-1473231341,k[6]);b=ff(b,c,d,a,22,-45705983,k[7]);
    a=ff(a,b,c,d,7,1770035416,k[8]);d=ff(d,a,b,c,12,-1958414417,k[9]);c=ff(c,d,a,b,17,-42063,k[10]);b=ff(b,c,d,a,22,-1990404162,k[11]);
    a=ff(a,b,c,d,7,1804603682,k[12]);d=ff(d,a,b,c,12,-40341101,k[13]);c=ff(c,d,a,b,17,-1502002290,k[14]);b=ff(b,c,d,a,22,1236535329,k[15]);
    a=gg(a,b,c,d,5,-165796510,k[1]);d=gg(d,a,b,c,9,-1069501632,k[6]);c=gg(c,d,a,b,14,643717713,k[11]);b=gg(b,c,d,a,20,-373897302,k[0]);
    a=gg(a,b,c,d,5,-701558691,k[5]);d=gg(d,a,b,c,9,38016083,k[10]);c=gg(c,d,a,b,14,-660478335,k[15]);b=gg(b,c,d,a,20,-405537848,k[4]);
    a=gg(a,b,c,d,5,568446438,k[9]);d=gg(d,a,b,c,9,-1019803690,k[14]);c=gg(c,d,a,b,14,-187363961,k[3]);b=gg(b,c,d,a,20,1163531501,k[8]);
    a=gg(a,b,c,d,5,-1444681467,k[13]);d=gg(d,a,b,c,9,-51403784,k[2]);c=gg(c,d,a,b,14,1735328473,k[7]);b=gg(b,c,d,a,20,-1926607734,k[12]);
    a=hh(a,b,c,d,4,-378558,k[5]);d=hh(d,a,b,c,11,-2022574463,k[8]);c=hh(c,d,a,b,16,1839030562,k[11]);b=hh(b,c,d,a,23,-35309556,k[14]);
    a=hh(a,b,c,d,4,-1530992060,k[1]);d=hh(d,a,b,c,11,1272893353,k[4]);c=hh(c,d,a,b,16,-155497632,k[7]);b=hh(b,c,d,a,23,-1094730640,k[10]);
    a=hh(a,b,c,d,4,681279174,k[13]);d=hh(d,a,b,c,11,-358537222,k[0]);c=hh(c,d,a,b,16,-722521979,k[3]);b=hh(b,c,d,a,23,76029189,k[6]);
    a=hh(a,b,c,d,4,-640364487,k[9]);d=hh(d,a,b,c,11,-421815835,k[12]);c=hh(c,d,a,b,16,530742520,k[15]);b=hh(b,c,d,a,23,-995338651,k[2]);
    a=ii(a,b,c,d,6,-198630844,k[0]);d=ii(d,a,b,c,10,1126891415,k[7]);c=ii(c,d,a,b,15,-1416354905,k[14]);b=ii(b,c,d,a,21,-57434055,k[5]);
    a=ii(a,b,c,d,6,1700485571,k[12]);d=ii(d,a,b,c,10,-1894986606,k[3]);c=ii(c,d,a,b,15,-1051523,k[10]);b=ii(b,c,d,a,21,-2054922799,k[1]);
    a=ii(a,b,c,d,6,1873313359,k[8]);d=ii(d,a,b,c,10,-30611744,k[15]);c=ii(c,d,a,b,15,-1560198380,k[6]);b=ii(b,c,d,a,21,1309151649,k[13]);
    a=ii(a,b,c,d,6,-145523070,k[4]);d=ii(d,a,b,c,10,-1120210379,k[11]);c=ii(c,d,a,b,15,718787259,k[2]);b=ii(b,c,d,a,21,-343485551,k[9]);
    x[0]=(a+x[0])|0;x[1]=(b+x[1])|0;x[2]=(c+x[2])|0;x[3]=(d+x[3])|0;
  };
  const state = [1732584193, -271733879, -1732584194, 271733878];
  const length = input.length;
  const tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  let i = 0;
  for (; i + 64 <= length; i += 64) {
    const block = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for (let j = 0; j < 64; j += 4) {
      block[j >> 2] = input[i+j] | (input[i+j+1] << 8) | (input[i+j+2] << 16) | (input[i+j+3] << 24);
    }
    md5cycle(state, block);
  }
  for (let j = 0; j < 16; j++) tail[j] = 0;
  for (let j = i; j < length; j++) {
    tail[(j - i) >> 2] |= input[j] << (((j - i) % 4) << 3);
  }
  tail[(length - i) >> 2] |= 0x80 << (((length - i) % 4) << 3);
  if ((length - i) > 55) { md5cycle(state, tail); for (let j = 0; j < 16; j++) tail[j] = 0; }
  tail[14] = length * 8;
  md5cycle(state, tail);
  const hex = (n: number) => {
    let s = '';
    for (let j = 0; j < 4; j++) s += ((n >> (j * 8)) & 0xff).toString(16).padStart(2, '0');
    return s;
  };
  return hex(state[0]) + hex(state[1]) + hex(state[2]) + hex(state[3]);
}

/* ─── HTML 实体编解码 ─── */
function htmlEntityEncode(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[ch] || ch;
  });
}

function htmlEntityDecode(input: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = input;
  return textarea.value;
}

const CodecTools: React.FC = () => {
  const [category, setCategory] = useState<Category>('unicode');
  const [unicodeOp, setUnicodeOp] = useState<UnicodeOp>('ascii2uni');
  const [utf8Op, setUtf8Op] = useState<Utf8Op>('utf82cn');
  const [base64Op, setBase64Op] = useState<Base64Op>('encode');
  const [htmlOp, setHtmlOp] = useState<HtmlOp>('encode');
  const [hashOp, setHashOp] = useState<HashOp>('md5');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const currentOpLabel = useMemo(() => {
    if (category === 'unicode') {
      const m: Record<UnicodeOp, string> = {
        ascii2uni: 'ASCII → Unicode（\\uXXXX）',
        uni2ascii: 'Unicode → ASCII',
        uni2cn: 'Unicode 转义 → 文本',
        cn2uni: '文本 → Unicode（\\uXXXX）',
      };
      return m[unicodeOp];
    }
    if (category === 'utf8') {
      const m: Record<Utf8Op, string> = {
        utf82cn: 'UTF-8 十六进制 → 文本',
        cn2utf8: '文本 → UTF-8 字节',
      };
      return m[utf8Op];
    }
    if (category === 'base64') {
      return base64Op === 'encode' ? 'Base64 编码' : 'Base64 解码';
    }
    if (category === 'jwt') {
      return 'JWT Token 解析';
    }
    if (category === 'hash') {
      const m: Record<HashOp, string> = { md5: 'MD5 哈希', sha1: 'SHA-1 哈希', sha256: 'SHA-256 哈希', sha512: 'SHA-512 哈希' };
      return m[hashOp];
    }
    if (category === 'html') {
      return htmlOp === 'encode' ? 'HTML 实体编码' : 'HTML 实体解码';
    }
    return '';
  }, [category, unicodeOp, utf8Op, base64Op, hashOp, htmlOp]);

  const convert = useCallback(() => {
    setError('');
    const raw = input;
    try {
      if (category === 'unicode') {
        if (unicodeOp === 'ascii2uni') {
          const r = asciiToUnicodeEscape(raw);
          if (!r.ok) { setOutput(''); setError(r.err); return; }
          setOutput(r.out);
          showMessage.success('转换完成');
          return;
        }
        if (unicodeOp === 'uni2ascii') {
          const decoded = decodeUnicodeEscapes(raw);
          if (!isAllAscii(decoded)) {
            setOutput('');
            setError('解码结果包含非 ASCII 字符，请改用「Unicode 转义 → 文本」。');
            showMessage.warning('结果非纯 ASCII');
            return;
          }
          setOutput(decoded);
          showMessage.success('转换完成');
          return;
        }
        if (unicodeOp === 'uni2cn') { setOutput(decodeUnicodeEscapes(raw)); showMessage.success('转换完成'); return; }
        setOutput(textToUnicodeEscapes(raw));
        showMessage.success('转换完成');
        return;
      }
      if (category === 'utf8') {
        if (utf8Op === 'utf82cn') {
          const bytes = parseUtf8InputToBytes(raw);
          const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          setOutput(text);
          showMessage.success('转换完成');
          return;
        }
        const enc = new TextEncoder();
        const bytes = enc.encode(raw);
        setOutput(utf8BytesToHexLines(bytes));
        showMessage.success('转换完成');
        return;
      }
      if (category === 'base64') {
        if (base64Op === 'encode') {
          setOutput(base64Encode(raw));
        } else {
          setOutput(base64Decode(raw));
        }
        showMessage.success('转换完成');
        return;
      }
      if (category === 'jwt') {
        setOutput(parseJwt(raw));
        showMessage.success('解析完成');
        return;
      }
      if (category === 'hash') {
        computeHash(raw, hashOp).then((result) => {
          setOutput(result);
          showMessage.success('计算完成');
        }).catch((err) => {
          setError(err instanceof Error ? err.message : '哈希计算失败');
        });
        return;
      }
      if (category === 'html') {
        if (htmlOp === 'encode') {
          setOutput(htmlEntityEncode(raw));
        } else {
          setOutput(htmlEntityDecode(raw));
        }
        showMessage.success('转换完成');
        return;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '转换失败';
      setOutput('');
      setError(msg);
      showMessage.error(msg);
    }
  }, [category, unicodeOp, utf8Op, base64Op, hashOp, htmlOp, input]);

  const copyOutput = useCallback(() => {
    if (!output) { showMessage.warning('没有可复制的内容'); return; }
    void navigator.clipboard.writeText(output).then(
      () => showMessage.success('已复制'),
      () => showMessage.error('复制失败')
    );
  }, [output]);

  const clearAll = useCallback(() => { setInput(''); setOutput(''); setError(''); }, []);

  const swapIo = useCallback(() => { setInput(output); setOutput(''); setError(''); }, [output]);

  return (
    <div className="codec-tools feature-content">
      {/* 选择器行：类型 + 操作 并排 */}
      <div className="codec-selectors">
        <Select<Category>
          className="codec-tool-select"
          size="small"
          value={category}
          onChange={(v) => { setCategory(v); setError(''); }}
          options={[
            { value: 'unicode', label: 'Unicode 编码' },
            { value: 'utf8', label: 'UTF-8 编码' },
            { value: 'base64', label: 'Base64' },
            { value: 'jwt', label: 'JWT 解析' },
            { value: 'hash', label: 'Hash 计算' },
            { value: 'html', label: 'HTML 实体' },
          ]}
          style={{ flex: 1 }}
        />
        <div className="codec-op-select">
          {category === 'unicode' && (
            <Select<UnicodeOp>
              className="codec-tool-select"
              size="small"
              value={unicodeOp}
              onChange={(v) => { setUnicodeOp(v); setError(''); }}
              style={{ width: '100%' }}
              options={[
                { value: 'ascii2uni', label: 'ASCII → Unicode' },
                { value: 'uni2ascii', label: 'Unicode → ASCII' },
                { value: 'uni2cn', label: '转义 → 文本' },
                { value: 'cn2uni', label: '文本 → 转义' },
              ]}
            />
          )}
          {category === 'utf8' && (
            <Select<Utf8Op>
              className="codec-tool-select"
              size="small"
              value={utf8Op}
              onChange={(v) => { setUtf8Op(v); setError(''); }}
              style={{ width: '100%' }}
              options={[
                { value: 'utf82cn', label: 'UTF-8 → 文本' },
                { value: 'cn2utf8', label: '文本 → UTF-8' },
              ]}
            />
          )}
          {category === 'utf8' && (
            <Select<Utf8Op>
              className="codec-tool-select"
              size="small"
              value={utf8Op}
              onChange={(v) => { setUtf8Op(v); setError(''); }}
              style={{ width: '100%' }}
              options={[
                { value: 'utf82cn', label: 'UTF-8 → 中文' },
                { value: 'cn2utf8', label: '中文 → UTF-8' },
              ]}
            />
          )}
          {category === 'base64' && (
            <Select<Base64Op>
              className="codec-tool-select"
              size="small"
              value={base64Op}
              onChange={(v) => { setBase64Op(v); setError(''); }}
              style={{ width: '100%' }}
              options={[
                { value: 'encode', label: 'Base64 编码' },
                { value: 'decode', label: 'Base64 解码' },
              ]}
            />
          )}
          {category === 'hash' && (
            <Select<HashOp>
              className="codec-tool-select"
              size="small"
              value={hashOp}
              onChange={(v) => { setHashOp(v); setError(''); }}
              style={{ width: '100%' }}
              options={[
                { value: 'md5', label: 'MD5' },
                { value: 'sha1', label: 'SHA-1' },
                { value: 'sha256', label: 'SHA-256' },
                { value: 'sha512', label: 'SHA-512' },
              ]}
            />
          )}
          {category === 'html' && (
            <Select<HtmlOp>
              className="codec-tool-select"
              size="small"
              value={htmlOp}
              onChange={(v) => { setHtmlOp(v); setError(''); }}
              style={{ width: '100%' }}
              options={[
                { value: 'encode', label: 'HTML 编码' },
                { value: 'decode', label: 'HTML 解码' },
              ]}
            />
          )}
          {category === 'jwt' && (
            <span style={{ fontSize: 11, color: 'var(--theme-textMuted)', padding: '0 4px' }}>
              粘贴 JWT Token 后点击转换
            </span>
          )}
        </div>
      </div>

      {/* 当前操作信息 */}
      <div className="codec-info-bar">
        <span className="codec-info-dot">●</span>
        <span className="codec-info-text">{currentOpLabel}</span>
      </div>

      {error && <div className="codec-error">{error}</div>}

      {/* 输入/输出并排 */}
      <div className="codec-io">
        <div className="codec-io-col">
          <span className="codec-io-label">输入</span>
          <TextArea
            className="codec-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴或输入待处理内容"
            autoSize={{ minRows: 5, maxRows: 10 }}
          />
        </div>
        <div className="codec-io-col">
          <span className="codec-io-label">输出</span>
          <TextArea
            className="codec-textarea"
            value={output}
            readOnly
            placeholder="转换结果将显示在这里"
            autoSize={{ minRows: 5, maxRows: 10 }}
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <Space wrap className="codec-actions">
        <Button type="primary" size="small" onClick={convert}>转换</Button>
        <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>复制结果</Button>
        <Button size="small" icon={<SwapOutlined />} onClick={swapIo} disabled={!output}>结果作为输入</Button>
        <Button size="small" icon={<ClearOutlined />} onClick={clearAll}>清空</Button>
      </Space>
    </div>
  );
};

export default CodecTools;
