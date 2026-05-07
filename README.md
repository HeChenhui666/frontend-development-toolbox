# 小火火工具箱（前端开发工具箱）

面向 **Google Chrome**、**Microsoft Edge**、**QQ 浏览器**等 Chromium 内核浏览器的扩展（Manifest V3），把二维码、URL、JSON、翻译、API 调试、请求重定向、缓存与网页级快捷操作等能力收进工具栏与侧栏，方便前端开发与日常调试。

| 项目 | 说明 |
|------|------|
| **当前版本** | **1.8.1**（与仓库根目录 `package.json`、`manifest.json` 中 `version` 一致；以 **`npm run build` 后 `dist/manifest.json`** 为准。） |
| **最低浏览器** | **Chromium 116+**（与 `manifest.json` 中 `minimum_chrome_version` 一致，侧栏等 API 需要较新内核。） |
| **仓库** | [github.com/HeChenhui666/frontend-development-toolbox](https://github.com/HeChenhui666/frontend-development-toolbox) |

> **重要**：请在浏览器里加载 **`npm run build` 生成的 `dist` 目录**。不要直接加载源码根目录，否则会出现缺少 `popup.html` / `sidepanel.html`、侧栏无法安装等问题。

---

## 功能一览

### 二维码

- **生成**：快速生成二维码图片，支持下载
- **解码**：摄像头实时扫码、上传图片；支持一张图内多个二维码

### URL 参数

- 解析当前标签页或可编辑/粘贴的 URL
- URL 编码自动解码展示中文等字符
- 可视化编辑查询参数；预设参数（增删改）；一键更新当前页 URL

### 时间戳

- 时间戳与日期时间互转；当前时间戳实时显示

### JSON

- 格式化、校验、压缩
- 比对、Schema 生成、转 TypeScript、转 CSV

### 颜色工具

- **颜色转换器**（HEX / RGB / HSL / RGBA / HSLA 等）
- **颜色搭配**建议
- **渐变背景**生成

### 正则

- 实时匹配、标志位、预设正则

### 图片工具

- 随机图片、Base64 编解码、Lottie 预览等

### 在线翻译

- 文本翻译；页面内选中文本气泡翻译（依赖 Google 翻译接口）

### API 调试

- GET / POST / PUT / DELETE 等；自定义头与 Body（JSON、表单、纯文本）
- 查看状态、响应头与 Body；**请求模板**可持久化到 `chrome.storage`

### 请求重定向

- 基于 **declarativeNetRequest** 将匹配 URL 重写到指定地址（联调、Mock、切环境）
- 规则管理、校验、一键应用到扩展；环境不支持时会提示

### 缓存管理

- Cookie（按站点查看与编辑等，能力随扩展 API 与页面而定）
- 浏览数据清理、历史记录浏览、打开的标签页列表等（具体选项以界面为准）

### 网页操作

- 对**当前标签页**通过 `chrome.scripting` 向页面 **MAIN** 世界注入脚本，尝试**解除常见防复制限制**（仅顶层 / 含全部 iframe；支持短时补注晚加载 iframe）
- 请在**可信站点**使用；内置页、`chrome-extension:` 等受限 URL 无法注入

### 鼠标拖尾

- 在扩展内配置拖尾样式与行为，由内容脚本在网页上呈现（与翻译等内容脚本并存；构建时对内容脚本做隔离包裹以避免冲突）

### 编码 / 解码

- Unicode 转义、UTF-8 与中文、URL 编码/解码等常用文本变换

### 聊天室

- 独立窗口 **`chat.html`**（主界面标题栏 💬 等入口）
- 局域网中继聊天；可选配合 `npm run lan-chat-server` 启动本地 relay

### 彩蛋游戏

- 2048、俄罗斯方块、贪吃蛇、扫雷、数独

### 设置

- 多主题；标签顺序（拖拽）；数据清除

### 体验与兼容

- 各模块会按需检测当前环境能力，不兼容时给出说明；侧栏不可用时仍可使用 popup 或小窗口等入口

---

## 界面入口

| 入口 | 说明 |
|------|------|
| **工具栏图标** | 打开 `popup.html`（约 450×580） |
| **侧栏** | `sidepanel.html`，在浏览器侧栏中选择本扩展 |
| **右键菜单** | 「使用侧边栏打开」「使用小窗口打开」等 → 侧栏或 `standalone.html` 浮窗 |
| **聊天室** | 主界面 **💬** → `chat.html` |

---

## 快速开始

### 环境要求

- **Node.js** ≥ 16、**npm** ≥ 8（见 `package.json` 的 `engines`）

### 安装依赖

```bash
npm install
```

### 生产构建

```bash
npm run build
```

产出在 **`dist/`**：`manifest.json`、`popup.html`、`sidepanel.html`、`standalone.html`、`chat.html`、`background.js`、`content/` 下脚本与样式等。`scripts/copy-assets.js` 会复制 `manifest.json`、图标、修正 HTML，并复制翻译内容脚本的 CSS。

### 加载扩展

**Chrome / Edge**

1. 打开 `chrome://extensions/` 或 `edge://extensions/`
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择本仓库的 **`dist`** 目录（不是项目根目录）

**QQ 浏览器等**

- 在扩展管理页开启开发者或同类选项后，同样选择 **`dist`**。

若提示 **`Side panel file path must exist`**：确认加载的是 `dist` 且存在 `dist/sidepanel.html`；不要使用带查询参数的侧栏路径作为文件路径。

---

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 复制资源后 `vite build --watch --mode development`，改代码自动重建 |
| `npm run build` | 生产构建 + 复制资源 |
| `npm run preview` | Vite 预览（主要用于非扩展场景的静态预览） |
| `npm run clean` | 删除 `dist` |
| `npm run lan-chat-server` | 可选：本地局域网聊天 relay（`scripts/lan-chat-server.mjs`） |

---

## 技术栈

- **React 18** + **TypeScript**
- **Vite 5**（多入口：popup / sidepanel / standalone / chat / background / 多个 content scripts）
- **Ant Design 6**
- **qrcode**、**jsQR** 等二维码相关库
- **Chrome Extension API**（MV3、侧栏、声明式网络请求等）

---

## 常见问题

- **侧栏 `Side panel file path must exist`**：加载 **`dist`**；确认 `dist/sidepanel.html` 存在。
- **Popup 宽度塌成一条线**：构建产物中已对 `html` / `body` / `#root`（含 `.app-popup`）等设置最小宽度；请使用最新构建。
- **侧栏或矮窗口无法滚动**：主滚动区在 `.content`；布局使用 flex 与 `min-height: 0` 避免高度被撑死。
- **内核低于 116**：侧栏等 API 可能不可用，请用 popup 或右键「小窗口」；或升级浏览器。
- **网页操作 / 注入失败**：部分页面（浏览器内置页、扩展页、部分沙箱 iframe）不允许注入，属正常限制。

---

## 项目结构（摘要）

```text
hch-frontend-development-toolbox/
├── popup.html, sidepanel.html, standalone.html, index.html, chat.html  # Vite 多页入口
├── src/
│   ├── App.tsx, main.tsx, chatMain.tsx
│   ├── background/          # Service Worker
│   ├── chat/                # 聊天独立页逻辑
│   ├── components/          # 各功能模块
│   ├── content/             # 内容脚本（翻译、鼠标拖尾、enableCopy 等）
│   ├── hooks/, utils/
├── pages/                   # 扩展内静态页（如侧栏引导）
├── icons/
├── scripts/                 # copy-assets、lan-chat-server
├── dist/                    # 构建输出（加载此目录为扩展）
├── manifest.json
├── package.json
└── vite.config.ts
```

---

## 浏览器兼容性

- **扩展安装与运行**：推荐 **Chrome / Edge 116+**，与 `minimum_chrome_version` 一致。
- **其他 Chromium 系**：需支持 MV3 及 manifest 中声明的权限；侧栏能力因内核而异。
- **界面内的「兼容性检测」**：针对部分 Web API 在扩展页面或内容脚本环境中的可用性提示，与「能否安装扩展」不是同一概念。

---

## 许可证

MIT License

---

**祝开发顺利。** 🚀
