/**
 * 武侠世界机制
 *
 * 修炼→打坐（产出内力）
 * 招式→武功（连招递增机制：连续使用同门派武功每回合伤害+15%，最多3层）
 * 装备→神兵+宝甲（双槽位）
 */

import type { BattleAction, ManualBattleState, AutoBattleStrategy } from '@/modules/combat/logic/engine/types';

import type { WorldMechanics } from './types';

/** 武侠连招状态（内部追踪） */
interface ComboState {
  /** 上次使用的武功 ID */
  lastTechniqueId: string | null;
  /** 连招层数 (0-3) */
  stackCount: number;
  /** 伤害增幅比例 */
  damageBonus: number;
}

/** 全局连招追踪（按战斗会话） */
const comboStates = new Map<string, ComboState>();

function getComboState(battleId: string): ComboState {
  if (!comboStates.has(battleId)) {
    comboStates.set(battleId, { lastTechniqueId: null, stackCount: 0, damageBonus: 0 });
  }
  return comboStates.get(battleId)!;
}

export const martialWorld: WorldMechanics = {
  worldType: '武侠',

  getCultivationParams: () => ({
    resourceName: '银两',
    actionName: '打坐',
    baseCost: 15,
    useStandardFormula: true,
    successRateModifier: 0,
  }),

  getCombatParams: () => ({
    mpName: '内力',
    abilityName: '武功',
    basicAttackName: '普通拳脚',
  }),

  getExplorationParams: () => ({
    exploreName: '闯荡江湖',
    hasSpecialMechanics: true,
  }),

  /** 武功连招机制：连续使用同一门派武功递增伤害 */
  customCombatActions: (state) => {
    const actions: BattleAction[] = [];
    for (const tech of state.availableTechniques) {
      if (tech.isAvailable) {
        actions.push({
          type: 'attack',
          techniqueId: tech.techniqueId,
          source: 'player',
        });
      }
    }
    return actions;
  },

  /** 武侠 AI：优先维持连招 */
  customAutoStrategy: (state: ManualBattleState, strategy: AutoBattleStrategy): BattleAction => {
    const comboState = getComboState('current');
    const available = state.availableTechniques.filter(t => t.isAvailable);

    if (strategy === 'aggressive') {
      // 激进：维持连招，选威力最高的可用武功
      if (comboState.lastTechniqueId && comboState.stackCount > 0) {
        const keepCombo = available.find(t => t.techniqueId === comboState.lastTechniqueId);
        if (keepCombo) return { type: 'attack', techniqueId: keepCombo.techniqueId, source: 'ai' };
      }
      const best = available.sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    if (strategy === 'conservative') {
      if (state.playerCurrentHp / state.playerMaxHp < 0.5) {
        return { type: 'defend', source: 'ai' };
      }
      const cheapest = available.sort((a, b) => a.mpCost - b.mpCost)[0];
      if (cheapest) return { type: 'attack', techniqueId: cheapest.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    return { type: 'attack', source: 'ai' };
  },

  /** 武功连招：连续使用同门派武功伤害递增，最高+45% */
  getUniqueMechanicDescription: () => ({
    name: '连招递增',
    description: '连续使用同一门派的武功每回合伤害+15%，最多叠加3层（+45%）。保持连招是武侠战斗的核心策略。',
    icon: 'Waves',
  }),
};
