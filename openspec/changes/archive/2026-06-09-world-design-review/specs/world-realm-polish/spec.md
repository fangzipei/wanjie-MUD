# world-realm-polish (delta)

在已有世界限定小境界基础上，增加境界数值差异化——不同世界可有不同的每级倍率和跨大境界跨越倍率，使境界成长曲线反映世界特色。

## MODIFIED Requirements

### Requirement: generateRealmSystem 使用世界限定的小境界

`generateRealmSystem(worldType)` SHALL 从 `SUB_REALM_SYSTEMS[worldType]` 而非全局 `SUB_REALM_SYSTEMS` 中选取小境界体系。生成的 `RealmSystem` SHALL 包含世界相关的倍率配置。

#### Scenario: 生成境界体系时小境界来源正确
- **WHEN** 调用 `generateRealmSystem('科技')`
- **THEN** 小境界体系 SHALL 从 `SUB_REALM_SYSTEMS['科技']` 中选取
- **AND** 返回的 `RealmSystem` 中 `subRealmName` SHALL 是科技风格的名称（如 "LV等级"、"品级"）
- **AND** `subRealmMultiplier` SHALL 为 1.03（科技世界缓慢成长）
- **AND** `tierJumpMultiplier` SHALL 为 1.20

#### Scenario: 境界组合协调性
- **WHEN** 科技世界生成"军衔体系"大境界 + "LV等级"小境界
- **THEN** 实际境界名 SHALL 类似 "列兵 LV1"、"少尉 LV5"
- **AND** SHALL NOT 出现 "列兵·初期"、"少尉·一重" 等不协调组合

## ADDED Requirements

### Requirement: RealmSystem 支持自定义成长倍率

`RealmSystem` 接口 SHALL 新增可选字段 `subRealmMultiplier` 和 `tierJumpMultiplier`，允许世界类型自定义境界成长曲线。

#### Scenario: 末世世界快速成长
- **WHEN** 获取末世世界的 `RealmSystem`
- **THEN** `subRealmMultiplier` SHALL 为 1.08（高风险快成长）
- **AND** `tierJumpMultiplier` SHALL 为 1.50

#### Scenario: 科技世界稳定成长
- **WHEN** 获取科技世界的 `RealmSystem`
- **THEN** `subRealmMultiplier` SHALL 为 1.03（科技研究缓慢稳定）
- **AND** `tierJumpMultiplier` SHALL 为 1.20

#### Scenario: 未设置倍率时使用默认值
- **WHEN** 世界的 `RealmSystem` 未设置 `subRealmMultiplier`
- **THEN** `getRealmMultiplier()` SHALL 使用默认值 1.05
- **AND** 行为 SHALL 与当前版本完全一致（向后兼容）

### Requirement: 世界境界倍率配置表

系统 SHALL 维护世界境界倍率配置，定义每个世界的成长曲线：

| 世界类型 | subRealmMultiplier | tierJumpMultiplier | 风格说明 |
|---------|--------------------|--------------------|---------|
| 修仙 | 1.05（默认） | 1.30（默认） | 标准修仙成长 |
| 仙侠 | 1.05 | 1.30 | 标准剑修成长 |
| 高武 | 1.06 | 1.35 | 武道爆发式突破 |
| 科技 | 1.03 | 1.20 | 科技研究稳定渐进 |
| 魔幻 | 1.06 | 1.30 | 魔法感悟式成长 |
| 异能 | 1.04 | 1.40 | 觉醒跃迁式突破 |
| 武侠 | 1.05 | 1.25 | 勤学苦练式成长 |
| 末世 | 1.08 | 1.50 | 极端环境快速进化 |

#### Scenario: 所有世界倍率配置完整
- **WHEN** 检查境界倍率配置表
- **THEN** 所有 8 种 WorldType SHALL 有对应的倍率配置
- **AND** 配置表 SHALL 作为 `getRealmMultiplier` 的默认倍率来源
