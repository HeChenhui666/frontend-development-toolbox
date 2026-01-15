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

// 页面内翻译开关的storage key
const PAGE_TRANSLATE_ENABLED_KEY = 'translator-page-translate-enabled';

// 获取页面内翻译开关状态
const getPageTranslateEnabled = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([PAGE_TRANSLATE_ENABLED_KEY], (result) => {
        const enabled = result[PAGE_TRANSLATE_ENABLED_KEY] !== false; // 默认开启
        resolve(enabled);
      });
    } else {
      // 降级到localStorage
      try {
        const saved = localStorage.getItem(PAGE_TRANSLATE_ENABLED_KEY);
        resolve(saved !== null ? saved === 'true' : true);
      } catch (error) {
        console.error('[翻译扩展] 获取页面内翻译开关状态失败:', error);
        resolve(true);
      }
    }
  });
};

// 翻译气泡类
class TranslateBubble {
  private bubble: HTMLElement | null = null;
  private triggerButton: HTMLElement | null = null;
  private selectedText: string = '';
  private targetLang: string = 'en';
  private isTranslating: boolean = false;
  private enabled: boolean = true;
  private textSelectionHandler: ((e: MouseEvent) => void) | null = null;
  private documentClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // 初始化时读取开关状态
    this.enabled = await getPageTranslateEnabled();
    
    // 创建绑定的事件处理器
    this.textSelectionHandler = this.handleTextSelection.bind(this);
    this.documentClickHandler = this.handleDocumentClick.bind(this);
    
    if (this.enabled) {
      // 监听文本选择
      document.addEventListener('mouseup', this.textSelectionHandler, true);
      // 点击其他地方时隐藏气泡
      document.addEventListener('click', this.documentClickHandler, true);
    }
    
    // 监听chrome.storage变化（当开关状态改变时触发）
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes[PAGE_TRANSLATE_ENABLED_KEY]) {
          const enabled = changes[PAGE_TRANSLATE_ENABLED_KEY].newValue !== false;
          this.setEnabled(enabled);
        }
      });
    }
    
    // 监听来自popup的消息
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'TOGGLE_PAGE_TRANSLATE') {
          this.setEnabled(message.enabled);
        }
        return true; // 保持消息通道开放
      });
    }
    
    console.log('[翻译扩展] 事件监听器已绑定，页面内翻译:', this.enabled ? '已开启' : '已关闭');
  }

  private setEnabled(enabled: boolean) {
    if (this.enabled === enabled) return;
    
    this.enabled = enabled;
    
    if (enabled) {
      // 开启：添加事件监听器
      if (this.textSelectionHandler && this.documentClickHandler) {
        document.addEventListener('mouseup', this.textSelectionHandler, true);
        document.addEventListener('click', this.documentClickHandler, true);
      }
      console.log('[翻译扩展] 页面内翻译已开启');
    } else {
      // 关闭：移除事件监听器，隐藏所有UI
      if (this.textSelectionHandler && this.documentClickHandler) {
        document.removeEventListener('mouseup', this.textSelectionHandler, true);
        document.removeEventListener('click', this.documentClickHandler, true);
      }
      this.hideTriggerButton();
      this.hideBubble();
      console.log('[翻译扩展] 页面内翻译已关闭');
    }
  }

  private handleTextSelection(e: MouseEvent) {
    // 如果功能未启用，不处理
    if (!this.enabled) {
      return;
    }
    
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
      
      // 获取选中文本的位置，将按钮显示在选中文本的上方中间
      try {
        const range = selection.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          // getBoundingClientRect() 返回的是相对于视口的坐标（fixed定位需要）
          // 计算选中文本的中心位置（视窗坐标）
          const centerX = rect.left + rect.width / 2;
          const topY = rect.top;
          
          // console.log('[翻译扩展] 选中文本位置 - left:', rect.left, 'top:', rect.top, 'width:', rect.width, 'height:', rect.height);
          // console.log('[翻译扩展] 显示触发按钮，位置:', centerX, topY);
          const bottomY = rect.bottom;
          this.showTriggerButton(centerX, topY, bottomY);
        } else {
          // 如果无法获取范围，使用鼠标位置作为后备（视窗坐标）
          this.showTriggerButton(e.clientX, e.clientY - 40, e.clientY);
        }
      } catch (err) {
        console.error('[翻译扩展] 获取选择范围失败:', err);
        // 如果获取范围失败，使用鼠标位置作为后备（视窗坐标）
        this.showTriggerButton(e.clientX, e.clientY - 40, e.clientY);
      }
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

  private showTriggerButton(x: number, topY: number, bottomY: number) {
    // console.log('[翻译扩展] showTriggerButton 被调用，位置:', x, topY, bottomY);
    // x 是选中文本的中心（视窗坐标）
    // topY 是选中文本的顶部（视窗坐标）
    // bottomY 是选中文本的底部（视窗坐标）

    // 如果触发按钮已存在，先移除
    if (this.triggerButton) {
      this.triggerButton.remove();
    }

    // 创建触发按钮
    this.triggerButton = document.createElement('button');
    this.triggerButton.className = 'translate-trigger-btn';
    this.triggerButton.textContent = '在线翻译';
    this.triggerButton.title = '点击翻译选中的文本';
    this.triggerButton.style.position = 'fixed'; // 使用fixed定位

    // 添加到页面（先添加才能获取尺寸）
    document.body.appendChild(this.triggerButton);

    // 获取按钮尺寸（需要等待一帧以确保尺寸正确）
    // 使用 requestAnimationFrame 确保按钮已渲染
    requestAnimationFrame(() => {
      if (!this.triggerButton) return;
      
      const buttonRect = this.triggerButton.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 设置位置：按钮中心对齐选中文本中心，优先显示在选中文本上方
      // x 是选中文本的中心（视窗坐标），按钮中心对齐
      let buttonX = x - buttonRect.width / 2;
      // y 是选中文本的顶部（视窗坐标），按钮显示在上方
      let buttonY = topY - buttonRect.height - 8;

      // 调整水平位置
      if (buttonX + buttonRect.width > viewportWidth) {
        buttonX = viewportWidth - buttonRect.width - 10;
      }
      if (buttonX < 10) {
        buttonX = 10;
      }

      // 调整垂直位置
      // 如果按钮会被推到视口上方（buttonY < 10），改为显示在选中文本下方
      if (buttonY < 10) {
        // 显示在选中文本下方（bottomY 是选中文本的底部）
        buttonY = bottomY + 8;
        
        // 如果下方也超出视口，则显示在视口顶部
        if (buttonY + buttonRect.height > viewportHeight) {
          buttonY = 10;
        }
      }
      // 如果按钮超出视口底部，调整到视口底部
      else if (buttonY + buttonRect.height > viewportHeight) {
        buttonY = viewportHeight - buttonRect.height - 10;
      }

      // console.log('[翻译扩展] 按钮最终位置 - x:', buttonX, 'y:', buttonY, '按钮尺寸:', buttonRect.width, buttonRect.height);
      this.triggerButton.style.left = `${buttonX}px`;
      this.triggerButton.style.top = `${buttonY}px`;
    });

    // 绑定点击事件
    this.triggerButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentButton = this.triggerButton; // 保存引用，因为hideTriggerButton会清空
      this.hideTriggerButton();
      // 获取选中文本的视窗坐标用于显示气泡
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // 使用视窗坐标（fixed定位）
        const bubbleX = rect.left + rect.width / 2;
        const bubbleY = rect.top;
        this.showBubble(bubbleX, bubbleY);
      } else if (currentButton) {
        // 后备方案：使用触发按钮的位置
        const buttonRect = currentButton.getBoundingClientRect();
        this.showBubble(buttonRect.left + buttonRect.width / 2, buttonRect.top);
      }
    });

    // 阻止事件冒泡
    this.triggerButton.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
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
    this.bubble.style.position = 'fixed'; // 使用fixed定位
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

    // 设置位置（x和y已经是视窗坐标）
    this.bubble.style.left = `${x}px`;
    this.bubble.style.top = `${y + 10}px`; // 显示在选中文本下方

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

    // 调整水平位置（fixed定位，直接使用视窗坐标）
    // 将气泡中心对齐到x位置，所以需要减去一半宽度
    const bubbleCenterX = left;
    const bubbleLeft = bubbleCenterX - rect.width / 2;
    
    if (bubbleLeft + rect.width > viewportWidth) {
      left = viewportWidth - rect.width / 2 - 10;
    }
    if (bubbleLeft < 10) {
      left = rect.width / 2 + 10;
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
