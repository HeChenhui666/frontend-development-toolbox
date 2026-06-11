import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Collapse, Input, Space, Typography, message as antdMessage, Tag, Descriptions } from 'antd';
import { ClusterOutlined, CopyOutlined, FieldTimeOutlined, UnlockOutlined, BulbOutlined, DashboardOutlined, ApartmentOutlined } from '@ant-design/icons';
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
          在当前标签页执行网页操作，需向页面注入脚本，请仅在可信站点使用。
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
                        正文在跨域或深层 iframe 中时优先选第二项；无法注入的框架（如 <code>chrome://</code>、沙箱）会被跳过，成功数见提示。
                      </Text>
                      <Text type="secondary" className="web-actions-hint">
                        <strong>第三项（晚加载）</strong>：先注入一次，随后在 {LATE_IFRAME_TOTAL_MS / 1000} 秒内每隔 {LATE_IFRAME_TICK_MS / 1000} 秒自动补注新出现的框架。弹窗关闭即停止，建议用<strong>侧边栏</strong>。
                      </Text>
                    </Space>
                    <Text type="secondary">
                      覆盖 CSS <code>user-select</code>、移除内联防复制事件、MutationObserver 持续清理、劫持 copy / contextmenu 等事件的 <code>preventDefault</code>。Canvas / 图片文字无法按纯文本复制。
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

          <WebActionsExtended />
        </div>
      </Space>
    </div>
  );
};

/* ─── 暗黑模式注入 ─── */
const injectDarkMode = (tabId: number): Promise<boolean> =>
  new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const existingStyle = document.getElementById('__devtool_dark_mode__');
        if (existingStyle) {
          existingStyle.remove();
          return 'removed';
        }
        const style = document.createElement('style');
        style.id = '__devtool_dark_mode__';
        style.textContent = `
          html { filter: invert(1) hue-rotate(180deg) !important; }
          img, video, canvas, svg, [style*="background-image"] { filter: invert(1) hue-rotate(180deg) !important; }
        `;
        document.head.appendChild(style);
        return 'applied';
      },
      world: 'MAIN',
    }, (results) => {
      if (chrome.runtime.lastError) { resolve(false); return; }
      const result = results?.[0]?.result;
      if (result === 'removed') {
        antdMessage.success('暗黑模式已关闭');
      } else {
        antdMessage.success('暗黑模式已开启（再次点击可关闭）');
      }
      resolve(true);
    });
  });

/* ─── 页面性能分析 ─── */
interface PerformanceData {
  dnsLookup: number;
  tcpConnect: number;
  ttfb: number;
  contentDownload: number;
  domInteractive: number;
  domComplete: number;
  loadComplete: number;
  resourceCount: number;
  totalTransferSize: number;
  jsCount: number;
  cssCount: number;
  imgCount: number;
}

const collectPerformance = (tabId: number): Promise<PerformanceData | null> =>
  new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (!nav) return null;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return {
          dnsLookup: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
          tcpConnect: Math.round(nav.connectEnd - nav.connectStart),
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          contentDownload: Math.round(nav.responseEnd - nav.responseStart),
          domInteractive: Math.round(nav.domInteractive - nav.startTime),
          domComplete: Math.round(nav.domComplete - nav.startTime),
          loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
          resourceCount: resources.length,
          totalTransferSize: resources.reduce((s, r) => s + (r.transferSize || 0), 0),
          jsCount: resources.filter((r) => r.initiatorType === 'script').length,
          cssCount: resources.filter((r) => r.initiatorType === 'link' || r.initiatorType === 'css').length,
          imgCount: resources.filter((r) => r.initiatorType === 'img').length,
        };
      },
      world: 'MAIN',
    }, (results) => {
      if (chrome.runtime.lastError) { resolve(null); return; }
      resolve(results?.[0]?.result as PerformanceData | null);
    });
  });

/* ─── DOM 统计 ─── */
interface DomStats {
  totalElements: number;
  totalNodes: number;
  maxDepth: number;
  elementsWithId: number;
  elementsWithClass: number;
  elementsWithInlineStyle: number;
  images: number;
  links: number;
  forms: number;
  inputs: number;
  scripts: number;
  iframes: number;
  tagCounts: Record<string, number>;
}

const collectDomStats = (tabId: number): Promise<DomStats | null> =>
  new Promise((resolve) => {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const allElements = document.querySelectorAll('*');
        const tagCounts: Record<string, number> = {};
        let elementsWithId = 0;
        let elementsWithClass = 0;
        let elementsWithInlineStyle = 0;

        allElements.forEach((el) => {
          const tag = el.tagName.toLowerCase();
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          if (el.id) elementsWithId++;
          if (el.classList.length > 0) elementsWithClass++;
          if ((el as HTMLElement).style?.cssText) elementsWithInlineStyle++;
        });

        const getMaxDepth = (node: Node, depth: number): number => {
          let max = depth;
          node.childNodes.forEach((child) => {
            if (child.nodeType === 1) {
              const childDepth = getMaxDepth(child, depth + 1);
              if (childDepth > max) max = childDepth;
            }
          });
          return max;
        };

        // 只取 top 10 标签
        const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const top10Tags = Object.fromEntries(sortedTags);

        return {
          totalElements: allElements.length,
          totalNodes: document.querySelectorAll('*').length + document.querySelectorAll('*').length, // approx
          maxDepth: getMaxDepth(document.documentElement, 0),
          elementsWithId,
          elementsWithClass,
          elementsWithInlineStyle,
          images: document.querySelectorAll('img').length,
          links: document.querySelectorAll('a').length,
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input,textarea,select').length,
          scripts: document.querySelectorAll('script').length,
          iframes: document.querySelectorAll('iframe').length,
          tagCounts: top10Tags,
        };
      },
      world: 'MAIN',
    }, (results) => {
      if (chrome.runtime.lastError) { resolve(null); return; }
      resolve(results?.[0]?.result as DomStats | null);
    });
  });

/* ─── 扩展功能组件 ─── */
const WebActionsExtended: React.FC = () => {
  const [darkModeLoading, setDarkModeLoading] = useState(false);
  const [perfData, setPerfData] = useState<PerformanceData | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [domStats, setDomStats] = useState<DomStats | null>(null);
  const [domLoading, setDomLoading] = useState(false);

  const getActiveTab = (): Promise<chrome.tabs.Tab | null> =>
    new Promise((resolve) => {
      if (!isExtensionInjectEnv()) { resolve(null); return; }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0] || null));
    });

  const handleDarkMode = useCallback(async () => {
    if (!isExtensionInjectEnv()) { antdMessage.warning('请在扩展环境中使用'); return; }
    setDarkModeLoading(true);
    const tab = await getActiveTab();
    if (!tab?.id || !isInjectablePageUrl(tab.url)) {
      setDarkModeLoading(false);
      antdMessage.warning('当前页面不支持此操作');
      return;
    }
    await injectDarkMode(tab.id);
    setDarkModeLoading(false);
  }, []);

  const handlePerfAnalysis = useCallback(async () => {
    if (!isExtensionInjectEnv()) { antdMessage.warning('请在扩展环境中使用'); return; }
    setPerfLoading(true);
    const tab = await getActiveTab();
    if (!tab?.id || !isInjectablePageUrl(tab.url)) {
      setPerfLoading(false);
      antdMessage.warning('当前页面不支持此操作');
      return;
    }
    const data = await collectPerformance(tab.id);
    setPerfLoading(false);
    if (!data) { antdMessage.error('无法获取性能数据'); return; }
    setPerfData(data);
  }, []);

  const handleDomStats = useCallback(async () => {
    if (!isExtensionInjectEnv()) { antdMessage.warning('请在扩展环境中使用'); return; }
    setDomLoading(true);
    const tab = await getActiveTab();
    if (!tab?.id || !isInjectablePageUrl(tab.url)) {
      setDomLoading(false);
      antdMessage.warning('当前页面不支持此操作');
      return;
    }
    const stats = await collectDomStats(tab.id);
    setDomLoading(false);
    if (!stats) { antdMessage.error('无法获取 DOM 统计'); return; }
    setDomStats(stats);
  }, []);

  const formatMs = (ms: number) => ms > 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getTimeColor = (ms: number): string => {
    if (ms <= 100) return 'green';
    if (ms <= 500) return 'orange';
    return 'red';
  };

  return (
    <Collapse
      bordered={false}
      size="small"
      className="web-actions-collapse"
      items={[
        {
          key: 'dark-mode',
          label: (
            <span className="web-actions-collapse-label">
              <BulbOutlined aria-hidden />
              <span>暗黑模式</span>
            </span>
          ),
          children: (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button type="primary" icon={<BulbOutlined />} loading={darkModeLoading} onClick={handleDarkMode} block>
                切换暗黑模式
              </Button>
              <Text type="secondary" style={{ fontSize: 11 }}>
                通过 CSS filter invert 实现全页面暗黑模式，图片/视频会自动反转回正常颜色。再次点击可关闭。
              </Text>
            </Space>
          ),
        },
        {
          key: 'performance',
          label: (
            <span className="web-actions-collapse-label">
              <DashboardOutlined aria-hidden />
              <span>页面性能分析</span>
            </span>
          ),
          children: (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button type="primary" icon={<DashboardOutlined />} loading={perfLoading} onClick={handlePerfAnalysis} block>
                分析当前页面性能
              </Button>
              {perfData && (
                <Descriptions size="small" column={2} bordered style={{ fontSize: 10 }}>
                  <Descriptions.Item label="DNS 解析">
                    <Tag color={getTimeColor(perfData.dnsLookup)}>{formatMs(perfData.dnsLookup)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="TCP 连接">
                    <Tag color={getTimeColor(perfData.tcpConnect)}>{formatMs(perfData.tcpConnect)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="TTFB">
                    <Tag color={getTimeColor(perfData.ttfb)}>{formatMs(perfData.ttfb)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="内容下载">
                    <Tag color={getTimeColor(perfData.contentDownload)}>{formatMs(perfData.contentDownload)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="DOM Interactive">
                    <Tag color={getTimeColor(perfData.domInteractive)}>{formatMs(perfData.domInteractive)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="DOM Complete">
                    <Tag color={getTimeColor(perfData.domComplete)}>{formatMs(perfData.domComplete)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="页面加载完成" span={2}>
                    <Tag color={getTimeColor(perfData.loadComplete)}>{formatMs(perfData.loadComplete)}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="资源总数">{perfData.resourceCount}</Descriptions.Item>
                  <Descriptions.Item label="传输总量">{formatBytes(perfData.totalTransferSize)}</Descriptions.Item>
                  <Descriptions.Item label="JS 文件">{perfData.jsCount}</Descriptions.Item>
                  <Descriptions.Item label="CSS 文件">{perfData.cssCount}</Descriptions.Item>
                  <Descriptions.Item label="图片" span={2}>{perfData.imgCount}</Descriptions.Item>
                </Descriptions>
              )}
            </Space>
          ),
        },
        {
          key: 'dom-stats',
          label: (
            <span className="web-actions-collapse-label">
              <ApartmentOutlined aria-hidden />
              <span>DOM 统计</span>
            </span>
          ),
          children: (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button type="primary" icon={<ApartmentOutlined />} loading={domLoading} onClick={handleDomStats} block>
                统计当前页面 DOM
              </Button>
              {domStats && (
                <>
                  <Descriptions size="small" column={2} bordered style={{ fontSize: 10 }}>
                    <Descriptions.Item label="元素总数">
                      <Tag color={domStats.totalElements > 3000 ? 'red' : domStats.totalElements > 1500 ? 'orange' : 'green'}>
                        {domStats.totalElements}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="最大嵌套深度">
                      <Tag color={domStats.maxDepth > 30 ? 'red' : domStats.maxDepth > 15 ? 'orange' : 'green'}>
                        {domStats.maxDepth} 层
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="有 ID 属性">{domStats.elementsWithId}</Descriptions.Item>
                    <Descriptions.Item label="有 Class 属性">{domStats.elementsWithClass}</Descriptions.Item>
                    <Descriptions.Item label="内联样式" span={2}>
                      <Tag color={domStats.elementsWithInlineStyle > 50 ? 'orange' : 'green'}>
                        {domStats.elementsWithInlineStyle}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="图片">{domStats.images}</Descriptions.Item>
                    <Descriptions.Item label="链接">{domStats.links}</Descriptions.Item>
                    <Descriptions.Item label="表单">{domStats.forms}</Descriptions.Item>
                    <Descriptions.Item label="输入控件">{domStats.inputs}</Descriptions.Item>
                    <Descriptions.Item label="脚本">{domStats.scripts}</Descriptions.Item>
                    <Descriptions.Item label="iframe">{domStats.iframes}</Descriptions.Item>
                  </Descriptions>
                  <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>Top 10 标签分布</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {Object.entries(domStats.tagCounts).map(([tag, count]) => (
                      <Tag key={tag} style={{ fontSize: 10 }}>{`<${tag}> ${count}`}</Tag>
                    ))}
                  </div>
                </>
              )}
            </Space>
          ),
        },
      ]}
    />
  );
};

export default WebActions;
