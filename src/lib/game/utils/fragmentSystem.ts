/**
 * 残本/残片系统（重构版 V2）
 * 
 * 核心设计：
 * - 每个碎片对应一个具体的功法或装备名称
 * - 同名碎片分为多个序号（如 1/3, 2/3, 3/3）
 * - 收集齐同名碎片的全部序号即可合成该物品
 */

import { 
  generateRandomEquipment,
} from './equipment';
import { 
  TECHNIQUE_RARITY_CONFIG,
  EQUIPMENT_RARITY_CONFIG,
  RARITY_ORDER,
  RARITY_WEIGHTS,
} from '../skill/skillTypes';
import { 
  generateRandomTechnique, 
} from './technique';
import { 
  ItemRarity, 
  EnemyTier, 
  Technique, 
  Equipment, 
  WorldType 
} from '../types';
import { clampNonNegative } from './numberUtils';

// ============================================
// 类型定义
// ============================================

/** 残本/残片类型 */
export type FragmentType = 'technique' | 'equipment';

/** 单个碎片数据 */
export interface FragmentData {
  /** 碎片唯一ID */
  id: string;
  /** 源物品名称（功法名或装备名） */
  sourceName: string;
  /** 碎片类型 */
  type: FragmentType;
  /** 稀有度 */
  rarity: ItemRarity;
  /** 碎片序号（1-based） */
  index: number;
  /** 合成所需碎片总数 */
  totalRequired: number;
  /** 源物品数据（用于合成时直接使用） */
  sourceItem: Technique | Equipment;
}

/** 玩家残本/残片库存 */
export interface FragmentInventory {
  /** 功法残本库存 */
  techniqueFragments: FragmentData[];
  /** 装备残片库存 */
  equipmentFragments: FragmentData[];
}

/** 碎片掉落数据 */
export interface FragmentDropData {
  /** 碎片类型 */
  type: FragmentType;
  /** 稀有度 */
  rarity: ItemRarity;
  /** 数量 */
  count: number;
  /** 源物品名称 */
  sourceName: string;
  /** 碎片数据 */
  fragment?: FragmentData;
}

/** 完整物品掉落数据 */
export interface CompleteItemDropData {
  /** 物品类型 */
  type: FragmentType;
  /** 稀有度 */
  rarity: ItemRarity;
  /** 源物品名称 */
  sourceName: string;
  /** 完整物品数据 */
  item: Technique | Equipment;
}

/** 掉落结果 */
export interface FragmentDropResult {
  /** 掉落的碎片 */
  fragments: FragmentDropData[];
  /** 掉落的完整物品 */
  completeItems: CompleteItemDropData[];
  /** 掉落日志 */
  log: string;
}

/** 合成结果 */
export interface SynthesisResult {
  success: boolean;
  item?: Technique | Equipment;
  itemType?: FragmentType;
  message: string;
}

/** 碎片分组（按源物品名称分组） */
export interface FragmentGroup {
  /** 源物品名称 */
  sourceName: string;
  /** 碎片类型 */
  type: FragmentType;
  /** 稀有度 */
  rarity: ItemRarity;
  /** 已收集的碎片序号列表 */
  collectedIndices: number[];
  /** 合成所需碎片总数 */
  totalRequired: number;
  /** 是否可以合成 */
  canSynthesize: boolean;
  /** 进度百分比 */
  progress: number;
}

// ============================================
// 核心配置
// ============================================

/** 稀有度解锁等级 */
export const RARITY_UNLOCK_LEVELS: Record<ItemRarity, number> = {
  '普通': 1,
  '稀有': 40,
  '史诗': 80,
  '传说': 120,
  '神话': 160,
};

/** 合成所需碎片数量 */
export const SYNTHESIS_REQUIREMENTS: Record<ItemRarity, number> = {
  '普通': 3,
  '稀有': 4,
  '史诗': 6,
  '传说': 8,
  '神话': 12,
};

/**
 * 完整物品掉落概率配置
 * 
 * 设计原则：
 * - 普通/稀有：100% 掉落完整物品，降低开局难度
 * - 史诗：30% 几率掉落完整，70% 掉落碎片
 * - 传说/神话：100% 掉落碎片，增加稀缺性
 */
export const COMPLETE_ITEM_DROP_RATE: Record<ItemRarity, number> = {
  '普通': 1.00,   // 100% 完整掉落
  '稀有': 1.00,   // 100% 完整掉落
  '史诗': 0.30,   // 30% 完整掉落，70% 碎片
  '传说': 0.00,   // 0% 完整掉落，100% 碎片
  '神话': 0.00,   // 0% 完整掉落，100% 碎片
};

/** 敌人类型掉落配置 */
export const ENEMY_DROP_CONFIG: Record<EnemyTier, {
  dropRate: number;
  minCount: number;
  maxCount: number;
  techniqueWeight: number;
  equipmentWeight: number;
}> = {
  normal: { dropRate: 1.00, minCount: 1, maxCount: 1, techniqueWeight: 0.5, equipmentWeight: 0.5 },
  elite: { dropRate: 1.00, minCount: 1, maxCount: 2, techniqueWeight: 0.5, equipmentWeight: 0.5 },
  miniboss: { dropRate: 1.00, minCount: 2, maxCount: 3, techniqueWeight: 0.4, equipmentWeight: 0.6 },
  boss: { dropRate: 1.00, minCount: 3, maxCount: 5, techniqueWeight: 0.45, equipmentWeight: 0.55 },
};

/** 所有品质列表（从低到高） */
export { RARITY_ORDER } from '../skill/skillTypes';

// ============================================
// 工具函数
// ============================================

function random(min: number, max: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generateFragmentId(): string {
  return `frag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** 获取玩家等级对应的最高可掉落稀有度 */
export function getMaxDropRarityForPlayer(playerLevel: number): ItemRarity {
  if (playerLevel >= 160) return '神话';
  if (playerLevel >= 120) return '传说';
  if (playerLevel >= 80) return '史诗';
  if (playerLevel >= 40) return '稀有';
  return '普通';
}

/** 获取敌人等级对应的最高可掉落稀有度 */
function getMaxDropRarity(enemyLevel: number): ItemRarity {
  const rarities = [...RARITY_ORDER].reverse();
  for (const rarity of rarities) {
    if (enemyLevel >= RARITY_UNLOCK_LEVELS[rarity]) {
      return rarity;
    }
  }
  return '普通';
}

/** 随机选择稀有度 */
function rollRarity(maxRarity: ItemRarity, luck: number = 0, rng: () => number = Math.random): ItemRarity {
  const maxIndex = RARITY_ORDER.indexOf(maxRarity);
  const availableRarities = RARITY_ORDER.slice(0, maxIndex + 1);
  
  const luckBonus = luck * 0.01;
  
  let totalWeight = 0;
  const weights = availableRarities.map((rarity, index) => {
    const baseWeight = RARITY_WEIGHTS[rarity];
    const indexBonus = index * luckBonus * baseWeight;
    const weight = baseWeight + indexBonus;
    totalWeight += weight;
    return { rarity, weight, cumulative: totalWeight };
  });
  
  const roll = rng() * totalWeight;
  
  for (const { rarity, cumulative } of weights) {
    if (roll <= cumulative) {
      return rarity;
    }
  }
  
  return availableRarities[0];
}

/** 随机选择碎片类型 */
function rollFragmentType(techniqueWeight: number, equipmentWeight: number, rng: () => number = Math.random): FragmentType {
  const total = techniqueWeight + equipmentWeight;
  const roll = rng() * total;
  return roll < techniqueWeight ? 'technique' : 'equipment';
}

// ============================================
// 碎片生成
// ============================================

/**
 * 生成碎片掉落（新系统 V3）
 * 
 * 核心逻辑：
 * 1. 根据敌人类型确定掉落数量
 * 2. 根据稀有度决定是掉落完整物品还是碎片
 * 3. 普通/稀有：100% 完整物品
 * 4. 史诗：30% 完整物品，70% 碎片
 * 5. 传说/神话：100% 碎片
 */
export function generateFragmentDrop(
  enemyLevel: number,
  enemyTier: EnemyTier,
  luck: number = 0,
  worldType?: WorldType,
  playerLevel: number = 1,
  rng: () => number = Math.random
): FragmentDropResult {
  const config = ENEMY_DROP_CONFIG[enemyTier];
  
  // 计算最大稀有度
  const maxRarityByPlayer = getMaxDropRarityForPlayer(playerLevel);
  const maxRarityByEnemy = getMaxDropRarity(enemyLevel);
  const playerMaxIndex = RARITY_ORDER.indexOf(maxRarityByPlayer);
  const enemyMaxIndex = RARITY_ORDER.indexOf(maxRarityByEnemy);
  const maxIndex = Math.min(playerMaxIndex, enemyMaxIndex);
  const finalMaxRarity = RARITY_ORDER[maxIndex];
  
  // 确定掉落数量
  const count = random(config.minCount, config.maxCount);
  
  // 生成掉落
  const fragments: FragmentDropData[] = [];
  const completeItems: CompleteItemDropData[] = [];
  
  for (let i = 0; i < count; i++) {
    const type = rollFragmentType(config.techniqueWeight, config.equipmentWeight, rng);
    const rarity = rollRarity(finalMaxRarity, luck, rng);
    
    // 生成源物品
    let sourceItem: Technique | Equipment;
    if (type === 'technique') {
      sourceItem = generateRandomTechnique(enemyLevel, worldType, rarity);
    } else {
      sourceItem = generateRandomEquipment(enemyLevel, enemyTier === 'boss', worldType, rarity);
    }
    
    // 判断是否掉落完整物品
    const completeDropRate = COMPLETE_ITEM_DROP_RATE[rarity];
    const rollComplete = rng();
    
    if (rollComplete < completeDropRate) {
      // 掉落完整物品
      completeItems.push({
        type,
        rarity,
        sourceName: sourceItem.name,
        item: sourceItem,
      });
    } else {
      // 掉落碎片
      const totalRequired = SYNTHESIS_REQUIREMENTS[rarity];
      const index = random(1, totalRequired);
      
      const fragment: FragmentData = {
        id: generateFragmentId(),
        sourceName: sourceItem.name,
        type,
        rarity,
        index,
        totalRequired,
        sourceItem,
      };
      
      fragments.push({
        type,
        rarity,
        count: 1,
        sourceName: sourceItem.name,
        fragment,
      });
    }
  }
  
  // 生成日志
  const logParts: string[] = [];
  
  if (completeItems.length > 0) {
    logParts.push(completeItems.map(item => {
      const itemType = item.type === 'technique' ? '功法' : '装备';
      return `「${item.sourceName}」(${itemType})`;
    }).join('、'));
  }
  
  if (fragments.length > 0) {
    logParts.push(fragments.map(f => {
      const fragType = f.type === 'technique' ? '残本' : '残片';
      return `「${f.sourceName}·${fragType}${f.fragment?.index}/${f.fragment?.totalRequired}」`;
    }).join('、'));
  }
  
  const log = logParts.length > 0 ? `获得${logParts.join('、')}` : '';
  
  return { fragments, completeItems, log };
}

/**
 * 从敌人实际拥有的功法和装备中生成碎片掉落
 * 
 * 同样遵循完整物品掉落规则：
 * - 普通/稀有：100% 完整物品
 * - 史诗：30% 完整物品，70% 碎片
 * - 传说/神话：100% 碎片
 */
export function generateFragmentDropFromEnemyItems(
  enemyTechniques: Technique[],
  enemyEquipments: Equipment[],
  enemyTier: EnemyTier,
  luck: number = 0,
  rng: () => number = Math.random
): FragmentDropResult {
  const config = ENEMY_DROP_CONFIG[enemyTier];
  
  const allItems = [
    ...enemyTechniques.map(t => ({ item: t, type: 'technique' as FragmentType })),
    ...enemyEquipments.map(e => ({ item: e, type: 'equipment' as FragmentType })),
  ];
  
  if (allItems.length === 0) {
    return { fragments: [], completeItems: [], log: '' };
  }
  
  const count = Math.min(random(config.minCount, config.maxCount), allItems.length);
  const shuffled = [...allItems].sort(() => rng() - 0.5);
  const selectedItems = shuffled.slice(0, count);
  
  const fragments: FragmentDropData[] = [];
  const completeItems: CompleteItemDropData[] = [];
  
  for (const { item, type } of selectedItems) {
    const rarity = item.rarity;
    
    // 判断是否掉落完整物品
    const completeDropRate = COMPLETE_ITEM_DROP_RATE[rarity];
    const rollComplete = rng();
    
    if (rollComplete < completeDropRate) {
      // 掉落完整物品
      completeItems.push({
        type,
        rarity,
        sourceName: item.name,
        item,
      });
    } else {
      // 掉落碎片
      const totalRequired = SYNTHESIS_REQUIREMENTS[rarity];
      const index = random(1, totalRequired);
      
      const fragment: FragmentData = {
        id: generateFragmentId(),
        sourceName: item.name,
        type,
        rarity,
        index,
        totalRequired,
        sourceItem: item,
      };
      
      fragments.push({
        type,
        rarity,
        count: 1,
        sourceName: item.name,
        fragment,
      });
    }
  }
  
  // 生成日志
  const logParts: string[] = [];
  
  if (completeItems.length > 0) {
    logParts.push(completeItems.map(item => {
      const itemType = item.type === 'technique' ? '功法' : '装备';
      return `「${item.sourceName}」(${itemType})`;
    }).join('、'));
  }
  
  if (fragments.length > 0) {
    logParts.push(fragments.map(f => {
      const fragType = f.type === 'technique' ? '残本' : '残片';
      return `「${f.sourceName}·${fragType}${f.fragment?.index}/${f.fragment?.totalRequired}」`;
    }).join('、'));
  }
  
  const log = logParts.length > 0 ? `获得${logParts.join('、')}` : '';
  
  return { fragments, completeItems, log };
}

// ============================================
// 库存管理
// ============================================

/**
 * 创建空的碎片库存
 */
export function createEmptyFragmentInventory(): FragmentInventory {
  return {
    techniqueFragments: [],
    equipmentFragments: [],
  };
}

/**
 * 添加碎片到库存
 */
export function addFragmentToInventory(
  inventory: FragmentInventory,
  dropData: FragmentDropData
): void {
  if (!dropData.fragment) return;
  
  if (dropData.type === 'technique') {
    inventory.techniqueFragments.push(dropData.fragment);
  } else {
    inventory.equipmentFragments.push(dropData.fragment);
  }
}

/**
 * 按源物品名称获取碎片分组
 */
export function getFragmentGroupsByName(inventory: FragmentInventory): FragmentGroup[] {
  const groups: Map<string, FragmentGroup> = new Map();
  
  // 处理功法碎片
  for (const fragment of inventory.techniqueFragments) {
    const key = `technique_${fragment.sourceName}`;
    const existing = groups.get(key);
    
    if (existing) {
      if (!existing.collectedIndices.includes(fragment.index)) {
        existing.collectedIndices.push(fragment.index);
      }
    } else {
      groups.set(key, {
        sourceName: fragment.sourceName,
        type: 'technique',
        rarity: fragment.rarity,
        collectedIndices: [fragment.index],
        totalRequired: fragment.totalRequired,
        canSynthesize: false,
        progress: 0,
      });
    }
  }
  
  // 处理装备碎片
  for (const fragment of inventory.equipmentFragments) {
    const key = `equipment_${fragment.sourceName}`;
    const existing = groups.get(key);
    
    if (existing) {
      if (!existing.collectedIndices.includes(fragment.index)) {
        existing.collectedIndices.push(fragment.index);
      }
    } else {
      groups.set(key, {
        sourceName: fragment.sourceName,
        type: 'equipment',
        rarity: fragment.rarity,
        collectedIndices: [fragment.index],
        totalRequired: fragment.totalRequired,
        canSynthesize: false,
        progress: 0,
      });
    }
  }
  
  // 计算是否可合成和进度
  const result: FragmentGroup[] = [];
  for (const group of groups.values()) {
    // 可合成条件：收集了全部序号（1 到 totalRequired）
    const allIndices = Array.from({ length: group.totalRequired }, (_, i) => i + 1);
    group.canSynthesize = allIndices.every(idx => group.collectedIndices.includes(idx));
    group.progress = group.collectedIndices.length / group.totalRequired;
    result.push(group);
  }
  
  // 按可合成和稀有度排序
  result.sort((a, b) => {
    if (a.canSynthesize !== b.canSynthesize) return a.canSynthesize ? -1 : 1;
    const rarityOrder = RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
    if (rarityOrder !== 0) return rarityOrder;
    return a.sourceName.localeCompare(b.sourceName);
  });
  
  return result;
}

// ============================================
// 合成逻辑
// ============================================

/**
 * 合成指定名称的碎片
 * 
 * @param inventory 碎片库存
 * @param sourceName 源物品名称
 * @param type 碎片类型
 */
export function synthesizeFragmentByName(
  inventory: FragmentInventory,
  sourceName: string,
  type: FragmentType
): SynthesisResult {
  const fragments = type === 'technique' 
    ? inventory.techniqueFragments 
    : inventory.equipmentFragments;
  
  // 找到该名称的所有碎片
  const matchingFragments = fragments.filter(f => f.sourceName === sourceName);
  if (matchingFragments.length === 0) {
    return { 
      success: false, 
      message: `未找到「${sourceName}」的碎片` 
    };
  }
  
  const rarity = matchingFragments[0].rarity;
  const totalRequired = matchingFragments[0].totalRequired;
  
  // 检查是否收集齐全
  const collectedIndices = matchingFragments.map(f => f.index);
  const allIndices = Array.from({ length: totalRequired }, (_, i) => i + 1);
  const canSynthesize = allIndices.every(idx => collectedIndices.includes(idx));
  
  if (!canSynthesize) {
    const missing = allIndices.filter(idx => !collectedIndices.includes(idx));
    return { 
      success: false, 
      message: `「${sourceName}」碎片不完整，缺少第 ${missing.join(', ')} 片` 
    };
  }
  
  // 找到源物品数据
  const sourceItem = matchingFragments[0].sourceItem;
  
  // 移除使用的碎片（每种序号只移除一个）
  const usedIndices = new Set<number>();
  if (type === 'technique') {
    inventory.techniqueFragments = inventory.techniqueFragments.filter(f => {
      if (f.sourceName !== sourceName) return true;
      if (usedIndices.has(f.index)) return true; // 保留重复的
      usedIndices.add(f.index);
      return false;
    });
  } else {
    inventory.equipmentFragments = inventory.equipmentFragments.filter(f => {
      if (f.sourceName !== sourceName) return true;
      if (usedIndices.has(f.index)) return true;
      usedIndices.add(f.index);
      return false;
    });
  }
  
  // 返回源物品（清除碎片标记）
  if (type === 'technique') {
    const technique = sourceItem as Technique;
    delete (technique as any).isFragment;
    delete (technique as any).fragmentIndex;
    delete (technique as any).fragmentsRequired;
    return {
      success: true,
      item: technique,
      itemType: 'technique',
      message: `合成成功！获得${rarity}功法「${technique.name}」`,
    };
  } else {
    const equipment = sourceItem as Equipment;
    delete (equipment as any).isFragment;
    delete (equipment as any).fragmentIndex;
    delete (equipment as any).fragmentsRequired;
    return {
      success: true,
      item: equipment,
      itemType: 'equipment',
      message: `重铸成功！获得${rarity}装备「${equipment.name}」`,
    };
  }
}

// ============================================
// 兼容旧版 API（用于 UI 组件）
// ============================================

/** 旧版碎片分组（按稀有度） */
export interface LegacyFragmentGroup {
  type: FragmentType;
  rarity: ItemRarity;
  count: number;
  required: number;
  canSynthesize: boolean;
}

/**
 * 获取碎片分组（按稀有度，兼容旧 UI）
 * @deprecated 请使用 getFragmentGroupsByName
 */
export function getFragmentGroups(inventory: FragmentInventory): LegacyFragmentGroup[] {
  const groups: LegacyFragmentGroup[] = [];
  
  for (const rarity of RARITY_ORDER) {
    const techniqueCount = inventory.techniqueFragments.filter(f => f.rarity === rarity).length;
    if (techniqueCount > 0) {
      groups.push({
        type: 'technique',
        rarity,
        count: techniqueCount,
        required: SYNTHESIS_REQUIREMENTS[rarity],
        canSynthesize: techniqueCount >= SYNTHESIS_REQUIREMENTS[rarity],
      });
    }
    
    const equipmentCount = inventory.equipmentFragments.filter(f => f.rarity === rarity).length;
    if (equipmentCount > 0) {
      groups.push({
        type: 'equipment',
        rarity,
        count: equipmentCount,
        required: SYNTHESIS_REQUIREMENTS[rarity],
        canSynthesize: equipmentCount >= SYNTHESIS_REQUIREMENTS[rarity],
      });
    }
  }
  
  return groups;
}

/**
 * 获取所有碎片分组（包括数量为0的，兼容旧 UI）
 * @deprecated 请使用 getFragmentGroupsByName
 */
export function getAllFragmentGroups(inventory: FragmentInventory): LegacyFragmentGroup[] {
  const groups: LegacyFragmentGroup[] = [];
  
  for (const rarity of RARITY_ORDER) {
    const techniqueCount = inventory.techniqueFragments.filter(f => f.rarity === rarity).length;
    groups.push({
      type: 'technique',
      rarity,
      count: techniqueCount,
      required: SYNTHESIS_REQUIREMENTS[rarity],
      canSynthesize: techniqueCount >= SYNTHESIS_REQUIREMENTS[rarity],
    });
    
    const equipmentCount = inventory.equipmentFragments.filter(f => f.rarity === rarity).length;
    groups.push({
      type: 'equipment',
      rarity,
      count: equipmentCount,
      required: SYNTHESIS_REQUIREMENTS[rarity],
      canSynthesize: equipmentCount >= SYNTHESIS_REQUIREMENTS[rarity],
    });
  }
  
  return groups;
}

/**
 * 按稀有度合成功法碎片（兼容旧 API）
 * @deprecated 请使用 synthesizeFragmentByName
 */
export function synthesizeTechniqueFragmentsByRarity(
  inventory: FragmentInventory,
  rarity: ItemRarity,
  playerLevel: number = 1,
  worldType?: WorldType
): SynthesisResult {
  const fragments = inventory.techniqueFragments.filter(f => f.rarity === rarity);
  const required = SYNTHESIS_REQUIREMENTS[rarity];
  
  if (fragments.length < required) {
    return { 
      success: false, 
      message: `${rarity}功法碎片不足，需要${required}个，当前${fragments.length}个` 
    };
  }
  
  // 优先尝试找同名完整的碎片组
  const groups = getFragmentGroupsByName(inventory);
  const completeGroup = groups.find(g => 
    g.type === 'technique' && 
    g.rarity === rarity && 
    g.canSynthesize
  );
  
  if (completeGroup) {
    return synthesizeFragmentByName(inventory, completeGroup.sourceName, 'technique');
  }
  
  // 没有完整的同名碎片，移除碎片并生成随机物品
  for (let i = 0; i < required; i++) {
    const index = inventory.techniqueFragments.findIndex(f => f.rarity === rarity);
    if (index >= 0) {
      inventory.techniqueFragments.splice(index, 1);
    }
  }
  
  const technique = generateRandomTechnique(playerLevel, worldType, rarity);
  
  return {
    success: true,
    item: technique,
    itemType: 'technique',
    message: `合成成功！获得${rarity}功法「${technique.name}」`,
  };
}

/**
 * 按稀有度重铸装备碎片（兼容旧 API）
 * @deprecated 请使用 synthesizeFragmentByName
 */
export function reforgeEquipmentFragmentsByRarity(
  inventory: FragmentInventory,
  rarity: ItemRarity,
  playerLevel: number = 1,
  worldType?: WorldType
): SynthesisResult {
  const fragments = inventory.equipmentFragments.filter(f => f.rarity === rarity);
  const required = SYNTHESIS_REQUIREMENTS[rarity];
  
  if (fragments.length < required) {
    return { 
      success: false, 
      message: `${rarity}装备碎片不足，需要${required}个，当前${fragments.length}个` 
    };
  }
  
  // 优先尝试找同名完整的碎片组
  const groups = getFragmentGroupsByName(inventory);
  const completeGroup = groups.find(g => 
    g.type === 'equipment' && 
    g.rarity === rarity && 
    g.canSynthesize
  );
  
  if (completeGroup) {
    return synthesizeFragmentByName(inventory, completeGroup.sourceName, 'equipment');
  }
  
  // 没有完整的同名碎片，移除碎片并生成随机物品
  for (let i = 0; i < required; i++) {
    const index = inventory.equipmentFragments.findIndex(f => f.rarity === rarity);
    if (index >= 0) {
      inventory.equipmentFragments.splice(index, 1);
    }
  }
  
  const equipment = generateRandomEquipment(playerLevel, false, worldType, rarity);
  
  return {
    success: true,
    item: equipment,
    itemType: 'equipment',
    message: `重铸成功！获得${rarity}装备「${equipment.name}」`,
  };
}

/**
 * 统一合成入口（兼容旧 API）
 * @deprecated 请使用 synthesizeFragmentByName
 */
export function synthesizeFragmentGroup(
  inventory: FragmentInventory,
  type: FragmentType,
  rarity: ItemRarity,
  playerLevel: number = 1,
  worldType?: WorldType
): SynthesisResult {
  if (type === 'technique') {
    return synthesizeTechniqueFragmentsByRarity(inventory, rarity, playerLevel, worldType);
  } else {
    return reforgeEquipmentFragmentsByRarity(inventory, rarity, playerLevel, worldType);
  }
}

// ============================================
// 统计函数
// ============================================

/**
 * 获取碎片总数
 */
export function getTotalFragmentCount(inventory: FragmentInventory): number {
  return inventory.techniqueFragments.length + inventory.equipmentFragments.length;
}

/**
 * 获取可合成数量
 */
export function getSynthesizableCount(inventory: FragmentInventory): number {
  const groups = getFragmentGroupsByName(inventory);
  return groups.filter(g => g.canSynthesize).length;
}

/**
 * 检查是否可以合成（旧版兼容）
 */
export function canSynthesize(
  inventory: FragmentInventory,
  type: FragmentType,
  rarity: ItemRarity
): boolean {
  const groups = getFragmentGroupsByName(inventory);
  return groups.some(g => g.type === type && g.rarity === rarity && g.canSynthesize);
}

/**
 * 获取合成进度（旧版兼容）
 */
export function getSynthesisProgress(
  inventory: FragmentInventory,
  type: FragmentType,
  rarity: ItemRarity
): { current: number; required: number } {
  const fragments = type === 'technique' 
    ? inventory.techniqueFragments 
    : inventory.equipmentFragments;
  const count = fragments.filter(f => f.rarity === rarity).length;
  
  return { current: count, required: SYNTHESIS_REQUIREMENTS[rarity] };
}
