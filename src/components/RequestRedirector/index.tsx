import React, { useState, useEffect } from 'react';
import { showMessage } from '../../utils/message';
import CompatibilityWarning from '../CompatibilityWarning';
import { useCompatibility } from '../../hooks/useCompatibility';
import {
  getRedirectRules,
  addRedirectRule,
  updateRedirectRule,
  deleteRedirectRule,
  toggleRuleEnabled,
  validateRule,
  applyRulesToDeclarativeNetRequest,
  type RedirectRule,
} from '../../utils/redirectRules';
import './index.css';

const RequestRedirector: React.FC = () => {
  const [rules, setRules] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<RedirectRule | null>(null);
  const [formData, setFormData] = useState<Partial<RedirectRule>>({
    name: '',
    enabled: true,
    type: 'url',
    source: '',
    target: '',
    priority: 1,
  });

  const { isCompatible } = useCompatibility({
    featureName: '请求重定向',
    requiredFeatures: ['declarativeNetRequest'],
    checkTypes: ['extension'],
  });

  // 加载规则
  const loadRules = async () => {
    setLoading(true);
    try {
      console.log('[重定向] 开始加载规则...');
      const allRules = await getRedirectRules();
      console.log('[重定向] 加载到规则数:', allRules.length);
      // 按优先级和更新时间排序
      const sorted = allRules.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return b.updatedAt - a.updatedAt;
      });
      setRules(sorted);
      console.log('[重定向] 规则加载完成，启用的规则:', sorted.filter(r => r.enabled).length);
    } catch (error) {
      console.error('[重定向] 加载规则失败:', error);
      showMessage.error('加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // 应用规则
  const handleApplyRules = async () => {
    setLoading(true);
    console.log('[重定向] 开始应用规则...');
    try {
      // 先通知后台脚本应用规则
      console.log('[重定向] 发送消息到后台脚本...');
      const response = await chrome.runtime.sendMessage({ type: 'APPLY_RULES' });
      console.log('[重定向] 后台脚本响应:', response);
      
      if (response?.success) {
        console.log('[重定向] 后台脚本成功应用规则');
        // 验证规则是否生效
        const activeRules = await chrome.declarativeNetRequest.getDynamicRules();
        const ourRules = activeRules.filter(r => r.id >= 10000 && r.id < 20000);
        console.log('[重定向] 当前生效的规则数:', ourRules.length);
        if (ourRules.length > 0) {
          console.log('[重定向] 生效的规则详情:', ourRules);
          // 显示规则匹配方式，帮助调试
          ourRules.forEach((rule, idx) => {
            const conditionInfo = rule.condition.regexFilter 
              ? `regexFilter: ${rule.condition.regexFilter}`
              : rule.condition.urlFilter 
              ? `urlFilter: ${rule.condition.urlFilter}`
              : '未知匹配方式';
            const actionInfo = (rule.action as any).redirect?.url 
              ? `重定向到: ${(rule.action as any).redirect.url}`
              : (rule.action as any).redirect?.regexSubstitution
              ? `正则替换: ${(rule.action as any).redirect.regexSubstitution}`
              : '未知重定向方式';
            const resourceTypes = rule.condition.resourceTypes?.join(', ') || '未知';
            
            console.log(`[重定向] 规则 ${idx + 1}:`, {
              id: rule.id,
              priority: rule.priority,
              匹配条件: conditionInfo,
              重定向动作: actionInfo,
              资源类型: resourceTypes,
            });
          });
          showMessage.success(`规则已应用（${ourRules.length} 条规则生效）`);
        } else {
          showMessage.warning('规则已应用，但当前没有启用的规则');
        }
      } else {
        // 如果消息发送失败，直接调用函数
        console.log('[重定向] 后台脚本响应失败，直接调用函数');
        const success = await applyRulesToDeclarativeNetRequest();
        console.log('[重定向] 直接调用结果:', success);
        if (success) {
          const activeRules = await chrome.declarativeNetRequest.getDynamicRules();
          const ourRules = activeRules.filter(r => r.id >= 10000 && r.id < 20000);
          console.log('[重定向] 当前生效的规则数:', ourRules.length);
          if (ourRules.length > 0) {
            console.log('[重定向] 生效的规则详情:', ourRules);
            // 显示规则匹配方式，帮助调试
            ourRules.forEach((rule, idx) => {
              const conditionInfo = rule.condition.regexFilter 
                ? `regexFilter: ${rule.condition.regexFilter}`
                : rule.condition.urlFilter 
                ? `urlFilter: ${rule.condition.urlFilter}`
                : '未知匹配方式';
              const actionInfo = (rule.action as any).redirect?.url 
                ? `重定向到: ${(rule.action as any).redirect.url}`
                : (rule.action as any).redirect?.regexSubstitution
                ? `正则替换: ${(rule.action as any).redirect.regexSubstitution}`
                : '未知重定向方式';
              
              console.log(`[重定向] 规则 ${idx + 1}:`, {
                id: rule.id,
                priority: rule.priority,
                匹配条件: conditionInfo,
                重定向动作: actionInfo,
                资源类型: rule.condition.resourceTypes,
              });
            });
            showMessage.success(`规则已应用（${ourRules.length} 条规则生效）`);
          } else {
            showMessage.warning('规则已应用，但当前没有启用的规则');
          }
        } else {
          showMessage.error('应用规则失败');
        }
      }
    } catch (error) {
      console.error('[重定向] 应用规则失败:', error);
      if (error instanceof Error) {
        console.error('[重定向] 错误详情:', error.message, error.stack);
      }
      showMessage.error(`应用规则失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
      console.log('[重定向] 应用规则流程结束');
    }
  };

  // 打开添加/编辑模态框
  const openModal = (rule?: RedirectRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        enabled: rule.enabled,
        type: rule.type,
        source: rule.source,
        target: rule.target,
        priority: rule.priority,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        enabled: true,
        type: 'url',
        source: '',
        target: '',
        priority: 1,
      });
    }
    setShowAddModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowAddModal(false);
    setEditingRule(null);
    setFormData({
      name: '',
      enabled: true,
      type: 'url',
      source: '',
      target: '',
      priority: 1,
    });
  };

  // 保存规则
  const handleSave = async () => {
    const validation = validateRule(formData);
    if (!validation.valid) {
      showMessage.warning(validation.error || '规则验证失败');
      return;
    }

    try {
      if (editingRule) {
        // 更新规则
        const success = await updateRedirectRule(editingRule.id, formData as Partial<RedirectRule>);
        if (success) {
          showMessage.success('规则已更新');
          await loadRules();
          await handleApplyRules();
          closeModal();
        } else {
          showMessage.error('更新规则失败');
        }
      } else {
        // 添加规则
        const newRule = await addRedirectRule(formData as Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'>);
        if (newRule) {
          showMessage.success('规则已添加');
          await loadRules();
          await handleApplyRules();
          closeModal();
        } else {
          showMessage.error('添加规则失败');
        }
      }
    } catch (error) {
      console.error('保存规则失败:', error);
      showMessage.error('保存规则失败');
    }
  };

  // 删除规则
  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条规则吗？')) {
      return;
    }

    try {
      const success = await deleteRedirectRule(id);
      if (success) {
        showMessage.success('规则已删除');
        await loadRules();
        await handleApplyRules();
      } else {
        showMessage.error('删除规则失败');
      }
    } catch (error) {
      console.error('删除规则失败:', error);
      showMessage.error('删除规则失败');
    }
  };

  // 切换规则启用状态
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const success = await toggleRuleEnabled(id, enabled);
      if (success) {
        showMessage.success(enabled ? '规则已启用' : '规则已禁用');
        await loadRules();
        await handleApplyRules();
      } else {
        showMessage.error('更新规则状态失败');
      }
    } catch (error) {
      console.error('切换规则状态失败:', error);
      showMessage.error('切换规则状态失败');
    }
  };


  return (
    <div className="request-redirector">
      {!isCompatible && (
        <CompatibilityWarning
          featureName="请求重定向"
          requiredFeatures={['declarativeNetRequest']}
        />
      )}

      <div className="redirector-header">
        <div className="header-top">
          <div className="header-info">
            <h3>请求重定向规则</h3>
            <p className="header-desc">
              配置URL重定向规则，支持URL到URL映射、URL到本地文件映射、目录映射
            </p>
          </div>
          <div className="header-actions">
            <button onClick={handleApplyRules} className="apply-btn" disabled={loading}>
              {loading ? '应用中...' : '应用规则'}
            </button>
            <button 
              onClick={async () => {
                try {
                  // 获取当前标签页
                  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                  if (tabs[0]) {
                    const tab = tabs[0];
                    
                    // 获取生效的规则
                    const activeRules = await chrome.declarativeNetRequest.getDynamicRules();
                    const ourRules = activeRules.filter(r => r.id >= 10000 && r.id < 20000);
                    
                    if (ourRules.length === 0) {
                      showMessage.warning('没有生效的规则，请先点击"应用规则"');
                      return;
                    }
                    
                    // 显示规则信息
                    const rulesInfo = ourRules.map((rule, idx) => {
                      const condition = rule.condition.regexFilter || rule.condition.urlFilter || '未知';
                      const resourceTypes = rule.condition.resourceTypes?.join(', ') || '未知';
                      const redirect = (rule.action as any).redirect?.url || 
                                     (rule.action as any).redirect?.regexSubstitution || 
                                     '未知';
                      return `规则 ${idx + 1}:\n  匹配: ${condition}\n  重定向: ${redirect}\n  资源类型: ${resourceTypes}`;
                    }).join('\n\n');
                    
                    const message = `当前页面: ${tab.url}\n\n生效的规则（会在所有页面的匹配资源请求上生效）:\n\n${rulesInfo}\n\n💡 提示：规则匹配的是资源请求URL（如 index.js），不是页面URL。请在网络面板查看资源请求是否被重定向。`;
                    
                    console.log('[重定向] 当前页面规则信息:', message);
                    showMessage.info(`已输出规则信息到控制台，共 ${ourRules.length} 条规则`);
                  }
                } catch (error) {
                  console.error('[重定向] 检查当前页面失败:', error);
                  showMessage.error('检查失败');
                }
              }}
              className="apply-btn"
              style={{ fontSize: '11px', padding: '6px 10px' }}
              title="查看当前生效的规则（规则会在所有页面的匹配资源请求上生效）"
            >
              查看规则
            </button>
            <button onClick={() => openModal()} className="add-btn">
              + 添加规则
            </button>
          </div>
        </div>
        <details className="usage-hint">
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--theme-text, #334155)', marginBottom: '4px' }}>
              使用说明
            </summary>
            <ul style={{ marginTop: '6px' }}>
              <li><strong>URL映射</strong>：将源URL重定向到目标URL</li>
              <li><strong>文件映射</strong>：将URL重定向到扩展包内的本地文件（文件需在扩展包中）</li>
              <li><strong>目录映射</strong>：支持通配符和正则表达式
                <ul style={{ marginTop: '4px', paddingLeft: '16px' }}>
                  <li><code>*</code> 匹配单个路径段（如：<code>assets-super-buyer/*/pages</code>）</li>
                  <li><code>**</code> 匹配任意路径（如：<code>**/assets-super-buyer/**</code>）</li>
                  <li>支持正则表达式（如：<code>^https://.*/assets-super-buyer/(.*)/pages/(.*)$</code>）</li>
                  <li>目标URL可使用 <code>$1</code>, <code>$2</code> 等引用捕获组（如：<code>http://localhost:3333/dev/pages/$2</code>）</li>
                </ul>
              </li>
              <li><strong>优先级</strong>：数字越大优先级越高，高优先级规则会先匹配</li>
            </ul>
            <p className="warning-text">
              ⚠️ 注意：本地文件映射需要文件在扩展包内。对于外部文件，建议使用本地HTTP服务器方案。
            </p>
            <p className="warning-text" style={{ marginTop: '8px' }}>
              💡 提示：如果看到304状态码，说明浏览器使用了缓存。请使用 <strong>Ctrl+Shift+R</strong>（Windows）或 <strong>Cmd+Shift+R</strong>（Mac）强制刷新，或清除浏览器缓存。
            </p>
            <p className="warning-text" style={{ marginTop: '8px' }}>
              ⚠️ <strong>重要说明</strong>：重定向规则匹配的是<strong>资源请求URL</strong>（如 index.js、index.css），不是页面URL。
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li>规则会在<strong>所有页面</strong>的匹配资源请求上生效</li>
                <li>例如：规则匹配 <code>https://example.com/file.js</code>，那么所有页面加载该文件时都会被重定向</li>
                <li>不需要为每个页面单独配置规则</li>
              </ul>
            </p>
            <p className="warning-text" style={{ marginTop: '8px' }}>
              🔍 调试方法：
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li>在<strong>任意页面</strong>打开开发者工具（F12）</li>
                <li>查看<strong>Network（网络）</strong>面板，检查资源请求是否被重定向</li>
                <li>检查规则中的资源类型是否包含请求类型（如SCRIPT、STYLESHEET）</li>
              </ul>
            </p>
          </details>
      </div>

      <div className="rules-list">
        {rules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">暂无重定向规则</div>
            <div className="empty-hint">点击"添加规则"按钮创建第一条规则</div>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}>
              <div className="rule-header">
                <div className="rule-info">
                  <div className="rule-name">{rule.name}</div>
                  <div className="rule-meta">
                    <span className="rule-type">{rule.type === 'url' ? 'URL映射' : rule.type === 'file' ? '文件映射' : '目录映射'}</span>
                    <span className="rule-priority">优先级: {rule.priority}</span>
                  </div>
                </div>
                <div className="rule-actions">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => handleToggle(rule.id, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <button onClick={() => openModal(rule)} className="edit-btn" title="编辑">
                    编辑
                  </button>
                  <button onClick={() => handleDelete(rule.id)} className="delete-btn" title="删除">
                    删除
                  </button>
                </div>
              </div>
              <div className="rule-content">
                <div className="rule-path">
                  <span className="path-label">源:</span>
                  <span className="path-value">{rule.source}</span>
                </div>
                <div className="rule-arrow">→</div>
                <div className="rule-path">
                  <span className="path-label">目标:</span>
                  <span className="path-value">{rule.target}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 添加/编辑模态框 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRule ? '编辑规则' : '添加规则'}</h3>
              <button onClick={closeModal} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>规则名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: API代理到本地"
                />
              </div>

              <div className="form-group">
                <label>映射类型 *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as RedirectRule['type'] })}
                >
                  <option value="url">URL到URL映射</option>
                  <option value="file">URL到本地文件映射</option>
                  <option value="directory">目录映射</option>
                </select>
              </div>

              <div className="form-group">
                <label>源URL/模式 *</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder={
                    formData.type === 'directory'
                      ? '例如: https://api.example.com/api/*'
                      : '例如: https://api.example.com/users'
                  }
                />
                <div className="form-hint">
                  {formData.type === 'directory' ? (
                    <>
                      支持多种格式：
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        <li><strong>反向代理</strong>：<code>127.0.0.1:3355</code>（自动保持路径和查询参数）</li>
                        <li><code>*</code> 匹配单个路径段</li>
                        <li><code>**</code> 匹配任意路径</li>
                        <li>正则表达式：<code>^https://.*/api/(.*)$</code></li>
                      </ul>
                    </>
                  ) : (
                    '完整的URL地址（简单URL性能更好）'
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>目标URL/文件路径 *</label>
                <input
                  type="text"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  placeholder={
                    formData.type === 'file'
                      ? '例如: assets/mock-data.json (相对于扩展根目录)'
                      : formData.type === 'directory'
                      ? '例如: http://localhost:3000/api/*'
                      : '例如: https://api-proxy.example.com/users'
                  }
                />
                <div className="form-hint">
                  {formData.type === 'file' ? (
                    '本地文件路径（相对于扩展根目录）或使用扩展资源URL'
                  ) : formData.type === 'directory' ? (
                    <>
                      目标URL，支持多种格式：
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        <li><strong>反向代理</strong>：<code>pre-air.1688.com</code>（自动添加 https:// 并保持路径）</li>
                        <li>简单替换：<code>http://localhost:3000/api/*</code></li>
                        <li>捕获组替换：<code>http://localhost:3333/dev/pages/$3</code></li>
                        <li>自动添加协议（如果缺少）</li>
                      </ul>
                    </>
                  ) : (
                    '目标URL地址'
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>优先级</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="100"
                />
                <div className="form-hint">数字越大，优先级越高（1-100）</div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  />
                  启用规则
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeModal} className="cancel-btn">
                取消
              </button>
              <button onClick={handleSave} className="save-btn">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestRedirector;
