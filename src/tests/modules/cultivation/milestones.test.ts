/**
 * 突破质变里程碑测试
 */
import { describe, it, expect } from 'vitest';
import {
  getMilestoneForLevel,
  getNextMilestone,
  applyFailProtection,
  BREAKTHROUGH_MILESTONES,
} from '@/lib/game/cultivation/milestones';

describe('milestones - getMilestoneForLevel', () => {
  it('10级返回"初窥门径"里程碑', () => {
    const m = getMilestoneForLevel(10);
    expect(m).not.toBeNull();
    expect(m!.name).toBe('初窥门径');
    expect(m!.unlocks).toContain('technique_system');
  });

  it('20级返回"登堂入室"里程碑', () => {
    const m = getMilestoneForLevel(20);
    expect(m).not.toBeNull();
    expect(m!.unlocks).toContain('crafting_system');
  });

  it('非质变等级返回 null', () => {
    expect(getMilestoneForLevel(5)).toBeNull();
    expect(getMilestoneForLevel(15)).toBeNull();
    expect(getMilestoneForLevel(99)).toBeNull();
  });

  it('全部6个质变节点已定义', () => {
    const levels = [10, 20, 30, 45, 60, 80];
    for (const l of levels) {
      expect(getMilestoneForLevel(l)).not.toBeNull();
    }
    expect(Object.keys(BREAKTHROUGH_MILESTONES).length).toBe(6);
  });
});

describe('milestones - getNextMilestone', () => {
  it('返回下一个质变节点和剩余等级', () => {
    const next = getNextMilestone(5);
    expect(next).not.toBeNull();
    expect(next!.milestone.level).toBe(10);
    expect(next!.levelsRemaining).toBe(5);
  });

  it('当前等级超过最高质变节点时返回 null', () => {
    const next = getNextMilestone(100);
    expect(next).toBeNull();
  });
});

describe('milestones - applyFailProtection', () => {
  it('首次失败：保留 50% 进度，无加成（第一次无累积）', () => {
    const milestone = getMilestoneForLevel(10)!;
    const { adjustedRate, updatedAttempt } = applyFailProtection(40, null, milestone);

    // 首次失败无累积加成（failCount=0）
    expect(adjustedRate).toBe(40);
    expect(updatedAttempt.retainedProgress).toBeGreaterThan(0);
  });

  it('第二次失败：累积加成 15%', () => {
    const milestone = getMilestoneForLevel(10)!;
    const attempt = { targetLevel: 10, failCount: 1, retainedProgress: 0.5 };
    const { adjustedRate } = applyFailProtection(40, attempt, milestone);

    expect(adjustedRate).toBeGreaterThan(40); // 15% 加成
  });

  it('第3次失败后必定成功', () => {
    const milestone = getMilestoneForLevel(10)!;
    const attempt = { targetLevel: 10, failCount: 3, retainedProgress: 1.0 };
    const { adjustedRate } = applyFailProtection(40, attempt, milestone);

    expect(adjustedRate).toBe(100);
  });

  it('无质变节点时仅应用基础加成', () => {
    const { adjustedRate } = applyFailProtection(40, null, null);
    expect(adjustedRate).toBe(40); // 无加成
  });
});
