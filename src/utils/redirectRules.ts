/**
 * 请求重定向规则管理工具
 */

export interface RedirectRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'url' | 'file' | 'directory';
  source: string; // 源URL或URL模式
  target: string; // 目标URL或本地文件路径
  priority: number; // 优先级，数字越大优先级越高
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
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
 * 验证规则格式
 */
export function validateRule(rule: Partial<RedirectRule>): { valid: boolean; error?: string } {
  if (!rule.name || !rule.name.trim()) {
    return { valid: false, error: '规则名称不能为空' };
  }
  
  if (!rule.source || !rule.source.trim()) {
    return { valid: false, error: '源URL不能为空' };
  }
  
  if (!rule.target || !rule.target.trim()) {
    return { valid: false, error: '目标URL或文件路径不能为空' };
  }
  
  // 验证URL格式（简单验证）
  try {
    if (rule.type === 'url') {
      new URL(rule.target);
    } else if (rule.type === 'file') {
      // 文件路径验证：不能为空，不能包含特殊字符
      const cleanPath = rule.target.trim().replace(/^\/+/, '');
      if (!cleanPath) {
        return { valid: false, error: '文件路径不能为空' };
      }
      // 检查是否包含无效字符
      if (cleanPath.includes('..') || cleanPath.includes('//')) {
        return { valid: false, error: '文件路径包含无效字符' };
      }
    }
  } catch (e) {
    return { valid: false, error: '目标URL格式无效' };
  }
  
  return { valid: true };
}

/**
 * 规则ID范围：10000-20000，避免与其他规则冲突
 */
const RULE_ID_BASE = 10000;
const RULE_ID_MAX = 20000;

/**
 * 检查URL模式是否包含通配符或正则表达式
 */
function isComplexPattern(pattern: string): boolean {
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
 * 将规则转换为 declarativeNetRequest 格式
 */
export function convertToDeclarativeNetRequestRule(rule: RedirectRule, index: number): chrome.declarativeNetRequest.Rule {
  // 使用固定范围生成ID，避免冲突
  const ruleId = Math.min(RULE_ID_BASE + index, RULE_ID_MAX);
  
  // 处理URL模式匹配
  let urlFilter = rule.source;
  
  // 如果是目录映射，需要处理路径匹配
  if (rule.type === 'directory') {
    // 目录映射：匹配所有以 source 开头的URL
    // 移除末尾的 *（如果存在），因为 urlFilter 不支持通配符
    urlFilter = rule.source.replace(/\*$/, '');
  }
  
  // 验证 URL filter 格式
  // declarativeNetRequest 的 urlFilter 不支持通配符，需要使用 urlMatches 或手动处理
  // 为了简化，我们使用 urlFilter，但需要确保格式正确
  
  // 处理目标URL
  let redirectUrl: string | undefined;
  let regexSubstitution: string | undefined;
  
  if (rule.type === 'file') {
    // 对于本地文件，需要使用扩展资源路径
    // 注意：文件必须在扩展包中，路径相对于扩展根目录
    // 例如：如果文件在 dist/assets/mock.json，target 应该是 "assets/mock.json"
    if (!rule.target || !rule.target.trim()) {
      throw new Error('文件映射规则的目标路径不能为空');
    }
    // 确保路径不以 / 开头（chrome.runtime.getURL 会自动添加）
    const cleanPath = rule.target.trim().replace(/^\/+/, '');
    if (!cleanPath) {
      throw new Error('文件映射规则的目标路径无效');
    }
    redirectUrl = chrome.runtime.getURL(cleanPath);
  } else if (rule.type === 'directory') {
    // 目录映射：检查是否包含替换变量（$1, $2等）
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
      console.log(`[重定向] 目录映射替换 - 源: "${rule.source}"`);
      console.log(`[重定向] 目标: "${rule.target}"`);
      console.log(`[重定向] 转换后替换: ${regexSubstitution}`);
    } else {
      // 检查是否是简单的反向代理场景（域名:端口 -> 域名）
      // 例如：127.0.0.1:3355 -> pre-air.1688.com
      const sourceTrimmed = rule.source.trim();
      const targetTrimmed = rule.target.trim();
      
      // 检查源是否是 host:port 格式（不包含协议和路径）
      const hostPortPattern = /^([^:\/]+):(\d+)$/;
      const sourceMatch = sourceTrimmed.match(hostPortPattern);
      
      if (sourceMatch && !sourceTrimmed.includes('/') && !sourceTrimmed.includes('*')) {
        // 反向代理场景：使用捕获组保持路径和查询参数
        // 使用 regexSubstitution 来保持路径（\1 是路径部分）
        regexSubstitution = targetTrimmed.match(/^https?:\/\//) 
          ? `${targetTrimmed}\\1`  // 如果目标包含协议，直接使用
          : `https://${targetTrimmed}\\1`; // 否则添加 https://
        
        console.log(`[重定向] 检测到反向代理场景 - 源: ${sourceTrimmed}, 目标: ${targetTrimmed}`);
        console.log(`[重定向] 替换字符串: ${regexSubstitution}`);
      } else {
        // 简单替换，直接使用目标URL
        redirectUrl = rule.target;
        // 如果目标URL缺少协议，添加 http://
        if (!redirectUrl.match(/^https?:\/\//)) {
          redirectUrl = `http://${redirectUrl}`;
        }
      }
    }
  } else {
    // URL映射：清理目标URL
    redirectUrl = rule.target.trim();
  }
  
  // 构建条件 - 使用标准资源类型配置
  const condition: chrome.declarativeNetRequest.RuleCondition = {
    resourceTypes: [
      chrome.declarativeNetRequest.ResourceType.SCRIPT,
      chrome.declarativeNetRequest.ResourceType.STYLESHEET,
      chrome.declarativeNetRequest.ResourceType.IMAGE,
      chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
      chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
      chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
      chrome.declarativeNetRequest.ResourceType.OTHER,
    ],
  };
  
  // 根据规则类型和复杂度选择匹配方式
  const isComplex = isComplexPattern(rule.source);
  
  if (rule.type === 'directory' || isComplex) {
    // 检查是否是反向代理场景（host:port -> host）
    const sourceTrimmed = rule.source.trim();
    const hostPortPattern = /^([^:\/]+):(\d+)$/;
    const sourceMatch = sourceTrimmed.match(hostPortPattern);
    
    if (sourceMatch && !sourceTrimmed.includes('/') && !sourceTrimmed.includes('*') && !rule.target.includes('$')) {
      // 反向代理场景：127.0.0.1:3355 -> pre-air.1688.com
      const [, host, port] = sourceMatch;
      const escapedHost = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 构建正则表达式：匹配 http://host:port 或 https://host:port，捕获路径和查询参数
      condition.regexFilter = `^https?://${escapedHost}:${port}(.*)$`;
      console.log(`[重定向] 反向代理 - 源: ${host}:${port}, 正则: ${condition.regexFilter}`);
    } else {
      // 目录映射：使用 regexFilter 支持通配符和正则表达式
      // 清理源URL（移除前后空格）
      let regexPattern = rule.source.trim();
      
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
      
      // 特殊处理：如果以 /** 开头（现在是 /___DOUBLE_STAR___），应该匹配协议和域名部分
      if (regexPattern.startsWith('/___DOUBLE_STAR___')) {
        // 将开头的 /___DOUBLE_STAR___ 转换为 (.*)，匹配协议和域名
        regexPattern = regexPattern.replace(/^\/___DOUBLE_STAR___/, '(.*)');
      }
      
      // 转换剩余的通配符标记
      regexPattern = regexPattern
        .replace(/___DOUBLE_STAR___/g, '(.*)') // 双星号转换为捕获组，匹配任意字符包括斜杠
        .replace(/___SINGLE_STAR___/g, '([^/]*)'); // 单星号转换为捕获组，匹配非斜杠字符
      
      // 如果源规则以 $ 结尾，移除它（我们会自动添加）
      if (regexPattern.endsWith('$')) {
        regexPattern = regexPattern.slice(0, -1);
      }
      
      // 确保正则表达式匹配完整URL
      condition.regexFilter = `^${regexPattern}$`;
      
      // 调试输出：显示转换后的正则表达式和捕获组信息
      const captureGroupCount = (regexPattern.match(/\(/g) || []).length;
      console.log(`[重定向] 目录映射转换 - 源: "${rule.source}"`);
      console.log(`[重定向] 转换后正则: ${condition.regexFilter}`);
      console.log(`[重定向] 捕获组数量: ${captureGroupCount}`);
    }
    
    // 调试输出：显示转换后的正则表达式
    console.log(`[重定向] 目录映射转换 - 源: ${rule.source}, 转换后正则: ${condition.regexFilter}`);
  } else if (rule.type === 'url') {
    // URL映射：对于完整URL，必须使用 regexFilter 进行精确匹配
    // urlFilter 是前缀匹配，不适合完整URL的精确匹配
    // 清理URL（移除前后空格）
    const cleanUrl = rule.source.trim();
    // 转义特殊字符，确保精确匹配
    const escapedUrl = cleanUrl
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    condition.regexFilter = `^${escapedUrl}$`;
  } else {
    // 文件映射：使用 urlFilter 进行前缀匹配
    condition.urlFilter = urlFilter;
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
      // 等待一下确保移除完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
          const actionInfo = (rule.action as any).redirect?.url 
            ? `→ ${(rule.action as any).redirect.url}`
            : (rule.action as any).redirect?.regexSubstitution
            ? `→ regexSubstitution: ${(rule.action as any).redirect.regexSubstitution}`
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
