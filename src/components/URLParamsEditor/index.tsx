import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Space,
  Modal,
  Popconfirm,
  message as antdMessage,
  Typography,
  Tag,
} from 'antd';
import {
  ReloadOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  CloseOutlined,
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
} from '../../utils/presetParams';

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
    const [key, value = ''] = param.split('=');
    if (key) {
      try { paramsArray.push({ key: decodeURIComponent(key), value: decodeURIComponent(value) }); }
      catch { paramsArray.push({ key, value }); }
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
    } catch (error: any) { antdMessage.error(error.message || '保存失败'); }
  };

  const handleDeletePreset = (index: number) => {
    try {
      deletePresetParam(index);
      setPresetParams(getPresetParams());
      antdMessage.success('预设已删除');
      if (editingPreset && editingPreset.index === index) cancelEdit();
    } catch (error: any) { antdMessage.error(error.message || '删除失败'); }
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
