import React, { useState, useCallback, useRef } from 'react';
import { Button, Input, Select, Space, Typography, message as antdMessage } from 'antd';
import { CopyOutlined, ClearOutlined } from '@ant-design/icons';
import './index.css';

const { Text } = Typography;

// 使用数组拼接确保每行的前导空格精确保留
const ASCII_PRESETS: Record<string, string> = {
  cat: [
    '  /\\_/\\',
    ' ( o.o )',
    '  > ^ <',
    ' /|   |\\',
    '(_|   |_)',
  ].join('\n'),
  dog: [
    '    / \\__',
    '   (    @\\___',
    '   /         O',
    '  /   (_____/',
    ' /_____/   U',
  ].join('\n'),
  heart: [
    '  .:::.   .:::.  ',
    ' :::::::.::::::::',
    ' ::::::::::::::::',
    "  '::::::::::'   ",
    "    ':::::::'    ",
    "      ':::'      ",
    "       ':'       ",
  ].join('\n'),
  coffee: [
    '      )  )',
    '     (  ( ',
    '   .______.',
    '   |      |]',
    '   \\      /',
    "    `----'",
  ].join('\n'),
  rocket: [
    '      /\\',
    '     /  \\',
    '    / .. \\',
    '   |  /\\  |',
    '   | /  \\ |',
    '   |/    \\|',
    '   /|    |\\',
    '  / |    | \\',
    ' /__|    |__\\',
    '     |  |',
    '     |  |',
    '    /|  |\\',
    '   /_|__|_\\',
    '      /\\',
    '     /  \\',
  ].join('\n')
};

const BORDER_STYLES: Record<string, { tl: string; tr: string; bl: string; br: string; h: string; v: string }> = {
  simple: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  heavy: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
  stars: { tl: '*', tr: '*', bl: '*', br: '*', h: '*', v: '*' },
};

function addBorder(text: string, style: string): string {
  const border = BORDER_STYLES[style] || BORDER_STYLES.simple;
  const lines = text.split('\n');
  const maxWidth = Math.max(...lines.map((l) => l.length));
  const padded = lines.map((l) => `${border.v} ${l.padEnd(maxWidth)} ${border.v}`);
  const top = `${border.tl}${border.h.repeat(maxWidth + 2)}${border.tr}`;
  const bottom = `${border.bl}${border.h.repeat(maxWidth + 2)}${border.br}`;
  return [top, ...padded, bottom].join('\n');
}

function textToAscii(text: string, style: 'normal' | 'big' | 'banner'): string {
  if (style === 'normal') return text;
  if (style === 'banner') {
    // 简易大字母生成器（仅大写英文字母）
    const bigLetters: Record<string, string[]> = {
      'A': ['  █  ', ' █ █ ', '█████', '█   █', '█   █'],
      'B': ['████ ', '█   █', '████ ', '█   █', '████ '],
      'C': [' ████', '█    ', '█    ', '█    ', ' ████'],
      'D': ['████ ', '█   █', '█   █', '█   █', '████ '],
      'E': ['█████', '█    ', '███  ', '█    ', '█████'],
      'F': ['█████', '█    ', '███  ', '█    ', '█    '],
      'G': [' ████', '█    ', '█ ███', '█   █', ' ████'],
      'H': ['█   █', '█   █', '█████', '█   █', '█   █'],
      'I': ['█████', '  █  ', '  █  ', '  █  ', '█████'],
      'J': ['█████', '   █ ', '   █ ', '█  █ ', ' ██  '],
      'K': ['█  █ ', '█ █  ', '██   ', '█ █  ', '█  █ '],
      'L': ['█    ', '█    ', '█    ', '█    ', '█████'],
      'M': ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
      'N': ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
      'O': [' ███ ', '█   █', '█   █', '█   █', ' ███ '],
      'P': ['████ ', '█   █', '████ ', '█    ', '█    '],
      'Q': [' ███ ', '█   █', '█ █ █', '█  █ ', ' ██ █'],
      'R': ['████ ', '█   █', '████ ', '█ █  ', '█  █ '],
      'S': [' ████', '█    ', ' ███ ', '    █', '████ '],
      'T': ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
      'U': ['█   █', '█   █', '█   █', '█   █', ' ███ '],
      'V': ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
      'W': ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
      'X': ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
      'Y': ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
      'Z': ['█████', '   █ ', '  █  ', ' █   ', '█████'],
      ' ': ['     ', '     ', '     ', '     ', '     '],
    };

    const upper = text.toUpperCase();
    const rows = ['', '', '', '', ''];
    for (const char of upper) {
      const pattern = bigLetters[char] || bigLetters[' '];
      for (let r = 0; r < 5; r++) {
        rows[r] += pattern[r] + ' ';
      }
    }
    return rows.join('\n');
  }
  return text;
}

const AsciiArt: React.FC = () => {
  const [canvas, setCanvas] = useState(ASCII_PRESETS.cat);
  const [borderStyle, setBorderStyle] = useState('none');
  const [textInput, setTextInput] = useState('');
  const [textStyle, setTextStyle] = useState<'normal' | 'big' | 'banner'>('banner');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyBorder = useCallback(() => {
    if (borderStyle === 'none') return;
    setCanvas((prev) => addBorder(prev, borderStyle));
  }, [borderStyle]);

  const generateFromText = useCallback(() => {
    if (!textInput.trim()) { antdMessage.warning('请输入文本'); return; }
    const result = textToAscii(textInput.trim(), textStyle);
    setCanvas(result);
  }, [textInput, textStyle]);

  const loadPreset = useCallback((key: string) => {
    setCanvas(ASCII_PRESETS[key]);
  }, []);

  const copyCanvas = useCallback(() => {
    navigator.clipboard?.writeText(canvas).then(() => antdMessage.success('已复制'));
  }, [canvas]);

  const clearCanvas = useCallback(() => {
    setCanvas('');
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="ascii-art">
      <div className="aa-controls">
        <Text strong style={{ fontSize: 12 }}>预设图案</Text>
        <div className="aa-presets">
          {Object.keys(ASCII_PRESETS).map((key) => {
            const labels: Record<string, string> = {
              cat: '🐱 猫咪', dog: '🐶 小狗', heart: '❤️ 爱心', coffee: '☕ 咖啡', rocket: '🚀 火箭',
            };
            return (
              <Button key={key} size="small" type="text" onClick={() => loadPreset(key)}>
                {labels[key] || key}
              </Button>
            );
          })}
        </div>

        <Text strong style={{ fontSize: 12, marginTop: 4 }}>文字转 ASCII</Text>
        <div className="aa-text-gen">
          <Input
            size="small"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="输入英文文本..."
            style={{ flex: 1 }}
            onPressEnter={generateFromText}
          />
          <Select size="small" value={textStyle} onChange={setTextStyle} style={{ width: 80 }}
            options={[{ value: 'banner', label: '大字' }, { value: 'normal', label: '普通' }]} />
          <Button size="small" type="primary" onClick={generateFromText}>生成</Button>
        </div>

        <Space size={6}>
          <Select size="small" value={borderStyle} onChange={setBorderStyle} style={{ width: 100 }}
            options={[
              { value: 'none', label: '无边框' },
              { value: 'simple', label: '简单 +-|' },
              { value: 'double', label: '双线 ╔╗' },
              { value: 'rounded', label: '圆角 ╭╮' },
              { value: 'heavy', label: '粗线 ┏┓' },
              { value: 'stars', label: '星号 ***' },
            ]}
          />
          <Button size="small" onClick={applyBorder} disabled={borderStyle === 'none'}>添加边框</Button>
          <Button size="small" icon={<CopyOutlined />} onClick={copyCanvas}>复制</Button>
          <Button size="small" icon={<ClearOutlined />} onClick={clearCanvas}>清空</Button>
        </Space>
      </div>

      <textarea
        ref={textareaRef}
        className="aa-canvas"
        value={canvas}
        onChange={(e) => setCanvas(e.target.value)}
        spellCheck={false}
        placeholder="在此创作 ASCII 艺术..."
      />
    </div>
  );
};

export default AsciiArt;
