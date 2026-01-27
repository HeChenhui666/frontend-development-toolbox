import React, { useState, useMemo, useCallback } from 'react';
import { Select } from 'antd';
import JSONParser from './JSONParser';
import JSONCompare from './JSONCompare';
import JSONSchemaGenerator from './JSONSchemaGenerator';
import JSONToTypeScript from './JSONToTypeScript';
import JSONToCSV from './JSONToCSV';
import CompatibilityWarning from '../CompatibilityWarning';
import { useCompatibility } from '../../hooks/useCompatibility';
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
  const { isCompatible } = useCompatibility({
    featureName: 'JSON工具',
    requiredFeatures: ['JSON'],
    checkTypes: ['json', 'basic'],
  });

  // 使用 useMemo 缓存渲染内容，避免每次渲染重新创建组件
  const renderContent = useMemo(() => {
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
  }, [activeSubTab]);

  // 使用 useCallback 优化 onChange 处理函数
  const handleSubTabChange = useCallback((value: JSONSubTab) => {
    setActiveSubTab(value);
  }, []);

  const selectedOption = useMemo(() => 
    TOOL_OPTIONS.find(opt => opt.value === activeSubTab),
    [activeSubTab]
  );

  return (
    <div className="json-tools">
      {!isCompatible && (
        <CompatibilityWarning
          featureName="JSON工具"
          requiredFeatures={['JSON']}
        />
      )}
      <div className="tool-selector">
        <Select
          value={activeSubTab}
          onChange={handleSubTabChange}
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
        {renderContent}
      </div>
    </div>
  );
};

export default JSONTools;

