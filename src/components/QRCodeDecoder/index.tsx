import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Button, Upload, message as antdMessage } from 'antd';
import {
  FileImageOutlined,
  CameraOutlined,
  StopOutlined,
  CopyOutlined,
  ClearOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import './index.css';
import CompatibilityWarning from '../CompatibilityWarning';
import { checkQRCodeFeatures, checkMediaAPIs, checkBasicAPIs } from '../../utils/browserCompatibility';

interface QRCodeResult {
  data: string;
  location: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  };
}

function decodeWithJsQRSafe(
  imageData: ImageData,
  options?: Parameters<typeof jsQR>[3]
): ReturnType<typeof jsQR> {
  const { data, width, height } = imageData;
  if (!data || width < 1 || height < 1) return null;
  if (data.length < width * height * 4) return null;
  try {
    return jsQR(data, width, height, options);
  } catch (err) {
    console.warn('jsQR decode failed:', err);
    return null;
  }
}

const QRCodeDecoder: React.FC = () => {
  const [decodedResults, setDecodedResults] = useState<QRCodeResult[]>([]);
  const decodedResultsRef = useRef<QRCodeResult[]>([]);
  const [error, setError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const scanFailCountRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const allChecks = [...checkQRCodeFeatures(), ...checkMediaAPIs(), ...checkBasicAPIs()];
      const critical = allChecks.filter((c) => !c.supported && !c.fallback);
      setIsCompatible(critical.length === 0);
      if (critical.length > 0) setTimeout(() => antdMessage.warning('当前浏览器可能不完全支持二维码解码功能'), 100);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('请选择图片文件'); return false; }
    if (file.size > 20 * 1024 * 1024) { setError('图片文件大小不能超过 20MB'); return false; }
    setError('');
    setDecodedResults([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result;
      if (typeof imageData === 'string') { setImagePreview(imageData); decodeQRCode(imageData); }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const decodeQRCode = (imageSrc: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { setError('无法创建画布'); return; }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const results: QRCodeResult[] = [];
      const foundData: Set<string> = new Set();
      const maxScanAttempts = 20;
      const scanAttempts = [
        { inversionAttempts: 'dontInvert' as const },
        { inversionAttempts: 'onlyInvert' as const },
        { inversionAttempts: 'attemptBoth' as const },
      ];
      let currentImageData = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
      for (const attempt of scanAttempts) {
        let scanCount = 0;
        let code = decodeWithJsQRSafe(currentImageData, attempt);
        while (code && scanCount < maxScanAttempts) {
          scanCount++;
          if (!foundData.has(code.data)) {
            foundData.add(code.data);
            results.push({ data: code.data, location: code.location });
          }
          const padding = 30;
          const corners = [code.location.topLeftCorner, code.location.topRightCorner, code.location.bottomLeftCorner, code.location.bottomRightCorner];
          const minX = Math.max(0, Math.min(...corners.map((c) => c.x)) - padding);
          const maxX = Math.min(currentImageData.width, Math.max(...corners.map((c) => c.x)) + padding);
          const minY = Math.max(0, Math.min(...corners.map((c) => c.y)) - padding);
          const maxY = Math.min(currentImageData.height, Math.max(...corners.map((c) => c.y)) + padding);
          const maskedData = new Uint8ClampedArray(currentImageData.data);
          for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
              const index = (y * currentImageData.width + x) * 4;
              maskedData[index] = 255; maskedData[index + 1] = 255; maskedData[index + 2] = 255;
            }
          }
          currentImageData = new ImageData(maskedData, currentImageData.width, currentImageData.height);
          code = decodeWithJsQRSafe(currentImageData, attempt);
        }
      }
      const uniqueResults = results.filter((r, i, self) => i === self.findIndex((x) => x.data === r.data));
      if (uniqueResults.length > 0) {
        decodedResultsRef.current = uniqueResults;
        setDecodedResults(uniqueResults);
        setError('');
        antdMessage.success(`成功识别 ${uniqueResults.length} 个二维码`);
      } else {
        decodedResultsRef.current = [];
        setDecodedResults([]);
        setError('未检测到二维码，请确保图片清晰且包含有效的二维码');
      }
    };
    img.onerror = () => setError('图片加载失败');
    img.src = imageSrc;
  };

  const copyDecodedText = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => antdMessage.success('已复制到剪贴板'))
        .catch(() => antdMessage.error('复制失败，请手动复制'));
    }
  };

  const copyAllDecodedText = () => {
    if (decodedResults.length > 0) {
      const allText = decodedResults.map((r, i) => `二维码 ${i + 1}:\n${r.data}`).join('\n\n');
      navigator.clipboard.writeText(allText)
        .then(() => antdMessage.success('已复制所有结果到剪贴板'))
        .catch(() => antdMessage.error('复制失败，请手动复制'));
    }
  };

  const openDecodedUrl = (url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      chrome.tabs.create({ url });
    } else {
      antdMessage.warning('解码内容不是有效的URL');
    }
  };

  const clearAll = () => {
    setDecodedResults([]);
    setError('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    stopScanning();
  };

  const startScanning = async () => {
    try {
      setError('');
      setDecodedResults([]);
      if (!navigator.mediaDevices) {
        setError('您的浏览器不支持摄像头访问 API');
        antdMessage.error('浏览器不支持摄像头');
        return;
      }
      setIsScanning(true);
      scanFailCountRef.current = 0;
      setDecodedResults([]);
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        try { await videoRef.current.play(); } catch (playError) {
          setError('视频播放失败，请点击视频区域重试');
        }
      }
      scanIntervalRef.current = window.setInterval(() => scanQRCode(), 500);
      antdMessage.success('摄像头已启动');
    } catch (err) {
      setIsScanning(false);
      const error = err as Error | DOMException;
      const errorName = error.name || '';
      const errorMessage = error.message || '未知错误';
      let userMessage = '';
      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied')) {
        userMessage = '需要摄像头权限，请在浏览器设置中允许摄像头访问后重试';
      } else if (errorName === 'NotFoundError') {
        userMessage = '未找到摄像头设备，请确保设备已连接摄像头';
      } else if (errorName === 'NotReadableError') {
        userMessage = '摄像头被其他应用占用，请关闭其他使用摄像头的应用后重试';
      } else {
        userMessage = `启动摄像头失败：${errorMessage}`;
      }
      setError(userMessage);
      antdMessage.error('启动摄像头失败');
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    scanFailCountRef.current = 0;
    if (scanIntervalRef.current !== null) { clearInterval(scanIntervalRef.current); scanIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (video.videoWidth < 1 || video.videoHeight < 1) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = decodeWithJsQRSafe(imageData);
    if (code) {
      const existingResult = decodedResultsRef.current.find((r) => r.data === code.data);
      if (!existingResult) {
        setDecodedResults((prev) => {
          const next = [...prev, { data: code.data, location: code.location }];
          decodedResultsRef.current = next;
          return next;
        });
        setError('');
        setImagePreview(canvas.toDataURL('image/png'));
        antdMessage.success('二维码识别成功');
        stopScanning();
      }
    } else {
      scanFailCountRef.current += 1;
      if (scanFailCountRef.current >= 10) { setError('未识别到二维码，已停止扫码'); stopScanning(); }
    }
  };

  useEffect(() => () => { stopScanning(); }, []);

  return (
    <div className="qr-decoder">
      {!isCompatible && (
        <CompatibilityWarning featureName="二维码解码" requiredFeatures={['Canvas', 'MediaDevices', 'FileReader']} />
      )}

      {/* 操作栏 */}
      <div className="qrd-toolbar">
        <Upload accept="image/*" beforeUpload={handleFileSelect} showUploadList={false}>
          <Button icon={<FileImageOutlined />} size="small">选择图片</Button>
        </Upload>
        {!isScanning ? (
          <Button type="primary" icon={<CameraOutlined />} onClick={startScanning} size="small">摄像头扫码</Button>
        ) : (
          <Button danger icon={<StopOutlined />} onClick={stopScanning} size="small">停止扫码</Button>
        )}
        {(imagePreview || decodedResults.length > 0) && (
          <Button icon={<ClearOutlined />} onClick={clearAll} size="small" style={{ marginLeft: 'auto' }}>清除</Button>
        )}
      </div>

      {/* 摄像头视频 */}
      {isScanning && (
        <div className="video-container">
          <video
            ref={videoRef}
            className="scan-video"
            autoPlay
            playsInline
            muted
            onClick={async () => {
              if (videoRef.current && videoRef.current.paused) {
                try { await videoRef.current.play(); setError(''); } catch { /* ignore */ }
              }
            }}
          />
          <div className="scan-overlay">
            <div className="scan-frame" />
            <div className="scan-hint">请将二维码对准扫描框</div>
          </div>
        </div>
      )}

      {/* 图片预览 */}
      {imagePreview && !isScanning && (
        <div className="qrd-preview">
          <img src={imagePreview} alt="Preview" className="qrd-preview-img" />
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="qrd-error" onClick={() => setError('')}>{error}</div>
      )}

      {/* 识别结果 */}
      {decodedResults.length > 0 && (
        <div className="qrd-results">
          <div className="qrd-results-header">
            <span className="qrd-results-title">识别到 {decodedResults.length} 个二维码</span>
            {decodedResults.length > 1 && (
              <Button size="small" icon={<CopyOutlined />} onClick={copyAllDecodedText} type="text">复制全部</Button>
            )}
          </div>
          {decodedResults.map((result, index) => (
            <div key={index} className="qrd-result-item">
              <div className="qrd-result-index">二维码 {index + 1}</div>
              <div className="qrd-result-text">{result.data}</div>
              <div className="qrd-result-actions">
                <Button size="small" icon={<CopyOutlined />} onClick={() => copyDecodedText(result.data)}>复制</Button>
                {(result.data.startsWith('http://') || result.data.startsWith('https://')) && (
                  <Button size="small" icon={<LinkOutlined />} onClick={() => openDecodedUrl(result.data)}>打开链接</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QRCodeDecoder;
