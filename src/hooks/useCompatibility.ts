import { useEffect, useState } from 'react';
import {
  checkAllFeatures,
  checkBasicAPIs,
  checkMediaAPIs,
  checkChromeExtensionAPIs,
  checkQRCodeFeatures,
  checkJSONFeatures,
  checkRegexFeatures,
  type CompatibilityCheck,
} from '../utils/browserCompatibility';
import { showMessage } from '../utils/message';

interface UseCompatibilityOptions {
  featureName: string;
  requiredFeatures?: string[];
  showWarning?: boolean;
  checkTypes?: ('basic' | 'media' | 'extension' | 'qrcode' | 'json' | 'regex')[];
}

interface UseCompatibilityResult {
  isCompatible: boolean;
  issues: CompatibilityCheck[];
  browserInfo: ReturnType<typeof checkAllFeatures>['browser'];
}

/**
 * 通用的兼容性检测 Hook
 */
export function useCompatibility(
  options: UseCompatibilityOptions
): UseCompatibilityResult {
  const { featureName, requiredFeatures = [], showWarning = true, checkTypes = ['basic'] } = options;
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const [issues, setIssues] = useState<CompatibilityCheck[]>([]);
  const [browserInfo, setBrowserInfo] = useState<ReturnType<typeof checkAllFeatures>['browser']>({
    name: 'Unknown',
    version: '0',
    isChrome: false,
    isFirefox: false,
    isSafari: false,
    isEdge: false,
    isIE: false,
  });

  useEffect(() => {
    // 使用 requestIdleCallback 或 setTimeout 异步执行检测，避免阻塞渲染
    const performCheck = () => {
      // 根据 checkTypes 选择检测类型
      let allChecks: CompatibilityCheck[] = [];
      
      if (checkTypes.includes('basic')) {
        allChecks = [...allChecks, ...checkBasicAPIs()];
      }
      if (checkTypes.includes('media')) {
        allChecks = [...allChecks, ...checkMediaAPIs()];
      }
      if (checkTypes.includes('extension')) {
        allChecks = [...allChecks, ...checkChromeExtensionAPIs()];
      }
      if (checkTypes.includes('qrcode')) {
        allChecks = [...allChecks, ...checkQRCodeFeatures()];
      }
      if (checkTypes.includes('json')) {
        allChecks = [...allChecks, ...checkJSONFeatures()];
      }
      if (checkTypes.includes('regex')) {
        allChecks = [...allChecks, ...checkRegexFeatures()];
      }

      // 如果指定了必需功能，只检查这些功能
      let relevantChecks: CompatibilityCheck[] = allChecks;
      if (requiredFeatures.length > 0) {
        relevantChecks = allChecks.filter((check) =>
          requiredFeatures.some((feature) =>
            check.feature.toLowerCase().includes(feature.toLowerCase())
          )
        );
      }

      const unsupported = relevantChecks.filter((check) => !check.supported);
      const critical = unsupported.filter((check) => !check.fallback);

      setIssues(unsupported);
      setIsCompatible(critical.length === 0);

      // 获取浏览器信息（只获取一次，避免重复检测）
      const { browser } = checkAllFeatures();
      setBrowserInfo(browser);

      // 显示警告消息（延迟显示，避免阻塞）
      if (showWarning && unsupported.length > 0) {
        setTimeout(() => {
          const criticalNames = critical.map((c) => c.feature).join('、');
          if (criticalNames) {
            showMessage.warning(
              `${featureName}: 检测到不兼容的功能（${criticalNames}），可能影响使用`
            );
          }
        }, 100);
      }
    };

    // 使用 requestIdleCallback 在浏览器空闲时执行，或使用 setTimeout 延迟执行
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(performCheck, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      // 降级方案：延迟执行，避免阻塞初始渲染
      const timer = setTimeout(performCheck, 100);
      return () => clearTimeout(timer);
    }
  }, [featureName, requiredFeatures, showWarning, checkTypes]);

  return {
    isCompatible,
    issues,
    browserInfo,
  };
}
