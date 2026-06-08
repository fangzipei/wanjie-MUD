/**
 * 功法生成系统（重构版）
 * 
 * 包含法技系统、残本系统、契合系统
 * 等级10级制，按稀有度不同
 * 
 * 配置数据来源：gameData/techniqueConfigs.ts
 */

import { 
  Element, 
  WeaponCategory,
  detectElementFromName,
  WEAPON_CATEGORY_DEFAULT_ELEMENT,
} from '../utils/restraintSystem';
import { generateTechniqueSkills } from '../skill/skillGenerator';
import { 
  TECHNIQUE_RARITY_CONFIG,
  RARITY_WEIGHTS,
} from '../skill/skillTypes';
import { 
  Technique, 
  TechniqueType, 
  ItemRarity, 
  WorldType 
} from '../types';

// 导入配置数据
import {
  // 攻击功法名称
  ATTACK_TECHNIQUE_NAMES,
  // 防御功法名称
  DEFENSE_TECHNIQUE_NAMES,
  // 攻击功法描述
  ATTACK_TECHNIQUE_DESCRIPTIONS,
  // 防御功法描述
  DEFENSE_TECHNIQUE_DESCRIPTIONS,
  // 威力范围
  POWER_RANGE,
  // 加成范围
  BONUS_RANGE,
  // 掉落权重
  TECHNIQUE_DROP_WEIGHTS,
} from '../../data/techniqueConfigs';
import { clamp } from '../utils/numberUtils';

// ============================================
// 常量配置
// ============================================

/** 功法名称数据库 */
const TECHNIQUE_NAMES: Record<TechniqueType, Record<ItemRarity, string[]>> = {
  attack: ATTACK_TECHNIQUE_NAMES,
  defense: DEFENSE_TECHNIQUE_NAMES,
};

/** 功法描述数据库 */
const TECHNIQUE_DESCRIPTIONS: Record<TechniqueType, Record<ItemRarity, string[]>> = {
  attack: ATTACK_TECHNIQUE_DESCRIPTIONS,
  defense: DEFENSE_TECHNIQUE_DESCRIPTIONS,
};

// ============================================
// 工具函数
// ============================================

let techniqueIdCounter = 0;

function generateId(): string {
  return `technique_${Date.now()}_${techniqueIdCounter++}`;
}

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** 随机选择元素属性 */
function pickRandomElement(): Element {
  const elements: Element[] = ['fire', 'ice', 'thunder', 'wind', 'earth', 'light', 'dark'];
  return pickRandom(elements);
}

/** 随机选择契合武器 */
function randomWeaponCategory(): WeaponCategory | null {
  // 50%概率有契合武器
  if (Math.random() > 0.5) {
    return null;
  }
  const categories: WeaponCategory[] = ['sword', 'blade', 'fist', 'bow', 'spear'];
  return pickRandom(categories);
}

/** 计算升级所需经验 */
function calculateExpToNext(level: number, rarity: ItemRarity): number {
  const baseExp = 100;
  const multiplier = TECHNIQUE_RARITY_CONFIG[rarity] ? 1.5 : 1.5;
  return Math.floor(baseExp * Math.pow(multiplier, level - 1));
}

// ============================================
// 稀有度选择
// ============================================

/** 根据难度随机选择稀有度 */
function rollRarity(difficulty: number): ItemRarity {
  const roll = Math.random() * 100;
  
  // 难度调整
  const difficultyBonus = difficulty * 2;
  
  // 累计概率
  let cumulative = 0;
  
  // 从高到低检查
  const orderedRarities: ItemRarity[] = ['神话', '传说', '史诗', '稀有', '普通'];
  
  for (const rarity of orderedRarities) {
    let weight = RARITY_WEIGHTS[rarity];
    
    // 高难度增加高品质概率
    if (rarity !== '普通') {
      weight += difficultyBonus;
    }
    
    cumulative += weight;
    if (roll < cumulative) {
      return rarity;
    }
  }
  
  return '普通';
}

// ============================================
// 功法生成器
// ============================================

/**
 * 生成随机功法
 */
export function generateRandomTechnique(
  difficulty: number = 1,
  worldType?: WorldType,
  fixedRarity?: ItemRarity
): Technique {
  const type: TechniqueType = Math.random() > 0.5 ? 'attack' : 'defense';
  const rarity = fixedRarity ?? rollRarity(difficulty);
  
  return generateTechnique(type, rarity, worldType);
}

/**
 * 生成指定类型的功法
 * @param type 功法类型（攻击/防御）
 * @param difficulty 难度等级（用于稀有度抽取，如果未指定rarity）
 * @param worldType 世界类型
 * @param rarity 指定品质（可选，如果指定则跳过稀有度抽取）
 */
export function generateTechniqueByType(
  type: TechniqueType,
  difficulty: number = 1,
  worldType?: WorldType,
  rarity?: ItemRarity
): Technique {
  const finalRarity = rarity || rollRarity(difficulty);
  return generateTechnique(type, finalRarity, worldType);
}

/**
 * 核心功法生成函数
 */
function generateTechnique(
  type: TechniqueType,
  rarity: ItemRarity,
  worldType?: WorldType
): Technique {
  const config = TECHNIQUE_RARITY_CONFIG[rarity];
  
  // 基础信息
  const name = pickRandom(TECHNIQUE_NAMES[type][rarity]);
  const description = pickRandom(TECHNIQUE_DESCRIPTIONS[type][rarity]);
  
  // 数值
  const [minPower, maxPower] = POWER_RANGE[rarity];
  const [minBonus, maxBonus] = BONUS_RANGE[rarity];
  const power = random(minPower, maxPower);
  const bonus = random(minBonus, maxBonus);
  
  // 武器契合（先决定，以便元素可以跟随）
  const compatibleWeapon = randomWeaponCategory();
  const compatibleBonus = config.compatibleBonus;
  
  // 元素属性：根据名称检测，失败则根据武器类别推断，再失败则随机
  let element: Element;
  const detectedElement = detectElementFromName(name);
  if (detectedElement) {
    element = detectedElement;
  } else if (compatibleWeapon) {
    // 根据武器类别推断元素
    element = WEAPON_CATEGORY_DEFAULT_ELEMENT[compatibleWeapon];
  } else {
    element = pickRandomElement();
  }
  
  // 法力消耗
  const baseMpCost = 5 + Math.floor(power * 0.3);
  
  // 生成法技
  const allSkills = generateTechniqueSkills(element, rarity);
  
  // 初始只装备已解锁的技能（unlockLevel <= 1）
  const unlockedSkills = allSkills.filter(s => s.unlockLevel <= 1);
  const equippedSkills: (string | null)[] = unlockedSkills.length > 0 
    ? [unlockedSkills[0].id, ...Array(config.maxSkillSlots - 1).fill(null)]
    : Array(config.maxSkillSlots).fill(null);
  
  return {
    id: generateId(),
    name,
    type,
    rarity,
    description,
    
    // 等级系统
    level: 1,
    exp: 0,
    expToNext: calculateExpToNext(1, rarity),
    maxLevel: config.maxLevel,
    
    // 基础数值
    power,
    bonus,
    baseMpCost,
    
    // 元素属性
    element,
    
    // 武器契合
    compatibleWeapon,
    compatibleBonus,
    
    // 法技系统
    skillSlots: 1, // 初始解锁1个槽位
    maxSkillSlots: config.maxSkillSlots,
    allSkills,
    equippedSkills,
    
    // 来源
    worldType,
    source: 'drop',
    
    // 残本系统
    isFragment: false,
  };
}

/**
 * 生成残本
 */
export function generateFragment(
  sourceTechnique: Technique,
  fragmentIndex: number
): Technique {
  const config = TECHNIQUE_RARITY_CONFIG[sourceTechnique.rarity];
  
  return {
    ...sourceTechnique,
    id: generateId(),
    name: `${sourceTechnique.name}·残本(${fragmentIndex}/${config.fragmentsRequired})`,
    description: `${sourceTechnique.name}的残缺部分，集齐${config.fragmentsRequired}本可合成完本`,
    
    // 残本系统
    isFragment: true,
    fragmentIndex,
    fragmentsRequired: config.fragmentsRequired,
    relatedFragmentIds: [],
    
    // 残本无法使用技能
    skillSlots: 0,
    equippedSkills: Array(sourceTechnique.maxSkillSlots).fill(null),
  };
}

/**
 * 合成残本为完本
 */
export function synthesizeFragments(fragments: Technique[]): Technique | null {
  if (fragments.length === 0) return null;
  
  // 验证残本
  const firstFragment = fragments[0];
  if (!firstFragment.isFragment) return null;
  
  const config = TECHNIQUE_RARITY_CONFIG[firstFragment.rarity];
  
  // 检查数量
  if (fragments.length < config.fragmentsRequired) return null;
  
  // 检查是否同一功法（名称前缀相同）
  const baseName = firstFragment.name.split('·')[0];
  const allSame = fragments.every(f => f.name.startsWith(baseName));
  if (!allSame) return null;
  
  // 生成完本
  return {
    ...firstFragment,
    id: generateId(),
    name: baseName,
    description: firstFragment.description.split('的残缺部分')[0],
    
    // 重置等级
    level: 1,
    exp: 0,
    expToNext: calculateExpToNext(1, firstFragment.rarity),
    
    // 残本系统
    isFragment: false,
    fragmentIndex: undefined,
    fragmentsRequired: undefined,
    relatedFragmentIds: undefined,
    
    // 恢复技能槽位
    skillSlots: 1,
    equippedSkills: firstFragment.allSkills.length > 0 
      ? [firstFragment.allSkills[0].id, ...Array(firstFragment.maxSkillSlots - 1).fill(null)]
      : Array(firstFragment.maxSkillSlots).fill(null),
    
    source: 'synthesis',
  };
}

/**
 * 功法升级
 */
export function upgradeTechnique(technique: Technique, expGain: number): Technique {
  if (technique.level >= technique.maxLevel) {
    return technique;
  }
  
  let newExp = technique.exp + expGain;
  let newLevel = technique.level;
  let newExpToNext = technique.expToNext;
  let newSkillSlots = technique.skillSlots;
  
  // 处理升级
  while (newExp >= newExpToNext && newLevel < technique.maxLevel) {
    newExp -= newExpToNext;
    newLevel++;
    newExpToNext = calculateExpToNext(newLevel, technique.rarity);
    
    // 检查是否解锁新槽位
    if (newLevel <= technique.maxSkillSlots) {
      newSkillSlots = newLevel;
    }
  }
  
  // 满级处理
  if (newLevel >= technique.maxLevel) {
    newExp = 0;
    newExpToNext = 0;
    newSkillSlots = technique.maxSkillSlots;
  }
  
  return {
    ...technique,
    level: newLevel,
    exp: newExp,
    expToNext: newExpToNext,
    skillSlots: newSkillSlots,
  };
}

/**
 * 功法稀有度颜色
 */
export const techniqueRarityColors: Record<ItemRarity, string> = {
  '普通': 'text-gray-500',
  '稀有': 'text-blue-500',
  '史诗': 'text-purple-500',
  '传说': 'text-yellow-500',
  '神话': 'text-red-500',
};

/**
 * 功法类型名称
 */
export const techniqueTypeNames: Record<TechniqueType, string> = {
  attack: '攻击',
  defense: '防御',
};
