/**
 * ModLoader 和 ModManifest 单元测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModLoader } from './ModLoader';
import { parseManifest, validateManifest } from './ModManifest';
import { WorldDataRegistry } from '@/shared/lib/registry/WorldDataRegistry';

// ============================================
// ModManifest 校验测试
// ============================================

describe('validateManifest', () => {
  it('should accept a valid manifest', () => {
    const data = {
      id: 'test-mod',
      name: '测试 Mod',
      version: '1.0.0',
      description: '一个测试用的 Mod',
      author: 'tester',
      gameVersion: '>=1.0.0',
      dependencies: [],
      contentTypes: ['world'],
      dataFiles: { world: 'data/world.json' },
    };
    const errors = validateManifest(data);
    expect(errors).toHaveLength(0);
  });

  it('should reject missing id', () => {
    const errors = validateManifest({ name: 'test', version: '1.0.0', description: '', author: 'a', gameVersion: '>=1.0.0', contentTypes: ['world'] });
    expect(errors.some(e => e.path === 'id')).toBe(true);
  });

  it('should reject invalid id format', () => {
    const data = { id: 'Invalid_ID', name: 'test', version: '1.0.0', description: '', author: 'a', gameVersion: '>=1.0.0', contentTypes: ['world'] };
    const errors = validateManifest(data);
    expect(errors.some(e => e.path === 'id')).toBe(true);
  });

  it('should reject invalid version format', () => {
    const data = { id: 'test', name: 'test', version: 'abc', description: '', author: 'a', gameVersion: '>=1.0.0', contentTypes: ['world'] };
    const errors = validateManifest(data);
    expect(errors.some(e => e.path === 'version')).toBe(true);
  });

  it('should reject empty contentTypes', () => {
    const data = { id: 'test', name: 'test', version: '1.0.0', description: '', author: 'a', gameVersion: '>=1.0.0', contentTypes: [] };
    const errors = validateManifest(data);
    expect(errors.some(e => e.path === 'contentTypes')).toBe(true);
  });

  it('should reject non-array dependencies', () => {
    const data = { id: 'test', name: 'test', version: '1.0.0', description: '', author: 'a', gameVersion: '>=1.0.0', contentTypes: ['world'], dependencies: 'not-an-array' };
    const errors = validateManifest(data);
    expect(errors.some(e => e.path === 'dependencies')).toBe(true);
  });

  it('should reject non-object dataFiles', () => {
    const data = { id: 'test', name: 'test', version: '1.0.0', description: '', author: 'a', gameVersion: '>=1.0.0', contentTypes: ['world'], dataFiles: 'not-an-object' };
    const errors = validateManifest(data);
    expect(errors.some(e => e.path === 'dataFiles')).toBe(true);
  });
});

describe('parseManifest', () => {
  it('should parse valid JSON', () => {
    const json = JSON.stringify({
      id: 'test-mod',
      name: 'Test',
      version: '1.0.0',
      description: 'desc',
      author: 'author',
      gameVersion: '>=1.0.0',
      contentTypes: ['world'],
      dataFiles: {},
    });
    const { manifest, errors } = parseManifest(json);
    expect(errors).toHaveLength(0);
    expect(manifest).toBeDefined();
    expect(manifest!.id).toBe('test-mod');
  });

  it('should return error for invalid JSON', () => {
    const { manifest, errors } = parseManifest('not valid json');
    expect(errors.length).toBeGreaterThan(0);
    expect(manifest).toBeUndefined();
  });

  it('should default dependencies and dataFiles', () => {
    const json = JSON.stringify({
      id: 'test-mod',
      name: 'Test',
      version: '1.0.0',
      description: 'desc',
      author: 'author',
      gameVersion: '>=1.0.0',
      contentTypes: ['world'],
    });
    const { manifest, errors } = parseManifest(json);
    expect(errors).toHaveLength(0);
    expect(manifest!.dependencies).toEqual([]);
    expect(manifest!.dataFiles).toEqual({});
  });
});

// ============================================
// ModLoader 依赖排序测试
// ============================================

describe('ModLoader.resolveDependencyOrder', () => {
  let loader: ModLoader;

  beforeEach(() => {
    loader = new ModLoader('/test-mods');
  });

  it('should sort single mod with no deps', () => {
    const mods = [{ id: 'a', manifest: makeManifest('a', []) }];
    const order = loader.resolveDependencyOrder(mods);
    expect(order).toEqual(['a']);
  });

  it('should sort in dependency order (a depends on b)', () => {
    const mods = [
      { id: 'a', manifest: makeManifest('a', ['b']) },
      { id: 'b', manifest: makeManifest('b', []) },
    ];
    const order = loader.resolveDependencyOrder(mods);
    // b must come before a
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('a'));
  });

  it('should sort chain a→b→c', () => {
    const mods = [
      { id: 'a', manifest: makeManifest('a', ['b']) },
      { id: 'b', manifest: makeManifest('b', ['c']) },
      { id: 'c', manifest: makeManifest('c', []) },
    ];
    const order = loader.resolveDependencyOrder(mods);
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('b'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('a'));
  });

  it('should skip mods with missing dependencies', () => {
    const mods = [
      { id: 'a', manifest: makeManifest('a', ['nonexistent']) },
      { id: 'b', manifest: makeManifest('b', []) },
    ];
    const order = loader.resolveDependencyOrder(mods);
    // a should be skipped
    expect(order).not.toContain('a');
    expect(order).toContain('b');
  });

  it('should skip mods in a cycle', () => {
    const mods = [
      { id: 'a', manifest: makeManifest('a', ['b']) },
      { id: 'b', manifest: makeManifest('b', ['a']) },
      { id: 'c', manifest: makeManifest('c', []) },
    ];
    const order = loader.resolveDependencyOrder(mods);
    // a and b should be skipped (cycle), c should succeed
    expect(order).not.toContain('a');
    expect(order).not.toContain('b');
    expect(order).toContain('c');
  });

  it('should handle independent mods in parallel-friendly order', () => {
    const mods = [
      { id: 'a', manifest: makeManifest('a', []) },
      { id: 'b', manifest: makeManifest('b', []) },
      { id: 'c', manifest: makeManifest('c', []) },
    ];
    const order = loader.resolveDependencyOrder(mods);
    expect(order).toHaveLength(3);
    expect(order).toContain('a');
    expect(order).toContain('b');
    expect(order).toContain('c');
  });
});

// ============================================
// ModLoader 发现和加载测试（使用 fetch mock）
// ============================================

describe('ModLoader.discoverMods', () => {
  it('should return empty array when mod-list.json is not found', async () => {
    const loader = new ModLoader('/nonexistent');
    const mods = await loader.discoverMods();
    expect(mods).toEqual([]);
  });
});

// ============================================
// 辅助工具
// ============================================

function makeManifest(id: string, dependencies: string[]) {
  return {
    id,
    name: id,
    version: '1.0.0',
    description: '',
    author: 'test',
    gameVersion: '>=1.0.0',
    dependencies,
    required: false,
    contentTypes: ['world'] as import('./ModManifest').ModContentType[],
    dataFiles: {},
  };
}
