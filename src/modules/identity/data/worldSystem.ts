/**
 * 世界系统核心逻辑
 * 
 * 包含：
 * - 难度系数计算
 * - 危险/机缘生成
 * - 奖励系数计算
 * - 世界选择规则
 */

import { 
  checkOpportunityUnlock, 
  MAX_OPPORTUNITY_LEVEL,
  getOpportunityLevelColorClass,
  getOpportunityLevelBgClass,
} from '@/modules/exploration/data/opportunityConfig';
import { getRarityColorClass, getRarityBgClass } from '@/modules/equipment/data/raritySystem';
import { WORLD_DATA, WORLD_COEFFICIENTS } from './worldData';
import {
  WorldDanger,
  WorldOpportunity,
  WorldRewardCoefficient,
  WORLD_DANGERS,
  WORLD_OPPORTUNITIES,
  getMaxDangerLevel,
  calculateDangerCount,
  calculateOpportunityCount,
} from './worldEffectsData';
import { WorldType, WorldDifficulty } from '@/shared/lib/types';

// ============================================
// 常量定义
// ============================================

/** 飞升难度加成（每次飞升增加的系数） */
export const ASCENSION_COEFFICIENT_BONUS = 0.15;

/** 最大难度系数上限 */
export const MAX_DIFFICULTY_COEFFICIENT = 5.0;

/** 世界选择规则 */
export interface WorldSelectionRule {
  minAscension: number;     // 最低飞升次数
  coefficientRange: [number, number]; // 系数范围
  unlockMessage: string;    // 解锁提示
}

export const WORLD_SELECTION_RULES: WorldSelectionRule[] = [
  { minAscension: 0, coefficientRange: [0.8, 1.3], unlockMessage: '初始可选世界' },
  { minAscension: 1, coefficientRange: [1.3, 2.0], unlockMessage: '解锁困难世界' },
  { minAscension: 3, coefficientRange: [2.0, 3.0], unlockMessage: '解锁噩梦世界' },
  { minAscension: 5, coefficientRange: [3.0, 4.0], unlockMessage: '解锁地狱世界' },
  { minAscension: 8, coefficientRange: [4.0, 5.0], unlockMessage: '解锁深渊世界' },
];

// ============================================
// 难度系数计算
// ============================================

/**
 * 计算世界实际难度系数
 * @param baseCoefficient 世界基础系数（根据世界类型）
 * @param ascensionCount 飞升次数
 * @returns 实际难度系数
 */
export function calculateWorldDifficultyCoefficient(
  baseCoefficient: number,
  ascensionCount: number
): number {
  // 基础系数 + 飞升加成
  const ascensionBonus = ascensionCount * ASCENSION_COEFFICIENT_BONUS;
  
  // 限制最大系数
  return Math.min(MAX_DIFFICULTY_COEFFICIENT, baseCoefficient + ascensionBonus);
}

/**
 * 根据难度系数获取世界难度等级
 */
export function getWorldDifficultyFromCoefficient(coefficient: number): WorldDifficulty {
  if (coefficient >= 4.0) return '深渊';
  if (coefficient >= 3.0) return '地狱';
  if (coefficient >= 2.0) return '噩梦';
  if (coefficient >= 1.3) return '困难';
  if (coefficient >= 1.0) return '普通';
  return '简单';
}

/**
 * 获取难度系数对敌人属性的加成
 */
export function getDifficultyEnemyBonus(coefficient: number): {
  hpBonus: number;
  attackBonus: number;
  defenseBonus: number;
} {
  return {
    hpBonus: 0.8 + (coefficient - 1) * 0.4,
    attackBonus: 0.85 + (coefficient - 1) * 0.35,
    defenseBonus: 0.8 + (coefficient - 1) * 0.3,
  };
}

// ============================================
// 奖励系数计算
// ============================================

/**
 * 计算世界奖励系数
 * 
 * 注意：品质加成已移除，现在由 raritySystem.ts 管理
 * 品质上限由内容等级（机缘/敌人等级）决定，而非世界系数
 */
export function calculateWorldRewardCoefficient(
  difficultyCoefficient: number
): WorldRewardCoefficient {
  // 基础系数：指数增长
  const baseMultiplier = Math.pow(1.5, Math.max(0, difficultyCoefficient - 1));
  
  return {
    expCoefficient: baseMultiplier,
    spiritStoneCoefficient: baseMultiplier * 1.2,
    dropCoefficient: 1 + Math.max(0, difficultyCoefficient - 1) * 0.8,
    
    // 品质加成已废弃 - 现在由 raritySystem.ts 管理
    // 品质上限由内容等级决定，而非世界系数
    rarityBonus: {
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    },
    
    specialRewards: {
      ascensionMarkBonus: Math.max(0, Math.floor(difficultyCoefficient - 1)),
      titleChance: Math.min(0.3, Math.max(0, (difficultyCoefficient - 2) * 0.1)),
      specialItemChance: Math.min(0.2, Math.max(0, (difficultyCoefficient - 3) * 0.08)),
    },
  };
}

// ============================================
// 危险生成
// ============================================

/**
 * 生成世界危险列表
 *
 * @param rng - 随机数生成器（用于确定性生成，默认 Math.random）
 */
export function generateWorldDangers(
  worldType: WorldType,
  difficultyCoefficient: number,
  rng: () => number = Math.random
): WorldDanger[] {
  // 计算危险数量
  const dangerCount = calculateDangerCount(difficultyCoefficient);

  if (dangerCount === 0) return [];

  // 筛选符合难度等级的危险
  const maxLevel = getMaxDangerLevel(difficultyCoefficient);
  const availableDangers = WORLD_DANGERS.filter(d => {
    // 检查难度等级
    if (d.dangerLevel > maxLevel) return false;
    // 检查世界类型限制
    if (d.worldTypes && d.worldTypes.length > 0 && !d.worldTypes.includes(worldType)) {
      return false;
    }
    return true;
  });

  if (availableDangers.length === 0) return [];

  // 随机选择（高等级危险有更高权重）
  const selectedDangers: WorldDanger[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < dangerCount && availableDangers.length > 0; i++) {
    // 权重：等级越高权重越大
    const weights = availableDangers
      .filter(d => !usedIds.has(d.id))
      .map(d => d.dangerLevel * d.dangerLevel);

    if (weights.length === 0) break;

    const selectedIndex = weightedRandomIndex(weights, rng);
    const danger = availableDangers.filter(d => !usedIds.has(d.id))[selectedIndex];

    if (danger) {
      selectedDangers.push(danger);
      usedIds.add(danger.id);
    }
  }

  return selectedDangers;
}

// ============================================
// 机缘生成
// ============================================

/**
 * 生成世界机缘列表
 * 
 * 新逻辑：
 * 1. 所有机缘都可以出现（不再受世界难度系数限制）
 * 2. 机缘收益由 checkOpportunityUnlock 函数计算
 * 3. 高级机缘在低等级玩家时收益递减，但始终可以进入
 */
export function generateWorldOpportunities(
  worldType: WorldType,
  _difficultyCoefficient: number,
  dangers: WorldDanger[],
  rng: () => number = Math.random
): WorldOpportunity[] {
  // 计算机缘数量
  const opportunityCount = calculateOpportunityCount(_difficultyCoefficient);
  
  // 获取危险ID集合，用于检查冲突
  const dangerIds = new Set(dangers.map(d => d.id));
  
  // 所有机缘都可以出现（不再限制机缘等级）
  const availableOpportunities = WORLD_OPPORTUNITIES.filter(o => {
    // 检查世界类型限制
    if (o.worldTypes && o.worldTypes.length > 0 && !o.worldTypes.includes(worldType)) {
      return false;
    }
    // 检查是否与危险冲突
    if (o.conflictsWith && o.conflictsWith.some(id => dangerIds.has(id))) {
      return false;
    }
    return true;
  });
  
  if (availableOpportunities.length === 0) return [];
  
  // 随机选择（高等级机缘权重更高）
  const selectedOpportunities: WorldOpportunity[] = [];
  const usedIds = new Set<string>();
  
  for (let i = 0; i < opportunityCount && availableOpportunities.length > 0; i++) {
    const weights = availableOpportunities
      .filter(o => !usedIds.has(o.id))
      .map(o => o.opportunityLevel * 1.5);
    
    if (weights.length === 0) break;
    
    const selectedIndex = weightedRandomIndex(weights, rng);
    const opportunity = availableOpportunities.filter(o => !usedIds.has(o.id))[selectedIndex];
    
    if (opportunity) {
      selectedOpportunities.push(opportunity);
      usedIds.add(opportunity.id);
    }
  }
  
  return selectedOpportunities;
}

// ============================================
// 世界选择检查
// ============================================

/**
 * 检查世界是否解锁
 */
export function isWorldUnlocked(
  actualCoefficient: number,
  ascensionCount: number
): { unlocked: boolean; rule?: WorldSelectionRule } {
  for (const rule of WORLD_SELECTION_RULES) {
    if (
      actualCoefficient >= rule.coefficientRange[0] &&
      actualCoefficient <= rule.coefficientRange[1]
    ) {
      return {
        unlocked: ascensionCount >= rule.minAscension,
        rule,
      };
    }
  }
  return { unlocked: false };
}

/**
 * 获取下一个解锁的世界难度
 */
export function getNextUnlockInfo(ascensionCount: number): {
  nextRule: WorldSelectionRule | null;
  ascensionsNeeded: number;
} {
  for (const rule of WORLD_SELECTION_RULES) {
    if (ascensionCount < rule.minAscension) {
      return {
        nextRule: rule,
        ascensionsNeeded: rule.minAscension - ascensionCount,
      };
    }
  }
  return { nextRule: null, ascensionsNeeded: 0 };
}

// ============================================
// 工具函数
// ============================================

/**
 * 加权随机选择
 */
function weightedRandomIndex(weights: number[], rng: () => number = Math.random): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = rng() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) return i;
  }
  
  return weights.length - 1;
}

/**
 * 获取世界基础系数
 */
export function getWorldBaseCoefficient(worldType: WorldType): number {
  return WORLD_COEFFICIENTS[worldType] || 1.0;
}

/**
 * 获取危险等级对应的颜色
 */
export function getDangerLevelColor(level: number): string {
  const colors: Record<number, string> = {
    1: 'text-muted-foreground',
    2: 'text-blue-500',
    3: 'text-purple-500',
    4: 'text-orange-500',
    5: 'text-destructive',
  };
  return colors[level] || 'text-muted-foreground';
}

/**
 * 获取机缘等级对应的颜色
 * @deprecated 使用 opportunityConfig.ts 中的 getOpportunityLevelColorClass
 */
export function getOpportunityLevelColor(level: number): string {
  return getOpportunityLevelColorClass(level);
}

/**
 * 获取难度等级对应的颜色
 */
export function getDifficultyColor(difficulty: WorldDifficulty): string {
  const colors: Record<WorldDifficulty, string> = {
    '简单': 'text-green-500',
    '普通': 'text-white',
    '困难': 'text-yellow-500',
    '噩梦': 'text-orange-500',
    '地狱': 'text-red-500',
    '深渊': 'text-purple-500',
  };
  return colors[difficulty] || 'text-white';
}

/**
 * 获取难度等级对应的背景色
 */
export function getDifficultyBgColor(difficulty: WorldDifficulty): string {
  const colors: Record<WorldDifficulty, string> = {
    '简单': 'bg-green-500/20',
    '普通': 'bg-muted/20',
    '困难': 'bg-yellow-500/20',
    '噩梦': 'bg-orange-500/20',
    '地狱': 'bg-destructive/20',
    '深渊': 'bg-purple-500/20',
  };
  return colors[difficulty] || 'bg-muted/20';
}

// ============================================
// 新系统导出
// ============================================

// 重新导出新系统函数，方便其他模块使用
export {
  checkOpportunityUnlock,
  getOpportunityConfig,
  getOpportunityLevelName,
  getOpportunityRarityRange,
  getOpportunityLevelBgClass,
  getOpportunityLevelIcon,
  MAX_OPPORTUNITY_LEVEL,
  type OpportunityLevelConfig,
  type OpportunityUnlockResult,
} from '@/modules/exploration/data/opportunityConfig';

export {
  generateDropRarity,
  calculateDropCount,
  getRarityRange,
  getRarityColorClass,
  getRarityBgClass,
  getRarityBorderClass,
  type RaritySource,
  type DropResult,
} from '@/modules/equipment/data/raritySystem';

export {
  calculateReward,
  calculateEnemyReward,
  calculateOpportunityReward,
  getOpportunityRewardPreview,
  type RewardCalculationContext,
  type CalculatedReward,
} from '@/modules/exploration/data/rewardSystem';
