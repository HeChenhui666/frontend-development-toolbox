export interface CSSSnippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  example?: string;
}

export interface CSSSnippetsByCategory {
  layout: CSSSnippet[];
  visual: CSSSnippet[];
  responsive: CSSSnippet[];
  animation: CSSSnippet[];
  interaction: CSSSnippet[];
  utilities: CSSSnippet[];
  mobile: CSSSnippet[];
  form: CSSSnippet[];
  mixins: CSSSnippet[];
}

export const CSS_SNIPPETS: CSSSnippetsByCategory = {
  layout: [
    {
      id: 'center-flex',
      title: '居中布局 - 水平垂直居中',
      description: '使用 Flexbox 实现完美的水平和垂直居中，兼容性好',
      code: `.center-flex {
  display: -webkit-box;      /* 老版本语法 */
  display: -ms-flexbox;      /* IE 10 */
  display: -webkit-flex;     /* Safari 6.1+ */
  display: flex;
  -webkit-box-pack: center;   /* 老版本语法 */
  -ms-flex-pack: center;      /* IE 10 */
  -webkit-justify-content: center;
  justify-content: center;
  -webkit-box-align: center;  /* 老版本语法 */
  -ms-flex-align: center;     /* IE 10 */
  -webkit-align-items: center;
  align-items: center;
}`,
      example: '<div class="center-flex" style="display: flex; justify-content: center; align-items: center; height: 100px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white; font-weight: 600;">完美居中</div>',
    },
    {
      id: 'grid-2col',
      title: '网格布局 - 2列自适应',
      description: '简单的两列等宽网格布局，自动适应容器宽度',
      code: `.grid-2col {
  display: -ms-grid;          /* IE 10 */
  display: grid;
  -ms-grid-columns: 1fr 1fr;  /* IE 10 */
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

/* 兼容旧浏览器降级方案 */
@supports not (display: grid) {
  .grid-2col {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    justify-content: space-between;
  }
  .grid-2col > * {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    margin-right: 20px;
  }
  .grid-2col > *:last-child {
    margin-right: 0;
  }
}`,
      example: '<div class="grid-2col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;"><div style="padding: 20px; background: #f0f0f0; border-radius: 4px;">列1</div><div style="padding: 20px; background: #e0e0e0; border-radius: 4px;">列2</div></div>',
    },
    {
      id: 'grid-responsive',
      title: '网格布局 - 响应式卡片',
      description: '自动适应屏幕宽度的响应式卡片网格，最小宽度250px',
      code: `.grid-responsive {
  display: -ms-grid;          /* IE 10 */
  display: grid;
  -ms-grid-columns: (minmax(250px, 1fr))[auto-fit];  /* IE 10 降级 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* 兼容旧浏览器降级方案 */
@supports not (display: grid) {
  .grid-responsive {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-wrap: wrap;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
    margin: -10px;
  }
  .grid-responsive > * {
    -webkit-box-flex: 1;
    -ms-flex: 1 1 250px;
    flex: 1 1 250px;
    margin: 10px;
    min-width: 250px;
  }
}`,
      example: '<div class="grid-responsive" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;"><div style="padding: 15px; background: #667eea; color: white; border-radius: 4px; text-align: center;">卡片1</div><div style="padding: 15px; background: #764ba2; color: white; border-radius: 4px; text-align: center;">卡片2</div><div style="padding: 15px; background: #f093fb; color: white; border-radius: 4px; text-align: center;">卡片3</div></div>',
    },
    {
      id: 'three-column',
      title: '三栏布局',
      description: '经典的三栏布局：左右固定宽度，中间自适应',
      code: `.three-column {
  display: -ms-grid;          /* IE 10 */
  display: grid;
  -ms-grid-columns: 200px 1fr 200px;  /* IE 10 */
  grid-template-columns: 200px 1fr 200px;
  gap: 20px;
}

/* 兼容旧浏览器降级方案 */
@supports not (display: grid) {
  .three-column {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
  }
  .three-column > *:first-child,
  .three-column > *:last-child {
    width: 200px;
    -webkit-box-flex: 0;
    -ms-flex: 0 0 200px;
    flex: 0 0 200px;
  }
  .three-column > *:nth-child(2) {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    margin: 0 20px;
  }
}`,
      example: '<div class="three-column" style="display: grid; grid-template-columns: 80px 1fr 80px; gap: 10px; font-size: 12px;"><div style="padding: 10px; background: #f0f0f0; border-radius: 4px; text-align: center;">左侧</div><div style="padding: 10px; background: #e0e0e0; border-radius: 4px; text-align: center;">中间自适应</div><div style="padding: 10px; background: #f0f0f0; border-radius: 4px; text-align: center;">右侧</div></div>',
    },
    {
      id: 'holy-grail',
      title: '圣杯布局',
      description: '经典的圣杯布局：头部、主体、底部，主体自适应高度',
      code: `.holy-grail {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  -webkit-flex-direction: column;
  flex-direction: column;
  min-height: 100vh;
}

.holy-grail-header {
  -webkit-box-flex: 0;
  -ms-flex: 0 0 auto;
  -webkit-flex: 0 0 auto;
  flex: 0 0 auto;
}

.holy-grail-main {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  -webkit-flex: 1;
  flex: 1;
}

.holy-grail-footer {
  -webkit-box-flex: 0;
  -ms-flex: 0 0 auto;
  -webkit-flex: 0 0 auto;
  flex: 0 0 auto;
}`,
      example: '<div class="holy-grail" style="display: flex; flex-direction: column; min-height: 120px; border: 1px solid #ddd; border-radius: 4px;"><div class="holy-grail-header" style="padding: 10px; background: #667eea; color: white; text-align: center; font-weight: 600;">Header</div><div class="holy-grail-main" style="padding: 20px; background: #f8f9fa; text-align: center;">Main Content (自适应高度)</div><div class="holy-grail-footer" style="padding: 10px; background: #764ba2; color: white; text-align: center; font-weight: 600;">Footer</div></div>',
    },
    {
      id: 'flex-center',
      title: 'Flexbox 居中（简化版）',
      description: '简化的 Flexbox 居中代码，适用于现代浏览器',
      code: `.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}`,
      example: '<div class="flex-center" style="display: flex; justify-content: center; align-items: center; height: 100px; background: #f0f0f0; border: 1px solid #ddd;">居中内容</div>',
    },
    {
      id: 'sticky-header',
      title: '粘性头部',
      description: '创建滚动时固定在顶部的头部，兼容性好',
      code: `.sticky-header {
  position: -webkit-sticky;  /* Safari */
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 兼容不支持 sticky 的浏览器 */
@supports not (position: sticky) {
  .sticky-header {
    position: fixed;
    width: 100%;
    left: 0;
    right: 0;
  }
  /* 需要为内容添加顶部间距 */
  body {
    padding-top: 60px; /* 根据头部高度调整 */
  }
}`,
    },
    {
      id: 'two-column',
      title: '两列布局（Flexbox）',
      description: '经典的两列布局，左侧固定宽度，右侧自适应，兼容性好',
      code: `.two-column {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
}

.sidebar {
  width: 200px;
  -webkit-box-flex: 0;
  -ms-flex: 0 0 200px;
  -webkit-flex: 0 0 200px;
  flex: 0 0 200px;
}

.main {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  -webkit-flex: 1;
  flex: 1;
}

/* 响应式：小屏幕时垂直排列 */
@media (max-width: 768px) {
  .two-column {
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    -webkit-flex-direction: column;
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
  }
}`,
      example: '<div class="two-column" style="display: flex; gap: 10px; font-size: 12px;"><div class="sidebar" style="padding: 10px; background: #f0f0f0; border-radius: 4px; width: 80px; flex-shrink: 0;">侧边栏</div><div class="main" style="padding: 10px; background: #e0e0e0; border-radius: 4px; flex: 1;">主内容区域（自适应宽度）</div></div>',
    },
    {
      id: 'flex-space-between',
      title: 'Flexbox 两端对齐',
      description: '元素在容器两端对齐，中间自动分配空间',
      code: `.flex-space-between {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  -webkit-justify-content: space-between;
  justify-content: space-between;
  -webkit-box-align: center;
  -ms-flex-align: center;
  -webkit-align-items: center;
  align-items: center;
}`,
      example: '<div class="flex-space-between" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 4px;"><span>左侧</span><span>右侧</span></div>',
    },
    {
      id: 'flex-wrap',
      title: 'Flexbox 换行布局',
      description: 'Flexbox 自动换行，适合卡片列表布局',
      code: `.flex-wrap {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  -ms-flex-wrap: wrap;
  -webkit-flex-wrap: wrap;
  flex-wrap: wrap;
  gap: 20px;
}

/* 兼容不支持 gap 的浏览器 */
@supports not (gap: 20px) {
  .flex-wrap > * {
    margin: 10px;
  }
  .flex-wrap {
    margin: -10px;
  }
}`,
      example: '<div class="flex-wrap" style="display: flex; flex-wrap: wrap; gap: 10px;"><div style="padding: 15px; background: #667eea; color: white; border-radius: 4px; min-width: 100px; text-align: center;">项目1</div><div style="padding: 15px; background: #764ba2; color: white; border-radius: 4px; min-width: 100px; text-align: center;">项目2</div><div style="padding: 15px; background: #f093fb; color: white; border-radius: 4px; min-width: 100px; text-align: center;">项目3</div></div>',
    },
    {
      id: 'grid-auto-fit',
      title: 'Grid 自动适应列数',
      description: '根据容器宽度自动调整列数，每列最小宽度200px',
      code: `.grid-auto-fit {
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: (minmax(200px, 1fr))[auto-fit];
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

/* 兼容旧浏览器 */
@supports not (display: grid) {
  .grid-auto-fit {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-wrap: wrap;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
  }
  .grid-auto-fit > * {
    -webkit-box-flex: 1;
    -ms-flex: 1 1 200px;
    flex: 1 1 200px;
    margin: 10px;
    min-width: 200px;
  }
}`,
    },
    {
      id: 'masonry-layout',
      title: '瀑布流布局（Grid）',
      description: '使用 Grid 实现瀑布流效果，适合图片展示',
      code: `.masonry-layout {
  display: -ms-grid;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: 10px;
  gap: 10px;
}

.masonry-item {
  grid-row-end: span var(--row-span, 20);
}

/* 兼容旧浏览器降级为普通网格 */
@supports not (display: grid) {
  .masonry-layout {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-wrap: wrap;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
  }
  .masonry-item {
    width: calc(33.333% - 10px);
    margin: 5px;
  }
}`,
    },
    {
      id: 'center-absolute',
      title: '绝对定位居中',
      description: '使用绝对定位实现居中，兼容性最好',
      code: `.center-absolute {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}

/* 兼容不支持 transform 的浏览器 */
@supports not (transform: translate(-50%, -50%)) {
  .center-absolute {
    top: 50%;
    left: 50%;
    margin-top: -50%; /* 需要知道元素高度的一半 */
    margin-left: -50%; /* 需要知道元素宽度的一半 */
  }
}`,
      example: '<div style="position: relative; height: 100px; background: #f0f0f0; border-radius: 4px;"><div class="center-absolute" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 10px; background: #667eea; color: white; border-radius: 4px;">绝对居中</div></div>',
    },
    {
      id: 'center-margin',
      title: 'Margin 居中（块级元素）',
      description: '最简单的水平居中方法，适用于块级元素',
      code: `.center-margin {
  width: 80%; /* 或其他固定宽度 */
  margin-left: auto;
  margin-right: auto;
}

/* 或者使用 max-width */
.center-margin-responsive {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
}`,
      example: '<div class="center-margin" style="width: 80%; margin: 0 auto; padding: 15px; background: #667eea; color: white; border-radius: 4px; text-align: center;">水平居中</div>',
    },
    {
      id: 'sidebar-main',
      title: '侧边栏 + 主内容布局',
      description: '侧边栏可折叠，主内容自适应，响应式设计',
      code: `.sidebar-main {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  -webkit-box-flex: 0;
  -ms-flex: 0 0 250px;
  -webkit-flex: 0 0 250px;
  flex: 0 0 250px;
  background: #f8f9fa;
  transition: margin-left 0.3s ease;
}

.sidebar.collapsed {
  margin-left: -250px;
}

.main-content {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  -webkit-flex: 1;
  flex: 1;
  padding: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    margin-left: -250px;
  }
  .sidebar.open {
    margin-left: 0;
  }
  .main-content {
    width: 100%;
  }
}`,
    },
  ],
  visual: [
    {
      id: 'frosted-glass',
      title: '毛玻璃效果',
      description: '经典的毛玻璃（Frosted Glass）效果，带背景模糊',
      code: `.frosted-glass {
  background: rgba(255, 255, 255, 0.1);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

/* 兼容不支持 backdrop-filter 的浏览器 */
@supports not (backdrop-filter: blur(10px)) {
  .frosted-glass {
    background: rgba(255, 255, 255, 0.9);
    filter: blur(0);
  }
}`,
      example: '<div class="frosted-glass" style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); padding: 20px; border-radius: 8px; color: #333; font-weight: 600;">毛玻璃效果</div>',
    },
    {
      id: 'card-shadow',
      title: '卡片阴影',
      description: 'Material Design 风格的卡片阴影效果',
      code: `.card-shadow {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 
              0 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: white;
  padding: 20px;
}

/* 增强版多层阴影 */
.card-shadow-elevated {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12),
              0 1px 2px rgba(0, 0, 0, 0.24);
  transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-shadow-elevated:hover {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16),
              0 3px 6px rgba(0, 0, 0, 0.23);
}`,
      example: '<div class="card-shadow" style="box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08); border-radius: 8px; background: white; padding: 20px; text-align: center;">卡片阴影效果</div>',
    },
    {
      id: 'hover-shadow',
      title: '悬浮阴影增强',
      description: '鼠标悬停时阴影增强的交互效果',
      code: `.hover-shadow {
  transition: box-shadow 0.3s ease,
              -webkit-box-shadow 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hover-shadow:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  -webkit-box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* 带提升效果的版本 */
.hover-shadow-lift {
  transition: box-shadow 0.3s ease,
              transform 0.3s ease,
              -webkit-box-shadow 0.3s ease,
              -webkit-transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.hover-shadow-lift:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  -webkit-transform: translateY(-5px);
  transform: translateY(-5px);
}`,
      example: '<style>.hover-shadow-example { transition: box-shadow 0.3s ease; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); padding: 20px; background: white; border-radius: 8px; text-align: center; cursor: pointer; } .hover-shadow-example:hover { box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }</style><div class="hover-shadow-example">悬停查看阴影效果</div>',
    },
    {
      id: 'gradient-border',
      title: '渐变边框',
      description: '使用伪元素和 mask 实现渐变边框效果',
      code: `.gradient-border {
  position: relative;
  border: none;
  background: white;
  border-radius: 8px;
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border-radius: 8px;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, 
                linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, 
        linear-gradient(#fff 0 0);
  mask-composite: exclude;
}

/* 兼容不支持 mask 的浏览器（使用伪元素叠加） */
@supports not (mask-composite: exclude) {
  .gradient-border {
    background: linear-gradient(white, white) padding-box,
                linear-gradient(45deg, #ff6b6b, #4ecdc4) border-box;
    border: 2px solid transparent;
  }
}`,
      example: '<div class="gradient-border" style="position: relative; border: none; background: white; border-radius: 8px; padding: 20px;"><div style="position: absolute; inset: 0; padding: 2px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border-radius: 8px; -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite: exclude; pointer-events: none;"></div><div style="position: relative; z-index: 1;">渐变边框效果</div></div>',
    },
    {
      id: 'gradient-text',
      title: '文字渐变',
      description: '创建渐变颜色的文字效果，兼容性好',
      code: `.gradient-text {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent; /* 降级方案 */
}

/* 兼容不支持 background-clip: text 的浏览器 */
@supports not (-webkit-background-clip: text) {
  .gradient-text {
    background: none;
    color: #ff6b6b; /* 降级为单色 */
  }
}`,
      example: '<div class="gradient-text" style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 24px; font-weight: 700; text-align: center;">渐变文字效果</div>',
    },
    {
      id: 'glassmorphism',
      title: '毛玻璃效果（增强版）',
      description: '流行的毛玻璃（Glassmorphism）视觉效果，带更多细节',
      code: `.glassmorphism {
  background: rgba(255, 255, 255, 0.25);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border-radius: 16px;
}

/* 深色背景版本 */
.glassmorphism-dark {
  background: rgba(0, 0, 0, 0.25);
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
}`,
      example: '<div class="glassmorphism" style="background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(10px) saturate(180%); -webkit-backdrop-filter: blur(10px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.18); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37); border-radius: 16px; padding: 20px; color: #333; font-weight: 600;">Glassmorphism 效果</div>',
    },
    {
      id: 'box-shadow',
      title: '多层阴影效果',
      description: '创建深度感的多层阴影效果',
      code: `.box-shadow {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1),
              0 4px 8px rgba(0, 0, 0, 0.1),
              0 8px 16px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: white;
}

/* 内阴影效果 */
.box-shadow-inset {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1),
              inset 0 4px 8px rgba(0, 0, 0, 0.05);
}

/* 彩色阴影 */
.box-shadow-colored {
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3),
              0 1px 3px rgba(102, 126, 234, 0.2);
}`,
      example: '<div class="box-shadow" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1); border-radius: 8px; background: white; padding: 20px; text-align: center;">多层阴影</div>',
    },
    {
      id: 'border-gradient',
      title: '渐变边框（完整版）',
      description: '使用伪元素实现渐变边框，支持圆角',
      code: `.border-gradient {
  position: relative;
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.border-gradient::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 8px;
  padding: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, 
                linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, 
        linear-gradient(#fff 0 0);
  mask-composite: exclude;
  z-index: -1;
}

/* 兼容方案 */
@supports not (mask-composite: exclude) {
  .border-gradient {
    background: linear-gradient(white, white) padding-box,
                linear-gradient(135deg, #667eea, #764ba2) border-box;
    border: 2px solid transparent;
  }
}`,
    },
    {
      id: 'text-shadow',
      title: '文字阴影效果',
      description: '创建立体感的文字阴影',
      code: `.text-shadow {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* 多层文字阴影 */
.text-shadow-multi {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5),
               2px 2px 4px rgba(0, 0, 0, 0.3),
               3px 3px 6px rgba(0, 0, 0, 0.1);
}

/* 发光文字效果 */
.text-shadow-glow {
  text-shadow: 0 0 10px rgba(102, 126, 234, 0.8),
               0 0 20px rgba(102, 126, 234, 0.6),
               0 0 30px rgba(102, 126, 234, 0.4);
}`,
      example: '<div class="text-shadow" style="text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); font-size: 24px; font-weight: 700; text-align: center; color: #333;">文字阴影效果</div>',
    },
    {
      id: 'neomorphism',
      title: '新拟态设计',
      description: 'Neumorphism 风格的软阴影效果',
      code: `.neomorphism {
  background: #e0e0e0;
  box-shadow: 9px 9px 18px #bebebe,
              -9px -9px 18px #ffffff;
  border-radius: 20px;
  padding: 20px;
}

/* 内凹效果 */
.neomorphism-inset {
  background: #e0e0e0;
  box-shadow: inset 9px 9px 18px #bebebe,
              inset -9px -9px 18px #ffffff;
  border-radius: 20px;
  padding: 20px;
}

/* 彩色新拟态 */
.neomorphism-colored {
  background: #f0f0f0;
  box-shadow: 8px 8px 16px rgba(102, 126, 234, 0.2),
              -8px -8px 16px rgba(255, 255, 255, 0.8);
}`,
      example: '<div class="neomorphism" style="background: #e0e0e0; box-shadow: 9px 9px 18px #bebebe, -9px -9px 18px #ffffff; border-radius: 20px; padding: 20px; text-align: center; font-weight: 600; color: #555;">新拟态效果</div>',
    },
    {
      id: 'glow-effect',
      title: '发光效果',
      description: '创建元素周围的发光效果',
      code: `.glow-effect {
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.5),
              0 0 20px rgba(102, 126, 234, 0.3),
              0 0 30px rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  padding: 20px;
  background: white;
}

/* 悬停时增强发光 */
.glow-effect-hover {
  transition: box-shadow 0.3s ease;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
}

.glow-effect-hover:hover {
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6),
              0 0 40px rgba(102, 126, 234, 0.4),
              0 0 60px rgba(102, 126, 234, 0.2);
}`,
      example: '<div class="glow-effect" style="box-shadow: 0 0 10px rgba(102, 126, 234, 0.5), 0 0 20px rgba(102, 126, 234, 0.3), 0 0 30px rgba(102, 126, 234, 0.2); border-radius: 8px; padding: 20px; background: white; text-align: center; font-weight: 600;">发光效果</div>',
    },
    {
      id: 'gradient-overlay',
      title: '渐变遮罩',
      description: '在图片或内容上添加渐变遮罩效果',
      code: `.gradient-overlay {
  position: relative;
  overflow: hidden;
}

.gradient-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, 
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.7) 100%);
  z-index: 1;
  pointer-events: none;
}

.gradient-overlay > * {
  position: relative;
  z-index: 2;
}

/* 从下到上的渐变 */
.gradient-overlay-bottom {
  background: linear-gradient(to top, 
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0) 100%);
}`,
    },
    {
      id: 'blur-background',
      title: '背景模糊',
      description: '模糊背景内容，突出前景',
      code: `.blur-background {
  position: relative;
  overflow: hidden;
}

.blur-background::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: inherit;
  -webkit-filter: blur(10px);
  filter: blur(10px);
  z-index: -1;
}

/* 使用 backdrop-filter（更现代） */
.blur-background-modern {
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.8);
}`,
    },
  ],
  responsive: [
    {
      id: 'responsive-container',
      title: '响应式容器',
      description: '自适应宽度的容器，最大宽度限制，居中显示',
      code: `.responsive-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 不同尺寸的容器变体 */
.responsive-container-sm {
  max-width: 640px;
}

.responsive-container-md {
  max-width: 768px;
}

.responsive-container-lg {
  max-width: 1024px;
}

.responsive-container-xl {
  max-width: 1280px;
}

/* 全宽容器（小屏幕） */
@media (max-width: 768px) {
  .responsive-container {
    padding: 0 16px;
  }
}`,
      example: '<div class="responsive-container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px; background: #f0f0f0; border-radius: 4px; text-align: center; padding: 15px;">响应式容器（最大宽度1200px）</div>',
    },
    {
      id: 'breakpoint-definition',
      title: '断点定义',
      description: '常用的响应式断点和显示/隐藏控制',
      code: `/* 移动端优先：默认隐藏移动端专用元素 */
.mobile-only {
  display: none;
}

/* 桌面端优先：默认隐藏桌面端专用元素 */
.desktop-only {
  display: block;
}

/* 移动端断点（768px及以下） */
@media (max-width: 768px) {
  .mobile-only {
    display: block;
  }
  .desktop-only {
    display: none;
  }
}

/* 平板断点（769px - 1024px） */
@media (min-width: 769px) and (max-width: 1024px) {
  .tablet-only {
    display: block;
  }
  .mobile-only,
  .desktop-only {
    display: none;
  }
}

/* 桌面端断点（1025px及以上） */
@media (min-width: 1025px) {
  .desktop-only {
    display: block;
  }
  .mobile-only {
    display: none;
  }
}

/* 常用断点变量（CSS变量） */
:root {
  --breakpoint-xs: 480px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}`,
      example: '<div style="padding: 10px; background: #f0f0f0; border-radius: 4px;"><div class="desktop-only" style="display: block;">桌面端显示</div><div class="mobile-only" style="display: none;">移动端显示</div></div>',
    },
    {
      id: 'responsive-text',
      title: '流式排版',
      description: '根据视口大小自动调整的响应式字体大小',
      code: `.responsive-text {
  font-size: clamp(1rem, 2.5vw, 2rem);
  line-height: 1.5;
}

/* 兼容不支持 clamp 的浏览器 */
@supports not (font-size: clamp(1rem, 2.5vw, 2rem)) {
  .responsive-text {
    font-size: 1rem;
  }
  @media (min-width: 320px) {
    .responsive-text {
      font-size: calc(1rem + 1.5vw);
    }
  }
  @media (min-width: 1200px) {
    .responsive-text {
      font-size: 2rem;
    }
  }
}

/* 不同尺寸的流式文字 */
.responsive-text-sm {
  font-size: clamp(0.875rem, 2vw, 1.125rem);
}

.responsive-text-lg {
  font-size: clamp(1.25rem, 3vw, 2.5rem);
}

.responsive-text-xl {
  font-size: clamp(1.5rem, 4vw, 3rem);
}`,
      example: '<div class="responsive-text" style="font-size: clamp(1rem, 2.5vw, 2rem); line-height: 1.5; text-align: center; padding: 20px; background: #f8f9fa; border-radius: 4px;">流式排版文字（调整窗口大小查看效果）</div>',
    },
    {
      id: 'responsive-img',
      title: '响应式图片',
      description: '图片自适应容器宽度，保持宽高比',
      code: `.responsive-img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* 完整响应式图片方案 */
.responsive-img-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.responsive-img-container::before {
  content: '';
  display: block;
  padding-top: 56.25%; /* 16:9 宽高比 */
}

.responsive-img-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* 不同宽高比 */
.responsive-img-4-3::before {
  padding-top: 75%; /* 4:3 */
}

.responsive-img-1-1::before {
  padding-top: 100%; /* 1:1 正方形 */
}

.responsive-img-21-9::before {
  padding-top: 42.857%; /* 21:9 */
}`,
      example: '<div style="max-width: 300px; margin: 0 auto;"><div class="responsive-img-container" style="position: relative; width: 100%; overflow: hidden; background: #e0e0e0; border-radius: 4px;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #666;">响应式图片容器</div></div></div>',
    },
    {
      id: 'grid-responsive',
      title: '网格响应式',
      description: '使用 Grid 创建完全响应式的网格布局',
      code: `.grid-responsive {
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: (minmax(min(300px, 100%), 1fr))[auto-fit];
  grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
  gap: 1rem;
}

/* 兼容不支持 min() 函数的浏览器 */
@supports not (grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr))) {
  .grid-responsive {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  @media (max-width: 300px) {
    .grid-responsive {
      grid-template-columns: 1fr;
    }
  }
}

/* 兼容不支持 Grid 的浏览器 */
@supports not (display: grid) {
  .grid-responsive {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-wrap: wrap;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
    margin: -0.5rem;
  }
  .grid-responsive > * {
    -webkit-box-flex: 1;
    -ms-flex: 1 1 300px;
    flex: 1 1 300px;
    margin: 0.5rem;
    min-width: 0;
  }
}`,
      example: '<div class="grid-responsive" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr)); gap: 10px;"><div style="padding: 15px; background: #667eea; color: white; border-radius: 4px; text-align: center;">项目1</div><div style="padding: 15px; background: #764ba2; color: white; border-radius: 4px; text-align: center;">项目2</div><div style="padding: 15px; background: #f093fb; color: white; border-radius: 4px; text-align: center;">项目3</div></div>',
    },
    {
      id: 'media-query',
      title: '媒体查询示例',
      description: '常用的响应式媒体查询断点和最佳实践',
      code: `/* 移动端优先（推荐） */
/* 默认样式适用于移动端 */

/* 平板及以上 */
@media (min-width: 768px) {
  .responsive-element {
    font-size: 16px;
    padding: 20px;
  }
}

/* 桌面端 */
@media (min-width: 1024px) {
  .responsive-element {
    font-size: 18px;
    padding: 30px;
  }
}

/* 大屏幕 */
@media (min-width: 1280px) {
  .responsive-element {
    font-size: 20px;
    padding: 40px;
  }
}

/* 桌面端优先（不推荐，但有时需要） */
/* 默认样式适用于桌面端 */

@media (max-width: 1024px) {
  .responsive-element {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .responsive-element {
    font-size: 14px;
  }
}

/* 横屏和竖屏 */
@media (orientation: landscape) {
  .landscape-only {
    display: block;
  }
}

@media (orientation: portrait) {
  .portrait-only {
    display: block;
  }
}

/* 高分辨率屏幕 */
@media (-webkit-min-device-pixel-ratio: 2),
       (min-resolution: 192dpi) {
  .high-dpi {
    /* 高分辨率屏幕优化 */
  }
}`,
    },
    {
      id: 'fluid-typography',
      title: '流体字体（Clamp）',
      description: '使用 clamp() 函数实现流畅的响应式字体大小',
      code: `.fluid-typography {
  font-size: clamp(14px, 2vw, 18px);
  line-height: 1.6;
}

/* 兼容不支持 clamp 的浏览器 */
@supports not (font-size: clamp(14px, 2vw, 18px)) {
  .fluid-typography {
    font-size: 14px;
  }
  @media (min-width: 320px) {
    .fluid-typography {
      font-size: calc(14px + 4 * (100vw - 320px) / 960);
    }
  }
  @media (min-width: 1280px) {
    .fluid-typography {
      font-size: 18px;
    }
  }
}

/* 不同尺寸的流体文字 */
.fluid-text-sm {
  font-size: clamp(0.75rem, 1.5vw, 1rem);
}

.fluid-text-base {
  font-size: clamp(1rem, 2vw, 1.25rem);
}

.fluid-text-lg {
  font-size: clamp(1.25rem, 3vw, 2rem);
}

.fluid-text-xl {
  font-size: clamp(1.5rem, 4vw, 3rem);
}`,
      example: '<div class="fluid-typography" style="font-size: clamp(14px, 2vw, 18px); line-height: 1.6; padding: 20px; background: #f8f9fa; border-radius: 4px; text-align: center;">流体字体（调整窗口大小查看效果）</div>',
    },
    {
      id: 'responsive-grid',
      title: '响应式网格系统',
      description: '类似 Bootstrap 的响应式网格系统',
      code: `.responsive-grid {
  display: -ms-grid;
  display: grid;
  -ms-grid-columns: 1fr;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* 平板：2列 */
@media (min-width: 768px) {
  .responsive-grid {
    -ms-grid-columns: 1fr 1fr;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面端：3列 */
@media (min-width: 1024px) {
  .responsive-grid {
    -ms-grid-columns: (1fr)[3];
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 大屏幕：4列 */
@media (min-width: 1280px) {
  .responsive-grid {
    -ms-grid-columns: (1fr)[4];
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 兼容旧浏览器 */
@supports not (display: grid) {
  .responsive-grid {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -ms-flex-wrap: wrap;
    -webkit-flex-wrap: wrap;
    flex-wrap: wrap;
    margin: -0.5rem;
  }
  .responsive-grid > * {
    -webkit-box-flex: 1;
    -ms-flex: 1 1 100%;
    flex: 1 1 100%;
    margin: 0.5rem;
  }
  @media (min-width: 768px) {
    .responsive-grid > * {
      -ms-flex: 1 1 calc(50% - 1rem);
      flex: 1 1 calc(50% - 1rem);
    }
  }
  @media (min-width: 1024px) {
    .responsive-grid > * {
      -ms-flex: 1 1 calc(33.333% - 1rem);
      flex: 1 1 calc(33.333% - 1rem);
    }
  }
}`,
      example: '<div class="responsive-grid" style="display: grid; grid-template-columns: 1fr; gap: 10px;"><div style="padding: 15px; background: #667eea; color: white; border-radius: 4px; text-align: center;">项目1</div><div style="padding: 15px; background: #764ba2; color: white; border-radius: 4px; text-align: center;">项目2</div><div style="padding: 15px; background: #f093fb; color: white; border-radius: 4px; text-align: center;">项目3</div></div>',
    },
    {
      id: 'responsive-table',
      title: '响应式表格',
      description: '小屏幕时表格变为卡片式布局',
      code: `.responsive-table {
  width: 100%;
  border-collapse: collapse;
}

.responsive-table th,
.responsive-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

/* 移动端：表格变为卡片 */
@media (max-width: 768px) {
  .responsive-table,
  .responsive-table thead,
  .responsive-table tbody,
  .responsive-table th,
  .responsive-table td,
  .responsive-table tr {
    display: block;
  }
  
  .responsive-table thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }
  
  .responsive-table tr {
    border: 1px solid #e0e0e0;
    margin-bottom: 10px;
    border-radius: 4px;
    padding: 10px;
  }
  
  .responsive-table td {
    border: none;
    position: relative;
    padding-left: 50%;
  }
  
  .responsive-table td:before {
    content: attr(data-label);
    position: absolute;
    left: 6px;
    width: 45%;
    font-weight: 600;
  }
}`,
    },
    {
      id: 'responsive-nav',
      title: '响应式导航',
      description: '移动端折叠菜单，桌面端横向导航',
      code: `.responsive-nav {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -ms-flex-pack: justify;
  -webkit-justify-content: space-between;
  justify-content: space-between;
  -webkit-box-align: center;
  -ms-flex-align: center;
  -webkit-align-items: center;
  align-items: center;
}

.responsive-nav-menu {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 20px;
}

.responsive-nav-toggle {
  display: none;
}

/* 移动端：显示菜单按钮，隐藏导航 */
@media (max-width: 768px) {
  .responsive-nav-toggle {
    display: block;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }
  
  .responsive-nav-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    -webkit-flex-direction: column;
    flex-direction: column;
    background: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
  }
  
  .responsive-nav-menu.active {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
  }
}`,
    },
    {
      id: 'container-queries',
      title: '容器查询（现代浏览器）',
      description: '基于容器大小而非视口大小的响应式设计',
      code: `.container-query {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
}

@container card (min-width: 600px) {
  .card-content {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 兼容不支持容器查询的浏览器 */
@supports not (container-type: inline-size) {
  .card-content {
    display: block;
  }
  @media (min-width: 600px) {
    .card-content {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }
  }
}`,
    },
  ],
  animation: [
    {
      id: 'fade-in',
      title: '淡入淡出',
      description: '元素淡入效果，兼容性好',
      code: `@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  opacity: 0;
  -webkit-animation: fadeIn 0.5s ease-in forwards;
  animation: fadeIn 0.5s ease-in forwards;
}

/* 淡出效果 */
@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.fade-out {
  -webkit-animation: fadeOut 0.5s ease-out forwards;
  animation: fadeOut 0.5s ease-out forwards;
}

/* 淡入淡出组合 */
.fade-in-out {
  -webkit-animation: fadeIn 0.5s ease-in forwards,
                      fadeOut 0.5s ease-out 2s forwards;
  animation: fadeIn 0.5s ease-in forwards,
             fadeOut 0.5s ease-out 2s forwards;
}`,
      example: '<div class="fade-in" style="opacity: 0; animation: fadeIn 0.5s ease-in forwards; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center; font-weight: 600;">淡入效果</div>',
    },
    {
      id: 'slide-in',
      title: '滑入效果',
      description: '从右侧滑入的动画效果，支持多个方向',
      code: `@keyframes slideIn {
  from {
    -webkit-transform: translateX(100%);
    transform: translateX(100%);
  }
  to {
    -webkit-transform: translateX(0);
    transform: translateX(0);
  }
}

.slide-in {
  -webkit-transform: translateX(100%);
  transform: translateX(100%);
  -webkit-animation: slideIn 0.3s ease-out forwards;
  animation: slideIn 0.3s ease-out forwards;
}

/* 从左侧滑入 */
@keyframes slideInLeft {
  from {
    -webkit-transform: translateX(-100%);
    transform: translateX(-100%);
  }
  to {
    -webkit-transform: translateX(0);
    transform: translateX(0);
  }
}

.slide-in-left {
  -webkit-transform: translateX(-100%);
  transform: translateX(-100%);
  -webkit-animation: slideInLeft 0.3s ease-out forwards;
  animation: slideInLeft 0.3s ease-out forwards;
}

/* 从上方滑入 */
@keyframes slideInTop {
  from {
    -webkit-transform: translateY(-100%);
    transform: translateY(-100%);
  }
  to {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
}

.slide-in-top {
  -webkit-transform: translateY(-100%);
  transform: translateY(-100%);
  -webkit-animation: slideInTop 0.3s ease-out forwards;
  animation: slideInTop 0.3s ease-out forwards;
}

/* 从下方滑入 */
@keyframes slideInBottom {
  from {
    -webkit-transform: translateY(100%);
    transform: translateY(100%);
  }
  to {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
}

.slide-in-bottom {
  -webkit-transform: translateY(100%);
  transform: translateY(100%);
  -webkit-animation: slideInBottom 0.3s ease-out forwards;
  animation: slideInBottom 0.3s ease-out forwards;
}`,
      example: '<div class="slide-in" style="transform: translateX(100%); animation: slideIn 0.3s ease-out forwards; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600;">从右侧滑入</div>',
    },
    {
      id: 'pulse',
      title: '脉冲动画',
      description: '持续的脉冲效果，常用于提示或加载状态',
      code: `@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.pulse {
  -webkit-animation: pulse 2s infinite;
  animation: pulse 2s infinite;
}

/* 缩放脉冲 */
@keyframes pulseScale {
  0%, 100% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
  50% {
    -webkit-transform: scale(1.05);
    transform: scale(1.05);
  }
}

.pulse-scale {
  -webkit-animation: pulseScale 2s ease-in-out infinite;
  animation: pulseScale 2s ease-in-out infinite;
}

/* 彩色脉冲 */
@keyframes pulseColor {
  0%, 100% {
    background-color: #667eea;
  }
  50% {
    background-color: #764ba2;
  }
}

.pulse-color {
  -webkit-animation: pulseColor 2s ease-in-out infinite;
  animation: pulseColor 2s ease-in-out infinite;
}`,
      example: '<div class="pulse" style="animation: pulse 2s infinite; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600;">脉冲动画</div>',
    },
    {
      id: 'loading',
      title: '加载动画',
      description: '经典的旋转加载动画，兼容性好',
      code: `.loading {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  -webkit-animation: spin 1s linear infinite;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

/* 多色加载动画 */
.loading-multi {
  width: 40px;
  height: 40px;
  border: 4px solid transparent;
  border-top: 4px solid #3498db;
  border-right: 4px solid #e74c3c;
  border-bottom: 4px solid #2ecc71;
  border-left: 4px solid #f39c12;
  border-radius: 50%;
  -webkit-animation: spin 1s linear infinite;
  animation: spin 1s linear infinite;
}

/* 点状加载动画 */
.loading-dots {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  gap: 8px;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  background: #3498db;
  border-radius: 50%;
  -webkit-animation: bounce 1.4s ease-in-out infinite both;
  animation: bounce 1.4s ease-in-out infinite both;
}

.loading-dots span:nth-child(1) {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  }
  40% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}`,
      example: '<div class="loading" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto;"></div>',
    },
    {
      id: 'bounce',
      title: '弹跳动画',
      description: '上下弹跳的动画效果，常用于按钮或提示',
      code: `@keyframes bounce {
  0% {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
  100% {
    -webkit-transform: translateY(-10px);
    transform: translateY(-10px);
  }
}

.bounce {
  -webkit-animation: bounce 0.6s ease-in-out infinite alternate;
  animation: bounce 0.6s ease-in-out infinite alternate;
}

/* 弹跳进入 */
@keyframes bounceIn {
  0% {
    -webkit-transform: scale(0.3);
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    -webkit-transform: scale(1.05);
    transform: scale(1.05);
  }
  70% {
    -webkit-transform: scale(0.9);
    transform: scale(0.9);
  }
  100% {
    -webkit-transform: scale(1);
    transform: scale(1);
    opacity: 1;
  }
}

.bounce-in {
  -webkit-animation: bounceIn 0.6s ease-out;
  animation: bounceIn 0.6s ease-out;
}

/* 弹跳退出 */
@keyframes bounceOut {
  0% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
  25% {
    -webkit-transform: scale(0.95);
    transform: scale(0.95);
  }
  50% {
    -webkit-transform: scale(1.02);
    transform: scale(1.02);
  }
  100% {
    -webkit-transform: scale(0.3);
    transform: scale(0.3);
    opacity: 0;
  }
}

.bounce-out {
  -webkit-animation: bounceOut 0.6s ease-in;
  animation: bounceOut 0.6s ease-in;
}`,
      example: '<div class="bounce" style="animation: bounce 0.6s ease-in-out infinite alternate; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600; width: 200px; margin: 0 auto;">弹跳动画</div>',
    },
    {
      id: 'slide-up',
      title: '向上滑动',
      description: '从下方滑入并淡入的动画效果',
      code: `@keyframes slideUp {
  from {
    -webkit-transform: translateY(20px);
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    -webkit-transform: translateY(0);
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  -webkit-animation: slideUp 0.5s ease-out;
  animation: slideUp 0.5s ease-out;
}

/* 向下滑动 */
@keyframes slideDown {
  from {
    -webkit-transform: translateY(-20px);
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    -webkit-transform: translateY(0);
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-down {
  -webkit-animation: slideDown 0.5s ease-out;
  animation: slideDown 0.5s ease-out;
}`,
      example: '<div class="slide-up" style="animation: slideUp 0.5s ease-out; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center; font-weight: 600;">向上滑动</div>',
    },
    {
      id: 'rotate',
      title: '旋转动画',
      description: '持续旋转效果，常用于加载图标',
      code: `@keyframes rotate {
  from {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  to {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

.rotate {
  -webkit-animation: rotate 2s linear infinite;
  animation: rotate 2s linear infinite;
}

/* 反向旋转 */
.rotate-reverse {
  -webkit-animation: rotate 2s linear infinite reverse;
  animation: rotate 2s linear infinite reverse;
}

/* 旋转并缩放 */
@keyframes rotateScale {
  0% {
    -webkit-transform: rotate(0deg) scale(1);
    transform: rotate(0deg) scale(1);
  }
  50% {
    -webkit-transform: rotate(180deg) scale(1.2);
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    -webkit-transform: rotate(360deg) scale(1);
    transform: rotate(360deg) scale(1);
  }
}

.rotate-scale {
  -webkit-animation: rotateScale 2s ease-in-out infinite;
  animation: rotateScale 2s ease-in-out infinite;
}`,
      example: '<div class="rotate" style="animation: rotate 2s linear infinite; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; margin: 20px auto;"></div>',
    },
    {
      id: 'shake',
      title: '震动动画',
      description: '左右震动的动画效果，常用于错误提示',
      code: `@keyframes shake {
  0%, 100% {
    -webkit-transform: translateX(0);
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    -webkit-transform: translateX(-10px);
    transform: translateX(-10px);
  }
  20%, 40%, 60%, 80% {
    -webkit-transform: translateX(10px);
    transform: translateX(10px);
  }
}

.shake {
  -webkit-animation: shake 0.5s ease-in-out;
  animation: shake 0.5s ease-in-out;
}

/* 上下震动 */
@keyframes shakeVertical {
  0%, 100% {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
  25%, 75% {
    -webkit-transform: translateY(-5px);
    transform: translateY(-5px);
  }
  50% {
    -webkit-transform: translateY(5px);
    transform: translateY(5px);
  }
}

.shake-vertical {
  -webkit-animation: shakeVertical 0.5s ease-in-out;
  animation: shakeVertical 0.5s ease-in-out;
}`,
      example: '<div class="shake" style="animation: shake 0.5s ease-in-out; padding: 20px; background: #ef4444; color: white; border-radius: 8px; text-align: center; font-weight: 600; width: 200px; margin: 0 auto;">震动效果</div>',
    },
    {
      id: 'zoom',
      title: '缩放动画',
      description: '放大缩小的动画效果',
      code: `@keyframes zoomIn {
  from {
    -webkit-transform: scale(0);
    transform: scale(0);
    opacity: 0;
  }
  to {
    -webkit-transform: scale(1);
    transform: scale(1);
    opacity: 1;
  }
}

.zoom-in {
  -webkit-animation: zoomIn 0.3s ease-out;
  animation: zoomIn 0.3s ease-out;
}

@keyframes zoomOut {
  from {
    -webkit-transform: scale(1);
    transform: scale(1);
    opacity: 1;
  }
  to {
    -webkit-transform: scale(0);
    transform: scale(0);
    opacity: 0;
  }
}

.zoom-out {
  -webkit-animation: zoomOut 0.3s ease-in;
  animation: zoomOut 0.3s ease-in;
}

/* 悬停缩放 */
.zoom-hover {
  -webkit-transition: -webkit-transform 0.3s ease;
  transition: transform 0.3s ease;
}

.zoom-hover:hover {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}`,
      example: '<div class="zoom-in" style="animation: zoomIn 0.3s ease-out; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600;">缩放进入</div>',
    },
    {
      id: 'flip',
      title: '翻转动画',
      description: '3D 翻转效果，常用于卡片翻转',
      code: `@keyframes flip {
  from {
    -webkit-transform: perspective(400px) rotateY(0);
    transform: perspective(400px) rotateY(0);
  }
  to {
    -webkit-transform: perspective(400px) rotateY(180deg);
    transform: perspective(400px) rotateY(180deg);
  }
}

.flip {
  -webkit-animation: flip 0.6s ease-in-out;
  animation: flip 0.6s ease-in-out;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* 水平翻转 */
@keyframes flipHorizontal {
  from {
    -webkit-transform: perspective(400px) rotateX(0);
    transform: perspective(400px) rotateX(0);
  }
  to {
    -webkit-transform: perspective(400px) rotateX(180deg);
    transform: perspective(400px) rotateX(180deg);
  }
}

.flip-horizontal {
  -webkit-animation: flipHorizontal 0.6s ease-in-out;
  animation: flipHorizontal 0.6s ease-in-out;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* 翻转进入 */
@keyframes flipIn {
  from {
    -webkit-transform: perspective(400px) rotateY(-90deg);
    transform: perspective(400px) rotateY(-90deg);
    opacity: 0;
  }
  to {
    -webkit-transform: perspective(400px) rotateY(0);
    transform: perspective(400px) rotateY(0);
    opacity: 1;
  }
}

.flip-in {
  -webkit-animation: flipIn 0.6s ease-out;
  animation: flipIn 0.6s ease-out;
}`,
    },
    {
      id: 'wiggle',
      title: '摆动动画',
      description: '左右摆动的动画效果',
      code: `@keyframes wiggle {
  0%, 100% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  25% {
    -webkit-transform: rotate(5deg);
    transform: rotate(5deg);
  }
  75% {
    -webkit-transform: rotate(-5deg);
    transform: rotate(-5deg);
  }
}

.wiggle {
  -webkit-animation: wiggle 0.5s ease-in-out infinite;
  animation: wiggle 0.5s ease-in-out infinite;
}

/* 摆动一次 */
.wiggle-once {
  -webkit-animation: wiggle 0.5s ease-in-out;
  animation: wiggle 0.5s ease-in-out;
}`,
      example: '<div class="wiggle" style="animation: wiggle 0.5s ease-in-out infinite; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600; width: 200px; margin: 0 auto;">摆动动画</div>',
    },
    {
      id: 'gradient-animation',
      title: '渐变动画',
      description: '背景渐变颜色流动的动画效果',
      code: `@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.gradient-animation {
  background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
  background-size: 400% 400%;
  -webkit-animation: gradientShift 3s ease infinite;
  animation: gradientShift 3s ease infinite;
}

/* 文字渐变动画 */
.gradient-text-animation {
  background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe);
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  -webkit-animation: gradientShift 3s ease infinite;
  animation: gradientShift 3s ease infinite;
}`,
      example: '<div class="gradient-animation" style="background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe); background-size: 400% 400%; animation: gradientShift 3s ease infinite; padding: 20px; border-radius: 8px; text-align: center; color: white; font-weight: 600;">渐变动画</div>',
    },
  ],
  interaction: [
    {
      id: 'btn-hover',
      title: '按钮悬停效果',
      description: '按钮悬停时的光泽扫过效果，提升交互体验',
      code: `.btn-hover {
  position: relative;
  overflow: hidden;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.2), 
    transparent);
  -webkit-transition: left 0.5s;
  transition: left 0.5s;
}

.btn-hover:hover::before {
  left: 100%;
}

.btn-hover:hover {
  -webkit-transform: translateY(-2px);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-hover:active {
  -webkit-transform: translateY(0);
  transform: translateY(0);
}`,
      example: '<style>.btn-hover-example { position: relative; overflow: hidden; transition: all 0.3s ease; background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; } .btn-hover-example::before { content: \'\'; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent); transition: left 0.5s; } .btn-hover-example:hover::before { left: 100%; } .btn-hover-example:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }</style><button class="btn-hover-example">悬停查看效果</button>',
    },
    {
      id: 'text-hover',
      title: '文字悬停效果',
      description: '文字悬停时显示下划线动画效果',
      code: `.text-hover {
  position: relative;
  display: inline-block;
  text-decoration: none;
  color: #333;
  cursor: pointer;
}

.text-hover::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  -webkit-transition: width 0.3s ease;
  transition: width 0.3s ease;
}

.text-hover:hover::after {
  width: 100%;
}

/* 从中心展开的下划线 */
.text-hover-center::after {
  left: 50%;
  -webkit-transform: translateX(-50%);
  transform: translateX(-50%);
}

.text-hover-center:hover::after {
  width: 100%;
  left: 0;
  -webkit-transform: translateX(0);
  transform: translateX(0);
}

/* 双下划线效果 */
.text-hover-double::after {
  height: 1px;
  bottom: -4px;
}

.text-hover-double::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: currentColor;
  -webkit-transition: width 0.3s ease 0.15s;
  transition: width 0.3s ease 0.15s;
}

.text-hover-double:hover::before {
  width: 100%;
}`,
      example: '<a class="text-hover" style="position: relative; display: inline-block; text-decoration: none; color: #667eea; cursor: pointer; font-weight: 600; font-size: 18px;">悬停查看下划线效果</a>',
    },
    {
      id: 'focus-style',
      title: '焦点样式',
      description: '自定义输入框和按钮的焦点样式，提升可访问性',
      code: `.focus-style {
  outline: none;
  border: 2px solid transparent;
  -webkit-transition: border-color 0.2s ease, box-shadow 0.2s ease;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  padding: 10px;
  border-radius: 4px;
}

.focus-style:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

/* 更明显的焦点样式 */
.focus-style-strong:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.3),
              inset 0 0 0 1px rgba(52, 152, 219, 0.1);
}

/* 彩色焦点样式 */
.focus-style-primary:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.focus-style-success:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}

.focus-style-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

/* 移除默认焦点样式（不推荐，除非有替代方案） */
.focus-style-no-outline:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}`,
      example: '<input class="focus-style" type="text" placeholder="点击查看焦点效果" style="outline: none; border: 2px solid #e0e0e0; transition: border-color 0.2s ease, box-shadow 0.2s ease; padding: 10px; border-radius: 4px; width: 200px;" />',
    },
    {
      id: 'disabled',
      title: '禁用状态',
      description: '禁用元素的样式，防止交互',
      code: `.disabled {
  opacity: 0.6;
  pointer-events: none;
  cursor: not-allowed;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 按钮禁用状态 */
.btn-disabled,
.btn-disabled:hover,
.btn-disabled:active {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
  background: #e0e0e0;
  color: #999;
}

/* 输入框禁用状态 */
.input-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
  border-color: #e0e0e0;
}

.input-disabled:focus {
  border-color: #e0e0e0;
  box-shadow: none;
}

/* 使用属性选择器 */
[disabled],
[aria-disabled="true"] {
  opacity: 0.6;
  pointer-events: none;
  cursor: not-allowed;
}

/* 禁用状态的视觉提示 */
.disabled-with-text::after {
  content: '（已禁用）';
  font-size: 0.875em;
  color: #999;
  margin-left: 4px;
}`,
      example: '<button class="disabled" style="opacity: 0.6; pointer-events: none; cursor: not-allowed; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; font-weight: 600;">禁用按钮</button>',
    },
    {
      id: 'hover-lift',
      title: '悬停提升',
      description: '鼠标悬停时元素上浮效果，增强交互感',
      code: `.hover-lift {
  -webkit-transition: -webkit-transform 0.3s ease, 
                      box-shadow 0.3s ease;
  transition: transform 0.3s ease, 
              box-shadow 0.3s ease;
}

.hover-lift:hover {
  -webkit-transform: translateY(-5px);
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* 提升并缩放 */
.hover-lift-scale:hover {
  -webkit-transform: translateY(-5px) scale(1.05);
  transform: translateY(-5px) scale(1.05);
}

/* 提升并旋转 */
.hover-lift-rotate:hover {
  -webkit-transform: translateY(-5px) rotate(2deg);
  transform: translateY(-5px) rotate(2deg);
}`,
      example: '<div class="hover-lift" style="transition: transform 0.3s ease, box-shadow 0.3s ease; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600; cursor: pointer;">悬停查看提升效果</div>',
    },
    {
      id: 'button-ripple',
      title: '按钮涟漪效果',
      description: '点击时的涟漪扩散效果，Material Design 风格',
      code: `.button-ripple {
  position: relative;
  overflow: hidden;
  background: #667eea;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
}

.button-ripple::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  -webkit-transition: width 0.6s, height 0.6s;
  transition: width 0.6s, height 0.6s;
}

.button-ripple:active::after {
  width: 300px;
  height: 300px;
}

/* 彩色涟漪 */
.button-ripple-colored::after {
  background: rgba(102, 126, 234, 0.3);
}

/* 使用 JavaScript 实现点击位置涟漪 */
.button-ripple-js {
  position: relative;
  overflow: hidden;
}

.button-ripple-js .ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  -webkit-transform: scale(0);
  transform: scale(0);
  -webkit-animation: ripple-animation 0.6s ease-out;
  animation: ripple-animation 0.6s ease-out;
}

@keyframes ripple-animation {
  to {
    -webkit-transform: scale(4);
    transform: scale(4);
    opacity: 0;
  }
}`,
      example: '<button class="button-ripple" style="position: relative; overflow: hidden; background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600;">点击查看涟漪效果</button>',
    },
    {
      id: 'focus-ring',
      title: '焦点环',
      description: '键盘导航时的焦点指示，提升可访问性',
      code: `.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

/* 更明显的焦点环 */
.focus-ring-strong:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.4),
              0 0 0 6px rgba(102, 126, 234, 0.2);
}

/* 仅键盘导航时显示焦点环 */
.focus-ring-keyboard:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

.focus-ring-keyboard:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

/* 兼容不支持 :focus-visible 的浏览器 */
@supports not selector(:focus-visible) {
  .focus-ring-keyboard:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
  }
}

/* 虚线焦点环 */
.focus-ring-dashed:focus {
  outline: 2px dashed #667eea;
  outline-offset: 2px;
}`,
      example: '<button class="focus-ring" style="outline: none; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">点击或Tab键查看焦点环</button>',
    },
    {
      id: 'active-state',
      title: '激活状态',
      description: '元素被点击或激活时的视觉反馈',
      code: `.active-state {
  -webkit-transition: all 0.2s ease;
  transition: all 0.2s ease;
}

.active-state:active {
  -webkit-transform: scale(0.95);
  transform: scale(0.95);
  opacity: 0.8;
}

/* 按下效果 */
.press-effect:active {
  -webkit-transform: translateY(2px);
  transform: translateY(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 激活时改变颜色 */
.active-color:active {
  background: #5568d3;
  color: white;
}

/* 切换状态 */
.toggle-state {
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}

.toggle-state.active {
  background: #10b981;
  color: white;
}

.toggle-state:not(.active) {
  background: #e0e0e0;
  color: #666;
}`,
      example: '<button class="active-state" style="transition: all 0.2s ease; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">点击查看激活效果</button>',
    },
    {
      id: 'hover-scale',
      title: '悬停缩放',
      description: '鼠标悬停时元素放大效果',
      code: `.hover-scale {
  -webkit-transition: -webkit-transform 0.3s ease;
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}

/* 缩放并旋转 */
.hover-scale-rotate:hover {
  -webkit-transform: scale(1.1) rotate(5deg);
  transform: scale(1.1) rotate(5deg);
}

/* 仅X轴缩放 */
.hover-scale-x:hover {
  -webkit-transform: scaleX(1.1);
  transform: scaleX(1.1);
}

/* 仅Y轴缩放 */
.hover-scale-y:hover {
  -webkit-transform: scaleY(1.1);
  transform: scaleY(1.1);
}`,
      example: '<div class="hover-scale" style="transition: transform 0.3s ease; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600; cursor: pointer; width: 200px; margin: 0 auto;">悬停查看缩放效果</div>',
    },
    {
      id: 'hover-glow',
      title: '悬停发光',
      description: '鼠标悬停时元素周围发光效果',
      code: `.hover-glow {
  -webkit-transition: box-shadow 0.3s ease;
  transition: box-shadow 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6),
              0 0 40px rgba(102, 126, 234, 0.4),
              0 0 60px rgba(102, 126, 234, 0.2);
}

/* 彩色发光 */
.hover-glow-primary:hover {
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
}

.hover-glow-success:hover {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
}

.hover-glow-error:hover {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
}

/* 内发光 */
.hover-glow-inset:hover {
  box-shadow: inset 0 0 20px rgba(102, 126, 234, 0.3);
}`,
      example: '<div class="hover-glow" style="transition: box-shadow 0.3s ease; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600; cursor: pointer;">悬停查看发光效果</div>',
    },
    {
      id: 'hover-color',
      title: '悬停颜色变化',
      description: '鼠标悬停时背景或文字颜色变化',
      code: `.hover-color {
  -webkit-transition: background-color 0.3s ease,
                      color 0.3s ease;
  transition: background-color 0.3s ease,
              color 0.3s ease;
  background: #667eea;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
}

.hover-color:hover {
  background: #5568d3;
  color: #ffffff;
}

/* 文字颜色变化 */
.hover-text-color {
  -webkit-transition: color 0.3s ease;
  transition: color 0.3s ease;
  color: #333;
}

.hover-text-color:hover {
  color: #667eea;
}

/* 边框颜色变化 */
.hover-border-color {
  -webkit-transition: border-color 0.3s ease;
  transition: border-color 0.3s ease;
  border: 2px solid #e0e0e0;
  padding: 12px 24px;
  border-radius: 6px;
}

.hover-border-color:hover {
  border-color: #667eea;
}`,
      example: '<button class="hover-color" style="transition: background-color 0.3s ease, color 0.3s ease; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; cursor: pointer; border: none; font-weight: 600;">悬停查看颜色变化</button>',
    },
    {
      id: 'loading-button',
      title: '加载按钮',
      description: '按钮加载状态的视觉反馈',
      code: `.loading-button {
  position: relative;
  pointer-events: none;
  opacity: 0.7;
}

.loading-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  -webkit-animation: spin 0.8s linear infinite;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

/* 按钮文字隐藏，只显示加载动画 */
.loading-button-text-hidden {
  color: transparent;
}

.loading-button-text-hidden::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  -webkit-animation: spin 0.8s linear infinite;
  animation: spin 0.8s linear infinite;
}`,
      example: '<button class="loading-button" style="position: relative; pointer-events: none; opacity: 0.7; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; font-weight: 600;">加载中...</button>',
    },
  ],
  utilities: [
    {
      id: 'clearfix',
      title: '清除浮动',
      description: '清除浮动影响的经典方法，兼容性好',
      code: `.clearfix::after {
  content: '';
  display: table;
  clear: both;
}

/* 现代浏览器也可以使用 */
.clearfix {
  display: flow-root;
}

/* 兼容旧浏览器 */
@supports not (display: flow-root) {
  .clearfix::after {
    content: '';
    display: table;
    clear: both;
  }
}

/* 使用 Flexbox 清除浮动 */
.clearfix-flex {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  -webkit-flex-direction: column;
  flex-direction: column;
}`,
      example: '<div class="clearfix" style="border: 1px solid #ddd; padding: 10px;"><div style="float: left; width: 100px; height: 50px; background: #667eea; margin-right: 10px;"></div><div style="float: right; width: 100px; height: 50px; background: #764ba2;"></div><div class="clearfix" style="content: \'\'; display: table; clear: both;"></div><div style="background: #f0f0f0; padding: 10px; margin-top: 10px;">清除浮动后的内容</div></div>',
    },
    {
      id: 'text-ellipsis',
      title: '文本截断',
      description: '单行文本超出显示省略号，兼容性好',
      code: `.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 兼容旧浏览器 */
.text-ellipsis-old {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  -o-text-overflow: ellipsis; /* Opera */
  -ms-text-overflow: ellipsis; /* IE */
}

/* 指定最大宽度 */
.text-ellipsis-max {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}`,
      example: '<div class="text-ellipsis" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; padding: 10px; background: #f0f0f0; border-radius: 4px;">这是一段很长的文本，超出部分会被截断并显示省略号</div>',
    },
    {
      id: 'text-multiline-ellipsis',
      title: '多行文本截断',
      description: '多行文本超出显示省略号，支持自定义行数',
      code: `.text-multiline-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 兼容不支持 -webkit-line-clamp 的浏览器 */
@supports not (-webkit-line-clamp: 3) {
  .text-multiline-ellipsis {
    max-height: 4.5em; /* 3行 × 1.5行高 */
    overflow: hidden;
    position: relative;
  }
  .text-multiline-ellipsis::after {
    content: '...';
    position: absolute;
    right: 0;
    bottom: 0;
    background: white;
    padding-left: 4px;
  }
}

/* 不同行数 */
.text-ellipsis-2 {
  -webkit-line-clamp: 2;
}

.text-ellipsis-4 {
  -webkit-line-clamp: 4;
}

.text-ellipsis-5 {
  -webkit-line-clamp: 5;
}`,
      example: '<div class="text-multiline-ellipsis" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; max-width: 300px; padding: 10px; background: #f0f0f0; border-radius: 4px; line-height: 1.5;">这是一段很长的文本内容，当文本超过三行时，会自动截断并在末尾显示省略号。这样可以保持布局的整洁和美观。</div>',
    },
    {
      id: 'sr-only',
      title: '隐藏元素但保持可访问性',
      description: '仅对屏幕阅读器可见，视觉上完全隐藏，提升可访问性',
      code: `.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 现代浏览器使用 clip-path */
.sr-only-modern {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* 聚焦时显示（用于跳过链接） */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}`,
    },
    {
      id: 'inline-block-center',
      title: '显示为块级但居中',
      description: 'inline-block 元素水平居中',
      code: `.inline-block-center {
  display: inline-block;
  margin: 0 auto;
}

/* 注意：inline-block 元素需要父元素 text-align: center */
.inline-block-center-wrapper {
  text-align: center;
}

.inline-block-center-wrapper .inline-block-center {
  display: inline-block;
  margin: 0;
  text-align: left; /* 重置内部文本对齐 */
}

/* 使用 Flexbox 居中 inline-block */
.flex-center-inline {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
}

.flex-center-inline > * {
  display: inline-block;
}`,
      example: '<div class="inline-block-center-wrapper" style="text-align: center; padding: 20px; background: #f0f0f0; border-radius: 4px;"><div class="inline-block-center" style="display: inline-block; margin: 0; text-align: left; padding: 10px; background: #667eea; color: white; border-radius: 4px;">居中显示的 inline-block 元素</div></div>',
    },
    {
      id: 'fullscreen-bg',
      title: '全屏背景',
      description: '固定定位的全屏背景图片或元素',
      code: `.fullscreen-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

/* 背景图片版本 */
.fullscreen-bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('your-image.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

/* 带遮罩的全屏背景 */
.fullscreen-bg-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

/* 渐变全屏背景 */
.fullscreen-bg-gradient {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: -1;
}

/* 兼容移动端 */
@media (max-width: 768px) {
  .fullscreen-bg {
    position: absolute;
    height: 100vh;
    min-height: 100%;
  }
}`,
      example: '<div class="fullscreen-bg-gradient" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); z-index: -1; pointer-events: none;"></div><div style="position: relative; z-index: 1; padding: 20px; background: rgba(255, 255, 255, 0.9); border-radius: 8px; margin: 20px;">全屏背景示例</div>',
    },
    {
      id: 'fixed-center',
      title: '固定定位居中',
      description: '使用固定定位实现元素在视口中居中',
      code: `.fixed-center {
  position: fixed;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  z-index: 1000;
}

/* 兼容不支持 transform 的浏览器 */
@supports not (transform: translate(-50%, -50%)) {
  .fixed-center {
    position: fixed;
    top: 50%;
    left: 50%;
    margin-top: -100px; /* 需要知道元素高度的一半 */
    margin-left: -150px; /* 需要知道元素宽度的一半 */
    z-index: 1000;
  }
}

/* 固定定位居中（已知尺寸） */
.fixed-center-known {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 200px;
  margin-top: -100px; /* 高度的一半 */
  margin-left: -150px; /* 宽度的一半 */
  z-index: 1000;
}

/* 使用 Flexbox 的固定居中 */
.fixed-center-flex {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  -webkit-align-items: center;
  align-items: center;
  z-index: 1000;
}`,
      example: '<div class="fixed-center" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; padding: 20px; background: rgba(102, 126, 234, 0.95); color: white; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">固定居中元素</div>',
    },
    {
      id: 'visually-hidden',
      title: '视觉隐藏但保持布局',
      description: '元素不可见但占据空间，用于占位',
      code: `.visually-hidden {
  visibility: hidden;
}

/* 完全隐藏且不占空间 */
.visually-hidden-no-space {
  display: none;
}

/* 透明但保持交互 */
.visually-hidden-transparent {
  opacity: 0;
  pointer-events: none;
}

/* 隐藏但保持可访问性（推荐） */
.visually-hidden-accessible {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}`,
    },
    {
      id: 'aspect-ratio',
      title: '宽高比锁定',
      description: '保持元素的宽高比，响应式设计常用',
      code: `.aspect-ratio {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
}

.aspect-ratio > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 使用现代 aspect-ratio 属性 */
.aspect-ratio-modern {
  aspect-ratio: 16 / 9;
  width: 100%;
}

/* 兼容不支持 aspect-ratio 的浏览器 */
@supports not (aspect-ratio: 16 / 9) {
  .aspect-ratio-modern {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%;
  }
  .aspect-ratio-modern > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

/* 不同宽高比 */
.aspect-ratio-1-1 {
  padding-bottom: 100%; /* 1:1 正方形 */
}

.aspect-ratio-4-3 {
  padding-bottom: 75%; /* 4:3 */
}

.aspect-ratio-21-9 {
  padding-bottom: 42.857%; /* 21:9 */
}`,
      example: '<div class="aspect-ratio" style="position: relative; width: 100%; padding-bottom: 56.25%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-weight: 600;">16:9 宽高比</div></div>',
    },
    {
      id: 'scroll-smooth',
      title: '平滑滚动',
      description: '页面内锚点跳转时平滑滚动',
      code: `/* 全局平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 兼容不支持 scroll-behavior 的浏览器 */
@supports not (scroll-behavior: smooth) {
  html {
    scroll-behavior: auto;
  }
  /* 需要使用 JavaScript 实现平滑滚动 */
}

/* 特定元素平滑滚动 */
.scroll-smooth {
  scroll-behavior: smooth;
  overflow-y: auto;
}

/* 滚动条样式 */
.scrollbar-custom {
  scrollbar-width: thin;
  scrollbar-color: #667eea #f0f0f0;
}

.scrollbar-custom::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar-custom::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.scrollbar-custom::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 4px;
}

.scrollbar-custom::-webkit-scrollbar-thumb:hover {
  background: #5568d3;
}`,
    },
    {
      id: 'truncate',
      title: '文本截断工具类',
      description: '快速应用文本截断的工具类集合',
      code: `/* 单行截断 */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 多行截断 */
.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.truncate-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.truncate-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}`,
      example: '<div class="truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 300px; padding: 10px; background: #f0f0f0; border-radius: 4px; line-height: 1.5;">这是一段很长的文本内容，当文本超过两行时，会自动截断并在末尾显示省略号。这样可以保持布局的整洁。</div>',
    },
    {
      id: 'no-select',
      title: '禁止选择文本',
      description: '禁止用户选择元素内的文本',
      code: `.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none; /* iOS Safari */
}

/* 允许选择 */
.select-all {
  -webkit-user-select: all;
  -moz-user-select: all;
  -ms-user-select: all;
  user-select: all;
}

/* 仅选择文本 */
.select-text {
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}`,
      example: '<div class="no-select" style="-webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; padding: 20px; background: #667eea; color: white; border-radius: 8px; text-align: center; font-weight: 600; cursor: pointer;">无法选择此文本</div>',
    },
    {
      id: 'pointer-events',
      title: '指针事件控制',
      description: '控制元素的鼠标事件响应',
      code: `/* 禁用所有指针事件 */
.pointer-events-none {
  pointer-events: none;
}

/* 允许指针事件 */
.pointer-events-auto {
  pointer-events: auto;
}

/* 仅允许点击 */
.pointer-events-click {
  pointer-events: auto;
  cursor: pointer;
}

/* 禁用但保持可见 */
.disabled-visible {
  pointer-events: none;
  opacity: 0.6;
  cursor: not-allowed;
}`,
    },
    {
      id: 'overflow-hidden',
      title: '溢出隐藏',
      description: '控制元素内容的溢出行为',
      code: `/* 隐藏溢出内容 */
.overflow-hidden {
  overflow: hidden;
}

/* 水平隐藏 */
.overflow-x-hidden {
  overflow-x: hidden;
}

/* 垂直隐藏 */
.overflow-y-hidden {
  overflow-y: hidden;
}

/* 显示滚动条 */
.overflow-auto {
  overflow: auto;
}

.overflow-scroll {
  overflow: scroll;
}

/* 仅在需要时显示滚动条 */
.overflow-x-auto {
  overflow-x: auto;
}

.overflow-y-auto {
  overflow-y: auto;
}`,
    },
  ],
  mobile: [
    {
      id: 'touch-optimized',
      title: '移动端触摸优化',
      description: '优化移动端触摸体验，去除点击高亮，提升交互流畅度',
      code: `.touch-optimized {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none; /* 禁用长按菜单 */
}

/* 全局触摸优化 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* 允许平移和缩放 */
.touch-pan {
  touch-action: pan-x pan-y;
}

/* 仅允许垂直滚动 */
.touch-pan-y {
  touch-action: pan-y;
}

/* 仅允许水平滚动 */
.touch-pan-x {
  touch-action: pan-x;
}

/* 禁用所有触摸手势 */
.touch-none {
  touch-action: none;
}`,
      example: '<button class="touch-optimized" style="touch-action: manipulation; -webkit-tap-highlight-color: transparent; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">触摸优化按钮</button>',
    },
    {
      id: 'safe-area',
      title: '安全区域适配',
      description: '适配 iPhone 等设备的刘海屏和安全区域',
      code: `.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 仅顶部安全区域 */
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

/* 仅底部安全区域 */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 使用 constant() 兼容旧版本 iOS */
.safe-area-compat {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: constant(safe-area-inset-left);
  padding-left: env(safe-area-inset-left);
  padding-right: constant(safe-area-inset-right);
  padding-right: env(safe-area-inset-right);
}

/* 固定定位元素的安全区域 */
.fixed-safe-area {
  position: fixed;
  top: env(safe-area-inset-top);
  bottom: env(safe-area-inset-bottom);
  left: env(safe-area-inset-left);
  right: env(safe-area-inset-right);
}

/* 视口高度考虑安全区域 */
.height-safe-area {
  height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}`,
    },
    {
      id: 'smooth-scroll',
      title: '移动端滚动优化',
      description: '优化移动端滚动体验，使用硬件加速',
      code: `.smooth-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  overflow-y: auto;
}

/* 兼容不支持 scroll-behavior 的浏览器 */
@supports not (scroll-behavior: smooth) {
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
  }
}

/* 弹性滚动 */
.elastic-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 防止滚动链 */
.no-scroll-chain {
  overscroll-behavior: none;
}

/* 仅在需要时显示滚动条 */
.scroll-auto {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
  -webkit-scrollbar-width: thin;
  scrollbar-width: thin;
}`,
    },
    {
      id: 'no-zoom',
      title: '防止缩放',
      description: '防止移动端文本自动缩放，保持设计一致性',
      code: `.no-zoom {
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* 全局防止缩放 */
html {
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* 允许缩放（如果需要） */
.allow-zoom {
  -webkit-text-size-adjust: auto;
  -ms-text-size-adjust: auto;
  text-size-adjust: auto;
}

/* 在 HTML head 中添加 viewport meta 标签 */
/* <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"> */
/* 注意：完全禁用缩放会影响可访问性，建议谨慎使用 */`,
    },
    {
      id: 'mobile-viewport',
      title: '移动端视口',
      description: '移动端视口设置，防止缩放',
      code: `/* 在 HTML head 中添加 */
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

/* 推荐设置（允许缩放，提升可访问性） */
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">

/* 使用 CSS 控制（部分浏览器支持） */
@viewport {
  width: device-width;
  initial-scale: 1.0;
  maximum-scale: 1.0;
  user-zoom: fixed;
}

/* 兼容旧浏览器 */
@media screen and (max-width: 768px) {
  html {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
}`,
    },
    {
      id: 'mobile-input',
      title: '移动端输入框优化',
      description: '优化移动端输入框体验，防止自动缩放',
      code: `/* 防止 iOS Safari 自动缩放输入框 */
input[type="text"],
input[type="email"],
input[type="number"],
input[type="tel"],
input[type="url"],
input[type="search"],
textarea,
select {
  font-size: 16px; /* iOS 不会缩放 16px 及以上的输入框 */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 0; /* iOS Safari 默认圆角 */
}

/* 移除 iOS 输入框内阴影 */
input,
textarea {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  box-shadow: none;
}

/* 移除 iOS 按钮样式 */
button,
input[type="button"],
input[type="submit"],
input[type="reset"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 0;
}`,
    },
    {
      id: 'mobile-pull-refresh',
      title: '下拉刷新指示',
      description: '移动端下拉刷新的视觉指示',
      code: `/* 下拉刷新容器 */
.pull-refresh-container {
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 刷新指示器 */
.pull-refresh-indicator {
  position: absolute;
  top: -50px;
  left: 50%;
  -webkit-transform: translateX(-50%);
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  border: 3px solid #667eea;
  border-top-color: transparent;
  border-radius: 50%;
  -webkit-animation: spin 1s linear infinite;
  animation: spin 1s linear infinite;
  opacity: 0;
  -webkit-transition: opacity 0.3s;
  transition: opacity 0.3s;
}

.pull-refresh-container.pulling .pull-refresh-indicator {
  opacity: 1;
}

@keyframes spin {
  to {
    -webkit-transform: translateX(-50%) rotate(360deg);
    transform: translateX(-50%) rotate(360deg);
  }
}`,
    },
  ],
  form: [
    {
      id: 'custom-checkbox',
      title: '自定义复选框',
      description: '完全自定义的复选框样式，兼容性好',
      code: `.custom-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
}

.custom-checkbox input {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}

.custom-checkbox input + span {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  background: white;
  position: relative;
}

.custom-checkbox input:checked + span {
  background: #3498db;
  border-color: #3498db;
}

.custom-checkbox input:checked + span::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.custom-checkbox input:focus + span {
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.custom-checkbox input:disabled + span {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}`,
      example: '<label class="custom-checkbox" style="position: relative; display: inline-block; width: 20px; height: 20px;"><input type="checkbox" style="opacity: 0; position: absolute; width: 0; height: 0;" checked /><span style="display: inline-block; width: 20px; height: 20px; border: 2px solid #3498db; border-radius: 3px; background: #3498db; position: relative;"><span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 14px; font-weight: bold;">✓</span></span></label>',
    },
    {
      id: 'input-focus',
      title: '输入框焦点效果',
      description: '自定义输入框焦点时的样式，提升用户体验',
      code: `.input-focus {
  border: 2px solid #ddd;
  -webkit-transition: border-color 0.3s ease, box-shadow 0.3s ease;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  padding: 10px;
  border-radius: 4px;
  outline: none;
}

.input-focus:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* 不同状态的焦点样式 */
.input-focus-success:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.input-focus-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-focus-warning:focus {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

/* 仅键盘导航时显示焦点 */
.input-focus-keyboard:focus:not(:focus-visible) {
  border-color: #ddd;
  box-shadow: none;
}

.input-focus-keyboard:focus-visible {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}`,
      example: '<input class="input-focus" type="text" placeholder="点击查看焦点效果" style="border: 2px solid #ddd; transition: border-color 0.3s ease, box-shadow 0.3s ease; padding: 10px; border-radius: 4px; outline: none; width: 200px;" />',
    },
    {
      id: 'placeholder-style',
      title: '占位符样式',
      description: '自定义输入框占位符样式，兼容所有浏览器',
      code: `.placeholder-style::placeholder {
  color: #94a3b8;
  opacity: 1;
}

.placeholder-style::-webkit-input-placeholder {
  color: #94a3b8;
  opacity: 1;
}

.placeholder-style::-moz-placeholder {
  color: #94a3b8;
  opacity: 1;
}

.placeholder-style:-ms-input-placeholder {
  color: #94a3b8;
}

.placeholder-style:-moz-placeholder {
  color: #94a3b8;
  opacity: 1;
}

/* 占位符动画效果 */
.placeholder-animated::placeholder {
  -webkit-transition: opacity 0.3s ease, transform 0.3s ease;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.placeholder-animated:focus::placeholder {
  opacity: 0.5;
  -webkit-transform: translateY(-10px);
  transform: translateY(-10px);
}`,
      example: '<input class="placeholder-style" type="text" placeholder="自定义占位符样式" style="padding: 10px; border: 2px solid #ddd; border-radius: 4px; width: 200px;" />',
    },
    {
      id: 'checkbox-custom',
      title: '自定义复选框（简化版）',
      description: '使用 appearance 属性自定义复选框',
      code: `.checkbox-custom {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}

.checkbox-custom:checked {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-custom:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 14px;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  font-weight: bold;
}

.checkbox-custom:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.checkbox-custom:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}`,
      example: '<input type="checkbox" class="checkbox-custom" checked style="-webkit-appearance: none; -moz-appearance: none; appearance: none; width: 20px; height: 20px; border: 2px solid #667eea; border-radius: 4px; background: #667eea; position: relative; cursor: pointer;" />',
    },
    {
      id: 'radio-custom',
      title: '自定义单选框',
      description: '使用 appearance 属性自定义单选框样式',
      code: `.radio-custom {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}

.radio-custom:checked {
  border-color: #667eea;
}

.radio-custom:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #667eea;
  border-radius: 50%;
}

.radio-custom:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}`,
      example: '<input type="radio" class="radio-custom" checked style="-webkit-appearance: none; -moz-appearance: none; appearance: none; width: 20px; height: 20px; border: 2px solid #667eea; border-radius: 50%; position: relative; cursor: pointer;" />',
    },
    {
      id: 'input-group',
      title: '输入框组合',
      description: '带图标或按钮的输入框组合',
      code: `.input-group {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  border: 2px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.input-group input {
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
  border: none;
  padding: 10px;
  outline: none;
}

.input-group .input-icon {
  padding: 10px;
  background: #f8f9fa;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  -webkit-align-items: center;
  align-items: center;
}

.input-group .input-button {
  padding: 10px 16px;
  background: #667eea;
  color: white;
  border: none;
  cursor: pointer;
}

.input-group:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}`,
    },
    {
      id: 'form-validation',
      title: '表单验证样式',
      description: '表单验证成功和错误状态的样式',
      code: `.form-input {
  border: 2px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}

.form-input:valid {
  border-color: #10b981;
}

.form-input:invalid:not(:placeholder-shown) {
  border-color: #ef4444;
}

.form-input:invalid:not(:placeholder-shown) + .error-message {
  display: block;
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.error-message {
  display: none;
}

/* 使用类名控制 */
.input-error {
  border-color: #ef4444;
}

.input-success {
  border-color: #10b981;
}`,
    },
  ],
  mixins: [
    {
      id: 'gradient-btn',
      title: '渐变按钮',
      description: '带渐变背景的按钮，悬停时有提升效果',
      code: `.gradient-btn {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  -webkit-transition: -webkit-transform 0.2s ease, box-shadow 0.2s ease;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.gradient-btn:hover {
  -webkit-transform: translateY(-2px);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.gradient-btn:active {
  -webkit-transform: translateY(0);
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 不同渐变方向 */
.gradient-btn-vertical {
  background: linear-gradient(180deg, #ff6b6b, #4ecdc4);
}

.gradient-btn-radial {
  background: radial-gradient(circle, #ff6b6b, #4ecdc4);
}

/* 多色渐变 */
.gradient-btn-multi {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  background-size: 300% 300%;
  -webkit-animation: gradientShift 3s ease infinite;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}`,
      example: '<button class="gradient-btn" style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: none; color: white; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: transform 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);">渐变按钮</button>',
    },
    {
      id: 'card',
      title: '卡片样式',
      description: '通用的卡片样式，带悬停效果',
      code: `.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  -webkit-transition: box-shadow 0.3s ease, -webkit-transform 0.3s ease;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card:hover {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  -webkit-transform: translateY(-2px);
  transform: translateY(-2px);
}

/* 带边框的卡片 */
.card-bordered {
  border: 1px solid #e0e0e0;
  box-shadow: none;
}

.card-bordered:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

/* 扁平卡片 */
.card-flat {
  box-shadow: none;
  border: 1px solid #e0e0e0;
}

/* 阴影卡片 */
.card-shadowed {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1),
              0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 渐变卡片 */
.card-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}`,
      example: '<div class="card" style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); transition: box-shadow 0.3s ease, transform 0.3s ease; text-align: center;">卡片样式</div>',
    },
    {
      id: 'floating-label',
      title: '悬浮标签',
      description: '输入框聚焦时标签上浮的效果，Material Design 风格',
      code: `.floating-label {
  position: relative;
  display: inline-block;
  width: 100%;
}

.floating-label input {
  padding-top: 20px;
  padding-bottom: 8px;
  border: 2px solid #ddd;
  border-radius: 4px;
  width: 100%;
  -webkit-transition: border-color 0.3s ease;
  transition: border-color 0.3s ease;
  outline: none;
}

.floating-label label {
  position: absolute;
  top: 12px;
  left: 12px;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
  pointer-events: none;
  color: #999;
  background: white;
  padding: 0 4px;
}

.floating-label input:focus + label,
.floating-label input:not(:placeholder-shown) + label {
  top: -8px;
  left: 8px;
  font-size: 12px;
  color: #3498db;
  font-weight: 500;
}

.floating-label input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* 带图标版本 */
.floating-label-icon {
  position: relative;
}

.floating-label-icon .icon {
  position: absolute;
  left: 12px;
  top: 50%;
  -webkit-transform: translateY(-50%);
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

.floating-label-icon input {
  padding-left: 40px;
}

.floating-label-icon label {
  left: 40px;
}`,
      example: '<div class="floating-label" style="position: relative; display: inline-block; width: 250px;"><input type="text" placeholder=" " style="padding-top: 20px; padding-bottom: 8px; border: 2px solid #ddd; border-radius: 4px; width: 100%; transition: border-color 0.3s ease; outline: none; padding-left: 12px; padding-right: 12px;" /><label style="position: absolute; top: 12px; left: 12px; transition: all 0.3s ease; pointer-events: none; color: #999; background: white; padding: 0 4px;">标签文字</label></div>',
    },
    {
      id: 'flex-center-mixin',
      title: 'Flex 居中混合',
      description: 'SCSS mixin 实现 Flex 居中',
      code: `@mixin flex-center {
  display: -webkit-box;
  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  -webkit-align-items: center;
  align-items: center;
}

/* 使用 */
.container {
  @include flex-center;
}

/* 仅水平居中 */
@mixin flex-center-x {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
}

/* 仅垂直居中 */
@mixin flex-center-y {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  -webkit-align-items: center;
  align-items: center;
}`,
    },
    {
      id: 'responsive-mixin',
      title: '响应式混合',
      description: 'SCSS mixin 简化媒体查询',
      code: `@mixin respond-to($breakpoint) {
  @if $breakpoint == mobile {
    @media (max-width: 768px) { @content; }
  }
  @if $breakpoint == tablet {
    @media (min-width: 769px) and (max-width: 1024px) { @content; }
  }
  @if $breakpoint == desktop {
    @media (min-width: 1025px) { @content; }
  }
  @if $breakpoint == large {
    @media (min-width: 1280px) { @content; }
  }
}

/* 使用 */
.element {
  font-size: 16px;
  @include respond-to(mobile) {
    font-size: 14px;
  }
}

/* 更灵活的断点 mixin */
@mixin breakpoint($min: 0, $max: 0) {
  @if $max == 0 {
    @media (min-width: $min) { @content; }
  } @else {
    @media (min-width: $min) and (max-width: $max) { @content; }
  }
}

/* 使用 */
.element {
  @include breakpoint(768px, 1024px) {
    font-size: 16px;
  }
}`,
    },
    {
      id: 'truncate-mixin',
      title: '文本截断混合',
      description: 'SCSS mixin 实现文本截断',
      code: `@mixin truncate($lines: 1) {
  @if $lines == 1 {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* 使用 */
.title {
  @include truncate(1);
}
.description {
  @include truncate(3);
}

/* 带最大宽度的截断 */
@mixin truncate-with-width($lines: 1, $max-width: 100%) {
  max-width: $max-width;
  @include truncate($lines);
}`,
    },
    {
      id: 'button-mixin',
      title: '按钮混合',
      description: 'SCSS mixin 快速创建按钮样式',
      code: `@mixin button($bg-color: #667eea, $text-color: white, $hover-bg: darken($bg-color, 10%)) {
  background: $bg-color;
  color: $text-color;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  -webkit-transition: background 0.3s ease;
  transition: background 0.3s ease;
  
  &:hover {
    background: $hover-bg;
  }
  
  &:active {
    -webkit-transform: scale(0.98);
    transform: scale(0.98);
  }
}

/* 使用 */
.btn-primary {
  @include button(#667eea, white, #5568d3);
}

.btn-success {
  @include button(#10b981, white, #0d9968);
}`,
    },
    {
      id: 'card-mixin',
      title: '卡片混合',
      description: 'SCSS mixin 快速创建卡片样式',
      code: `@mixin card($padding: 20px, $border-radius: 8px, $shadow: 0 2px 10px rgba(0, 0, 0, 0.1)) {
  background: white;
  border-radius: $border-radius;
  padding: $padding;
  box-shadow: $shadow;
  -webkit-transition: box-shadow 0.3s ease;
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  }
}

/* 使用 */
.card {
  @include card;
}

.card-large {
  @include card(30px, 12px, 0 4px 15px rgba(0, 0, 0, 0.1));
}`,
    },
  ],
};

