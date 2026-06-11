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
} from '@ant-design/icons';
import type { DefaultTab } from '../../utils/userPreferences';

type FeatureTab = DefaultTab | 'future1' | 'future2';

interface FeatureMeta {
  id: FeatureTab;
  name: string;
  icon: string;
}

/** 功能图标映射（Ant Design 图标） */
const FEATURE_ICONS: Record<string, ReactNode> = {
  qrcode: <QrcodeOutlined />,
  urlparams: <LinkOutlined />,
  timestamp: <ClockCircleOutlined />,
  randomimage: <PictureOutlined />,
  json: <CodeOutlined />,
  gradient: <BgColorsOutlined />,
  regex: <SearchOutlined />,
  translator: <GlobalOutlined />,
  apitester: <ApiOutlined />,
  cachemanager: <ClearOutlined />,
  redirector: <RetweetOutlined />,
  webactions: <CompassOutlined />,
  mousetrail: <StarOutlined />,
  codec: <PartitionOutlined />,
  markdown: <CodeOutlined />,
  diff: <PartitionOutlined />,
  clipboard: <CopyOutlined />,
  asciiart: <StarOutlined />,
  future1: <AppstoreOutlined />,
  future2: <AppstoreOutlined />,
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
