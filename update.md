# 🔥 小火火工具箱 — 升级改造计划书

> 基于项目 v1.9.0 现状的全面分析，涵盖 **功能升级 / 新增功能 / 彩蛋游戏 / 代码结构优化** 四大维度。
> 分析日期：2026-06-11

---

## 📊 项目现状概览

| 维度 | 数据 |
|------|------|
| 总代码量 | ~28,900 行 TS/TSX + ~10,300 行 CSS |
| 组件数量 | 26 个有代码的组件目录 + 4 个空占位目录 |
| 彩蛋游戏 | 7 款 + 1 个局域网聊天 |
| 运行模式 | Popup / Side Panel / 独立浮窗 / 全页面 |
| 构建工具 | Vite 5 + React 18 + TypeScript + Ant Design 6 |

### 空占位目录（已建目录但无任何代码文件）

- `CursorStudio` — 光标工作室（空目录，未实现）
- `ResourceProxy` — 资源代理（空目录，未实现）
- `TechStackProbe` — 技术栈探测（空目录，未实现）
- `WebVitals` — Web 性能指标（空目录，未实现）

---

## 一、🔧 现有功能改造升级

### 1.1 App.tsx 主入口拆分（优先级：⭐⭐⭐⭐⭐）

**现状问题**：`App.tsx` 有 646 行，包含了路由逻辑、主题配置、侧边栏、内容面板、彩蛋入口等全部逻辑。

**改造方案**：
- 将 `ActiveTabPanel`（switch-case 面板路由）提取为独立的 `TabRouter.tsx`
- 将侧边栏导航（`SiderNavItem` / `SiderAction` / 折叠逻辑）提取为 `SiderNav/` 组件
- 将主题 ConfigProvider 配置提取到 `ThemeProvider.tsx`
- 将运行模式检测逻辑提取到 `hooks/useRunMode.ts`
- 将彩蛋触发逻辑（点击 10 次标题）提取到 `hooks/useEasterEggTrigger.ts`

### 1.2 CacheManager 组件瘦身（优先级：⭐⭐⭐⭐）

**现状问题**：`CacheManager/index.tsx` 高达 **1819 行**，是全项目最大的单文件，严重违反单一职责原则。

**改造方案**：
- 拆分为 `CookieManager/`、`BrowsingDataCleaner/`、`StorageViewer/` 三个子组件
- 提取 Cookie 操作逻辑到 `hooks/useCookieOperations.ts`
- 提取浏览数据清理到 `utils/browsingData.ts`

### 1.3 App.css 模块化（优先级：⭐⭐⭐⭐）

**现状问题**：`App.css` 有 736 行，包含全局样式、主题变量、布局样式、侧边栏样式、滚动条样式等。CSS 变量定义多达 80+，且都堆在 `:root` 中。

**改造方案**：
- 将 CSS 变量拆分：`variables/theme.css`、`variables/game-2048.css`、`variables/gradients.css`
- 将布局样式拆分：`layouts/sider.css`、`layouts/content.css`、`layouts/header.css`
- 将全局 reset 样式移到 `styles/reset.css`
- 考虑引入 CSS Modules 或 CSS-in-JS，避免全局样式污染

### 1.4 theme.ts 主题系统优化（优先级：⭐⭐⭐）

**现状问题**：`theme.ts` 有 1220 行，所有 18 套主题色板（default / bright / dreamy / qinglan / muying / caramel-latte / songyan / suyan / rock-strata / stardust-mist / dunhuang / forest-whisper / glacier / ink-lapis / jieqi-zhe / palace-cinnabar / ru-porcelain / han-brocade）的定义、应用逻辑、计算逻辑全部混在一个文件中。

**改造方案**：
- 将 18 套主题色板定义抽取到 `themes/` 目录下独立文件（如 `themes/default.ts`、`themes/glacier.ts`、`themes/dunhuang.ts` 等）
- 主题应用逻辑保留在 `utils/themeManager.ts`
- 支持用户自定义主题（通过颜色选择器自行配色），并可导出/导入自定义主题

### 1.5 userPreferences.ts 数据层升级（优先级：⭐⭐⭐）

**现状问题**：350 行全部使用 `localStorage` 原始 API，无统一的数据访问层，各处直接 `localStorage.getItem/setItem`，且错误处理模式重复（try-catch 包裹每个方法）。

**改造方案**：
- 封装统一的 `StorageService` 类，支持类型安全的 get/set/remove
- 增加数据版本号和迁移机制（当前导出 config 的 version 固定为 '1.0'，未来升级无法平滑迁移）
- 添加 `chrome.storage.sync` 支持，实现跨设备同步用户偏好

### 1.6 Settings 组件功能增强（优先级：⭐⭐⭐）

**现状**：Settings 已有 3 个 Tab（`general` 通用设置 / `theme` 主题设置 / `chat` 聊天设置），支持默认标签页选择、标签页排序、配置导入/导出、缓存清理、版本更新检测等。

**改造方案**：
- 在现有 Tab 基础上增加「快捷键设置」Tab，支持自定义全局快捷键
- 在 `general` Tab 内增加「数据统计」区块，展示各工具的使用频率排行
- 在 `general` Tab 内增加「关于」区块，展示 changelog、贡献者列表
- 配置导入导出增加「选择性导入」（当前是全量导入，不能选择性恢复某些配置）

### 1.7 RequestRedirector 增强（优先级：⭐⭐⭐）

**改造方案**：
- 支持请求 Header 修改（当前仅支持 URL 重定向）
- 支持 Mock 响应（返回自定义 JSON 数据）
- 支持规则分组和批量启用/禁用
- 增加规则导入/导出功能（方便团队协作共享调试规则）

### 1.8 翻译工具升级（优先级：⭐⭐）

**改造方案**：
- 支持更多翻译引擎（当前仅通过 `translate.googleapis.com/translate_a/single` 调用 Google Translate 免费接口，可增加 DeepL、有道等）
- 增加术语表/词库功能（前端常用术语中英对照，如 HOC、SSR 等）
- 划词翻译增加「钉住结果」功能，防止气泡消失

---

## 二、🆕 新增功能建议

### 2.1 CSS 工具集（优先级：⭐⭐⭐⭐⭐）

当前颜色工具（ColorTools）已包含 6 个子工具（颜色转换器 / 颜色搭配 / 渐变背景 / 对比度检查 / 色盲模拟 / CSS 阴影），但缺少 CSS 布局和动画方面的辅助工具。建议独立一套 CSS 辅助工具：

- **CSS Box Shadow 生成器**：可视化拖拽调节阴影参数，实时预览，一键复制
- **CSS Border Radius 生成器**：8 点独立调节圆角，支持不规则形状预览
- **CSS Flexbox/Grid 游乐场**：交互式学习和调试布局属性
- **CSS 动画编辑器**：关键帧编辑、贝塞尔曲线调节、动画预览与导出
- **CSS 单位换算器**：px ↔ rem ↔ em ↔ vw ↔ vh 互转

### 2.2 Web 性能分析面板（优先级：⭐⭐⭐⭐）

> 项目中已有 `WebVitals` 空占位目录，需从零实现

- 展示 Core Web Vitals（LCP / FID / CLS / INP / TTFB）
- 页面资源加载瀑布图
- DOM 节点数量统计
- 内存使用监控
- Performance API 时间线展示

### 2.3 技术栈探测器（优先级：⭐⭐⭐⭐）

> 项目中已有 `TechStackProbe` 空占位目录，需从零实现

- 自动检测当前页面使用的框架/库（React、Vue、Angular、jQuery 等）
- 检测打包工具（Webpack、Vite、Rollup 等）
- 识别 UI 框架（Ant Design、Element UI、Material UI 等）
- 检测 CSS 方案（Tailwind、Styled Components 等）
- 显示页面 meta 信息和 SEO 评分

### 2.4 接口文档生成器（优先级：⭐⭐⭐）

结合现有 API 调试工具，增加：
- 将调试历史自动生成 API 文档（Markdown 格式）
- 支持从 Swagger/OpenAPI JSON 导入并渲染文档
- 支持 cURL 命令与 API 调试参数互转

### 2.5 代码片段管理器（优先级：⭐⭐⭐）

- 分类存储常用代码片段（JS/TS/CSS/HTML）
- 支持语法高亮预览
- 一键复制到剪贴板
- 支持搜索和标签筛选
- 支持 GitHub Gist 同步

### 2.6 响应式预览工具（优先级：⭐⭐⭐）

- 在侧边栏中模拟不同设备尺寸（iPhone / iPad / 各种安卓设备）
- 实时预览当前页面在不同分辨率下的效果
- 支持自定义尺寸
- 截图对比功能

### 2.7 占位图/假数据生成器（优先级：⭐⭐）

- 生成各种尺寸的占位图（Placeholder Image）
- Mock 数据生成：姓名、地址、手机号、邮箱、ID 等
- 支持自定义模板规则
- JSON Schema → Mock 数据

### 2.8 前端资产管理（优先级：⭐⭐）

- SVG 图标查看/编辑/优化（SVGO）
- 图片压缩（基于 Canvas 的有损/无损压缩）
- 图片格式转换（PNG ↔ JPG ↔ WebP）
- 图片裁剪和缩放

### 2.9 网络请求监控/抓包（优先级：⭐⭐）

- 实时显示当前页面的网络请求列表
- 按类型过滤（XHR / Fetch / CSS / JS / 图片）
- 请求/响应详情查看
- 接口响应时间排行

### 2.10 页面无障碍检测（优先级：⭐⭐）

- 检测页面的 a11y 问题（缺少 alt、对比度不足、焦点顺序等）
- 色盲模拟器（ColorTools 已有 `ColorBlindSimulator` 子组件，此处可复用其核心逻辑，扩展为对整个页面实时应用色盲滤镜）
- 键盘导航测试
- ARIA 属性检查

---

## 三、🎮 彩蛋小游戏新增建议

### 现有游戏列表（7 款）
| 游戏 | 类型 |
|------|------|
| 2048 | 数字合并 |
| 俄罗斯方块 | 消除 |
| 贪吃蛇 | 经典街机 |
| 扫雷 | 逻辑推理 |
| 数独 | 数字推理 |
| Wordle | 猜词 |
| 打字练习 | 技能训练 |

### 3.1 建议新增的游戏

#### 🏓 Pong（弹球对战）
- 经典双人/人机弹球游戏
- 键盘操作，AI 对手难度可调
- 实现简单，Canvas 绘制即可

#### 🧱 Breakout（打砖块）
- 挡板 + 球 + 彩色砖块
- 支持道具掉落（加宽挡板、多球、穿透等）
- Canvas 实现，适合小窗口

#### 🎵 钢琴小键盘
- 模拟钢琴键盘，支持键盘弹奏
- Web Audio API 生成音频
- 内置几首经典曲目的教学模式
- 不算严格意义上的游戏，但趣味性很强

#### 🧮 24 点计算器
- 给出 4 个数字，用 + - × ÷ 凑出 24
- 限时模式，计分排行
- 前端开发者天天算数，正好练脑

#### 🎯 反应速度测试
- 屏幕变色后尽快点击，记录反应时间
- 排行榜记录历史最佳
- 短小精悍，几十行代码即可实现

#### 🐦 Flappy Bird
- 经典跳跃通过管道
- Canvas 绘制，物理引擎简单
- 极度上瘾，适合彩蛋

#### 🔴 围棋/五子棋
- 五子棋更适合快速对弈
- 支持人机对战（Minimax 算法 AI）
- 棋盘尺寸可选：9x9 / 15x15

#### 🃏 记忆翻牌（Memory Match）
- N×N 网格翻牌配对
- 记录翻牌次数和用时
- 多种难度（4x4 / 6x6 / 8x8）
- 可用 Emoji 或前端框架 Logo 做卡面

#### 🏃 无尽跑酷（Infinite Runner）
- 类 Chrome 小恐龙的横版跑酷
- 跳跃躲避障碍物
- 前端工程师 icon 做角色，Bug 做障碍物 🐛

#### 🎲 骰子大战（Dice Battle）
- 掷骰子比大小
- 支持各种规则变体（Yahtzee 简化版）
- 实现简单，纯粹放松

### 3.2 游戏系统升级建议

- **全局排行榜**：统一的分数系统，显示每款游戏的最高分和历史记录
- **成就系统**：完成特定挑战解锁徽章（如「俄罗斯方块消除 10 行」「2048 达到 2048」等）
- **游戏统计**：总游玩时长、各游戏偏好分析
- **皮肤/主题联动**：游戏界面跟随工具箱主题变化
- **每日挑战**：每天生成一道独特的谜题/关卡

---

## 四、🏗️ 代码结构优化建议

### 4.1 目录结构重组（优先级：⭐⭐⭐⭐⭐）

当前所有组件扁平放在 `src/components/` 下，随着功能增多，应按领域分组：

```
src/
├── features/                    # 按业务领域分组（26 个现有组件全部归类）
│   ├── code-tools/              # 代码相关工具
│   │   ├── JSONTools/
│   │   ├── RegexTester/
│   │   ├── CodecTools/
│   │   ├── DiffTool/
│   │   └── MarkdownPreview/
│   ├── network-tools/           # 网络相关工具
│   │   ├── APITester/
│   │   ├── RequestRedirector/
│   │   └── URLParamsEditor/
│   ├── visual-tools/            # 可视化工具
│   │   ├── ColorTools/          # 含 ColorConverter/ColorPalette/GradientGenerator/ContrastChecker/ColorBlindSimulator/ShadowGenerator
│   │   ├── ImageTools/          # 含 Base64Encoder/RandomImageGenerator 等
│   │   ├── FontPreview/
│   │   └── AsciiArt/
│   ├── browser-tools/           # 浏览器工具
│   │   ├── CacheManager/
│   │   ├── StorageManager/
│   │   ├── WebActions/
│   │   └── MouseTrail/
│   ├── utility-tools/           # 通用工具
│   │   ├── QRCodeGenerator/
│   │   ├── QRCodeDecoder/
│   │   ├── BarcodeGenerator/
│   │   ├── TimestampConverter/
│   │   ├── Translator/
│   │   └── ClipboardHistory/
│   └── easter-egg/              # 彩蛋区
│       ├── games/               # 7 款游戏
│       └── chat/                # 局域网聊天（含 LanRelayChatProvider）
├── shared/                      # 共享组件
│   ├── components/              # 通用 UI 组件（LoginStatus、ExampleFeature 等）
│   ├── hooks/                   # 公共 hooks（useCompatibility 等现有 + 新增）
│   ├── utils/                   # 工具函数（theme.ts、userPreferences.ts、redirectRules.ts 等）
│   └── styles/                  # 全局样式（从 App.css 拆分）
├── layouts/                     # 布局组件
│   ├── SiderNav/
│   ├── Header/
│   └── ContentArea/
├── providers/                   # Context Providers
│   ├── ThemeProvider.tsx         # 从 App.tsx 提取（含 ThemeSettings 组件）
│   └── AppStateProvider.tsx
├── services/                    # 数据服务层
│   ├── storage.ts
│   ├── preferences.ts
│   └── analytics.ts
├── content/                     # Content Scripts（已有，保持不变）
│   ├── translator.ts
│   ├── mouseTrail.ts
│   └── enableCopy.ts
└── background/                  # Service Worker（已有，保持不变）
    └── index.ts
```

### 4.2 公共 Hooks 提取（优先级：⭐⭐⭐⭐）

目前各组件中存在大量重复逻辑，应提取为公共 Hooks：

| Hook 名称 | 用途 | 受益组件 |
|-----------|------|---------|
| `useLocalStorage<T>` | 类型安全的 localStorage 读写 + 自动序列化 | 几乎所有组件 |
| `useChromeStorage<T>` | chrome.storage API 封装 | Settings, Redirector, MouseTrail |
| `useCopyToClipboard` | 复制到剪贴板 + toast 反馈 | QRCode, JSON, Codec, URL 等 |
| `useDebounce / useThrottle` | 防抖/节流 | 翻译、正则测试、API 调试 |
| `useRunMode` | 检测 Popup/SidePanel/Standalone | App, Settings |
| `useKeyboardShortcut` | 全局快捷键注册 | 所有工具 |
| `useTabActive` | 标签页可见性检测 | 计时器相关、动画相关 |

### 4.3 状态管理升级（优先级：⭐⭐⭐）

**现状问题**：
- 主应用的全局状态通过 `App.tsx` 的 `useState` 向下传递（props drilling），未使用 React Context（仅聊天模块 `LanRelayChatProvider` 使用了独立的 Context）
- 主题、设置、用户偏好等跨组件状态依赖 localStorage + 自定义事件（`themeChanged` / `tabOrderChanged`）间接同步
- 主应用缺少统一的状态管理方案

**建议方案**（轻量级，无需引入 Redux/MobX）：
- 使用 React Context + useReducer 建立 `AppContext`
- 将主题状态、活动标签、运行模式等提升到 Context
- 拆分为多个 Context 避免不必要的重渲染：
  - `ThemeContext` — 主题相关
  - `PreferencesContext` — 用户偏好
  - `AppStateContext` — 应用运行状态

### 4.4 TypeScript 类型系统加强（优先级：⭐⭐⭐）

**现状问题**：
- 部分地方使用 `any` 类型（如 `userPreferences.ts` 中的 `(t: any)`）
- 缺少共享的类型定义文件
- 组件 Props 类型部分缺少详细的 JSDoc 注释

**改造方案**：
- 创建 `types/` 目录，集中管理共享类型
- 创建 `types/feature.ts`（FeatureTab 相关类型）、`types/theme.ts`（主题类型）、`types/game.ts`（游戏类型）
- 消除所有 `any` 使用（当前 `tsconfig.json` 已开启 `strict: true` + `noUnusedLocals` + `noUnusedParameters`，但仍有 `any` 残留逃逸）

### 4.5 性能优化（优先级：⭐⭐⭐）

- **代码分割优化**：当前 `lazy()` 仅在组件级别，可进一步按路由分组做 chunk 合并，减少 HTTP 请求数
- **虚拟列表**：CacheManager 中的 Cookie 列表、StorageManager 中的 Storage 列表，数据量大时应使用虚拟滚动
- **Web Worker**：将 JSON 格式化/压缩、正则匹配、Diff 对比等 CPU 密集型操作移到 Web Worker
- **图片懒加载**：ImageTools 中的图片预览使用 IntersectionObserver 懒加载
- **Memoization 审查**：检查各组件的 `useMemo`/`useCallback` 使用是否合理，消除不必要的重渲染

### 4.6 错误边界与容错（优先级：⭐⭐⭐）

**现状问题**：缺少 React Error Boundary，单个组件崩溃会导致整个应用白屏。

**改造方案**：
- 为每个功能组件包裹 `ErrorBoundary`，崩溃时显示友好的错误提示和「重试」按钮
- 添加全局错误捕获 `window.onerror` + `unhandledrejection`
- 关键操作增加 loading 状态和超时处理

### 4.7 测试体系建设（优先级：⭐⭐）

**现状问题**：项目当前没有任何测试文件。

**建议方案**：
- 引入 Vitest（与 Vite 生态天然集成）+ React Testing Library
- 优先为工具函数编写单元测试（`utils/theme.ts`、`utils/userPreferences.ts`、`utils/redirectRules.ts`）
- 为核心组件编写集成测试（QRCode 生成/解码、JSON 格式化、时间戳转换等）
- 游戏逻辑核心算法编写单元测试（2048 合并逻辑、扫雷生成逻辑、数独验证逻辑）

### 4.8 构建产物优化（优先级：⭐⭐）

- 添加 `vite-plugin-compression` 进行 gzip/brotli 压缩
- 添加 bundle 分析工具（`rollup-plugin-visualizer`）监控包体积
- 优化 `manualChunks` 策略，进一步拆分大的 vendor 包
- Ant Design 当前已按命名导入方式使用（`import { Button } from 'antd'`），Vite 的 tree-shaking 会自动处理；可进一步通过 `babel-plugin-import` 或 `unplugin-auto-import` 减少未使用组件的样式残留

### 4.9 国际化预埋（优先级：⭐）

**建议方案**：
- 使用 `react-i18next` 建立多语言框架
- 先支持中文 + 英文
- 抽取所有硬编码的中文字符串到 locale 文件
- Chrome 扩展的 `_locales` 目录配合实现扩展名称/描述的多语言

### 4.10 空占位目录的处理（优先级：⭐⭐⭐）

以下 4 个目录已创建但内部**没有任何文件**（完全为空），直接清理：

| 目录 | 建议 |
|------|------|
| `CursorStudio` | 光标工作室 — 功能定位不明确，建议先明确需求再决定是否实现；若无计划则删除空目录 |
| `ResourceProxy` | 资源代理 — 功能有价值（CDN 代理、CORS 绕过等），建议从零实现并注册到导航 |
| `TechStackProbe` | 技术栈探测 — 前端高频需求，建议优先从零实现（检测页面使用的框架/库/打包工具） |
| `WebVitals` | Web 性能指标 — 开发必备工具，建议优先从零实现（展示 LCP/FID/CLS 等 Core Web Vitals） |

---

## 五、📋 改造优先级总览

### 🔴 P0 — 立即执行（代码健康 & 架构债务）
1. App.tsx 主入口拆分
2. CacheManager 组件瘦身
3. 目录结构重组
4. 空占位目录处理（从零实现或清理）

### 🟡 P1 — 近期执行（功能增强 & 体验提升）
1. App.css 模块化
2. 公共 Hooks 提取
3. 错误边界与容错
4. CSS 工具集新增
5. Web 性能分析面板上线
6. 技术栈探测器上线
7. 游戏系统升级（排行榜 + 成就）

### 🟢 P2 — 中期执行（锦上添花）
1. 主题系统优化
2. 状态管理升级
3. TypeScript 类型加强
4. 性能优化
5. 新增 3~5 款彩蛋游戏
6. 代码片段管理器
7. 响应式预览工具
8. Settings 功能增强

### 🔵 P3 — 远期规划
1. 测试体系建设
2. 构建产物优化
3. 国际化预埋
4. 占位图/假数据生成器
5. 网络请求监控
6. 页面无障碍检测

---

## 六、🎯 预估工作量

| 类别 | 项数 | 预估人天 |
|------|------|---------|
| 现有功能改造 | 8 项 | 15~20 天 |
| 新增功能 | 10 项 | 25~35 天 |
| 彩蛋游戏 | 10 款 + 系统升级 | 10~15 天 |
| 代码结构优化 | 10 项 | 12~18 天 |
| **合计** | **38 项** | **62~88 天** |

> 以上为单人全职开发预估，可根据优先级分批迭代。建议按 P0 → P1 → P2 → P3 逐步推进，每个迭代周期 1~2 周。

---

*Generated for 小火火工具箱 v1.9.0 · Made with ❤️*
