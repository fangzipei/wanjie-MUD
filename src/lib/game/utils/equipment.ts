/**
 * 装备生成器（重构版）
 * 
 * 包含斗技系统、残片系统、契合系统
 * 等级10级制，按稀有度不同
 * 
 * 配置数据来源：gameData/weaponConfigs.ts
 */

import { 
  Element, 
  WeaponCategory,
  detectElementFromName,
  detectWeaponCategoryFromName,
} from '../utils/restraintSystem';
import { generateWeaponTechniques } from '../skill/skillGenerator';
import { 
  EQUIPMENT_RARITY_CONFIG,
  RARITY_WEIGHTS,
} from '../skill/skillTypes';
import { 
  Equipment, 
  EquipmentSlot, 
  ItemRarity, 
  WorldType 
} from '../types';

// 导入配置数据
import {
  // 装备名称库
  EQUIPMENT_NAMES,
  // 攻击加成范围
  ATTACK_BONUS_RANGE,
  // 防御加成范围
  DEFENSE_BONUS_RANGE,
  // 掉落权重
  EQUIPMENT_DROP_WEIGHTS,
} from '../../data/weaponConfigs';

// ============================================
// 常量配置
// ============================================

/** 攻击范围配置 */
const ATTACK_RANGE: Record<ItemRarity, [number, number]> = ATTACK_BONUS_RANGE;

/** 防御范围配置 */
const DEFENSE_RANGE: Record<ItemRarity, [number, number]> = DEFENSE_BONUS_RANGE;

// ============================================
// 工具函数
// ============================================

let equipmentIdCounter = 0;

function generateId(): string {
  return `equip_${Date.now()}_${equipmentIdCounter++}`;
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

/** 计算升级所需经验 */
function calculateExpToNext(level: number, rarity: ItemRarity): number {
  const baseExp = 100;
  return Math.floor(baseExp * Math.pow(1.5, level - 1));
}

// ============================================
// 稀有度选择
// ============================================

/** 根据敌人等级和类型选择稀有度 */
function rollRarity(enemyLevel: number, isBoss: boolean): ItemRarity {
  const roll = Math.random() * 100;
  
  // Boss 提升稀有度概率
  const bossBonus = isBoss ? 20 : 0;
  const levelBonus = Math.floor(enemyLevel / 20) * 5;
  
  // 累计概率
  let cumulative = 0;
  
  // 从高到低检查
  const orderedRarities: ItemRarity[] = ['神话', '传说', '史诗', '稀有', '普通'];
  
  for (const rarity of orderedRarities) {
    let weight = RARITY_WEIGHTS[rarity];
    
    // 调整
    if (rarity === '神话') {
      weight = Math.min(weight + (isBoss ? 5 : 0), 10);
    } else if (rarity !== '普通') {
      weight = Math.min(weight + bossBonus + levelBonus, 50);
    }
    
    cumulative += weight;
    if (roll < cumulative) {
      return rarity;
    }
  }
  
  return '普通';
}

// ============================================
// 装备生成器
// ============================================

/**
 * 生成随机装备（用于掉落）
 */
export function generateRandomEquipment(
  enemyLevel: number,
  isBoss: boolean,
  worldType?: WorldType,
  fixedRarity?: ItemRarity
): Equipment {
  const slots: EquipmentSlot[] = ['melee', 'ranged', 'head', 'body', 'legs', 'feet'];
  const slot = slots[Math.floor(Math.random() * slots.length)];
  const rarity = fixedRarity ?? rollRarity(enemyLevel, isBoss);
  
  return generateEquipment(slot, rarity, worldType);
}

/**
 * 生成指定槽位的装备
 */
export function generateEquipment(
  slot: EquipmentSlot,
  rarity: ItemRarity,
  worldType?: WorldType
): Equipment {
  const config = EQUIPMENT_RARITY_CONFIG[rarity];
  
  // 基础信息
  const slotNames = EQUIPMENT_NAMES[slot];
  const names = slotNames ? slotNames[rarity] : ['未知装备'];
  const name = names && names.length > 0 ? pickRandom(names) : '普通装备';
  
  // 根据槽位决定数值
  const isWeapon = slot === 'melee' || slot === 'ranged';
  
  // 数值
  const [minAtk, maxAtk] = ATTACK_RANGE[rarity];
  const [minDef, maxDef] = DEFENSE_RANGE[rarity];
  const attackBonus = isWeapon ? random(minAtk, maxAtk) : 0;
  const defenseBonus = isWeapon ? 0 : random(minDef, maxDef);
  const power = random(10, 30) + Math.floor((attackBonus + defenseBonus) * 0.5);
  
  // 武器类别 - 根据名称关键词判断
  let weaponCategory: WeaponCategory | null = null;
  if (slot === 'melee') {
    // 根据名称关键词判断武器类型
    if (name.includes('剑')) {
      weaponCategory = 'sword';
    } else if (name.includes('刀')) {
      weaponCategory = 'blade';
    } else if (name.includes('拳') || name.includes('爪') || name.includes('手')) {
      weaponCategory = 'fist';
    } else if (name.includes('枪') || name.includes('矛')) {
      weaponCategory = 'spear';
    } else {
      // 默认随机
      weaponCategory = pickRandom(['sword', 'blade', 'fist', 'spear'] as WeaponCategory[]);
    }
  } else if (slot === 'ranged') {
    weaponCategory = 'bow';
  }
  
  // 元素属性（武器有更高概率拥有元素）
  let element: Element | null = null;
  let compatibleElement: Element | null = null;
  
  if (isWeapon) {
    // 武器有元素属性
    if (Math.random() > 0.3) {
      element = detectElementFromName(name) || pickRandomElement();
    }
    // 武器可能有契合元素
    if (Math.random() > 0.5) {
      compatibleElement = pickRandomElement();
    }
  } else {
    // 护甲可能有契合元素
    if (Math.random() > 0.7) {
      compatibleElement = pickRandomElement();
    }
  }
  
  // 生成斗技（只有武器才有）
  const allTechniques = isWeapon ? generateWeaponTechniques(weaponCategory, rarity) : [];
  
  // 初始只装备已解锁的技巧（unlockLevel <= 1）
  const unlockedTechniques = allTechniques.filter(t => t.unlockLevel <= 1);
  const equippedTechniques: (string | null)[] = unlockedTechniques.length > 0
    ? [unlockedTechniques[0].id, ...Array(config.maxSkillSlots - 1).fill(null)]
    : Array(config.maxSkillSlots).fill(null);
  
  // 描述
  const parts: string[] = [];
  if (attackBonus > 0) parts.push(`攻击+${attackBonus}%`);
  if (defenseBonus > 0) parts.push(`防御+${defenseBonus}%`);
  parts.push(`威力${power}`);
  const description = parts.join('，');
  
  return {
    id: generateId(),
    name,
    slot,
    rarity,
    description,
    
    // 等级系统
    level: 1,
    exp: 0,
    expToNext: calculateExpToNext(1, rarity),
    maxLevel: config.maxLevel,
    
    // 武器类型
    weaponCategory,
    
    // 元素契合
    element,
    compatibleElement,
    compatibleBonus: config.compatibleBonus,
    
    // 基础数值
    attackBonus,
    defenseBonus,
    power,
    
    // 斗技系统
    techniqueSlots: isWeapon ? 1 : 0,
    maxTechniqueSlots: config.maxSkillSlots,
    allTechniques,
    equippedTechniques,
    
    // 来源
    worldType,
    source: 'drop',
    
    // 残片系统
    isFragment: false,
  };
}

/**
 * 生成残片
 */
export function generateFragment(
  sourceEquipment: Equipment,
  fragmentIndex: number
): Equipment {
  const config = EQUIPMENT_RARITY_CONFIG[sourceEquipment.rarity];
  
  return {
    ...sourceEquipment,
    id: generateId(),
    name: `${sourceEquipment.name}·残片(${fragmentIndex}/${config.fragmentsRequired})`,
    description: `${sourceEquipment.name}的残片，集齐${config.fragmentsRequired}片可重铸完整装备`,
    
    // 残片系统
    isFragment: true,
    fragmentIndex,
    fragmentsRequired: config.fragmentsRequired,
    
    // 残片无法使用技巧
    techniqueSlots: 0,
    equippedTechniques: Array(sourceEquipment.maxTechniqueSlots).fill(null),
  };
}

/**
 * 重铸残片为完整装备
 */
export function reforgeFragments(fragments: Equipment[]): Equipment | null {
  if (fragments.length === 0) return null;
  
  // 验证残片
  const firstFragment = fragments[0];
  if (!firstFragment.isFragment) return null;
  
  const config = EQUIPMENT_RARITY_CONFIG[firstFragment.rarity];
  
  // 检查数量
  if (fragments.length < config.fragmentsRequired) return null;
  
  // 检查是否同一装备
  const baseName = firstFragment.name.split('·')[0];
  const allSame = fragments.every(f => f.name.startsWith(baseName));
  if (!allSame) return null;
  
  // 生成完整装备
  return {
    ...firstFragment,
    id: generateId(),
    name: baseName,
    description: firstFragment.description.split('的残片')[0],
    
    // 重置等级
    level: 1,
    exp: 0,
    expToNext: calculateExpToNext(1, firstFragment.rarity),
    
    // 残片系统
    isFragment: false,
    fragmentIndex: undefined,
    fragmentsRequired: undefined,
    
    // 恢复技巧槽位
    techniqueSlots: firstFragment.allTechniques.length > 0 ? 1 : 0,
    equippedTechniques: firstFragment.allTechniques.length > 0
      ? [firstFragment.allTechniques[0].id, ...Array(firstFragment.maxTechniqueSlots - 1).fill(null)]
      : Array(firstFragment.maxTechniqueSlots).fill(null),
    
    source: 'reforge',
  };
}

/**
 * 装备升级
 */
export function upgradeEquipment(equipment: Equipment, expGain: number): Equipment {
  if (equipment.level >= equipment.maxLevel) {
    return equipment;
  }
  
  let newExp = equipment.exp + expGain;
  let newLevel = equipment.level;
  let newExpToNext = equipment.expToNext;
  let newTechniqueSlots = equipment.techniqueSlots;
  
  // 处理升级
  while (newExp >= newExpToNext && newLevel < equipment.maxLevel) {
    newExp -= newExpToNext;
    newLevel++;
    newExpToNext = calculateExpToNext(newLevel, equipment.rarity);
    
    // 检查是否解锁新槽位（只有武器才有技巧槽位）
    const isWeapon = equipment.slot === 'melee' || equipment.slot === 'ranged';
    if (isWeapon && newLevel <= equipment.maxTechniqueSlots) {
      newTechniqueSlots = newLevel;
    }
  }
  
  // 满级处理
  if (newLevel >= equipment.maxLevel) {
    newExp = 0;
    newExpToNext = 0;
    newTechniqueSlots = equipment.maxTechniqueSlots;
  }
  
  return {
    ...equipment,
    level: newLevel,
    exp: newExp,
    expToNext: newExpToNext,
    techniqueSlots: newTechniqueSlots,
  };
}

/**
 * 获取装备描述
 */
export function getEquipmentDescription(equipment: Equipment): string {
  const parts: string[] = [];
  
  if (equipment.attackBonus > 0) {
    parts.push(`攻击+${equipment.attackBonus}%`);
  }
  if (equipment.defenseBonus > 0) {
    parts.push(`防御+${equipment.defenseBonus}%`);
  }
  parts.push(`威力${equipment.power}`);
  
  return parts.join('，');
}

/**
 * 装备稀有度颜色
 */
export const equipmentRarityColors: Record<ItemRarity, string> = {
  '普通': 'text-gray-500',
  '稀有': 'text-blue-500',
  '史诗': 'text-purple-500',
  '传说': 'text-yellow-500',
  '神话': 'text-red-500',
};
