import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import './index.css';
import { showMessage } from '../../utils/message';
import CompatibilityWarning from '../CompatibilityWarning';
import { checkQRCodeFeatures, checkBasicAPIs } from '../../utils/browserCompatibility';

const QRCodeGenerator: React.FC = () => {
  const [url, setUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isCompatible, setIsCompatible] = useState<boolean>(true);

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
          showMessage.warning('当前浏览器可能不完全支持二维码生成功能');
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

  // 复制URL（兼容性处理）
  const copyUrl = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showMessage.success('URL已复制到剪贴板');
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
          showMessage.success('URL已复制到剪贴板');
        } catch (err) {
          showMessage.error('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      showMessage.error('复制失败，请手动复制');
    }
  };

  return (
    <div className="generator">
      {!isCompatible && (
        <CompatibilityWarning
          featureName="二维码生成"
          requiredFeatures={['Canvas', 'Image']}
        />
      )}
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

