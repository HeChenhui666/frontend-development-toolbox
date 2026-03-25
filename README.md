# 小火火工具箱（前端开发工具箱）· Chromium 扩展

面向 **Google Chrome**、**QQ 浏览器**等 Chromium 内核浏览器的扩展，集成二维码、URL 参数、JSON、翻译、请求重定向等多种实用工具，便于前端开发与日常调试。

**当前版本**：**1.7.6**（与仓库根目录 `package.json`、`manifest.json` 中的 `version` 一致；构建后扩展版本以 `dist/manifest.json` 为准。）

> **说明**：请始终加载 **`npm run build` 后的 `dist` 目录**。不要直接加载源码根目录，否则会出现缺少 `sidepanel.html` / `popup.html` 等文件、侧栏无法安装等问题。

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

### 🔌 API 调试

- 常用 HTTP 方法（GET / POST / PUT / DELETE 等）发起请求
- 自定义请求头、请求体（支持 JSON、表单、纯文本）
- 查看响应状态、响应头与响应体
- **请求模板**：内置多种预设，可保存、编辑、删除自定义模板（数据可同步到 `chrome.storage`）

### 🔄 请求重定向

- 基于 **declarativeNetRequest** 将匹配 URL 的请求重定向到指定地址（便于本地联调、Mock、切换环境）
- 规则增删改、启用/禁用、校验与一键应用到扩展
- 依赖扩展环境；不兼容时会给出提示

### 🧹 缓存管理

- 按站点查看与管理 **Cookie**（含编辑、删除、多站点筛选）
- 清理 **浏览数据**（如缓存、LocalStorage 等可选类型）
- 浏览 **历史记录**（可配置时间范围）与 **打开的标签页** 列表
- 支持自定义站点、Cookie 域等选项（具体能力随浏览器扩展 API 可用性变化）

### 💬 聊天室

- 独立窗口页面 **`chat.html`**（主界面标题栏 💬 或等价入口打开）
- 消息、个人资料、设置等模块；局域网中继聊天（`LanRelayChat` / 本地 relay，可与 `npm run lan-chat-server` 配合）
- 与主工具箱共用主题变量，适合内网简单协作或调试

### 🎮 彩蛋游戏

- 2048
- 俄罗斯方块
- 贪吃蛇
- 扫雷
- 数独

### ⚙️ 设置

- 主题切换（多种主题可选）
- 标签页排序（拖拽排序，自定义功能顺序）
- 数据管理（清除所有数据）

## ✨ 新特性

### 🛡️ 浏览器兼容性检测

- **自动检测**：各功能模块对当前环境能力做检测
- **友好提示**：不兼容时展示说明与建议
- **降级与替代**：关键路径尽量保留可用方案（例如侧栏不可用时使用 popup / 小窗口）

### ⚡ 性能优化

- 异步兼容性检测，不阻塞页面渲染
- 使用 React 18 并发特性优化切换流畅度
- 组件懒加载，按需加载功能模块
- 优化事件处理，避免不必要的重渲染

## 界面入口

| 入口 | 说明 |
|------|------|
| **工具栏图标** | 打开 `popup.html`（约 450×580） |
| **侧栏** | `sidepanel.html`，需在浏览器侧栏中选择本扩展 |
| **右键菜单** | 「使用侧边栏打开」「使用小窗口打开」分别对应侧栏与 `standalone.html` 浮窗 |
| **聊天室** | 主界面标题栏 **💬** 打开独立窗口 `chat.html`（局域网中继需可选本地服务） |

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

构建产物在 **`dist/`**，其中包含 `manifest.json`、`popup.html`、`sidepanel.html`、`standalone.html`、`chat.html`、`background.js` 等扩展运行所需文件。

### 3. 加载扩展

**Chrome / Edge**

1. 打开 `chrome://extensions/`（Edge 为 `edge://extensions/`）
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本仓库的 **`dist` 目录**（不是项目根目录）

**QQ 浏览器（及同类 Chromium 扩展中心）**

1. 在扩展管理页开启开发者/调试模式（具体名称因版本而异）
2. 同样选择 **`dist` 目录** 加载

若安装时报错 **`Side panel file path must exist`**，通常是未加载 `dist`、或 `manifest` 里侧栏路径指向了带 `?query` 的虚拟路径。本仓库已使用独立的 **`sidepanel.html`**，构建后该文件应存在于 `dist` 根目录。

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

## 常见问题

- **侧栏报错 `Side panel file path must exist`**：加载 **`dist`**；确认 `dist/sidepanel.html` 存在；不要使用带查询串的侧栏路径作为「文件路径」（QQ 等内核会整段校验）。
- **工具栏 popup 宽度变成一条竖线**：已通过在 `html`/`body`/`#root`（存在 `.app-popup` 时）设置 **`min-width: 450px`** 等方式，避免文档宽度反算塌缩；请使用最新构建。
- **侧栏或矮窗口里内容不能上下滚动**：主区域滚动在 **`.content`**；布局上为 `#root` / `.app` 使用 flex 与 **`min-height: 0`**，避免外层把高度撑死。
- **内核过旧**：`manifest.json` 中 `minimum_chrome_version` 为 **116**（侧栏等 API）。过低版本可能无法使用侧栏，可使用右键「使用小窗口打开」作为替代。

## 项目结构

```text
hch-frontend-development-toolbox/
├── popup.html / sidepanel.html / standalone.html / index.html / chat.html  # Vite 多页入口
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── background/             # Service Worker（重定向规则、侧栏、右键菜单等）
│   ├── chat/                   # 独立聊天页
│   ├── components/             # 各功能模块组件
│   ├── content/                # Content Scripts（如翻译气泡）
│   ├── hooks/
│   └── utils/
├── pages/                      # 扩展内静态页（如侧栏引导）
├── icons/
├── dist/                       # npm run build 输出（加载此目录为扩展）
├── scripts/                    # copy-assets 等
├── manifest.json
├── package.json
└── vite.config.ts
```

## 浏览器兼容性

### 扩展本体（安装与运行）

- **推荐**：**Chrome / Edge 116+**（与 `manifest.json` 中 `minimum_chrome_version` 及侧栏 API 一致）
- **QQ 浏览器**等 Chromium 系：需支持 **Manifest V3** 及扩展所声明权限；侧栏能力因内核版本而异，不可用时可使用 **popup** 或右键 **小窗口**

### 各工具模块内的「兼容性检测」

部分界面会对 **网页/API 能力**（如剪贴板、部分 Web API）做检测并提示；这与「能否安装本扩展」不是同一概念。扩展页面运行在 `chrome-extension` / 各内核的 `*-extension` 协议下，与在普通网页中打开不同。

## 许可证

MIT License

---

**享受开发，提高效率！** 🚀
