/**
 * 分支剧情类型定义
 *
 * 定义 Story（完整剧情）、StoryNode（剧情节点）、StoryChoice（分支选项）等类型。
 * 剧情由节点树组成，每个节点可包含分支选项，形成非线性叙事。
 *
 * NPC 通过 npcId / npcIds 与 NPC 模块关联。
 */

import type { WorldType } from '@/shared/lib/types';

// ============================================
// 节点类型
// ============================================

/** 剧情节点类型 */
export type NodeType = 'dialogue' | 'battle' | 'exploration' | 'reward' | 'choice' | 'ending';

// ============================================
// 条件与效果（可复用的小类型）
// ============================================

/** 剧情条件 */
export interface StoryCondition {
  type: 'flag' | 'realm' | 'level' | 'npc_relation' | 'item';
  params: Record<string, unknown>;
}

/** 节点效果 */
export interface NodeEffect {
  type: 'exp' | 'item' | 'stat' | 'flag' | 'npc_relation' | 'hp' | 'mp';
  value: number | string | Record<string, unknown>;
}

// ============================================
// 剧情节点
// ============================================

/** 剧情分支选项 */
export interface StoryChoice {
  /** 选项标识 */
  id: string;
  /** 选项文字 */
  label: string;
  /** 跳转到的下一个节点 ID */
  nextNodeId: string;
  /** 可选前置条件 */
  conditions?: StoryCondition[];
  /** 选择后触发的效果 */
  effects?: NodeEffect[];
}

/** 剧情节点 */
export interface StoryNode {
  /** 节点标识 */
  id: string;
  /** 节点类型 */
  type: NodeType;
  /** 节点标题 */
  title: string;
  /** 叙事文本内容 */
  content: string;
  /** 分支选项（type=choice 时必须有） */
  choices?: StoryChoice[];
  /** 自动推进到下一个节点（非选项节点使用） */
  nextNodeId?: string;
  /** 此节点涉及的 NPC ID */
  npcId?: string;
  /** 可选前置条件 */
  conditions?: StoryCondition[];
  /** 进入节点时自动触发的效果 */
  effects?: NodeEffect[];
}

// ============================================
// 完整剧情
// ============================================

/** 剧情定义 */
export interface Story {
  /** 剧情标识 */
  id: string;
  /** 剧情标题 */
  title: string;
  /** 剧情简介 */
  description: string;
  /** 适用世界类型（可选，不限制） */
  worldType?: WorldType;
  /** 涉及的 NPC ID 列表 */
  npcIds: string[];
  /** 起始节点 ID */
  startNodeId: string;
  /** 所有剧情节点 */
  nodes: StoryNode[];
  /** 标签 */
  tags?: string[];
}
