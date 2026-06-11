import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Input,
  InputNumber,
  Segmented,
  message as antdMessage,
} from 'antd';
import {
  CopyOutlined,
  PlusOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../../utils/message';

const { Text } = Typography;

interface GradientStop {
  id: string;
  color: string;
  position: number;
}

const GradientGenerator: React.FC = () => {
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState<number>(0);
  const [stops, setStops] = useState<GradientStop[]>([
    { id: '1', color: '#22c1c3', position: 0 },
    { id: '2', color: '#fdbb2d', position: 100 },
  ]);
  const [selectedStopId, setSelectedStopId] = useState<string>('2');
  const [selectedColor, setSelectedColor] = useState<string>('#fdbb2d');
  const [hue, setHue] = useState<number>(45);
  const [saturation, setSaturation] = useState<number>(100);
  const [lightness, setLightness] = useState<number>(60);
  const [alpha, setAlpha] = useState<number>(100);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const selectedStop = stops.find(s => s.id === selectedStopId) || stops[0];
  const isUpdatingFromStopRef = useRef(false);

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
    const primary = normalizeHexColor(getThemeColor('--theme-primary', '#22c1c3'), '#22c1c3');
    const accent = normalizeHexColor(getThemeColor('--theme-primaryGradientEnd', '#fdbb2d'), '#fdbb2d');
    setStops([
      { id: '1', color: primary, position: 0 },
      { id: '2', color: accent, position: 100 },
    ]);
    setSelectedStopId('2');
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

  // 更新选中停止点的颜色（只在selectedStopId变化时）
  useEffect(() => {
    const stop = stops.find(s => s.id === selectedStopId);
    if (stop) {
      isUpdatingFromStopRef.current = true;
      setSelectedColor(stop.color);
      const hsl = hexToHsl(stop.color);
      if (hsl) {
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
        const alphaValue = getAlphaFromHex(stop.color);
        setAlpha(alphaValue);
      }
      // 使用 requestAnimationFrame 确保在下一个渲染周期重置标志
      requestAnimationFrame(() => {
        isUpdatingFromStopRef.current = false;
      });
    }
  }, [selectedStopId]);

  // 颜色变化时更新停止点（排除从停止点加载时）
  useEffect(() => {
    if (!isUpdatingFromStopRef.current && selectedStopId) {
      const hex = hslToHex(hue, saturation, lightness, alpha);
      // 只有当转换后的颜色与当前停止点颜色不同时才更新
      const currentStop = stops.find(s => s.id === selectedStopId);
      if (currentStop && currentStop.color !== hex) {
        setSelectedColor(hex);
        updateStopColor(selectedStopId, hex);
      }
    }
  }, [hue, saturation, lightness, alpha, selectedStopId]);

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
  const hslToHex = (h: number, s: number, l: number, alpha: number): string => {
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
    
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    
    if (alpha < 100) {
      const alphaHex = Math.round((alpha / 100) * 255).toString(16).padStart(2, '0');
      return `${hex}${alphaHex}`;
    }
    return hex;
  };

  // 从HEX获取Alpha值
  const getAlphaFromHex = (hex: string): number => {
    if (hex.length === 9) {
      return Math.round((parseInt(hex.slice(7, 9), 16) / 255) * 100);
    }
    return 100;
  };

  // HEX转RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number; a: number } => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = hex.length === 9 ? Math.round((parseInt(hex.slice(7, 9), 16) / 255) * 100) : 100;
    return { r, g, b, a };
  };

  // 更新停止点颜色
  const updateStopColor = (id: string, color: string) => {
    setStops(prevStops => prevStops.map(stop => stop.id === id ? { ...stop, color } : stop));
  };

  // 更新停止点位置
  const updateStopPosition = (id: string, position: number) => {
    setStops(stops.map(stop => stop.id === id ? { ...stop, position: Math.max(0, Math.min(100, position)) } : stop));
  };

  // 添加停止点
  const addStop = () => {
    const newId = Date.now().toString();
    // 使用当前选中停止点的颜色作为新停止点的初始颜色
    const currentStop = stops.find(s => s.id === selectedStopId);
    const fallbackStopColor =
      getComputedStyle(document.documentElement).getPropertyValue('--theme-onPrimary').trim() || '#ffffff';
    const newStop: GradientStop = {
      id: newId,
      color: currentStop ? currentStop.color : fallbackStopColor,
      position: 50,
    };
    const newStops = [...stops, newStop].sort((a, b) => a.position - b.position);
    setStops(newStops);
    // 确保在stops更新后再设置selectedStopId，让useEffect能正确加载颜色
    setTimeout(() => {
      setSelectedStopId(newId);
    }, 0);
  };

  // 删除停止点
  const removeStop = (id: string) => {
    if (stops.length > 2) {
      const newStops = stops.filter(s => s.id !== id);
      setStops(newStops);
      if (selectedStopId === id) {
        setSelectedStopId(newStops[0].id);
      }
    }
  };

  // 生成CSS
  const generateCSS = (): string => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
    
    if (gradientType === 'linear') {
      return `linear-gradient(${angle}deg, ${stopString})`;
    } else {
      return `radial-gradient(circle, ${stopString})`;
    }
  };

  // 复制CSS
  const copyCSS = () => {
    navigator.clipboard.writeText(`background: ${generateCSS()};`);
    antdMessage.success('CSS已复制到剪贴板');
  };

  // 处理滑块拖动
  const handleSliderMouseDown = (e: React.MouseEvent, stopId: string) => {
    setIsDragging(true);
    const slider = e.currentTarget.parentElement;
    if (!slider) return;

    const updatePosition = (clientX: number) => {
      const rect = slider.getBoundingClientRect();
      const percent = ((clientX - rect.left) / rect.width) * 100;
      updateStopPosition(stopId, Math.max(0, Math.min(100, percent)));
    };

    updatePosition(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const rgb = hexToRgb(selectedColor);
  const cssCode = generateCSS();

  return (
    <Card className="gradient-generator" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      {/* 主预览区域 */}
      <Card size="small" title="渐变预览">
        <div 
          style={{ 
            width: '100%', 
            height: '120px', 
            background: cssCode,
            borderRadius: '4px',
            border: '1px solid var(--theme-borderLight, #d9d9d9)'
          }}
        />
      </Card>

      {/* 渐变滑块 */}
      <Card size="small" title="渐变滑块">
        <div className="gradient-slider-container">
          <div 
            className="gradient-slider"
            style={{ 
              background: `linear-gradient(to right, ${stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
            }}
          >
            {stops.map(stop => (
              <div
                key={stop.id}
                className={`gradient-stop-marker ${selectedStopId === stop.id ? 'selected' : ''}`}
                style={{ left: `${stop.position}%` }}
                onClick={() => setSelectedStopId(stop.id)}
                onMouseDown={(e) => handleSliderMouseDown(e, stop.id)}
              >
                <div 
                  className="stop-color-preview"
                  style={{ backgroundColor: stop.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 颜色选择器 */}
      <Card size="small" title="颜色选择器">
        <div className="color-picker-main">
          <div 
            ref={colorPickerRef}
            className="color-picker-square"
            style={{
              background: `linear-gradient(to top, 
                hsl(${hue}, 100%, 0%), 
                hsl(${hue}, 100%, 50%)),
                linear-gradient(to right, 
                hsl(${hue}, 100%, 50%), 
                hsl(${hue}, 0%, 50%))`
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              
              // X轴控制饱和度，Y轴控制亮度
              const newSaturation = Math.max(0, Math.min(100, x));
              const newLightness = Math.max(0, Math.min(100, 100 - y));
              
              setSaturation(newSaturation);
              setLightness(newLightness);
            }}
            onMouseMove={(e) => {
              if (e.buttons === 1) { // 鼠标按下时拖动
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                const newSaturation = Math.max(0, Math.min(100, x));
                const newLightness = Math.max(0, Math.min(100, 100 - y));
                
                setSaturation(newSaturation);
                setLightness(newLightness);
              }
            }}
          />
          
          <div className="color-code-section">
            <Text strong>COLOR CODE</Text>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Space.Compact style={{ width: '100%' }}>
                <Text strong>HEX:</Text>
                <Input
                  value={selectedColor}
                  onChange={(e) => {
                    const hex = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
                      setSelectedColor(hex);
                      const hsl = hexToHsl(hex);
                      if (hsl) {
                        setHue(hsl.h);
                        setSaturation(hsl.s);
                        setLightness(hsl.l);
                        setAlpha(getAlphaFromHex(hex));
                      }
                    }
                  }}
                  style={{ fontFamily: 'monospace', flex: 1 }}
                />
              </Space.Compact>
              <Space>
                <Text>R: <Text strong>{rgb.r}</Text></Text>
                <Text>G: <Text strong>{rgb.g}</Text></Text>
                <Text>B: <Text strong>{rgb.b}</Text></Text>
                <Text>A: <Text strong>{rgb.a}</Text></Text>
              </Space>
            </Space>

            {/* 色相滑块 */}
            <div className="slider-control">
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="hue-slider"
                style={{
                  background: `linear-gradient(to right, 
                    hsl(0, 100%, 50%), 
                    hsl(60, 100%, 50%), 
                    hsl(120, 100%, 50%), 
                    hsl(180, 100%, 50%), 
                    hsl(240, 100%, 50%), 
                    hsl(300, 100%, 50%), 
                    hsl(360, 100%, 50%))`
                }}
              />
            </div>

            {/* 透明度滑块 */}
            <div className="slider-control">
              <input
                type="range"
                min="0"
                max="100"
                value={alpha}
                onChange={(e) => setAlpha(Number(e.target.value))}
                className="alpha-slider"
                style={{
                  background: `linear-gradient(to right, 
                    ${selectedColor}00, 
                    ${selectedColor})`
                }}
              />
            </div>
          </div>
        </div>

        {/* 停止点列表 */}
        <Card size="small" title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>停止点</Text>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={addStop}
            >
              添加
            </Button>
          </Space>
        }>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {stops.map(stop => (
              <Card 
                key={stop.id}
                size="small"
                style={{ 
                  border: selectedStopId === stop.id ? '2px solid var(--theme-primary)' : '1px solid var(--theme-borderLight, #d9d9d9)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedStopId(stop.id)}
              >
                <Space style={{ width: '100%' }}>
                  <div 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      backgroundColor: stop.color,
                      borderRadius: '4px',
                      border: '1px solid var(--theme-borderLight, #d9d9d9)'
                    }}
                  />
                  <Input
                    value={stop.color}
                    onChange={(e) => {
                      const hex = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
                        updateStopColor(stop.id, hex);
                        if (stop.id === selectedStopId) {
                          setSelectedColor(hex);
                          const hsl = hexToHsl(hex);
                          if (hsl) {
                            setHue(hsl.h);
                            setSaturation(hsl.s);
                            setLightness(hsl.l);
                            setAlpha(getAlphaFromHex(hex));
                          }
                        }
                      }
                    }}
                    style={{ fontFamily: 'monospace', flex: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <InputNumber
                    min={0}
                    max={100}
                    value={stop.position}
                    onChange={(value) => updateStopPosition(stop.id, value || 0)}
                    addonAfter="%"
                    style={{ width: '100px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {stops.length > 2 && (
                    <Button
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStop(stop.id);
                      }}
                    />
                  )}
                </Space>
              </Card>
            ))}
          </Space>
        </Card>
      </Card>

      {/* 控制选项 */}
      <Card size="small" title="渐变设置">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Segmented
            options={[
              { label: 'Linear', value: 'linear' },
              { label: 'Radial', value: 'radial' },
            ]}
            value={gradientType}
            onChange={(value) => setGradientType(value as 'linear' | 'radial')}
            block
          />
          {gradientType === 'linear' && (
            <InputNumber
              addonBefore="角度"
              addonAfter="°"
              min={0}
              max={360}
              value={angle}
              onChange={(value) => setAngle(value || 0)}
              style={{ width: '100%' }}
            />
          )}
        </Space>
      </Card>

      {/* CSS代码预览 */}
      <Card 
        size="small" 
        title="CSS代码"
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={copyCSS}
          >
            复制
          </Button>
        }
      >
        <Text code copyable style={{ wordBreak: 'break-all', display: 'block' }}>
          {cssCode}
        </Text>
      </Card>
    </Card>
  );
};

export default GradientGenerator;

