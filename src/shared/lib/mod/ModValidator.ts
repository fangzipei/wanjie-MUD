/**
 * Mod 数据校验器
 *
 * 提供对 Mod 数据文件的综合校验功能。
 * 用于 pnpm validate-mods 脚本和 Mod 加载器的运行时校验。
 *
 * @module shared/lib/mod
 */

import type {
  ValidationError,
  ValidationResult,
} from '@/shared/lib/registry/schemas';
import {
  validateWorldTypes,
  validateDangers,
  validateOpportunities,
  validateRealmSystem,
  validateNamePool,
  validateFactionTemplates,
} from '@/shared/lib/registry/schemas';
import type { ModManifest, ModContentType } from './ModManifest';
import { validateManifest } from './ModManifest';

// ============================================
// 综合校验
// ============================================

/**
 * 校验 Mod 的所有数据文件
 *
 * @param manifest - Mod 清单
 * @param dataFiles - 已加载的数据文件内容（key: contentType, value: 解析后的 JSON）
 * @returns 校验结果（包含所有 content type 的错误汇总）
 */
export function validateModData(
  manifest: ModManifest,
  dataFiles: Record<string, unknown>
): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const contentType of manifest.contentTypes) {
    const data = dataFiles[contentType];
    if (data === undefined) {
      // dataFiles 中缺失声明的内容类型
      const dataPath = manifest.dataFiles[contentType];
      if (dataPath) {
        allErrors.push({
          path: `dataFiles.${contentType}`,
          message: `声明了内容类型 "${contentType}" 但数据文件 "${dataPath}" 未提供`,
        });
      }
      continue;
    }

    let result: ValidationResult;

    switch (contentType as ModContentType) {
      case 'world':
        result = validateWorldTypes(data);
        break;
      case 'dangers':
        result = validateDangers(data);
        break;
      case 'opportunities':
        result = validateOpportunities(data);
        break;
      case 'realms': {
        // realms data is an object: { "worldTypeId": RealmSystemData }
        const realms = data as Record<string, unknown>;
        const realmErrors: ValidationError[] = [];
        for (const [key, realmData] of Object.entries(realms)) {
          const r = validateRealmSystem(realmData);
          realmErrors.push(...r.errors.map(e => ({ path: `realms.${key}.${e.path}`, message: e.message })));
        }
        result = { valid: realmErrors.length === 0, errors: realmErrors };
        break;
      }
      case 'factions':
        result = validateFactionTemplates(data);
        break;
      case 'names': {
        // names data is an object: { "worldTypeId": NamePoolData }
        const names = data as Record<string, unknown>;
        const nameErrors: ValidationError[] = [];
        for (const [key, nameData] of Object.entries(names)) {
          const r = validateNamePool(nameData);
          nameErrors.push(...r.errors.map(e => ({ path: `names.${key}.${e.path}`, message: e.message })));
        }
        result = { valid: nameErrors.length === 0, errors: nameErrors };
        break;
      }
      // traits, text, items are not validated with schema checks (complex nested structure)
      case 'traits':
      case 'text':
      case 'items':
        // Basic structural check only
        result = { valid: true, errors: [] };
        break;
      default:
        allErrors.push({ path: contentType, message: `未知的内容类型: "${contentType}"` });
        continue;
    }

    // Prefix errors with the content type
    allErrors.push(...result.errors.map(e => ({
      path: `${contentType}.${e.path}`,
      message: e.message,
    })));
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * 完整校验一个 Mod（清单 + 所有数据）
 *
 * @param manifestJson - mod.json 的原始 JSON 字符串
 * @param dataFiles - 已加载的数据文件内容（key: contentType, value: 解析后的 JSON）
 * @returns 校验结果
 */
export function validateMod(
  manifestJson: string,
  dataFiles: Record<string, unknown>
): ValidationResult {
  const manifestErrors = validateManifest(JSON.parse(manifestJson));
  if (manifestErrors.length > 0) {
    return {
      valid: false,
      errors: manifestErrors.map(e => ({ path: `manifest.${e.path}`, message: e.message })),
    };
  }

  const manifest: ModManifest = JSON.parse(manifestJson);
  return validateModData(manifest, dataFiles);
}
