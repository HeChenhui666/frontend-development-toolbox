import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// 读取 package.json 获取版本号
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const APP_VERSION = packageJson.version;

export default defineConfig({
  plugins: [react()],
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
        'content/translator': resolve(__dirname, 'src/content/translator.ts'),
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
        entryFileNames: (chunkInfo) => {
          // content script和background文件不使用hash
          if (chunkInfo.name === 'content/translator') {
            return 'content/translator.js';
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

