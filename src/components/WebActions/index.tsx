import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Collapse, Input, Space, Typography, message as antdMessage } from 'antd';
import { ClusterOutlined, CopyOutlined, FieldTimeOutlined, UnlockOutlined } from '@ant-design/icons';
import './index.css';

const { Paragraph, Text } = Typography;

const ENABLE_COPY_FILES = ['content/enableCopy.js'] as const;
const LATE_IFRAME_TICK_MS = 3000;
const LATE_IFRAME_TOTAL_MS = 60000;
const URL_POPUP_WIDTH = 900;
const URL_POPUP_HEIGHT = 700;

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

/** 向指定 tab 注入脚本；不展示任何提示（由调用方处理） */
const injectEnableCopyIntoTab = (
  tabId: number,
  allFrames: boolean
): Promise<{ ok: boolean; frameCount: number; errorMessage?: string }> =>
  new Promise((resolve) => {
    chrome.scripting.executeScript(
      {
        target: { tabId, allFrames },
        files: [...ENABLE_COPY_FILES],
        world: 'MAIN',
      },
      (results) => {
        if (chrome.runtime.lastError) {
          resolve({
            ok: false,
            frameCount: 0,
            errorMessage: chrome.runtime.lastError.message,
          });
          return;
        }
        resolve({ ok: true, frameCount: results?.length ?? 0 });
      }
    );
  });

const WebActions: React.FC = () => {
  const [copyUnlockLoading, setCopyUnlockLoading] = useState(false);
  const [copyUnlockAllFramesLoading, setCopyUnlockAllFramesLoading] = useState(false);
  const [lateIframeWatchActive, setLateIframeWatchActive] = useState(false);
  const [openUrlValue, setOpenUrlValue] = useState('');
  const [openUrlLoading, setOpenUrlLoading] = useState(false);

  const lateWatchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lateWatchEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lateWatchTabIdRef = useRef<number | null>(null);

  const clearLateWatchTimers = useCallback(() => {
    if (lateWatchIntervalRef.current !== null) {
      clearInterval(lateWatchIntervalRef.current);
      lateWatchIntervalRef.current = null;
    }
    if (lateWatchEndTimeoutRef.current !== null) {
      clearTimeout(lateWatchEndTimeoutRef.current);
      lateWatchEndTimeoutRef.current = null;
    }
    lateWatchTabIdRef.current = null;
    setLateIframeWatchActive(false);
  }, []);

  useEffect(() => () => clearLateWatchTimers(), [clearLateWatchTimers]);

  const injectEnableCopy = useCallback((allFrames: boolean) => {
    if (!isExtensionInjectEnv()) {
      antdMessage.warning('请在 Chrome/Edge 等 Chromium 扩展环境中使用此功能');
      return;
    }
    const setLoading = allFrames ? setCopyUnlockAllFramesLoading : setCopyUnlockLoading;
    setLoading(true);
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      const url = tab?.url;
      if (!tab?.id) {
        setLoading(false);
        antdMessage.error('未找到当前标签页');
        return;
      }
      if (!isInjectablePageUrl(url)) {
        setLoading(false);
        antdMessage.warning('当前页面无法注入脚本（内置页、扩展页或受限 URL）');
        return;
      }
      const { ok, frameCount, errorMessage } = await injectEnableCopyIntoTab(tab.id, allFrames);
      setLoading(false);
      if (!ok) {
        antdMessage.error(errorMessage || '注入失败');
        return;
      }
      if (allFrames) {
        if (frameCount === 0) {
          antdMessage.warning('未能在任何文档中完成注入（可能受页面或权限限制）');
          return;
        }
        antdMessage.success(
          `已在 ${frameCount} 个文档中尝试解除复制限制（含跨域 iframe 与多层嵌套，以扩展实际可注入的框架为准）`
        );
        return;
      }
      antdMessage.success('已在当前顶层页面尝试解除复制限制，请直接选中文字后复制');
    });
  }, []);

  const handleEnableCopyTopOnly = useCallback(() => injectEnableCopy(false), [injectEnableCopy]);
  const handleEnableCopyAllFrames = useCallback(() => injectEnableCopy(true), [injectEnableCopy]);

  const handleLateIframeWatchToggle = useCallback(() => {
    if (!isExtensionInjectEnv()) {
      antdMessage.warning('请在 Chrome/Edge 等 Chromium 扩展环境中使用此功能');
      return;
    }
    if (lateIframeWatchActive) {
      clearLateWatchTimers();
      antdMessage.info('已停止定时补注');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      const url = tab?.url;
      if (!tab?.id) {
        antdMessage.error('未找到当前标签页');
        return;
      }
      if (!isInjectablePageUrl(url)) {
        antdMessage.warning('当前页面无法注入脚本（内置页、扩展页或受限 URL）');
        return;
      }

      const tabId = tab.id;
      // 避免快速连点或重叠回调留下多组 interval
      clearLateWatchTimers();

      lateWatchTabIdRef.current = tabId;
      setLateIframeWatchActive(true);

      const first = await injectEnableCopyIntoTab(tabId, true);
      if (!first.ok) {
        antdMessage.error(first.errorMessage || '注入失败');
        clearLateWatchTimers();
        return;
      }
      if (first.frameCount === 0) {
        antdMessage.warning('首次扫描未注入任何框架，仍将定时重试以等待晚加载 iframe');
      } else {
        antdMessage.success(
          `首次已在 ${first.frameCount} 个文档中注入；${LATE_IFRAME_TOTAL_MS / 1000} 秒内每 ${LATE_IFRAME_TICK_MS / 1000} 秒自动补注新框架`
        );
      }

      antdMessage.info('请尽量保持本扩展界面打开（弹窗关闭后定时器会停止）');

      lateWatchIntervalRef.current = setInterval(() => {
        const pinned = lateWatchTabIdRef.current;
        if (pinned == null) return;
        void injectEnableCopyIntoTab(pinned, true);
      }, LATE_IFRAME_TICK_MS);

      lateWatchEndTimeoutRef.current = setTimeout(() => {
        clearLateWatchTimers();
        antdMessage.success(
          `定时补注已结束（约 ${LATE_IFRAME_TOTAL_MS / 1000} 秒）。若 iframe 晚于此时才加载，可再点一次本按钮`
        );
      }, LATE_IFRAME_TOTAL_MS);
    });
  }, [lateIframeWatchActive, clearLateWatchTimers]);

  const isValidUrl = useCallback((value: string): boolean => {
    try {
      new URL(value.trim());
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleOpenUrlPopup = useCallback(() => {
    const url = openUrlValue.trim();
    if (!url) {
      antdMessage.warning('请输入要打开的链接');
      return;
    }
    if (!isValidUrl(url)) {
      antdMessage.warning('请输入有效的 URL，例如 https://example.com');
      return;
    }

    setOpenUrlLoading(true);

    if (typeof chrome !== 'undefined' && chrome.windows?.create) {
      chrome.windows.create(
        {
          url,
          type: 'popup',
          width: URL_POPUP_WIDTH,
          height: URL_POPUP_HEIGHT,
          focused: true,
        },
        () => {
          setOpenUrlLoading(false);
          if (chrome.runtime.lastError) {
            antdMessage.error(chrome.runtime.lastError.message || '打开失败');
          }
        }
      );
      return;
    }

    const win = window.open(
      url,
      'webactions-url-popup',
      `width=${URL_POPUP_WIDTH},height=${URL_POPUP_HEIGHT},scrollbars=yes,resizable=yes,noopener,noreferrer`
    );
    setOpenUrlLoading(false);
    if (!win) {
      antdMessage.error('浏览器阻止了弹出窗口，请允许弹窗后重试');
    }
  }, [isValidUrl, openUrlValue]);

  const handleUrlInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setOpenUrlValue(event.target.value);
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
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Button
                        type="primary"
                        icon={<UnlockOutlined />}
                        loading={copyUnlockLoading}
                        onClick={handleEnableCopyTopOnly}
                        block
                      >
                        仅顶层文档解除复制
                      </Button>
                      <Button
                        icon={<ClusterOutlined />}
                        loading={copyUnlockAllFramesLoading}
                        onClick={handleEnableCopyAllFrames}
                        block
                      >
                        含全部 iframe 解除复制（跨域与嵌套）
                      </Button>
                      <Button
                        type={lateIframeWatchActive ? 'default' : 'dashed'}
                        danger={lateIframeWatchActive}
                        icon={<FieldTimeOutlined />}
                        onClick={handleLateIframeWatchToggle}
                        block
                      >
                        {lateIframeWatchActive
                          ? '停止补注晚加载 iframe'
                          : `短时补注晚加载 iframe（${LATE_IFRAME_TOTAL_MS / 1000} 秒内每 ${LATE_IFRAME_TICK_MS / 1000} 秒扫描）`}
                      </Button>
                      <Text type="secondary" className="web-actions-hint">
                        使用 Chromium 扩展的 <code>chrome.scripting</code>（<code>allFrames: true</code>
                        ），在扩展有权访问的<strong>每一个子框架</strong>内各注入一次脚本，正文在跨域或深层
                        iframe 里时优先点第二项。无法注入的框架（如 <code>chrome://</code> 内嵌、部分沙箱）会被跳过，成功数见提示。
                      </Text>
                      <Text type="secondary" className="web-actions-hint">
                        <strong>晚加载 iframe</strong>：第三项会先全框架注入一次，随后在约 {LATE_IFRAME_TOTAL_MS / 1000}{' '}
                        秒内每隔 {LATE_IFRAME_TICK_MS / 1000} 秒静默再注入；已处理过的文档会立即跳过，仅新出现的框架会执行脚本。弹窗模式下面板关闭即停止，建议用<strong>侧边栏</strong>。
                      </Text>
                    </Space>
                    <Text type="secondary">
                      综合处理常见防复制手段：全局 CSS 覆盖 <code>user-select</code>；遍历节点与 Shadow
                      DOM 写入可选中样式；移除 <code>oncopy</code> 等内联事件并由 MutationObserver
                      持续清理；劫持 <code>Event.prototype.preventDefault</code>（仅针对 copy / cut /
                      contextmenu / selectstart / dragstart），站点无论在<strong>捕获</strong>还是<strong>冒泡</strong>阶段调用均会被中和。
                    </Text>
                    <Text type="secondary">
                      说明：Canvas / 图片排版文字仍无法按纯文本复制。
                    </Text>
                  </Space>
                ),
              },
              {
                key: 'open-url-popup',
                label: (
                  <span className="web-actions-collapse-label">
                    <CopyOutlined aria-hidden />
                    <span>在小窗口打开网址</span>
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Input
                      placeholder="请输入完整 URL，例如 https://example.com"
                      value={openUrlValue}
                      onChange={handleUrlInputChange}
                      onPressEnter={handleOpenUrlPopup}
                      allowClear
                    />
                    <Button
                      type="primary"
                      onClick={handleOpenUrlPopup}
                      loading={openUrlLoading}
                      block
                    >
                      用小窗口打开网页
                    </Button>
                    <Text type="secondary">
                      若处于扩展环境，将尝试使用弹窗窗口打开；如不可用则回退到标准浏览器窗口。
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
