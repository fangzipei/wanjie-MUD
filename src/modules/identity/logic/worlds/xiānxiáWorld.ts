/**
 * 仙侠世界机制
 *
 * 修炼→修仙（消耗仙石）
 * 招式→剑诀（剑气纵横）
 * 探索→云游
 */
import type { WorldMechanics } from './types';

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
};
