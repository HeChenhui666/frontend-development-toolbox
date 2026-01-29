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
import { FUNCTION_SNIPPETS } from './snippets';

const { Text, Paragraph } = Typography;

type Category = 'data' | 'dom' | 'async' | 'storage';

interface CategoryOption {
  value: Category;
  label: string;
  icon: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'data', label: '数据处理类', icon: '📦' },
  { value: 'dom', label: 'DOM操作类', icon: '🧩' },
  { value: 'async', label: '异步处理类', icon: '⏳' },
  { value: 'storage', label: '存储与缓存类', icon: '🗄️' },
];

const CommonFunctions: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('data');
  const [selectedSnippet, setSelectedSnippet] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const snippets = FUNCTION_SNIPPETS[selectedCategory] || [];
  const currentSnippet = snippets.find((snippet) => snippet.id === selectedSnippet);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    antdMessage.success('已复制到剪贴板');
  };

  return (
    <div className="common-functions">
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
        <Card size="small" title={`函数列表（共 ${snippets.length} 个）`}>
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
              <Empty description="该分类暂无函数" />
            )}
          </Space>
        </Card>
      </div>

      <Drawer
        open={drawerOpen}
        placement="right"
        width="80%"
        title={currentSnippet ? currentSnippet.title : '函数详情'}
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
          </Space>
        ) : (
          <Empty description="请从列表选择一个函数" />
        )}
      </Drawer>
    </div>
  );
};

export default CommonFunctions;
