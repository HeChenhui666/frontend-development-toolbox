import React, { useState } from 'react';
import {
  Select,
  Card,
  Space,
  Typography,
  Button,
  Drawer,
  Empty,
  message as antdMessage,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import './index.css';
import { CSS_SNIPPETS } from './snippets';

const { Text, Paragraph } = Typography;

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
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const snippets = CSS_SNIPPETS[selectedCategory] || [];
  const currentSnippet = snippets.find(s => s.id === selectedSnippet);

  // 复制代码
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    antdMessage.success('已复制到剪贴板');
  };

  return (
    <div className="css-snippets" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      <Card size="small" title="选择分类">
        <Select
          value={selectedCategory}
          onChange={(value) => {
            setSelectedCategory(value as Category);
            setSelectedSnippet('');
            setDrawerOpen(false);
          }}
          style={{ width: '100%' }}
          size="small"
          options={CATEGORY_OPTIONS.map((option) => ({
            value: option.value,
            label: (
              <Space>
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </Space>
            ),
          }))}
        />
      </Card>

      <div style={{ flex: 1, minHeight: 0 }}>
        <Card size="small" title={`代码片段列表（共 ${snippets.length} 个）`}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {snippets.length > 0 ? (
              snippets.map((snippet) => (
                <Card
                  key={snippet.id}
                  size="small"
                  hoverable
                  style={{
                    cursor: 'pointer',
                    borderColor: selectedSnippet === snippet.id ? 'var(--theme-primary)' : undefined,
                    borderWidth: selectedSnippet === snippet.id ? 2 : 1,
                  }}
                  onClick={() => {
                    setSelectedSnippet(snippet.id);
                    setDrawerOpen(true);
                  }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>{snippet.title}</Text>
                    {snippet.description && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {snippet.description}
                      </Text>
                    )}
                  </Space>
                </Card>
              ))
            ) : (
              <Empty description="该分类暂无代码片段" />
            )}
          </Space>
        </Card>
      </div>

      <Drawer
        open={drawerOpen}
        placement="right"
        width="80%"
        title={currentSnippet ? currentSnippet.title : '代码详情'}
        onClose={() => setDrawerOpen(false)}
        extra={
          currentSnippet && (
            <Button
              icon={<CopyOutlined />}
              onClick={() => copyCode(currentSnippet.code)}
              size="small"
            >
              复制代码
            </Button>
          )
        }
      >
        {currentSnippet ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {currentSnippet.description && (
              <Paragraph type="secondary">{currentSnippet.description}</Paragraph>
            )}
            <Card size="small" style={{ background: '#f5f5f5' }}>
              <pre style={{ margin: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                <code>{currentSnippet.code}</code>
              </pre>
            </Card>
            {currentSnippet.example && (
              <Card size="small" title="示例效果">
                <div dangerouslySetInnerHTML={{ __html: currentSnippet.example }} />
              </Card>
            )}
          </Space>
        ) : (
          <Empty description="请从左侧选择一个代码片段" />
        )}
      </Drawer>
    </div>
  );
};

export default CSSSnippets;

