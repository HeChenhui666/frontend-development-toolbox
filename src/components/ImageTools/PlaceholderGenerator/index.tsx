import React, { useState, useCallback, useRef, useEffect } from 'react';
import { InputNumber, Button, Space, Typography, ColorPicker, Input, message as antdMessage } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { DownloadOutlined, CopyOutlined, PictureOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

const colorToHex = (color: Color): string =>
  typeof color === 'string' ? color : color.toHexString();

const PRESET_SIZES = [
  { label: '头像 (80×80)', width: 80, height: 80 },
  { label: '缩略图 (150×150)', width: 150, height: 150 },
  { label: '卡片 (320×200)', width: 320, height: 200 },
  { label: '横幅 (728×90)', width: 728, height: 90 },
  { label: 'HD (1280×720)', width: 1280, height: 720 },
  { label: 'FHD (1920×1080)', width: 1920, height: 1080 },
  { label: 'OG Image (1200×630)', width: 1200, height: 630 },
  { label: 'App Icon (512×512)', width: 512, height: 512 },
];

const PlaceholderGenerator: React.FC = () => {
  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(200);
  const [bgColor, setBgColor] = useState('#CCCCCC');
  const [textColor, setTextColor] = useState('#666666');
  const [customText, setCustomText] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generatePlaceholder = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 文字
    const displayText = customText.trim() || `${width} × ${height}`;
    const fontSize = Math.max(12, Math.min(width, height) / 8);
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, width / 2, height / 2, width * 0.9);

    setPreviewUrl(canvas.toDataURL('image/png'));
  }, [width, height, bgColor, textColor, customText]);

  // 初始生成
  useEffect(() => {
    generatePlaceholder();
  }, [generatePlaceholder]);

  const downloadImage = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.download = `placeholder_${width}x${height}.png`;
    link.href = previewUrl;
    link.click();
  };

  const copyDataUrl = async () => {
    if (!previewUrl) return;
    try {
      await navigator.clipboard.writeText(previewUrl);
      antdMessage.success('Data URL 已复制');
    } catch {
      antdMessage.error('复制失败');
    }
  };

  const copyAsImgTag = async () => {
    const tag = `<img src="${previewUrl}" width="${width}" height="${height}" alt="placeholder" />`;
    try {
      await navigator.clipboard.writeText(tag);
      antdMessage.success('img 标签已复制');
    } catch {
      antdMessage.error('复制失败');
    }
  };

  const applyPreset = (preset: { width: number; height: number }) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  return (
    <div className="placeholder-generator">
      <div className="pg-presets">
        <Text style={{ fontSize: 11, fontWeight: 600 }}>预设尺寸</Text>
        <div className="pg-preset-tags">
          {PRESET_SIZES.map((preset) => (
            <span
              key={preset.label}
              className={`pg-preset-tag ${width === preset.width && height === preset.height ? 'active' : ''}`}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </span>
          ))}
        </div>
      </div>

      <div className="pg-controls">
        <div className="pg-size-row">
          <div className="pg-size-item">
            <Text style={{ fontSize: 10 }}>宽</Text>
            <InputNumber value={width} onChange={(v) => setWidth(v || 100)} min={10} max={4096} size="small" style={{ width: 80 }} />
          </div>
          <Text style={{ fontSize: 14, color: 'var(--theme-textMuted)' }}>×</Text>
          <div className="pg-size-item">
            <Text style={{ fontSize: 10 }}>高</Text>
            <InputNumber value={height} onChange={(v) => setHeight(v || 100)} min={10} max={4096} size="small" style={{ width: 80 }} />
          </div>
        </div>

        <div className="pg-color-row">
          <div className="pg-color-item">
            <Text style={{ fontSize: 10 }}>背景色</Text>
            <ColorPicker value={bgColor} onChange={(c) => setBgColor(colorToHex(c))} size="small" />
          </div>
          <div className="pg-color-item">
            <Text style={{ fontSize: 10 }}>文字色</Text>
            <ColorPicker value={textColor} onChange={(c) => setTextColor(colorToHex(c))} size="small" />
          </div>
        </div>

        <div>
          <Text style={{ fontSize: 10 }}>自定义文字（留空显示尺寸）</Text>
          <Input
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder={`${width} × ${height}`}
            size="small"
          />
        </div>

        <Button type="primary" size="small" icon={<PictureOutlined />} onClick={generatePlaceholder} block>
          生成占位图
        </Button>
      </div>

      {/* 隐藏 canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {previewUrl && (
        <div className="pg-result">
          <div className="pg-preview">
            <img
              src={previewUrl}
              alt="placeholder preview"
              style={{
                maxWidth: '100%',
                maxHeight: 200,
                border: '1px solid var(--theme-border)',
                borderRadius: 4,
              }}
            />
          </div>
          <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)', textAlign: 'center' }}>
            {width} × {height} px
          </Text>
          <Space size={4} style={{ justifyContent: 'center' }}>
            <Button size="small" icon={<DownloadOutlined />} type="primary" onClick={downloadImage}>下载 PNG</Button>
            <Button size="small" icon={<CopyOutlined />} onClick={copyDataUrl}>复制 DataURL</Button>
            <Button size="small" onClick={copyAsImgTag}>复制 img 标签</Button>
          </Space>
        </div>
      )}
    </div>
  );
};

export default PlaceholderGenerator;
