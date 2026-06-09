/**
 * 世界数据配置文件
 * 定义每个世界的基础属性和数值设定
 * 玩家和敌人的数值都基于世界的属性进行计算
 */

import { WorldType, WorldImpact, StatImpact, CellType, EnemyTier, WorldDifficulty, BUILTIN_WORLD_TYPES } from '@/shared/lib/types';
import { WorldDataRegistry } from '@/shared/lib/registry';

// 重新导出 EnemyTier（从 types 导入）
export type { EnemyTier } from '@/shared/lib/types';

/**
 * 世界类型权威列表
 *
 * 从 WorldDataRegistry 获取已注册的世界类型。
 * 不再硬编码——所有世界类型通过 Mod 加载。
 */
export function getWorldTypes(): WorldType[] {
  return WorldDataRegistry.getInstance().getAllWorldTypes() as WorldType[];
}

/** @deprecated 使用 getWorldTypes() 替代 */
export const WORLD_TYPES: WorldType[] = BUILTIN_WORLD_TYPES as unknown as WorldType[];

// ============================================
// 世界系数系统
// ============================================

/**
 * 世界系数配置
 * 
 * 世界系数决定了世界的整体难度和数值规模：
 * - 1.0：简单（武侠）
 * - 1.1：普通（修仙、魔幻）
 * - 1.3：困难（高武、仙侠、异能、科技）
 * - 1.5：噩梦（末世）
 * 
 * 世界系数影响：
 * 1. 敌人基础属性（HP、攻击、防御）
 * 2. 敌人等级成长因子
 * 3. 奖励加成
 */
export const WORLD_COEFFICIENTS: Record<WorldType, number> = {
  '修仙': 1.1,   // 普通
  '高武': 1.3,   // 困难
  '科技': 1.2,   // 普通~困难
  '魔幻': 1.1,   // 普通
  '异能': 1.2,   // 普通~困难
  '仙侠': 1.3,   // 困难
  '武侠': 1.0,   // 简单
  '末世': 1.5,   // 噩梦
};

/**
 * 根据世界系数获取世界难度
 */
export function getWorldDifficulty(coefficient: number): WorldDifficulty {
  if (coefficient >= 1.5) return '噩梦';
  if (coefficient >= 1.25) return '困难';
  if (coefficient >= 1.05) return '普通';
  return '简单';
}

/**
 * 获取世界系数对敌人属性的加成
 * 系数越高，敌人越强
 */
export function getEnemyCoefficientBonus(coefficient: number): {
  hpBonus: number;
  attackBonus: number;
  defenseBonus: number;
  rewardBonus: number;
} {
  return {
    hpBonus: coefficient,
    attackBonus: coefficient * 0.9,
    defenseBonus: coefficient * 0.8,
    rewardBonus: 1 + (coefficient - 1) * 0.5, // 奖励线性增长
  };
}

// ============================================
// 世界基础数值配置
// ============================================

/**
 * 世界数值配置
 * 这些数值决定了该世界中玩家和敌人的基础属性
 */
export interface WorldStats {
  /** 世界名称前缀 */
  namePrefixes: string[];
  /** 世界名称后缀 */
  nameSuffixes: string[];
  /** 世界描述 */
  descriptions: string[];
  /** 力量体系描述 */
  powerSystems: string[];
  /** 主要势力（旧版兼容） */
  majorForces: string[];
  /** 危险设定 */
  dangers: { description: string; impact: StatImpact; impactDescription: string }[];
  /** 机缘设定 */
  opportunities: { description: string; impact: StatImpact; impactDescription: string }[];
  
  // === 数值配置 ===
  /** 世界系数（决定世界难度，1.0-1.5） */
  coefficient: number;
  
  /** 基础生命值 */
  baseHp: number;
  /** 每级生命成长 */
  hpPerLevel: number;
  /** 每点体质增加的HP */
  hpPerConstitution: number;
  
  /** 基础攻击力 */
  baseAttack: number;
  /** 每级攻击成长 */
  attackPerLevel: number;
  /** 每点体质增加的攻击 */
  attackPerConstitution: number;
  /** 每点灵根增加的攻击 */
  attackPerSpiritRoot: number;
  
  /** 基础防御力 */
  baseDefense: number;
  /** 每级防御成长 */
  defensePerLevel: number;
  /** 每点意志增加的防御 */
  defensePerWillpower: number;
  
  /** 敌人额外攻击力系数（旧版兼容） */
  enemyAttackBonus: number;
  /** 敌人额外防御力系数（旧版兼容） */
  enemyDefenseBonus: number;

  /** 属性显示名映射（按世界类型差异化） */
  statDisplayNames: Record<string, string>;
}

// ============================================
// 世界数据定义
// ============================================

/**
 * @deprecated 数据已迁移到 mods/wanjie-core/data/worlds.json。
 * 请使用 getWorldData() 函数（内部从 WorldDataRegistry 读取）。
 * 此常量仅为向后兼容保留，将在后续版本中移除。
 */
export const WORLD_DATA: Record<string, WorldStats> = {
  '修仙': {
    namePrefixes: ['青云', '紫霄', '太虚', '玄天', '昆仑', '蓬莱'],
    nameSuffixes: ['界', '域', '天', '境', '州'],
    descriptions: [
      '灵气充沛，仙门林立，修士们追求长生大道，适合初入万界的修行者',
      '宗门遍布，灵脉纵横，是修仙者的圣地，万界之旅的起点',
      '仙气缥缈，洞天福地众多，传说中有仙人飞升之地，万物皆可修炼',
    ],
    powerSystems: [
      '炼气化神，以灵力为根基，追求天人合一',
      '道法自然，感悟天地法则，证得大道',
    ],
    majorForces: [
      '五大仙门各据一方，暗流涌动',
      '三宗两门一阁，势力错综复杂',
      '十大宗门并立，争夺灵脉资源',
    ],
    dangers: [
      { description: '魔修入侵', impact: { 体质: -1 }, impactDescription: '体质-1' },
      { description: '灵气枯竭', impact: { 灵根: -1 }, impactDescription: '灵根-1' },
      { description: '妖兽横行', impact: { 意志: -1 }, impactDescription: '意志-1' },
    ],
    opportunities: [
      { description: '发现上古洞府', impact: { 体质: 2 }, impactDescription: '体质+2' },
      { description: '获得仙缘传承', impact: { 灵根: 2 }, impactDescription: '灵根+2' },
      { description: '悟道突破', impact: { 意志: 2 }, impactDescription: '意志+2' },
    ],
    coefficient: 1.0,   // 简单（入门世界）
    baseHp: 100,
    hpPerLevel: 15,
    hpPerConstitution: 10,
    baseAttack: 12,
    attackPerLevel: 2.0,
    attackPerConstitution: 1.0,
    attackPerSpiritRoot: 0.5,
    baseDefense: 6,
    defensePerLevel: 1.0,
    defensePerWillpower: 0.8,
    enemyAttackBonus: 0,
    enemyDefenseBonus: 0,
    statDisplayNames: {
      '体质': '体质',
      '灵根': '灵根',
      '悟性': '悟性',
      '幸运': '幸运',
      '意志': '意志',
    },
  },

  '高武': {
    namePrefixes: ['苍龙', '玄武', '白虎', '朱雀', '麒麟', '神凤'],
    nameSuffixes: ['大陆', '域', '疆', '界', '州'],
    descriptions: [
      '武道昌盛，强者如云，武者以力证道',
      '气血沸腾，武道通神，是武者的天堂',
      '宗门林立，武道传承源远流长',
    ],
    powerSystems: [
      '以武入道，炼体化神，追求武道巅峰',
      '气血如龙，突破极限，成就武神之躯',
    ],
    majorForces: [
      '三大武道圣地统领天下',
      '五族联盟与武道宗门对峙',
      '皇朝与宗门势力交织',
    ],
    dangers: [
      { description: '异族入侵', impact: { 体质: -1 }, impactDescription: '体质-1' },
      { description: '武道争锋', impact: { 灵根: -1 }, impactDescription: '灵根-1' },
      { description: '暗流涌动', impact: { 意志: -1 }, impactDescription: '意志-1' },
    ],
    opportunities: [
      { description: '获得武道传承', impact: { 体质: 2 }, impactDescription: '体质+2' },
      { description: '突破武道瓶颈', impact: { 灵根: 2 }, impactDescription: '灵根+2' },
      { description: '悟出武道真意', impact: { 意志: 2 }, impactDescription: '意志+2' },
    ],
    coefficient: 1.3,   // 困难
    baseHp: 110,
    hpPerLevel: 18,
    hpPerConstitution: 12,
    baseAttack: 14,
    attackPerLevel: 2.2,
    attackPerConstitution: 1.2,
    attackPerSpiritRoot: 0.4,
    baseDefense: 8,
    defensePerLevel: 1.2,
    defensePerWillpower: 0.8,
    enemyAttackBonus: 0.1,
    enemyDefenseBonus: 0.1,
    statDisplayNames: {
      '体质': '体魄',
      '灵根': '根骨',
      '悟性': '悟性',
      '幸运': '机缘',
      '意志': '战意',
    },
  },
  
  '科技': {
    namePrefixes: ['星际', '银河', '机械', '赛博', '量子', '虚空'],
    nameSuffixes: ['联邦', '帝国', '联盟', '领域', '世界'],
    descriptions: [
      '科技高度发达，星际航行已是常态',
      '机械与人工智能共存，赛博文明繁荣',
      '量子科技突破，人类征服星辰大海',
    ],
    powerSystems: [
      '基因改造与机械飞升，科技改变命运',
      '纳米技术与AI融合，追求永生之道',
    ],
    majorForces: [
      '三大星际财团掌控资源',
      '联邦政府与反叛军对峙',
      'AI联盟与人类政权共存',
    ],
    dangers: [
      { description: 'AI叛乱', impact: { 体质: -1 }, impactDescription: '体质-1' },
      { description: '基因崩溃', impact: { 灵根: -1 }, impactDescription: '灵根-1' },
      { description: '星际战争', impact: { 意志: -1 }, impactDescription: '意志-1' },
    ],
    opportunities: [
      { description: '获得基因改造', impact: { 体质: 2 }, impactDescription: '体质+2' },
      { description: '接入超级AI', impact: { 灵根: 2 }, impactDescription: '灵根+2' },
      { description: '获得纳米装甲', impact: { 意志: 2 }, impactDescription: '意志+2' },
    ],
    coefficient: 1.2,   // 普通~困难
    baseHp: 90,
    hpPerLevel: 12,
    hpPerConstitution: 8,
    baseAttack: 15,
    attackPerLevel: 2.5,
    attackPerConstitution: 0.6,
    attackPerSpiritRoot: 1.0,
    baseDefense: 5,
    defensePerLevel: 0.8,
    defensePerWillpower: 1.0,
    enemyAttackBonus: 0.15,
    enemyDefenseBonus: 0,

    statDisplayNames: {
      '体质': '体能',
      '灵根': '智力',
      '悟性': '反应',
      '幸运': '技术',
      '意志': '魅力',
    },  },
  
  '魔幻': {
    namePrefixes: ['艾泽', '诺瓦', '奥兰', '神秘', '永恒', '圣光'],
    nameSuffixes: ['大陆', '王国', '领域', '森林', '帝国'],
    descriptions: [
      '魔法元素充盈，法师与龙共存',
      '精灵与矮人世代居住，魔法文明辉煌',
      '诸神的恩赐洒满大地，魔法至上的世界',
    ],
    powerSystems: [
      '元素魔法与奥术之力，法师追求真理',
      '神术与魔法并存，信仰与知识同行',
    ],
    majorForces: [
      '魔法议会统领各元素学派',
      '三大帝国与精灵联盟对峙',
      '教会与法师协会分庭抗礼',
    ],
    dangers: [
      { description: '魔王苏醒', impact: { 体质: -1 }, impactDescription: '体质-1' },
      { description: '魔力潮汐', impact: { 灵根: -1 }, impactDescription: '灵根-1' },
      { description: '黑暗降临', impact: { 意志: -1 }, impactDescription: '意志-1' },
    ],
    opportunities: [
      { description: '获得魔法传承', impact: { 体质: 2 }, impactDescription: '体质+2' },
      { description: '契约元素之灵', impact: { 灵根: 2 }, impactDescription: '灵根+2' },
      { description: '获得神器认可', impact: { 意志: 2 }, impactDescription: '意志+2' },
    ],
    coefficient: 1.1,   // 普通
    baseHp: 95,
    hpPerLevel: 14,
    hpPerConstitution: 9,
    baseAttack: 13,
    attackPerLevel: 2.1,
    attackPerConstitution: 0.8,
    attackPerSpiritRoot: 0.8,
    baseDefense: 7,
    defensePerLevel: 1.0,
    defensePerWillpower: 0.9,
    enemyAttackBonus: 0.05,
    enemyDefenseBonus: 0.05,

    statDisplayNames: {
      '体质': '力量',
      '灵根': '魔力',
      '悟性': '感知',
      '幸运': '魅力',
      '意志': '精神',
    },  },
  
  '异能': {
    namePrefixes: ['觉醒', '变异', '超凡', '进化', '源能', '异变'],
    nameSuffixes: ['都市', '世界', '领域', '区', '城'],
    descriptions: [
      '异能觉醒者遍布都市，隐藏在普通人之中',
      '源能爆发，异能者改变世界格局',
      '变异与进化并行，人类站在进化十字路口',
    ],
    powerSystems: [
      '基因觉醒与异能开发，突破人类极限',
      '源能觉醒，探索心灵深处的力量',
    ],
    majorForces: [
      '异能管理局与反抗组织对立',
      '三大财团暗中操控异能者',
      '国际异能联盟维稳全球',
    ],
    dangers: [
      { description: '异能暴走', impact: { 体质: -1 }, impactDescription: '体质-1' },
      { description: '组织追杀', impact: { 灵根: -1 }, impactDescription: '灵根-1' },
      { description: '异兽入侵', impact: { 意志: -1 }, impactDescription: '意志-1' },
    ],
    opportunities: [
      { description: '二次觉醒', impact: { 体质: 2 }, impactDescription: '体质+2' },
      { description: '获得异能结晶', impact: { 灵根: 2 }, impactDescription: '灵根+2' },
      { description: '异能融合', impact: { 意志: 2 }, impactDescription: '意志+2' },
    ],
    coefficient: 1.2,   // 普通~困难
    baseHp: 85,
    hpPerLevel: 13,
    hpPerConstitution: 8,
    baseAttack: 14,
    attackPerLevel: 2.3,
    attackPerConstitution: 0.9,
    attackPerSpiritRoot: 0.7,
    baseDefense: 6,
    defensePerLevel: 1.1,
    defensePerWillpower: 0.7,
    enemyAttackBonus: 0.1,
    enemyDefenseBonus: 0.05,

    statDisplayNames: {
      '体质': '体能',
      '灵根': '源能',
      '悟性': '感知',
      '幸运': '幸运',
      '意志': '意志',
    },  },
  
  '仙侠': {
    namePrefixes: ['剑气', '仙云', '凌霄', '飞剑', '天剑', '灵剑'],
    nameSuffixes: ['山', '峰', '门', '境', '界'],
    descriptions: [
      '剑气纵横，侠客仗剑行走天涯',
      '仙剑传说流传千古，剑修追求剑道巅峰',
      '剑意凌霄，万剑归宗的剑道圣地',
    ],
    powerSystems: [
      '以剑入道，剑心通明，追求剑道极致',
      '御剑乘风，剑意化形，成就剑仙之路',
    ],
    majorForces: [
      '五大剑派统领剑道',
      '剑阁与剑宗分庭抗礼',
      '散修联盟与宗门共存',
    ],
    dangers: [
      { description: '剑道争锋', impact: { 体质: -1 }, impactDescription: '体质-1' },
      { description: '魔剑现世', impact: { 灵根: -1 }, impactDescription: '灵根-1' },
      { description: '剑气反噬', impact: { 意志: -1 }, impactDescription: '意志-1' },
    ],
    opportunities: [
      { description: '获得名剑认可', impact: { 体质: 2 }, impactDescription: '体质+2' },
      { description: '悟出剑意', impact: { 灵根: 2 }, impactDescription: '灵根+2' },
      { description: '剑心通明', impact: { 意志: 2 }, impactDescription: '意志+2' },
    ],
    coefficient: 1.3,   // 困难
    baseHp: 100,
    hpPerLevel: 14,
    hpPerConstitution: 10,
    baseAttack: 15,
    attackPerLevel: 2.2,
    attackPerConstitution: 1.0,
    attackPerSpiritRoot: 0.6,
    baseDefense: 6,
    defensePerLevel: 1.0,
    defensePerWillpower: 0.8,
    enemyAttackBonus: 0.1,
    enemyDefenseBonus: 0,

    statDisplayNames: {
      '体质': '体质',
      '灵根': '仙根',
      '悟性': '剑心',
      '幸运': '仙缘',
      '意志': '道心',
    },  },
  
  '武侠': {
    namePrefixes: ['江湖', '武当', '少林', '华山', '峨眉', '昆仑'],
    nameSuffixes: ['派', '门', '帮', '会', '盟'],
    descriptions: [
      '江湖恩怨，侠骨柔情，武林中人快意恩仇',
      '门派林立，武功秘籍传承千年',
      '义薄云天，侠之大者为国为民',
    ],
    powerSystems: [
      '内外兼修，武道通神，成就一代宗师',
      '以武会友，侠义为先，行走江湖',
    ],
    majorForces: [
      '六大门派统领武林',
      '朝廷与江湖势力交织',
      '帮派联盟与隐世宗门并存',
    ],
    dangers: [
      { description: '江湖仇杀', impact: { 体质: -1 }, impactDescription: '体质-1' },
      { description: '门派之争', impact: { 灵根: -1 }, impactDescription: '灵根-1' },
      { description: '朝廷镇压', impact: { 意志: -1 }, impactDescription: '意志-1' },
    ],
    opportunities: [
      { description: '获得秘籍传承', impact: { 体质: 2 }, impactDescription: '体质+2' },
      { description: '打通任督二脉', impact: { 灵根: 2 }, impactDescription: '灵根+2' },
      { description: '悟出武道真谛', impact: { 意志: 2 }, impactDescription: '意志+2' },
    ],
    coefficient: 1.0,   // 简单
    baseHp: 80,
    hpPerLevel: 12,
    hpPerConstitution: 8,
    baseAttack: 11,
    attackPerLevel: 1.8,
    attackPerConstitution: 0.9,
    attackPerSpiritRoot: 0.3,
    baseDefense: 7,
    defensePerLevel: 1.0,
    defensePerWillpower: 0.9,
    enemyAttackBonus: 0,
    enemyDefenseBonus: 0.1,

    statDisplayNames: {
      '体质': '根骨',
      '灵根': '悟性',
      '悟性': '慧根',
      '幸运': '机缘',
      '意志': '毅力',
    },
  },

  '末世': {
    namePrefixes: ['废土', '荒芜', '末世', '崩坏', '毁灭', '残存'],
    nameSuffixes: ['世界', '之地', '废墟', '区域', '疆域'],
    descriptions: [
      '文明崩塌，变异横行，幸存者挣扎求生',
      '废土之上，适者生存，人性与兽性交织',
      '核战后的人类文明，在废墟中寻找希望',
    ],
    powerSystems: [
      '变异进化，适应废土，成为新时代的霸主',
      '科技残存，基因改造，在末世中崛起',
    ],
    majorForces: [
      '幸存者联盟与掠夺者对峙',
      '变异生物与人类争夺领地',
      '避难所联盟掌控资源',
    ],
    dangers: [
      { description: '变异兽潮', impact: { 体质: -1 }, impactDescription: '体质-1' },
      { description: '辐射扩散', impact: { 灵根: -1 }, impactDescription: '灵根-1' },
      { description: '资源匮乏', impact: { 意志: -1 }, impactDescription: '意志-1' },
    ],
    opportunities: [
      { description: '发现避难所', impact: { 体质: 2 }, impactDescription: '体质+2' },
      { description: '获得进化能力', impact: { 灵根: 2 }, impactDescription: '灵根+2' },
      { description: '找到文明遗物', impact: { 意志: 2 }, impactDescription: '意志+2' },
    ],
    coefficient: 1.5,   // 困难（基础）+ 飞升加成后可达噩梦/地狱/深渊
    baseHp: 90,
    hpPerLevel: 20,
    hpPerConstitution: 15,
    baseAttack: 12,
    attackPerLevel: 2.5,
    attackPerConstitution: 1.3,
    attackPerSpiritRoot: 0.3,
    baseDefense: 10,
    defensePerLevel: 1.5,
    defensePerWillpower: 1.0,
    enemyAttackBonus: 0.3,
    enemyDefenseBonus: 0.25,

    statDisplayNames: {
      '体质': '体质',
      '灵根': '适应性',
      '悟性': '洞察',
      '幸运': '运气',
      '意志': '意志',
    },  },
};

// ============================================
// 难度系数配置
// ============================================

/**
 * 难度系数配置
 * 用于调整敌人数值，不同难度只通过系数影响
 */
export const DIFFICULTY_MULTIPLIERS = {
  /** 简单难度 */
  easy: {
    hpMultiplier: 0.8,
    attackMultiplier: 0.85,
    defenseMultiplier: 0.85,
    expMultiplier: 0.9,
    rewardMultiplier: 0.8,
  },
  /** 普通难度 */
  normal: {
    hpMultiplier: 1.0,
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    expMultiplier: 1.0,
    rewardMultiplier: 1.0,
  },
  /** 困难难度 */
  hard: {
    hpMultiplier: 1.3,
    attackMultiplier: 1.2,
    defenseMultiplier: 1.2,
    expMultiplier: 1.3,
    rewardMultiplier: 1.5,
  },
  /** 噩梦难度 */
  nightmare: {
    hpMultiplier: 1.8,
    attackMultiplier: 1.5,
    defenseMultiplier: 1.5,
    expMultiplier: 1.8,
    rewardMultiplier: 2.5,
  },
};

export type DifficultyLevel = keyof typeof DIFFICULTY_MULTIPLIERS;

// ============================================
// 辅助函数
// ============================================

/**
 * 获取世界数据
 */
// ============================================
// 辅助函数（从注册中心读取）
// ============================================

/**
 * 获取世界数据
 *
 * 所有数据通过 Mod 加载进入注册中心。
 * 如果注册中心无数据，抛出明确错误提示用户检查 Mod 加载。
 */
export function getWorldData(worldType: WorldType): WorldStats {
  const registry = WorldDataRegistry.getInstance();
  const data = registry.getWorldType(worldType);
  if (!data) {
    throw new Error(`世界数据未加载: "${worldType}"。请确保 wanjie-core Mod 已正确加载。`);
  }
  return {
    namePrefixes: data.namePrefixes,
    nameSuffixes: data.nameSuffixes,
    descriptions: data.descriptions,
    powerSystems: data.powerSystems ?? [],
    majorForces: data.majorForces ?? [],
    dangers: (data.dangers ?? []).map(d => ({ description: d.description, impact: d.impact as StatImpact, impactDescription: d.impactDescription })),
    opportunities: (data.opportunities ?? []).map(o => ({ description: o.description, impact: o.impact as StatImpact, impactDescription: o.impactDescription })),
    coefficient: data.baseCoefficient,
    baseHp: 100,
    hpPerLevel: 15,
    hpPerConstitution: 10,
    baseAttack: 12,
    attackPerLevel: 2.0,
    attackPerConstitution: 1.0,
    attackPerSpiritRoot: 0.5,
    baseDefense: 6,
    defensePerLevel: 1.0,
    defensePerWillpower: 0.8,
    enemyAttackBonus: 0,
    enemyDefenseBonus: 0,
    statDisplayNames: {},
  };
}

/**
 * 获取世界名称
 */
export function getWorldName(worldType: WorldType): string {
  const data = getWorldData(worldType);
  const prefix = data.namePrefixes[Math.floor(Math.random() * data.namePrefixes.length)];
  const suffix = data.nameSuffixes[Math.floor(Math.random() * data.nameSuffixes.length)];
  return prefix + suffix;
}

/**
 * 获取世界描述
 */
export function getWorldDescription(worldType: WorldType): string {
  const data = getWorldData(worldType);
  return data.descriptions[Math.floor(Math.random() * data.descriptions.length)];
}

/**
 * 获取世界力量体系
 */
export function getWorldPowerSystem(worldType: WorldType): string {
  const data = getWorldData(worldType);
  return data.powerSystems[Math.floor(Math.random() * data.powerSystems.length)];
}

export function getWorldMajorForces(worldType: WorldType): string {
  const data = getWorldData(worldType);
  return data.majorForces[Math.floor(Math.random() * data.majorForces.length)];
}

export function getWorldDangers(worldType: WorldType): WorldImpact {
  const data = getWorldData(worldType);
  const danger = data.dangers[Math.floor(Math.random() * data.dangers.length)];
  return {
    description: danger.description,
    impact: danger.impact,
    impactDescription: danger.impactDescription,
  };
}

export function getWorldOpportunities(worldType: WorldType): WorldImpact {
  const data = getWorldData(worldType);
  const opp = data.opportunities[Math.floor(Math.random() * data.opportunities.length)];
  return {
    description: opp.description,
    impact: opp.impact,
    impactDescription: opp.impactDescription,
  };
}

// ============================================
// 敌人分级系统
// ============================================

/**
 * 敌人分级配置
 * 
 * 设计理念：
 * - 普通(enemy)：最菜的怪，和主角成长曲线差不多，玩家裸装可轻松击败
 * - 精英(elite)：比普通强，玩家需要一些功法或装备优势
 * - 小Boss(miniboss)：需要较好的功法和装备才能击败
 * - Boss：最强，需要满级功法和传说装备才能击败
 * 
 * 功法加成范围：
 * - 普通功法：3-8% / 稀有功法：8-15% / 史诗功法：15-25% / 传说功法：25-40%
 * - 3个功法槽位，最高加成约 120%
 * 
 * 装备加成范围：
 * - 普通装备：2-5% / 稀有装备：5-10% / 史诗装备：10-20% / 传说装备：20-35%
 * - 攻击槽位（近战+远程）：最高加成约 70%
 * - 防御槽位（头+身+腿+脚）：最高加成约 140%
 * 
 * 总加成上限：
 * - 攻击：约 190%（功法120% + 装备70%）
 * - 防御：约 260%（功法120% + 装备140%）
 * 
 * 新设计：敌人拥有独立的指数成长曲线，分级系数合理调整
 * - 低等级敌人接近玩家属性，高等级敌人逐渐拉开差距
 * - Boss需要接近的等级和较好的功法/装备才能挑战
 */
/**
 * 敌人分级配置项类型
 */
export interface EnemyTierConfigItem {
  name: string;
  hpMultiplier: number;
  attackMultiplier: number;
  defenseMultiplier: number;
  expMultiplier: number;
  rewardMultiplier: number;
  dropChance: {
    technique: number;
    equipment: number;
  };
  variance: number;
}

/**
 * 敌人分级配置
 * 
 * 设计理念：
 * - 敌人使用与玩家完全相同的属性公式
 * - 敌人等级决定其"裸装"属性
 * - 分级系数模拟敌人的"功法/装备加成"
 * 
 * 玩家加成参考：
 * - 功法加成：普通 5-10%，稀有 10-20%，史诗 20-35%，传说 35-50%
 * - 装备加成：普通 5-10%，稀有 10-20%，史诗 20-35%，传说 35-50%
 * - 全身满装：约 1.5-2.0 倍裸装属性
 * 
 * 敌人分级设计（新）：
 * - 普通：相当于玩家裸装水平，系数 0.9-1.0
 * - 精英：相当于玩家有基础功法，系数 1.1-1.2
 * - 小Boss：相当于玩家有较好功法装备，系数 1.4-1.6
 * - Boss：相当于玩家有顶级功法装备，系数 1.8-2.2
 */
export const ENEMY_TIER_CONFIG: Record<string, EnemyTierConfigItem> = {
  /** 普通敌人 - 相当于玩家裸装水平（用于机缘系统） */
  normal: {
    name: '普通',
    hpMultiplier: 0.95,       // 略低于玩家裸装
    attackMultiplier: 0.95,
    defenseMultiplier: 0.9,
    expMultiplier: 1.0,
    rewardMultiplier: 1.0,
    dropChance: {
      technique: 0.08,
      equipment: 0.12,
    },
    variance: 0.15,
  },
  
  /** 精英敌人 - 相当于玩家有基础功法 */
  elite: {
    name: '精英',
    hpMultiplier: 1.15,       // 约 15% 加成
    attackMultiplier: 1.15,
    defenseMultiplier: 1.1,
    expMultiplier: 1.8,
    rewardMultiplier: 1.8,
    dropChance: {
      technique: 0.18,
      equipment: 0.25,
    },
    variance: 0.1,
  },
  
  /** 小Boss - 相当于玩家有较好功法装备 */
  miniboss: {
    name: '小Boss',
    hpMultiplier: 1.5,        // 约 50% 加成
    attackMultiplier: 1.4,
    defenseMultiplier: 1.35,
    expMultiplier: 3.5,
    rewardMultiplier: 3.0,
    dropChance: {
      technique: 0.5,
      equipment: 0.6,
    },
    variance: 0.05,
  },
  
  /** Boss - 相当于玩家有顶级功法装备 */
  boss: {
    name: 'Boss',
    hpMultiplier: 2.0,        // 顶级装备功法约 100% 加成
    attackMultiplier: 1.7,
    defenseMultiplier: 1.6,
    expMultiplier: 6.0,
    rewardMultiplier: 5.0,
    dropChance: {
      technique: 1.0,
      equipment: 1.0,
    },
    variance: 0.0,  // Boss不浮动
  },
  
  /** 新手Boss - 用于低难度机缘(<=10)，确保新手能击败 */
  newbie_boss: {
    name: '新手Boss',
    hpMultiplier: 1.2,        // 比玩家裸装略高
    attackMultiplier: 1.1,
    defenseMultiplier: 1.0,
    expMultiplier: 4.0,
    rewardMultiplier: 3.0,
    dropChance: {
      technique: 0.8,
      equipment: 0.8,
    },
    variance: 0.1,
  },
  
  // ============================================
  // 塔层系统专用配置
  // ============================================
  
  /** 塔层普通敌人 - 从第1层开始就有挑战性
   * 
   * 设计理念：
   * - 玩家有功法+装备双层百分比加成（约1.21倍攻击）
   * - 敌人需要更高的倍率来平衡
   * - 塔层敌人应该比玩家略强，形成挑战
   */
  tower_normal: {
    name: '塔层守卫',
    hpMultiplier: 1.8,        // 略高于玩家（玩家约1.0倍HP）
    attackMultiplier: 1.6,    // 高于玩家的1.21倍（功法+装备加成）
    defenseMultiplier: 1.5,   // 高于玩家的1.21倍
    expMultiplier: 1.2,
    rewardMultiplier: 1.5,
    dropChance: {
      technique: 0.10,
      equipment: 0.15,
    },
    variance: 0.08,  // 塔层敌人浮动较小
  },
  
  /** 塔层精英敌人 - 明显强于玩家 */
  tower_elite: {
    name: '塔层精英',
    hpMultiplier: 2.2,        // 明显高于玩家
    attackMultiplier: 2.0,
    defenseMultiplier: 1.8,
    expMultiplier: 2.5,
    rewardMultiplier: 2.5,
    dropChance: {
      technique: 0.25,
      equipment: 0.35,
    },
    variance: 0.06,
  },
  
  /** 塔层Boss - 需要策略才能击败 */
  tower_boss: {
    name: '塔层Boss',
    hpMultiplier: 3.5,        // 需要高级装备才能应对
    attackMultiplier: 2.8,
    defenseMultiplier: 2.5,
    expMultiplier: 8.0,
    rewardMultiplier: 6.0,
    dropChance: {
      technique: 1.0,
      equipment: 1.0,
    },
    variance: 0.0,
  },
} as const;

/**
 * 根据格子类型获取敌人等级
 */
export function getEnemyTierFromCellType(cellType: CellType): EnemyTier {
  switch (cellType) {
    case 'boss':
      return 'boss';
    case 'miniboss':
      return 'miniboss';
    case 'elite':
      return 'elite';
    default:
      return 'normal';
  }
}

/**
 * 获取敌人等级配置
 */
export function getEnemyTierConfig(tier: EnemyTier) {
  return ENEMY_TIER_CONFIG[tier];
}

/**
 * 新手区域敌人配置（所有类型）
 * 用于难度<=10的区域，确保新手能击败
 * 
 * 设计思路：新手区域敌人应该比玩家裸装更弱，让玩家能轻松获胜
 */
export const NEWBIE_ENEMY_TIER_CONFIG: Record<EnemyTier, EnemyTierConfigItem> = {
  normal: {
    name: '新手普通',
    hpMultiplier: 0.7,        // 比玩家裸装更弱
    attackMultiplier: 0.75,
    defenseMultiplier: 0.7,
    expMultiplier: 0.8,
    rewardMultiplier: 0.8,
    dropChance: {
      technique: 0.05,
      equipment: 0.08,
    },
    variance: 0.1,
  },
  elite: {
    name: '新手精英',
    hpMultiplier: 0.85,       // 接近玩家裸装
    attackMultiplier: 0.9,
    defenseMultiplier: 0.85,
    expMultiplier: 1.2,
    rewardMultiplier: 1.2,
    dropChance: {
      technique: 0.12,
      equipment: 0.18,
    },
    variance: 0.1,
  },
  miniboss: {
    name: '新手小Boss',
    hpMultiplier: 1.0,        // 与玩家裸装持平
    attackMultiplier: 1.0,
    defenseMultiplier: 0.95,
    expMultiplier: 2.0,
    rewardMultiplier: 1.8,
    dropChance: {
      technique: 0.4,
      equipment: 0.5,
    },
    variance: 0.05,
  },
  boss: {
    name: '新手Boss',
    hpMultiplier: 1.15,       // 比玩家裸装略高
    attackMultiplier: 1.05,
    defenseMultiplier: 1.0,
    expMultiplier: 3.0,
    rewardMultiplier: 2.5,
    dropChance: {
      technique: 0.6,
      equipment: 0.6,
    },
    variance: 0.05,
  },
};

/**
 * 获取有效的敌人等级配置（考虑难度调整）
 * 新手区域(难度<=10)的敌人使用更低的属性乘数
 * 
 * 【塔层系统支持】
 * - difficultyLevel > 10 且为浮点数时，视为塔层难度
 * - 塔层使用专用的敌人配置（tower_normal, tower_elite, tower_boss）
 * - 难度越高，额外加成越多
 * 
 * 【平衡性说明】
 * - 玩家有功法+装备双层百分比加成（约1.21倍）
 * - 塔层敌人基础倍率已考虑这一点（1.5-1.6倍起）
 * - 额外难度加成用于高层挑战
 */
export function getEffectiveEnemyTierConfig(
  tier: EnemyTier, 
  difficultyLevel: number = 1
): EnemyTierConfigItem {
  // 新手区域的所有敌人都使用简化配置
  if (difficultyLevel <= 10 && Number.isInteger(difficultyLevel)) {
    return NEWBIE_ENEMY_TIER_CONFIG[tier];
  }
  
  // 塔层系统：使用专用配置 + 难度加成
  // difficultyLevel 范围：1.0 - 10.0
  if (difficultyLevel > 1) {
    // 选择塔层专用配置
    let towerConfigKey: string;
    if (tier === 'boss') {
      towerConfigKey = 'tower_boss';
    } else if (tier === 'elite') {
      towerConfigKey = 'tower_elite';
    } else {
      towerConfigKey = 'tower_normal';
    }
    
    const baseConfig = ENEMY_TIER_CONFIG[towerConfigKey];
    
    // 难度额外加成（在塔层基础配置上叠加）
    // difficulty 1.0 -> 额外加成 0%
    // difficulty 2.0 -> 额外加成 10%
    // difficulty 3.0 -> 额外加成 20%
    // difficulty 5.0 -> 额外加成 40%
    // difficulty 10.0 -> 额外加成 90%
    const extraMultiplier = 1 + (difficultyLevel - 1) * 0.1;
    
    return {
      name: `${baseConfig.name} Lv.${Math.floor(difficultyLevel)}`,
      hpMultiplier: baseConfig.hpMultiplier * extraMultiplier,
      attackMultiplier: baseConfig.attackMultiplier * extraMultiplier,
      defenseMultiplier: baseConfig.defenseMultiplier * extraMultiplier,
      expMultiplier: baseConfig.expMultiplier,
      rewardMultiplier: baseConfig.rewardMultiplier * (1 + (difficultyLevel - 1) * 0.12),
      dropChance: baseConfig.dropChance,
      variance: baseConfig.variance,
    };
  }
  
  return ENEMY_TIER_CONFIG[tier];
}
