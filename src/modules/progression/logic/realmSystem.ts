/**
 * 角色属性计算系统（V2 - 分层属性设计）
 * 
 * 设计说明：
 * - 固定属性(base)：由词条决定，永久保留，不可通过修炼提升
 * - 可成长属性(growth)：通过修炼/突破事件获得，有等级上限
 * - 可成长上限 = 等级 × 2
 */

import { WorldType, CharacterStats, GrowthStats, BaseStats } from '@/shared/lib/types';

/** 最大等级（满级） */
export const MAX_LEVEL = 100;

// 境界配置
export interface RealmConfig {
  level: number;      // 等级阈值
  realm: string;      // 境界名称
  multiplier: number; // 战力倍率
}

/**
 * 生成每个等级的境界配置
 * 每个大境界包含10个小等级
 *
 * @param realmTiers - 大境界名称列表
 * @param multiplierBase - 战力倍率基础
 * @param subRealmMult - 小境界倍率（默认 1.05）
 * @param tierJumpMult - 大境界跨越倍率（默认 1.30）
 */
function generateRealmConfigs(
  realmTiers: string[],
  multiplierBase: number = 1.0,
  subRealmMult: number = 1.05,
  tierJumpMult: number = 1.30
): RealmConfig[] {
  const configs: RealmConfig[] = [];
  let currentMultiplier = multiplierBase;

  for (let tierIndex = 0; tierIndex < realmTiers.length; tierIndex++) {
    const tierName = realmTiers[tierIndex];
    const startLevel = tierIndex * 10 + 1;
    const endLevel = (tierIndex + 1) * 10;

    for (let level = startLevel; level <= endLevel; level++) {
      const tierLevel = level - startLevel + 1;  // 大境界内的等级 (1-10)
      configs.push({
        level,
        realm: `${tierName}${['一重', '二重', '三重', '四重', '五重', '六重', '七重', '八重', '九重', '圆满'][tierLevel - 1]}`,
        multiplier: Math.round(currentMultiplier * 100) / 100
      });
      currentMultiplier *= subRealmMult;
    }
    // 大境界跨越时额外增加倍率
    if (tierIndex < realmTiers.length - 1) {
      currentMultiplier *= tierJumpMult;
    }
  }

  return configs;
}

// 各世界的境界大境界列表（与力量体系一致）
const realmTierNames: Record<WorldType, string[]> = {
  '修仙': ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '渡劫期', '大乘期', '仙境', '仙王', '仙帝'],
  '高武': ['武徒', '武士', '武师', '武将', '武王', '武皇', '武帝', '武圣', '武神', '神王'],
  '科技': ['公民级', '士兵级', '士官级', '尉官级', '校官级', '将官级', '元帅级', '统帅级', '司令级', '最高统帅'],
  '魔幻': ['魔法学徒', '见习法师', '初级法师', '中级法师', '高级法师', '大法师', '魔导师', '大魔导师', '法圣', '法神'],
  '异能': ['F级', 'E级', 'D级', 'C级', 'B级', 'A级', 'S级', 'SS级', 'SSS级', 'X级'],
  '仙侠': ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '渡劫期', '大乘期', '仙境', '仙王', '仙帝'],
  '武侠': ['外门', '内门', '核心', '执事', '长老', '掌门', '宗师', '大宗师', '武圣', '武帝'],
  '末世': ['幸存者', '觉醒者', '进化者', '变异者', '异能者', '掌控者', '主宰者', '王者', '皇者', '圣者'],
};

/** 世界境界倍率配置 — 每种世界有差异化的成长曲线 */
export const WORLD_REALM_MULTIPLIERS: Record<WorldType, { subRealm: number; tierJump: number }> = {
  '修仙': { subRealm: 1.05, tierJump: 1.30 },   // 标准修仙成长
  '仙侠': { subRealm: 1.05, tierJump: 1.30 },   // 标准剑修成长
  '高武': { subRealm: 1.06, tierJump: 1.35 },   // 武道爆发式突破
  '科技': { subRealm: 1.03, tierJump: 1.20 },   // 科技研究稳定渐进
  '魔幻': { subRealm: 1.06, tierJump: 1.30 },   // 魔法感悟式成长
  '异能': { subRealm: 1.04, tierJump: 1.40 },   // 觉醒跃迁式突破
  '武侠': { subRealm: 1.05, tierJump: 1.25 },   // 勤学苦练式成长
  '末世': { subRealm: 1.08, tierJump: 1.50 },   // 极端环境快速进化
};

// 生成各世界的境界配置（使用差异化倍率）
export const worldRealms: Record<WorldType, RealmConfig[]> = {
  '修仙': generateRealmConfigs(realmTierNames['修仙'], 1.0, WORLD_REALM_MULTIPLIERS['修仙'].subRealm, WORLD_REALM_MULTIPLIERS['修仙'].tierJump),
  '高武': generateRealmConfigs(realmTierNames['高武'], 1.0, WORLD_REALM_MULTIPLIERS['高武'].subRealm, WORLD_REALM_MULTIPLIERS['高武'].tierJump),
  '科技': generateRealmConfigs(realmTierNames['科技'], 1.0, WORLD_REALM_MULTIPLIERS['科技'].subRealm, WORLD_REALM_MULTIPLIERS['科技'].tierJump),
  '魔幻': generateRealmConfigs(realmTierNames['魔幻'], 1.0, WORLD_REALM_MULTIPLIERS['魔幻'].subRealm, WORLD_REALM_MULTIPLIERS['魔幻'].tierJump),
  '异能': generateRealmConfigs(realmTierNames['异能'], 1.0, WORLD_REALM_MULTIPLIERS['异能'].subRealm, WORLD_REALM_MULTIPLIERS['异能'].tierJump),
  '仙侠': generateRealmConfigs(realmTierNames['仙侠'], 1.0, WORLD_REALM_MULTIPLIERS['仙侠'].subRealm, WORLD_REALM_MULTIPLIERS['仙侠'].tierJump),
  '武侠': generateRealmConfigs(realmTierNames['武侠'], 1.0, WORLD_REALM_MULTIPLIERS['武侠'].subRealm, WORLD_REALM_MULTIPLIERS['武侠'].tierJump),
  '末世': generateRealmConfigs(realmTierNames['末世'], 1.0, WORLD_REALM_MULTIPLIERS['末世'].subRealm, WORLD_REALM_MULTIPLIERS['末世'].tierJump),
};

/**
 * 根据等级获取当前境界
 */
export function getRealmByLevel(worldType: WorldType, level: number): string {
  const realms = worldRealms[worldType] || worldRealms['修仙'];
  
  // 从后往前查找，找到第一个等级阈值小于等于当前等级的境界
  for (let i = realms.length - 1; i >= 0; i--) {
    if (level >= realms[i].level) {
      return realms[i].realm;
    }
  }
  
  return realms[0].realm;
}

/**
 * 获取下一个境界
 */
export function getNextRealm(worldType: WorldType, currentLevel: number): string | null {
  const realms = worldRealms[worldType] || worldRealms['修仙'];
  
  for (let i = 0; i < realms.length; i++) {
    if (currentLevel < realms[i].level) {
      return realms[i].realm;
    }
  }
  
  return null; // 已达最高境界
}

/**
 * 获取到下一个境界所需等级
 */
export function getNextRealmLevel(worldType: WorldType, currentLevel: number): number | null {
  const realms = worldRealms[worldType] || worldRealms['修仙'];
  
  for (let i = 0; i < realms.length; i++) {
    if (currentLevel < realms[i].level) {
      return realms[i].level;
    }
  }
  
  return null; // 已达最高境界
}

/**
 * 获取当前境界的战力倍率
 */
export function getRealmMultiplier(worldType: WorldType, level: number): number {
  const realms = worldRealms[worldType] || worldRealms['修仙'];
  
  for (let i = realms.length - 1; i >= 0; i--) {
    if (level >= realms[i].level) {
      return realms[i].multiplier;
    }
  }
  
  return realms[0].multiplier;
}

/**
 * 获取可用难度列表（用于机缘）
 */
export function getAvailableDifficulties(worldType: WorldType, playerLevel: number): Array<{
  level: number;
  realmName: string;
  multiplier: number;
}> {
  const realms = worldRealms[worldType] || worldRealms['修仙'];
  
  // 返回玩家等级附近的境界作为可选难度（每10级一个大境界）
  const result: Array<{ level: number; realmName: string; multiplier: number }> = [];
  
  // 找到玩家当前所在的大境界
  const currentTier = Math.floor((playerLevel - 1) / 10);
  
  // 返回前3个大境界作为选项（当前及以下）
  for (let i = Math.max(0, currentTier - 2); i <= Math.min(currentTier + 1, 9); i++) {
    const level = i * 10 + 1;
    const realm = realms.find(r => r.level === level);
    if (realm) {
      result.push({
        level: realm.level,
        realmName: realm.realm,
        multiplier: realm.multiplier
      });
    }
  }
  
  return result;
}

/**
 * 计算升级所需经验值
 * 使用非线性增长函数：基础经验 * (1.15 ^ (level - 1))
 * 避免翻倍上涨，采用指数曲线平滑增长
 */
export function getExperienceForLevel(level: number): number {
  const baseExp = 100;
  const growthFactor = 1.15;
  return Math.floor(baseExp * Math.pow(growthFactor, level - 1));
}

/**
 * 属性计算系统（V2 - 分层属性设计）
 * 
 * 设计说明：
 * - 固定属性(base)：由词条决定，永久保留，不可通过修炼提升
 * - 可成长属性(growth)：通过修炼/突破事件获得，有等级上限
 * - 可成长上限 = 等级 × 2
 */

/**
 * 限制可成长属性值不超过上限
 * @param value 当前属性值
 * @param level 等级
 * @returns 限制后的属性值（不超过上限，不低于0）
 */
function clampGrowthStatValue(value: number, level: number): number {
  const maxCap = getGrowthStatCap(level);
  // 可成长属性不能低于0，不能超过上限
  return Math.max(0, Math.min(value, maxCap));
}

/**
 * 获取可成长属性上限
 * @param level 等级
 * @returns 可成长属性上限
 */
export function getGrowthStatCap(level: number): number {
  return level * 2;
}

/**
 * 获取固定属性上限（用于机缘等特殊加成）
 * @param baseStat 固定属性值
 * @param level 等级
 * @returns 固定属性上限
 */
export function getFixedStatCap(baseStat: number, level: number): number {
  // 固定属性上限 = 基础值 × (1 + level × 0.03)
  return Math.floor(baseStat * (1 + level * 0.03));
}

/**
 * 计算角色实际属性上限
 * @param level 等级
 * @param capBonus 上限加成
 * @returns 实际属性上限
 */
export function getActualStatCap(level: number, capBonus: number): number {
  return getGrowthStatCap(level) + capBonus;
}

/**
 * 应用属性变化（只修改可成长属性部分）
 * @param currentStats 当前属性
 * @param growthChanges 可成长属性变化
 * @param level 等级
 * @returns 处理后的属性
 */
export function applyGrowthStatChanges(
  currentStats: CharacterStats,
  growthChanges: Partial<GrowthStats>,
  level: number
): CharacterStats {
  const statKeys = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
  const newGrowth = { ...currentStats.growth };
  
  for (const key of statKeys) {
    if (growthChanges[key] !== undefined) {
      const newValue = currentStats.growth[key] + growthChanges[key]!;
      newGrowth[key] = clampGrowthStatValue(newValue, level);
    }
  }
  
  return {
    base: currentStats.base,
    growth: newGrowth,
  };
}

/**
 * 应用道具属性变化（只修改基础属性部分）
 * 道具属性不受等级上限限制
 * @param currentStats 当前属性
 * @param baseChanges 基础属性变化
 * @returns 处理后的属性
 */
export function applyBaseStatChanges(
  currentStats: CharacterStats,
  baseChanges: Partial<BaseStats>
): CharacterStats {
  const statKeys = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
  const newBase = { ...currentStats.base };
  
  for (const key of statKeys) {
    if (baseChanges[key] !== undefined) {
      const newValue = currentStats.base[key] + baseChanges[key]!;
      // 基础属性不能低于0，理论上不设上限
      newBase[key] = Math.max(0, newValue);
    }
  }
  
  return {
    base: newBase,
    growth: currentStats.growth,
  };
}

/**
 * 导出默认配置供其他模块使用
 */
export { worldRealms as realms };

/**
 * 获取力量体系描述（与境界一致）
 */
export function getPowerSystemDescription(worldType: WorldType): string {
  const tiers = realmTierNames[worldType] || realmTierNames['修仙'];
  return tiers.slice(0, 7).join(' → ');
}
