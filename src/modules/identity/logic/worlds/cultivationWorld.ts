/**
 * 修仙世界机制（baseline）
 *
 * 标准修炼→战斗→探索循环。其他世界类型默认继承此机制。
 */

import type { WorldMechanics } from './types';

/** 修仙世界机制 */
export const cultivationWorld: WorldMechanics = {
  worldType: '修仙',

  getCultivationParams: () => ({
    resourceName: '灵石',
    actionName: '修炼',
    baseCost: 20,
    useStandardFormula: true,
    successRateModifier: 0,
  }),

  getCombatParams: () => ({
    mpName: '真气',
    abilityName: '招式',
    basicAttackName: '普通攻击',
  }),

  getExplorationParams: () => ({
    exploreName: '历练',
    hasSpecialMechanics: false,
  }),

  /** 修仙是入门世界，无独特机制，提供最纯粹的基础修行体验 */
  getUniqueMechanicDescription: () => ({
    name: '入门修行',
    description: '修仙世界是万界之旅的起点，提供最纯粹的基础修行体验。炼气化神，追求长生大道。适合新玩家熟悉游戏核心系统。',
    icon: 'Sparkles',
  }),
};
