/**
 * 事件因果链匹配器
 *
 * 根据玩家的事件历史记录，匹配事件的前置条件和分支。
 * 纯函数，接收当前状态和历史，返回适用的分支选项。
 */

import type { EventRecord, EventPrerequisite, Consequence } from './types';
import type { GameState } from '@/shared/lib/types';

// ============================================
// 前置条件检查
// ============================================

/**
 * 检查事件历史是否满足前置条件
 *
 * @param history - 事件历史记录
 * @param prerequisite - 前置条件
 * @param worldFlags - 世界状态标记
 * @returns 是否满足条件
 */
export function checkPrerequisite(
  history: EventRecord[],
  prerequisite: EventPrerequisite,
  worldFlags: Record<string, unknown> = {}
): boolean {
  // 检查必需的前置事件
  if (prerequisite.requiredEventId) {
    const found = history.find(e => e.eventId === prerequisite.requiredEventId);
    if (!found) return false;
    if (prerequisite.requiredChoiceIndex !== undefined && found.choiceIndex !== prerequisite.requiredChoiceIndex) {
      return false;
    }
  }

  // 检查 NPC 关系
  if (prerequisite.requiredNpcRelation) {
    const { npcId, minValue } = prerequisite.requiredNpcRelation;
    const relationValue = (worldFlags[`npc_rel_${npcId}`] as number) ?? 0;
    if (relationValue < minValue) return false;
  }

  // 检查必需标记
  if (prerequisite.requiredFlags) {
    for (const flag of prerequisite.requiredFlags) {
      if (!worldFlags[flag]) return false;
    }
  }

  // 检查禁止标记
  if (prerequisite.forbiddenFlags) {
    for (const flag of prerequisite.forbiddenFlags) {
      if (worldFlags[flag]) return false;
    }
  }

  return true;
}

// ============================================
// 事件匹配
// ============================================

/**
 * 根据历史匹配事件的分支版本
 *
 * @param eventId - 事件 ID
 * @param history - 事件历史
 * @param worldFlags - 世界状态标记
 * @returns 匹配到的分支索引（-1 表示无匹配分支，使用默认选项）
 */
export function matchEventBranch(
  eventId: string,
  history: EventRecord[],
  worldFlags: Record<string, unknown> = {}
): number {
  // 遍历历史寻找相关事件
  for (const record of history) {
    if (record.eventId === eventId) {
      // 该事件已经被触发过，检查是否有不同分支
      return record.choiceIndex;
    }
  }
  return -1; // 首次触发
}

// ============================================
// 事件后果应用
// ============================================

/**
 * 应用事件后果，更新世界状态标记和 NPC 关系
 *
 * @param worldFlags - 当前世界状态标记
 * @param consequences - 要应用的后果
 * @returns 更新后的世界状态标记
 */
export function applyConsequences(
  worldFlags: Record<string, unknown>,
  consequences: Consequence
): Record<string, unknown> {
  const updated = { ...worldFlags };

  // 应用 NPC 关系变更
  if (consequences.npcRelations) {
    for (const rel of consequences.npcRelations) {
      const key = `npc_rel_${rel.npcId}`;
      updated[key] = ((updated[key] as number) ?? 0) + rel.delta;
    }
  }

  // 应用状态标记
  if (consequences.flagChanges) {
    for (const flag of consequences.flagChanges) {
      updated[flag.flag] = flag.value;
    }
  }

  // 应用世界状态变更
  if (consequences.worldStateChange) {
    Object.assign(updated, consequences.worldStateChange);
  }

  return updated;
}

// ============================================
// 事件链进度
// ============================================

/**
 * 获取玩家在某条事件链上的进度
 *
 * @param chainId - 事件链 ID
 * @param history - 事件历史
 * @returns 已完成的事件数
 */
export function getChainProgress(
  chainId: string,
  history: EventRecord[]
): number {
  // 统计属于该链的事件数（通过 ID 前缀匹配）
  return history.filter(e => e.eventId.startsWith(chainId)).length;
}

/**
 * 检查某条事件链是否已完成
 *
 * @param chainId - 事件链 ID
 * @param history - 事件历史
 * @param totalEvents - 链中事件总数
 * @returns 是否完成
 */
export function isChainCompleted(
  chainId: string,
  history: EventRecord[],
  totalEvents: number
): boolean {
  return getChainProgress(chainId, history) >= totalEvents;
}
