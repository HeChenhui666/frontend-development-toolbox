/**
 * 统一的类型安全本地存储服务。
 * 封装 localStorage 的读写操作，提供序列化/反序列化、版本迁移和错误处理。
 */

/** 数据版本配置 */
const STORAGE_VERSION_KEY = 'app-storage-version';
const CURRENT_VERSION = 2;

/** 版本迁移函数注册表 */
type MigrationFn = () => void;
const migrations: Record<number, MigrationFn> = {
  // v1 → v2：统一 key 命名规范（当前无需实际迁移，预留框架）
  2: () => {
    // 未来可在此处添加 key 重命名、数据格式转换等逻辑
  },
};

class StorageService {
  /**
   * 类型安全地从 localStorage 读取值
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 读取原始字符串（不做 JSON 解析）
   */
  getString(key: string, defaultValue: string = ''): string {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 类型安全地写入 localStorage
   */
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 写入原始字符串
   */
  setString(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 删除指定 key
   */
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 批量删除匹配前缀的 key
   */
  removeByPrefix(prefix: string): number {
    let count = 0;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) keysToRemove.push(key);
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        count++;
      });
    } catch {
      // ignore
    }
    return count;
  }

  /**
   * 检查 key 是否存在
   */
  has(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  /**
   * 获取所有 key
   */
  keys(): string[] {
    const result: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) result.push(key);
      }
    } catch {
      // ignore
    }
    return result;
  }

  /**
   * 获取 localStorage 已用/总容量估算
   */
  getStorageSize(): { usedBytes: number; totalBytes: number } {
    let usedBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          usedBytes += key.length + (localStorage.getItem(key)?.length ?? 0);
        }
      }
      // localStorage 一般是 5MB ~ 10MB
      usedBytes *= 2; // UTF-16 encoding
    } catch {
      // ignore
    }
    return { usedBytes, totalBytes: 5 * 1024 * 1024 };
  }

  /**
   * 执行版本迁移（如果需要）
   */
  runMigrations(): void {
    const savedVersion = this.get<number>(STORAGE_VERSION_KEY, 1);
    if (savedVersion >= CURRENT_VERSION) return;

    for (let version = savedVersion + 1; version <= CURRENT_VERSION; version++) {
      const migration = migrations[version];
      if (migration) {
        try {
          migration();
          console.log(`[StorageService] Migrated to v${version}`);
        } catch (error) {
          console.error(`[StorageService] Migration to v${version} failed:`, error);
          break;
        }
      }
    }
    this.set(STORAGE_VERSION_KEY, CURRENT_VERSION);
  }
}

/** 单例实例 */
export const storage = new StorageService();

export default StorageService;
