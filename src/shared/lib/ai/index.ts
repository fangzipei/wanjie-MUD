/**
 * AI 工具模块
 *
 * 提供 Anthropic API 调用能力，用于脚本生成剧情和 NPC 数据。
 * 仅服务端/CLI 使用，不进入浏览器 bundle。
 */

export type { AIGenerationContext, AIGenerationResult } from './types';
export { generatePlotWithAI } from './client';
