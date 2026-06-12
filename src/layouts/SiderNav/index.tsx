import { memo, useCallback } from 'react';
import { Tooltip } from 'antd';
import type { ReactNode } from 'react';
import {
  QrcodeOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  PictureOutlined,
  CodeOutlined,
  BgColorsOutlined,
  SearchOutlined,
  GlobalOutlined,
  ApiOutlined,
  ClearOutlined,
  RetweetOutlined,
  CompassOutlined,
  StarOutlined,
  PartitionOutlined,
  CopyOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  DiffOutlined,
  CodepenOutlined,
  FontColorsOutlined,
  BarcodeOutlined,
  TranslationOutlined,
  DatabaseOutlined,
  RocketOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import type { DefaultTab } from '../../utils/userPreferences';

type FeatureTab = DefaultTab | 'future1' | 'future2';

interface FeatureMeta {
  id: FeatureTab;
  name: string;
  icon: string;
}

/** 功能图标映射（Ant Design 图标）- 每个功能都有独特的语义化图标 */
const FEATURE_ICONS: Record<string, ReactNode> = {
  // ===== 实用工具 =====
  qrcode: <QrcodeOutlined />,           // 二维码生成 - 二维码图标（最直观）
  urlparams: <LinkOutlined />,          // URL参数编辑 - 链接图标（URL相关）
  timestamp: <ClockCircleOutlined />,   // 时间戳转换 - 时钟图标（时间相关）
  translator: <TranslationOutlined />,  // 翻译工具 - 翻译图标（语言相关）
  clipboard: <CopyOutlined />,          // 剪贴板历史 - 复制图标（剪贴板相关）
  barcode: <BarcodeOutlined />,         // 条形码生成 - 条形码图标（最直观）
  
  // ===== 视觉工具 =====
  randomimage: <PictureOutlined />,     // 随机图片 - 图片图标（最直观）
  gradient: <BgColorsOutlined />,       // 渐变生成器 - 颜色图标（色彩相关）
  asciiart: <FontColorsOutlined />,     // ASCII艺术 - 字体颜色图标（文字艺术）
  
  // ===== 代码工具 =====
  json: <CodeOutlined />,               // JSON工具 - 代码图标（代码相关）
  regex: <SearchOutlined />,            // 正则测试 - 搜索图标（模式匹配）
  codec: <CodepenOutlined />,           // 编解码工具 - CodePen图标（编码相关）
  markdown: <FileTextOutlined />,       // Markdown预览 - 文档图标（文本相关）
  diff: <DiffOutlined />,               // 差异对比 - 差异图标（最直观）
  
  // ===== 网络工具 =====
  apitester: <ApiOutlined />,           // API测试 - API图标（最直观）
  redirector: <RetweetOutlined />,      // 请求重定向 - 转发图标（重定向相关）
  
  // ===== 浏览器工具 =====
  cachemanager: <ClearOutlined />,      // 缓存管理 - 清除图标（清理相关）
  webactions: <CompassOutlined />,      // Web操作 - 指南针图标（导航相关）
  mousetrail: <StarOutlined />,         // 鼠标轨迹 - 星星图标（特效相关）
  storagemanager: <DatabaseOutlined />, // 存储管理 - 数据库图标（数据存储）
  
  // ===== 彩蛋 =====
  easteregg: <GiftOutlined />,          // 彩蛋 - 礼物图标（惊喜相关）
  
  // ===== 预留功能 =====
  future1: <AppstoreOutlined />,        // 预留1 - 应用商店图标
  future2: <RocketOutlined />,          // 预留2 - 火箭图标（新功能）
};

// ── 导航项 ──────────────────────────────────────────────────────────────────

interface SiderNavItemProps {
  feature: FeatureMeta;
  isActive: boolean;
  onClick: (tab: FeatureTab) => void;
  collapsed: boolean;
}

export const SiderNavItem = memo<SiderNavItemProps>(({ feature, isActive, onClick, collapsed }) => {
  const handleClick = useCallback(() => onClick(feature.id), [feature.id, onClick]);

  const btn = (
    <button
      type="button"
      className={`sider-item${isActive ? ' active' : ''}`}
      onClick={handleClick}
      aria-label={feature.name}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="sider-item-icon">{FEATURE_ICONS[feature.id]}</span>
      <span className="sider-item-label">{feature.name}</span>
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip title={feature.name} placement="right" mouseEnterDelay={0.3}>
        {btn}
      </Tooltip>
    );
  }
  return btn;
});
SiderNavItem.displayName = 'SiderNavItem';

// ── 底部操作按钮 ──────────────────────────────────────────────────────────────

interface SiderActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  collapsed: boolean;
  isActive?: boolean;
}

export const SiderAction = memo<SiderActionProps>(({ icon, label, onClick, collapsed, isActive }) => {
  const btn = (
    <button
      type="button"
      className={`sider-action${isActive ? ' active' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="sider-action-icon">{icon}</span>
      <span className="sider-action-label">{label}</span>
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" mouseEnterDelay={0.3}>
        {btn}
      </Tooltip>
    );
  }
  return btn;
});
SiderAction.displayName = 'SiderAction';
