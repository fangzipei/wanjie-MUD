'use client';

import { useMemo, useCallback } from 'react';

import { getRealmName, getNextRealm, getNextMainRealmLevel, getMainRealmName } from '@/modules/progression/data/realmData';
import { 
  calculatePlayerAttack, 
  calculatePlayerDefense,
  calculatePlayerMaxHp,
  calculatePlayerMaxMp
} from '@/modules/progression/logic/balanceConfig';
import { getMaxExperience } from '@/modules/progression/logic/cultivation';
import { getActualStatCap } from '@/modules/progression/logic/realmSystem';
import { MAX_LEVEL } from '@/modules/progression/logic/realmSystem';
import { getAttributeNames, getTerminology, getDungeonInfo } from '@/modules/narrative/logic/terminology';
import { 
  Protagonist, 
  InventoryItem, 
  Technique, 
  TechniqueType,
  CharacterStats,
  ActiveEffect,
  DungeonConfig
} from '@/shared/lib/types';
import { getFinalStats } from '@/shared/lib/types';

import { useGame } from './useGameState';

// 计算战斗加成
function calculateCombatBoost(activeEffects: ActiveEffect[]): number {
  let totalBoost = 0;
  for (const effect of activeEffects) {
    if (effect.type === 'combat_boost') {
      totalBoost += effect.value;
    }
  }
  return totalBoost;
}

/**
 * 获取主角信息
 */
export function useProtagonist() {
  const { gameState } = useGame();
  
  return useMemo(() => {
    return gameState.protagonist;
  }, [gameState.protagonist]);
}

/**
 * 获取主角基本信息（名称、等级、境界等）
 */
export function useProtagonistInfo() {
  const { gameState } = useGame();
  
  return useMemo(() => {
    const protagonist = gameState.protagonist;
    if (!protagonist) return null;
    
    const realmSystem = protagonist.world.realmSystem;
    const currentRealm = getRealmName(realmSystem, protagonist.level);
    const nextRealm = getNextRealm(realmSystem, protagonist.level);
    const nextMainRealmLevel = getNextMainRealmLevel(realmSystem, protagonist.level);
    const nextMainRealmName = nextMainRealmLevel ? getMainRealmName(realmSystem, nextMainRealmLevel) : null;
    const maxExperience = getMaxExperience(protagonist.level);
    const expPercentage = Math.min((protagonist.experience / maxExperience) * 100, 100);
    
    return {
      name: protagonist.character.name,
      level: protagonist.level,
      realm: currentRealm,
      nextRealm,
      nextMainRealmName,
      nextMainRealmLevel,
      maxExperience,
      expPercentage,
      isMaxLevel: protagonist.level >= MAX_LEVEL,
      world: protagonist.world,
      character: protagonist.character,
    };
  }, [gameState.protagonist]);
}

/**
 * 获取HP/MP状态
 */
export function useHpMp() {
  const { gameState } = useGame();
  
  return useMemo(() => {
    const protagonist = gameState.protagonist;
    if (!protagonist) return null;
    
    return {
      currentHp: protagonist.currentHp,
      maxHp: protagonist.maxHp,
      hpPercentage: Math.max(0, (protagonist.currentHp / protagonist.maxHp) * 100),
      currentMp: protagonist.currentMp,
      maxMp: protagonist.maxMp,
      mpPercentage: Math.max(0, (protagonist.currentMp / protagonist.maxMp) * 100),
    };
  }, [gameState.protagonist]);
}

/**
 * 获取属性信息
 */
export function useStats() {
  const { gameState } = useGame();
  
  return useMemo(() => {
    const protagonist = gameState.protagonist;
    if (!protagonist) return null;
    
    const worldType = protagonist.world.type;
    const attrNames = getAttributeNames(worldType);
    const stats = protagonist.stats;
    const statCapBonuses = protagonist.statCapBonuses || {};
    
    // 获取最终属性（base + growth）
    const finalStats = getFinalStats(stats);
    
    // 计算每个属性的详细信息
    const statKeys = ['体质', '灵根', '悟性', '幸运', '意志'] as const;
    const statDetails = statKeys.map((statKey) => {
      const value = finalStats[statKey];
      const capBonus = statCapBonuses[statKey] || 0;
      const maxValue = getActualStatCap(protagonist.level, capBonus);
      const percentage = Math.min((value / maxValue) * 100, 100);
      const displayName = attrNames[statKey] || statKey;
      const baseValue = stats.base[statKey];
      const growthValue = stats.growth[statKey];
      
      return {
        key: statKey,
        value,
        maxValue,
        percentage,
        displayName,
        capBonus,
        baseValue,
        growthValue,
      };
    });
    
    return {
      stats: finalStats,
      statCapBonuses,
      statDetails,
      attributeNames: attrNames,
    };
  }, [gameState.protagonist]);
}

/**
 * 获取战斗属性（攻击、防御）
 */
export function useCombatStats() {
  const { gameState } = useGame();
  
  return useMemo(() => {
    const protagonist = gameState.protagonist;
    if (!protagonist) return null;
    
    const stats = protagonist.stats;
    const finalStats = getFinalStats(stats);
    const worldType = protagonist.world.type;
    
    // 基础攻击力
    let baseAttack = calculatePlayerAttack(finalStats.体质, finalStats.灵根, protagonist.level, worldType);
    // 功法攻击加成
    let techniqueAttackBonus = 0;
    if (protagonist.equippedAttackTechniques && protagonist.equippedAttackTechniques.length > 0) {
      for (const technique of protagonist.equippedAttackTechniques) {
        if (technique) {
          techniqueAttackBonus += technique.bonus;
        }
      }
      baseAttack = Math.floor(baseAttack * (1 + techniqueAttackBonus / 100));
    }
    
    // 装备攻击加成
    let equipmentAttackBonus = 0;
    if (protagonist.equippedMelee) {
      equipmentAttackBonus += protagonist.equippedMelee.attackBonus;
    }
    if (protagonist.equippedRanged) {
      equipmentAttackBonus += protagonist.equippedRanged.attackBonus;
    }
    if (equipmentAttackBonus > 0) {
      baseAttack = Math.floor(baseAttack * (1 + equipmentAttackBonus / 100));
    }
    
    // 基础防御力
    let baseDefense = calculatePlayerDefense(finalStats.意志, protagonist.level, worldType);
    // 功法防御加成
    let techniqueDefenseBonus = 0;
    if (protagonist.equippedDefenseTechniques && protagonist.equippedDefenseTechniques.length > 0) {
      for (const technique of protagonist.equippedDefenseTechniques) {
        if (technique) {
          techniqueDefenseBonus += technique.bonus;
        }
      }
      baseDefense = Math.floor(baseDefense * (1 + techniqueDefenseBonus / 100));
    }
    
    // 装备防御加成
    let equipmentDefenseBonus = 0;
    if (protagonist.equippedHead) {
      equipmentDefenseBonus += protagonist.equippedHead.defenseBonus;
    }
    if (protagonist.equippedBody) {
      equipmentDefenseBonus += protagonist.equippedBody.defenseBonus;
    }
    if (protagonist.equippedLegs) {
      equipmentDefenseBonus += protagonist.equippedLegs.defenseBonus;
    }
    if (protagonist.equippedFeet) {
      equipmentDefenseBonus += protagonist.equippedFeet.defenseBonus;
    }
    if (equipmentDefenseBonus > 0) {
      baseDefense = Math.floor(baseDefense * (1 + equipmentDefenseBonus / 100));
    }
    
    return {
      attack: baseAttack,
      attackBonus: techniqueAttackBonus,
      equipmentAttackBonus,
      totalAttackBonus: techniqueAttackBonus + equipmentAttackBonus,
      attackTechniques: protagonist.equippedAttackTechniques || [],
      defense: baseDefense,
      defenseBonus: techniqueDefenseBonus,
      equipmentDefenseBonus,
      totalDefenseBonus: techniqueDefenseBonus + equipmentDefenseBonus,
      defenseTechniques: protagonist.equippedDefenseTechniques || [],
    };
  }, [gameState.protagonist]);
}

/**
 * 获取背包信息
 */
export function useInventory() {
  const { gameState, useItem } = useGame();
  
  const inventory = useMemo(() => {
    return gameState.protagonist?.inventory || [];
  }, [gameState.protagonist?.inventory]);
  
  const activeEffects = useMemo(() => {
    return gameState.protagonist?.activeEffects || [];
  }, [gameState.protagonist?.activeEffects]);
  
  // 获取灵石数量
  const spiritStoneCount = useMemo(() => {
    const item = inventory.find((i: InventoryItem) => i.definition.id === 'spirit_stone');
    return item ? item.quantity : 0;
  }, [inventory]);
  
  // 按类型分组
  const itemsByType = useMemo(() => {
    return {
      all: inventory,
      丹药: inventory.filter((i: InventoryItem) => i.definition.type === '丹药'),
      材料: inventory.filter((i: InventoryItem) => i.definition.type === '材料'),
      其他: inventory.filter((i: InventoryItem) => !['丹药', '材料', '灵石'].includes(i.definition.type)),
    };
  }, [inventory]);
  
  return {
    inventory,
    activeEffects,
    spiritStoneCount,
    itemsByType,
    useItem,
  };
}

/**
 * 获取功法信息
 */
export function useTechniques() {
  const { gameState, equipTechnique, unequipTechnique } = useGame();
  
  return useMemo(() => {
    const protagonist = gameState.protagonist;
    if (!protagonist) return { techniques: [], equippedAttackTechniques: [null, null, null], equippedDefenseTechniques: [null, null, null], equipTechnique, unequipTechnique };
    
    const techniques = protagonist.techniques || [];
    const attackTechniques = techniques.filter((t: Technique) => t.type === 'attack');
    const defenseTechniques = techniques.filter((t: Technique) => t.type === 'defense');
    
    // 安全处理功法槽位数组（修复 BUG-007: 数组越界）
    // 确保数组长度至少为 3，不足的位置用 null 填充
    const normalizeSlots = (slots: (Technique | null)[] | undefined): [Technique | null, Technique | null, Technique | null] => {
      const result: [Technique | null, Technique | null, Technique | null] = [null, null, null];
      if (slots) {
        for (let i = 0; i < Math.min(slots.length, 3); i++) {
          result[i] = slots[i] ?? null;
        }
      }
      return result;
    };
    
    return {
      techniques,
      attackTechniques,
      defenseTechniques,
      equippedAttackTechniques: normalizeSlots(protagonist.equippedAttackTechniques),
      equippedDefenseTechniques: normalizeSlots(protagonist.equippedDefenseTechniques),
      equipTechnique,
      unequipTechnique,
    };
  }, [gameState.protagonist, equipTechnique, unequipTechnique]);
}

/**
 * 获取机缘信息
 */
export function useAdventure() {
  const { gameState, startAdventure, moveInAdventure, exitAdventure } = useGame();
  
  return useMemo(() => {
    const protagonist = gameState.protagonist;
    const worldType = protagonist?.world.type;
    const dungeonInfo = worldType ? getDungeonInfo(worldType) : null;
    
    return {
      grid: gameState.adventureGrid,
      position: gameState.adventurePosition,
      config: gameState.adventureConfig,
      phase: gameState.adventurePhase,
      loot: gameState.adventureLoot || [],
      battleState: gameState.battleState,
      dungeonInfo,
      startAdventure,
      moveInAdventure,
      exitAdventure,
    };
  }, [
    gameState.adventureGrid, 
    gameState.adventurePosition, 
    gameState.adventureConfig, 
    gameState.adventurePhase,
    gameState.adventureLoot,
    gameState.battleState,
    gameState.protagonist,
    startAdventure, 
    moveInAdventure, 
    exitAdventure
  ]);
}

/**
 * 获取消息记录
 */
export function useMessages() {
  const { gameState, addMessage } = useGame();
  
  return useMemo(() => {
    return {
      messages: gameState.messages,
      addMessage,
    };
  }, [gameState.messages, addMessage]);
}

/**
 * 获取游戏阶段
 */
export function useGamePhase() {
  const { gameState, startNewGame, refreshCharacters, resetGame } = useGame();
  
  return useMemo(() => {
    return {
      phase: gameState.phase,
      characters: gameState.characters,
      worlds: gameState.worlds,
      selectedCharacter: gameState.selectedCharacter,
      selectedWorld: gameState.selectedWorld,
      currentTab: gameState.currentTab,
      autoCultivating: gameState.autoCultivating,
      lastExploreTime: gameState.lastExploreTime,
      startNewGame,
      refreshCharacters,
      resetGame,
    };
  }, [
    gameState.phase,
    gameState.characters,
    gameState.worlds,
    gameState.selectedCharacter,
    gameState.selectedWorld,
    gameState.currentTab,
    gameState.autoCultivating,
    gameState.lastExploreTime,
    startNewGame,
    refreshCharacters,
    resetGame
  ]);
}

/**
 * 获取修炼相关功能
 */
export function useCultivation() {
  const { gameState, performCultivation, performRest, toggleAutoCultivation } = useGame();
  
  return useMemo(() => {
    const protagonist = gameState.protagonist;
    const overflowExperience = protagonist?.overflowExperience || 0;
    
    return {
      autoCultivating: gameState.autoCultivating,
      overflowExperience,
      performCultivation,
      performRest,
      toggleAutoCultivation,
    };
  }, [gameState.autoCultivating, gameState.protagonist, performCultivation, performRest, toggleAutoCultivation]);
}

/**
 * 获取历练相关功能
 */
export function useExperience() {
  const { gameState, startExperience, handleEventChoice } = useGame();
  
  return useMemo(() => {
    return {
      currentEvent: gameState.currentEvent,
      lastActionResult: gameState.lastActionResult,
      lastExploreTime: gameState.lastExploreTime,
      startExperience,
      handleEventChoice,
    };
  }, [gameState.currentEvent, gameState.lastActionResult, gameState.lastExploreTime, startExperience, handleEventChoice]);
}

/**
 * 获取世界术语
 */
export function useTerminology() {
  const { gameState } = useGame();
  
  return useMemo(() => {
    const worldType = gameState.protagonist?.world.type;
    if (!worldType) return null;
    
    return {
      terminology: getTerminology(worldType),
      attributeNames: getAttributeNames(worldType),
      dungeonInfo: getDungeonInfo(worldType),
    };
  }, [gameState.protagonist?.world.type]);
}
