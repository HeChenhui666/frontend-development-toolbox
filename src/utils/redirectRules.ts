/**
 * 请求重定向规则管理工具
 */

/** 请求/响应头修改操作 */
export interface HeaderOperation {
  /** 操作类型 */
  operation: 'set' | 'remove' | 'append';
  /** Header 名称 */
  header: string;
  /** Header 值（remove 操作时可选） */
  value?: string;
}

export interface RedirectRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'url' | 'header';
  source: string; // 源URL（url 类型为重定向源，header 类型为匹配 URL 模式）
  target: string; // 目标URL（url 类型必填，header 类型可为空）
  priority: number; // 优先级，数字越大优先级越高
  /** 请求头修改（仅 header 类型使用） */
  requestHeaders?: HeaderOperation[];
  /** 响应头修改（仅 header 类型使用） */
  responseHeaders?: HeaderOperation[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'redirect-rules';
const MAX_RULES = 100; // 最大规则数量限制

/**
 * 获取所有规则
 */
export async function getRedirectRules(): Promise<RedirectRule[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || [];
  } catch (error) {
    console.error('获取重定向规则失败:', error);
    return [];
  }
}

/**
 * 保存所有规则
 */
export async function saveRedirectRules(rules: RedirectRule[]): Promise<boolean> {
  try {
    // 限制规则数量
    const limitedRules = rules.slice(0, MAX_RULES);
    await chrome.storage.local.set({ [STORAGE_KEY]: limitedRules });
    return true;
  } catch (error) {
    console.error('保存重定向规则失败:', error);
    return false;
  }
}

/**
 * 添加规则
 */
export async function addRedirectRule(rule: Omit<RedirectRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RedirectRule | null> {
  try {
    const rules = await getRedirectRules();
    const newRule: RedirectRule = {
      ...rule,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `rule_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    rules.push(newRule);
    await saveRedirectRules(rules);
    return newRule;
  } catch (error) {
    console.error('添加重定向规则失败:', error);
    return null;
  }
}

/**
 * 更新规则
 */
export async function updateRedirectRule(id: string, updates: Partial<Omit<RedirectRule, 'id' | 'createdAt'>>): Promise<boolean> {
  try {
    const rules = await getRedirectRules();
    const index = rules.findIndex(r => r.id === id);
    
    if (index === -1) {
      return false;
    }
    
    rules[index] = {
      ...rules[index],
      ...updates,
      updatedAt: Date.now(),
    };
    
    await saveRedirectRules(rules);
    return true;
  } catch (error) {
    console.error('更新重定向规则失败:', error);
    return false;
  }
}

/**
 * 删除规则
 */
export async function deleteRedirectRule(id: string): Promise<boolean> {
  try {
    const rules = await getRedirectRules();
    const filtered = rules.filter(r => r.id !== id);
    await saveRedirectRules(filtered);
    return true;
  } catch (error) {
    console.error('删除重定向规则失败:', error);
    return false;
  }
}

/**
 * 启用/禁用规则
 */
export async function toggleRuleEnabled(id: string, enabled: boolean): Promise<boolean> {
  return updateRedirectRule(id, { enabled });
}

/**
 * 检查是否是正则表达式模式（包含通配符或正则特征）
 */
function isRegexPattern(pattern: string): boolean {
  // 检查是否包含通配符
  if (pattern.includes('*') || pattern.includes('**')) {
    return true;
  }
  // 检查是否包含正则表达式特征
  if (pattern.startsWith('^') || pattern.includes('(') || pattern.includes('[')) {
    return true;
  }
  return false;
}

/**
 * 验证规则格式
 */
export function validateRule(rule: Partial<RedirectRule>): { valid: boolean; error?: string } {
  if (!rule.name || !rule.name.trim()) {
    return { valid: false, error: '规则名称不能为空' };
  }
  
  if (!rule.source || !rule.source.trim()) {
    return { valid: false, error: '源URL或正则表达式不能为空' };
  }

  // ── Header 修改类型 ──
  if (rule.type === 'header') {
    const hasRequestHeaders = rule.requestHeaders && rule.requestHeaders.length > 0;
    const hasResponseHeaders = rule.responseHeaders && rule.responseHeaders.length > 0;
    if (!hasRequestHeaders && !hasResponseHeaders) {
      return { valid: false, error: '至少需要配置一条请求头或响应头修改' };
    }
    const allHeaders = [...(rule.requestHeaders || []), ...(rule.responseHeaders || [])];
    for (const header of allHeaders) {
      if (!header.header?.trim()) {
        return { valid: false, error: 'Header 名称不能为空' };
      }
      if (header.operation !== 'remove' && !header.value?.trim()) {
        return { valid: false, error: `Header "${header.header}" 的值不能为空（非 remove 操作）` };
      }
    }
    return { valid: true };
  }

  // ── URL 重定向类型 ──
  if (!rule.target || !rule.target.trim()) {
    return { valid: false, error: '目标URL不能为空' };
  }
  
  const isRegex = isRegexPattern(rule.source);
  
  if (!isRegex) {
    try {
      new URL(rule.target);
    } catch {
      return { valid: false, error: '目标URL格式无效' };
    }
  } else {
    try {
      const testPattern = convertPatternToRegex(rule.source);
      new RegExp(testPattern);
    } catch {
      return { valid: false, error: '源正则表达式格式无效' };
    }
    if (rule.target) {
      const allowedProtocols = ['http://', 'https://', 'ws://', 'wss://'];
      if (!allowedProtocols.some(p => rule.target!.startsWith(p))) {
        return { valid: false, error: '目标 URL 必须使用 http/https/ws/wss 协议' };
      }
    }
  }
  
  return { valid: true };
}

/**
 * 规则ID范围：10000-20000，避免与其他规则冲突
 */
const RULE_ID_BASE = 10000;
const RULE_ID_MAX = 20000;

/**
 * 将通配符模式转换为正则表达式
 * @param pattern 源模式，支持通配符语法：* 匹配单个路径段，** 匹配任意路径
 * @returns 转换后的正则表达式字符串（不包含 ^ 和 $）
 */
function convertPatternToRegex(pattern: string): string {
  // 清理源URL（移除前后空格）
  let regexPattern = pattern.trim();
  
  // 如果源规则以 ^ 开头，说明是正则表达式格式
  if (regexPattern.startsWith('^')) {
    // 移除开头的 ^，因为我们会自动添加
    regexPattern = regexPattern.slice(1).trim();
  }
  
  // 处理通配符转换
  // ** 表示匹配任意路径（包括斜杠），转换为 (.*)
  // * 表示匹配单个路径段（不包括斜杠），转换为 ([^/]*)
  // 注意：需要先标记所有通配符，再统一转换，避免已转换的捕获组被再次处理
  // 先标记所有通配符
  regexPattern = regexPattern
    .replace(/\*\*/g, '___DOUBLE_STAR___') // 临时标记双星号
    .replace(/\*/g, '___SINGLE_STAR___'); // 临时标记单星号

  // 转义正则特殊字符（排除已标记的通配符占位符）
  regexPattern = regexPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  
  // 特殊处理：如果以 /** 开头（现在是 /___DOUBLE_STAR___），应该匹配协议和域名部分
  if (regexPattern.startsWith('/___DOUBLE_STAR___')) {
    // 将开头的 /___DOUBLE_STAR___ 转换为 (.*)，匹配协议和域名（包括结尾斜杠）
    // 注意：这里匹配的是整个协议+域名+路径前缀，所以不需要额外的斜杠
    regexPattern = regexPattern.replace(/^\/___DOUBLE_STAR___/, '(.*)');
  } else if (regexPattern.startsWith('___DOUBLE_STAR___')) {
    // 如果直接以 ** 开头，也转换为 (.*)
    regexPattern = regexPattern.replace(/^___DOUBLE_STAR___/, '(.*)');
  }
  
  // 转换剩余的通配符标记
  regexPattern = regexPattern
    .replace(/___DOUBLE_STAR___/g, '(.*)') // 双星号转换为捕获组，匹配任意字符包括斜杠
    .replace(/___SINGLE_STAR___/g, '([^/]*)'); // 单星号转换为捕获组，匹配非斜杠字符
  
  // 如果源规则以 $ 结尾，移除它（我们会自动添加）
  if (regexPattern.endsWith('$')) {
    regexPattern = regexPattern.slice(0, -1);
  }
  
  return regexPattern;
}

/**
 * 将规则转换为 declarativeNetRequest 格式
 */
export function convertToDeclarativeNetRequestRule(rule: RedirectRule, index: number): chrome.declarativeNetRequest.Rule {
  // 使用固定范围生成ID，避免冲突
  const ruleId = Math.min(RULE_ID_BASE + index, RULE_ID_MAX);

  // 构建条件 - 使用标准资源类型配置
  const standardResourceTypes = [
    chrome.declarativeNetRequest.ResourceType.SCRIPT,
    chrome.declarativeNetRequest.ResourceType.STYLESHEET,
    chrome.declarativeNetRequest.ResourceType.IMAGE,
    chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
    chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
    chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
    chrome.declarativeNetRequest.ResourceType.OTHER,
  ];

  // ── Header 修改类型 ──
  if (rule.type === 'header') {
    const condition: chrome.declarativeNetRequest.RuleCondition = {
      resourceTypes: standardResourceTypes,
    };
    // 使用 urlFilter 做前缀匹配（Header 规则通常匹配域名或路径前缀）
    const isRegex = isRegexPattern(rule.source);
    if (isRegex) {
      const regexPattern = convertPatternToRegex(rule.source);
      condition.regexFilter = `^${regexPattern}$`;
    } else {
      condition.urlFilter = rule.source.trim();
    }

    const toHeaderInfo = (ops: HeaderOperation[] | undefined) =>
      (ops || []).map((op) => ({
        header: op.header,
        operation: op.operation === 'remove'
          ? chrome.declarativeNetRequest.HeaderOperation.REMOVE
          : op.operation === 'append'
            ? chrome.declarativeNetRequest.HeaderOperation.APPEND
            : chrome.declarativeNetRequest.HeaderOperation.SET,
        ...(op.operation !== 'remove' && op.value ? { value: op.value } : {}),
      }));

    const requestHeaders = toHeaderInfo(rule.requestHeaders);
    const responseHeaders = toHeaderInfo(rule.responseHeaders);

    return {
      id: ruleId,
      priority: Math.min(rule.priority, 2147483647),
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        ...(requestHeaders.length > 0 ? { requestHeaders } : {}),
        ...(responseHeaders.length > 0 ? { responseHeaders } : {}),
      },
      condition,
    };
  }

  // ── URL 重定向类型 ──
  const condition: chrome.declarativeNetRequest.RuleCondition = {
    resourceTypes: standardResourceTypes,
  };
  
  const isRegex = isRegexPattern(rule.source);
  let redirectUrl: string | undefined;
  let regexSubstitution: string | undefined;
  
  if (isRegex) {
    // 正则表达式模式：使用 regexFilter 和 regexSubstitution
    const regexPattern = convertPatternToRegex(rule.source);
    condition.regexFilter = `^${regexPattern}$`;
    
    // 检查目标是否包含捕获组引用（$1, $2等）
    if (rule.target.includes('$')) {
      // 使用 regexSubstitution 支持捕获组替换
      // 将 $1, $2 等转换为 \1, \2（Chrome API 使用反斜杠）
      regexSubstitution = rule.target
        .trim()
        .replace(/\$(\d+)/g, '\\$1');
      
      // 如果目标URL缺少协议，添加 http://
      if (!regexSubstitution.match(/^https?:\/\//)) {
        regexSubstitution = `http://${regexSubstitution}`;
      }
      
      console.log(`[重定向] 正则映射替换 - 源: "${rule.source}"`);
      console.log(`[重定向] 转换后正则: ${condition.regexFilter}`);
      console.log(`[重定向] 目标: "${rule.target}"`);
      console.log(`[重定向] 转换后替换: ${regexSubstitution}`);
    } else {
      // 没有捕获组，直接使用目标URL
      redirectUrl = rule.target.trim();
      // 如果目标URL缺少协议，添加 http://
      if (!redirectUrl.match(/^https?:\/\//)) {
        redirectUrl = `http://${redirectUrl}`;
      }
    }
  } else {
    // 简单URL映射：对于完整URL，必须使用 regexFilter 进行精确匹配
    // urlFilter 是前缀匹配，不适合完整URL的精确匹配
    // 清理URL（移除前后空格）
    const cleanUrl = rule.source.trim();
    // 转义特殊字符，确保精确匹配
    const escapedUrl = cleanUrl
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    condition.regexFilter = `^${escapedUrl}$`;
    
    // 简单URL映射：清理目标URL
    redirectUrl = rule.target.trim();
  }
  
  // 构建重定向动作
  const redirectAction: chrome.declarativeNetRequest.RuleAction = {
    type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
  };
  
  if (regexSubstitution) {
    // 使用 regexSubstitution 支持捕获组替换
    redirectAction.redirect = {
      regexSubstitution: regexSubstitution,
    } as chrome.declarativeNetRequest.Redirect;
  } else if (redirectUrl) {
    // 使用简单URL重定向
    redirectAction.redirect = {
      url: redirectUrl,
    } as chrome.declarativeNetRequest.Redirect;
  } else {
    throw new Error('无效的重定向目标');
  }
  
  return {
    id: ruleId,
    priority: Math.min(rule.priority, 2147483647), // 确保优先级在有效范围内
    action: redirectAction,
    condition,
  };
}

/**
 * 应用所有启用的规则到 declarativeNetRequest
 */
export async function applyRulesToDeclarativeNetRequest(): Promise<boolean> {
  try {
    if (!chrome.declarativeNetRequest) {
      console.warn('declarativeNetRequest API不可用');
      return false;
    }

    const rules = await getRedirectRules();
    const enabledRules = rules.filter(r => r.enabled);
    
    // 只移除我们自己的规则（ID范围在 10000-20000）
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ourRuleIds = existingRules
      .filter(r => r.id >= RULE_ID_BASE && r.id < RULE_ID_MAX)
      .map(r => r.id);
    
    // 先移除我们自己的现有规则（必须完全移除后再添加，避免ID冲突）
    if (ourRuleIds.length > 0) {
      console.log(`[重定向] 移除 ${ourRuleIds.length} 条旧规则:`, ourRuleIds);
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ourRuleIds,
      });
      // 验证是否真的移除了
      const verifyRemoved = await chrome.declarativeNetRequest.getDynamicRules();
      const remainingIds = verifyRemoved
        .filter(r => r.id >= RULE_ID_BASE && r.id < RULE_ID_MAX)
        .map(r => r.id);
      if (remainingIds.length > 0) {
        console.warn(`[重定向] 警告：仍有 ${remainingIds.length} 条规则未移除:`, remainingIds);
        // 再次尝试移除
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: remainingIds,
        });
      }
    }
    
    // 转换并添加新规则（传入索引以确保ID唯一）
    const dnrRules = enabledRules.map((rule, index) => {
      try {
        return convertToDeclarativeNetRequestRule(rule, index);
      } catch (error) {
        console.error(`转换规则失败 [${rule.name}]:`, error);
        return null;
      }
    }).filter((rule): rule is chrome.declarativeNetRequest.Rule => rule !== null);
    
    if (dnrRules.length > 0) {
      // 检查是否有重复的ID
      const ruleIds = dnrRules.map(r => r.id);
      const uniqueIds = new Set(ruleIds);
      if (ruleIds.length !== uniqueIds.size) {
        console.error('[重定向] 错误：规则ID重复！', ruleIds);
        throw new Error('规则ID重复，请检查规则配置');
      }
      
      try {
        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: dnrRules,
        });
        console.log(`[重定向] 代理规则已更新: ${dnrRules.length} 条规则生效`);
        
        // 验证规则是否真的被添加
        const verifyRules = await chrome.declarativeNetRequest.getDynamicRules();
        const ourVerifiedRules = verifyRules.filter(r => r.id >= RULE_ID_BASE && r.id < RULE_ID_MAX);
        console.log(`[重定向] 验证：实际生效的规则数: ${ourVerifiedRules.length}`);
        
        if (ourVerifiedRules.length !== dnrRules.length) {
          console.warn(`[重定向] 警告：添加的规则数(${dnrRules.length})与实际生效的规则数(${ourVerifiedRules.length})不一致`);
        }
        
        // 输出详细的规则信息用于调试
        dnrRules.forEach((rule, idx) => {
          const conditionInfo = rule.condition.regexFilter 
            ? `regexFilter: ${rule.condition.regexFilter}`
            : rule.condition.urlFilter 
            ? `urlFilter: ${rule.condition.urlFilter}`
            : '未知';
          const actionRedirect = (rule.action as { redirect?: { url?: string; regexSubstitution?: string } }).redirect;
          const actionInfo = actionRedirect?.url 
            ? `→ ${actionRedirect.url}`
            : actionRedirect?.regexSubstitution
            ? `→ regexSubstitution: ${actionRedirect.regexSubstitution}`
            : '未知';
          const resourceTypes = rule.condition.resourceTypes?.join(', ') || '未知';
          
          console.log(`[重定向] 规则 ${idx + 1} (ID: ${rule.id}, 优先级: ${rule.priority}):`);
          console.log(`  匹配条件: ${conditionInfo}`);
          console.log(`  重定向动作: ${actionInfo}`);
          console.log(`  资源类型: ${resourceTypes}`);
        });
      } catch (error) {
        console.error('[重定向] 更新规则失败:', error);
        if (error instanceof Error) {
          console.error('[重定向] 错误详情:', error.message, error.stack);
        }
        throw error;
      }
    } else if (enabledRules.length > 0) {
      console.warn('[重定向] 有启用的规则，但转换后没有有效规则');
      console.warn('[重定向] 启用的规则:', enabledRules.map(r => ({ name: r.name, source: r.source, type: r.type })));
    }
    
    return true;
  } catch (error) {
    console.error('应用规则到 declarativeNetRequest 失败:', error);
    return false;
  }
}
