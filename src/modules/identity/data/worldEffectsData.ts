/**
 * 世界危险与机缘数据定义
 * 
 * 定义所有可能的危险和机缘效果，用于世界生成时随机选择
 */

import { StatName, WorldType } from '@/shared/lib/types';
import { WorldDataRegistry } from '@/shared/lib/registry';

// ============================================
// 类型定义
// ============================================

/** 危险类型 */
export type DangerType = 
  | 'stat_debuff'      // 属性削弱
  | 'resource_drain'   // 资源消耗
  | 'enemy_buff'       // 敌人强化
  | 'special_mechanic' // 特殊机制
  | 'random_event';    // 随机负面事件

/** 机缘类型 */
export type OpportunityType =
  | 'stat_buff'        // 属性加成
  | 'resource_gain'    // 资源获取
  | 'special_ability'  // 特殊能力
  | 'rare_drop'        // 稀有掉落
  | 'favorable_event'; // 有利事件

/** 触发类型 */
export type TriggerType = 
  | 'on_enter'        // 进入世界时
  | 'on_battle_start' // 战斗开始时
  | 'on_battle_end'   // 战斗结束时
  | 'on_turn'         // 每回合
  | 'on_explore'      // 探索时
  | 'random';         // 随机触发

/** 触发条件 */
export interface TriggerCondition {
  type: TriggerType;
  chance: number; // 触发概率 0-1
}

/** 危险效果 */
export interface DangerEffect {
  /** 属性修改 */
  statModifications?: Partial<Record<StatName, number>>;
  
  /** 资源修改 */
  resourceModifications?: {
    hp?: number;           // 每回合损失HP
    mp?: number;           // 每回合损失MP
    spiritStones?: number; // 进入时扣除灵石
  };
  
  /** 敌人强化 */
  enemyBuffs?: {
    attackBonus?: number;  // 攻击加成比例
    defenseBonus?: number; // 防御加成比例
    hpBonus?: number;      // 生命加成比例
  };
  
  /** 特殊效果 */
  specialEffects?: {
    type: 'no_heal' | 'no_escape' | 'double_damage_chance' | 'curse' | 'reduced_exp';
    value?: number;
  };
}

/** 机缘效果 */
export interface OpportunityEffect {
  /** 属性加成 */
  statModifications?: Partial<Record<StatName, number>>;
  
  /** 资源获取 */
  resourceGains?: {
    hp?: number;
    mp?: number;
    spiritStones?: number;
    exp?: number;
  };
  
  /** 特殊效果 */
  specialEffects?: {
    type: 'double_exp' | 'double_drop' | 'free_retreat' | 'extra_loot' | 'reduced_damage';
    value?: number;
  };
  
  /** 稀有掉落加成 */
  dropBonus?: {
    rarityBoost: number;     // 稀有度提升级数
    extraDropChance: number; // 额外掉落概率
  };
}

/** 世界危险 */
export interface WorldDanger {
  id: string;
  type: DangerType;
  name: string;
  description: string;
  triggerCondition: TriggerCondition;
  effect: DangerEffect;
  duration: number;  // -1永久, 0即时
  dispellable: boolean;
  dangerLevel: 1 | 2 | 3 | 4 | 5;
  /** 适用的世界类型（空表示通用） */
  worldTypes?: WorldType[];
}

/** 世界机缘 */
export interface WorldOpportunity {
  id: string;
  type: OpportunityType;
  name: string;
  description: string;
  triggerCondition: TriggerCondition;
  effect: OpportunityEffect;
  duration: number;
  opportunityLevel: 1 | 2 | 3 | 4 | 5;
  /** 与危险冲突ID列表 */
  conflictsWith?: string[];
  /** 适用的世界类型（空表示通用） */
  worldTypes?: WorldType[];
}

/** 世界奖励系数 */
export interface WorldRewardCoefficient {
  /** 经验系数 */
  expCoefficient: number;
  /** 灵石系数 */
  spiritStoneCoefficient: number;
  /** 掉落系数 */
  dropCoefficient: number;
  /** 品质加成概率 */
  rarityBonus: {
    rare: number;      // 稀有物品额外概率
    epic: number;      // 史诗物品额外概率
    legendary: number; // 传说物品额外概率
    mythic: number;    // 神话物品额外概率
  };
  /** 特殊奖励 */
  specialRewards: {
    ascensionMarkBonus: number;  // 飞升印记加成
    titleChance: number;         // 称号掉落概率
    specialItemChance: number;   // 特殊物品概率
  };
}

// ============================================
// 危险数据
// ============================================

/**
 * 从注册中心获取所有危险效果
 *
 * 优先从 WorldDataRegistry 读取，如果为空则使用 fallback 数据。
 */
export function getAllDangersFromRegistry(): WorldDanger[] {
  return WorldDataRegistry.getInstance().getAllDangers() as unknown as WorldDanger[];
}

/**
 * 从注册中心获取适用于指定世界的危险效果
 */
export function getWorldDangersFromRegistry(worldType: WorldType): WorldDanger[] {
  return WorldDataRegistry.getInstance().getDangersForWorld(worldType) as unknown as WorldDanger[];
}

/** @deprecated 使用 getAllDangersFromRegistry() 替代 */
export const WORLD_DANGERS: WorldDanger[] = [
  // ============ 1级危险（轻微） ============
  {
    id: 'weak_lingqi',
    type: 'stat_debuff',
    name: '灵气稀薄',
    description: '此方天地灵气稀薄，修炼效率降低',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 灵根: -1 }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 1,
  },
  {
    id: 'chaotic_elements',
    type: 'stat_debuff',
    name: '元素紊乱',
    description: '元素之力紊乱，战斗能力略微下降',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 体质: -1 }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 1,
  },
  {
    id: 'restless_mind',
    type: 'stat_debuff',
    name: '心神不宁',
    description: '此地磁场异常，心神难以安定',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 悟性: -1 }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 1,
  },
  
  // ============ 2级危险（中等） ============
  {
    id: 'demon_erosion',
    type: 'resource_drain',
    name: '魔气侵蚀',
    description: '魔气弥漫，每回合损失少量生命',
    triggerCondition: { type: 'on_turn', chance: 0.3 },
    effect: {
      resourceModifications: { hp: -5 }
    },
    duration: 0,
    dispellable: true,
    dangerLevel: 2,
  },
  {
    id: 'spirit_drain',
    type: 'resource_drain',
    name: '灵力枯竭',
    description: '灵力流失加剧，每回合损失法力',
    triggerCondition: { type: 'on_turn', chance: 0.25 },
    effect: {
      resourceModifications: { mp: -8 }
    },
    duration: 0,
    dispellable: true,
    dangerLevel: 2,
  },
  {
    id: 'weak_enemies',
    type: 'enemy_buff',
    name: '敌强我弱',
    description: '此地敌人实力略胜一筹',
    triggerCondition: { type: 'on_battle_start', chance: 1.0 },
    effect: {
      enemyBuffs: { attackBonus: 0.1, defenseBonus: 0.1 }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 2,
  },
  {
    id: 'reduced_insight',
    type: 'stat_debuff',
    name: '悟性压制',
    description: '天机混乱，领悟效率下降',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 悟性: -2, 灵根: -1 }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 2,
  },
  
  // ============ 3级危险（严重） ============
  {
    id: 'enemy_territory',
    type: 'enemy_buff',
    name: '敌人领地',
    description: '此处为敌人领地，敌人战斗力提升20%',
    triggerCondition: { type: 'on_battle_start', chance: 1.0 },
    effect: {
      enemyBuffs: {
        attackBonus: 0.2,
        defenseBonus: 0.15,
        hpBonus: 0.15,
      }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 3,
  },
  {
    id: 'cursed_ground',
    type: 'resource_drain',
    name: '诅咒之地',
    description: '受到诅咒，每回合损失生命和法力',
    triggerCondition: { type: 'on_turn', chance: 0.4 },
    effect: {
      resourceModifications: { hp: -8, mp: -5 }
    },
    duration: 0,
    dispellable: true,
    dangerLevel: 3,
  },
  {
    id: 'exp_reduction',
    type: 'special_mechanic',
    name: '天道压制',
    description: '此方天道排斥外来者，经验获取减少20%',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      specialEffects: { type: 'reduced_exp', value: 0.2 }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 3,
  },
  {
    id: 'healing_weakness',
    type: 'special_mechanic',
    name: '疗愈衰退',
    description: '治疗效果降低30%',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      specialEffects: { type: 'curse', value: 0.3 }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 3,
  },
  
  // ============ 4级危险（致命） ============
  {
    id: 'no_healing',
    type: 'special_mechanic',
    name: '禁疗禁锢',
    description: '无法使用恢复类道具和技能',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      specialEffects: { type: 'no_heal' }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 4,
  },
  {
    id: 'strong_enemies',
    type: 'enemy_buff',
    name: '强敌环伺',
    description: '敌人实力大增，攻防提升35%',
    triggerCondition: { type: 'on_battle_start', chance: 1.0 },
    effect: {
      enemyBuffs: {
        attackBonus: 0.35,
        defenseBonus: 0.35,
        hpBonus: 0.25,
      }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 4,
  },
  {
    id: 'heavy_curse',
    type: 'resource_drain',
    name: '重度诅咒',
    description: '受到严重诅咒，每回合损失大量生命',
    triggerCondition: { type: 'on_turn', chance: 0.5 },
    effect: {
      resourceModifications: { hp: -15, mp: -10 }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 4,
  },
  {
    id: 'no_escape',
    type: 'special_mechanic',
    name: '困兽之斗',
    description: '无法逃跑，必须战胜或战败',
    triggerCondition: { type: 'on_battle_start', chance: 1.0 },
    effect: {
      specialEffects: { type: 'no_escape' }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 4,
  },
  
  // ============ 5级危险（灾难） ============
  {
    id: 'realm_collapse',
    type: 'random_event',
    name: '界域崩塌',
    description: '每回合有概率受到大量伤害，敌人强化50%',
    triggerCondition: { type: 'on_turn', chance: 0.2 },
    effect: {
      resourceModifications: { hp: -25 },
      enemyBuffs: {
        attackBonus: 0.5,
        defenseBonus: 0.4,
        hpBonus: 0.5,
      }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 5,
  },
  {
    id: 'death_zone',
    type: 'special_mechanic',
    name: '死亡禁区',
    description: '无法治疗、无法逃跑、敌人强化40%',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      specialEffects: { type: 'no_heal' },
      enemyBuffs: {
        attackBonus: 0.4,
        defenseBonus: 0.3,
        hpBonus: 0.4,
      }
    },
    duration: -1,
    dispellable: false,
    dangerLevel: 5,
  },
  {
    id: 'extreme_hostility',
    type: 'enemy_buff',
    name: '举世皆敌',
    description: '此方世界对外来者极度敌视，所有敌人实力翻倍',
    triggerCondition: { type: 'on_battle_start', chance: 1.0 },
    effect: {
      enemyBuffs: {
        attackBonus: 1.0,
        defenseBonus: 0.8,
        hpBonus: 1.0,
      }
    },
    duration: 0,
    dispellable: false,
    dangerLevel: 5,
  },
];

// ============================================
// 机缘数据
// ============================================

/** 从注册中心获取所有机缘效果 */
export function getAllOpportunitiesFromRegistry(): WorldOpportunity[] {
  return WorldDataRegistry.getInstance().getAllOpportunities() as unknown as WorldOpportunity[];
}

/** 从注册中心获取适用于指定世界的机缘效果 */
export function getWorldOpportunitiesFromRegistry(worldType: WorldType): WorldOpportunity[] {
  return WorldDataRegistry.getInstance().getOpportunitiesForWorld(worldType) as unknown as WorldOpportunity[];
}

/** @deprecated 使用 getAllOpportunitiesFromRegistry() 替代 */
export const WORLD_OPPORTUNITIES: WorldOpportunity[] = [
  // ============ 1级机缘（轻微） ============
  {
    id: 'rich_lingqi',
    type: 'stat_buff',
    name: '灵气充沛',
    description: '此方天地灵气充沛，修炼效率提升',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 灵根: 2, 悟性: 1 }
    },
    duration: -1,
    opportunityLevel: 1,
  },
  {
    id: 'strong_body',
    type: 'stat_buff',
    name: '体魄强健',
    description: '此地环境有助于锻体',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 体质: 2 }
    },
    duration: -1,
    opportunityLevel: 1,
  },
  {
    id: 'lucky_encounter',
    type: 'resource_gain',
    name: '机缘巧合',
    description: '偶有小机缘，探索时可能获得额外资源',
    triggerCondition: { type: 'on_explore', chance: 0.2 },
    effect: {
      resourceGains: { spiritStones: 30 }
    },
    duration: 0,
    opportunityLevel: 1,
  },
  
  // ============ 2级机缘（中等） ============
  {
    id: 'treasure_vein',
    type: 'resource_gain',
    name: '灵脉矿藏',
    description: '发现灵脉，每次探索额外获得灵石',
    triggerCondition: { type: 'on_explore', chance: 0.35 },
    effect: {
      resourceGains: { spiritStones: 80 }
    },
    duration: 0,
    opportunityLevel: 2,
  },
  {
    id: 'battle_insight',
    type: 'stat_buff',
    name: '战斗领悟',
    description: '战斗中容易领悟，属性提升',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      statModifications: { 体质: 2, 灵根: 2, 意志: 1 }
    },
    duration: -1,
    opportunityLevel: 2,
  },
  {
    id: 'exp_boost_minor',
    type: 'special_ability',
    name: '悟道加护',
    description: '修炼速度提升30%',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      specialEffects: { type: 'double_exp', value: 1.3 }
    },
    duration: -1,
    opportunityLevel: 2,
  },
  
  // ============ 3级机缘（良好） ============
  {
    id: 'ancient_realm',
    type: 'special_ability',
    name: '上古遗迹',
    description: '进入上古修士留下的遗迹，获得额外经验',
    triggerCondition: { type: 'on_enter', chance: 0.3 },
    effect: {
      specialEffects: { type: 'double_exp', value: 1.5 }
    },
    duration: -1,
    opportunityLevel: 3,
  },
  {
    id: 'resource_rich',
    type: 'resource_gain',
    name: '资源富集',
    description: '此地资源丰富，探索收益翻倍',
    triggerCondition: { type: 'on_explore', chance: 0.4 },
    effect: {
      resourceGains: { spiritStones: 150, exp: 50 }
    },
    duration: 0,
    opportunityLevel: 3,
  },
  {
    id: 'drop_boost',
    type: 'rare_drop',
    name: '宝物感应',
    description: '更容易发现宝物，稀有掉落概率提升',
    triggerCondition: { type: 'on_enter', chance: 0.35 },
    effect: {
      dropBonus: {
        rarityBoost: 1,
        extraDropChance: 0.2,
      }
    },
    duration: -1,
    opportunityLevel: 3,
  },
  {
    id: 'damage_reduction',
    type: 'special_ability',
    name: '护体神光',
    description: '受到的伤害减少15%',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: {
      specialEffects: { type: 'reduced_damage', value: 0.15 }
    },
    duration: -1,
    opportunityLevel: 3,
  },
  
  // ============ 4级机缘（优秀） ============
  {
    id: 'lucky_star',
    type: 'rare_drop',
    name: '吉星高照',
    description: '运势大好，掉落稀有物品概率大幅提升',
    triggerCondition: { type: 'on_enter', chance: 0.25 },
    effect: {
      dropBonus: {
        rarityBoost: 2,
        extraDropChance: 0.35,
      }
    },
    duration: -1,
    opportunityLevel: 4,
  },
  {
    id: 'double_harvest',
    type: 'special_ability',
    name: '双倍收获',
    description: '战斗奖励翻倍',
    triggerCondition: { type: 'on_battle_end', chance: 0.4 },
    effect: {
      specialEffects: { type: 'double_drop', value: 2.0 }
    },
    duration: 0,
    opportunityLevel: 4,
  },
  {
    id: 'great_enlightenment',
    type: 'stat_buff',
    name: '大彻大悟',
    description: '获得大机缘，属性大幅提升',
    triggerCondition: { type: 'on_enter', chance: 0.2 },
    effect: {
      statModifications: { 体质: 4, 灵根: 4, 悟性: 3, 意志: 2, 幸运: 2 }
    },
    duration: -1,
    opportunityLevel: 4,
  },
  {
    id: 'retreat_safety',
    type: 'special_ability',
    name: '安全撤退',
    description: '可以无损撤退任何战斗',
    triggerCondition: { type: 'on_enter', chance: 0.3 },
    effect: {
      specialEffects: { type: 'free_retreat' }
    },
    duration: -1,
    opportunityLevel: 4,
  },
  
  // ============ 5级机缘（天赐） ============
  {
    id: 'heavenly_blessing',
    type: 'favorable_event',
    name: '天赐良机',
    description: '天命眷顾，所有收益翻倍，且有几率获得传说物品',
    triggerCondition: { type: 'on_enter', chance: 0.12 },
    effect: {
      specialEffects: { type: 'double_drop', value: 2.0 },
      statModifications: { 幸运: 5 },
      dropBonus: {
        rarityBoost: 3,
        extraDropChance: 0.5,
      }
    },
    duration: -1,
    opportunityLevel: 5,
  },
  {
    id: 'legendary_inheritance',
    type: 'stat_buff',
    name: '传说传承',
    description: '获得传说级传承，全属性大幅提升',
    triggerCondition: { type: 'on_enter', chance: 0.1 },
    effect: {
      statModifications: { 体质: 6, 灵根: 6, 悟性: 5, 意志: 4, 幸运: 4 }
    },
    duration: -1,
    opportunityLevel: 5,
  },
  {
    id: 'immortal_favor',
    type: 'favorable_event',
    name: '仙人垂青',
    description: '获得仙人庇护，经验翻倍、伤害减免30%、掉落提升',
    triggerCondition: { type: 'on_enter', chance: 0.08 },
    effect: {
      specialEffects: { 
        type: 'double_exp', 
        value: 2.0 
      },
      statModifications: { 幸运: 3 },
      dropBonus: {
        rarityBoost: 2,
        extraDropChance: 0.4,
      }
    },
    duration: -1,
    opportunityLevel: 5,
    conflictsWith: ['no_healing', 'heavy_curse'],
  },
];

// ============================================
// 工具函数
// ============================================

/**
 * 根据难度系数获取最大危险等级
 */
export function getMaxDangerLevel(coefficient: number): number {
  return Math.min(5, Math.ceil(coefficient));
}

/**
 * 根据难度系数获取最大机缘等级
 * @deprecated 已废弃，机缘等级不再受世界难度系数限制
 * 现在机缘解锁由 checkOpportunityUnlock 函数控制
 * 保留此函数仅为兼容旧代码，始终返回 5
 */
export function getMaxOpportunityLevel(_coefficient: number): number {
  return 5; // 所有机缘等级都可以出现
}

/**
 * 根据难度系数计算危险数量
 */
export function calculateDangerCount(coefficient: number): number {
  // 1.0: 0个, 1.5: 1个, 2.0: 1-2个, 2.5: 2-3个, 3.0+: 3-4个
  if (coefficient < 1.3) return 0;
  if (coefficient < 1.8) return 1;
  if (coefficient < 2.3) return Math.random() > 0.5 ? 1 : 2;
  if (coefficient < 3.0) return Math.random() > 0.5 ? 2 : 3;
  return Math.random() > 0.5 ? 3 : 4;
}

/**
 * 根据难度系数计算机缘数量
 */
export function calculateOpportunityCount(coefficient: number): number {
  // 高难度世界也有更多机缘（风险收益对等）
  if (coefficient < 1.2) return 1;
  if (coefficient < 1.8) return Math.random() > 0.5 ? 1 : 2;
  if (coefficient < 2.5) return 2;
  return Math.random() > 0.5 ? 2 : 3;
}

/**
 * 获取危险图标
 */
export function getDangerIcon(level: number): string {
  const icons: Record<number, string> = {
    1: '⚠️',
    2: '⚡',
    3: '🔥',
    4: '💀',
    5: '☠️',
  };
  return icons[level] || '⚠️';
}

/**
 * 获取机缘图标
 */
export function getOpportunityIcon(level: number): string {
  const icons: Record<number, string> = {
    1: '✨',
    2: '🌟',
    3: '💫',
    4: '🎁',
    5: '👑',
  };
  return icons[level] || '✨';
}
