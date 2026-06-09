# world-data-consolidation (delta)

修仙与仙侠数据源差异化：消除两个世界共用姓名池和过度相似的配置，确保 WORL_DATA 中每个世界的数据独立且差异明显。

## MODIFIED Requirements

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

## ADDED Requirements

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
