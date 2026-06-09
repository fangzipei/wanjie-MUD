/**
 * 模块① 身份创建 — 对外契约
 *
 * 职责：角色生成、世界生成、背景故事、角色评估
 */

// —— 角色生成 ——
export { generateCharacter, generateCharacters, generateId } from './logic/generators';

// —— 角色评估 ——
export { evaluateCharacter, evaluateCharacters } from './logic/characterEvaluation';

// —— 词条系统 ——
export {
  selectRandomTrait,
  generateImpactDescription,
  calculateTotalImpact,
  QUALITY_CONFIG,
} from './logic/traits';
export { WORLD_TRAIT_DEFINITIONS } from './data/traits';
export type { TraitDefinition } from './data/traits';

// —— 姓名系统 ——
export { WORLD_NAME_POOLS } from './data/namePools';

// —— 世界生成 ——
export { getWorldMechanics, hasUniqueMechanics } from './logic/worlds/factory';
export type { WorldMechanics } from './logic/worlds/types';

// —— 世界数据 ——
export { WORLD_DATA, WORLD_COEFFICIENTS, WORLD_TYPES } from './data/worldData';
export { getStatDisplayName } from './data/statDisplayNames';
export {
  calculateWorldDifficultyCoefficient,
  getWorldDifficultyFromCoefficient,
  calculateWorldRewardCoefficient,
  generateWorldDangers,
  generateWorldOpportunities,
  getWorldBaseCoefficient,
} from './data/worldSystem';

// —— 重新导出（generators 中已重新导出这些）——
export {
  getRealmName,
  getPowerSystemDescription,
  getRealmMultiplier,
  getNextRealm,
  getNextMainRealmLevel,
  getAvailableDifficultiesForRealm,
  getMaxLevel,
  getExperienceForLevel,
  getStatBaseForLevel,
  getStatPotentialForLevel,
} from './logic/generators';
export type { RealmSystem } from './logic/generators';
