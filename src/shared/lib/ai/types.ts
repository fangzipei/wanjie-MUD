/**
 * AI 工具类型定义
 *
 * 定义 AI 生成请求/响应的结构，
 * 用于 scripts/generate-world.ts --ai 调用 Anthropic API 生成剧情/NPC。
 */

import type { Story } from '@/modules/narrative/story/types';
import type { NPC } from '@/modules/npc/types';

/** AI 生成上下文（从已生成的世界提取） */
export interface AIGenerationContext {
  seed: number;
  worldType: string;
  worldName: string;
  worldDescription: string;
  powerSystem: string;
  baseCoefficient: number;
  factions: { id: string; name: string }[];
}

/** AI 生成结果（结构化输出） */
export interface AIGenerationResult {
  /** 生成的剧情 */
  story: Story;
  /** 生成的 NPC 列表 */
  npcs: NPC[];
}
