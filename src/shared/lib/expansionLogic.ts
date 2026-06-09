/**
 * 扩展系统核心逻辑
 * 
 * 整合修炼流派、功法羁绊、装备词缀、势力进度等系统的计算逻辑
 */

import { CharacterStats, ItemRarity, WorldType, EquipmentSlot, getFinalStats, LegacyStats, GrowthStats } from '@/shared/lib/types';
import { 
  CultivationPath,
  CultivationPathProgress,
  MentalState,
  TechniqueProficiency,
  EquipmentEnhancement,
  FactionProgress,
  CurrencyState,
  ProtagonistExtension,
  DEFAULT_PROTAGONIST_EXTENSION
} from '@/shared/lib/typesExtension';
import { TaskProgress } from '@/shared/lib/typesExtension';
import {
  RealmBottleneck,
  TribulationState,
  BottleneckType
} from '@/shared/lib/typesExtension';
import { DemonEncounter, DemonChoice } from '@/shared/lib/typesExtension';
import {
  CULTIVATION_PATHS,
  PATH_LEVEL_CONFIG,
  getPathLevelExp,
  checkPathUnlockConditions,
  getActivePathSkills,
  calculatePathStatBonus
} from '@/modules/progression/data/cultivationPathData';
import {
  DEMON_ENCOUNTERS,
  getRandomDemonEncounter,
  calculateDemonChoiceSuccessRate,
  calculateDemonTriggerChance
} from '@/modules/combat/data/demonData';
import {
  ALL_AFFIXES,
  EQUIPMENT_SETS,
  ENHANCEMENT_CONFIG,
  REFINEMENT_CONFIG,
  rollRandomAffix,
  getEnhancementBonus,
  calculateSetBonus,
  EquipmentAffix
} from '@/modules/equipment/data/equipmentAffixData';
import {
  REPUTATION_LEVELS,
  getReputationLevel,
  getRanksByFactionType,
  FACTION_TASKS,
  FACTION_SHOP_ITEMS,
  FACTION_SKILLS
} from '@/modules/faction/data/factionProgressData';
import {
  TECHNIQUE_BONDS,
  PROFICIENCY_LEVELS,
  getProficiencyLevel,
  getProficiencyBonus,
  calculateBondEffects,
  TechniqueBondConfig
} from '@/modules/techniques/data/techniqueBondData';

// ============================================
// 修炼流派系统逻辑
// ============================================

/**
 * 选择修炼流派
 */
export function selectCultivationPath(
  currentProgress: CultivationPathProgress | null,
  path: CultivationPath,
  playerLevel: number,
  playerStats: LegacyStats
): { success: boolean; message: string; progress: CultivationPathProgress } {
  // 检查是否已选择流派
  if (currentProgress?.path) {
    return {
      success: false,
      message: `你已选择${CULTIVATION_PATHS[currentProgress.path].name}流派，无法更改`,
      progress: currentProgress
    };
  }
  
  // 检查解锁条件
  const check = checkPathUnlockConditions(path, playerLevel, playerStats);
  if (!check.canUnlock) {
    return {
      success: false,
      message: check.reason,
      progress: currentProgress || { path: null, exp: 0, level: 1 }
    };
  }
  
  // 成功选择
  return {
    success: true,
    message: `成功选择${CULTIVATION_PATHS[path].name}流派！`,
    progress: {
      path,
      exp: 0,
      level: 1,
      unlockedAt: Date.now()
    }
  };
}

/**
 * 增加流派经验
 */
export function addPathExperience(
  progress: CultivationPathProgress,
  expGain: number
): CultivationPathProgress {
  if (!progress.path) return progress;
  
  let newExp = progress.exp + expGain;
  let newLevel = progress.level;
  
  // 检查升级
  while (newLevel < PATH_LEVEL_CONFIG.maxLevel) {
    const requiredExp = getPathLevelExp(newLevel);
    if (newExp >= requiredExp) {
      newExp -= requiredExp;
      newLevel++;
    } else {
      break;
    }
  }
  
  return {
    ...progress,
    exp: newExp,
    level: newLevel
  };
}

/**
 * 计算流派加成后的属性
 */
export function calculatePathBonuses(
  progress: CultivationPathProgress | null
): {
  cultivationBonus: number;
  breakthroughBonus: number;
  statBonus: Partial<LegacyStats>;
  activeSkills: { name: string; description: string }[];
} {
  if (!progress?.path) {
    return {
      cultivationBonus: 0,
      breakthroughBonus: 0,
      statBonus: {},
      activeSkills: []
    };
  }
  
  const config = CULTIVATION_PATHS[progress.path];
  const skills = getActivePathSkills(progress.path, progress.level);
  const statBonus = calculatePathStatBonus(progress.path, progress.level);
  
  return {
    cultivationBonus: config.cultivationBonus,
    breakthroughBonus: config.breakthroughBonus,
    statBonus,
    activeSkills: skills.map(s => ({ name: s.name, description: s.description }))
  };
}

// ============================================
// 功法熟练度与羁绊逻辑
// ============================================

/**
 * 增加功法熟练度
 */
export function addTechniqueProficiency(
  proficiency: number,
  usageCount: number,
  gain: number
): { proficiency: number; usageCount: number; leveledUp: boolean } {
  const newUsageCount = usageCount + 1;
  const newProficiency = Math.min(1000, proficiency + gain);
  
  const oldLevel = getProficiencyLevel(proficiency);
  const newLevel = getProficiencyLevel(newProficiency);
  const leveledUp = oldLevel !== newLevel;
  
  return {
    proficiency: newProficiency,
    usageCount: newUsageCount,
    leveledUp
  };
}

/**
 * 计算功法最终属性（含熟练度和羁绊加成）
 */
export function calculateTechniqueFinalStats(
  basePower: number,
  baseBonus: number,
  mpCost: number,
  proficiency: number,
  activeBonds: { bond: TechniqueBondConfig; level: { powerBonus: number; bonusMultiplier: number } }[]
): {
  finalPower: number;
  finalBonus: number;
  finalMpCost: number;
  proficiencyBonus: { power: number; bonus: number; mpReduce: number };
  bondBonus: { power: number; bonus: number };
} {
  // 熟练度加成
  const profBonus = getProficiencyBonus(proficiency);
  
  // 羁绊加成
  let totalBondPower = 0;
  let totalBondBonus = 0;
  for (const { level } of activeBonds) {
    totalBondPower += level.powerBonus;
    totalBondBonus += level.bonusMultiplier;
  }
  
  // 计算最终值
  const finalPower = Math.floor(basePower * (1 + profBonus.powerBonus / 100 + totalBondPower / 100));
  const finalBonus = baseBonus + profBonus.bonusMultiplier + totalBondBonus;
  const finalMpCost = Math.floor(mpCost * (1 - profBonus.mpReduce / 100));
  
  return {
    finalPower,
    finalBonus,
    finalMpCost,
    proficiencyBonus: {
      power: profBonus.powerBonus,
      bonus: profBonus.bonusMultiplier,
      mpReduce: profBonus.mpReduce
    },
    bondBonus: {
      power: totalBondPower,
      bonus: totalBondBonus
    }
  };
}

/**
 * 检查功法羁绊激活
 */
export function checkTechniqueBonds(
  equippedTechniques: { name: string; rarity: ItemRarity }[]
): { bond: TechniqueBondConfig; level: number; effects: { powerBonus: number; bonusMultiplier: number; special?: string } }[] {
  const results: { bond: TechniqueBondConfig; level: number; effects: { powerBonus: number; bonusMultiplier: number; special?: string } }[] = [];
  
  for (const bond of TECHNIQUE_BONDS) {
    // 跳过特殊羁绊（需要单独处理）
    if (bond.keywords.length === 0) continue;
    
    // 计算匹配数量
    const matchCount = equippedTechniques.filter(t => 
      bond.keywords.some(kw => t.name.includes(kw))
    ).length;
    
    if (matchCount >= bond.minMatches) {
      // 找到最高触发的等级
      const sortedLevels = [...bond.levels].sort((a, b) => b.level - a.level);
      const activeLevel = sortedLevels.find(l => matchCount >= l.requiredCount);
      
      if (activeLevel) {
        results.push({
          bond,
          level: activeLevel.level,
          effects: activeLevel.effects
        });
      }
    }
  }
  
  return results;
}

// ============================================
// 装备词缀与强化逻辑
// ============================================

/**
 * 生成装备词缀
 */
export function generateEquipmentAffixes(rarity: ItemRarity): EquipmentAffix[] {
  const affixes: EquipmentAffix[] = [];
  
  // 根据稀有度决定词缀数量
  // 普通: 0, 稀有: 1, 史诗: 2 (前缀+后缀), 传说: 2 + 特殊
  if (rarity === '稀有') {
    const affix = rollRandomAffix(rarity, Math.random() > 0.5 ? 'prefix' : 'suffix');
    if (affix) affixes.push(affix);
  } else if (rarity === '史诗' || rarity === '传说') {
    const prefix = rollRandomAffix(rarity, 'prefix');
    const suffix = rollRandomAffix(rarity, 'suffix');
    if (prefix) affixes.push(prefix);
    if (suffix) affixes.push(suffix);
  }
  
  return affixes;
}

/**
 * 计算装备最终属性（含词缀和强化）
 */
export function calculateEquipmentFinalStats(
  basePower: number,
  baseAttackBonus: number,
  baseDefenseBonus: number,
  enhancement: number,
  affixes: EquipmentAffix[]
): {
  finalPower: number;
  finalAttackBonus: number;
  finalDefenseBonus: number;
  statBonus: Partial<LegacyStats>;
  enhancementBonus: { power: number; bonus: number };
} {
  // 强化加成
  const enhanceBonus = getEnhancementBonus(enhancement);
  
  // 词缀加成
  const statBonus: Partial<LegacyStats> = {};
  let affixPower = 0;
  let affixBonus = 0;
  
  for (const affix of affixes) {
    for (const effect of affix.effects) {
      if (effect.type === 'stat' && effect.stat) {
        statBonus[effect.stat] = (statBonus[effect.stat] || 0) + (effect.value || 0);
      } else if (effect.type === 'power') {
        affixPower += effect.value || 0;
      } else if (effect.type === 'bonus') {
        affixBonus += effect.value || 0;
      }
    }
  }
  
  // 计算最终值
  const finalPower = basePower + enhanceBonus.power + affixPower;
  const finalAttackBonus = baseAttackBonus + affixBonus;
  const finalDefenseBonus = baseDefenseBonus + affixBonus;
  
  return {
    finalPower,
    finalAttackBonus,
    finalDefenseBonus,
    statBonus,
    enhancementBonus: enhanceBonus
  };
}

/**
 * 强化装备
 */
export function enhanceEquipment(
  enhancement: number,
  spiritStones: number
): {
  success: boolean;
  newEnhancement: number;
  cost: number;
  message: string;
  destroyed: boolean;
} {
  if (enhancement >= ENHANCEMENT_CONFIG.maxLevel) {
    return {
      success: false,
      newEnhancement: enhancement,
      cost: 0,
      message: '已达到最高强化等级',
      destroyed: false
    };
  }
  
  const cost = ENHANCEMENT_CONFIG.costs[enhancement];
  if (spiritStones < cost) {
    return {
      success: false,
      newEnhancement: enhancement,
      cost: 0,
      message: `灵石不足，需要${cost}灵石`,
      destroyed: false
    };
  }
  
  // 检查成功率
  const successRate = ENHANCEMENT_CONFIG.successRates[enhancement];
  const roll = Math.random() * 100;
  const success = roll < successRate;
  
  if (success) {
    return {
      success: true,
      newEnhancement: enhancement + 1,
      cost,
      message: `强化成功！装备等级提升至+${enhancement + 1}`,
      destroyed: false
    };
  } else {
    // 检查失败惩罚
    const shouldDowngrade = ENHANCEMENT_CONFIG.failPenalty.downgrade[enhancement];
    const shouldDestroy = ENHANCEMENT_CONFIG.failPenalty.destroy[enhancement];
    
    if (shouldDestroy) {
      return {
        success: false,
        newEnhancement: 0,
        cost,
        message: '强化失败！装备已损坏...',
        destroyed: true
      };
    } else if (shouldDowngrade) {
      return {
        success: false,
        newEnhancement: Math.max(0, enhancement - 1),
        cost,
        message: `强化失败！装备等级降至+${Math.max(0, enhancement - 1)}`,
        destroyed: false
      };
    } else {
      return {
        success: false,
        newEnhancement: enhancement,
        cost,
        message: '强化失败，但装备完好无损',
        destroyed: false
      };
    }
  }
}

/**
 * 重铸装备
 */
export function refineEquipment(
  refinement: number,
  rarity: ItemRarity,
  spiritStones: number
): {
  success: boolean;
  newAffixes: EquipmentAffix[];
  cost: number;
  message: string;
} {
  if (refinement >= REFINEMENT_CONFIG.maxRefinements) {
    return {
      success: false,
      newAffixes: [],
      cost: 0,
      message: '已达到最大重铸次数'
    };
  }
  
  if (spiritStones < REFINEMENT_CONFIG.cost) {
    return {
      success: false,
      newAffixes: [],
      cost: 0,
      message: `灵石不足，需要${REFINEMENT_CONFIG.cost}灵石`
    };
  }
  
  // 重新生成词缀
  const newAffixes = generateEquipmentAffixes(rarity);
  
  return {
    success: true,
    newAffixes,
    cost: REFINEMENT_CONFIG.cost,
    message: '重铸成功！装备获得新词缀'
  };
}

// ============================================
// 势力进度逻辑
// ============================================

/**
 * 增加势力声望
 */
export function addFactionReputation(
  progress: FactionProgress,
  amount: number
): FactionProgress {
  const newReputation = progress.reputation + amount;
  const newLevel = getReputationLevel(newReputation);
  
  return {
    ...progress,
    reputation: newReputation,
    reputationLevel: newLevel
  };
}

/**
 * 检查职位晋升
 */
export function checkRankPromotion(
  progress: FactionProgress,
  factionType: string
): { canPromote: boolean; newRank: string | null; message: string } {
  const ranks = getRanksByFactionType(factionType);
  const currentRankIndex = ranks.findIndex(r => r.id === progress.rank);
  const nextRank = ranks[currentRankIndex + 1];
  
  if (!nextRank) {
    return {
      canPromote: false,
      newRank: null,
      message: '已达最高职位'
    };
  }
  
  if (progress.reputation >= nextRank.requiredReputation) {
    return {
      canPromote: true,
      newRank: nextRank.id,
      message: `可以晋升为${nextRank.name}！`
    };
  }
  
  return {
    canPromote: false,
    newRank: null,
    message: `声望不足，需要${nextRank.requiredReputation}声望`
  };
}

/**
 * 更新任务进度（V2 任务轮次系统）
 * 同时更新日常和周常任务进度
 */
export function updateTaskProgress(
  progress: FactionProgress,
  taskType: 'kill' | 'collect' | 'cultivate' | 'explore' | 'donate' | 'upgrade',
  target: string,
  count: number = 1
): FactionProgress {
  // 更新日常任务进度
  const newDailyAcceptedTasks = { ...progress.dailyRound.acceptedTasks };
  
  for (const task of FACTION_TASKS) {
    if (task.type !== 'daily') continue;
    
    const requirement = task.requirements.find(r => r.type === taskType && (r.target === target || r.target === 'any'));
    if (requirement) {
      const taskId = task.id;
      const existingProgress = newDailyAcceptedTasks[taskId];
      
      // 只更新已接取且未提交的任务
      if (existingProgress && existingProgress.accepted && !existingProgress.submitted) {
        const newCurrent = Math.min(requirement.count, existingProgress.current + count);
        
        newDailyAcceptedTasks[taskId] = {
          ...existingProgress,
          current: newCurrent,
          completed: newCurrent >= requirement.count,
          lastUpdateTime: Date.now()
        };
      }
    }
  }
  
  // 更新周常任务进度
  const newWeeklyAcceptedTasks = { ...progress.weeklyRound.acceptedTasks };
  
  for (const task of FACTION_TASKS) {
    if (task.type !== 'weekly') continue;
    
    const requirement = task.requirements.find(r => r.type === taskType && (r.target === target || r.target === 'any'));
    if (requirement) {
      const taskId = task.id;
      const existingProgress = newWeeklyAcceptedTasks[taskId];
      
      // 只更新已接取且未提交的任务
      if (existingProgress && existingProgress.accepted && !existingProgress.submitted) {
        const newCurrent = Math.min(requirement.count, existingProgress.current + count);
        
        newWeeklyAcceptedTasks[taskId] = {
          ...existingProgress,
          current: newCurrent,
          completed: newCurrent >= requirement.count,
          lastUpdateTime: Date.now()
        };
      }
    }
  }
  
  return {
    ...progress,
    dailyRound: {
      ...progress.dailyRound,
      acceptedTasks: newDailyAcceptedTasks,
    },
    weeklyRound: {
      ...progress.weeklyRound,
      acceptedTasks: newWeeklyAcceptedTasks,
    },
  };
}

/**
 * 领取任务奖励（V2 任务轮次系统）
 * 支持日常和周常任务
 */
export function claimTaskReward(
  progress: FactionProgress,
  taskId: string,
  roundType: 'daily' | 'weekly' = 'daily'
): {
  success: boolean;
  progress: FactionProgress;
  rewards: { reputation: number; contribution: number; experience?: number } | null;
  message: string;
} {
  const task = FACTION_TASKS.find(t => t.id === taskId);
  const round = roundType === 'daily' ? progress.dailyRound : progress.weeklyRound;
  const taskProgress = round.acceptedTasks[taskId];
  
  if (!task || !taskProgress) {
    return {
      success: false,
      progress,
      rewards: null,
      message: '任务不存在'
    };
  }
  
  // 检查是否已接取
  if (!taskProgress.accepted) {
    return {
      success: false,
      progress,
      rewards: null,
      message: '请先接取任务'
    };
  }
  
  if (!taskProgress.completed) {
    return {
      success: false,
      progress,
      rewards: null,
      message: '任务未完成'
    };
  }
  
  if (taskProgress.submitted) {
    return {
      success: false,
      progress,
      rewards: null,
      message: '奖励已领取'
    };
  }
  
  // 更新任务状态
  const newAcceptedTasks = {
    ...round.acceptedTasks,
    [taskId]: {
      ...taskProgress,
      submitted: true
    }
  };
  
  // 更新轮次完成数
  const newCompletedInRound = round.completedInRound + 1;
  const config = roundType === 'daily' ? { roundLimit: 20, roundCooldown: 24 * 60 * 60 * 1000 } : { roundLimit: 10, roundCooldown: 7 * 24 * 60 * 60 * 1000 };
  
  // 检查是否达到轮次上限（优先使用 round.roundLimit，否则使用配置中的默认值）
  const effectiveRoundLimit = round.roundLimit || config.roundLimit;
  let newCooldownEnd = round.roundCooldownEnd;
  if (newCompletedInRound >= effectiveRoundLimit) {
    newCooldownEnd = Date.now() + config.roundCooldown;
  }
  
  const newRound = {
    ...round,
    acceptedTasks: newAcceptedTasks,
    completedInRound: newCompletedInRound,
    completedTaskIdsInRound: [...round.completedTaskIdsInRound, taskId],
    roundCooldownEnd: newCooldownEnd,
  };
  
  // 增加声望和贡献点
  const newProgress: FactionProgress = {
    ...progress,
    [roundType === 'daily' ? 'dailyRound' : 'weeklyRound']: newRound,
    reputation: progress.reputation + task.rewards.reputation,
    contribution: progress.contribution + task.rewards.contribution,
    tasksCompleted: progress.tasksCompleted + 1
  };
  
  return {
    success: true,
    progress: newProgress,
    rewards: {
      reputation: task.rewards.reputation,
      contribution: task.rewards.contribution,
      experience: task.rewards.experience
    },
    message: `成功领取奖励：声望+${task.rewards.reputation}，贡献点+${task.rewards.contribution}`
  };
}

/**
 * 领取每日工资
 */
export function calculateDailySalary(
  rank: string,
  factionType: string
): number {
  const ranks = getRanksByFactionType(factionType);
  const currentRank = ranks.find(r => r.id === rank);
  
  if (!currentRank) return 0;
  
  const salaryBenefit = currentRank.benefits.find(b => b.type === 'salary');
  return salaryBenefit ? Number(salaryBenefit.value) : 0;
}

// ============================================
// 境界瓶颈与渡劫系统逻辑
// ============================================

import {
  TRIBULATION_CONFIGS,
  getTribulationConfig,
  getNextTribulationLevel,
  calculateSuccessRate
} from '@/modules/ascension/data/tribulationData';

/**
 * 检测是否触发境界瓶颈
 * 每10级检测一次
 */
export function checkRealmBottleneck(
  currentLevel: number,
  currentBottleneck: RealmBottleneck,
  stats: CharacterStats
): { triggered: boolean; bottleneck: RealmBottleneck; message: string } {
  // 如果已有活跃瓶颈，不再触发新瓶颈
  if (currentBottleneck.isActive) {
    return { triggered: false, bottleneck: currentBottleneck, message: '' };
  }
  
  // 检查是否到达瓶颈等级（每10级）
  const nextTribulationLevel = getNextTribulationLevel(currentBottleneck.level);
  if (!nextTribulationLevel || currentLevel < nextTribulationLevel) {
    return { triggered: false, bottleneck: currentBottleneck, message: '' };
  }
  
  // 触发瓶颈，随机类型
  const bottleneckTypes: BottleneckType[] = ['stats', 'insight', 'tribulation'];
  const type = bottleneckTypes[Math.floor(Math.random() * bottleneckTypes.length)];
  
  // 设置瓶颈需求
  const config = getTribulationConfig(nextTribulationLevel);
  const requirements: { stats?: Partial<LegacyStats>; insight?: number; tribulationLevel?: number } = {};
  
  if (type === 'stats') {
    // 属性瓶颈：需要达到一定属性（使用中文字段名）
    requirements.stats = {
      '体质': Math.floor(20 + nextTribulationLevel * 2),
      '灵根': Math.floor(20 + nextTribulationLevel * 2),
      '悟性': Math.floor(15 + nextTribulationLevel * 1.5),
      '幸运': Math.floor(15 + nextTribulationLevel * 1.5)
    };
  } else if (type === 'insight') {
    // 悟性瓶颈：需要历练或机缘
    requirements.insight = Math.floor(50 + nextTribulationLevel * 5);
  } else {
    // 渡劫瓶颈
    requirements.tribulationLevel = nextTribulationLevel;
  }
  
  const newBottleneck: RealmBottleneck = {
    isActive: true,
    type,
    level: nextTribulationLevel,
    requirements,
    attempts: 0,
    maxAttempts: 3
  };
  
  const typeNames = {
    stats: '属性瓶颈',
    insight: '悟性瓶颈',
    tribulation: '渡劫瓶颈'
  };
  
  return {
    triggered: true,
    bottleneck: newBottleneck,
    message: `境界突破在即！你遇到了${typeNames[type]}，需要克服才能继续修炼。`
  };
}

/**
 * 尝试突破瓶颈
 */
export function attemptBreakthrough(
  bottleneck: RealmBottleneck,
  stats: LegacyStats,
  insight: number
): { success: boolean; bottleneck: RealmBottleneck; message: string } {
  if (!bottleneck.isActive) {
    return { success: false, bottleneck, message: '当前没有瓶颈' };
  }
  
  const newAttempts = bottleneck.attempts + 1;
  
  // 检查是否满足条件
  let success = false;
  let message = '';
  
  switch (bottleneck.type) {
    case 'stats': {
      const req = bottleneck.requirements.stats || {};
      const meetsRequirements = Object.entries(req).every(([stat, value]) => {
        return (stats[stat as keyof LegacyStats] || 0) >= (value || 0);
      });
      
      if (meetsRequirements) {
        success = true;
        message = '属性达标，成功突破属性瓶颈！';
      } else {
        message = '属性不足，无法突破。请继续修炼提升属性。';
      }
      break;
    }
    case 'insight': {
      const requiredInsight = bottleneck.requirements.insight || 50;
      if (insight >= requiredInsight) {
        success = true;
        message = '悟性足够，成功突破悟性瓶颈！';
      } else {
        message = `悟性不足，需要${requiredInsight}点悟性。请历练或寻找机缘。`;
      }
      break;
    }
    case 'tribulation': {
      // 渡劫瓶颈需要单独处理
      return {
        success: false,
        bottleneck: { ...bottleneck, attempts: newAttempts },
        message: '渡劫瓶颈需要准备渡劫，无法直接突破。'
      };
    }
  }
  
  return {
    success,
    bottleneck: {
      ...bottleneck,
      attempts: newAttempts,
      isActive: !success
    },
    message
  };
}

/**
 * 开始渡劫
 */
export function startTribulation(
  level: number,
  stats: LegacyStats
): TribulationState {
  const config = getTribulationConfig(level);
  
  if (!config) {
    return {
      inProgress: false,
      config: null,
      currentPhase: 0,
      totalPhases: 3,
      successRate: 0
    };
  }
  
  return {
    inProgress: true,
    config,
    currentPhase: 1,
    totalPhases: 3,
    successRate: calculateSuccessRate(config, stats)
  };
}

/**
 * 执行渡劫阶段
 */
export function executeTribulationPhase(
  state: TribulationState,
  stats: LegacyStats
): { success: boolean; state: TribulationState; damage: number; message: string } {
  if (!state.inProgress || !state.config) {
    return { success: false, state, damage: 0, message: '渡劫未开始' };
  }
  
  const successRate = state.successRate;
  const roll = Math.random();
  const phaseSuccess = roll < successRate;
  
  if (phaseSuccess) {
    const newPhase = state.currentPhase + 1;
    const completed = newPhase > state.totalPhases;
    
    return {
      success: completed,
      state: {
        ...state,
        currentPhase: completed ? state.totalPhases : newPhase,
        inProgress: !completed
      },
      damage: 0,
      message: completed
        ? `渡劫成功！${state.config.successReward.specialEffect || ''}`
        : `第${state.currentPhase}阶段度过！继续坚持...`
    };
  } else {
    // 渡劫失败
    return {
      success: false,
      state: {
        ...state,
        inProgress: false
      },
      damage: state.config.failPenalty.hpLoss,
      message: `渡劫失败！${state.config.failPenalty.hpLoss * 100}%生命值受损...`
    };
  }
}

/**
 * 计算渡劫奖励
 */
export function calculateTribulationReward(
  state: TribulationState
): { stats: Partial<GrowthStats>; specialEffect?: string; title?: string } {
  if (!state.config) return { stats: {} };
  
  return {
    stats: state.config.successReward.statBonus,
    specialEffect: state.config.successReward.specialEffect,
    title: state.config.successReward.title
  };
}

/**
 * 计算渡劫失败惩罚
 */
export function calculateTribulationPenalty(
  state: TribulationState
): { hpLoss: number; statLoss: Partial<GrowthStats>; weaknessTurns: number } {
  if (!state.config) return { hpLoss: 0, statLoss: {}, weaknessTurns: 0 };
  
  return {
    hpLoss: state.config.failPenalty.hpLoss,
    statLoss: state.config.failPenalty.statLoss,
    weaknessTurns: state.config.failPenalty.weaknessTurns
  };
}

// ============================================
// 心境与心魔系统逻辑
// ============================================


/**
 * 计算心境对修炼效率的影响
 */
export function calculateMentalEffect(stability: number): number {
  if (stability >= 80) {
    return 0.1; // +10% 效率
  } else if (stability >= 50) {
    return 0; // 正常
  } else if (stability >= 30) {
    return -0.1; // -10% 效率
  } else {
    return -0.2; // -20% 效率
  }
}

/**
 * 更新心境稳定度
 */
export function updateMentalStability(
  current: number,
  change: number
): number {
  return Math.max(0, Math.min(100, current + change));
}

/**
 * 更新业力值
 */
export function updateKarma(
  current: number,
  change: number
): number {
  // 业力范围 -1000 到 1000
  return Math.max(-1000, Math.min(1000, current + change));
}

/**
 * 检查是否触发心魔
 */
export function checkDemonTrigger(
  mentalState: MentalState,
  cultivationPath: string | null
): { triggered: boolean; chance: number } {
  const chance = calculateDemonTriggerChance(
    mentalState.stability,
    mentalState.karma,
    cultivationPath
  );
  
  const roll = Math.random();
  const triggered = roll < chance;
  
  return { triggered, chance };
}

/**
 * 心境变化原因类型
 */
export type MentalChangeReason = 
  | 'battle_defeat'      // 战斗失败
  | 'breakthrough_fail'  // 突破失败
  | 'crafting_fail'      // 炼丹失败
  | 'forging_fail'       // 炼器失败
  | 'tribulation_fail'   // 渡劫失败
  | 'explore_fail'       // 探索失败
  | 'cultivate_success'  // 修炼成功
  | 'breakthrough_success' // 突破成功
  | 'battle_victory'     // 战斗胜利
  | 'seclusion_harmony'  // 天人交感
  | 'seclusion_enlightenment' // 大彻大悟
  | 'seclusion_deviation' // 走火入魔
  | 'seclusion_normal'   // 正常闭关
  | 'natural'            // 自然变化
  | 'item_effect';       // 道具效果

/**
 * 心境变化配置
 */
export const MENTAL_CHANGE_CONFIG: Record<MentalChangeReason, {
  stabilityChange: number;
  karmaChange?: number;
  demonChanceChange?: number;
  message: string;
}> = {
  battle_defeat: {
    stabilityChange: -15,
    karmaChange: -5,
    demonChanceChange: 0.02,
    message: '战斗失败，心境受挫'
  },
  breakthrough_fail: {
    stabilityChange: -20,
    demonChanceChange: 0.05,
    message: '突破失败，心境动摇'
  },
  crafting_fail: {
    stabilityChange: -8,
    demonChanceChange: 0.01,
    message: '炼丹失败，心神受损'
  },
  forging_fail: {
    stabilityChange: -8,
    demonChanceChange: 0.01,
    message: '炼器失败，心神受损'
  },
  tribulation_fail: {
    stabilityChange: -30,
    karmaChange: -10,
    demonChanceChange: 0.1,
    message: '渡劫失败，心境大损'
  },
  explore_fail: {
    stabilityChange: -5,
    message: '探索受挫，心境微乱'
  },
  cultivate_success: {
    stabilityChange: 2,
    karmaChange: 1,
    message: '修炼有成，心境略有提升'
  },
  breakthrough_success: {
    stabilityChange: 15,
    demonChanceChange: -0.05,
    message: '突破成功，心境大进'
  },
  battle_victory: {
    stabilityChange: 3,
    karmaChange: 1,
    message: '战斗胜利，战意昂扬'
  },
  seclusion_harmony: {
    stabilityChange: 20,
    karmaChange: 10,
    demonChanceChange: -0.1,
    message: '天人交感，心境通明'
  },
  seclusion_enlightenment: {
    stabilityChange: 10,
    karmaChange: 5,
    demonChanceChange: -0.05,
    message: '大彻大悟，心境提升'
  },
  seclusion_deviation: {
    stabilityChange: -25,
    karmaChange: -5,
    demonChanceChange: 0.08,
    message: '走火入魔，心境大乱'
  },
  seclusion_normal: {
    stabilityChange: 5,
    karmaChange: 2,
    message: '闭关有成，心境稳固'
  },
  natural: {
    stabilityChange: 0,
    message: ''
  },
  item_effect: {
    stabilityChange: 0,
    message: ''
  }
};

/**
 * 应用心境变化
 * 返回新的心境状态和变化描述
 */
export function applyMentalChange(
  mentalState: MentalState,
  reason: MentalChangeReason,
  customAmount?: number
): {
  newState: MentalState;
  change: number;
  message: string;
} {
  const config = MENTAL_CHANGE_CONFIG[reason];
  const stabilityChange = customAmount ?? config.stabilityChange;
  
  const newState: MentalState = {
    ...mentalState,
    stability: Math.max(0, Math.min(100, mentalState.stability + stabilityChange)),
    karma: Math.max(-1000, Math.min(1000, mentalState.karma + (config.karmaChange ?? 0))),
    demonChance: Math.max(0, Math.min(0.5, mentalState.demonChance + (config.demonChanceChange ?? 0))),
    lastChangeTime: Date.now()
  };
  
  return {
    newState,
    change: stabilityChange,
    message: config.message
  };
}

/**
 * 获取心魔事件
 */
export function getDemonEvent(): DemonEncounter {
  return getRandomDemonEncounter();
}

/**
 * 处理心魔选择
 */
export function processDemonChoice(
  demon: DemonEncounter,
  choiceIndex: number,
  stats: LegacyStats
): {
  success: boolean;
  stabilityChange: number;
  statChanges: Partial<LegacyStats>;
  demonChanceChange: number;
  message: string;
} {
  const choice = demon.choices[choiceIndex];
  if (!choice) {
    return {
      success: false,
      stabilityChange: 0,
      statChanges: {},
      demonChanceChange: 0,
      message: '无效的选择'
    };
  }
  
  const successRate = calculateDemonChoiceSuccessRate(choice, stats);
  const roll = Math.random();
  const success = roll < successRate;
  
  if (success) {
    return {
      success: true,
      stabilityChange: choice.successEffect.stability,
      statChanges: choice.successEffect.stats || {},
      demonChanceChange: -5, // 成功降低心魔概率
      message: `成功战胜${demon.name}！心境更加坚定。`
    };
  } else {
    return {
      success: false,
      stabilityChange: choice.failEffect.stability,
      statChanges: choice.failEffect.stats,
      demonChanceChange: choice.failEffect.demonChance,
      message: `未能战胜${demon.name}...心境受到动摇。`
    };
  }
}

/**
 * 更新心境Buff
 */
export function updateMentalBuffs(
  buffs: MentalState['mentalBuffs'],
  turns: number = 1
): MentalState['mentalBuffs'] {
  return buffs
    .map(buff => ({
      ...buff,
      duration: buff.duration - turns
    }))
    .filter(buff => buff.duration > 0);
}

/**
 * 添加心境Buff
 */
export function addMentalBuff(
  buffs: MentalState['mentalBuffs'],
  newBuff: MentalState['mentalBuffs'][0]
): MentalState['mentalBuffs'] {
  // 检查是否已有相同ID的buff
  const existingIndex = buffs.findIndex(b => b.id === newBuff.id);
  
  if (existingIndex >= 0) {
    // 刷新持续时间
    const newBuffs = [...buffs];
    newBuffs[existingIndex] = {
      ...newBuffs[existingIndex],
      duration: Math.max(newBuffs[existingIndex].duration, newBuff.duration)
    };
    return newBuffs;
  }
  
  return [...buffs, newBuff];
}

// ============================================
// 导出所有计算函数
// ============================================

export {
  CULTIVATION_PATHS,
  TECHNIQUE_BONDS,
  ALL_AFFIXES,
  EQUIPMENT_SETS,
  ENHANCEMENT_CONFIG,
  REFINEMENT_CONFIG,
  REPUTATION_LEVELS,
  FACTION_TASKS,
  FACTION_SHOP_ITEMS,
  FACTION_SKILLS,
  TRIBULATION_CONFIGS,
  DEMON_ENCOUNTERS
};
