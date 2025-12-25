export interface PresetParam {
  name: string;
  params: Array<{ key: string; value: string }>;
}

const STORAGE_KEY = 'url-preset-params';

// 默认预设参数
const DEFAULT_PRESETS: PresetParam[] = [];

/**
 * 获取所有预设参数
 */
export const getPresetParams = (): PresetParam[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 验证数据格式
      if (Array.isArray(parsed) && parsed.every(isValidPreset)) {
        return parsed;
      }
    }
    // 如果没有保存的数据或数据格式不正确，返回默认值
    return DEFAULT_PRESETS;
  } catch (error) {
    console.error('Failed to get preset params:', error);
    return DEFAULT_PRESETS;
  }
};

/**
 * 保存预设参数
 */
export const savePresetParams = (presets: PresetParam[]): void => {
  try {
    // 验证数据格式
    if (!Array.isArray(presets) || !presets.every(isValidPreset)) {
      throw new Error('Invalid preset params format');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to save preset params:', error);
  }
};

/**
 * 添加预设参数
 */
export const addPresetParam = (preset: PresetParam): void => {
  const presets = getPresetParams();
  // 检查是否已存在同名预设
  if (presets.some((p) => p.name === preset.name)) {
    throw new Error(`预设 "${preset.name}" 已存在`);
  }
  presets.push(preset);
  savePresetParams(presets);
};

/**
 * 更新预设参数
 */
export const updatePresetParam = (index: number, preset: PresetParam): void => {
  const presets = getPresetParams();
  if (index < 0 || index >= presets.length) {
    throw new Error('Invalid preset index');
  }
  // 检查新名称是否与其他预设冲突
  if (presets.some((p, i) => i !== index && p.name === preset.name)) {
    throw new Error(`预设 "${preset.name}" 已存在`);
  }
  presets[index] = preset;
  savePresetParams(presets);
};

/**
 * 删除预设参数
 */
export const deletePresetParam = (index: number): void => {
  const presets = getPresetParams();
  if (index < 0 || index >= presets.length) {
    throw new Error('Invalid preset index');
  }
  presets.splice(index, 1);
  savePresetParams(presets);
};

/**
 * 验证预设参数格式
 */
const isValidPreset = (preset: any): preset is PresetParam => {
  return (
    typeof preset === 'object' &&
    preset !== null &&
    typeof preset.name === 'string' &&
    preset.name.trim() !== '' &&
    Array.isArray(preset.params) &&
    preset.params.every(
      (p: any) =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.key === 'string' &&
        typeof p.value === 'string'
    )
  );
};

/**
 * 重置为默认预设参数
 */
export const resetPresetParams = (): void => {
  savePresetParams(DEFAULT_PRESETS);
};

