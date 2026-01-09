import React, { useState } from 'react';
import { Select } from 'antd';
import JSONParser from './JSONParser';
import JSONCompare from './JSONCompare';
import JSONSchemaGenerator from './JSONSchemaGenerator';
import JSONToTypeScript from './JSONToTypeScript';
import JSONToCSV from './JSONToCSV';
import './index.css';

type JSONSubTab = 'parser' | 'compare' | 'schema' | 'typescript' | 'csv';

interface ToolOption {
  value: JSONSubTab;
  label: string;
  icon: string;
}

const TOOL_OPTIONS: ToolOption[] = [
  { value: 'parser', label: 'JSON解析', icon: '📝' },
  { value: 'compare', label: 'JSON比对', icon: '🔍' },
  { value: 'schema', label: 'Schema生成', icon: '📋' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'csv', label: '转CSV', icon: '📊' },
];

const JSONTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<JSONSubTab>('parser');

  const renderContent = () => {
    switch (activeSubTab) {
      case 'parser':
        return <JSONParser />;
      case 'compare':
        return <JSONCompare />;
      case 'schema':
        return <JSONSchemaGenerator />;
      case 'typescript':
        return <JSONToTypeScript />;
      case 'csv':
        return <JSONToCSV />;
      default:
        return <JSONParser />;
    }
  };

  const selectedOption = TOOL_OPTIONS.find(opt => opt.value === activeSubTab);

  return (
    <div className="json-tools">
      <div className="tool-selector">
        <Select
          value={activeSubTab}
          onChange={(value) => setActiveSubTab(value as JSONSubTab)}
          style={{ width: '100%' }}
          size="small"
          className="json-tool-select"
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

export default JSONTools;

