// 注意：CSS通过manifest.json加载，不需要在这里导入

// 翻译API函数
async function translateText(text: string, targetLang: string = 'en'): Promise<string | null> {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
        text
      )}`
    );
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {
    console.error('翻译失败:', error);
    return null;
  }
}

// 支持的语言列表
const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: '英语' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'es', name: '西班牙语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'ru', name: '俄语' },
  { code: 'ar', name: '阿拉伯语' },
  { code: 'it', name: '意大利语' },
  { code: 'nl', name: '荷兰语' },
  { code: 'pl', name: '波兰语' },
  { code: 'tr', name: '土耳其语' },
  { code: 'vi', name: '越南语' },
  { code: 'th', name: '泰语' },
  { code: 'hi', name: '印地语' },
];

// 翻译气泡类
class TranslateBubble {
  private bubble: HTMLElement | null = null;
  private triggerButton: HTMLElement | null = null;
  private selectedText: string = '';
  private targetLang: string = 'en';
  private isTranslating: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    // console.log('[翻译扩展] 初始化事件监听器');
    // 监听文本选择
    document.addEventListener('mouseup', this.handleTextSelection.bind(this), true);
    // 点击其他地方时隐藏气泡
    document.addEventListener('click', this.handleDocumentClick.bind(this), true);
    console.log('[翻译扩展] 事件监听器已绑定');
  }

  private handleTextSelection(e: MouseEvent) {
    // 如果点击的是气泡或触发按钮本身，不处理
    const target = e.target as HTMLElement;
    if (target && (target.closest('.translate-bubble') || target.closest('.translate-trigger-btn'))) {
      return;
    }

    // 延迟一点时间，确保选择已经完成
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection) {
        return;
      }

      const selectedText = selection.toString().trim();
      // console.log('[翻译扩展] 选中文本:', selectedText);

      // 如果选中的文本为空，隐藏按钮和气泡
      if (!selectedText) {
        this.hideTriggerButton();
        this.hideBubble();
        return;
      }

      // 如果选中的文本太短，不显示按钮
      if (selectedText.length < 1) {
        this.hideTriggerButton();
        this.hideBubble();
        return;
      }

      this.selectedText = selectedText;
      // 使用鼠标位置，如果没有则使用选择范围的边界框
      let x = e.pageX;
      let y = e.pageY;

      if (!x || !y || x === 0 || y === 0) {
        try {
          const range = selection.getRangeAt(0);
          if (range) {
            const rect = range.getBoundingClientRect();
            x = rect.right + window.scrollX;
            y = rect.top + window.scrollY;
          }
        } catch (err) {
          console.error('[翻译扩展] 获取选择范围失败:', err);
          // 如果获取范围失败，使用鼠标位置
          x = e.clientX + window.scrollX;
          y = e.clientY + window.scrollY;
        }
      }

      // console.log('[翻译扩展] 显示触发按钮，位置:', x, y);
      this.showTriggerButton(x, y);
    }, 10);
  }

  private handleDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    // 如果点击的不是气泡区域或触发按钮，隐藏按钮和气泡
    if (!target.closest('.translate-bubble') && !target.closest('.translate-trigger-btn')) {
      this.hideTriggerButton();
      this.hideBubble();
    }
  }

  private showTriggerButton(x: number, y: number) {
    // console.log('[翻译扩展] showTriggerButton 被调用，位置:', x, y);

    // 如果触发按钮已存在，先移除
    if (this.triggerButton) {
      this.triggerButton.remove();
    }

    // 创建触发按钮
    this.triggerButton = document.createElement('button');
    this.triggerButton.className = 'translate-trigger-btn';
    this.triggerButton.textContent = '在线翻译';
    this.triggerButton.title = '点击翻译选中的文本';

    // 设置位置
    this.triggerButton.style.left = `${x}px`;
    this.triggerButton.style.top = `${y - 10}px`;

    // 添加到页面
    document.body.appendChild(this.triggerButton);

    // 调整位置，确保不超出视窗
    this.adjustTriggerButtonPosition();

    // 绑定点击事件
    this.triggerButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideTriggerButton();
      this.showBubble(x, y);
    });

    // 阻止事件冒泡
    this.triggerButton.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
  }

  private adjustTriggerButtonPosition() {
    if (!this.triggerButton) return;

    const rect = this.triggerButton.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = parseFloat(this.triggerButton.style.left);
    let top = parseFloat(this.triggerButton.style.top);

    // 调整水平位置
    if (left + rect.width > viewportWidth) {
      left = viewportWidth - rect.width - 10;
    }
    if (left < 10) {
      left = 10;
    }

    // 调整垂直位置
    if (top + rect.height > viewportHeight) {
      top = viewportHeight - rect.height - 10;
    }
    if (top < 10) {
      top = 10;
    }

    this.triggerButton.style.left = `${left}px`;
    this.triggerButton.style.top = `${top}px`;
  }

  private hideTriggerButton() {
    if (this.triggerButton) {
      this.triggerButton.remove();
      this.triggerButton = null;
    }
  }

  private showBubble(x: number, y: number) {
    // console.log('[翻译扩展] showBubble 被调用，位置:', x, y);

    // 如果气泡已存在，先移除
    if (this.bubble) {
      this.bubble.remove();
    }

    // 创建气泡元素
    this.bubble = document.createElement('div');
    this.bubble.className = 'translate-bubble';
    this.bubble.style.position = 'absolute';
    this.bubble.style.zIndex = '999999';
    this.bubble.innerHTML = `
      <div class="translate-bubble-header">
        <span class="translate-bubble-title">翻译<span class="translate-bubble-service-notice">使用免费版 Google 翻译服务</span></span>
        <button class="translate-bubble-close" title="关闭">×</button>
      </div>
      <div class="translate-bubble-content">
        <div class="translate-bubble-lang-select">
          <select class="translate-bubble-select">
            ${languages.map((lang) => `<option value="${lang.code}">${lang.name}</option>`).join('')}
          </select>
        </div>
        <div class="translate-bubble-result">
          <div class="translate-bubble-loading" style="display: none;">翻译中...</div>
          <div class="translate-bubble-text"></div>
        </div>
        <div class="translate-bubble-actions">
          <button class="translate-bubble-btn translate-btn">翻译</button>
          <button class="translate-bubble-btn copy-btn" style="display: none;">复制</button>
        </div>
      </div>
    `;

    // 设置位置
    this.bubble.style.left = `${x}px`;
    this.bubble.style.top = `${y - 10}px`;

    // 添加到页面
    document.body.appendChild(this.bubble);

    // 调整位置，确保不超出视窗
    this.adjustPosition();

    // 绑定事件
    const select = this.bubble.querySelector('.translate-bubble-select') as HTMLSelectElement;
    const translateBtn = this.bubble.querySelector('.translate-btn') as HTMLButtonElement;
    const copyBtn = this.bubble.querySelector('.copy-btn') as HTMLButtonElement;
    const closeBtn = this.bubble.querySelector('.translate-bubble-close') as HTMLButtonElement;

    select.value = this.targetLang;
    select.addEventListener('change', (e) => {
      this.targetLang = (e.target as HTMLSelectElement).value;
    });

    translateBtn.addEventListener('click', () => {
      this.handleTranslate();
    });

    copyBtn.addEventListener('click', () => {
      this.handleCopy();
    });

    closeBtn.addEventListener('click', () => {
      this.hideBubble();
    });

    // 阻止事件冒泡
    this.bubble.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  private adjustPosition() {
    if (!this.bubble) return;

    const rect = this.bubble.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = parseFloat(this.bubble.style.left);
    let top = parseFloat(this.bubble.style.top);

    // 调整水平位置
    if (left + rect.width > viewportWidth) {
      left = viewportWidth - rect.width - 10;
    }
    if (left < 10) {
      left = 10;
    }

    // 调整垂直位置
    if (top + rect.height > viewportHeight) {
      top = viewportHeight - rect.height - 10;
    }
    if (top < 10) {
      top = 10;
    }

    this.bubble.style.left = `${left}px`;
    this.bubble.style.top = `${top}px`;
  }

  private async handleTranslate() {
    if (!this.bubble || !this.selectedText || this.isTranslating) return;

    const loadingDiv = this.bubble.querySelector('.translate-bubble-loading') as HTMLElement;
    const resultDiv = this.bubble.querySelector('.translate-bubble-text') as HTMLElement;
    const translateBtn = this.bubble.querySelector('.translate-btn') as HTMLButtonElement;
    const copyBtn = this.bubble.querySelector('.copy-btn') as HTMLButtonElement;

    this.isTranslating = true;
    translateBtn.disabled = true;
    loadingDiv.style.display = 'block';
    resultDiv.textContent = '';
    copyBtn.style.display = 'none';

    try {
      const result = await translateText(this.selectedText, this.targetLang);
      if (result) {
        resultDiv.textContent = result;
        copyBtn.style.display = 'inline-block';
      } else {
        resultDiv.textContent = '翻译失败，请稍后重试';
      }
    } catch (error) {
      resultDiv.textContent = `翻译出错: ${error instanceof Error ? error.message : '未知错误'}`;
    } finally {
      this.isTranslating = false;
      translateBtn.disabled = false;
      loadingDiv.style.display = 'none';
    }
  }

  private async handleCopy() {
    const resultDiv = this.bubble?.querySelector('.translate-bubble-text') as HTMLElement;
    if (!resultDiv || !resultDiv.textContent) return;

    try {
      await navigator.clipboard.writeText(resultDiv.textContent);
      const copyBtn = this.bubble?.querySelector('.copy-btn') as HTMLButtonElement;
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ 已复制';
        setTimeout(() => {
          if (copyBtn) {
            copyBtn.textContent = originalText;
          }
        }, 2000);
      }
    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = resultDiv.textContent;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        console.error('复制失败:', e);
      }
      document.body.removeChild(textArea);
    }
  }

  private hideBubble() {
    if (this.bubble) {
      this.bubble.remove();
      this.bubble = null;
    }
  }
}

// 初始化翻译气泡
(function () {
  'use strict';

  // 确保只初始化一次
  if ((window as any).__translateBubbleInitialized) {
    return;
  }
  (window as any).__translateBubbleInitialized = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new TranslateBubble();
      console.log('[翻译扩展] 翻译气泡已初始化');
    });
  } else {
    new TranslateBubble();
    console.log('[翻译扩展] 翻译气泡已初始化');
  }
})();
