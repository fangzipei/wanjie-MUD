# Design: 世界设计审查与优化

## Context

万界世界系统当前包含 **8 种世界类型**，每个世界通过三层设计实现差异化：

| 层级 | 当前状态 | 文件位置 |
|------|---------|----------|
| 数值层 | `WORLD_DATA` 定义了 coefficient、baseHp/Atk/Def 等 | `modules/identity/data/worldData.ts` |
| 机制层 | `WorldMechanics` 接口，部分世界有独特实现 | `modules/identity/logic/worlds/` |
| 内容层 | 姓名池、词条池、危险/机缘池、境界名称、属性显示名 | `modules/identity/data/`、`modules/progression/data/` |

**核心矛盾**：8 个世界在数值和内容上有差异，但机制层仅 4/8 有独特实现（科技、武侠、魔幻、末世），且所有世界的境界数值公式完全相同。修仙与仙侠在多个维度高度重叠，玩家穿越的动机不足。

### 关键代码路径

```
WorldType 定义    → shared/lib/types.ts:343
WorldStats 数据   → modules/identity/data/worldData.ts
WorldMechanics   → modules/identity/logic/worlds/factory.ts
RealmSystem      → modules/progression/logic/realmSystem.ts
境界核心         → modules/progression/data/realmCore.ts
世界危险/机缘    → modules/identity/data/worldEffectsData.ts
世界选择规则     → modules/identity/data/worldSystem.ts
世界选择页面     → views/world-select/WorldSelect.tsx
```

## Goals / Non-Goals

**Goals:**
- 建立世界差异化三层模型（数值 → 机制 → 内容）的审查标准
- 为每个世界定义唯一核心机制（USP），确保 8/8 世界都有独特机制
- 修复数值平衡矛盾（末世系数/属性倒挂、境界公式统一单调）
- 解决修仙/仙侠相似度过高的问题

**Non-Goals:**
- 不创建全新的 WorldMechanics 子类——在当前接口基础上扩展
- 不改变 WorldType 联合类型（8 种保持不变）
- 不修改游戏流程（world-select → character-select → backstory → game 保持不变）
- 不重构境界系统的核心数据结构（保持 RealmSystem/RealmTier 接口）
- 不涉及战斗系统的深度改革

## Current State Analysis

### 问题 1：修仙与仙侠高度重叠

| 维度 | 修仙 | 仙侠 | 差异度 |
|------|------|------|--------|
| 姓名池 | `CULTIVATION_NAMES` | `CULTIVATION_NAMES`（共用） | 0% |
| 系数 | 1.1 | 1.3 | 仅数值差异 |
| 力量体系 | 炼气化神/道法自然 | 以剑入道/御剑乘风 | 主题有差异但机制无差异 |
| uniqueMechanics | `false` | `false` | 均无 |
| 属性显示名 | 体质/灵根/悟性/幸运/意志 | 体质/仙根/剑心/仙缘/道心 | 仅名称差异 |
| 境界体系 | 炼气→筑基→金丹→... | 剑徒→剑士→剑师→... | 仅名称差异 |
| 危险主题 | 魔修/灵气枯竭/妖兽 | 剑道争锋/魔剑现世/剑气反噬 | 主题略有差异但效果相同 |
| 机缘主题 | 上古洞府/仙缘/悟道 | 名剑认可/剑意/剑心通明 | 主题略有差异但效果相同 |

**结论**：修仙和仙侠在除系数外的所有维度上差异极小，玩家从修仙世界穿越到仙侠世界几乎感受不到变化。

### 问题 2：8 世界中仅 4 个有独特机制

```typescript
// factory.ts:46-48
export function hasUniqueMechanics(worldType: WorldType): boolean {
  return ['科技', '武侠', '魔幻', '末世'].includes(worldType);
}
```

- **有独特机制**：科技（芯片研究+过热冷却）、武侠（连招递增）、魔幻（法术记忆槽位）、末世（生存资源）
- **无独特机制**：修仙（baseline）、仙侠（同修仙）、高武（同修仙）、异能（同修仙）

### 问题 3：末世数值倒挂

```
末世: coefficient=1.5 (噩梦), baseHp=120, baseAttack=16  ← 最高
修仙: coefficient=1.1 (普通), baseHp=100, baseAttack=12   ← 中等
武侠: coefficient=1.0 (简单), baseHp=80,  baseAttack=11   ← 最低
```

系数越高代表世界越危险，但末世的基础属性却是最高的。这本意是"敌人强 + 你也强"的设计，但系数同时影响了概率计算（突破成功率等），导致：
- 末世玩家基础属性高但突破成功率低——玩家体感矛盾
- 从修仙(coefficient=1.1)飞升到末世(coefficient=1.5)时，难度跳跃过大

### 问题 4：境界数值公式完全统一

```typescript
// 所有 8 个世界使用相同的 generateRealmConfigs:
// 每小级 +5%，跨大境界 +30%
```

这意味着从"炼气一重"到"炼气圆满"的成长幅度，与从"剑徒初窥"到"剑徒圆满"完全相同。境界名称有差异，但数值体验完全一致。

### 问题 5：危险/机缘系统静态化

`generateWorldDangers` 和 `generateWorldOpportunities` 在进入世界时一次性生成，后续不会根据玩家进度动态变化。所有世界的危险效果类型相同（`stat_debuff`/`resource_drain`/`enemy_buff`），差异化仅体现在名称和数值上。

## Decisions

### Decision 1：建立三层差异化审查模型

采用 **数值层（20%）+ 机制层（50%）+ 内容层（30%）** 的权重评估每个世界的差异化得分。

- **数值层**：coefficient、基础属性、境界倍率、属性映射——权重低因为玩家感知弱
- **机制层**：修炼机制、战斗机制、探索机制、专属系统——权重高因为直接影响玩法
- **内容层**：名称/文案、视觉主题、事件池、专属物品——权重中因为提升沉浸但不改变玩法

每个世界需要在机制层有至少 1 个独特点，整体差异化得分不低于 60%。

### Decision 2：修仙与仙侠的差异化方案

**方案选择**：将修仙定位为"标准修炼 + 门派系统"，将仙侠定位为"剑道专精 + 剑灵伙伴"

- **修仙 (coefficient 1.0, 调整为入门世界)**：作为新玩家接触的第一个世界类型，取消独特机制要求，保持简单。定位为"万界入口"
- **仙侠 (coefficient 1.3, 保持)**：新增**剑灵系统**——玩家可培养一把有独立等级和技能的本命飞剑，战斗时飞剑可协同攻击

备选方案（已排除）：
- ~~合并修仙与仙侠为一种世界类型~~：两个世界在文化上有区分度，合并会减少世界多样性
- ~~修仙加门派系统、仙侠加剑灵系统~~：两个都加独特机制开发量大，且修仙作为入门世界应保持简洁

### Decision 3：为"无机制"世界补充独特机制

| 世界 | 当前状态 | 新 USP | 实现方式 |
|------|---------|--------|---------|
| 修仙 | baseline | **无特殊机制**（入门世界定位） | 保持 baseline，降低 coefficient 至 1.0 |
| 仙侠 | baseline | **本命飞剑**（剑灵养成） | 新增 `swordSpiritSystem` 接口扩展 |
| 高武 | baseline | **气血爆发**（低血量增伤+减伤） | 新增 `customSuccessRate` + `customAutoStrategy` |
| 异能 | baseline | **源能共鸣**（随机临时能力获取） | 新增 `customExplorationEvents` 接口扩展 |
| 科技 | 已有 | 芯片研究+过热冷却（保持） | 无需变更 |
| 武侠 | 已有 | 连招递增（保持） | 无需变更 |
| 魔幻 | 已有 | 法术记忆槽位（保持） | 无需变更 |
| 末世 | 已有 | 生存资源管理（保持） | 保持，但修复数值倒挂 |

### Decision 4：修复末世数值倒挂

**调整**：
- 末世 `coefficient` 保持 1.5（代表高难度）
- 末世基础属性下调：`baseHp: 90`（原120）、`baseAttack: 12`（原16）
- 将"敌人强"体现在 `enemyAttackBonus: 0.3`（原0.2）和 `enemyDefenseBonus: 0.25`（原0.15）
- 末世玩家需要通过生存资源系统获取额外属性，而不是天生高属性

**理由**：系数代表"世界难度"，应该让玩家感到压力而非获得更高起点。高基础属性削弱了难度设计的意图。

### Decision 5：境界数值差异化

在 `RealmSystem` 接口中增加可选的 `subRealmMultiplier` 和 `tierJumpMultiplier` 字段：

```typescript
export interface RealmSystem {
  mainRealmName: string;
  subRealmName: string;
  tiers: RealmTier[];
  // 新增：自定义倍率（未设置时使用默认 1.05 / 1.3）
  subRealmMultiplier?: number;   // 小境界倍率，默认 1.05
  tierJumpMultiplier?: number;   // 大境界跨越倍率，默认 1.30
}
```

差异化示例：
- 修仙/武侠：标准 1.05/1.30（常规成长曲线）
- 末世：1.08/1.50（快速成长 + 高风险）
- 科技：1.03/1.20（缓慢但稳定）
- 魔幻：1.06/1.30（魔法爆发式成长）

### Decision 6：WorldMechanics 接口扩展

```typescript
export interface WorldMechanics {
  worldType: string;
  
  // 现有方法（保持兼容）
  getCultivationParams: () => WorldCultivationParams;
  getCombatParams: () => WorldCombatParams;
  getExplorationParams: () => WorldExplorationParams;
  
  // 现有可选方法
  customSuccessRate?: (baseRate: number, state: GameState) => number;
  customCombatActions?: (state: ManualBattleState) => BattleAction[];
  customAutoStrategy?: (state: ManualBattleState, strategy: AutoBattleStrategy) => BattleAction;
  
  // 新增：独特机制描述（用于 UI 展示）
  getUniqueMechanicDescription: () => { name: string; description: string; icon: string };
  
  // 新增：世界特有事件钩子
  onWorldEnter?: (state: GameState) => GameState;
  onWorldLeave?: (state: GameState) => GameState;
}
```

## Risks / Trade-offs

- **[风险] 修仙降为 1.0 系数可能让回归玩家觉得太简单** → 缓解：确保飞升后可选的后续世界有足够的难度梯度
- **[风险] 剑灵系统（仙侠）开发量大** → 缓解：Phase 1 仅实现数值层面的剑灵（一个带属性的宠物对象），Phase 2 再增加完整养成 UI
- **[风险] 境界数值差异化可能导致平衡困难** → 缓解：所有差异化倍率都在 0.03-0.08（小境界）和 1.20-1.50（大境界）的保守范围内
- **[取舍] 修仙无独特机制** → 这是有意为之：入门世界应保持简洁，让新玩家先掌握基础玩法，特色留给后续世界

## Open Questions

1. 修仙和仙侠是否最终应该合并？——当前决定保留分离但差异化，待玩家反馈后决定
2. 世界独特机制是否需要完整的 UI 面板支持？——Phase 1 最小化 UI（仅在 WorldSelect 页展示 USP 描述），Phase 2 扩展
3. 境界差异化倍率的具体数值需要更多 playtest 数据校准
