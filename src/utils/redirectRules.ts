/**
 * 请求重定向规则管理工具
 */

export interface RedirectRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'url';
  source: string; // 源URL
  target: string; // 目标URL
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
    return { valid: false, error: '目标URL不能为空' };
  }
  
  // 验证URL格式
  try {
    new URL(rule.target);
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
 * 将规则转换为 declarativeNetRequest 格式
 */
export function convertToDeclarativeNetRequestRule(rule: RedirectRule, index: number): chrome.declarativeNetRequest.Rule {
  // 使用固定范围生成ID，避免冲突
  const ruleId = Math.min(RULE_ID_BASE + index, RULE_ID_MAX);
  
  // URL映射：清理目标URL
  const redirectUrl = rule.target.trim();
  
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
  
  // URL映射：对于完整URL，必须使用 regexFilter 进行精确匹配
  // urlFilter 是前缀匹配，不适合完整URL的精确匹配
  // 清理URL（移除前后空格）
  const cleanUrl = rule.source.trim();
  // 转义特殊字符，确保精确匹配
  const escapedUrl = cleanUrl
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  condition.regexFilter = `^${escapedUrl}$`;
  
  // 构建重定向动作
  const redirectAction: chrome.declarativeNetRequest.RuleAction = {
    type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
    redirect: {
      url: redirectUrl,
    } as chrome.declarativeNetRequest.Redirect,
  };
  
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
