import React, { useState, useCallback } from 'react';
import { Upload, Slider, Button, Space, Typography, Select, message as antdMessage } from 'antd';
import { DownloadOutlined, CompressOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

interface CompressedImage {
  originalFile: File;
  originalSize: number;
  compressedDataUrl: string;
  compressedSize: number;
  width: number;
  height: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const compressImage = (
  file: File,
  quality: number,
  maxWidth: number,
  outputFormat: string,
): Promise<CompressedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');

        let targetWidth = img.width;
        let targetHeight = img.height;

        if (maxWidth > 0 && img.width > maxWidth) {
          const ratio = maxWidth / img.width;
          targetWidth = maxWidth;
          targetHeight = Math.round(img.height * ratio);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const mimeType = outputFormat === 'webp' ? 'image/webp'
          : outputFormat === 'jpeg' ? 'image/jpeg'
          : 'image/png';

        const dataUrl = canvas.toDataURL(mimeType, quality / 100);

        // 计算压缩后大小
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const compressedSize = Math.round((base64Length * 3) / 4);

        resolve({
          originalFile: file,
          originalSize: file.size,
          compressedDataUrl: dataUrl,
          compressedSize,
          width: targetWidth,
          height: targetHeight,
        });
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
};

const ImageCompressor: React.FC = () => {
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(0);
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [result, setResult] = useState<CompressedImage | null>(null);
  const [compressing, setCompressing] = useState(false);
  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      antdMessage.error('请选择图片文件');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      antdMessage.error('文件大小不能超过 50MB');
      return false;
    }

    setCompressing(true);
    try {
      const compressed = await compressImage(file, quality, maxWidth, outputFormat);
      setResult(compressed);
      const ratio = ((1 - compressed.compressedSize / compressed.originalSize) * 100).toFixed(1);
      antdMessage.success(`压缩完成，减少 ${ratio}%`);
    } catch (err) {
      antdMessage.error('压缩失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
    setCompressing(false);
    return false;
  }, [quality, maxWidth, outputFormat]);

  const recompress = useCallback(async () => {
    if (!result) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(result.originalFile, quality, maxWidth, outputFormat);
      setResult(compressed);
      const ratio = ((1 - compressed.compressedSize / compressed.originalSize) * 100).toFixed(1);
      antdMessage.success(`重新压缩完成，减少 ${ratio}%`);
    } catch (err) {
      antdMessage.error('压缩失败');
    }
    setCompressing(false);
  }, [result, quality, maxWidth, outputFormat]);

  const downloadCompressed = () => {
    if (!result) return;
    const link = document.createElement('a');
    const ext = outputFormat === 'webp' ? 'webp' : outputFormat === 'jpeg' ? 'jpg' : 'png';
    const originalName = result.originalFile.name.replace(/\.[^.]+$/, '');
    link.download = `${originalName}_compressed.${ext}`;
    link.href = result.compressedDataUrl;
    link.click();
  };

  return (
    <div className="img-compressor">
      <Upload.Dragger
        accept="image/*"
        beforeUpload={handleUpload}
        showUploadList={false}
        disabled={compressing}
        className="ic-upload"
      >
        <p className="ic-upload-icon"><CompressOutlined /></p>
        <p className="ic-upload-text">点击或拖拽图片到此处</p>
        <p className="ic-upload-hint">支持 JPG / PNG / WebP，最大 50MB</p>
      </Upload.Dragger>

      <div className="ic-controls">
        <div className="ic-control-row">
          <Text style={{ fontSize: 11, width: 60, flexShrink: 0 }}>质量 {quality}%</Text>
          <Slider min={10} max={100} value={quality} onChange={setQuality} style={{ flex: 1 }} />
        </div>
        <div className="ic-control-row">
          <Text style={{ fontSize: 11, width: 60, flexShrink: 0 }}>最大宽度</Text>
          <Select
            value={maxWidth}
            onChange={setMaxWidth}
            size="small"
            style={{ width: 120 }}
            options={[
              { value: 0, label: '不限制' },
              { value: 3840, label: '3840px (4K)' },
              { value: 1920, label: '1920px (FHD)' },
              { value: 1280, label: '1280px (HD)' },
              { value: 800, label: '800px' },
              { value: 480, label: '480px' },
            ]}
          />
        </div>
        <div className="ic-control-row">
          <Text style={{ fontSize: 11, width: 60, flexShrink: 0 }}>输出格式</Text>
          <Select
            value={outputFormat}
            onChange={setOutputFormat}
            size="small"
            style={{ width: 120 }}
            options={[
              { value: 'jpeg', label: 'JPEG' },
              { value: 'png', label: 'PNG' },
              { value: 'webp', label: 'WebP' },
            ]}
          />
        </div>
      </div>

      {result && (
        <div className="ic-result">
          <div className="ic-comparison">
            <div className="ic-size-info">
              <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>原始</Text>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>{formatFileSize(result.originalSize)}</Text>
            </div>
            <Text style={{ fontSize: 16 }}>→</Text>
            <div className="ic-size-info">
              <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>压缩后</Text>
              <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-success, #52c41a)' }}>
                {formatFileSize(result.compressedSize)}
              </Text>
            </div>
            <div className="ic-size-info">
              <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>减少</Text>
              <Text style={{ fontSize: 12, fontWeight: 700, color: 'var(--theme-primary)' }}>
                {((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)}%
              </Text>
            </div>
          </div>
          <Text style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>
            尺寸: {result.width} × {result.height}
          </Text>
          <div className="ic-preview-img">
            <img src={result.compressedDataUrl} alt="compressed" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }} />
          </div>
          <Space size={6}>
            <Button size="small" icon={<DownloadOutlined />} type="primary" onClick={downloadCompressed}>下载</Button>
            <Button size="small" icon={<CompressOutlined />} onClick={recompress} loading={compressing}>重新压缩</Button>
          </Space>
        </div>
      )}
    </div>
  );
};

export default ImageCompressor;
