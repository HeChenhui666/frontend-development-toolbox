import React, { useState, useCallback, useMemo } from 'react';
import { Input, Button, Typography, ColorPicker, Tag, message as antdMessage } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { EyeOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

const colorToHex = (color: Color): string =>
  typeof color === 'string' ? color : color.toHexString();

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
};

const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const normalized = c / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (colorA: string, colorB: string): number => {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  if (!rgbA || !rgbB) return 0;
  const lumA = getLuminance(rgbA.r, rgbA.g, rgbA.b);
  const lumB = getLuminance(rgbB.r, rgbB.g, rgbB.b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
};

const getWCAGLevel = (ratio: number, isLargeText: boolean): { aa: boolean; aaa: boolean } => {
  if (isLargeText) return { aa: ratio >= 3, aaa: ratio >= 4.5 };
  return { aa: ratio >= 4.5, aaa: ratio >= 7 };
};

const ContrastChecker: React.FC = () => {
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#FFFFFF');
  const [eyeDropperSupported] = useState(() => typeof window !== 'undefined' && 'EyeDropper' in window);

  const ratio = useMemo(() => getContrastRatio(foreground, background), [foreground, background]);
  const normalLevel = useMemo(() => getWCAGLevel(ratio, false), [ratio]);
  const largeLevel = useMemo(() => getWCAGLevel(ratio, true), [ratio]);

  const pickColor = useCallback(async (target: 'fg' | 'bg') => {
    if (!eyeDropperSupported) { antdMessage.warning('当前浏览器不支持取色器'); return; }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (target === 'fg') setForeground(result.sRGBHex);
      else setBackground(result.sRGBHex);
    } catch {
      // 用户取消取色
    }
  }, [eyeDropperSupported]);

  const swapColors = () => {
    setForeground(background);
    setBackground(foreground);
  };

  return (
    <div className="contrast-checker">
      <div className="cc-color-row">
        <div className="cc-color-item">
          <Text style={{ fontSize: 11, fontWeight: 600 }}>前景色</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ColorPicker value={foreground} onChange={(c) => setForeground(colorToHex(c))} size="small" />
            <Input value={foreground} onChange={(e) => setForeground(e.target.value)} size="small" style={{ width: 90, fontFamily: 'monospace', fontSize: 11 }} />
            {eyeDropperSupported && (
              <Button size="small" icon={<EyeOutlined />} onClick={() => pickColor('fg')} title="从页面取色" />
            )}
          </div>
        </div>

        <Button size="small" onClick={swapColors} style={{ marginTop: 18 }}>⇄</Button>

        <div className="cc-color-item">
          <Text style={{ fontSize: 11, fontWeight: 600 }}>背景色</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ColorPicker value={background} onChange={(c) => setBackground(colorToHex(c))} size="small" />
            <Input value={background} onChange={(e) => setBackground(e.target.value)} size="small" style={{ width: 90, fontFamily: 'monospace', fontSize: 11 }} />
            {eyeDropperSupported && (
              <Button size="small" icon={<EyeOutlined />} onClick={() => pickColor('bg')} title="从页面取色" />
            )}
          </div>
        </div>
      </div>

      {/* 预览 */}
      <div className="cc-preview" style={{ backgroundColor: background, color: foreground, borderColor: foreground }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Aa 对比度预览</div>
        <div style={{ fontSize: 14 }}>The quick brown fox jumps over the lazy dog</div>
        <div style={{ fontSize: 11 }}>这是一段中文正文内容的预览效果 0123456789</div>
      </div>

      {/* 对比度结果 */}
      <div className="cc-result">
        <div className="cc-ratio">
          <span className="cc-ratio-value">{ratio.toFixed(2)}</span>
          <span className="cc-ratio-label">:1</span>
        </div>

        <div className="cc-wcag-grid">
          <div className="cc-wcag-item">
            <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>正常文本</Text>
            <div className="cc-wcag-tags">
              <Tag color={normalLevel.aa ? 'green' : 'red'}>AA {normalLevel.aa ? '✓' : '✗'}</Tag>
              <Tag color={normalLevel.aaa ? 'green' : 'red'}>AAA {normalLevel.aaa ? '✓' : '✗'}</Tag>
            </div>
            <Text style={{ fontSize: 9, color: 'var(--theme-textMuted)' }}>AA≥4.5 AAA≥7</Text>
          </div>
          <div className="cc-wcag-item">
            <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>大号文本 (≥18px/14px粗)</Text>
            <div className="cc-wcag-tags">
              <Tag color={largeLevel.aa ? 'green' : 'red'}>AA {largeLevel.aa ? '✓' : '✗'}</Tag>
              <Tag color={largeLevel.aaa ? 'green' : 'red'}>AAA {largeLevel.aaa ? '✓' : '✗'}</Tag>
            </div>
            <Text style={{ fontSize: 9, color: 'var(--theme-textMuted)' }}>AA≥3 AAA≥4.5</Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContrastChecker;
