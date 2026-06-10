import React, { useState, useMemo, useCallback } from 'react';
import { Select } from 'antd';
import ColorConverter from './ColorConverter';
import ColorPalette from './ColorPalette';
import GradientGenerator from './GradientGenerator';
import ContrastChecker from './ContrastChecker';
import ColorBlindSimulator from './ColorBlindSimulator';
import ShadowGenerator from './ShadowGenerator';
import './index.css';

type ColorToolTab = 'converter' | 'palette' | 'gradient' | 'contrast' | 'colorblind' | 'shadow';

interface ToolOption {
  value: ColorToolTab;
  label: string;
  icon: string;
}

const TOOL_OPTIONS: ToolOption[] = [
  { value: 'converter', label: '颜色转换器', icon: '🔄' },
  { value: 'palette', label: '颜色搭配', icon: '🎨' },
  { value: 'gradient', label: '渐变背景', icon: '🌈' },
  { value: 'contrast', label: '对比度检查', icon: '🔲' },
  { value: 'colorblind', label: '色盲模拟', icon: '👁️' },
  { value: 'shadow', label: 'CSS阴影', icon: '🌓' },
];

const ColorTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ColorToolTab>('converter');

  // 使用 useMemo 缓存渲染内容，避免每次渲染重新创建组件
  const renderContent = useMemo(() => {
    switch (activeTool) {
      case 'converter':
        return <ColorConverter />;
      case 'palette':
        return <ColorPalette />;
      case 'gradient':
        return <GradientGenerator />;
      case 'contrast':
        return <ContrastChecker />;
      case 'colorblind':
        return <ColorBlindSimulator />;
      case 'shadow':
        return <ShadowGenerator />;
      default:
        return <ColorConverter />;
    }
  }, [activeTool]);

  // 使用 useCallback 优化 onChange 处理函数
  const handleToolChange = useCallback((value: ColorToolTab) => {
    setActiveTool(value);
  }, []);

  return (
    <div className="color-tools">
      <div className="tool-selector">
        <Select
          value={activeTool}
          onChange={handleToolChange}
          style={{ width: '100%' }}
          size="small"
          className="color-tool-select"
        >
          {TOOL_OPTIONS.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              <span className="tool-option">
                <span className="tool-option-icon">{option.icon}</span>
                <span className="tool-option-label">{option.label}</span>
              </span>
            </Select.Option>
          ))}
        </Select>
      </div>
      <div className="sub-content">
        {renderContent}
      </div>
    </div>
  );
};

export default ColorTools;

