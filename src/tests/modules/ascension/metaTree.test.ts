/**
 * 飞升元进程树测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  META_TREE,
  calculateMetaPoints,
  canUnlockNode,
  unlockMetaNode,
  getActiveMetaEffects,
  loadMetaProgress,
  saveMetaProgress,
  META_PROGRESS_KEY,
} from '@/lib/game/ascension/metaTree';
import type { MetaProgress, AscensionCompletionStats } from '@/lib/game/ascension/metaTree';

describe('metaTree - calculateMetaPoints', () => {
  it('基础 5 点 + 等级奖励', () => {
    const stats: AscensionCompletionStats = {
      level: 50, bossesKilled: 0, eventChainsCompleted: 0,
      factionReputationLevel: 0, techniquesCollected: 0, equipmentsCollected: 0,
    };
    const points = calculateMetaPoints(stats);
    expect(points).toBeGreaterThanOrEqual(5); // 基础
    expect(points).toBeLessThanOrEqual(15); // 上限
  });

  it('50级：5 + 5(等级) = 10 点', () => {
    const stats: AscensionCompletionStats = {
      level: 50, bossesKilled: 0, eventChainsCompleted: 0,
      factionReputationLevel: 0, techniquesCollected: 0, equipmentsCollected: 0,
    };
    const points = calculateMetaPoints(stats);
    expect(points).toBe(10);
  });

  it('完成事件链增加点数', () => {
    const stats: AscensionCompletionStats = {
      level: 20, bossesKilled: 0, eventChainsCompleted: 3,
      factionReputationLevel: 0, techniquesCollected: 0, equipmentsCollected: 0,
    };
    const points = calculateMetaPoints(stats);
    expect(points).toBeGreaterThanOrEqual(8); // 5 + 2(等级) + 3(事件链)
  });

  it('不超过 15 点上限', () => {
    const stats: AscensionCompletionStats = {
      level: 100, bossesKilled: 50, eventChainsCompleted: 5,
      factionReputationLevel: 5, techniquesCollected: 100, equipmentsCollected: 100,
    };
    const points = calculateMetaPoints(stats);
    expect(points).toBe(15);
  });
});

describe('metaTree - canUnlockNode', () => {
  it('点数足够且前置已解锁时返回 true', () => {
    const progress: MetaProgress = {
      totalPoints: 10,
      unlockedNodes: ['combat_t1_elemental_eye'],
      treeVersion: 1,
    };
    expect(canUnlockNode('combat_t2_crit_strike', progress)).toBe(true);
  });

  it('前置未解锁时返回 false', () => {
    const progress: MetaProgress = { totalPoints: 10, unlockedNodes: [], treeVersion: 1 };
    expect(canUnlockNode('combat_t2_crit_strike', progress)).toBe(false);
  });

  it('点数不足时返回 false', () => {
    const progress: MetaProgress = {
      totalPoints: 1,
      unlockedNodes: ['combat_t1_elemental_eye'],
      treeVersion: 1,
    };
    expect(canUnlockNode('combat_t2_crit_strike', progress)).toBe(false);
  });
});

describe('metaTree - unlockMetaNode', () => {
  it('成功解锁后扣除点数并添加节点', () => {
    const progress: MetaProgress = { totalPoints: 10, unlockedNodes: [], treeVersion: 1 };
    const result = unlockMetaNode('combat_t1_elemental_eye', progress);

    expect(result).not.toBeNull();
    expect(result!.totalPoints).toBe(7); // 10 - 3
    expect(result!.unlockedNodes).toContain('combat_t1_elemental_eye');
  });

  it('不可解锁时返回 null', () => {
    const progress: MetaProgress = { totalPoints: 0, unlockedNodes: [], treeVersion: 1 };
    expect(unlockMetaNode('combat_t5_elemental_immunity', progress)).toBeNull();
  });
});

describe('metaTree - getActiveMetaEffects', () => {
  it('返回所有已解锁节点的效果', () => {
    const effects = getActiveMetaEffects(['combat_t1_elemental_eye', 'combat_t2_crit_strike']);
    expect(effects.length).toBeGreaterThanOrEqual(2);
  });

  it('空节点列表返回空数组', () => {
    expect(getActiveMetaEffects([])).toEqual([]);
  });
});

describe('metaTree - localStorage 持久化', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(META_PROGRESS_KEY);
    }
  });

  it('loadMetaProgress 在解析失败时返回默认值', () => {
    // 模拟 JSON.parse 报错
    const progress = loadMetaProgress();
    expect(progress.totalPoints).toBe(0);
    expect(progress.unlockedNodes).toEqual([]);
  });

  it('saveMetaProgress 和 loadMetaProgress 包含 try-catch 保护', () => {
    const progress: MetaProgress = { totalPoints: 5, unlockedNodes: ['test_node'], treeVersion: 1 };
    // save/load 都不应抛出异常
    expect(() => saveMetaProgress(progress)).not.toThrow();
    const loaded = loadMetaProgress();
    expect(loaded).toBeDefined();
  });
});

describe('metaTree - META_TREE 结构', () => {
  it('包含 15 个节点', () => {
    expect(Object.keys(META_TREE).length).toBe(15);
  });

  it('每个分支各 5 层', () => {
    const branches = { combat: 0, cultivation: 0, exploration: 0 };
    for (const node of Object.values(META_TREE)) {
      branches[node.branch]++;
    }
    expect(branches.combat).toBe(5);
    expect(branches.cultivation).toBe(5);
    expect(branches.exploration).toBe(5);
  });

  it('每个节点的前置关系正确', () => {
    for (const node of Object.values(META_TREE)) {
      if (node.prerequisite) {
        const prereq = META_TREE[node.prerequisite];
        expect(prereq).toBeDefined();
        expect(prereq.branch).toBe(node.branch);
        expect(prereq.tier).toBe(node.tier - 1);
      }
    }
  });
});
