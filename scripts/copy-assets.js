import { copyFileSync, mkdirSync, existsSync } from 'fs';
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

console.log('Assets copied to dist directory');

