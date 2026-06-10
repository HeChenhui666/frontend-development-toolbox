import React, { useState, useMemo } from 'react';
import { Input, Typography, ColorPicker, Space } from 'antd';
import type { Color } from 'antd/es/color-picker';
import './index.css';

const { Text } = Typography;

const colorToHex = (color: Color): string =>
  typeof color === 'string' ? color : color.toHexString();

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

// 色觉障碍模拟矩阵（基于 Brettel 1997 模型的简化版本）
interface SimulationMatrix {
  name: string;
  label: string;
  description: string;
  prevalence: string;
  matrix: number[][];
}

const SIMULATIONS: SimulationMatrix[] = [
  {
    name: 'protanopia',
    label: '红色盲 (Protanopia)',
    description: '无法感知红色',
    prevalence: '~1% 男性',
    matrix: [
      [0.567, 0.433, 0.000],
      [0.558, 0.442, 0.000],
      [0.000, 0.242, 0.758],
    ],
  },
  {
    name: 'deuteranopia',
    label: '绿色盲 (Deuteranopia)',
    description: '无法感知绿色',
    prevalence: '~1% 男性',
    matrix: [
      [0.625, 0.375, 0.000],
      [0.700, 0.300, 0.000],
      [0.000, 0.300, 0.700],
    ],
  },
  {
    name: 'tritanopia',
    label: '蓝色盲 (Tritanopia)',
    description: '无法感知蓝色',
    prevalence: '~0.003%',
    matrix: [
      [0.950, 0.050, 0.000],
      [0.000, 0.433, 0.567],
      [0.000, 0.475, 0.525],
    ],
  },
  {
    name: 'achromatopsia',
    label: '全色盲 (Achromatopsia)',
    description: '只能看到灰度',
    prevalence: '~0.003%',
    matrix: [
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
    ],
  },
  {
    name: 'protanomaly',
    label: '红色弱 (Protanomaly)',
    description: '红色感知减弱',
    prevalence: '~1% 男性',
    matrix: [
      [0.817, 0.183, 0.000],
      [0.333, 0.667, 0.000],
      [0.000, 0.125, 0.875],
    ],
  },
  {
    name: 'deuteranomaly',
    label: '绿色弱 (Deuteranomaly)',
    description: '绿色感知减弱',
    prevalence: '~5% 男性',
    matrix: [
      [0.800, 0.200, 0.000],
      [0.258, 0.742, 0.000],
      [0.000, 0.142, 0.858],
    ],
  },
];

const simulateColor = (hex: string, matrix: number[][]): string => {
  const [r, g, b] = hexToRgb(hex);
  const newR = matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b;
  const newG = matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b;
  const newB = matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b;
  return rgbToHex(newR, newG, newB);
};

const ColorBlindSimulator: React.FC = () => {
  const [inputColor, setInputColor] = useState('#FF6600');

  const simulations = useMemo(() => {
    return SIMULATIONS.map((sim) => ({
      ...sim,
      simulatedColor: simulateColor(inputColor, sim.matrix),
    }));
  }, [inputColor]);

  return (
    <div className="cb-simulator">
      <div className="cb-input-row">
        <Text style={{ fontSize: 11, fontWeight: 600 }}>选择颜色</Text>
        <Space size={6}>
          <ColorPicker value={inputColor} onChange={(c) => setInputColor(colorToHex(c))} size="small" />
          <Input
            value={inputColor}
            onChange={(e) => setInputColor(e.target.value)}
            size="small"
            style={{ width: 90, fontFamily: 'monospace', fontSize: 11 }}
          />
        </Space>
      </div>

      <div className="cb-original">
        <div className="cb-color-block" style={{ backgroundColor: inputColor }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>正常视觉</div>
          <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--theme-textMuted)' }}>{inputColor}</div>
        </div>
      </div>

      <div className="cb-grid">
        {simulations.map((sim) => (
          <div key={sim.name} className="cb-sim-card">
            <div className="cb-sim-colors">
              <div className="cb-color-block-small" style={{ backgroundColor: inputColor }} title="原色" />
              <span style={{ fontSize: 10, color: 'var(--theme-textMuted)' }}>→</span>
              <div className="cb-color-block-small" style={{ backgroundColor: sim.simulatedColor }} title="模拟" />
            </div>
            <div className="cb-sim-info">
              <div style={{ fontSize: 10, fontWeight: 600 }}>{sim.label}</div>
              <div style={{ fontSize: 9, color: 'var(--theme-textMuted)' }}>{sim.description} · {sim.prevalence}</div>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--theme-textMuted)' }}>{sim.simulatedColor}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorBlindSimulator;
