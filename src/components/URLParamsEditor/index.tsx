import React, { useState, useEffect } from 'react';
import './index.css';
import { showMessage } from '../../utils/message';
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
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          parseURL(tabs[0].url);
        }
      });
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 解析URL
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

      const urlObj = new URL(url);
      setBaseUrl(`${urlObj.origin}${urlObj.pathname}`);

      const urlParams = new URLSearchParams(urlObj.search);
      const paramsArray: URLParam[] = [];

      urlParams.forEach((value, key) => {
        // 对参数名和参数值进行URL解码，将编码的字符转换为中文
        const decodedKey = decodeURIComponent(key);
        const decodedValue = decodeURIComponent(value);
        paramsArray.push({ key: decodedKey, value: decodedValue });
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
    showMessage.success('URL已复制到剪贴板');
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
      showMessage.warning('请输入预设名称');
      return;
    }

    const validParams = newPresetParams.filter((p) => p.key.trim() && p.value.trim());
    if (validParams.length === 0) {
      showMessage.warning('请至少添加一个有效的参数');
      return;
    }

    try {
      if (editingPreset && editingPreset.index >= 0) {
        // 编辑现有预设
        updatePresetParam(editingPreset.index, {
          name: newPresetName.trim(),
          params: validParams,
        });
        showMessage.success('预设已更新');
      } else {
        // 添加新预设
        addPresetParam({
          name: newPresetName.trim(),
          params: validParams,
        });
        showMessage.success('预设已添加');
      }
      setPresetParams(getPresetParams());
      cancelEdit();
    } catch (error: any) {
      showMessage.error(error.message || '保存失败');
    }
  };

  // 删除预设
  const handleDeletePreset = (index: number) => {
    if (window.confirm(`确定要删除预设 "${presetParams[index].name}" 吗？`)) {
      try {
        deletePresetParam(index);
        setPresetParams(getPresetParams());
        showMessage.success('预设已删除');
        if (editingPreset && editingPreset.index === index) {
          cancelEdit();
        }
      } catch (error: any) {
        showMessage.error(error.message || '删除失败');
      }
    }
  };

  // 重置预设
  const handleResetPresets = () => {
    if (window.confirm('确定要重置为默认预设吗？这将删除所有自定义预设。')) {
      resetPresetParams();
      setPresetParams(getPresetParams());
      showMessage.success('已重置为默认预设');
      cancelEdit();
    }
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
      showMessage.warning(`参数 ${paramNames} 已存在，无需重复添加`);
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
    <div className='url-params-editor'>
      <div className='url-display'>
        <div className='url-display-header'>
          <label>当前URL：</label>
          <button onClick={refreshURL} className='refresh-btn' title='刷新URL'>
            🔄
          </button>
        </div>
        <input
          type='text'
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
          onKeyDown={(e) => {
            // 按Enter键时解析URL
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          className='url-input'
          placeholder='输入或粘贴URL，按Enter或失去焦点时解析'
        />
      </div>

      <div className='base-url-section'>
        <label>基础URL：</label>
        <input
          type='text'
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className='base-url-input'
          placeholder='基础URL'
        />
      </div>

      <div className='preset-params-section'>
        <div className='preset-params-header'>
          <label>预设参数：</label>
          <button onClick={openPresetManager} className='manage-presets-btn' title='管理预设'>
            ⚙️ 管理
          </button>
        </div>
        <div className='preset-params-list'>
          {presetParams.map((preset, index) => (
            <button
              key={index}
              onClick={() => addPresetParams(preset)}
              className='preset-param-btn'
              title={preset.params.map((p) => `${p.key}=${p.value}`).join(' & ')}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 预设管理器弹窗 */}
      {showPresetManager && (
        <div className='preset-manager-overlay' onClick={closePresetManager}>
          <div className='preset-manager-modal' onClick={(e) => e.stopPropagation()}>
            <div className='preset-manager-header'>
              <h3>{editingPreset ? '编辑预设' : '管理预设参数'}</h3>
              <button onClick={closePresetManager} className='close-modal-btn'>
                ×
              </button>
            </div>

            <div className='preset-manager-content'>
              {editingPreset ? (
                // 编辑模式
                <div className='preset-editor'>
                  <div className='preset-name-input-group'>
                    <label>预设名称：</label>
                    <input
                      type='text'
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className='preset-name-input'
                      placeholder='输入预设名称'
                    />
                  </div>

                  <div className='preset-params-editor'>
                    <div className='preset-params-editor-header'>
                      <label>参数列表：</label>
                      <button onClick={addNewPresetParam} className='add-preset-param-btn'>
                        + 添加参数
                      </button>
                    </div>
                    <div className='preset-params-editor-list'>
                      {newPresetParams.map((param, index) => (
                        <div key={index} className='preset-param-row'>
                          <input
                            type='text'
                            value={param.key}
                            onChange={(e) => updateNewPresetParam(index, 'key', e.target.value)}
                            placeholder='参数名'
                            className='preset-param-key-input'
                          />
                          <span className='preset-param-equals'>=</span>
                          <input
                            type='text'
                            value={param.value}
                            onChange={(e) => updateNewPresetParam(index, 'value', e.target.value)}
                            placeholder='参数值'
                            className='preset-param-value-input'
                          />
                          <button
                            onClick={() => removeNewPresetParam(index)}
                            className='remove-preset-param-btn'
                            title='删除参数'
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='preset-editor-actions'>
                    <button onClick={cancelEdit} className='cancel-btn'>
                      取消
                    </button>
                    <button onClick={savePreset} className='save-preset-btn'>
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                // 列表模式
                <div className='preset-list'>
                  <div className='preset-list-header'>
                    <button onClick={() => setEditingPreset({ index: -1, preset: { name: '', params: [] } })} className='add-preset-btn'>
                      + 添加预设
                    </button>
                    <button onClick={handleResetPresets} className='reset-presets-btn'>
                      重置为默认
                    </button>
                  </div>
                  <div className='preset-list-items'>
                    {presetParams.map((preset, index) => (
                      <div key={index} className='preset-list-item'>
                        <div className='preset-item-info'>
                          <div className='preset-item-name'>{preset.name}</div>
                          <div className='preset-item-params'>
                            {preset.params.map((p, i) => (
                              <span key={i} className='preset-item-param'>
                                {p.key}={p.value}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className='preset-item-actions'>
                          <button
                            onClick={() => startEditPreset(index)}
                            className='edit-preset-btn'
                            title='编辑'
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeletePreset(index)}
                            className='delete-preset-btn'
                            title='删除'
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className='params-section'>
        <div className='params-header'>
          <label>URL参数：</label>
          <button onClick={addParam} className='add-param-btn'>
            + 添加参数
          </button>
        </div>

        <div className='params-list'>
          {params.map((param, index) => (
            <div key={index} className='param-row'>
              <input
                type='text'
                value={param.key}
                onChange={(e) => updateParam(index, 'key', e.target.value)}
                placeholder='参数名'
                className='param-key-input'
              />
              <span className='param-equals'>=</span>
              <input
                type='text'
                value={param.value}
                onChange={(e) => updateParam(index, 'value', e.target.value)}
                placeholder='参数值'
                className='param-value-input'
              />
              <button onClick={() => removeParam(index)} className='remove-param-btn' title='删除参数'>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <div className='error'>{error}</div>}

      <div className='preview-section'>
        <div className='preview-header'>
          <label>新URL预览：</label>
        </div>
        <div className='preview-url'>{generateNewURL()}</div>
      </div>

      <div className='actions'>
        <button onClick={updateCurrentTabURL} className='action-btn primary'>
          更新当前标签页
        </button>
        <button onClick={openInNewTab} className='action-btn'>
          新标签页打开
        </button>
        <button onClick={copyNewURL} className='action-btn'>
          复制URL
        </button>
      </div>
    </div>
  );
};

export default URLParamsEditor;
