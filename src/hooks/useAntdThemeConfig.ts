import { useMemo, useState, useEffect } from 'react';
import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

/**
 * 从 CSS 变量动态生成 Antd ConfigProvider 的 theme 配置。
 * 监听主题变化事件，自动更新配置。
 */
export function useAntdThemeConfig(): ThemeConfig {
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const bump = () => setThemeVersion(v => v + 1);
    const onStorage = (e: StorageEvent) => { if (e.key === 'app-theme') bump(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('themeChanged', bump);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('themeChanged', bump);
    };
  }, []);

  return useMemo<ThemeConfig>(() => {
    const root = getComputedStyle(document.documentElement);
    const v = (name: string) => root.getPropertyValue(name).trim() || undefined;
    const appRadius = parseInt(root.getPropertyValue('--app-radius') || '6', 10);
    return {
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: v('--theme-primary') || v('--theme-buttonPrimary'),
        colorSuccess: v('--theme-success'),
        colorError: v('--theme-error'),
        colorWarning: '#faad14',
        colorInfo: v('--theme-primary') || v('--theme-buttonPrimary'),
        borderRadius: appRadius,
        borderRadiusSM: Math.max(2, appRadius - 2),
        borderRadiusLG: appRadius + 2,
        padding: 6,
        paddingXXS: 4,
        paddingXS: 6,
        paddingSM: 8,
        paddingLG: 12,
        paddingXL: 16,
        colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
        colorText: v('--theme-text'),
        colorTextSecondary: v('--theme-textSecondary'),
        colorTextTertiary: v('--theme-textMuted'),
        colorBorder: v('--theme-border'),
        colorBorderSecondary: v('--theme-borderLight'),
        fontSizeSM: 11,
        fontSize: 12,
        fontSizeLG: 13,
        controlHeight: 28,
        controlHeightSM: 24,
        controlHeightLG: 32,
      },
      components: {
        Button: {
          primaryColor: v('--theme-buttonText') || '#ffffff',
          colorPrimary: v('--theme-buttonPrimary') || v('--theme-primary'),
          colorPrimaryHover: v('--theme-buttonPrimaryHover'),
          colorPrimaryActive: v('--theme-buttonPrimaryHover'),
          contentFontSizeSM: 11,
          contentFontSize: 12,
          paddingInlineSM: 8,
          paddingInline: 10,
        },
        Card: {
          colorBgContainer: v('--theme-surface') || v('--theme-background'),
          colorBorderSecondary: v('--theme-border'),
          paddingLG: 10,
          padding: 10,
        },
        Input: {
          colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
          colorBorder: v('--theme-inputBorder') || v('--theme-border'),
          colorText: v('--theme-inputText') || v('--theme-text'),
          activeBorderColor: v('--theme-inputFocusBorder') || v('--theme-primary'),
          fontSize: 12,
          paddingBlock: 4,
          paddingInline: 8,
        },
        Select: {
          colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
          colorBorder: v('--theme-inputBorder') || v('--theme-border'),
          colorText: v('--theme-text'),
          fontSize: 12,
        },
        Switch: {
          colorPrimary: v('--theme-primary') || v('--theme-buttonPrimary'),
          colorPrimaryHover: v('--theme-buttonPrimaryHover'),
        },
        Tag: {
          colorPrimary: v('--theme-primary') || v('--theme-buttonPrimary'),
          fontSize: 11,
        },
        Slider: {
          railBg: v('--theme-border'),
          trackBg: v('--theme-primary'),
          handleColor: v('--theme-primary'),
          handleActiveColor: v('--theme-primary'),
        },
        Radio: {
          colorPrimary: v('--theme-primary'),
          buttonBg: v('--theme-surface'),
          buttonSolidCheckedBg: v('--theme-primary'),
          buttonSolidCheckedColor: '#fff',
          buttonCheckedBg: v('--theme-primarySoft'),
          buttonColor: v('--theme-textSecondary'),
          fontSize: 12,
        },
        Tabs: {
          colorPrimary: v('--theme-primary'),
          itemSelectedColor: v('--theme-active'),
          itemHoverColor: v('--theme-active'),
          fontSize: 12,
        },
        Modal: {
          contentBg: v('--theme-surface'),
          headerBg: v('--theme-surface'),
          colorBgContainer: v('--theme-surface'),
          titleColor: v('--theme-text'),
          colorText: v('--theme-text'),
        },
        Tooltip: {
          colorBgSpotlight: v('--theme-surface'),
          colorTextLightSolid: v('--theme-text'),
          colorText: v('--theme-text'),
        },
        Typography: {
          colorText: v('--theme-text'),
          colorTextSecondary: v('--theme-textSecondary'),
          fontSize: 12,
        },
        Form: {
          labelColor: v('--theme-text'),
          labelFontSize: 12,
          verticalLabelPadding: '0 0 4px',
        },
        InputNumber: {
          colorBgContainer: v('--theme-inputBackground') || v('--theme-background'),
          colorBorder: v('--theme-inputBorder') || v('--theme-border'),
          colorText: v('--theme-text'),
          fontSize: 12,
          paddingBlock: 4,
          paddingInline: 8,
        },
      },
    };
  }, [themeVersion]);
}
