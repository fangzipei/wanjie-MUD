## Why

当前新游戏流程是"先选人→后选世界"，角色属性名（体质、灵根）和词条系统都是修仙世界观固定的。经全面审计发现世界概念存在 10 个设计/实现问题：数据双源重复、世界系数矛盾、4/8 世界共享同一 mechanics 实现、属性体系全为修仙不匹配世界、存在不可达死代码等。万界的核心是"体验不同世界"，本次变更将流程重排 + 一并修复所有已发现的世界概念问题。

## What Changes

### 流程与状态机
- **BREAKING**: 调整 GamePhase 顺序为 `world-select → character-select → backstory → playing`
- **BREAKING**: `startNewGame()` 不再立即生成角色，改为先生成世界列表并跳转到世界选择页
- 角色生成逻辑接收 `worldType` 参数，根据世界类型使用不同的属性显示名、词条池和数值范围

### 世界数据整合（审计问题 1、2、10）
- 删除 `generators.ts` 中的内联 `worldPrefixes`/`worldSuffixes`/`worldDescriptions`，统一从 `WORLD_DATA` 读取
- 删除 `combat/logic/statsCalc.ts` 中重复的 `WORLD_COEFFICIENTS`，统一从 `identity/data/worldData.ts` 导入
- 重整 `identity/data/` 目录结构，建立 WORLD_DATA 作为世界配置的唯一数据源

### 世界机制完善（审计问题 3、4、9）
- 为 `仙侠`、`高武`、`异能` 创建独立的 WorldMechanics 实现（不再复用 cultivationWorld）
- 删除不可达的 `mythWorld` 死代码（`hasUniqueMechanics` 中也移除 `'神话'` 引用）
- 确保全部 8 个世界类型都有差异化的修炼/战斗/探索术语

### 属性体系世界感知（审计问题 5）
- 新增 `getStatDisplayName()` 显示层映射函数，8 种世界各有独立的属性显示名
- 新增 `useStatLabels(worldType)` Hook 统一提供属性标签
- `worldData.ts` 中新增 `statDisplayNames` 配置

### 境界体系优化（审计问题 6）
- `SUB_REALM_SYSTEMS` 改为 `Record<WorldType, Record<string, string[]>>`，小境界按世界类型限定
- 科技世界使用数字/字母等级，魔幻世界使用 I-IX 级，确保搭配协调

### UI 重设计（审计问题 7）
- 世界选择界面：从卡片网格改为沉浸式"万象星盘"，武侠标记"推荐新手"，末世标记"挑战模式"
- 角色选择界面：展示当前世界的属性体系和词条上下文
- 首页 StartScreen 增加世界观引导

### 类型安全修复（审计问题 8）
- `worldMigration.ts` 中 `worldType` 从 `string` 改为 `WorldType`
- `WorldSaveData` 类型安全加固

## Capabilities

### New Capabilities
- `world-first-flow`: 世界优先的选择流程，包含路由重排、状态机更新、阶段守卫逻辑
- `world-aware-character-gen`: 角色生成根据世界类型使用差异化的属性显示名、词条池和数值模板
- `world-select-ui`: 沉浸式世界选择界面，万象星盘主题，新手引导标记
- `character-select-ui`: 世界感知的角色选择界面，展示世界属性体系
- `world-data-consolidation`: 世界数据整合为单一数据源，删除重复定义
- `world-mechanics-completion`: 补全 8 种世界类型的独立 WorldMechanics 实现
- `world-realm-polish`: 小境界体系按世界类型限定，消除不协调搭配

### Modified Capabilities
<!-- 均为新增能力 -->

## Impact

- `src/shared/lib/types.ts` — GamePhase 顺序调整，Character/CharacterStats 世界感知字段
- `src/app/page.tsx` — 路由目标改为 `/world-select`
- `src/app/character-select/page.tsx` — 路由守卫改为检查 `selectedWorld`
- `src/app/world-select/page.tsx` — 路由守卫移除 `selectedCharacter` 检查
- `src/app/game/page.tsx` — 路由回退逻辑调整
- `src/views/game/useGameState.tsx` — startNewGame/selectWorld 逻辑调整
- `src/views/world-select/WorldSelect.tsx` — UI 重设计为万象星盘
- `src/views/character-select/CharacterSelect.tsx` — UI 重设计，接收世界参数
- `src/views/home/StartScreen.tsx` — UI 调整
- `src/modules/identity/logic/generators.ts` — 删除内联常量，generateCharacters 接收 worldType
- `src/modules/identity/data/worldData.ts` — 整合为唯一数据源，新增 statDisplayNames
- `src/modules/identity/data/worldSystem.ts` — 清理
- `src/modules/identity/logic/worlds/` — 新增 3 个 mechanics，删除 mythWorld
- `src/modules/progression/data/realmData.ts` — SUB_REALM_SYSTEMS 改为世界感知
- `src/modules/combat/logic/statsCalc.ts` — 删除重复 WORLD_COEFFICIENTS
- `src/modules/identity/logic/worlds/worldMigration.ts` — 类型安全修复
