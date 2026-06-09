/**
 * 高武世界机制
 *
 * 修炼→练功（消耗气血丹，炼体化神）
 * 招式→武功（内力驱动）
 * 探索→闯荡（武道争锋）
 */
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
};
