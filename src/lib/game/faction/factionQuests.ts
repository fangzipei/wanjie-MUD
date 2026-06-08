/**
 * 门派任务与叙事系统
 *
 * 门派专属任务线进度管理、NPC 对话树、门派冲突事件生成。
 */

import type { GameState } from '../types';
import type { EventRecord } from '../events/types';

// ============================================
// NPC 对话树
// ============================================

/** 对话节点 */
export interface DialogueNode {
  /** 节点 ID */
  id: string;
  /** NPC 说的话 */
  text: string;
  /** 玩家可选回复 */
  options: DialogueOption[];
}

/** 对话选项 */
export interface DialogueOption {
  /** 选项文本 */
  text: string;
  /** 需要的声望等级 (0-5) */
  requiredReputation?: number;
  /** 需要的任务进度 */
  requiredQuestProgress?: string;
  /** 选择后跳转的节点 ID */
  nextNodeId: string;
  /** 效果 */
  effects?: {
    reputation?: number;
    items?: string[];
    questUpdate?: string;
  };
}

// ============================================
// 门派 NPC 数据
// ============================================

/** 门派 NPC 定义 */
export interface FactionNpc {
  /** NPC ID */
  id: string;
  /** 名称 */
  name: string;
  /** 角色（掌门/长老/商人/师兄等） */
  role: string;
  /** 所属门派 ID */
  factionId: string;
  /** 对话树 */
  dialogues: Record<string, DialogueNode>;
}

// ============================================
// 门派冲突事件
// ============================================

/** 门派冲突事件 */
export interface FactionConflictEvent {
  /** 事件 ID */
  id: string;
  /** 冲突双方门派 ID */
  factions: [string, string];
  /** 冲突标题 */
  title: string;
  /** 冲突描述 */
  description: string;
  /** 选项 */
  choices: FactionConflictChoice[];
}

/** 冲突选项 */
export interface FactionConflictChoice {
  /** 选项文本 */
  text: string;
  /** 对我方门派声望影响 */
  myFactionRep: number;
  /** 对敌对门派声望影响 */
  enemyFactionRep: number;
  /** 结果描述 */
  result: string;
  /** 副作用 */
  sideEffects?: {
    /** 敌对弟子额外遭遇概率提升 */
    enemyEncounterBoost?: number;
    /** 门派商店价格浮动 */
    shopPriceChange?: number;
  };
}

// ============================================
// 任务进度管理
// ============================================

/** 门派任务动作类型 */
export type FactionQuestAction =
  | 'cultivate'     // 修炼
  | 'kill_enemy'    // 击杀敌人
  | 'explore'       // 探索
  | 'donate'        // 捐献
  | 'collect'       // 收集
  | 'upgrade';      // 升级装备

/** 门派任务进度 */
export interface FactionQuestProgress {
  /** 当前任务 ID */
  currentQuestId: string;
  /** 任务目标（计数值） */
  target: number;
  /** 当前进度 */
  progress: number;
  /** 是否完成 */
  completed: boolean;
}

/**
 * 更新任务进度
 *
 * @param progress - 当前进度
 * @param action - 玩家行为
 * @param amount - 行为数量
 * @returns 更新后的进度和是否完成
 */
export function updateQuestProgress(
  progress: FactionQuestProgress,
  action: FactionQuestAction,
  amount: number
): { progress: FactionQuestProgress; completed: boolean } {
  // 只响应匹配的行为类型
  const questActionMap: Record<string, FactionQuestAction[]> = {
    'quest_cultivate_100': ['cultivate'],
    'quest_kill_50': ['kill_enemy'],
    'quest_explore_30': ['explore'],
    'quest_donate_1000': ['donate'],
    'quest_collect_20': ['collect'],
    'quest_upgrade_10': ['upgrade'],
  };

  const allowedActions = questActionMap[progress.currentQuestId] || [];
  if (!allowedActions.includes(action)) {
    return { progress, completed: false };
  }

  const newProgress = Math.min(progress.target, progress.progress + amount);
  const completed = newProgress >= progress.target;
  return {
    progress: { ...progress, progress: newProgress, completed },
    completed,
  };
}

// ============================================
// 预定义的冲突事件
// ============================================

/** 门派冲突事件池 */
export const FACTION_CONFLICTS: FactionConflictEvent[] = [
  {
    id: 'conflict_resource',
    factions: ['', ''], // 运行时填充
    title: '资源争夺',
    description: '你的门派与敌对门派在灵石矿脉的归属上发生冲突！双方弟子已在对峙。',
    choices: [
      {
        text: '支持本派，正面迎战',
        myFactionRep: 30,
        enemyFactionRep: -20,
        result: '你带领同门击退了敌对门派的进攻，矿脉保住了！',
        sideEffects: { enemyEncounterBoost: 0.1, shopPriceChange: -0.1 },
      },
      {
        text: '尝试调停，寻求和解',
        myFactionRep: 5,
        enemyFactionRep: 5,
        result: '经过艰难谈判，双方同意共享矿脉资源。',
      },
      {
        text: '中立观望，静观其变',
        myFactionRep: 0,
        enemyFactionRep: 0,
        result: '你选择不介入。冲突最终由掌门出面解决。',
      },
    ],
  },
  {
    id: 'conflict_technique',
    factions: ['', ''],
    title: '功法之争',
    description: '敌对门派声称你的门派偷学了他们的独门功法，要求交出修炼者！',
    choices: [
      {
        text: '坚决否认，维护门派尊严',
        myFactionRep: 25,
        enemyFactionRep: -15,
        result: '门派上下团结一致，最终证明功法系独立创出！',
        sideEffects: { enemyEncounterBoost: 0.05 },
      },
      {
        text: '提出切磋交流',
        myFactionRep: 15,
        enemyFactionRep: -5,
        result: '双方各派一人切磋，你的代表险胜，为门派争了光。',
      },
    ],
  },
  {
    id: 'conflict_territory',
    factions: ['', ''],
    title: '领地入侵',
    description: '敌对门派的弟子越界进入了你门派的领地狩猎，态度嚣张。',
    choices: [
      {
        text: '驱逐入侵者',
        myFactionRep: 20,
        enemyFactionRep: -25,
        result: '你亲手驱逐了入侵的敌对弟子，树立了门派威信。',
        sideEffects: { enemyEncounterBoost: 0.15, shopPriceChange: -0.05 },
      },
      {
        text: '向掌门汇报，等待处理',
        myFactionRep: 5,
        enemyFactionRep: -5,
        result: '掌门对你的稳重表示赞许，但有些弟子觉得你不够果断。',
      },
    ],
  },
];
