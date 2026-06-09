/**
 * 世界数据注册中心（WorldDataRegistry）
 *
 * 运行时单例注册中心，替代硬编码数据数组，支持 Mod 数据的注册、查询、合并。
 *
 * 设计原则：
 * - 单例模式：全局唯一实例，避免多实例间数据不一致
 * - 类型安全：所有 API 使用精确的 TypeScript 类型
 * - 后加载优先：标量字段覆盖，数组字段追加合并
 * - 优雅降级：查询不存在的 key 返回 undefined，不抛异常
 *
 * @module shared/lib/registry
 */

import type {
  ImpactLevel,
  StatName,
  ExtensibleWorldType,
} from '@/shared/lib/types';

// ============================================
// 注册中心数据类型定义
// ============================================

/** 世界基本信息（对应 World 接口中的世界类型静态配置） */
export interface WorldTypeData {
  /** 世界类型标识（如 "修仙"、"demon"） */
  id: string;
  /** 世界类型显示名称 */
  name: string;
  /** 世界类型描述 */
  description: string;
  /** 基础难度系数（0.8-2.0） */
  baseCoefficient: number;
  /** 世界名称前缀池 */
  namePrefixes: string[];
  /** 世界名称后缀池 */
  nameSuffixes: string[];
  /** 世界描述文本池 */
  descriptions: string[];
  /** 力量体系描述池 */
  powerSystems?: string[];
  /** 主要势力描述池（旧版兼容） */
  majorForces?: string[];
  /** 危险描述池 */
  dangers?: WorldImpactData[];
  /** 机缘描述池 */
  opportunities?: WorldImpactData[];
}

/** 世界影响描述数据 */
export interface WorldImpactData {
  description: string;
  impact: Partial<Record<StatName, number>>;
  impactDescription: string;
}

/** 触发条件 */
export interface TriggerConditionData {
  type: 'on_enter' | 'on_battle_start' | 'on_battle_end' | 'on_turn' | 'on_explore' | 'random';
  chance: number;
}

/** 危险效果 */
export interface DangerEffectData {
  statModifications?: Partial<Record<StatName, number>>;
  resourceModifications?: { hp?: number; mp?: number; spiritStones?: number };
  enemyBuffs?: { attackBonus?: number; defenseBonus?: number; hpBonus?: number };
  specialEffects?: {
    type: 'no_heal' | 'no_escape' | 'double_damage_chance' | 'curse' | 'reduced_exp';
    value?: number;
  };
}

/** 机缘效果 */
export interface OpportunityEffectData {
  statModifications?: Partial<Record<StatName, number>>;
  resourceGains?: { hp?: number; mp?: number; spiritStones?: number; exp?: number };
  specialEffects?: {
    type: 'double_exp' | 'double_drop' | 'free_retreat' | 'extra_loot' | 'reduced_damage';
    value?: number;
  };
  dropBonus?: { rarityBoost: number; extraDropChance: number };
}

/** 危险效果定义 */
export interface DangerData {
  id: string;
  type: 'stat_debuff' | 'resource_drain' | 'enemy_buff' | 'special_mechanic' | 'random_event';
  name: string;
  description: string;
  triggerCondition: TriggerConditionData;
  effect: DangerEffectData;
  duration: number;
  dispellable: boolean;
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  worldTypes?: string[];
}

/** 机缘效果定义 */
export interface OpportunityData {
  id: string;
  type: 'stat_buff' | 'resource_gain' | 'special_ability' | 'rare_drop' | 'favorable_event';
  name: string;
  description: string;
  triggerCondition: TriggerConditionData;
  effect: OpportunityEffectData;
  duration: number;
  opportunityLevel: 1 | 2 | 3 | 4 | 5;
  conflictsWith?: string[];
  worldTypes?: string[];
}

/** 词条定义 */
export interface TraitDefinitionData {
  name: string;
  description: string;
  level: ImpactLevel;
  positiveAttrs: string[];
  negativeAttrs: string[];
}

/** 词条池 */
export interface TraitPoolData {
  origin: Record<ImpactLevel, TraitDefinitionData[]>;
  trait: Record<ImpactLevel, TraitDefinitionData[]>;
  personality: Record<ImpactLevel, TraitDefinitionData[]>;
  talent: Record<ImpactLevel, TraitDefinitionData[]>;
}

/** 势力模板 */
export interface FactionTemplateData {
  id: string;
  name: string;
  type: string;
  description: string;
  worldTypeId: string;
}

/** 姓名池 */
export interface NamePoolData {
  surnames: string[];
  maleNames: string[];
  femaleNames: string[];
}

/** 境界层级 */
export interface RealmTierData {
  name: string;
  subRealms: string[];
  levelRange: [number, number];
}

/** 境界体系 */
export interface RealmSystemData {
  mainRealmName: string;
  subRealmName: string;
  tiers: RealmTierData[];
  subRealmMultiplier?: number;
  tierJumpMultiplier?: number;
}

/** 世界观文案（任意嵌套对象，路径访问） */
export type WorldTextData = Record<string, unknown>;

/** 奖励系数 */
export interface RewardCoefficientData {
  expCoefficient: number;
  spiritStoneCoefficient: number;
  dropCoefficient: number;
  rarityBonus: {
    rare: number;
    epic: number;
    legendary: number;
    mythic: number;
  };
  specialRewards: {
    ascensionMarkBonus: number;
    titleChance: number;
    specialItemChance: number;
  };
}

// ============================================
// 注册中心实现
// ============================================

/**
 * 世界数据注册中心
 *
 * 单例类，提供所有游戏世界数据的运行时注册和查询。
 *
 * @example
 * ```typescript
 * const registry = WorldDataRegistry.getInstance();
 * registry.registerWorldType({ id: '修仙', name: '修仙', ... });
 * const worlds = registry.getAllWorldTypes(); // ['修仙', '高武', ...]
 * ```
 */
export class WorldDataRegistry {
  private static instance: WorldDataRegistry | null = null;

  // ===== 内部存储 =====

  /** 世界类型数据（key: worldTypeId） */
  private worldTypes: Map<string, WorldTypeData> = new Map();

  /** 境界体系（key: worldTypeId） */
  private realmSystems: Map<string, RealmSystemData> = new Map();

  /** 词条池（key: worldTypeId） */
  private traitPools: Map<string, TraitPoolData> = new Map();

  /** 危险效果全局池（key: dangerId） */
  private dangers: Map<string, DangerData> = new Map();

  /** 机缘效果全局池（key: opportunityId） */
  private opportunities: Map<string, OpportunityData> = new Map();

  /** 势力模板（key: factionId） */
  private factionTemplates: Map<string, FactionTemplateData> = new Map();

  /** 姓名池（key: worldTypeId） */
  private namePools: Map<string, NamePoolData> = new Map();

  /** 世界观文案（key: worldTypeId） */
  private worldTexts: Map<string, WorldTextData> = new Map();

  /** 奖励系数（key: worldTypeId） */
  private rewardCoefficients: Map<string, RewardCoefficientData> = new Map();

  /** 世界系数（key: worldTypeId） */
  private coefficients: Map<string, number> = new Map();

  private constructor() {}

  /** 获取单例实例 */
  static getInstance(): WorldDataRegistry {
    if (!WorldDataRegistry.instance) {
      WorldDataRegistry.instance = new WorldDataRegistry();
    }
    return WorldDataRegistry.instance;
  }

  /** 重置单例（仅用于测试） */
  static resetInstance(): void {
    WorldDataRegistry.instance = null;
  }

  // ============================================
  // 世界类型
  // ============================================

  /** 注册世界类型 */
  registerWorldType(data: WorldTypeData): void {
    const existing = this.worldTypes.get(data.id);
    if (existing) {
      console.warn(`[WorldDataRegistry] 覆盖已注册的世界类型: ${data.id}`);
    }
    this.worldTypes.set(data.id, { ...data });
  }

  /** 获取世界类型数据 */
  getWorldType(id: string): WorldTypeData | undefined {
    return this.worldTypes.get(id);
  }

  /** 获取所有已注册的世界类型 ID */
  getAllWorldTypes(): string[] {
    return Array.from(this.worldTypes.keys());
  }

  /** 校验世界类型 ID 是否有效 */
  isValidWorldType(id: string): boolean {
    return this.worldTypes.has(id);
  }

  /** 获取所有已注册的世界类型数据 */
  getAllWorldTypeData(): WorldTypeData[] {
    return Array.from(this.worldTypes.values());
  }

  // ============================================
  // 境界体系
  // ============================================

  /** 注册境界体系 */
  registerRealmSystem(worldTypeId: string, realm: RealmSystemData): void {
    if (this.realmSystems.has(worldTypeId)) {
      console.warn(`[WorldDataRegistry] 覆盖已注册的境界体系: ${worldTypeId}`);
    }
    this.realmSystems.set(worldTypeId, { ...realm });
  }

  /** 获取境界体系 */
  getRealmSystem(worldTypeId: string): RealmSystemData | undefined {
    return this.realmSystems.get(worldTypeId);
  }

  // ============================================
  // 词条池
  // ============================================

  /** 注册词条池（数组字段追加合并） */
  registerTraitPool(worldTypeId: string, pool: TraitPoolData): void {
    const existing = this.traitPools.get(worldTypeId);
    if (existing) {
      this.traitPools.set(worldTypeId, this.mergeTraitPools(existing, pool));
    } else {
      this.traitPools.set(worldTypeId, pool);
    }
  }

  /** 获取词条池 */
  getTraitPool(worldTypeId: string): TraitPoolData | undefined {
    return this.traitPools.get(worldTypeId);
  }

  // ============================================
  // 危险/机缘（全局池）
  // ============================================

  /** 注册危险效果 */
  registerDanger(danger: DangerData): void {
    this.dangers.set(danger.id, danger);
  }

  /** 注册机缘效果 */
  registerOpportunity(opportunity: OpportunityData): void {
    this.opportunities.set(opportunity.id, opportunity);
  }

  /** 获取适用于指定世界类型的危险列表 */
  getDangersForWorld(worldTypeId: string): DangerData[] {
    return Array.from(this.dangers.values()).filter(d => {
      if (!d.worldTypes || d.worldTypes.length === 0) return true;
      return d.worldTypes.includes(worldTypeId);
    });
  }

  /** 获取适用于指定世界类型的机缘列表 */
  getOpportunitiesForWorld(worldTypeId: string): OpportunityData[] {
    return Array.from(this.opportunities.values()).filter(o => {
      if (!o.worldTypes || o.worldTypes.length === 0) return true;
      return o.worldTypes.includes(worldTypeId);
    });
  }

  /** 获取所有已注册的危险效果 */
  getAllDangers(): DangerData[] {
    return Array.from(this.dangers.values());
  }

  /** 获取所有已注册的机缘效果 */
  getAllOpportunities(): OpportunityData[] {
    return Array.from(this.opportunities.values());
  }

  // ============================================
  // 势力模板
  // ============================================

  /** 注册势力模板 */
  registerFactionTemplate(faction: FactionTemplateData): void {
    this.factionTemplates.set(faction.id, faction);
  }

  /** 获取适用于指定世界类型的势力模板 */
  getFactionTemplates(worldTypeId: string): FactionTemplateData[] {
    return Array.from(this.factionTemplates.values()).filter(
      f => f.worldTypeId === worldTypeId
    );
  }

  // ============================================
  // 姓名池
  // ============================================

  /** 注册姓名池（追加合并） */
  registerNamePool(worldTypeId: string, pool: NamePoolData): void {
    if (this.namePools.has(worldTypeId)) {
      const existing = this.namePools.get(worldTypeId)!;
      this.namePools.set(worldTypeId, {
        surnames: [...existing.surnames, ...pool.surnames],
        maleNames: [...existing.maleNames, ...pool.maleNames],
        femaleNames: [...existing.femaleNames, ...pool.femaleNames],
      });
    } else {
      this.namePools.set(worldTypeId, pool);
    }
  }

  /** 获取姓名池 */
  getNamePool(worldTypeId: string): NamePoolData | undefined {
    return this.namePools.get(worldTypeId);
  }

  // ============================================
  // 世界观文案
  // ============================================

  /** 注册世界观文案（浅合并） */
  registerWorldText(worldTypeId: string, text: WorldTextData): void {
    const existing = this.worldTexts.get(worldTypeId);
    if (existing) {
      this.worldTexts.set(worldTypeId, { ...existing, ...text });
    } else {
      this.worldTexts.set(worldTypeId, text);
    }
  }

  /** 获取世界观文案 */
  getWorldText(worldTypeId: string): WorldTextData | undefined {
    return this.worldTexts.get(worldTypeId);
  }

  // ============================================
  // 世界系数
  // ============================================

  /** 注册世界系数 */
  registerCoefficient(worldTypeId: string, coefficient: number): void {
    this.coefficients.set(worldTypeId, coefficient);
  }

  /** 获取世界基础系数（未注册返回 1.0） */
  getCoefficient(worldTypeId: string): number {
    return this.coefficients.get(worldTypeId) ?? 1.0;
  }

  // ============================================
  // 奖励系数
  // ============================================

  /** 注册奖励系数 */
  registerRewardCoefficient(worldTypeId: string, reward: RewardCoefficientData): void {
    this.rewardCoefficients.set(worldTypeId, reward);
  }

  /** 获取奖励系数 */
  getRewardCoefficient(worldTypeId: string): RewardCoefficientData | undefined {
    return this.rewardCoefficients.get(worldTypeId);
  }

  // ============================================
  // 批量注册辅助方法
  // ============================================

  /** 批量注册世界类型 */
  registerWorldTypes(worlds: WorldTypeData[]): void {
    for (const world of worlds) {
      this.registerWorldType(world);
    }
  }

  /** 批量注册危险效果 */
  registerDangers(dangers: DangerData[]): void {
    for (const d of dangers) {
      this.registerDanger(d);
    }
  }

  /** 批量注册机缘效果 */
  registerOpportunities(opportunities: OpportunityData[]): void {
    for (const o of opportunities) {
      this.registerOpportunity(o);
    }
  }

  /** 批量注册势力模板 */
  registerFactionTemplates(factions: FactionTemplateData[]): void {
    for (const f of factions) {
      this.registerFactionTemplate(f);
    }
  }

  // ============================================
  // 私有辅助
  // ============================================

  /** 合并两个词条池（追加策略，基于 name 去重） */
  private mergeTraitPools(existing: TraitPoolData, incoming: TraitPoolData): TraitPoolData {
    const categories: (keyof TraitPoolData)[] = ['origin', 'trait', 'personality', 'talent'];

    const result: TraitPoolData = {
      origin: { ...existing.origin },
      trait: { ...existing.trait },
      personality: { ...existing.personality },
      talent: { ...existing.talent },
    };

    for (const category of categories) {
      const levels = Object.keys(incoming[category]) as ImpactLevel[];
      for (const level of levels) {
        const existingTraits = result[category][level] || [];
        const incomingTraits = incoming[category][level] || [];
        const existingNames = new Set(existingTraits.map(t => t.name));
        const newTraits = incomingTraits.filter(t => !existingNames.has(t.name));
        result[category][level] = [...existingTraits, ...newTraits];
      }
    }

    return result;
  }
}

// ============================================
// ExtensibleWorldType 工厂函数
// ============================================

/**
 * 创建 ExtensibleWorldType 品牌字符串值
 *
 * 在运行时校验 ID 是否已在注册中心注册。
 *
 * @param id - 世界类型 ID 字符串
 * @returns 有效的 ExtensibleWorldType 值，未注册返回 undefined
 *
 * @example
 * ```typescript
 * const wt = asWorldType('修仙');
 * if (wt) { const world = generateWorld(1, wt); }
 * ```
 */
export function asWorldType(id: string): ExtensibleWorldType | undefined {
  const registry = WorldDataRegistry.getInstance();
  if (registry.isValidWorldType(id)) {
    return id as ExtensibleWorldType;
  }
  console.warn(`[WorldDataRegistry] 未注册的世界类型: "${id}"`);
  return undefined;
}

/**
 * 断言创建 ExtensibleWorldType（开发模式专用）
 *
 * @param id - 世界类型 ID 字符串
 * @returns 有效的 ExtensibleWorldType 值
 * @throws 如果 ID 未在注册中心注册
 */
export function assertWorldType(id: string): ExtensibleWorldType {
  const registry = WorldDataRegistry.getInstance();
  if (!registry.isValidWorldType(id)) {
    throw new Error(`[WorldDataRegistry] 断言失败：未注册的世界类型 "${id}"`);
  }
  return id as ExtensibleWorldType;
}

/**
 * 获取所有已注册的 ExtensibleWorldType 值
 *
 * @returns ExtensibleWorldType 数组
 */
export function getAllWorldTypeValues(): ExtensibleWorldType[] {
  const registry = WorldDataRegistry.getInstance();
  return registry.getAllWorldTypes() as ExtensibleWorldType[];
}
