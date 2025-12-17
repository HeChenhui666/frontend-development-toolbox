import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const iconsDir = join(rootDir, 'icons');
const distIconsDir = join(distDir, 'icons');

// 确保dist目录存在
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// 复制manifest.json
copyFileSync(
  join(rootDir, 'manifest.json'),
  join(distDir, 'manifest.json')
);

// 复制图标（如果存在）
if (existsSync(iconsDir)) {
  if (!existsSync(distIconsDir)) {
    mkdirSync(distIconsDir, { recursive: true });
  }
  
  const iconSizes = [16, 48, 128];
  iconSizes.forEach(size => {
    const iconFile = join(iconsDir, `icon${size}.png`);
    if (existsSync(iconFile)) {
      copyFileSync(iconFile, join(distIconsDir, `icon${size}.png`));
    }
  });
}

// 修复 index.html：移除 crossorigin 属性（Chrome 扩展不需要）
const indexPath = join(distDir, 'index.html');
if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, 'utf-8');
  // 移除 script 和 link 标签中的 crossorigin 属性
  html = html.replace(/\s+crossorigin/g, '');
  // 对于 Chrome 扩展，确保使用正确的路径格式
  // 路径已经是相对路径了，这应该没问题
  writeFileSync(indexPath, html, 'utf-8');
}


console.log('Assets copied to dist directory');

