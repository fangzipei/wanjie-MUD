/**
 * 科技世界机制
 *
 * 修炼→研究（消耗科技点提升芯片等级）
 * 招式→义体模块（三槽位：脑部/手臂/躯干，过热冷却）
 * 探索→任务
 */

import type { BattleAction, ManualBattleState } from '@/modules/combat/logic/engine/types';
import type { AutoBattleStrategy } from '@/modules/combat/logic/engine/types';

import type { WorldMechanics } from './types';

/** 科技世界机制 */
export const techWorld: WorldMechanics = {
  worldType: '科技',

  getCultivationParams: () => ({
    resourceName: '科技点',
    actionName: '研究',
    baseCost: 20,
    useStandardFormula: true,
    successRateModifier: 0,
  }),

  getCombatParams: () => ({
    mpName: '能量',
    abilityName: '义体模块',
    basicAttackName: '充能攻击',
  }),

  getExplorationParams: () => ({
    exploreName: '任务',
    hasSpecialMechanics: true,
  }),

  /** 科技世界的芯片研究加成 */
  customSuccessRate: (baseRate: number, _state?: unknown) => {
    return Math.min(95, baseRate * 1.05);
  },

  /** 科技世界的战斗策略：考虑过热冷却 */
  customAutoStrategy: (state: ManualBattleState, strategy: AutoBattleStrategy): BattleAction => {
    // 激进：无视过热风险，连续使用最强模块
    if (strategy === 'aggressive') {
      const best = state.availableTechniques
        .filter(t => t.isAvailable)
        .sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) {
        return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      }
      return { type: 'attack', source: 'ai' };
    }

    // 保守：HP < 50% 时防御，否则用低消耗模块
    if (strategy === 'conservative') {
      if (state.playerCurrentHp / state.playerMaxHp < 0.5) {
        return { type: 'defend', source: 'ai' };
      }
      const cheapest = state.availableTechniques
        .filter(t => t.isAvailable)
        .sort((a, b) => a.mpCost - b.mpCost)[0];
      if (cheapest) {
        return { type: 'attack', techniqueId: cheapest.techniqueId, source: 'ai' };
      }
      return { type: 'attack', source: 'ai' };
    }

    // 均衡：随机交替模块
    return { type: 'attack', source: 'ai' };
  },

  /** 芯片研究+义体模块：科技世界的独特赛博改造体系 */
  getUniqueMechanicDescription: () => ({
    name: '芯片研究',
    description: '消耗科技点研究芯片提升等级，义体模块三槽位（脑部/手臂/躯干）提供强大战斗能力，注意过热冷却。研究成功率+5%。',
    icon: 'Cpu',
  }),
};
