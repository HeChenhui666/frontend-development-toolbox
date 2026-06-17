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

```
🔥 小火火工具箱
├── 🔲 二维码
│   ├── 生成（支持下载、全屏预览、滚轮缩放）
│   ├── 解码（摄像头实时扫码、上传图片、多码识别）
│   ├── 条形码生成（Code128、EAN-13 等）
│   └── 历史记录（自动保存、快速复用）
│
├── 🔗 URL 参数
│   ├── URL 解析与可视化编辑
│   ├── URL 编码自动解码
│   ├── UTM 生成器（营销链接追踪参数）
│   ├── URL Diff（对比两个 URL 差异）
│   ├── 深链解析（提取深层链接）
│   └── URL 编解码（encodeURIComponent / decodeURIComponent）
│
├── ⏰ 时间戳
│   ├── 时间戳与日期时间互转
│   ├── 当前时间戳实时显示
│   ├── 多时区对照
│   ├── Cron 解析
│   ├── 倒计时
│   └── 相对时间计算
│
├── 🖼️ 图片工具
│   ├── 随机图片
│   ├── Base64 编解码
│   ├── Lottie 预览
│   ├── 图片压缩（JPEG、PNG、WebP）
│   ├── 格式转换
│   └── 占位图生成
│
├── 📄 JSON
│   ├── 格式化、校验、压缩
│   ├── JSON 比对
│   ├── Schema 生成
│   ├── JSONPath 查询
│   ├── YAML/TOML 互转
│   ├── Mock 数据生成
│   ├── 树形可视化
│   └── 多语言类型生成（TypeScript、Go、Java、Python）
│
├── 🎨 颜色工具
│   ├── 颜色转换器（HEX / RGB / HSL / RGBA / HSLA）
│   ├── 颜色搭配建议
│   ├── 渐变背景生成
│   ├── 取色器
│   ├── 对比度检查（WCAG 合规性）
│   ├── 色盲模拟
│   └── CSS Shadows 生成器
│
├── 🔤 正则
│   ├── 实时匹配、标志位、预设正则
│   ├── 铁路图可视化（Railroad Diagram）
│   ├── 自然语言解释
│   └── ReDoS 检测
│
├── 🌐 翻译
│   ├── 文本翻译
│   ├── 页面内选中文本气泡翻译
│   ├── 术语表
│   └── 翻译历史
│
├── 🔌 API 调试
│   ├── HTTP 请求（GET / POST / PUT / DELETE）
│   ├── 自定义头与 Body（JSON、表单、纯文本）
│   ├── 响应查看（状态、响应头、Body）
│   ├── 请求模板持久化
│   ├── 请求历史
│   ├── 环境变量
│   └── cURL 导入导出
│
├── 🧹 缓存管理
│   ├── Cookie 管理
│   ├── 浏览数据清理
│   ├── LocalStorage/SessionStorage 管理
│   └── Cookie 导入导出
│
├── 🔄 请求重定向
│   ├── declarativeNetRequest 规则管理
│   ├── 规则校验与一键应用
│   ├── 规则组/环境切换
│   └── 规则导入导出
│
├── 🧭 网页操作
│   ├── 解除防复制限制
│   ├── 暗黑模式注入
│   ├── 页面性能分析（FCP、LCP、CLS）
│   └── DOM 统计
│
├── ✨ 鼠标拖尾
│   ├── 自定义拖尾样式与行为
│   └── 多种粒子效果预设
│
├── 🔣 编解码
│   ├── Unicode 编码（转义 / 还原）
│   ├── UTF-8 编解码
│   ├── Base64 编解码
│   ├── JWT 解析
│   ├── Hash 计算（MD5、SHA-1、SHA-256、SHA-512）
│   └── HTML 实体编解码
│
├── 📝 Markdown
│   ├── 纯前端 Markdown 解析
│   ├── 左右分栏布局
│   └── 滚动同步
│
├── 📊 Diff 对比
│   ├── LCS 算法文本差异对比
│   ├── 行级和字符级差异高亮
│   └── 复制 diff 结果
│
├── 📋 备忘录
│   ├── 文字备忘粘贴板
│   ├── 置顶、搜索、删除、清空
│   └── localStorage 持久化
│
├── 🎨 ASCII 画布
│   ├── 预设图案（颜文字）
│   ├── 文字转 ASCII（大字模式）
│   └── 边框样式选择
│
└── ⚙️ 设置
    ├── 多主题
    ├── 标签顺序（拖拽排序）
    ├── 数据清除
    └── 配置导入导出
```

> **tip**：你能找到彩蛋页面吗？🔥

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