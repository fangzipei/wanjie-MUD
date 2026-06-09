/**
 * Mod 数据校验脚本
 *
 * 校验 mods/ 目录下所有 Mod 的 mod.json 清单和数据文件的格式正确性。
 *
 * 用法：
 *   npx tsx scripts/validate-mods.ts
 *   pnpm validate-mods
 */
import * as fs from 'fs';
import * as path from 'path';

const MODS_DIR = path.resolve(__dirname, '../mods');

interface ValidatorResult {
  valid: boolean;
  errors: string[];
}

// ============================================
// 轻量校验（无外部依赖）
// ============================================

function checkRequiredString(obj: Record<string, unknown>, key: string, path: string): string[] {
  const errors: string[] = [];
  if (typeof obj[key] !== 'string' || obj[key] === '') {
    errors.push(`${path}.${key}: 必填字符串`);
  }
  return errors;
}

function checkRequiredArray(obj: Record<string, unknown>, key: string, path: string): string[] {
  const errors: string[] = [];
  if (!Array.isArray(obj[key])) {
    errors.push(`${path}.${key}: 必填数组`);
  }
  return errors;
}

function checkStringArray(obj: Record<string, unknown>, key: string, path: string): string[] {
  const errors: string[] = [];
  if (obj[key] !== undefined) {
    if (!Array.isArray(obj[key])) {
      errors.push(`${path}.${key}: 必须为字符串数组`);
    } else {
      for (let i = 0; i < (obj[key] as unknown[]).length; i++) {
        if (typeof (obj[key] as unknown[])[i] !== 'string') {
          errors.push(`${path}.${key}[${i}]: 必须为字符串`);
        }
      }
    }
  }
  return errors;
}

function validateModManifest(data: Record<string, unknown>, modDir: string): ValidatorResult {
  const errors: string[] = [];
  const p = modDir;

  errors.push(...checkRequiredString(data, 'id', p));
  errors.push(...checkRequiredString(data, 'name', p));
  errors.push(...checkRequiredString(data, 'version', p));
  errors.push(...checkRequiredString(data, 'description', p));
  errors.push(...checkRequiredString(data, 'author', p));
  errors.push(...checkRequiredString(data, 'gameVersion', p));

  // required（可选布尔值）
  if (data.required !== undefined && typeof data.required !== 'boolean') {
    errors.push(`${p}.required: 必须为布尔值`);
  }

  // contentTypes
  errors.push(...checkRequiredArray(data, 'contentTypes', p));
  if (Array.isArray(data.contentTypes)) {
    const validTypes = ['world', 'traits', 'dangers', 'opportunities', 'realms', 'factions', 'names', 'text', 'items'];
    for (let i = 0; i < data.contentTypes.length; i++) {
      if (!validTypes.includes(data.contentTypes[i])) {
        errors.push(`${p}.contentTypes[${i}]: 不支持的类型 "${data.contentTypes[i]}"`);
      }
    }
  }

  // dataFiles
  if (data.dataFiles !== undefined) {
    if (typeof data.dataFiles !== 'object' || data.dataFiles === null || Array.isArray(data.dataFiles)) {
      errors.push(`${p}.dataFiles: 必须为对象`);
    }
  }

  // dependencies
  if (data.dependencies !== undefined) {
    errors.push(...checkStringArray(data, 'dependencies', p));
  }

  return { valid: errors.length === 0, errors };
}

function validateWorldData(data: unknown, modDir: string): ValidatorResult {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [`${modDir}/data/world.json: 无效的 JSON`] };
  }

  const obj = data as Record<string, unknown>;
  const worlds = obj.worlds;
  if (!Array.isArray(worlds)) {
    return { valid: false, errors: [`${modDir}/data/world.json: 缺少 "worlds" 数组`] };
  }

  for (let i = 0; i < worlds.length; i++) {
    const w = worlds[i] as Record<string, unknown>;
    const prefix = `${modDir}/data/world.json[${i}]`;

    errors.push(...checkRequiredString(w, 'id', prefix));
    errors.push(...checkRequiredString(w, 'name', prefix));
    errors.push(...checkRequiredString(w, 'description', prefix));
    errors.push(...checkRequiredArray(w, 'namePrefixes', prefix));
    errors.push(...checkRequiredArray(w, 'nameSuffixes', prefix));
    errors.push(...checkRequiredArray(w, 'descriptions', prefix));

    if (typeof w.baseCoefficient !== 'number') {
      errors.push(`${prefix}.baseCoefficient: 必填数字`);
    } else if (w.baseCoefficient < 0.5 || w.baseCoefficient > 3.0) {
      errors.push(`${prefix}.baseCoefficient: 值 ${w.baseCoefficient} 超出范围 (0.5-3.0)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateDataFile(filePath: string, contentType: string): ValidatorResult {
  if (!fs.existsSync(filePath)) {
    return { valid: true, errors: [] }; // skip missing optional files
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    if (contentType === 'world') {
      return validateWorldData(data, path.dirname(path.dirname(filePath)));
    }

    // Basic structure check for other types
    return { valid: true, errors: [] };
  } catch (err) {
    return { valid: false, errors: [`${filePath}: JSON 解析失败 — ${err instanceof Error ? err.message : '未知错误'}`] };
  }
}

function main() {
  console.log('\n🔍 校验 Mod 数据...\n');

  if (!fs.existsSync(MODS_DIR)) {
    console.log('  ⚠ mods/ 目录不存在，跳过校验\n');
    process.exit(0);
  }

  let totalErrors = 0;
  let totalMods = 0;
  let validMods = 0;

  const entries = fs.readdirSync(MODS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const modDir = path.join(MODS_DIR, entry.name);
    const modJsonPath = path.join(modDir, 'mod.json');

    if (!fs.existsSync(modJsonPath)) {
      console.warn(`  ⚠ "${entry.name}": 缺少 mod.json，跳过`);
      continue;
    }

    totalMods++;
    const modErrors: string[] = [];

    try {
      const raw = fs.readFileSync(modJsonPath, 'utf-8');
      const data = JSON.parse(raw) as Record<string, unknown>;
      const result = validateModManifest(data, entry.name);
      modErrors.push(...result.errors);

      // Validate data files
      if (data.dataFiles && typeof data.dataFiles === 'object') {
        const dataFiles = data.dataFiles as Record<string, string>;
        for (const [contentType, dataPath] of Object.entries(dataFiles)) {
          const fullPath = path.join(modDir, dataPath);
          const dataResult = validateDataFile(fullPath, contentType);
          modErrors.push(...dataResult.errors);
        }
      }

      if (data.contentTypes && Array.isArray(data.contentTypes)) {
        const dataFiles = (data.dataFiles ?? {}) as Record<string, string>;
        for (const ct of data.contentTypes) {
          if (typeof ct === 'string') {
            const declaredPath = dataFiles[ct];
            if (declaredPath && !fs.existsSync(path.join(modDir, declaredPath))) {
              modErrors.push(`${entry.name}: 数据文件 "${declaredPath}" 不存在`);
            }
          }
        }
      }
    } catch (err) {
      modErrors.push(`${entry.name}/mod.json: ${err instanceof Error ? err.message : '解析失败'}`);
    }

    if (modErrors.length === 0) {
      console.log(`  ✓ ${entry.name}`);
      validMods++;
    } else {
      console.error(`  ✗ ${entry.name}: ${modErrors.length} 个错误`);
      for (const err of modErrors) {
        console.error(`    - ${err}`);
      }
      totalErrors += modErrors.length;
    }
  }

  console.log(`\n📊 结果: ${validMods}/${totalMods} 个 Mod 通过校验`);

  if (totalErrors > 0) {
    console.error(`\n❌ 共 ${totalErrors} 个错误\n`);
    process.exit(1);
  } else {
    console.log('\n✅ 所有 Mod 校验通过！\n');
  }
}

main();
