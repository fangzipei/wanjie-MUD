## ADDED Requirements

### Requirement: 世界数据注册中心

系统 SHALL 提供一个运行时世界数据注册中心（`WorldDataRegistry`），用于存储和查询所有已加载的世界相关数据。注册中心 SHALL 支持以下数据类型：

- **世界类型**（key: `worldTypeId`）：世界基本信息（名称、描述、系数、名称池、描述池）
- **境界体系**（key: `worldTypeId`）：`RealmSystem` 定义
- **词条池**（key: `worldTypeId`）：`WorldTraitPool` 配置
- **危险效果**（key: `dangerId`）：`WorldDanger` 定义
- **机缘效果**（key: `opportunityId`）：`WorldOpportunity` 定义
- **势力模板**（key: `worldTypeId` 或 `factionId`）：势力生成模板
- **世界观文案**（key: `worldTypeId`）：`WorldTextDefinition` 对象
- **姓名池**（key: `worldTypeId`）：姓名池配置

注册中心 SHALL 是单例，所有游戏模块通过统一的查询 API 获取数据。

#### Scenario: 注册并查询世界类型
- **WHEN** 调用 `WorldDataRegistry.registerWorldType({ id: "demon", name: "魔域", ... })`
- **THEN** 后续调用 `WorldDataRegistry.getWorldType("demon")` SHALL 返回已注册的世界类型数据

#### Scenario: 查询未注册的世界类型
- **WHEN** 调用 `WorldDataRegistry.getWorldType("nonexistent")`
- **THEN** 返回 `undefined`
- **AND** 控制台 SHALL 输出 warning 级别的日志

#### Scenario: 注册重复 ID 的数据
- **WHEN** 使用已有 ID 注册同类型数据（如两个世界类型都使用 "demon" ID）
- **THEN** 后注册的数据 SHALL 覆盖先前数据
- **AND** 控制台 SHALL 输出 warning 日志，记录覆盖行为

### Requirement: 世界类型有效性校验

系统 SHALL 在运行时通过注册中心校验世界类型 ID 的有效性。`isValidWorldType(id: string): boolean` 函数 SHALL 返回 `true` 当且仅当该 ID 已注册在注册中心的世界类型列表中。

#### Scenario: 校验已注册的世界类型
- **WHEN** `isValidWorldType("修仙")` 在核心数据加载后被调用
- **THEN** 返回 `true`

#### Scenario: 校验未注册的世界类型
- **WHEN** `isValidWorldType("不存在的世界")` 被调用
- **THEN** 返回 `false`

### Requirement: 获取全部可用世界类型

系统 SHALL 提供 `getAllWorldTypes(): string[]` 函数，返回注册中心中所有已注册世界类型的 ID 列表。该列表 SHALL 用于世界选择界面和 Mod 信息展示。

#### Scenario: 获取所有世界类型 ID
- **WHEN** 核心 Mod 和 2 个扩展 Mod 已加载
- **AND** 核心 Mod 注册了 8 个世界类型，扩展 Mod 各注册了 1 个世界类型
- **THEN** `getAllWorldTypes()` SHALL 返回包含 10 个 ID 的数组

### Requirement: WorldType 品牌字符串类型

系统 SHALL 将 `WorldType` 类型从硬编码联合类型重构为品牌字符串类型（branded string），格式为：

```typescript
type WorldType = string & { readonly __brand: 'WorldType' };
```

任何 `string` 值 SHALL NOT 被直接赋值给 `WorldType` 类型变量。必须通过 `asWorldType(id: string): WorldType | undefined` 工厂函数创建，该函数在运行时校验 ID 是否在注册中心已注册。

#### Scenario: 有效的 WorldType 构造
- **WHEN** 调用 `asWorldType("修仙")`（已注册于注册中心）
- **THEN** 返回值为 `WorldType` 类型，值等于 `"修仙"`

#### Scenario: 无效的 WorldType 构造
- **WHEN** 调用 `asWorldType("未注册世界")`
- **THEN** 返回 `undefined`
- **AND** 控制台输出 warning

### Requirement: 注册中心数据合并策略

当多个 Mod 注册同一类型的数据时，系统 SHALL 使用"后加载优先"策略（Last-Write-Wins）。数组类型数据（如词条池）SHALL 执行追加合并，而非覆盖。SHALL NOT 导致已加载 Mod 的数据在未明确冲突的情况下丢失。

#### Scenario: 两个 Mod 提供同一个世界类型的词条池
- **WHEN** Mod A 为 "修仙" 注册了 10 个出身词条
- **AND** Mod B 为 "修仙" 注册了 5 个额外出身词条（后加载）
- **AND** Mod B 加载在 Mod A 之后
- **THEN** "修仙" 世界类型的出身词条池 SHALL 包含 15 个词条（合并）
