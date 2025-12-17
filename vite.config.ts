import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Chrome 扩展需要使用相对路径
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // 对于 Chrome 扩展，使用 IIFE 格式可能更兼容
        // 但 React 需要 ES 模块，所以我们保持 ES 格式
        format: 'es',
        // 确保资源路径正确
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
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

