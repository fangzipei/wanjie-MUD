/**
 * 世界差异化审查工具
 *
 * 提供三层差异化模型的审查函数，用于在开发模式下评估世界之间的差异化程度。
 * 在开发模式启动时自动输出审查报告。
 */
import type { WorldStats } from '@/modules/identity/data/worldData';
import { WORLD_DATA } from '@/modules/identity/data/worldData';
import { hasUniqueMechanics } from '@/modules/identity/logic/worlds/factory';
import type { WorldType } from '@/shared/lib/types';

/** 三层差异化得分 */
export interface DifferentiationScore {
  /** 数值层得分 (0-100) */
  numeric: number;
  /** 机制层得分 (0-100) */
  mechanic: number;
  /** 内容层得分 (0-100) */
  content: number;
  /** 加权总分 (0-100) */
  total: number;
  /** 检查项详情 */
  details: string[];
}

/** 世界对相似度 */
export interface WorldPairSimilarity {
  worldA: WorldType;
  worldB: WorldType;
  contentSimilarity: number;
  mechanicSimilarity: number;
  isHighOverlap: boolean;
}

// ============================================
// 权重配置
// ============================================

const WEIGHTS = {
  numeric: 0.20,
  mechanic: 0.50,
  content: 0.30,
};

// ============================================
// 数值层检查
// ============================================

/** 检查两个 WorldStats 的数值层差异度 */
function checkNumericLayer(a: WorldStats, b: WorldStats): number {
  let score = 0;
  const totalChecks = 4;

  // 系数差异 > 0.15 得满分
  if (Math.abs(a.coefficient - b.coefficient) >= 0.15) score++;
  // 基础 HP 差异 > 10 得满分
  if (Math.abs(a.baseHp - b.baseHp) > 10) score++;
  // 基础攻击差异 > 2 得满分
  if (Math.abs(a.baseAttack - b.baseAttack) > 2) score++;
  // 敌人加成差异
  if (Math.abs(a.enemyAttackBonus - b.enemyAttackBonus) > 0.05) score++;

  return Math.round((score / totalChecks) * 100);
}

// ============================================
// 机制层检查
// ============================================

/** 检查两个世界类型之间的机制层差异度 */
function checkMechanicLayer(typeA: WorldType, typeB: WorldType): number {
  const hasA = hasUniqueMechanics(typeA);
  const hasB = hasUniqueMechanics(typeB);

  // 两者都有独特机制 → 差异大
  if (hasA && hasB) return 80;
  // 一个有、一个没有 → 差异中等
  if (hasA !== hasB) return 60;
  // 两者都没有（目前仅修仙无独特机制） → 差异低
  return 20;
}

// ============================================
// 内容层检查
// ============================================

/** 检查两个数组的重叠度 */
function arrayOverlap(a: unknown[], b: unknown[]): number {
  const setA = new Set(a.map(String));
  const setB = new Set(b.map(String));
  let overlap = 0;
  for (const item of setA) {
    if (setB.has(item)) overlap++;
  }
  const maxLen = Math.max(setA.size, setB.size);
  return maxLen > 0 ? overlap / maxLen : 0;
}

/** 检查两个 WorldStats 的内容层差异度 */
function checkContentLayer(a: WorldStats, b: WorldStats): number {
  let score = 0;
  const totalChecks = 4;

  // 名称前缀不重叠
  if (arrayOverlap(a.namePrefixes, b.namePrefixes) < 0.4) score++;
  // 名称后缀不重叠
  if (arrayOverlap(a.nameSuffixes, b.nameSuffixes) < 0.5) score++;
  // 属性显示名有差异
  const displayNamesA = Object.values(a.statDisplayNames);
  const displayNamesB = Object.values(b.statDisplayNames);
  if (arrayOverlap(displayNamesA, displayNamesB) < 0.8) score++;
  // 描述主题不同
  if (arrayOverlap(a.descriptions, b.descriptions) < 0.3) score++;

  return Math.round((score / totalChecks) * 100);
}

// ============================================
// 综合审查函数
// ============================================

/**
 * 计算单个世界的三层差异化得分（相对于所有其他世界的平均分）
 */
export function calculateDifferentiationScore(worldType: WorldType): DifferentiationScore {
  const data = WORLD_DATA[worldType];
  const otherTypes = (Object.keys(WORLD_DATA) as WorldType[]).filter(t => t !== worldType);

  const details: string[] = [];
  let totalNumeric = 0;
  let totalMechanic = 0;
  let totalContent = 0;

  for (const otherType of otherTypes) {
    const otherData = WORLD_DATA[otherType];
    totalNumeric += checkNumericLayer(data, otherData);
    totalMechanic += checkMechanicLayer(worldType, otherType);
    totalContent += checkContentLayer(data, otherData);
  }

  const n = otherTypes.length;
  const avgNumeric = n > 0 ? Math.round(totalNumeric / n) : 100;
  const avgMechanic = n > 0 ? Math.round(totalMechanic / n) : 100;
  const avgContent = n > 0 ? Math.round(totalContent / n) : 100;
  const total = Math.round(avgNumeric * WEIGHTS.numeric + avgMechanic * WEIGHTS.mechanic + avgContent * WEIGHTS.content);

  // 生成检查详情
  if (avgMechanic < 50) details.push('机制层差异化不足，建议增加独特机制');
  if (avgContent < 50) details.push('内容层差异化不足，建议丰富名称/描述/属性名');
  if (avgNumeric < 40) details.push('数值层差异化过低，建议调整系数/属性');
  if (!hasUniqueMechanics(worldType)) details.push('该世界缺少独特机制实现');
  if (total >= 60) details.push('整体差异化达标');

  return {
    numeric: avgNumeric,
    mechanic: avgMechanic,
    content: avgContent,
    total,
    details,
  };
}

/**
 * 计算所有世界对之间的相似度，找出高重叠对
 */
export function findHighOverlapPairs(): WorldPairSimilarity[] {
  const types = Object.keys(WORLD_DATA) as WorldType[];
  const pairs: WorldPairSimilarity[] = [];

  for (let i = 0; i < types.length; i++) {
    for (let j = i + 1; j < types.length; j++) {
      const a = types[i];
      const b = types[j];
      const dataA = WORLD_DATA[a];
      const dataB = WORLD_DATA[b];

      const contentSimilarity = 100 - checkContentLayer(dataA, dataB);
      const mechanicSimilarity = 100 - checkMechanicLayer(a, b);

      pairs.push({
        worldA: a,
        worldB: b,
        contentSimilarity,
        mechanicSimilarity,
        isHighOverlap: contentSimilarity > 70 && mechanicSimilarity > 70,
      });
    }
  }

  // 按相似度降序排列
  return pairs.sort((a, b) => (b.contentSimilarity + b.mechanicSimilarity) - (a.contentSimilarity + a.mechanicSimilarity));
}

/**
 * 生成开发模式下的差异化审查报告
 */
export function generateAuditReport(): string {
  const lines: string[] = [];
  lines.push('='.repeat(60));
  lines.push('  世界差异化审查报告 (World Differentiation Audit)');
  lines.push('='.repeat(60));
  lines.push('');

  // 各世界得分
  lines.push('【各世界差异化得分】');
  lines.push('─'.repeat(50));
  for (const type of Object.keys(WORLD_DATA) as WorldType[]) {
    const score = calculateDifferentiationScore(type);
    const status = score.total >= 60 ? '✅' : '⚠️';
    lines.push(`  ${status} ${type.padEnd(6)} | 数值:${score.numeric}% 机制:${score.mechanic}% 内容:${score.content}% → 总分:${score.total}%`);
    for (const detail of score.details) {
      lines.push(`      ${detail}`);
    }
  }

  lines.push('');
  lines.push('【高重叠世界对】（相似度 > 70%）');
  lines.push('─'.repeat(50));
  const pairs = findHighOverlapPairs();
  const highOverlap = pairs.filter(p => p.isHighOverlap);

  if (highOverlap.length === 0) {
    lines.push('  ✅ 未发现高重叠世界对，所有世界差异化充分');
  } else {
    for (const pair of highOverlap) {
      lines.push(`  ⚠️  ${pair.worldA} ↔ ${pair.worldB} | 内容相似度:${pair.contentSimilarity}% 机制相似度:${pair.mechanicSimilarity}%`);
    }
  }

  lines.push('');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

/**
 * 开发模式下输出审查报告
 */
export function runAudit(): void {
  if (typeof window !== 'undefined') {
    // 仅在开发模式且有 console 时输出
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDev) {
      console.log(generateAuditReport());
    }
  }
}
