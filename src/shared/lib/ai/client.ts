/**
 * Anthropic API 客户端
 *
 * 服务端/CLI 专用，用于脚本调用 Anthropic API 生成剧情和 NPC 数据。
 * 不进入浏览器 bundle（仅 scripts/generate-world.ts --ai 使用）。
 */

import type { AIGenerationContext, AIGenerationResult } from './types';

// ============================================
// 配置
// ============================================

const API_BASE = 'https://api.deepseek.com/anthropic';
const API_KEY = 'XXXX';
const MODEL = 'deepseek-v4-flash';

// ============================================
// 工具函数
// ============================================

/** 获取 API Key */
function getAPIKey(): string {
  // 优先用环境变量，方便 CI/其他环境
  return process.env.ANTHROPIC_API_KEY || API_KEY;
}

// ============================================
// 核心请求
// ============================================

/** 调用 Anthropic Messages API */
async function callAnthropic(system: string, prompt: string): Promise<string> {
  const apiKey = getAPIKey();

  const response = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => '未知错误');
    throw new Error(`Anthropic API 错误 (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? '';
}

// ============================================
// 剧情 / NPC 生成
// ============================================

/** 从 JSON 块中提取第一个 {} 或 [] */
function extractJSON(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI 返回中没有找到 JSON');
  return text.slice(start, end + 1);
}

/**
 * 调用 Anthropic 生成世界专属剧情和 NPC
 *
 * @param ctx - 世界上下文（种子/类型/名称等）
 * @returns 生成的剧情 + NPC 列表
 */
export async function generatePlotWithAI(ctx: AIGenerationContext): Promise<AIGenerationResult> {
  const system = '你是一个修仙类游戏剧情设计师。根据给定的世界信息，生成一段分支剧情和相关NPC。你的回答必须只包含一个 JSON 对象，不要有多余的文字。';

  const prompt = `请为以下世界设计一段特殊剧情：

世界种子: ${ctx.seed}
世界类型: ${ctx.worldType}
世界名称: ${ctx.worldName}
世界描述: ${ctx.worldDescription}
力量体系: ${ctx.powerSystem}
世界系数: ${ctx.baseCoefficient}
势力列表: ${JSON.stringify(ctx.factions)}

要求：
1. 设计一段与该世界类型相符的分支剧情（3~5 个节点）
2. 设计 1~2 个该剧情涉及的 NPC
3. 剧情需要包含分支选项
4. NPC 需要设定 personality（性格描述）和 canAIDialogue（是否可 AI 对话）

输出格式为 JSON，结构如下：
{
  "story": {
    "id": "story_${ctx.seed}",
    "title": "剧情标题",
    "description": "剧情简介",
    "worldType": "${ctx.worldType}",
    "npcIds": ["要引用的NPC ID"],
    "startNodeId": "起始节点ID",
    "nodes": [
      {
        "id": "node_1",
        "type": "dialogue | battle | exploration | reward | choice | ending",
        "title": "节点标题",
        "content": "叙事文本",
        "npcId": "可选的NPC ID",
        "choices": [
          {
            "id": "choice_1",
            "label": "选项文字",
            "nextNodeId": "下一个节点ID",
            "effects": [{ "type": "exp", "value": 50 }]
          }
        ],
        "nextNodeId": "非选择节点的自动推进目标",
        "effects": [{ "type": "exp", "value": 30 }]
      }
    ]
  },
  "npcs": [
    {
      "id": "npc_1",
      "name": "NPC名称",
      "title": "称号",
      "description": "外观描述",
      "personality": "性格描述（用于AI对话）",
      "canAIDialogue": true,
      "dialogueStyle": "对话风格",
      "realm": "境界",
      "affiliation": "所属势力",
      "tags": ["标签"]
    }
  ]
}

注意：
- story.npcIds 必须与 npcs 中的 NPC id 对应
- story.nodes 中的 npcId 也必须与 npcs 中的 NPC id 对应
- choice 的 nextNodeId 必须指向 nodes 中存在的 id
- type=ending 的节点不需要 choices 和 nextNodeId
- 如果超过5个节点，保证多分支可能性
- canAIDialogue 至少有一个 NPC 设为 true`;

  const raw = await callAnthropic(system, prompt);
  const json = extractJSON(raw);
  return JSON.parse(json) as AIGenerationResult;
}
