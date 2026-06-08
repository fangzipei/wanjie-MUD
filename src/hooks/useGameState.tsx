/**
 * useGameState.tsx - 游戏状态管理主文件
 * 组合所有独立模块 Hooks，提供统一的游戏状态管理
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

// 类型导入
import { handleCellEvent } from '@/lib/game/adventure/adventure';
import { calculateBattleWithLogs } from '@/lib/game/adventure/adventureBattleNew';
import { calculatePlayerMaxHp, calculatePlayerMaxMp } from '@/lib/game/utils/balanceConfig';
import { calculatePlayerCombatPower } from '@/lib/game/utils/combatPower';
import { executeCultivation, getMaxExperience } from '@/lib/game/cultivation/cultivation';
import { generateEquipment } from '@/lib/game/utils/equipment';
import { updateTaskProgress, applyMentalChange } from '@/lib/game/utils/expansionLogic';
import { processExperienceGain, calculateBreakthroughTransfer } from '@/lib/game/utils/experienceSystem';
import { generateCharacters, generateWorlds, generateBackstory } from '@/lib/game/utils/generators';
import type { SeclusionType } from '@/lib/game/cultivation/seclusion';
import type { TowerEnemy } from '@/lib/game/tower/types';
import { createDefaultTowerProgress } from '@/lib/game/tower/types';
import { createInventoryItem } from '@/lib/game/types';
import { spiritStoneItems, cultivationPillItems, breakthroughItems } from '@/lib/game/utils/items';
import { generateRandomTechnique, generateTechniqueByType } from '@/lib/game/utils/technique';
import { getRealmName } from '@/lib/game/utils/generators';
import { applyBaseStatChanges, getGrowthStatCap } from '@/lib/game/utils/realmSystem';
import { 
  TUTORIAL_TASKS, 
  checkTutorialProgress, 
  checkNewlyCompletedTask,
  getTaskRewards,
  getTutorialWelcomeMessage
} from '@/lib/game/taskSystem';
import type {
  GameState,
  WorldType,
  MessageRecord,
  InventoryItem,
  ItemDefinition,
  ItemRarity,
  CharacterStats,
  Equipment,
  EquipmentSlot,
  Technique,
  TechniqueType,
  CultivationPath,
  World,
  Character,
  DungeonConfig,
  ActionTab,
  GamePhase,
  AdventurePhase,
  BattleState,
  GrowthStats,
  LegacyStats,
  AdventureEvent,
  ActionResult,
  Protagonist,
  CraftingState,
  ForgingState,
  GameStatistics,
  ActiveEffect,
  ActiveBattleState,
} from '@/lib/game/types';
import type {
  MentalState,
  FactionProgress,
  InheritanceChoice,
  NewWorldInfo,
  DiscoveredWorld,
  GuardianBattleState,
  AscensionFlowState,
  ProtagonistExtension,
} from '@/lib/game/typesExtension';
import {
  DEFAULT_PROTAGONIST_EXTENSION,
  DEFAULT_ASCENSION_FLOW_STATE,
  createDefaultDailyRoundState,
  createDefaultWeeklyRoundState,
} from '@/lib/game/typesExtension';
import { 
  upgradeTechnique, 
  upgradeEquipment,
  getMaterialExpValue 
} from '@/lib/game/utils/upgradeSystem';
import {
  createEmptyFragmentInventory,
  synthesizeFragmentGroup,
  synthesizeFragmentByName,
  getFragmentGroupsByName,
} from '@/lib/game/utils/fragmentSystem';

// 扩展类型导入

// 默认状态导入

// 共享工具函数
import { safeSaveGameState, loadGameStateWithRecovery } from '@/lib/game/utils/saveUtils';

import { useGameAdventure } from './adventure/useAdventure';
import { useGameCultivation } from './cultivation/useCultivation';
import { useSeclusion } from './cultivation/useSeclusion';
import { useGameFaction } from './faction/useFaction';
import { addToInventory, removeFromInventory } from './utils/inventoryUtils';

// 安全存档工具

// 离线收益计算
import { processOfflineTime, OfflineProcessResult } from '@/lib/game/tower/idleSystem';
// 统一离线时间处理
import { 
  processOfflineTime as processOfflineTimeUnified,
  applyOfflineTimeToProtagonist,
  shouldShowOfflineDialog,
  OfflineTimeResult,
  DEFAULT_OFFLINE_TIME_CONFIG,
} from '@/lib/game/time/offlineTimeProcessor';
import { TOWER_CONFIG } from '@/lib/game/tower/types';
import { getDefaultRealTimeState, getDefaultGameTimeState } from '@/lib/game/time/timeSystem';

// 子 Hooks

// 游戏逻辑模块
import { getRandomItem } from '@/lib/game/utils/items';
import { calculatePillEffect, getPillRealmLevel } from '@/lib/game/cultivation/pillRealmSystem';
import { createMinimalEquipment, createMinimalTechnique } from '@/lib/game/utils/rarityUtils';
import { createInitialGameState } from './game-state/initialState';

import type { GameContextType } from './game-state/types';
const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const isInitialized = useRef(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // 消息添加内部方法
  const addMessageInternal = useCallback((
    messages: MessageRecord[],
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ): MessageRecord[] => {
    const newMessage: MessageRecord = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      title,
      content,
      details,
      rewards,
    };
    return [newMessage, ...messages].slice(0, 100);
  }, []);

  // 更新活跃效果（用于修炼后减少效果次数）
  const updateActiveEffects = useCallback((effects: ActiveEffect[]): ActiveEffect[] => {
    return effects
      .map(effect => {
        if (effect.type === 'cultivation_boost' || effect.type === 'breakthrough_boost') {
          return {
            ...effect,
            remainingCount: effect.remainingCount - 1
          };
        }
        return effect;
      })
      .filter(effect => effect.remainingCount > 0);
  }, []);

  // ========================================
  // 使用子 Hooks（渐进式重构）
  // ========================================
  
  // 修炼系统 Hook
  const cultivationHook = useGameCultivation({
    gameState,
    setGameState,
    addMessageInternal,
    updateActiveEffects,
  });

  // 闭关修炼 Hook
  const seclusionHook = useSeclusion({
    gameState,
    setGameState,
    addMessageInternal,
    updateActiveEffects,
  });

  // 机缘历练系统 Hook
  const adventureHook = useGameAdventure({
    gameState,
    setGameState,
    addMessageInternal,
  });

  // 势力系统 Hook
  const factionHook = useGameFaction({
    setGameState,
    addMessageInternal,
    addToInventory,
  });

  // 初始化游戏状态
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    // 使用带恢复的存档加载
    const savedState = loadGameStateWithRecovery();
    if (savedState) {
      const now = Date.now();
      const lastLogout = savedState.timeSystem?.realTime?.lastLogoutTime || 0;
      const offlineDuration = lastLogout > 0 ? now - lastLogout : 0;
      
      // === 1. 统一处理离线时间相关补偿 ===
      const offlineTimeResult = processOfflineTimeUnified(
        savedState.timeSystem?.realTime,
        savedState.protagonist ?? undefined,
        savedState.protagonist?.taskCooldowns,
        savedState.autoCultivating || false, // 传入自动修炼状态
        now
      );
      
      // 更新主角状态（体力恢复等）
      let updatedProtagonist = savedState.protagonist;
      if (savedState.protagonist) {
        updatedProtagonist = applyOfflineTimeToProtagonist(
          savedState.protagonist,
          offlineTimeResult
        );
      }
      
      // === 2. 处理挂机收益 ===
      let offlineResult: OfflineProcessResult | undefined;
      
      // 只有离线超过最小时间才显示弹窗
      if (shouldShowOfflineDialog(offlineDuration) && updatedProtagonist) {
        const towerProgress = updatedProtagonist.towerProgress ?? createDefaultTowerProgress();
        
        // 计算离线挂机收益
        offlineResult = processOfflineTime({
          playerLevel: updatedProtagonist.level,
          worldType: updatedProtagonist.world.type,
          currentHp: updatedProtagonist.currentHp,
          maxHp: updatedProtagonist.maxHp,
          currentMp: updatedProtagonist.currentMp,
          maxMp: updatedProtagonist.maxMp,
          currentStamina: updatedProtagonist.stamina || 100,
          maxStamina: updatedProtagonist.maxStamina || 100,
          maxFloor: towerProgress.maxClearedFloor,
          dropPool: towerProgress.dropPool,
          offlineDuration,
        });
      }
      
      // === 3. 更新任务冷却 ===
      const updatedTaskCooldowns = savedState.protagonist?.taskCooldowns || {};
      for (const taskId of offlineTimeResult.expiredTaskCooldowns) {
        delete updatedTaskCooldowns[taskId];
      }
      
      // === 4. 检查并重置轮次冷却 ===
      let updatedFactionProgress = savedState.protagonist?.factionProgress;
      if (updatedFactionProgress) {
        const { dailyRound, weeklyRound } = updatedFactionProgress;
        
        // 检查日常轮次冷却
        let newDailyRound = dailyRound;
        if (dailyRound.roundCooldownEnd && now >= dailyRound.roundCooldownEnd) {
          newDailyRound = createDefaultDailyRoundState();
        }
        
        // 检查周常轮次冷却
        let newWeeklyRound = weeklyRound;
        if (weeklyRound.roundCooldownEnd && now >= weeklyRound.roundCooldownEnd) {
          newWeeklyRound = createDefaultWeeklyRoundState();
        }
        
        if (newDailyRound !== dailyRound || newWeeklyRound !== weeklyRound) {
          updatedFactionProgress = {
            ...updatedFactionProgress,
            dailyRound: newDailyRound,
            weeklyRound: newWeeklyRound,
          };
        }
      }
      
      // === 5. 构建最终状态 ===
      const finalProtagonist = updatedProtagonist ? {
        ...updatedProtagonist,
        taskCooldowns: updatedTaskCooldowns,
        factionProgress: updatedFactionProgress,
      } : null;
      
      // 存储离线时间处理结果（供其他系统使用）
      const finalState: GameState = {
        ...savedState,
        protagonist: finalProtagonist,
        timeSystem: savedState.timeSystem ? {
          ...savedState.timeSystem,
          realTime: offlineTimeResult.updatedRealTime,
        } : {
          realTime: offlineTimeResult.updatedRealTime,
          gameTime: getDefaultGameTimeState(),
        },
        offlineResultV2: offlineResult,
      };
      
      setGameState(finalState);
    }
  }, []);

  // 保存游戏状态
  useEffect(() => {
    if (!isInitialized.current) return;
    if (gameState.phase === 'character-select') return;
    
    // 更新 lastLogoutTime 用于下次计算离线收益
    const currentRealTime = gameState.timeSystem?.realTime || getDefaultRealTimeState();
    const currentGameTime = gameState.timeSystem?.gameTime || getDefaultGameTimeState();
    
    const stateToSave = {
      ...gameState,
      timeSystem: {
        realTime: {
          ...currentRealTime,
          lastLogoutTime: Date.now(),
        },
        gameTime: currentGameTime,
      },
    };
    
    // 使用安全存档函数
    const result = safeSaveGameState(stateToSave);
    if (!result.success) {
      console.error('Failed to save game state:', result.error);
    }
    if (result.compressed) {
      console.log('[GameState] Save compressed due to storage limit');
    }
  }, [gameState]);

  // 监听页面可见性变化，记录离线时间
  useEffect(() => {
    if (!isInitialized.current) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时，立即保存当前时间作为 lastLogoutTime
        const currentRealTime = gameState.timeSystem?.realTime || getDefaultRealTimeState();
        const currentGameTime = gameState.timeSystem?.gameTime || getDefaultGameTimeState();
        
        const stateToSave = {
          ...gameState,
          timeSystem: {
            realTime: {
              ...currentRealTime,
              lastLogoutTime: Date.now(),
            },
            gameTime: currentGameTime,
          },
        };
        
        safeSaveGameState(stateToSave);
      }
    };
    
    const handleBeforeUnload = () => {
      // 页面关闭前，保存当前时间
      const currentRealTime = gameState.timeSystem?.realTime || getDefaultRealTimeState();
      const currentGameTime = gameState.timeSystem?.gameTime || getDefaultGameTimeState();
      
      const stateToSave = {
        ...gameState,
        timeSystem: {
          realTime: {
            ...currentRealTime,
            lastLogoutTime: Date.now(),
          },
          gameTime: currentGameTime,
        },
      };
      
      safeSaveGameState(stateToSave);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameState]);

  // 新手任务奖励自动发放
  useEffect(() => {
    if (!isInitialized.current) return;
    if (gameState.phase !== 'playing' || !gameState.protagonist) return;
    
    // 使用持久化的已完成任务列表
    const persistedCompletedTasks = gameState.completedTutorialTaskIds || [];
    
    // 检查是否有新完成的任务
    const newTask = checkNewlyCompletedTask(
      persistedCompletedTasks,
      gameState.protagonist,
      gameState.statistics
    );
    
    if (newTask) {
      const { taskId, task } = newTask;
      
      // 获取奖励
      const rewards = getTaskRewards(taskId);
      if (rewards) {
        // 延迟发放奖励，让玩家先看到任务完成的提示
        setTimeout(() => {
          setGameState(prev => {
            if (!prev.protagonist) return prev;
            
            // 添加物品到背包
            const newInventory = [...prev.protagonist.inventory];
            for (const itemReward of rewards.items) {
              const existingIdx = newInventory.findIndex(
                i => i.definition.id === itemReward.item.id
              );
              if (existingIdx >= 0) {
                newInventory[existingIdx] = {
                  ...newInventory[existingIdx],
                  quantity: newInventory[existingIdx].quantity + itemReward.quantity
                };
              } else {
                newInventory.push(createInventoryItem(itemReward.item, itemReward.quantity));
              }
            }
            
            // 添加灵石
            if (rewards.spiritStones > 0) {
              const stoneIdx = newInventory.findIndex(
                i => i.definition.id === 'spirit_stone'
              );
              if (stoneIdx >= 0) {
                newInventory[stoneIdx] = {
                  ...newInventory[stoneIdx],
                  quantity: newInventory[stoneIdx].quantity + rewards.spiritStones
                };
              }
            }
            
            // 添加经验
            const newExp = prev.protagonist.experience + rewards.experience;
            
            // 检查是否完成了所有新手任务
            const newCompletedTaskIds = [...(prev.completedTutorialTaskIds || []), taskId];
            // 只有当当前完成的任务是最后一个任务时才显示弹窗
            const isLastTask = taskId === 'tutorial_claim_achievement';
            
            return {
              ...prev,
              // 将任务ID添加到持久化列表
              completedTutorialTaskIds: newCompletedTaskIds,
              // 只有完成最后一个任务时才显示完成弹窗
              showTutorialCompletionDialog: isLastTask ? true : prev.showTutorialCompletionDialog,
              protagonist: {
                ...prev.protagonist,
                inventory: newInventory,
                experience: newExp,
              },
              messages: addMessageInternal(
                prev.messages,
                'success',
                '新手任务完成',
                `【${(task as any).title || task.name}】\n${task.reward.message}`,
                undefined,
                {
                  items: rewards.items.map(r => ({ 
                    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    definition: r.item,
                    quantity: r.quantity 
                  })),
                  experience: rewards.experience,
                }
              ),
            };
          });
        }, 500);
      }
    }
  }, [gameState.phase, gameState.protagonist, gameState.statistics, addMessageInternal]);

  // 修复 P1-005: 初始化和清理游戏系统（事件监听器内存泄漏防护）
  useEffect(() => {
    // 动态导入 gameSystems 以避免循环依赖
    let gameSystems: { initialize: () => void; destroy: () => void } | null = null;
    
    import('@/lib/game/utils/gameSystems').then(module => {
      gameSystems = module.gameSystems;
      gameSystems.initialize();
    }).catch(err => {
      // 初始化失败不阻塞应用
      console.warn('[GameProvider] GameSystems initialization skipped:', err);
    });
    
    return () => {
      // 组件卸载时清理事件监听器
      if (gameSystems) {
        gameSystems.destroy();
      }
    };
  }, []);

  // ========================================
  // 自动修炼逻辑已移至 useGameCultivation hook
  // 这里不再重复实现，避免重复调用
  // ========================================

  // 开始新游戏
  const startNewGame = useCallback(() => {
    setGameState(prev => ({
      ...createInitialGameState(),
      phase: 'character-select',
      characters: generateCharacters(),
      worlds: generateWorlds(),
    }));
  }, []);

  // 刷新角色列表
  const refreshCharacters = useCallback(async () => {
    // 生成8个新角色
    const newCharacters = generateCharacters();
    
    setGameState(prev => ({
      ...prev,
      characters: newCharacters,
    }));
  }, []);

  // 选择角色
  const selectCharacter = useCallback((character: Character) => {
    setGameState(prev => ({
      ...prev,
      selectedCharacter: character,
      phase: 'world-select',
    }));
  }, []);

  // 选择世界观
  const selectWorld = useCallback((world: World) => {
    setGameState(prev => {
      if (!prev.selectedCharacter) return prev;
      
      // 生成背景故事
      const backstory = generateBackstory(prev.selectedCharacter, world);
      
      // 初始背包物品 - 新手优化：增加初始资源
      const initialInventory: InventoryItem[] = [
        createInventoryItem(spiritStoneItems[0], 500), // 初始灵石：100 → 500
        createInventoryItem(cultivationPillItems[0], 5), // 修炼丹药：3 → 5
        createInventoryItem(breakthroughItems[0], 2), // 突破丹药：1 → 2
      ];
      
      // 根据身世属性计算初始装备和功法品质
      const character = prev.selectedCharacter;
      
      // 计算身世总权重（出身和天赋权重更高）
      const backgroundWeight = 
        (character.origin.level === 'legendary' ? 4 : 
         character.origin.level === 'epic' ? 3 :
         character.origin.level === 'rare' ? 2 :
         character.origin.level === 'uncommon' ? 1 : 0) +
        (character.talent.level === 'legendary' ? 4 : 
         character.talent.level === 'epic' ? 3 :
         character.talent.level === 'rare' ? 2 :
         character.talent.level === 'uncommon' ? 1 : 0) +
        (character.trait.level === 'legendary' ? 2 : 
         character.trait.level === 'epic' ? 1.5 :
         character.trait.level === 'rare' ? 1 :
         character.trait.level === 'uncommon' ? 0.5 : 0) +
        (character.personality.level === 'legendary' ? 2 : 
         character.personality.level === 'epic' ? 1.5 :
         character.personality.level === 'rare' ? 1 :
         character.personality.level === 'uncommon' ? 0.5 : 0);
      
      // 根据身世权重决定初始品质
      const getInitialRarity = (): ItemRarity => {
        const roll = Math.random() * 12; // 最大权重约12
        if (backgroundWeight >= 10 && roll > 8) return '史诗'; // 顶级身世有小概率史诗
        if (backgroundWeight >= 7 && roll > 6) return '稀有'; // 高等身世有较大概率稀有
        if (backgroundWeight >= 4 && roll > 4) return '稀有'; // 中等身世有小概率稀有
        if (backgroundWeight >= 2 && roll > 8) return '稀有'; // 低等身世有小概率稀有
        return '普通';
      };
      
      const initialRarity = getInitialRarity();
      
      // 生成初始攻击功法（根据身世品质）
      const initialTechnique = generateTechniqueByType('attack', 1, world.type, initialRarity);
      
      // 生成初始武器（根据身世品质，近战武器）
      const initialEquipment = generateEquipment('melee', initialRarity, world.type);
      
      // 根据属性计算初始血量和法力
      const initialMaxHp = calculatePlayerMaxHp(
        prev.selectedCharacter.stats.base.体质,
        1, // 初始等级为1
        world.type
      );
      const initialMaxMp = calculatePlayerMaxMp(
        prev.selectedCharacter.stats.base.灵根,
        1, // 初始等级为1
        world.type
      );

      // 生成主角
      const protagonist: Protagonist = {
        character: prev.selectedCharacter,
        world: world,
        backstory: backstory,
        level: 1,
        realm: '凡人',
        stats: { ...prev.selectedCharacter.stats },
        statCapBonuses: { 体质: 0, 灵根: 0, 悟性: 0, 幸运: 0, 意志: 0 },
        inventory: initialInventory,
        activeEffects: [],
        experience: 0,
        overflowExperience: 0,
        currentHp: initialMaxHp,
        maxHp: initialMaxHp,
        currentMp: initialMaxMp,
        maxMp: initialMaxMp,
        techniques: [initialTechnique], // 初始功法
        equippedAttackTechniques: [initialTechnique, null, null], // 自动装备到第一个槽位
        equippedDefenseTechniques: [null, null, null],
        equipments: [initialEquipment], // 初始装备
        equippedMelee: initialEquipment, // 自动装备武器
        equippedRanged: null,
        equippedHead: null,
        equippedBody: null,
        equippedLegs: null,
        equippedFeet: null,
        factionId: null,
        ...DEFAULT_PROTAGONIST_EXTENSION,
      };
      
      return {
        ...prev,
        selectedWorld: world,
        protagonist,
        phase: 'backstory',
      };
    });
  }, []);

  // 确认背景故事 - 主角已在 selectWorld 中创建
  const confirmBackstory = useCallback(() => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      const welcomeMessage = getTutorialWelcomeMessage();
      
      return {
        ...prev,
        phase: 'playing',
        messages: addMessageInternal(
          prev.messages, 
          'success', 
          '游戏开始', 
          '欢迎来到修仙世界！',
          welcomeMessage
        ),
      };
    });
  }, [addMessageInternal]);

  // ========================================
  // 修炼相关方法已移至 useGameCultivation hook
  // ========================================

  // ========================================
  // 机缘历练相关方法已移至 useGameAdventure hook
  // startExperience, handleEventChoice, getDifficulties, startAdventure, quickSweep, exitAdventure, clearLastResult
  // ========================================

  // ========================================
  // moveInAdventure 已移至 useGameAdventure hook
  // ========================================

  // 切换Tab
  const setCurrentTab = useCallback((tab: ActionTab) => {
    setGameState(prev => ({ ...prev, currentTab: tab }));
  }, []);

  // 使用物品 - 完整实现，支持丹药效果和加成次数
  const useItem = useCallback((itemId: string) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      const itemIndex = prev.protagonist.inventory.findIndex(
        item => item.definition.id === itemId
      );
      if (itemIndex === -1) return prev;
      
      const item = prev.protagonist.inventory[itemIndex];
      
      // 不能使用灵石
      if (item.definition.type === '灵石') {
        return prev;
      }
      
      // 不能使用材料（无效果的）
      if (item.definition.type === '材料' && item.definition.effects.length === 0) {
        return prev;
      }
      
      // 丹药境界检查
      const isPill = item.definition.type === '丹药' || 
                     item.definition.type === '消耗品' ||
                     item.definition.name.includes('丹');
      
      let effectMultiplier = 1.0;
      let sideEffectStats: Partial<GrowthStats> = {};
      let realmMessage = '';
      
      if (isPill) {
        const pillRealmLevel = item.definition.realmLevel || 
                               getPillRealmLevel(item.definition.unlockLevel || 1);
        
        const pillResult = calculatePillEffect(prev.protagonist, pillRealmLevel);
        effectMultiplier = pillResult.effectMultiplier;
        realmMessage = pillResult.message;
        
        if (pillResult.hasSideEffect && pillResult.sideEffect) {
          if (pillResult.sideEffect.stats) {
            sideEffectStats = pillResult.sideEffect.stats;
          }
          realmMessage += ` ${pillResult.sideEffectMessage || ''}`;
        }
      }
      
      // 处理道具效果
      const newActiveEffects = [...prev.protagonist.activeEffects];
      let statChanges: Partial<LegacyStats> = {};
      let effectMessage = '';
      let hpRestored = 0;
      let mpRestored = 0;
      
      for (const effect of item.definition.effects) {
        const adjustedValue = Math.floor(effect.value * effectMultiplier);
        
        if (effect.type === 'stat_boost') {
          statChanges = {
            体质: Math.floor(adjustedValue * 0.3),
            灵根: Math.floor(adjustedValue * 0.3),
            悟性: Math.floor(adjustedValue * 0.2),
            意志: Math.floor(adjustedValue * 0.2),
            幸运: Math.floor(adjustedValue * 0.1),
          };
          effectMessage += `属性获得提升！`;
        } else if (effect.type === 'restore_hp') {
          hpRestored += adjustedValue;
          effectMessage += `生命+${adjustedValue} `;
        } else if (effect.type === 'restore_mp') {
          mpRestored += adjustedValue;
          effectMessage += `法力+${adjustedValue} `;
        } else if (
          effect.type === 'cultivation_boost' || 
          effect.type === 'breakthrough_boost' || 
          effect.type === 'luck_boost' || 
          effect.type === 'combat_boost'
        ) {
          const duration = effect.duration || 1;
          const adjustedBoostValue = Math.floor(effect.value * effectMultiplier);
          const existingEffectIndex = newActiveEffects.findIndex(
            e => e.itemId === item.definition.id && e.type === effect.type
          );
          
          if (existingEffectIndex >= 0) {
            // 叠加次数
            newActiveEffects[existingEffectIndex] = {
              ...newActiveEffects[existingEffectIndex],
              remainingCount: newActiveEffects[existingEffectIndex].remainingCount + duration,
              value: adjustedBoostValue,
            };
            effectMessage += `${effect.description || effect.type}（剩余${newActiveEffects[existingEffectIndex].remainingCount}次）`;
          } else {
            // 新效果
            newActiveEffects.push({
              itemId: item.definition.id,
              itemName: item.definition.name,
              type: effect.type,
              value: adjustedBoostValue,
              remainingCount: duration
            });
            effectMessage += effect.description || `${effect.type}+${adjustedBoostValue}%（剩余${duration}次）`;
          }
        } else if (effect.duration && effect.duration > 0) {
          const adjustedValueWithDuration = Math.floor(effect.value * effectMultiplier);
          const existingEffectIndex = newActiveEffects.findIndex(
            e => e.itemId === item.definition.id && e.type === effect.type
          );
          
          if (existingEffectIndex >= 0) {
            newActiveEffects[existingEffectIndex] = {
              ...newActiveEffects[existingEffectIndex],
              remainingCount: newActiveEffects[existingEffectIndex].remainingCount + effect.duration,
              value: adjustedValueWithDuration,
            };
            effectMessage += `${effect.description}（剩余${newActiveEffects[existingEffectIndex].remainingCount}次）`;
          } else {
            newActiveEffects.push({
              itemId: item.definition.id,
              itemName: item.definition.name,
              type: effect.type,
              value: adjustedValueWithDuration,
              remainingCount: effect.duration
            });
            effectMessage += `${effect.description}（剩余${effect.duration}次）`;
          }
        } else if (effect.type === 'restore') {
          statChanges.体质 = (statChanges.体质 || 0) + Math.floor(effect.value * effectMultiplier);
          effectMessage += `体质恢复${Math.floor(effect.value * effectMultiplier)}点。`;
        }
      }
      
      // 合并负面效果属性变化
      if (Object.keys(sideEffectStats).length > 0) {
        for (const [stat, value] of Object.entries(sideEffectStats)) {
          statChanges[stat as keyof LegacyStats] = 
            (statChanges[stat as keyof LegacyStats] || 0) + (value || 0);
        }
      }
      
      // 计算实际恢复量（不超过上限）
      const newHp = Math.min(
        prev.protagonist.maxHp,
        Math.max(1, prev.protagonist.currentHp + hpRestored)
      );
      const newMp = Math.min(
        prev.protagonist.maxMp,
        Math.max(0, prev.protagonist.currentMp + mpRestored)
      );
      const actualHpRestored = newHp - prev.protagonist.currentHp;
      const actualMpRestored = newMp - prev.protagonist.currentMp;
      
      // 更新效果消息
      if (hpRestored > 0 || mpRestored > 0) {
        effectMessage = `生命+${actualHpRestored} 法力+${actualMpRestored}`;
      }
      
      // 添加境界消息
      if (realmMessage) {
        effectMessage = `${effectMessage} [${realmMessage}]`;
      }
      
      // 应用道具属性变化到基础属性（不受等级上限限制）
      const newStats = Object.keys(statChanges).length > 0 
        ? applyBaseStatChanges(
            prev.protagonist.stats,
            statChanges as any
          )
        : prev.protagonist.stats;
      
      // 更新背包
      const newInventory = [...(prev.protagonist.inventory || [])];
      if (item.quantity > 1) {
        newInventory[itemIndex] = { ...item, quantity: item.quantity - 1 };
      } else {
        newInventory.splice(itemIndex, 1);
      }
      
      const resultMessage = `使用了${item.definition.name}！${effectMessage}`;
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          stats: newStats,
          inventory: newInventory,
          activeEffects: newActiveEffects,
          currentHp: newHp,
          currentMp: newMp,
        },
        statistics: {
          ...prev.statistics,
          totalItemsUsed: (prev.statistics.totalItemsUsed || 0) + 1,
        },
        lastActionResult: {
          success: true,
          message: resultMessage,
        },
        messages: addMessageInternal(prev.messages, 'success', '使用道具', resultMessage),
      };
    });
  }, [addMessageInternal]);

  // ========================================
  // exitAdventure 已移至 useGameAdventure hook
  // ========================================

  // 公共的消息方法
  const addMessage = useCallback((
    type: MessageRecord['type'],
    title: string,
    content: string,
    details?: string,
    rewards?: MessageRecord['rewards']
  ) => {
    setGameState(prev => ({
      ...prev,
      messages: addMessageInternal(prev.messages, type, title, content, details, rewards),
    }));
  }, [addMessageInternal]);

  // 加载更多消息
  const loadMoreMessages = useCallback(async (): Promise<boolean> => {
    setIsLoadingMessages(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setGameState(prev => ({
      ...prev,
      totalMessageCount: prev.messages.length,
    }));
    setIsLoadingMessages(false);
    return false;
  }, []);

  // 重置游戏
  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    localStorage.removeItem('gameState');
    
    // 清除商店相关数据
    localStorage.removeItem('shop_daily_sale');
    localStorage.removeItem('shop_favorites');
    localStorage.removeItem('shop_persist_data');
    localStorage.removeItem('shop_level_data');
    localStorage.removeItem('shop_task_state');
  }, []);

  // ========================================
  // 自动修炼切换已移至 useGameCultivation hook
  // ========================================

  // 装备功法
  const equipTechnique = useCallback((technique: Technique, slotIndex?: number) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      const type = technique.type;
      const slotsKey = type === 'attack' ? 'equippedAttackTechniques' : 'equippedDefenseTechniques';
      const currentSlots = prev.protagonist[slotsKey] || [null, null, null];
      
      // 确保 slots 是一个长度为 3 的数组
      const slots: (Technique | null)[] = [
        currentSlots[0] ?? null,
        currentSlots[1] ?? null,
        currentSlots[2] ?? null,
      ];
      
      // 检查该功法是否已经装备在其他槽位
      const existingIndex = slots.findIndex(t => t?.id === technique.id);
      if (existingIndex >= 0) {
        // 已经装备，不重复操作
        return prev;
      }
      
      // 找到目标槽位
      let targetIndex = slotIndex;
      if (targetIndex === undefined || targetIndex < 0 || targetIndex > 2) {
        // 如果没有指定槽位，找第一个空槽位
        targetIndex = slots.findIndex(t => t === null);
        if (targetIndex === -1) {
          // 没有空槽位，替换第一个
          targetIndex = 0;
        }
      }
      
      // 装备到目标槽位
      const newSlots = [...slots] as [Technique | null, Technique | null, Technique | null];
      newSlots[targetIndex] = technique;
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          [slotsKey]: newSlots,
        },
      };
    });
  }, []);

  // 卸下功法
  const unequipTechnique = useCallback((type: 'attack' | 'defense', slotIndex?: number) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      const slotsKey = type === 'attack' ? 'equippedAttackTechniques' : 'equippedDefenseTechniques';
      const currentSlots = prev.protagonist[slotsKey] || [null, null, null];
      
      // 确保 slots 是一个长度为 3 的数组
      const slots: (Technique | null)[] = [
        currentSlots[0] ?? null,
        currentSlots[1] ?? null,
        currentSlots[2] ?? null,
      ];
      
      if (slotIndex !== undefined && slotIndex >= 0 && slotIndex <= 2) {
        // 卸下指定槽位
        const newSlots = [...slots] as [Technique | null, Technique | null, Technique | null];
        newSlots[slotIndex] = null;
        
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            [slotsKey]: newSlots,
          },
        };
      } else {
        // 卸下所有该类型的功法
        const newSlots: [Technique | null, Technique | null, Technique | null] = [null, null, null];
        
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            [slotsKey]: newSlots,
          },
        };
      }
    });
  }, []);

  // 装备物品
  const equipEquipment = useCallback((equipment: Equipment) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          [`equipped${equipment.slot.charAt(0).toUpperCase() + equipment.slot.slice(1)}`]: equipment,
        } as any,
      };
    });
  }, []);

  // 卸下装备
  const unequipEquipment = useCallback((slot: EquipmentSlot) => {
    setGameState(prev => ({
      ...prev,
      protagonist: prev.protagonist ? {
        ...prev.protagonist,
        [`equipped${slot.charAt(0).toUpperCase() + slot.slice(1)}`]: null,
      } as any : null,
    }));
  }, []);

  // 更新功法（用于技能装备变更）
  const updateTechnique = useCallback((updatedTechnique: Technique) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      const techniqueIndex = prev.protagonist.techniques.findIndex(
        t => t.id === updatedTechnique.id
      );
      
      if (techniqueIndex === -1) return prev;
      
      const newTechniques = [...prev.protagonist.techniques];
      newTechniques[techniqueIndex] = updatedTechnique;
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          techniques: newTechniques,
        },
      };
    });
  }, []);

  // 更新装备（用于技巧装备变更）
  const updateEquipment = useCallback((updatedEquipment: Equipment) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      const equipmentIndex = prev.protagonist.equipments.findIndex(
        e => e.id === updatedEquipment.id
      );
      
      if (equipmentIndex === -1) return prev;
      
      const newEquipments = [...prev.protagonist.equipments];
      newEquipments[equipmentIndex] = updatedEquipment;
      
      // 同时更新当前装备槽位
      const slotKey = `equipped${updatedEquipment.slot.charAt(0).toUpperCase() + updatedEquipment.slot.slice(1)}` as keyof typeof prev.protagonist;
      const currentEquipped = prev.protagonist[slotKey] as Equipment | null;
      const isCurrentlyEquipped = currentEquipped?.id === updatedEquipment.id;
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          equipments: newEquipments,
          ...(isCurrentlyEquipped ? { [slotKey]: updatedEquipment } : {}),
        } as any,
      };
    });
  }, []);

  // 货币名称映射 - 根据世界类型获取
  const getCurrencyName = (type: string, worldType?: string): string => {
    // 对于 spirit_stone，根据世界类型返回不同名称
    if (type === 'spirit_stone') {
      const resourceNames: Record<string, string> = {
        '修仙': '灵石',
        '高武': '武晶',
        '科幻': '能量块',
        '魔法': '魔晶',
        '异能': '源能石',
        '仙界': '仙石',
        '武侠': '银两',
        '末世': '补给点',
      };
      return worldType ? (resourceNames[worldType] || '灵石') : '灵石';
    }
    
    const names: Record<string, string> = {
      contribution: '贡献',
      honor_point: '荣誉',
      sect_point: '宗门积分',
      ascension_mark: '飞升印记',
      event_token: '活动代币',
    };
    return names[type] || type;
  };

  // 购买商店物品（完整实现）
  const buyShopItem = useCallback((
    itemId: string,
    price: number,
    currencyType: string,
    type: 'item' | 'technique' | 'equipment',
    itemData?: any,
    quantity: number = 1,
    newCurrencies?: { spirit_stone?: number; contribution?: number }
  ) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;

      const totalCost = price * quantity;
      const itemDef = itemData as ItemDefinition | undefined;
      
      // 防御性检查：如果没有物品数据，只更新货币
      if (!itemDef || !itemDef.name) {
        const currencyName = getCurrencyName(currencyType, prev.protagonist.world.type);
        const message = `花费 ${totalCost} ${currencyName}`;
        
        // 只更新货币库存
        let newInventory = prev.protagonist.inventory;
        if (newCurrencies && newCurrencies.spirit_stone !== undefined) {
          const spiritStoneIndex = newInventory.findIndex(i => i.definition.id === 'spirit_stone');
          if (spiritStoneIndex !== -1) {
            newInventory = [...newInventory];
            newInventory[spiritStoneIndex] = {
              ...newInventory[spiritStoneIndex],
              quantity: newCurrencies.spirit_stone,
            };
          }
        }
        
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            inventory: newInventory,
            currencies: {
              ...prev.protagonist.currencies,
              contribution: newCurrencies?.contribution ?? prev.protagonist.currencies?.contribution ?? 0,
            },
          },
          messages: addMessageInternal(prev.messages, 'success', '购买成功', message),
        };
      }
      
      const itemName = itemDef.name || itemId;
      const currencyName = getCurrencyName(currencyType, prev.protagonist.world.type);

      // 创建新物品
      const newItem = createInventoryItem(itemDef, quantity);

      // 添加到背包
      let newInventory = addToInventory(prev.protagonist.inventory, newItem);

      // 如果有新的货币状态，更新武晶库存
      if (newCurrencies && newCurrencies.spirit_stone !== undefined) {
        const spiritStoneIndex = newInventory.findIndex(i => i.definition.id === 'spirit_stone');
        if (spiritStoneIndex !== -1) {
          // 更新现有武晶数量
          newInventory = [...newInventory];
          newInventory[spiritStoneIndex] = {
            ...newInventory[spiritStoneIndex],
            quantity: newCurrencies.spirit_stone,
          };
        } else if (newCurrencies.spirit_stone > 0) {
          // 添加武晶物品
          const spiritStoneDef: ItemDefinition = {
            id: 'spirit_stone',
            name: '武晶',
            type: '灵石',
            rarity: '普通',
            description: '修仙界的通用货币',
            stackable: true,
            maxStack: 999999,
            effects: [],
          };
          newInventory = addToInventory(newInventory, createInventoryItem(spiritStoneDef, newCurrencies.spirit_stone));
        }
      }

      // 生成详细的购买消息
      const message = quantity > 1
        ? `花费 ${totalCost} ${currencyName}，购买了 ${quantity} 个「${itemName}」`
        : `花费 ${totalCost} ${currencyName}，购买了「${itemName}」`;

      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          inventory: newInventory,
          currencies: {
            ...prev.protagonist.currencies,
            contribution: newCurrencies?.contribution ?? prev.protagonist.currencies?.contribution ?? 0,
          },
        },
        messages: addMessageInternal(prev.messages, 'success', '购买成功', message),
      };
    });
  }, [addMessageInternal]);

  // 使用贡献购买
  const buyWithContribution = useCallback((
    itemId: string,
    price: number,
    type: 'item' | 'technique' | 'equipment',
    itemData?: any,
    quantity: number = 1
  ) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;

      const totalCost = price * quantity;
      const itemDef = itemData as ItemDefinition;
      const itemName = itemDef?.name || itemId;

      // 创建新物品
      const newItem = createInventoryItem(itemDef, quantity);

      // 添加到背包
      const newInventory = addToInventory(prev.protagonist.inventory, newItem);

      // 生成详细的购买消息
      const message = quantity > 1
        ? `花费 ${totalCost} 贡献，购买了 ${quantity} 个「${itemName}」`
        : `花费 ${totalCost} 贡献，购买了「${itemName}」`;

      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          inventory: newInventory,
        },
        messages: addMessageInternal(prev.messages, 'success', '购买成功', message),
      };
    });
  }, [addMessageInternal]);

  // 开始炼丹
  const startCrafting = useCallback((recipeId: string) => {
    setGameState(prev => ({
      ...prev,
      crafting: {
        recipeId,
        startTime: Date.now(),
        duration: 5000,
        quality: '中品' as const,
        success: true,
      } as CraftingState,
    }));
  }, []);

  // 完成炼丹
  const finishCrafting = useCallback(() => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      const newInventory = [...prev.protagonist.inventory];
      // 添加一个默认丹药
      const pillDef: ItemDefinition = {
        id: 'pill_test',
        name: '测试丹药',
        type: '丹药',
        rarity: '普通' as const,
        description: '测试用丹药',
        effects: [],
        stackable: true,
        maxStack: 99,
      };
      newInventory.push(createInventoryItem(pillDef, 1));
      
      return {
        ...prev,
        crafting: null,
        protagonist: {
          ...prev.protagonist,
          inventory: newInventory,
        },
        messages: addMessageInternal(prev.messages, 'success', '炼丹完成', '炼制成功！'),
      };
    });
  }, [addMessageInternal]);

  // 开始炼器
  const startForging = useCallback((recipeId: string) => {
    setGameState(prev => ({
      ...prev,
      forging: {
        recipeId,
        startTime: Date.now(),
        duration: 5000,
        quality: '普通' as const,
        success: true,
      } as ForgingState,
    }));
  }, []);

  // 完成炼器
  const finishForging = useCallback(() => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      
      const newEquipment = createMinimalEquipment(
        `eq_${Date.now()}`,
        '炼制武器',
        'melee',
        '普通',
        {
          description: '炼制获得的武器',
          attackBonus: 10,
          power: 20,
        }
      );
      
      return {
        ...prev,
        forging: null,
        protagonist: {
          ...prev.protagonist,
          equipments: [...prev.protagonist.equipments, newEquipment],
        },
        messages: addMessageInternal(prev.messages, 'success', '炼器完成', '炼制成功！'),
      };
    });
  }, [addMessageInternal]);

  // 升级功法
  const performUpgradeTechnique = useCallback((targetId: string, materialIds: string[]) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      // 查找目标功法
      const technique = prev.protagonist.techniques.find(t => t.id === targetId);
      if (!technique) return prev;
      
      // 查找材料功法
      const materialTechniques = prev.protagonist.techniques.filter(t => materialIds.includes(t.id));
      if (materialTechniques.length === 0) return prev;
      
      // 计算总经验值
      const totalExp = materialTechniques.reduce((sum, t) => {
        return sum + getMaterialExpValue(t.level, t.rarity);
      }, 0);
      
      // 执行升级
      const { technique: upgradedTechnique, levelsGained } = upgradeTechnique(technique, totalExp);
      
      // 移除已消耗的材料，并更新目标功法
      const updatedTechniques = prev.protagonist.techniques
        .filter(t => !materialIds.includes(t.id)) // 移除材料
        .map(t => t.id === targetId ? upgradedTechnique : t); // 更新目标功法
      
      // 同步更新已装备功法字段（修复tooltip经验值不更新的问题）
      const updateEquippedTechniques = (techniques: (Technique | null)[]): (Technique | null)[] => {
        return techniques.map(t => t && t.id === targetId ? upgradedTechnique : t);
      };
      
      // 生成升级消息
      const upgradeMsg = levelsGained > 0 
        ? `消耗 ${materialTechniques.length} 个材料，${technique.name} 升级到 Lv.${upgradedTechnique.level}！威力+${upgradedTechnique.power - technique.power}，加成+${(upgradedTechnique.bonus - technique.bonus).toFixed(1)}%`
        : `消耗 ${materialTechniques.length} 个材料，获得 ${totalExp} 经验`;
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          techniques: updatedTechniques,
          // 同步更新已装备功法字段
          equippedAttackTechniques: updateEquippedTechniques(prev.protagonist.equippedAttackTechniques),
          equippedDefenseTechniques: updateEquippedTechniques(prev.protagonist.equippedDefenseTechniques),
        },
        messages: addMessageInternal(prev.messages, levelsGained > 0 ? 'success' : 'info', '功法升级', upgradeMsg),
      };
    });
  }, [addMessageInternal]);

  // 升级装备
  const performUpgradeEquipment = useCallback((targetId: string, materialIds: string[]) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      // 查找目标装备
      const equipment = prev.protagonist.equipments.find(e => e.id === targetId);
      if (!equipment) return prev;
      
      // 查找材料装备
      const materialEquipments = prev.protagonist.equipments.filter(e => materialIds.includes(e.id));
      if (materialEquipments.length === 0) return prev;
      
      // 计算总经验值
      const totalExp = materialEquipments.reduce((sum, e) => {
        return sum + getMaterialExpValue(e.level, e.rarity);
      }, 0);
      
      // 执行升级
      const { equipment: upgradedEquipment, levelsGained } = upgradeEquipment(equipment, totalExp);
      
      // 移除已消耗的材料，并更新目标装备
      const updatedEquipments = prev.protagonist.equipments
        .filter(e => !materialIds.includes(e.id)) // 移除材料
        .map(e => e.id === targetId ? upgradedEquipment : e); // 更新目标装备
      
      // 同步更新已装备字段（修复tooltip经验值不更新的问题）
      const updateEquippedField = <T extends Equipment | null>(equipped: T): T => {
        if (equipped && equipped.id === targetId) {
          return upgradedEquipment as T;
        }
        return equipped;
      };
      
      // 生成升级消息
      const upgradeMsg = levelsGained > 0 
        ? `消耗 ${materialEquipments.length} 件材料，${equipment.name} 升级到 Lv.${upgradedEquipment.level}！`
        : `消耗 ${materialEquipments.length} 件材料，获得 ${totalExp} 经验`;
      
      return {
        ...prev,
        protagonist: {
          ...prev.protagonist,
          equipments: updatedEquipments,
          // 同步更新所有已装备字段
          equippedMelee: updateEquippedField(prev.protagonist.equippedMelee),
          equippedRanged: updateEquippedField(prev.protagonist.equippedRanged),
          equippedHead: updateEquippedField(prev.protagonist.equippedHead),
          equippedBody: updateEquippedField(prev.protagonist.equippedBody),
          equippedLegs: updateEquippedField(prev.protagonist.equippedLegs),
          equippedFeet: updateEquippedField(prev.protagonist.equippedFeet),
        },
        messages: addMessageInternal(prev.messages, levelsGained > 0 ? 'success' : 'info', '装备升级', upgradeMsg),
      };
    });
  }, [addMessageInternal]);

  // ========================================
  // 势力相关方法已移至 useGameFaction hook
  // joinFaction, leaveFaction, claimAchievementReward, selectCultivationPath,
  // performEnhanceEquipment, performRefineEquipment, claimTaskReward, claimDailySalary,
  // acceptTask, submitTask, refreshTasks, donate, promoteRank
  // ========================================

  // 渡劫
  const performTribulation = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      messages: addMessageInternal(prev.messages, 'info', '渡劫', '准备渡劫...'),
    }));
  }, [addMessageInternal]);

  // 挑战天道
  const challengeGuardian = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      ascensionFlow: {
        ...DEFAULT_ASCENSION_FLOW_STATE,
        phase: 'battle',
      },
    }));
  }, []);

  // ========================================
  // 爬塔系统
  // ========================================

  // 挑战爬塔
  const challengeTower = useCallback((floor: number, enemy: TowerEnemy) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;
      
      // 检查是否可以挑战该层（只能挑战下一层）
      const towerProgress = prev.protagonist.towerProgress ?? createDefaultTowerProgress();
      const nextFloor = towerProgress.maxClearedFloor + 1;
      if (floor !== nextFloor) {
        return {
          ...prev,
          messages: addMessageInternal(
            prev.messages,
            'warning',
            '无法挑战',
            `只能按顺序挑战第${nextFloor}层`
          ),
        };
      }
      
      // 创建交互式战斗状态
      const activeBattle: ActiveBattleState = {
        cellType: 'enemy', // 使用 enemy 类型
        enemyName: enemy.name,
        enemyLevel: enemy.level,
        cellPosition: { row: 0, col: floor }, // 使用 col 存储楼层信息
        isActive: true,
        source: 'tower',
        towerFloor: floor,
        towerEnemy: enemy,
      };
      
      // 爬塔战斗使用独立的满状态，不影响玩家实际状态
      return {
        ...prev,
        activeBattle,
        messages: addMessageInternal(
          prev.messages,
          'info',
          '试炼挑战',
          `开始挑战第${floor}层 - ${enemy.name}(Lv.${enemy.level})！`
        ),
      };
    });
  }, [addMessageInternal]);

  // 飞升战斗结束
  const onAscensionBattleEnd = useCallback((result: { victory: boolean; turnsUsed: number; remainingHpPercent: number; phasesCleared: number }) => {
    setGameState(prev => ({
      ...prev,
      ascensionFlow: {
        ...(prev.ascensionFlow || DEFAULT_ASCENSION_FLOW_STATE),
        phase: result.victory ? 'inheritance' : 'complete',
        discoveredWorlds: prev.ascensionFlow?.discoveredWorlds || [],
      },
    }));
  }, []);

  // 确认传承
  const onInheritanceConfirm = useCallback((choice: InheritanceChoice) => {
    setGameState(prev => ({
      ...prev,
      ascensionFlow: {
        ...(prev.ascensionFlow || DEFAULT_ASCENSION_FLOW_STATE),
        phase: 'world_reveal',
        inheritanceChoice: choice,
        discoveredWorlds: prev.ascensionFlow?.discoveredWorlds || [],
      },
    }));
  }, []);

  // 跳过传承
  const onInheritanceSkip = useCallback(() => {
    onInheritanceConfirm({
      techniqueId: null,
      equipmentId: null,
      spiritStonesPercent: 0,
    });
  }, [onInheritanceConfirm]);

  // 确认世界
  const onWorldConfirm = useCallback((newWorld?: NewWorldInfo) => {
    setGameState(prev => ({
      ...prev,
      ascensionFlow: DEFAULT_ASCENSION_FLOW_STATE,
    }));
  }, []);

  // 重新随机世界
  const onWorldReroll = useCallback(() => {
    // 重新生成世界
  }, []);

  // 开发者模式切换
  const onToggleDevInvincible = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      devMode: {
        invincible: !prev.devMode?.invincible,
      },
      messages: addMessageInternal(
        prev.messages,
        'info',
        '开发者',
        `战斗无敌模式: ${!prev.devMode?.invincible ? '已启用' : '已关闭'}`
      ),
    }));
  }, [addMessageInternal]);

  // 碎片合成（新版逻辑：优先同名碎片合成）
  const synthesizeFragment = useCallback((type: 'technique' | 'equipment', rarity: ItemRarity, sourceName?: string) => {
    setGameState(prev => {
      if (!prev.protagonist) return prev;

      const fragmentInventory = prev.protagonist.fragmentInventory ?? createEmptyFragmentInventory();
      const playerLevel = prev.protagonist.level;
      const worldType = prev.protagonist.world.type;
      
      let result: { success: boolean; item?: Technique | Equipment; itemType?: 'technique' | 'equipment'; message: string };
      
      // 优先使用同名碎片合成
      if (sourceName) {
        result = synthesizeFragmentByName(fragmentInventory, sourceName, type);
      } else {
        // 没有指定名称时，查找可合成的同名碎片组
        const groups = getFragmentGroupsByName(fragmentInventory);
        const synthesizableGroup = groups.find(g => g.type === type && g.rarity === rarity && g.canSynthesize);
        
        if (synthesizableGroup) {
          result = synthesizeFragmentByName(fragmentInventory, synthesizableGroup.sourceName, type);
        } else {
          // 降级使用旧版按稀有度合成
          result = synthesizeFragmentGroup(fragmentInventory, type, rarity, playerLevel, worldType);
        }
      }

      if (result.success && result.item) {
        if (type === 'technique') {
          const newTechniques = [...prev.protagonist.techniques, result.item as Technique];
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              techniques: newTechniques,
              fragmentInventory,
            },
            messages: addMessageInternal(
              prev.messages,
              'success',
              '合成成功',
              result.message
            ),
          };
        } else {
          const newEquipments = [...prev.protagonist.equipments, result.item as Equipment];
          return {
            ...prev,
            protagonist: {
              ...prev.protagonist,
              equipments: newEquipments,
              fragmentInventory,
            },
            messages: addMessageInternal(
              prev.messages,
              'success',
              '重铸成功',
              result.message
            ),
          };
        }
      } else {
        return {
          ...prev,
          messages: addMessageInternal(
            prev.messages,
            'failure',
            type === 'technique' ? '合成失败' : '重铸失败',
            result.message
          ),
        };
      }
    });
  }, [addMessageInternal]);

  // 导出存档
  const exportSave = useCallback(() => {
    return JSON.stringify(gameState);
  }, [gameState]);

  // 导入存档
  const importSave = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      setGameState(imported);
    } catch (e) {
      console.error('Failed to import save:', e);
    }
  }, []);

  // 清除离线结果
  const clearOfflineResult = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      offlineResult: undefined,
      offlineResultV2: undefined,
    }));
  }, []);

  // 应用离线收益奖励
  const applyOfflineRewards = useCallback(() => {
    const offlineResult = gameState.offlineResultV2;
    if (!offlineResult || !gameState.protagonist) return;
    
    const rewards = offlineResult.rewards;
    const protagonist = gameState.protagonist;
    const towerProgress = protagonist.towerProgress ?? createDefaultTowerProgress();
    
    // 应用收益到主角
    const newProtagonist = { ...protagonist };
    const newInventory = [...protagonist.inventory];
    
    // 应用经验
    if (rewards.experience > 0) {
      newProtagonist.experience = (newProtagonist.experience || 0) + rewards.experience;
    }
    
    // 应用HP/MP恢复
    if (rewards.hp > 0) {
      newProtagonist.currentHp = Math.min(newProtagonist.maxHp, newProtagonist.currentHp + rewards.hp);
    }
    if (rewards.mp > 0) {
      newProtagonist.currentMp = Math.min(newProtagonist.maxMp, newProtagonist.currentMp + rewards.mp);
    }
    
    // 应用灵石（添加到背包）
    if (rewards.spiritStones > 0) {
      const existing = newInventory.find(item => item.definition.id === 'spirit_stone');
      if (existing) {
        existing.quantity += rewards.spiritStones;
      } else {
        const def: ItemDefinition = { 
          id: 'spirit_stone', 
          name: '灵石', 
          type: '灵石' as const, 
          rarity: '普通' as const, 
          description: '', 
          effects: [], 
          stackable: true, 
          maxStack: 999999 
        };
        newInventory.push(createInventoryItem(def, rewards.spiritStones));
      }
    }
    
    // 更新掉落池（扣除已获得的灵石）
    const now = Date.now();
    const newDropPool = {
      ...towerProgress.dropPool,
      totalSpiritStones: Math.max(0, towerProgress.dropPool.totalSpiritStones - rewards.spiritStones),
      lastUpdated: now,
    };
    
    newProtagonist.towerProgress = {
      ...towerProgress,
      dropPool: newDropPool,
      totalSpiritStonesEarned: (towerProgress.totalSpiritStonesEarned || 0) + rewards.spiritStones,
    };
    
    // 添加碎片和材料到背包
    const addItemToInventory = (id: string, type: 'fragment' | 'material', rarity: ItemRarity, quantity: number) => {
      const existing = newInventory.find(item => item.definition.id === id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        const def: ItemDefinition = {
          id,
          name: type === 'fragment' ? `${rarity}碎片` : `${rarity}材料`,
          type: type === 'fragment' ? '碎片' : '材料',
          rarity,
          description: '',
          effects: [],
          stackable: true,
          maxStack: 999,
        };
        newInventory.push(createInventoryItem(def, quantity));
      }
    };
    
    rewards.fragments.forEach(fragment => {
      addItemToInventory(fragment.id, 'fragment', fragment.rarity, fragment.quantity);
    });
    
    rewards.materials.forEach(material => {
      addItemToInventory(material.id, 'material', material.rarity, material.quantity);
    });
    
    newProtagonist.inventory = newInventory;
    
    // 更新状态
    setGameState(prev => ({
      ...prev,
      protagonist: newProtagonist,
      offlineResultV2: undefined,
    }));
  }, [gameState.offlineResultV2, gameState.protagonist]);

  // 清除新手引导完成弹窗
  const clearNoviceCompletionDialog = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showNoviceCompletionDialog: false,
    }));
  }, []);

  // 清除新手任务全部完成弹窗
  const clearTutorialCompletionDialog = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showTutorialCompletionDialog: false,
    }));
  }, []);

  // 清除死亡状态
  const clearDeathState = useCallback(() => {
    setGameState(prev => {
      if (!prev.deathState?.isDead) return prev;
      
      // 恢复HP到死亡状态中记录的恢复值
      const recoveryHp = prev.deathState.recoveryHp || Math.floor((prev.protagonist?.maxHp || 100) * 0.3);
      
      return {
        ...prev,
        deathState: undefined,
        protagonist: prev.protagonist ? {
          ...prev.protagonist,
          currentHp: recoveryHp,
        } : null,
      };
    });
  }, []);

  // 开发者工具函数
  const devHandlers = {
    onUpdateLevel: useCallback((level: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            level: Math.max(1, Math.min(100, level)),
            experience: 0,
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `等级设置为 ${level}`),
        };
      });
    }, [addMessageInternal]),

    onUpdateExperience: useCallback((experience: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            experience: Math.max(0, experience),
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `经验设置为 ${experience}`),
        };
      });
    }, [addMessageInternal]),

    onUpdateHp: useCallback((hp: number, maxHp?: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const newMaxHp = maxHp ?? prev.protagonist.maxHp;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            currentHp: Math.max(0, Math.min(newMaxHp, hp)),
            maxHp: newMaxHp,
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `HP设置为 ${hp}`),
        };
      });
    }, [addMessageInternal]),

    onUpdateMp: useCallback((mp: number, maxMp?: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const newMaxMp = maxMp ?? prev.protagonist.maxMp;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            currentMp: Math.max(0, Math.min(newMaxMp, mp)),
            maxMp: newMaxMp,
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `MP设置为 ${mp}`),
        };
      });
    }, [addMessageInternal]),

    onUpdateStat: useCallback((stat: string, value: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const statKey = stat as keyof typeof prev.protagonist.stats;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            stats: {
              ...prev.protagonist.stats,
              [statKey]: Math.max(1, value),
            },
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `${stat}设置为 ${value}`),
        };
      });
    }, [addMessageInternal]),

    onUpdateMentalState: useCallback((mental: number, demonProbability?: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const currentMental = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            mentalState: {
              ...currentMental,
              stability: Math.max(0, Math.min(100, mental)),
              demonChance: demonProbability ?? currentMental.demonChance,
            },
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `心境设置为 ${mental}`),
        };
      });
    }, [addMessageInternal]),

    onUpdatePathLevel: useCallback((pathLevel: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            pathLevel: Math.max(1, pathLevel),
            pathExp: 0,
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `流派等级设置为 ${pathLevel}`),
        };
      });
    }, [addMessageInternal]),

    onAddItem: useCallback((itemId: string, quantity: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const newInventory = [...prev.protagonist.inventory];
        const existing = newInventory.find(item => item.definition.id === itemId);
        if (existing) {
          existing.quantity += quantity;
        } else {
          const def: ItemDefinition = { id: itemId, name: itemId, type: '丹药' as const, rarity: '普通' as const, description: '', effects: [], stackable: true, maxStack: 99 };
          newInventory.push(createInventoryItem(def, quantity));
        }
        return {
          ...prev,
          protagonist: { ...prev.protagonist, inventory: newInventory },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `添加物品 ${itemId} x${quantity}`),
        };
      });
    }, [addMessageInternal]),

    onAddSpiritStones: useCallback((amount: number) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const newInventory = [...prev.protagonist.inventory];
        const existing = newInventory.find(item => item.definition.id === 'spirit_stone');
        if (existing) {
          existing.quantity += amount;
        } else {
          const def: ItemDefinition = { id: 'spirit_stone', name: '灵石', type: '灵石' as const, rarity: '普通' as const, description: '', effects: [], stackable: true, maxStack: 999999 };
          newInventory.push(createInventoryItem(def, amount));
        }
        return {
          ...prev,
          protagonist: { ...prev.protagonist, inventory: newInventory },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `添加灵石 ${amount}`),
        };
      });
    }, [addMessageInternal]),

    onAddTechnique: useCallback((techniqueId: string) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        
        const newTechnique = createMinimalTechnique(
          techniqueId,
          techniqueId,
          'attack',
          '普通',
          {
            description: '开发者添加',
            power: 10,
            bonus: 5,
          }
        );
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            techniques: [...prev.protagonist.techniques, newTechnique],
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `添加功法 ${techniqueId}`),
        };
      });
    }, [addMessageInternal]),

    onAddEquipment: useCallback((equipmentId: string) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        
        const newEquipment = createMinimalEquipment(
          equipmentId,
          equipmentId,
          'melee',
          '普通',
          {
            description: '开发者添加',
            attackBonus: 5,
            power: 10,
          }
        );
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            equipments: [...prev.protagonist.equipments, newEquipment],
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `添加装备 ${equipmentId}`),
        };
      });
    }, [addMessageInternal]),

    // 按配置添加功法（类型+稀有度）- 使用正确的生成函数
    onAddTechniqueByConfig: useCallback((type: TechniqueType, rarity: ItemRarity) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        // 使用正确的功法生成函数
        
        const newTechnique = generateTechniqueByType(
          type,
          1, // difficulty
          prev.protagonist.world.type,
          rarity
        );
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            techniques: [...prev.protagonist.techniques, newTechnique],
          },
          messages: addMessageInternal(prev.messages, 'success', '开发者', 
            `添加${rarity}${type === 'attack' ? '攻击' : '防御'}功法「${newTechnique.name}」`),
        };
      });
    }, [addMessageInternal]),

    // 按配置添加装备（槽位+稀有度）- 使用正确的生成函数
    onAddEquipmentByConfig: useCallback((slot: EquipmentSlot, rarity: ItemRarity) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        // 使用正确的装备生成函数
        
        const newEquipment = generateEquipment(
          slot,
          rarity,
          prev.protagonist.world.type
        );
        const slotNames: Record<EquipmentSlot, string> = {
          melee: '近战武器',
          ranged: '远程武器',
          head: '头部',
          body: '身体',
          legs: '腿部',
          feet: '脚部',
        };
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            equipments: [...prev.protagonist.equipments, newEquipment],
          },
          messages: addMessageInternal(prev.messages, 'success', '开发者', 
            `添加${rarity}${slotNames[slot]}「${newEquipment.name}」`),
        };
      });
    }, [addMessageInternal]),

    onSetCultivationPath: useCallback((pathId: string) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            cultivationPath: pathId as CultivationPath,
            pathLevel: 1,
            pathExp: 0,
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `流派设置为 ${pathId}`),
        };
      });
    }, [addMessageInternal]),

    onTriggerBreakthrough: useCallback(() => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const newLevel = prev.protagonist.level + 1;
        
        // 根据属性重新计算 maxHp 和 maxMp
        const newMaxHp = calculatePlayerMaxHp(
          prev.protagonist.stats.base.体质,
          newLevel,
          prev.protagonist.world.type
        );
        const newMaxMp = calculatePlayerMaxMp(
          prev.protagonist.stats.base.灵根,
          newLevel,
          prev.protagonist.world.type
        );
        
        return {
          ...prev,
          statistics: {
            ...prev.statistics,
            maxLevel: Math.max(prev.statistics.maxLevel, newLevel),
            totalBreakthroughs: prev.statistics.totalBreakthroughs + 1,
          },
          protagonist: {
            ...prev.protagonist,
            level: newLevel,
            experience: 0,
            maxHp: newMaxHp,
            currentHp: newMaxHp,
            maxMp: newMaxMp,
            currentMp: newMaxMp,
          },
          messages: addMessageInternal(prev.messages, 'success', '开发者', `突破至 ${newLevel} 级`),
        };
      });
    }, [addMessageInternal]),

    onTriggerTribulation: useCallback(() => {
      setGameState(prev => ({
        ...prev,
        messages: addMessageInternal(prev.messages, 'warning', '开发者', '渡劫触发'),
      }));
    }, [addMessageInternal]),

    onTriggerDemon: useCallback(() => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const currentMental = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            mentalState: {
              ...currentMental,
              stability: Math.max(0, currentMental.stability - 30),
              demonChance: Math.min(100, currentMental.demonChance + 15),
            },
          },
          messages: addMessageInternal(prev.messages, 'warning', '开发者', '心魔触发'),
        };
      });
    }, [addMessageInternal]),

    onResetCooldowns: useCallback(() => {
      setGameState(prev => ({
        ...prev,
        messages: addMessageInternal(prev.messages, 'success', '开发者', '冷却已重置'),
      }));
    }, [addMessageInternal]),

    onSetWorldType: useCallback((worldType: string) => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            world: { ...prev.protagonist.world, type: worldType as any },
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', `世界观设置为 ${worldType}`),
        };
      });
    }, [addMessageInternal]),

    onFullRestore: useCallback(() => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        const currentMental = prev.protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            currentHp: prev.protagonist.maxHp,
            currentMp: prev.protagonist.maxMp,
            stamina: prev.protagonist.maxStamina,
            mentalState: {
              ...currentMental,
              stability: 100,
              demonChance: 0,
            },
          },
          messages: addMessageInternal(prev.messages, 'success', '开发者', '状态已完全恢复'),
        };
      });
    }, [addMessageInternal]),

    onAddAllItems: useCallback(() => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: { ...prev.protagonist, inventory: [] },
          messages: addMessageInternal(prev.messages, 'info', '开发者', '所有物品已添加'),
        };
      });
    }, [addMessageInternal]),

    onMaxStats: useCallback(() => {
      setGameState(prev => {
        if (!prev.protagonist) return prev;
        return {
          ...prev,
          protagonist: {
            ...prev.protagonist,
            stats: { 
              base: { 体质: 999, 灵根: 999, 悟性: 999, 幸运: 999, 意志: 999 },
              growth: { 体质: 999, 灵根: 999, 悟性: 999, 幸运: 999, 意志: 999 },
            },
            maxHp: 99999,
            currentHp: 99999,
            maxMp: 99999,
            currentMp: 99999,
            stamina: 999,
            maxStamina: 999,
          },
          messages: addMessageInternal(prev.messages, 'info', '开发者', '所有属性已最大化'),
        };
      });
    }, [addMessageInternal]),
  };

  return (
    <GameContext.Provider value={{
      gameState,
      startNewGame,
      refreshCharacters,
      selectCharacter,
      selectWorld,
      confirmBackstory,
      performCultivation: cultivationHook.performCultivation,
      performRest: cultivationHook.performRest,
      performSeclusion: seclusionHook.performSeclusion,
      startExperience: adventureHook.startExperience,
      handleEventChoice: adventureHook.handleEventChoice,
      startAdventure: adventureHook.startAdventure,
      quickSweep: adventureHook.quickSweep,
      moveInAdventure: adventureHook.moveInAdventure,
      clearLastResult: adventureHook.clearLastResult,
      handleBattleEnd: adventureHook.handleBattleEnd,
      toggleAutoBattle: adventureHook.toggleAutoBattle,
      setCurrentTab,
      useItem,
      exitAdventure: adventureHook.exitAdventure,
      addMessage,
      loadMoreMessages,
      hasMoreMessages,
      isLoadingMessages,
      getAvailableDifficulties: adventureHook.getDifficulties,
      resetGame,
      toggleAutoCultivation: cultivationHook.toggleAutoCultivation,
      equipTechnique,
      unequipTechnique,
      equipEquipment,
      unequipEquipment,
      updateTechnique,
      updateEquipment,
      buyShopItem,
      buyWithContribution,
      startCrafting,
      finishCrafting,
      startForging,
      finishForging,
      performUpgradeTechnique,
      performUpgradeEquipment,
      joinFaction: factionHook.joinFaction,
      leaveFaction: factionHook.leaveFaction,
      claimAchievementReward: factionHook.claimAchievementReward,
      selectCultivationPath: factionHook.handleSelectCultivationPath,
      performEnhanceEquipment: factionHook.handlePerformEnhanceEquipment,
      performRefineEquipment: factionHook.handlePerformRefineEquipment,
      claimTaskReward: factionHook.handleClaimTaskReward,
      claimDailySalary: factionHook.handleClaimDailySalary,
      acceptTask: factionHook.handleAcceptTask,
      submitTask: factionHook.handleSubmitTask,
      refreshTasks: factionHook.handleRefreshTasks,
      donate: factionHook.handleDonate,
      promoteRank: factionHook.handlePromoteRank,
      performTribulation,
      challengeGuardian,
      onAscensionBattleEnd,
      onInheritanceConfirm,
      onInheritanceSkip,
      onWorldConfirm,
      onWorldReroll,
      devInvincible: gameState.devMode?.invincible ?? false,
      onToggleDevInvincible,
      exportSave,
      synthesizeFragment,
      importSave,
      clearOfflineResult,
      applyOfflineRewards,
      clearNoviceCompletionDialog,
      clearTutorialCompletionDialog,
      clearDeathState,
      // 爬塔系统
      challengeTower,
      devHandlers,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
