# world-first-flow

## Purpose

TBD — see change world-first-selection-flow for full context.

# world-first-flow

世界优先的新游戏选择流程，包含路由重排、状态机更新和阶段守卫逻辑。

## ADDED Requirements

### Requirement: 新游戏流程为世界优先

新游戏开始后，系统 SHALL 遵循"世界选择 → 角色选择 → 背景故事 → 游戏"的流程顺序。`GamePhase` 联合类型 SHALL 调整为 `'world-select' | 'character-select' | 'backstory' | 'playing'`。

#### Scenario: 首页点击开始新游戏
- **WHEN** 用户在首页点击"开始新游戏"
- **THEN** 系统 SHALL 生成 8 个世界并跳转到 `/world-select` 页面
- **AND** 系统 SHALL NOT 在此时生成角色

#### Scenario: 世界选择后进入角色选择
- **WHEN** 用户在世界选择页选中一个世界
- **THEN** 系统 SHALL 将选中世界存入 `selectedWorld`
- **AND** 系统 SHALL 基于选中世界的类型生成 8 个角色
- **AND** 系统 SHALL 跳转到 `/character-select` 页面

#### Scenario: 角色选择后进入背景故事
- **WHEN** 用户选中一个角色
- **THEN** 系统 SHALL 基于角色和选中世界生成背景故事
- **AND** 系统 SHALL 跳转到 `/backstory` 页面

### Requirement: 阶段路由守卫保护流程完整性

每个选择页面 SHALL 检查前置条件，未满足时重定向到正确的页面。

#### Scenario: 直接访问角色选择页无选中世界
- **WHEN** 用户直接访问 `/character-select` 但 `selectedWorld` 为空
- **THEN** 系统 SHALL 重定向到 `/world-select`

#### Scenario: 直接访问世界选择页但已在游戏中
- **WHEN** 用户直接访问 `/world-select` 但已在游戏中（`phase === 'playing'`）
- **THEN** 系统 SHALL 重定向到 `/game`

#### Scenario: 游戏页无主角时回退
- **WHEN** 用户在 `/game` 页面但 `protagonist` 为空
- **THEN** 系统 SHALL 按顺序检查：有 selectedCharacter 和 selectedWorld → `/backstory`；有 selectedWorld → `/character-select`；有 worlds → `/world-select`；否则 → `/`

### Requirement: 世界选择页无需前置角色

世界选择页面 SHALL NOT 要求 `selectedCharacter` 存在才能访问。

#### Scenario: 新游戏直接进入世界选择
- **WHEN** `startNewGame()` 被调用后跳转到 `/world-select`
- **THEN** 页面 SHALL 正常渲染世界列表
- **AND** SHALL NOT 因 `selectedCharacter` 为空而重定向

## REMOVED Requirements

### Requirement: 旧流程先选角色后选世界
**Reason**: 角色属性依赖世界设定，先选世界才能生成合理的角色属性名和词条
**Migration**: `GamePhase` 调整为 `world-select → character-select → backstory → playing`，所有路由守卫同步更新
