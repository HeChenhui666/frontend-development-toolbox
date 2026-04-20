import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Input, Select, Space, Typography } from 'antd';
import { ClearOutlined, CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { showMessage } from '../../utils/message';
import './index.css';

const { Text } = Typography;
const { TextArea } = Input;

type Category = 'unicode' | 'utf8' | 'url';

type UnicodeOp = 'ascii2uni' | 'uni2ascii' | 'uni2cn' | 'cn2uni';
type Utf8Op = 'utf82cn' | 'cn2utf8';
type UrlOp = 'encode' | 'decode';

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

/** 将 \\uXXXX 与 \uXXXX 形式的转义还原为字符串 */
function decodeUnicodeEscapes(input: string): string {
  let s = input;
  s = s.replace(/\\\\u([0-9a-fA-F]{4})/gi, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  s = s.replace(/\\u([0-9a-fA-F]{4})/gi, (_, hex: string) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  return s;
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

/** 仅解析裸十六进制 / \\x / 0x，不含 %XX（避免英文单词中的 a–f 被误当作十六进制） */
function parseUtf8HexBytes(input: string): Uint8Array {
  const hexOnly = input
    .replace(/\\x/gi, '')
    .replace(/0x/gi, '')
    .replace(/[^0-9a-fA-F]/gi, '');
  if (hexOnly.length === 0) {
    throw new Error('未解析到有效的十六进制字节');
  }
  if (hexOnly.length % 2 !== 0) {
    throw new Error('十六进制长度须为偶数（整字节）');
  }
  const bytes = new Uint8Array(hexOnly.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const b = parseInt(hexOnly.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(b)) {
      throw new Error('含非法十六进制字符');
    }
    bytes[i] = b;
  }
  return bytes;
}

/** 优先按 %XX 序列取字节（避免英文中的 a–f 混入裸十六进制）；若不成合法 UTF-8 则回退为整段十六进制解析（兼容 E4%B8%AD 等混写） */
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
    } catch {
      // 例如 E4%B8%AD 只匹配到 %B8 %AD，回退为整串十六进制
    }
  }
  return parseUtf8HexBytes(trimmed);
}

function utf8BytesToHexLines(bytes: Uint8Array): string {
  const upper = [...bytes].map((b) => b.toString(16).toUpperCase().padStart(2, '0'));
  const spaced = upper.join(' ');
  const escaped = upper.map((h) => `\\x${h}`).join('');
  const percent = upper.map((h) => `%${h}`).join('');
  return `十六进制（空格分隔）：${spaced}\n转义序列：${escaped}\n百分号编码：${percent}`;
}

const CodecTools: React.FC = () => {
  const [category, setCategory] = useState<Category>('url');
  const [unicodeOp, setUnicodeOp] = useState<UnicodeOp>('ascii2uni');
  const [utf8Op, setUtf8Op] = useState<Utf8Op>('utf82cn');
  const [urlOp, setUrlOp] = useState<UrlOp>('encode');
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
        utf82cn: 'UTF-8 十六进制 → 中文/文本',
        cn2utf8: '中文/文本 → UTF-8',
      };
      return m[utf8Op];
    }
    const m: Record<UrlOp, string> = {
      encode: 'URL 编码（encodeURIComponent）',
      decode: 'URL 解码（decodeURIComponent）',
    };
    return m[urlOp];
  }, [category, unicodeOp, utf8Op, urlOp]);

  const convert = useCallback(() => {
    setError('');
    const raw = input;
    try {
      if (category === 'unicode') {
        if (unicodeOp === 'ascii2uni') {
          const r = asciiToUnicodeEscape(raw);
          if (!r.ok) {
            setOutput('');
            setError(r.err);
            return;
          }
          setOutput(r.out);
          showMessage.success('转换完成');
          return;
        }
        if (unicodeOp === 'uni2ascii') {
          const decoded = decodeUnicodeEscapes(raw);
          if (!isAllAscii(decoded)) {
            setOutput('');
            setError(
              '解码结果包含非 ASCII 字符，已不输出结果。若需还原中文等任意字符，请改用「Unicode 转义 → 文本」。'
            );
            showMessage.warning('结果非纯 ASCII');
            return;
          }
          setOutput(decoded);
          showMessage.success('转换完成');
          return;
        }
        if (unicodeOp === 'uni2cn') {
          setOutput(decodeUnicodeEscapes(raw));
          showMessage.success('转换完成');
          return;
        }
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

      if (urlOp === 'encode') {
        setOutput(encodeURIComponent(raw));
      } else {
        setOutput(decodeURIComponent(raw.replace(/\+/g, ' ')));
      }
      showMessage.success('转换完成');
    } catch (e) {
      const msg =
        e instanceof URIError
          ? 'URL 解码失败：请检查是否为合法的百分号编码串'
          : e instanceof Error
            ? e.message
            : '转换失败';
      setOutput('');
      setError(msg);
      showMessage.error(msg);
    }
  }, [category, unicodeOp, utf8Op, urlOp, input]);

  const copyOutput = useCallback(() => {
    if (!output) {
      showMessage.warning('没有可复制的内容');
      return;
    }
    void navigator.clipboard.writeText(output).then(
      () => showMessage.success('已复制'),
      () => showMessage.error('复制失败')
    );
  }, [output]);

  const clearAll = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const swapIo = useCallback(() => {
    setInput(output);
    setOutput('');
    setError('');
  }, [output]);

  return (
    <div className="codec-tools feature-content">
      <div className="codec-selectors">
        <div className="codec-select-row">
          <span className="codec-select-label">类型</span>
          <Select<Category>
            className="codec-tool-select"
            size="small"
            value={category}
            onChange={(v) => {
              setCategory(v);
              setError('');
            }}
            options={[
              { value: 'unicode', label: 'Unicode 编码' },
              { value: 'utf8', label: 'UTF-8 编码' },
              { value: 'url', label: 'URL 编码' },
            ]}
            style={{ width: '100%' }}
          />
        </div>
        <div className="codec-select-row">
          <span className="codec-select-label">操作</span>
          {category === 'unicode' && (
            <Select<UnicodeOp>
              className="codec-tool-select"
              size="small"
              value={unicodeOp}
              onChange={(v) => {
                setUnicodeOp(v);
                setError('');
              }}
              style={{ width: '100%' }}
              options={[
                { value: 'ascii2uni', label: 'ASCII → Unicode（\\uXXXX）' },
                { value: 'uni2ascii', label: 'Unicode → ASCII' },
                { value: 'uni2cn', label: 'Unicode 转义 → 文本' },
                { value: 'cn2uni', label: '文本 → Unicode（\\uXXXX）' },
              ]}
            />
          )}
          {category === 'utf8' && (
            <Select<Utf8Op>
              className="codec-tool-select"
              size="small"
              value={utf8Op}
              onChange={(v) => {
                setUtf8Op(v);
                setError('');
              }}
              style={{ width: '100%' }}
              options={[
                { value: 'utf82cn', label: 'UTF-8 十六进制 → 文本' },
                { value: 'cn2utf8', label: '文本 → UTF-8 字节' },
              ]}
            />
          )}
          {category === 'url' && (
            <Select<UrlOp>
              className="codec-tool-select"
              size="small"
              value={urlOp}
              onChange={(v) => {
                setUrlOp(v);
                setError('');
              }}
              style={{ width: '100%' }}
              options={[
                { value: 'encode', label: 'URL 编码' },
                { value: 'decode', label: 'URL 解码' },
              ]}
            />
          )}
        </div>
      </div>

      <Alert
        type="info"
        showIcon
        message={currentOpLabel}
        description={
          category === 'unicode' && unicodeOp === 'uni2ascii' ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              将 <code>{'\\uXXXX'}</code> 解码为文本；仅当结果全部为 ASCII 时才输出，否则清空输出并提示错误。
            </Text>
          ) : category === 'unicode' && unicodeOp === 'uni2cn' ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              支持 <code>{'\\u4e2d'}</code> 与 JSON 中的 <code>{'\\\\u4e2d'}</code> 形式。
            </Text>
          ) : category === 'utf8' && utf8Op === 'utf82cn' ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              支持 <code>E4 B8 AD</code>、<code>E4B8AD</code>、<code>{'\\xE4\\xB8\\xAD'}</code>；若含{' '}
              <code>%XX</code>（如 <code>%E4%B8%AD</code>），仅按百分号序列取字节，避免英文中的 a–f 被误解析。
            </Text>
          ) : category === 'utf8' && utf8Op === 'cn2utf8' ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              输出三行：空格分隔十六进制、<code>{'\\x'}</code> 转义、<code>%</code> 百分号编码（大写）。
            </Text>
          ) : category === 'url' ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              使用 <code>encodeURIComponent</code> / <code>decodeURIComponent</code>；解码时会将 <code>+</code> 视为空格。
            </Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 11 }}>
              在下方输入内容后点击「转换」。
            </Text>
          )
        }
        style={{ fontSize: 11, flexShrink: 0 }}
      />

      {error ? (
        <Alert type="error" message={error} showIcon style={{ flexShrink: 0 }} />
      ) : null}

      <div className="codec-io">
        <div className="codec-io-grid">
          <span className="codec-io-label">输入</span>
          <TextArea
            className="codec-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴或输入待处理内容"
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
        </div>
        <div className="codec-io-grid">
          <span className="codec-io-label">输出</span>
          <TextArea
            className="codec-textarea"
            value={output}
            readOnly
            placeholder="转换结果将显示在这里"
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
        </div>
      </div>

      <Space wrap className="codec-actions">
        <Button type="primary" size="small" onClick={convert}>
          转换
        </Button>
        <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>
          复制结果
        </Button>
        <Button size="small" icon={<SwapOutlined />} onClick={swapIo} disabled={!output}>
          结果作为输入
        </Button>
        <Button size="small" icon={<ClearOutlined />} onClick={clearAll}>
          清空
        </Button>
      </Space>
    </div>
  );
};

export default CodecTools;
