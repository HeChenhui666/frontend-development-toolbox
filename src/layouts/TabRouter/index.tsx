import { lazy, memo } from 'react';
import type { SubTab } from '../../types/feature';
import type { DefaultTab } from '../../utils/userPreferences';

// 懒加载组件 — 按领域分组
// utility-tools
const QRCodeGenerator = lazy(() => import('../../features/utility-tools/QRCodeGenerator'));
const QRCodeDecoder = lazy(() => import('../../features/utility-tools/QRCodeDecoder'));
const BarcodeGenerator = lazy(() => import('../../features/utility-tools/BarcodeGenerator'));
const TimestampConverter = lazy(() => import('../../features/utility-tools/TimestampConverter'));
const Translator = lazy(() => import('../../features/utility-tools/Translator'));
const MemoNotes = lazy(() => import('../../features/utility-tools/ClipboardHistory'));
// network-tools
const URLParamsEditor = lazy(() => import('../../features/network-tools/URLParamsEditor'));
const APITester = lazy(() => import('../../features/network-tools/APITester'));
const RequestRedirector = lazy(() => import('../../features/network-tools/RequestRedirector'));
// code-tools
const JSONTools = lazy(() => import('../../features/code-tools/JSONTools'));
const RegexTester = lazy(() => import('../../features/code-tools/RegexTester'));
const CodecTools = lazy(() => import('../../features/code-tools/CodecTools'));
const MarkdownPreview = lazy(() => import('../../features/code-tools/MarkdownPreview'));
const DiffTool = lazy(() => import('../../features/code-tools/DiffTool'));
// visual-tools
const ColorTools = lazy(() => import('../../features/visual-tools/ColorTools'));
const ImageTools = lazy(() => import('../../features/visual-tools/ImageTools'));
const AsciiArt = lazy(() => import('../../features/visual-tools/AsciiArt'));
// browser-tools
const CacheManager = lazy(() => import('../../features/browser-tools/CacheManager'));
const StorageManager = lazy(() => import('../../features/browser-tools/StorageManager'));
const WebActions = lazy(() => import('../../features/browser-tools/WebActions'));
const MouseTrail = lazy(() => import('../../features/browser-tools/MouseTrail'));

type FeatureTab = DefaultTab | 'future1' | 'future2';

interface TabRouterProps {
  tab: FeatureTab;
  subTab: SubTab;
  onSubTabChange: (next: SubTab) => void;
}

/**
 * 功能标签页路由组件。
 * 根据当前激活的 tab 渲染对应的功能组件。
 */
const TabRouter = memo<TabRouterProps>(({ tab, subTab, onSubTabChange }) => {
  switch (tab) {
    case 'qrcode':
      return (
        <div className="feature-content">
          <div className="sub-tabs">
            <button
              type="button"
              className={`sub-tab ${subTab === 'generate' ? 'active' : ''}`}
              onClick={() => onSubTabChange('generate')}
            >
              <span className="sub-tab-icon">📱</span>
              <span>生成</span>
            </button>
            <button
              type="button"
              className={`sub-tab ${subTab === 'decode' ? 'active' : ''}`}
              onClick={() => onSubTabChange('decode')}
            >
              <span className="sub-tab-icon">🔍</span>
              <span>解码</span>
            </button>
            <button
              type="button"
              className={`sub-tab ${subTab === 'barcode' ? 'active' : ''}`}
              onClick={() => onSubTabChange('barcode')}
            >
              <span className="sub-tab-icon">📊</span>
              <span>条形码</span>
            </button>
          </div>
          <div className="sub-content">
            {subTab === 'generate' && <QRCodeGenerator />}
            {subTab === 'decode' && <QRCodeDecoder />}
            {subTab === 'barcode' && <BarcodeGenerator />}
          </div>
        </div>
      );
    case 'urlparams': return <URLParamsEditor />;
    case 'timestamp': return <TimestampConverter />;
    case 'randomimage': return <ImageTools />;
    case 'json': return <JSONTools />;
    case 'gradient': return <ColorTools />;
    case 'regex': return <RegexTester />;
    case 'translator': return <Translator />;
    case 'apitester': return <APITester />;
    case 'cachemanager': return (
      <div className="feature-content">
        <div className="sub-tabs">
          <button type="button" className={`sub-tab ${subTab === 'generate' || !['generate','decode','barcode','storage'].includes(subTab) ? 'active' : ''}`} onClick={() => onSubTabChange('generate')}>
            <span className="sub-tab-icon">🍪</span><span>Cookie/清理</span>
          </button>
          <button type="button" className={`sub-tab ${subTab === 'storage' ? 'active' : ''}`} onClick={() => onSubTabChange('storage')}>
            <span className="sub-tab-icon">💾</span><span>Storage</span>
          </button>
        </div>
        <div className="sub-content">
          {subTab === 'storage' ? <StorageManager /> : <CacheManager />}
        </div>
      </div>
    );
    case 'redirector': return <RequestRedirector />;
    case 'webactions': return <WebActions />;
    case 'mousetrail': return <MouseTrail />;
    case 'codec': return <CodecTools />;
    case 'markdown': return <MarkdownPreview />;
    case 'diff': return <DiffTool />;
    case 'clipboard': return <MemoNotes />;
    case 'asciiart': return <AsciiArt />;
    default: return null;
  }
});
TabRouter.displayName = 'TabRouter';

export default TabRouter;
