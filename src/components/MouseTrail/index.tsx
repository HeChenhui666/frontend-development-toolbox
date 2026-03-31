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
  type MouseTrailStoredConfig,
  type MouseTrailMode,
} from '../../utils/mouseTrailStorage';
import './index.css';

const { Paragraph, Text } = Typography;

const CLIP_PRESETS: { label: string; value: string }[] = [
  { label: '圆形', value: 'circle(50% at 50% 50%)' },
  { label: '圆角矩形', value: 'inset(5% round 30%)' },
  { label: '菱形', value: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
  { label: '三角形', value: 'polygon(50% 0%, 100% 100%, 0% 100%)' },
  { label: '星形感', value: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' },
];

const MAX_IMAGE_BYTES = 1.8 * 1024 * 1024;

const MouseTrail: React.FC = () => {
  const [config, setConfig] = useState<MouseTrailStoredConfig>(DEFAULT_MOUSE_TRAIL_CONFIG);
  const configRef = useRef(config);
  configRef.current = config;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let canceled = false;
    void getMouseTrailConfig().then((c) => {
      if (!canceled) {
        setConfig(c);
        setLoading(false);
      }
    });
    return () => {
      canceled = true;
    };
  }, []);

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
        patch({ mode: 'image', imageDataUrl: dataUrl });
      };
      reader.onerror = () => message.error('读取图片失败');
      reader.readAsDataURL(file);
    },
    [patch]
  );

  const clearImage = useCallback(() => {
    patch({ imageDataUrl: null, mode: 'css' });
  }, [patch]);

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
              <Radio.Button value="image">本地图片</Radio.Button>
            </Radio.Group>
          </div>

          {config.mode === 'css' && (
            <>
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
                  disabled={!config.enabled}
                  value={config.background}
                  onChange={(ev) => setConfig((p) => ({ ...p, background: ev.target.value }))}
                  onBlur={(ev) => patch({ background: ev.target.value })}
                  placeholder="颜色、linear-gradient、radial-gradient 等"
                />
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
                <Button size="small" disabled={!config.enabled || !config.imageDataUrl} onClick={clearImage}>
                  清除图片
                </Button>
              </div>
              {!config.imageDataUrl && (
                <Text type="secondary">请选择一张本地图片作为拖尾图案。</Text>
              )}
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
