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
export { generateWorld, generateWorlds, generateBackstory, DEFAULT_WORLD_SEEDS } from './logic/generators';
export { getWorldMechanics, hasUniqueMechanics } from './logic/worlds/factory';
export type { WorldMechanics } from './logic/worlds/types';

// —— 已生成的世界数据（永久持久化） ——
export { AVAILABLE_WORLDS } from './data/worlds';

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

// —— 世界审查工具 ——
export { calculateDifferentiationScore, findHighOverlapPairs, generateAuditReport, runAudit } from './logic/worldAudit';
export type { DifferentiationScore, WorldPairSimilarity } from './logic/worldAudit';

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
