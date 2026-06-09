/**
 * NPC 数据
 *
 * 存放预定义的 NPC 模板和已生成的 NPC 数据。
 * 由 scripts/generate-world.ts --ai 生成。
 */

import type { NPC } from '../types';

/** 预定义 NPC 模板 */
export const NPC_TEMPLATES: NPC[] = [];

/** 所有已注册的 NPC 列表 */
export const AVAILABLE_NPCS: NPC[] = [];
