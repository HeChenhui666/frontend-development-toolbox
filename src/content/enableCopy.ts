/**
 * 注入到网页 MAIN world，解除常见防复制限制。
 * 由扩展通过 chrome.scripting.executeScript({ files, world: 'MAIN' }) 加载。
 *
 * 手段概览：
 * - CSS：全局 !important 覆盖 user-select
 * - 样式：对 DOM / Shadow DOM 节点写入 user-select:text !important（压过部分内联样式）
 * - 内联属性：移除 oncopy / oncontextmenu 等，MutationObserver 持续处理新增与变更
 * - API：重写 Event.prototype.preventDefault，使复制相关事件的 cancel 无效（捕获/冒泡阶段均生效）
 */
(function xhhEnableUnrestrictedCopy() {
  const FLAG = '__XHH_ENABLE_COPY_V1__';
  const rootWin = window as Window & Record<string, unknown>;
  if (rootWin[FLAG]) {
    return;
  }
  rootWin[FLAG] = true;

  const HANDLER_ATTRS = [
    'oncopy',
    'oncut',
    'onpaste',
    'oncontextmenu',
    'onselectstart',
    'ondragstart',
  ] as const;

  const BYPASS_PREVENT_TYPES = new Set(['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart']);

  // —— 1) CSS：覆盖常见 user-select / -webkit-user-select ——
  const STYLE_ID = 'xhh-enable-copy-style';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      'html,body,body *{',
      '-webkit-user-select:text!important;',
      '-moz-user-select:text!important;',
      'user-select:text!important;',
      '}',
      'html::before,html::after,body::before,body::after{',
      '-webkit-user-select:text!important;',
      'user-select:text!important;',
      '}',
      '::selection{background:rgba(0,120,255,.28)!important;}',
    ].join('');
    (document.head || document.documentElement).appendChild(style);
  }

  // —— 2) 内联样式强制可选中（压过部分内联 user-select）——
  const forceSelectable = (el: Element) => {
    try {
      (el as HTMLElement).style.setProperty('-webkit-user-select', 'text', 'important');
      (el as HTMLElement).style.setProperty('-moz-user-select', 'text', 'important');
      (el as HTMLElement).style.setProperty('user-select', 'text', 'important');
    } catch {
      /* ignore */
    }
  };

  const walkAndForce = (el: Element | null) => {
    if (!el) return;
    const stack: Element[] = [el];
    while (stack.length) {
      const node = stack.pop()!;
      forceSelectable(node);
      const sr = node.shadowRoot;
      if (sr) {
        for (const c of sr.querySelectorAll('*')) {
          stack.push(c);
        }
      }
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i] as Element);
      }
    }
  };

  if (document.documentElement) {
    walkAndForce(document.documentElement);
  }

  // —— 3) 移除内联事件属性 + Shadow DOM ——
  const stripHandlerAttrs = (el: Element) => {
    for (const a of HANDLER_ATTRS) {
      if (el.hasAttribute(a)) {
        el.removeAttribute(a);
      }
    }
  };

  const walkStrip = (el: Element | null) => {
    if (!el) return;
    const stack: Element[] = [el];
    while (stack.length) {
      const node = stack.pop()!;
      stripHandlerAttrs(node);
      const sr = node.shadowRoot;
      if (sr) {
        for (const c of sr.querySelectorAll('*')) {
          stack.push(c);
        }
      }
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i] as Element);
      }
    }
  };

  if (document.documentElement) {
    walkStrip(document.documentElement);
  }

  const obs = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes' && r.target instanceof Element) {
        stripHandlerAttrs(r.target);
        forceSelectable(r.target);
      }
      r.addedNodes.forEach((n) => {
        if (n instanceof Element) {
          walkStrip(n);
          walkAndForce(n);
        }
      });
    }
  });

  if (document.documentElement) {
    obs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [...HANDLER_ATTRS],
    });
  }

  // —— 4) API 劫持：对复制相关事件忽略 preventDefault ——
  const proto = Event.prototype;
  const origPreventDefault = proto.preventDefault;
  proto.preventDefault = function (this: Event) {
    if (BYPASS_PREVENT_TYPES.has(this.type)) {
      return;
    }
    return origPreventDefault.call(this);
  };
})();
