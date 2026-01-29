import React, { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  InputNumber,
  Select,
  message as antdMessage,
  Alert,
} from 'antd';
import {
  FileImageOutlined,
  ReloadOutlined,
  CopyOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../utils/message';

const { Text } = Typography;

const RandomImageGenerator: React.FC = () => {
  const [width, setWidth] = useState<string>('200');
  const [height, setHeight] = useState<string>('300');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageFormat, setImageFormat] = useState<'jpg' | 'webp' | 'none'>('none');

  // 生成随机图片URL
  const generateImageUrl = useCallback(() => {
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);

    if (isNaN(w) || w <= 0 || w > 5000) {
      antdMessage.error('宽度必须是1-5000之间的数字');
      return;
    }

    if (isNaN(h) || h <= 0 || h > 5000) {
      antdMessage.error('高度必须是1-5000之间的数字');
      return;
    }

    // 生成时间戳防止缓存
    const timestamp = Date.now();
    const uid = Math.random().toString(36).substring(2, 15);
    
    // 构建URL
    let url = `https://picsum.photos/${w}/${h}`;
    
    // 添加图片格式
    if (imageFormat !== 'none') {
      url += `.${imageFormat}`;
    }
    
    // 添加时间戳和uid参数防止缓存
    url += `?t=${timestamp}&uid=${uid}`;
    
    setImageUrl(url);
  }, [width, height, imageFormat]);

  // 复制图片URL
  const copyImageUrl = () => {
    if (!imageUrl) {
      antdMessage.warning('请先生成图片');
      return;
    }
    navigator.clipboard.writeText(imageUrl);
    antdMessage.success('图片URL已复制到剪贴板');
  };

  // 下载图片
  const downloadImage = async () => {
    if (!imageUrl) {
      antdMessage.warning('请先生成图片');
      return;
    }
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `random-image-${width}x${height}.${imageFormat === 'none' ? 'jpg' : imageFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      antdMessage.success('图片下载成功');
    } catch (error) {
      antdMessage.error('图片下载失败');
    }
  };


  return (
    <div className="random-image-generator" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
      <Card size="small" title="图片参数设置">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space.Compact style={{ width: '100%' }}>
            <InputNumber
              addonBefore="宽度"
              addonAfter="px"
              min={1}
              max={5000}
              value={parseInt(width, 10)}
              onChange={(value) => setWidth(value?.toString() || '200')}
              style={{ flex: 1 }}
            />
            <InputNumber
              addonBefore="高度"
              addonAfter="px"
              min={1}
              max={5000}
              value={parseInt(height, 10)}
              onChange={(value) => setHeight(value?.toString() || '300')}
              style={{ flex: 1 }}
            />
          </Space.Compact>
          <Select
            value={imageFormat}
            onChange={(value) => setImageFormat(value)}
            style={{ width: '100%' }}
            options={[
              { label: '默认 (JPG)', value: 'none' },
              { label: 'JPG', value: 'jpg' },
              { label: 'WebP', value: 'webp' },
            ]}
          />
          <Button
            type="primary"
            icon={<FileImageOutlined />}
            onClick={generateImageUrl}
            block
          >
            生成随机图片
          </Button>
        </Space>
      </Card>

      {imageUrl && (
        <Card 
          size="small" 
          title="图片预览"
          extra={
            <Space>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={generateImageUrl}
              >
                刷新
              </Button>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={copyImageUrl}
              >
                复制URL
              </Button>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={downloadImage}
              >
                下载
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Text code copyable style={{ wordBreak: 'break-all', display: 'block' }}>
              {imageUrl}
            </Text>
            <div style={{ textAlign: 'center' }}>
              <img
                src={imageUrl}
                alt={`随机图片 ${width}x${height}`}
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                onError={() => {
                  antdMessage.error('图片加载失败，请重试');
                }}
              />
            </div>
          </Space>
        </Card>
      )}

      <Alert
        message="使用说明"
        description={
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>输入宽度和高度（1-5000像素）</li>
            <li>选择图片格式（默认JPG或WebP）</li>
            <li>点击"生成随机图片"按钮生成图片</li>
            <li>图片URL会自动添加时间戳和随机UID参数防止浏览器缓存</li>
            <li>可以复制URL或下载图片</li>
          </ul>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
      />
    </div>
  );
};

export default RandomImageGenerator;

