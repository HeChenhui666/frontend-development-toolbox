import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Modal,
  Space,
  Tag,
  Tooltip,
  Typography,
  Card,
  Empty,
  Popconfirm,
  message as antdMessage,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
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

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

const RequestRedirector: React.FC = () => {
  const [rules, setRules] = useState<RedirectRule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<RedirectRule | null>(null);
  const [form] = Form.useForm();
  const [modalWidth, setModalWidth] = useState<number>(600);

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
      antdMessage.error('加载规则失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // 计算 Modal 宽度，确保在小屏幕上不会超出
  useEffect(() => {
    const updateModalWidth = () => {
      setModalWidth(Math.min(600, window.innerWidth - 32));
    };
    updateModalWidth();
    window.addEventListener('resize', updateModalWidth);
    return () => window.removeEventListener('resize', updateModalWidth);
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
          antdMessage.success(`规则已应用（${ourRules.length} 条规则生效）`);
        } else {
          antdMessage.warning('规则已应用，但当前没有启用的规则');
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
            antdMessage.success(`规则已应用（${ourRules.length} 条规则生效）`);
          } else {
            antdMessage.warning('规则已应用，但当前没有启用的规则');
          }
        } else {
          antdMessage.error('应用规则失败');
        }
      }
    } catch (error) {
      console.error('[重定向] 应用规则失败:', error);
      if (error instanceof Error) {
        console.error('[重定向] 错误详情:', error.message, error.stack);
      }
      antdMessage.error(`应用规则失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
      console.log('[重定向] 应用规则流程结束');
    }
  };

  // 打开添加/编辑模态框
  const openModal = (rule?: RedirectRule) => {
    if (rule) {
      setEditingRule(rule);
      form.setFieldsValue({
        name: rule.name,
        enabled: rule.enabled,
        source: rule.source,
        target: rule.target,
        priority: rule.priority,
      });
    } else {
      setEditingRule(null);
      form.resetFields();
      form.setFieldsValue({
        enabled: true,
        priority: 1,
      });
    }
    setIsModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    form.resetFields();
  };

  // 保存规则
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        ...values,
        type: 'url' as const,
      };

      const validation = validateRule(formData);
      if (!validation.valid) {
        antdMessage.warning(validation.error || '规则验证失败');
        return;
      }

      if (editingRule) {
        // 更新规则
        const success = await updateRedirectRule(editingRule.id, formData as Partial<RedirectRule>);
        if (success) {
          antdMessage.success('规则已更新');
          await loadRules();
          await handleApplyRules();
          closeModal();
        } else {
          antdMessage.error('更新规则失败');
        }
      } else {
        // 添加规则
        const newRule = await addRedirectRule(formData as Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'>);
        if (newRule) {
          antdMessage.success('规则已添加');
          await loadRules();
          await handleApplyRules();
          closeModal();
        } else {
          antdMessage.error('添加规则失败');
        }
      }
    } catch (error) {
      console.error('保存规则失败:', error);
      if (error && typeof error === 'object' && 'errorFields' in error) {
        // 表单验证错误，antd 会自动显示
        return;
      }
      antdMessage.error('保存规则失败');
    }
  };

  // 删除规则
  const handleDelete = async (id: string) => {
    try {
      const success = await deleteRedirectRule(id);
      if (success) {
        antdMessage.success('规则已删除');
        await loadRules();
        await handleApplyRules();
      } else {
        antdMessage.error('删除规则失败');
      }
    } catch (error) {
      console.error('删除规则失败:', error);
      antdMessage.error('删除规则失败');
    }
  };

  // 切换规则启用状态
  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const success = await toggleRuleEnabled(id, enabled);
      if (success) {
        antdMessage.success(enabled ? '规则已启用' : '规则已禁用');
        await loadRules();
        await handleApplyRules();
      } else {
        antdMessage.error('更新规则状态失败');
      }
    } catch (error) {
      console.error('切换规则状态失败:', error);
      antdMessage.error('切换规则状态失败');
    }
  };

  // 判断是否是正则表达式
  const isRegexPattern = (source: string) => {
    return source.includes('*') ||
      source.startsWith('^') ||
      source.includes('(') ||
      source.includes('[');
  };

  // 截断文本
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };


  return (
    <div className="request-redirector" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isCompatible && (
        <CompatibilityWarning
          featureName="请求重定向"
          requiredFeatures={['declarativeNetRequest']}
        />
      )}

      <Card
        size="small"
        style={{ marginBottom: '12px', flexShrink: 0 }}
        title={<Text strong>请求重定向规则</Text>}
      >
        <div style={{ marginBottom: '12px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            配置URL重定向规则，支持URL到URL映射和正则表达式匹配
          </Text>
        </div>
        <Space wrap style={{ marginBottom: '12px' }}>
          <Button
            size="small"
            onClick={handleApplyRules}
            loading={loading}
            type="primary"
          >
            应用规则
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            添加规则
          </Button>
        </Space>
        <Collapse size="small" ghost>
          <Panel header="使用说明" key="usage">
            <Paragraph style={{ marginBottom: '8px' }}>
              <Text strong>URL映射</Text>：将源URL重定向到目标URL
            </Paragraph>
            <Paragraph style={{ marginBottom: '8px' }}>
              <Text strong>正则表达式映射</Text>：支持通配符和正则表达式匹配，可使用捕获组替换
              <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                <li><code>*</code> 匹配单个路径段（如：<code>assets-super-buyer/*/pages</code>）</li>
                <li><code>**</code> 匹配任意路径（如：<code>**/assets-super-buyer/**</code>）</li>
                <li>支持正则表达式（如：<code>^https://.*/assets-super-buyer/(.*)/pages/(.*)$</code>）</li>
                <li>目标URL可使用 <code>$1</code>, <code>$2</code> 等引用捕获组（如：<code>http://localhost:3000/dev/pages/$2</code>）</li>
                <li>示例：<code>^/**/assets-super-buyer/*/pages/**</code> → <code>http://localhost:3000/dev/pages/$3</code></li>
              </ul>
            </Paragraph>
            <Paragraph style={{ marginBottom: '8px' }}>
              <Text strong>优先级</Text>：数字越大优先级越高，高优先级规则会先匹配
            </Paragraph>
            <Paragraph type="warning" style={{ marginBottom: '4px', fontSize: '12px' }}>
              💡 提示：如果看到304状态码，说明浏览器使用了缓存。请使用 <strong>Ctrl+Shift+R</strong>（Windows）或 <strong>Cmd+Shift+R</strong>（Mac）强制刷新。
            </Paragraph>
            <Paragraph type="warning" style={{ marginBottom: '4px', fontSize: '12px' }}>
              ⚠️ <strong>重要说明</strong>：重定向规则匹配的是<strong>资源请求URL</strong>（如 index.js、index.css），不是页面URL。
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li>规则会在<strong>所有页面</strong>的匹配资源请求上生效</li>
                <li>例如：规则匹配 <code>https://example.com/file.js</code>，那么所有页面加载该文件时都会被重定向</li>
                <li>不需要为每个页面单独配置规则</li>
              </ul>
            </Paragraph>
            <Paragraph type="warning" style={{ fontSize: '12px' }}>
              🔍 调试方法：
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li>在<strong>任意页面</strong>打开开发者工具（F12）</li>
                <li>查看<strong>Network（网络）</strong>面板，检查资源请求是否被重定向</li>
                <li>检查规则中的资源类型是否包含请求类型（如SCRIPT、STYLESHEET）</li>
              </ul>
            </Paragraph>
          </Panel>
        </Collapse>
      </Card>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {rules.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无重定向规则"
            style={{ marginTop: '40px' }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              添加规则
            </Button>
          </Empty>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {rules.map((rule) => (
              <Card
                key={rule.id}
                size="small"
                style={{
                  opacity: rule.enabled ? 1 : 0.6,
                }}
                title={
                  <Space>
                    <Text strong>{rule.name}</Text>
                    <Tag color={isRegexPattern(rule.source) ? 'blue' : 'green'}>
                      {isRegexPattern(rule.source) ? '正则映射' : 'URL映射'}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      优先级: {rule.priority}
                    </Text>
                  </Space>
                }
                extra={
                  <Space>
                    <Switch
                      checked={rule.enabled}
                      onChange={(checked) => handleToggle(rule.id, checked)}
                      checkedChildren={<CheckCircleOutlined />}
                      unCheckedChildren={<CloseCircleOutlined />}
                      size="small"
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openModal(rule)}
                    />
                    <Popconfirm
                      title="确定要删除这条规则吗？"
                      onConfirm={() => handleDelete(rule.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text type="secondary" style={{ minWidth: '40px', fontSize: '12px' }}>源:</Text>
                    <Tooltip title={rule.source} placement="top">
                      <Text
                        code
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          fontSize: '12px',
                        }}
                      >
                        {truncateText(rule.source, 60)}
                      </Text>
                    </Tooltip>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text type="secondary" style={{ minWidth: '40px', fontSize: '12px' }}>目标:</Text>
                    <Tooltip title={rule.target} placement="top">
                      <Text
                        code
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          fontSize: '12px',
                        }}
                      >
                        {truncateText(rule.target, 60)}
                      </Text>
                    </Tooltip>
                  </div>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </div>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingRule ? '编辑规则' : '添加规则'}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={modalWidth}
        centered
        destroyOnClose
        maskClosable={false}
        getContainer={() => document.body}
        style={{ maxHeight: '90vh' }}
        bodyStyle={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: true,
            priority: 1,
          }}
        >
          <Form.Item
            label="规则名称"
            name="name"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如: API代理到本地" />
          </Form.Item>

          <Form.Item
            label="源URL/正则表达式"
            name="source"
            rules={[{ required: true, message: '请输入源URL或正则表达式' }]}
            tooltip="支持完整URL或正则表达式（支持通配符 * 和 **）"
          >
            <Input.TextArea
              placeholder="例如: https://api.example.com/users 或 ^/**/assets-super-buyer/*/pages/**"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            label="目标URL"
            name="target"
            rules={[{ required: true, message: '请输入目标URL' }]}
            tooltip="目标URL地址，正则映射可使用 $1, $2 等引用捕获组"
          >
            <Input.TextArea
              placeholder="例如: https://api-proxy.example.com/users 或 http://localhost:3000/dev/pages/$3"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            label="优先级"
            name="priority"
            rules={[
              { required: true, message: '请输入优先级' },
              { type: 'number', min: 1, max: 100, message: '优先级范围：1-100' },
            ]}
            tooltip="数字越大，优先级越高（1-100）"
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="enabled"
            valuePropName="checked"
          >
            <Space>
              <Switch />
              <Text>启用规则</Text>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RequestRedirector;
