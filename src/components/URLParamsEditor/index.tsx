import React, { useState, useEffect } from 'react';
import './index.css';

interface URLParam {
  key: string;
  value: string;
}

const URLParamsEditor: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [params, setParams] = useState<URLParam[]>([]);
  const [error, setError] = useState<string>('');

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
        paramsArray.push({ key, value });
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
    alert('URL已复制到剪贴板');
  };

  // 刷新当前URL
  const refreshURL = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        parseURL(tabs[0].url);
      }
    });
  };

  // 预设参数列表
  const presetParams = [
    {
      name: 'mtop预发',
      params: [
        { key: '__mtop_subdomain__', value: 'wapa' },
        { key: '_env_', value: 'pre' },
        { key: 'env', value: 'debug' },
      ],
    },
    { name: '移去安全距离', params: [{ key: '__removesafearea__', value: '1' }] },
    { name: 'isGray', params: [{ key: 'isGray', value: 'true' }] },
    { name: 'debugMode', params: [{ key: '_debugMode_', value: '1' }] },
    { name: 'existtitle', params: [{ key: '__existtitle__', value: '1' }] },
  ];

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
      alert(`参数 ${paramNames} 已存在，无需重复添加`);
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
        <div className='url-text'>{currentUrl || '未获取到URL'}</div>
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
        <label>预设参数：</label>
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
              <button
                onClick={() => removeParam(index)}
                className='remove-param-btn'
                title='删除参数'
              >
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
