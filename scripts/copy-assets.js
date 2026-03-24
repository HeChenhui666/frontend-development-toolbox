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

// 修复 HTML 产物：移除 crossorigin 属性（Chrome 扩展不需要）
for (const htmlName of ['index.html', 'sidepanel.html', 'chat.html']) {
  const htmlPath = join(distDir, htmlName);
  if (existsSync(htmlPath)) {
    let html = readFileSync(htmlPath, 'utf-8');
    html = html.replace(/\s+crossorigin/g, '');
    writeFileSync(htmlPath, html, 'utf-8');
  }
}

// 复制 content script 的 CSS 文件
const contentDir = join(rootDir, 'src', 'content');
const distContentDir = join(distDir, 'content');
const translatorCss = join(contentDir, 'translator.css');
const distTranslatorCss = join(distContentDir, 'translator.css');

if (existsSync(translatorCss)) {
  if (!existsSync(distContentDir)) {
    mkdirSync(distContentDir, { recursive: true });
  }
  copyFileSync(translatorCss, distTranslatorCss);
  console.log('Content script CSS copied to dist/content/translator.css');
}

console.log('Assets copied to dist directory');

