/**
 * 剧情执行逻辑
 *
 * 纯函数，后续存放节点查找、条件检查、效果应用等逻辑。
 */

import type { Story, StoryNode } from '../types';

/**
 * 按 ID 查找剧情节点
 */
export function findStoryNode(story: Story, nodeId: string): StoryNode | undefined {
  return story.nodes.find(n => n.id === nodeId);
}

/**
 * 获取剧情的起始节点
 */
export function getStartNode(story: Story): StoryNode | undefined {
  return findStoryNode(story, story.startNodeId);
}

/**
 * 按标签过滤剧情
 */
export function findStoriesByTag(stories: Story[], tag: string): Story[] {
  return stories.filter(s => s.tags?.includes(tag));
}
