/**
 * 机缘难度列表计算
 *
 * 从 realmData.ts 中提取，避免 Turbopack 生产构建中的模块解析问题。
 * 该函数直接导入所有依赖，不通过 barrel 或重导出链。
 */

import type { RealmSystem } from '@/lib/data/realmCore';
import type { DungeonConfig } from '@/lib/game/types';
import { getRealmName, getRealmMultiplier } from '@/lib/data/realmCore';
import {
  calculateEnemyHp,
  calculateEnemyAttack,
  calculateEnemyDefense,
} from '@/lib/game/utils/balanceConfig';
import { calculateEnemyCombatPower } from '@/lib/game/utils/combatPower';
import { calculateEnemyEnhancement } from '@/lib/game/enemy/enemyEnhancement';

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
