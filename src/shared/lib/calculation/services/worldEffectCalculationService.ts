/**
 * 世界效果计算服务
 * 
 * 将世界效果通过统一计算系统应用
 * 提供对主角和敌人的效果计算
 */

import {
  WorldDanger,
  WorldOpportunity,
} from '@/modules/identity/data/worldEffectsData';
import { calculateWorldRewardCoefficient } from '@/modules/identity/data/worldSystem';
import { Enemy } from '@/modules/combat/logic/enemy/types';
import { Protagonist, World, StatName } from '@/shared/lib/types';
import { WorldDangerAdapter, WorldOpportunityAdapter } from '../adapters/worldEffectAdapter';
import { UnifiedCalculator, getCalculator } from '../calculator';
import { LOG_PREFIX } from '../constants';
import { CalculationContext } from '../context/types';
import { EffectRegistry, createEffectRegistry } from '../effect/registry';
import { buildContextFromProtagonist } from '../helpers/contextHelper';
import { UnifiedEffect, CalculableStat } from '../types';

// ============================================
// 类型定义
// ============================================

/** 应用效果结果 */
export interface AppliedEffectResult {
  /** 对主角的效果 */
  protagonistEffects: UnifiedEffect[];
  /** 对敌人的效果 */
  enemyEffects: UnifiedEffect[];
  /** 消息列表 */
  messages: string[];
  /** 属性计算结果（可选） */
  calculationResult?: Record<string, number>;
}

/** 敌人计算上下文 */
export interface EnemyCalculationContext {
  enemy: Enemy;
  world: World;
  activeDangers: WorldDanger[];
}

// ============================================
// 世界效果计算服务
// ============================================

export class WorldEffectCalculationService {
  private calculator: UnifiedCalculator;
  
  constructor() {
    this.calculator = getCalculator();
  }
  
  // ============================================
  // 主角效果计算
  // ============================================
  
  /**
   * 计算世界效果对主角的属性修正
   * 
   * @param protagonist 主角对象
   * @param world 世界对象
   * @returns 属性修正结果
   */
  calculateProtagonistStats(
    protagonist: Protagonist,
    world: World
  ): Map<CalculableStat, { base: number; final: number; modifiers: number }> {
    // 构建计算上下文
    const context = buildContextFromProtagonist(protagonist);
    
    // 使用统一计算器计算所有属性
    const result = this.calculator.calculateAllStats(context);
    
    // 转换为易用格式
    const output = new Map<CalculableStat, { base: number; final: number; modifiers: number }>();
    
    for (const [stat, statResult] of result.stats) {
      output.set(stat, {
        base: statResult.baseValue,
        final: statResult.finalValue,
        modifiers: statResult.finalValue - statResult.baseValue,
      });
    }
    
    return output;
  }
  
  /**
   * 获取世界效果对主角的属性修正值（增量）
   * 
   * @param protagonist 主角对象
   * @param world 世界对象
   * @returns 属性修正增量
   */
  getProtagonistModifiers(
    protagonist: Protagonist,
    world: World
  ): Partial<Record<CalculableStat, number>> {
    // 构建计算上下文
    const context = buildContextFromProtagonist(protagonist);
    
    // 临时注册表，只包含世界效果
    const tempRegistry = createEffectRegistry();
    
    // 注册世界危险效果
    for (const danger of world.dangers) {
      const effects = WorldDangerAdapter.convert(danger as any, context);
      for (const effect of effects) {
        tempRegistry.register(effect);
      }
    }
    
    // 注册世界机缘效果
    for (const opportunity of world.opportunities) {
      const effects = WorldOpportunityAdapter.convert(opportunity as any, context);
      for (const effect of effects) {
        tempRegistry.register(effect);
      }
    }
    
    // 收集所有效果
    const modifiers: Partial<Record<CalculableStat, number>> = {};
    const worldEffects = tempRegistry.getAll();
    
    for (const effect of worldEffects) {
      if (effect.value !== undefined) {
        const current = modifiers[effect.targetStat] || 0;
        modifiers[effect.targetStat] = current + effect.value;
      }
    }
    
    return modifiers;
  }
  
  // ============================================
  // 敌人效果计算
  // ============================================
  
  /**
   * 计算世界效果对敌人的属性修正
   */
  calculateEnemyModifiers(
    enemy: Enemy,
    world: World,
    activeDangers: WorldDanger[] = []
  ): {
    attackBonus: number;
    defenseBonus: number;
    hpBonus: number;
  } {
    let attackBonus = 0;
    let defenseBonus = 0;
    let hpBonus = 0;
    
    // 应用世界难度系数
    const difficultyMultiplier = world.actualCoefficient;
    
    // 从危险效果中提取敌人增益
    for (const danger of activeDangers) {
      if (danger.effect.enemyBuffs) {
        attackBonus += danger.effect.enemyBuffs.attackBonus || 0;
        defenseBonus += danger.effect.enemyBuffs.defenseBonus || 0;
        hpBonus += danger.effect.enemyBuffs.hpBonus || 0;
      }
    }
    
    // 应用难度系数和敌人增益
    return {
      attackBonus: (difficultyMultiplier * 0.9 - 1) + attackBonus,
      defenseBonus: (difficultyMultiplier * 0.8 - 1) + defenseBonus,
      hpBonus: (difficultyMultiplier - 1) + hpBonus,
    };
  }
  
  /**
   * 应用世界效果到敌人
   */
  applyWorldEffectsToEnemy(
    enemy: Enemy,
    world: World,
    activeDangers: WorldDanger[] = []
  ): Enemy {
    const modifiers = this.calculateEnemyModifiers(enemy, world, activeDangers);
    
    return {
      ...enemy,
      currentHp: Math.floor(enemy.maxHp * (1 + modifiers.hpBonus)),
      maxHp: Math.floor(enemy.maxHp * (1 + modifiers.hpBonus)),
      stats: {
        ...enemy.stats,
        attack: Math.floor(enemy.stats.attack * (1 + modifiers.attackBonus)),
        defense: Math.floor(enemy.stats.defense * (1 + modifiers.defenseBonus)),
      },
    };
  }
  
  // ============================================
  // 奖励系数计算
  // ============================================
  
  /**
   * 计算世界奖励系数（运行时动态计算，不再依赖 World 静态字段）
   */
  calculateRewardCoefficients(world: World): {
    expMultiplier: number;
    spiritStoneMultiplier: number;
    dropMultiplier: number;
    rarityBonus: {
      rare: number;
      epic: number;
      legendary: number;
      mythic: number;
    };
  } {
    const coeffs = calculateWorldRewardCoefficient(world.actualCoefficient);

    return {
      expMultiplier: coeffs.expCoefficient,
      spiritStoneMultiplier: coeffs.spiritStoneCoefficient,
      dropMultiplier: coeffs.dropCoefficient,
      rarityBonus: { ...coeffs.rarityBonus },
    };
  }
  
  // ============================================
  // 工具方法
  // ============================================
  
  /**
   * 清除计算器效果缓存
   */
  clearEffects(): void {
    this.calculator.clear();
  }
}

// ============================================
// 单例实例
// ============================================

let serviceInstance: WorldEffectCalculationService | null = null;

/**
 * 获取世界效果计算服务实例
 */
export function getWorldEffectCalculationService(): WorldEffectCalculationService {
  if (!serviceInstance) {
    serviceInstance = new WorldEffectCalculationService();
  }
  return serviceInstance;
}

/**
 * 重置服务实例（用于测试）
 */
export function resetWorldEffectCalculationService(): void {
  serviceInstance = null;
}
