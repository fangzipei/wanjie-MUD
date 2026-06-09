/**
 * 境界系统统一数据文件
 * 
 * 设计原则：
 * 1. 世界生成时随机抽取一套"大境界体系"
 * 2. 再随机抽取一套"小境界体系"
 * 3. 两者拼接形成完整的境界名称
 * 4. 所有境界相关查询都基于世界存储的境界配置
 */

import { 
  calculateEnemyHp, 
  calculateEnemyAttack, 
  calculateEnemyDefense 
} from '@/modules/progression/logic/balanceConfig';
import { calculateEnemyCombatPower } from '@/modules/combat/logic/combatPower';
import { calculateEnemyEnhancement } from '@/modules/combat/logic/enemy/enemyEnhancement';
import type { WorldType, DungeonConfig } from '@/shared/lib/types';
import type { RealmSystem, RealmTier } from './realmCore';
import { getRealmName, getRealmMultiplier } from './realmCore';

// ============================================
// 小境界体系（可与任意大境界体系搭配）
// ============================================

// 通用小境界（兜底使用，确保每种世界类型至少 2 种可选）
const COMMON_SUB_REALMS = {
  '一二三四阶': ['一阶', '二阶', '三阶', '四阶', '五阶', '六阶', '七阶', '八阶', '九阶', '十阶'],
  '星级': ['一星', '二星', '三星', '四星', '五星', '六星', '七星', '八星', '九星', '十星'],
  '数字层': ['第一层', '第二层', '第三层', '第四层', '第五层', '第六层', '第七层', '第八层', '第九层', '第十层'],
};

export const SUB_REALM_SYSTEMS: Record<WorldType, Record<string, string[]>> = {
  '修仙': {
    '一至九重': ['一重', '二重', '三重', '四重', '五重', '六重', '七重', '八重', '九重', '圆满'],
    '初期至大圆满': ['初期', '中期', '后期', '巅峰', '极限', '大圆满', '圆满', '大成', '圆满', '归一'],
    '入门至大成': ['入门', '初窥', '小成', '精通', '大成', '圆满', '入微', '天人', '化境', '造化'],
    ...COMMON_SUB_REALMS,
  },
  '仙侠': {
    '一至九重': ['一重', '二重', '三重', '四重', '五重', '六重', '七重', '八重', '九重', '圆满'],
    '初期至大圆满': ['初期', '中期', '后期', '巅峰', '圆满', '大成', '真意', '归真', '化境', '飞升'],
    '入门至大成': ['入门', '初窥', '小成', '精通', '大成', '圆满', '入道', '通神', '化境', '证道'],
    ...COMMON_SUB_REALMS,
  },
  '高武': {
    '一二三四阶': COMMON_SUB_REALMS['一二三四阶'],
    '星级': COMMON_SUB_REALMS['星级'],
    '数字层': COMMON_SUB_REALMS['数字层'],
  },
  '武侠': {
    '一二三四阶': COMMON_SUB_REALMS['一二三四阶'],
    '星级': COMMON_SUB_REALMS['星级'],
    '数字层': COMMON_SUB_REALMS['数字层'],
  },
  '科技': {
    'LV等级': ['LV1', 'LV2', 'LV3', 'LV4', 'LV5', 'LV6', 'LV7', 'LV8', 'LV9', 'LV10'],
    '品级': ['九品', '八品', '七品', '六品', '五品', '四品', '三品', '二品', '一品', '极品'],
    '一二三四阶': COMMON_SUB_REALMS['一二三四阶'],
    '星级': COMMON_SUB_REALMS['星级'],
  },
  '魔幻': {
    '星级': COMMON_SUB_REALMS['星级'],
    '品级': ['九品', '八品', '七品', '六品', '五品', '四品', '三品', '二品', '一品', '极品'],
    '数字层': COMMON_SUB_REALMS['数字层'],
    '一二三四阶': COMMON_SUB_REALMS['一二三四阶'],
  },
  '异能': {
    '一二三四阶': COMMON_SUB_REALMS['一二三四阶'],
    '星级': COMMON_SUB_REALMS['星级'],
    '数字层': COMMON_SUB_REALMS['数字层'],
  },
  '末世': {
    '一二三四阶': COMMON_SUB_REALMS['一二三四阶'],
    '数字层': COMMON_SUB_REALMS['数字层'],
    'LV等级': ['LV1', 'LV2', 'LV3', 'LV4', 'LV5', 'LV6', 'LV7', 'LV8', 'LV9', 'LV10'],
    '星级': COMMON_SUB_REALMS['星级'],
  },
};

// 默认小境界体系名称列表（修仙）
export const DEFAULT_SUB_REALM_NAMES = Object.keys(SUB_REALM_SYSTEMS['修仙']);

// ============================================
// 大境界体系（按世界类型分类）
// ============================================

export const MAIN_REALM_SYSTEMS: Record<WorldType, Record<string, string[]>> = {
  '修仙': {
    '传统修仙': ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '渡劫期', '大乘期', '地仙', '天仙', '仙王'],
    '仙道飞升': ['引气', '化灵', '结丹', '元神', '分神', '合体', '渡劫', '大乘', '飞升', '真仙'],
    '道家修行': ['练气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '成仙'],
    '灵修体系': ['灵徒', '灵士', '灵师', '灵将', '灵王', '灵皇', '灵帝', '灵圣', '灵神', '灵尊'],
  },
  '高武': {
    '武道修行': ['武徒', '武士', '武师', '武将', '武王', '武皇', '武帝', '武圣', '武神', '武尊'],
    '气血武道': ['淬体', '通脉', '聚气', '凝元', '化劲', '宗师', '大宗师', '武圣', '武神', '武道至尊'],
    '战神体系': ['战士', '战将', '战帅', '战王', '战皇', '战帝', '战圣', '战神', '战尊', '战天'],
    '龙血武道': ['龙血一阶', '龙血二阶', '龙血三阶', '龙血四阶', '龙血五阶', '龙血六阶', '龙血七阶', '龙血八阶', '龙血九阶', '龙神'],
  },
  '科技': {
    '军衔体系': ['列兵', '上等兵', '下士', '中士', '上士', '准尉', '少尉', '中尉', '上尉', '少校'],
    '公民等级': ['E级公民', 'D级公民', 'C级公民', 'B级公民', 'A级公民', 'S级公民', 'SS级公民', 'SSS级公民', 'X级公民', '至高公民'],
    '基因进化': ['原生体', '进化体', '超进化体', '完美体', '不朽体', '永恒体', '神体', '圣体', '至尊体', '终极体'],
    '赛博等级': ['一级觉醒者', '二级觉醒者', '三级觉醒者', '四级觉醒者', '五级觉醒者', '六级觉醒者', '七级觉醒者', '八级觉醒者', '九级觉醒者', '终极觉醒者'],
  },
  '魔幻': {
    '魔法师': ['魔法学徒', '见习法师', '初级法师', '中级法师', '高级法师', '大法师', '魔导师', '大魔导师', '法圣', '法神'],
    '圣殿体系': ['见习圣徒', '圣徒', '圣骑士', '圣殿骑士', '圣殿统领', '圣殿将军', '圣殿主教', '圣殿大主教', '圣殿至尊', '圣神'],
    '元素体系': ['元素感应者', '元素掌控者', '元素大师', '元素领主', '元素王', '元素皇', '元素帝', '元素圣', '元素神', '元素至尊'],
    '龙骑士': ['龙蛋守护', '幼龙骑士', '少年龙骑士', '青年龙骑士', '成年龙骑士', '精英龙骑士', '龙骑士长', '龙骑士统帅', '龙圣骑士', '龙神骑士'],
  },
  '异能': {
    '字母等级': ['F级', 'E级', 'D级', 'C级', 'B级', 'A级', 'S级', 'SS级', 'SSS级', 'X级'],
    '觉醒等级': ['初觉醒', '觉醒者', '超觉醒者', '完美觉醒者', '究极觉醒者', '觉醒大师', '觉醒宗师', '觉醒圣者', '觉醒至尊', '觉醒之神'],
    '超能等级': ['一阶超能', '二阶超能', '三阶超能', '四阶超能', '五阶超能', '六阶超能', '七阶超能', '八阶超能', '九阶超能', '十阶超能'],
    '变异等级': ['微变异', '轻变异', '中变异', '重变异', '强变异', '极变异', '超变异', '完美变异', '终极变异', '神级变异'],
  },
  '仙侠': {
    '剑道修行': ['剑徒', '剑士', '剑客', '剑师', '大剑师', '剑王', '剑皇', '剑帝', '剑圣', '剑仙'],
    '仙门修行': ['外门弟子', '内门弟子', '真传弟子', '亲传弟子', '核心长老', '峰主', '掌门', '太上长老', '开山祖师', '飞升仙'],
    '道家飞升': ['炼气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙'],
    '仙侠经典': ['炼气期', '筑基期', '金丹期', '元婴期', '化神期', '渡劫期', '大乘期', '地仙', '天仙', '金仙'],
  },
  '武侠': {
    '江湖武学': ['江湖新秀', '武林新秀', '武林高手', '武林名家', '江湖大侠', '武林盟主', '一代宗师', '武林泰斗', '武圣', '武林神话'],
    '门派修行': ['外门弟子', '内门弟子', '亲传弟子', '门派执事', '门派长老', '门派副掌门', '门派掌门', '门派太上长老', '门派祖师', '武林至尊'],
    '侠义修行': ['侠客', '大侠', '豪侠', '义士', '侠义英雄', '武林名宿', '江湖传奇', '武林神话', '侠圣', '侠神'],
    '武道境界': ['武徒', '武者', '武师', '大武师', '武宗', '武尊', '武王', '武帝', '武圣', '武神'],
  },
  '末世': {
    '生存进化': ['幸存者', '觉醒者', '进化者', '异能者', '变异者', '超凡者', '主宰者', '统治者', '王者', '皇者'],
    '阶位体系': ['一阶', '二阶', '三阶', '四阶', '五阶', '六阶', '七阶', '八阶', '九阶', '十阶'],
    '末日等级': ['末日后裔', '末日行者', '末日猎手', '末日统领', '末日领主', '末日王者', '末日皇者', '末日圣者', '末日神者', '末日至尊'],
    '变异等级': ['普通幸存者', '初级觉醒者', '中级觉醒者', '高级觉醒者', '精英觉醒者', '超级觉醒者', '变异觉醒者', '完美觉醒者', '终极觉醒者', '进化之神'],
  },
};

// ============================================
// 境界配置接口 — 从 realmCore 重导出
// ============================================

export type { RealmSystem, RealmTier } from './realmCore';

// ============================================
// 境界系统生成函数
// ============================================

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomKey = <T extends Record<string, unknown>>(obj: T): string => {
  const keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * keys.length)];
};

/**
 * 为世界生成一套境界体系
 * 随机抽取大境界体系和小境界体系，组合成完整的境界名称
 */
export function generateRealmSystem(worldType: WorldType): RealmSystem {
  // 随机选择大境界体系
  const mainRealms = MAIN_REALM_SYSTEMS[worldType];
  const mainRealmName = randomKey(mainRealms);
  const mainRealmTiers = mainRealms[mainRealmName];

  // 从世界限定的小境界体系中随机选择（兜底使用通用体系）
  const worldSubRealms = SUB_REALM_SYSTEMS[worldType] || SUB_REALM_SYSTEMS['修仙'];
  const subRealmName = randomKey(worldSubRealms);
  const subRealms = worldSubRealms[subRealmName];
  
  // 组合生成完整境界层级
  const tiers: RealmTier[] = mainRealmTiers.map((tierName, index) => {
    const startLevel = index * 10 + 1;
    const endLevel = (index + 1) * 10;
    
    return {
      name: tierName,
      subRealms: subRealms,
      levelRange: [startLevel, endLevel] as [number, number],
    };
  });
  
  return {
    mainRealmName,
    subRealmName,
    tiers,
  };
}

/**
 * 获取可选的难度列表（用于机缘）
 * 
 * 解锁规则：
 * - 低等级机缘（难度 <= 玩家等级）：直接显示
 * - 高等级机缘（难度 > 玩家等级）：需要通关前置机缘才显示
 * - 前置机缘：已通关的最高难度机缘 + 一个难度档位（约20级）
 * - 解锁状态：玩家等级 >= 机缘难度时解锁
 * 
 * @param realmSystem 境界系统
 * @param playerLevel 玩家当前等级
 * @param clearedDifficulties 已通关的机缘难度等级列表
 */
export function getAvailableDifficultiesForRealm(
  realmSystem: RealmSystem | undefined, 
  playerLevel: number,
  clearedDifficulties: number[] = []
): DungeonConfig[] {
  // 防护：如果没有 realmSystem，返回空数组
  if (!realmSystem || !realmSystem.tiers || realmSystem.tiers.length === 0) {
    return [];
  }
  
  const result: DungeonConfig[] = [];
  
  // 计算已通关的最高难度
  const maxClearedDifficulty = clearedDifficulties.length > 0 
    ? Math.max(...clearedDifficulties) 
    : 0;
  
  // 定义机缘显示范围
  // - 最低等级：玩家等级 - 10（但不低于1）
  // - 最高等级：玩家等级 + 20 或 已通关最高难度 + 20（取较大值）
  const minUnlockLevel = Math.max(1, playerLevel - 10);
  const maxUnlockLevel = Math.max(playerLevel + 20, maxClearedDifficulty + 20);
  
  // 返回所有大境界的起始等级作为选项
  for (let i = 0; i < realmSystem.tiers.length; i++) {
    const tier = realmSystem.tiers[i];
    const level = tier.levelRange[0];
    
    // 过滤：只显示范围内的机缘
    if (level < minUnlockLevel - 5) continue; // 允许略低于最低等级
    if (level > maxUnlockLevel) continue;
    
    // 高等级机缘显示条件：需要通关前置机缘
    // 前置条件：已通关最高难度 >= 当前机缘难度 - 20
    // 或者：机缘难度 <= 玩家等级（低等级直接显示）
    if (level > playerLevel) {
      // 高等级机缘：需要通关前置
      const prerequisiteLevel = level - 20;
      if (maxClearedDifficulty < prerequisiteLevel) {
        // 没有通关足够高难度的前置机缘，不显示
        continue;
      }
    }
    
    const realmName = getRealmName(realmSystem, level);
    const multiplier = getRealmMultiplier(realmSystem, level);
    
    // 根据 multiplier 确定难度级别
    let difficultyLevel: 'easy' | 'normal' | 'hard' | 'nightmare';
    if (multiplier <= 1.0) {
      difficultyLevel = 'easy';
    } else if (multiplier <= 1.5) {
      difficultyLevel = 'normal';
    } else if (multiplier <= 2.0) {
      difficultyLevel = 'hard';
    } else {
      difficultyLevel = 'nightmare';
    }
    
    // 格子数量：5x5 到 15x15，每5级增加1格
    const gridSize = Math.max(5, Math.min(15, 5 + Math.floor(level / 10)));
    
    // ============================================
    // 战力需求计算（使用统一的战力计算函数）
    // 核心思路：计算Boss战力，然后确定玩家需要的最低战力
    // ============================================
    
    const difficultyMultiplier = 
      difficultyLevel === 'easy' ? 1.0 :
      difficultyLevel === 'normal' ? 1.5 :
      difficultyLevel === 'hard' ? 2.0 : 3.0;
    
    // 使用统一的函数计算Boss战力（与战斗系统一致）
    // Boss等级取关卡最高等级
    const bossLevel = level + 5;
    
    // 计算Boss属性（使用统一的敌人属性计算函数）
    // 禁用随机浮动，确保战力要求稳定显示
    // 传入 level 作为 difficultyValue 用于新手Boss判断
    let bossHp = calculateEnemyHp(bossLevel, 'boss', difficultyLevel, '修仙', false, level);
    let bossAttack = calculateEnemyAttack(bossLevel, 'boss', difficultyLevel, '修仙', false, level);
    let bossDefense = calculateEnemyDefense(bossLevel, 'boss', difficultyLevel, '修仙', false, level);
    
    // 应用Boss增强（传入 level 用于新手区域判断）
    const bossEnhancement = calculateEnemyEnhancement(bossLevel, 'boss', level);
    bossHp = Math.floor(bossHp * (1 + bossEnhancement.totalHpBonus / 100));
    bossAttack = Math.floor(bossAttack * (1 + bossEnhancement.totalAttackBonus / 100));
    bossDefense = Math.floor(bossDefense * (1 + bossEnhancement.totalDefenseBonus / 100));
    
    // 使用统一的战力计算函数
    const bossPower = calculateEnemyCombatPower(bossHp, bossAttack, bossDefense, bossLevel, 'boss');
    
    // 计算精英敌人战力
    const eliteLevel = level + 2;
    // 禁用随机浮动，确保战力要求稳定显示
    let eliteHp = calculateEnemyHp(eliteLevel, 'elite', difficultyLevel, '修仙', false);
    let eliteAttack = calculateEnemyAttack(eliteLevel, 'elite', difficultyLevel, '修仙', false);
    let eliteDefense = calculateEnemyDefense(eliteLevel, 'elite', difficultyLevel, '修仙', false);
    // 传入 level 用于新手区域判断
    const eliteEnhancement = calculateEnemyEnhancement(eliteLevel, 'elite', level);
    eliteHp = Math.floor(eliteHp * (1 + eliteEnhancement.totalHpBonus / 100));
    eliteAttack = Math.floor(eliteAttack * (1 + eliteEnhancement.totalAttackBonus / 100));
    eliteDefense = Math.floor(eliteDefense * (1 + eliteEnhancement.totalDefenseBonus / 100));
    const elitePower = calculateEnemyCombatPower(eliteHp, eliteAttack, eliteDefense, eliteLevel, 'elite');
    
    // 根据地图大小估算敌人数量
    const totalCells = gridSize * gridSize;
    const eliteCount = Math.max(2, Math.floor(totalCells * 0.03)); // 约3%精英
    const normalEnemyCount = Math.floor(totalCells * 0.18); // 约18%普通敌人
    
    // 战力需求 = Boss战力 × 1.2（安全系数，确保能击败） + 精英战力 × 精英数量 × 0.3
    // 玩家战力略高于Boss战力即可击败，乘以1.2是安全系数
    const requiredPower = Math.floor(
      (bossPower * 1.2 + elitePower * eliteCount * 0.3) * difficultyMultiplier
    );
    
    // 计算体力消耗：基础10点，难度越高消耗越多
    // easy: 10, normal: 15, hard: 25, nightmare: 40
    const staminaCost = 
      difficultyLevel === 'easy' ? 10 :
      difficultyLevel === 'normal' ? 15 :
      difficultyLevel === 'hard' ? 25 : 40;
    
    // 判断是否解锁：机缘等级 <= 玩家等级
    const isUnlocked = level <= playerLevel;
    
    result.push({
      rows: gridSize,
      cols: gridSize,
      difficulty: level,
      realmName,
      enemyLevelMin: Math.max(1, level - 5),
      enemyLevelMax: level + 5,
      rewardMultiplier: multiplier,
      portalCount: Math.min(5, Math.floor(level / 20) + 1),
      difficultyLevel,
      requiredPower,
      staminaCost,
      isUnlocked, // 添加解锁状态
    });
  }
  
  // 确保至少返回一个机缘（如果数组为空，返回第一个）
  if (result.length === 0 && realmSystem.tiers.length > 0) {
    const tier = realmSystem.tiers[0];
    const level = tier.levelRange[0];
    const realmName = getRealmName(realmSystem, level);
    
    result.push({
      rows: 5,
      cols: 5,
      difficulty: level,
      realmName,
      enemyLevelMin: Math.max(1, level - 5),
      enemyLevelMax: level + 5,
      rewardMultiplier: 1.0,
      portalCount: 1,
      difficultyLevel: 'easy',
      requiredPower: 100,
      staminaCost: 10,
      isUnlocked: level <= playerLevel,
    });
  }
  
  return result;
}

// ============================================
// 纯函数 — 从 realmCore 重导出
// ============================================
export {
  getRealmName,
  getMainRealmName,
  getNextRealm,
  getNextMainRealmLevel,
  getPowerSystemDescription,
  getRealmMultiplier,
  getMaxLevel,
  getExperienceForLevel,
  getStatBaseForLevel,
  getStatPotentialForLevel,
} from './realmCore';
