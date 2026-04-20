import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  Select,
  Button,
  Modal,
  Card,
  Space,
  Typography,
  Progress,
  Tabs,
  Switch,
  Input,
  message as antdMessage,
} from 'antd';
import {
  SettingOutlined,
  BgColorsOutlined,
  CloseOutlined,
  ExportOutlined,
  ImportOutlined,
  CopyOutlined,
  DeleteOutlined,
  ReloadOutlined,
  GithubOutlined,
  BugOutlined,
  BookOutlined,
  DragOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import ThemeSettings from '../ThemeSettings';
import TextArea from 'antd/es/input/TextArea';

const { Text, Link, Title } = Typography;
import {
  getDefaultTab,
  saveDefaultTab,
  clearAllCache,
  clearCacheByType,
  getStorageInfo,
  getCacheTypeInfo,
  getTabOrder,
  saveTabOrder,
  resetTabOrder,
  exportUserConfig,
  importUserConfig,
  type DefaultTab,
  type FeatureTab,
  type CacheType,
} from '../../utils/userPreferences';
import ChatConnectionPanel from '../../chat/ChatConnectionPanel';
import { ChatHistorySettingsActions } from '../../chat/ChatHistorySettingsActions';
import {
  CHAT_LS_WS_URL,
  DEFAULT_PUBLIC_ROOM_ID,
  DEFAULT_PUBLIC_ROOM_PASS,
  getChatAutoConnect,
  getChatAutoJoinPublic,
  getChatPublicRoomId,
  getChatPublicRoomPassphrase,
  getChatSaveHistoryEnabled,
  notifyChatPreferencesChanged,
  setChatAutoConnect,
  setChatAutoJoinPublic,
  setChatSaveHistoryEnabled,
  setChatPublicRoomId,
  setChatPublicRoomPassphrase,
} from '../../utils/chatPreferences';
import './index.css';

const APP_VERSION = import.meta.env.APP_VERSION || '';
const GITHUB_URL = 'https://github.com/HeChenhui666/frontend-development-toolbox';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/HeChenhui666/frontend-development-toolbox/main';

interface SettingsProps {
  /** 弹窗模式：关闭时回调 */
  onClose: () => void;
  /** 为 true 时不包裹外层 Modal，用于聊天室等独立页，内容与弹窗一致 */
  embedded?: boolean;
  /**
   * 聊天独立页：在「聊天」标签内展示连接/昵称/进房面板（需 LanRelayChatProvider），
   * 不再单独显示 WebSocket 输入框以免重复。
   */
  chatRelayPanelInTab?: boolean;
}

type SettingsTab = 'general' | 'theme' | 'chat';

// 版本号比较函数
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
};

// 标签页名称映射
const TAB_NAMES: Record<FeatureTab, string> = {
  qrcode: '二维码',
  urlparams: 'URL参数',
  timestamp: '时间戳',
  translator: '在线翻译',
  webactions: '网页操作',
  randomimage: '图片工具',
  json: 'JSON',
  gradient: '颜色工具',
  regex: '正则',
  apitester: 'API调试',
  redirector: '请求重定向',
  cachemanager: '缓存管理',
  mousetrail: '鼠标拖尾',
  codec: '编码/解码',
};

const Settings: React.FC<SettingsProps> = memo(({ onClose, embedded = false, chatRelayPanelInTab = false }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [defaultTab, setDefaultTab] = useState<DefaultTab>(getDefaultTab());
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [cacheTypeInfo, setCacheTypeInfo] = useState(getCacheTypeInfo());
  const [tabOrder, setTabOrder] = useState<FeatureTab[]>(getTabOrder());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showTabOrderManager, setShowTabOrderManager] = useState(false);
  const [showStorageDetails, setShowStorageDetails] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckError, setUpdateCheckError] = useState<string | null>(null);

  const [chatWsUrl, setChatWsUrl] = useState(() => {
    if (typeof window === 'undefined') return 'ws://127.0.0.1:8765';
    return window.localStorage.getItem(CHAT_LS_WS_URL) || 'ws://127.0.0.1:8765';
  });
  const [chatAutoConnect, setChatAutoConnectState] = useState(() => getChatAutoConnect());
  const [chatSaveHistory, setChatSaveHistoryState] = useState(() => getChatSaveHistoryEnabled());
  const [chatAutoJoinPublic, setChatAutoJoinPublicState] = useState(() => getChatAutoJoinPublic());
  const [chatPublicRoom, setChatPublicRoomState] = useState(() => getChatPublicRoomId());
  const [chatPublicPass, setChatPublicPassState] = useState(() => getChatPublicRoomPassphrase());

  // 更新存储信息 - 使用 useMemo 延迟计算，避免阻塞渲染
  useEffect(() => {
    // 使用 requestIdleCallback 延迟非关键操作
    const updateStorageInfo = () => {
      setStorageInfo(getStorageInfo());
      setCacheTypeInfo(getCacheTypeInfo());
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(updateStorageInfo, { timeout: 200 });
    } else {
      setTimeout(updateStorageInfo, 0);
    }
  }, [activeTab]);

  // 检查版本更新
  const checkForUpdate = useCallback(async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckError(null);
    setRemoteVersion(null);

    try {
      // 尝试从 package.json 获取版本
      const packageResponse = await fetch(`${GITHUB_RAW_BASE}/package.json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!packageResponse.ok) {
        throw new Error('无法获取 package.json');
      }

      const packageData = await packageResponse.json();
      const remotePackageVersion = packageData.version;

      // 也尝试从 manifest.json 获取版本（作为备用）
      let remoteManifestVersion: string | null = null;
      try {
        const manifestResponse = await fetch(`${GITHUB_RAW_BASE}/manifest.json`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (manifestResponse.ok) {
          const manifestData = await manifestResponse.json();
          remoteManifestVersion = manifestData.version;
        }
      } catch (e) {
        // manifest.json 获取失败不影响主流程
        console.warn('Failed to fetch manifest.json:', e);
      }

      // 优先使用 package.json 的版本，如果不存在则使用 manifest.json
      const finalRemoteVersion = remotePackageVersion || remoteManifestVersion;

      if (finalRemoteVersion) {
        setRemoteVersion(finalRemoteVersion);
        // 如果远程版本更新，显示提示
        if (compareVersions(finalRemoteVersion, APP_VERSION) > 0) {
          antdMessage.info(`发现新版本v${finalRemoteVersion}！可前往GitHub拉取最新代码。`);
        } else {
          antdMessage.success('当前已是最新版本');
        }
      } else {
        throw new Error('无法获取远程版本号');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '检查更新失败';
      setUpdateCheckError(errorMessage);
      antdMessage.error(`检查更新失败: ${errorMessage}`);
      console.error('Update check failed:', error);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  const handleDefaultTabChange = useCallback((tab: DefaultTab) => {
    setDefaultTab(tab);
    saveDefaultTab(tab);
    antdMessage.success('默认标签页已更新');
  }, []);

  // 导出配置（下载文件） - 使用 useCallback 优化
  const handleExportConfig = useCallback(() => {
    try {
      const configJson = exportUserConfig();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `toolbox-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      antdMessage.success('配置已导出');
    } catch (error) {
      antdMessage.error('导出配置失败');
      console.error('Export failed:', error);
    }
  }, []);

  // 复制配置到剪贴板 - 使用 useCallback 优化
  const handleCopyConfig = useCallback(async () => {
    try {
      const configJson = exportUserConfig();
      await navigator.clipboard.writeText(configJson);
      antdMessage.success('配置已复制到剪贴板');
    } catch (error) {
      antdMessage.error('复制配置失败');
      console.error('Copy failed:', error);
      // 降级方案：使用传统方法
      try {
        const textArea = document.createElement('textarea');
        textArea.value = exportUserConfig();
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        antdMessage.success('配置已复制到剪贴板');
      } catch (fallbackError) {
        antdMessage.error('复制配置失败');
        console.error('Fallback copy failed:', fallbackError);
      }
    }
  }, []);

  // 导入配置（从文件） - 使用 useCallback 优化
  const handleImportConfig = useCallback(() => {
    Modal.confirm({
      title: '导入配置',
      content: '导入配置将覆盖现有的用户设置（主题、预设参数、游戏积分等）。确定要继续吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const jsonString = event.target?.result as string;
              const result = importUserConfig(jsonString);

              if (result.success) {
                antdMessage.success(result.message);
                // 更新存储信息
                setStorageInfo(getStorageInfo());
                setCacheTypeInfo(getCacheTypeInfo());
                // 更新默认标签页和标签页顺序
                setDefaultTab(getDefaultTab());
                setTabOrder(getTabOrder());
                // 重新加载页面以应用新设置
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              } else {
                antdMessage.error(result.message);
              }
            } catch (error) {
              antdMessage.error('读取文件失败');
              console.error('Import failed:', error);
            }
          };
          reader.onerror = () => {
            antdMessage.error('读取文件失败');
          };
          reader.readAsText(file);
        };
        input.click();
      },
    });
  }, []);

  // 从剪贴板导入配置
  const handleImportFromClipboard = () => {
    // 先尝试读取剪贴板
    const tryReadClipboard = async () => {
      try {
        // 检查是否支持clipboard API
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          throw new Error('浏览器不支持剪贴板API');
        }

        const clipboardText = await navigator.clipboard.readText();

        if (!clipboardText || !clipboardText.trim()) {
          throw new Error('剪贴板为空');
        }

        // 验证是否为有效的JSON
        try {
          JSON.parse(clipboardText);
        } catch {
          throw new Error('剪贴板内容不是有效的JSON格式');
        }

        return clipboardText;
      } catch (error) {
        console.error('读取剪贴板失败:', error);
        throw error;
      }
    };

    // 显示确认对话框，并提供手动输入选项
    Modal.confirm({
      title: '从剪贴板导入配置',
      content: (
        <div>
          <p style={{ marginBottom: '6px'}}>导入配置将覆盖现有的用户设置（主题、预设参数、游戏积分等）。</p>
          <p style={{ fontSize: '12px', color: 'var(--theme-textSecondary, #64748b)', marginBottom: 6}}>
            如果自动读取剪贴板失败，请点击"确定"后手动粘贴配置JSON。
          </p>
        </div>
      ),
      okText: '确定',
      cancelText: '取消',
      width: 400,
      onOk: async () => {
        try {
          // 先尝试自动读取剪贴板
          let configText: string;
          try {
            configText = await tryReadClipboard();
          } catch (clipboardError) {
            // 如果自动读取失败，显示输入框让用户手动粘贴
            return new Promise<void>((resolve) => {
              let inputValue = '';
              Modal.confirm({
                title: '手动粘贴配置',
                content: (
                  <div>
                    <p style={{ marginBottom: '6px', fontSize: '12px', color: 'var(--theme-textSecondary, #64748b)' }}>
                      自动读取剪贴板失败，请手动粘贴配置JSON：
                    </p>
                    <TextArea
                      id='config-input-textarea'
                      style={{
                        minHeight: '200px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                      }}
                      placeholder='请粘贴配置JSON...'
                      onChange={(e) => {
                        inputValue = e.target.value;
                      }}
                      onPaste={() => {
                        // 自动填充粘贴的内容
                        setTimeout(() => {
                          const textarea = document.getElementById('config-input-textarea') as HTMLTextAreaElement;
                          if (textarea) {
                            inputValue = textarea.value;
                          }
                        }, 0);
                      }}
                    />
                  </div>
                ),
                okText: '导入',
                cancelText: '取消',
                width: 500,
                onOk: () => {
                  if (!inputValue || !inputValue.trim()) {
                    antdMessage.error('请输入配置JSON');
                    resolve();
                    return;
                  }

                  const result = importUserConfig(inputValue.trim());

                  if (result.success) {
                    antdMessage.success(result.message);
                    // 更新存储信息
                    setStorageInfo(getStorageInfo());
                    setCacheTypeInfo(getCacheTypeInfo());
                    // 更新默认标签页和标签页顺序
                    setDefaultTab(getDefaultTab());
                    setTabOrder(getTabOrder());
                    // 重新加载页面以应用新设置
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } else {
                    antdMessage.error(result.message);
                  }
                  resolve();
                },
                onCancel: () => {
                  resolve();
                },
              });
            });
          }

          // 如果成功读取剪贴板，直接导入
          const result = importUserConfig(configText);

          if (result.success) {
            antdMessage.success(result.message);
            // 更新存储信息
            setStorageInfo(getStorageInfo());
            setCacheTypeInfo(getCacheTypeInfo());
            // 更新默认标签页和标签页顺序
            setDefaultTab(getDefaultTab());
            setTabOrder(getTabOrder());
            // 重新加载页面以应用新设置
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            antdMessage.error(result.message);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知错误';
          antdMessage.error(`导入失败: ${errorMessage}`);
          console.error('Import from clipboard failed:', error);
        }
      },
    });
  };

  const handleClearCache = () => {
    Modal.confirm({
      title: '清除所有缓存',
      content: '确定要清除所有缓存数据吗？这将删除主题设置、预设参数、游戏积分等所有数据。',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        try {
          clearAllCache();
          setStorageInfo(getStorageInfo());
          setCacheTypeInfo(getCacheTypeInfo());
          antdMessage.success('缓存已清除');
          // 重新加载页面以应用默认设置
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          antdMessage.error('清除缓存失败');
        }
      },
    });
  };

  const handleClearCacheByType = (type: CacheType) => {
    const typeNames: Record<CacheType, string> = {
      theme: '主题设置',
      presets: 'URL预设参数',
      games: '游戏积分',
      preferences: '用户偏好',
      apiTemplates: 'API模板',
    };

    Modal.confirm({
      title: `清除${typeNames[type]}`,
      content: `确定要清除${typeNames[type]}吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        try {
          clearCacheByType(type);
          setStorageInfo(getStorageInfo());
          setCacheTypeInfo(getCacheTypeInfo());
          antdMessage.success(`${typeNames[type]}已清除`);
          if (type === 'theme' || type === 'preferences') {
            // 如果清除主题或偏好，需要刷新页面
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch (error) {
          antdMessage.error('清除失败');
        }
      },
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Tab Order Manager functions
  const handleOpenTabOrderManager = () => {
    setShowTabOrderManager(true);
    // Reload current tab order in case it was changed elsewhere
    setTabOrder(getTabOrder());
  };

  const handleCloseTabOrderManager = () => {
    setShowTabOrderManager(false);
    // Revert to saved order if cancelled
    setTabOrder(getTabOrder());
  };

  const handleSaveTabOrder = () => {
    saveTabOrder(tabOrder);
    // 触发事件通知 App 组件更新
    const event = new CustomEvent('tabOrderChanged', { bubbles: true });
    window.dispatchEvent(event);
    console.log('Tab order saved and event dispatched:', tabOrder);
    antdMessage.success('标签页顺序已更新');
    setShowTabOrderManager(false);
  };

  const handleResetTabOrder = () => {
    Modal.confirm({
      title: '重置标签页顺序',
      content: '确定要重置标签页顺序为默认吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        resetTabOrder();
        const defaultOrder = getTabOrder();
        setTabOrder(defaultOrder);
        antdMessage.success('标签页顺序已重置');
      },
    });
  };

  // Drag and Drop handlers for the manager modal
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // 添加拖拽时的视觉反馈
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // 只有当离开当前元素时才清除 dragOverIndex
    if (e.currentTarget === e.target) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null) return;

    const dragIndex = draggedIndex;

    if (dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...tabOrder];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    setTabOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // 恢复拖拽元素的透明度
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const settingsTabs = (
    <Tabs
        className={embedded ? 'settings-embedded-tabs' : undefined}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as SettingsTab)}
        items={[
          {
            key: 'general',
            label: (
              <Space>
                <SettingOutlined />
                <span>通用</span>
              </Space>
            ),
            children: (
              <div className='settings-main'>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* 标签页排序 */}
                  <Card size="small" title="标签页排序">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Text type="secondary">自定义功能标签页的显示顺序</Text>
                      <Space>
                        <Button onClick={handleOpenTabOrderManager} type='primary' size='small'>
                          管理排序
                        </Button>
                        <Button onClick={handleResetTabOrder} size='small'>
                          重置为默认
                        </Button>
                      </Space>
                    </Space>
                  </Card>

                  {/* 默认功能标签页 */}
                  <Card size="small" title="默认功能标签页">
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Text type="secondary">设置打开扩展时默认显示的功能</Text>
                      <Select
                        value={defaultTab}
                        onChange={(value) => handleDefaultTabChange(value as DefaultTab)}
                        style={{ width: '100%' }}
                        size='small'
                        options={tabOrder.map((tab) => ({
                          value: tab,
                          label: TAB_NAMES[tab],
                        }))}
                      />
                    </Space>
                  </Card>

                  {/* 数据管理 */}
                  <Card size="small" title="数据管理">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Text type="secondary">管理缓存数据和存储空间</Text>
                      
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Text>已使用: {formatBytes(storageInfo.used)}</Text>
                          <Text>总容量: {formatBytes(storageInfo.total)}</Text>
                        </Space>
                        <Progress
                          percent={Math.round((storageInfo.used / storageInfo.total) * 100)}
                          size="small"
                        />
                      </Space>

                      {/* 详细存储信息 */}
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Button
                          type='text'
                          size='small'
                          onClick={() => setShowStorageDetails(!showStorageDetails)}
                          style={{ padding: 6, height: 'auto', fontSize: '12px' }}
                        >
                          {showStorageDetails ? '▼ 隐藏详情' : '▶ 查看详情'}
                        </Button>

                        {showStorageDetails && (
                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            {Object.entries(cacheTypeInfo).map(([type, info]) => (
                              <Card key={type} size="small" style={{ margin: 6}}>
                                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                  <Space>
                                    <Text>{info.name}</Text>
                                    <Text type="secondary">{formatBytes(info.size)}</Text>
                                  </Space>
                                  <Button
                                    type='text'
                                    danger
                                    size='small'
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleClearCacheByType(type as CacheType)}
                                    disabled={info.size === 0}
                                  >
                                    清除
                                  </Button>
                                </Space>
                              </Card>
                            ))}
                          </Space>
                        )}
                      </Space>

                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Space wrap>
                          <Button onClick={handleExportConfig} size='small' type='primary' icon={<ExportOutlined />}>
                            导出配置
                          </Button>
                          <Button onClick={handleCopyConfig} size='small' icon={<CopyOutlined />}>
                            复制配置
                          </Button>
                          <Button onClick={handleImportConfig} size='small' icon={<ImportOutlined />}>
                            导入配置
                          </Button>
                          <Button onClick={handleImportFromClipboard} size='small' icon={<CopyOutlined />}>
                            从剪贴板导入
                          </Button>
                        </Space>
                        <Button onClick={handleClearCache} danger size='small' icon={<DeleteOutlined />} block>
                          清除所有缓存
                        </Button>
                      </Space>
                    </Space>
                  </Card>

                  {/* 关于信息 */}
                  <Card size="small" title="关于">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Text type="secondary">版本信息和相关链接</Text>
                      
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <Text strong>版本:</Text>
                          <Text>v{APP_VERSION}</Text>
                          {remoteVersion && (
                            <Text
                              type={compareVersions(remoteVersion, APP_VERSION) > 0 ? 'warning' : 'success'}
                            >
                              {compareVersions(remoteVersion, APP_VERSION) > 0 ? (
                                <>🆕 最新版本: v{remoteVersion}</>
                              ) : (
                                <>✓ 已是最新</>
                              )}
                            </Text>
                          )}
                        </Space>
                        {updateCheckError && (
                          <Text type="danger" style={{ fontSize: '12px' }}>
                            检查更新失败: {updateCheckError}
                          </Text>
                        )}
                        <Button
                          onClick={checkForUpdate}
                          loading={isCheckingUpdate}
                          size='small'
                          type={remoteVersion && compareVersions(remoteVersion, APP_VERSION) > 0 ? 'primary' : 'default'}
                          icon={<ReloadOutlined />}
                        >
                          {isCheckingUpdate ? '检查中...' : '检查更新'}
                        </Button>
                      </Space>

                      <Space wrap>
                        <Link href={GITHUB_URL} target='_blank' rel='noopener noreferrer'>
                          <Space>
                            <GithubOutlined />
                            <span>GitHub 仓库</span>
                          </Space>
                        </Link>
                        <Link href={`${GITHUB_URL}/issues`} target='_blank' rel='noopener noreferrer'>
                          <Space>
                            <BugOutlined />
                            <span>问题反馈</span>
                          </Space>
                        </Link>
                        <Link href={`${GITHUB_URL}#readme`} target='_blank' rel='noopener noreferrer'>
                          <Space>
                            <BookOutlined />
                            <span>使用文档</span>
                          </Space>
                        </Link>
                      </Space>
                    </Space>
                  </Card>
                </Space>
              </div>
            ),
          },
          {
            key: 'theme',
            label: (
              <Space>
                <BgColorsOutlined />
                <span>主题</span>
              </Space>
            ),
            children: (
              <div className='settings-section'>
                <ThemeSettings onClose={() => {}} embedded={true} />
              </div>
            ),
          },
          {
            key: 'chat',
            label: (
              <Space>
                <MessageOutlined />
                <span>聊天</span>
              </Space>
            ),
            children: (
              <div className='settings-main'>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Card size="small" title="局域网聊天">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      <Text type="secondary">
                        与扩展内「消息」页共用配置。需在局域网运行{' '}
                        <code style={{ fontSize: 12 }}>npm run lan-chat-server</code> 作为中继。
                      </Text>

                      {chatRelayPanelInTab && <ChatConnectionPanel />}

                      {!chatRelayPanelInTab && (
                        <Space direction="vertical" style={{ width: '100%' }} size={4}>
                          <Text strong>WebSocket 地址</Text>
                          <Input
                            value={chatWsUrl}
                            onChange={(e) => {
                              const v = e.target.value;
                              setChatWsUrl(v);
                              try {
                                window.localStorage.setItem(CHAT_LS_WS_URL, v);
                              } catch {
                                /* ignore */
                              }
                              notifyChatPreferencesChanged();
                            }}
                            placeholder="ws://192.168.x.x:8765"
                            size="small"
                          />
                        </Space>
                      )}

                      {chatRelayPanelInTab ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          显示昵称默认为「访客」，可在上方「局域网连接」中修改；会缓存到本机，连接后改名会同步到在线列表。
                        </Text>
                      ) : (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          显示昵称请在独立聊天窗口中打开 <strong>设置 → 聊天</strong> 修改（默认「访客」，会写入本机缓存）。
                        </Text>
                      )}

                      <Space align="start" style={{ width: '100%' }}>
                        <Switch
                          checked={chatAutoConnect}
                          onChange={(v) => {
                            setChatAutoConnectState(v);
                            setChatAutoConnect(v);
                            notifyChatPreferencesChanged();
                          }}
                        />
                        <div>
                          <Text>打开消息页时自动连接</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {chatRelayPanelInTab
                                ? '使用本标签内「局域网连接」中的 WebSocket 地址'
                                : '使用上方保存的 WebSocket 地址'}
                            </Text>
                          </div>
                        </div>
                      </Space>

                      <Space align="start" style={{ width: '100%' }}>
                        <Switch
                          checked={chatSaveHistory}
                          onChange={(v) => {
                            setChatSaveHistoryState(v);
                            setChatSaveHistoryEnabled(v);
                            notifyChatPreferencesChanged();
                          }}
                        />
                        <div>
                          <Text>自动保存聊天记录到本机</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              关闭后不再写入浏览器本地存储；刷新后本次会话中的新消息不会持久化（已存数据可手动导出或清空）。
                            </Text>
                          </div>
                        </div>
                      </Space>

                      <Space align="start" style={{ width: '100%' }}>
                        <Switch
                          checked={chatAutoJoinPublic}
                          onChange={(v) => {
                            setChatAutoJoinPublicState(v);
                            setChatAutoJoinPublic(v);
                            notifyChatPreferencesChanged();
                          }}
                        />
                        <div>
                          <Text>连接成功后自动加入公共房间</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              房间名与密语见下方；默认密语为 {DEFAULT_PUBLIC_ROOM_PASS}
                            </Text>
                          </div>
                        </div>
                      </Space>

                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        <Text strong>公共房间名</Text>
                        <Input
                          value={chatPublicRoom}
                          onChange={(e) => {
                            const v = e.target.value;
                            setChatPublicRoomState(v);
                            setChatPublicRoomId(v);
                            notifyChatPreferencesChanged();
                          }}
                          placeholder={DEFAULT_PUBLIC_ROOM_ID}
                          size="small"
                        />
                      </Space>

                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        <Text strong>公共房间密语</Text>
                        <Input.Password
                          value={chatPublicPass}
                          onChange={(e) => {
                            const v = e.target.value;
                            setChatPublicPassState(v);
                            setChatPublicRoomPassphrase(v);
                            notifyChatPreferencesChanged();
                          }}
                          placeholder={DEFAULT_PUBLIC_ROOM_PASS}
                          size="small"
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          未改过则默认 {DEFAULT_PUBLIC_ROOM_PASS}；须与群内其他人一致才能解密群消息
                        </Text>
                      </Space>
                    </Space>
                  </Card>

                  <ChatHistorySettingsActions chatRelayPanelInTab={chatRelayPanelInTab} />
                </Space>
              </div>
            ),
          },
        ]}
      />
  );

  const tabOrderManagerModal = (
    <Modal
      title="管理标签页顺序"
      open={showTabOrderManager}
      onCancel={handleCloseTabOrderManager}
      onOk={handleSaveTabOrder}
      okText="保存"
      cancelText="取消"
      width={500}
      centered
      destroyOnClose
      maskClosable={true}
      getContainer={() => document.body}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Text type="secondary">拖拽列表项调整功能标签页的显示顺序。</Text>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {tabOrder.map((tab, index) => (
            <Card
              key={tab}
              size="small"
              style={{
                cursor: 'move',
                opacity: draggedIndex === index ? 0.5 : 1,
                borderColor: dragOverIndex === index ? 'var(--theme-primary)' : undefined,
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <DragOutlined />
                  <Text>{TAB_NAMES[tab]}</Text>
                </Space>
                <Text type="secondary">#{index + 1}</Text>
              </Space>
            </Card>
          ))}
        </Space>
      </Space>
    </Modal>
  );

  if (embedded) {
    return (
      <div className="settings-embedded-root">
        <Title level={4} className="settings-embedded-title">
          设置
        </Title>
        {settingsTabs}
        {tabOrderManagerModal}
      </div>
    );
  }

  return (
    <Modal
      title="设置"
      open={true}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      destroyOnClose
      maskClosable={true}
      getContainer={() => document.body}
      closeIcon={<CloseOutlined />}
    >
      {settingsTabs}
      {tabOrderManagerModal}
    </Modal>
  );
});

Settings.displayName = 'Settings';

export default Settings;
