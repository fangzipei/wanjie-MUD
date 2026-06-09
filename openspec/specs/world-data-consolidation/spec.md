# world-data-consolidation

## Purpose

TBD — see change world-first-selection-flow for full context.

# world-data-consolidation

世界数据整合为单一数据源，删除所有重复定义，确保 WORLD_DATA 是世界的唯一配置来源。

## ADDED Requirements

### Requirement: WORLD_DATA 为世界配置唯一数据源

`WORLD_DATA: Record<WorldType, WorldStats>` 在 `src/modules/identity/data/worldData.ts` 中 SHALL 作为所有世界数据的唯一定义来源。任何其他文件 SHALL NOT 重复定义世界名称前缀、后缀、描述或系数。修仙和仙侠 SHALL 拥有独立且差异明显的 WORLD_DATA 条目。

#### Scenario: 新增世界类型只需修改一处
- **WHEN** 需要新增或修改世界类型配置
- **THEN** 只需修改 `WORLD_DATA` 中的对应条目
- **AND** `generateWorld()` SHALL 从 `WORLD_DATA[worldType]` 读取名称前缀/后缀/描述

#### Scenario: generators.ts 不包含内联世界常量
- **WHEN** 检查 `src/modules/identity/logic/generators.ts`
- **THEN** SHALL NOT 存在 `worldPrefixes`、`worldSuffixes`、`worldDescriptions` 内联常量
- **AND** 世界名称/描述生成 SHALL 通过导入 `WORLD_DATA` 完成

#### Scenario: 修仙与仙侠数据独立
- **WHEN** 比较 `WORLD_DATA['修仙']` 和 `WORLD_DATA['仙侠']`
- **THEN** `namePrefixes` SHALL NOT 共享任何相同值（修仙：青云/紫霄，仙侠：剑气/仙云）
- **AND** `descriptions` SHALL 反映不同的世界观（修仙：长生修仙，仙侠：剑道修行）
- **AND** `dangers` 和 `opportunities` 的 `description` 文本 SHALL 各自独立

### Requirement: WORLD_COEFFICIENTS 全局唯一

世界系数 `WORLD_COEFFICIENTS` SHALL 仅在 `src/modules/identity/data/worldData.ts` 中定义一份，所有其他模块 SHALL 从此处导入。

#### Scenario: combat 模块使用统一系数
- **WHEN** `combat/logic/statsCalc.ts` 需要获取世界系数
- **THEN** SHALL 从 `@/modules/identity/data/worldData` 导入 `WORLD_COEFFICIENTS`
- **AND** SHALL NOT 在本地重新定义 `WORLD_COEFFICIENTS`

#### Scenario: 系数数值一致性
- **WHEN** 获取任意世界类型的系数
- **THEN** 世界生成和战斗计算中使用同一个数值
- **AND** 系数语义全局一致（表示世界基础难度）

### Requirement: WorldStats 结构包含属性显示名

`WorldStats` 接口 SHALL 包含 `statDisplayNames` 字段，定义该世界的 5 个属性显示名映射。

#### Scenario: WorldStats 包含 statDisplayNames
- **WHEN** 读取 `WORLD_DATA['科技']`
- **THEN** SHALL 包含 `statDisplayNames: { '体质': '体能', '灵根': '智力', '悟性': '反应', '幸运': '技术', '意志': '魅力' }`

#### Scenario: 旧世界数据迁移
- **WHEN** 加载旧版本存档
- **THEN** 缺少 `statDisplayNames` 的世界数据 SHALL 使用修仙默认值填充

### Requirement: 仙侠世界独立姓名池

仙侠世界 SHALL 使用独立的 `XIANXIA_NAMES` 姓名池，SHALL NOT 与修仙世界共用 `CULTIVATION_NAMES`。

#### Scenario: 姓名池映射独立
- **WHEN** 检查 `WORLD_NAME_POOLS`
- **THEN** `WORLD_NAME_POOLS['修仙']` SHALL 引用 `CULTIVATION_NAMES`
- **AND** `WORLD_NAME_POOLS['仙侠']` SHALL 引用 `XIANXIA_NAMES`
- **AND** 两个对象 SHALL NOT 引用同一内存地址

#### Scenario: 仙侠姓名池内容
- **WHEN** 读取 `XIANXIA_NAMES`
- **THEN** `surnames` SHALL 包含剑修相关姓氏（如"剑""凌""萧""叶"）
- **AND** `maleNames` SHALL 包含剑道风格名（如"剑心""凌霄""破天"）
- **AND** `femaleNames` SHALL 包含仙剑风格名（如"剑兰""凌霜""紫英"）
