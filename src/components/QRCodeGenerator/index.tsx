import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Alert,
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
    <div className="generator" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
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
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={downloadQRCode}
            >
              下载
            </Button>
          }
        >
          <div style={{ textAlign: 'center' }}>
            <img 
              src={qrCodeDataUrl} 
              alt="QR Code" 
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default QRCodeGenerator;

