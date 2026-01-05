import React, { useState, useRef } from 'react';
import jsQR from 'jsqr';
import './index.css';
import { showMessage } from '../../utils/message';

const QRCodeDecoder: React.FC = () => {
  const [decodedText, setDecodedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    setError('');
    setDecodedText('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result;
      if (typeof imageData === 'string') {
        setImagePreview(imageData);
        decodeQRCode(imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  const decodeQRCode = (imageSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('无法创建画布');
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setDecodedText(code.data);
        setError('');
      } else {
        setError('未检测到二维码，请确保图片清晰且包含有效的二维码');
      }
    };
    img.onerror = () => {
      setError('图片加载失败');
    };
    img.src = imageSrc;
  };

  const copyDecodedText = () => {
    if (decodedText) {
      navigator.clipboard.writeText(decodedText);
      showMessage.success('已复制到剪贴板');
    }
  };

  const openDecodedUrl = () => {
    if (decodedText && (decodedText.startsWith('http://') || decodedText.startsWith('https://'))) {
      chrome.tabs.create({ url: decodedText });
    } else {
      showMessage.warning('解码内容不是有效的URL');
    }
  };

  const clearAll = () => {
    setDecodedText('');
    setError('');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="decoder">
      <div className="file-upload">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
          id="file-input"
        />
        <label htmlFor="file-input" className="file-label">
          选择二维码图片
        </label>
      </div>

      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Preview" className="preview-image" />
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {decodedText && (
        <div className="decoded-result">
          <div className="result-label">解码结果：</div>
          <div className="result-text">{decodedText}</div>
          <div className="result-actions">
            <button onClick={copyDecodedText} className="action-btn">
              复制
            </button>
            {(decodedText.startsWith('http://') || decodedText.startsWith('https://')) && (
              <button onClick={openDecodedUrl} className="action-btn">
                打开链接
              </button>
            )}
            <button onClick={clearAll} className="action-btn secondary">
              清除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDecoder;

