import React, { useState, useEffect } from 'react';
import { Select, Button, Modal } from 'antd';
import ThemeSettings from '../ThemeSettings';
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
  type DefaultTab,
  type FeatureTab,
  type CacheType,
} from '../../utils/userPreferences';
import { showMessage } from '../../utils/message';
import './index.css';

const APP_VERSION = import.meta.env.APP_VERSION || '1.6.1';
const GITHUB_URL = 'https://github.com/HeChenhui666/frontend-development-toolbox';

interface SettingsProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'theme';

// 标签页名称映射
const TAB_NAMES: Record<FeatureTab, string> = {
  qrcode: '二维码',
  urlparams: 'URL参数',
  timestamp: '时间戳',
  randomimage: '图片工具',
  json: 'JSON',
  gradient: '颜色工具',
  regex: '正则',
  css: 'CSS预设',
  translator: '在线翻译',
};

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [defaultTab, setDefaultTab] = useState<DefaultTab>(getDefaultTab());
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [cacheTypeInfo, setCacheTypeInfo] = useState(getCacheTypeInfo());
  const [tabOrder, setTabOrder] = useState<FeatureTab[]>(getTabOrder());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showTabOrderManager, setShowTabOrderManager] = useState(false);
  const [showStorageDetails, setShowStorageDetails] = useState(false);

  // 更新存储信息
  useEffect(() => {
    setStorageInfo(getStorageInfo());
    setCacheTypeInfo(getCacheTypeInfo());
  }, [activeTab]);

  const handleDefaultTabChange = (tab: DefaultTab) => {
    setDefaultTab(tab);
    saveDefaultTab(tab);
    showMessage.success('默认标签页已更新');
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
          showMessage.success('缓存已清除');
          // 重新加载页面以应用默认设置
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          showMessage.error('清除缓存失败');
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
          showMessage.success(`${typeNames[type]}已清除`);
          if (type === 'theme' || type === 'preferences') {
            // 如果清除主题或偏好，需要刷新页面
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch (error) {
          showMessage.error('清除失败');
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
    showMessage.success('标签页顺序已更新');
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
        showMessage.success('标签页顺序已重置');
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>设置</h3>
          <button className="settings-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="settings-content">
          <div className="settings-sidebar">
            <button
              className={`settings-sidebar-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className="settings-sidebar-icon">⚙️</span>
              <span>通用</span>
            </button>
            <button
              className={`settings-sidebar-item ${activeTab === 'theme' ? 'active' : ''}`}
              onClick={() => setActiveTab('theme')}
            >
              <span className="settings-sidebar-icon">🎨</span>
              <span>主题</span>
            </button>
          </div>
          <div className="settings-main">
            {activeTab === 'general' && (
              <div className="settings-section">
                {/* 标签页排序 */}
                <div className="settings-item">
                  <div className="settings-item-header">
                    <label className="settings-item-label">标签页排序</label>
                    <span className="settings-item-desc">自定义功能标签页的显示顺序</span>
                  </div>
                  <div className="settings-item-content">
                    <div className="tab-order-actions">
                      <Button onClick={handleOpenTabOrderManager} type="primary" size="small">
                        管理排序
                      </Button>
                      <Button onClick={handleResetTabOrder} size="small">
                        重置为默认
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 默认功能标签页 */}
                <div className="settings-item">
                  <div className="settings-item-header">
                    <label className="settings-item-label">默认功能标签页</label>
                    <span className="settings-item-desc">设置打开扩展时默认显示的功能</span>
                  </div>
                  <div className="settings-item-content">
                    <Select
                      value={defaultTab}
                      onChange={(value) => handleDefaultTabChange(value as DefaultTab)}
                      style={{ width: '100%' }}
                      size="small"
                    >
                      {tabOrder.map((tab) => (
                        <Select.Option key={tab} value={tab}>
                          {TAB_NAMES[tab]}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* 数据管理 */}
                <div className="settings-item">
                  <div className="settings-item-header">
                    <label className="settings-item-label">数据管理</label>
                    <span className="settings-item-desc">管理缓存数据和存储空间</span>
                  </div>
                  <div className="settings-item-content">
                    <div className="storage-info">
                      <div className="storage-stats">
                        <span>已使用: {formatBytes(storageInfo.used)}</span>
                        <span>总容量: {formatBytes(storageInfo.total)}</span>
                      </div>
                      <div className="storage-progress">
                        <div
                          className="storage-progress-bar"
                          style={{
                            width: `${(storageInfo.used / storageInfo.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* 详细存储信息 */}
                    <div className="storage-details">
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setShowStorageDetails(!showStorageDetails)}
                        style={{ padding: 0, height: 'auto', fontSize: '12px' }}
                      >
                        {showStorageDetails ? '▼ 隐藏详情' : '▶ 查看详情'}
                      </Button>
                      
                      {showStorageDetails && (
                        <div className="storage-details-list">
                          {Object.entries(cacheTypeInfo).map(([type, info]) => (
                            <div key={type} className="storage-detail-item">
                              <div className="storage-detail-header">
                                <span className="storage-detail-name">{info.name}</span>
                                <span className="storage-detail-size">{formatBytes(info.size)}</span>
                              </div>
                              <Button
                                type="text"
                                danger
                                size="small"
                                onClick={() => handleClearCacheByType(type as CacheType)}
                                disabled={info.size === 0}
                                style={{ padding: '2px 8px', height: '24px', fontSize: '11px' }}
                              >
                                清除
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="storage-actions">
                      <Button onClick={handleClearCache} danger size="small">
                        清除所有缓存
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 关于信息 */}
                <div className="settings-item">
                  <div className="settings-item-header">
                    <label className="settings-item-label">关于</label>
                    <span className="settings-item-desc">版本信息和相关链接</span>
                  </div>
                  <div className="settings-item-content">
                    <div className="about-info">
                      <div className="about-version">
                        <span className="about-label">版本:</span>
                        <span className="about-value">v{APP_VERSION}</span>
                      </div>
                      <div className="about-links">
                        <a
                          href={GITHUB_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="about-link"
                        >
                          📦 GitHub 仓库
                        </a>
                        <a
                          href={`${GITHUB_URL}/issues`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="about-link"
                        >
                          🐛 问题反馈
                        </a>
                        <a
                          href={`${GITHUB_URL}#readme`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="about-link"
                        >
                          📖 使用文档
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'theme' && (
              <div className="settings-section">
                <h4 className="settings-section-title">主题设置</h4>
                <div className="settings-section-content">
                  <ThemeSettings onClose={() => {}} embedded={true} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Order Manager Modal */}
      {showTabOrderManager && (
        <div className="tab-order-manager-overlay" onClick={handleCloseTabOrderManager}>
          <div className="tab-order-manager-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tab-order-manager-header">
              <h4>管理标签页顺序</h4>
              <button className="tab-order-manager-close" onClick={handleCloseTabOrderManager}>
                ✕
              </button>
            </div>
            <div className="tab-order-manager-content">
              <p className="tab-order-manager-hint">拖拽列表项调整功能标签页的显示顺序。</p>
              <div className="tab-order-list">
                {tabOrder.map((tab, index) => (
                  <div
                    key={tab}
                    className={`tab-order-item ${draggedIndex === index ? 'dragging' : ''} ${
                      dragOverIndex === index ? 'drag-over' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="tab-order-handle">☰</span>
                    <span className="tab-order-name">{TAB_NAMES[tab]}</span>
                    <span className="tab-order-index">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="tab-order-manager-footer">
              <Button onClick={handleCloseTabOrderManager} size="small">
                取消
              </Button>
              <Button onClick={handleSaveTabOrder} type="primary" size="small">
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
