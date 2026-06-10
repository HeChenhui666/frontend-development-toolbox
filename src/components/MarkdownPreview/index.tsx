import React, { useState, useMemo, useRef, useCallback } from 'react';
import './index.css';

const DEMO_MD = `# Markdown 预览器

## 功能特性
- **实时预览** — 左侧编辑，右侧同步渲染
- *斜体*、~~删除线~~、\`行内代码\`
- [链接示例](https://example.com)

### 代码块
\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

### 列表
1. 有序列表项 1
2. 有序列表项 2
   - 嵌套无序列表

### 引用
> 代码是写给人看的，附带能在机器上运行。
> — Harold Abelson

### 表格
| 功能 | 状态 |
|------|------|
| 标题 | ✅ |
| 列表 | ✅ |
| 代码 | ✅ |

---
*由前端开发工具箱提供*
`;

/* 简易 Markdown → HTML 解析器（纯前端，无外部依赖） */
function parseMarkdown(md: string): string {
  let html = md;

  // 代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const escapedCode = escapeHtml(code.trim());
    return `<pre class="md-code-block"><code class="lang-${lang || 'text'}">${escapedCode}</code></pre>`;
  });

  // 表格
  html = html.replace(/(?:^|\n)(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/g, (_match, headerRow, _separator, bodyRows) => {
    const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table class="md-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 已处理的代码块和表格
    if (line.startsWith('<pre') || line.startsWith('<table')) {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
      result.push(line);
      continue;
    }

    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
      const level = headingMatch[1].length;
      result.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }

    // 水平线
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
      result.push('<hr/>');
      continue;
    }

    // 引用
    if (line.startsWith('> ')) {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
      result.push(`<blockquote>${inlineFormat(line.slice(2))}</blockquote>`);
      continue;
    }

    // 无序列表
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
        result.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      result.push(`<li>${inlineFormat(ulMatch[2])}</li>`);
      continue;
    }

    // 有序列表
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
        result.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      result.push(`<li>${inlineFormat(olMatch[2])}</li>`);
      continue;
    }

    // 关闭列表
    if (inList && line.trim() === '') {
      result.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }

    // 空行
    if (line.trim() === '') {
      result.push('<br/>');
      continue;
    }

    // 段落
    if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
    result.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inList) result.push(listType === 'ul' ? '</ul>' : '</ol>');
  return result.join('\n');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFormat(text: string): string {
  let result = text;
  result = result.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/~~(.+?)~~/g, '<del>$1</del>');
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return result;
}

const MarkdownPreview: React.FC = () => {
  const [source, setSource] = useState(DEMO_MD);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef<'editor' | 'preview' | null>(null);

  const renderedHtml = useMemo(() => parseMarkdown(source), [source]);

  const syncScroll = useCallback((origin: 'editor' | 'preview') => {
    if (scrollingRef.current && scrollingRef.current !== origin) return;
    scrollingRef.current = origin;

    const sourceEl = origin === 'editor' ? editorRef.current : previewRef.current;
    const targetEl = origin === 'editor' ? previewRef.current : editorRef.current;
    if (!sourceEl || !targetEl) return;

    const scrollRatio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);
    targetEl.scrollTop = scrollRatio * (targetEl.scrollHeight - targetEl.clientHeight);

    requestAnimationFrame(() => { scrollingRef.current = null; });
  }, []);

  return (
    <div className="markdown-preview">
      <div className="md-editor-pane">
        <div className="md-pane-header">📝 Markdown</div>
        <textarea
          ref={editorRef}
          className="md-textarea"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          onScroll={() => syncScroll('editor')}
          placeholder="在此输入 Markdown..."
          spellCheck={false}
        />
      </div>
      <div className="md-preview-pane">
        <div className="md-pane-header">👁 预览</div>
        <div
          ref={previewRef}
          className="md-rendered"
          onScroll={() => syncScroll('preview')}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
};

export default MarkdownPreview;
