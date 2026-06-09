/**
 * Mod 清单（mod.json）类型定义和校验
 *
 * @module shared/lib/mod
 */

// ============================================
// 类型定义
// ============================================

/** Mod 可提供的内容类型 */
export type ModContentType =
  | 'world'
  | 'traits'
  | 'dangers'
  | 'opportunities'
  | 'realms'
  | 'factions'
  | 'names'
  | 'text'
  | 'items';

/** 所有支持的 Mod 内容类型列表 */
export const ALL_MOD_CONTENT_TYPES: ModContentType[] = [
  'world',
  'traits',
  'dangers',
  'opportunities',
  'realms',
  'factions',
  'names',
  'text',
  'items',
];

/**
 * Mod 清单
 *
 * 对应每个 Mod 目录下的 mod.json 文件。
 * 定义 Mod 的身份、版本、依赖和提供的数据文件映射。
 */
export interface ModManifest {
  /** 全局唯一 Mod 标识符（kebab-case） */
  id: string;
  /** Mod 显示名称 */
  name: string;
  /** 语义化版本号 */
  version: string;
  /** Mod 简短描述（中文） */
  description: string;
  /** 作者名称或 GitHub 用户名 */
  author: string;
  /** 目标游戏版本（semver range，如 ">=1.0.0"） */
  gameVersion: string;
  /** 依赖的其他 Mod ID 列表 */
  dependencies: string[];
  /** 是否强制加载，失败时阻止游戏启动（默认 false） */
  required: boolean;
  /** 本 Mod 提供的内容类型 */
  contentTypes: ModContentType[];
  /** 内容类型到数据文件路径的映射 */
  dataFiles: Record<string, string>;
}

/** Mod 加载失败错误 */
export class ModLoadError extends Error {
  /** 失败的 Mod 列表 */
  failedMods: Array<{ id: string; name: string; error: string }>;

  constructor(failedMods: Array<{ id: string; name: string; error: string }>) {
    const names = failedMods.map(m => `"${m.name || m.id}"`).join('、');
    super(`Mod 加载失败: ${names}`);
    this.name = 'ModLoadError';
    this.failedMods = failedMods;
  }
}

/** Mod 加载状态 */
export type ModLoadStatus = 'pending' | 'loading' | 'loaded' | 'error';

/** 加载完成的 Mod 信息（运行时状态） */
export interface LoadedMod {
  /** Mod 清单 */
  manifest: ModManifest;
  /** 加载状态 */
  status: ModLoadStatus;
  /** 错误信息（仅 status === 'error' 时有值） */
  error?: string;
}

/** Mod 加载进度事件数据 */
export interface ModLoadProgressEvent {
  /** 当前正在加载的 Mod 编号（从 1 开始） */
  current: number;
  /** 待加载 Mod 总数 */
  total: number;
  /** 当前正在加载的 Mod ID */
  currentModId: string;
}

/** Mod 加载完成事件数据 */
export interface ModLoadCompleteEvent {
  /** 成功加载的 Mod 数量 */
  loaded: number;
  /** 加载失败的 Mod 数量 */
  failed: number;
  /** 扫描到的 Mod 总数 */
  total: number;
}

// ============================================
// 校验函数
// ============================================

/** 校验错误 */
export interface ManifestValidationError {
  path: string;
  message: string;
}

/**
 * 校验 Mod 清单
 *
 * @param data - 待校验的原始 JSON 对象
 * @returns 错误列表（空数组表示有效）
 */
export function validateManifest(data: unknown): ManifestValidationError[] {
  const errors: ManifestValidationError[] = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [{ path: '$', message: 'mod.json 必须是一个对象' }];
  }

  const m = data as Record<string, unknown>;

  // id
  if (typeof m.id !== 'string' || m.id.length === 0) {
    errors.push({ path: 'id', message: '必填字符串（kebab-case 格式）' });
  } else if (!/^[a-z][a-z0-9-]*$/.test(m.id)) {
    errors.push({ path: 'id', message: '必须为 kebab-case 格式（小写字母、数字、连字符）' });
  }

  // name
  if (typeof m.name !== 'string' || m.name.length === 0) {
    errors.push({ path: 'name', message: '必填字符串' });
  }

  // version
  if (typeof m.version !== 'string' || m.version.length === 0) {
    errors.push({ path: 'version', message: '必填字符串（semver 格式，如 "1.0.0"）' });
  } else if (!/^\d+\.\d+\.\d+/.test(m.version)) {
    errors.push({ path: 'version', message: '必须为 semver 格式（如 "1.0.0"）' });
  }

  // description
  if (typeof m.description !== 'string') {
    errors.push({ path: 'description', message: '必填字符串' });
  }

  // author
  if (typeof m.author !== 'string' || m.author.length === 0) {
    errors.push({ path: 'author', message: '必填字符串' });
  }

  // gameVersion
  if (typeof m.gameVersion !== 'string' || m.gameVersion.length === 0) {
    errors.push({ path: 'gameVersion', message: '必填字符串（如 ">=1.0.0"）' });
  }

  // dependencies
  if (m.dependencies !== undefined) {
    if (!Array.isArray(m.dependencies)) {
      errors.push({ path: 'dependencies', message: '必须为字符串数组' });
    } else {
      for (let i = 0; i < m.dependencies.length; i++) {
        if (typeof m.dependencies[i] !== 'string') {
          errors.push({ path: `dependencies[${i}]`, message: '必须为字符串' });
        }
      }
    }
  }

  // contentTypes
  if (!Array.isArray(m.contentTypes) || m.contentTypes.length === 0) {
    errors.push({ path: 'contentTypes', message: '必填非空数组' });
  } else {
    for (let i = 0; i < m.contentTypes.length; i++) {
      if (!ALL_MOD_CONTENT_TYPES.includes(m.contentTypes[i] as ModContentType)) {
        errors.push({
          path: `contentTypes[${i}]`,
          message: `不支持的内容类型: "${m.contentTypes[i]}"，可选值: ${ALL_MOD_CONTENT_TYPES.join(', ')}`,
        });
      }
    }
  }

  // dataFiles
  if (m.dataFiles !== undefined) {
    if (typeof m.dataFiles !== 'object' || m.dataFiles === null || Array.isArray(m.dataFiles)) {
      errors.push({ path: 'dataFiles', message: '必须为对象' });
    } else {
      for (const [key, value] of Object.entries(m.dataFiles as Record<string, unknown>)) {
        if (typeof value !== 'string') {
          errors.push({ path: `dataFiles.${key}`, message: '必须为字符串（数据文件路径）' });
        }
      }
    }
  }

  return errors;
}

/**
 * 解析 Mod 清单并返回验证结果
 *
 * @param json - 待解析的 JSON 字符串
 * @returns 解析结果（成功时包含 ModManifest，失败时包含错误列表）
 */
export function parseManifest(json: string): { manifest?: ModManifest; errors: ManifestValidationError[] } {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { errors: [{ path: '$', message: '无效的 JSON 格式' }] };
  }

  const errors = validateManifest(data);
  if (errors.length > 0) {
    return { errors };
  }

  const m = data as Record<string, unknown>;
  const manifest: ModManifest = {
    id: m.id as string,
    name: m.name as string,
    version: m.version as string,
    description: m.description as string,
    author: m.author as string,
    gameVersion: m.gameVersion as string,
    dependencies: (m.dependencies as string[]) ?? [],
    required: m.required === true,
    contentTypes: m.contentTypes as ModContentType[],
    dataFiles: (m.dataFiles as Record<string, string>) ?? {},
  };

  return { manifest, errors: [] };
}
