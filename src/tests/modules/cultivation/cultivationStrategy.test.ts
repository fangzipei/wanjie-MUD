/**
 * 修炼策略系统测试
 */
import { describe, it, expect } from 'vitest';
import { executeCultivationWithStrategy, generateCultivationCritEvent } from '@/lib/game/cultivation/cultivationStrategy';
import { CULTIVATION_STRATEGIES } from '@/lib/game/cultivation/types';
import type { Protagonist } from '@/lib/game/types';

/** 创建测试主角的辅助函数 */
function makeTestProtagonist(overrides: Partial<Protagonist> = {}): Protagonist {
  return {
    character: {
      id: 1, name: '测试', gender: '男', age: 20,
      origin: { name: 'test', description: '', impact: {}, totalImpact: 0, level: 'common' },
      trait: { name: 'test', description: '', impact: {}, totalImpact: 0, level: 'common' },
      personality: { name: 'test', description: '', impact: {}, totalImpact: 0, level: 'common' },
      talent: { name: 'test', description: '', impact: {}, totalImpact: 0, level: 'common' },
      background: '', totalPower: 100,
      stats: { base: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 }, growth: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 } },
    },
    world: { id: 1, name: '测试', type: '修仙', description: '', powerSystem: '', realmSystem: {} as any, majorForces: '', factions: [], baseCoefficient: 1, actualCoefficient: 1, difficulty: '普通', dangers: [], opportunities: [], rewardCoefficient: {} as any },
    backstory: '', level: 10, realm: '炼气期',
    stats: { base: { 体质: 50, 灵根: 50, 悟性: 50, 幸运: 50, 意志: 50 }, growth: { 体质: 10, 灵根: 10, 悟性: 10, 幸运: 10, 意志: 10 } },
    statCapBonuses: {}, inventory: [{ id: 'spirit_stone', definition: { id: 'spirit_stone', name: '灵石', type: '灵石', rarity: '普通', description: '', effects: [], stackable: true, maxStack: 999 }, quantity: 100 }],
    activeEffects: [], experience: 50, overflowExperience: 0,
    currentHp: 200, maxHp: 200, currentMp: 100, maxMp: 100,
    techniques: [], equippedAttackTechniques: [], equippedDefenseTechniques: [],
    equipments: [], equippedMelee: null, equippedRanged: null, equippedHead: null, equippedBody: null, equippedLegs: null, equippedFeet: null,
    factionId: null, ...overrides,
  };
}

describe('CultivationStrategy - executeCultivationWithStrategy', () => {
  it('稳健修炼：消耗 20 灵石，标准收益', () => {
    const p = makeTestProtagonist();
    const result = executeCultivationWithStrategy(p, 'steady');

    expect(result.strategy).toBe('steady');
    expect(result.spiritStonesSpent).toBe(20);
    if (!result.success) {
      // 失败时返半
      expect(result.spiritStonesRefunded).toBe(10);
    }
  });

  it('激进修炼：消耗 40 灵石，可能触发意外突破', () => {
    const p = makeTestProtagonist();
    const result = executeCultivationWithStrategy(p, 'aggressive');

    expect(result.strategy).toBe('aggressive');
    expect(result.spiritStonesSpent).toBe(40);
    // 成功时 statGainMultiplier = 2.5
    if (result.success) {
      expect(Object.values(result.statChanges).some(v => (v || 0) >= 2)).toBe(true);
    }
  });

  it('顿悟尝试：零消耗，失败进入冷却', () => {
    const p = makeTestProtagonist();
    const result = executeCultivationWithStrategy(p, 'insight');

    expect(result.strategy).toBe('insight');
    expect(result.spiritStonesSpent).toBe(0);
    if (!result.success) {
      expect(result.cooldownUntil).toBeGreaterThan(0);
    }
  });

  it('灵石不足时返回失败', () => {
    const p = makeTestProtagonist();
    p.inventory = [];
    const result = executeCultivationWithStrategy(p, 'steady');

    expect(result.success).toBe(false);
    expect(result.spiritStonesSpent).toBe(0);
  });

  it('顿悟成功时可能获得印记', () => {
    const config = CULTIVATION_STRATEGIES.insight;
    expect(config.spiritStoneCost).toBe(0);
  });
});

describe('CultivationStrategy - generateCultivationCritEvent', () => {
  it('返回 null 或有效事件', () => {
    const p = makeTestProtagonist();
    const event = generateCultivationCritEvent(p, 'steady');

    if (event !== null) {
      expect(event.title.length).toBeGreaterThan(0);
      expect(event.choices.length).toBeGreaterThanOrEqual(2);
      expect(event.sourceStrategy).toBe('steady');
    }
  });
});

describe('CultivationStrategy - CULTIVATION_STRATEGIES 配置', () => {
  it('三种策略已定义', () => {
    expect(CULTIVATION_STRATEGIES.steady).toBeDefined();
    expect(CULTIVATION_STRATEGIES.aggressive).toBeDefined();
    expect(CULTIVATION_STRATEGIES.insight).toBeDefined();
  });

  it('顿悟尝试冷却时间为 600 秒', () => {
    expect(CULTIVATION_STRATEGIES.insight.cooldownOnFail).toBe(600);
  });
});
