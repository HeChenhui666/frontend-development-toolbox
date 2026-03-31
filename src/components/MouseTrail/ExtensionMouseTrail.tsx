import { useEffect, type FC } from 'react';
import { getMouseTrailConfig, subscribeMouseTrailConfig, type MouseTrailStoredConfig } from '../../utils/mouseTrailStorage';
import { mountMouseTrail, type MouseTrailHandle } from '../../utils/mouseTrailRuntime';

/**
 * 在扩展页面（popup / sidepanel / standalone / 聊天窗）上显示拖尾：仅依赖「启用」。
 */
const ExtensionMouseTrail: FC = () => {
  useEffect(() => {
    let handle: MouseTrailHandle | null = null;
    let lastParticleCount = -1;

    const apply = (config: MouseTrailStoredConfig) => {
      if (!config.enabled) {
        handle?.unmount();
        handle = null;
        lastParticleCount = -1;
        return;
      }

      const n = Math.min(50, Math.max(1, Math.round(config.particleCount)));
      if (!handle || lastParticleCount !== n) {
        handle?.unmount();
        handle = mountMouseTrail(document, config);
        lastParticleCount = n;
      } else {
        handle.update(config);
      }
    };

    void getMouseTrailConfig().then(apply);
    const unsub = subscribeMouseTrailConfig(apply);

    return () => {
      unsub();
      handle?.unmount();
      handle = null;
      lastParticleCount = -1;
    };
  }, []);

  return null;
};

export default ExtensionMouseTrail;
