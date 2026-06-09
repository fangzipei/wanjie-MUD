/**
 * NPC 逻辑
 *
 * 纯函数，不依赖 React / 浏览器 API。
 * 后续存放 NPC 查找、过滤、关系计算等逻辑。
 */

import type { NPC } from '../types';

/**
 * 按 ID 查找 NPC
 */
export function findNPCById(npcs: NPC[], id: string): NPC | undefined {
  return npcs.find(n => n.id === id);
}

/**
 * 按标签过滤 NPC
 */
export function findNPCsByTag(npcs: NPC[], tag: string): NPC[] {
  return npcs.filter(n => n.tags?.includes(tag));
}

/**
 * 按势力过滤 NPC
 */
export function findNPCsByAffiliation(npcs: NPC[], affiliation: string): NPC[] {
  return npcs.filter(n => n.affiliation === affiliation);
}

/**
 * 获取可 AI 对话的 NPC 列表
 */
export function findAIDialogueNPCs(npcs: NPC[]): NPC[] {
  return npcs.filter(n => n.canAIDialogue);
}
