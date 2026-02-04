# 前端开发工具箱 Chrome 扩展

一个功能强大的Chrome浏览器扩展，集成了多种实用的前端开发工具，帮助开发者提高工作效率。

## 功能列表

### 🔲 二维码工具

- **生成二维码**：快速生成二维码图片，支持下载
- **解码二维码**：
  - 📷 摄像头扫码：实时扫描识别二维码
  - 📁 文件上传：上传图片文件识别二维码
  - 🔍 多二维码识别：自动识别图片中的所有二维码

### 🔗 URL参数编辑

- 自动解析当前页面URL参数
- **当前URL可编辑**：直接编辑或粘贴URL进行解析
- **URL编码自动解码**：自动将URL编码的中文字符转换为中文显示
- 可视化编辑URL参数
- 预设参数管理（支持保存、编辑、删除预设）
- 一键更新当前标签页URL

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
- 扫雷（支持简单/普通/困难/自定义难度）

### ⚙️ 设置

- 主题切换（多种主题可选）
- 标签页排序（拖拽排序，自定义功能顺序）
- 数据管理（清除所有数据）

## ✨ 新特性

### 🛡️ 浏览器兼容性检测

- **自动检测**：每个功能模块自动检测浏览器兼容性
- **友好提示**：不兼容时显示详细的兼容性警告
- **降级方案**：为关键功能提供降级实现，确保基本功能可用
- **跨浏览器支持**：兼容 Chrome、Edge、Firefox、Safari 等主流浏览器

### ⚡ 性能优化

- 异步兼容性检测，不阻塞页面渲染
- 使用 React 18 并发特性优化切换流畅度
- 组件懒加载，按需加载功能模块
- 优化事件处理，避免不必要的重渲染

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

- **React 18** - UI框架（使用并发特性优化性能）
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ant Design 6** - UI组件库
- **QRCode.js** - 二维码生成库
- **jsQR** - 二维码解码库
- **Chrome Extension API** - 浏览器扩展API
- **浏览器兼容性检测** - 自动检测并提示兼容性问题

## 项目结构

```text
hch-frontend-development-toolbox/
├── src/
│   ├── App.tsx                 # 主应用组件
│   ├── components/             # 功能组件目录
│   │   ├── QRCodeGenerator/    # 二维码生成器
│   │   ├── QRCodeDecoder/      # 二维码解码器（支持截屏、摄像头、多码识别）
│   │   ├── URLParamsEditor/    # URL参数编辑器（支持URL编辑、编码解码）
│   │   ├── TimestampConverter/ # 时间戳转换器
│   │   ├── JSONTools/          # JSON工具
│   │   ├── ColorTools/         # 颜色工具集
│   │   ├── RegexTester/        # 正则表达式测试器
│   │   ├── ImageTools/         # 图片工具
│   │   ├── CSSTools/          # CSS预设工具
│   │   ├── Translator/         # 在线翻译
│   │   ├── Settings/           # 设置界面
│   │   ├── ThemeSettings/      # 主题设置
│   │   ├── EasterEgg/          # 彩蛋页面（游戏）
│   │   └── CompatibilityWarning/ # 兼容性警告组件
│   ├── content/                # Content Scripts
│   │   └── translator.ts       # 翻译气泡脚本
│   ├── hooks/                  # React Hooks
│   │   └── useCompatibility.ts # 兼容性检测 Hook
│   └── utils/                  # 工具函数
│       ├── browserCompatibility.ts # 浏览器兼容性检测工具
│       ├── message.ts          # 消息提示工具
│       ├── theme.ts            # 主题工具
│       └── userPreferences.ts  # 用户偏好设置
├── icons/                      # 扩展图标
├── dist/                       # 构建输出目录
├── scripts/                    # 构建脚本
├── manifest.json               # Chrome扩展清单文件
├── package.json                # 项目配置
└── vite.config.ts              # Vite配置
```

## 浏览器兼容性

### 支持的浏览器

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### 功能兼容性

所有功能都包含自动兼容性检测，不兼容时会显示友好提示。部分功能提供降级方案，确保基本功能可用。

## 许可证

MIT License

---

**享受开发，提高效率！** 🚀
