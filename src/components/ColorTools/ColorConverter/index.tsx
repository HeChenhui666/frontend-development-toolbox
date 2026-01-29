import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  InputNumber,
  message as antdMessage,
} from 'antd';
import {
  CopyOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../utils/message';

const { Text } = Typography;

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
    antdMessage.success('已复制到剪贴板');
  };

  return (
    <div className="color-converter" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
      {/* 颜色预览 */}
      <Card size="small" title="颜色预览">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div 
            style={{ 
              width: '100%', 
              height: '80px', 
              backgroundColor: hex,
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}
          />
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text strong>{hex}</Text>
            <Text type="secondary">RGB({rgb.r}, {rgb.g}, {rgb.b})</Text>
          </Space>
        </Space>
      </Card>

      {/* HEX */}
      <Card 
        size="small" 
        title="HEX"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyColor('hex')}
          >
            复制
          </Button>
        }
      >
        <Input
          value={hex}
          onChange={(e) => {
            const value = e.target.value;
            setHex(value);
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
              updateFromHex(value);
            }
          }}
          placeholder="#000000"
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {/* RGB */}
      <Card 
        size="small" 
        title="RGB"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyColor('rgb')}
          >
            复制
          </Button>
        }
      >
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            addonBefore="R"
            min={0}
            max={255}
            value={rgb.r}
            onChange={(value) => {
              const r = Math.max(0, Math.min(255, value || 0));
              updateFromRgb(r, rgb.g, rgb.b);
            }}
            style={{ flex: 1 }}
          />
          <InputNumber
            addonBefore="G"
            min={0}
            max={255}
            value={rgb.g}
            onChange={(value) => {
              const g = Math.max(0, Math.min(255, value || 0));
              updateFromRgb(rgb.r, g, rgb.b);
            }}
            style={{ flex: 1 }}
          />
          <InputNumber
            addonBefore="B"
            min={0}
            max={255}
            value={rgb.b}
            onChange={(value) => {
              const b = Math.max(0, Math.min(255, value || 0));
              updateFromRgb(rgb.r, rgb.g, b);
            }}
            style={{ flex: 1 }}
          />
        </Space.Compact>
      </Card>

      {/* RGBA */}
      <Card 
        size="small" 
        title="RGBA"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyColor('rgba')}
          >
            复制
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space.Compact style={{ width: '100%' }}>
            <InputNumber
              addonBefore="R"
              min={0}
              max={255}
              value={rgba.r}
              onChange={(value) => {
                const r = Math.max(0, Math.min(255, value || 0));
                updateFromRgba(r, rgba.g, rgba.b, rgba.a);
              }}
              style={{ flex: 1 }}
            />
            <InputNumber
              addonBefore="G"
              min={0}
              max={255}
              value={rgba.g}
              onChange={(value) => {
                const g = Math.max(0, Math.min(255, value || 0));
                updateFromRgba(rgba.r, g, rgba.b, rgba.a);
              }}
              style={{ flex: 1 }}
            />
            <InputNumber
              addonBefore="B"
              min={0}
              max={255}
              value={rgba.b}
              onChange={(value) => {
                const b = Math.max(0, Math.min(255, value || 0));
                updateFromRgba(rgba.r, rgba.g, b, rgba.a);
              }}
              style={{ flex: 1 }}
            />
          </Space.Compact>
          <InputNumber
            addonBefore="A"
            addonAfter="%"
            min={0}
            max={100}
            value={rgba.a}
            onChange={(value) => {
              const a = Math.max(0, Math.min(100, value || 0));
              updateFromRgba(rgba.r, rgba.g, rgba.b, a);
            }}
            style={{ width: '100%' }}
          />
        </Space>
      </Card>

      {/* HSL */}
      <Card 
        size="small" 
        title="HSL"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyColor('hsl')}
          >
            复制
          </Button>
        }
      >
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            addonBefore="H"
            min={0}
            max={360}
            value={hsl.h}
            onChange={(value) => {
              const h = Math.max(0, Math.min(360, value || 0));
              updateFromHsl(h, hsl.s, hsl.l);
            }}
            style={{ flex: 1 }}
          />
          <InputNumber
            addonBefore="S"
            addonAfter="%"
            min={0}
            max={100}
            value={hsl.s}
            onChange={(value) => {
              const s = Math.max(0, Math.min(100, value || 0));
              updateFromHsl(hsl.h, s, hsl.l);
            }}
            style={{ flex: 1 }}
          />
          <InputNumber
            addonBefore="L"
            addonAfter="%"
            min={0}
            max={100}
            value={hsl.l}
            onChange={(value) => {
              const l = Math.max(0, Math.min(100, value || 0));
              updateFromHsl(hsl.h, hsl.s, l);
            }}
            style={{ flex: 1 }}
          />
        </Space.Compact>
      </Card>

      {/* HSLA */}
      <Card 
        size="small" 
        title="HSLA"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyColor('hsla')}
          >
            复制
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space.Compact style={{ width: '100%' }}>
            <InputNumber
              addonBefore="H"
              min={0}
              max={360}
              value={hsla.h}
              onChange={(value) => {
                const h = Math.max(0, Math.min(360, value || 0));
                updateFromHsla(h, hsla.s, hsla.l, hsla.a);
              }}
              style={{ flex: 1 }}
            />
            <InputNumber
              addonBefore="S"
              addonAfter="%"
              min={0}
              max={100}
              value={hsla.s}
              onChange={(value) => {
                const s = Math.max(0, Math.min(100, value || 0));
                updateFromHsla(hsla.h, s, hsla.l, hsla.a);
              }}
              style={{ flex: 1 }}
            />
            <InputNumber
              addonBefore="L"
              addonAfter="%"
              min={0}
              max={100}
              value={hsla.l}
              onChange={(value) => {
                const l = Math.max(0, Math.min(100, value || 0));
                updateFromHsla(hsla.h, hsla.s, l, hsla.a);
              }}
              style={{ flex: 1 }}
            />
          </Space.Compact>
          <InputNumber
            addonBefore="A"
            addonAfter="%"
            min={0}
            max={100}
            value={hsla.a}
            onChange={(value) => {
              const a = Math.max(0, Math.min(100, value || 0));
              updateFromHsla(hsla.h, hsla.s, hsla.l, a);
            }}
            style={{ width: '100%' }}
          />
        </Space>
      </Card>
    </div>
  );
};

export default ColorConverter;

