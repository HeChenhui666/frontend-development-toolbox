import React, { useState, useMemo } from 'react';
import { Slider, Typography, ColorPicker, Button, Space, Switch, message as antdMessage } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { CopyOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

const colorToHex = (color: Color): string =>
  typeof color === 'string' ? color : color.toHexString();

const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface ShadowLayer {
  id: number;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

const createDefaultLayer = (id: number): ShadowLayer => ({
  id,
  offsetX: 0,
  offsetY: 4,
  blur: 12,
  spread: 0,
  color: '#000000',
  opacity: 0.15,
  inset: false,
});

const ShadowGenerator: React.FC = () => {
  const [layers, setLayers] = useState<ShadowLayer[]>([createDefaultLayer(1)]);
  const [shadowType, setShadowType] = useState<'box' | 'text'>('box');
  const [nextId, setNextId] = useState(2);

  const shadowCss = useMemo(() => {
    return layers
      .map((layer) => {
        const colorStr = hexToRgba(layer.color, layer.opacity);
        const insetStr = layer.inset ? 'inset ' : '';
        if (shadowType === 'text') {
          return `${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${colorStr}`;
        }
        return `${insetStr}${layer.offsetX}px ${layer.offsetY}px ${layer.blur}px ${layer.spread}px ${colorStr}`;
      })
      .join(',\n    ');
  }, [layers, shadowType]);

  const fullCssProperty = useMemo(() => {
    const property = shadowType === 'box' ? 'box-shadow' : 'text-shadow';
    return `${property}: ${shadowCss};`;
  }, [shadowCss, shadowType]);

  const updateLayer = (id: number, updates: Partial<ShadowLayer>) => {
    setLayers((prev) => prev.map((layer) => (layer.id === id ? { ...layer, ...updates } : layer)));
  };

  const addLayer = () => {
    if (layers.length >= 6) {
      antdMessage.warning('最多支持 6 层阴影');
      return;
    }
    setLayers((prev) => [...prev, createDefaultLayer(nextId)]);
    setNextId((prev) => prev + 1);
  };

  const removeLayer = (id: number) => {
    if (layers.length <= 1) {
      antdMessage.warning('至少保留一层阴影');
      return;
    }
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
  };

  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(fullCssProperty);
      antdMessage.success('CSS 已复制');
    } catch {
      antdMessage.error('复制失败');
    }
  };

  const applyPreset = (preset: ShadowLayer[]) => {
    setLayers(preset);
    setNextId(preset.length + 1);
  };

  const presets = [
    {
      name: '柔和',
      layers: [{ ...createDefaultLayer(1), offsetY: 2, blur: 8, opacity: 0.1 }],
    },
    {
      name: '悬浮',
      layers: [
        { ...createDefaultLayer(1), offsetY: 4, blur: 6, spread: -1, opacity: 0.1 },
        { ...createDefaultLayer(2), offsetY: 10, blur: 15, spread: -3, opacity: 0.1 },
      ],
    },
    {
      name: '深邃',
      layers: [
        { ...createDefaultLayer(1), offsetY: 1, blur: 3, opacity: 0.12 },
        { ...createDefaultLayer(2), offsetY: 4, blur: 6, opacity: 0.08 },
        { ...createDefaultLayer(3), offsetY: 12, blur: 24, spread: -4, opacity: 0.12 },
      ],
    },
    {
      name: '内凹',
      layers: [{ ...createDefaultLayer(1), offsetY: 2, blur: 4, spread: -1, inset: true, opacity: 0.2 }],
    },
    {
      name: '发光',
      layers: [{ ...createDefaultLayer(1), offsetX: 0, offsetY: 0, blur: 20, spread: 2, color: '#4096ff', opacity: 0.4 }],
    },
  ];

  return (
    <div className="shadow-generator">
      {/* 类型切换 + 预设 */}
      <div className="sg-toolbar">
        <Space size={4}>
          <Button size="small" type={shadowType === 'box' ? 'primary' : 'default'} onClick={() => setShadowType('box')}>
            box-shadow
          </Button>
          <Button size="small" type={shadowType === 'text' ? 'primary' : 'default'} onClick={() => setShadowType('text')}>
            text-shadow
          </Button>
        </Space>
        <div className="sg-presets">
          {presets.map((preset) => (
            <span key={preset.name} className="sg-preset-tag" onClick={() => applyPreset(preset.layers)}>
              {preset.name}
            </span>
          ))}
        </div>
      </div>

      {/* 预览区 */}
      <div className="sg-preview-area">
        {shadowType === 'box' ? (
          <div
            className="sg-preview-box"
            style={{ boxShadow: shadowCss }}
          >
            Box Shadow
          </div>
        ) : (
          <div
            className="sg-preview-text"
            style={{ textShadow: shadowCss }}
          >
            Text Shadow
          </div>
        )}
      </div>

      {/* 阴影层控制 */}
      {layers.map((layer, index) => (
        <div key={layer.id} className="sg-layer">
          <div className="sg-layer-header">
            <Text style={{ fontSize: 11, fontWeight: 600 }}>图层 {index + 1}</Text>
            <Space size={4}>
              {shadowType === 'box' && (
                <Space size={2}>
                  <Text style={{ fontSize: 10 }}>内阴影</Text>
                  <Switch
                    size="small"
                    checked={layer.inset}
                    onChange={(checked) => updateLayer(layer.id, { inset: checked })}
                  />
                </Space>
              )}
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeLayer(layer.id)}
                disabled={layers.length <= 1}
              />
            </Space>
          </div>

          <div className="sg-layer-controls">
            <div className="sg-control-row">
              <Text style={{ fontSize: 10, width: 50, flexShrink: 0 }}>X 偏移</Text>
              <Slider min={-50} max={50} value={layer.offsetX} onChange={(v) => updateLayer(layer.id, { offsetX: v })} style={{ flex: 1 }} />
              <Text style={{ fontSize: 10, width: 30, textAlign: 'right', fontFamily: 'monospace' }}>{layer.offsetX}</Text>
            </div>
            <div className="sg-control-row">
              <Text style={{ fontSize: 10, width: 50, flexShrink: 0 }}>Y 偏移</Text>
              <Slider min={-50} max={50} value={layer.offsetY} onChange={(v) => updateLayer(layer.id, { offsetY: v })} style={{ flex: 1 }} />
              <Text style={{ fontSize: 10, width: 30, textAlign: 'right', fontFamily: 'monospace' }}>{layer.offsetY}</Text>
            </div>
            <div className="sg-control-row">
              <Text style={{ fontSize: 10, width: 50, flexShrink: 0 }}>模糊</Text>
              <Slider min={0} max={100} value={layer.blur} onChange={(v) => updateLayer(layer.id, { blur: v })} style={{ flex: 1 }} />
              <Text style={{ fontSize: 10, width: 30, textAlign: 'right', fontFamily: 'monospace' }}>{layer.blur}</Text>
            </div>
            {shadowType === 'box' && (
              <div className="sg-control-row">
                <Text style={{ fontSize: 10, width: 50, flexShrink: 0 }}>扩展</Text>
                <Slider min={-30} max={30} value={layer.spread} onChange={(v) => updateLayer(layer.id, { spread: v })} style={{ flex: 1 }} />
                <Text style={{ fontSize: 10, width: 30, textAlign: 'right', fontFamily: 'monospace' }}>{layer.spread}</Text>
              </div>
            )}
            <div className="sg-control-row">
              <Text style={{ fontSize: 10, width: 50, flexShrink: 0 }}>透明度</Text>
              <Slider min={0} max={100} value={Math.round(layer.opacity * 100)} onChange={(v) => updateLayer(layer.id, { opacity: v / 100 })} style={{ flex: 1 }} />
              <Text style={{ fontSize: 10, width: 30, textAlign: 'right', fontFamily: 'monospace' }}>{Math.round(layer.opacity * 100)}%</Text>
            </div>
            <div className="sg-control-row">
              <Text style={{ fontSize: 10, width: 50, flexShrink: 0 }}>颜色</Text>
              <ColorPicker value={layer.color} onChange={(c) => updateLayer(layer.id, { color: colorToHex(c) })} size="small" />
              <Text style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--theme-textMuted)' }}>{layer.color}</Text>
            </div>
          </div>
        </div>
      ))}

      <Button size="small" icon={<PlusOutlined />} onClick={addLayer} block type="dashed">
        添加阴影层
      </Button>

      {/* CSS 输出 */}
      <div className="sg-css-output">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: 600 }}>CSS 代码</Text>
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={copyCss} />
        </div>
        <pre className="sg-css-code">{fullCssProperty}</pre>
      </div>
    </div>
  );
};

export default ShadowGenerator;
