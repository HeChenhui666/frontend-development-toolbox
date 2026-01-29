import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Space,
  Card,
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
import { showMessage } from '../../utils/message';

const { Text } = Typography;
import {
  getPresetParams,
  addPresetParam,
  updatePresetParam,
  deletePresetParam,
  resetPresetParams,
  type PresetParam,
} from '../../utils/presetParams';

interface URLParam {
  key: string;
  value: string;
}

const URLParamsEditor: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [params, setParams] = useState<URLParam[]>([]);
  const [error, setError] = useState<string>('');
  const [presetParams, setPresetParams] = useState<PresetParam[]>([]);
  const [showPresetManager, setShowPresetManager] = useState<boolean>(false);
  const [editingPreset, setEditingPreset] = useState<{ index: number; preset: PresetParam } | null>(null);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetParams, setNewPresetParams] = useState<URLParam[]>([]);

  // 加载预设参数
  useEffect(() => {
    setPresetParams(getPresetParams());
  }, []);

  // 获取当前标签页URL并解析参数
  useEffect(() => {
    // 延迟执行，避免阻塞初始渲染
    const timer = setTimeout(() => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url) {
            parseURL(tabs[0].url);
          }
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 解析URL（兼容性处理）
  const parseURL = (url: string) => {
    try {
      setError('');
      setCurrentUrl(url);

      // 处理chrome://等特殊协议
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
        setError('当前页面不支持URL参数编辑（chrome:// 或 about: 页面）');
        setBaseUrl(url);
        setParams([{ key: '', value: '' }]);
        return;
      }

      // 检查 URL API 支持
      if (typeof URL === 'undefined') {
        // 降级方案：手动解析
        const urlMatch = url.match(/^(https?:\/\/[^\/]+)(\/.*)?(\?.*)?$/);
        if (urlMatch) {
          setBaseUrl(urlMatch[1] + (urlMatch[2] || ''));
          const queryString = urlMatch[3] ? urlMatch[3].substring(1) : '';
          const paramsArray: URLParam[] = [];
          
          if (queryString) {
            queryString.split('&').forEach((param) => {
              const [key, value = ''] = param.split('=');
              if (key) {
                try {
                  paramsArray.push({
                    key: decodeURIComponent(key),
                    value: decodeURIComponent(value),
                  });
                } catch (e) {
                  paramsArray.push({ key, value });
                }
              }
            });
          }
          
          if (paramsArray.length === 0) {
            paramsArray.push({ key: '', value: '' });
          }
          setParams(paramsArray);
        } else {
          setBaseUrl(url.split('?')[0] || url);
          setParams([{ key: '', value: '' }]);
        }
        return;
      }

      const urlObj = new URL(url);
      setBaseUrl(`${urlObj.origin}${urlObj.pathname}`);

      // 检查 URLSearchParams API 支持
      if (typeof URLSearchParams === 'undefined') {
        // 降级方案：手动解析查询字符串
        const search = urlObj.search.substring(1);
        const paramsArray: URLParam[] = [];
        
        if (search) {
          search.split('&').forEach((param) => {
            const [key, value = ''] = param.split('=');
            if (key) {
              try {
                paramsArray.push({
                  key: decodeURIComponent(key),
                  value: decodeURIComponent(value),
                });
              } catch (e) {
                paramsArray.push({ key, value });
              }
            }
          });
        }
        
        if (paramsArray.length === 0) {
          paramsArray.push({ key: '', value: '' });
        }
        setParams(paramsArray);
        return;
      }

      const urlParams = new URLSearchParams(urlObj.search);
      const paramsArray: URLParam[] = [];

      urlParams.forEach((value, key) => {
        // 对参数名和参数值进行URL解码，将编码的字符转换为中文
        try {
          const decodedKey = decodeURIComponent(key);
          const decodedValue = decodeURIComponent(value);
          paramsArray.push({ key: decodedKey, value: decodedValue });
        } catch (e) {
          // 如果解码失败，使用原始值
          paramsArray.push({ key, value });
        }
      });

      // 如果没有参数，添加一个空行方便添加
      if (paramsArray.length === 0) {
        paramsArray.push({ key: '', value: '' });
      }

      setParams(paramsArray);
    } catch (err) {
      setError('无法解析URL，请确保是有效的HTTP/HTTPS地址');
      console.error(err);
      // 即使解析失败，也尝试显示原始URL
      setBaseUrl(url.split('?')[0] || url);
      setParams([{ key: '', value: '' }]);
    }
  };

  // 更新参数
  const updateParam = (index: number, field: 'key' | 'value', newValue: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: newValue };
    setParams(newParams);
  };

  // 添加新参数
  const addParam = () => {
    setParams([...params, { key: '', value: '' }]);
  };

  // 删除参数
  const removeParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    // 如果删除后没有参数了，添加一个空行方便添加
    if (newParams.length === 0) {
      newParams.push({ key: '', value: '' });
    }
    setParams(newParams);
  };

  // 生成新URL
  const generateNewURL = (): string => {
    const urlParams = new URLSearchParams();

    params.forEach((param) => {
      if (param.key.trim()) {
        urlParams.append(param.key.trim(), param.value);
      }
    });

    const queryString = urlParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // 更新当前标签页URL
  const updateCurrentTabURL = () => {
    try {
      const newURL = generateNewURL();
      // 验证URL是否有效
      new URL(newURL);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.update(tabs[0].id, { url: newURL });
          setCurrentUrl(newURL);
          setError('');
        }
      });
    } catch (err) {
      setError('无效的URL，请检查基础URL格式');
    }
  };

  // 在新标签页打开
  const openInNewTab = () => {
    try {
      const newURL = generateNewURL();
      // 验证URL是否有效
      new URL(newURL);
      chrome.tabs.create({ url: newURL });
      setError('');
    } catch (err) {
      setError('无效的URL，请检查基础URL格式');
    }
  };

  // 复制新URL
  const copyNewURL = () => {
    const newURL = generateNewURL();
    navigator.clipboard.writeText(newURL);
    antdMessage.success('URL已复制到剪贴板');
  };

  // 刷新当前URL
  const refreshURL = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        parseURL(tabs[0].url);
      }
    });
  };

  // 打开预设管理器
  const openPresetManager = () => {
    setShowPresetManager(true);
    setEditingPreset(null);
    setNewPresetName('');
    setNewPresetParams([{ key: '', value: '' }]);
  };

  // 关闭预设管理器
  const closePresetManager = () => {
    setShowPresetManager(false);
    setEditingPreset(null);
    setNewPresetName('');
    setNewPresetParams([{ key: '', value: '' }]);
  };

  // 开始编辑预设
  const startEditPreset = (index: number) => {
    const preset = presetParams[index];
    setEditingPreset({ index, preset: { ...preset } });
    setNewPresetName(preset.name);
    setNewPresetParams(
      preset.params.length > 0 ? [...preset.params] : [{ key: '', value: '' }]
    );
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingPreset(null);
    setNewPresetName('');
    setNewPresetParams([{ key: '', value: '' }]);
  };

  // 保存预设（新增或编辑）
  const savePreset = () => {
    if (!newPresetName.trim()) {
      antdMessage.warning('请输入预设名称');
      return;
    }

    const validParams = newPresetParams.filter((p) => p.key.trim() && p.value.trim());
    if (validParams.length === 0) {
      antdMessage.warning('请至少添加一个有效的参数');
      return;
    }

    try {
      if (editingPreset && editingPreset.index >= 0) {
        // 编辑现有预设
        updatePresetParam(editingPreset.index, {
          name: newPresetName.trim(),
          params: validParams,
        });
        antdMessage.success('预设已更新');
      } else {
        // 添加新预设
        addPresetParam({
          name: newPresetName.trim(),
          params: validParams,
        });
        antdMessage.success('预设已添加');
      }
      setPresetParams(getPresetParams());
      cancelEdit();
    } catch (error: any) {
      antdMessage.error(error.message || '保存失败');
    }
  };

  // 删除预设
  const handleDeletePreset = (index: number) => {
    try {
      deletePresetParam(index);
      setPresetParams(getPresetParams());
      antdMessage.success('预设已删除');
      if (editingPreset && editingPreset.index === index) {
        cancelEdit();
      }
    } catch (error: any) {
      antdMessage.error(error.message || '删除失败');
    }
  };

  // 重置预设
  const handleResetPresets = () => {
    resetPresetParams();
    setPresetParams(getPresetParams());
    antdMessage.success('已重置为默认预设');
    cancelEdit();
  };

  // 更新新预设的参数
  const updateNewPresetParam = (index: number, field: 'key' | 'value', newValue: string) => {
    const newParams = [...newPresetParams];
    newParams[index] = { ...newParams[index], [field]: newValue };
    setNewPresetParams(newParams);
  };

  // 添加新预设的参数行
  const addNewPresetParam = () => {
    setNewPresetParams([...newPresetParams, { key: '', value: '' }]);
  };

  // 删除新预设的参数行
  const removeNewPresetParam = (index: number) => {
    const newParams = newPresetParams.filter((_, i) => i !== index);
    if (newParams.length === 0) {
      newParams.push({ key: '', value: '' });
    }
    setNewPresetParams(newParams);
  };

  // 添加预设参数
  const addPresetParams = (preset: (typeof presetParams)[0]) => {
    // 检查预设参数是否已存在
    const existingParams: string[] = [];
    preset.params.forEach((presetParam) => {
      const existingIndex = params.findIndex((p) => p.key === presetParam.key);
      if (existingIndex >= 0) {
        existingParams.push(presetParam.key);
      }
    });

    // 如果存在预设参数，弹出提醒并返回
    if (existingParams.length > 0) {
      const paramNames = existingParams.join('、');
      antdMessage.warning(`参数 ${paramNames} 已存在，无需重复添加`);
      return;
    }

    const newParams = [...params];

    preset.params.forEach((presetParam) => {
      // 如果不存在，添加新参数
      // 如果最后一个参数是空的，替换它，否则添加新行
      if (newParams.length > 0 && !newParams[newParams.length - 1].key.trim()) {
        newParams[newParams.length - 1] = { ...presetParam };
      } else {
        newParams.push({ ...presetParam });
      }
    });

    setParams(newParams);

    // 自动更新当前标签页URL
    const urlParams = new URLSearchParams();
    newParams.forEach((param) => {
      if (param.key.trim()) {
        urlParams.append(param.key.trim(), param.value);
      }
    });
    const queryString = urlParams.toString();
    const newURL = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    try {
      new URL(newURL);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.update(tabs[0].id, { url: newURL });
          setCurrentUrl(newURL);
          setError('');
        }
      });
    } catch (err) {
      // 如果URL无效，不更新但也不报错
      console.error('无效的URL', err);
    }
  };

  return (
    <div className='url-params-editor' style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px'}}>
      <Card size="small" title="当前URL">
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={currentUrl}
            onChange={(e) => {
              setCurrentUrl(e.target.value);
            }}
            onBlur={(e) => {
              // 失去焦点时，如果URL有效则重新解析
              if (e.target.value.trim()) {
                parseURL(e.target.value);
              }
            }}
            onPressEnter={(e) => {
              // 按Enter键时解析URL
              (e.target as HTMLInputElement).blur();
            }}
            placeholder='输入或粘贴URL，按Enter或失去焦点时解析'
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={refreshURL}
            title='刷新URL'
          />
        </Space.Compact>
      </Card>

      <Card size="small" title="基础URL">
        <Input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder='基础URL'
        />
      </Card>

      <Card 
        size="small" 
        title={
          <Space>
            <Text>预设参数</Text>
            <Button
              size="small"
              icon={<SettingOutlined />}
              onClick={openPresetManager}
              type="link"
            >
              管理
            </Button>
          </Space>
        }
      >
        <Space wrap>
          {presetParams.map((preset, index) => (
            <Tag
              key={index}
              onClick={() => addPresetParams(preset)}
              style={{ cursor: 'pointer' }}
              title={preset.params.map((p) => `${p.key}=${p.value}`).join(' & ')}
            >
              {preset.name}
            </Tag>
          ))}
        </Space>
      </Card>

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
          // 编辑模式
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>预设名称</Text>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder='输入预设名称'
                style={{ marginTop: '6px'}}
              />
            </div>

            <div>
              <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: '6px'}}>
                <Text strong>参数列表</Text>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={addNewPresetParam}
                >
                  添加参数
                </Button>
              </Space>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {newPresetParams.map((param, index) => (
                  <Space.Compact key={index} style={{ width: '100%' }}>
                    <Input
                      value={param.key}
                      onChange={(e) => updateNewPresetParam(index, 'key', e.target.value)}
                      placeholder='参数名'
                      style={{ flex: 1 }}
                    />
                    <Input
                      value={param.value}
                      onChange={(e) => updateNewPresetParam(index, 'value', e.target.value)}
                      placeholder='参数值'
                      style={{ flex: 1 }}
                    />
                    <Button
                      icon={<CloseOutlined />}
                      onClick={() => removeNewPresetParam(index)}
                      danger
                    />
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
          // 列表模式
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button
                icon={<PlusOutlined />}
                onClick={() => setEditingPreset({ index: -1, preset: { name: '', params: [] } })}
              >
                添加预设
              </Button>
              <Popconfirm
                title="确定要重置为默认预设吗？这将删除所有自定义预设。"
                onConfirm={handleResetPresets}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>重置为默认</Button>
              </Popconfirm>
            </Space>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {presetParams.map((preset, index) => (
                <Card key={index} size="small">
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>{preset.name}</Text>
                      <div style={{ marginTop: '6px'}}>
                        <Space wrap>
                          {preset.params.map((p, i) => (
                            <Tag key={i}>{p.key}={p.value}</Tag>
                          ))}
                        </Space>
                      </div>
                    </div>
                    <Space>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => startEditPreset(index)}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title={`确定要删除预设 "${preset.name}" 吗？`}
                        onConfirm={() => handleDeletePreset(index)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          </Space>
        )}
      </Modal>

      <Card 
        size="small" 
        title={
          <Space>
            <Text>URL参数</Text>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={addParam}
              type="link"
            >
              添加参数
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {params.map((param, index) => (
            <Space.Compact key={index} style={{ width: '100%' }}>
              <Input
                value={param.key}
                onChange={(e) => updateParam(index, 'key', e.target.value)}
                placeholder='参数名'
                style={{ flex: 1 }}
              />
              <Input
                value={param.value}
                onChange={(e) => updateParam(index, 'value', e.target.value)}
                placeholder='参数值'
                style={{ flex: 1 }}
              />
              <Button
                icon={<CloseOutlined />}
                onClick={() => removeParam(index)}
                danger
              />
            </Space.Compact>
          ))}
        </Space>
      </Card>

      {error && (
        <Card size="small" style={{ borderColor: 'var(--theme-error)' }}>
          <Text type="danger">{error}</Text>
        </Card>
      )}

      <Card size="small" title="新URL预览">
        <Text code copyable style={{ wordBreak: 'break-all' }}>
          {generateNewURL()}
        </Text>
      </Card>

      <Card size="small">
        <Space wrap>
          <Button
            type="primary"
            onClick={updateCurrentTabURL}
          >
            更新当前标签页
          </Button>
          <Button onClick={openInNewTab}>
            新标签页打开
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={copyNewURL}
          >
            复制URL
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default URLParamsEditor;
