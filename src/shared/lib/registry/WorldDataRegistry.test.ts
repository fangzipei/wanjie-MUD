/**
 * WorldDataRegistry 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  WorldDataRegistry,
  asWorldType,
  assertWorldType,
  getAllWorldTypeValues,
} from './WorldDataRegistry';
import type {
  WorldTypeData,
  DangerData,
  OpportunityData,
  TraitPoolData,
  FactionTemplateData,
  NamePoolData,
  RealmSystemData,
} from './WorldDataRegistry';

// ============================================
// 测试辅助数据
// ============================================

function makeTestWorldType(overrides: Partial<WorldTypeData> = {}): WorldTypeData {
  return {
    id: 'test-world',
    name: '测试世界',
    description: '用于单元测试的虚拟世界类型',
    baseCoefficient: 1.2,
    namePrefixes: ['天道', '星辰'],
    nameSuffixes: ['大陆', '界'],
    descriptions: ['这是一个测试世界', '另一个描述'],
    ...overrides,
  };
}

function makeTestDanger(overrides: Partial<DangerData> = {}): DangerData {
  return {
    id: 'test-danger',
    type: 'stat_debuff',
    name: '测试危险',
    description: '一个测试用的危险效果',
    triggerCondition: { type: 'on_enter', chance: 1.0 },
    effect: { statModifications: { 灵根: -1 } },
    duration: -1,
    dispellable: false,
    dangerLevel: 1,
    ...overrides,
  };
}

// ============================================
// 测试
// ============================================

describe('WorldDataRegistry', () => {
  beforeEach(() => {
    WorldDataRegistry.resetInstance();
  });

  // --- 单例 ---

  it('should return the same instance', () => {
    const a = WorldDataRegistry.getInstance();
    const b = WorldDataRegistry.getInstance();
    expect(a).toBe(b);
  });

  it('should reset instance for tests', () => {
    const a = WorldDataRegistry.getInstance();
    WorldDataRegistry.resetInstance();
    const b = WorldDataRegistry.getInstance();
    expect(a).not.toBe(b);
  });

  // --- 世界类型注册 / 查询 ---

  it('should register and retrieve a world type', () => {
    const registry = WorldDataRegistry.getInstance();
    const data = makeTestWorldType();
    registry.registerWorldType(data);

    const retrieved = registry.getWorldType('test-world');
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('测试世界');
    expect(retrieved!.baseCoefficient).toBe(1.2);
  });

  it('should return undefined for unregistered world type', () => {
    const registry = WorldDataRegistry.getInstance();
    expect(registry.getWorldType('nonexistent')).toBeUndefined();
  });

  it('should list all registered world types', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerWorldType(makeTestWorldType({ id: 'a' }));
    registry.registerWorldType(makeTestWorldType({ id: 'b' }));
    registry.registerWorldType(makeTestWorldType({ id: 'c' }));

    const ids = registry.getAllWorldTypes();
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('should validate registered world types', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerWorldType(makeTestWorldType({ id: 'valid' }));

    expect(registry.isValidWorldType('valid')).toBe(true);
    expect(registry.isValidWorldType('invalid')).toBe(false);
  });

  it('should overwrite existing world type with warning', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerWorldType(makeTestWorldType({ id: 'dup', name: '原始' }));
    registry.registerWorldType(makeTestWorldType({ id: 'dup', name: '覆盖' }));

    const retrieved = registry.getWorldType('dup');
    expect(retrieved!.name).toBe('覆盖');
  });

  // --- 境界体系 ---

  it('should register and retrieve realm systems', () => {
    const registry = WorldDataRegistry.getInstance();
    const realm: RealmSystemData = {
      mainRealmName: '仙阶',
      subRealmName: '品级',
      tiers: [
        { name: '炼气', subRealms: ['一阶', '二阶', '三阶'], levelRange: [1, 30] },
        { name: '筑基', subRealms: ['初期', '中期', '后期'], levelRange: [31, 60] },
      ],
    };

    registry.registerRealmSystem('test-world', realm);
    const retrieved = registry.getRealmSystem('test-world');
    expect(retrieved).toBeDefined();
    expect(retrieved!.mainRealmName).toBe('仙阶');
    expect(retrieved!.tiers).toHaveLength(2);
  });

  it('should return undefined for unregistered realm system', () => {
    const registry = WorldDataRegistry.getInstance();
    expect(registry.getRealmSystem('unknown')).toBeUndefined();
  });

  // --- 词条池 ---

  it('should merge trait pools from multiple mods', () => {
    const registry = WorldDataRegistry.getInstance();
    const poolA: TraitPoolData = {
      origin: {
        legendary: [{ name: '天帝后裔', description: 'test', level: 'legendary', positiveAttrs: ['体质'], negativeAttrs: [] }],
        epic: [],
        rare: [],
        uncommon: [],
        common: [],
      },
      trait: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      personality: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      talent: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
    };
    const poolB: TraitPoolData = {
      origin: {
        legendary: [{ name: '仙帝血脉', description: 'test2', level: 'legendary', positiveAttrs: ['灵根'], negativeAttrs: [] }],
        epic: [{ name: '名门之后', description: 'test3', level: 'epic', positiveAttrs: ['悟性'], negativeAttrs: ['意志'] }],
        rare: [],
        uncommon: [],
        common: [],
      },
      trait: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      personality: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
      talent: { legendary: [], epic: [], rare: [], uncommon: [], common: [] },
    };

    registry.registerTraitPool('test-world', poolA);
    registry.registerTraitPool('test-world', poolB); // should merge, not overwrite

    const retrieved = registry.getTraitPool('test-world');
    expect(retrieved).toBeDefined();
    // 2 legendary + 1 epic = 3
    expect(retrieved!.origin.legendary).toHaveLength(2);
    expect(retrieved!.origin.epic).toHaveLength(1);
  });

  // --- 危险/机缘 ---

  it('should filter dangers by world type', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerDanger(makeTestDanger({ id: 'universal', worldTypes: undefined }));
    registry.registerDanger(makeTestDanger({ id: 'specific', worldTypes: ['cultivation'] }));

    const all = registry.getDangersForWorld('anything');
    expect(all).toHaveLength(1); // only universal (specific is limited to 'cultivation')

    const cultivation = registry.getDangersForWorld('cultivation');
    expect(cultivation).toHaveLength(2); // both universal and specific

    const other = registry.getDangersForWorld('other');
    expect(other).toHaveLength(1); // only universal
  });

  it('should batch register dangers', () => {
    const registry = WorldDataRegistry.getInstance();
    const dangers: DangerData[] = [
      makeTestDanger({ id: 'd1' }),
      makeTestDanger({ id: 'd2' }),
      makeTestDanger({ id: 'd3' }),
    ];
    registry.registerDangers(dangers);

    expect(registry.getAllDangers()).toHaveLength(3);
  });

  // --- 势力模板 ---

  it('should filter faction templates by world type', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerFactionTemplate({
      id: 'f1', name: '仙门', type: '宗门', description: 'test', worldTypeId: '修仙',
    });
    registry.registerFactionTemplate({
      id: 'f2', name: '魔教', type: '教派', description: 'test', worldTypeId: '魔幻',
    });

    expect(registry.getFactionTemplates('修仙')).toHaveLength(1);
    expect(registry.getFactionTemplates('魔幻')).toHaveLength(1);
    expect(registry.getFactionTemplates('科技')).toHaveLength(0);
  });

  // --- 姓名池 ---

  it('should merge name pools', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerNamePool('test', {
      surnames: ['张', '李'],
      maleNames: ['伟'],
      femaleNames: ['芳'],
    });
    registry.registerNamePool('test', {
      surnames: ['王', '赵'],
      maleNames: ['强'],
      femaleNames: ['丽'],
    });

    const pool = registry.getNamePool('test');
    expect(pool!.surnames).toEqual(['张', '李', '王', '赵']);
    expect(pool!.maleNames).toEqual(['伟', '强']);
    expect(pool!.femaleNames).toEqual(['芳', '丽']);
  });

  // --- 世界观文案 ---

  it('should shallow-merge world texts', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerWorldText('test', { a: 1, b: 2 });
    registry.registerWorldText('test', { b: 3, c: 4 }); // b overwritten, c added

    const text = registry.getWorldText('test');
    expect(text).toEqual({ a: 1, b: 3, c: 4 });
  });

  // --- 世界系数 ---

  it('should return default coefficient for unregistered world', () => {
    const registry = WorldDataRegistry.getInstance();
    expect(registry.getCoefficient('unknown')).toBe(1.0);
  });

  it('should return registered coefficient', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerCoefficient('hard', 1.5);
    expect(registry.getCoefficient('hard')).toBe(1.5);
  });

  // --- 批量注册 ---

  it('should batch register world types', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerWorldTypes([
      makeTestWorldType({ id: 'w1' }),
      makeTestWorldType({ id: 'w2' }),
    ]);
    expect(registry.getAllWorldTypes()).toEqual(['w1', 'w2']);
  });

  it('should batch register faction templates', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerFactionTemplates([
      { id: 'f1', name: 'a', type: 't', description: 'd', worldTypeId: 'w1' },
      { id: 'f2', name: 'b', type: 't', description: 'd', worldTypeId: 'w1' },
    ]);
    expect(registry.getFactionTemplates('w1')).toHaveLength(2);
  });
});

describe('asWorldType', () => {
  beforeEach(() => {
    WorldDataRegistry.resetInstance();
  });

  it('should return WorldType for registered id', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerWorldType(makeTestWorldType({ id: 'cultivation' }));
    const result = asWorldType('cultivation');
    expect(result).toBe('cultivation');
  });

  it('should return undefined for unregistered id', () => {
    const result = asWorldType('nonexistent');
    expect(result).toBeUndefined();
  });
});

describe('assertWorldType', () => {
  beforeEach(() => {
    WorldDataRegistry.resetInstance();
  });

  it('should return WorldType for registered id', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerWorldType(makeTestWorldType({ id: 'cultivation' }));
    expect(assertWorldType('cultivation')).toBe('cultivation');
  });

  it('should throw for unregistered id', () => {
    expect(() => assertWorldType('nonexistent')).toThrow(
      /未注册的世界类型/
    );
  });
});

describe('getAllWorldTypeValues', () => {
  beforeEach(() => {
    WorldDataRegistry.resetInstance();
  });

  it('should return all registered world type ids', () => {
    const registry = WorldDataRegistry.getInstance();
    registry.registerWorldType(makeTestWorldType({ id: 'a' }));
    registry.registerWorldType(makeTestWorldType({ id: 'b' }));
    expect(getAllWorldTypeValues()).toEqual(['a', 'b']);
  });
});
