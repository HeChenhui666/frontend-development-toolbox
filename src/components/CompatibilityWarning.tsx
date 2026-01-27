import React, { useEffect, useState } from 'react';
import {
  checkAllFeatures,
  generateCompatibilityMessage,
  type CompatibilityCheck,
} from '../utils/browserCompatibility';
import { showMessage } from '../utils/message';
import './CompatibilityWarning.css';

interface CompatibilityWarningProps {
  featureName: string;
  requiredFeatures?: string[];
  onCheck?: (isCompatible: boolean, issues: CompatibilityCheck[]) => void;
  showWarning?: boolean;
}

/**
 * 兼容性警告组件
 * 用于在组件中显示浏览器兼容性警告
 */
const CompatibilityWarning: React.FC<CompatibilityWarningProps> = ({
  featureName,
  requiredFeatures = [],
  onCheck,
  showWarning = true,
}) => {
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const [issues, setIssues] = useState<CompatibilityCheck[]>([]);
  const [hasChecked, setHasChecked] = useState<boolean>(false);

  useEffect(() => {
    const { checks, hasCriticalIssues } = checkAllFeatures();

    // 如果指定了必需功能，只检查这些功能
    let relevantChecks: CompatibilityCheck[] = checks;
    if (requiredFeatures.length > 0) {
      relevantChecks = checks.filter((check) =>
        requiredFeatures.some((feature) =>
          check.feature.toLowerCase().includes(feature.toLowerCase())
        )
      );
    }

    const unsupported = relevantChecks.filter((check) => !check.supported);
    const critical = unsupported.filter((check) => !check.fallback);

    setIssues(unsupported);
    setIsCompatible(critical.length === 0);
    setHasChecked(true);

    // 调用回调
    if (onCheck) {
      onCheck(critical.length === 0, unsupported);
    }

    // 显示警告消息
    if (showWarning && unsupported.length > 0) {
      const message = generateCompatibilityMessage(unsupported);
      if (message) {
        showMessage.warning(`${featureName}: ${message}`);
      }
    }
  }, [featureName, requiredFeatures, onCheck, showWarning]);

  if (!hasChecked || isCompatible || !showWarning) {
    return null;
  }

  return (
    <div className="compatibility-warning">
      <div className="warning-header">
        <span className="warning-icon">⚠️</span>
        <span className="warning-title">兼容性提示</span>
      </div>
      <div className="warning-content">
        <p className="warning-text">
          {featureName} 在当前浏览器中可能无法完全正常工作
        </p>
        <ul className="warning-issues">
          {issues.map((issue, index) => (
            <li key={index} className="warning-issue">
              <span className="issue-feature">{issue.feature}</span>
              {issue.message && (
                <span className="issue-message">: {issue.message}</span>
              )}
              {issue.fallback && (
                <span className="issue-fallback"> ({issue.fallback})</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CompatibilityWarning;
