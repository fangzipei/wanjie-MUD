/**
 * 属性计算器 - 统一三层架构
 * 
 * 设计原则：
 * 1. 玩家和敌人使用相同的属性计算公式
 * 2. 三层架构：基础属性层 → 世界调整层 → 个体调整层
 * 3. 世界系数在中间层统一处理
 * 
 * 公式：
 * 最终属性 = 基础值 × (1 + 等级加成) × 世界系数 × 难度系数 × 模板倍率 + 功法装备加成
 */

import { WorldType, Technique, Equipment } from '@/shared/lib/types';

// ============================================
// 常量配置
// ============================================

/** 基础属性值（LV1时） */
const BASE_STATS = {
  hp: 100,
  mp: 50,
  attack: 10,
  defense: 5,
  speed: 10,
} as const;

/** 每级成长率 */
const LEVEL_GROWTH = {
  hp: 20,
  mp: 10,
  attack: 2,
  defense: 1,
  speed: 0.5,
} as const;

// 世界系数从权威数据源导入（identity/data/worldData.ts）
import { WORLD_COEFFICIENTS } from '@/modules/identity/data/worldData';

/**
 * 将世界难度系数转换为敌人属性倍率
 * 公式：enemyMultiplier = 0.5 + coefficient * 0.5
 * 范围：武侠(1.0) → 1.0x，末世(1.5) → 1.25x
 */
function getWorldEnemyMultiplier(worldType: WorldType): number {
  const coefficient = WORLD_COEFFICIENTS[worldType] || 1.0;
  return 0.5 + coefficient * 0.5;
}

/** 元素列表 */
export const ELEMENTS: readonly Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth', 'light', 'dark'] as const;

/** 武器类别列表 */
export const WEAPON_CATEGORIES: readonly WeaponCategory[] = ['sword', 'blade', 'fist', 'bow', 'spear'] as const;

// ============================================
// 类型定义
// ============================================

/** 元素类型 */
export type Element = 'fire' | 'ice' | 'thunder' | 'wind' | 'earth' | 'light' | 'dark';

/** 武器类别类型 */
export type WeaponCategory = 'sword' | 'blade' | 'fist' | 'bow' | 'spear';

/** 属性计算结果 */
export interface CalculatedStats {
  /** 攻击力 */
  attack: number;
  /** 防御力 */
  defense: number;
  /** 速度 */
  speed: number;
  /** 最大HP */
  maxHp: number;
  /** 最大MP */
  maxMp: number;
}

/** 属性计算参数 */
export interface StatsCalculationParams {
  /** 等级 */
  level: number;
  /** 世界类型 */
  worldType: WorldType;
  /** 难度系数（敌人专用） */
  difficultyMultiplier?: number;
  /** 属性模板倍率 */
  hpMultiplier?: number;
  attackMultiplier?: number;
  defenseMultiplier?: number;
  speedMultiplier?: number;
  /** 功法装备加成 */
  bonusHp?: number;
  bonusAttack?: number;
  bonusDefense?: number;
  bonusMp?: number;
}

// ============================================
// 核心计算函数
// ============================================

/**
 * 第一层：计算基础属性值
 * 公式：基础值 + 等级 × 成长率
 */
function calculateBaseStats(level: number): {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
} {
  return {
    hp: BASE_STATS.hp + level * LEVEL_GROWTH.hp,
    mp: BASE_STATS.mp + level * LEVEL_GROWTH.mp,
    attack: BASE_STATS.attack + level * LEVEL_GROWTH.attack,
    defense: BASE_STATS.defense + level * LEVEL_GROWTH.defense,
    speed: BASE_STATS.speed + level * LEVEL_GROWTH.speed,
  };
}

/**
 * 第二层：应用世界系数
 * 公式：基础属性 × 世界系数
 */
function applyWorldCoefficient(
  baseStats: ReturnType<typeof calculateBaseStats>,
  worldType: WorldType
): ReturnType<typeof calculateBaseStats> {
  const coefficient = getWorldEnemyMultiplier(worldType);
  
  return {
    hp: Math.floor(baseStats.hp * coefficient),
    mp: Math.floor(baseStats.mp * coefficient),
    attack: Math.floor(baseStats.attack * coefficient),
    defense: Math.floor(baseStats.defense * coefficient),
    speed: Math.floor(baseStats.speed * coefficient),
  };
}

/**
 * 第三层：应用个体调整
 * 公式：(世界调整属性 × 难度系数 × 模板倍率) + 功法装备加成
 */
function applyIndividualAdjustments(
  worldStats: ReturnType<typeof calculateBaseStats>,
  params: StatsCalculationParams
): CalculatedStats {
  const {
    difficultyMultiplier = 1.0,
    hpMultiplier = 1.0,
    attackMultiplier = 1.0,
    defenseMultiplier = 1.0,
    speedMultiplier = 1.0,
    bonusHp = 0,
    bonusAttack = 0,
    bonusDefense = 0,
    bonusMp = 0,
  } = params;
  
  // 应用难度系数和模板倍率
  const adjustedHp = Math.floor(worldStats.hp * difficultyMultiplier * hpMultiplier);
  const adjustedMp = Math.floor(worldStats.mp * difficultyMultiplier);
  const adjustedAttack = Math.floor(worldStats.attack * difficultyMultiplier * attackMultiplier);
  const adjustedDefense = Math.floor(worldStats.defense * difficultyMultiplier * defenseMultiplier);
  const adjustedSpeed = Math.floor(worldStats.speed * difficultyMultiplier * speedMultiplier);
  
  return {
    maxHp: adjustedHp + bonusHp,
    maxMp: adjustedMp + bonusMp,
    attack: adjustedAttack + bonusAttack,
    defense: adjustedDefense + bonusDefense,
    speed: adjustedSpeed,
  };
}

/**
 * 统一属性计算入口
 */
export function calculateStats(params: StatsCalculationParams): CalculatedStats {
  // 第一层：基础属性
  const baseStats = calculateBaseStats(params.level);
  
  // 第二层：世界调整
  const worldStats = applyWorldCoefficient(baseStats, params.worldType);
  
  // 第三层：个体调整
  return applyIndividualAdjustments(worldStats, params);
}

// ============================================
// 功法装备加成计算
// ============================================

/**
 * 计算功法属性加成
 */
export function calculateTechniqueBonus(techniques: Technique[]): {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
} {
  let hp = 0;
  let mp = 0;
  let attack = 0;
  let defense = 0;
  
  for (const technique of techniques) {
    // 使用功法的 bonus 字段
    const bonus = technique.bonus || 0;
    
    if (technique.type === 'attack') {
      attack += bonus;
      mp += Math.floor(bonus * 0.5);
    } else {
      defense += bonus;
      hp += bonus * 5;
    }
  }
  
  return { hp, mp, attack, defense };
}

/**
 * 计算装备属性加成
 */
export function calculateEquipmentBonus(equipments: Equipment[]): {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
} {
  let hp = 0;
  let mp = 0;
  let attack = 0;
  let defense = 0;
  
  for (const equipment of equipments) {
    attack += equipment.attackBonus || 0;
    defense += equipment.defenseBonus || 0;
    
    // 根据装备槽位添加额外HP
    if (equipment.slot === 'body') {
      hp += (equipment.defenseBonus || 0) * 10;
    } else if (equipment.slot === 'head' || equipment.slot === 'legs' || equipment.slot === 'feet') {
      hp += (equipment.defenseBonus || 0) * 5;
    }
    
    // 武器增加少量MP
    if (equipment.slot === 'melee' || equipment.slot === 'ranged') {
      mp += Math.floor((equipment.attackBonus || 0) * 0.3);
    }
  }
  
  return { hp, mp, attack, defense };
}

/**
 * 计算完整的功法装备加成
 */
export function calculateTotalBonus(
  techniques: Technique[],
  equipments: Equipment[]
): {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
} {
  const techBonus = calculateTechniqueBonus(techniques);
  const equipBonus = calculateEquipmentBonus(equipments);
  
  return {
    hp: techBonus.hp + equipBonus.hp,
    mp: techBonus.mp + equipBonus.mp,
    attack: techBonus.attack + equipBonus.attack,
    defense: techBonus.defense + equipBonus.defense,
  };
}

// ============================================
// 辅助函数
// ============================================

/**
 * 计算最大HP
 */
export function calculateBaseHp(level: number, worldType: WorldType): number {
  const baseStats = calculateBaseStats(level);
  const worldStats = applyWorldCoefficient(baseStats, worldType);
  return worldStats.hp;
}

/**
 * 计算最大MP
 */
export function calculateBaseMp(level: number, worldType: WorldType): number {
  const baseStats = calculateBaseStats(level);
  const worldStats = applyWorldCoefficient(baseStats, worldType);
  return worldStats.mp;
}

/**
 * 计算攻击力
 */
export function calculateBaseAttack(level: number, worldType: WorldType): number {
  const baseStats = calculateBaseStats(level);
  const worldStats = applyWorldCoefficient(baseStats, worldType);
  return worldStats.attack;
}

/**
 * 计算防御力
 */
export function calculateBaseDefense(level: number, worldType: WorldType): number {
  const baseStats = calculateBaseStats(level);
  const worldStats = applyWorldCoefficient(baseStats, worldType);
  return worldStats.defense;
}

/**
 * 获取世界系数
 */
export function getWorldCoefficient(worldType: WorldType): number {
  return getWorldEnemyMultiplier(worldType);
}
