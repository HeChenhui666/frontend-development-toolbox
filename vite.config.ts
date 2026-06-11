import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// 读取 package.json 获取版本号
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const APP_VERSION = packageJson.version;

const CONTENT_SCRIPT_OUTPUTS = ['content/translator.js', 'content/mouseTrail.js', 'content/enableCopy.js'] as const;

/**
 * 同一扩展的多个 content_scripts 在 Chrome 里共享同一隔离世界的「脚本全局」。
 * Rollup 可能把辅助代码放在 IIFE 外（renderChunk 无法包住最终文件），仍会与另一脚本的 `var b` 等冲突。
 * 在 generateBundle 阶段包裹整份产物，保证各内容脚本互不污染（修复 mouseTrail / translator 重名报错与翻译初始化失败）。
 */
function contentScriptIifeWrap(): Plugin {
  return {
    name: 'content-script-iife-wrap',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const fileName of CONTENT_SCRIPT_OUTPUTS) {
        const chunk = bundle[fileName];
        if (!chunk || chunk.type !== 'chunk' || typeof chunk.code !== 'string') continue;
        const trimmed = chunk.code.trimStart();
        if (trimmed.startsWith('(function(')) continue;
        chunk.code = `(function(){\n${chunk.code}\n})();`;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    contentScriptIifeWrap(),
    compression({ algorithm: 'gzip', threshold: 10240 }),
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 10240 }),
    visualizer({ filename: 'dist/stats.html', open: false, gzipSize: true }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
  base: './', // Chrome 扩展需要使用相对路径
  define: {
    'import.meta.env.APP_VERSION': JSON.stringify(APP_VERSION),
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popup: resolve(__dirname, 'popup.html'),
        standalone: resolve(__dirname, 'standalone.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        chat: resolve(__dirname, 'chat.html'),
        // translator 须只引用同目录模块（如 translatorParseInline），勿引用 utils，否则打出 import chunk 导致页面报错
        'content/translator': resolve(__dirname, 'src/content/translator.ts'),
        // 入口仅引用同目录 bundle，勿从 utils 引用，否则产生 assets chunk，网页端内容脚本无法加载
        'content/mouseTrail': resolve(__dirname, 'src/content/mouseTrail.ts'),
        'content/enableCopy': resolve(__dirname, 'src/content/enableCopy.ts'),
        'background': resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        // 对于 Chrome 扩展，使用 IIFE 格式可能更兼容
        // 但 React 需要 ES 模块，所以我们保持 ES 格式
        format: 'es',
        // 确保资源路径正确
        assetFileNames: (assetInfo) => {
          // content script的CSS文件放在content目录，使用固定名称
          const name = assetInfo.name || '';
          if (name.endsWith('.css')) {
            // 检查是否是translator相关的CSS（通过检查chunk信息）
            const chunkNames = assetInfo.names || [];
            if (chunkNames.some(n => n.includes('translator')) || 
                name.includes('translator') ||
                (assetInfo.source && assetInfo.source.toString().includes('translate-bubble'))) {
              return 'content/translator.css';
            }
          }
          return 'assets/[name].[ext]';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            // 游戏组件合并为一个 chunk（彩蛋不常用，避免分散加载）
            if (id.includes('/EasterEgg/games/')) return 'games';
            // 按领域分组 chunk，减少 HTTP 请求数
            if (id.includes('/features/code-tools/')) return 'feat-code';
            if (id.includes('/features/network-tools/')) return 'feat-network';
            if (id.includes('/features/visual-tools/')) return 'feat-visual';
            if (id.includes('/features/browser-tools/')) return 'feat-browser';
            if (id.includes('/features/utility-tools/')) return 'feat-utility';
            return undefined;
          }
          // React 核心及运行时依赖同 chunk，避免加载顺序导致 useLayoutEffect 未定义
          if (
            /node_modules\/(react|react-dom|scheduler|react-i18next|i18next)\//.test(id)
          ) {
            return 'vendor-react';
          }
          // Ant Design 及其直接依赖合并，消除 vendor ↔ vendor-antd 循环
          if (
            /node_modules\/(antd|@ant-design|rc-|@rc-component)/.test(id)
          ) {
            return 'vendor-antd';
          }
          return 'vendor';
        },
        entryFileNames: (chunkInfo) => {
          // content script和background文件不使用hash
          if (chunkInfo.name === 'content/translator') {
            return 'content/translator.js';
          }
          if (chunkInfo.name === 'content/mouseTrail') {
            return 'content/mouseTrail.js';
          }
          if (chunkInfo.name === 'content/enableCopy') {
            return 'content/enableCopy.js';
          }
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          return 'assets/[name]-[hash].js';
        },
        // 确保文件扩展名正确
        preserveModules: false,
        // 确保模块导出方式正确
        esModule: true,
      },
    },
    // 禁用代码分割，避免模块加载问题
    cssCodeSplit: false,
    // 确保模块正确识别
    modulePreload: false,
    // 确保文件有正确的扩展名
    assetsInlineLimit: 0,
  },
  // 确保正确的 MIME 类型
  server: {
    fs: {
      strict: false,
    },
  },
});

