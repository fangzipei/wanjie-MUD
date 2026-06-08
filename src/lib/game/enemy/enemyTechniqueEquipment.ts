/**
 * 敌人功法装备生成系统
 * 
 * 为敌人生成真实的功法和装备
 * 让敌人可以使用技能，并且掉落其身上的功法残本和装备碎片
 * 
 * 设计原则：
 * 1. 敌人等级决定功法/装备品质上限
 * 2. 敌人类型（normal/elite/miniboss/boss）决定功法/装备数量和稀有度概率
 * 3. 功法/装备的稀有度受玩家等级限制（不会出现低级敌人带神级功法）
 */

import {
  BattleSkill,
  generateSkillFromTechniqueSkill,
} from '../battle/skillSystem';
import { Enemy } from './types';
import {
  generateRandomEquipment,
} from '../utils/equipment';
import {
  generateRandomTechnique,
} from '../utils/technique';
import {
  Technique,
  Equipment,
  ItemRarity,
  EnemyTier,
  WorldType,
} from '../types';
import { 
  generateDropRarity, 
  getRarityRange,
  RaritySource,
} from '../../data/raritySystem';

// ============================================
// 配置常量
// ============================================

/** 敌人类型对应的功法数量（确保至少有物品可掉落） */
export const ENEMY_TECHNIQUE_COUNT: Record<EnemyTier, { min: number; max: number }> = {
  normal: { min: 1, max: 1 },      // 普通敌人：1个功法（确保有掉落）
  elite: { min: 1, max: 2 },       // 精英敌人：1-2个功法
  miniboss: { min: 2, max: 3 },    // 小Boss：2-3个功法
  boss: { min: 3, max: 5 },        // Boss：3-5个功法
};

/** 敌人类型对应的装备数量 */
export const ENEMY_EQUIPMENT_COUNT: Record<EnemyTier, { min: number; max: number }> = {
  normal: { min: 0, max: 1 },      // 普通敌人：0-1个装备
  elite: { min: 1, max: 2 },       // 精英敌人：1-2个装备
  miniboss: { min: 2, max: 3 },    // 小Boss：2-3个装备
  boss: { min: 3, max: 5 },        // Boss：3-5个装备
};

/**
 * 品质权重配置 - 根据敌人类型
 * 
 * 注意：品质上限由敌人等级决定（通过 raritySystem.ts 中的 getRarityRange）
 * 这里只控制权重分布
 */
export const ENEMY_RARITY_WEIGHTS: Record<EnemyTier, Record<ItemRarity, number>> = {
  normal: {
    '普通': 85,    // 85%
    '稀有': 15,    // 15%
    '史诗': 0,     // 0%
    '传说': 0,     // 0%
    '神话': 0,     // 0%
  },
  elite: {
    '普通': 50,    // 50%
    '稀有': 35,    // 35%
    '史诗': 15,    // 15%
    '传说': 0,     // 0%
    '神话': 0,     // 0%
  },
  miniboss: {
    '普通': 25,    // 25%
    '稀有': 35,    // 35%
    '史诗': 30,    // 30%
    '传说': 10,    // 10%
    '神话': 0,     // 0%
  },
  boss: {
    '普通': 0,     // 0%
    '稀有': 20,    // 20%
    '史诗': 35,    // 35%
    '传说': 30,    // 30%
    '神话': 15,    // 15%
  },
};

/** 敌人法力值倍率（基于等级） */
const ENEMY_MP_MULTIPLIER = 50;

// ============================================
// 工具函数
// ============================================

const random = (min: number, max: number, rng: () => number = Math.random) => Math.floor(rng() * (max - min + 1)) + min;

/**
 * 根据敌人等级和类型生成品质
 * 
 * 使用新的品质系统：
 * - 品质上限由敌人等级决定（通过 raritySystem.ts）
 * - 权重分布由敌人类型决定
 * - 不再受玩家等级限制
 */
function generateEnemyItemRarity(
  enemyLevel: number,
  enemyTier: EnemyTier,
  playerLuck: number = 0
): ItemRarity {
  // 确定来源类型
  const sourceType: RaritySource = enemyTier === 'boss' ? 'boss' : 'enemy';
  
  // 使用新的品质系统生成品质
  // 品质上限由敌人等级决定，玩家幸运值只影响权重分布
  return generateDropRarity(sourceType, enemyLevel, playerLuck);
}

/**
 * 获取敌人可掉落的品质范围（用于UI展示）
 */
export function getEnemyRarityRange(enemyLevel: number, enemyTier: EnemyTier): ItemRarity[] {
  const sourceType: RaritySource = enemyTier === 'boss' ? 'boss' : 'enemy';
  const config = getRarityRange(sourceType, enemyLevel);
  return config.rarityRange;
}

/**
 * 计算功法对敌人属性的加成
 */
export function calculateTechniqueBonus(techniques: Technique[]): { attack: number; defense: number; hp: number } {
  let attack = 0;
  let defense = 0;
  let hp = 0;
  
  for (const technique of techniques) {
    const levelBonus = 1 + technique.level * 0.1; // 每级增加10%效果
    
    if (technique.type === 'attack') {
      attack += Math.floor(technique.power * levelBonus * 0.5);
    } else {
      defense += Math.floor(technique.bonus * levelBonus * 0.5);
    }
    hp += Math.floor(technique.power * 0.3);
  }
  
  return { attack, defense, hp };
}

/**
 * 计算装备对敌人属性的加成
 */
export function calculateEquipmentBonus(equipments: Equipment[]): { attack: number; defense: number; hp: number } {
  let attack = 0;
  let defense = 0;
  let hp = 0;
  
  for (const equipment of equipments) {
    attack += equipment.attackBonus || 0;
    defense += equipment.defenseBonus || 0;
    hp += equipment.power * 0.3 || 0;
  }
  
  return { attack, defense, hp };
}

// ============================================
// 主要生成函数
// ============================================

export interface EnemyTechniqueEquipmentResult {
  techniques: Technique[];
  equipments: Equipment[];
  skills: BattleSkill[];
  totalAttackBonus: number;
  totalDefenseBonus: number;
  totalHpBonus: number;
  maxMp: number;
}

/**
 * 为敌人生成功法和装备
 * 
 * @param enemyLevel 敌人等级
 * @param enemyTier 敌人类型
 * @param playerLevel 玩家等级（用于计算经验倍率，不再限制品质）
 * @param worldType 世界类型
 * @param playerLuck 玩家幸运值（影响品质权重分布，不影响品质上限）
 */
export function generateEnemyTechniquesAndEquipments(
  enemyLevel: number,
  enemyTier: EnemyTier,
  _playerLevel: number, // 保留参数但不再用于品质限制
  worldType: WorldType = '修仙',
  playerLuck: number = 0
): EnemyTechniqueEquipmentResult {
  const techniques: Technique[] = [];
  const equipments: Equipment[] = [];
  const skills: BattleSkill[] = [];
  
  // 生成功法
  const techniqueCountRange = ENEMY_TECHNIQUE_COUNT[enemyTier];
  const techniqueCount = random(techniqueCountRange.min, techniqueCountRange.max);
  
  for (let i = 0; i < techniqueCount; i++) {
    // 使用新的品质系统生成品质
    const rarity = generateEnemyItemRarity(enemyLevel, enemyTier, playerLuck);
    
    // 使用正确的 generateRandomTechnique 签名: (difficulty, worldType, fixedRarity)
    const technique = generateRandomTechnique(
      enemyLevel,
      worldType,
      rarity
    );
    
    // 【修复】将功法等级设置为敌人等级，确保技能可以解锁
    technique.level = enemyLevel;
    
    techniques.push(technique);
    
    // 从功法技能生成战斗技能
    if (technique.allSkills && technique.allSkills.length > 0) {
      for (const skill of technique.allSkills) {
        if (skill.unlockLevel <= technique.level) {
          const battleSkill = generateSkillFromTechniqueSkill(skill, technique);
          skills.push(battleSkill);
        }
      }
    }
  }
  
  // 生成装备
  const equipmentCountRange = ENEMY_EQUIPMENT_COUNT[enemyTier];
  const equipmentCount = random(equipmentCountRange.min, equipmentCountRange.max);
  
  for (let i = 0; i < equipmentCount; i++) {
    // 使用新的品质系统生成品质
    const rarity = generateEnemyItemRarity(enemyLevel, enemyTier, playerLuck);
    
    // 使用正确的 generateRandomEquipment 签名: (enemyLevel, isBoss, worldType, fixedRarity)
    const isBoss = enemyTier === 'boss';
    const equipment = generateRandomEquipment(
      enemyLevel,
      isBoss,
      worldType,
      rarity
    );
    
    equipments.push(equipment);
  }
  
  // 计算总加成
  const techniqueBonus = calculateTechniqueBonus(techniques);
  const equipmentBonus = calculateEquipmentBonus(equipments);
  
  const totalAttackBonus = techniqueBonus.attack + equipmentBonus.attack;
  const totalDefenseBonus = techniqueBonus.defense + equipmentBonus.defense;
  const totalHpBonus = techniqueBonus.hp + equipmentBonus.hp;
  
  // 计算法力值
  const maxMp = enemyLevel * ENEMY_MP_MULTIPLIER + techniques.length * 20;
  
  return {
    techniques,
    equipments,
    skills,
    totalAttackBonus,
    totalDefenseBonus,
    totalHpBonus,
    maxMp,
  };
}

/**
 * 选择敌人要使用的技能
 * 简单AI：优先使用高伤害技能，考虑法力值
 */
export function selectEnemySkill(
  enemy: Enemy,
  playerHpPercent: number
): { skill: BattleSkill | null; reason: string } {
  const skills = enemy.skills || [];
  const currentMp = enemy.currentMp ?? 0;
  const cooldowns = enemy.skillCooldowns || {};
  
  // 过滤可用技能
  const usableSkills = skills.filter(skill => {
    const cooldown = cooldowns[skill.id] || 0;
    return cooldown === 0 && (skill.mpCost || 0) <= currentMp;
  });
  
  if (usableSkills.length === 0) {
    return { skill: null, reason: '无可用技能，使用普通攻击' };
  }
  
  // 简单策略：
  // 1. 玩家血量低于30%时，优先使用斩杀类技能
  // 2. 否则使用伤害最高的技能
  
  if (playerHpPercent < 0.3) {
    const executeSkill = usableSkills.find(s => s.tags?.includes('execute'));
    if (executeSkill) {
      return { skill: executeSkill, reason: '斩杀机会' };
    }
  }
  
  // 选择伤害最高的技能
  const sortedSkills = [...usableSkills].sort((a, b) => {
    const aDmg = a.effect?.damageMultiplier || 1;
    const bDmg = b.effect?.damageMultiplier || 1;
    return bDmg - aDmg;
  });
  
  return { skill: sortedSkills[0], reason: '最大化伤害' };
}

/**
 * 计算敌人技能伤害
 */
export function calculateEnemySkillDamage(
  skill: BattleSkill,
  enemyAttack: number,
  playerDefense: number
): number {
  const baseDamage = enemyAttack * (skill.effect?.damageMultiplier || 1);
  const defenseReduction = playerDefense * 0.5;
  return Math.max(1, Math.floor(baseDamage - defenseReduction));
}
