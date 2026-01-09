import React, { useState, useRef } from 'react';
import './index.css';
import { showMessage } from '../../../utils/message';

type Mode = 'text' | 'image';

const Base64Encoder: React.FC = () => {
  const [mode, setMode] = useState<Mode>('text');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [base64String, setBase64String] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  // 文本编码
  const encodeText = () => {
    if (!inputText.trim()) {
      setError('请输入要编码的文本');
      setOutputText('');
      return;
    }
    try {
      setError('');
      const encoded = btoa(unescape(encodeURIComponent(inputText)));
      setOutputText(encoded);
      showMessage.success('编码成功');
    } catch (err) {
      setError('编码失败');
      setOutputText('');
    }
  };

  // 文本解码
  const decodeText = () => {
    if (!inputText.trim()) {
      setError('请输入要解码的Base64字符串');
      setOutputText('');
      return;
    }
    try {
      setError('');
      const decoded = decodeURIComponent(escape(atob(inputText.trim())));
      setOutputText(decoded);
      showMessage.success('解码成功');
    } catch (err) {
      setError('解码失败，请检查Base64字符串是否正确');
      setOutputText('');
    }
  };

  // 图片转Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 检查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBase64String(result);
      setImagePreview(result);
      setError('');
      showMessage.success('图片转换成功');
    };
    reader.onerror = () => {
      setError('图片读取失败');
    };
    reader.readAsDataURL(file);
  };

  // Base64转图片
  const handleBase64ToImage = () => {
    if (!inputText.trim()) {
      setError('请输入Base64字符串');
      setImagePreview('');
      setBase64String('');
      return;
    }

    try {
      setError('');
      // 移除可能的数据URL前缀
      let base64 = inputText.trim();
      if (base64.includes(',')) {
        base64 = base64.split(',')[1];
      }

      // 验证Base64格式
      if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
        throw new Error('无效的Base64格式');
      }

      // 尝试检测图片格式
      const header = base64.substring(0, 20);
      let mimeType = 'image/png';
      if (header.startsWith('/9j/') || header.startsWith('iVBORw0KGgo')) {
        // 可能是JPEG或PNG，尝试解码
        try {
          const decoded = atob(base64);
          const bytes = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i);
          }
          // 简单的MIME类型检测
          if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
            mimeType = 'image/jpeg';
          } else if (bytes[0] === 0x89 && bytes[1] === 0x50) {
            mimeType = 'image/png';
          } else if (bytes[0] === 0x47 && bytes[1] === 0x49) {
            mimeType = 'image/gif';
          } else if (bytes[0] === 0x52 && bytes[1] === 0x49) {
            mimeType = 'image/webp';
          }
        } catch (e) {
          // 如果解码失败，使用默认类型
        }
      }

      const dataUrl = `data:${mimeType};base64,${base64}`;
      setImagePreview(dataUrl);
      setBase64String(dataUrl);
      showMessage.success('Base64转换成功');
    } catch (err) {
      setError('Base64字符串无效或格式错误');
      setImagePreview('');
      setBase64String('');
    }
  };

  // 复制结果
  const copyResult = () => {
    const textToCopy = mode === 'text' ? outputText : base64String;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      showMessage.success('已复制到剪贴板');
    }
  };

  // 下载图片
  const downloadImage = () => {
    if (!imagePreview) {
      showMessage.warning('没有可下载的图片');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = imagePreview;
      link.download = `image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showMessage.success('图片下载成功');
    } catch (err) {
      showMessage.error('图片下载失败');
    }
  };

  // 清空
  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setImagePreview('');
    setBase64String('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="base64-encoder">
      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
          onClick={() => {
            setMode('text');
            clearAll();
          }}
        >
          📝 文本编码/解码
        </button>
        <button
          className={`mode-btn ${mode === 'image' ? 'active' : ''}`}
          onClick={() => {
            setMode('image');
            clearAll();
          }}
        >
          🖼️ 图片转换
        </button>
      </div>

      {mode === 'text' ? (
        <>
          <div className="input-section">
            <div className="section-header">
              <label>输入文本：</label>
              <div className="action-buttons">
                <button onClick={encodeText} className="action-btn encode-btn">
                  编码
                </button>
                <button onClick={decodeText} className="action-btn decode-btn">
                  解码
                </button>
                <button onClick={clearAll} className="action-btn clear-btn">
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入要编码或解码的文本..."
              className="text-input"
            />
          </div>

          {error && <div className="error">{error}</div>}

          {outputText && (
            <div className="output-section">
              <div className="section-header">
                <label>输出结果：</label>
                <button onClick={copyResult} className="copy-btn">
                  📋 复制
                </button>
              </div>
              <textarea
                value={outputText}
                readOnly
                className="text-input output"
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="image-upload-section">
            <div className="section-header">
              <label>图片转Base64：</label>
            </div>
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="upload-label">
                <span className="upload-icon">📁</span>
                <span>选择图片文件</span>
              </label>
            </div>
          </div>

          <div className="base64-input-section">
            <div className="section-header">
              <label>Base64转图片：</label>
              <div className="action-buttons">
                <button onClick={handleBase64ToImage} className="action-btn convert-btn">
                  转换
                </button>
                <button onClick={clearAll} className="action-btn clear-btn">
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入Base64字符串（支持带或不带data:image前缀）..."
              className="text-input"
            />
          </div>

          {error && <div className="error">{error}</div>}

          {imagePreview && (
            <div className="image-preview-section">
              <div className="section-header">
                <label>图片预览：</label>
                <div className="preview-actions">
                  <button onClick={copyResult} className="copy-btn">
                    📋 复制Base64
                  </button>
                  <button onClick={downloadImage} className="download-btn">
                    💾 下载图片
                  </button>
                </div>
              </div>
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="preview-image" />
              </div>
              {base64String && (
                <div className="base64-display">
                  <div className="base64-label">Base64字符串：</div>
                  <div className="base64-value" title={base64String}>
                    {base64String.length > 200
                      ? `${base64String.substring(0, 200)}...`
                      : base64String}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Base64Encoder;

