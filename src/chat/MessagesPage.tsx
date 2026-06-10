import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Alert, Badge, Button, Input, List, Tag, Typography, Modal, Select } from 'antd';
import { UserOutlined, SettingOutlined, CodeOutlined } from '@ant-design/icons';
import { useLanRelayChatContext } from './LanRelayChatProvider';
import { logKeyDm, logKeyGroup } from './lan/useLanRelayChat';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const CODE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c', 'cpp', 'csharp',
  'html', 'css', 'json', 'yaml', 'sql', 'bash', 'markdown', 'text',
];

/* 检测消息文本是否包含代码块，并渲染格式化气泡 */
const renderMessageContent = (text: string) => {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={partIndex++}>{text.slice(lastIndex, match.index)}</span>);
    }
    const language = match[1] || 'text';
    const code = match[2];
    parts.push(
      <div key={partIndex++} className="chat-code-block">
        <div className="chat-code-header">
          <CodeOutlined style={{ fontSize: 10 }} />
          <span>{language}</span>
        </div>
        <pre className="chat-code-content"><code>{code}</code></pre>
      </div>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(<span key={partIndex}>{text.slice(lastIndex)}</span>);
  }
  return <>{parts}</>;
};

const MessagesPage: React.FC = () => {
  const [draft, setDraft] = useState('');
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeLang, setCodeLang] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');
  const chat = useLanRelayChatContext();
  const connected = chat.connection === 'connected';

  const send = useCallback(async () => {
    const t = draft.trim();
    if (!t) return;
    await chat.sendText(t);
    setDraft('');
  }, [draft, chat]);

  const sendCode = useCallback(async () => {
    if (!codeContent.trim()) return;
    const formatted = `\`\`\`${codeLang}\n${codeContent.trim()}\n\`\`\``;
    await chat.sendText(formatted);
    setCodeContent('');
    setCodeModalOpen(false);
  }, [codeContent, codeLang, chat]);

  const shortId = useCallback((id: string) => (id.length > 6 ? `${id.slice(0, 6)}…` : id), []);

  const threadTitle = useMemo(() => {
    if (chat.activeTarget.kind === 'group') {
      return chat.joinedRoomId ? `群聊 · ${chat.joinedRoomId}` : '群聊（未加入房间）';
    }
    const p = chat.peers[chat.activeTarget.peerId];
    return `私聊 · ${p?.name || '成员'} (${shortId(chat.activeTarget.peerId)})`;
  }, [chat.activeTarget, chat.joinedRoomId, chat.peers, shortId]);

  const groupUnread = useMemo(() => {
    if (!chat.joinedRoomId) return 0;
    return chat.unreadByKey[logKeyGroup(chat.joinedRoomId)] ?? 0;
  }, [chat.joinedRoomId, chat.unreadByKey]);

  useEffect(() => {
    chat.markActiveConversationRead();
  }, [chat.activeTarget, chat.joinedRoomId, chat.markActiveConversationRead]);

  return (
    <div className="chat-messages">
      <aside className="chat-messages-sessions" aria-label="会话与成员">
        <div className="chat-messages-sessions-head">会话</div>

        {!connected && (
          <div className="chat-messages-settings-hint">
            <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
              连接中继与昵称请前往
            </Text>
            <NavLink to="/settings" className="chat-messages-settings-link">
              <SettingOutlined /> 设置 → 聊天
            </NavLink>
          </div>
        )}

        {connected && (
          <>
            <button
              type="button"
              className={`chat-session-row${chat.activeTarget.kind === 'group' ? ' chat-session-row--active' : ''}`}
              onClick={() => {
                if (chat.joinedRoomId) {
                  chat.markConversationRead(logKeyGroup(chat.joinedRoomId));
                }
                chat.setActiveTarget({ kind: 'group' });
              }}
            >
              <span className="chat-session-row-title-row">
                <Badge count={groupUnread} size="small" overflowCount={99} offset={[10, 0]}>
                  <span className="chat-session-title">
                    {chat.joinedRoomId ? `# ${chat.joinedRoomId}` : '群聊会话'}
                  </span>
                </Badge>
              </span>
              <span className="chat-session-preview">
                {chat.joinedRoomId ? 'AES-GCM · 房间口令' : '请先加入房间'}
              </span>
            </button>

            <div className="chat-relay-section-title">
              <UserOutlined /> 在线成员
            </div>
            <List
              className="chat-relay-peer-list"
              size="small"
              dataSource={chat.peerList}
              locale={{ emptyText: '暂无其他成员' }}
              renderItem={(p) => {
                const dmUnread = chat.unreadByKey[logKeyDm(p.id)] ?? 0;
                return (
                  <List.Item className="chat-relay-peer-item">
                    <div className="chat-relay-peer-main">
                      <span className="chat-relay-peer-name">{p.name}</span>
                      <Tag className="chat-relay-peer-id">{shortId(p.id)}</Tag>
                      {!p.pub && <Tag color="warning">无公钥</Tag>}
                    </div>
                    <div className="chat-relay-peer-actions">
                      {dmUnread > 0 ? (
                        <span
                          className="chat-relay-peer-unread-pill"
                          title={`${dmUnread} 条未读`}
                          aria-label={`${dmUnread} 条未读`}
                        >
                          {dmUnread > 99 ? '99+' : dmUnread}
                        </span>
                      ) : null}
                      <Button
                        type="link"
                        size="small"
                        disabled={!p.pub}
                        onClick={() => {
                          chat.markConversationRead(logKeyDm(p.id));
                          chat.setActiveTarget({ kind: 'dm', peerId: p.id });
                        }}
                      >
                        私聊
                      </Button>
                    </div>
                  </List.Item>
                );
              }}
            />
          </>
        )}
      </aside>

      <section className="chat-messages-thread" aria-label="消息">
        <div className="chat-thread-header chat-lan-header">
          <span>{threadTitle}</span>
          {connected && chat.selfId && (
            <Text type="secondary" className="chat-relay-self-id">
              本机 ID {shortId(chat.selfId)}
            </Text>
          )}
        </div>

        {!connected && (
          <div className="chat-lan-setup">
            <Alert
              type="info"
              showIcon
              message="局域网加密群聊 / 私聊"
              description={
                <Paragraph className="chat-lan-alert-desc">
                  在一台电脑上运行 <code className="chat-relay-code">npm run lan-chat-server</code>
                  ，在左侧导航打开 <strong>设置 → 聊天</strong>，填写 WebSocket 地址（如{' '}
                  <code className="chat-relay-code">ws://&lt;服务器IP&gt;:8765</code>）并连接。
                  <br />
                  <strong>群聊</strong>：房间名 + 共享口令经 PBKDF2 派生 AES-GCM 密钥，中继只转发密文。
                  <br />
                  <strong>私聊</strong>：双方连接后自动交换 ECDH(P-256) 公钥，会话密钥由 HKDF 派生；中继仍无法读明文。
                  <br />
                  注意：中继可见「谁在给谁发、在哪个房间」等元数据；若需防中间人，请在可信渠道核对对方公钥指纹（后续可扩展）。
                </Paragraph>
              }
            />
          </div>
        )}

        {connected && (
          <>
            <div className="chat-thread-scroll">
              {chat.activeLines.map((m) =>
                m.system ? (
                  <div key={m.id} className="chat-lan-system">
                    {m.text}
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className={`chat-bubble-row${m.fromSelf ? ' chat-bubble-row--self' : ''}`}
                  >
                    <div className="chat-bubble-wrap">
                      {!m.fromSelf && chat.activeTarget.kind === 'group' && m.fromId && (
                        <div
                          className="chat-bubble-meta"
                          title={m.fromId}
                        >
                          {chat.peers[m.fromId]?.name?.trim() || shortId(m.fromId)}
                        </div>
                      )}
                      <div className="chat-bubble">{renderMessageContent(m.text)}</div>
                    </div>
                  </div>
                )
              )}
            </div>
            <div className="chat-thread-composer">
              <Text type="secondary" className="chat-composer-storage-hint">
                {chat.saveHistoryEnabled
                  ? '聊天记录会自动保存到本机浏览器；导出/清空请打开侧栏 设置 → 聊天。清除站点数据或卸载扩展会丢失。'
                  : '已关闭自动保存：新消息仅保留在内存中，刷新或关闭页面后会丢失；可在设置 → 聊天中重新开启。'}
              </Text>
              <TextArea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  chat.activeTarget.kind === 'dm'
                    ? '私聊消息（ECDH + AES-GCM 加密后发送）…'
                    : '群聊消息（房间密钥加密后发送）…'
                }
                autoSize={{ minRows: 2, maxRows: 4 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <div className="chat-composer-actions">
                <span className="chat-composer-hint">Enter 发送 · Shift+Enter 换行</span>
                <Button size="small" icon={<CodeOutlined />} onClick={() => setCodeModalOpen(true)} title="分享代码片段">
                  代码
                </Button>
                <Button type="primary" onClick={() => void send()} disabled={!draft.trim()}>
                  发送
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 代码片段分享弹窗 */}
      <Modal
        open={codeModalOpen}
        title="分享代码片段"
        onCancel={() => setCodeModalOpen(false)}
        onOk={() => void sendCode()}
        okText="发送"
        cancelText="取消"
        okButtonProps={{ disabled: !codeContent.trim() }}
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Select
            value={codeLang}
            onChange={setCodeLang}
            size="small"
            style={{ width: 160 }}
            options={CODE_LANGUAGES.map((lang) => ({ value: lang, label: lang }))}
          />
          <TextArea
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            placeholder="粘贴代码..."
            autoSize={{ minRows: 6, maxRows: 16 }}
            style={{ fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace", fontSize: 12 }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MessagesPage;
