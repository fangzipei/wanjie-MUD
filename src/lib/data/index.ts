/**
 * Barrel export for lib/data — game static data modules
 *
 * All game data configurations are re-exported here for unified import from `@/lib/data`.
 */

// 成就数据
export * from './achievementData';

// 炼丹配方
export * from './alchemyRecipes';

// 飞升数据 (explicit exports to avoid getWorldName collision with worldData)
export {
  WORLD_GUARDIANS,
  WORLD_NAME_GENERATORS,
  WORLD_FEATURES,
  ASCENSION_MILESTONES,
  TITLE_SYSTEM,
} from './ascensionData';
export type {
  GuardianAbility,
  GuardianBattleCries,
  GuardianConfig,
  AscensionMilestone,
  TitleEffect,
} from './ascensionData';

// 羁绊数据
export * from './bondData';

// 修炼路径
export * from './cultivationPathData';

// 恶魔数据
export * from './demonData';

// 敌人名称
export * from './enemies';

// 装备数据
export * from './equipment';

// 装备词缀
export * from './equipmentAffixData';

// 事件配置
export * from './events';

// 势力数据
export * from './factionData';

// 势力进度
export * from './factionProgressData';

// 锻造配方
export * from './forgeRecipes';

// 机缘配置
export * from './opportunityConfig';

// 稀有度系统
export * from './raritySystem';

// 境界数据
export * from './realmData';

// 奖励系统
export * from './rewardSystem';

// 功法羁绊
export * from './techniqueBondData';

// 功法数据
export * from './techniques';

// 术语系统
export * from './terminology';

// 词条
export * from './traits';

// 天劫数据
export * from './tribulationData';

// 世界数据
export * from './worldData';

// 世界效果
export * from './worldEffectsData';

// 世界效果工具
export * from './worldEffectsUtils';

// 世界系统
export * from './worldSystem';

// ========== 从 gameData 合并的配置 ==========
// 技能配置 (import directly from @/lib/data/skillConfigs)
// 功法配置 (import directly from @/lib/data/techniqueConfigs)
// 武器配置 (import directly from @/lib/data/weaponConfigs)
// Note: These are not re-exported through the barrel to avoid naming collisions
// with existing data files. Import directly from the specific file.
