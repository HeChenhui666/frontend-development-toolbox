import React, { useState } from 'react';
import { Select } from 'antd';
import CSSSnippets from './CSSSnippets';
import CSSCompatibility from './CSSCompatibility';
import './index.css';

type CSSToolTab = 'snippets' | 'compatibility';

interface ToolOption {
  value: CSSToolTab;
  label: string;
  icon: string;
}

const TOOL_OPTIONS: ToolOption[] = [
  { value: 'snippets', label: 'CSS代码片段', icon: '📝' },
  { value: 'compatibility', label: '兼容性检测', icon: '🔍' },
];

const CSSTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<CSSToolTab>('snippets');

  const renderContent = () => {
    switch (activeTool) {
      case 'snippets':
        return <CSSSnippets />;
      case 'compatibility':
        return <CSSCompatibility />;
      default:
        return <CSSSnippets />;
    }
  };

  return (
    <div className="css-tools">
      <div className="tool-selector">
        <Select
          value={activeTool}
          onChange={(value) => setActiveTool(value as CSSToolTab)}
          style={{ width: '100%' }}
          size="small"
          className="css-tool-select"
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

export default CSSTools;

