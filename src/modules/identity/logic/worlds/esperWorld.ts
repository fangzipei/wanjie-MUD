/**
 * 异能世界机制
 *
 * 修炼→觉醒（消耗源能，开发超能力）
 * 招式→超能力（念力驱动）
 * 探索→巡逻（都市异能）
 */
import type { WorldMechanics } from './types';

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
    hasSpecialMechanics: false,
  }),
};
