import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Card,
  Space,
  Typography,
  Input,
  Button,
  Upload,
  Alert,
  message as antdMessage,
} from 'antd';
import {
  LinkOutlined,
  UploadOutlined,
  ClearOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import lottie from 'lottie-web';
import './index.css';

const { Text } = Typography;

const fetchJson = (url: string) =>
  new Promise<any>((resolve, reject) => {
    if (typeof window.fetch === 'function') {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(resolve)
        .catch(reject);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send();
  });

const readJsonFromFile = (file: File) =>
  new Promise<any>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result as string));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const LottiePreview: React.FC = () => {
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [animationData, setAnimationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<ReturnType<typeof lottie.loadAnimation> | null>(null);

  const destroyAnimation = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.destroy();
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!animationData || !containerRef.current) return;
    destroyAnimation();
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    });

    return () => {
      destroyAnimation();
    };
  }, [animationData, destroyAnimation]);

  const handleLoadFromUrl = useCallback(async () => {
    const url = sourceUrl.trim();
    if (!url) {
      setError('请输入 Lottie JSON 链接');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await fetchJson(url);
      setAnimationData(data);
      antdMessage.success('加载成功');
    } catch (err) {
      setError('加载失败，请检查链接是否可访问或存在跨域限制');
    } finally {
      setLoading(false);
    }
  }, [sourceUrl]);

  const handleFileUpload = useCallback(async (file: File) => {
    const isJson = file.type === 'application/json' || file.name.endsWith('.json');
    if (!isJson) {
      setError('请上传 .json 格式的 Lottie 文件');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB');
      return false;
    }

    try {
      setLoading(true);
      setError('');
      const data = await readJsonFromFile(file);
      setAnimationData(data);
      antdMessage.success('文件加载成功');
    } catch (err) {
      setError('文件解析失败，请确认是有效的 Lottie JSON');
    } finally {
      setLoading(false);
    }
    return false;
  }, []);

  const handleClear = useCallback(() => {
    setSourceUrl('');
    setAnimationData(null);
    setError('');
    destroyAnimation();
  }, [destroyAnimation]);

  return (
    <div className="lottie-preview" style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      <Card size="small" title="输入方式">
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Input
            placeholder="输入 Lottie JSON 链接（https://.../xxx.json）"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            allowClear
          />
          <Space>
            <Button type="primary" icon={<LinkOutlined />} onClick={handleLoadFromUrl} loading={loading}>
              通过链接加载
            </Button>
            <Upload beforeUpload={handleFileUpload} showUploadList={false}>
              <Button icon={<UploadOutlined />} loading={loading}>
                上传 JSON 文件
              </Button>
            </Upload>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              清空
            </Button>
          </Space>
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

      <Card
        size="small"
        title="预览区域"
        extra={
          <Space size="small">
            <PlayCircleOutlined />
            <Text type="secondary">自动播放 / 循环</Text>
          </Space>
        }
      >
        <div className="lottie-preview-canvas" ref={containerRef}>
          {!animationData && <div className="lottie-preview-empty">暂无内容，请输入链接或上传文件</div>}
        </div>
      </Card>

      <Alert
        message="使用说明"
        description={
          <ul style={{ margin: 6, paddingLeft: '6px' }}>
            <li>支持通过链接或上传 .json 文件进行预览</li>
            <li>链接可能受到跨域限制，推荐使用可直接访问的 JSON 地址</li>
            <li>上传文件大小建议不超过 10MB</li>
          </ul>
        }
        type="info"
        showIcon
      />
    </div>
  );
};

export default LottiePreview;
