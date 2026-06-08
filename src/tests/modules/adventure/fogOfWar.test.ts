/**
 * 迷雾系统测试
 */
import { describe, it, expect } from 'vitest';
import {
  createRevealedMap,
  updateRevealedMap,
  getFogState,
  calculateVisibility,
  generatePathHints,
  calculateBossWarning,
  chooseBossPosition,
  applyPathConfig,
} from '@/lib/game/adventure/fogOfWar';
import type { AdventureCell, CellType } from '@/lib/game/types';

/** 创建测试用地图网格 */
function makeTestGrid(rows: number, cols: number): AdventureCell[][] {
  const grid: AdventureCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: AdventureCell[] = [];
    for (let c = 0; c < cols; c++) {
      const cellTypes: CellType[] = ['empty', 'enemy', 'treasure', 'rest', 'event'];
      row.push({
        type: cellTypes[(r * cols + c) % cellTypes.length],
        cleared: false,
        visited: false,
      });
    }
    grid.push(row);
  }
  return grid;
}

describe('fogOfWar - createRevealedMap', () => {
  it('创建初始探索状态，起始格和四邻可见', () => {
    const map = createRevealedMap(10, 10, { row: 0, col: 5 });

    expect(map.revealedCells.has('0,5')).toBe(true); // 起始位置
    expect(map.revealedCells.has('1,5')).toBe(true); // 下方
    expect(map.playerPosition).toEqual({ row: 0, col: 5 });
  });
});

describe('fogOfWar - updateRevealedMap', () => {
  it('移动到新位置后揭示新格子', () => {
    const map = createRevealedMap(10, 10, { row: 0, col: 5 });
    const updated = updateRevealedMap(map, { row: 1, col: 5 });

    expect(updated.revealedCells.has('1,5')).toBe(true);
    expect(updated.revealedCells.has('2,5')).toBe(true); // 新位置下方
    expect(updated.playerPosition).toEqual({ row: 1, col: 5 });
  });
});

describe('fogOfWar - getFogState', () => {
  it('未揭示的格子返回 hidden', () => {
    const map = createRevealedMap(10, 10, { row: 0, col: 0 });
    const state = getFogState(5, 5, map);

    expect(state).toBe('hidden');
  });

  it('已揭示的格子返回 visible', () => {
    const map = createRevealedMap(10, 10, { row: 0, col: 0 });
    const state = getFogState(1, 0, map);

    expect(state).toBe('visible');
  });
});

describe('fogOfWar - calculateVisibility', () => {
  it('生成完整的迷雾单元格矩阵', () => {
    const grid = makeTestGrid(5, 5);
    const map = createRevealedMap(5, 5, { row: 0, col: 2 });
    const fogGrid = calculateVisibility(grid, map);

    expect(fogGrid.length).toBe(5);
    expect(fogGrid[0].length).toBe(5);
    expect(fogGrid[0][2].fogState).toBe('visible'); // 玩家位置
    expect(fogGrid[4][4].fogState).toBe('hidden'); // 未探索
  });
});

describe('fogOfWar - generatePathHints', () => {
  it('为相邻未揭示格子生成提示', () => {
    const grid = makeTestGrid(5, 5);
    const map = createRevealedMap(5, 5, { row: 0, col: 2 });
    const hints = generatePathHints(grid, { row: 0, col: 2 }, map);

    expect(Array.isArray(hints)).toBe(true);
    for (const hint of hints) {
      expect(hint.direction).toMatch(/^(up|down|left|right)$/);
      expect(hint.text.length).toBeGreaterThan(0);
    }
  });
});

describe('fogOfWar - calculateBossWarning', () => {
  it('距离 2 步内触达 imminent 预警', () => {
    const warning = calculateBossWarning({ row: 2, col: 2 }, { row: 0, col: 2 });
    expect(warning.warningLevel).toBe('imminent');
    expect(warning.isDiscovered).toBe(true);
  });

  it('距离超过 6 步不显示预警', () => {
    const warning = calculateBossWarning({ row: 10, col: 10 }, { row: 0, col: 0 });
    expect(warning.warningLevel).toBe('none');
    expect(warning.isDiscovered).toBe(false);
  });
});

describe('fogOfWar - chooseBossPosition', () => {
  it('Boss 位置在边缘区域', () => {
    const pos = chooseBossPosition(10, 10, { row: 0, col: 5 });

    expect(pos.row).toBeGreaterThanOrEqual(0);
    expect(pos.row).toBeLessThan(10);
    expect(pos.col).toBeGreaterThanOrEqual(0);
    expect(pos.col).toBeLessThan(10);
    // 应靠近边缘或底行
    const isEdge = pos.row <= 1 || pos.row >= 8;
    expect(isEdge).toBe(true);
  });

  it('Boss 距离起始位置足够远', () => {
    const start = { row: 0, col: 5 };
    const pos = chooseBossPosition(10, 10, start);
    const dist = Math.abs(pos.row - start.row) + Math.abs(pos.col - start.col);
    expect(dist).toBeGreaterThanOrEqual(3);
  });
});

describe('fogOfWar - applyPathConfig', () => {
  it('高风险路径增加敌人概率', () => {
    const base = { enemy: 0.15, elite: 0.05, treasure: 0.10, rest: 0.10, event: 0.15, empty: 0.40, boss: 0.02, miniboss: 0.02, portal: 0.01 };
    const adjusted = applyPathConfig(base, 'high_risk');

    expect(adjusted.enemy).toBeGreaterThan(base.enemy);
    expect(adjusted.elite).toBeGreaterThan(base.elite);
  });

  it('安全路径增加休息点概率', () => {
    const base = { enemy: 0.15, elite: 0.05, treasure: 0.10, rest: 0.10, event: 0.15, empty: 0.40, boss: 0.02, miniboss: 0.02, portal: 0.01 };
    const adjusted = applyPathConfig(base, 'safe');

    expect(adjusted.rest).toBeGreaterThan(base.rest);
    expect(adjusted.enemy).toBeLessThan(base.enemy);
  });
});
