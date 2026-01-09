import React, { useState } from 'react';
import { Select } from 'antd';
import ColorConverter from './ColorConverter';
import ColorPalette from './ColorPalette';
import GradientGenerator from './GradientGenerator';
import './index.css';

type ColorToolTab = 'converter' | 'palette' | 'gradient';

interface ToolOption {
  value: ColorToolTab;
  label: string;
  icon: string;
}

const TOOL_OPTIONS: ToolOption[] = [
  { value: 'converter', label: '颜色转换器', icon: '🔄' },
  { value: 'palette', label: '颜色搭配', icon: '🎨' },
  { value: 'gradient', label: '渐变背景', icon: '🌈' },
];

const ColorTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ColorToolTab>('converter');

  const renderContent = () => {
    switch (activeTool) {
      case 'converter':
        return <ColorConverter />;
      case 'palette':
        return <ColorPalette />;
      case 'gradient':
        return <GradientGenerator />;
      default:
        return <ColorConverter />;
    }
  };

  return (
    <div className="color-tools">
      <div className="tool-selector">
        <Select
          value={activeTool}
          onChange={(value) => setActiveTool(value as ColorToolTab)}
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
        {renderContent()}
      </div>
    </div>
  );
};

export default ColorTools;

