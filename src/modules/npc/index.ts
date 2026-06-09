/**
 * 模块⑯ NPC（非玩家角色）
 *
 * 职责：NPC 类型定义、数据管理、查询逻辑
 */

export type { NPC } from './types';

export { findNPCById, findNPCsByTag, findNPCsByAffiliation, findAIDialogueNPCs } from './logic';

export { NPC_TEMPLATES, AVAILABLE_NPCS } from './data';
