import React, { useState, useCallback } from 'react';
import { Upload, Button, Select, Typography, message as antdMessage } from 'antd';
import { SwapOutlined, DownloadOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

interface ConversionResult {
  originalName: string;
  originalFormat: string;
  originalSize: number;
  convertedDataUrl: string;
  convertedSize: number;
  targetFormat: string;
  width: number;
  height: number;
}

const FORMAT_OPTIONS = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
  { value: 'image/bmp', label: 'BMP', ext: 'bmp' },
];

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getFormatFromMime = (mime: string): string => {
  const map: Record<string, string> = {
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/svg+xml': 'SVG',
    'image/avif': 'AVIF',
  };
  return map[mime] || mime.split('/')[1]?.toUpperCase() || '未知';
};

const ImageFormatConverter: React.FC = () => {
  const [targetFormat, setTargetFormat] = useState('image/webp');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [converting, setConverting] = useState(false);
  const convertImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      antdMessage.error('请选择图片文件');
      return false;
    }

    setConverting(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsDataURL(file);
      });

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('图片加载失败'));
        image.src = dataUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // 对于 JPEG 格式，需要先填充白色背景（PNG 透明通道处理）
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const quality = targetFormat === 'image/png' ? undefined : 0.92;
      const convertedDataUrl = canvas.toDataURL(targetFormat, quality);

      const base64Length = convertedDataUrl.split(',')[1]?.length || 0;
      const convertedSize = Math.round((base64Length * 3) / 4);

      const formatInfo = FORMAT_OPTIONS.find((f) => f.value === targetFormat);

      setResult({
        originalName: file.name,
        originalFormat: getFormatFromMime(file.type),
        originalSize: file.size,
        convertedDataUrl,
        convertedSize,
        targetFormat: formatInfo?.label || 'Unknown',
        width: img.width,
        height: img.height,
      });

      antdMessage.success(`已转换为 ${formatInfo?.label}`);
    } catch (err) {
      antdMessage.error('转换失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }

    setConverting(false);
    return false;
  }, [targetFormat]);

  const downloadResult = () => {
    if (!result) return;
    const formatInfo = FORMAT_OPTIONS.find((f) => f.label === result.targetFormat);
    const ext = formatInfo?.ext || 'png';
    const originalName = result.originalName.replace(/\.[^.]+$/, '');
    const link = document.createElement('a');
    link.download = `${originalName}.${ext}`;
    link.href = result.convertedDataUrl;
    link.click();
  };

  return (
    <div className="img-format-converter">
      <div className="ifc-target-row">
        <Text style={{ fontSize: 11, fontWeight: 600 }}>目标格式</Text>
        <Select
          value={targetFormat}
          onChange={setTargetFormat}
          size="small"
          style={{ width: 120 }}
          options={FORMAT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
        />
      </div>

      <Upload.Dragger
        accept="image/*"
        beforeUpload={convertImage}
        showUploadList={false}
        disabled={converting}
        className="ifc-upload"
      >
        <p className="ifc-upload-icon"><SwapOutlined /></p>
        <p className="ifc-upload-text">点击或拖拽图片进行格式转换</p>
        <p className="ifc-upload-hint">支持 PNG / JPG / WebP / GIF / BMP / SVG</p>
      </Upload.Dragger>

      {result && (
        <div className="ifc-result">
          <div className="ifc-conversion-info">
            <div className="ifc-format-badge">
              <span className="ifc-format-label">{result.originalFormat}</span>
              <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>{formatFileSize(result.originalSize)}</Text>
            </div>
            <Text style={{ fontSize: 14 }}>→</Text>
            <div className="ifc-format-badge ifc-format-target">
              <span className="ifc-format-label">{result.targetFormat}</span>
              <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>{formatFileSize(result.convertedSize)}</Text>
            </div>
          </div>
          <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>
            尺寸: {result.width} × {result.height}
          </Text>
          <div className="ifc-preview">
            <img src={result.convertedDataUrl} alt="converted" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 4 }} />
          </div>
          <Button size="small" icon={<DownloadOutlined />} type="primary" onClick={downloadResult} block>
            下载 {result.targetFormat}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageFormatConverter;
