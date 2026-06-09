# world-realm-polish

小境界体系按世界类型限定，消除大境界与小境界随机组合产生的不协调搭配。

## ADDED Requirements

### Requirement: SUB_REALM_SYSTEMS 按世界类型分组

`SUB_REALM_SYSTEMS` SHALL 从全局 Record 改为 `Record<WorldType, Record<string, string[]>>`，每种世界类型有独立的小境界体系集合。

#### Scenario: 修仙世界使用修仙风格小境界
- **WHEN** 为修仙世界生成境界体系
- **THEN** 小境界 SHALL 从修仙可用集合中随机选择（一至九重、初期至大圆满、入门至大成）
- **AND** SHALL NOT 出现 "LV1"、"一阶"等非修仙风格小境界

#### Scenario: 科技世界使用科技风格小境界
- **WHEN** 为科技世界生成境界体系
- **THEN** 小境界 SHALL 从科技可用集合中随机选择（LV等级、品级、一二三四阶）
- **AND** SHALL NOT 出现 "一重/二重"等修仙风格小境界

#### Scenario: 魔幻世界使用魔幻风格小境界
- **WHEN** 为魔幻世界生成境界体系
- **THEN** 小境界 SHALL 从魔幻可用集合中随机选择（星级、品级、数字层）
- **AND** SHALL NOT 出现"初期/中期/后期"等修仙风格小境界

### Requirement: generateRealmSystem 使用世界限定的小境界

`generateRealmSystem(worldType)` SHALL 从 `SUB_REALM_SYSTEMS[worldType]` 而非全局 `SUB_REALM_SYSTEMS` 中选取小境界体系。

#### Scenario: 生成境界体系时小境界来源正确
- **WHEN** 调用 `generateRealmSystem('科技')`
- **THEN** 小境界体系 SHALL 从 `SUB_REALM_SYSTEMS['科技']` 中选取
- **AND** 返回的 `RealmSystem` 中 `subRealmName` SHALL 是科技风格的名称（如 "LV等级"、"品级"）

#### Scenario: 境界组合协调性
- **WHEN** 科技世界生成"军衔体系"大境界 + "LV等级"小境界
- **THEN** 实际境界名 SHALL 类似 "列兵 LV1"、"少尉 LV5"
- **AND** SHALL NOT 出现 "列兵·初期"、"少尉·一重" 等不协调组合

### Requirement: 保留通用小境界作为兜底

系统 SHALL 保留一组通用小境界（如"一二三四阶"、"星级"）作为所有世界类型的兜底选项，确保每种世界类型至少有 2 种小境界可选。

#### Scenario: 兜底保证
- **WHEN** 某种世界类型的专属小境界少于 2 种
- **THEN** SHALL 补充通用小境界（一二三四阶、星级）到该世界类型的可用集合中
