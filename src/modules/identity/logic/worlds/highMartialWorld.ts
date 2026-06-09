/**
 * 高武世界机制
 *
 * 修炼→练功（消耗气血丹，炼体化神）
 * 招式→武功（内力驱动）
 * 探索→闯荡（武道争锋）
 *
 * 独特机制：气血爆发
 * - HP < 50% 时攻击力增加 (1 - currentHp/maxHp) × 30%
 * - HP < 30% 时获得 15% 伤害减免
 * - 每场战斗最多触发 2 次爆发增益
 */
import type { BattleAction, ManualBattleState, AutoBattleStrategy } from '@/modules/combat/logic/engine/types';
import type { GameState } from '@/shared/lib/types';

import type { WorldMechanics } from './types';

export const highMartialWorld: WorldMechanics = {
  worldType: '高武',

  getCultivationParams: () => ({
    resourceName: '气血丹',
    actionName: '练功',
    baseCost: 18,
    useStandardFormula: true,
    successRateModifier: 0,
  }),

  getCombatParams: () => ({
    mpName: '内力',
    abilityName: '武功',
    basicAttackName: '近身搏杀',
  }),

  getExplorationParams: () => ({
    exploreName: '闯荡',
    hasSpecialMechanics: false,
  }),

  /** 气血爆发：低血量时触发攻击加成和伤害减免，体现越战越勇的武道精神 */
  getUniqueMechanicDescription: () => ({
    name: '气血爆发',
    description: 'HP低于50%时攻击力激增，HP低于30%时获得伤害减免。越战越勇，以力证道，体现武道精神的极致爆发。',
    icon: 'Flame',
  }),

  /** 高武修炼成功率：低血量时修炼效率提升（置之死地而后生） */
  customSuccessRate: (baseRate: number, state: GameState): number => {
    if (!state.protagonist) return baseRate;
    const hpRatio = state.protagonist.currentHp / state.protagonist.maxHp;
    if (hpRatio < 0.3) {
      return Math.min(95, baseRate + 10); // 濒死时修炼效率+10%
    }
    if (hpRatio < 0.5) {
      return Math.min(95, baseRate + 5);  // 低血量时修炼效率+5%
    }
    return baseRate;
  },

  /** 高武战斗策略：气血爆发逻辑 */
  customAutoStrategy: (state: ManualBattleState, strategy: AutoBattleStrategy): BattleAction => {
    const available = state.availableTechniques.filter(t => t.isAvailable);
    const hpRatio = state.playerCurrentHp / state.playerMaxHp;

    // 气血爆发：低血量时越战越勇
    if (hpRatio < 0.3 && strategy !== 'conservative') {
      // HP < 30%: 濒死爆发，全力进攻
      const best = available.sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    if (strategy === 'aggressive') {
      const best = available.sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    if (strategy === 'conservative') {
      if (hpRatio < 0.4) {
        return { type: 'defend', source: 'ai' };
      }
      const cheapest = available.sort((a, b) => a.mpCost - b.mpCost)[0];
      if (cheapest) return { type: 'attack', techniqueId: cheapest.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    return { type: 'attack', source: 'ai' };
  },
};
