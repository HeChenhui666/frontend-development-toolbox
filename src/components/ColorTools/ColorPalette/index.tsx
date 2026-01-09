import React, { useState } from 'react';
import './index.css';
import { showMessage } from '../../../utils/message';

type PaletteType = 'complementary' | 'triadic' | 'analogous' | 'split' | 'square' | 'monochromatic';

interface ColorPalette {
  type: string;
  colors: string[];
}

const ColorPalette: React.FC = () => {
  const [baseColor, setBaseColor] = useState<string>('#667eea');
  const [paletteType, setPaletteType] = useState<PaletteType>('complementary');
  const [generatedPalette, setGeneratedPalette] = useState<ColorPalette | null>(null);

  // HEX转HSL
  const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  // HSL转HEX
  const hslToHex = (h: number, s: number, l: number): string => {
    h = h % 360;
    s = s / 100;
    l = l / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // 生成配色方案
  const generatePalette = (): void => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(baseColor)) {
      showMessage.error('请输入有效的HEX颜色值');
      return;
    }

    const baseHsl = hexToHsl(baseColor);
    if (!baseHsl) return;

    let colors: string[] = [baseColor];

    switch (paletteType) {
      case 'complementary':
        // 互补色（180度）
        colors.push(hslToHex((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l));
        break;

      case 'triadic':
        // 三元色（120度间隔）
        colors.push(hslToHex((baseHsl.h + 120) % 360, baseHsl.s, baseHsl.l));
        colors.push(hslToHex((baseHsl.h + 240) % 360, baseHsl.s, baseHsl.l));
        break;

      case 'analogous':
        // 类似色（30度间隔）
        colors.push(hslToHex((baseHsl.h + 30) % 360, baseHsl.s, baseHsl.l));
        colors.push(hslToHex((baseHsl.h - 30 + 360) % 360, baseHsl.s, baseHsl.l));
        break;

      case 'split':
        // 分裂互补色（150度和210度）
        colors.push(hslToHex((baseHsl.h + 150) % 360, baseHsl.s, baseHsl.l));
        colors.push(hslToHex((baseHsl.h + 210) % 360, baseHsl.s, baseHsl.l));
        break;

      case 'square':
        // 四色配色（90度间隔）
        colors.push(hslToHex((baseHsl.h + 90) % 360, baseHsl.s, baseHsl.l));
        colors.push(hslToHex((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l));
        colors.push(hslToHex((baseHsl.h + 270) % 360, baseHsl.s, baseHsl.l));
        break;

      case 'monochromatic':
        // 单色系（不同亮度）
        colors.push(hslToHex(baseHsl.h, baseHsl.s, Math.max(0, baseHsl.l - 20)));
        colors.push(hslToHex(baseHsl.h, baseHsl.s, Math.min(100, baseHsl.l + 20)));
        colors.push(hslToHex(baseHsl.h, Math.max(0, baseHsl.s - 20), baseHsl.l));
        colors.push(hslToHex(baseHsl.h, Math.min(100, baseHsl.s + 20), baseHsl.l));
        break;
    }

    const typeNames: Record<PaletteType, string> = {
      complementary: '互补色',
      triadic: '三元色',
      analogous: '类似色',
      split: '分裂互补色',
      square: '四色配色',
      monochromatic: '单色系',
    };

    setGeneratedPalette({
      type: typeNames[paletteType],
      colors,
    });
  };

  // 复制颜色
  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    showMessage.success('已复制到剪贴板');
  };

  // 复制所有颜色
  const copyAllColors = () => {
    if (generatedPalette) {
      const colorsText = generatedPalette.colors.join(', ');
      navigator.clipboard.writeText(colorsText);
      showMessage.success('已复制所有颜色到剪贴板');
    }
  };

  return (
    <div className="color-palette">
      <div className="palette-controls">
        <div className="color-input-section">
          <label>基础颜色：</label>
          <div className="color-input-group">
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="color-picker-input"
            />
            <input
              type="text"
              value={baseColor}
              onChange={(e) => {
                const value = e.target.value;
                setBaseColor(value);
              }}
              className="color-text-input"
              placeholder="#000000"
            />
          </div>
        </div>

        <div className="palette-type-section">
          <label>配色方案：</label>
          <select
            value={paletteType}
            onChange={(e) => setPaletteType(e.target.value as PaletteType)}
            className="palette-type-select"
          >
            <option value="complementary">互补色</option>
            <option value="triadic">三元色</option>
            <option value="analogous">类似色</option>
            <option value="split">分裂互补色</option>
            <option value="square">四色配色</option>
            <option value="monochromatic">单色系</option>
          </select>
        </div>

        <button onClick={generatePalette} className="generate-btn">
          生成配色
        </button>
      </div>

      {generatedPalette && (
        <div className="palette-result">
          <div className="result-header">
            <span className="result-type">{generatedPalette.type}配色方案</span>
            <button onClick={copyAllColors} className="copy-all-btn">
              📋 复制全部
            </button>
          </div>
          <div className="color-swatches">
            {generatedPalette.colors.map((color, index) => (
              <div key={index} className="color-swatch">
                <div
                  className="swatch-preview"
                  style={{ backgroundColor: color }}
                />
                <div className="swatch-info">
                  <div className="swatch-hex">{color}</div>
                  <button
                    onClick={() => copyColor(color)}
                    className="swatch-copy-btn"
                  >
                    复制
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!generatedPalette && (
        <div className="palette-placeholder">
          <p>选择基础颜色和配色方案，然后点击"生成配色"按钮</p>
        </div>
      )}
    </div>
  );
};

export default ColorPalette;

