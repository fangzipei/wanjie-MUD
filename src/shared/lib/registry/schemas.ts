/**
 * Mod 数据 JSON Schema 校验规则
 *
 * 定义每种 Mod 数据类型的校验规则（运行时使用）。
 * 这些校验规则用于 validate-mods 脚本和 Mod 加载器的数据校验。
 *
 * 当前版本使用简单的类型检查函数，后续可替换为 Zod schema。
 *
 * @module shared/lib/registry/schemas
 */

import type {
  WorldTypeData,
  DangerData,
  OpportunityData,
  TraitDefinitionData,
  TraitPoolData,
  FactionTemplateData,
  NamePoolData,
  RealmSystemData,
  RewardCoefficientData,
} from './WorldDataRegistry';

// ============================================
// 校验结果类型
// ============================================

/** 单个校验错误 */
export interface ValidationError {
  /** 字段路径（如 "worlds[0].name"） */
  path: string;
  /** 错误描述 */
  message: string;
}

/** 校验结果 */
export interface ValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 错误列表 */
  errors: ValidationError[];
}

// ============================================
// 辅助函数
// ============================================

function createResult(): { errors: ValidationError[]; add(path: string, message: string): void } {
  const errors: ValidationError[] = [];
  return {
    errors,
    add(path: string, message: string): void {
      errors.push({ path, message });
    },
  };
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && !isNaN(v);
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ============================================
// 各数据类型校验函数
// ============================================

/**
 * 校验世界类型数据数组
 */
export function validateWorldTypes(data: unknown): ValidationResult {
  const { errors, add } = createResult();

  if (!isArray(data)) {
    return { valid: false, errors: [{ path: '$', message: '期望数组' }] };
  }

  const arr = data as unknown[];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const prefix = `[${i}]`;

    if (!isObject(item)) {
      add(prefix, '期望对象');
      continue;
    }

    const w = item as Record<string, unknown>;

    if (!isString(w.id) || w.id.length === 0) add(`${prefix}.id`, '必填字符串');
    if (!isString(w.name) || w.name.length === 0) add(`${prefix}.name`, '必填字符串');
    if (!isString(w.description)) add(`${prefix}.description`, '必填字符串');
    if (!isNumber(w.baseCoefficient)) add(`${prefix}.baseCoefficient`, '必填数字');
    else if (w.baseCoefficient < 0.5 || w.baseCoefficient > 3.0)
      add(`${prefix}.baseCoefficient`, '必须在 0.5-3.0 范围内');

    if (!isArray(w.namePrefixes)) add(`${prefix}.namePrefixes`, '必填字符串数组');
    if (!isArray(w.nameSuffixes)) add(`${prefix}.nameSuffixes`, '必填字符串数组');
    if (!isArray(w.descriptions)) add(`${prefix}.descriptions`, '必填字符串数组');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验危险效果数据数组
 */
export function validateDangers(data: unknown): ValidationResult {
  const { errors, add } = createResult();

  if (!isArray(data)) {
    return { valid: false, errors: [{ path: '$', message: '期望数组' }] };
  }

  const validDangerTypes = ['stat_debuff', 'resource_drain', 'enemy_buff', 'special_mechanic', 'random_event'];

  const arr = data as unknown[];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const prefix = `[${i}]`;

    if (!isObject(item)) {
      add(prefix, '期望对象');
      continue;
    }

    const d = item as Record<string, unknown>;

    if (!isString(d.id) || d.id.length === 0) add(`${prefix}.id`, '必填字符串');
    if (!isString(d.type) || !validDangerTypes.includes(d.type))
      add(`${prefix}.type`, `必须是以下之一: ${validDangerTypes.join(', ')}`);
    if (!isString(d.name) || d.name.length === 0) add(`${prefix}.name`, '必填字符串');
    if (!isString(d.description)) add(`${prefix}.description`, '必填字符串');
    if (!isNumber(d.dangerLevel) || d.dangerLevel < 1 || d.dangerLevel > 5)
      add(`${prefix}.dangerLevel`, '必须是 1-5 的整数');
    if (!isNumber(d.duration)) add(`${prefix}.duration`, '必填数字');
    if (!isBoolean(d.dispellable)) add(`${prefix}.dispellable`, '必填布尔值');
    if (!isObject(d.triggerCondition)) add(`${prefix}.triggerCondition`, '必填对象');
    if (!isObject(d.effect)) add(`${prefix}.effect`, '必填对象');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验机缘效果数据数组
 */
export function validateOpportunities(data: unknown): ValidationResult {
  const { errors, add } = createResult();

  if (!isArray(data)) {
    return { valid: false, errors: [{ path: '$', message: '期望数组' }] };
  }

  const validOppTypes = ['stat_buff', 'resource_gain', 'special_ability', 'rare_drop', 'favorable_event'];

  const arr = data as unknown[];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const prefix = `[${i}]`;

    if (!isObject(item)) {
      add(prefix, '期望对象');
      continue;
    }

    const o = item as Record<string, unknown>;

    if (!isString(o.id) || o.id.length === 0) add(`${prefix}.id`, '必填字符串');
    if (!isString(o.type) || !validOppTypes.includes(o.type))
      add(`${prefix}.type`, `必须是以下之一: ${validOppTypes.join(', ')}`);
    if (!isString(o.name) || o.name.length === 0) add(`${prefix}.name`, '必填字符串');
    if (!isString(o.description)) add(`${prefix}.description`, '必填字符串');
    if (!isNumber(o.opportunityLevel) || o.opportunityLevel < 1 || o.opportunityLevel > 5)
      add(`${prefix}.opportunityLevel`, '必须是 1-5 的整数');
    if (!isNumber(o.duration)) add(`${prefix}.duration`, '必填数字');
    if (!isObject(o.triggerCondition)) add(`${prefix}.triggerCondition`, '必填对象');
    if (!isObject(o.effect)) add(`${prefix}.effect`, '必填对象');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验境界体系数据
 */
export function validateRealmSystem(data: unknown): ValidationResult {
  const { errors, add } = createResult();

  if (!isObject(data)) {
    return { valid: false, errors: [{ path: '$', message: '期望对象' }] };
  }

  const r = data as Record<string, unknown>;

  if (!isString(r.mainRealmName)) add('mainRealmName', '必填字符串');
  if (!isString(r.subRealmName)) add('subRealmName', '必填字符串');
  if (!isArray(r.tiers)) add('tiers', '必填数组');
  else {
    const tiers = r.tiers as unknown[];
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i] as Record<string, unknown> | undefined;
      if (!isObject(tier)) {
        add(`tiers[${i}]`, '期望对象');
        continue;
      }
      if (!isString(tier.name)) add(`tiers[${i}].name`, '必填字符串');
      if (!isArray(tier.subRealms)) add(`tiers[${i}].subRealms`, '必填字符串数组');
      if (!isArray(tier.levelRange) || (tier.levelRange as unknown[]).length !== 2)
        add(`tiers[${i}].levelRange`, '必填长度为 2 的数字数组');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 校验姓名池数据
 */
export function validateNamePool(data: unknown): ValidationResult {
  const { errors, add } = createResult();

  if (!isObject(data)) {
    return { valid: false, errors: [{ path: '$', message: '期望对象' }] };
  }

  const n = data as Record<string, unknown>;

  if (!isArray(n.surnames)) add('surnames', '必填字符串数组');
  if (!isArray(n.maleNames)) add('maleNames', '必填字符串数组');
  if (!isArray(n.femaleNames)) add('femaleNames', '必填字符串数组');

  return { valid: errors.length === 0, errors };
}

/**
 * 校验势力模板数据数组
 */
export function validateFactionTemplates(data: unknown): ValidationResult {
  const { errors, add } = createResult();

  if (!isArray(data)) {
    return { valid: false, errors: [{ path: '$', message: '期望数组' }] };
  }

  const arr = data as unknown[];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const prefix = `[${i}]`;

    if (!isObject(item)) {
      add(prefix, '期望对象');
      continue;
    }

    const f = item as Record<string, unknown>;

    if (!isString(f.id) || f.id.length === 0) add(`${prefix}.id`, '必填字符串');
    if (!isString(f.name)) add(`${prefix}.name`, '必填字符串');
    if (!isString(f.type)) add(`${prefix}.type`, '必填字符串');
    if (!isString(f.description)) add(`${prefix}.description`, '必填字符串');
    if (!isString(f.worldTypeId)) add(`${prefix}.worldTypeId`, '必填字符串');
  }

  return { valid: errors.length === 0, errors };
}
