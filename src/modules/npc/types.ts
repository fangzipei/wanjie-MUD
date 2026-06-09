/**
 * NPC（非玩家角色）类型定义
 *
 * NPC 是世界中可交互的角色，可被剧情（Story）引用，
 * 支持 AI 对话标识，为后续 AI 驱动对话做准备。
 */

import type { CharacterStats } from '@/shared/lib/types';

/**
 * NPC 定义
 */
export interface NPC {
  /** 唯一标识 */
  id: string;
  /** 名称 */
  name: string;
  /** 称号（如"仙人遗府的守门人"） */
  title?: string;
  /** 外观/描述 */
  description: string;
  /** 性格描述（用于 AI 对话 personality） */
  personality: string;
  /** 是否支持 AI 驱动对话 */
  canAIDialogue: boolean;
  /** AI 对话风格提示（如"说话傲慢，喜欢用文言文"） */
  dialogueStyle?: string;
  /** 可选属性 */
  stats?: CharacterStats;
  /** 境界 */
  realm?: string;
  /** 所属势力 */
  affiliation?: string;
  /** 标签 */
  tags?: string[];
}
