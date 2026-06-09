/**
 * Hook: useStatLabels
 *
 * 职责：为组件提供当前世界的属性标签，统一替换硬编码属性名。
 * 依赖模块：identity/data/statDisplayNames
 */
import { useMemo } from 'react';
import type { WorldType } from '@/shared/lib/types';
import { getStatLabels, type StatKey } from '../data/statDisplayNames';

export interface StatLabelsResult {
  /** 属性键到显示名的映射：{ '体质': '体能', '灵根': '智力', ... } */
  labels: Record<string, string>;
  /** 内部属性键列表：['体质', '灵根', '悟性', '幸运', '意志'] */
  statKeys: StatKey[];
  /** 当前世界的属性显示名列表：['体能', '智力', '反应', '技术', '魅力'] */
  displayNames: string[];
  /** 根据内部键获取显示名 */
  getLabel: (statKey: string) => string;
}

/**
 * 获取当前世界的属性标签
 *
 * @param worldType - 世界类型，undefined 时返回修仙默认值
 * @returns 属性标签映射和辅助方法
 */
export function useStatLabels(worldType?: WorldType): StatLabelsResult {
  return useMemo(() => {
    const { labels, statKeys, displayNames } = getStatLabels(worldType || '修仙');

    return {
      labels,
      statKeys,
      displayNames,
      getLabel: (statKey: string) => labels[statKey] || statKey,
    };
  }, [worldType]);
}
