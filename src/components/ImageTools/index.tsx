import React, { useState } from 'react';
import { Select } from 'antd';
import RandomImageGenerator from './RandomImageGenerator';
import Base64Encoder from './Base64Encoder';
import './index.css';

type ImageToolTab = 'random' | 'base64';

interface ToolOption {
  value: ImageToolTab;
  label: string;
  icon: string;
}

const TOOL_OPTIONS: ToolOption[] = [
  { value: 'random', label: '随机图片', icon: '🖼️' },
  { value: 'base64', label: 'Base64编码', icon: '🔐' },
];

const ImageTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ImageToolTab>('random');

  const renderContent = () => {
    switch (activeTool) {
      case 'random':
        return <RandomImageGenerator />;
      case 'base64':
        return <Base64Encoder />;
      default:
        return <RandomImageGenerator />;
    }
  };

  return (
    <div className="image-tools">
      <div className="tool-selector">
        <Select
          value={activeTool}
          onChange={(value) => setActiveTool(value as ImageToolTab)}
          style={{ width: '100%' }}
          size="small"
          className="image-tool-select"
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

export default ImageTools;

