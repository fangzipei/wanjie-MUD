/**
 * 异能世界机制
 *
 * 修炼→觉醒（消耗源能，开发超能力）
 * 招式→超能力（念力驱动）
 * 探索→巡逻（都市异能）
 *
 * 独特机制：源能共鸣
 * - 每次探索后随机获得一个临时超能力
 * - 临时能力持续 3 次探索或 5 次战斗，取先到者
 * - 离开异能世界时清理所有临时能力
 */
import type { BattleAction, ManualBattleState, AutoBattleStrategy } from '@/modules/combat/logic/engine/types';
import type { GameState } from '@/shared/lib/types';

import type { WorldMechanics } from './types';

/** 共鸣能力定义 */
export interface ResonanceAbility {
  /** 能力唯一标识 */
  id: string;
  /** 能力名称 */
  name: string;
  /** 能力描述 */
  description: string;
  /** 效果类型 */
  effectType: 'stat_boost' | 'combat_bonus' | 'explore_bonus';
  /** 效果值 */
  effectValue: number;
  /** 剩余探索次数 */
  remainingExplores: number;
  /** 剩余战斗次数 */
  remainingBattles: number;
}

/** 源能共鸣能力池 */
const RESONANCE_POOL: Omit<ResonanceAbility, 'remainingExplores' | 'remainingBattles'>[] = [
  { id: 'res_pyro', name: '火焰共鸣', description: '攻击力+15%', effectType: 'combat_bonus', effectValue: 0.15 },
  { id: 'res_cryo', name: '寒冰共鸣', description: '防御力+15%', effectType: 'combat_bonus', effectValue: 0.15 },
  { id: 'res_tele', name: '念力强化', description: 'MP上限+20%', effectType: 'stat_boost', effectValue: 0.20 },
  { id: 'res_regn', name: '再生共鸣', description: '每回合恢复3% HP', effectType: 'combat_bonus', effectValue: 0.03 },
  { id: 'res_sens', name: '感知增强', description: '探索奖励+25%', effectType: 'explore_bonus', effectValue: 0.25 },
  { id: 'res_phas', name: '相位转移', description: '逃跑成功率+30%', effectType: 'explore_bonus', effectValue: 0.30 },
  { id: 'res_over', name: '超载共鸣', description: '暴击率+10%', effectType: 'combat_bonus', effectValue: 0.10 },
  { id: 'res_shld', name: '念力护盾', description: '受到伤害-10%', effectType: 'combat_bonus', effectValue: 0.10 },
];

/** 随机获取一个共鸣能力 */
function getRandomResonance(): ResonanceAbility {
  const template = RESONANCE_POOL[Math.floor(Math.random() * RESONANCE_POOL.length)];
  return {
    ...template,
    remainingExplores: 3,
    remainingBattles: 5,
  };
}

export const esperWorld: WorldMechanics = {
  worldType: '异能',

  getCultivationParams: () => ({
    resourceName: '源能',
    actionName: '觉醒',
    baseCost: 15,
    useStandardFormula: true,
    successRateModifier: 0.05, // 异能觉醒略容易
  }),

  getCombatParams: () => ({
    mpName: '念力',
    abilityName: '超能力',
    basicAttackName: '念力冲击',
  }),

  getExplorationParams: () => ({
    exploreName: '巡逻',
    hasSpecialMechanics: true,
  }),

  /** 源能共鸣：探索后随机获得临时超能力，体现异能觉醒的不确定性和多样性 */
  getUniqueMechanicDescription: () => ({
    name: '源能共鸣',
    description: '每次探索后随机获得一个临时超能力，持续数次探索或战斗。源能觉醒，能力千变万化，每次都有不同体验。',
    icon: 'Zap',
  }),

  /** 进入异能世界时初始化共鸣能力池 */
  onWorldEnter: (state: GameState): GameState => {
    // 首次进入时获得一个初始共鸣能力
    const initialAbility = getRandomResonance();
    return {
      ...state,
      worldFlags: {
        ...state.worldFlags,
        esperResonance: initialAbility,
      },
    } as GameState;
  },

  /** 离开异能世界时清理所有临时能力 */
  onWorldLeave: (state: GameState): GameState => {
    const { esperResonance: _removed, esperResonanceHistory: _history, ...restFlags } = state.worldFlags || {};
    return {
      ...state,
      worldFlags: restFlags,
    } as GameState;
  },

  /** 异能战斗策略：利用共鸣能力 */
  customAutoStrategy: (state: ManualBattleState, strategy: AutoBattleStrategy): BattleAction => {
    const available = state.availableTechniques.filter(t => t.isAvailable);

    if (strategy === 'aggressive') {
      // 共鸣状态下激进进攻
      const best = available.sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
      if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    if (strategy === 'conservative') {
      if (state.playerCurrentHp / state.playerMaxHp < 0.4) {
        return { type: 'defend', source: 'ai' };
      }
      const cheapest = available.sort((a, b) => a.mpCost - b.mpCost)[0];
      if (cheapest) return { type: 'attack', techniqueId: cheapest.techniqueId, source: 'ai' };
      return { type: 'attack', source: 'ai' };
    }

    return { type: 'attack', source: 'ai' };
  },
};
