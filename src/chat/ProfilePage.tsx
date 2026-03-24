import React from 'react';
import { Avatar, Tag } from 'antd';

const ProfilePage: React.FC = () => {
  return (
    <div className="chat-profile">
      <header className="chat-profile-hero">
        <Avatar size={72} className="chat-profile-avatar">
          火
        </Avatar>
        <div className="chat-profile-titles">
          <h1 className="chat-profile-name">访客用户</h1>
          <p className="chat-profile-bio">接入账号系统后，这里展示昵称、签名与个人设置。</p>
          <div className="chat-profile-tags">
            <Tag color="processing">前端</Tag>
            <Tag>工具箱用户</Tag>
          </div>
        </div>
      </header>

      <section className="chat-profile-section">
        <h2 className="chat-profile-section-title">账号信息</h2>
        <dl className="chat-profile-dl">
          <div className="chat-profile-dl-row">
            <dt>用户 ID</dt>
            <dd>—</dd>
          </div>
          <div className="chat-profile-dl-row">
            <dt>邮箱</dt>
            <dd>—</dd>
          </div>
          <div className="chat-profile-dl-row">
            <dt>注册时间</dt>
            <dd>—</dd>
          </div>
        </dl>
      </section>

      <section className="chat-profile-section">
        <h2 className="chat-profile-section-title">偏好</h2>
        <p className="chat-profile-placeholder">主题与通知等选项可与主工具箱设置打通。</p>
      </section>
    </div>
  );
};

export default ProfilePage;
