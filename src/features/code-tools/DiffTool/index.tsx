import React, { useState, useMemo } from 'react';
import { Button, Space, message as antdMessage } from 'antd';
import { SwapOutlined, CopyOutlined } from '@ant-design/icons';
import './index.css';

interface DiffLine {
  type: 'equal' | 'add' | 'remove';
  leftNum?: number;
  rightNum?: number;
  content: string;
}

/* 简易 LCS diff 算法 */
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const oldLen = oldLines.length;
  const newLen = newLines.length;

  // LCS DP
  const dp: number[][] = Array.from({ length: oldLen + 1 }, () => new Array(newLen + 1).fill(0));
  for (let i = 1; i <= oldLen; i++) {
    for (let j = 1; j <= newLen; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // 回溯
  const result: DiffLine[] = [];
  let i = oldLen, j = newLen;
  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({ type: 'equal', leftNum: i, rightNum: j, content: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'add', rightNum: j, content: newLines[j - 1] });
      j--;
    } else if (i > 0) {
      stack.push({ type: 'remove', leftNum: i, content: oldLines[i - 1] });
      i--;
    }
  }

  while (stack.length > 0) {
    result.push(stack.pop()!);
  }

  return result;
}

const DiffTool: React.FC = () => {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  const diffResult = useMemo(() => {
    if (!showDiff) return [];
    return computeDiff(oldText, newText);
  }, [oldText, newText, showDiff]);

  const stats = useMemo(() => {
    const added = diffResult.filter((d) => d.type === 'add').length;
    const removed = diffResult.filter((d) => d.type === 'remove').length;
    const unchanged = diffResult.filter((d) => d.type === 'equal').length;
    return { added, removed, unchanged };
  }, [diffResult]);

  const handleCompare = () => {
    if (!oldText.trim() && !newText.trim()) {
      antdMessage.warning('请输入要对比的文本');
      return;
    }
    setShowDiff(true);
  };

  const copyDiff = () => {
    const text = diffResult.map((line) => {
      const prefix = line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';
      return `${prefix} ${line.content}`;
    }).join('\n');
    navigator.clipboard?.writeText(text).then(() => antdMessage.success('Diff 已复制'));
  };

  const swapTexts = () => {
    setOldText(newText);
    setNewText(oldText);
    setShowDiff(false);
  };

  return (
    <div className="diff-tool">
      <div className="diff-editors">
        <div className="diff-editor-pane">
          <div className="diff-pane-header">📄 原文</div>
          <textarea
            className="diff-textarea"
            value={oldText}
            onChange={(e) => { setOldText(e.target.value); setShowDiff(false); }}
            placeholder="粘贴原始文本..."
            spellCheck={false}
          />
        </div>
        <div className="diff-editor-pane">
          <div className="diff-pane-header">📝 新文</div>
          <textarea
            className="diff-textarea"
            value={newText}
            onChange={(e) => { setNewText(e.target.value); setShowDiff(false); }}
            placeholder="粘贴修改后的文本..."
            spellCheck={false}
          />
        </div>
      </div>

      <div className="diff-actions">
        <Button size="small" type="primary" onClick={handleCompare}>对比</Button>
        <Button size="small" icon={<SwapOutlined />} onClick={swapTexts}>交换</Button>
        {showDiff && <Button size="small" icon={<CopyOutlined />} onClick={copyDiff}>复制 Diff</Button>}
        {showDiff && (
          <Space size={8} style={{ fontSize: 11, marginLeft: 'auto' }}>
            <span style={{ color: '#4caf50' }}>+{stats.added}</span>
            <span style={{ color: '#f44336' }}>-{stats.removed}</span>
            <span style={{ color: 'var(--theme-textMuted)' }}>={stats.unchanged}</span>
          </Space>
        )}
      </div>

      {showDiff && (
        <div className="diff-output">
          {diffResult.map((line, index) => (
            <div key={index} className={`diff-line diff-line--${line.type}`}>
              <span className="diff-line-num">
                {line.leftNum ?? ' '}
              </span>
              <span className="diff-line-num">
                {line.rightNum ?? ' '}
              </span>
              <span className="diff-line-prefix">
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              <span className="diff-line-content">{line.content || ' '}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiffTool;
