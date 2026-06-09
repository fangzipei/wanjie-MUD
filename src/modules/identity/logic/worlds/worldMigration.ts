/**
 * 世界切换迁移逻辑
 *
 * 处理飞升时从旧世界切换到新世界的数据迁移。
 * 保存旧世界状态，初始化新世界状态。
 */

import type { GameState, WorldType } from '@/shared/lib/types';

// ============================================
// 世界存档记录
// ============================================

/** 单个世界的访问记录 */
export interface WorldSaveData {
  /** 世界类型 */
  worldType: WorldType;
  /** 退出时等级 */
  level: number;
  /** 退出时灵石数 */
  spiritStones: number;
  /** 退出时间戳 */
  exitTime: number;
  /** 世界特有数据（序列化的 JSON） */
  worldSpecificData: Record<string, unknown>;
}

/** 世界切换迁移结果 */
export interface WorldMigrationResult {
  /** 旧世界存档数据 */
  oldWorldSave: WorldSaveData;
  /** 新世界初始状态 */
  newWorldState: Partial<GameState>;
}

/**
 * 保存当前世界状态
 *
 * @param state - 当前游戏状态
 * @returns 世界存档数据
 */
export function saveCurrentWorld(state: GameState): WorldSaveData {
  if (!state.protagonist) {
    throw new Error('无法保存世界状态：主角不存在');
  }

  const spiritStone = state.protagonist.inventory.find(
    i => i.definition.id === 'spirit_stone'
  );

  return {
    worldType: state.protagonist.world.type,
    level: state.protagonist.level,
    spiritStones: spiritStone?.quantity ?? 0,
    exitTime: Date.now(),
    worldSpecificData: {
      worldFlags: state.worldFlags ?? {},
      eventHistory: state.eventHistory ?? [],
      cultivationCooldown: state.protagonist.cultivationCooldown,
      insightMarks: state.protagonist.insightMarks,
    },
  };
}

/**
 * 构建新世界的初始状态
 *
 * @param oldState - 旧游戏状态
 * @param newWorldType - 新世界类型
 * @param inheritance - 继承数据（传承装备/功法）
 * @returns 新世界部分状态
 */
export function buildNewWorldState(
  oldState: GameState,
  newWorldType: WorldType,
  inheritance: {
    keepTechniques: string[];
    keepEquipments: string[];
    ascensionBonus: number;
  }
): Partial<GameState> {
  // 新世界重置等级但保留部分传承
  const newWorldFlags: Record<string, unknown> = {
    'ascension_count': ((oldState.worldFlags?.['ascension_count'] as number) ?? 0) + 1,
    'previous_world': oldState.protagonist?.world.type ?? '修仙',
    'ascension_bonus': inheritance.ascensionBonus,
  };

  return {
    worldFlags: newWorldFlags,
    eventHistory: [], // 新世界事件链重置
    adventureGrid: null,
    adventurePosition: null,
  };
}

/**
 * 恢复到之前访问过的世界
 *
 * @param saveData - 世界存档数据
 * @param currentState - 当前游戏状态
 * @returns 恢复后的部分状态
 */
export function restoreWorldState(
  saveData: WorldSaveData,
  currentState: GameState
): Partial<GameState> {
  return {
    worldFlags: {
      ...currentState.worldFlags,
      ...saveData.worldSpecificData.worldFlags as Record<string, unknown>,
    },
    eventHistory: (saveData.worldSpecificData.eventHistory as GameState['eventHistory']) ?? [],
  };
}
