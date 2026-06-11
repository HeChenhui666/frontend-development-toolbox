import React from 'react';
import Settings from '../features/settings/Settings';

/**
 * 聊天室侧栏「设置」：与主应用相同的嵌入式 Settings；连接与进房在「聊天」标签内。
 */
const SettingsPage: React.FC = () => {
  return (
    <div className="chat-settings-page">
      <Settings embedded chatRelayPanelInTab onlyTabs={['chat']} onClose={() => {}} />
    </div>
  );
};

export default SettingsPage;
