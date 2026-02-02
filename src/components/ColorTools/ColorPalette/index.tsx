import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  Select,
  message as antdMessage,
  Empty,
} from 'antd';
import {
  CopyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../utils/message';

const { Text } = Typography;

type PaletteType = 'complementary' | 'triadic' | 'analogous' | 'split' | 'square' | 'monochromatic';

interface ColorPalette {
  type: string;
  colors: string[];
}

const ColorPalette: React.FC = () => {
  const [baseColor, setBaseColor] = useState<string>('#667eea');
  const [paletteType, setPaletteType] = useState<PaletteType>('complementary');
  const [generatedPalette, setGeneratedPalette] = useState<ColorPalette | null>(null);

  const getThemeColor = (variableName: string, fallback: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallback;

  const normalizeHexColor = (value: string, fallback: string) => {
    const trimmed = value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
    if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
      return `#${trimmed.slice(1).split('').map((char) => char + char).join('')}`;
    }
    return fallback;
  };

  const applyThemeDefaults = () => {
    const primary = normalizeHexColor(getThemeColor('--theme-primary', baseColor), baseColor);
    setBaseColor(primary);
    setGeneratedPalette(null);
  };

  useEffect(() => {
    const handleThemeChange = () => applyThemeDefaults();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'app-theme') {
        handleThemeChange();
      }
    };

    applyThemeDefaults();
    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
      antdMessage.error('请输入有效的HEX颜色值');
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
    antdMessage.success('已复制到剪贴板');
  };

  // 复制所有颜色
  const copyAllColors = () => {
    if (generatedPalette) {
      const colorsText = generatedPalette.colors.join(', ');
      navigator.clipboard.writeText(colorsText);
      antdMessage.success('已复制所有颜色到剪贴板');
    }
  };

  return (
    <div className="color-palette" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      <Card size="small" title="配色设置">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <input
              type="color"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              style={{ width: '60px', height: '32px', border: '1px solid var(--theme-borderLight, #d9d9d9)', borderRadius: '4px', cursor: 'pointer' }}
            />
            <Input
              value={baseColor}
              onChange={(e) => {
                const value = e.target.value;
                setBaseColor(value);
              }}
              placeholder="#000000"
              style={{ flex: 1, fontFamily: 'monospace' }}
            />
          </Space.Compact>
          <Select
            value={paletteType}
            onChange={(value) => setPaletteType(value)}
            style={{ width: '100%' }}
            options={[
              { label: '互补色', value: 'complementary' },
              { label: '三元色', value: 'triadic' },
              { label: '类似色', value: 'analogous' },
              { label: '分裂互补色', value: 'split' },
              { label: '四色配色', value: 'square' },
              { label: '单色系', value: 'monochromatic' },
            ]}
          />
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={generatePalette}
            block
          >
            生成配色
          </Button>
        </Space>
      </Card>

      {generatedPalette ? (
        <Card 
          size="small" 
          title={`${generatedPalette.type}配色方案`}
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={copyAllColors}
            >
              复制全部
            </Button>
          }
        >
          <Space wrap style={{ width: '100%' }}>
            {generatedPalette.colors.map((color, index) => (
              <Card key={index} size="small" style={{ width: '120px' }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <div
                    style={{ 
                      width: '100%', 
                      height: '60px', 
                      backgroundColor: color,
                      borderRadius: '4px',
                      border: '1px solid var(--theme-borderLight, #d9d9d9)'
                    }}
                  />
                  <Text code style={{ fontSize: '12px', display: 'block', textAlign: 'center' }}>
                    {color}
                  </Text>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => copyColor(color)}
                    block
                  >
                    复制
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      ) : (
        <Card size="small">
          <Empty
            description="选择基础颜色和配色方案，然后点击'生成配色'按钮"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};

export default ColorPalette;

