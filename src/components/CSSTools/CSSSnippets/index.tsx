import React, { useState } from 'react';
import { Select } from 'antd';
import './index.css';
import { showMessage } from '../../../utils/message';
import { CSS_SNIPPETS } from './snippets';

type Category = 
  | 'layout'
  | 'visual'
  | 'responsive'
  | 'animation'
  | 'interaction'
  | 'utilities'
  | 'mobile'
  | 'form'
  | 'mixins';

interface CategoryOption {
  value: Category;
  label: string;
  icon: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'layout', label: '布局相关', icon: '📐' },
  { value: 'visual', label: '视觉效果', icon: '🎨' },
  { value: 'responsive', label: '响应式设计', icon: '📱' },
  { value: 'animation', label: '动画效果', icon: '✨' },
  { value: 'interaction', label: '交互效果', icon: '🖱️' },
  { value: 'utilities', label: '实用工具类', icon: '🔧' },
  { value: 'mobile', label: '移动端专用', icon: '📲' },
  { value: 'form', label: '表单相关', icon: '📋' },
  { value: 'mixins', label: '实用混合类', icon: '🔀' },
];

const CSSSnippets: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('layout');
  const [selectedSnippet, setSelectedSnippet] = useState<string>('');

  const snippets = CSS_SNIPPETS[selectedCategory] || [];
  const currentSnippet = snippets.find(s => s.id === selectedSnippet);

  // 复制代码
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showMessage.success('已复制到剪贴板');
  };

  return (
    <div className="css-snippets">
      <div className="category-selector">
        <Select
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value as Category);
            setSelectedSnippet('');
          }}
          style={{ width: '100%' }}
          size="small"
          className="category-select"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              <span className="category-option">
                <span className="category-icon">{option.icon}</span>
                <span>{option.label}</span>
              </span>
            </Select.Option>
          ))}
        </Select>
      </div>

      <div className="snippets-container">
        <div className="snippets-list">
          <div className="snippets-header">
            <label>代码片段列表：</label>
            <span className="snippets-count">共 {snippets.length} 个</span>
          </div>
          <div className="snippets-items">
            {snippets.length > 0 ? (
              snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className={`snippet-item ${selectedSnippet === snippet.id ? 'active' : ''}`}
                  onClick={() => setSelectedSnippet(snippet.id)}
                >
                  <div className="snippet-title">{snippet.title}</div>
                  {snippet.description && (
                    <div className="snippet-desc">{snippet.description}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">该分类暂无代码片段</div>
            )}
          </div>
        </div>

        {currentSnippet && (
          <div className="snippet-detail">
          <div className="detail-header">
            <div className="detail-title-section">
              <h3 className="detail-title">{currentSnippet.title}</h3>
              {currentSnippet.description && (
                <p className="detail-description">{currentSnippet.description}</p>
              )}
            </div>
            <button
              onClick={() => copyCode(currentSnippet.code)}
              className="copy-code-btn"
            >
              📋 复制代码
            </button>
          </div>
          <div className="code-preview">
            <pre className="code-block">
              <code>{currentSnippet.code}</code>
            </pre>
          </div>
          {currentSnippet.example && (
            <div className="example-section">
              <div className="example-header">示例效果：</div>
              <div className="example-content" dangerouslySetInnerHTML={{ __html: currentSnippet.example }} />
            </div>
          )}
          </div>
        )}

        {!selectedSnippet && (
          <div className="empty-detail">
            <div className="empty-icon">📝</div>
            <div className="empty-text">请从左侧选择一个代码片段</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSSSnippets;

