import { FragmentDropData, FragmentDropResult } from '@/modules/crafting/logic/fragmentSystem';
import type { RealmSystem } from '@/modules/progression/data/realmCore';

// 重新导出难度级别类型
export type { DifficultyLevel } from '@/modules/identity/data/worldData';

// 重新导出碎片相关类型
export type { FragmentDropData, FragmentDropResult } from '@/modules/crafting/logic/fragmentSystem';

// 重新导出势力相关类型
export type { Faction, FactionType } from '@/modules/faction/data/factionData';
export { FactionTypeNames, getFactionsByWorld, getFactionById } from '@/modules/faction/data/factionData';

// 重新导出克制关系类型
export type { Element, WeaponCategory } from '@/modules/combat/logic/restraintSystem';
export {
  ELEMENT_NAMES,
  WEAPON_CATEGORY_NAMES,
  ELEMENT_KEYWORDS,
  WEAPON_KEYWORDS,
  getElementIcon,
  getWeaponCategoryIcon,
} from '@/modules/combat/logic/restraintSystem';

// 敌人等级类型（在此定义，避免循环依赖）
export type EnemyTier = 'normal' | 'elite' | 'miniboss' | 'boss';

/**
 * 固定属性（由词条决定，不可通过修炼提升）
 * 包含基础值50 + 词条加成
 */
export interface BaseStats {
  体质: number;
  灵根: number;
  悟性: number;
  幸运: number;
  意志: number;
}

/**
 * 可成长属性（通过修炼、突破等事件获得）
 * 初始为0，上限=等级×2
 */
export interface GrowthStats {
  体质: number;
  灵根: number;
  悟性: number;
  幸运: number;
  意志: number;
}

/**
 * 角色属性完整结构
 * 
 * 设计说明：
 * - base（固定属性）：由词条决定，永久保留，不可通过修炼提升
 * - growth（可成长属性）：通过修炼/突破事件获得，有等级上限
 */
export interface CharacterStats {
  base: BaseStats;
  growth: GrowthStats;
}

/**
 * 快捷函数：获取最终属性（base + growth）
 */
export function getFinalStats(stats: CharacterStats): BaseStats {
  return {
    体质: stats.base.体质 + stats.growth.体质,
    灵根: stats.base.灵根 + stats.growth.灵根,
    悟性: stats.base.悟性 + stats.growth.悟性,
    幸运: stats.base.幸运 + stats.growth.幸运,
    意志: stats.base.意志 + stats.growth.意志,
  };
}

/**
 * 属性键类型
 */
export type StatKey = '体质' | '灵根' | '悟性' | '幸运' | '意志';

/**
 * 快捷函数：获取属性键列表
 */
export function getStatKeys(): StatKey[] {
  return ['体质', '灵根', '悟性', '幸运', '意志'];
}

/**
 * 向后兼容的类型别名：允许直接使用属性名
 * 用于数据文件和需要直接访问属性的场景
 */
export type LegacyStats = Record<StatKey, number>;

/**
 * 创建向后兼容的 stats 对象（base + growth 合并）
 */
export function createCombinedStats(base: BaseStats, growth: GrowthStats): LegacyStats {
  return {
    体质: base.体质 + growth.体质,
    灵根: base.灵根 + growth.灵根,
    悟性: base.悟性 + growth.悟性,
    幸运: base.幸运 + growth.幸运,
    意志: base.意志 + growth.意志,
  };
}

/**
 * 工厂函数：创建默认 CharacterStats
 */
export function createDefaultStats(baseValues?: Partial<BaseStats>): CharacterStats {
  const defaultBase: BaseStats = {
    体质: 50,
    灵根: 50,
    悟性: 50,
    幸运: 50,
    意志: 50,
    ...baseValues,
  };
  return {
    base: defaultBase,
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
  };
}

/**
 * 工厂函数：从旧格式创建 CharacterStats（用于向后兼容）
 */
export function fromOldStats(oldStats: BaseStats): CharacterStats {
  return {
    base: { ...oldStats },
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
  };
}

/**
 * 工厂函数：创建带加成的 CharacterStats
 */
export function createStatsWithBonuses(
  baseValues: BaseStats,
  growthBonuses: Partial<GrowthStats>
): CharacterStats {
  return {
    base: { ...baseValues },
    growth: {
      体质: growthBonuses.体质 || 0,
      灵根: growthBonuses.灵根 || 0,
      悟性: growthBonuses.悟性 || 0,
      幸运: growthBonuses.幸运 || 0,
      意志: growthBonuses.意志 || 0,
    },
  };
}

/**
 * 更新成长属性
 */
export function updateGrowthStats(
  stats: CharacterStats,
  changes: Partial<GrowthStats>
): CharacterStats {
  return {
    ...stats,
    growth: {
      ...stats.growth,
      ...changes,
    },
  };
}

/**
 * 更新基础属性
 */
export function updateBaseStats(
  stats: CharacterStats,
  changes: Partial<BaseStats>
): CharacterStats {
  return {
    ...stats,
    base: {
      ...stats.base,
      ...changes,
    },
  };
}

/**
 * 获取可成长属性上限
 * @param level 等级
 * @returns 可成长属性上限
 */
export function getGrowthStatCap(level: number): number {
  return level * 2;
}

/**
 * 限制可成长属性值不超过上限
 * @param value 当前属性值
 * @param level 等级
 * @returns 限制后的属性值
 */
export function clampGrowthStatValue(value: number, level: number): number {
  const maxCap = getGrowthStatCap(level);
  return Math.max(0, Math.min(value, maxCap));
}

/**
 * 创建默认角色属性
 */
export function createDefaultCharacterStats(): CharacterStats {
  const base = 50;
  return {
    base: { 体质: base, 灵根: base, 悟性: base, 幸运: base, 意志: base },
    growth: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
  };
}

/**
 * 统一品质类型（全局统一，从高到低）
 * 红色(mythic) > 橙色(legendary) > 黄色(epic) > 紫色(rare) > 蓝色(uncommon) > 绿色(common) > 灰色(poor) > 白色(basic)
 */
export type Quality = 'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common' | 'poor' | 'basic';

// 品质中文名称映射
export const QualityNames: Record<Quality, string> = {
  mythic: '传说',
  legendary: '史诗',
  epic: '稀有',
  rare: '精良',
  uncommon: '优秀',
  common: '普通',
  poor: '劣质',
  basic: '基础',
};

// 影响类型（兼容旧代码，映射到品质）
export type ImpactLevel = 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';

// 属性名称类型
export type StatName = '体质' | '灵根' | '悟性' | '幸运' | '意志';

// 属性影响
export interface StatImpact {
  体质?: number;
  灵根?: number;
  悟性?: number;
  幸运?: number;
  意志?: number;
}

// 带影响的词条
export interface ImpactfulTrait {
  name: string;
  description: string; // 简短描述对属性的影响
  impact: StatImpact;
  totalImpact: number; // 总影响权重（正数为增益，负数为减益）
  level: ImpactLevel;
}

// 角色信息
export interface Character {
  id: number;
  name: string;
  gender: '男' | '女';
  age: number;
  origin: ImpactfulTrait; // 出身（带影响）
  trait: ImpactfulTrait; // 特性（新增，带影响）
  personality: ImpactfulTrait; // 性格（带影响）
  talent: ImpactfulTrait; // 天赋（带影响）
  background: string; // 背景故事
  stats: CharacterStats;
  totalPower: number; // 总权重，用于平衡
  /** 多维度评分 */
  dimensionScores?: DimensionScores;
  /** 检测到的协同效果 */
  synergies?: SynergyEffect[];
  /** 角色定位 */
  archetype?: RoleProfile;
}

// ============================================
// 角色评估系统类型
// ============================================

/**
 * 维度评分
 */
export interface DimensionScores {
  combat: number;      // 战斗评分
  cultivation: number; // 修炼评分
  survival: number;    // 生存评分
  exploration: number;  // 探索评分
  overall: number;     // 综合评分
}

/**
 * 角色定位类型
 */
export type RoleArchetype = 
  | 'combat_warrior'    // 战斗型
  | 'cultivation_genius' // 修炼型
  | 'survival_master'    // 生存型
  | 'fortune_seeker'     // 探索型
  | 'balanced'           // 均衡型
  | 'specialist';       // 特化型

/**
 * 角色定位档案
 */
export interface RoleProfile {
  archetype: RoleArchetype;
  label: string;                    // 定位标签（如"战斗型"）
  description: string;               // 定位描述
  recommendedPlaystyle: string;      // 推荐玩法
  strengths: string[];               // 优势
  weaknesses: string[];              // 劣势
}

/**
 * 协同效果
 */
export interface SynergyEffect {
  id: string;                        // 效果ID
  name: string;                      // 效果名称（如"战魂"）
  description: string;               // 效果描述
  traits: string[];                 // 参与的词条名列表
  stats: string[];                  // 影响的属性列表
  bonus: number;                     // 额外加成值
  type: 'combat' | 'cultivation' | 'survival' | 'exploration';
}

/**
 * 完整角色评估
 */
export interface CharacterEvaluation {
  scores: DimensionScores;
  synergies: SynergyEffect[];
  archetype: RoleProfile;
  hints: string[];
}

// 世界类型
export type WorldType = '修仙' | '高武' | '科技' | '魔幻' | '异能' | '仙侠' | '武侠' | '末世';

// 世界难度等级（由世界系数决定）
export type WorldDifficulty = '简单' | '普通' | '困难' | '噩梦' | '地狱' | '深渊';

// 世界影响
export interface WorldImpact {
  description: string; // 描述
  impact: StatImpact; // 对属性的影响
  impactDescription: string; // 影响说明
}

// 世界中的势力信息（生成后）
export interface WorldFaction {
  id: string;
  name: string;
  type: string; // 势力类型名称（宗门、皇朝等）
  description: string;
}

// 世界信息
export interface World {
  id: number;
  name: string;
  type: WorldType;
  description: string;
  powerSystem: string; // 力量体系描述（用于显示）
  realmSystem: RealmSystem; // 境界系统（用于计算）
  majorForces: string; // 主要势力描述（兼容旧代码）
  /** 具体势力列表（新生成） */
  factions: WorldFaction[];
  
  // === 难度系统 ===
  /** 世界基础系数（固定值，根据世界类型） */
  baseCoefficient: number;
  /** 世界实际系数（基础系数 + 飞升加成） */
  actualCoefficient: number;
  /** 世界难度（由实际系数计算得出） */
  difficulty: WorldDifficulty;
  
  // === 危险与机缘 ===
  /** 世界危险效果列表 */
  dangers: import('@/modules/identity/data/worldEffectsData').WorldDanger[];
  /** 世界机缘效果列表 */
  opportunities: import('@/modules/identity/data/worldEffectsData').WorldOpportunity[];
  
  // === 奖励系数 ===
  /** 奖励系数 */
  rewardCoefficient: import('@/modules/identity/data/worldEffectsData').WorldRewardCoefficient;
}

// 道具类型
export type ItemType = '丹药' | '材料' | '功法' | '装备' | '消耗品' | '灵石' | '碎片';

// 道具稀有度（新增神话等级）
export type ItemRarity = '普通' | '稀有' | '史诗' | '传说' | '神话';

// 道具效果类型
export type EffectType = 
  | 'cultivation_boost' // 修炼增益
  | 'stat_boost' // 属性增益
  | 'restore' // 恢复
  | 'luck_boost' // 幸运增益
  | 'combat_boost' // 战斗增益
  | 'breakthrough_boost' // 突破增益
  | 'restore_hp' // 恢复生命
  | 'restore_mp'; // 恢复法力

// 道具效果
export interface ItemEffect {
  type: EffectType;
  value: number;
  duration?: number; // 持续次数，-1表示永久
  description: string;
}

// 道具定义
export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  effects: ItemEffect[];
  stackable: boolean;
  maxStack: number;
  worldTypes?: WorldType[]; // 限定世界类型，undefined表示通用
  // 丹药境界限制
  realmLevel?: number; // 适用境界等级（1-10），用于丹药
  unlockLevel?: number; // 解锁等级，用于丹药和其他物品
}

// 背包道具实例
export interface InventoryItem {
  id: string;
  definition: ItemDefinition;
  quantity: number;
  remainingUses?: number; // 剩余使用次数（用于持续效果道具）
}

/**
 * 创建背包道具实例的工厂函数
 * 自动生成唯一 ID
 */
export function createInventoryItem(
  definition: ItemDefinition,
  quantity: number = 1,
  existingItem?: Partial<InventoryItem>
): InventoryItem {
  return {
    id: existingItem?.id || `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    definition,
    quantity,
    remainingUses: existingItem?.remainingUses,
  };
}

/**
 * 将旧格式的 InventoryItem（无 id）转换为新格式（有 id）
 */
export function migrateInventoryItem(item: Partial<InventoryItem> & { definition: ItemDefinition; quantity: number }): InventoryItem {
  if (item.id) {
    return item as InventoryItem;
  }
  return createInventoryItem(item.definition, item.quantity);
}

// 活跃效果（正在生效的道具效果）
export interface ActiveEffect {
  itemId: string;
  itemName: string;
  type: EffectType;
  value: number;
  remainingCount: number; // 剩余次数
}

// 战斗记录
export interface BattleLog {
  round: number;
  attacker: 'player' | 'enemy';
  action: string;
  damage?: number;
  heal?: number;
  special?: string;
}

// 战斗状态
export interface BattleState {
  enemyName: string;
  enemyMaxHp: number;
  enemyCurrentHp: number;
  enemyAttack: number;
  enemyDefense: number;
  enemyLevel: number;
  enemyRealm: string;
  enemyTier?: EnemyTier; // 敌人等级类型
  enemyCombatPower: number; // 敌人战力
  playerMaxHp: number;
  playerCurrentHp: number;
  playerMaxMp: number;
  playerCurrentMp: number;
  playerAttack: number;
  playerDefense: number;
  playerCombatPower: number; // 玩家战力
  logs: BattleLog[];
  currentRound: number;
  isOver: boolean;
  victory?: boolean;
  /** 是否通过逃跑结束战斗 */
  fled?: boolean;
}

/**
 * 交互式战斗状态
 * 用于手动操作战斗流程
 */
export interface ActiveBattleState {
  /** 战斗格子类型 */
  cellType: CellType;
  /** 敌人名称 */
  enemyName: string;
  /** 敌人等级 */
  enemyLevel: number;
  /** 敌人格子位置 */
  cellPosition: { row: number; col: number };
  /** 战斗是否开始 */
  isActive: boolean;
  /** 战斗来源：adventure(历练) 或 tower(爬塔) */
  source?: 'adventure' | 'tower';
  /** 爬塔楼层（仅 source='tower' 时有效） */
  towerFloor?: number;
  /** 爬塔敌人信息（用于战斗结算） */
  towerEnemy?: import('@/modules/tower/logic/types').TowerEnemy;
}

// 主角完整信息
export interface Protagonist {
  character: Character;
  world: World;
  backstory: string;
  level: number;
  realm: string;
  stats: CharacterStats;
  statCapBonuses: Partial<BaseStats>; // 属性上限加成（来自机缘等）
  inventory: InventoryItem[]; // 背包（包含所有物品和资源）
  activeEffects: ActiveEffect[]; // 当前生效的效果
  experience: number;
  overflowExperience: number; // 超出上限的经验（升级后会保留到下一级）
  // HP/MP系统
  currentHp: number; // 当前生命值
  maxHp: number; // 最大生命值
  currentMp: number; // 当前法力值
  maxMp: number; // 最大法力值
  // 功法系统
  techniques: Technique[]; // 已获得的功法
  equippedAttackTechniques: (Technique | null)[]; // 装备的攻击功法（最多3本）
  equippedDefenseTechniques: (Technique | null)[]; // 装备的防御功法（最多3本）
  // 装备系统
  equipments: Equipment[]; // 已获得的装备
  equippedMelee: Equipment | null; // 装备的近战武器
  equippedRanged: Equipment | null; // 装备的远程武器
  equippedHead: Equipment | null; // 装备的头部护甲
  equippedBody: Equipment | null; // 装备的身体护甲
  equippedLegs: Equipment | null; // 装备的腿部护甲
  equippedFeet: Equipment | null; // 装备的脚部护甲
  // 势力系统
  factionId: string | null; // 当前加入的势力ID
  factionJoinTime?: number; // 加入势力的时间戳
  // 扩展系统 - 修炼流派
  cultivationPath?: CultivationPath | null; // 当前修炼流派
  pathExp?: number; // 流派经验
  pathLevel?: number; // 流派等级
  // 修炼系统扩展
  cultivationCooldown?: number; // 修炼冷却结束时间戳（顿悟失败后）
  insightMarks?: number; // 顿悟印记数量
  // 扩展系统 - 心境状态
  mentalState?: import('./typesExtension').MentalState; // 心境状态
  // 扩展系统 - 势力进度
  factionProgress?: import('./typesExtension').FactionProgress | null; // 势力声望与任务进度
  currencies?: PlayerCurrencies; // 玩家货币（贡献点等）
  // 体力系统
  stamina?: number; // 当前体力
  maxStamina?: number; // 最大体力
  lastStaminaRecover?: number; // 上次体力恢复时间戳
  // 任务冷却系统（任务ID -> 冷却结束时间戳）
  taskCooldowns?: Record<string, number>;
  // 飞升系统
  ascensionMark?: import('./typesExtension').AscensionMark; // 飞升印记
  guardianBattle?: import('./typesExtension').GuardianBattleState; // 守卫战斗状态
  worldVisitHistory?: import('./typesExtension').WorldVisitRecord[]; // 世界访问历史
  ascensionHistory?: import('./typesExtension').AscensionRecord[]; // 飞升历史记录
  // 残本/残片系统
  fragmentInventory?: import('@/modules/crafting/logic/fragmentSystem').FragmentInventory; // 残本/残片库存
  // 爬塔系统
  towerProgress?: import('@/modules/tower/logic/types').TowerProgress; // 爬塔进度
}

// 修炼流派类型（与 cultivationPathData.ts 保持一致）
export type CultivationPath = 'body' | 'sword' | 'spell' | 'alchemy' | 'demon';

// 势力进度（扩展）- 重新导出以保持类型一致
export type { FactionProgress, ReputationLevel, TaskProgress } from './typesExtension';

// 玩家货币（扩展）
// 完整货币定义请使用 import { PlayerCurrencies } from './shop/types'
// 此处保留简化版本用于向后兼容
export interface PlayerCurrencies {
  spirit_stone?: number; // 灵石
  contribution: number; // 势力贡献点
  sect_point?: number; // 宗门积分
  honor_point?: number; // 荣誉值
  ascension_mark?: number; // 飞升印记
  event_token?: number; // 活动代币
}

// 功法槽位数量
export const TECHNIQUE_SLOT_COUNT = 3;

// 功法类型
export type TechniqueType = 'attack' | 'defense';

// 功法定义（重构版 - 包含法技系统）
export interface Technique {
  // ========== 基础属性 ==========
  id: string;
  name: string;
  type: TechniqueType;
  rarity: ItemRarity;
  description: string;
  
  // ========== 等级系统（10级制） ==========
  level: number; // 功法等级（1-maxLevel）
  exp: number; // 当前经验值
  expToNext: number; // 升级所需经验
  maxLevel: number; // 最大等级（按稀有度：普通5/稀有7/史诗8/传说9/神话10）
  
  // ========== 基础数值 ==========
  power: number; // 功法威力
  bonus: number; // 加成百分比
  baseMpCost: number; // 基础法力消耗
  
  // ========== 元素属性 ==========
  element: import('@/modules/combat/logic/restraintSystem').Element; // 主元素属性（必有）
  subElement?: import('@/modules/combat/logic/restraintSystem').Element; // 副元素属性（稀有及以上可能拥有）
  
  // ========== 武器契合 ==========
  compatibleWeapon: import('@/modules/combat/logic/restraintSystem').WeaponCategory | null; // 契合武器类型
  compatibleBonus: number; // 契合加成百分比
  
  // ========== 法技系统 ==========
  skillSlots: number; // 已解锁的技能槽位数量
  maxSkillSlots: number; // 最大技能槽位数量
  allSkills: import('@/modules/techniques/logic/skillTypes').TechniqueSkill[]; // 全部可解锁技能
  equippedSkills: (string | null)[]; // 当前装备的技能ID列表（按槽位顺序，null表示空槽）
  
  // ========== 来源信息 ==========
  worldType?: WorldType; // 世界类型（可选）
  source: 'drop' | 'synthesis' | 'quest' | 'initial'; // 来源
  
  // ========== 残本系统 ==========
  isFragment: boolean; // 是否为残本
  fragmentIndex?: number; // 残本序号（1-N）
  fragmentsRequired?: number; // 完本所需残本数量
  relatedFragmentIds?: string[]; // 关联的残本ID列表
  
  // ========== 兼容字段（旧代码过渡用，后续可删除） ==========
  mpCost?: number; // 法力消耗（旧系统）
  proficiency?: number; // 熟练度（旧系统）
  proficiencyLevel?: number; // 熟练度等级（旧系统）
}

// 装备槽位类型
export type EquipmentSlot = 'melee' | 'ranged' | 'head' | 'body' | 'legs' | 'feet';

// 装备槽位名称
export const EquipmentSlotNames: Record<EquipmentSlot, string> = {
  melee: '近战',
  ranged: '远程',
  head: '头部',
  body: '身体',
  legs: '腿部',
  feet: '脚部',
};

// 装备槽位影响属性
export const EquipmentSlotEffect: Record<EquipmentSlot, 'attack' | 'defense'> = {
  melee: 'attack',
  ranged: 'attack',
  head: 'defense',
  body: 'defense',
  legs: 'defense',
  feet: 'defense',
};

// 装备定义（重构版 - 包含斗技系统）
export interface Equipment {
  // ========== 基础属性 ==========
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  description: string;
  
  // ========== 等级系统（10级制） ==========
  level: number; // 武器等级（1-maxLevel）
  exp: number; // 当前经验值
  expToNext: number; // 升级所需经验
  maxLevel: number; // 最大等级（按稀有度：普通5/稀有7/史诗8/传说9/神话10）
  
  // ========== 武器类型 ==========
  weaponCategory: import('@/modules/combat/logic/restraintSystem').WeaponCategory | null; // 武器类别（仅武器类装备有）
  
  // ========== 元素契合 ==========
  element: import('@/modules/combat/logic/restraintSystem').Element | null; // 主元素属性
  compatibleElement: import('@/modules/combat/logic/restraintSystem').Element | null; // 契合元素类型
  compatibleBonus: number; // 契合加成百分比
  
  // ========== 基础数值 ==========
  attackBonus: number; // 攻击加成
  defenseBonus: number; // 防御加成
  power: number; // 装备威力值
  
  // ========== 斗技系统 ==========
  techniqueSlots: number; // 已解锁的技巧槽位数量
  maxTechniqueSlots: number; // 最大技巧槽位数量
  allTechniques: import('@/modules/techniques/logic/skillTypes').WeaponTechnique[]; // 全部可解锁技巧
  equippedTechniques: (string | null)[]; // 当前装备的技巧ID列表
  
  // ========== 来源信息 ==========
  worldType?: WorldType; // 世界类型（可选）
  source: 'drop' | 'reforge' | 'quest' | 'initial'; // 来源
  
  // ========== 残片系统 ==========
  isFragment: boolean; // 是否为残片
  fragmentIndex?: number; // 残片序号（1-N）
  fragmentsRequired?: number; // 重铸所需残片数量
  
  // ========== 兼容字段（旧代码过渡用，后续可删除） ==========
  enhancement?: number; // 强化等级（旧系统）
  refinement?: number; // 重铸次数（旧系统）
  affixes?: import('@/modules/equipment/data/equipmentAffixData').EquipmentAffix[]; // 词缀列表（旧系统）
  setId?: string | null; // 套装ID（旧系统）
}

// 装备词缀 - 重新导出以保持类型一致
export type { EquipmentAffix, AffixType, AffixEffect } from '@/modules/equipment/data/equipmentAffixData';

// 升级系统类型
export type UpgradeableItemType = 'technique' | 'equipment';

// 升级材料（可升级物品的统一表示）
export interface UpgradeMaterial {
  id: string;
  name: string;
  type: UpgradeableItemType;
  rarity: ItemRarity;
  level: number;
  exp: number;
  expValue: number; // 作为材料时提供的经验值
}

// 升级配置
export const UPGRADE_CONFIG = {
  maxLevel: 10, // 最高等级
  baseExpRequired: 100, // 1级升2级所需基础经验
  expMultiplier: 1.5, // 每级所需经验倍率
  materialExpBase: 50, // 1级材料提供的基础经验
  materialExpPerLevel: 30, // 每级额外提供的经验
  rarityExpMultiplier: {
    '普通': 1,
    '稀有': 1.5,
    '史诗': 2,
    '传说': 3,
    '神话': 4,
  },
};

// 游戏阶段
export type GamePhase = 'character-select' | 'world-select' | 'backstory' | 'playing';

// 修炼结果
export interface CultivationResult {
  success: boolean;
  message: string;
  statChanges: Partial<GrowthStats>;
  itemsCost?: InventoryItem[]; // 消耗的道具
  canAfford?: boolean; // 是否有足够资源
  breakthroughAttempt?: boolean; // 是否尝试突破
  breakthroughSuccess?: boolean; // 突破是否成功
  cultivationBoost?: number; // 丹药加成百分比
  baseGains?: Partial<GrowthStats>; // 基础数值（不含加成）
  boostGains?: Partial<GrowthStats>; // 丹药加成数值
  experienceGain?: number; // 获得的经验值
  experienceBoost?: number; // 丹药带来的经验值加成
}

/**
 * 属性变化类型 - 支持新旧两种格式
 */
export type StatChanges = Partial<LegacyStats>;

// 历练事件选项
export interface EventChoice {
  text: string;
  effects: {
    stats?: Partial<GrowthStats>;
    items?: InventoryItem[]; // 可能获得道具
    experience?: number;
    special?: string;
  };
  result: string;
  /** 战斗选项：触发战斗 */
  battle?: {
    /** 敌人类型 */
    enemyType: 'enemy' | 'boss';
    /** 敌人等级偏移（相对于玩家等级） */
    levelOffset?: number;
  };
}

// 历练事件
export interface AdventureEvent {
  id: number;
  title: string;
  description: string;
  choices: EventChoice[];
}

// 机缘冒险格子类型
export type CellType = 'empty' | 'treasure' | 'enemy' | 'elite' | 'miniboss' | 'boss' | 'event' | 'rest' | 'portal';

// 机缘冒险格子
export interface AdventureCell {
  type: CellType;
  cleared: boolean;
  content?: string;
  portalTarget?: { row: number; col: number }; // 传送目标位置
  visited?: boolean; // 是否被访问过
}

// 秘境难度配置
export interface DungeonConfig {
  rows: number; // 行数
  cols: number; // 列数
  difficulty: number; // 难度等级（对应境界）
  realmName: string; // 境界名称
  enemyLevelMin: number; // 敌人最小等级
  enemyLevelMax: number; // 敌人最大等级
  rewardMultiplier: number; // 奖励倍率
  portalCount: number; // 传送门数量
  difficultyLevel?: 'easy' | 'normal' | 'hard' | 'nightmare'; // 难度级别
  requiredPower?: number; // 一键扫荡所需战力（保留用于判断是否可扫荡）
  staminaCost?: number; // 扫荡消耗体力
  isNovice?: boolean; // 是否为新手引导难度
  isUnlocked?: boolean; // 是否已解锁（机缘等级 <= 玩家等级）
}

// 机缘战斗结果
export interface BattleResult {
  victory: boolean;
  /** 是否通过逃跑结束（仅当 victory=false 时有效） */
  fled?: boolean;
  message: string;
  battleState?: BattleState; // 战斗过程
  rewards?: {
    stats?: Partial<GrowthStats>;
    items?: InventoryItem[]; // 可能获得道具
    experience?: number;
    technique?: Technique; // 可能获得功法
    equipment?: Equipment; // 可能获得装备
    fragments?: FragmentDropData[]; // 碎片奖励
    techniques?: Technique[]; // 完整功法掉落（多个，新增）
    equipments?: Equipment[]; // 完整装备掉落（多个，新增）
    completeItems?: FragmentDropResult['completeItems']; // 完整物品掉落（功法/装备，新增）
  };
  hpRestored?: number; // 休息格恢复的HP
  mpRestored?: number; // 休息格恢复的MP
  playerHpAfter?: number; // 战斗后的HP
  playerMpAfter?: number; // 战斗后的MP
  fragmentDrop?: FragmentDropResult; // 碎片掉落详情
}

// 消息记录
export interface MessageRecord {
  id: string;
  timestamp: number;
  type: 'success' | 'failure' | 'info' | 'warning';
  title: string;
  content: string;
  details?: string;
  rewards?: {
    stats?: Partial<GrowthStats>;
    statDetails?: { stat: string; base: number; boost: number }[]; // 详细属性变化：基础+加成
    items?: InventoryItem[];
    experience?: number;
    experienceBoost?: number; // 丹药带来的经验值加成
    technique?: Technique;
    equipment?: Equipment;
    techniques?: Technique[]; // 完整功法掉落（多个，新增）
    equipments?: Equipment[]; // 完整装备掉落（多个，新增）
    fragments?: FragmentDropData[]; // 碎片掉落奖励
  };
}

// 通用行动结果
export interface ActionResult {
  success?: boolean;
  victory?: boolean;
  message: string;
  statChanges?: Partial<GrowthStats>;
  itemsCost?: InventoryItem[];
  rewards?: {
    stats?: Partial<GrowthStats>;
    items?: InventoryItem[];
    experience?: number;
  };
  battleState?: BattleState; // 战斗过程
  breakthroughAttempt?: boolean; // 是否尝试突破
  breakthroughSuccess?: boolean; // 突破是否成功
}

// 当前操作Tab
export type ActionTab = 'cultivation' | 'experience' | 'adventure' | 'shop' | 'technique' | 'equipment' | 'skill' | 'alchemy' | 'forge' | 'fragment' | 'tower' | 'achievement' | 'collection' | 'statistics';

// 机缘难度选择阶段
export type AdventurePhase = 'select' | 'playing';

// 游戏状态
// 炼丹状态
export interface CraftingState {
  recipeId: string;
  startTime: number;
  duration: number;
  quality: '极品' | '上品' | '中品' | '下品';
  success: boolean;
}

// 炼器状态
export interface ForgingState {
  recipeId: string;
  startTime: number;
  duration: number;
  quality: '完美' | '优秀' | '精良' | '普通';
  success: boolean;
}

// ============================================
// 机缘行动力系统
// ============================================

/** 机缘会话行动力状态 */
export interface AdventureSessionState {
  /** 是否在机缘中 */
  isActive: boolean;
  /** 当前行动力 */
  currentStamina: number;
  /** 最大行动力 */
  maxStamina: number;
  /** 进入时间戳 */
  enterTime: number;
  /** 上次退出机缘时间戳（用于冷却） */
  lastExitTime: number;
  /** 已击败的敌人数量 */
  enemiesDefeated: number;
  /** 是否已击败Boss */
  bossDefeated: boolean;
}

export interface GameState {
  phase: GamePhase;
  characters: Character[];
  worlds: World[];
  selectedCharacter: Character | null;
  selectedWorld: World | null;
  protagonist: Protagonist | null;
  currentEvent: AdventureEvent | null;
  lastActionResult: ActionResult | null;
  adventureGrid: AdventureCell[][] | null;
  adventurePosition: { row: number; col: number } | null;
  adventureConfig: DungeonConfig | null; // 秘境配置
  adventurePhase: AdventurePhase; // 机缘阶段
  adventureLoot: InventoryItem[]; // 机缘战利品（物品）
  adventureExperience: number; // 机缘战利品（待结算经验值）
  adventureFragments?: FragmentDropData[]; // 机缘战利品（碎片）
  /** 机缘会话状态（行动力、击败数等） */
  adventureSession?: AdventureSessionState | null;
  currentTab: ActionTab;
  battleState: BattleState | null; // 当前战斗状态（用于显示战斗结果）
  /** 交互式战斗状态（用于手动操作战斗） */
  activeBattle: ActiveBattleState | null;
  messages: MessageRecord[]; // 消息记录（内存中只保留最新100条）
  totalMessageCount: number; // 消息总数量
  autoCultivating: boolean; // 自动修炼状态
  autoBattle: boolean; // 自动战斗状态（默认false，需要手动操作）
  lastExploreTime: number; // 上次历练的时间戳（用于CD，兼容旧版）
  crafting: CraftingState | null; // 炼丹状态
  forging: ForgingState | null; // 炼器状态
  // 统计数据（用于成就和图鉴）
  statistics: GameStatistics;
  // 已解锁的成就ID列表
  unlockedAchievementIds: string[];
  // 已领取奖励的成就ID列表
  claimedAchievementIds: string[];
  // 已完成的新手任务ID列表（持久化，防止进度后退）
  completedTutorialTaskIds: string[];
  // 是否已完成新手机缘（用于显示新手难度选项）
  hasCompletedNoviceAdventure?: boolean;
  // 是否显示新手引导完成弹窗（显示后清除）
  showNoviceCompletionDialog?: boolean;
  // 是否显示新手任务全部完成弹窗（显示后清除）
  showTutorialCompletionDialog?: boolean;
  // 任务系统状态 - 统一管理各任务系统
  taskSystems?: import('@/modules/faction/logic/types').AllTaskSystemsState;
  // 扩展系统 - 势力相关
  currentFactionId?: string | null; // 当前加入的势力ID
  factionProgress?: import('./typesExtension').FactionProgress | null; // 势力进度
  // 时间系统
  timeSystem?: import('@/modules/time/logic/timeSystem').TimeSystemState | null; // 统一时间系统
  // 离线处理结果（登录时显示，显示后清除）
  offlineResult?: import('@/modules/time/logic/offlineProcessor').OfflineProcessResult | null;
  // 离线处理结果V2（新系统）
  offlineResultV2?: import('@/modules/tower/logic/idleSystem').OfflineProcessResult | null;
  // 事件历史记录（用于事件因果链）
  eventHistory?: import('./events/types').EventRecord[];
  // 世界状态标记（用于持久后果）
  worldFlags?: Record<string, unknown>;
  // 开发者调试状态
  devMode?: {
    invincible: boolean; // 战斗无敌模式
  };
  // 飞升流程状态
  ascensionFlow?: import('./typesExtension').AscensionFlowState;
  // 死亡状态（显示死亡弹窗）
  deathState?: import('./typesExtension').DeathState;
}

// 消息存储配置
export const MESSAGE_CONFIG = {
  memoryLimit: 100, // 内存中保留的消息数量
  chunkSize: 100, // 每个分片的大小
  storageKeyPrefix: 'wanjie_messages_chunk_', // localStorage 分片键名前缀
  STORAGE_KEY: 'wanjie_messages_chunks', // 旧版 localStorage 键名（兼容）
  defaultGameId: 'default', // 默认游戏ID
};

// ============================================
// 成就系统
// ============================================

// 成就类型
export type AchievementType = 'level' | 'combat' | 'collection' | 'exploration' | 'cultivation' | 'special';

// 成就状态
export interface AchievementStatus {
  achievementId: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number; // 当前进度
  target: number; // 目标进度
}

// 成就定义
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  type: AchievementType;
  icon: string; // 图标名称
  target: number; // 目标数值
  rewards: {
    items?: InventoryItem[];
    stats?: Partial<GrowthStats>;
    experience?: number;
  };
  hidden?: boolean; // 是否隐藏（未解锁前不显示详情）
  rarity?: ItemRarity; // 成就稀有度
}

// ============================================
// 图鉴系统
// ============================================

// 羁绊类型
export type BondType = 'element' | 'weapon' | 'rarity';

// 羁绊等级
export interface BondLevel {
  level: number;
  required: number; // 所需收集数量
  multiplier: number; // 倍率加成
}

// 羁绊奖励
export interface BondReward {
  level: number;
  stats: Record<string, number>; // 属性加成
}

// 羁绊定义
export interface BondDefinition {
  id: string;
  name: string;
  type: BondType;
  description: string;
  keywords: string[]; // 匹配关键词
  rewards: BondReward[];
}

// 图鉴收集状态
export interface CollectionStatus {
  techniqueIds: string[]; // 已获得的功法ID列表
  equipmentIds: string[]; // 已获得的装备ID列表
  techniqueNames: string[]; // 已获得的功法名称列表（用于羁绊匹配）
  equipmentNames: string[]; // 已获得的装备名称列表（用于羁绊匹配）
}

// 图鉴条目
export interface CollectionEntry {
  id: string;
  name: string;
  type: 'technique' | 'equipment';
  rarity: ItemRarity;
  collected: boolean;
  collectedAt?: number;
}

// ============================================
// 游戏统计数据（用于成就和图鉴）
// ============================================

export interface GameStatistics {
  // 等级相关
  maxLevel: number; // 最高等级
  
  // 战斗相关
  totalEnemiesKilled: number; // 总击败敌人数
  totalBossKilled: number; // 总击败Boss数
  totalEliteKilled: number; // 总击败精英数
  
  // 收集相关
  totalTechniquesCollected: number; // 总获得的功法数（去重）
  totalEquipmentsCollected: number; // 总获得的装备数（去重）
  
  // 探索相关
  totalAdventuresCompleted: number; // 总完成的秘境探索次数
  clearedDifficulties: number[]; // 已通关的机缘难度等级列表
  
  // 修炼相关
  totalCultivations: number; // 总修炼次数
  totalBreakthroughs: number; // 总突破次数
  
  // 特殊成就追踪
  legendaryItemsObtained: number; // 获得的传说品质物品数
  hasFullEquipment: boolean; // 是否所有装备槽位都已装备
  maxLevelTechniques: number; // 满级功法数量
  maxLevelEquipments: number; // 满级装备数量
  
  // 历史收集（用于去重判断）
  collectedTechniqueNames: string[]; // 已收集过的功法名称（数组格式，便于序列化）
  collectedEquipmentNames: string[]; // 已收集过的装备名称（数组格式，便于序列化）
  
  // ========== 扩展系统统计 ==========
  
  // 流派相关
  pathSelected: boolean; // 是否选择了流派
  pathLevel: number; // 流派等级
  
  // 功法熟练度
  techniqueProficiencyXiaocheng: number; // 达到小成境界的功法数量
  techniqueProficiencyDacheng: number; // 达到大成境界的功法数量
  techniqueProficiencyHuajing: number; // 达到化境界的功法数量
  
  // 羁绊相关
  bondsActivated: number; // 激活的羁绊数量
  bondLevel3Activated: boolean; // 是否激活了3级羁绊
  
  // 装备强化
  maxEnhancementLevel: number; // 最高强化等级
  
  // 势力声望
  factionJoined: boolean; // 是否加入了势力
  reputationFriendly: boolean; // 是否达到友善声望
  reputationHonored: boolean; // 是否达到尊敬声望
  reputationExalted: boolean; // 是否达到崇敬声望
  
  // 成就系统
  achievementRewardsClaimed: number; // 已领取的成就奖励数量
  
  // 物品使用
  totalItemsUsed: number; // 总使用物品次数
  
  // ========== 新增：势力任务相关统计 ==========
  
  // 资源相关
  totalSpiritStonesGained: number;    // 获得灵石总数
  totalSpiritStonesSpent: number;      // 消耗灵石总数
  
  // 材料相关
  totalMaterialsCollected: number;     // 获得材料总数
  totalFragmentsCollected: number;     // 获得碎片总数
  
  // 合成相关
  totalEquipmentsCrafted: number;      // 合成装备数量
  totalTechniquesSynthesized: number;  // 合成功法数量
  
  // 贡献相关
  totalContribution: number;           // 累计贡献值
  totalDonations: number;              // 捐献次数
  totalSpiritStonesDonated: number;    // 捐献灵石总数
  
  // 碎片合成相关
  totalFragmentsSynthesized: number;   // 碎片合成次数
}

// 默认统计数据
export const DEFAULT_STATISTICS: GameStatistics = {
  maxLevel: 1,
  totalEnemiesKilled: 0,
  totalBossKilled: 0,
  totalEliteKilled: 0,
  totalTechniquesCollected: 0,
  totalEquipmentsCollected: 0,
  totalAdventuresCompleted: 0,
  clearedDifficulties: [], // 已通关的机缘难度等级列表
  totalCultivations: 0,
  totalBreakthroughs: 0,
  legendaryItemsObtained: 0,
  hasFullEquipment: false,
  maxLevelTechniques: 0,
  maxLevelEquipments: 0,
  collectedTechniqueNames: [],
  collectedEquipmentNames: [],
  // 扩展系统默认值
  pathSelected: false,
  pathLevel: 0,
  techniqueProficiencyXiaocheng: 0,
  techniqueProficiencyDacheng: 0,
  techniqueProficiencyHuajing: 0,
  bondsActivated: 0,
  bondLevel3Activated: false,
  maxEnhancementLevel: 0,
  factionJoined: false,
  reputationFriendly: false,
  reputationHonored: false,
  reputationExalted: false,
  achievementRewardsClaimed: 0,
  totalItemsUsed: 0,
  // 新增：势力任务相关统计默认值
  totalSpiritStonesGained: 0,
  totalSpiritStonesSpent: 0,
  totalMaterialsCollected: 0,
  totalFragmentsCollected: 0,
  totalEquipmentsCrafted: 0,
  totalTechniquesSynthesized: 0,
  totalContribution: 0,
  totalDonations: 0,
  totalSpiritStonesDonated: 0,
  totalFragmentsSynthesized: 0,
}
