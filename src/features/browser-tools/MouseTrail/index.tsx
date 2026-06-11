import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Input,
  InputNumber,
  Radio,
  Slider,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import {
  DEFAULT_MOUSE_TRAIL_CONFIG,
  getMouseTrailConfig,
  saveMouseTrailConfig,
  sanitizeHttpImageUrlForTrail,
  type MouseTrailStoredConfig,
  type MouseTrailMode,
} from '../../../utils/mouseTrailStorage';
import './index.css';

const { Paragraph, Text } = Typography;

const CLIP_PRESETS: { label: string; value: string }[] = [
  { label: '圆形', value: 'circle(50% at 50% 50%)' },
  { label: '圆角矩形', value: 'inset(5% round 30%)' },
  { label: '菱形', value: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { label: '三角形', value: 'polygon(50% 0%, 100% 100%, 0% 100%)' },
  { label: '星形感', value: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
  { label: '六边形', value: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)' },
  { label: '十字', value: 'polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)' },
  { label: '心形', value: 'polygon(50% 100%, 0% 60%, 0% 30%, 15% 10%, 35% 5%, 50% 20%, 65% 5%, 85% 10%, 100% 30%, 100% 60%)' },
  { label: '箭头', value: 'polygon(50% 0%, 100% 40%, 75% 40%, 75% 100%, 25% 100%, 25% 40%, 0% 40%)' },
  { label: '椭圆', value: 'ellipse(50% 35% at 50% 50%)' },
];

/* ─── 效果预设（一键组合 clip-path + background + 尺寸） ─── */
interface EffectPreset {
  label: string;
  emoji: string;
  clipPath: string;
  background: string;
  trailSize: number;
  particleCount: number;
  lerpFactor: number;
}

const EFFECT_PRESETS: EffectPreset[] = [
  {
    label: '霓虹光点',
    emoji: '✨',
    clipPath: 'circle(50% at 50% 50%)',
    background: 'radial-gradient(circle, #ff00ff, #00ffff, transparent)',
    trailSize: 14,
    particleCount: 25,
    lerpFactor: 0.15,
  },
  {
    label: '火焰尾迹',
    emoji: '🔥',
    clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
    background: 'linear-gradient(180deg, #ff4500, #ff8c00, #ffd700)',
    trailSize: 16,
    particleCount: 30,
    lerpFactor: 0.2,
  },
  {
    label: '冰晶散射',
    emoji: '❄️',
    clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
    background: 'linear-gradient(135deg, #e0f7fa, #80deea, #4dd0e1)',
    trailSize: 12,
    particleCount: 20,
    lerpFactor: 0.12,
  },
  {
    label: '星空流光',
    emoji: '🌌',
    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    background: 'linear-gradient(45deg, #1a237e, #7c4dff, #e040fb)',
    trailSize: 18,
    particleCount: 15,
    lerpFactor: 0.1,
  },
  {
    label: '樱花飘落',
    emoji: '🌸',
    clipPath: 'polygon(50% 100%, 0% 60%, 0% 30%, 15% 10%, 35% 5%, 50% 20%, 65% 5%, 85% 10%, 100% 30%, 100% 60%)',
    background: 'radial-gradient(circle, #ffb7c5, #ff69b4, #ff1493)',
    trailSize: 14,
    particleCount: 20,
    lerpFactor: 0.08,
  },
  {
    label: '极光彩带',
    emoji: '🌈',
    clipPath: 'inset(5% round 30%)',
    background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)',
    trailSize: 20,
    particleCount: 35,
    lerpFactor: 0.18,
  },
  {
    label: '金属碎片',
    emoji: '⚡',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    background: 'linear-gradient(135deg, #37474f, #78909c, #cfd8dc, #78909c)',
    trailSize: 10,
    particleCount: 40,
    lerpFactor: 0.25,
  },
  {
    label: '薄荷清爽',
    emoji: '🍃',
    clipPath: 'ellipse(50% 35% at 50% 50%)',
    background: 'linear-gradient(135deg, #a5d6a7, #66bb6a, #2e7d32)',
    trailSize: 16,
    particleCount: 18,
    lerpFactor: 0.12,
  },
];

const MAX_IMAGE_BYTES = 1.8 * 1024 * 1024;

const MouseTrail: React.FC = () => {
  const [config, setConfig] = useState<MouseTrailStoredConfig>(DEFAULT_MOUSE_TRAIL_CONFIG);
  const configRef = useRef(config);
  configRef.current = config;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remoteUrlDraft, setRemoteUrlDraft] = useState('');

  useEffect(() => {
    let canceled = false;
    void getMouseTrailConfig().then((c) => {
      if (!canceled) {
        setConfig(c);
        setRemoteUrlDraft(c.imageRemoteUrl ?? '');
        setLoading(false);
      }
    });
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    setRemoteUrlDraft(config.imageRemoteUrl ?? '');
  }, [config.imageRemoteUrl]);

  const persist = useCallback(async (next: MouseTrailStoredConfig) => {
    setSaving(true);
    try {
      await saveMouseTrailConfig(next);
      configRef.current = next;
      setConfig(next);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败，图片可能过大或超出存储配额');
    } finally {
      setSaving(false);
    }
  }, []);

  const patch = useCallback(
    (partial: Partial<MouseTrailStoredConfig>) => {
      const next = { ...configRef.current, ...partial };
      void persist(next);
    },
    [persist]
  );

  const onPickImage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !file.type.startsWith('image/')) {
        if (file) message.warning('请选择图片文件');
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        message.warning('图片建议小于约 1.8MB，否则可能无法写入扩展存储');
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl.startsWith('data:')) {
          message.error('读取图片失败');
          return;
        }
        patch({ mode: 'image', imageDataUrl: dataUrl, imageRemoteUrl: null });
      };
      reader.onerror = () => message.error('读取图片失败');
      reader.readAsDataURL(file);
    },
    [patch]
  );

  const clearImage = useCallback(() => {
    setRemoteUrlDraft('');
    patch({ imageDataUrl: null, imageRemoteUrl: null, mode: 'css' });
  }, [patch]);

  const applyRemoteImageUrl = useCallback(() => {
    const sanitized = sanitizeHttpImageUrlForTrail(remoteUrlDraft);
    if (!sanitized) {
      message.warning('请输入以 http:// 或 https:// 开头的图片地址');
      return;
    }
    patch({ mode: 'image', imageRemoteUrl: sanitized, imageDataUrl: null });
    setRemoteUrlDraft(sanitized);
  }, [patch, remoteUrlDraft]);

  if (loading) {
    return (
      <div className="mouse-trail-panel">
        <Text type="secondary">加载中…</Text>
      </div>
    );
  }

  return (
    <div className="mouse-trail-panel">
      <Card size="small" title="自定义鼠标拖尾" className="mouse-trail-card">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="mouse-trail-row">
            <Text>启用拖尾</Text>
            <Switch
              checked={config.enabled}
              loading={saving}
              onChange={(enabled) => patch({ enabled })}
            />
          </div>
          <div className="mouse-trail-row">
            <div>
              <Text>应用到全部页面</Text>
              <Paragraph type="secondary" className="mouse-trail-hint">
                开启后，在任意普通网页上也会显示拖尾（扩展弹窗、侧栏等始终可显示，仅受「启用」控制）。
              </Paragraph>
            </div>
            <Switch
              checked={config.applyGlobally}
              disabled={!config.enabled}
              loading={saving}
              onChange={(applyGlobally) => patch({ applyGlobally })}
            />
          </div>

          <div>
            <Text strong>拖尾类型</Text>
            <Radio.Group
              className="mouse-trail-radio"
              value={config.mode}
              disabled={!config.enabled}
              onChange={(ev) => patch({ mode: ev.target.value as MouseTrailMode })}
            >
              <Radio.Button value="css">CSS 形状 + 背景</Radio.Button>
              <Radio.Button value="image">图片</Radio.Button>
            </Radio.Group>
          </div>

          {config.mode === 'css' && (
            <>
              <div>
                <Text strong>效果预设</Text>
                <Paragraph type="secondary" className="mouse-trail-hint">
                  一键应用预设效果组合（clip-path + 背景色 + 参数），也可在下方单独调整。
                </Paragraph>
                <div className="mouse-trail-presets" style={{ flexWrap: 'wrap' }}>
                  {EFFECT_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      size="small"
                      type="text"
                      disabled={!config.enabled}
                      onClick={() => patch({
                        followTheme: false,
                        clipPath: preset.clipPath,
                        background: preset.background,
                        trailSize: preset.trailSize,
                        particleCount: preset.particleCount,
                        lerpFactor: preset.lerpFactor,
                      })}
                    >
                      {preset.emoji} {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="mouse-trail-row">
                <div>
                  <Text strong>跟随主题渐变</Text>
                  <Paragraph type="secondary" className="mouse-trail-hint">
                    自动使用当前主题的强调色渐变，切换主题时实时同步。
                  </Paragraph>
                </div>
                <Switch
                  checked={config.followTheme}
                  disabled={!config.enabled}
                  loading={saving}
                  onChange={(followTheme) => patch({ followTheme })}
                />
              </div>
              <div>
                <Text strong>clip-path 预设</Text>
                <div className="mouse-trail-presets">
                  {CLIP_PRESETS.map((p) => (
                    <Button
                      key={p.value}
                      size="small"
                      type="text"
                      disabled={!config.enabled}
                      onClick={() => patch({ clipPath: p.value })}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <Text type="secondary" className="mouse-trail-hint">
                  可在下方输入任意合法 CSS clip-path。
                </Text>
              </div>
              <div>
                <Text strong>clip-path</Text>
                <Input
                  disabled={!config.enabled}
                  value={config.clipPath}
                  onChange={(ev) => setConfig((p) => ({ ...p, clipPath: ev.target.value }))}
                  onBlur={(ev) => patch({ clipPath: ev.target.value })}
                  placeholder="例如 circle(50% at 50% 50%)"
                />
              </div>
              <div>
                <Text strong>background</Text>
                <Input
                  disabled={!config.enabled || config.followTheme}
                  value={config.background}
                  onChange={(ev) => setConfig((p) => ({ ...p, background: ev.target.value }))}
                  onBlur={(ev) => patch({ background: ev.target.value })}
                  placeholder="颜色、linear-gradient、radial-gradient 等"
                />
                {config.followTheme && (
                  <Text type="secondary" className="mouse-trail-hint">
                    已跟随主题渐变，关闭上方开关后可自定义
                  </Text>
                )}
              </div>
              <div className="mouse-trail-inline">
                <Text strong>拖尾块尺寸（px）</Text>
                <InputNumber
                  min={4}
                  max={128}
                  disabled={!config.enabled}
                  value={config.trailSize}
                  onChange={(v) => {
                    if (typeof v === 'number') patch({ trailSize: v });
                  }}
                />
              </div>
            </>
          )}

          {config.mode === 'image' && (
            <>
              <div className="mouse-trail-file-row">
                <input
                  type="file"
                  accept="image/*"
                  disabled={!config.enabled}
                  className="mouse-trail-file"
                  onChange={onPickImage}
                />
                <Button
                  size="small"
                  disabled={!config.enabled || (!config.imageDataUrl && !config.imageRemoteUrl)}
                  onClick={clearImage}
                >
                  清除图片
                </Button>
              </div>
              <div>
                <Text strong>图片链接</Text>
                <Paragraph type="secondary" className="mouse-trail-hint" style={{ marginBottom: 8 }}>
                  支持 http(s) 直链；与本地文件二选一，保存本地文件时会覆盖链接。
                </Paragraph>
                <Space.Compact style={{ width: '100%', maxWidth: 560 }}>
                  <Input
                    disabled={!config.enabled}
                    placeholder="https://example.com/image.png"
                    value={remoteUrlDraft}
                    onChange={(e) => setRemoteUrlDraft(e.target.value)}
                    onPressEnter={applyRemoteImageUrl}
                  />
                  <Button type="primary" disabled={!config.enabled} onClick={applyRemoteImageUrl}>
                    使用链接
                  </Button>
                </Space.Compact>
              </div>
              {!config.imageDataUrl && !config.imageRemoteUrl && (
                <Text type="secondary">请选择本地文件或填写图片链接作为拖尾图案。</Text>
              )}
              <div className="mouse-trail-row">
                <div>
                  <Text strong>GIF 性能保护</Text>
                  <Paragraph type="secondary" className="mouse-trail-hint" style={{ marginBottom: 0 }}>
                    拖尾节数高且 GIF 帧多时自动降采样（约每 2 帧绘 1 帧），减少快速移动时卡住。
                  </Paragraph>
                </div>
                <Switch
                  checked={config.gifPerfGuardEnabled}
                  disabled={!config.enabled}
                  loading={saving}
                  onChange={(gifPerfGuardEnabled) => patch({ gifPerfGuardEnabled })}
                />
              </div>
              <div className="mouse-trail-inline">
                <Text strong>宽度（px）</Text>
                <InputNumber
                  min={8}
                  max={256}
                  disabled={!config.enabled}
                  value={config.imageWidth}
                  onChange={(v) => patch({ imageWidth: typeof v === 'number' ? v : config.imageWidth })}
                />
                <Text strong>高度（px）</Text>
                <InputNumber
                  min={8}
                  max={256}
                  disabled={!config.enabled}
                  value={config.imageHeight}
                  onChange={(v) => patch({ imageHeight: typeof v === 'number' ? v : config.imageHeight })}
                />
              </div>
            </>
          )}

          <div>
            <Text strong>拖尾节数：{config.particleCount}</Text>
            <Slider
              min={1}
              max={50}
              disabled={!config.enabled}
              value={config.particleCount}
              onChange={(particleCount) => setConfig((p) => ({ ...p, particleCount }))}
              onAfterChange={(particleCount) => patch({ particleCount })}
            />
          </div>
          <div>
            <Text strong>跟随灵敏度：{config.lerpFactor.toFixed(2)}</Text>
            <Slider
              min={0.05}
              max={0.95}
              step={0.01}
              disabled={!config.enabled}
              value={config.lerpFactor}
              onChange={(lerpFactor) => setConfig((p) => ({ ...p, lerpFactor }))}
              onAfterChange={(lerpFactor) => patch({ lerpFactor })}
            />
            <Text type="secondary" className="mouse-trail-hint">
              数值越大，拖尾越紧贴光标。
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default MouseTrail;
