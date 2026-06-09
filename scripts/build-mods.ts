/**
 * Mod 构建脚本
 *
 * 构建时将 mods/ 目录复制到 public/mods/，并生成 mod-list.json 索引文件。
 *
 * 用法：
 *   npx tsx scripts/build-mods.ts
 *
 * 集成到 pnpm build 流程中自动执行。
 */
import * as fs from 'fs';
import * as path from 'path';

const MODS_SOURCE = path.resolve(__dirname, '../mods');
const MODS_TARGET = path.resolve(__dirname, '../public/mods');

interface ModListEntry {
  id: string;
  path: string;
}

interface ModList {
  mods: ModListEntry[];
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src: string, dest: string) {
  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildMods() {
  console.log('\n🔧 构建 Mod 数据...\n');

  // 清理目标目录
  if (fs.existsSync(MODS_TARGET)) {
    fs.rmSync(MODS_TARGET, { recursive: true });
  }

  if (!fs.existsSync(MODS_SOURCE)) {
    console.warn('  ⚠ mods/ 目录不存在，跳过');
    return;
  }

  // 复制所有 Mod 目录
  const entries = fs.readdirSync(MODS_SOURCE, { withFileTypes: true });
  const modList: ModList = { mods: [] };

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const modDir = path.join(MODS_SOURCE, entry.name);
    const modJsonPath = path.join(modDir, 'mod.json');

    // 检查是否是有效的 Mod 目录（包含 mod.json）
    if (!fs.existsSync(modJsonPath)) {
      console.warn(`  ⚠ 跳过 "${entry.name}"：缺少 mod.json`);
      continue;
    }

    // 解析 mod.json 获取 ID
    try {
      const modJson = JSON.parse(fs.readFileSync(modJsonPath, 'utf-8'));
      const modId = modJson.id || entry.name;

      // 复制到目标
      const targetDir = path.join(MODS_TARGET, entry.name);
      copyDir(modDir, targetDir);

      modList.mods.push({ id: modId, path: entry.name });
      console.log(`  ✓ ${entry.name} (id: ${modId})`);
    } catch (err) {
      console.error(`  ✗ "${entry.name}" 的 mod.json 解析失败:`, err);
    }
  }

  // 生成 mod-list.json 索引
  const indexPath = path.join(MODS_TARGET, 'mod-list.json');
  fs.writeFileSync(indexPath, JSON.stringify(modList, null, 2), 'utf-8');
  console.log(`\n  ✓ 生成索引: mod-list.json (${modList.mods.length} 个 Mod)`);
  console.log(`\n✅ Mod 构建完成，输出到: ${MODS_TARGET}\n`);
}

buildMods();
