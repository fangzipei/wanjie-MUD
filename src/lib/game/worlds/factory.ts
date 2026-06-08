/**
 * 世界机制工厂
 *
 * 根据世界类型返回对应的 WorldMechanics 实现。
 * 每种世界类型有独特的核心玩法循环。
 */

import type { WorldMechanics } from './types';
import { cultivationWorld } from './cultivationWorld';
import { techWorld } from './techWorld';
import { martialWorld } from './martialWorld';
import { magicWorld } from './magicWorld';
import { wastelandWorld } from './wastelandWorld';
import { mythWorld } from './mythWorld';

/** 世界机制注册表 */
const WORLD_MECHANICS: Record<string, WorldMechanics> = {
  '修仙': cultivationWorld,
  '仙侠': cultivationWorld,
  '高武': cultivationWorld,
  '魔幻': magicWorld,
  '异能': cultivationWorld,
  '武侠': martialWorld,
  '末世': wastelandWorld,
  '科技': techWorld,
};

/**
 * 获取世界机制
 *
 * @param worldType - 世界类型
 * @returns 对应的 WorldMechanics 实现
 */
export function getWorldMechanics(worldType: string): WorldMechanics {
  return WORLD_MECHANICS[worldType] || cultivationWorld;
}

/**
 * 检查某世界类型是否有独特的机制实现
 *
 * @param worldType - 世界类型
 * @returns 是否有独特机制
 */
export function hasUniqueMechanics(worldType: string): boolean {
  return ['科技', '武侠', '魔幻', '末世', '神话'].includes(worldType);
}
