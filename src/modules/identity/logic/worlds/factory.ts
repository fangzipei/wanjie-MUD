/**
 * 世界机制工厂
 *
 * 根据世界类型返回对应的 WorldMechanics 实现。
 * 每种世界类型有独立的术语和参数配置。
 */
import type { WorldType } from '@/shared/lib/types';

import { cultivationWorld } from './cultivationWorld';
import { esperWorld } from './esperWorld';
import { highMartialWorld } from './highMartialWorld';
import { magicWorld } from './magicWorld';
import { martialWorld } from './martialWorld';
import { techWorld } from './techWorld';
import { wastelandWorld } from './wastelandWorld';
import { xiānxiáWorld } from './xiānxiáWorld';

import type { WorldMechanics } from './types';

/** 世界机制注册表（8 种世界类型各自独立实现） */
const WORLD_MECHANICS: Record<WorldType, WorldMechanics> = {
  '修仙': cultivationWorld,
  '仙侠': xiānxiáWorld,
  '高武': highMartialWorld,
  '科技': techWorld,
  '魔幻': magicWorld,
  '异能': esperWorld,
  '武侠': martialWorld,
  '末世': wastelandWorld,
};

/**
 * 获取世界机制
 *
 * @param worldType - 世界类型
 * @returns 对应的 WorldMechanics 实现
 */
export function getWorldMechanics(worldType: WorldType): WorldMechanics {
  return WORLD_MECHANICS[worldType] || cultivationWorld;
}

/**
 * 检查某世界类型是否有独特的机制实现
 *
 * @param worldType - 世界类型
 * @returns 是否有独特机制
 */
export function hasUniqueMechanics(worldType: WorldType): boolean {
  // 修仙是入门世界，保持 baseline 无独特机制
  // 其余 7 种世界类型各有独特玩法机制
  return worldType !== '修仙';
}
