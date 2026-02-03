/**
 * @file techstack-scanner.ts
 * @description 深度技术栈探测引擎（v2.1）
 * @author Your Name
 * @version 2.1.0
 * ✅ 适配 Cursor：模块化、强类型、可续写
 */

type Confidence = 'high' | 'medium' | 'low';

export interface DetectedItem {
  name: string;
  category: string;
  version?: string;
  confidence: Confidence;
  evidence: string[];
}

interface DependencyInfo {
  name: string;
  version?: string;
  source: string;
  url: string;
}

export interface TechStackResult {
  target: {
    url: string;
    title: string;
    origin: string;
    hostname: string;
    protocol: string;
    pathname: string;
  };
  timestamp: number;
  env: {
    userAgent: string;
    language: string;
    languages: string[];
    platform?: string;
    deviceMemory?: number;
    hardwareConcurrency?: number;
    timezone?: string;
    cookieEnabled: boolean;
    colorScheme?: string;
    prefersReducedMotion?: boolean;
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  };
  documentInfo: {
    charset: string;
    compatMode: string;
    doctype: string;
    lang: string;
    dir: string;
    htmlClass: string;
    bodyClass: string;
    htmlDatasetKeys: string[];
  };
  meta: Array<{ name?: string; property?: string; content: string }>;
  scripts: string[];
  stylesheets: string[];
  resources: Array<{ name: string; initiatorType: string }>;
  globals: string[];
  storage: {
    localStorageKeys: string[];
    sessionStorageKeys: string[];
    cookieKeys: string[];
  };
  frameworks: DetectedItem[];
  buildTools: DetectedItem[];
  uiLibraries: DetectedItem[];
  stateManagement: DetectedItem[];
  routers: DetectedItem[];
  deployment: DetectedItem[];
  dependencies: DependencyInfo[];
  hints: string[];
}

interface CollectOptions {
  includeSameOriginIframes?: boolean;
}

const REGEX = {
  reactScript: /react(\.|-).+\.js/i,
  vueScript: /vue(\.|-).+\.js/i,
  preactScript: /preact(\.|-).+\.js/i,
  solidScript: /solid(\.|-).+\.js|solidjs/i,
  svelteScript: /svelte(\.|-).+\.js/i,
  emberScript: /ember(\.|-).+\.js/i,
  alpineScript: /alpine(\.|-).+\.js/i,
  litScript: /lit(\.|-).+\.js/i,
  stimulusScript: /stimulus(\.|-).+\.js/i,
  jqueryScript: /jquery(\.|-).+\.js/i,
  backboneScript: /backbone(\.|-).+\.js/i,
  knockoutScript: /knockout(\.|-).+\.js/i,
  mithrilScript: /mithril(\.|-).+\.js/i,
  infernoScript: /inferno(\.|-).+\.js/i,
  riotScript: /riot(\.|-).+\.js/i,
  markoScript: /marko(\.|-).+\.js/i,
  nextScript: /\/_next\//i,
  nuxtScript: /\/_nuxt\//i,
  sveltekitScript: /\/_app\/immutable/i,
  astroScript: /astro/i,
  qwikScript: /qwik/i,
  viteClient: /@vite\/client/i,
  vitePress: /vitepress/i,
  docusaurus: /docusaurus/i,
  rollup: /rollup/i,
  rspack: /rspack/i,
  parcel: /parcel/i,
  turbopack: /turbopack/i,
  esbuild: /esbuild/i,
  snowpack: /snowpack/i,
  metro: /metro(\.|-)?bundler/i,
  reactRouter: /react-router/i,
  vueRouter: /vue-router/i,
  tanstackRouter: /tanstack-router/i,
  wouter: /wouter/i,
  reachRouter: /@reach\/router|reach-router/i,
  recoil: /recoil/i,
  jotai: /jotai/i,
  effector: /effector/i,
  xstate: /xstate/i,
  rxjs: /rxjs/i,
  ngrx: /ngrx/i,
  tailwind: /tailwind/i,
  mui: /mui|material-ui/i,
  chakra: /chakra/i,
  antd: /antd|ant-design/i,
  elementPlus: /element-plus/i,
  elementUI: /element-ui/i,
  vuetify: /vuetify/i,
  bootstrap: /bootstrap/i,
  foundation: /foundation/i,
  materialize: /materialize/i,
  bulma: /bulma/i,
  semantic: /semantic/i,
  ionic: /ionic/i,
  uikit: /uikit/i,
  fluent: /fluent-ui|fabric-ui/i,
  blueprint: /blueprint/i,
  carbon: /carbon/i,
  polaris: /polaris/i,
  arco: /arco-design/i,
  tdesign: /tdesign/i,
  naive: /naive-ui/i,
  mantine: /mantine/i,
  primereact: /primereact/i,
  primevue: /primevue/i,
  daisyui: /daisyui/i,
  dataReact: /data-reactroot|data-reactid/i,
  classAnt: /\bant-/,
  classEl: /\bel-/,
  classMui: /\bMui[A-Za-z0-9-]+/,
  classChakra: /\bchakra-/,
  classVuetify: /\bv-(application|main|container)\b/,
  classIonic: /\bion-/,
  classArco: /\barco-/,
  classTDesign: /\bt-([a-z]+-)?/i,
  classNaive: /\bn-(button|card|layout|modal)-/i,
  classMantine: /\bmantine-/i,
  classPrime: /\bp-(button|card|datatable|input|dropdown)\b/i,
  classFluent: /\bms-Button|\bms-Nav|\bms-Fabric/i,
  classBlueprint: /\bbp3-|bp4-/i,
  classCarbon: /\bbx--/i,
  classPolaris: /\bPolaris-/i,
  classUIKit: /\buk-/i,
  classFoundation: /\btop-bar|callout|grid-x|cell\b/i,
  classMaterialize: /\bbtn|card-panel|material-icons\b/i,
  classDaisy: /\bbtn-(primary|secondary|accent)\b/i,
  classTailwind: /\b(?:flex|grid|p-[0-9]|m-[0-9]|text-[a-z]+)\b/,
  generatorAstro: /astro/i,
  generatorGatsby: /gatsby/i,
  generatorRemix: /remix/i,
  generatorNext: /next/i,
  generatorNuxt: /nuxt/i,
  generatorVitepress: /vitepress/i,
  generatorDocusaurus: /docusaurus/i,
  generatorQwik: /qwik/i,
  generatorSvelteKit: /sveltekit/i,
  generatorFresh: /fresh/i,
  generatorSolidStart: /solidstart/i,
  metaNextHead: /next-head-count/i,
  hostnameVercel: /\.vercel\.app$/i,
  hostnameNetlify: /\.netlify\.app$/i,
  hostnamePages: /\.pages\.dev$/i,
  hostnameGithub: /\.github\.io$/i,
  hostnameFirebase: /\.(web\.app|firebaseapp\.com)$/i,
  hostnameSurge: /\.surge\.sh$/i,
  hostnameRender: /\.onrender\.com$/i,
  hostnameRailway: /\.railway\.app$/i,
  hostnameAzure: /\.azurewebsites\.net$/i,
  hostnameHeroku: /\.herokuapp\.com$/i,
  cdnUnpkg: /https?:\/\/unpkg\.com\/([^@\/]+)(?:@([^\/]+))?/i,
  cdnJsdelivr: /https?:\/\/cdn\.jsdelivr\.net\/npm\/([^@\/]+)(?:@([^\/]+))?/i,
  cdnCdnjs: /https?:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/([^\/]+)\/([^\/]+)\//i,
  cdnEsm: /https?:\/\/esm\.sh\/([^@\/]+)(?:@([^\/]+))?/i,
  cdnSkypack: /https?:\/\/cdn\.skypack\.dev\/([^@\/]+)(?:@([^\/]+))?/i,
  cdnJspm: /https?:\/\/ga\.jspm\.io\/npm:([^@\/]+)(?:@([^\/]+))?/i,
};

const GLOBAL_KEYS = [
  'React',
  'Vue',
  'Angular',
  'preact',
  'Preact',
  'Solid',
  'Alpine',
  'Ember',
  'Backbone',
  'ko',
  'Mithril',
  'Inferno',
  'Riot',
  'Marko',
  'jQuery',
  '$',
  'Stimulus',
  'Lit',
  'lit',
  'Svelte',
  'Qwik',
  'Astro',
  'Next',
  'Nuxt',
  'Gatsby',
  'Remix',
  'Vite',
  'SolidStart',
  'SvelteKit',
  '__REACT_DEVTOOLS_GLOBAL_HOOK__',
  '__VUE_DEVTOOLS_GLOBAL_HOOK__',
  '__NEXT_DATA__',
  '__NUXT__',
  '__SVELTEKIT_CLIENT__',
  '__astro',
  '__PREACT_DEVTOOLS__',
  '__SOLID_DEVTOOLS__',
  '__EMBER_DEVTOOLS__',
  '__ALPINE__',
];

const dependencyPatterns: Array<{ source: string; regex: RegExp; nameIndex: number; versionIndex?: number }> = [
  { source: 'unpkg', regex: REGEX.cdnUnpkg, nameIndex: 1, versionIndex: 2 },
  { source: 'jsdelivr', regex: REGEX.cdnJsdelivr, nameIndex: 1, versionIndex: 2 },
  { source: 'cdnjs', regex: REGEX.cdnCdnjs, nameIndex: 1, versionIndex: 2 },
  { source: 'esm.sh', regex: REGEX.cdnEsm, nameIndex: 1, versionIndex: 2 },
  { source: 'skypack', regex: REGEX.cdnSkypack, nameIndex: 1, versionIndex: 2 },
  { source: 'jspm', regex: REGEX.cdnJspm, nameIndex: 1, versionIndex: 2 },
];

const confidenceRank: Record<Confidence, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const safeGet = <T,>(obj: unknown, path: string, fallback?: T): T | undefined => {
  try {
    return path.split('.').reduce((acc: any, key) => (acc ? acc[key] : undefined), obj as any) ?? fallback;
  } catch (error) {
    return fallback;
  }
};

const parseUrlSafe = (rawUrl: string): URL | null => {
  try {
    return new URL(rawUrl, window.location.href);
  } catch (error) {
    return null;
  }
};

const getMetaTags = () =>
  Array.from(document.querySelectorAll('meta'))
    .map((meta) => ({
      name: meta.getAttribute('name') || undefined,
      property: meta.getAttribute('property') || undefined,
      content: meta.getAttribute('content') || '',
    }))
    .filter((meta) => meta.content);

const getMetaContent = (metaTags: Array<{ name?: string; property?: string; content: string }>, name: string) =>
  metaTags.find((meta) => meta.name === name || meta.property === name)?.content;

const hasMetaContent = (metaTags: Array<{ name?: string; property?: string; content: string }>, name: string, pattern: RegExp) =>
  metaTags.some((meta) => (meta.name === name || meta.property === name) && pattern.test(meta.content));

const hasClassPattern = (pattern: RegExp) => {
  const elements = document.querySelectorAll('[class]');
  const limit = Math.min(elements.length, 100);
  for (let i = 0; i < limit; i += 1) {
    const className = (elements[i] as HTMLElement).className;
    if (typeof className === 'string' && pattern.test(className)) {
      return true;
    }
  }
  return false;
};

const addDetected = (items: Map<string, DetectedItem>, payload: Omit<DetectedItem, 'evidence'> & { evidence?: string[] }) => {
  const existing = items.get(payload.name);
  const evidence = payload.evidence ?? [];
  if (!existing) {
    items.set(payload.name, { ...payload, evidence });
    return;
  }
  const confidence = confidenceRank[payload.confidence] > confidenceRank[existing.confidence] ? payload.confidence : existing.confidence;
  items.set(payload.name, {
    ...existing,
    confidence,
    version: payload.version || existing.version,
    evidence: Array.from(new Set([...existing.evidence, ...evidence])),
  });
};

/**
 * @param scripts 已加载脚本 URL
 * @param resources Performance 资源条目
 * @param pattern 正则
 * @returns 匹配到的 URL
 * @example
 * const url = findResourceUrl(scripts, resources, /react/i)
 */
const findResourceUrl = (scripts: string[], resources: Array<{ name: string }>, pattern: RegExp) =>
  scripts.find((src) => pattern.test(src)) || resources.find((entry) => pattern.test(entry.name))?.name;

const parseReactVersion = (raw?: string) => {
  if (!raw) return undefined;
  const match = raw.match(/\d+\.\d+\.\d+/);
  return match ? match[0] : raw;
};

/**
 * React 探测：区分 16/17/18（DevTools + Fiber）
 * @returns DetectedItem[]
 */
const detectReact = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const hook = safeGet<any>(window, '__REACT_DEVTOOLS_GLOBAL_HOOK__');
  const rendererVersions: string[] = [];
  const renderers = hook?.renderers;
  if (renderers && typeof renderers.values === 'function') {
    for (const renderer of renderers.values()) {
      const version = parseReactVersion(renderer?.version);
      if (version) rendererVersions.push(version);
    }
  }
  const version = rendererVersions[0] || parseReactVersion(safeGet<any>(window, 'React.version'));
  const major = version ? parseInt(version.split('.')[0], 10) : undefined;
  const evidence: string[] = [];

  if (hook) evidence.push('global:__REACT_DEVTOOLS_GLOBAL_HOOK__');
  if (safeGet<any>(window, 'React.version')) evidence.push('global:React.version');
  if (document.querySelector('[data-reactroot],[data-reactid]')) evidence.push('dom:data-reactroot/data-reactid');
  const script = findResourceUrl(scripts, resources, REGEX.reactScript);
  if (script) evidence.push(`script:${script}`);

  if (evidence.length > 0) {
    items.push({
      name: 'React',
      category: '框架',
      version: version ? `v${version}` : undefined,
      confidence: major ? 'high' : 'medium',
      evidence,
    });
    if (major === 18) {
      items.push({
        name: 'React 18',
        category: '框架',
        version: version ? `v${version}` : undefined,
        confidence: 'high',
        evidence: ['react:major=18'],
      });
    } else if (major === 17 || major === 16) {
      items.push({
        name: `React ${major}`,
        category: '框架',
        version: version ? `v${version}` : undefined,
        confidence: 'medium',
        evidence: ['react:devtools-version'],
      });
    }
  }
  return items;
};

/**
 * Next.js 探测：区分 App Router / RSC 特征
 */
const detectNext = (scripts: string[], resources: Array<{ name: string }>, metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  const nextDataScript = document.querySelector('script#__NEXT_DATA__') as HTMLScriptElement | null;
  const nextData = safeGet<any>(window, '__NEXT_DATA__');
  const hasNextScript = Boolean(findResourceUrl(scripts, resources, REGEX.nextScript));

  if (nextDataScript) evidence.push('dom:script#__NEXT_DATA__');
  if (nextData) evidence.push('global:__NEXT_DATA__');
  if (hasNextScript) evidence.push('script:/_next/');
  if (hasMetaContent(metaTags, 'next-head-count', REGEX.metaNextHead)) evidence.push('meta:next-head-count');

  if (evidence.length > 0) {
    items.push({
      name: 'Next.js',
      category: '框架',
      confidence: nextData ? 'high' : 'medium',
      evidence,
    });
  }

  const appRouterEvidence: string[] = [];
  if (safeGet<any>(window, '__next_fallback__')) appRouterEvidence.push('global:__next_fallback__');
  if (nextDataScript?.textContent) {
    try {
      const parsed = JSON.parse(nextDataScript.textContent);
      if (parsed?.appDir) appRouterEvidence.push('next-data:appDir');
      if (parsed?.rsc || parsed?.rsc?.type) appRouterEvidence.push('next-data:rsc');
    } catch (error) {
      // ignore
    }
  }
  if (document.querySelector('script[data-nextjs-script]')) appRouterEvidence.push('dom:script[data-nextjs-script]');

  if (appRouterEvidence.length > 0) {
    items.push({
      name: 'Next.js App Router',
      category: '框架',
      confidence: 'high',
      evidence: appRouterEvidence,
    });
  }

  return items;
};

/**
 * Vue 探测：兼容 Vue2/Vue3，校验 createApp
 */
const detectVue = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const vue = safeGet<any>(window, 'Vue');
  const hook = safeGet<any>(window, '__VUE_DEVTOOLS_GLOBAL_HOOK__');
  const version = vue?.version || hook?.Vue?.version;
  const evidence: string[] = [];

  if (hook) evidence.push('global:__VUE_DEVTOOLS_GLOBAL_HOOK__');
  if (version) evidence.push('global:Vue.version');
  if (document.querySelector('[data-v-app],[data-vue-meta]')) evidence.push('dom:data-v-app/data-vue-meta');
  const script = findResourceUrl(scripts, resources, REGEX.vueScript);
  if (script) evidence.push(`script:${script}`);

  const createApp = vue?.createApp;
  const hasAppInstance = hook?.apps?.size > 0 || Array.isArray(hook?.apps) || Boolean(vue?.appContext);
  const isVue3 = typeof createApp === 'function' && (String(version || '').startsWith('3') || hasAppInstance);

  if (evidence.length > 0) {
    items.push({
      name: 'Vue',
      category: '框架',
      version: version ? `v${version}` : undefined,
      confidence: hook ? 'high' : 'medium',
      evidence,
    });
  }

  if (isVue3) {
    items.push({
      name: 'Vue 3',
      category: '框架',
      version: version ? `v${version}` : undefined,
      confidence: hasAppInstance ? 'high' : 'medium',
      evidence: ['vue:createApp'],
    });
  }
  return items;
};

/**
 * Preact 探测
 */
const detectPreact = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const preact = safeGet<any>(window, 'preact');
  const version = preact?.version;
  const evidence: string[] = [];
  if (safeGet<any>(window, '__PREACT_DEVTOOLS__')) evidence.push('global:__PREACT_DEVTOOLS__');
  if (version) evidence.push('global:preact.version');
  const script = findResourceUrl(scripts, resources, REGEX.preactScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Preact',
      category: '框架',
      version: version ? `v${version}` : undefined,
      confidence: version ? 'high' : 'medium',
      evidence,
    });
  }
  return items;
};

/**
 * SolidJS 探测
 */
const detectSolid = (scripts: string[], resources: Array<{ name: string }>, metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, '__SOLID_DEVTOOLS__')) evidence.push('global:__SOLID_DEVTOOLS__');
  const script = findResourceUrl(scripts, resources, REGEX.solidScript);
  if (script) evidence.push(`script:${script}`);
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorSolidStart)) evidence.push('meta:generator=solidstart');
  if (evidence.length > 0) {
    items.push({
      name: 'SolidJS',
      category: '框架',
      confidence: safeGet<any>(window, '__SOLID_DEVTOOLS__') ? 'high' : 'medium',
      evidence,
    });
  }
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorSolidStart)) {
    items.push({
      name: 'SolidStart',
      category: '框架',
      confidence: 'medium',
      evidence: ['meta:generator=solidstart'],
    });
  }
  return items;
};

/**
 * Svelte（非 Kit）探测
 */
const detectSvelte = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (document.querySelector('[data-svelte-h]')) evidence.push('dom:data-svelte-h');
  const script = findResourceUrl(scripts, resources, REGEX.svelteScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Svelte',
      category: '框架',
      confidence: 'medium',
      evidence,
    });
  }
  return items;
};

/**
 * Alpine.js 探测
 */
const detectAlpine = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'Alpine')) evidence.push('global:Alpine');
  if (document.querySelector('[x-data],[x-init],[x-show],[x-bind]')) evidence.push('dom:x-data/x-init');
  const script = findResourceUrl(scripts, resources, REGEX.alpineScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Alpine.js',
      category: '框架',
      confidence: safeGet<any>(window, 'Alpine') ? 'high' : 'medium',
      evidence,
    });
  }
  return items;
};

/**
 * Lit 探测
 */
const detectLit = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'lit')) evidence.push('global:lit');
  if (document.querySelector('[data-lit]')) evidence.push('dom:data-lit');
  const script = findResourceUrl(scripts, resources, REGEX.litScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Lit',
      category: '框架',
      confidence: safeGet<any>(window, 'lit') ? 'high' : 'low',
      evidence,
    });
  }
  return items;
};

/**
 * Ember 探测
 */
const detectEmber = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'Ember')) evidence.push('global:Ember');
  const script = findResourceUrl(scripts, resources, REGEX.emberScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Ember.js',
      category: '框架',
      confidence: safeGet<any>(window, 'Ember') ? 'high' : 'medium',
      evidence,
    });
  }
  return items;
};

/**
 * Stimulus 探测
 */
const detectStimulus = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'Stimulus')) evidence.push('global:Stimulus');
  if (document.querySelector('[data-controller]')) evidence.push('dom:data-controller');
  const script = findResourceUrl(scripts, resources, REGEX.stimulusScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Stimulus',
      category: '框架',
      confidence: safeGet<any>(window, 'Stimulus') ? 'high' : 'medium',
      evidence,
    });
  }
  return items;
};

/**
 * jQuery 探测（作为基础库）
 */
const detectJQuery = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'jQuery') || safeGet<any>(window, '$')) evidence.push('global:jQuery/$');
  const script = findResourceUrl(scripts, resources, REGEX.jqueryScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'jQuery',
      category: '框架',
      confidence: safeGet<any>(window, 'jQuery') ? 'high' : 'low',
      evidence,
    });
  }
  return items;
};

const detectBackbone = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'Backbone')) evidence.push('global:Backbone');
  const script = findResourceUrl(scripts, resources, REGEX.backboneScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Backbone.js',
      category: '框架',
      confidence: safeGet<any>(window, 'Backbone') ? 'high' : 'low',
      evidence,
    });
  }
  return items;
};

const detectKnockout = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'ko')) evidence.push('global:ko');
  const script = findResourceUrl(scripts, resources, REGEX.knockoutScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Knockout',
      category: '框架',
      confidence: safeGet<any>(window, 'ko') ? 'high' : 'low',
      evidence,
    });
  }
  return items;
};

const detectMithril = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'm')) evidence.push('global:m');
  const script = findResourceUrl(scripts, resources, REGEX.mithrilScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Mithril',
      category: '框架',
      confidence: safeGet<any>(window, 'm') ? 'medium' : 'low',
      evidence,
    });
  }
  return items;
};

const detectInferno = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'Inferno')) evidence.push('global:Inferno');
  const script = findResourceUrl(scripts, resources, REGEX.infernoScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Inferno',
      category: '框架',
      confidence: safeGet<any>(window, 'Inferno') ? 'medium' : 'low',
      evidence,
    });
  }
  return items;
};

const detectRiot = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'riot')) evidence.push('global:riot');
  const script = findResourceUrl(scripts, resources, REGEX.riotScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Riot.js',
      category: '框架',
      confidence: safeGet<any>(window, 'riot') ? 'medium' : 'low',
      evidence,
    });
  }
  return items;
};

const detectMarko = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, 'marko')) evidence.push('global:marko');
  const script = findResourceUrl(scripts, resources, REGEX.markoScript);
  if (script) evidence.push(`script:${script}`);
  if (evidence.length > 0) {
    items.push({
      name: 'Marko',
      category: '框架',
      confidence: safeGet<any>(window, 'marko') ? 'medium' : 'low',
      evidence,
    });
  }
  return items;
};

const detectAngular = () => {
  const items: DetectedItem[] = [];
  const version = document.querySelector('[ng-version]')?.getAttribute('ng-version') || undefined;
  if (safeGet<any>(window, 'ng') || version) {
    items.push({
      name: 'Angular',
      category: '框架',
      version: version ? `v${version}` : undefined,
      confidence: version ? 'high' : 'medium',
      evidence: version ? [`dom:ng-version=${version}`] : ['global:ng'],
    });
  }
  return items;
};

const detectSvelteKit = (scripts: string[], resources: Array<{ name: string }>, metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (document.querySelector('[data-sveltekit]')) evidence.push('dom:data-sveltekit');
  if (safeGet<any>(window, '__SVELTEKIT_CLIENT__')) evidence.push('global:__SVELTEKIT_CLIENT__');
  const script = findResourceUrl(scripts, resources, REGEX.sveltekitScript);
  if (script) evidence.push(`script:${script}`);
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorSvelteKit)) evidence.push('meta:generator=sveltekit');
  if (evidence.length > 0) {
    items.push({
      name: 'SvelteKit',
      category: '框架',
      confidence: 'medium',
      evidence,
    });
  }
  return items;
};

const detectAstro = (scripts: string[], resources: Array<{ name: string }>, metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorAstro)) evidence.push('meta:generator=astro');
  const script = findResourceUrl(scripts, resources, REGEX.astroScript);
  if (script) evidence.push(`script:${script}`);
  if (safeGet<any>(window, '__astro')) evidence.push('global:__astro');
  if (evidence.length > 0) {
    items.push({
      name: 'Astro',
      category: '框架',
      confidence: 'medium',
      evidence,
    });
  }
  return items;
};

const detectQwik = (scripts: string[], resources: Array<{ name: string }>, metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (document.querySelector('[data-qwik], [q\\:container]')) evidence.push('dom:data-qwik/q:container');
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorQwik)) evidence.push('meta:generator=qwik');
  const script = findResourceUrl(scripts, resources, REGEX.qwikScript);
  if (script) evidence.push(`script:${script}`);
  if (safeGet<any>(window, 'qQwik')) evidence.push('global:qQwik');
  if (evidence.length > 0) {
    items.push({
      name: 'Qwik',
      category: '框架',
      confidence: 'medium',
      evidence,
    });
  }
  return items;
};

/**
 * Fresh 探测（Deno）
 */
const detectFresh = (metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorFresh)) {
    items.push({
      name: 'Fresh',
      category: '框架',
      confidence: 'medium',
      evidence: ['meta:generator=fresh'],
    });
  }
  return items;
};

const detectNuxt = (scripts: string[], resources: Array<{ name: string }>, metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  const evidence: string[] = [];
  if (safeGet<any>(window, '__NUXT__')) evidence.push('global:__NUXT__');
  const script = findResourceUrl(scripts, resources, REGEX.nuxtScript);
  if (script) evidence.push(`script:${script}`);
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorNuxt)) evidence.push('meta:generator=nuxt');
  if (evidence.length > 0) {
    items.push({
      name: 'Nuxt',
      category: '框架',
      confidence: safeGet<any>(window, '__NUXT__') ? 'high' : 'medium',
      evidence,
    });
  }
  return items;
};

const detectGatsbyRemix = (metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  if (safeGet<any>(window, '___gatsby') || hasMetaContent(metaTags, 'generator', REGEX.generatorGatsby)) {
    items.push({
      name: 'Gatsby',
      category: '框架',
      confidence: safeGet<any>(window, '___gatsby') ? 'high' : 'medium',
      evidence: safeGet<any>(window, '___gatsby') ? ['global:___gatsby'] : ['meta:generator=gatsby'],
    });
  }
  if (safeGet<any>(window, '__remixContext') || hasMetaContent(metaTags, 'generator', REGEX.generatorRemix)) {
    items.push({
      name: 'Remix',
      category: '框架',
      confidence: safeGet<any>(window, '__remixContext') ? 'high' : 'medium',
      evidence: safeGet<any>(window, '__remixContext') ? ['global:__remixContext'] : ['meta:generator=remix'],
    });
  }
  return items;
};

const detectBuildTools = (scripts: string[], resources: Array<{ name: string }>, metaTags: Array<{ name?: string; property?: string; content: string }>) => {
  const items: DetectedItem[] = [];
  const hasImportMetaEnv = detectImportMetaEnvUsage();
  if (safeGet<any>(window, '__VITE_PLUGIN_REACT_PREAMBLE_INSTALLED__') || findResourceUrl(scripts, resources, REGEX.viteClient) || hasImportMetaEnv) {
    items.push({
      name: 'Vite',
      category: '构建工具',
      confidence: safeGet<any>(window, '__VITE_PLUGIN_REACT_PREAMBLE_INSTALLED__') ? 'high' : 'medium',
      evidence: safeGet<any>(window, '__VITE_PLUGIN_REACT_PREAMBLE_INSTALLED__')
        ? ['global:__VITE_PLUGIN_REACT_PREAMBLE_INSTALLED__']
        : hasImportMetaEnv
          ? ['inline:import.meta.env']
          : ['script:@vite/client'],
    });
  }
  if (safeGet<any>(window, '__webpack_require__') || safeGet<any>(window, 'webpackChunk') || safeGet<any>(window, 'webpackJsonp')) {
    items.push({
      name: 'Webpack',
      category: '构建工具',
      confidence: 'high',
      evidence: ['global:__webpack_require__/webpackChunk'],
    });
  }
  if (safeGet<any>(window, 'parcelRequire') || findResourceUrl(scripts, resources, REGEX.parcel)) {
    items.push({
      name: 'Parcel',
      category: '构建工具',
      confidence: safeGet<any>(window, 'parcelRequire') ? 'high' : 'low',
      evidence: safeGet<any>(window, 'parcelRequire') ? ['global:parcelRequire'] : ['script:parcel'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.rollup)) {
    items.push({
      name: 'Rollup',
      category: '构建工具',
      confidence: 'low',
      evidence: ['resource:rollup'],
    });
  }
  if (safeGet<any>(window, '__rspack_require__') || findResourceUrl(scripts, resources, REGEX.rspack)) {
    items.push({
      name: 'Rspack',
      category: '构建工具',
      confidence: safeGet<any>(window, '__rspack_require__') ? 'high' : 'low',
      evidence: safeGet<any>(window, '__rspack_require__') ? ['global:__rspack_require__'] : ['script:rspack'],
    });
  }
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorVitepress) || findResourceUrl(scripts, resources, REGEX.vitePress)) {
    items.push({
      name: 'VitePress',
      category: '框架',
      confidence: hasMetaContent(metaTags, 'generator', REGEX.generatorVitepress) ? 'medium' : 'low',
      evidence: hasMetaContent(metaTags, 'generator', REGEX.generatorVitepress) ? ['meta:generator=vitepress'] : ['script:vitepress'],
    });
  }
  if (hasMetaContent(metaTags, 'generator', REGEX.generatorDocusaurus) || findResourceUrl(scripts, resources, REGEX.docusaurus)) {
    items.push({
      name: 'Docusaurus',
      category: '框架',
      confidence: hasMetaContent(metaTags, 'generator', REGEX.generatorDocusaurus) ? 'medium' : 'low',
      evidence: hasMetaContent(metaTags, 'generator', REGEX.generatorDocusaurus) ? ['meta:generator=docusaurus'] : ['script:docusaurus'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.turbopack)) {
    items.push({
      name: 'Turbopack',
      category: '构建工具',
      confidence: 'low',
      evidence: ['resource:turbopack'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.esbuild)) {
    items.push({
      name: 'esbuild',
      category: '构建工具',
      confidence: 'low',
      evidence: ['resource:esbuild'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.snowpack)) {
    items.push({
      name: 'Snowpack',
      category: '构建工具',
      confidence: 'low',
      evidence: ['resource:snowpack'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.metro)) {
    items.push({
      name: 'Metro',
      category: '构建工具',
      confidence: 'low',
      evidence: ['resource:metro'],
    });
  }
  return items;
};

const detectStateManagement = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  if (safeGet<any>(window, '__REDUX_DEVTOOLS_EXTENSION__') || safeGet<any>(window, '__REDUX_DEVTOOLS_EXTENSION_COMPOSE__')) {
    items.push({
      name: 'Redux',
      category: '状态管理',
      confidence: 'low',
      evidence: ['global:__REDUX_DEVTOOLS_EXTENSION__'],
    });
  }
  if (safeGet<any>(window, '__mobxGlobals')) {
    items.push({
      name: 'MobX',
      category: '状态管理',
      confidence: 'medium',
      evidence: ['global:__mobxGlobals'],
    });
  }
  if (safeGet<any>(window, '__PINIA__') || safeGet<any>(window, 'pinia')) {
    items.push({
      name: 'Pinia',
      category: '状态管理',
      confidence: 'low',
      evidence: [safeGet<any>(window, '__PINIA__') ? 'global:__PINIA__' : 'global:pinia'],
    });
  }
  if (safeGet<any>(window, '__VUEX__')) {
    items.push({
      name: 'Vuex',
      category: '状态管理',
      confidence: 'low',
      evidence: ['global:__VUEX__'],
    });
  }
  if (safeGet<any>(window, 'zustand')) {
    items.push({
      name: 'Zustand',
      category: '状态管理',
      confidence: 'low',
      evidence: ['global:zustand'],
    });
  }
  if (safeGet<any>(window, '__RECOIL_DEVTOOLS_EXTENSION__') || findResourceUrl(scripts, resources, REGEX.recoil)) {
    items.push({
      name: 'Recoil',
      category: '状态管理',
      confidence: safeGet<any>(window, '__RECOIL_DEVTOOLS_EXTENSION__') ? 'medium' : 'low',
      evidence: safeGet<any>(window, '__RECOIL_DEVTOOLS_EXTENSION__') ? ['global:__RECOIL_DEVTOOLS_EXTENSION__'] : ['resource:recoil'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.jotai)) {
    items.push({
      name: 'Jotai',
      category: '状态管理',
      confidence: 'low',
      evidence: ['resource:jotai'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.effector)) {
    items.push({
      name: 'Effector',
      category: '状态管理',
      confidence: 'low',
      evidence: ['resource:effector'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.xstate)) {
    items.push({
      name: 'XState',
      category: '状态管理',
      confidence: 'low',
      evidence: ['resource:xstate'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.rxjs)) {
    items.push({
      name: 'RxJS',
      category: '状态管理',
      confidence: 'low',
      evidence: ['resource:rxjs'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.ngrx)) {
    items.push({
      name: 'NgRx',
      category: '状态管理',
      confidence: 'low',
      evidence: ['resource:ngrx'],
    });
  }
  return items;
};

const detectRouters = (scripts: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  if (findResourceUrl(scripts, resources, REGEX.reactRouter)) {
    items.push({
      name: 'React Router',
      category: '路由',
      confidence: 'low',
      evidence: ['resource:react-router'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.vueRouter)) {
    items.push({
      name: 'Vue Router',
      category: '路由',
      confidence: 'low',
      evidence: ['resource:vue-router'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.tanstackRouter)) {
    items.push({
      name: 'TanStack Router',
      category: '路由',
      confidence: 'low',
      evidence: ['resource:tanstack-router'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.wouter)) {
    items.push({
      name: 'Wouter',
      category: '路由',
      confidence: 'low',
      evidence: ['resource:wouter'],
    });
  }
  if (findResourceUrl(scripts, resources, REGEX.reachRouter)) {
    items.push({
      name: 'Reach Router',
      category: '路由',
      confidence: 'low',
      evidence: ['resource:reach-router'],
    });
  }
  return items;
};

const detectUILibraries = (stylesheets: string[], resources: Array<{ name: string }>) => {
  const items: DetectedItem[] = [];
  const addUi = (name: string, evidence: string[], confidence: Confidence) =>
    items.push({ name, category: 'UI库', confidence, evidence });

  const findStyle = (pattern: RegExp) =>
    stylesheets.find((href) => pattern.test(href)) || resources.find((entry) => pattern.test(entry.name))?.name;

  const antd = findStyle(REGEX.antd);
  if (antd || hasClassPattern(REGEX.classAnt)) addUi('Ant Design', [antd ? `style:${antd}` : 'dom:class=ant-'], antd ? 'medium' : 'low');

  const antdVue = findStyle(/ant-design-vue/i);
  if (antdVue) addUi('Ant Design Vue', [`style:${antdVue}`], 'medium');

  const elementPlus = findStyle(REGEX.elementPlus);
  if (elementPlus || hasClassPattern(REGEX.classEl)) addUi('Element Plus', [elementPlus ? `style:${elementPlus}` : 'dom:class=el-'], elementPlus ? 'medium' : 'low');

  const elementUi = findStyle(REGEX.elementUI);
  if (elementUi) addUi('Element UI', [`style:${elementUi}`], 'medium');

  const bootstrap = findStyle(REGEX.bootstrap);
  if (bootstrap) addUi('Bootstrap', [`style:${bootstrap}`], 'medium');

  const tailwind = findStyle(REGEX.tailwind);
  if (tailwind || hasClassPattern(REGEX.classTailwind)) {
    addUi('Tailwind CSS', [tailwind ? `style:${tailwind}` : 'dom:class=tailwind'], tailwind ? 'medium' : 'low');
  }

  const foundation = findStyle(REGEX.foundation);
  if (foundation || hasClassPattern(REGEX.classFoundation)) {
    addUi('Foundation', [foundation ? `style:${foundation}` : 'dom:class=foundation'], foundation ? 'medium' : 'low');
  }

  const materialize = findStyle(REGEX.materialize);
  if (materialize || hasClassPattern(REGEX.classMaterialize)) {
    addUi('Materialize', [materialize ? `style:${materialize}` : 'dom:class=materialize'], materialize ? 'medium' : 'low');
  }

  const mui = findStyle(REGEX.mui);
  if (mui || hasClassPattern(REGEX.classMui)) addUi('Material UI', [mui ? `style:${mui}` : 'dom:class=Mui'], mui ? 'medium' : 'low');

  const chakra = findStyle(REGEX.chakra);
  if (chakra || hasClassPattern(REGEX.classChakra)) addUi('Chakra UI', [chakra ? `style:${chakra}` : 'dom:class=chakra-'], chakra ? 'medium' : 'low');

  const vuetify = findStyle(REGEX.vuetify);
  if (vuetify || hasClassPattern(REGEX.classVuetify)) addUi('Vuetify', [vuetify ? `style:${vuetify}` : 'dom:class=v-'], vuetify ? 'medium' : 'low');

  const bulma = findStyle(REGEX.bulma);
  if (bulma) addUi('Bulma', [`style:${bulma}`], 'medium');

  const semantic = findStyle(REGEX.semantic);
  if (semantic) addUi('Semantic UI', [`style:${semantic}`], 'medium');

  const ionic = findStyle(REGEX.ionic);
  if (ionic || hasClassPattern(REGEX.classIonic)) addUi('Ionic', [ionic ? `style:${ionic}` : 'dom:class=ion-'], ionic ? 'medium' : 'low');

  const uikit = findStyle(REGEX.uikit);
  if (uikit || hasClassPattern(REGEX.classUIKit)) addUi('UIkit', [uikit ? `style:${uikit}` : 'dom:class=uk-'], uikit ? 'medium' : 'low');

  const fluent = findStyle(REGEX.fluent);
  if (fluent || hasClassPattern(REGEX.classFluent)) addUi('Fluent UI', [fluent ? `style:${fluent}` : 'dom:class=ms-'], fluent ? 'medium' : 'low');

  const blueprint = findStyle(REGEX.blueprint);
  if (blueprint || hasClassPattern(REGEX.classBlueprint)) addUi('Blueprint', [blueprint ? `style:${blueprint}` : 'dom:class=bp-'], blueprint ? 'medium' : 'low');

  const carbon = findStyle(REGEX.carbon);
  if (carbon || hasClassPattern(REGEX.classCarbon)) addUi('Carbon Design', [carbon ? `style:${carbon}` : 'dom:class=bx--'], carbon ? 'medium' : 'low');

  const polaris = findStyle(REGEX.polaris);
  if (polaris || hasClassPattern(REGEX.classPolaris)) addUi('Polaris', [polaris ? `style:${polaris}` : 'dom:class=Polaris-'], polaris ? 'medium' : 'low');

  const arco = findStyle(REGEX.arco);
  if (arco || hasClassPattern(REGEX.classArco)) addUi('Arco Design', [arco ? `style:${arco}` : 'dom:class=arco-'], arco ? 'medium' : 'low');

  const tdesign = findStyle(REGEX.tdesign);
  if (tdesign || hasClassPattern(REGEX.classTDesign)) addUi('TDesign', [tdesign ? `style:${tdesign}` : 'dom:class=t-'], tdesign ? 'medium' : 'low');

  const naive = findStyle(REGEX.naive);
  if (naive || hasClassPattern(REGEX.classNaive)) addUi('Naive UI', [naive ? `style:${naive}` : 'dom:class=n-'], naive ? 'medium' : 'low');

  const mantine = findStyle(REGEX.mantine);
  if (mantine || hasClassPattern(REGEX.classMantine)) addUi('Mantine', [mantine ? `style:${mantine}` : 'dom:class=mantine-'], mantine ? 'medium' : 'low');

  const primereact = findStyle(REGEX.primereact);
  if (primereact || hasClassPattern(REGEX.classPrime)) addUi('PrimeReact', [primereact ? `style:${primereact}` : 'dom:class=p-'], primereact ? 'medium' : 'low');

  const primevue = findStyle(REGEX.primevue);
  if (primevue || hasClassPattern(REGEX.classPrime)) addUi('PrimeVue', [primevue ? `style:${primevue}` : 'dom:class=p-'], primevue ? 'medium' : 'low');

  const daisyui = findStyle(REGEX.daisyui);
  if (daisyui || hasClassPattern(REGEX.classDaisy)) addUi('DaisyUI', [daisyui ? `style:${daisyui}` : 'dom:class=btn-*'], daisyui ? 'medium' : 'low');

  return items;
};

const detectDeployment = (hostname: string) => {
  const items: DetectedItem[] = [];
  const signals: Array<{ name: string; pattern: RegExp; evidence: string }> = [
    { name: 'Vercel', pattern: REGEX.hostnameVercel, evidence: 'domain:vercel.app' },
    { name: 'Netlify', pattern: REGEX.hostnameNetlify, evidence: 'domain:netlify.app' },
    { name: 'Cloudflare Pages', pattern: REGEX.hostnamePages, evidence: 'domain:pages.dev' },
    { name: 'GitHub Pages', pattern: REGEX.hostnameGithub, evidence: 'domain:github.io' },
    { name: 'Firebase Hosting', pattern: REGEX.hostnameFirebase, evidence: 'domain:firebaseapp.com/web.app' },
    { name: 'Surge', pattern: REGEX.hostnameSurge, evidence: 'domain:surge.sh' },
    { name: 'Render', pattern: REGEX.hostnameRender, evidence: 'domain:onrender.com' },
    { name: 'Railway', pattern: REGEX.hostnameRailway, evidence: 'domain:railway.app' },
    { name: 'Azure App Service', pattern: REGEX.hostnameAzure, evidence: 'domain:azurewebsites.net' },
    { name: 'Heroku', pattern: REGEX.hostnameHeroku, evidence: 'domain:herokuapp.com' },
  ];
  signals.forEach((signal) => {
    if (signal.pattern.test(hostname)) {
      items.push({
        name: signal.name,
        category: '部署环境',
        confidence: 'medium',
        evidence: [signal.evidence],
      });
    }
  });
  return items;
};

/**
 * @param urls 外部资源 URL 列表
 * @returns 依赖包列表
 */
const detectCDNDependencies = (urls: string[]) => {
  const dependencies: DependencyInfo[] = [];
  const seen = new Set<string>();
  urls.forEach((rawUrl) => {
    const url = parseUrlSafe(rawUrl);
    if (!url) return;
    dependencyPatterns.forEach((pattern) => {
      const match = url.href.match(pattern.regex);
      if (match) {
        const name = match[pattern.nameIndex];
        const version = pattern.versionIndex ? match[pattern.versionIndex] : undefined;
        const key = `${pattern.source}:${name}@${version || 'unknown'}`;
        if (!seen.has(key)) {
          seen.add(key);
          dependencies.push({
            name,
            version,
            source: pattern.source,
            url: url.href,
          });
        }
      }
    });
  });
  return dependencies;
};

const shouldTryPackageJson = () => {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
};

const fetchSameOriginPackageJson = async () => {
  if (!shouldTryPackageJson()) return null;
  const url = parseUrlSafe('/package.json');
  if (!url) return null;
  try {
    const response = await fetch(url.href, { credentials: 'include' });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

const detectDependenciesFromPackageJson = (packageJson: any) => {
  const dependencies: DependencyInfo[] = [];
  const build = (deps: Record<string, string> | undefined, source: string) => {
    if (!deps) return;
    Object.entries(deps).forEach(([name, version]) => {
      dependencies.push({ name, version, source, url: 'package.json' });
    });
  };
  build(packageJson?.dependencies, 'package.json');
  build(packageJson?.devDependencies, 'package.json:dev');
  return dependencies;
};

const collectGlobals = () =>
  GLOBAL_KEYS.filter((key) => {
    try {
      return typeof (window as any)[key] !== 'undefined';
    } catch (error) {
      return false;
    }
  });

const collectResources = () => {
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return entries
      .filter((entry) => ['script', 'link', 'css', 'fetch', 'xmlhttprequest'].includes(entry.initiatorType))
      .slice(0, 200)
      .map((entry) => ({ name: entry.name, initiatorType: entry.initiatorType }));
  } catch (error) {
    return [];
  }
};

const collectStorageKeys = () => {
  let localStorageKeys: string[] = [];
  let sessionStorageKeys: string[] = [];
  try {
    localStorageKeys = Object.keys(window.localStorage || {});
  } catch (error) {
    // ignore
  }
  try {
    sessionStorageKeys = Object.keys(window.sessionStorage || {});
  } catch (error) {
    // ignore
  }
  const cookieKeys = document.cookie
    .split(';')
    .map((item) => item.trim().split('=')[0])
    .filter((key) => Boolean(key));

  return { localStorageKeys, sessionStorageKeys, cookieKeys };
};

const collectEnvInfo = () => {
  const connection = safeGet<any>(navigator, 'connection')
    ? {
        effectiveType: safeGet<any>(navigator, 'connection.effectiveType'),
        downlink: safeGet<any>(navigator, 'connection.downlink'),
        rtt: safeGet<any>(navigator, 'connection.rtt'),
        saveData: safeGet<any>(navigator, 'connection.saveData'),
      }
    : undefined;

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: Array.from(navigator.languages || []),
    platform: safeGet<any>(navigator, 'platform'),
    deviceMemory: safeGet<any>(navigator, 'deviceMemory'),
    hardwareConcurrency: navigator.hardwareConcurrency,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookieEnabled: navigator.cookieEnabled,
    colorScheme: window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light',
    prefersReducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
    connection,
  };
};

const collectDocumentInfo = () => ({
  charset: document.characterSet || '',
  compatMode: document.compatMode || '',
  doctype: document.doctype ? `${document.doctype.name}` : '',
  lang: document.documentElement.lang || '',
  dir: document.documentElement.dir || '',
  htmlClass: document.documentElement.className || '',
  bodyClass: document.body?.className || '',
  htmlDatasetKeys: Object.keys(document.documentElement.dataset || {}),
});

/**
 * @param includeSameOriginIframes 是否递归扫描同源 iframe
 * @returns scripts/stylesheets 资源列表
 */
const collectResourcesFromDom = (includeSameOriginIframes = false) => {
  const scripts: string[] = [];
  const stylesheets: string[] = [];

  const collectFromDocument = (doc: Document) => {
    Array.from(doc.scripts)
      .map((script) => script.src)
      .filter(Boolean)
      .forEach((src) => scripts.push(src));
    Array.from(doc.querySelectorAll('link[rel="stylesheet"], link[as="style"]'))
      .map((link) => (link as HTMLLinkElement).href)
      .filter(Boolean)
      .forEach((href) => stylesheets.push(href));
  };

  collectFromDocument(document);

  if (includeSameOriginIframes) {
    Array.from(document.querySelectorAll('iframe')).forEach((frame) => {
      try {
        const doc = frame.contentDocument;
        if (doc) collectFromDocument(doc);
      } catch (error) {
        // 跨域 iframe 忽略
      }
    });
  }

  return { scripts: Array.from(new Set(scripts)), stylesheets: Array.from(new Set(stylesheets)) };
};

/**
 * 探测 import.meta.env 使用迹象（多用于 Vite）
 */
const detectImportMetaEnvUsage = () => {
  const scripts = Array.from(document.querySelectorAll('script[type="module"]'));
  const limit = Math.min(scripts.length, 20);
  for (let i = 0; i < limit; i += 1) {
    const script = scripts[i] as HTMLScriptElement;
    if (script.src) continue;
    const content = script.textContent || '';
    if (content.length > 20000) continue;
    if (content.includes('import.meta.env')) {
      return true;
    }
  }
  return false;
};

/**
 * 主入口：收集技术栈信息
 * @param options 采集选项
 * @returns TechStackResult
 */
export const collectTechStack = async (options: CollectOptions = {}): Promise<TechStackResult> => {
  const now = Date.now();
  const target = {
    url: window.location.href,
    title: document.title || '',
    origin: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    pathname: window.location.pathname,
  };

  const metaTags = getMetaTags();
  const { scripts, stylesheets } = collectResourcesFromDom(Boolean(options.includeSameOriginIframes));
  const resources = collectResources();
  const globals = collectGlobals();
  const hints: string[] = [];

  const frameworks = new Map<string, DetectedItem>();
  const buildTools = new Map<string, DetectedItem>();
  const uiLibraries = new Map<string, DetectedItem>();
  const stateManagement = new Map<string, DetectedItem>();
  const routers = new Map<string, DetectedItem>();
  const deployment = new Map<string, DetectedItem>();

  const reactItems = detectReact(scripts, resources);
  const vueItems = detectVue(scripts, resources);
  const preactItems = detectPreact(scripts, resources);
  const solidItems = detectSolid(scripts, resources, metaTags);
  const svelteItems = detectSvelte(scripts, resources);
  const svelteKitItems = detectSvelteKit(scripts, resources, metaTags);
  const alpineItems = detectAlpine(scripts, resources);
  const litItems = detectLit(scripts, resources);
  const emberItems = detectEmber(scripts, resources);
  const stimulusItems = detectStimulus(scripts, resources);
  const jqueryItems = detectJQuery(scripts, resources);
  const backboneItems = detectBackbone(scripts, resources);
  const knockoutItems = detectKnockout(scripts, resources);
  const mithrilItems = detectMithril(scripts, resources);
  const infernoItems = detectInferno(scripts, resources);
  const riotItems = detectRiot(scripts, resources);
  const markoItems = detectMarko(scripts, resources);
  const angularItems = detectAngular();
  const nextItems = detectNext(scripts, resources, metaTags);
  const nuxtItems = detectNuxt(scripts, resources, metaTags);
  const astroItems = detectAstro(scripts, resources, metaTags);
  const qwikItems = detectQwik(scripts, resources, metaTags);
  const freshItems = detectFresh(metaTags);
  const otherFrameworks = detectGatsbyRemix(metaTags);
  const buildItems = detectBuildTools(scripts, resources, metaTags);
  const uiItems = detectUILibraries(stylesheets, resources);
  const stateItems = detectStateManagement(scripts, resources);
  const routerItems = detectRouters(scripts, resources);
  const deployItems = detectDeployment(target.hostname);

  [
    ...reactItems,
    ...vueItems,
    ...preactItems,
    ...solidItems,
    ...svelteItems,
    ...svelteKitItems,
    ...alpineItems,
    ...litItems,
    ...emberItems,
    ...stimulusItems,
    ...jqueryItems,
    ...backboneItems,
    ...knockoutItems,
    ...mithrilItems,
    ...infernoItems,
    ...riotItems,
    ...markoItems,
    ...angularItems,
    ...nextItems,
    ...nuxtItems,
    ...astroItems,
    ...qwikItems,
    ...freshItems,
    ...otherFrameworks,
  ].forEach((item) => addDetected(frameworks, item));

  buildItems.forEach((item) => {
    if (item.category === '构建工具') {
      addDetected(buildTools, item);
    } else {
      addDetected(frameworks, item);
    }
  });

  uiItems.forEach((item) => addDetected(uiLibraries, item));
  stateItems.forEach((item) => addDetected(stateManagement, item));
  routerItems.forEach((item) => addDetected(routers, item));
  deployItems.forEach((item) => addDetected(deployment, item));

  const generator = getMetaContent(metaTags, 'generator');
  if (generator) hints.push(`meta:generator=${generator}`);
  if (document.querySelector('link[rel="manifest"]')) hints.push('PWA:manifest');
  if ('serviceWorker' in navigator) hints.push('PWA:serviceWorker');
  if (document.querySelector('script[type="importmap"]')) hints.push('importmap');
  if (detectImportMetaEnvUsage()) hints.push('import.meta.env');

  const allUrls = [...scripts, ...stylesheets, ...resources.map((entry) => entry.name)];
  const dependencies = detectCDNDependencies(allUrls);

  const packageJson = await fetchSameOriginPackageJson();
  if (packageJson) {
    dependencies.push(...detectDependenciesFromPackageJson(packageJson));
    hints.push('package.json:loaded');
  }

  return {
    target,
    timestamp: now,
    env: collectEnvInfo(),
    documentInfo: collectDocumentInfo(),
    meta: metaTags,
    scripts,
    stylesheets,
    resources,
    globals,
    storage: collectStorageKeys(),
    frameworks: Array.from(frameworks.values()),
    buildTools: Array.from(buildTools.values()),
    uiLibraries: Array.from(uiLibraries.values()),
    stateManagement: Array.from(stateManagement.values()),
    routers: Array.from(routers.values()),
    deployment: Array.from(deployment.values()),
    dependencies,
    hints,
  };
};
