import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Upload,
  message as antdMessage,
} from 'antd';
import {
  FileImageOutlined,
  CameraOutlined,
  StopOutlined,
  CopyOutlined,
  ClearOutlined,
  LinkOutlined,
  CopyOutlined as CopyAllOutlined,
} from '@ant-design/icons';
import './index.css';
import CompatibilityWarning from '../CompatibilityWarning';
import { checkQRCodeFeatures, checkMediaAPIs, checkBasicAPIs } from '../../utils/browserCompatibility';

const { Text } = Typography;

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
    // 某些边界图像在 jsQR 内部 locate 阶段会抛异常，这里兜底为未识别
    console.warn('jsQR decode failed:', err);
    return null;
  }
}

const QRCodeDecoder: React.FC = () => {
  const [decodedResults, setDecodedResults] = useState<QRCodeResult[]>([]);
  const [error, setError] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCompatible, setIsCompatible] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const scanFailCountRef = useRef<number>(0);

  // 检查浏览器兼容性（异步执行，避免阻塞渲染）
  useEffect(() => {
    const performCheck = () => {
      const qrChecks = checkQRCodeFeatures();
      const mediaChecks = checkMediaAPIs();
      const basicChecks = checkBasicAPIs();
      const allChecks = [...qrChecks, ...mediaChecks, ...basicChecks];
      const critical = allChecks.filter((check) => !check.supported && !check.fallback);
      setIsCompatible(critical.length === 0);
      
      if (critical.length > 0) {
        setTimeout(() => {
          antdMessage.warning('当前浏览器可能不完全支持二维码解码功能');
        }, 100);
      }
    };

    // 延迟执行，避免阻塞初始渲染
    const timer = setTimeout(performCheck, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleFileSelect = (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return false;
    }

    setError('');
    setDecodedResults([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result;
      if (typeof imageData === 'string') {
        setImagePreview(imageData);
        decodeQRCode(imageData);
      }
    };
    reader.readAsDataURL(file);
    return false; // 阻止自动上传
  };

  // 识别多个二维码
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
      const results: QRCodeResult[] = [];
      const foundData: Set<string> = new Set(); // 基于内容去重
      const maxScanAttempts = 20; // 最大扫描次数，避免无限循环

      // 使用不同的扫描参数来提高检测率
      const scanAttempts = [
        { inversionAttempts: 'dontInvert' as const },
        { inversionAttempts: 'onlyInvert' as const },
        { inversionAttempts: 'attemptBoth' as const },
      ];

      // 创建原始图像数据的副本用于遮挡
      let currentImageData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );

      for (const attempt of scanAttempts) {
        let scanCount = 0;
        let code = decodeWithJsQRSafe(currentImageData, attempt);
        
        while (code && scanCount < maxScanAttempts) {
          scanCount++;
          
          // 基于内容去重，避免重复添加相同的二维码
          if (!foundData.has(code.data)) {
            foundData.add(code.data);
            results.push({
              data: code.data,
              location: code.location
            });
          }

          // 遮挡已识别的区域，继续查找其他二维码
          const padding = 30; // 增加填充，确保完全遮挡
          const corners = [
            code.location.topLeftCorner,
            code.location.topRightCorner,
            code.location.bottomLeftCorner,
            code.location.bottomRightCorner
          ];
          
          const minX = Math.max(0, Math.min(...corners.map(c => c.x)) - padding);
          const maxX = Math.min(currentImageData.width, Math.max(...corners.map(c => c.x)) + padding);
          const minY = Math.max(0, Math.min(...corners.map(c => c.y)) - padding);
          const maxY = Math.min(currentImageData.height, Math.max(...corners.map(c => c.y)) + padding);
          
          // 在已识别区域绘制白色矩形以遮挡
          const maskedData = new Uint8ClampedArray(currentImageData.data);
          for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
              const index = (y * currentImageData.width + x) * 4;
              maskedData[index] = 255;     // R
              maskedData[index + 1] = 255; // G
              maskedData[index + 2] = 255; // B
              // A 保持不变
            }
          }
          
          currentImageData = new ImageData(maskedData, currentImageData.width, currentImageData.height);
          code = decodeWithJsQRSafe(currentImageData, attempt);
        }
      }

      // 去重（基于内容）
      const uniqueResults = results.filter((result, index, self) =>
        index === self.findIndex((r) => r.data === result.data)
      );

      if (uniqueResults.length > 0) {
        setDecodedResults(uniqueResults);
        setError('');
        antdMessage.success(`成功识别 ${uniqueResults.length} 个二维码`);
      } else {
        setDecodedResults([]);
        setError('未检测到二维码，请确保图片清晰且包含有效的二维码');
      }
    };
    img.onerror = () => {
      setError('图片加载失败');
    };
    img.src = imageSrc;
  };

  const copyDecodedText = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      antdMessage.success('已复制到剪贴板');
    }
  };

  const copyAllDecodedText = () => {
    if (decodedResults.length > 0) {
      const allText = decodedResults.map((r, i) => `二维码 ${i + 1}:\n${r.data}`).join('\n\n');
      navigator.clipboard.writeText(allText);
      antdMessage.success('已复制所有结果到剪贴板');
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopScanning();
  };


  // 开始摄像头扫码
  const startScanning = async () => {
    try {
      setError('');
      setDecodedResults([]);

      // 检查是否在安全上下文中
      if (typeof window === 'undefined' || !window.isSecureContext) {
        console.warn('当前不在安全上下文中');
      }

      // 检查 mediaDevices 是否可用
      if (!navigator.mediaDevices) {
        console.error('navigator.mediaDevices 不可用');
        setError('您的浏览器不支持摄像头访问 API，请使用最新版本的 Chrome、Edge 或 Firefox 浏览器');
        antdMessage.error('浏览器不支持摄像头');
        return;
      }

      if (!navigator.mediaDevices.getUserMedia) {
        // 尝试使用旧版 API
        const getUserMedia = 
          (navigator as any).getUserMedia || 
          (navigator as any).webkitGetUserMedia || 
          (navigator as any).mozGetUserMedia;
        
        if (!getUserMedia) {
          setError('您的浏览器不支持摄像头访问，请使用 Chrome、Edge 或 Firefox 浏览器');
          antdMessage.error('浏览器不支持摄像头');
          return;
        }

        // 使用旧版 API（需要 Promise 包装）
        const stream = await new Promise<MediaStream>((resolve, reject) => {
          getUserMedia.call(
            navigator,
            { video: { facingMode: 'environment' } },
            resolve,
            reject
          );
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        setIsScanning(true);
        scanFailCountRef.current = 0;
        setDecodedResults([]);
        scanIntervalRef.current = window.setInterval(() => {
          scanQRCode();
        }, 500);

        antdMessage.success('摄像头已启动');
        return;
      }

      // 使用新版 API
      setIsScanning(true);
      scanFailCountRef.current = 0;
      setDecodedResults([]);

      // 先尝试后置摄像头，如果失败则使用默认摄像头
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (err) {
        // 如果后置摄像头失败，尝试使用默认摄像头
        console.log('后置摄像头不可用，尝试使用默认摄像头');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('视频播放失败:', playError);
          // 如果自动播放失败，尝试用户交互后播放
          setError('视频播放失败，请点击视频区域重试');
          antdMessage.warning('需要用户交互才能播放视频');
        }
      }

      // 开始扫描
      scanIntervalRef.current = window.setInterval(() => {
        scanQRCode();
      }, 500); // 每500ms扫描一次

      antdMessage.success('摄像头已启动');
    } catch (err) {
      setIsScanning(false);
      
      const error = err as Error | DOMException;
      const errorName = error.name || '';
      const errorMessage = error.message || '未知错误';
      
      // 输出详细的错误信息到控制台，方便调试
      console.error('=== 摄像头启动失败 ===');
      console.error('错误名称:', errorName);
      console.error('错误信息:', errorMessage);
      console.error('完整错误对象:', err);
      console.error('navigator.mediaDevices 可用:', !!navigator.mediaDevices);
      console.error('getUserMedia 可用:', !!(navigator.mediaDevices?.getUserMedia));
      console.error('当前协议:', window.location.protocol);
      console.error('是否安全上下文:', window.isSecureContext);
      console.error('==================');
      
      let userMessage = '';
      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        userMessage = '需要摄像头权限。请按以下步骤操作：\n1. 点击地址栏左侧的锁图标\n2. 在"摄像头"选项中选择"允许"\n3. 刷新扩展后重试';
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError' || errorMessage.includes('NotFoundError')) {
        userMessage = '未找到摄像头设备。请确保：\n1. 您的设备已连接摄像头\n2. 摄像头驱动已正确安装\n3. 摄像头未被禁用';
      } else if (errorName === 'NotReadableError' || errorMessage.includes('NotReadableError')) {
        userMessage = '摄像头被其他应用占用。请：\n1. 关闭其他使用摄像头的应用（如 Zoom、Teams 等）\n2. 关闭其他浏览器标签页中可能使用摄像头的页面\n3. 重试';
      } else if (errorName === 'OverconstrainedError' || errorMessage.includes('OverconstrainedError')) {
        userMessage = '摄像头不支持请求的配置，正在尝试使用默认配置...';
        // 尝试使用更简单的配置
        try {
          console.log('尝试使用默认摄像头配置...');
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('webkit-playsinline', 'true');
            await videoRef.current.play();
          }
          setIsScanning(true);
          scanFailCountRef.current = 0;
          scanIntervalRef.current = window.setInterval(() => {
            scanQRCode();
          }, 500);
          antdMessage.success('摄像头已启动');
          return;
        } catch (retryErr) {
          console.error('使用默认配置也失败:', retryErr);
          userMessage = '启动摄像头失败，请检查摄像头是否正常工作。如果问题持续，请查看浏览器控制台的详细错误信息。';
        }
      } else {
        userMessage = `启动摄像头失败：${errorMessage}\n\n如果问题持续，请：\n1. 打开浏览器开发者工具（F12）\n2. 查看控制台中的详细错误信息\n3. 检查浏览器和扩展是否已更新到最新版本`;
      }
      
      setError(userMessage);
      antdMessage.error('启动摄像头失败');
    }
  };

  // 停止摄像头扫码
  const stopScanning = () => {
    setIsScanning(false);
    scanFailCountRef.current = 0;
    
    if (scanIntervalRef.current !== null) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 从视频流中扫描二维码（摄像头模式，只识别第一个）
  const scanQRCode = () => {
    const video = videoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    if (video.videoWidth < 1 || video.videoHeight < 1) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = decodeWithJsQRSafe(imageData);

    if (code) {
      // 检查是否已经识别过这个二维码（避免重复）
      const existingResult = decodedResults.find(r => r.data === code.data);
      if (!existingResult) {
        const newResult: QRCodeResult = {
          data: code.data,
          location: code.location
        };
        setDecodedResults(prev => [...prev, newResult]);
        setError('');
        setImagePreview(canvas.toDataURL('image/png'));
        antdMessage.success('二维码识别成功');

        // 第一次识别到结果后自动停止扫码
        stopScanning();
      }
    } else {
      scanFailCountRef.current += 1;
      if (scanFailCountRef.current >= 10) {
        setError('未识别到二维码，已停止扫码');
        stopScanning();
      }
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="decoder" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      {!isCompatible && (
        <CompatibilityWarning
          featureName="二维码解码"
          requiredFeatures={['Canvas', 'MediaDevices', 'FileReader']}
        />
      )}
      
      <Card size="small" title="选择识别方式">
        <Space wrap>
          <Upload
            accept="image/*"
            beforeUpload={handleFileSelect}
            showUploadList={false}
          >
            <Button icon={<FileImageOutlined />}>
              选择二维码图片
            </Button>
          </Upload>
          {!isScanning ? (
            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={startScanning}
            >
              摄像头扫码
            </Button>
          ) : (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={stopScanning}
            >
              停止扫码
            </Button>
          )}
        </Space>
      </Card>

      {isScanning && (
        <Card size="small" title="摄像头扫描">
          <div className="video-container" style={{ position: 'relative', width: '100%', maxWidth: '100%' }}>
            <video
              ref={videoRef}
              className="scan-video"
              autoPlay
              playsInline
              muted
              style={{ width: '100%', maxWidth: '100%', borderRadius: '4px'}}
              onClick={async () => {
                // 如果视频没有播放，点击后尝试播放
                if (videoRef.current && videoRef.current.paused) {
                  try {
                    await videoRef.current.play();
                    setError('');
                  } catch (err) {
                    console.error('手动播放失败:', err);
                  }
                }
              }}
            />
            <div className="scan-overlay">
              <div className="scan-frame"></div>
              <div className="scan-hint">请将二维码对准扫描框</div>
            </div>
          </div>
        </Card>
      )}

      {imagePreview && !isScanning && (
        <Card size="small" title="图片预览">
          <div style={{ textAlign: 'center' }}>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px'}}
            />
          </div>
        </Card>
      )}

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
        />
      )}

      {decodedResults.length > 0 && (
        <Card 
          size="small" 
          title={`识别到 ${decodedResults.length} 个二维码`}
          extra={
            decodedResults.length > 1 && (
              <Button
                size="small"
                icon={<CopyAllOutlined />}
                onClick={copyAllDecodedText}
              >
                复制全部
              </Button>
            )
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {decodedResults.map((result, index) => (
              <Card key={index} size="small">
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Text strong>二维码 {index + 1}</Text>
                  <Text code copyable style={{ wordBreak: 'break-all', display: 'block' }}>
                    {result.data}
                  </Text>
                  <Space>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyDecodedText(result.data)}
                    >
                      复制
                    </Button>
                    {(result.data.startsWith('http://') || result.data.startsWith('https://')) && (
                      <Button
                        size="small"
                        icon={<LinkOutlined />}
                        onClick={() => openDecodedUrl(result.data)}
                      >
                        打开链接
                      </Button>
                    )}
                  </Space>
                </Space>
              </Card>
            ))}
            <Button
              icon={<ClearOutlined />}
              onClick={clearAll}
              block
            >
              清除全部
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default QRCodeDecoder;

