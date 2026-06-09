/**
 * 世界生成 CLI 工具
 *
 * 按种子确定性生成世界，写入 src/modules/identity/data/worlds/ 目录。
 * 支持 --ai 参数调用 Anthropic API 自动生成专属剧情和 NPC。
 *
 * 使用:
 *   npx tsx scripts/generate-world.ts --seed=12345
 *   npx tsx scripts/generate-world.ts --seed=12345 --force
 *   npx tsx scripts/generate-world.ts --seed=12345 --ai
 *   npx tsx scripts/generate-world.ts --all
 *   npx tsx scripts/generate-world.ts --all --ai
 *
 * AI 生成需要设置环境变量 ANTHROPIC_API_KEY。
 */

import fs from 'node:fs';
import path from 'node:path';
import { generateWorld, DEFAULT_WORLD_SEEDS } from '../src/modules/identity/logic/generators';
import type { World } from '../src/shared/lib/types';

// ============================================
// 路径配置
// ============================================

const WORLDS_DIR = path.resolve(import.meta.dirname, '../src/modules/identity/data/worlds');
const BARREL_PATH = path.join(WORLDS_DIR, 'index.ts');
const STORIES_DIR = path.resolve(import.meta.dirname, '../src/modules/narrative/data/stories');
const NPCS_DIR = path.resolve(import.meta.dirname, '../src/modules/npc/data/npcs');

// ============================================
// 碰撞检查 / 文件操作
// ============================================

/** 获取某个 seed 对应的 JSON 路径 */
function worldFilePath(seed: number): string {
  return path.join(WORLDS_DIR, `world_${seed}.json`);
}

/** 检查世界是否已存在 */
function worldExists(seed: number): boolean {
  return fs.existsSync(worldFilePath(seed));
}

/** 加载已存在的世界 JSON */
function loadWorld(seed: number): World {
  const raw = fs.readFileSync(worldFilePath(seed), 'utf-8');
  return JSON.parse(raw) as World;
}

// ============================================
// Barrel 维护
// ============================================

/** 扫描目录中所有 world_*.json，返回种子列表（已排序） */
function scanExistingSeeds(): number[] {
  if (!fs.existsSync(WORLDS_DIR)) return [];

  return fs.readdirSync(WORLDS_DIR)
    .filter(f => /^world_\d+\.json$/.test(f))
    .map(f => parseInt(f.match(/^world_(\d+)\.json$/)?.[1] ?? '0', 10))
    .sort((a, b) => a - b);
}

/** 重新生成 barrel index.ts */
function regenerateBarrel(seeds: number[]): void {
  const aliases = seeds.map((s, i) => `import w${i} from './world_${s}.json';`);
  const items = seeds.map((_, i) => `  w${i} as unknown as World`);

  const content = `/**
 * 生成的世界数据文件索引
 *
 * 由 scripts/generate-world.ts 自动维护，请勿手动编辑。
 * 新增世界请运行：npx tsx scripts/generate-world.ts --seed=<新种子>
 */

import type { World } from '@/shared/lib/types';
${aliases.join('\n')}

/** 所有已生成的世界列表 */
export const AVAILABLE_WORLDS: readonly World[] = [
${items.join(',\n')},
];
`;

  fs.writeFileSync(BARREL_PATH, content);
  console.log(`  ✓ index.ts 已更新（共 ${seeds.length} 个世界）`);
}

// ============================================
// AI 剧情 / NPC 生成
// ============================================

/** 调用 AI 生成剧情和 NPC，写入对应目录并更新 world.specialPlot */
async function generateAIContent(world: World): Promise<World> {
  const { generatePlotWithAI } = await import('../src/shared/lib/ai/client');
  const ctx = {
    seed: world.id,
    worldType: world.type,
    worldName: world.name,
    worldDescription: world.description,
    powerSystem: world.powerSystem,
    baseCoefficient: world.baseCoefficient,
    factions: world.factions.map(f => ({ id: f.id, name: f.name })),
  };

  console.log('  🤖 调用 Anthropic API 生成剧情和 NPC…');
  const result = await generatePlotWithAI(ctx);

  // 保存剧情
  fs.mkdirSync(STORIES_DIR, { recursive: true });
  const storyPath = path.join(STORIES_DIR, `story_${world.id}.json`);
  fs.writeFileSync(storyPath, JSON.stringify(result.story, null, 2));
  console.log(`  ✓ story_${world.id}.json 已写入`);

  // 保存 NPC
  for (const npc of result.npcs) {
    fs.mkdirSync(NPCS_DIR, { recursive: true });
    const npcPath = path.join(NPCS_DIR, `npc_${npc.id}.json`);
    if (!fs.existsSync(npcPath)) {
      fs.writeFileSync(npcPath, JSON.stringify(npc, null, 2));
      console.log(`  ✓ npc_${npc.id}.json 已写入`);
    } else {
      console.log(`  ⚠ npc_${npc.id}.json 已存在，跳过`);
    }
  }

  // 更新 world.specialPlot
  const updatedWorld: World = {
    ...world,
    specialPlot: {
      storyId: result.story.id,
      title: result.story.title,
      description: result.story.description,
    },
  };

  return updatedWorld;
}

// ============================================
// 生成逻辑
// ============================================

/** 生成单个世界并写入文件 */
async function generateSingleWorld(seed: number, force: boolean, useAI: boolean): Promise<void> {
  const isNew = !worldExists(seed) || force;

  let world: World;
  if (!force && worldExists(seed) && !useAI) {
    console.log(`  ⚠ seed=${seed} 已存在，跳过（使用 --force 覆盖）`);
    return;
  }

  if (isNew) {
    world = generateWorld(seed);
  } else {
    world = loadWorld(seed);
  }

  // AI 生成剧情和 NPC
  if (useAI) {
    world = await generateAIContent(world);
  }

  // 如果 world 有更新或是新建的，写入文件
  if (isNew || useAI) {
    // 先写 world JSON（可能含 specialPlot）
    const updatedWorldsDir = WORLDS_DIR;
    fs.mkdirSync(updatedWorldsDir, { recursive: true });
    fs.writeFileSync(worldFilePath(world.id), JSON.stringify(world, null, 2));
    console.log(`  ✓ world_${world.id}.json ${isNew ? '已写入' : '已更新'}`);
  }

  // 更新 barrel
  const allSeeds = scanExistingSeeds();
  regenerateBarrel(allSeeds);
}

/** 生成默认的 8 个世界 */
async function generateAllDefault(force: boolean, useAI: boolean): Promise<void> {
  for (const seed of DEFAULT_WORLD_SEEDS) {
    if (!force && worldExists(seed) && !useAI) {
      console.log(`  ⚠ seed=${seed} 已存在，跳过`);
      continue;
    }

    // force 模式或新世界 → 重新生成；已有世界且不用 AI → 加载已有
    const shouldRegenerate = force || !worldExists(seed);
    let world = shouldRegenerate ? generateWorld(seed) : loadWorld(seed);

    if (useAI) {
      world = await generateAIContent(world);
    }

    fs.mkdirSync(WORLDS_DIR, { recursive: true });
    fs.writeFileSync(worldFilePath(world.id), JSON.stringify(world, null, 2));
    console.log(`  ✓ world_${world.id}.json 已写入`);
  }

  const allSeeds = scanExistingSeeds();
  regenerateBarrel(allSeeds);
}

// ============================================
// CLI 入口
// ============================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const useAI = args.includes('--ai');

  if (args.includes('--all')) {
    console.log(`▶ 生成全部默认世界…${useAI ? ' (AI 剧情)' : ''}\n`);
    await generateAllDefault(force, useAI);
    console.log('\n✅ 完成');
    return;
  }

  const seedArg = args.find(a => a.startsWith('--seed='));
  if (!seedArg) {
    console.error('用法:');
    console.error('  npx tsx scripts/generate-world.ts --seed=<数字>');
    console.error('  npx tsx scripts/generate-world.ts --seed=<数字> --force');
    console.error('  npx tsx scripts/generate-world.ts --seed=<数字> --ai');
    console.error('  npx tsx scripts/generate-world.ts --all');
    console.error('  npx tsx scripts/generate-world.ts --all --ai');
    process.exit(1);
  }

  const seed = parseInt(seedArg.replace('--seed=', ''), 10);
  if (isNaN(seed)) {
    console.error(`❌ 无效的 seed: ${seedArg}`);
    process.exit(1);
  }

  console.log(`▶ 生成世界 seed=${seed}${force ? ' (强制覆盖)' : ''}${useAI ? ' (AI 剧情)' : ''}\n`);
  await generateSingleWorld(seed, force, useAI);
  console.log('\n✅ 完成');
}

main().catch(err => {
  console.error('\n❌ 错误:', err instanceof Error ? err.message : err);
  process.exit(1);
});
