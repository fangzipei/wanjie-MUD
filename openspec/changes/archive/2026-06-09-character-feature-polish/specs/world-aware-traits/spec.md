# world-aware-traits

词条系统按世界类型差异化，每种世界有独立的出身/特质/性格/天赋词条池。

## ADDED Requirements

### Requirement: 词条池按世界类型分区

`ORIGIN_TRAITS` / `TRAIT_TRAITS` / `PERSONALITY_TRAITS` / `TALENT_TRAITS` SHALL 从全局 Record 改为 `Record<WorldType, Record<ImpactLevel, TraitDefinition[]>>` 结构。`generateCharacter(worldType)` SHALL 从对应世界的词条池选取词条。

#### Scenario: 科技世界使用科技词条
- **WHEN** 为科技世界生成角色
- **THEN** 出身词条 SHALL 来自科技池（如"基因优化体"、"机械义肢者"、"赛博原生"）
- **AND** 天赋词条 SHALL NOT 出现"先天道体"、"灵根纯净"等修仙术语

#### Scenario: 魔幻世界使用魔幻词条
- **WHEN** 为魔幻世界生成角色
- **THEN** 特质词条 SHALL 来自魔幻池（如"元素之子"、"龙裔血脉"、"魔法共鸣"）
- **AND** 性格词条使用魔幻设定语言

#### Scenario: 修仙世界保持原有词条
- **WHEN** 为修仙世界生成角色
- **THEN** 所有词条 SHALL 使用修仙池（现有内容不变）

### Requirement: 词条描述中的属性引用兼容世界显示名

词条的 `description` 字段 MAY 使用内部属性键（如"灵根+2"），UI 层 SHALL 通过 `attrNames[key]` 转换显示。词条的 `positiveAttrs`/`negativeAttrs` SHALL 仍然使用内部属性键。

#### Scenario: 科技词条属性影响正确
- **WHEN** 科技世界词条"基因优化"的 positiveAttrs 为 `['体质']`
- **THEN** UI 显示 SHALL 为"体能+3"（使用科技世界显示名）
- **AND** 底层计算 SHALL 使用属性键'体质'

### Requirement: 共享通用词条兜底

未独立定义词条池的世界类型（目前为修仙之外的世界）SHALL 在 `WORLD_TRAIT_DEFINITIONS` 中 fallback 到修仙词条，确保不会因缺少词条定义而报错。

#### Scenario: 异能世界 fallback 到修仙词条
- **WHEN** 为异能世界生成角色
- **THEN** SHALL 使用修仙词条池（直到异能专属词条完成）

## REMOVED Requirements

### Requirement: 全局统一修仙词条池
**Reason**: 所有世界共用修仙词条（"先天道体"在科技世界、"灵根纯净"在末世世界），破坏世界设定沉浸感
**Migration**: traits.ts 导出改为按 WorldType 索引，generateCharacter 传入 worldType 选择对应池
