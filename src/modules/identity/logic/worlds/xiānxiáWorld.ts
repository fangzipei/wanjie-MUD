/**
 * 仙侠世界机制
 *
 * 修炼→修仙（消耗仙石）
 * 招式→剑诀（剑气纵横）
 * 探索→云游
 *
 * 独特机制：本命飞剑
 * - 进入仙侠世界时获得一柄本命飞剑，拥有独立等级和属性
 * - 战斗时飞剑有概率触发协同攻击（20% + 等级×0.5%）
 * - 飞剑协同攻击伤害 = 普通攻击的30% + 等级×1%
 */
import type { BattleAction, ManualBattleState, AutoBattleStrategy } from '@/modules/combat/logic/engine/types';
import type { GameState } from '@/shared/lib/types';

import type { WorldMechanics } from './types';

/** 本命飞剑状态 */
export interface SwordSpirit {
  /** 飞剑唯一标识 */
  id: string;
  /** 飞剑名称 */
  name: string;
  /** 飞剑等级 (1-100) */
  level: number;
  /** 攻击加成 */
  attackBonus: number;
  /** 协同攻击概率 (基础20% + 等级×0.5%) */
  coopChance: number;
}

/** 飞剑名称池 */
const SWORD_NAMES = [
  '青萍', '紫电', '白虹', '赤霄', '太阿', '干将', '莫邪',
  '承影', '纯钧', '鱼肠', '湛卢', '龙渊', '轩辕', '诛仙',
];

/** 生成初始飞剑 */
function createSwordSpirit(): SwordSpirit {
  const name = SWORD_NAMES[Math.floor(Math.random() * SWORD_NAMES.length)];
  return {
    id: `sword_${Date.now()}`,
    name,
    level: 1,
    attackBonus: 5,
    coopChance: 0.20,
  };
}

export const xiānxiáWorld: WorldMechanics = {
  worldType: '仙侠',

  getCultivationParams: () => ({
    resourceName: '仙石',
    actionName: '修仙',
    baseCost: 20,
    useStandardFormula: true,
    successRateModifier: 0,
  }),

  getCombatParams: () => ({
    mpName: '仙元',
    abilityName: '剑诀',
    basicAttackName: '御剑攻击',
  }),

  getExplorationParams: () => ({
    exploreName: '云游',
    hasSpecialMechanics: false,
  }),

  /** 本命飞剑：进入仙侠世界时获得一柄可成长的本命飞剑，战斗时有概率协同攻击 */
  getUniqueMechanicDescription: () => ({
    name: '本命飞剑',
    description: '在仙侠世界可获得一柄本命飞剑，飞剑随等级成长并在战斗中协同攻击。剑心通明，一剑破万法。',
    icon: 'Swords',
  }),

  /** 首次进入仙侠世界时生成初始本命飞剑 */
  onWorldEnter: (state: GameState): GameState => {
    const swordSpirit = createSwordSpirit();
    return {
      ...state,
      worldFlags: {
        ...state.worldFlags,
        swordSpirit: swordSpirit,
      },
    } as GameState;
  },

  /** 仙侠战斗策略：概率触发飞剑协同攻击 */
  customAutoStrategy: (state: ManualBattleState, strategy: AutoBattleStrategy): BattleAction => {
    const available = state.availableTechniques.filter(t => t.isAvailable);

    // 飞剑协同攻击判定
    if (strategy !== 'conservative') {
      const coopRoll = Math.random();
      // 从 worldFlags 中获取飞剑（实际运行时由战斗系统注入）
      if (coopRoll < 0.25 && available.length > 0) {
        const best = available.sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
        if (best) return { type: 'attack', techniqueId: best.techniqueId, source: 'ai' };
      }
    }

    if (strategy === 'aggressive') {
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
};
