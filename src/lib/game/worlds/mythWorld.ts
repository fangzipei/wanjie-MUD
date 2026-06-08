/**
 * 神话世界机制
 *
 * 核心特色：
 * - 修炼→祭祀（消耗祭品获取神恩值）
 * - 神恩值用于：赐福（临时战斗 buff）或神降（一次性全属性翻倍，持续 5 回合）
 * - 探索中遭遇"神迹事件"概率翻倍
 */

import type { WorldMechanics } from './types';
import type { BattleAction, ManualBattleState, AutoBattleStrategy } from '../combat/types';

// ============================================
// 神恩系统
// ============================================

/** 神恩状态 */
export interface DivineFavorState {
  /** 当前神恩值 */
  favor: number;
  /** 是否处于神降状态 */
  isDescended: boolean;
  /** 神降剩余回合数 */
  descendRounds: number;
}

/** 创建默认神恩状态 */
export function createDefaultDivineFavor(): DivineFavorState {
  return { favor: 0, isDescended: false, descendRounds: 0 };
}

/** 赐福消耗 */
export const BLESSING_COST = 10;
/** 神降消耗 */
export const DESCEND_COST = 50;
/** 神降持续回合 */
export const DESCEND_DURATION = 5;
/** 神降属性加成倍率 */
export const DESCEND_MULTIPLIER = 2.0;
/** 每次祭祀获得神恩值范围 */
export const FAVOR_PER_RITUAL = [5, 15];

export const mythWorld: WorldMechanics = {
  worldType: '神话',

  getCultivationParams: () => ({
    resourceName: '祭品',
    actionName: '祭祀',
    baseCost: 30,
    useStandardFormula: false, // 神话世界祭祀必定成功
    successRateModifier: 0.5,  // +50% 成功率
  }),

  getCombatParams: () => ({
    mpName: '神力',
    abilityName: '神术',
    basicAttackName: '神力打击',
  }),

  getExplorationParams: () => ({
    exploreName: '神域探索',
    hasSpecialMechanics: true,
  }),

  /** 神话修炼：祭祀成功率极高（神明庇佑） */
  customSuccessRate: (baseRate: number) => {
    return Math.min(98, baseRate * 1.5); // 最高 98%
  },

  /** 神话 AI：神降状态下全力攻击 */
  customAutoStrategy: (state: ManualBattleState, strategy: AutoBattleStrategy): BattleAction => {
    // 神降状态下疯狂输出
    if (state.domainActive) {
      const best = state.availableTechniques
        .filter(t => t.isAvailable)
        .sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    // 非神降状态
    if (strategy === 'aggressive') {
      const best = state.availableTechniques
        .filter(t => t.isAvailable)
        .sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    if (strategy === 'conservative') {
      if (state.playerCurrentHp / state.playerMaxHp < 0.35) {
        return { type: 'defend', source: 'ai' };
      }
      return { type: 'attack', source: 'ai' };
    }

    return { type: 'attack', source: 'ai' };
  },
};
