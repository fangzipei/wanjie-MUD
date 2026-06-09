# world-mechanics-completion

补全 8 种世界类型的独立 WorldMechanics 实现，每种世界有差异化的修炼/战斗/探索术语和独特机制。

## ADDED Requirements

### Requirement: 每种世界类型有独立 WorldMechanics

全部 8 种 `WorldType` SHALL 各自对应一个独立的 `WorldMechanics` 实现，提供差异化的术语和参数。SHALL NOT 存在多个世界类型共享同一实现。

#### Scenario: 仙侠世界有独立实现
- **WHEN** 获取仙侠世界的 WorldMechanics
- **THEN** SHALL 返回独立的 `xiānxiáWorld` 实现（非 cultivationWorld）
- **AND** `getCultivationParams()` SHALL 返回 `resourceName: '仙石'`, `actionName: '修仙'`
- **AND** `getCombatParams()` SHALL 返回 `mpName: '仙元'`, `abilityName: '剑诀'`

#### Scenario: 高武世界有独立实现
- **WHEN** 获取高武世界的 WorldMechanics
- **THEN** SHALL 返回独立的 `highMartialWorld` 实现（非 cultivationWorld）
- **AND** `getCultivationParams()` SHALL 返回 `resourceName: '气血丹'`, `actionName: '练功'`
- **AND** `getCombatParams()` SHALL 返回 `mpName: '内力'`, `abilityName: '武功'`

#### Scenario: 异能世界有独立实现
- **WHEN** 获取异能世界的 WorldMechanics
- **THEN** SHALL 返回独立的 `esperWorld` 实现（非 cultivationWorld）
- **AND** `getCultivationParams()` SHALL 返回 `resourceName: '源能'`, `actionName: '觉醒'`
- **AND** `getCombatParams()` SHALL 返回 `mpName: '念力'`, `abilityName: '超能力'`

### Requirement: WorldMechanics 注册表覆盖所有世界类型

`WORLD_MECHANICS` 注册表 SHALL 包含所有 8 种 `WorldType` 的映射，每种映射到独立实现。

#### Scenario: 注册表完整性检查
- **WHEN** 遍历 `WorldType` 联合类型的所有值
- **THEN** 每个值 SHALL 在 `WORLD_MECHANICS` 中有对应条目
- **AND** 任意两个 WorldType SHALL NOT 映射到同一个实现对象

### Requirement: 删除不可达的 mythWorld 代码

`src/modules/identity/logic/worlds/mythWorld.ts` SHALL 被删除。`factory.ts` 中的 `mythWorld` 导入和引用 SHALL 被移除。`hasUniqueMechanics()` 函数中的 `'神话'` 字符串 SHALL 被移除。

#### Scenario: mythWorld 文件不存在
- **WHEN** 检查 `src/modules/identity/logic/worlds/` 目录
- **THEN** `mythWorld.ts` SHALL NOT 存在

#### Scenario: hasUniqueMechanics 不包含神话
- **WHEN** 调用 `hasUniqueMechanics('神话')`
- **THEN** SHALL 返回 `false`

## REMOVED Requirements

### Requirement: 多个世界类型共享 cultivationWorld 实现
**Reason**: 修仙/仙侠/高武/异能使用不同的力量体系，共享实现导致术语错误（如仙侠世界显示"灵石"）
**Migration**: 为仙侠/高武/异能创建独立的 WorldMechanics 实现

### Requirement: mythWorld 神话世界代码
**Reason**: `WorldType` 中不存在 `'神话'` 类型，该代码永远无法被触发
**Migration**: 删除 mythWorld.ts，从 factory.ts 和 hasUniqueMechanics 移除引用。神恩系统设计保留在 git history 中
