/**
 * 游戏系统集成管理器
 * 统一管理事件系统、成就系统、图鉴系统
 */

import { achievementSystem, AchievementConfig } from '@/modules/collection/logic/achievement/achievementSystem';
import { collectionSystem, BondConfig } from '@/modules/collection/logic/collectionSystem';
import { gameEventManager, GameEventType, EventPayloadMap, triggerEvent } from '@/shared/lib/events/eventManager';
import { GameStatistics, Technique, Equipment } from '@/shared/lib/types';

// ============================================
// 内联配置（避免异步加载）
// ============================================

const ACHIEVEMENT_CONFIGS: AchievementConfig[] = [
  {
    id: "level_10",
    name: "初窥门径",
    description: "角色等级达到10级",
    type: "level",
    icon: "trophy",
    triggerEvent: GameEventType.LEVEL_UP,
    condition: { type: "compare", field: "newLevel", operator: ">=", value: 10 },
    rewards: { experience: 100, stats: { "体质": 5 } },
    rarity: "普通"
  },
  {
    id: "level_30",
    name: "小有所成",
    description: "角色等级达到30级",
    type: "level",
    icon: "trophy",
    triggerEvent: GameEventType.LEVEL_UP,
    condition: { type: "compare", field: "newLevel", operator: ">=", value: 30 },
    rewards: { experience: 500, stats: { "体质": 10, "灵根": 5 } },
    rarity: "稀有"
  },
  {
    id: "level_50",
    name: "登堂入室",
    description: "角色等级达到50级",
    type: "level",
    icon: "trophy",
    triggerEvent: GameEventType.LEVEL_UP,
    condition: { type: "compare", field: "newLevel", operator: ">=", value: 50 },
    rewards: { experience: 2000, stats: { "体质": 20, "灵根": 10, "悟性": 5 } },
    rarity: "史诗"
  },
  {
    id: "level_100",
    name: "大道将成",
    description: "角色等级达到100级",
    type: "level",
    icon: "trophy",
    triggerEvent: GameEventType.LEVEL_UP,
    condition: { type: "compare", field: "newLevel", operator: ">=", value: 100 },
    rewards: { experience: 10000, stats: { "体质": 50, "灵根": 30, "悟性": 20, "意志": 20 } },
    rarity: "传说"
  },
  {
    id: "combat_enemies_10",
    name: "初试锋芒",
    description: "累计击败10个敌人",
    type: "combat",
    icon: "swords",
    triggerEvent: GameEventType.MONSTER_KILLED,
    condition: { type: "accumulate", event: GameEventType.MONSTER_KILLED, target: 10 },
    rewards: { experience: 50 },
    rarity: "普通"
  },
  {
    id: "combat_enemies_100",
    name: "战意盎然",
    description: "累计击败100个敌人",
    type: "combat",
    icon: "swords",
    triggerEvent: GameEventType.MONSTER_KILLED,
    condition: { type: "accumulate", event: GameEventType.MONSTER_KILLED, target: 100 },
    rewards: { experience: 200, stats: { "体质": 5 } },
    rarity: "稀有"
  },
  {
    id: "combat_boss_1",
    name: "Boss杀手",
    description: "击败第一个Boss",
    type: "combat",
    icon: "swords",
    triggerEvent: GameEventType.BOSS_KILLED,
    condition: { type: "accumulate", event: GameEventType.BOSS_KILLED, target: 1 },
    rewards: { experience: 300, stats: { "意志": 5 } },
    rarity: "稀有"
  },
  {
    id: "combat_boss_5",
    name: "Boss克星",
    description: "累计击败5个Boss",
    type: "combat",
    icon: "swords",
    triggerEvent: GameEventType.BOSS_KILLED,
    condition: { type: "accumulate", event: GameEventType.BOSS_KILLED, target: 5 },
    rewards: { experience: 1000, stats: { "体质": 10, "意志": 10 } },
    rarity: "史诗"
  },
  {
    id: "collection_technique_5",
    name: "功法初学者",
    description: "收集5种不同的功法",
    type: "collection",
    icon: "package",
    triggerEvent: GameEventType.TECHNIQUE_COLLECTED,
    condition: { type: "accumulate_unique", event: GameEventType.TECHNIQUE_COLLECTED, field: "techniqueName", target: 5 },
    rewards: { experience: 100 },
    rarity: "普通"
  },
  {
    id: "collection_technique_20",
    name: "功法收藏家",
    description: "收集20种不同的功法",
    type: "collection",
    icon: "package",
    triggerEvent: GameEventType.TECHNIQUE_COLLECTED,
    condition: { type: "accumulate_unique", event: GameEventType.TECHNIQUE_COLLECTED, field: "techniqueName", target: 20 },
    rewards: { experience: 500, stats: { "悟性": 10 } },
    rarity: "稀有"
  },
  {
    id: "collection_equipment_6",
    name: "全身武装",
    description: "收集6种不同的装备",
    type: "collection",
    icon: "shield",
    triggerEvent: GameEventType.EQUIPMENT_COLLECTED,
    condition: { type: "accumulate_unique", event: GameEventType.EQUIPMENT_COLLECTED, field: "equipmentName", target: 6 },
    rewards: { experience: 100 },
    rarity: "普通"
  },
  {
    id: "exploration_1",
    name: "初探秘境",
    description: "完成1次秘境探索",
    type: "exploration",
    icon: "map",
    triggerEvent: GameEventType.ADVENTURE_COMPLETED,
    condition: { type: "accumulate", event: GameEventType.ADVENTURE_COMPLETED, target: 1 },
    rewards: { experience: 100 },
    rarity: "普通"
  },
  {
    id: "exploration_10",
    name: "秘境常客",
    description: "完成10次秘境探索",
    type: "exploration",
    icon: "map",
    triggerEvent: GameEventType.ADVENTURE_COMPLETED,
    condition: { type: "accumulate", event: GameEventType.ADVENTURE_COMPLETED, target: 10 },
    rewards: { experience: 500, stats: { "幸运": 5 } },
    rarity: "稀有"
  },
  {
    id: "cultivation_100",
    name: "勤奋修炼",
    description: "累计修炼100次",
    type: "cultivation",
    icon: "sparkles",
    triggerEvent: GameEventType.CULTIVATION_DONE,
    condition: { type: "accumulate", event: GameEventType.CULTIVATION_DONE, target: 100 },
    rewards: { experience: 300, stats: { "意志": 5 } },
    rarity: "普通"
  },
  {
    id: "special_first_legendary",
    name: "传说降临",
    description: "获得第一件传说品质物品",
    type: "special",
    icon: "star",
    triggerEvent: GameEventType.LEGENDARY_OBTAINED,
    condition: { type: "accumulate", event: GameEventType.LEGENDARY_OBTAINED, target: 1 },
    rewards: { experience: 1000, stats: { "幸运": 10 } },
    rarity: "史诗"
  },
  {
    id: "special_full_equipment",
    name: "全副武装",
    description: "所有装备槽位都已装备",
    type: "special",
    icon: "star",
    triggerEvent: GameEventType.FULL_EQUIPPED,
    condition: { type: "once" },
    rewards: { experience: 500, stats: { "体质": 10, "意志": 5 } },
    rarity: "稀有"
  },
  {
    id: "special_technique_max",
    name: "功法大成",
    description: "将一本功法升至满级",
    type: "special",
    icon: "star",
    triggerEvent: GameEventType.TECHNIQUE_MAX_LEVEL,
    condition: { type: "once" },
    rewards: { experience: 800, stats: { "悟性": 15 } },
    rarity: "史诗"
  },
];

const BOND_CONFIGS: BondConfig[] = [
  {
    id: "bond_fire",
    name: "火系",
    type: "element",
    description: "火属性功法和装备的羁绊",
    keywords: ["火", "炎", "焰", "烈"],
    levels: [
      { required: 2, stats: { "攻击": 5 } },
      { required: 5, stats: { "攻击": 10, "体质": 3 } },
      { required: 10, stats: { "攻击": 20, "体质": 8 } },
      { required: 20, stats: { "攻击": 35, "体质": 15 } }
    ]
  },
  {
    id: "bond_ice",
    name: "冰系",
    type: "element",
    description: "冰属性功法和装备的羁绊",
    keywords: ["冰", "霜", "雪", "寒"],
    levels: [
      { required: 2, stats: { "防御": 5 } },
      { required: 5, stats: { "防御": 10, "体质": 3 } },
      { required: 10, stats: { "防御": 20, "体质": 8 } },
      { required: 20, stats: { "防御": 35, "体质": 15 } }
    ]
  },
  {
    id: "bond_thunder",
    name: "雷系",
    type: "element",
    description: "雷属性功法和装备的羁绊",
    keywords: ["雷", "电", "霆"],
    levels: [
      { required: 2, stats: { "攻击": 4, "法力": 5 } },
      { required: 5, stats: { "攻击": 8, "法力": 10 } },
      { required: 10, stats: { "攻击": 15, "法力": 20 } },
      { required: 20, stats: { "攻击": 25, "法力": 35 } }
    ]
  },
  {
    id: "bond_wind",
    name: "风系",
    type: "element",
    description: "风属性功法和装备的羁绊",
    keywords: ["风", "岚", "飓"],
    levels: [
      { required: 2, stats: { "闪避": 5 } },
      { required: 5, stats: { "闪避": 10, "速度": 5 } },
      { required: 10, stats: { "闪避": 15, "速度": 10 } },
      { required: 20, stats: { "闪避": 25, "速度": 20 } }
    ]
  },
  {
    id: "bond_earth",
    name: "土系",
    type: "element",
    description: "土属性功法和装备的羁绊",
    keywords: ["土", "岩", "石", "山"],
    levels: [
      { required: 2, stats: { "防御": 6 } },
      { required: 5, stats: { "防御": 12, "生命": 50 } },
      { required: 10, stats: { "防御": 25, "生命": 120 } },
      { required: 20, stats: { "防御": 40, "生命": 250 } }
    ]
  },
  {
    id: "bond_light",
    name: "光系",
    type: "element",
    description: "光属性功法和装备的羁绊",
    keywords: ["光", "圣", "辉", "阳"],
    levels: [
      { required: 2, stats: { "治疗效果": 10 } },
      { required: 5, stats: { "治疗效果": 20, "法力": 10 } },
      { required: 10, stats: { "治疗效果": 35, "法力": 25 } },
      { required: 20, stats: { "治疗效果": 50, "法力": 50 } }
    ]
  },
  {
    id: "bond_dark",
    name: "暗系",
    type: "element",
    description: "暗属性功法和装备的羁绊",
    keywords: ["暗", "影", "幽", "冥"],
    levels: [
      { required: 2, stats: { "暴击": 5 } },
      { required: 5, stats: { "暴击": 10, "暴伤": 10 } },
      { required: 10, stats: { "暴击": 18, "暴伤": 25 } },
      { required: 20, stats: { "暴击": 30, "暴伤": 50 } }
    ]
  },
  {
    id: "bond_sword",
    name: "剑系",
    type: "weapon",
    description: "剑类功法和装备的羁绊",
    keywords: ["剑", "锋"],
    levels: [
      { required: 2, stats: { "攻击": 5 } },
      { required: 5, stats: { "攻击": 12, "命中": 5 } },
      { required: 10, stats: { "攻击": 25, "命中": 12 } },
      { required: 20, stats: { "攻击": 45, "命中": 25 } }
    ]
  },
  {
    id: "bond_blade",
    name: "刀系",
    type: "weapon",
    description: "刀类功法和装备的羁绊",
    keywords: ["刀", "刃"],
    levels: [
      { required: 2, stats: { "攻击": 6 } },
      { required: 5, stats: { "攻击": 14, "暴击": 3 } },
      { required: 10, stats: { "攻击": 28, "暴击": 8 } },
      { required: 20, stats: { "攻击": 50, "暴击": 18 } }
    ]
  },
  {
    id: "bond_fist",
    name: "拳系",
    type: "weapon",
    description: "拳类功法和装备的羁绊",
    keywords: ["拳", "掌", "爪"],
    levels: [
      { required: 2, stats: { "攻击": 4, "防御": 2 } },
      { required: 5, stats: { "攻击": 10, "防御": 5 } },
      { required: 10, stats: { "攻击": 20, "防御": 12 } },
      { required: 20, stats: { "攻击": 35, "防御": 25 } }
    ]
  },
  {
    id: "bond_bow",
    name: "弓系",
    type: "weapon",
    description: "弓类功法和装备的羁绊",
    keywords: ["弓", "箭", "射"],
    levels: [
      { required: 2, stats: { "命中": 8, "速度": 3 } },
      { required: 5, stats: { "命中": 15, "速度": 8 } },
      { required: 10, stats: { "命中": 30, "速度": 18 } },
      { required: 20, stats: { "命中": 55, "速度": 35 } }
    ]
  },
  {
    id: "bond_spear",
    name: "枪系",
    type: "weapon",
    description: "枪类功法和装备的羁绊",
    keywords: ["枪", "戟", "矛"],
    levels: [
      { required: 2, stats: { "攻击": 5, "穿透": 3 } },
      { required: 5, stats: { "攻击": 12, "穿透": 8 } },
      { required: 10, stats: { "攻击": 25, "穿透": 18 } },
      { required: 20, stats: { "攻击": 45, "穿透": 35 } }
    ]
  },
];

// ============================================
// 系统管理器
// ============================================

class GameSystemsManager {
  private static instance: GameSystemsManager | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): GameSystemsManager {
    if (!GameSystemsManager.instance) {
      GameSystemsManager.instance = new GameSystemsManager();
    }
    return GameSystemsManager.instance;
  }

  /**
   * 初始化所有系统（同步，使用内联配置）
   */
  initialize(): void {
    if (this.initialized) return;

    // 使用内联配置初始化成就系统
    achievementSystem.initializeWithConfig(ACHIEVEMENT_CONFIGS);

    // 使用内联配置初始化图鉴系统
    collectionSystem.initializeWithConfig(BOND_CONFIGS);

    this.initialized = true;
    console.log('[GameSystems] All systems initialized');
  }

  /**
   * 便捷事件触发方法
   */
  
  /** 触发等级提升事件 */
  triggerLevelUp(oldLevel: number, newLevel: number): void {
    triggerEvent(GameEventType.LEVEL_UP, { oldLevel, newLevel });
  }

  /** 触发怪物击杀事件 */
  triggerMonsterKilled(enemyName: string, enemyTier: 'normal' | 'elite' | 'miniboss' | 'boss', enemyLevel: number): void {
    triggerEvent(GameEventType.MONSTER_KILLED, { enemyName, enemyTier, enemyLevel });
    
    // 同时触发特定类型事件
    if (enemyTier === 'boss') {
      triggerEvent(GameEventType.BOSS_KILLED, { bossName: enemyName, bossLevel: enemyLevel });
    } else if (enemyTier === 'elite') {
      triggerEvent(GameEventType.ELITE_KILLED, { eliteName: enemyName, eliteLevel: enemyLevel });
    }
  }

  /** 触发功法收集事件 */
  triggerTechniqueCollected(technique: Technique): void {
    triggerEvent(GameEventType.TECHNIQUE_COLLECTED, {
      techniqueId: technique.id,
      techniqueName: technique.name,
      techniqueType: technique.type,
      rarity: technique.rarity,
      level: technique.level,
    });

    // 传说品质触发特殊事件
    if (technique.rarity === '传说') {
      triggerEvent(GameEventType.LEGENDARY_OBTAINED, {
        itemType: 'technique',
        itemName: technique.name,
      });
    }
  }

  /** 触发装备收集事件 */
  triggerEquipmentCollected(equipment: Equipment): void {
    triggerEvent(GameEventType.EQUIPMENT_COLLECTED, {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      slot: equipment.slot,
      rarity: equipment.rarity,
      level: equipment.level,
    });

    // 传说品质触发特殊事件
    if (equipment.rarity === '传说') {
      triggerEvent(GameEventType.LEGENDARY_OBTAINED, {
        itemType: 'equipment',
        itemName: equipment.name,
      });
    }
  }

  /** 触发秘境完成事件 */
  triggerAdventureCompleted(dungeonName: string, difficulty: string, rewards: any): void {
    triggerEvent(GameEventType.ADVENTURE_COMPLETED, { dungeonName, difficulty, rewards });
  }

  /** 触发修炼完成事件 */
  triggerCultivationDone(statGains: Record<string, number>, breakthroughAttempt: boolean, breakthroughSuccess: boolean): void {
    triggerEvent(GameEventType.CULTIVATION_DONE, { statGains, breakthroughAttempt, breakthroughSuccess });
    
    if (breakthroughSuccess) {
      triggerEvent(GameEventType.REALM_BREAKTHROUGH, {
        oldRealm: '',
        newRealm: '',
      });
    }
  }

  /** 触发全装备事件 */
  triggerFullEquipped(equippedSlots: string[]): void {
    triggerEvent(GameEventType.FULL_EQUIPPED, { equippedSlots });
  }

  /** 触发功法满级事件 */
  triggerTechniqueMaxLevel(techniqueId: string, techniqueName: string): void {
    triggerEvent(GameEventType.TECHNIQUE_MAX_LEVEL, { techniqueId, techniqueName });
  }

  /** 触发装备满级事件 */
  triggerEquipmentMaxLevel(equipmentId: string, equipmentName: string): void {
    triggerEvent(GameEventType.EQUIPMENT_MAX_LEVEL, { equipmentId, equipmentName });
  }

  /**
   * 获取系统实例
   */
  getAchievementSystem() {
    return achievementSystem;
  }

  getCollectionSystem() {
    return collectionSystem;
  }

  /**
   * 销毁所有系统
   */
  destroy(): void {
    achievementSystem.destroy();
    collectionSystem.destroy();
    gameEventManager.removeAllListeners();
    this.initialized = false;
  }
}

// 导出单例
export const gameSystems = GameSystemsManager.getInstance();

// 导出便捷方法
export const initGameSystems = () => gameSystems.initialize();

// 导出配置供外部使用
export { ACHIEVEMENT_CONFIGS, BOND_CONFIGS };
