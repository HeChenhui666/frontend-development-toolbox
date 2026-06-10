# 小火火工具箱（前端开发工具箱）

面向 **Google Chrome**、**Microsoft Edge**、**QQ 浏览器**等 Chromium 内核浏览器的扩展（Manifest V3），把二维码、URL、JSON、翻译、API 调试、请求重定向、缓存与网页级快捷操作等能力收进工具栏与侧栏，方便前端开发与日常调试。

| 项目        | 说明                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| **当前版本**  | **1.9.0**（与仓库根目录 `package.json`、`manifest.json` 中 `version` 一致；以 **`npm run build` 后 `dist/manifest.json`** 为准。）     |
| **最低浏览器** | **Chromium 116+**（与 `manifest.json` 中 `minimum_chrome_version` 一致，侧栏等 API 需要较新内核。）                                   |
| **仓库**    | [github.com/HeChenhui666/frontend-development-toolbox](https://github.com/HeChenhui666/frontend-development-toolbox) |

> **重要**：请在浏览器里加载 **`npm run build` 生成的 `dist` 目录**。不要直接加载源码根目录，否则会出现缺少 `popup.html` / `sidepanel.html`、侧栏无法安装等问题。

***

## 功能一览

### 二维码

* **生成**：快速生成二维码图片，支持下载；点击缩略图或「放大预览」按钮可全屏预览并用滚轮缩放
* **解码**：摄像头实时扫码、上传图片；支持一张图内多个二维码
* **批量生成**：一次输入多行文本，批量生成二维码并打包下载
* **样式定制**：自定义前景色、背景色、纠错等级、边距
* **条形码支持**：支持 Code128、EAN-13 等常见条形码格式
* **历史记录**：自动保存最近生成的二维码，支持快速复用

### URL 参数

* 解析当前标签页或可编辑/粘贴的 URL
* URL 编码自动解码展示中文等字符
* 可视化编辑查询参数；预设参数（增删改）；一键更新当前页 URL
* **UTM 生成器**：快速为营销链接添加 UTM 追踪参数
* **URL Diff**：对比两个 URL 的差异（域名、路径、参数）
* **深链解析**：识别并提取 URL 中的深层链接（如 redirect、url 参数）
* **URL 编解码**：对 URL 中的特殊字符进行 encodeURIComponent / decodeURIComponent 转换

### 时间戳

* 时间戳与日期时间互转；当前时间戳实时显示
* **多时区对照**：同时显示 UTC、本地时间及指定时区的时间
* **Cron 解析**：解析 Cron 表达式并显示下次执行时间
* **倒计时**：设置目标时间，实时显示剩余时间
* **相对时间计算**：计算两个时间点之间的差值（天、小时、分钟等）

### JSON

* 格式化、校验、压缩
* 比对、Schema 生成、转 TypeScript、转 CSV
* **JSONPath 查询**：通过 JSONPath 表达式快速定位和提取数据
* **YAML/TOML 互转**：支持 JSON ↔ YAML ↔ TOML 格式互转
* **Mock 数据生成**：根据 JSON Schema 自动生成 Mock 数据
* **树形可视化**：以树形结构直观展示 JSON 层级关系
* **多语言类型生成**：一键生成 TypeScript、Go、Java、Python 等语言的类型定义

### 颜色工具

* **颜色转换器**（HEX / RGB / HSL / RGBA / HSLA 等）
* **颜色搭配**建议
* **渐变背景**生成
* **取色器**：从屏幕任意位置拾取颜色
* **对比度检查**：检查前景色与背景色的 WCAG 对比度合规性
* **色盲模拟**：模拟不同色盲类型下的颜色显示效果
* **CSS Shadows 生成器**：可视化生成 box-shadow 和 text-shadow CSS 代码

### 正则

* 实时匹配、标志位、预设正则
* **铁路图可视化**：将正则表达式转换为可视化的铁路图（Railroad Diagram）
* **自然语言解释**：用通俗语言解释正则表达式的含义
* **ReDoS 检测**：检测可能导致正则表达式拒绝服务攻击的危险模式

### 图片工具

* 随机图片、Base64 编解码、Lottie 预览等
* **图片压缩**：支持 JPEG、PNG、WebP 格式压缩，可调质量参数
* **格式转换**：在 JPEG、PNG、WebP、AVIF 等格式间互转
* **占位图生成**：生成指定尺寸和样式的占位图片，支持自定义文字、颜色、格式

### 在线翻译

* 文本翻译；页面内选中文本气泡翻译（依赖 Google 翻译接口）
* **术语表**：自定义专业术语翻译对照表
* **翻译历史**：保存最近的翻译记录，支持快速复用

### API 调试

* GET / POST / PUT / DELETE 等；自定义头与 Body（JSON、表单、纯文本）
* 查看状态、响应头与 Body；**请求模板**可持久化到 `chrome.storage`
* **请求历史**：自动保存最近的请求记录，支持快速重发
* **环境变量**：支持定义和使用环境变量（如 {{base_url}}）
* **cURL 导入导出**：支持从 cURL 命令导入请求，也可导出为 cURL 格式

### 请求重定向

* 基于 **declarativeNetRequest** 将匹配 URL 重写到指定地址（联调、Mock、切环境）
* 规则管理、校验、一键应用到扩展；环境不支持时会提示
* **规则组/环境切换**：将规则分组，快速切换不同环境（开发、测试、生产）
* **规则导入导出**：支持导出规则为 JSON 文件，也可从文件导入

### 缓存管理

* Cookie（按站点查看与编辑等，能力随扩展 API 与页面而定）
* 浏览数据清理、历史记录浏览、打开的标签页列表等（具体选项以界面为准）
* **LocalStorage/SessionStorage 管理**：可视化查看、编辑、删除存储项
* **Cookie 导入导出**：支持导出 Cookie 为 JSON，也可从 JSON 导入

### 网页操作

* 对**当前标签页**通过 `chrome.scripting` 向页面 **MAIN** 世界注入脚本，尝试**解除常见防复制限制**（仅顶层 / 含全部 iframe；支持短时补注晚加载 iframe）
* 请在**可信站点**使用；内置页、`chrome-extension:` 等受限 URL 无法注入
* **暗黑模式注入**：为任意网页一键注入暗黑模式样式
* **页面性能分析**：快速获取当前页面的性能指标（FCP、LCP、CLS 等）
* **DOM 统计**：统计当前页面的 DOM 节点数量、深度等指标

### 鼠标拖尾

* 在扩展内配置拖尾样式与行为，由内容脚本在网页上呈现（与翻译等内容脚本并存；构建时对内容脚本做隔离包裹以避免冲突）
* **更多粒子效果预设**：提供多种粒子拖尾效果（星星、爱心、火焰、雪花等）

### 编解码

* Unicode 编码（转义 / 还原）、UTF-8 编解码等常用文本变换
* **Base64 编解码**：支持文本和图片的 Base64 编码与解码
* **JWT 解析**：解析 JWT Token 并展示 Header、Payload、Signature
* **Hash 计算**：支持 MD5、SHA-1、SHA-256、SHA-512 等哈希算法
* **HTML 实体编解码**：HTML 实体与字符互转
* *注：URL 编码/解码已移至「URL 参数」模块的扩展工具中*

### 聊天室

* 独立窗口 **`chat.html`**（主界面标题栏 💬 等入口）
* 局域网中继聊天；可选配合 `npm run lan-chat-server` 启动本地 relay
* **代码片段分享**：在聊天中发送和预览代码片段，支持语法高亮

### 彩蛋游戏

* 2048、俄罗斯方块、贪吃蛇、扫雷、数独
* **Wordle**：每日猜词游戏
* **打字练习**：提升打字速度的练习工具

### 备忘录

* 文字备忘粘贴板，支持多行文本输入
* 支持置顶、搜索、删除、清空
* 数据持久化到 localStorage

### ASCII 画布

* 预设图案（猫咪、小狗、爱心、咖啡、火箭、毛毛、菊花梨、恶魔叮、奇丽草、帽兜等颜文字）
* 文字转 ASCII（大字模式）
* 边框样式选择（简单、双线、圆角、粗线、星号）

### Markdown 预览器

* 纯前端 Markdown 解析，支持标题、列表、代码块、表格、引用、链接等常用语法
* 左右分栏布局：编辑器 + 实时预览
* **滚动同步**：编辑区与预览区滚动位置自动同步

### Diff 对比工具

* 基于 LCS 算法的文本差异对比
* 支持行级和字符级差异高亮
* 支持复制 diff 结果

### 字体预览

* 多字体对比展示，支持系统字体和 Web Font
* 自定义预览文本、字体大小、粗细、行高、字距
* 支持导出字体 CSS 代码

### 剪贴板历史

* *已更名为「备忘录」，见上方*

### 设置

* 多主题；标签顺序（拖拽）；数据清除；配置导入导出

### 体验与兼容

* 各模块会按需检测当前环境能力，不兼容时给出说明；侧栏不可用时仍可使用 popup 或小窗口等入口

***

## 界面入口

| 入口        | 说明                                             |
| --------- | ---------------------------------------------- |
| **工具栏图标** | 打开 `popup.html`（约 450×580）                     |
| **侧栏**    | `sidepanel.html`，在浏览器侧栏中选择本扩展                  |
| **右键菜单**  | 「使用侧边栏打开」「使用小窗口打开」等 → 侧栏或 `standalone.html` 浮窗 |
| **聊天室**   | 彩蛋页面 → `chat.html`（独立窗口）                       |

### 界面布局

所有入口共享同一套 React 应用，内部采用**可折叠左侧边栏导航**：

* 侧边栏顶部显示 Logo（🔥 工具箱），点击可触发彩蛋
* 导航列表列出所有功能模块，支持拖拽排序（在设置中调整）
* 侧边栏底部为设置入口
* 右侧悬浮按钮可一键**展开 / 收起**侧边栏；popup 与侧栏模式下默认折叠以节省空间

***

## 快速开始

### 环境要求

* **Node.js** ≥ 16、**npm** ≥ 8（见 `package.json` 的 `engines`）

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

* 在扩展管理页开启开发者或同类选项后，同样选择 **`dist`**。

若提示 **`Side panel file path must exist`**：确认加载的是 `dist` 且存在 `dist/sidepanel.html`；不要使用带查询参数的侧栏路径作为文件路径。

***

## 开发命令

| 命令                        | 说明                                                    |
| ------------------------- | ----------------------------------------------------- |
| `npm run dev`             | 复制资源后 `vite build --watch --mode development`，改代码自动重建 |
| `npm run build`           | 生产构建 + 复制资源                                           |
| `npm run preview`         | Vite 预览（主要用于非扩展场景的静态预览）                               |
| `npm run clean`           | 删除 `dist`                                             |
| `npm run lan-chat-server` | 可选：本地局域网聊天 relay（`scripts/lan-chat-server.mjs`）       |

***

## 技术栈

* **React 18** + **TypeScript**
* **Vite 5**（多入口：popup / sidepanel / standalone / chat / background / 多个 content scripts）
* **Ant Design 6**
* **qrcode**、**jsQR**、**JsBarcode** 等二维码/条形码相关库
* **Chrome Extension API**（MV3、侧栏、声明式网络请求等）

***

## 常见问题

* **侧栏 `Side panel file path must exist`**：加载 **`dist`**；确认 `dist/sidepanel.html` 存在。
* **Popup 宽度塌成一条线**：构建产物中已对 `html` / `body` / `#root`（含 `.app-popup`）等设置最小宽度；请使用最新构建。
* **侧栏或矮窗口无法滚动**：主滚动区在 `.content`；布局使用 flex 与 `min-height: 0` 避免高度被撑死。
* **内核低于 116**：侧栏等 API 可能不可用，请用 popup 或右键「小窗口」；或升级浏览器。
* **网页操作 / 注入失败**：部分页面（浏览器内置页、扩展页、部分沙箱 iframe）不允许注入，属正常限制。

***

## 项目结构（摘要）

```text
hch-frontend-development-toolbox/
├── popup.html, sidepanel.html, standalone.html, index.html, chat.html  # Vite 多页入口
├── src/
│   ├── App.tsx, main.tsx, chatMain.tsx
│   ├── background/          # Service Worker
│   ├── chat/                # 聊天独立页逻辑
│   ├── components/          # 各功能模块
│   │   ├── QRCode/          # 二维码（含批量生成、条形码、历史记录）
│   │   ├── URLParamsEditor/ # URL 参数（含 UTM、Diff、深链、编解码）
│   │   ├── Timestamp/       # 时间戳（含多时区、Cron、倒计时）
│   │   ├── JsonTools/       # JSON 工具（含 JSONPath、YAML/TOML、Mock）
│   │   ├── GradientGenerator/ # 颜色工具（含取色器、对比度、色盲模拟）
│   │   ├── RegexTester/     # 正则（含铁路图、自然语言解释）
│   │   ├── ImageTools/      # 图片工具（含压缩、格式转换、占位图）
│   │   ├── Translator/      # 翻译（含术语表、历史）
│   │   ├── APITester/       # API 调试（含历史、环境变量、cURL）
│   │   ├── RequestRedirector/ # 请求重定向（含规则组、导入导出）
│   │   ├── CacheManager/    # 缓存管理（含 Storage、Cookie 导入导出）
│   │   ├── CodecTools/      # 编解码（Base64、JWT、Hash、HTML 实体）
│   │   ├── WebActions/      # 网页操作（含暗黑模式、性能分析、DOM 统计）
│   │   ├── MouseTrail/      # 鼠标拖尾（含多种粒子效果）
│   │   ├── EasterEgg/       # 彩蛋游戏（含 Wordle、打字练习）
│   │   ├── MemoNotes/       # 备忘录（原剪贴板历史）
│   │   ├── AsciiArt/        # ASCII 画布
│   │   ├── MarkdownPreview/ # Markdown 预览器
│   │   ├── DiffTool/        # Diff 对比工具
│   │   ├── FontPreview/     # 字体预览
│   ├── hooks/, utils/
├── pages/                   # 扩展内静态页（如侧栏引导）
├── icons/
├── scripts/                 # copy-assets、lan-chat-server
├── dist/                    # 构建输出（加载此目录为扩展）
├── manifest.json
├── package.json
└── vite.config.ts
```

***

## 浏览器兼容性

* **扩展安装与运行**：推荐 **Chrome / Edge 116+**，与 `minimum_chrome_version` 一致。
* **其他 Chromium 系**：需支持 MV3 及 manifest 中声明的权限；侧栏能力因内核而异。
* **界面内的「兼容性检测」**：针对部分 Web API 在扩展页面或内容脚本环境中的可用性提示，与「能否安装扩展」不是同一概念。

***

## 许可证

MIT License

***

**祝开发顺利。** 🚀