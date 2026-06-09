/**
 * Mod 加载器
 *
 * 负责在运行时发现、加载、校验 Mod 数据，并注册到 WorldDataRegistry。
 *
 * 加载流程：
 * 1. fetch /mods/mod-list.json → 获取 Mod 列表
 * 2. 并行 fetch 各 Mod 的 mod.json → 校验清单
 * 3. 拓扑排序解析依赖
 * 4. 按序加载数据文件 → 校验 → 注册到 WorldDataRegistry
 * 5. 发布加载进度事件
 *
 * @module shared/lib/mod
 */

import type {
  ModManifest,
  ModLoadStatus,
  ModLoadProgressEvent,
  ModLoadCompleteEvent,
  LoadedMod,
} from './ModManifest';
import { parseManifest, ModLoadError } from './ModManifest';
import {
  WorldDataRegistry,
} from '@/shared/lib/registry/WorldDataRegistry';
import type {
  WorldTypeData,
  DangerData,
  OpportunityData,
  TraitPoolData,
  FactionTemplateData,
  NamePoolData,
  RealmSystemData,
  WorldTextData,
} from '@/shared/lib/registry/WorldDataRegistry';

// ============================================
// Mod 索引类型
// ============================================

/** mod-list.json 中的条目 */
interface ModListEntry {
  id: string;
  path: string;
}

/** mod-list.json 的结构 */
interface ModList {
  mods: ModListEntry[];
}

// ============================================
// 事件类型
// ============================================

/** Mod 加载事件的回调类型 */
export type ModProgressCallback = (event: ModLoadProgressEvent) => void;
export type ModCompleteCallback = (event: ModLoadCompleteEvent) => void;

// ============================================
// ModLoader
// ============================================

/**
 * Mod 加载器
 *
 * 浏览器端 Mod 加载管线。通过 fetch 加载 public/mods/ 下的 Mod 数据。
 *
 * @example
 * ```typescript
 * const loader = new ModLoader();
 * const result = await loader.loadAll();
 * console.log(`Loaded ${result.loaded} mods, ${result.failed} failed`);
 * ```
 */
export class ModLoader {
  /** Mod 文件的基础路径 */
  private readonly basePath: string;

  /** 注册中心实例 */
  private registry: WorldDataRegistry;

  /** 已加载的 Mod 列表 */
  private loadedMods: LoadedMod[] = [];

  /** 进度回调 */
  private onProgress: ModProgressCallback | null = null;

  /** 完成回调 */
  private onComplete: ModCompleteCallback | null = null;

  /** 当前是否正在加载 */
  private loading = false;

  constructor(basePath = '/mods') {
    this.basePath = basePath;
    this.registry = WorldDataRegistry.getInstance();
  }

  /**
   * 设置加载进度回调
   */
  setProgressCallback(callback: ModProgressCallback): this {
    this.onProgress = callback;
    return this;
  }

  /**
   * 设置加载完成回调
   */
  setCompleteCallback(callback: ModCompleteCallback): this {
    this.onComplete = callback;
    return this;
  }

  /**
   * 获取已加载的 Mod 列表
   */
  getLoadedMods(): LoadedMod[] {
    return this.loadedMods;
  }

  /**
   * 检查是否正在加载
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * 加载所有 Mod
   *
   * 主入口方法。执行完整的 Mod 发现、校验、加载管线。
   *
   * 强制 Mod（required: true）加载失败会抛出 ModLoadError。
   * 非强制 Mod 失败会记录但不会阻塞。
   *
   * @returns 加载结果摘要
   * @throws {ModLoadError} 当强制 Mod 加载失败时
   */
  async loadAll(): Promise<ModLoadCompleteEvent> {
    if (this.loading) {
      console.warn('[ModLoader] 已经在加载中，跳过重复调用');
      return { loaded: this.loadedMods.filter(m => m.status === 'loaded').length, failed: this.loadedMods.filter(m => m.status === 'error').length, total: this.loadedMods.length };
    }

    this.loading = true;
    this.loadedMods = [];

    try {
      // 1. 发现 Mod
      const entries = await this.discoverMods();
      if (entries.length === 0) {
        console.warn('[ModLoader] 未发现任何 Mod，游戏数据可能不完整');
        const event: ModLoadCompleteEvent = { loaded: 0, failed: 0, total: 0 };
        this.onComplete?.(event);
        return event;
      }

      const total = entries.length;
      let loaded = 0;
      let failed = 0;
      const failedRequired: Array<{ id: string; name: string; error: string }> = [];

      // 2. 加载所有清单
      const manifests: Map<string, ModManifest> = new Map();
      for (const entry of entries) {
        this.emitProgress(loaded + failed + 1, total, entry.id);
        try {
          const manifest = await this.loadModManifest(entry.path);
          manifests.set(entry.id, manifest);
          this.loadedMods.push({ manifest, status: 'loaded' });
          loaded++;
        } catch (err) {
          failed++;
          const errorMsg = err instanceof Error ? err.message : '未知错误';
          const placeholderManifest: ModManifest = {
            id: entry.id, name: entry.id, version: '?', description: '', author: '?',
            gameVersion: '?', dependencies: [], required: false, contentTypes: [], dataFiles: {},
          };
          this.loadedMods.push({ manifest: placeholderManifest, status: 'error', error: errorMsg });

          // 检查是否为强制 Mod
          // 加载失败时无法知道 required 字段，所以需要从 manifest 中预判断
          // 实际上我们只能知道这是否是 wanjie-core（通过 id）
          if (entry.id === 'wanjie-core') {
            failedRequired.push({ id: entry.id, name: entry.id, error: errorMsg });
          }
          console.error(`[ModLoader] 加载 Mod "${entry.id}" 失败:`, errorMsg);
        }
      }

      // 2.5 检查 manifest 中标记为 required 的 Mod 是否全部加载成功
      for (const [, manifest] of manifests) {
        if (manifest.required) {
          const mod = this.loadedMods.find(m => m.manifest.id === manifest.id);
          if (mod && mod.status === 'error') {
            failedRequired.push({ id: manifest.id, name: manifest.name, error: mod.error ?? '未知错误' });
          }
        }
      }

      // 强制 Mod 失败 → 抛出致命错误
      if (failedRequired.length > 0) {
        const error = new ModLoadError(failedRequired);
        this.onComplete?.({ loaded, failed, total });
        throw error;
      }

      // 3. 解析依赖并按拓扑顺序加载数据
      const sortedIds = this.resolveDependencyOrder(
        Array.from(manifests.entries()).map(([id, m]) => ({ id, manifest: m }))
      );

      // Separate: successfully loaded manifests only
      const validMods = sortedIds
        .map(id => ({ id, manifest: manifests.get(id)! }))
        .filter(({ id }) => manifests.has(id));

      // 4. 加载数据文件并注册
      for (const { id, manifest } of validMods) {
        try {
          await this.loadModDataAndRegister(id, manifest);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : '未知错误';
          console.error(`[ModLoader] 注册 Mod "${id}" 数据失败:`, errorMsg);
          const mod = this.loadedMods.find(m => m.manifest.id === id);
          if (mod) {
            mod.status = 'error';
            mod.error = errorMsg;
          }

          // 强制 Mod 数据注册失败也抛出
          if (manifest.required) {
            failedRequired.push({ id, name: manifest.name, error: errorMsg });
          }
          loaded--;
          failed++;
        }
      }

      // 再次检查强制 Mod
      if (failedRequired.length > 0) {
        const error = new ModLoadError(failedRequired);
        this.onComplete?.({ loaded, failed, total });
        throw error;
      }

      const event: ModLoadCompleteEvent = { loaded, failed, total };
      this.onComplete?.(event);
      return event;
    } finally {
      this.loading = false;
    }
  }

  /**
   * 获取加载失败的 Mod 列表（含错误信息）
   *
   * @returns 失败的 Mod 列表
   */
  getFailedMods(): Array<{ id: string; name: string; error: string }> {
    return this.loadedMods
      .filter(m => m.status === 'error')
      .map(m => ({ id: m.manifest.id, name: m.manifest.name, error: m.error ?? '未知错误' }));
  }

  /**
   * 发现 Mod：从 mod-list.json 获取 Mod 列表
   *
   * @returns Mod 条目列表
   */
  async discoverMods(): Promise<ModListEntry[]> {
    try {
      const url = `${this.basePath}/mod-list.json`;
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[ModLoader] 无法获取 Mod 列表: ${response.status} ${response.statusText}`);
        return [];
      }
      const data: ModList = await response.json();
      if (!data.mods || !Array.isArray(data.mods)) {
        console.warn('[ModLoader] mod-list.json 格式错误：缺少 mods 数组');
        return [];
      }
      return data.mods;
    } catch (err) {
      // 文件不存在或网络错误：优雅降级
      console.log('[ModLoader] 未发现 mod-list.json，无外挂 Mod');
      return [];
    }
  }

  /**
   * 加载单个 Mod 的清单文件
   *
   * @param modPath - Mod 目录路径（相对于 basePath）
   * @returns 解析后的 Mod 清单
   */
  async loadModManifest(modPath: string): Promise<ModManifest> {
    const url = `${this.basePath}/${modPath}/mod.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`无法获取 mod.json: HTTP ${response.status}`);
    }
    const json = await response.text();
    const { manifest, errors } = parseManifest(json);
    if (!manifest) {
      throw new Error(`mod.json 校验失败: ${errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
    }
    return manifest;
  }

  /**
   * 加载 Mod 数据文件并注册到 WorldDataRegistry
   *
   * @param modId - Mod ID
   * @param manifest - Mod 清单
   */
  async loadModDataAndRegister(modId: string, manifest: ModManifest): Promise<void> {
    const baseUrl = `${this.basePath}/${modId}`;

    // 按 contentTypes 顺序加载
    for (const contentType of manifest.contentTypes) {
      const dataPath = manifest.dataFiles[contentType];
      if (!dataPath) {
        console.warn(`[ModLoader] Mod "${modId}" 的 contentTypes 包含 "${contentType}" 但 dataFiles 中未配置路径，跳过`);
        continue;
      }

      try {
        const url = `${baseUrl}/${dataPath}`;
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`[ModLoader] 无法加载 "${modId}" 的数据文件: ${dataPath} (HTTP ${response.status})`);
          continue;
        }
        const data = await response.json();
        this.registerData(modId, contentType, data, manifest);
      } catch (err) {
        console.warn(`[ModLoader] 加载 "${modId}" 的数据文件 "${dataPath}" 失败:`, err);
        // 单个文件失败不阻塞其他文件
      }
    }
  }

  /**
   * 将已加载的数据注册到 WorldDataRegistry
   */
  private registerData(
    modId: string,
    contentType: string,
    data: unknown,
    manifest: ModManifest
  ): void {
    switch (contentType) {
      case 'world': {
        const worlds = data as Record<string, unknown>;
        const worldList = (worlds.worlds || worlds.data || []) as WorldTypeData[];
        if (Array.isArray(worldList)) {
          this.registry.registerWorldTypes(worldList);
          console.log(`[ModLoader] Mod "${modId}": 注册了 ${worldList.length} 个世界类型`);
        }
        break;
      }
      case 'traits': {
        const traits = data as Record<string, Record<string, TraitPoolData>>;
        // 格式: { "worldTypeId": { TraitPoolData } }
        const traitMap = traits.traits || traits;
        for (const [worldTypeId, pool] of Object.entries(traitMap)) {
          if (pool && typeof pool === 'object') {
            this.registry.registerTraitPool(worldTypeId, pool as unknown as TraitPoolData);
          }
        }
        console.log(`[ModLoader] Mod "${modId}": 注册了词条池`);
        break;
      }
      case 'dangers': {
        const dangers = data as Record<string, unknown>;
        const dangerList = (dangers.dangers || dangers.data || []) as DangerData[];
        if (Array.isArray(dangerList)) {
          this.registry.registerDangers(dangerList);
          console.log(`[ModLoader] Mod "${modId}": 注册了 ${dangerList.length} 个危险效果`);
        }
        break;
      }
      case 'opportunities': {
        const opportunities = data as Record<string, unknown>;
        const oppList = (opportunities.opportunities || opportunities.data || []) as OpportunityData[];
        if (Array.isArray(oppList)) {
          this.registry.registerOpportunities(oppList);
          console.log(`[ModLoader] Mod "${modId}": 注册了 ${oppList.length} 个机缘效果`);
        }
        break;
      }
      case 'realms': {
        const realms = data as Record<string, RealmSystemData>;
        for (const [worldTypeId, realm] of Object.entries(realms)) {
          if (realm && typeof realm === 'object') {
            this.registry.registerRealmSystem(worldTypeId, realm);
          }
        }
        console.log(`[ModLoader] Mod "${modId}": 注册了境界体系`);
        break;
      }
      case 'factions': {
        const factions = data as Record<string, unknown>;
        const factionList = (factions.factions || factions.data || []) as FactionTemplateData[];
        if (Array.isArray(factionList)) {
          this.registry.registerFactionTemplates(factionList);
          console.log(`[ModLoader] Mod "${modId}": 注册了 ${factionList.length} 个势力模板`);
        }
        break;
      }
      case 'names': {
        const names = data as Record<string, NamePoolData>;
        for (const [worldTypeId, pool] of Object.entries(names)) {
          if (pool && typeof pool === 'object') {
            this.registry.registerNamePool(worldTypeId, pool);
          }
        }
        console.log(`[ModLoader] Mod "${modId}": 注册了姓名池`);
        break;
      }
      case 'text': {
        const texts = data as Record<string, WorldTextData>;
        for (const [worldTypeId, text] of Object.entries(texts)) {
          if (text && typeof text === 'object') {
            this.registry.registerWorldText(worldTypeId, text);
          }
        }
        console.log(`[ModLoader] Mod "${modId}": 注册了世界观文案`);
        break;
      }
      default:
        console.warn(`[ModLoader] Mod "${modId}": 未知的内容类型 "${contentType}"，跳过`);
    }
  }

  /**
   * 解析 Mod 依赖顺序（拓扑排序）
   *
   * 如果存在循环依赖或缺失依赖，会记录错误并跳过受影响的 Mod。
   *
   * @param mods - Mod ID 和清单的列表
   * @returns 按加载顺序排列的 Mod ID 列表
   */
  resolveDependencyOrder(
    mods: Array<{ id: string; manifest: ModManifest }>
  ): string[] {
    const modMap = new Map(mods.map(m => [m.id, m.manifest]));
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const result: string[] = [];

    function visit(id: string): boolean {
      if (inStack.has(id)) {
        console.error(`[ModLoader] 检测到循环依赖: ${id} 在依赖链中已存在`);
        return false;
      }
      if (visited.has(id)) return true;

      const manifest = modMap.get(id);
      if (!manifest) {
        console.error(`[ModLoader] 缺失依赖: "${id}" 不在已发现的 Mod 列表中`);
        return false;
      }

      inStack.add(id);

      for (const depId of manifest.dependencies) {
        if (!modMap.has(depId)) {
          console.error(`[ModLoader] Mod "${id}" 依赖 "${depId}"，但 "${depId}" 不存在`);
          inStack.delete(id);
          return false;
        }
        if (!visit(depId)) {
          inStack.delete(id);
          return false;
        }
      }

      inStack.delete(id);
      visited.add(id);
      result.push(id);
      return true;
    }

    for (const { id } of mods) {
      if (!visited.has(id)) {
        visit(id);
      }
    }

    // 未被访问到的 ID（因循环/缺失依赖被跳过）
    const unvisited = mods.filter(m => !visited.has(m.id));
    if (unvisited.length > 0) {
      console.error(
        `[ModLoader] 以下 Mod 因依赖问题被跳过: ${unvisited.map(m => m.id).join(', ')}`
      );
    }

    return result;
  }

  /**
   * 发送加载进度事件
   */
  private emitProgress(current: number, total: number, currentModId: string): void {
    this.onProgress?.({ current, total, currentModId });
  }
}
