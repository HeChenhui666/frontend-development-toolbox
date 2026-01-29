import React, { useState, useRef } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Segmented,
  Upload,
  message as antdMessage,
} from 'antd';
import {
  CopyOutlined,
  ClearOutlined,
  DownloadOutlined,
  FileImageOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import './index.css';
import { showMessage } from '../../../utils/message';

const { TextArea } = Typography;

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
      antdMessage.success('编码成功');
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
      antdMessage.success('解码成功');
    } catch (err) {
      setError('解码失败，请检查Base64字符串是否正确');
      setOutputText('');
    }
  };

  // 图片转Base64
  const handleImageUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return false;
    }

    // 检查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过10MB');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBase64String(result);
      setImagePreview(result);
      setError('');
      antdMessage.success('图片转换成功');
    };
    reader.onerror = () => {
      setError('图片读取失败');
    };
    reader.readAsDataURL(file);
    return false; // 阻止自动上传
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
      antdMessage.success('Base64转换成功');
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
      antdMessage.success('已复制到剪贴板');
    }
  };

  // 下载图片
  const downloadImage = () => {
    if (!imagePreview) {
      antdMessage.warning('没有可下载的图片');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = imagePreview;
      link.download = `image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      antdMessage.success('图片下载成功');
    } catch (err) {
      antdMessage.error('图片下载失败');
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
    <div className="base64-encoder" style={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12', overflowY: 'auto' }}>
      <Card size="small" title="选择模式">
        <Segmented
          options={[
            { label: '文本编码/解码', value: 'text', icon: <LockOutlined /> },
            { label: '图片转换', value: 'image', icon: <FileImageOutlined /> },
          ]}
          value={mode}
          onChange={(value) => {
            setMode(value as Mode);
            clearAll();
          }}
          block
        />
      </Card>

      {mode === 'text' ? (
        <>
          <Card
            size="small"
            title="输入文本"
            extra={
              <Space>
                <Button onClick={encodeText} icon={<LockOutlined />}>
                  编码
                </Button>
                <Button onClick={decodeText} icon={<UnlockOutlined />}>
                  解码
                </Button>
                <Button icon={<ClearOutlined />} onClick={clearAll}>
                  清空
                </Button>
              </Space>
            }
          >
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入要编码或解码的文本..."
              rows={6}
            />
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

          {outputText && (
            <Card
              size="small"
              title="输出结果"
              extra={
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={copyResult}
                >
                  复制
                </Button>
              }
            >
              <TextArea
                value={outputText}
                readOnly
                rows={6}
              />
            </Card>
          )}
        </>
      ) : (
        <>
          <Card size="small" title="图片转Base64">
            <Upload
              accept="image/*"
              beforeUpload={handleImageUpload}
              showUploadList={false}
            >
              <Button icon={<FileImageOutlined />} block>
                选择图片文件
              </Button>
            </Upload>
          </Card>

          <Card
            size="small"
            title="Base64转图片"
            extra={
              <Space>
                <Button onClick={handleBase64ToImage}>
                  转换
                </Button>
                <Button icon={<ClearOutlined />} onClick={clearAll}>
                  清空
                </Button>
              </Space>
            }
          >
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入Base64字符串（支持带或不带data:image前缀）..."
              rows={6}
            />
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

          {imagePreview && (
            <Card
              size="small"
              title="图片预览"
              extra={
                <Space>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={copyResult}
                  >
                    复制Base64
                  </Button>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={downloadImage}
                  >
                    下载图片
                  </Button>
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                  />
                </div>
                {base64String && (
                  <Alert
                    message={
                      <Text code style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                        {base64String.length > 200
                          ? `${base64String.substring(0, 200)}...`
                          : base64String}
                      </Text>
                    }
                    type="info"
                    showIcon={false}
                  />
                )}
              </Space>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Base64Encoder;

