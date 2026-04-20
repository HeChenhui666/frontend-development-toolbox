import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Modal,
  Slider,
  message as antdMessage,
} from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../utils/message';
import CompatibilityWarning from '../CompatibilityWarning';
import { checkQRCodeFeatures, checkBasicAPIs } from '../../utils/browserCompatibility';

const { Text } = Typography;
const PREVIEW_SCALE_MIN = 0.2;
const PREVIEW_SCALE_MAX = 5;

const clampPreviewScale = (value: number): number =>
  Math.min(PREVIEW_SCALE_MAX, Math.max(PREVIEW_SCALE_MIN, value));

const QRCodeGenerator: React.FC = () => {
  const [url, setUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);

  // 检查浏览器兼容性（异步执行，避免阻塞渲染）
  useEffect(() => {
    const performCheck = () => {
      const qrChecks = checkQRCodeFeatures();
      const basicChecks = checkBasicAPIs();
      const allChecks = [...qrChecks, ...basicChecks];
      const critical = allChecks.filter((check) => !check.supported && !check.fallback);
      setIsCompatible(critical.length === 0);
      
      if (critical.length > 0) {
        setTimeout(() => {
          antdMessage.warning('当前浏览器可能不完全支持二维码生成功能');
        }, 100);
      }
    };

    // 延迟执行，避免阻塞初始渲染
    const timer = setTimeout(performCheck, 50);
    return () => clearTimeout(timer);
  }, []);

  // 获取当前标签页的URL并自动生成二维码
  useEffect(() => {
    // 延迟执行，避免阻塞初始渲染
    const timer = setTimeout(() => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url) {
            setUrl(tabs[0].url);
            // 自动生成二维码
            generateQRCodeForUrl(tabs[0].url);
          }
        });
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // 生成二维码的通用函数
  const generateQRCodeForUrl = async (urlToGenerate: string) => {
    if (!urlToGenerate.trim()) {
      setError('请输入URL');
      return;
    }

    try {
      const getThemeColor = (variableName: string, fallback: string) =>
        getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || fallback;
      const parseColor = (value: string) => {
        const trimmed = value.trim();
        const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
        if (hexMatch) {
          const hex = hexMatch[1].length === 3
            ? hexMatch[1].split('').map((char) => char + char).join('')
            : hexMatch[1];
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return { r, g, b };
        }
        const rgbMatch = trimmed.match(/rgba?\(([^)]+)\)/i);
        if (rgbMatch) {
          const [r, g, b] = rgbMatch[1]
            .split(',')
            .map((part) => Number.parseFloat(part.trim()));
          if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
          return { r, g, b };
        }
        return null;
      };
      const getLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
        const toLinear = (channel: number) => {
          const normalized = channel / 255;
          return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
        };
        const rLin = toLinear(r);
        const gLin = toLinear(g);
        const bLin = toLinear(b);
        return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
      };
      const getContrastRatio = (colorA: { r: number; g: number; b: number }, colorB: { r: number; g: number; b: number }) => {
        const lumA = getLuminance(colorA);
        const lumB = getLuminance(colorB);
        const lighter = Math.max(lumA, lumB);
        const darker = Math.min(lumA, lumB);
        return (lighter + 0.05) / (darker + 0.05);
      };
      setError('');
      const themeDark = getThemeColor('--theme-text', '#000000');
      const themeLight = getThemeColor('--theme-background', '#FFFFFF');
      const darkRgb = parseColor(themeDark);
      const lightRgb = parseColor(themeLight);
      const contrastRatio = darkRgb && lightRgb ? getContrastRatio(darkRgb, lightRgb) : 0;
      const [safeDark, safeLight] =
        contrastRatio >= 7 ? [themeDark, themeLight] : ['#000000', '#FFFFFF'];
      const dataUrl = await QRCode.toDataURL(urlToGenerate, {
        width: 200,
        margin: 6,
        color: {
          dark: safeDark,
          light: safeLight,
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      setError('生成二维码失败，请检查URL格式');
      console.error(err);
    }
  };

  // 生成二维码
  const generateQRCode = async () => {
    generateQRCodeForUrl(url);
  };

  // 下载二维码
  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCodeDataUrl;
    link.click();
  };

  const openPreview = () => {
    if (!qrCodeDataUrl) return;
    setPreviewScale(1);
    setPreviewOpen(true);
  };

  const handlePreviewWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setPreviewScale((prev) => clampPreviewScale(prev + delta));
  };

  // 复制URL（兼容性处理）
  const copyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        antdMessage.success('URL已复制到剪贴板');
      } else {
        // 降级方案：使用 document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          antdMessage.success('URL已复制到剪贴板');
        } catch (err) {
          antdMessage.error('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      antdMessage.error('复制失败，请手动复制');
    }
  };

  return (
    <div className="generator" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      {!isCompatible && (
        <CompatibilityWarning
          featureName="二维码生成"
          requiredFeatures={['Canvas', 'Image']}
        />
      )}
      <Card 
        size="small" 
        title={
          <Space>
            <QrcodeOutlined />
            <Text strong>生成二维码</Text>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入或粘贴URL"
              onPressEnter={generateQRCode}
            />
            <Button
              icon={<CopyOutlined />}
              onClick={copyUrl}
              title="复制当前标签页URL"
            />
          </Space.Compact>
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            onClick={generateQRCode}
            block
          >
            生成二维码
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      {qrCodeDataUrl && (
        <Card 
          size="small" 
          title="二维码预览"
          extra={
            <Space size="small">
              <Button size="small" onClick={openPreview}>
                放大预览
              </Button>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={downloadQRCode}
              >
                下载
              </Button>
            </Space>
          }
        >
          <div style={{ textAlign: 'center' }}>
            <img 
              src={qrCodeDataUrl} 
              alt="QR Code" 
              onClick={openPreview}
              style={{ maxWidth: '100%', height: 'auto', cursor: 'zoom-in' }}
            />
          </div>
        </Card>
      )}
      <Modal
        open={previewOpen}
        title="二维码放大预览"
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={760}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">缩放：{Math.round(previewScale * 100)}%</Text>
            <Button size="small" onClick={() => setPreviewScale(1)}>
              重置
            </Button>
          </div>
          <Slider
            min={Math.round(PREVIEW_SCALE_MIN * 100)}
            max={Math.round(PREVIEW_SCALE_MAX * 100)}
            step={5}
            value={Math.round(previewScale * 100)}
            onChange={(v) => {
              const next = typeof v === 'number' ? v / 100 : 1;
              setPreviewScale(clampPreviewScale(next));
            }}
          />
          <div
            onWheel={handlePreviewWheel}
            style={{
              border: '1px solid var(--theme-border)',
              borderRadius: 8,
              background: 'var(--theme-card-background)',
              minHeight: 360,
              maxHeight: '60vh',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code Large Preview"
                style={{
                  width: `${previewScale * 100}%`,
                  maxWidth: 'none',
                  height: 'auto',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            ) : null}
          </div>
          <Text type="secondary">可拖动滚轮自由缩放，也可拖动滑条精确调整。</Text>
        </Space>
      </Modal>
    </div>
  );
};

export default QRCodeGenerator;

