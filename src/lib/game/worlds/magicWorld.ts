/**
 * 魔法世界机制
 *
 * 修炼→冥想（产出法力值）
 * 招式→法术（记忆槽位机制：最多4个槽位，每探索可在魔力节点更换1次）
 * 装备→法杖+法袍
 */

import type { WorldMechanics } from './types';
import type { BattleAction, ManualBattleState, AutoBattleStrategy } from '../combat/types';

/** 法术记忆槽位状态 */
export interface SpellMemorySlots {
  /** 已记忆的法术 ID 列表（最多 4 个） */
  memorized: (string | null)[];
  /** 本次探索中已更换次数 */
  swapCount: number;
  /** 最大更换次数 */
  maxSwaps: number;
}

/** 创建默认法术记忆 */
export function createDefaultSpellMemory(): SpellMemorySlots {
  return { memorized: [null, null, null, null], swapCount: 0, maxSwaps: 1 };
}

export const magicWorld: WorldMechanics = {
  worldType: '魔幻',

  getCultivationParams: () => ({
    resourceName: '魔晶',
    actionName: '冥想',
    baseCost: 20,
    useStandardFormula: true,
    successRateModifier: 0,
  }),

  getCombatParams: () => ({
    mpName: '法力值',
    abilityName: '法术',
    basicAttackName: '魔力冲击',
  }),

  getExplorationParams: () => ({
    exploreName: '冒险',
    hasSpecialMechanics: true,
  }),

  /** 魔法 AI：优先使用记忆槽位中的法术 */
  customAutoStrategy: (state: ManualBattleState, strategy: AutoBattleStrategy): BattleAction => {
    // 战斗中只能使用已记忆的法术（槽位机制）
    const memorized = state.availableTechniques.filter(t => t.isAvailable);

    if (strategy === 'aggressive') {
      const best = memorized.sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    if (strategy === 'conservative') {
      if (state.playerCurrentHp / state.playerMaxHp < 0.4) {
        return { type: 'defend', source: 'ai' };
      }
      const cheapest = memorized.sort((a, b) => a.mpCost - b.mpCost)[0];
      if (cheapest) return { type: 'attack', techniqueId: cheapest.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    if (memorized.length > 0) {
      const idx = Math.floor(Math.random() * memorized.length);
      return { type: 'attack', techniqueId: memorized[idx].techniqueId, source: 'ai' };
    }
    return { type: 'attack', source: 'ai' };
  },
};
