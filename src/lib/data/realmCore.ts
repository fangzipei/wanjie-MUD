/**
 * 境界系统核心类型和纯函数
 *
 * 从 realmData.ts 中提取，与 game/ 模块零依赖。
 * 用于解决 Turbopack 生产构建中的模块解析问题。
 *
 * IMPORTANT: 此文件不能导入任何来自 ../game/ 的模块。
 */

// ============================================
// 核心类型（无外部依赖）
// ============================================

export interface RealmTier {
  /** 大境界名称 */
  name: string;
  /** 小境界列表 */
  subRealms: string[];
  /** 等级范围 [起始, 结束] */
  levelRange: [number, number];
}

export interface RealmSystem {
  /** 大境界体系名称 */
  mainRealmName: string;
  /** 小境界体系名称 */
  subRealmName: string;
  /** 所有境界层级 */
  tiers: RealmTier[];
}

// ============================================
// 纯函数（不依赖任何 game/ 模块）
// ============================================

/**
 * 根据等级获取境界名称
 */
export function getRealmName(realmSystem: RealmSystem | undefined, level: number): string {
  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return `第${level}级`;
  }

  let tierIndex = 0;
  for (let i = 0; i < realmSystem.tiers.length; i++) {
    if (level >= realmSystem.tiers[i].levelRange[0] && level <= realmSystem.tiers[i].levelRange[1]) {
      tierIndex = i;
      break;
    }
    if (level > realmSystem.tiers[i].levelRange[1]) {
      tierIndex = i + 1;
    }
  }

  if (tierIndex >= realmSystem.tiers.length) {
    tierIndex = realmSystem.tiers.length - 1;
  }

  const tier = realmSystem.tiers[tierIndex];
  const mainRealmName = tier.name;
  const subRealmIndex = Math.min(9, Math.max(0, level - tier.levelRange[0]));
  const subRealmName = tier.subRealms[subRealmIndex];

  return `${mainRealmName}${subRealmName}`;
}

/**
 * 获取大境界名称（不含小境界）
 */
export function getMainRealmName(realmSystem: RealmSystem | undefined, level: number): string {
  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return '未知境界';
  }

  let tierIndex = 0;
  for (let i = 0; i < realmSystem.tiers.length; i++) {
    if (level >= realmSystem.tiers[i].levelRange[0] && level <= realmSystem.tiers[i].levelRange[1]) {
      tierIndex = i;
      break;
    }
    if (level > realmSystem.tiers[i].levelRange[1]) {
      tierIndex = i + 1;
    }
  }

  if (tierIndex >= realmSystem.tiers.length) {
    tierIndex = realmSystem.tiers.length - 1;
  }

  return realmSystem.tiers[tierIndex].name;
}

/**
 * 获取下一个境界
 */
export function getNextRealm(realmSystem: RealmSystem | undefined, currentLevel: number): string | null {
  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return null;
  }

  const nextLevel = currentLevel + 1;
  const maxLevel = realmSystem.tiers.length * 10;

  if (nextLevel > maxLevel) {
    return null;
  }

  return getRealmName(realmSystem, nextLevel);
}

/**
 * 获取到下一个大境界所需等级
 */
export function getNextMainRealmLevel(realmSystem: RealmSystem | undefined, currentLevel: number): number | null {
  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return null;
  }

  for (const tier of realmSystem.tiers) {
    if (currentLevel < tier.levelRange[0]) {
      return tier.levelRange[0];
    }
  }
  return null;
}

/**
 * 获取力量体系描述（用于世界面板显示）
 */
export function getPowerSystemDescription(realmSystem: RealmSystem | undefined): string {
  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return '未知境界体系';
  }

  const mainRealms = realmSystem.tiers.map(t => t.name).join(' → ');
  return mainRealms;
}

/**
 * 计算战力倍率
 * 每个小境界增加5%，每个大境界跨越额外增加30%
 */
export function getRealmMultiplier(realmSystem: RealmSystem | undefined, level: number): number {
  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return 1 + level * 0.05;
  }

  let multiplier = 1.0;

  for (let i = 0; i < realmSystem.tiers.length; i++) {
    const tier = realmSystem.tiers[i];

    if (level < tier.levelRange[0]) {
      break;
    }

    const levelsInTier = Math.min(level, tier.levelRange[1]) - tier.levelRange[0] + 1;
    multiplier *= Math.pow(1.05, levelsInTier);

    if (level > tier.levelRange[1] && i < realmSystem.tiers.length - 1) {
      multiplier *= 1.3;
    }
  }

  return Math.round(multiplier * 100) / 100;
}

/**
 * 获取最高等级
 */
export function getMaxLevel(realmSystem: RealmSystem | undefined): number {
  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return 100;
  }
  const lastTier = realmSystem.tiers[realmSystem.tiers.length - 1];
  return lastTier.levelRange[1];
}

/**
 * 计算升级所需经验值
 */
export function getExperienceForLevel(level: number): number {
  const baseExp = 100;
  const growthFactor = 1.15;
  return Math.floor(baseExp * Math.pow(growthFactor, level - 1));
}

/**
 * 计算属性基础上限（基于等级）
 */
export function getStatBaseForLevel(level: number): number {
  return 100 + (level - 1) * 6;
}

/**
 * 计算属性成长潜力上限
 */
export function getStatPotentialForLevel(level: number): number {
  return Math.floor(getStatBaseForLevel(level) * 1.2);
}
