import React, { useCallback, useState } from 'react';
import { Button, Card, Collapse, Space, Typography, message as antdMessage } from 'antd';
import { CopyOutlined, UnlockOutlined } from '@ant-design/icons';
import './index.css';

const { Paragraph, Text } = Typography;

const isExtensionInjectEnv = () =>
  typeof chrome !== 'undefined' && !!chrome.tabs && !!chrome.scripting?.executeScript;

const isInjectablePageUrl = (url?: string | null): boolean => {
  if (!url) return false;
  const u = url.trim();
  if (
    u.startsWith('chrome://') ||
    u.startsWith('edge://') ||
    u.startsWith('about:') ||
    u.startsWith('devtools:') ||
    u.startsWith('view-source:')
  ) {
    return false;
  }
  try {
    const protocol = new URL(u).protocol.toLowerCase();
    if (protocol.endsWith('-extension:')) return false;
  } catch {
    return false;
  }
  return true;
};

const WebActions: React.FC = () => {
  const [copyUnlockLoading, setCopyUnlockLoading] = useState(false);

  const handleEnableCopy = useCallback(() => {
    if (!isExtensionInjectEnv()) {
      antdMessage.warning('请在 Chrome/Edge 等 Chromium 扩展环境中使用此功能');
      return;
    }
    setCopyUnlockLoading(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      const url = tab?.url;
      if (!tab?.id) {
        setCopyUnlockLoading(false);
        antdMessage.error('未找到当前标签页');
        return;
      }
      if (!isInjectablePageUrl(url)) {
        setCopyUnlockLoading(false);
        antdMessage.warning('当前页面无法注入脚本（内置页、扩展页或受限 URL）');
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ['content/enableCopy.js'],
          world: 'MAIN',
        },
        () => {
          setCopyUnlockLoading(false);
          if (chrome.runtime.lastError) {
            antdMessage.error(chrome.runtime.lastError.message || '注入失败');
            return;
          }
          antdMessage.success('已在当前页尝试解除复制限制，请直接选中文字后复制');
        }
      );
    });
  }, []);

  return (
    <div className="feature-content web-actions">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Paragraph type="secondary" className="web-actions-intro">
          在<strong>当前浏览器标签页</strong>上执行网页级操作。以下功能会向页面注入脚本（MAIN
          world），请仅在可信站点使用。
        </Paragraph>

        <div className="web-actions-list">
          <Collapse
            bordered={false}
            size="small"
            className="web-actions-collapse"
            defaultActiveKey={[]}
            items={[
              {
                key: 'unlock-copy',
                label: (
                  <span className="web-actions-collapse-label">
                    <UnlockOutlined aria-hidden />
                    <span>解除复制限制</span>
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      icon={<UnlockOutlined />}
                      loading={copyUnlockLoading}
                      onClick={handleEnableCopy}
                      block
                    >
                      在当前页解除复制限制
                    </Button>
                    <Text type="secondary">
                      综合处理常见防复制手段：全局 CSS 覆盖 <code>user-select</code>；遍历节点与 Shadow
                      DOM 写入可选中样式；移除 <code>oncopy</code> 等内联事件并由 MutationObserver
                      持续清理；劫持 <code>Event.prototype.preventDefault</code>（仅针对 copy / cut /
                      contextmenu / selectstart / dragstart），站点无论在<strong>捕获</strong>还是<strong>冒泡</strong>阶段调用均会被中和。
                    </Text>
                    <Text type="secondary">
                      说明：若页面在<strong>独立跨域 iframe</strong>内展示正文，需在对应 iframe
                      所在文档分别注入；部分站点使用 Canvas / 图片排版文字则无法按文本复制。
                    </Text>
                  </Space>
                ),
              },
            ]}
          />

          <Card size="small" className="web-actions-card web-actions-card--placeholder">
            <Space direction="vertical" align="center" style={{ width: '100%' }} size="small">
              <CopyOutlined className="web-actions-placeholder-icon" />
              <Text type="secondary">更多网页操作功能将陆续加入</Text>
            </Space>
          </Card>
        </div>
      </Space>
    </div>
  );
};

export default WebActions;
