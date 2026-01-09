import React, { useState, useCallback } from 'react';
import './index.css';
import { showMessage } from '../../../utils/message';

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
      showMessage.error('宽度必须是1-5000之间的数字');
      return;
    }

    if (isNaN(h) || h <= 0 || h > 5000) {
      showMessage.error('高度必须是1-5000之间的数字');
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
      showMessage.warning('请先生成图片');
      return;
    }
    navigator.clipboard.writeText(imageUrl);
    showMessage.success('图片URL已复制到剪贴板');
  };

  // 下载图片
  const downloadImage = async () => {
    if (!imageUrl) {
      showMessage.warning('请先生成图片');
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
      showMessage.success('图片下载成功');
    } catch (error) {
      showMessage.error('图片下载失败');
    }
  };


  return (
    <div className="random-image-generator">
      {/* 参数设置区域 */}
      <div className="image-config-section">
        <div className="config-header">
          <label>图片参数设置</label>
        </div>
        <div className="config-inputs">
          <div className="input-group">
            <label className="input-label">宽度 (px)</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              min="1"
              max="5000"
              placeholder="200"
              className="config-input"
            />
          </div>
          <div className="input-group">
            <label className="input-label">高度 (px)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              min="1"
              max="5000"
              placeholder="300"
              className="config-input"
            />
          </div>
          <div className="input-group">
            <label className="input-label">图片格式</label>
            <select
              value={imageFormat}
              onChange={(e) => setImageFormat(e.target.value as 'jpg' | 'webp' | 'none')}
              className="config-select"
            >
              <option value="none">默认 (JPG)</option>
              <option value="jpg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
        </div>
        <button onClick={generateImageUrl} className="generate-btn">
          🖼️ 生成随机图片
        </button>
      </div>

      {/* 图片预览区域 */}
      {imageUrl && (
        <div className="image-preview-section">
          <div className="preview-header">
            <label>图片预览</label>
            <div className="preview-actions">
              <button onClick={generateImageUrl} className="action-btn refresh-btn">
                🔄 刷新图片
              </button>
              <button onClick={copyImageUrl} className="action-btn">
                📋 复制URL
              </button>
              <button onClick={downloadImage} className="action-btn">
                💾 下载图片
              </button>
            </div>
          </div>
          <div className="image-url-display">
            <div className="url-label">图片URL：</div>
            <div className="url-value" title={imageUrl}>
              {imageUrl}
            </div>
          </div>
          <div className="image-container">
            <img
              src={imageUrl}
              alt={`随机图片 ${width}x${height}`}
              className="preview-image"
              onError={() => {
                showMessage.error('图片加载失败，请重试');
              }}
            />
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="info-section">
        <div className="info-header">💡 使用说明</div>
        <ul className="info-list">
          <li>输入宽度和高度（1-5000像素）</li>
          <li>选择图片格式（默认JPG或WebP）</li>
          <li>点击"生成随机图片"按钮生成图片</li>
          <li>图片URL会自动添加时间戳和随机UID参数防止浏览器缓存</li>
          <li>可以复制URL或下载图片</li>
        </ul>
      </div>
    </div>
  );
};

export default RandomImageGenerator;

