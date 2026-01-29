// src/components/APITester/index.tsx
import { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  message,
  Popconfirm
} from 'antd';
import { SendOutlined, SaveOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

interface HeaderItem {
  key: string;
  value: string;
}

interface Template {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: HeaderItem[];
  body: string;
  bodyType: 'json' | 'form' | 'text';
}

interface ResponseData {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: any;
  error?: string;
}

const APITester = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<HeaderItem[]>([]);
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState<'json' | 'form' | 'text'>('json');
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  // 获取所有预设模板
  const getAllPresetTemplates = (): Template[] => {
    return [
      // 1. JSON API请求（最常用）
      {
        id: 'preset-json-api',
        name: 'JSON API请求',
        method: 'GET',
        url: '',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer <your_token>' },
          { key: 'Accept', value: 'application/json' },
        ],
        body: '',
        bodyType: 'json'
      },
      // 2. 表单提交请求
      {
        id: 'preset-form',
        name: '表单提交请求',
        method: 'POST',
        url: '',
        headers: [
          { key: 'Content-Type', value: 'application/x-www-form-urlencoded' },
          { key: 'Authorization', value: 'Bearer <your_token>' },
        ],
        body: '',
        bodyType: 'form'
      },
      // 3. 文件上传请求
      {
        id: 'preset-upload',
        name: '文件上传请求',
        method: 'POST',
        url: '',
        headers: [
          { key: 'Content-Type', value: 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
          { key: 'Authorization', value: 'Bearer <your_token>' },
        ],
        body: '',
        bodyType: 'text'
      },
      // 4. 基础认证（Basic Auth）
      {
        id: 'preset-basic-auth',
        name: '基础认证',
        method: 'GET',
        url: '',
        headers: [
          { key: 'Authorization', value: 'Basic base64(username:password)' },
          { key: 'Accept', value: 'application/json' },
        ],
        body: '',
        bodyType: 'json'
      },
      // 5. OAuth 2.0认证
      {
        id: 'preset-oauth',
        name: 'OAuth 2.0认证',
        method: 'GET',
        url: '',
        headers: [
          { key: 'Authorization', value: 'Bearer <access_token>' },
          { key: 'Accept', value: 'application/json' },
        ],
        body: '',
        bodyType: 'json'
      },
      // 6. Azure服务认证
      {
        id: 'preset-azure',
        name: 'Azure服务认证',
        method: 'GET',
        url: '',
        headers: [
          { key: 'Authorization', value: 'type=master&ver=1.0&sig=<signature>' },
          { key: 'x-ms-date', value: new Date().toUTCString() },
          { key: 'x-ms-version', value: '2015-12-16' },
        ],
        body: '',
        bodyType: 'json'
      },
      // 7. GraphQL请求
      {
        id: 'preset-graphql',
        name: 'GraphQL请求',
        method: 'POST',
        url: '',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer <your_token>' },
          { key: 'X-API-Version', value: '2024-01' },
          { key: 'X-Request-ID', value: 'req-' + Date.now() },
        ],
        body: JSON.stringify({ query: '', variables: {} }, null, 2),
        bodyType: 'json'
      },
      // 8. Azure Cosmos DB请求
      {
        id: 'preset-cosmos',
        name: 'Azure Cosmos DB',
        method: 'GET',
        url: '',
        headers: [
          { key: 'x-ms-date', value: new Date().toUTCString() },
          { key: 'x-ms-version', value: '2015-12-16' },
          { key: 'x-ms-consistency-level', value: 'Session' },
          { key: 'x-ms-activity-id', value: crypto.randomUUID?.() || '6e1c1b18-41c2-4c5d-951d-7d4b7b31d0f3' },
        ],
        body: '',
        bodyType: 'json'
      },
      // 9. 带缓存控制的请求
      {
        id: 'preset-no-cache',
        name: '带缓存控制',
        method: 'GET',
        url: '',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
          { key: 'Accept', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer <your_token>' },
        ],
        body: '',
        bodyType: 'json'
      },
    ];
  };

  // 通用预设配置模板（保留作为默认）
  const getCommonPresetTemplate = (): Template => {
    return {
      id: 'preset-common',
      name: '通用预设配置',
      method: 'GET',
      url: '',
      headers: [
        { key: 'accept', value: 'application/json' },
        { key: 'accept-encoding', value: 'gzip, deflate, br' },
        { key: 'accept-language', value: 'zh-CN,zh;q=0.9,en;q=0.8' },
        { key: 'content-type', value: 'application/json' },
        { key: 'user-agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        { key: 'origin', value: typeof window !== 'undefined' ? window.location.origin : '' },
        { key: 'referer', value: typeof window !== 'undefined' ? window.location.href : '' },
      ],
      body: '',
      bodyType: 'json'
    };
  };

  // 初始化：使用当前页面URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(window.location.href);
    }
    loadTemplates();
  }, []);

  // 从 chrome.storage 或 localStorage 加载模板
  const loadTemplates = () => {
    const allPresets = getAllPresetTemplates();
    const commonPreset = getCommonPresetTemplate();
    const allSystemPresets = [commonPreset, ...allPresets];
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get('apiTemplates', (result) => {
        let loadedTemplates: Template[] = result.apiTemplates || [];
        
        // 检查并添加缺失的系统预设模板
        const existingPresetIds = new Set(loadedTemplates.map(t => t.id));
        const missingPresets = allSystemPresets.filter(p => !existingPresetIds.has(p.id));
        
        if (missingPresets.length > 0) {
          loadedTemplates = [...allSystemPresets, ...loadedTemplates.filter(t => !t.id.startsWith('preset-'))];
          chrome.storage.local.set({ apiTemplates: loadedTemplates }, () => {
            setTemplates(loadedTemplates);
          });
        } else {
          setTemplates(loadedTemplates);
        }
      });
    } else {
      try {
        const saved = localStorage.getItem('apiTemplates');
        let loadedTemplates: Template[] = saved ? JSON.parse(saved) : [];
        
        // 检查并添加缺失的系统预设模板
        const existingPresetIds = new Set(loadedTemplates.map(t => t.id));
        const missingPresets = allSystemPresets.filter(p => !existingPresetIds.has(p.id));
        
        if (missingPresets.length > 0) {
          loadedTemplates = [...allSystemPresets, ...loadedTemplates.filter(t => !t.id.startsWith('preset-'))];
          localStorage.setItem('apiTemplates', JSON.stringify(loadedTemplates));
        }
        
        setTemplates(loadedTemplates);
      } catch (e) {
        console.error('加载模板失败:', e);
        // 如果加载失败，至少添加系统预设
        setTemplates(allSystemPresets);
      }
    }
  };

  // 保存请求模板
  const saveTemplate = () => {
    if (!url.trim()) {
      message.warning('请先输入API地址');
      return;
    }

    const templateName = prompt('请输入模板名称:');
    if (!templateName) return;

    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: templateName,
      method,
      url,
      headers: [...headers],
      body,
      bodyType
    };
    
    const updated = [...templates, newTemplate];
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ apiTemplates: updated }, () => {
        setTemplates(updated);
        message.success('模板已保存');
      });
    } else {
      try {
        localStorage.setItem('apiTemplates', JSON.stringify(updated));
        setTemplates(updated);
        message.success('模板已保存');
      } catch (e) {
        message.error('保存失败');
      }
    }
  };

  // 删除模板
  const deleteTemplate = (id: string) => {
    // 系统预设模板不能被删除
    if (id.startsWith('preset-')) {
      message.warning('系统预设模板不能删除');
      return;
    }
    
    const updated = templates.filter(t => t.id !== id);
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ apiTemplates: updated }, () => {
        setTemplates(updated);
        message.success('模板已删除');
      });
    } else {
      try {
        localStorage.setItem('apiTemplates', JSON.stringify(updated));
        setTemplates(updated);
        message.success('模板已删除');
      } catch (e) {
        message.error('删除失败');
      }
    }
  };

  // 添加请求头
  const addHeader = () => {
    if (!newHeaderKey.trim()) {
      message.warning('请输入请求头Key');
      return;
    }
    setHeaders([...headers, { key: newHeaderKey.trim(), value: newHeaderValue.trim() }]);
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  // 删除请求头
  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders);
  };

  // 更新请求头
  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  // 发送请求
  const sendRequest = async () => {
    if (!url.trim()) {
      message.warning('请输入API地址');
      return;
    }

    setLoading(true);
    setResponse(null);
    
    try {
      const headersObj: Record<string, string> = {};
      headers.forEach(h => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value;
        }
      });

      // 根据bodyType设置Content-Type
      if (bodyType === 'json' && body) {
        headersObj['Content-Type'] = 'application/json';
      } else if (bodyType === 'form' && body) {
        headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      let requestBody: string | undefined;
      if (body) {
        if (bodyType === 'json') {
          requestBody = body;
        } else if (bodyType === 'form') {
          requestBody = new URLSearchParams(body.split('\n').map(line => {
            const [key, ...valueParts] = line.split('=');
            return [key.trim(), valueParts.join('=').trim()];
          }).filter(([key]) => key) as [string, string][]).toString();
        } else {
          requestBody = body;
        }
      }

      const config: RequestInit = {
        method,
        headers: headersObj,
        credentials: 'include', // 自动携带当前页面的Cookie
        body: requestBody,
      };

      const res = await fetch(url, config);
      const text = await res.text();
      
      // 自动格式化响应
      let parsedBody: any = text;
      const contentType = res.headers.get('Content-Type') || '';
      
      try {
        if (contentType.includes('application/json')) {
          parsedBody = JSON.parse(text);
        } else if (contentType.includes('text/html')) {
          // HTML格式化（简单处理）
          parsedBody = text;
        }
      } catch (e) {
        // 如果解析失败，保持原始文本
        parsedBody = text;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: parsedBody
      });
      
      message.success(`请求成功 (${res.status})`);
    } catch (error: any) {
      setResponse({ 
        error: error.message || '请求失败',
        status: 0,
        statusText: 'Error'
      });
      message.error('请求失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 加载模板
  const loadTemplate = (template: Template) => {
    setMethod(template.method);
    setUrl(template.url);
    setHeaders(template.headers || []);
    setBody(template.body || '');
    setBodyType(template.bodyType || 'json');
    message.success(`已加载模板: ${template.name}`);
  };

  // 格式化响应体显示
  const formatResponseBody = (body: any): string => {
    if (typeof body === 'object') {
      return JSON.stringify(body, null, 2);
    }
    return String(body);
  };

  // 判断是否为JSON
  const isJSON = (body: any): boolean => {
    if (typeof body === 'object') return true;
    if (typeof body === 'string') {
      try {
        JSON.parse(body);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  return (
    <div className="api-tester">
      {/* 常用模板 */}
      {templates.length > 0 && (
        <div className="api-tester-section">
          <div className="api-tester-templates">
            <Text type="secondary" className="api-tester-templates-label">常用模板:</Text>
            <Space wrap>
              {templates.map((t, i) => {
                const isSystemPreset = t.id.startsWith('preset-');
                return (
                  <span key={t.id} className="api-tester-template-item">
                    <Button 
                      type="link" 
                      onClick={() => loadTemplate(t)}
                      className="api-tester-template-btn"
                      style={isSystemPreset ? { fontWeight: 500 } : {}}
                    >
                      {i + 1}. {t.name}
                      {isSystemPreset && (
                        <Text type="secondary" style={{ marginLeft: '6px', fontSize: '11px' }}>
                          (预设)
                        </Text>
                      )}
                    </Button>
                    {!isSystemPreset && (
                      <Popconfirm
                        title="确定要删除这个模板吗？"
                        onConfirm={() => deleteTemplate(t.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button 
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          className="api-tester-template-delete-btn"
                        />
                      </Popconfirm>
                    )}
                  </span>
                );
              })}
            </Space>
          </div>
        </div>
      )}

      {/* 请求配置区 */}
      <div className="api-tester-section">
        <div className="api-tester-request-line">
          <Select 
            value={method} 
            onChange={setMethod} 
            className="api-tester-method-select"
          >
            <Select.Option value="GET">GET</Select.Option>
            <Select.Option value="POST">POST</Select.Option>
            <Select.Option value="PUT">PUT</Select.Option>
            <Select.Option value="DELETE">DELETE</Select.Option>
            <Select.Option value="PATCH">PATCH</Select.Option>
            <Select.Option value="HEAD">HEAD</Select.Option>
          </Select>
          
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="api-tester-url-input"
          />
          
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={sendRequest}
            loading={loading}
            className="api-tester-send-btn"
          >
            发送
          </Button>
          
          <Button 
            icon={<SaveOutlined />}
            onClick={saveTemplate}
            className="api-tester-save-btn"
          >
            保存模板
          </Button>
        </div>
      </div>

      {/* 请求头配置 */}
      <div className="api-tester-section">
        <div className="api-tester-section-title">请求头:</div>
        <div className="api-tester-header-add">
          <Input 
            placeholder="Key (如: Authorization)"
            value={newHeaderKey}
            onChange={(e) => setNewHeaderKey(e.target.value)}
            onPressEnter={addHeader}
            className="api-tester-header-key-input"
          />
          <Input 
            placeholder="Value (如: Bearer token)"
            value={newHeaderValue}
            onChange={(e) => setNewHeaderValue(e.target.value)}
            onPressEnter={addHeader}
            className="api-tester-header-value-input"
          />
          <Button 
            type="dashed" 
            icon={<PlusOutlined />}
            onClick={addHeader}
            className="api-tester-header-add-btn"
          >
            添加
          </Button>
        </div>
        <div className="api-tester-headers-list">
          {headers.map((h, index) => (
            <div key={index} className="api-tester-header-item">
              <Input 
                value={h.key} 
                onChange={e => updateHeader(index, 'key', e.target.value)}
                className="api-tester-header-key-input"
              />
              <Input 
                value={h.value} 
                onChange={e => updateHeader(index, 'value', e.target.value)}
                className="api-tester-header-value-input"
              />
              <Button 
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeHeader(index)}
                className="api-tester-header-delete-btn"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 请求体配置 */}
      <div className="api-tester-section">
        <div className="api-tester-section-title">请求体:</div>
        <Select 
          value={bodyType} 
          onChange={setBodyType}
          className="api-tester-body-type-select"
        >
          <Select.Option value="json">JSON</Select.Option>
          <Select.Option value="form">表单</Select.Option>
          <Select.Option value="text">文本</Select.Option>
        </Select>
        <Input.TextArea 
          value={body} 
          onChange={e => setBody(e.target.value)} 
          rows={8} 
          placeholder={bodyType === 'json' ? '{\n  "name": "test",\n  "age": 30\n}' : bodyType === 'form' ? 'key1=value1\nkey2=value2' : '请求体内容'}
          className="api-tester-body-input"
        />
      </div>

      {/* 响应展示 */}
      {response && (
        <div className="api-tester-section api-tester-response-section">
          <div className="api-tester-section-title">响应:</div>
          
          {response.error ? (
            <div className="api-tester-error">
              <Text strong>错误:</Text> {response.error}
            </div>
          ) : (
            <>
              <div className="api-tester-status">
                <Text strong>状态码:</Text> {response.status} {response.statusText}
              </div>

              {response.headers && (
                <>
                  <div className="api-tester-section-subtitle">响应头:</div>
                  <pre className="api-tester-code-block">
                    {JSON.stringify(response.headers, null, 2)}
                  </pre>
                </>
              )}

              {response.body !== undefined && (
                <>
                  <div className="api-tester-section-subtitle">响应体:</div>
                  <pre className={`api-tester-code-block ${isJSON(response.body) ? 'api-tester-json' : 'api-tester-text'}`}>
                    {formatResponseBody(response.body)}
                  </pre>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default APITester;
