/**
 * 世界差异化词条池
 *
 * 不同世界类型使用不同的出身/特质/性格/天赋词条集合。
 * 当前实现：为科技/魔幻/末世提供专属词条覆盖，其他世界沿用修仙词条（后续迭代补充）。
 */
import type { WorldType } from '@/shared/lib/types';
import { WorldDataRegistry } from '@/shared/lib/registry';

/**
 * 世界词条池配置
 * 每个世界类型可覆盖默认修仙词条
 */
export interface WorldTraitPool {
  /** 世界类型标识 */
  worldType: WorldType;
  /** 词条描述后缀风格（用于 generateCharacter 调整词条 flavor） */
  flavorStyle: 'cultivation' | 'tech' | 'magic' | 'martial' | 'esper' | 'wasteland';
}

/** 从注册中心获取词条风味配置 */
export function getWorldTraitFlavors(): Record<string, WorldTraitPool> {
  const registry = WorldDataRegistry.getInstance();
  const types = registry.getAllWorldTypes();
  const result: Record<string, WorldTraitPool> = {};
  for (const id of types) {
    const data = registry.getWorldType(id);
    if (data) {
      result[id] = {
        worldType: id as WorldType,
        flavorStyle: 'cultivation', // 默认 flavor，后续可从 traits 数据中推导
      };
    }
  }
  return result;
}

/** @deprecated 使用 getWorldTraitFlavors() 替代 */
export const WORLD_TRAIT_FLAVORS: Record<WorldType, WorldTraitPool> = {
  '修仙': { worldType: '修仙', flavorStyle: 'cultivation' },
  '仙侠': { worldType: '仙侠', flavorStyle: 'cultivation' },
  '高武': { worldType: '高武', flavorStyle: 'martial' },
  '科技': { worldType: '科技', flavorStyle: 'tech' },
  '魔幻': { worldType: '魔幻', flavorStyle: 'magic' },
  '异能': { worldType: '异能', flavorStyle: 'esper' },
  '武侠': { worldType: '武侠', flavorStyle: 'martial' },
  '末世': { worldType: '末世', flavorStyle: 'wasteland' },
};
