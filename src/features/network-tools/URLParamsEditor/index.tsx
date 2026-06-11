import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Space,
  Modal,
  Popconfirm,
  Collapse,
  Select,
  message as antdMessage,
  Typography,
  Tag,
  Tabs,
} from 'antd';
const { TextArea } = Input;
import {
  ReloadOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  CloseOutlined,
  LinkOutlined,
  SwapOutlined,
  AimOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import './index.css';

const { Text } = Typography;
import {
  getPresetParams,
  addPresetParam,
  updatePresetParam,
  deletePresetParam,
  resetPresetParams,
  type PresetParam,
} from '../../../utils/presetParams';

interface URLParam { key: string; value: string; }
type ParamWriteMode = 'leading' | 'fragment' | 'both';

const splitHashBaseAndFragmentQuery = (hash: string): { hashBase: string; fragQS: string } => {
  if (!hash) return { hashBase: '', fragQS: '' };
  const q = hash.indexOf('?');
  if (q === -1) return { hashBase: hash, fragQS: '' };
  return { hashBase: hash.slice(0, q), fragQS: hash.slice(q + 1) };
};

const parseQueryStringToParams = (queryString: string): URLParam[] => {
  const paramsArray: URLParam[] = [];
  if (!queryString) return paramsArray;
  queryString.split('&').forEach((param) => {
    const eqIdx = param.indexOf('=');
    const key = eqIdx >= 0 ? param.slice(0, eqIdx) : param;
    const rawValue = eqIdx >= 0 ? param.slice(eqIdx + 1) : '';
    if (key) {
      try { paramsArray.push({ key: decodeURIComponent(key), value: decodeURIComponent(rawValue) }); }
      catch { paramsArray.push({ key, value: rawValue }); }
    }
  });
  return paramsArray;
};

const resolveParamWriteMode = (leadingSearchHadParams: boolean, fragmentSearchHadParams: boolean, hashBase: string): ParamWriteMode => {
  if (leadingSearchHadParams && fragmentSearchHadParams) return 'both';
  if (leadingSearchHadParams) return 'leading';
  if (fragmentSearchHadParams) return 'fragment';
  if (hashBase && /^#\//.test(hashBase)) return 'fragment';
  return 'leading';
};

/* ─── UTM 参数来源选项 ─── */
const UTM_SOURCES = ['google', 'facebook', 'twitter', 'instagram', 'linkedin', 'email', 'newsletter', 'wechat', 'weibo', 'tiktok'];
const UTM_MEDIUMS = ['cpc', 'organic', 'social', 'email', 'referral', 'display', 'affiliate', 'banner', 'video'];

/* ─── 深链 Scheme 解析 ─── */
const KNOWN_SCHEMES: Record<string, string> = {
  'http': 'HTTP 网页链接',
  'https': 'HTTPS 安全网页链接',
  'weixin': '微信',
  'alipays': '支付宝',
  'tbopen': '淘宝',
  'snssdk1128': '抖音',
  'bilibili': '哔哩哔哩',
  'mqq': 'QQ',
  'dingtalk': '钉钉',
  'sinaweibo': '新浪微博',
  'tel': '电话',
  'mailto': '邮件',
  'sms': '短信',
  'geo': '地理位置',
  'intent': 'Android Intent',
  'market': 'Google Play',
  'itms-apps': 'App Store',
  'data': 'Data URI',
  'javascript': 'JavaScript',
  'ftp': 'FTP 文件传输',
};

const parseDeepLink = (url: string): { scheme: string; schemeName: string; host: string; path: string; params: Array<{ key: string; value: string }>; fragment: string; raw: string } => {
  const result = { scheme: '', schemeName: '', host: '', path: '', params: [] as Array<{ key: string; value: string }>, fragment: '', raw: url };

  try {
    const schemeMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+\-.]*):\/?\/?/);
    if (schemeMatch) {
      result.scheme = schemeMatch[1].toLowerCase();
      result.schemeName = KNOWN_SCHEMES[result.scheme] || `未知协议 (${result.scheme})`;
    }

    // 尝试用 URL 解析
    try {
      const parsed = new URL(url);
      result.host = parsed.host;
      result.path = parsed.pathname;
      result.fragment = parsed.hash ? parsed.hash.slice(1) : '';
      parsed.searchParams.forEach((value, key) => {
        result.params.push({ key, value });
      });
    } catch {
      // 非标准 URL，手动解析
      const afterScheme = url.replace(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/?\/?/, '');
      const hashIdx = afterScheme.indexOf('#');
      const beforeHash = hashIdx >= 0 ? afterScheme.slice(0, hashIdx) : afterScheme;
      result.fragment = hashIdx >= 0 ? afterScheme.slice(hashIdx + 1) : '';

      const queryIdx = beforeHash.indexOf('?');
      const beforeQuery = queryIdx >= 0 ? beforeHash.slice(0, queryIdx) : beforeHash;
      const queryString = queryIdx >= 0 ? beforeHash.slice(queryIdx + 1) : '';

      const slashIdx = beforeQuery.indexOf('/');
      result.host = slashIdx >= 0 ? beforeQuery.slice(0, slashIdx) : beforeQuery;
      result.path = slashIdx >= 0 ? beforeQuery.slice(slashIdx) : '/';

      if (queryString) {
        queryString.split('&').forEach((pair) => {
          const eqIdx = pair.indexOf('=');
          const key = eqIdx >= 0 ? pair.slice(0, eqIdx) : pair;
          const value = eqIdx >= 0 ? pair.slice(eqIdx + 1) : '';
          try { result.params.push({ key: decodeURIComponent(key), value: decodeURIComponent(value) }); }
          catch { result.params.push({ key, value }); }
        });
      }
    }
  } catch { /* parse failed, return empty */ }

  return result;
};

/* ─── URL Diff 工具 ─── */
const diffUrls = (urlA: string, urlB: string): { onlyInA: Array<{ key: string; value: string }>; onlyInB: Array<{ key: string; value: string }>; changed: Array<{ key: string; valueA: string; valueB: string }>; same: Array<{ key: string; value: string }>; baseA: string; baseB: string; baseDifferent: boolean } => {
  const parseParams = (url: string): { base: string; params: Map<string, string> } => {
    try {
      const parsed = new URL(url);
      const base = `${parsed.origin}${parsed.pathname}`;
      const params = new Map<string, string>();
      parsed.searchParams.forEach((value, key) => params.set(key, value));
      return { base, params };
    } catch {
      const qIdx = url.indexOf('?');
      const base = qIdx >= 0 ? url.slice(0, qIdx) : url;
      const qs = qIdx >= 0 ? url.slice(qIdx + 1) : '';
      const params = new Map<string, string>();
      if (qs) qs.split('&').forEach((pair) => { const [k, ...v] = pair.split('='); if (k) params.set(decodeURIComponent(k), decodeURIComponent(v.join('='))); });
      return { base, params };
    }
  };

  const a = parseParams(urlA);
  const b = parseParams(urlB);
  const allKeys = new Set([...a.params.keys(), ...b.params.keys()]);

  const onlyInA: Array<{ key: string; value: string }> = [];
  const onlyInB: Array<{ key: string; value: string }> = [];
  const changed: Array<{ key: string; valueA: string; valueB: string }> = [];
  const same: Array<{ key: string; value: string }> = [];

  allKeys.forEach((key) => {
    const inA = a.params.has(key);
    const inB = b.params.has(key);
    if (inA && !inB) onlyInA.push({ key, value: a.params.get(key)! });
    else if (!inA && inB) onlyInB.push({ key, value: b.params.get(key)! });
    else if (a.params.get(key) !== b.params.get(key)) changed.push({ key, valueA: a.params.get(key)!, valueB: b.params.get(key)! });
    else same.push({ key, value: a.params.get(key)! });
  });

  return { onlyInA, onlyInB, changed, same, baseA: a.base, baseB: b.base, baseDifferent: a.base !== b.base };
};

/* ─── 扩展工具子组件 ─── */
const URLExtendedTools: React.FC<{ currentUrl: string; onApplyUrl: (url: string) => void }> = ({ currentUrl, onApplyUrl }) => {
  // UTM 状态
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // URL Diff 状态
  const [diffUrlA, setDiffUrlA] = useState('');
  const [diffUrlB, setDiffUrlB] = useState('');
  const [diffResult, setDiffResult] = useState<ReturnType<typeof diffUrls> | null>(null);

  // 深链解析状态
  const [deepLinkInput, setDeepLinkInput] = useState('');
  const [deepLinkResult, setDeepLinkResult] = useState<ReturnType<typeof parseDeepLink> | null>(null);

  // URL 编解码状态
  const [urlCodecInput, setUrlCodecInput] = useState('');
  const [urlCodecOutput, setUrlCodecOutput] = useState('');

  const generateUtmUrl = () => {
    if (!currentUrl.trim()) { antdMessage.warning('请先在上方输入基础 URL'); return; }
    if (!utmSource.trim()) { antdMessage.warning('utm_source 为必填项'); return; }
    try {
      const urlObj = new URL(currentUrl);
      if (utmSource.trim()) urlObj.searchParams.set('utm_source', utmSource.trim());
      if (utmMedium.trim()) urlObj.searchParams.set('utm_medium', utmMedium.trim());
      if (utmCampaign.trim()) urlObj.searchParams.set('utm_campaign', utmCampaign.trim());
      if (utmTerm.trim()) urlObj.searchParams.set('utm_term', utmTerm.trim());
      if (utmContent.trim()) urlObj.searchParams.set('utm_content', utmContent.trim());
      onApplyUrl(urlObj.toString());
      antdMessage.success('UTM 参数已应用到 URL');
    } catch {
      antdMessage.error('当前 URL 格式无效，无法添加 UTM 参数');
    }
  };

  const runDiff = () => {
    if (!diffUrlA.trim() || !diffUrlB.trim()) { antdMessage.warning('请输入两个 URL'); return; }
    setDiffResult(diffUrls(diffUrlA.trim(), diffUrlB.trim()));
  };

  const runDeepLinkParse = () => {
    if (!deepLinkInput.trim()) { antdMessage.warning('请输入链接'); return; }
    setDeepLinkResult(parseDeepLink(deepLinkInput.trim()));
  };

  const urlEncode = () => {
    if (!urlCodecInput) { antdMessage.warning('请输入内容'); return; }
    setUrlCodecOutput(encodeURIComponent(urlCodecInput));
  };

  const urlDecode = () => {
    if (!urlCodecInput) { antdMessage.warning('请输入内容'); return; }
    try {
      setUrlCodecOutput(decodeURIComponent(urlCodecInput.replace(/\+/g, ' ')));
    } catch {
      antdMessage.error('解码失败，输入可能不是有效的 URL 编码字符串');
    }
  };

  const urlCodecTab = (
    <Space direction="vertical" style={{ width: '100%' }} size={4}>
      <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>对 URL 中的特殊字符进行 encodeURIComponent / decodeURIComponent 转换</Text>
      <TextArea
        value={urlCodecInput}
        onChange={(e) => setUrlCodecInput(e.target.value)}
        placeholder="输入要编码或解码的文本..."
        autoSize={{ minRows: 2, maxRows: 4 }}
        style={{ fontSize: 11 }}
      />
      <Space size={4}>
        <Button size="small" type="primary" onClick={urlEncode}>编码</Button>
        <Button size="small" onClick={urlDecode}>解码</Button>
        <Button size="small" onClick={() => { navigator.clipboard?.writeText(urlCodecOutput).then(() => antdMessage.success('已复制')); }} disabled={!urlCodecOutput}>复制结果</Button>
      </Space>
      {urlCodecOutput && (
        <div style={{ padding: 6, background: 'var(--theme-surfaceElevated)', borderRadius: 4, fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
          {urlCodecOutput}
        </div>
      )}
    </Space>
  );

  const utmTab = (
    <Space direction="vertical" style={{ width: '100%' }} size={4}>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>来源 *</Text>
          <Select
            value={utmSource || undefined}
            onChange={setUtmSource}
            placeholder="utm_source"
            size="small"
            style={{ width: '100%' }}
            showSearch
            allowClear
            options={UTM_SOURCES.map((s) => ({ value: s, label: s }))}
            onSearch={(val) => setUtmSource(val)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>媒介</Text>
          <Select
            value={utmMedium || undefined}
            onChange={setUtmMedium}
            placeholder="utm_medium"
            size="small"
            style={{ width: '100%' }}
            showSearch
            allowClear
            options={UTM_MEDIUMS.map((m) => ({ value: m, label: m }))}
            onSearch={(val) => setUtmMedium(val)}
          />
        </div>
      </div>
      <div>
        <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>活动名称</Text>
        <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="utm_campaign" size="small" />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>关键词</Text>
          <Input value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} placeholder="utm_term" size="small" />
        </div>
        <div style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>内容</Text>
          <Input value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="utm_content" size="small" />
        </div>
      </div>
      <Button type="primary" size="small" icon={<LinkOutlined />} onClick={generateUtmUrl} block>
        生成 UTM 链接
      </Button>
    </Space>
  );

  const diffTab = (
    <Space direction="vertical" style={{ width: '100%' }} size={4}>
      <div>
        <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>URL A</Text>
        <Input value={diffUrlA} onChange={(e) => setDiffUrlA(e.target.value)} placeholder="输入第一个 URL" size="small" />
      </div>
      <div>
        <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>URL B</Text>
        <Input value={diffUrlB} onChange={(e) => setDiffUrlB(e.target.value)} placeholder="输入第二个 URL" size="small" />
      </div>
      <Button type="primary" size="small" icon={<SwapOutlined />} onClick={runDiff} block>
        对比参数差异
      </Button>
      {diffResult && (
        <div className="upe-diff-result">
          {diffResult.baseDifferent && (
            <div className="upe-diff-section">
              <Tag color="orange">路径不同</Tag>
              <div style={{ fontSize: 10, marginTop: 2 }}>
                <div>A: <code>{diffResult.baseA}</code></div>
                <div>B: <code>{diffResult.baseB}</code></div>
              </div>
            </div>
          )}
          {diffResult.onlyInA.length > 0 && (
            <div className="upe-diff-section">
              <Tag color="red">仅在 A 中</Tag>
              {diffResult.onlyInA.map((p, i) => <div key={i} style={{ fontSize: 10 }}><code>{p.key}={p.value}</code></div>)}
            </div>
          )}
          {diffResult.onlyInB.length > 0 && (
            <div className="upe-diff-section">
              <Tag color="green">仅在 B 中</Tag>
              {diffResult.onlyInB.map((p, i) => <div key={i} style={{ fontSize: 10 }}><code>{p.key}={p.value}</code></div>)}
            </div>
          )}
          {diffResult.changed.length > 0 && (
            <div className="upe-diff-section">
              <Tag color="blue">值不同</Tag>
              {diffResult.changed.map((p, i) => (
                <div key={i} style={{ fontSize: 10 }}>
                  <code>{p.key}</code>: <span style={{ color: 'var(--theme-error)' }}>{p.valueA}</span> → <span style={{ color: 'var(--theme-success, #52c41a)' }}>{p.valueB}</span>
                </div>
              ))}
            </div>
          )}
          {diffResult.same.length > 0 && (
            <div className="upe-diff-section">
              <Tag>相同 ({diffResult.same.length})</Tag>
              {diffResult.same.map((p, i) => <div key={i} style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}><code>{p.key}={p.value}</code></div>)}
            </div>
          )}
          {diffResult.onlyInA.length === 0 && diffResult.onlyInB.length === 0 && diffResult.changed.length === 0 && !diffResult.baseDifferent && (
            <Text type="success" style={{ fontSize: 11 }}>✅ 两个 URL 完全相同</Text>
          )}
        </div>
      )}
    </Space>
  );

  const deepLinkTab = (
    <Space direction="vertical" style={{ width: '100%' }} size={4}>
      <Input
        value={deepLinkInput}
        onChange={(e) => setDeepLinkInput(e.target.value)}
        placeholder="输入深链，如 weixin://dl/business/?appid=xxx"
        size="small"
        onPressEnter={runDeepLinkParse}
      />
      <Button type="primary" size="small" icon={<AimOutlined />} onClick={runDeepLinkParse} block>
        解析链接
      </Button>
      {deepLinkResult && (
        <div className="upe-deeplink-result">
          <div className="upe-dl-row"><Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>协议</Text><Tag color="blue">{deepLinkResult.scheme}</Tag><Text style={{ fontSize: 11 }}>{deepLinkResult.schemeName}</Text></div>
          {deepLinkResult.host && <div className="upe-dl-row"><Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>主机</Text><code style={{ fontSize: 11 }}>{deepLinkResult.host}</code></div>}
          {deepLinkResult.path && deepLinkResult.path !== '/' && <div className="upe-dl-row"><Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>路径</Text><code style={{ fontSize: 11 }}>{deepLinkResult.path}</code></div>}
          {deepLinkResult.params.length > 0 && (
            <div className="upe-dl-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>参数 ({deepLinkResult.params.length})</Text>
              {deepLinkResult.params.map((p, i) => (
                <div key={i} style={{ fontSize: 10, paddingLeft: 8 }}>
                  <code>{p.key}</code> = <span style={{ color: 'var(--theme-primary)' }}>{p.value}</span>
                </div>
              ))}
            </div>
          )}
          {deepLinkResult.fragment && <div className="upe-dl-row"><Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>Fragment</Text><code style={{ fontSize: 11 }}>{deepLinkResult.fragment}</code></div>}
        </div>
      )}
    </Space>
  );

  return (
    <Collapse
      size="small"
      items={[{
        key: 'extended',
        label: <Space size={4}><ToolOutlined /><span style={{ fontSize: 12 }}>扩展工具</span></Space>,
        children: (
          <Tabs
            size="small"
            items={[
              { key: 'urlcodec', label: 'URL 编解码', children: urlCodecTab },
              { key: 'utm', label: 'UTM 生成', children: utmTab },
              { key: 'diff', label: 'URL Diff', children: diffTab },
              { key: 'deeplink', label: '深链解析', children: deepLinkTab },
            ]}
            style={{ marginTop: -8 }}
          />
        ),
      }]}
    />
  );
};

const URLParamsEditor: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [hashBase, setHashBase] = useState<string>('');
  const [paramWriteMode, setParamWriteMode] = useState<ParamWriteMode>('leading');
  const [params, setParams] = useState<URLParam[]>([]);
  const [error, setError] = useState<string>('');
  const [presetParams, setPresetParams] = useState<PresetParam[]>([]);
  const [showPresetManager, setShowPresetManager] = useState<boolean>(false);
  const [editingPreset, setEditingPreset] = useState<{ index: number; preset: PresetParam } | null>(null);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetParams, setNewPresetParams] = useState<URLParam[]>([]);

  useEffect(() => { setPresetParams(getPresetParams()); }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url) parseURL(tabs[0].url);
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const parseURL = (url: string) => {
    try {
      setError('');
      setCurrentUrl(url);
      let isExtensionPage = false;
      try { isExtensionPage = new URL(url).protocol.toLowerCase().endsWith('-extension:'); } catch { /* ignore */ }
      if (url.startsWith('chrome://') || url.startsWith('about:') || isExtensionPage) {
        setError('当前页面不支持URL参数编辑（内置页或扩展页）');
        setBaseUrl(url); setHashBase(''); setParamWriteMode('leading');
        setParams([{ key: '', value: '' }]);
        return;
      }
      if (typeof URL === 'undefined') {
        const hashIdx = url.indexOf('#');
        const beforeHash = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
        const hashFull = hashIdx >= 0 ? url.slice(hashIdx) : '';
        const { hashBase: hb, fragQS } = splitHashBaseAndFragmentQuery(hashFull);
        const qIdx = beforeHash.indexOf('?');
        const pathOnly = qIdx >= 0 ? beforeHash.slice(0, qIdx) : beforeHash;
        const mainQS = qIdx >= 0 ? beforeHash.slice(qIdx + 1) : '';
        const mode = resolveParamWriteMode(Boolean(mainQS), Boolean(fragQS), hb);
        setBaseUrl(pathOnly); setHashBase(hb); setParamWriteMode(mode);
        let paramsArray = [...parseQueryStringToParams(mainQS), ...parseQueryStringToParams(fragQS)];
        if (paramsArray.length === 0) paramsArray = [{ key: '', value: '' }];
        setParams(paramsArray);
        return;
      }
      const urlObj = new URL(url);
      setBaseUrl(`${urlObj.origin}${urlObj.pathname}`);
      const mainQS = urlObj.search.startsWith('?') ? urlObj.search.slice(1) : '';
      const { hashBase: hb, fragQS } = splitHashBaseAndFragmentQuery(urlObj.hash);
      const mode = resolveParamWriteMode(Boolean(mainQS), Boolean(fragQS), hb);
      setHashBase(hb); setParamWriteMode(mode);
      let paramsArray = [...parseQueryStringToParams(mainQS), ...parseQueryStringToParams(fragQS)];
      if (paramsArray.length === 0) paramsArray = [{ key: '', value: '' }];
      setParams(paramsArray);
    } catch (err) {
      setError('无法解析URL，请确保是有效的HTTP/HTTPS地址');
      setBaseUrl(url.split('?')[0].split('#')[0] || url);
      setHashBase(''); setParamWriteMode('leading');
      setParams([{ key: '', value: '' }]);
    }
  };

  const updateParam = (index: number, field: 'key' | 'value', newValue: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: newValue };
    setParams(newParams);
  };

  const addParam = () => setParams([...params, { key: '', value: '' }]);

  const removeParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    if (newParams.length === 0) newParams.push({ key: '', value: '' });
    setParams(newParams);
  };

  const buildUrlFromParts = (pathPart: string, hb: string, mode: ParamWriteMode, paramList: URLParam[]): string => {
    const urlParams = new URLSearchParams();
    paramList.forEach((param) => { if (param.key.trim()) urlParams.append(param.key.trim(), param.value); });
    const queryString = urlParams.toString();
    if (mode === 'fragment') return queryString ? `${pathPart}${hb}?${queryString}` : `${pathPart}${hb}`;
    return queryString ? `${pathPart}?${queryString}${hb}` : `${pathPart}${hb}`;
  };

  const generateNewURL = (): string => buildUrlFromParts(baseUrl, hashBase, paramWriteMode, params);

  const updateCurrentTabURL = () => {
    try {
      const newURL = generateNewURL();
      new URL(newURL);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) { chrome.tabs.update(tabs[0].id, { url: newURL }); setCurrentUrl(newURL); setError(''); }
      });
    } catch { setError('无效的URL，请检查基础URL格式'); }
  };

  const openInNewTab = () => {
    try { const newURL = generateNewURL(); new URL(newURL); chrome.tabs.create({ url: newURL }); setError(''); }
    catch { setError('无效的URL，请检查基础URL格式'); }
  };

  const copyNewURL = () => {
    navigator.clipboard.writeText(generateNewURL());
    antdMessage.success('URL已复制到剪贴板');
  };

  const refreshURL = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) parseURL(tabs[0].url);
    });
  };

  const openPresetManager = () => { setShowPresetManager(true); setEditingPreset(null); setNewPresetName(''); setNewPresetParams([{ key: '', value: '' }]); };
  const closePresetManager = () => { setShowPresetManager(false); setEditingPreset(null); setNewPresetName(''); setNewPresetParams([{ key: '', value: '' }]); };

  const startEditPreset = (index: number) => {
    const preset = presetParams[index];
    setEditingPreset({ index, preset: { ...preset } });
    setNewPresetName(preset.name);
    setNewPresetParams(preset.params.length > 0 ? [...preset.params] : [{ key: '', value: '' }]);
  };

  const cancelEdit = () => { setEditingPreset(null); setNewPresetName(''); setNewPresetParams([{ key: '', value: '' }]); };

  const savePreset = () => {
    if (!newPresetName.trim()) { antdMessage.warning('请输入预设名称'); return; }
    const validParams = newPresetParams.filter((p) => p.key.trim() && p.value.trim());
    if (validParams.length === 0) { antdMessage.warning('请至少添加一个有效的参数'); return; }
    try {
      if (editingPreset && editingPreset.index >= 0) {
        updatePresetParam(editingPreset.index, { name: newPresetName.trim(), params: validParams });
        antdMessage.success('预设已更新');
      } else {
        addPresetParam({ name: newPresetName.trim(), params: validParams });
        antdMessage.success('预设已添加');
      }
      setPresetParams(getPresetParams());
      cancelEdit();
    } catch (error) { antdMessage.error(error instanceof Error ? error.message : '保存失败'); }
  };

  const handleDeletePreset = (index: number) => {
    try {
      deletePresetParam(index);
      setPresetParams(getPresetParams());
      antdMessage.success('预设已删除');
      if (editingPreset && editingPreset.index === index) cancelEdit();
    } catch (error) { antdMessage.error(error instanceof Error ? error.message : '删除失败'); }
  };

  const handleResetPresets = () => { resetPresetParams(); setPresetParams(getPresetParams()); antdMessage.success('已重置为默认预设'); cancelEdit(); };

  const updateNewPresetParam = (index: number, field: 'key' | 'value', newValue: string) => {
    const newParams = [...newPresetParams];
    newParams[index] = { ...newParams[index], [field]: newValue };
    setNewPresetParams(newParams);
  };

  const addNewPresetParam = () => setNewPresetParams([...newPresetParams, { key: '', value: '' }]);

  const removeNewPresetParam = (index: number) => {
    const newParams = newPresetParams.filter((_, i) => i !== index);
    if (newParams.length === 0) newParams.push({ key: '', value: '' });
    setNewPresetParams(newParams);
  };

  const addPresetParams = (preset: (typeof presetParams)[0]) => {
    const existingParams: string[] = [];
    preset.params.forEach((presetParam) => {
      if (params.findIndex((p) => p.key === presetParam.key) >= 0) existingParams.push(presetParam.key);
    });
    if (existingParams.length > 0) { antdMessage.warning(`参数 ${existingParams.join('、')} 已存在，无需重复添加`); return; }
    const newParams = [...params];
    preset.params.forEach((presetParam) => {
      if (newParams.length > 0 && !newParams[newParams.length - 1].key.trim()) {
        newParams[newParams.length - 1] = { ...presetParam };
      } else {
        newParams.push({ ...presetParam });
      }
    });
    setParams(newParams);
    const newURL = buildUrlFromParts(baseUrl, hashBase, paramWriteMode, newParams);
    try {
      new URL(newURL);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) { chrome.tabs.update(tabs[0].id, { url: newURL }); setCurrentUrl(newURL); setError(''); }
      });
    } catch { /* ignore */ }
  };

  return (
    <div className="url-params-editor">
      {/* URL 输入行 */}
      <div className="upe-section">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onBlur={(e) => { if (e.target.value.trim()) parseURL(e.target.value); }}
            onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
            placeholder="输入或粘贴URL，按Enter或失焦时解析"
            size="small"
          />
          <Button icon={<ReloadOutlined />} onClick={refreshURL} size="small" title="刷新URL" />
        </Space.Compact>
        {baseUrl && (
          <div className="upe-base-url">
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="基础路径"
              size="small"
            />
            {hashBase && (
              <div className="upe-hash-hint">Hash: {hashBase}{paramWriteMode === 'fragment' ? '（查询在 hash 后）' : ''}</div>
            )}
          </div>
        )}
      </div>

      {/* 预设参数标签 */}
      {presetParams.length > 0 && (
        <div className="upe-presets">
          <div className="upe-presets-header">
            <span className="upe-section-label">预设参数</span>
            <Button size="small" icon={<SettingOutlined />} onClick={openPresetManager} type="text">管理</Button>
          </div>
          <Space wrap size={4}>
            {presetParams.map((preset, index) => (
              <Tag
                key={index}
                onClick={() => addPresetParams(preset)}
                style={{ cursor: 'pointer', fontSize: 11 }}
                title={preset.params.map((p) => `${p.key}=${p.value}`).join(' & ')}
              >
                {preset.name}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* 参数列表 */}
      <div className="upe-params">
        <div className="upe-params-header">
          <span className="upe-section-label">URL 参数</span>
          <Button size="small" icon={<PlusOutlined />} onClick={addParam} type="text">添加</Button>
        </div>
        <div className="upe-params-list">
          {params.map((param, index) => (
            <Space.Compact key={index} style={{ width: '100%' }}>
              <Input
                value={param.key}
                onChange={(e) => updateParam(index, 'key', e.target.value)}
                placeholder="参数名"
                size="small"
                style={{ flex: 1 }}
              />
              <Input
                value={param.value}
                onChange={(e) => updateParam(index, 'value', e.target.value)}
                placeholder="参数值"
                size="small"
                style={{ flex: 1 }}
              />
              <Button icon={<CloseOutlined />} onClick={() => removeParam(index)} danger size="small" />
            </Space.Compact>
          ))}
        </div>
      </div>

      {error && <div className="upe-error">{error}</div>}

      {/* URL 预览 */}
      <div className="upe-preview">
        <div className="upe-preview-header">
          <span className="upe-section-label">新 URL</span>
          <Button size="small" icon={<CopyOutlined />} onClick={copyNewURL} type="text">复制</Button>
        </div>
        <div className="upe-preview-url">{generateNewURL() || '—'}</div>
      </div>

      {/* 操作按钮 */}
      <Space wrap>
        <Button type="primary" size="small" onClick={updateCurrentTabURL}>更新当前标签页</Button>
        <Button size="small" onClick={openInNewTab}>新标签页打开</Button>
      </Space>

      {/* 扩展工具 */}
      <URLExtendedTools currentUrl={generateNewURL()} onApplyUrl={(newUrl: string) => parseURL(newUrl)} />

      {/* 预设管理器弹窗 */}
      <Modal
        title={editingPreset ? '编辑预设' : '管理预设参数'}
        open={showPresetManager}
        onCancel={closePresetManager}
        footer={null}
        width={600}
        centered
        destroyOnClose
        maskClosable={false}
        getContainer={() => document.body}
      >
        {editingPreset ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>预设名称</Text>
              <Input value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} placeholder="输入预设名称" style={{ marginTop: 6 }} />
            </div>
            <div>
              <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text strong>参数列表</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={addNewPresetParam}>添加参数</Button>
              </Space>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {newPresetParams.map((param, index) => (
                  <Space.Compact key={index} style={{ width: '100%' }}>
                    <Input value={param.key} onChange={(e) => updateNewPresetParam(index, 'key', e.target.value)} placeholder="参数名" style={{ flex: 1 }} />
                    <Input value={param.value} onChange={(e) => updateNewPresetParam(index, 'value', e.target.value)} placeholder="参数值" style={{ flex: 1 }} />
                    <Button icon={<CloseOutlined />} onClick={() => removeNewPresetParam(index)} danger />
                  </Space.Compact>
                ))}
              </Space>
            </div>
            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button onClick={cancelEdit}>取消</Button>
              <Button type="primary" onClick={savePreset}>保存</Button>
            </Space>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button icon={<PlusOutlined />} onClick={() => setEditingPreset({ index: -1, preset: { name: '', params: [] } })}>添加预设</Button>
              <Popconfirm title="确定要重置为默认预设吗？这将删除所有自定义预设。" onConfirm={handleResetPresets} okText="确定" cancelText="取消">
                <Button danger>重置为默认</Button>
              </Popconfirm>
            </Space>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {presetParams.map((preset, index) => (
                <div key={index} style={{ padding: '8px 12px', background: 'var(--theme-surface)', border: '1px solid var(--theme-border)', borderRadius: 4 }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>{preset.name}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Space wrap>
                          {preset.params.map((p, i) => <Tag key={i}>{p.key}={p.value}</Tag>)}
                        </Space>
                      </div>
                    </div>
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => startEditPreset(index)}>编辑</Button>
                      <Popconfirm title={`确定要删除预设 "${preset.name}" 吗？`} onConfirm={() => handleDeletePreset(index)} okText="确定" cancelText="取消">
                        <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                      </Popconfirm>
                    </Space>
                  </Space>
                </div>
              ))}
            </Space>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default URLParamsEditor;
