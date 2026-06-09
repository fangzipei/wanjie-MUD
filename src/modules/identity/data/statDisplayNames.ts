/**
 * 属性显示名映射
 *
 * 根据世界类型将内部属性键（体质/灵根/悟性/幸运/意志）映射为世界对应的显示名。
 * 数据来自 WORLD_DATA[worldType].statDisplayNames。
 *
 * 设计决策：BaseStats/GrowthStats 底层键名保持不变（避免 50+ 处引用的大重构），
 * 通过此显示层映射函数在 UI 层展示世界正确的属性名。
 */
import type { WorldType } from '@/shared/lib/types';
import { WORLD_DATA } from './worldData';

/** 内部属性键 */
export type StatKey = '体质' | '灵根' | '悟性' | '幸运' | '意志';

/** 所有内部属性键列表 */
export const STAT_KEYS: StatKey[] = ['体质', '灵根', '悟性', '幸运', '意志'];

/** 修仙默认属性显示名（兜底） */
const DEFAULT_STAT_DISPLAY: Record<StatKey, string> = {
  '体质': '体质',
  '灵根': '灵根',
  '悟性': '悟性',
  '幸运': '幸运',
  '意志': '意志',
};

/**
 * 获取单个属性的世界显示名
 *
 * @param statKey - 内部属性键
 * @param worldType - 世界类型
 * @returns 世界对应的属性显示名
 */
export function getStatDisplayName(statKey: string, worldType: WorldType): string {
  const worldData = WORLD_DATA[worldType];
  if (worldData?.statDisplayNames?.[statKey]) {
    return worldData.statDisplayNames[statKey];
  }
  return DEFAULT_STAT_DISPLAY[statKey as StatKey] || statKey;
}

/**
 * 获取当前世界的完整属性标签映射
 *
 * @param worldType - 世界类型
 * @returns { labels, statKeys, displayNames }
 */
export function getStatLabels(worldType: WorldType): {
  labels: Record<string, string>;
  statKeys: StatKey[];
  displayNames: string[];
} {
  const worldData = WORLD_DATA[worldType];
  const labels: Record<string, string> = {};

  for (const key of STAT_KEYS) {
    labels[key] = worldData?.statDisplayNames?.[key] || DEFAULT_STAT_DISPLAY[key];
  }

  return {
    labels,
    statKeys: [...STAT_KEYS],
    displayNames: STAT_KEYS.map(k => labels[k]),
  };
}
