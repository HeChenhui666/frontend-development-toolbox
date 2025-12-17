import React from 'react';

/**
 * 示例功能组件
 * 
 * 要添加新功能，请按以下步骤：
 * 1. 创建新的功能组件（如本文件）
 * 2. 在 App.tsx 的 features 数组中添加新配置
 * 3. 更新 FeatureTab 类型定义
 */
const ExampleFeature: React.FC = () => {
  return (
    <div className="feature-placeholder">
      <div className="placeholder-icon">✨</div>
      <h3>新功能示例</h3>
      <p>这里是新功能的界面</p>
      <p className="placeholder-hint">
        在 App.tsx 中取消注释对应的配置即可启用此功能
      </p>
    </div>
  );
};

export default ExampleFeature;

