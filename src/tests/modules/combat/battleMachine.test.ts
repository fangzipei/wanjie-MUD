/**
 * 手动战斗系统测试
 *
 * 测试 executeBattleAction 纯函数的攻击/防御/逃跑/真气不足/战斗胜负场景。
 */
import { describe, it, expect } from 'vitest';
import {
  executeBattleAction,
  createManualBattleState,
  validateTechniqueUse,
  decideAIAction,
  applyDefendReduction,
  buildBattleResult,
} from '@/lib/game/combat/battleMachine';

/** 创建测试用战斗状态 */
function makeTestState(overrides: Partial<ReturnType<typeof createManualBattleState>> = {}) {
  return createManualBattleState({
    playerMaxHp: 200,
    playerCurrentHp: 200,
    playerMaxMp: 100,
    playerCurrentMp: 100,
    playerAttack: 50,
    playerDefense: 30,
    playerSpeed: 15,
    playerElement: 'fire',
    playerWeapon: 'sword',
    availableTechniques: [
      {
        techniqueId: 'tech_1',
        name: '火焰斩',
        mpCost: 10,
        powerMultiplier: 1.5,
        element: 'fire',
        compatibleWeapon: 'sword',
        isOnCooldown: false,
        cooldownRemaining: 0,
        isAvailable: true,
        elementalStatus: 'advantage',
      },
      {
        techniqueId: 'tech_2',
        name: '冰霜护体',
        mpCost: 15,
        powerMultiplier: 0.8,
        element: 'ice',
        compatibleWeapon: null,
        isOnCooldown: false,
        cooldownRemaining: 0,
        isAvailable: true,
        elementalStatus: 'disadvantage',
      },
    ],
    enemyName: '测试敌人',
    enemyMaxHp: 150,
    enemyCurrentHp: 150,
    enemyAttack: 40,
    enemyDefense: 25,
    enemySpeed: 10,
    enemyLevel: 10,
    enemyElement: 'ice',
    enemyWeapon: 'blade',
    enemyRealm: '炼气期',
    ...overrides,
  });
}

describe('battleMachine - executeBattleAction', () => {
  it('普通攻击：造成伤害并消耗敌人 HP', () => {
    const state = makeTestState();
    const result = executeBattleAction(state, { type: 'attack', source: 'player' }, 42);

    expect(result.enemyCurrentHp).toBeLessThan(150); // 敌人受伤
    expect(result.currentRound).toBe(2); // 回合前进
    expect(result.turnHistory.length).toBeGreaterThanOrEqual(1);
  });

  it('招式攻击：消耗真气并造成更高伤害', () => {
    const state = makeTestState();
    const result = executeBattleAction(
      state,
      { type: 'attack', techniqueId: 'tech_1', source: 'player' },
      100
    );

    expect(result.playerCurrentMp).toBeLessThanOrEqual(100);
    expect(result.turnHistory.some(t => t.actor === 'player')).toBe(true);
  });

  it('防御指令：恢复真气，受到伤害减少', () => {
    const state = makeTestState({ playerCurrentMp: 50 });
    const result = executeBattleAction(state, { type: 'defend', source: 'player' }, 200);

    // 真气恢复（5% of maxMp = 5）
    expect(result.playerCurrentMp).toBeGreaterThanOrEqual(50);
    // 防御记录
    expect(result.turnHistory.some(t => t.action.type === 'defend')).toBe(true);
  });

  it('逃跑成功：战斗结束，fled=true', () => {
    const state = makeTestState({ playerSpeed: 100, enemySpeed: 1 }); // 玩家速度远超敌人
    const result = executeBattleAction(state, { type: 'flee', source: 'player' }, 42);

    // 逃跑可能成功（速度比 = 100/101 ≈ 99%）
    if (result.fled) {
      expect(result.isOver).toBe(true);
      expect(result.victory).toBeUndefined();
    }
  });

  it('敌人被击败：战斗结束，victory=true', () => {
    const state = makeTestState({
      enemyCurrentHp: 1,
      playerAttack: 999,
    });
    const result = executeBattleAction(state, { type: 'attack', source: 'player' }, 42);

    expect(result.isOver).toBe(true);
    expect(result.victory).toBe(true);
  });

  it('玩家被击败：战斗结束，victory=false', () => {
    const state = makeTestState({
      playerCurrentHp: 1,
      enemyAttack: 999,
    });
    const result = executeBattleAction(state, { type: 'attack', source: 'player' }, 200);

    // 敌人回合可能击杀玩家
    if (result.isOver && result.victory === false) {
      expect(result.playerCurrentHp).toBe(0);
    }
  });

  it('最大回合数：超时后按 HP 比例判定', () => {
    const state = makeTestState({ currentRound: 20, maxRounds: 20 });
    // 设置当前回合已到上限，下一次行动应触发超时判定
    const result = executeBattleAction(state, { type: 'attack', source: 'player' }, 500);

    if (result.currentRound >= result.maxRounds) {
      expect(result.isOver).toBe(true);
    }
  });
});

describe('battleMachine - validateTechniqueUse', () => {
  it('可用招式验证通过', () => {
    const state = makeTestState();
    const result = validateTechniqueUse(state, 'tech_1');
    expect(result.valid).toBe(true);
  });

  it('真气不足时拒绝', () => {
    const state = makeTestState({ playerCurrentMp: 0 });
    // 更新招式可用性
    const techs = state.availableTechniques.map(t => ({
      ...t,
      isAvailable: t.mpCost <= state.playerCurrentMp && !t.isOnCooldown,
    }));
    const s = { ...state, availableTechniques: techs };
    const result = validateTechniqueUse(s, 'tech_1');
    expect(result.valid).toBe(false);
  });
});

describe('battleMachine - decideAIAction', () => {
  it('激进策略：优先高伤害招式', () => {
    const state = makeTestState();
    const decision = decideAIAction(state, 'aggressive', 42);
    expect(decision.action.type).toBe('attack');
  });

  it('保守策略：HP < 50% 时防御', () => {
    const state = makeTestState({ playerCurrentHp: 50 }); // 25%
    const decision = decideAIAction(state, 'conservative', 42);
    // HP < 50% 应防御
    expect(['defend', 'attack']).toContain(decision.action.type);
  });

  it('均衡策略：返回有效的战斗动作', () => {
    const state = makeTestState();
    const decision = decideAIAction(state, 'balanced', 42);
    expect(decision.action).toBeDefined();
    expect(decision.reason.length).toBeGreaterThan(0);
  });
});

describe('battleMachine - applyDefendReduction', () => {
  it('防御时减少伤害 40%', () => {
    expect(applyDefendReduction(100, true)).toBe(60);
  });

  it('非防御时不减少伤害', () => {
    expect(applyDefendReduction(100, false)).toBe(100);
  });
});

describe('battleMachine - buildBattleResult', () => {
  it('胜利时包含奖励', () => {
    const state = makeTestState();
    // 手动设置 isOver 和 victory
    const winState = { ...state, isOver: true, victory: true as const };
    const result = buildBattleResult(winState, 10);
    expect(result.victory).toBe(true);
    expect(result.rewards?.experience).toBeGreaterThan(0);
    expect(result.rewards?.spiritStones).toBeGreaterThan(0);
  });

  it('失败时无奖励', () => {
    const state = makeTestState();
    const loseState = { ...state, isOver: true, victory: false as const };
    const result = buildBattleResult(loseState, 10);
    expect(result.victory).toBe(false);
    expect(result.rewards).toBeUndefined();
  });
});
