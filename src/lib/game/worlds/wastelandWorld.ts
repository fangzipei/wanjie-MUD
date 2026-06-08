/**
 * 末世世界机制
 *
 * 核心特色：
 * - 生存资源：饱腹度 + 水源（每日消耗，耗尽扣血）
 * - 修炼→进化（消耗变异点数解锁变异能力树）
 * - 休息点→资源点（补给生存资源）
 */

import type { WorldMechanics } from './types';
import type { BattleAction, ManualBattleState, AutoBattleStrategy } from '../combat/types';

// ============================================
// 生存资源系统
// ============================================

/** 生存资源状态 */
export interface SurvivalResources {
  /** 饱腹度 (0-100) */
  food: number;
  /** 水源 (0-100) */
  water: number;
  /** 上次消耗时间戳 */
  lastConsumeTime: number;
}

/** 每日消耗配置 */
export const SURVIVAL_CONFIG = {
  /** 每日饱腹度消耗 */
  foodPerDay: 10,
  /** 每日水源消耗 */
  waterPerDay: 8,
  /** 资源耗尽时扣血比例（最大 HP 的百分比） */
  hpLossPercent: 0.15,
  /** 一天的毫秒数 */
  dayMs: 24 * 60 * 60 * 1000,
};

/** 创建默认生存资源 */
export function createDefaultSurvival(): SurvivalResources {
  return { food: 80, water: 80, lastConsumeTime: Date.now() };
}

/**
 * 计算生存资源消耗
 *
 * @param resources - 当前生存资源
 * @param now - 当前时间戳
 * @returns 更新后的资源和新 HP 损失
 */
export function tickSurvival(
  resources: SurvivalResources,
  now: number
): { resources: SurvivalResources; hpLoss: number } {
  const elapsed = now - resources.lastConsumeTime;
  const days = Math.floor(elapsed / SURVIVAL_CONFIG.dayMs);

  if (days <= 0) return { resources, hpLoss: 0 };

  let { food, water } = resources;
  const foodConsumed = days * SURVIVAL_CONFIG.foodPerDay;
  const waterConsumed = days * SURVIVAL_CONFIG.waterPerDay;

  food = Math.max(0, food - foodConsumed);
  water = Math.max(0, water - waterConsumed);

  // 计算扣血：每耗尽一项资源扣一次血
  let hpLoss = 0;
  if (food <= 0) hpLoss += SURVIVAL_CONFIG.hpLossPercent;
  if (water <= 0) hpLoss += SURVIVAL_CONFIG.hpLossPercent;

  return {
    resources: { food, water, lastConsumeTime: now },
    hpLoss,
  };
}

// ============================================
// 变异能力树
// ============================================

/** 变异能力节点 */
export interface MutationNode {
  id: string;
  name: string;
  description: string;
  cost: number; // 变异点数消耗
  prerequisite: string | null;
  effects: { type: string; value: number };
}

/** 变异能力树 */
export const MUTATION_TREE: Record<string, MutationNode> = {
  mut_enhanced_metabolism: {
    id: 'mut_enhanced_metabolism',
    name: '强化代谢',
    description: '饱腹度每日消耗-30%',
    cost: 2,
    prerequisite: null,
    effects: { type: 'food_efficiency', value: 0.3 },
  },
  mut_water_retention: {
    id: 'mut_water_retention',
    name: '水分保持',
    description: '水源每日消耗-30%',
    cost: 2,
    prerequisite: null,
    effects: { type: 'water_efficiency', value: 0.3 },
  },
  mut_regeneration: {
    id: 'mut_regeneration',
    name: '再生能力',
    description: '每分钟自动恢复 1% HP',
    cost: 3,
    prerequisite: 'mut_enhanced_metabolism',
    effects: { type: 'hp_regen', value: 0.01 },
  },
  mut_toxin_resistance: {
    id: 'mut_toxin_resistance',
    name: '抗毒体质',
    description: '中毒效果减少 50%',
    cost: 3,
    prerequisite: 'mut_water_retention',
    effects: { type: 'toxin_resist', value: 0.5 },
  },
  mut_apex_predator: {
    id: 'mut_apex_predator',
    name: '顶级掠食者',
    description: '战斗中攻击力+25%',
    cost: 5,
    prerequisite: 'mut_regeneration',
    effects: { type: 'attack_boost', value: 0.25 },
  },
};

export const wastelandWorld: WorldMechanics = {
  worldType: '末世',

  getCultivationParams: () => ({
    resourceName: '变异点数',
    actionName: '进化',
    baseCost: 10,
    useStandardFormula: true,
    successRateModifier: -0.05,
  }),

  getCombatParams: () => ({
    mpName: '体力',
    abilityName: '变异能力',
    basicAttackName: '徒手攻击',
  }),

  getExplorationParams: () => ({
    exploreName: '废土探索',
    hasSpecialMechanics: true,
    survivalResources: [
      { name: '饱腹度', maxValue: 100, dailyConsumption: SURVIVAL_CONFIG.foodPerDay },
      { name: '水源', maxValue: 100, dailyConsumption: SURVIVAL_CONFIG.waterPerDay },
    ],
  }),

  /** 末世 AI：生存优先 */
  customAutoStrategy: (state: ManualBattleState, strategy: AutoBattleStrategy): BattleAction => {
    // HP < 40% 时优先防御（末世生存法则）
    if (state.playerCurrentHp / state.playerMaxHp < 0.4) {
      return { type: 'defend', source: 'ai' };
    }

    const available = state.availableTechniques.filter(t => t.isAvailable);
    if (strategy === 'aggressive') {
      const best = available.sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
    }

    // 默认保守：保命要紧
    const cheapest = available.sort((a, b) => a.mpCost - b.mpCost)[0];
    if (cheapest) return { type: 'attack', techniqueId: cheapest.techniqueId, source: 'ai' };
    return { type: 'attack', source: 'ai' };
  },
};
