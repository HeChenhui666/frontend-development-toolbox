import { useEffect, type FC } from 'react';
import { getMouseTrailConfig, subscribeMouseTrailConfig, type MouseTrailStoredConfig } from '../../../utils/mouseTrailStorage';
import { mountMouseTrail, type MouseTrailHandle } from '../../../utils/mouseTrailRuntime';

/**
 * 读取当前文档上的主题强调色渐变，用于 followTheme 模式。
 * 仅在扩展页面（popup / sidepanel / standalone）生效，内容脚本环境中不含此变量。
 */
function readThemeAccentGradient(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--theme-accentGradient').trim();
}

function resolveConfig(config: MouseTrailStoredConfig): MouseTrailStoredConfig {
  if (config.followTheme && config.mode === 'css') {
    const gradient = readThemeAccentGradient();
    if (gradient) {
      return { ...config, background: gradient };
    }
  }
  return config;
}

/**
 * 在扩展页面（popup / sidepanel / standalone / 聊天窗）上显示拖尾。
 * followTheme 为 true 时自动跟随 --theme-accentGradient，并响应 themeChanged 事件实时切换。
 */
const ExtensionMouseTrail: FC = () => {
  useEffect(() => {
    let handle: MouseTrailHandle | null = null;
    let lastParticleCount = -1;
    let latestConfig: MouseTrailStoredConfig | null = null;

    const apply = (config: MouseTrailStoredConfig) => {
      latestConfig = config;
      const resolved = resolveConfig(config);

      if (!config.enabled) {
        handle?.unmount();
        handle = null;
        lastParticleCount = -1;
        return;
      }

      const n = Math.min(50, Math.max(1, Math.round(config.particleCount)));
      if (!handle || lastParticleCount !== n) {
        handle?.unmount();
        handle = mountMouseTrail(document, resolved);
        lastParticleCount = n;
      } else {
        handle.update(resolved);
      }
    };

    const onThemeChanged = () => {
      if (latestConfig) {
        apply(latestConfig);
      }
    };

    void getMouseTrailConfig().then(apply);
    const unsub = subscribeMouseTrailConfig(apply);
    window.addEventListener('themeChanged', onThemeChanged);

    return () => {
      unsub();
      handle?.unmount();
      handle = null;
      lastParticleCount = -1;
      window.removeEventListener('themeChanged', onThemeChanged);
    };
  }, []);

  return null;
};

export default ExtensionMouseTrail;
