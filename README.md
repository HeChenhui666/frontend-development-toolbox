# 前端开发工具箱 Chrome 扩展

一个功能强大的Chrome浏览器扩展，集成了多种实用的前端开发工具，帮助开发者提高工作效率。

## 功能列表

### 🔲 二维码工具

- 生成二维码
- 解码二维码

### 🔗 URL参数编辑

- 自动解析当前页面URL参数
- 可视化编辑URL参数
- 预设参数管理

### ⏰ 时间戳转换

- 时间戳与日期时间互转
- 实时显示当前时间戳

### 📄 JSON工具

- JSON解析（格式化、验证、压缩）
- JSON比对
- JSON Schema生成
- JSON转TypeScript
- JSON转CSV

### 🎨 颜色工具

- 颜色转换器（HEX/RGB/HSL/RGBA/HSLA互转）
- 颜色搭配建议器
- 渐变背景生成器

### 🔤 正则表达式测试

- 实时匹配测试
- 预设正则表达式
- 标志位设置

### 🖼️ 图片工具

- 随机图片生成器
- Base64编码/解码

### 🎨 CSS预设工具

- CSS代码片段集合
- CSS兼容性检测

### 🌐 在线翻译

- 文本翻译
- 选中文本翻译（页面内翻译气泡）
- 使用免费版 Google 翻译服务

### 🎮 彩蛋游戏

- 2048
- 俄罗斯方块
- 贪吃蛇

### ⚙️ 设置

- 主题切换
- 标签页排序
- 数据管理

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 加载扩展

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 开发

### 开发模式（自动构建）

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

## 技术栈

- **React 18** - UI框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ant Design 6** - UI组件库
- **QRCode.js** - 二维码生成库
- **jsQR** - 二维码解码库
- **Chrome Extension API** - 浏览器扩展API

## 项目结构

```text
hch-frontend-development-toolbox/
├── src/
│   ├── App.tsx                 # 主应用组件
│   ├── components/             # 功能组件目录
│   │   ├── QRCodeGenerator/    # 二维码生成器
│   │   ├── QRCodeDecoder/      # 二维码解码器
│   │   ├── URLParamsEditor/    # URL参数编辑器
│   │   ├── TimestampConverter/ # 时间戳转换器
│   │   ├── JSONTools/          # JSON工具
│   │   ├── ColorTools/         # 颜色工具集
│   │   ├── RegexTester/        # 正则表达式测试器
│   │   ├── ImageTools/         # 图片工具
│   │   ├── CSSTools/          # CSS预设工具
│   │   ├── Translator/         # 在线翻译
│   │   ├── Settings/           # 设置界面
│   │   ├── ThemeSettings/      # 主题设置
│   │   └── EasterEgg/          # 彩蛋页面（游戏）
│   ├── content/                # Content Scripts
│   │   └── translator.ts       # 翻译气泡脚本
│   └── utils/                  # 工具函数
├── icons/                      # 扩展图标
├── dist/                       # 构建输出目录
├── scripts/                    # 构建脚本
├── manifest.json               # Chrome扩展清单文件
├── package.json                # 项目配置
└── vite.config.ts              # Vite配置
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

**享受开发，提高效率！** 🚀
