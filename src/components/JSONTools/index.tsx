import React, { useState } from 'react';
import JSONParser from './JSONParser';
import JSONCompare from './JSONCompare';
import './index.css';

type JSONSubTab = 'parser' | 'compare';

const JSONTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<JSONSubTab>('parser');

  return (
    <div className="json-tools">
      <div className="sub-tabs">
        <button
          className={`sub-tab ${activeSubTab === 'parser' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('parser')}
        >
          <span className="sub-tab-icon">📝</span>
          <span>JSON解析</span>
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('compare')}
        >
          <span className="sub-tab-icon">🔍</span>
          <span>JSON比对</span>
        </button>
      </div>
      <div className="sub-content">
        {activeSubTab === 'parser' ? <JSONParser /> : <JSONCompare />}
      </div>
    </div>
  );
};

export default JSONTools;

