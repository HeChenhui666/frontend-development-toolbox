import React, { useState, useEffect } from 'react';
import './index.css';
import { showMessage } from '../../../utils/message';

type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface RGBA extends RGB {
  a: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface HSLA extends HSL {
  a: number;
}

const ColorConverter: React.FC = () => {
  const [hex, setHex] = useState<string>('#667eea');
  const [rgb, setRgb] = useState<RGB>({ r: 102, g: 126, b: 234 });
  const [rgba, setRgba] = useState<RGBA>({ r: 102, g: 126, b: 234, a: 100 });
  const [hsl, setHsl] = useState<HSL>({ h: 250, s: 78, l: 66 });
  const [hsla, setHsla] = useState<HSLA>({ h: 250, s: 78, l: 66, a: 100 });
  const [updating, setUpdating] = useState<boolean>(false);

  // HEX转RGB
  const hexToRgb = (hex: string): RGB | null => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return null;
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return { r, g, b };
  };

  // RGB转HEX
  const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${[r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  };

  // RGB转HSL
  const rgbToHsl = (r: number, g: number, b: number): HSL => {
    r /= 255;
    g /= 255;
    b /= 255;
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
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  // HSL转RGB
  const hslToRgb = (h: number, s: number, l: number): RGB => {
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

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  // 从HEX更新所有格式
  const updateFromHex = (hexValue: string) => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexValue)) return;
    setUpdating(true);
    const rgbValue = hexToRgb(hexValue);
    if (rgbValue) {
      setRgb(rgbValue);
      setRgba({ ...rgbValue, a: rgba.a });
      const hslValue = rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b);
      setHsl(hslValue);
      setHsla({ ...hslValue, a: hsla.a });
    }
    setUpdating(false);
  };

  // 从RGB更新所有格式
  const updateFromRgb = (r: number, g: number, b: number) => {
    setUpdating(true);
    setRgb({ r, g, b });
    setRgba({ r, g, b, a: rgba.a });
    setHex(rgbToHex(r, g, b));
    const hslValue = rgbToHsl(r, g, b);
    setHsl(hslValue);
    setHsla({ ...hslValue, a: hsla.a });
    setUpdating(false);
  };

  // 从HSL更新所有格式
  const updateFromHsl = (h: number, s: number, l: number) => {
    setUpdating(true);
    setHsl({ h, s, l });
    setHsla({ h, s, l, a: hsla.a });
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    setRgba({ ...rgbValue, a: rgba.a });
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
    setUpdating(false);
  };

  // 从RGBA更新所有格式
  const updateFromRgba = (r: number, g: number, b: number, a: number) => {
    setUpdating(true);
    setRgba({ r, g, b, a });
    setRgb({ r, g, b });
    setHex(rgbToHex(r, g, b));
    const hslValue = rgbToHsl(r, g, b);
    setHsl(hslValue);
    setHsla({ ...hslValue, a });
    setUpdating(false);
  };

  // 从HSLA更新所有格式
  const updateFromHsla = (h: number, s: number, l: number, a: number) => {
    setUpdating(true);
    setHsla({ h, s, l, a });
    setHsl({ h, s, l });
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    setRgba({ ...rgbValue, a });
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
    setUpdating(false);
  };

  // 初始化
  useEffect(() => {
    updateFromHex(hex);
  }, []);

  // 复制颜色值
  const copyColor = (format: ColorFormat) => {
    let text = '';
    switch (format) {
      case 'hex':
        text = hex;
        break;
      case 'rgb':
        text = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        break;
      case 'rgba':
        text = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${(rgba.a / 100).toFixed(2)})`;
        break;
      case 'hsl':
        text = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        break;
      case 'hsla':
        text = `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${(hsla.a / 100).toFixed(2)})`;
        break;
    }
    navigator.clipboard.writeText(text);
    showMessage.success('已复制到剪贴板');
  };

  return (
    <div className="color-converter">
      {/* 颜色预览 */}
      <div className="color-preview-section">
        <div 
          className="color-preview"
          style={{ backgroundColor: hex }}
        />
        <div className="color-info">
          <div className="color-hex">{hex}</div>
          <div className="color-rgb">RGB({rgb.r}, {rgb.g}, {rgb.b})</div>
        </div>
      </div>

      {/* HEX */}
      <div className="color-format-section">
        <div className="format-header">
          <label>HEX</label>
          <button onClick={() => copyColor('hex')} className="copy-btn">📋 复制</button>
        </div>
        <input
          type="text"
          value={hex}
          onChange={(e) => {
            const value = e.target.value;
            setHex(value);
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
              updateFromHex(value);
            }
          }}
          className="color-input"
          placeholder="#000000"
        />
      </div>

      {/* RGB */}
      <div className="color-format-section">
        <div className="format-header">
          <label>RGB</label>
          <button onClick={() => copyColor('rgb')} className="copy-btn">📋 复制</button>
        </div>
        <div className="rgb-inputs">
          <div className="rgb-input-group">
            <label>R</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.r}
              onChange={(e) => {
                const r = Math.max(0, Math.min(255, Number(e.target.value)));
                updateFromRgb(r, rgb.g, rgb.b);
              }}
              className="color-number-input"
            />
          </div>
          <div className="rgb-input-group">
            <label>G</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.g}
              onChange={(e) => {
                const g = Math.max(0, Math.min(255, Number(e.target.value)));
                updateFromRgb(rgb.r, g, rgb.b);
              }}
              className="color-number-input"
            />
          </div>
          <div className="rgb-input-group">
            <label>B</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb.b}
              onChange={(e) => {
                const b = Math.max(0, Math.min(255, Number(e.target.value)));
                updateFromRgb(rgb.r, rgb.g, b);
              }}
              className="color-number-input"
            />
          </div>
        </div>
      </div>

      {/* RGBA */}
      <div className="color-format-section">
        <div className="format-header">
          <label>RGBA</label>
          <button onClick={() => copyColor('rgba')} className="copy-btn">📋 复制</button>
        </div>
        <div className="rgba-inputs">
          <div className="rgb-inputs">
            <div className="rgb-input-group">
              <label>R</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgba.r}
                onChange={(e) => {
                  const r = Math.max(0, Math.min(255, Number(e.target.value)));
                  updateFromRgba(r, rgba.g, rgba.b, rgba.a);
                }}
                className="color-number-input"
              />
            </div>
            <div className="rgb-input-group">
              <label>G</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgba.g}
                onChange={(e) => {
                  const g = Math.max(0, Math.min(255, Number(e.target.value)));
                  updateFromRgba(rgba.r, g, rgba.b, rgba.a);
                }}
                className="color-number-input"
              />
            </div>
            <div className="rgb-input-group">
              <label>B</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgba.b}
                onChange={(e) => {
                  const b = Math.max(0, Math.min(255, Number(e.target.value)));
                  updateFromRgba(rgba.r, rgba.g, b, rgba.a);
                }}
                className="color-number-input"
              />
            </div>
          </div>
          <div className="alpha-input-group">
            <label>A</label>
            <input
              type="number"
              min="0"
              max="100"
              value={rgba.a}
              onChange={(e) => {
                const a = Math.max(0, Math.min(100, Number(e.target.value)));
                updateFromRgba(rgba.r, rgba.g, rgba.b, a);
              }}
              className="color-number-input"
            />
            <span className="alpha-percent">%</span>
          </div>
        </div>
      </div>

      {/* HSL */}
      <div className="color-format-section">
        <div className="format-header">
          <label>HSL</label>
          <button onClick={() => copyColor('hsl')} className="copy-btn">📋 复制</button>
        </div>
        <div className="hsl-inputs">
          <div className="hsl-input-group">
            <label>H</label>
            <input
              type="number"
              min="0"
              max="360"
              value={hsl.h}
              onChange={(e) => {
                const h = Math.max(0, Math.min(360, Number(e.target.value)));
                updateFromHsl(h, hsl.s, hsl.l);
              }}
              className="color-number-input"
            />
          </div>
          <div className="hsl-input-group">
            <label>S</label>
            <input
              type="number"
              min="0"
              max="100"
              value={hsl.s}
              onChange={(e) => {
                const s = Math.max(0, Math.min(100, Number(e.target.value)));
                updateFromHsl(hsl.h, s, hsl.l);
              }}
              className="color-number-input"
            />
            <span>%</span>
          </div>
          <div className="hsl-input-group">
            <label>L</label>
            <input
              type="number"
              min="0"
              max="100"
              value={hsl.l}
              onChange={(e) => {
                const l = Math.max(0, Math.min(100, Number(e.target.value)));
                updateFromHsl(hsl.h, hsl.s, l);
              }}
              className="color-number-input"
            />
            <span>%</span>
          </div>
        </div>
      </div>

      {/* HSLA */}
      <div className="color-format-section">
        <div className="format-header">
          <label>HSLA</label>
          <button onClick={() => copyColor('hsla')} className="copy-btn">📋 复制</button>
        </div>
        <div className="hsla-inputs">
          <div className="hsl-inputs">
            <div className="hsl-input-group">
              <label>H</label>
              <input
                type="number"
                min="0"
                max="360"
                value={hsla.h}
                onChange={(e) => {
                  const h = Math.max(0, Math.min(360, Number(e.target.value)));
                  updateFromHsla(h, hsla.s, hsla.l, hsla.a);
                }}
                className="color-number-input"
              />
            </div>
            <div className="hsl-input-group">
              <label>S</label>
              <input
                type="number"
                min="0"
                max="100"
                value={hsla.s}
                onChange={(e) => {
                  const s = Math.max(0, Math.min(100, Number(e.target.value)));
                  updateFromHsla(hsla.h, s, hsla.l, hsla.a);
                }}
                className="color-number-input"
              />
              <span>%</span>
            </div>
            <div className="hsl-input-group">
              <label>L</label>
              <input
                type="number"
                min="0"
                max="100"
                value={hsla.l}
                onChange={(e) => {
                  const l = Math.max(0, Math.min(100, Number(e.target.value)));
                  updateFromHsla(hsla.h, hsla.s, l, hsla.a);
                }}
                className="color-number-input"
              />
              <span>%</span>
            </div>
          </div>
          <div className="alpha-input-group">
            <label>A</label>
            <input
              type="number"
              min="0"
              max="100"
              value={hsla.a}
              onChange={(e) => {
                const a = Math.max(0, Math.min(100, Number(e.target.value)));
                updateFromHsla(hsla.h, hsla.s, hsla.l, a);
              }}
              className="color-number-input"
            />
            <span className="alpha-percent">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorConverter;

