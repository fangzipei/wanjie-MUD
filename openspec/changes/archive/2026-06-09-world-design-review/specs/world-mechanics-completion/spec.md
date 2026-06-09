# world-mechanics-completion (delta)

在已有 WorldMechanics 独立实现基础上，为修仙/仙侠/高武/异能补充唯一核心机制（USP），使 8 种世界类型拥有差异化的玩法体验。

## MODIFIED Requirements

### Requirement: 每种世界类型有独立 WorldMechanics

全部 8 种 `WorldType` SHALL 各自对应一个独立的 `WorldMechanics` 实现，提供差异化的术语、参数和唯一核心机制。SHALL NOT 存在多个世界类型共享同一实现。

#### Scenario: 仙侠世界有独立实现和飞剑机制
- **WHEN** 获取仙侠世界的 WorldMechanics
- **THEN** SHALL 返回独立的 `xiānxiáWorld` 实现（非 cultivationWorld）
- **AND** `getCultivationParams()` SHALL 返回 `resourceName: '仙石'`, `actionName: '修仙'`
- **AND** `getCombatParams()` SHALL 返回 `mpName: '仙元'`, `abilityName: '剑诀'`
- **AND** `getUniqueMechanicDescription()` SHALL 返回本命飞剑的 USP 信息

#### Scenario: 高武世界有独立实现和气血机制
- **WHEN** 获取高武世界的 WorldMechanics
- **THEN** SHALL 返回独立的 `highMartialWorld` 实现（非 cultivationWorld）
- **AND** `getCultivationParams()` SHALL 返回 `resourceName: '气血丹'`, `actionName: '练功'`
- **AND** `getCombatParams()` SHALL 返回 `mpName: '内力'`, `abilityName: '武功'`
- **AND** `customAutoStrategy` SHALL 实现气血爆发逻辑

#### Scenario: 异能世界有独立实现和共鸣机制
- **WHEN** 获取异能世界的 WorldMechanics
- **THEN** SHALL 返回独立的 `esperWorld` 实现（非 cultivationWorld）
- **AND** `getCultivationParams()` SHALL 返回 `resourceName: '源能'`, `actionName: '觉醒'`
- **AND** `getCombatParams()` SHALL 返回 `mpName: '念力'`, `abilityName: '超能力'`
- **AND** `getUniqueMechanicDescription()` SHALL 返回源能共鸣的 USP 信息

### Requirement: hasUniqueMechanics 覆盖 7/8 世界

`hasUniqueMechanics()` 函数 SHALL 对除修仙外的所有世界类型返回 `true`。修仙作为入门世界保持 baseline。

#### Scenario: hasUniqueMechanics 更新
- **WHEN** 调用 `hasUniqueMechanics(worldType)` 对所有 8 种 WorldType
- **THEN** `hasUniqueMechanics('修仙')` SHALL 返回 `false`
- **AND** 其余 7 种世界类型 SHALL 返回 `true`

## ADDED Requirements

### Requirement: WorldMechanics 接口新增 onWorldEnter/onWorldLeave 钩子

`WorldMechanics` 接口 SHALL 新增可选的 `onWorldEnter` 和 `onWorldLeave` 钩子方法，用于处理进入/离开世界时的特殊逻辑（如初始化飞剑状态、清理临时能力）。

#### Scenario: 进入仙侠世界初始化飞剑
- **WHEN** 玩家首次进入仙侠世界（`onWorldEnter` 被调用）
- **THEN** 系统 SHALL 为玩家生成初始本命飞剑
- **AND** 飞剑状态 SHALL 追加到 GameState 中

#### Scenario: 离开异能世界清理临时能力
- **WHEN** 玩家离开异能世界（`onWorldLeave` 被调用）
- **THEN** 所有源能共鸣临时能力 SHALL 被清除
- **AND** 玩家属性 SHALL 恢复到无共鸣的基础值
