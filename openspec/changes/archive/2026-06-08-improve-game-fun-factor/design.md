## Context

当前游戏架构使用纯函数 `lib/game/` + React Hook `hooks/` 的分离模式，所有游戏逻辑为无副作用的纯计算。本次改造需要在保持此架构约束的前提下，为8个游戏子系统增加交互深度和玩家决策点。关键约束：`lib/` 中不可引入 React 依赖、所有函数保持纯函数特性（接收状态+输入，返回新状态+输出）。

## Goals / Non-Goals

**Goals:**
- 为战斗、修炼、探索三个核心循环增加有意义的玩家决策
- 为门派、事件、突破、飞升四个系统增加持久后果和叙事深度
- 为8种世界类型增加差异化玩法，使选择世界成为有意义决策
- 保持自动/挂机选项，不强迫所有玩家手动操作

**Non-Goals:**
- 不改变存档格式的核心结构（新增字段采用可选属性向后兼容）
- 不重写现有数值平衡系统（战斗公式、属性系统保持基础逻辑）
- 不引入PvP/多人交互（本次聚焦单人体验改进）
- 不添加实时网络功能
- 不改动 `src/components/ui/`（shadcn 组件保持只读）

## Decisions

### Decision 1: 手动战斗采用回合状态机模式

**选择**：在 `src/lib/game/combat/` 下实现 `BattleMachine` 纯函数，接收 `BattleState` + `BattleAction` → 返回新的 `BattleState`。
- `BattleState` 包含：回合数、双方HP/MP、行动历史、冷却状态
- `BattleAction` 为联合类型：`{ type: 'attack', techniqueId }` | `{ type: 'defend' }` | `{ type: 'flee' }`
- Hook 层 (`useBattle`) 管理工作流：初始化状态 → 逐回合调用 `battleMachine` → 结算

**替代方案**：直接在 Hook 中管理战斗循环（拒绝 — 违反 lib 纯度约束，测试困难）

### Decision 2: 修炼方式通过策略参数注入

**选择**：扩展现有 `cultivate()` 函数签名为 `cultivate(state, strategy: CultivationStrategy, seed)`，`CultivationStrategy` 为 `'steady' | 'aggressive' | 'insight'`，函数内部根据策略分支计算消耗、成功率、收益。
- 冷却期状态存入 `state.player.cultivationCooldown`（可选字段）

**替代方案**：创建三个独立函数 `cultivateSteady`/`cultivateAggressive`/`cultivateInsight`（拒绝 — 共享大量计算逻辑，造成重复）

### Decision 3: 迷雾通过探索状态层分离

**选择**：将探索地图的单元格揭幕状态存储为独立层 `revealedCells: Set<string>`（cell坐标key），与地图数据 `cells: CellData[]` 分离。
- `calculateVisibleCells(playerPosition, revealedCells)` 纯函数返回当前可见格列表
- 迷雾仅在渲染层（组件/Hook）过滤，地图生成逻辑不变
- 路径提示使用 `CellData.hint?: string` 可选字段

**替代方案**：在每个 CellData 中加 `revealed: boolean`（部分拒绝 — 污染数据模型，但可用于简化；最终采用分离Set + CellData.hint 的混合方案）

### Decision 4: 事件后果链使用不可变历史日志

**选择**：在 `GameState.eventHistory: EventRecord[]`（已有但未充分利用）中追加每次事件选择，事件生成函数 `generateAdventureEvent(state, cellType)` 在匹配事件时检查历史。
- `EventRecord = { eventId: string, choiceIndex: number, timestamp: number }`
- 事件定义扩展 `prerequisite?: (history) => boolean` 和 `branches?: Record<number, EventDef>`
- 世界状态标记存入 `state.worldFlags: Record<string, number | boolean>`（新增）

**替代方案**：状态机驱动事件（拒绝 — 30个事件×多分支使状态爆炸，日志式更灵活）

### Decision 5: 世界独特机制使用策略模式

**选择**：定义 `WorldMechanics` 接口，每种世界类型提供实现：
```typescript
interface WorldMechanics {
  cultivateAction: (state: GameState, strategy: CultivationStrategy, seed: number) => ActionResult<GameState>;
  getCombatActions: (state: GameState, player: Player, enemy: Enemy) => CombatAction[];
  getExplorationModifiers: (state: GameState) => ExplorationModifiers;
  getResourceSystem: () => ResourceConfig;
}
```
- 核心循环 Hook（`useCultivation`/`useAdventure`/`useBattle`）通过 `getWorldMechanics(worldType)` 获取当前世界的机制实现
- 位置：`src/lib/game/worlds/<worldType>/mechanics.ts`

**替代方案**：if/switch 分支在原有函数中（拒绝 — 8种世界×3个系统 = 大量条件分支，策略模式隔离性好）

### Decision 6: 元进程树使用独立存储

**选择**：元进程解锁状态存储在 `localStorage` 的独立 key `meta_progress` 中（不影响主存档）：
```typescript
interface MetaProgress {
  totalPoints: number;
  unlockedNodes: string[];
  treeVersion: number;
}
```
- lib 层提供 `calculateMetaPoints(completionStats)` 纯函数计算本次飞升应得点数
- 解锁逻辑在 `src/lib/game/ascension/metaTree.ts` 中定义节点关系和效果

**替代方案**：存储在 Supabase（拒绝 — 离线优先，元进程为本地数据）

### Decision 7: 质变节点通过里程碑注册表驱动

**选择**：定义 `MilestoneRegistry`，将等级→解锁能力的映射集中管理：
```typescript
const MILESTONES: Record<number, Milestone> = {
  10: { id: 'unlock_techniques', name: '初窥门径', unlocks: ['technique_system'] },
  20: { id: 'unlock_crafting', name: '登堂入室', unlocks: ['alchemy_system'] },
  // ...
};
```
- 突破函数中检查 `MILESTONES[newRealmLevel]`，返回 `{ ..., milestone?: Milestone }`
- Hook 层检测里程碑返回值并触发对应的 UI/解锁流程

### Decision 8: 分阶段实施优先级

所有8个能力按影响面和依赖关系分为3个阶段：

| 阶段 | 能力 | 理由 |
|------|------|------|
| Phase 1 (核心循环) | manual-combat-system, cultivation-risk-reward, roguelike-exploration | 直接影响玩家每分钟的操作体验，改进最核心的"点按钮"问题 |
| Phase 2 (深度扩展) | faction-narrative, event-consequence-chain, breakthrough-milestones | 增加叙事深度和成长反馈，依赖Phase 1的循环已有交互性 |
| Phase 3 (长线成长) | ascension-meta-tree, world-unique-mechanics | 飞升后的乐趣和新世界体验，是endgame内容，需前两个Phase完成 |

## Risks / Trade-offs

- **复杂度增加**：手动战斗引入回合循环可能导致部分挂机玩家流失 → 自动战斗选项保留，默认策略可选配
- **存档兼容性**：新增类型字段（eventHistory, worldFlags, cultivationCooldown等）→ 均设为可选字段，加载时用默认值填充缺失项
- **世界机制实现量**：8种世界类型×独特机制 → 分步实现，Phase 3先实现科技+武侠两种差异化最大的世界作为验证
- **性能**：迷雾计算每个玩家移动触发 → 纯函数计算，单次复杂度O(n) where n ≤ 900（最大地图30×30），无性能风险
- **事件链膨胀**：持久后果导致的测试复杂度 → 事件链数量控制在5条，每条3-5事件，分支数≤3
- **元进程树平衡**：节点间可能存在数值叠加导致过早过强 → 每个分支设置最大总层数5层，便利型节点效果设置上限
