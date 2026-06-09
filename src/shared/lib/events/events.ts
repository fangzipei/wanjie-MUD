/**
 * 事件系统
 * 
 * 此文件负责：
 * 1. 从数据文件获取基础事件
 * 2. 根据世界类型处理事件文本
 * 3. 提供事件获取接口
 * 
 * 数据文件：src/lib/game/data/events.ts
 */

import { getEventExpReward } from '@/modules/progression/logic/balanceConfig';
import { getWorldTerms } from '@/modules/identity/logic/generators';
import { getItemById, cultivationPillItems, materialItems } from '@/modules/equipment/logic/items';
import { AdventureEvent, WorldType, InventoryItem, createInventoryItem } from '@/shared/lib/types';
import {
  SAFE_EVENTS,
  RISKY_EVENTS,
  DANGEROUS_EVENTS,
  BATTLE_EVENTS,
  ALL_EVENTS,
  EventRisk
} from '@/modules/exploration/data/events';

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// 根据世界类型生成事件
function generateEventForWorld(baseEvent: AdventureEvent, worldType: WorldType): AdventureEvent {
  const terms = getWorldTerms(worldType);
  
  // 替换事件中的通用术语
  const processText = (text: string): string => {
    return text
      .replace(/灵石/g, terms.resource)
      .replace(/灵气/g, terms.energy)
      .replace(/修炼/g, terms.practice)
      .replace(/法宝/g, terms.treasure)
      .replace(/丹药/g, worldType === '科技' ? '药剂' : worldType === '魔幻' ? '魔药' : '丹药')
      .replace(/功法/g, worldType === '科技' ? '技能模块' : worldType === '魔幻' ? '魔法书' : '功法');
  };
  
  return {
    ...baseEvent,
    description: processText(baseEvent.description),
    choices: baseEvent.choices.map(choice => ({
      ...choice,
      text: processText(choice.text),
      result: processText(choice.result),
    }))
  };
}

// 辅助函数：创建道具实例
function createItem(itemId: string, quantity: number = 1): InventoryItem | undefined {
  const definition = getItemById(itemId);
  if (!definition) return undefined;
  return createInventoryItem(definition, quantity);
}

// 获取随机历练事件
export function getRandomEvent(worldType: WorldType): AdventureEvent {
  // 按概率选择事件类型
  const roll = Math.random();
  let events: AdventureEvent[];
  
  if (roll < 0.15) {
    // 15% 安全事件
    events = SAFE_EVENTS;
  } else if (roll < 0.65) {
    // 50% 风险事件
    events = RISKY_EVENTS;
  } else if (roll < 0.85) {
    // 20% 危险事件
    events = DANGEROUS_EVENTS;
  } else {
    // 15% 战斗事件
    events = BATTLE_EVENTS;
  }
  
  // 如果没有对应类型的事件，从所有事件中选择
  if (events.length === 0) {
    events = ALL_EVENTS;
  }
  
  const event = randomItem(events);
  return generateEventForWorld(event, worldType);
}

// 根据ID获取事件
export function getEventById(id: number, worldType: WorldType): AdventureEvent {
  const event = ALL_EVENTS.find(e => e.id === id) || ALL_EVENTS[0];
  return generateEventForWorld(event, worldType);
}

// 导出事件数据供其他模块使用
export { SAFE_EVENTS, RISKY_EVENTS, DANGEROUS_EVENTS, BATTLE_EVENTS, ALL_EVENTS };
export type { EventRisk };
