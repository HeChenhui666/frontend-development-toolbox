import { useMemo } from 'react';
import type { RunMode } from '../types/feature';

/**
 * 检测当前扩展的运行模式：Popup / Side Panel / Standalone。
 * 仅在组件挂载时计算一次（运行模式在页面生命周期内不变）。
 */
export function useRunMode(): RunMode {
  return useMemo<RunMode>(() => {
    if (typeof window === 'undefined') {
      return { isPopupMode: false, isSidePanelMode: false };
    }

    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const path = window.location.pathname;
    const isSidePanelEntry = /(^|\/)sidepanel\.html$/i.test(path);
    const isPopupEntry = /(^|\/)popup\.html$/i.test(path);
    const isExtensionProtocol = /-extension:$/i.test(window.location.protocol);
    const chromeGlobal = (window as unknown as Record<string, unknown>).chrome as
      | { runtime?: { id?: string } }
      | undefined;
    const hasChromeRuntime = typeof chromeGlobal !== 'undefined' && !!chromeGlobal?.runtime?.id;
    const isSmallWindow = window.innerWidth <= 500 && window.innerHeight <= 650;
    const isPopupHeuristic = (isExtensionProtocol || hasChromeRuntime) && isSmallWindow;

    if (mode === 'sidepanel' || isSidePanelEntry) {
      return { isPopupMode: false, isSidePanelMode: true };
    }
    if (mode === 'popup' || isPopupEntry) {
      return { isPopupMode: true, isSidePanelMode: false };
    }
    if (mode === 'standalone' || /(^|\/)standalone\.html$/i.test(path)) {
      return { isPopupMode: false, isSidePanelMode: false };
    }
    return { isPopupMode: isPopupHeuristic, isSidePanelMode: false };
  }, []);
}
