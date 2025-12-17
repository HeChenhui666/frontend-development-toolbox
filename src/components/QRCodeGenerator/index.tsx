import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import './index.css';

const QRCodeGenerator: React.FC = () => {
  const [url, setUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 获取当前标签页的URL并自动生成二维码
  useEffect(() => {
    // 延迟执行，避免阻塞初始渲染
    const timer = setTimeout(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          setUrl(tabs[0].url);
          // 自动生成二维码
          generateQRCodeForUrl(tabs[0].url);
        }
      });
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
      setError('');
      const dataUrl = await QRCode.toDataURL(urlToGenerate, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
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

  // 复制URL
  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    alert('URL已复制到剪贴板');
  };

  return (
    <div className="generator">
      <div className="input-group">
        <label htmlFor="url-input">URL地址：</label>
        <div className="input-wrapper">
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入或粘贴URL"
            className="url-input"
          />
          <button onClick={copyUrl} className="copy-btn" title="复制当前标签页URL">
            📋
          </button>
        </div>
      </div>
      <button onClick={generateQRCode} className="generate-btn">
        生成二维码
      </button>
      {error && <div className="error">{error}</div>}
      {qrCodeDataUrl && (
        <div className="qr-result">
          <img src={qrCodeDataUrl} alt="QR Code" className="qr-image" />
          <button onClick={downloadQRCode} className="download-btn">
            下载二维码
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;

