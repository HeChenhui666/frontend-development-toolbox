import React, { useState, useRef, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Alert,
  Select,
  Slider,
  ColorPicker,
  message as antdMessage,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import {
  DownloadOutlined,
  CopyOutlined,
  BarcodeOutlined,
} from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

interface BarcodeFormat {
  value: string;
  label: string;
  placeholder: string;
  validate: (value: string) => boolean;
}

const BARCODE_FORMATS: BarcodeFormat[] = [
  { value: 'CODE128', label: 'Code 128 (通用)', placeholder: '任意 ASCII 字符', validate: (v) => v.length > 0 },
  { value: 'EAN13', label: 'EAN-13 (商品码)', placeholder: '12-13 位数字', validate: (v) => /^\d{12,13}$/.test(v) },
  { value: 'EAN8', label: 'EAN-8', placeholder: '7-8 位数字', validate: (v) => /^\d{7,8}$/.test(v) },
  { value: 'UPC', label: 'UPC-A', placeholder: '11-12 位数字', validate: (v) => /^\d{11,12}$/.test(v) },
  { value: 'CODE39', label: 'Code 39', placeholder: '大写字母、数字、特殊符号', validate: (v) => /^[A-Z0-9\-\.\ \$\/\+\%]+$/.test(v) },
  { value: 'ITF14', label: 'ITF-14 (物流)', placeholder: '13-14 位数字', validate: (v) => /^\d{13,14}$/.test(v) },
  { value: 'MSI', label: 'MSI', placeholder: '纯数字', validate: (v) => /^\d+$/.test(v) },
  { value: 'pharmacode', label: 'Pharmacode (医药)', placeholder: '3-131070 之间的数字', validate: (v) => { const n = parseInt(v, 10); return !isNaN(n) && n >= 3 && n <= 131070; } },
];

const colorToHex = (color: Color): string => {
  return typeof color === 'string' ? color : color.toHexString();
};

const BarcodeGenerator: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [format, setFormat] = useState('CODE128');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState('');
  const [error, setError] = useState('');
  const [lineColor, setLineColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [barWidth, setBarWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const [showText, setShowText] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedFormat = BARCODE_FORMATS.find((f) => f.value === format) || BARCODE_FORMATS[0];

  const generateBarcode = useCallback(() => {
    if (!inputValue.trim()) {
      setError('请输入条形码内容');
      setBarcodeDataUrl('');
      return;
    }

    if (!selectedFormat.validate(inputValue.trim())) {
      setError(`输入内容不符合 ${selectedFormat.label} 格式要求`);
      setBarcodeDataUrl('');
      return;
    }

    setError('');

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      JsBarcode(canvas, inputValue.trim(), {
        format,
        width: barWidth,
        height,
        displayValue: showText,
        lineColor,
        background: backgroundColor,
        margin: 10,
        fontSize: 14,
        font: 'monospace',
      });

      setBarcodeDataUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('Barcode generation error:', err);
      setError('生成条形码失败，请检查输入内容是否符合所选格式');
      setBarcodeDataUrl('');
    }
  }, [inputValue, format, barWidth, height, showText, lineColor, backgroundColor, selectedFormat]);

  const downloadBarcode = () => {
    if (!barcodeDataUrl) return;
    const link = document.createElement('a');
    link.download = `barcode_${format}.png`;
    link.href = barcodeDataUrl;
    link.click();
  };

  const copyBarcode = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvasRef.current!.toBlob(resolve, 'image/png'));
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        antdMessage.success('条形码已复制到剪贴板');
      }
    } catch {
      antdMessage.error('复制失败，请手动下载');
    }
  };

  return (
    <div style={{ padding: '6px', height: '100%', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
      <Card
        size="small"
        title={<Space><BarcodeOutlined /><Text strong>条形码生成器</Text></Space>}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              value={format}
              onChange={(v) => { setFormat(v); setError(''); setBarcodeDataUrl(''); }}
              options={BARCODE_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
              style={{ width: 180 }}
              size="small"
            />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={selectedFormat.placeholder}
              onPressEnter={generateBarcode}
              size="small"
              style={{ flex: 1 }}
            />
          </div>

          <div className="barcode-style-row">
            <div className="barcode-style-item">
              <Text style={{ fontSize: 11 }}>线条色</Text>
              <ColorPicker value={lineColor} onChange={(c) => setLineColor(colorToHex(c))} size="small" />
            </div>
            <div className="barcode-style-item">
              <Text style={{ fontSize: 11 }}>背景色</Text>
              <ColorPicker value={backgroundColor} onChange={(c) => setBackgroundColor(colorToHex(c))} size="small" />
            </div>
            <div className="barcode-style-item" style={{ flex: 1 }}>
              <Text style={{ fontSize: 11 }}>线宽 {barWidth}</Text>
              <Slider min={1} max={4} value={barWidth} onChange={setBarWidth} style={{ flex: 1, margin: '0 4px' }} />
            </div>
            <div className="barcode-style-item" style={{ flex: 1 }}>
              <Text style={{ fontSize: 11 }}>高度 {height}</Text>
              <Slider min={30} max={200} value={height} onChange={setHeight} style={{ flex: 1, margin: '0 4px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<BarcodeOutlined />} onClick={generateBarcode} style={{ flex: 1 }}>
              生成条形码
            </Button>
            <Button
              size="middle"
              onClick={() => setShowText(!showText)}
              type={showText ? 'default' : 'dashed'}
            >
              {showText ? '隐藏文字' : '显示文字'}
            </Button>
          </div>
        </Space>
      </Card>

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />}

      {/* 隐藏的 canvas 用于 JsBarcode 渲染 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {barcodeDataUrl && (
        <Card
          size="small"
          title="条形码预览"
          extra={
            <Space size="small">
              <Button size="small" icon={<CopyOutlined />} onClick={copyBarcode}>复制</Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={downloadBarcode}>下载</Button>
            </Space>
          }
        >
          <div style={{ textAlign: 'center', padding: 8, background: backgroundColor, borderRadius: 4 }}>
            <img src={barcodeDataUrl} alt="Barcode" style={{ maxWidth: '100%', height: 'auto' }} />
          </div>
        </Card>
      )}
    </div>
  );
};

export default BarcodeGenerator;
