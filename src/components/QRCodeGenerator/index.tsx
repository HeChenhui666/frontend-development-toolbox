import React, { useState, useEffect, useCallback } from 'react';
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
  ColorPicker,
  Upload,
  Tabs,
  List,
  Popconfirm,
  message as antdMessage,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import {
  CopyOutlined,
  DownloadOutlined,
  QrcodeOutlined,
  PictureOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import './index.css';
import CompatibilityWarning from '../CompatibilityWarning';
import { checkQRCodeFeatures, checkBasicAPIs } from '../../utils/browserCompatibility';

const { Text } = Typography;
const { TextArea } = Input;
const PREVIEW_SCALE_MIN = 0.2;
const PREVIEW_SCALE_MAX = 5;
const HISTORY_STORAGE_KEY = 'qr_generator_history';
const MAX_HISTORY_ITEMS = 50;

interface QRHistoryItem {
  text: string;
  timestamp: number;
  dataUrl: string;
}

interface QRStyleConfig {
  foregroundColor: string;
  backgroundColor: string;
  logoDataUrl: string | null;
  logoSize: number;
}

const clampPreviewScale = (value: number): number =>
  Math.min(PREVIEW_SCALE_MAX, Math.max(PREVIEW_SCALE_MIN, value));

const colorToHex = (color: Color): string => {
  return typeof color === 'string' ? color : color.toHexString();
};

const loadHistory = (): QRHistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (items: QRHistoryItem[]) => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)));
  } catch { /* storage full, ignore */ }
};

const QRCodeGenerator: React.FC = () => {
  const [url, setUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [activeTab, setActiveTab] = useState<string>('single');

  // 批量生成
  const [batchText, setBatchText] = useState('');
  const [batchResults, setBatchResults] = useState<Array<{ text: string; dataUrl: string }>>([]);
  const [batchGenerating, setBatchGenerating] = useState(false);

  // 样式定制
  const [styleConfig, setStyleConfig] = useState<QRStyleConfig>({
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    logoDataUrl: null,
    logoSize: 20,
  });

  // 历史记录
  const [history, setHistory] = useState<QRHistoryItem[]>(loadHistory);

  useEffect(() => {
    const timer = setTimeout(() => {
      const allChecks = [...checkQRCodeFeatures(), ...checkBasicAPIs()];
      const critical = allChecks.filter((c) => !c.supported && !c.fallback);
      setIsCompatible(critical.length === 0);
      if (critical.length > 0) {
        setTimeout(() => antdMessage.warning('当前浏览器可能不完全支持二维码生成功能'), 100);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.url) {
            setUrl(tabs[0].url);
            generateQRCodeForUrl(tabs[0].url);
          }
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const drawLogoOnCanvas = useCallback(
    (baseDataUrl: string, logoDataUrl: string, logoSizePercent: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const baseImg = new Image();
        baseImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = baseImg.width;
          canvas.height = baseImg.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

          ctx.drawImage(baseImg, 0, 0);

          const logoImg = new Image();
          logoImg.onload = () => {
            const logoRatio = logoSizePercent / 100;
            const logoWidth = baseImg.width * logoRatio;
            const logoHeight = logoImg.height * (logoWidth / logoImg.width);
            const logoX = (baseImg.width - logoWidth) / 2;
            const logoY = (baseImg.height - logoHeight) / 2;

            // 白色背景衬底
            const padding = 4;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(logoX - padding, logoY - padding, logoWidth + padding * 2, logoHeight + padding * 2, 4);
            ctx.fill();

            ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
            resolve(canvas.toDataURL('image/png'));
          };
          logoImg.onerror = () => resolve(baseDataUrl);
          logoImg.src = logoDataUrl;
        };
        baseImg.onerror = () => reject(new Error('Base image load failed'));
        baseImg.src = baseDataUrl;
      });
    },
    []
  );

  const generateQRCodeForUrl = async (urlToGenerate: string, style?: QRStyleConfig) => {
    if (!urlToGenerate.trim()) {
      setError('请输入内容');
      return '';
    }

    const currentStyle = style || styleConfig;

    try {
      setError('');
      let dataUrl = await QRCode.toDataURL(urlToGenerate, {
        width: 400,
        margin: 4,
        errorCorrectionLevel: currentStyle.logoDataUrl ? 'H' : 'M',
        color: {
          dark: currentStyle.foregroundColor,
          light: currentStyle.backgroundColor,
        },
      });

      if (currentStyle.logoDataUrl) {
        dataUrl = await drawLogoOnCanvas(dataUrl, currentStyle.logoDataUrl, currentStyle.logoSize);
      }

      return dataUrl;
    } catch (err) {
      setError('生成二维码失败，请检查输入内容');
      console.error(err);
      return '';
    }
  };

  const addToHistory = useCallback((text: string, dataUrl: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.text !== text);
      const newHistory = [{ text, timestamp: Date.now(), dataUrl }, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(newHistory);
      return newHistory;
    });
  }, []);

  const generateSingle = async () => {
    const dataUrl = await generateQRCodeForUrl(url);
    if (dataUrl) {
      setQrCodeDataUrl(dataUrl);
      addToHistory(url, dataUrl);
    }
  };

  const generateBatch = async () => {
    const lines = batchText.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      setError('请输入至少一行内容');
      return;
    }
    if (lines.length > 100) {
      setError('批量生成最多支持 100 条');
      return;
    }

    setBatchGenerating(true);
    setError('');
    const results: Array<{ text: string; dataUrl: string }> = [];

    for (const line of lines) {
      const dataUrl = await generateQRCodeForUrl(line);
      if (dataUrl) {
        results.push({ text: line, dataUrl });
      }
    }

    setBatchResults(results);
    setBatchGenerating(false);
    if (results.length > 0) {
      antdMessage.success(`成功生成 ${results.length} 个二维码`);
      results.forEach((result) => addToHistory(result.text, result.dataUrl));
    }
  };

  const downloadBatchAsZip = async () => {
    if (batchResults.length === 0) return;

    if (batchResults.length === 1) {
      const link = document.createElement('a');
      link.download = 'qrcode_1.png';
      link.href = batchResults[0].dataUrl;
      link.click();
      return;
    }

    // 逐个下载（不引入 zip 库以保持轻量）
    for (let index = 0; index < batchResults.length; index++) {
      const link = document.createElement('a');
      link.download = `qrcode_${index + 1}.png`;
      link.href = batchResults[index].dataUrl;
      link.click();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    antdMessage.success(`已下载 ${batchResults.length} 个二维码`);
  };

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

  const copyUrl = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        antdMessage.success('已复制到剪贴板');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        antdMessage.success('已复制到剪贴板');
      }
    } catch {
      antdMessage.error('复制失败');
    }
  };

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      antdMessage.error('请选择图片文件');
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      antdMessage.error('Logo 文件不能超过 2MB');
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl === 'string') {
        setStyleConfig((prev) => ({ ...prev, logoDataUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    antdMessage.success('历史记录已清空');
  };

  const restoreFromHistory = (item: QRHistoryItem) => {
    setUrl(item.text);
    setQrCodeDataUrl(item.dataUrl);
    setActiveTab('single');
  };

  const tabItems = [
    {
      key: 'single',
      label: '单个生成',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="输入文本或 URL"
              onPressEnter={generateSingle}
            />
            <Button icon={<CopyOutlined />} onClick={copyUrl} title="复制" />
          </Space.Compact>
          <Button type="primary" icon={<QrcodeOutlined />} onClick={generateSingle} block>
            生成二维码
          </Button>
        </Space>
      ),
    },
    {
      key: 'batch',
      label: '批量生成',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <TextArea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="每行一条内容，最多 100 条"
            rows={4}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={generateBatch}
              loading={batchGenerating}
              style={{ flex: 1 }}
            >
              批量生成
            </Button>
            {batchResults.length > 0 && (
              <Button icon={<FileZipOutlined />} onClick={downloadBatchAsZip}>
                全部下载
              </Button>
            )}
          </div>
        </Space>
      ),
    },
    {
      key: 'style',
      label: '样式定制',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text style={{ whiteSpace: 'nowrap', fontSize: 12 }}>前景色</Text>
            <ColorPicker
              value={styleConfig.foregroundColor}
              onChange={(color) => setStyleConfig((prev) => ({ ...prev, foregroundColor: colorToHex(color) }))}
              size="small"
            />
            <Text style={{ whiteSpace: 'nowrap', fontSize: 12 }}>背景色</Text>
            <ColorPicker
              value={styleConfig.backgroundColor}
              onChange={(color) => setStyleConfig((prev) => ({ ...prev, backgroundColor: colorToHex(color) }))}
              size="small"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ whiteSpace: 'nowrap', fontSize: 12 }}>Logo</Text>
            <Upload accept="image/*" beforeUpload={handleLogoUpload} showUploadList={false}>
              <Button size="small" icon={<PictureOutlined />}>
                {styleConfig.logoDataUrl ? '更换' : '上传'}
              </Button>
            </Upload>
            {styleConfig.logoDataUrl && (
              <>
                <img
                  src={styleConfig.logoDataUrl}
                  alt="logo"
                  style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 2, border: '1px solid var(--theme-border)' }}
                />
                <Button
                  size="small"
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => setStyleConfig((prev) => ({ ...prev, logoDataUrl: null }))}
                />
              </>
            )}
          </div>
          {styleConfig.logoDataUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ whiteSpace: 'nowrap', fontSize: 12 }}>Logo 大小</Text>
              <Slider
                min={10}
                max={35}
                value={styleConfig.logoSize}
                onChange={(v) => setStyleConfig((prev) => ({ ...prev, logoSize: v }))}
                style={{ flex: 1 }}
              />
              <Text style={{ fontSize: 12, minWidth: 32 }}>{styleConfig.logoSize}%</Text>
            </div>
          )}
          <Button
            type="primary"
            icon={<QrcodeOutlined />}
            onClick={generateSingle}
            block
            size="small"
          >
            应用样式并生成
          </Button>
        </Space>
      ),
    },
    {
      key: 'history',
      label: `历史(${history.length})`,
      children: (
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {history.length === 0 ? (
            <Text type="secondary" style={{ fontSize: 12 }}>暂无历史记录</Text>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                <Popconfirm title="确认清空所有历史记录？" onConfirm={clearHistory} okText="确认" cancelText="取消">
                  <Button size="small" danger type="text" icon={<DeleteOutlined />}>清空</Button>
                </Popconfirm>
              </div>
              <List
                size="small"
                dataSource={history}
                renderItem={(item) => (
                  <List.Item
                    style={{ padding: '4px 0', cursor: 'pointer' }}
                    onClick={() => restoreFromHistory(item)}
                    actions={[
                      <Button
                        key="dl"
                        size="small"
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.download = 'qrcode.png';
                          link.href = item.dataUrl;
                          link.click();
                        }}
                      />,
                    ]}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <img
                        src={item.dataUrl}
                        alt=""
                        style={{ width: 28, height: 28, borderRadius: 2, flexShrink: 0, border: '1px solid var(--theme-border)' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                          {item.text}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="generator" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      {!isCompatible && (
        <CompatibilityWarning featureName="二维码生成" requiredFeatures={['Canvas', 'Image']} />
      )}

      <Card size="small" title={<Space><QrcodeOutlined /><Text strong>生成二维码</Text></Space>}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          items={tabItems}
          style={{ marginTop: -8 }}
        />
      </Card>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />
      )}

      {/* 单个生成结果 */}
      {qrCodeDataUrl && activeTab !== 'batch' && (
        <Card
          size="small"
          title="二维码预览"
          extra={
            <Space size="small">
              <Button size="small" onClick={openPreview}>放大预览</Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={downloadQRCode}>下载</Button>
            </Space>
          }
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={qrCodeDataUrl}
              alt="QR Code"
              onClick={openPreview}
              style={{ maxWidth: '100%', maxHeight: 200, height: 'auto', cursor: 'zoom-in' }}
            />
          </div>
        </Card>
      )}

      {/* 批量生成结果 */}
      {batchResults.length > 0 && activeTab === 'batch' && (
        <Card size="small" title={`批量结果 (${batchResults.length})`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
            {batchResults.map((result, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: 4,
                  border: '1px solid var(--theme-border)',
                  borderRadius: 4,
                  background: 'var(--theme-surface)',
                }}
              >
                <img src={result.dataUrl} alt={`QR ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                <div style={{ fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, color: 'var(--theme-textMuted)' }}>
                  {result.text}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 放大预览弹窗 */}
      <Modal open={previewOpen} title="二维码放大预览" onCancel={() => setPreviewOpen(false)} footer={null} width={760}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary">缩放：{Math.round(previewScale * 100)}%</Text>
            <Button size="small" onClick={() => setPreviewScale(1)}>重置</Button>
          </div>
          <Slider
            min={Math.round(PREVIEW_SCALE_MIN * 100)}
            max={Math.round(PREVIEW_SCALE_MAX * 100)}
            step={5}
            value={Math.round(previewScale * 100)}
            onChange={(v) => setPreviewScale(clampPreviewScale((typeof v === 'number' ? v : 100) / 100))}
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
            {qrCodeDataUrl && (
              <img
                src={qrCodeDataUrl}
                alt="QR Code Large Preview"
                style={{ width: `${previewScale * 100}%`, maxWidth: 'none', height: 'auto', pointerEvents: 'none', userSelect: 'none' }}
              />
            )}
          </div>
          <Text type="secondary">可拖动滚轮自由缩放，也可拖动滑条精确调整。</Text>
        </Space>
      </Modal>
    </div>
  );
};

export default QRCodeGenerator;

