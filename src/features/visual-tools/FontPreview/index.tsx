import React, { useState } from 'react';
import { Input, Slider, Select, Space, Typography } from 'antd';
import './index.css';

const { Text } = Typography;

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino',
  'Garamond', 'Bookman', 'Lucida Console', 'Monaco', 'Menlo',
  'Consolas', 'Segoe UI', 'Roboto', 'system-ui', '-apple-system',
  'SF Pro Display', 'Inter', 'Fira Code', 'JetBrains Mono', 'Source Code Pro',
];

const SAMPLE_TEXTS: Record<string, string> = {
  pangram: 'The quick brown fox jumps over the lazy dog. 0123456789',
  chinese: '天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。',
  code: 'const fn = (x: number) => x * 2; // 0O 1lI {}[]',
  lorem: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  custom: '',
};

const FontPreview: React.FC = () => {
  const [selectedFonts, setSelectedFonts] = useState<string[]>(['Arial', 'Georgia', 'Courier New', 'system-ui']);
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState(400);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [sampleType, setSampleType] = useState('pangram');
  const [customText, setCustomText] = useState('');

  const displayText = sampleType === 'custom' ? (customText || '输入自定义文本...') : SAMPLE_TEXTS[sampleType];

  return (
    <div className="font-preview">
      <div className="fp-controls">
        <Space size={6} wrap>
          <Select
            mode="multiple"
            size="small"
            value={selectedFonts}
            onChange={setSelectedFonts}
            style={{ minWidth: 200, maxWidth: 360 }}
            placeholder="选择字体"
            options={FONT_FAMILIES.map((f) => ({ value: f, label: f }))}
            maxTagCount={3}
          />
          <Select size="small" value={sampleType} onChange={setSampleType} style={{ width: 100 }}
            options={[
              { value: 'pangram', label: '英文全字' },
              { value: 'chinese', label: '中文' },
              { value: 'code', label: '代码' },
              { value: 'lorem', label: 'Lorem' },
              { value: 'custom', label: '自定义' },
            ]}
          />
        </Space>
        {sampleType === 'custom' && (
          <Input size="small" value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="输入自定义预览文本" />
        )}
        <div className="fp-sliders">
          <div className="fp-slider-row">
            <Text style={{ fontSize: 10, width: 60 }}>大小 {fontSize}px</Text>
            <Slider min={8} max={72} value={fontSize} onChange={setFontSize} style={{ flex: 1 }} />
          </div>
          <div className="fp-slider-row">
            <Text style={{ fontSize: 10, width: 60 }}>粗细 {fontWeight}</Text>
            <Slider min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} style={{ flex: 1 }} />
          </div>
          <div className="fp-slider-row">
            <Text style={{ fontSize: 10, width: 60 }}>行高 {lineHeight}</Text>
            <Slider min={1} max={3} step={0.1} value={lineHeight} onChange={setLineHeight} style={{ flex: 1 }} />
          </div>
          <div className="fp-slider-row">
            <Text style={{ fontSize: 10, width: 60 }}>字距 {letterSpacing}px</Text>
            <Slider min={-2} max={10} step={0.5} value={letterSpacing} onChange={setLetterSpacing} style={{ flex: 1 }} />
          </div>
        </div>
      </div>

      <div className="fp-list">
        {selectedFonts.map((font) => (
          <div key={font} className="fp-card">
            <div className="fp-card-header">
              <span className="fp-font-name">{font}</span>
              <span className="fp-font-meta">{fontSize}px / {fontWeight} / {lineHeight}</span>
            </div>
            <div
              className="fp-card-sample"
              style={{
                fontFamily: `"${font}", sans-serif`,
                fontSize,
                fontWeight,
                lineHeight,
                letterSpacing,
              }}
            >
              {displayText}
            </div>
          </div>
        ))}
        {selectedFonts.length === 0 && (
          <Text type="secondary" style={{ textAlign: 'center', padding: 20 }}>请选择要预览的字体</Text>
        )}
      </div>
    </div>
  );
};

export default FontPreview;
