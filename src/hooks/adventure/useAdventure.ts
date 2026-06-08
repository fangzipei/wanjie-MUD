/**
 * useGameAdventure - 机缘历练系统 Hook
 * 管理历练事件、秘境探索、扫荡等功能
 */

'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { getEnemyTierFromCellType, getEnemyTierConfig } from '@/lib/data/worldData';
import { 
  generateAdventureGrid, 
  handleCellEvent,
  parseEnemyInfo,
} from '@/lib/game/adventure/adventure';
import { calculateBattleWithLogs } from '@/lib/game/adventure/adventureBattleNew';
import {
  STAMINA_CONFIG,
  canEnterAdventure,
  createAdventureSession,
  canMoveInAdventure,
  consumeStaminaForMove,
  recoverStaminaFromBattle,
  endAdventureSession,
  getCooldownRemaining,
  getEnemyTierFromType,
} from '@/lib/game/adventure/adventureStamina';
import { calculatePlayerCombatPower } from '@/lib/game/utils/combatPower';
import { getMaxExperience } from '@/lib/game/cultivation/cultivation';
import { getRandomEvent } from '@/lib/game/events/events';
import { GrowthStats } from '@/lib/game/types';
import { processExperienceGain } from '@/lib/game/utils/experienceSystem';
import { 
  spiritStoneItems, 
  breakthroughItems, 
  getRandomItem 
} from '@/lib/game/utils/items';
import { updateTaskProgress } from '@/lib/game/utils/expansionLogic';
import { 
  DEFAULT_PROTAGONIST_EXTENSION,
  getDeathMessage,
  DeathCause,
  DeathState,
} from '@/lib/game/typesExtension';
import { applyMentalChange } from '@/lib/game/utils/expansionLogic';
// 碎片系统
import { 
  FragmentDropData,
  createEmptyFragmentInventory,
  addFragmentToInventory,
  generateFragmentDrop,
} from '@/lib/game/utils/fragmentSystem';
// 统计系统
import { statisticsManager, StatisticsEventType } from '@/lib/game/statistics/statisticsSystem';
import { gameSystems } from '@/lib/game/utils/gameSystems';
import { getAvailableDifficultiesForRealm } from '@/lib/data/realmData';
import { applyGrowthStatChanges, getGrowthStatCap } from '@/lib/game/utils/realmSystem';
import { consumeGameTime, ACTION_TIME_COST, createCooldown } from '@/lib/game/time/timeSystem';
import { isNewbie } from '@/lib/game/taskSystem';
import { getTerminology } from '@/lib/game/utils/terminology';
import { 
  GameState, 
  MessageRecord, 
  InventoryItem,
  DungeonConfig,
  CharacterStats,
  createInventoryItem,
  ActiveBattleState,
  CellType,
  BattleResult,
  getFinalStats,
  ItemRarity,
  ItemDefinition,
  Technique,
  Equipment,
  EnemyTier,
} from '@/lib/game/types';

import { addToInventory } from '../utils/inventoryUtils';
// 行动力系统

interface UseGameAdventureProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addMessageInternal: (
    messages: MessageRecord[],
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ) => MessageRecord[];
}

export interface UseGameAdventureReturn {
  startExperience: () => void;
  handleEventChoice: (choiceIndex: number) => void;
  getDifficulties: () => DungeonConfig[];
  startAdventure: (config: DungeonConfig) => void;
  quickSweep: (config: DungeonConfig) => void;
  exitAdventure: (exitType?: 'completed' | 'stamina_exhausted' | 'quit' | 'fled') => void;
  moveInAdventure: (row: number, col: number) => void;
  clearLastResult: () => void;
  /** 处理战斗结束 */
  handleBattleEnd: (result: { victory: boolean; fled?: boolean; playerHpAfter: number; playerMpAfter?: number }) => void;
  /** 切换自动战斗模式 */
  toggleAutoBattle: () => void;
}

interface UseGameAdventureProps {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
  addMessageInternal: (
    messages: MessageRecord[],
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ) => MessageRecord[];
}

export function useGameAdventure({
  gameState,
  setGameState,
  addMessageInternal,
}: UseGameAdventureProps): UseGameAdventureReturn {
  
  // 开始历练
  const startExperience = useCallback(() => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const now = Date.now();
      // 注意：CD在handleEventChoice完成后设置，而不是点击时立即设置
      
      return {
        ...prev,
        currentEvent: getRandomEvent(prev.protagonist.world.type),
        lastActionResult: null,
        adventureGrid: null,
        adventurePosition: null,
        lastExploreTime: now,
      };
    });
  }, [setGameState]);

  // 处理历练选择
  const handleEventChoice = useCallback((choiceIndex: number) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.currentEvent) return prev;
      
      const now = Date.now();
      // 历练完成后设置CD
      const newTimeSystem = prev.timeSystem ? {
        ...prev.timeSystem,
        realTime: {
          ...prev.timeSystem.realTime,
          exploreCooldown: createCooldown(30000, now),
        },
        gameTime: consumeGameTime(prev.timeSystem.gameTime, ACTION_TIME_COST.explore),
      } : null;
      
      const choice = prev.currentEvent.choices[choiceIndex];
      
      // 检查是否是战斗选项
      if (choice.battle) {
        const enemyLevel = prev.protagonist.level + (choice.battle.levelOffset || 0);
        const isBoss = choice.battle.enemyType === 'boss';
        
        const tempConfig: DungeonConfig = {
          rows: 5,
          cols: 5,
          difficulty: prev.protagonist.level,
          realmName: '历练',
          enemyLevelMin: enemyLevel,
          enemyLevelMax: enemyLevel,
          rewardMultiplier: 1,
          portalCount: 0,
        };
        
        const enemyInfo = { name: isBoss ? '强敌' : '敌人', level: enemyLevel };
        const { result, battleState } = calculateBattleWithLogs(
          prev.protagonist,
          'enemy' as any,
          enemyInfo.name,
          enemyLevel,
          tempConfig
        );
        
        if (result.victory) {
          // 战斗胜利：属性加成进入可成长属性
          const growthCap = getGrowthStatCap(prev.protagonist.level);
          const newStats = choice.effects.stats 
            ? applyGrowthStatChanges(
                prev.protagonist.stats,
                choice.effects.stats as Partial<GrowthStats>,
                growthCap
              )
            : prev.protagonist.stats;
          
          let newInventory = [...(prev.protagonist.inventory || [])];
          if (choice.effects.items) {
            for (const item of choice.effects.items) {
              newInventory = addToInventory(newInventory, item);
            }
          }
          if (result.rewards?.items) {
            for (const item of result.rewards.items) {
              newInventory = addToInventory(newInventory, item);
            }
          }
          
          // 【关键修复】处理碎片掉落 - 添加到玩家库存
          const newFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
          if (result.rewards?.fragments) {
            for (const fragment of result.rewards.fragments as FragmentDropData[]) {
              addFragmentToInventory(newFragmentInventory, fragment);
            }
          }
          
          const eventExp = choice.effects.experience || 0;
          const battleExp = result.rewards?.experience || 0;
          const totalExpGain = eventExp + battleExp;
          const maxExp = getMaxExperience(prev.protagonist.level);
          
          const expResult = processExperienceGain(
            prev.protagonist.experience, 
            totalExpGain, 
            maxExp, 
            prev.protagonist.overflowExperience
          );
          const finalExp = expResult.newExp;
          const newOverflowExp = expResult.newOverflow;
          
          const rewards: MessageRecord['rewards'] = {};
          if (choice.effects.stats) rewards.stats = choice.effects.stats;
          if (choice.effects.items || result.rewards?.items) {
            rewards.items = [...(choice.effects.items || []), ...(result.rewards?.items || [])];
          }
          if (eventExp + battleExp > 0) rewards.experience = eventExp + battleExp;
          
          // 使用统计管理器更新统计数据
          const fragmentCount = result.rewards?.fragments?.length || 0;
          const newStatistics = statisticsManager.processEvents(prev.statistics, [
            { type: 'enemy_killed' },
            ...(isBoss ? [{ type: 'boss_killed' as StatisticsEventType }] : []),
            ...(fragmentCount > 0 ? [{ type: 'fragment_collected' as StatisticsEventType, payload: { count: fragmentCount } }] : []),
          ]);
          
          let newFactionProgress = prev.protagonist.factionProgress;
          if (prev.protagonist.factionId && newFactionProgress) {
            newFactionProgress = updateTaskProgress(newFactionProgress, 'explore', 'dungeon', 1);
            newFactionProgress = updateTaskProgress(newFactionProgress, 'kill', 'any', 1);
          }
          
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              stats: newStats,
              inventory: newInventory,
              experience: finalExp,
              overflowExperience: newOverflowExp,
              activeEffects: prev.protagonist.activeEffects,
              currentHp: result.playerHpAfter ?? prev.protagonist.currentHp,
              factionProgress: newFactionProgress,
              fragmentInventory: newFragmentInventory,
            },
            statistics: newStatistics,
            factionProgress: newFactionProgress,
            lastActionResult: {
              success: true,
              message: `战斗胜利！${choice.result}`,
              rewards: { items: result.rewards?.items },
            },
            battleState,
            currentEvent: null,
            timeSystem: newTimeSystem,
            messages: addMessageInternal(prev.messages, 'success', '历练战斗', `击败了${enemyInfo.name}(Lv.${enemyLevel})！${choice.result}`, undefined, rewards),
          };
        } else {
          const healAmount = Math.floor(prev.protagonist.maxHp * 0.3);
          
          const currentMentalState = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
          const { newState: newMentalState, message: mentalMsg } = applyMentalChange(
            currentMentalState,
            'battle_defeat'
          );
          
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              currentHp: healAmount,
              mentalState: newMentalState,
            },
            lastActionResult: {
              success: false,
              message: `战斗失败！`,
            },
            battleState,
            currentEvent: null,
            timeSystem: newTimeSystem,
            messages: addMessageInternal(prev.messages, 'failure', '历练战斗', `被${enemyInfo.name}(Lv.${enemyLevel})击败，狼狈逃走...${mentalMsg ? ' ' + mentalMsg : ''}`),
          };
        }
      }
      
      // 普通事件处理：属性加成进入可成长属性
      const growthCap = getGrowthStatCap(prev.protagonist.level);
      const newStats = choice.effects.stats 
        ? applyGrowthStatChanges(
            prev.protagonist.stats,
            choice.effects.stats as Partial<GrowthStats>,
            growthCap
          )
        : prev.protagonist.stats;
      
      let newInventory = [...(prev.protagonist.inventory || [])];
      if (choice.effects.items) {
        for (const item of choice.effects.items) {
          newInventory = addToInventory(newInventory, item);
        }
      }
      
      const expGain = choice.effects.experience || 0;
      const maxExp = getMaxExperience(prev.protagonist.level);
      
      const expResult = processExperienceGain(
        prev.protagonist.experience,
        expGain,
        maxExp,
        prev.protagonist.overflowExperience
      );
      const finalExp = expResult.newExp;
      const newOverflowExp = expResult.newOverflow;
      
      let messageType: MessageRecord['type'] = 'info';
      if (choice.effects.stats) {
        const statsValues = Object.values(choice.effects.stats as Partial<GrowthStats>);
        const hasNegative = statsValues.some(v => v < 0);
        const hasPositive = statsValues.some(v => v > 0);
        if (hasNegative && !hasPositive) {
          messageType = 'failure';
        } else if (hasPositive && !hasNegative) {
          messageType = 'success';
        } else {
          messageType = 'warning';
        }
      }
      
      const rewards: MessageRecord['rewards'] = {};
      if (choice.effects.stats) rewards.stats = choice.effects.stats;
      if (choice.effects.items) rewards.items = choice.effects.items;
      if (choice.effects.experience) rewards.experience = choice.effects.experience;
      
      let newFactionProgress = prev.protagonist.factionProgress;
      if (prev.protagonist.factionId && newFactionProgress) {
        newFactionProgress = updateTaskProgress(newFactionProgress, 'explore', 'dungeon', 1);
      }
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          stats: newStats,
          inventory: newInventory,
          activeEffects: prev.protagonist.activeEffects,
          experience: finalExp,
          overflowExperience: newOverflowExp,
          statCapBonuses: prev.protagonist.statCapBonuses,
          factionProgress: newFactionProgress,
        },
        factionProgress: newFactionProgress,
        lastActionResult: {
          success: true,
          message: choice.result,
          rewards: choice.effects.items ? { items: choice.effects.items } : undefined,
        },
        currentEvent: null,
        timeSystem: newTimeSystem,
        messages: addMessageInternal(prev.messages, messageType, prev.currentEvent?.title || '历练', choice.result, undefined, rewards),
      };
    });
  }, [addMessageInternal, setGameState]);

  // 获取可用难度列表
  const getDifficulties = useCallback(() => {
    if (!gameState.protagonist) return [];
    const difficulties = getAvailableDifficultiesForRealm(
      gameState.protagonist.world.realmSystem, 
      gameState.protagonist.level,
      gameState.statistics?.clearedDifficulties || []
    );
    
    // ========================================
    // 新手难度机缘：首次机缘时添加引导难度
    // 当新手任务全部完成后，隐藏新手难度
    // ========================================
    const isPlayerNewbie = gameState.protagonist && gameState.statistics 
      ? isNewbie(gameState.protagonist, gameState.statistics, gameState.completedTutorialTaskIds || [])
      : true;
    
    if (isPlayerNewbie && !gameState.hasCompletedNoviceAdventure && difficulties.length > 0) {
      const playerLevel = gameState.protagonist.level;
      const noviceLevel = Math.max(1, playerLevel - 2);
      const noviceDifficulty: DungeonConfig = {
        rows: 5,
        cols: 5,
        difficulty: noviceLevel,
        realmName: '【新手引导】初试机缘',
        enemyLevelMin: Math.max(1, noviceLevel - 1),
        enemyLevelMax: noviceLevel + 1,
        rewardMultiplier: 0.8, // 奖励略低
        portalCount: 1,
        difficultyLevel: 'easy',
        requiredPower: Math.floor((difficulties[0].requiredPower || 100) * 0.5), // 更低的战力要求
        staminaCost: 5, // 更低的体力消耗
        isNovice: true // 标记为新手难度
      };
      
      // 将新手难度插入到列表最前面
      return [noviceDifficulty, ...difficulties];
    }
    
    return difficulties;
  }, [gameState.protagonist, gameState.hasCompletedNoviceAdventure, gameState.statistics, gameState.completedTutorialTaskIds]);

  // 开始秘境探索
  const startAdventure = useCallback((config: DungeonConfig) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      // ========================================
      // 行动力系统：检查进入条件（冷却时间 + 等级）
      // ========================================
      const lastExitTime = prev.adventureSession?.lastExitTime || 0;
      const enterCheck = canEnterAdventure(prev.protagonist, config, lastExitTime);
      
      if (!enterCheck.canEnter) {
        return {
          ...prev,
          messages: addMessageInternal(prev.messages, 'warning', '无法进入', enterCheck.reason || '无法进入机缘'),
        };
      }
      
      // 创建行动力会话
      const newSession = createAdventureSession(prev.protagonist, lastExitTime);
      
      const grid = generateAdventureGrid(config, prev.protagonist.world.type);
      const startCol = Math.floor(config.cols / 2);
      
      const dungeonName = config.realmName;
      
      return {
        ...prev,
        adventureGrid: grid,
        adventurePosition: { row: 0, col: startCol },
        adventureConfig: config,
        adventurePhase: 'playing',
        adventureLoot: [],
        adventureExperience: 0,
        adventureFragments: [],
        adventureSession: newSession,
        currentEvent: null,
        lastActionResult: null,
        battleState: null,
        messages: addMessageInternal(
          prev.messages, 
          'info', 
          '进入秘境', 
          `进入了${dungeonName}难度的秘境，开始探索...\n行动力：${newSession.currentStamina}/${newSession.maxStamina}`
        ),
      };
    });
  }, [setGameState, addMessageInternal]);

  // 一键扫荡 - 需要先通关一次机缘（完成探索）
  const quickSweep = useCallback((config: DungeonConfig) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      // 获取世界术语
      const terminology = getTerminology(prev.protagonist.world.type);
      
      // 【V2修改】检查是否已通关该难度的机缘（登记解锁机制）
      const clearedDifficulties = prev.statistics.clearedDifficulties || [];
      if (!clearedDifficulties.includes(config.difficulty)) {
        return {
          ...prev,
          messages: addMessageInternal(
            prev.messages, 
            'warning', 
            '扫荡失败', 
            '需要先通关该难度的机缘才能使用扫荡功能！'
          ),
        };
      }
      
      const staminaCost = config.staminaCost || 10;
      const currentStamina = prev.protagonist.stamina ?? 100;
      
      if (currentStamina < staminaCost) {
        return {
          ...prev,
          messages: addMessageInternal(
            prev.messages, 
            'warning', 
            '扫荡失败', 
            `体力不足！当前体力 ${currentStamina}，需要体力 ${staminaCost}`
          ),
        };
      }
      
      const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      
      const loot: InventoryItem[] = [];
      let totalExp = 0;
      let totalSpiritStones = 0;
      const statGains: Partial<GrowthStats> = {};
      
      const totalCells = config.rows * config.cols;
      const enemyCount = Math.floor(totalCells * 0.1);
      const treasureCount = Math.floor(totalCells * 0.05);
      const sweepEfficiency = 0.5;
      
      for (let i = 0; i < enemyCount; i++) {
        const enemyLevel = config.enemyLevelMin + Math.floor(Math.random() * (config.enemyLevelMax - config.enemyLevelMin + 1));
        totalExp += Math.floor((enemyLevel * 10 + 20) * config.rewardMultiplier * sweepEfficiency);
        totalSpiritStones += Math.floor((enemyLevel * 2 + 5) * config.rewardMultiplier * sweepEfficiency);
        
        if (Math.random() < 0.08) {
          const item = getRandomItem(config.difficulty);
          if (item) {
            loot.push(createInventoryItem(item, 1));
          }
        }
      }
      
      for (let i = 0; i < treasureCount; i++) {
        totalSpiritStones += Math.floor(random(20, 50) * config.rewardMultiplier * sweepEfficiency);
        if (Math.random() < 0.15) {
          const item = getRandomItem(config.difficulty);
          if (item) {
            loot.push(createInventoryItem(item, 1));
          }
        }
      }
      
      const bossExp = Math.floor((config.difficulty * 20 + 50) * config.rewardMultiplier * sweepEfficiency);
      totalExp += bossExp;
      
      const breakthroughPill = breakthroughItems[Math.min(Math.floor(config.difficulty / 30), 2)];
      loot.push(createInventoryItem(breakthroughPill, 1));
      
      let finalInventory = [...(prev.protagonist.inventory || [])];
      
      const spiritStoneItem = spiritStoneItems[0];
      if (spiritStoneItem) {
        finalInventory = addToInventory(finalInventory, createInventoryItem(spiritStoneItem, totalSpiritStones));
      }
      
      for (const item of loot) {
        finalInventory = addToInventory(finalInventory, item);
      }
      
      // 【关键修复】使用碎片系统，传入玩家等级限制稀有度
      const playerLevel = prev.protagonist.level;
      const luck = getFinalStats(prev.protagonist.stats).幸运 || 0;
      const worldType = prev.protagonist.world.type;
      const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
      const fragmentDrops: FragmentDropData[] = [];
      const droppedTechniques: Technique[] = [];
      const droppedEquipments: Equipment[] = [];
      
      // 为每个敌人生成碎片掉落
      for (let i = 0; i < enemyCount; i++) {
        const enemyLevel = config.enemyLevelMin + Math.floor(Math.random() * (config.enemyLevelMax - config.enemyLevelMin + 1));
        const drop = generateFragmentDrop(enemyLevel, 'normal', luck, worldType, playerLevel);
        if (drop.fragments.length > 0) {
          fragmentDrops.push(...drop.fragments);
          for (const fragment of drop.fragments) {
            addFragmentToInventory(currentFragmentInventory, fragment);
          }
        }
        // 处理完整物品掉落
        for (const completeItem of drop.completeItems) {
          if (completeItem.type === 'technique') {
            droppedTechniques.push(completeItem.item as Technique);
          } else {
            droppedEquipments.push(completeItem.item as Equipment);
          }
        }
      }
      
      // Boss 掉落碎片
      const bossDrop = generateFragmentDrop(config.difficulty, 'boss', luck, worldType, playerLevel);
      if (bossDrop.fragments.length > 0) {
        fragmentDrops.push(...bossDrop.fragments);
        for (const fragment of bossDrop.fragments) {
          addFragmentToInventory(currentFragmentInventory, fragment);
        }
      }
      // 处理 Boss 完整物品掉落
      for (const completeItem of bossDrop.completeItems) {
        if (completeItem.type === 'technique') {
          droppedTechniques.push(completeItem.item as Technique);
        } else {
          droppedEquipments.push(completeItem.item as Equipment);
        }
      }
      
      // 【已移除】直接掉落完整功法/装备的代码 - 改为碎片系统
      
      statGains.体质 = random(0, 1);
      statGains.意志 = random(0, 1);
      
      // 处理完整物品掉落：添加到主角背包
      const newTechniques = droppedTechniques.length > 0 
        ? [...prev.protagonist.techniques, ...droppedTechniques]
        : prev.protagonist.techniques;
      const newEquipments = droppedEquipments.length > 0
        ? [...prev.protagonist.equipments, ...droppedEquipments]
        : prev.protagonist.equipments;
      
      const newStatistics = {
        ...prev.statistics,
        totalAdventuresCompleted: prev.statistics.totalAdventuresCompleted + 1,
        totalEnemiesKilled: prev.statistics.totalEnemiesKilled + enemyCount + 1,
        // 记录通关的机缘难度
        clearedDifficulties: prev.statistics.clearedDifficulties?.includes(config.difficulty)
          ? prev.statistics.clearedDifficulties
          : [...(prev.statistics.clearedDifficulties || []), config.difficulty],
      };
      
      // 【已移除】功法/装备名称统计 - 改为碎片系统，合成时再统计
      
      const rewards: MessageRecord['rewards'] = {
        experience: totalExp,
        stats: statGains,
        items: loot,
        fragments: fragmentDrops.length > 0 ? fragmentDrops : undefined,
        // 【新增】完整物品掉落
        techniques: droppedTechniques.length > 0 ? droppedTechniques : undefined,
        equipments: droppedEquipments.length > 0 ? droppedEquipments : undefined,
      };
      
      let newFactionProgress = prev.protagonist.factionProgress;
      if (prev.protagonist.factionId && newFactionProgress) {
        newFactionProgress = updateTaskProgress(newFactionProgress, 'explore', 'dungeon', 1);
        newFactionProgress = updateTaskProgress(newFactionProgress, 'kill', 'any', enemyCount + 1);
      }
      
      gameSystems.triggerAdventureCompleted(
        config.realmName,
        config.difficultyLevel || 'normal',
        { items: loot }
      );
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          inventory: finalInventory,
          // 【新增】完整物品掉落（普通/稀有品质直接获得完整物品）
          techniques: newTechniques,
          equipments: newEquipments,
          experience: prev.protagonist.experience + totalExp,
          stats: {
            base: prev.protagonist.stats.base,
            growth: {
              ...prev.protagonist.stats.growth,
              体质: prev.protagonist.stats.growth.体质 + (statGains.体质 || 0),
              意志: prev.protagonist.stats.growth.意志 + (statGains.意志 || 0),
            },
          },
          stamina: currentStamina - staminaCost,
          factionProgress: newFactionProgress,
          // 更新碎片库存
          fragmentInventory: currentFragmentInventory,
        },
        factionProgress: newFactionProgress,
        statistics: newStatistics,
        messages: addMessageInternal(
          prev.messages, 
          'success', 
          '扫荡成功', 
          `扫荡${config.realmName}秘境完成！获得 ${totalExp} 经验、${totalSpiritStones} ${terminology.resource}、${loot.length} 件物品（消耗${staminaCost}体力）`,
          undefined,
          rewards
        ),
      };
    });
  }, [addMessageInternal, setGameState]);

  // 退出秘境
  // exitType:
  //   'completed' - 打败Boss完成机缘 → 100%战利品
  //   'stamina_exhausted' - 步数耗尽离开 → 100%战利品
  //   'quit' - 点击按钮主动退出 → 50%惩罚
  //   'fled' - 被敌人击败逃离 → 50%惩罚
  const exitAdventure = useCallback((exitType: 'completed' | 'stamina_exhausted' | 'quit' | 'fled' = 'quit') => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist) return prev;
      
      const currentLoot = prev.adventureLoot || [];
      const currentExperience = prev.adventureExperience || 0;
      const currentFragments = prev.adventureFragments || [];
      
      // 根据退出类型决定战利品和经验保留比例
      let finalInventory = [...(prev.protagonist.inventory || [])];
      const keptLoot: InventoryItem[] = [];
      let keptExperience = 0;
      let keptFragments: FragmentDropData[] = [];
      
      if (exitType === 'completed' || exitType === 'stamina_exhausted') {
        // 完成机缘或步数耗尽：保留100%战利品和经验
        for (const item of currentLoot) {
          finalInventory = addToInventory(finalInventory, item);
          keptLoot.push(item);
        }
        keptExperience = currentExperience;
        keptFragments = currentFragments;
        // 碎片已经在 fragmentInventory 中，不需要额外处理
      } else {
        // 中途逃离：保留50%战利品和经验
        const keepRatio = 0.5;
        
        // 处理战利品：每个物品数量减半（向下取整）
        for (const item of currentLoot) {
          const keptQuantity = Math.floor(item.quantity * keepRatio);
          if (keptQuantity > 0) {
            const keptItem = { ...item, quantity: keptQuantity };
            finalInventory = addToInventory(finalInventory, keptItem);
            keptLoot.push(keptItem);
          }
        }
        
        // 经验值减半（向下取整）
        keptExperience = Math.floor(currentExperience * keepRatio);
        
        // 碎片保留50%
        const fragmentKeepCount = Math.floor(currentFragments.length * keepRatio);
        keptFragments = currentFragments.slice(0, fragmentKeepCount);
        
        // 从 fragmentInventory 中移除未保留的碎片
        const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
        const lostFragments = currentFragments.slice(fragmentKeepCount);
        for (const lostFragment of lostFragments) {
          // 从库存中移除一个对应的碎片
          const fragmentData = lostFragment.fragment;
          if (fragmentData) {
            if (lostFragment.type === 'technique') {
              const idx = currentFragmentInventory.techniqueFragments.findIndex(
                f => f.id === fragmentData.id
              );
              if (idx !== -1) {
                currentFragmentInventory.techniqueFragments.splice(idx, 1);
              }
            } else {
              const idx = currentFragmentInventory.equipmentFragments.findIndex(
                f => f.id === fragmentData.id
              );
              if (idx !== -1) {
                currentFragmentInventory.equipmentFragments.splice(idx, 1);
              }
            }
          }
        }
      }
      
      // 构建详细的物品列表信息
      let lootDetails = '';
      
      if (keptLoot.length > 0) {
        // 获取世界术语
        const terminology = getTerminology(prev.protagonist.world.type);
        
        // 统计每种物品的数量，并使用统一术语
        const itemCounts = new Map<string, { name: string; quantity: number }>();
        for (const item of keptLoot) {
          const id = item.definition.id;
          const existing = itemCounts.get(id);
          // 灵石使用统一术语
          const displayName = id === 'spirit_stone' ? terminology.resource : item.definition.name;
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            itemCounts.set(id, { name: displayName, quantity: item.quantity });
          }
        }
        
        // 格式化显示
        const lootList = Array.from(itemCounts.values())
          .map(item => `${item.name}x${item.quantity}`)
          .join('、');
        lootDetails = `\n📦 获得物品：${lootList}`;
      }
      
      // 构建碎片列表信息（合并显示）
      let fragmentDetails = '';
      if (keptFragments.length > 0) {
        // 合并同类碎片
        const fragmentCounts = new Map<string, { name: string; rarity: ItemRarity; count: number }>();
        for (const fragment of keptFragments) {
          const name = fragment.sourceName || `${fragment.rarity}${fragment.type === 'technique' ? '功法残本' : '装备残片'}`;
          const existing = fragmentCounts.get(name);
          if (existing) {
            existing.count += fragment.count;
          } else {
            fragmentCounts.set(name, { 
              name, 
              rarity: fragment.rarity, 
              count: fragment.count 
            });
          }
        }
        
        const fragmentList = Array.from(fragmentCounts.values())
          .map(f => `「${f.name}」${f.count > 1 ? `x${f.count}` : ''}`)
          .join('、');
        fragmentDetails = `\n📜 获得碎片：${fragmentList}`;
      }
      
      // 根据退出类型决定消息
      let messageTitle: string;
      let messageContent: string;
      let messageType: 'success' | 'warning';
      
      if (exitType === 'completed') {
        // 完成机缘（打败Boss）
        messageTitle = '完成机缘';
        const hasRewards = keptLoot.length > 0 || keptExperience > 0 || keptFragments.length > 0;
        if (hasRewards) {
          messageContent = `成功击败Boss，完成了机缘探索！${lootDetails}${fragmentDetails}\n⭐ 获得经验：${keptExperience}`;
        } else {
          messageContent = '成功击败Boss，完成了机缘探索！';
        }
        messageType = 'success';
      } else if (exitType === 'stamina_exhausted') {
        // 步数耗尽离开
        messageTitle = '离开秘境';
        const hasRewards = keptLoot.length > 0 || keptExperience > 0 || keptFragments.length > 0;
        if (hasRewards) {
          messageContent = `步数耗尽，离开了秘境。${lootDetails}${fragmentDetails}\n⭐ 获得经验：${keptExperience}`;
        } else {
          messageContent = '步数耗尽，离开了秘境。';
        }
        messageType = 'success';
      } else if (exitType === 'quit') {
        // 主动退出
        messageTitle = '退出秘境';
        const hasRewards = keptLoot.length > 0 || keptExperience > 0 || keptFragments.length > 0;
        if (hasRewards) {
          messageContent = `主动退出了秘境，只保留了50%的战利品${lootDetails}${fragmentDetails}\n⭐ 获得经验：${keptExperience}（50%）`;
        } else {
          messageContent = '主动退出了秘境。';
        }
        messageType = 'warning';
      } else {
        // 被击败逃离
        messageTitle = '逃离秘境';
        const hasRewards = keptLoot.length > 0 || keptExperience > 0 || keptFragments.length > 0;
        if (hasRewards) {
          messageContent = `被敌人击败，匆忙逃离了秘境，只保留了50%的战利品${lootDetails}${fragmentDetails}\n⭐ 获得经验：${keptExperience}（50%）`;
        } else {
          messageContent = '被敌人击败，匆忙逃离了秘境...';
        }
        messageType = 'warning';
      }
      
      const newStatistics = {
        ...prev.statistics,
        totalAdventuresCompleted: prev.statistics.totalAdventuresCompleted + 1,
        // 记录通关的机缘难度（只有完成才记录）
        clearedDifficulties: exitType === 'completed' && prev.adventureConfig?.difficulty
          ? (prev.statistics.clearedDifficulties?.includes(prev.adventureConfig.difficulty)
              ? prev.statistics.clearedDifficulties
              : [...(prev.statistics.clearedDifficulties || []), prev.adventureConfig.difficulty])
          : prev.statistics.clearedDifficulties,
      };
      
      gameSystems.triggerAdventureCompleted(
        prev.adventureConfig?.realmName || '秘境',
        prev.adventureConfig?.difficultyLevel || 'normal',
        { items: keptLoot }
      );
      
      // ========================================
      // 检查是否是新手难度机缘，设置完成标记
      // 只有打败Boss完成新手机缘才设置标记
      // ========================================
      const isNoviceAdventure = prev.adventureConfig?.isNovice === true;
      const isSuccessfulExit = exitType === 'completed';
      const hasCompletedNoviceAdventure = prev.hasCompletedNoviceAdventure || (isNoviceAdventure && isSuccessfulExit);
      
      // 新手引导完成提示（首次完成时显示）
      let finalMessageContent = messageContent;
      let showNoviceCompletionDialog = false;
      if (isNoviceAdventure && isSuccessfulExit && !prev.hasCompletedNoviceAdventure) {
        finalMessageContent += '\n\n🎉 新手引导已完成！你现在可以选择更高难度的机缘进行探索。';
        showNoviceCompletionDialog = true;
      }
      
      // 构建rewards用于消息面板显示
      const rewards = keptLoot.length > 0 || keptExperience > 0 || keptFragments.length > 0 ? {
        items: keptLoot.length > 0 ? keptLoot : undefined,
        experience: keptExperience > 0 ? keptExperience : undefined,
        fragments: keptFragments.length > 0 ? keptFragments : undefined,
      } : undefined;
      
      // 获取更新后的碎片库存
      const finalFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
      
      // ========================================
      // 行动力系统：结束会话并设置退出冷却
      // ========================================
      const endedSession = prev.adventureSession 
        ? endAdventureSession(prev.adventureSession) 
        : null;
      
      return {
        ...prev,
        adventureGrid: null,
        adventurePosition: null,
        adventureConfig: null,
        adventureLoot: [],
        adventureExperience: 0, // 清空待结算经验
        adventureFragments: [], // 清空碎片战利品
        adventureSession: endedSession, // 保存结束的会话（含退出时间）
        adventurePhase: 'select',
        battleState: null,
        statistics: newStatistics,
        hasCompletedNoviceAdventure, // 更新完成标记
        showNoviceCompletionDialog, // 新手引导完成弹窗标记
        protagonist: {
          ...prev.protagonist,
          inventory: finalInventory,
          experience: prev.protagonist.experience + keptExperience, // 结算经验值
          fragmentInventory: finalFragmentInventory, // 更新碎片库存
        },
        messages: addMessageInternal(
          prev.messages, 
          messageType, 
          messageTitle, 
          finalMessageContent,
          undefined,
          rewards
        ),
      };
    });
  }, [addMessageInternal, setGameState]);

  // 移动到指定方向
  const moveInAdventure = useCallback((row: number, col: number) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.adventureGrid || !prev.adventurePosition || !prev.adventureConfig) {
        return prev;
      }
      
      // ========================================
      // 行动力系统：检查是否可以移动
      // ========================================
      const staminaCheck = canMoveInAdventure(prev.adventureSession);
      const targetCellPreview = prev.adventureGrid[row]?.[col];
      const isEnemyCell = targetCellPreview && ['enemy', 'elite', 'miniboss', 'boss'].includes(targetCellPreview.type);
      
      // 步数不足时的特殊处理
      if (!staminaCheck.canMove) {
        // 如果步数为0但目标是敌人格子，允许移动（战斗可以恢复步数）
        if (prev.adventureSession?.currentStamina === 0 && isEnemyCell) {
          // 允许移动到敌人格子，跳过行动力消耗（战斗胜利会恢复）
          // 继续执行下面的逻辑
        } else {
          return {
            ...prev,
            messages: addMessageInternal(prev.messages, 'warning', '无法移动', '步数耗尽，只能攻击敌人恢复步数'),
          };
        }
      }
      
      // 消耗行动力（步数为0时不消耗，战斗胜利会恢复）
      const updatedSession = prev.adventureSession ? { ...prev.adventureSession } : null;
      if (updatedSession && updatedSession.currentStamina > 0) {
        consumeStaminaForMove(updatedSession);
      }
      
      const { row: currentRow, col: currentCol } = prev.adventurePosition;
      const grid = prev.adventureGrid;
      const rows = grid.length;
      const cols = grid[0]?.length || 0;
      
      // 检查是否是相邻格子
      if (Math.abs(row - currentRow) + Math.abs(col - currentCol) !== 1) {
        // 无效移动，返还行动力
        return prev;
      }
      
      // 检查边界
      if (row < 0 || row >= rows || col < 0 || col >= cols) {
        // 无效移动，返还行动力
        return prev;
      }
      
      const targetRow = row;
      const targetCol = col;
      const targetCell = grid[targetRow][targetCol];
      
      // ========================================
      // 检查格子是否已访问/已清理
      // 已访问的格子只移动，不触发效果
      // 但传送门例外：即使已访问也要传送
      // ========================================
      if ((targetCell.visited || targetCell.cleared) && targetCell.type !== 'portal') {
        const newGrid = grid.map((r, ri) => 
          r.map((c, ci) => 
            ri === targetRow && ci === targetCol ? { ...c, visited: true } : c
          )
        );
        
        return {
          ...prev,
          adventureGrid: newGrid,
          adventurePosition: { row: targetRow, col: targetCol },
          adventureSession: updatedSession,
        };
      }
      
      // 注意：移动本身不扣血，只有战斗失败才会扣除HP
      
      // 处理不同格子类型
      switch (targetCell.type) {
        case 'enemy':
        case 'elite':
        case 'miniboss':
        case 'boss': {
          // 根据行位置计算敌人等级 - 越靠近Boss，敌人等级越高
          // 第一行是起点，最后一行是Boss
          const totalRows = grid.length;
          const rowProgress = targetRow / (totalRows - 1); // 0.0 ~ 1.0
          const { enemyLevelMin, enemyLevelMax } = prev.adventureConfig;
          
          // 基于行进度计算基础等级范围
          const rowBasedMin = Math.floor(enemyLevelMin + (enemyLevelMax - enemyLevelMin) * rowProgress * 0.6);
          const rowBasedMax = Math.floor(enemyLevelMin + (enemyLevelMax - enemyLevelMin) * (rowProgress * 0.6 + 0.4));
          
          // 在行基础等级范围内随机，增加一些波动
          const baseLevel = rowBasedMin + Math.floor(Math.random() * (rowBasedMax - rowBasedMin + 1));
          
          // 根据敌人类型调整等级
          let enemyLevel = baseLevel;
          if (targetCell.type === 'elite') {
            enemyLevel += 2;
          } else if (targetCell.type === 'miniboss') {
            enemyLevel += 5;
          } else if (targetCell.type === 'boss') {
            enemyLevel = enemyLevelMax + 2; // Boss比最高级敌人略高
          }
          
          const isBoss = targetCell.type === 'boss';
          
          // ========================================
          // 手动战斗模式：设置战斗状态，等待玩家操作
          // ========================================
          if (!prev.autoBattle) {
            // 从 targetCell.content 解析真实敌人名称
            const enemyContent = targetCell.content || '';
            const parsedEnemy = parseEnemyInfo(enemyContent);
            const actualEnemyName = parsedEnemy.name || (isBoss ? 'Boss' : '敌人');
            const actualEnemyLevel = parsedEnemy.level || enemyLevel;
            
            const activeBattle: ActiveBattleState = {
              cellType: targetCell.type,
              enemyName: actualEnemyName,
              enemyLevel: actualEnemyLevel,
              cellPosition: { row: targetRow, col: targetCol },
              isActive: true,
            };
            
            return {
              ...prev,
              activeBattle,
              adventurePosition: { row: targetRow, col: targetCol },
              adventureSession: updatedSession, // 保存行动力消耗
              messages: addMessageInternal(
                prev.messages,
                'info',
                '遭遇敌人',
                `遭遇了${actualEnemyName}(Lv.${actualEnemyLevel})！准备战斗...`,
              ),
            };
          }
          
          // ========================================
          // 自动战斗模式：自动执行战斗
          // ========================================
          const { result, battleState } = calculateBattleWithLogs(
            prev.protagonist,
            targetCell.type,
            isBoss ? 'Boss' : '敌人',
            enemyLevel,
            prev.adventureConfig
          );
          
          if (result.victory) {
            // ========================================
            // 行动力系统：战斗胜利恢复行动力
            // ========================================
            const enemyTier = getEnemyTierFromType(targetCell.type);
            let staminaRecoveryInfo = '';
            if (updatedSession && enemyTier) {
              const recoveryResult = recoverStaminaFromBattle(updatedSession, enemyTier);
              if (recoveryResult.recovery > 0) {
                staminaRecoveryInfo = `\n⚡ 行动力恢复 +${recoveryResult.recovery}（${recoveryResult.staminaBefore}→${recoveryResult.staminaAfter}）`;
              }
            }
            
            // 战利品放入冒险背包，而不是直接放入主角背包
            const newLoot = [...(prev.adventureLoot || [])];
            if (result.rewards?.items) {
              for (const item of result.rewards.items) {
                newLoot.push(item);
              }
            }
            
            // 【关键修复】处理碎片掉落 - 添加到玩家库存和战利品清单
            const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
            const newAdventureFragments = [...(prev.adventureFragments || [])];
            const fragmentCount = result.rewards?.fragments?.length || 0;
            if (result.rewards?.fragments) {
              for (const fragment of result.rewards.fragments as FragmentDropData[]) {
                addFragmentToInventory(currentFragmentInventory, fragment);
                newAdventureFragments.push(fragment);
              }
            }
            
            // 使用统计管理器更新统计数据
            const isElite = targetCell.type === 'elite' || targetCell.type === 'miniboss';
            const newStatistics = statisticsManager.processEvents(prev.statistics, [
              { type: 'enemy_killed' },
              ...(isBoss ? [{ type: 'boss_killed' as StatisticsEventType }] : []),
              ...(isElite ? [{ type: 'elite_killed' as StatisticsEventType }] : []),
              ...(fragmentCount > 0 ? [{ type: 'fragment_collected' as StatisticsEventType, payload: { count: fragmentCount } }] : []),
            ]);
            
            let newFactionProgress = prev.protagonist.factionProgress;
            if (prev.protagonist.factionId && newFactionProgress) {
              newFactionProgress = updateTaskProgress(newFactionProgress, 'kill', 'any', 1);
            }
            
            // 更新格子
            const newGrid = grid.map((r, ri) => 
              r.map((c, ci) => 
                ri === targetRow && ci === targetCol ? { ...c, cleared: true, visited: true } : c
              )
            );
            
            // 经验值放入待结算，机缘结束时统一结算
            const newExperience = (prev.adventureExperience || 0) + (result.rewards?.experience || 0);
            
            return {
              ...prev,
              protagonist: {
                ...prev.protagonist,
                currentHp: result.playerHpAfter ?? prev.protagonist.currentHp,
                // 经验值不在战斗时直接结算，改为机缘结束时结算
                factionProgress: newFactionProgress,
                // 更新碎片库存
                fragmentInventory: currentFragmentInventory,
              },
              statistics: newStatistics,
              factionProgress: newFactionProgress,
              adventureGrid: newGrid,
              adventurePosition: { row: targetRow, col: targetCol },
              adventureLoot: newLoot,
              adventureExperience: newExperience, // 待结算经验值
              adventureFragments: newAdventureFragments, // 碎片战利品
              adventureSession: updatedSession, // 保存行动力消耗
              battleState,
              messages: addMessageInternal(
                prev.messages,
                'success',
                '战斗胜利',
                `击败了${isBoss ? 'Boss' : '敌人'}(Lv.${enemyLevel})！${staminaRecoveryInfo}`,
                undefined,
                result.rewards
              ),
            };
          } else {
            // 战斗失败处理：被踢出机缘
            const healAmount = Math.floor(prev.protagonist.maxHp * 0.3);
            const currentMentalState = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
            const { newState: newMentalState, message: mentalMsg } = applyMentalChange(currentMentalState, 'battle_defeat');
            
            // 计算战利品和经验结算（被击败时丢失50%）
            const currentLoot = prev.adventureLoot || [];
            const currentFragments = prev.adventureFragments || [];
            const currentExperience = prev.adventureExperience || 0;
            const keepRatio = 0.5;
            
            // 处理战利品：每个物品数量减半（向下取整）
            let finalInventory = [...(prev.protagonist.inventory || [])];
            const keptLoot: InventoryItem[] = [];
            for (const item of currentLoot) {
              const keptQuantity = Math.floor(item.quantity * keepRatio);
              if (keptQuantity > 0) {
                const keptItem = { ...item, quantity: keptQuantity };
                finalInventory = addToInventory(finalInventory, keptItem);
                keptLoot.push(keptItem);
              }
            }
            
            // 经验值减半（向下取整）
            const keptExperience = Math.floor(currentExperience * keepRatio);
            
            // 碎片保留50%
            const fragmentKeepCount = Math.floor(currentFragments.length * keepRatio);
            const keptFragments = currentFragments.slice(0, fragmentKeepCount);
            
            // 从 fragmentInventory 中移除未保留的碎片
            const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
            const lostFragments = currentFragments.slice(fragmentKeepCount);
            for (const lostFragment of lostFragments) {
              const fragmentData = lostFragment.fragment;
              if (fragmentData) {
                if (lostFragment.type === 'technique') {
                  const idx = currentFragmentInventory.techniqueFragments.findIndex(
                    f => f.id === fragmentData.id
                  );
                  if (idx !== -1) {
                    currentFragmentInventory.techniqueFragments.splice(idx, 1);
                  }
                } else {
                  const idx = currentFragmentInventory.equipmentFragments.findIndex(
                    f => f.id === fragmentData.id
                  );
                  if (idx !== -1) {
                    currentFragmentInventory.equipmentFragments.splice(idx, 1);
                  }
                }
              }
            }
            
            // 获取世界术语
            const terminology = getTerminology(prev.protagonist.world.type);
            
            // 构建战利品列表信息
            let lootDetails = '';
            if (keptLoot.length > 0) {
              const itemCounts = new Map<string, { name: string; quantity: number }>();
              for (const item of keptLoot) {
                const id = item.definition.id;
                const existing = itemCounts.get(id);
                // 灵石使用统一术语
                const displayName = id === 'spirit_stone' ? terminology.resource : item.definition.name;
                if (existing) {
                  existing.quantity += item.quantity;
                } else {
                  itemCounts.set(id, { name: displayName, quantity: item.quantity });
                }
              }
              const lootList = Array.from(itemCounts.values())
                .map(item => `${item.name}x${item.quantity}`)
                .join('、');
              lootDetails = `\n📦 保留物品：${lootList}`;
            }
            
            // 构建碎片列表信息
            let fragmentDetails = '';
            if (keptFragments.length > 0) {
              const fragmentCounts = new Map<string, { name: string; count: number }>();
              for (const fragment of keptFragments) {
                const name = fragment.sourceName || `${fragment.rarity}${fragment.type === 'technique' ? '功法残本' : '装备残片'}`;
                const existing = fragmentCounts.get(name);
                if (existing) {
                  existing.count += fragment.count;
                } else {
                  fragmentCounts.set(name, { name, count: fragment.count });
                }
              }
              const fragmentList = Array.from(fragmentCounts.values())
                .map(f => `「${f.name}」${f.count > 1 ? `x${f.count}` : ''}`)
                .join('、');
              fragmentDetails = `\n📜 保留碎片：${fragmentList}`;
            }
            
            const rewards = keptLoot.length > 0 || keptExperience > 0 || keptFragments.length > 0 ? {
              items: keptLoot.length > 0 ? keptLoot : undefined,
              experience: keptExperience > 0 ? keptExperience : undefined,
              fragments: keptFragments.length > 0 ? keptFragments : undefined,
            } : undefined;
            
            const newStatistics = {
              ...prev.statistics,
              totalAdventuresCompleted: prev.statistics.totalAdventuresCompleted + 1,
            };
            
            // 触发死亡状态
            const deathMessage = getDeathMessage('adventure_fail');
            const deathState: DeathState = {
              isDead: true,
              cause: 'adventure_fail',
              title: deathMessage.title,
              subtitle: deathMessage.subtitle,
              recoveryHp: healAmount,
              timestamp: Date.now(),
            };
            
            return {
              ...prev,
              // 被踢出机缘：清空机缘相关状态
              adventureGrid: null,
              adventurePosition: null,
              adventureConfig: null,
              adventureLoot: [],
              adventureExperience: 0,
              adventureFragments: [], // 清空碎片战利品
              adventurePhase: 'select',
              battleState,
              statistics: newStatistics,
              // 死亡状态
              deathState,
              protagonist: {
                ...prev.protagonist,
                currentHp: healAmount,
                mentalState: newMentalState,
                inventory: finalInventory,
                experience: prev.protagonist.experience + keptExperience,
                fragmentInventory: currentFragmentInventory, // 更新碎片库存
              },
              messages: addMessageInternal(
                prev.messages,
                'failure',
                '战斗失败',
                `被敌人击败，狼狈逃离机缘...${mentalMsg ? ' ' + mentalMsg : ''}${lootDetails}${fragmentDetails}${keptExperience > 0 ? `\n⭐ 保留经验：${keptExperience}（50%）` : ''}`,
                undefined,
                rewards
              ),
            };
          }
        }
        
        case 'treasure': {
          const newGrid = grid.map((r, ri) => 
            r.map((c, ci) => 
              ri === targetRow && ci === targetCol ? { ...c, cleared: true, visited: true } : c
            )
          );
          
          // 使用 handleCellEvent 处理宝箱奖励
          const result = handleCellEvent(prev.protagonist, targetCell, prev.adventureConfig);
          
          // 战利品放入冒险背包
          const newLoot = [...(prev.adventureLoot || [])];
          if (result.rewards?.items) {
            for (const item of result.rewards.items) {
              newLoot.push(item);
            }
          }
          
          // 【新增】处理碎片掉落 - 添加到玩家库存和战利品清单
          const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
          const newAdventureFragments = [...(prev.adventureFragments || [])];
          if (result.rewards?.fragments) {
            for (const fragment of result.rewards.fragments as FragmentDropData[]) {
              addFragmentToInventory(currentFragmentInventory, fragment);
              newAdventureFragments.push(fragment);
            }
          }
          
          // 【新增】处理完整物品掉落 - 直接添加到主角背包
          const droppedTechniques: Technique[] = [];
          const droppedEquipments: Equipment[] = [];
          if (result.rewards?.completeItems) {
            for (const completeItem of result.rewards.completeItems) {
              if (completeItem.type === 'technique') {
                droppedTechniques.push(completeItem.item as Technique);
              } else {
                droppedEquipments.push(completeItem.item as Equipment);
              }
            }
          }
          const newTechniques = droppedTechniques.length > 0 
            ? [...prev.protagonist.techniques, ...droppedTechniques]
            : prev.protagonist.techniques;
          const newEquipments = droppedEquipments.length > 0
            ? [...prev.protagonist.equipments, ...droppedEquipments]
            : prev.protagonist.equipments;
          
          // 经验值放入待结算
          const newExperience = (prev.adventureExperience || 0) + (result.rewards?.experience || 0);
          
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              // 宝箱不扣血，经验值不在宝箱格直接结算
              // 更新碎片库存
              fragmentInventory: currentFragmentInventory,
              // 更新功法和装备列表
              techniques: newTechniques,
              equipments: newEquipments,
            },
            adventureGrid: newGrid,
            adventurePosition: { row: targetRow, col: targetCol },
            adventureLoot: newLoot,
            adventureExperience: newExperience, // 待结算经验值
            adventureFragments: newAdventureFragments, // 碎片战利品
            adventureSession: updatedSession, // 保存行动力消耗
            messages: addMessageInternal(prev.messages, 'success', '发现宝箱', result.message, undefined, result.rewards),
          };
        }
        
        case 'rest': {
          const newGrid = grid.map((r, ri) => 
            r.map((c, ci) => 
              ri === targetRow && ci === targetCol ? { ...c, cleared: true, visited: true } : c
            )
          );
          
          // 使用 handleCellEvent 处理休息格恢复
          const result = handleCellEvent(prev.protagonist, targetCell, prev.adventureConfig);
          
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              currentHp: Math.min(prev.protagonist.maxHp, prev.protagonist.currentHp + (result.hpRestored || 0)),
              currentMp: Math.min(prev.protagonist.maxMp, prev.protagonist.currentMp + (result.mpRestored || 0)),
            },
            adventureGrid: newGrid,
            adventurePosition: { row: targetRow, col: targetCol },
            adventureSession: updatedSession, // 保存行动力消耗
            messages: addMessageInternal(prev.messages, 'success', '休息恢复', result.message),
          };
        }
        
        case 'event': {
          const newGrid = grid.map((r, ri) => 
            r.map((c, ci) => 
              ri === targetRow && ci === targetCol ? { ...c, cleared: true, visited: true } : c
            )
          );
          
          // 使用 handleCellEvent 处理事件格奖励
          const result = handleCellEvent(prev.protagonist, targetCell, prev.adventureConfig);
          
          // 战利品放入冒险背包
          const newLoot = [...(prev.adventureLoot || [])];
          if (result.rewards?.items) {
            for (const item of result.rewards.items) {
              newLoot.push(item);
            }
          }
          
          // 【新增】处理碎片掉落 - 添加到玩家库存和战利品清单
          const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
          const newAdventureFragments = [...(prev.adventureFragments || [])];
          if (result.rewards?.fragments) {
            for (const fragment of result.rewards.fragments as FragmentDropData[]) {
              addFragmentToInventory(currentFragmentInventory, fragment);
              newAdventureFragments.push(fragment);
            }
          }
          
          // 【新增】处理完整物品掉落 - 直接添加到主角背包
          const droppedTechniques: Technique[] = [];
          const droppedEquipments: Equipment[] = [];
          if (result.rewards?.completeItems) {
            for (const completeItem of result.rewards.completeItems) {
              if (completeItem.type === 'technique') {
                droppedTechniques.push(completeItem.item as Technique);
              } else {
                droppedEquipments.push(completeItem.item as Equipment);
              }
            }
          }
          const newTechniques = droppedTechniques.length > 0 
            ? [...prev.protagonist.techniques, ...droppedTechniques]
            : prev.protagonist.techniques;
          const newEquipments = droppedEquipments.length > 0
            ? [...prev.protagonist.equipments, ...droppedEquipments]
            : prev.protagonist.equipments;
          
          // 处理 HP/MP 变化
          const newHp = result.hpRestored 
            ? Math.min(prev.protagonist.maxHp, prev.protagonist.currentHp + result.hpRestored)
            : prev.protagonist.currentHp;
          const newMp = result.mpRestored
            ? Math.min(prev.protagonist.maxMp, prev.protagonist.currentMp + result.mpRestored)
            : prev.protagonist.currentMp;
          
          // 经验值放入待结算
          const newExperience = (prev.adventureExperience || 0) + (result.rewards?.experience || 0);
          
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              currentHp: newHp,
              currentMp: newMp,
              // 更新碎片库存
              fragmentInventory: currentFragmentInventory,
              // 更新功法和装备列表
              techniques: newTechniques,
              equipments: newEquipments,
            },
            adventureGrid: newGrid,
            adventurePosition: { row: targetRow, col: targetCol },
            adventureLoot: newLoot,
            adventureExperience: newExperience, // 待结算经验值
            adventureFragments: newAdventureFragments, // 碎片战利品
            adventureSession: updatedSession, // 保存行动力消耗
            messages: addMessageInternal(prev.messages, 'info', '发现物品', result.message, undefined, result.rewards),
          };
        }
        
        case 'portal': {
          // 传送门：在地图内传送到配对位置
          const portalTarget = targetCell.portalTarget;
          
          if (portalTarget) {
            // 标记当前传送门和目标传送门都已访问
            const newGrid = grid.map((r, ri) => 
              r.map((c, ci) => {
                if (ri === targetRow && ci === targetCol) {
                  return { ...c, visited: true };
                }
                if (ri === portalTarget.row && ci === portalTarget.col) {
                  return { ...c, visited: true };
                }
                return c;
              })
            );
            
            return {
              ...prev,
              adventureGrid: newGrid,
              adventurePosition: { row: portalTarget.row, col: portalTarget.col },
              adventureSession: updatedSession, // 保存行动力消耗
              messages: addMessageInternal(
                prev.messages,
                'info',
                '传送',
                `通过传送门传送到了 (${portalTarget.row + 1}, ${portalTarget.col + 1}) 位置`
              ),
            };
          } else {
            // 如果没有目标，当作空格处理
            const newGrid = grid.map((r, ri) => 
              r.map((c, ci) => 
                ri === targetRow && ci === targetCol ? { ...c, visited: true } : c
              )
            );
            
            return {
              ...prev,
              adventureGrid: newGrid,
              adventurePosition: { row: targetRow, col: targetCol },
              adventureSession: updatedSession, // 保存行动力消耗
            };
          }
        }
        
        case 'empty':
        default: {
          const newGrid = grid.map((r, ri) => 
            r.map((c, ci) => 
              ri === targetRow && ci === targetCol ? { ...c, visited: true } : c
            )
          );
          
          return {
            ...prev,
            // 空格子不扣血，不改变主角状态
            adventureGrid: newGrid,
            adventurePosition: { row: targetRow, col: targetCol },
            adventureSession: updatedSession, // 保存行动力消耗
          };
        }
      }
    });
  }, [addMessageInternal, setGameState]);

  // 清除上次结果
  const clearLastResult = useCallback(() => {
    setGameState((prev: GameState) => ({
      ...prev,
      lastActionResult: null,
      battleState: null,
    }));
  }, [setGameState]);

  // 处理战斗结束
  const handleBattleEnd = useCallback((result: { victory: boolean; fled?: boolean; playerHpAfter: number; playerMpAfter?: number }) => {
    setGameState((prev: GameState) => {
      if (!prev.protagonist || !prev.activeBattle) {
        return prev;
      }

      const { cellType, enemyName, enemyLevel, cellPosition, source, towerFloor, towerEnemy } = prev.activeBattle;
      
      // ========================================
      // 爬塔战斗处理
      // ========================================
      if (source === 'tower' && towerFloor && towerEnemy) {
        // 逃跑处理
        if (result.fled) {
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              currentHp: result.playerHpAfter,
              currentMp: result.playerMpAfter ?? prev.protagonist.currentMp,
            },
            activeBattle: null,
            battleState: null,
            autoBattle: false,
            messages: addMessageInternal(
              prev.messages,
              'warning',
              '逃离试炼',
              `从第${towerFloor}层的${enemyName}战斗中逃脱了。`
            ),
          };
        }
        
        // 获取爬塔进度
        const currentProgress = prev.protagonist.towerProgress ?? {
          currentFloor: 1,
          maxClearedFloor: 0,
          clearedFloors: new Set<number>(),
          todayAttempts: 0,
          lastResetTime: Date.now(),
          dropPool: { items: [], totalSpiritStones: 0, lastUpdated: Date.now() },
          totalSpiritStonesEarned: 0,
          totalFragmentsEarned: 0,
          totalMaterialsEarned: 0,
        };
        
        // 将 clearedFloors Set 转换为数组进行处理
        const clearedFloorsArray = Array.from(currentProgress.clearedFloors);
        
        if (result.victory) {
          // 胜利：更新最高层数
          let maxClearedFloor = currentProgress.maxClearedFloor;
          if (towerFloor > maxClearedFloor) {
            maxClearedFloor = towerFloor;
          }
          
          // 更新已通关层数
          if (!clearedFloorsArray.includes(towerFloor)) {
            clearedFloorsArray.push(towerFloor);
          }
          
          // 构建奖励消息
          const rewardParts: string[] = [];
          const spiritStonesReward = towerEnemy.rewards.spiritStones;
          
          // 更新爬塔进度
          const updatedProgress = {
            ...currentProgress,
            currentFloor: towerFloor + 1,
            todayAttempts: currentProgress.todayAttempts + 1,
            maxClearedFloor,
            clearedFloors: new Set(clearedFloorsArray),
            dropPool: currentProgress.dropPool,
            totalSpiritStonesEarned: currentProgress.totalSpiritStonesEarned + spiritStonesReward,
          };
          
          // 灵石奖励
          if (spiritStonesReward > 0) {
            rewardParts.push(`💰${spiritStonesReward}灵石`);
          }
          
          // 更新玩家背包中的灵石
          const updatedInventory = [...prev.protagonist.inventory];
          if (spiritStonesReward > 0) {
            const spiritStoneIndex = updatedInventory.findIndex(
              item => item.definition.id === 'spirit_stone' || item.definition.type === '灵石'
            );
            if (spiritStoneIndex >= 0) {
              updatedInventory[spiritStoneIndex] = {
                ...updatedInventory[spiritStoneIndex],
                quantity: updatedInventory[spiritStoneIndex].quantity + spiritStonesReward,
              };
            } else {
              const def = {
                id: 'spirit_stone',
                name: '灵石',
                type: '灵石' as const,
                rarity: '普通' as const,
                description: '修仙世界的通用货币',
                effects: [],
                stackable: true,
                maxStack: 999999,
              };
              updatedInventory.push({
                id: `spirit_stone_${Date.now()}`,
                definition: def,
                quantity: spiritStonesReward,
              });
            }
          }
          
          // 使用预设的碎片奖励
          const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
          const worldType = prev.protagonist.world.type;
          
          // 处理预设的碎片奖励
          const newTechniques = [...prev.protagonist.techniques];
          const newEquipments = [...prev.protagonist.equipments];
          
          if (towerEnemy.rewards.fragments.length > 0) {
            // 导入所需函数
            const { generateRandomTechnique } = require('@/lib/game/utils/technique');
            const { generateRandomEquipment } = require('@/lib/game/utils/equipment');
            const { SYNTHESIS_REQUIREMENTS } = require('@/lib/game/utils/fragmentSystem');
            
            // 按品质分组统计碎片
            const fragmentByRarity: Record<string, { count: number; type: string }> = {};
            
            for (const frag of towerEnemy.rewards.fragments) {
              // 为每个碎片生成一个源物品用于碎片数据
              const sourceItem = frag.type === 'technique' 
                ? generateRandomTechnique(towerEnemy.level, worldType, frag.rarity)
                : generateRandomEquipment(towerEnemy.level, towerEnemy.isBoss, worldType, frag.rarity);
              
              const totalRequired = SYNTHESIS_REQUIREMENTS[frag.rarity];
              const index = Math.floor(Math.random() * totalRequired) + 1;
              
              // 本地生成碎片ID
              const fragmentId = `frag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
              
              const fragmentData = {
                id: fragmentId,
                sourceName: sourceItem.name,
                type: frag.type,
                rarity: frag.rarity,
                index,
                totalRequired,
                sourceItem,
              };
              
              if (frag.type === 'technique') {
                currentFragmentInventory.techniqueFragments.push(fragmentData);
              } else {
                currentFragmentInventory.equipmentFragments.push(fragmentData);
              }
              
              // 统计碎片
              const key = `${frag.rarity}_${frag.type}`;
              if (!fragmentByRarity[key]) {
                fragmentByRarity[key] = { count: 0, type: frag.type };
              }
              fragmentByRarity[key].count += frag.quantity;
            }
            
            // 构建碎片奖励消息
            for (const [key, data] of Object.entries(fragmentByRarity)) {
              const [rarity, type] = key.split('_');
              const typeName = type === 'technique' ? '功法' : '装备';
              rewardParts.push(`📦${rarity}${typeName}碎片×${data.count}`);
            }
          }
          
          // 处理预设的材料奖励
          if (towerEnemy.rewards.materials.length > 0) {
            // 添加材料到背包
            const addItemToInventory = (id: string, rarity: ItemRarity, quantity: number) => {
              const existing = updatedInventory.find(item => item.definition.id === id);
              if (existing) {
                existing.quantity += quantity;
              } else {
                const def: ItemDefinition = {
                  id,
                  name: `${rarity}材料`,
                  type: '材料',
                  rarity,
                  description: `${rarity}品质的炼器材料`,
                  effects: [],
                  stackable: true,
                  maxStack: 999,
                };
                updatedInventory.push(createInventoryItem(def, quantity));
              }
            };
            
            // 按品质分组统计材料
            const materialByRarity: Record<string, number> = {};
            
            for (const mat of towerEnemy.rewards.materials) {
              addItemToInventory(mat.id, mat.rarity, mat.quantity);
              
              if (!materialByRarity[mat.rarity]) {
                materialByRarity[mat.rarity] = 0;
              }
              materialByRarity[mat.rarity] += mat.quantity;
            }
            
            // 构建材料奖励消息
            for (const [rarity, count] of Object.entries(materialByRarity)) {
              rewardParts.push(`🔨${rarity}材料×${count}`);
            }
          }
          
          // 经验奖励
          const expReward = towerEnemy.rewards.experience || Math.floor(towerFloor * 10);
          if (expReward > 0) {
            rewardParts.push(`⭐${expReward}经验`);
          }
          
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              // 不更新 currentHp 和 currentMp，保持原有状态
              towerProgress: updatedProgress,
              inventory: updatedInventory,
              fragmentInventory: currentFragmentInventory,
              techniques: newTechniques,
              equipments: newEquipments,
              experience: prev.protagonist.experience + expReward,
            },
            activeBattle: null,
            battleState: null,
            autoBattle: false,
            messages: addMessageInternal(
              prev.messages,
              'success',
              '试炼胜利',
              `成功通过第${towerFloor}层！击败了${enemyName}(Lv.${enemyLevel})！`,
              rewardParts.length > 0 ? `获得 ${rewardParts.join(' · ')}` : undefined
            ),
          };
        } else {
          // 失败：不影响玩家实际状态
          const currentMentalState = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
          const { newState: newMentalState, message: mentalMsg } = applyMentalChange(currentMentalState, 'battle_defeat');
          
          const updatedProgress = {
            ...currentProgress,
            todayAttempts: currentProgress.todayAttempts + 1,
          };
          
          // 爬塔战斗失败不影响玩家实际HP/MP
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              // 不更新 currentHp 和 currentMp
              towerProgress: updatedProgress,
              mentalState: newMentalState,
            },
            activeBattle: null,
            battleState: null,
            autoBattle: false,
            messages: addMessageInternal(
              prev.messages,
              'failure',
              '试炼失败',
              `在第${towerFloor}层败给了${enemyName}(Lv.${enemyLevel})...${mentalMsg ? ' ' + mentalMsg : ''}`,
            ),
          };
        }
      }
      
      // ========================================
      // 历练战斗处理（原有逻辑）
      // ========================================
      if (!prev.adventureGrid || !prev.adventureConfig) {
        return prev;
      }
      
      const isBoss = cellType === 'boss';
      const targetRow = cellPosition.row;
      const targetCol = cellPosition.col;

      // ========================================
      // 逃跑处理：逃跑成功不导致死亡，只是退出战斗
      // ========================================
      if (result.fled) {
        // 心境受挫
        const currentMentalState = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        const { newState: newMentalState, message: mentalMsg } = applyMentalChange(currentMentalState, 'battle_defeat');
        
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            currentHp: result.playerHpAfter,
            currentMp: result.playerMpAfter ?? prev.protagonist.currentMp,
            mentalState: newMentalState,
          },
          activeBattle: null,
          battleState: null,
          autoBattle: false,
          // 逃跑时保留行动力状态（不恢复、不额外消耗）
          adventureSession: prev.adventureSession,
          messages: addMessageInternal(
            prev.messages,
            'warning',
            '逃跑成功',
            `从${enemyName}(Lv.${enemyLevel})的战斗中逃脱了。${mentalMsg ? ' ' + mentalMsg : ''}`,
          ),
        };
      }

      if (result.victory) {
        // ========================================
        // 战斗胜利处理 - 使用碎片系统
        // ========================================
        const enemyTier = getEnemyTierFromCellType(cellType);
        const tierConfig = getEnemyTierConfig(enemyTier);
        const playerLevel = prev.protagonist.level;
        const luck = getFinalStats(prev.protagonist.stats).幸运 || 0;
        const worldType = prev.protagonist.world.type;
        
        // ========================================
        // 行动力系统：战斗胜利恢复行动力
        // ========================================
        const updatedSession = prev.adventureSession ? { ...prev.adventureSession } : null;
        let staminaRecoveryInfo = '';
        if (updatedSession && enemyTier) {
          const recoveryResult = recoverStaminaFromBattle(updatedSession, enemyTier);
          if (recoveryResult.recovery > 0) {
            staminaRecoveryInfo = `\n⚡ 行动力恢复 +${recoveryResult.recovery}（${recoveryResult.staminaBefore}→${recoveryResult.staminaAfter}）`;
          }
        }
        
        // 计算奖励经验
        const expReward = Math.floor((enemyLevel * 10 + 20) * prev.adventureConfig.rewardMultiplier);
        
        // 战利品放入冒险背包
        const newLoot = [...(prev.adventureLoot || [])];
        
        // 随机掉落物品（使用敌人等级对应的物品）
        if (Math.random() < 0.15) {
          const item = getRandomItem(enemyLevel);
          if (item) {
            newLoot.push(createInventoryItem(item, 1));
          }
        }
        
        // Boss 掉落突破丹
        if (isBoss) {
          const breakthroughPill = breakthroughItems[Math.min(Math.floor(enemyLevel / 30), 2)];
          if (breakthroughPill) {
            newLoot.push(createInventoryItem(breakthroughPill, 1));
          }
        }
        
        // 【关键修复】使用碎片系统，传入玩家等级限制稀有度
        const fragmentDrop = generateFragmentDrop(enemyLevel, enemyTier, luck, worldType, playerLevel);
        
        // 处理碎片掉落 - 添加到玩家碎片库存和战利品清单
        const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
        const currentAdventureFragments = [...(prev.adventureFragments || [])];
        if (fragmentDrop.fragments.length > 0) {
          for (const fragment of fragmentDrop.fragments) {
            addFragmentToInventory(currentFragmentInventory, fragment);
            currentAdventureFragments.push(fragment);
          }
        }
        
        // 处理完整物品掉落 - 直接添加到主角背包
        const droppedTechniques: Technique[] = [];
        const droppedEquipments: Equipment[] = [];
        for (const completeItem of fragmentDrop.completeItems) {
          if (completeItem.type === 'technique') {
            droppedTechniques.push(completeItem.item as Technique);
          } else {
            droppedEquipments.push(completeItem.item as Equipment);
          }
        }
        const newTechniques = droppedTechniques.length > 0 
          ? [...prev.protagonist.techniques, ...droppedTechniques]
          : prev.protagonist.techniques;
        const newEquipments = droppedEquipments.length > 0
          ? [...prev.protagonist.equipments, ...droppedEquipments]
          : prev.protagonist.equipments;
        
        // 使用统计管理器更新统计数据
        const isElite = cellType === 'elite' || cellType === 'miniboss';
        const fragmentCount = fragmentDrop.fragments.length;
        const newStatistics = statisticsManager.processEvents(prev.statistics, [
          { type: 'enemy_killed' },
          ...(isBoss ? [{ type: 'boss_killed' as StatisticsEventType }] : []),
          ...(isElite ? [{ type: 'elite_killed' as StatisticsEventType }] : []),
          ...(fragmentCount > 0 ? [{ type: 'fragment_collected' as StatisticsEventType, payload: { count: fragmentCount } }] : []),
          ...(droppedTechniques.length > 0 ? [{ type: 'technique_collected' as StatisticsEventType, payload: { name: droppedTechniques[0].name } }] : []),
          ...(droppedEquipments.length > 0 ? [{ type: 'equipment_collected' as StatisticsEventType, payload: { name: droppedEquipments[0].name } }] : []),
        ]);
        
        let newFactionProgress = prev.protagonist.factionProgress;
        if (prev.protagonist.factionId && newFactionProgress) {
          newFactionProgress = updateTaskProgress(newFactionProgress, 'kill', 'any', 1);
        }
        
        // 更新格子
        const newGrid = prev.adventureGrid.map((r, ri) => 
          r.map((c, ci) => 
            ri === targetRow && ci === targetCol ? { ...c, cleared: true, visited: true } : c
          )
        );
        
        // 经验值放入待结算
        const newExperience = (prev.adventureExperience || 0) + expReward;
        
        const rewards: MessageRecord['rewards'] = {
          experience: expReward,
          items: newLoot.length > (prev.adventureLoot?.length || 0) 
            ? newLoot.slice(prev.adventureLoot?.length || 0) 
            : undefined,
          // 添加碎片掉落信息
          fragments: fragmentDrop.fragments.length > 0 ? fragmentDrop.fragments : undefined,
          // 添加完整物品掉落信息
          techniques: droppedTechniques.length > 0 ? droppedTechniques : undefined,
          equipments: droppedEquipments.length > 0 ? droppedEquipments : undefined,
        };
        
        // 构建胜利消息
        let victoryMessage = `击败了${enemyName}(Lv.${enemyLevel})！`;
        if (fragmentDrop.log) {
          victoryMessage += `\n${fragmentDrop.log}`;
        }
        if (staminaRecoveryInfo) {
          victoryMessage += staminaRecoveryInfo;
        }
        
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            currentHp: result.playerHpAfter,
            currentMp: result.playerMpAfter ?? prev.protagonist.currentMp,
            factionProgress: newFactionProgress,
            // 更新碎片库存
            fragmentInventory: currentFragmentInventory,
            // 更新功法和装备（完整物品掉落）
            techniques: newTechniques,
            equipments: newEquipments,
          },
          statistics: newStatistics,
          factionProgress: newFactionProgress,
          adventureGrid: newGrid,
          adventureLoot: newLoot,
          adventureExperience: newExperience,
          adventureFragments: currentAdventureFragments, // 碎片战利品
          adventureSession: updatedSession, // 更新行动力会话
          activeBattle: null,
          battleState: null,
          autoBattle: false, // 战斗结束后重置为手动模式
          messages: addMessageInternal(
            prev.messages,
            'success',
            '战斗胜利',
            victoryMessage,
            undefined,
            rewards
          ),
        };
      } else {
        // 战斗失败处理：被踢出机缘
        const healAmount = Math.floor(prev.protagonist.maxHp * 0.3);
        const currentMentalState = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        const { newState: newMentalState, message: mentalMsg } = applyMentalChange(currentMentalState, 'battle_defeat');
        
        // 计算战利品和经验结算（被击败时丢失50%）
        const currentLoot = prev.adventureLoot || [];
        const currentFragments = prev.adventureFragments || [];
        const currentExperience = prev.adventureExperience || 0;
        const keepRatio = 0.5;
        
        // 处理战利品：每个物品数量减半（向下取整）
        let finalInventory = [...(prev.protagonist.inventory || [])];
        const keptLoot: InventoryItem[] = [];
        for (const item of currentLoot) {
          const keptQuantity = Math.floor(item.quantity * keepRatio);
          if (keptQuantity > 0) {
            const keptItem = { ...item, quantity: keptQuantity };
            finalInventory = addToInventory(finalInventory, keptItem);
            keptLoot.push(keptItem);
          }
        }
        
        // 经验值减半（向下取整）
        const keptExperience = Math.floor(currentExperience * keepRatio);
        
        // 碎片保留50%
        const fragmentKeepCount = Math.floor(currentFragments.length * keepRatio);
        const keptFragments = currentFragments.slice(0, fragmentKeepCount);
        
        // 从 fragmentInventory 中移除未保留的碎片
        const currentFragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
        const lostFragments = currentFragments.slice(fragmentKeepCount);
        for (const lostFragment of lostFragments) {
          const fragmentData = lostFragment.fragment;
          if (fragmentData) {
            if (lostFragment.type === 'technique') {
              const idx = currentFragmentInventory.techniqueFragments.findIndex(
                f => f.id === fragmentData.id
              );
              if (idx !== -1) {
                currentFragmentInventory.techniqueFragments.splice(idx, 1);
              }
            } else {
              const idx = currentFragmentInventory.equipmentFragments.findIndex(
                f => f.id === fragmentData.id
              );
              if (idx !== -1) {
                currentFragmentInventory.equipmentFragments.splice(idx, 1);
              }
            }
          }
        }
        
        // 获取世界术语
        const terminology = getTerminology(prev.protagonist.world.type);
        
        // 构建战利品列表信息
        let lootDetails = '';
        if (keptLoot.length > 0) {
          const itemCounts = new Map<string, { name: string; quantity: number }>();
          for (const item of keptLoot) {
            const id = item.definition.id;
            const existing = itemCounts.get(id);
            // 灵石使用统一术语
            const displayName = id === 'spirit_stone' ? terminology.resource : item.definition.name;
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              itemCounts.set(id, { name: displayName, quantity: item.quantity });
            }
          }
          const lootList = Array.from(itemCounts.values())
            .map(item => `${item.name}x${item.quantity}`)
            .join('、');
          lootDetails = `\n📦 保留物品：${lootList}`;
        }
        
        // 构建碎片列表信息
        let fragmentDetails = '';
        if (keptFragments.length > 0) {
          const fragmentCounts = new Map<string, { name: string; count: number }>();
          for (const fragment of keptFragments) {
            const name = fragment.sourceName || `${fragment.rarity}${fragment.type === 'technique' ? '功法残本' : '装备残片'}`;
            const existing = fragmentCounts.get(name);
            if (existing) {
              existing.count += fragment.count;
            } else {
              fragmentCounts.set(name, { name, count: fragment.count });
            }
          }
          const fragmentList = Array.from(fragmentCounts.values())
            .map(f => `「${f.name}」${f.count > 1 ? `x${f.count}` : ''}`)
            .join('、');
          fragmentDetails = `\n📜 保留碎片：${fragmentList}`;
        }
        
        const rewards = keptLoot.length > 0 || keptExperience > 0 || keptFragments.length > 0 ? {
          items: keptLoot.length > 0 ? keptLoot : undefined,
          experience: keptExperience > 0 ? keptExperience : undefined,
          fragments: keptFragments.length > 0 ? keptFragments : undefined,
        } : undefined;
        
        const newStatistics = {
          ...prev.statistics,
          totalAdventuresCompleted: prev.statistics.totalAdventuresCompleted + 1,
        };
        
        // 触发死亡状态
        const deathMessage = getDeathMessage('adventure_fail');
        const deathState: DeathState = {
          isDead: true,
          cause: 'adventure_fail',
          title: deathMessage.title,
          subtitle: deathMessage.subtitle,
          recoveryHp: healAmount,
          timestamp: Date.now(),
        };
        
        return {
          ...prev,
          // 被踢出机缘：清空机缘相关状态
          adventureGrid: null,
          adventurePosition: null,
          adventureConfig: null,
          adventureLoot: [],
          adventureExperience: 0,
          adventureFragments: [], // 清空碎片战利品
          adventurePhase: 'select',
          activeBattle: null,
          battleState: null,
          autoBattle: false, // 战斗结束后重置为手动模式
          statistics: newStatistics,
          // 死亡状态
          deathState,
          protagonist: {
            ...prev.protagonist,
            currentHp: healAmount,
            mentalState: newMentalState,
            inventory: finalInventory,
            experience: prev.protagonist.experience + keptExperience,
            fragmentInventory: currentFragmentInventory, // 更新碎片库存
          },
          messages: addMessageInternal(
            prev.messages,
            'failure',
            '战斗失败',
            `被${enemyName}(Lv.${enemyLevel})击败，狼狈逃离机缘...${mentalMsg ? ' ' + mentalMsg : ''}${lootDetails}${fragmentDetails}${keptExperience > 0 ? `\n⭐ 保留经验：${keptExperience}（50%）` : ''}`,
            undefined,
            rewards
          ),
        };
      }
    });
  }, [addMessageInternal, setGameState]);

  // 切换自动战斗模式
  const toggleAutoBattle = useCallback(() => {
    setGameState((prev: GameState) => ({
      ...prev,
      autoBattle: !prev.autoBattle,
    }));
  }, [setGameState]);

  return {
    startExperience,
    handleEventChoice,
    getDifficulties,
    startAdventure,
    quickSweep,
    exitAdventure,
    moveInAdventure,
    clearLastResult,
    handleBattleEnd,
    toggleAutoBattle,
  };
}
