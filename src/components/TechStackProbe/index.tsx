import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Collapse, Empty, Space, Switch, Tag, Typography, message as antdMessage } from 'antd';
import { collectTechStack, type DetectedItem, type TechStackResult } from './techstack-scanner';
import './index.css';

type Confidence = 'high' | 'medium' | 'low';

const { Text, Paragraph, Title } = Typography;
const { Panel } = Collapse;

const confidenceLabel: Record<Confidence, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const confidenceColor: Record<Confidence, string> = {
  high: 'green',
  medium: 'gold',
  low: 'default',
};


const TechStackProbe: React.FC = () => {
  const [result, setResult] = useState<TechStackResult | null>(null);
  const [source, setSource] = useState<'current' | 'activeTab' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(true);
  const [showRaw, setShowRaw] = useState(true);
  const [activeTabTitle, setActiveTabTitle] = useState<string>('');
  const [activeTabUrl, setActiveTabUrl] = useState<string>('');

  const canUseChrome = useMemo(() => typeof chrome !== 'undefined' && !!chrome.tabs && !!chrome.scripting, []);

  const loadActiveTabInfo = useCallback(async () => {
    if (!canUseChrome) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) return;
      setActiveTabTitle(tab.title || '');
      setActiveTabUrl(tab.url || '');
    });
  }, [canUseChrome]);

  const detectCurrentPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await collectTechStack();
      setResult(data);
      setSource('current');
    } catch (err) {
      setError((err as Error).message || '探测失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const detectActiveTab = useCallback(async () => {
    if (!canUseChrome) {
      antdMessage.warning('当前环境不支持读取标签页');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (resultTabs) => resolve(resultTabs));
      });
      const tab = tabs[0];
      if (!tab?.id) {
        throw new Error('无法获取当前标签页');
      }
      const injected = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: collectTechStack,
      });
      const data = injected?.[0]?.result as TechStackResult | undefined;
      if (!data) {
        throw new Error('探测结果为空');
      }
      setResult(data);
      setSource('activeTab');
      setActiveTabTitle(tab.title || '');
      setActiveTabUrl(tab.url || '');
    } catch (err) {
      setError((err as Error).message || '探测失败');
    } finally {
      setLoading(false);
    }
  }, [canUseChrome]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify({ source, result }, null, 2));
      antdMessage.success('已复制结果');
    } catch (err) {
      antdMessage.error('复制失败');
    }
  }, [result, source]);

  useEffect(() => {
    if (canUseChrome) {
      detectActiveTab();
      loadActiveTabInfo();
    } else {
      detectCurrentPage();
    }
  }, [canUseChrome, detectActiveTab, detectCurrentPage, loadActiveTabInfo]);

  const renderDetectedList = useCallback((items: DetectedItem[]) => {
    if (!items.length) {
      return <Empty description="未发现明显特征" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }
    return (
      <div className="techstack-list">
        {items.map((item) => (
          <div className="techstack-item" key={`${item.category}-${item.name}`}>
            <div className="techstack-item-header">
              <Space size={6} wrap>
                <Text strong>{item.name}</Text>
                <Tag color={confidenceColor[item.confidence]}>{confidenceLabel[item.confidence]}</Tag>
                {item.version && <Tag>{item.version}</Tag>}
              </Space>
            </div>
            {showEvidence && item.evidence.length > 0 && (
              <div className="techstack-evidence">
                证据：{item.evidence.slice(0, 6).join('；')}
                {item.evidence.length > 6 ? '…' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }, [showEvidence]);

  const compactMeta = useMemo(() => result?.meta.slice(0, 30) || [], [result]);
  const compactScripts = useMemo(() => result?.scripts.slice(0, 30) || [], [result]);
  const compactStyles = useMemo(() => result?.stylesheets.slice(0, 30) || [], [result]);
  const compactResources = useMemo(() => result?.resources.slice(0, 30) || [], [result]);

  return (
    <div className="feature-content techstack-container">
      <div className="techstack-header">
        <div>
          <Title level={5}>技术栈深度探测</Title>
          <Paragraph type="secondary">
            尝试从 DOM、资源加载、全局变量与运行时信息中尽可能还原前端技术栈。
          </Paragraph>
        </div>
        <Space size={8} wrap>
          {canUseChrome && (
            <Button onClick={detectActiveTab} loading={loading}>
              探测当前标签页
            </Button>
          )}
          <Button onClick={detectCurrentPage} loading={loading}>
            探测本页
          </Button>
          <Button onClick={handleCopy} disabled={!result}>
            复制结果
          </Button>
        </Space>
      </div>

      <div className="techstack-toolbar">
        <Space size={12} wrap>
          <span>
            显示证据
            <Switch checked={showEvidence} onChange={setShowEvidence} size="small" />
          </span>
          <span>
            显示原始数据
            <Switch checked={showRaw} onChange={setShowRaw} size="small" />
          </span>
        </Space>
      </div>

      {error && (
        <Card className="techstack-card" size="small">
          <Text type="danger">{error}</Text>
        </Card>
      )}

      {result ? (
        <div className="techstack-content">
          <Card className="techstack-card" size="small">
            <Space direction="vertical" size={4}>
              <Text strong>探测目标</Text>
              <Text>来源：{source === 'activeTab' ? '当前标签页' : '本页'}</Text>
              {source === 'activeTab' && (
                <Text type="secondary">
                  {activeTabTitle || result.target.title || '未命名标签页'} {activeTabUrl || result.target.url}
                </Text>
              )}
              <Text type="secondary">{result.target.url}</Text>
              <Text type="secondary">时间：{new Date(result.timestamp).toLocaleString()}</Text>
            </Space>
          </Card>

          <Card className="techstack-card" size="small" title="基础环境信息">
            <div className="techstack-grid">
              <div>
                <Text type="secondary">User Agent</Text>
                <div className="techstack-mono">{result.env.userAgent}</div>
              </div>
              <div>
                <Text type="secondary">语言</Text>
                <div>{result.env.language} {result.env.languages?.length ? `(${result.env.languages.join(', ')})` : ''}</div>
              </div>
              <div>
                <Text type="secondary">平台</Text>
                <div>{result.env.platform || '未知'}</div>
              </div>
              <div>
                <Text type="secondary">时区</Text>
                <div>{result.env.timezone || '未知'}</div>
              </div>
              <div>
                <Text type="secondary">设备并发</Text>
                <div>{result.env.hardwareConcurrency || '未知'}</div>
              </div>
              <div>
                <Text type="secondary">内存</Text>
                <div>{result.env.deviceMemory ? `${result.env.deviceMemory} GB` : '未知'}</div>
              </div>
              <div>
                <Text type="secondary">颜色模式</Text>
                <div>{result.env.colorScheme || '未知'}</div>
              </div>
              <div>
                <Text type="secondary">Reduce Motion</Text>
                <div>{result.env.prefersReducedMotion ? '是' : '否'}</div>
              </div>
            </div>
          </Card>

          <Card className="techstack-card" size="small" title="技术栈推测">
            <div className="techstack-section">
              <Text strong>框架</Text>
              {renderDetectedList(result.frameworks)}
            </div>
            <div className="techstack-section">
              <Text strong>构建工具</Text>
              {renderDetectedList(result.buildTools)}
            </div>
            <div className="techstack-section">
              <Text strong>UI 库</Text>
              {renderDetectedList(result.uiLibraries)}
            </div>
            <div className="techstack-section">
              <Text strong>状态管理</Text>
              {renderDetectedList(result.stateManagement)}
            </div>
            <div className="techstack-section">
              <Text strong>路由</Text>
              {renderDetectedList(result.routers)}
            </div>
            <div className="techstack-section">
              <Text strong>部署环境</Text>
              {renderDetectedList(result.deployment)}
            </div>
          </Card>

          <Card className="techstack-card" size="small" title="依赖包 / CDN">
            {result.dependencies.length ? (
              <div className="techstack-list">
                {result.dependencies.slice(0, 20).map((dep) => (
                  <div className="techstack-item" key={`${dep.source}-${dep.name}-${dep.version || 'unknown'}`}>
                    <Space size={6} wrap>
                      <Text strong>{dep.name}</Text>
                      <Tag>{dep.source}</Tag>
                      {dep.version && <Tag>{dep.version}</Tag>}
                    </Space>
                    {showEvidence && <div className="techstack-evidence">{dep.url}</div>}
                  </div>
                ))}
                {result.dependencies.length > 20 && (
                  <Text type="secondary">已省略 {result.dependencies.length - 20} 条依赖信息</Text>
                )}
              </div>
            ) : (
              <Empty description="未发现明显的 CDN 依赖" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          <Card className="techstack-card" size="small" title="额外线索">
            <Space size={6} wrap>
              {result.hints.length ? result.hints.map((hint) => <Tag key={hint}>{hint}</Tag>) : <Text type="secondary">暂无</Text>}
            </Space>
          </Card>

          {showRaw && (
            <Collapse className="techstack-collapse">
              <Panel header={`Meta（${result.meta.length}）`} key="meta">
                <div className="techstack-mono">
                  {compactMeta.map((meta, index) => (
                    <div key={`${meta.name || meta.property || index}`}>
                      {meta.name || meta.property}: {meta.content}
                    </div>
                  ))}
                  {result.meta.length > compactMeta.length && <div>...（已省略）</div>}
                </div>
              </Panel>
              <Panel header={`Scripts（${result.scripts.length}）`} key="scripts">
                <div className="techstack-mono">
                  {compactScripts.map((script) => (
                    <div key={script}>{script}</div>
                  ))}
                  {result.scripts.length > compactScripts.length && <div>...（已省略）</div>}
                </div>
              </Panel>
              <Panel header={`Stylesheets（${result.stylesheets.length}）`} key="styles">
                <div className="techstack-mono">
                  {compactStyles.map((style) => (
                    <div key={style}>{style}</div>
                  ))}
                  {result.stylesheets.length > compactStyles.length && <div>...（已省略）</div>}
                </div>
              </Panel>
              <Panel header={`Resources（${result.resources.length}）`} key="resources">
                <div className="techstack-mono">
                  {compactResources.map((resource) => (
                    <div key={resource.name}>
                      [{resource.initiatorType}] {resource.name}
                    </div>
                  ))}
                  {result.resources.length > compactResources.length && <div>...（已省略）</div>}
                </div>
              </Panel>
              <Panel header="Storage / Cookies" key="storage">
                <div className="techstack-mono">
                  <div>localStorage keys: {result.storage.localStorageKeys.join(', ') || '无'}</div>
                  <div>sessionStorage keys: {result.storage.sessionStorageKeys.join(', ') || '无'}</div>
                  <div>cookies: {result.storage.cookieKeys.join(', ') || '无'}</div>
                </div>
              </Panel>
              <Panel header="Globals" key="globals">
                <div className="techstack-mono">
                  {result.globals.slice(0, 80).map((key) => (
                    <div key={key}>{key}</div>
                  ))}
                  {result.globals.length > 80 && <div>...（已省略）</div>}
                </div>
              </Panel>
            </Collapse>
          )}
        </div>
      ) : (
        <Card className="techstack-card" size="small">
          <Empty description="尚未完成探测" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      )}
    </div>
  );
};

export default TechStackProbe;
