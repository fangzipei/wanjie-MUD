# world-aware-character-gen

角色生成逻辑根据世界类型使用差异化的属性显示名、词条池和数值模板。

## ADDED Requirements

### Requirement: 角色生成接收世界类型参数

`generateCharacters` 函数 SHALL 接收 `worldType: WorldType` 参数，根据世界类型选择对应的词条池。

#### Scenario: 修仙世界角色生成
- **WHEN** 传入 `worldType === '修仙'`
- **THEN** 生成的角色的出身/特质/性格/天赋词条 SHALL 来自修仙词条池（如"天灵根"、"先天道体"）
- **AND** 属性显示名 SHALL 使用修仙体系（体质、灵根、悟性、幸运、意志）

#### Scenario: 科技世界角色生成
- **WHEN** 传入 `worldType === '科技'`
- **THEN** 生成的角色的出身/特质/性格/天赋词条 SHALL 来自科技词条池（如"黑客"、"机械亲和"）
- **AND** 属性显示名 SHALL 使用科技体系（体能、智力、反应、技术、魅力）

#### Scenario: 魔幻世界角色生成
- **WHEN** 传入 `worldType === '魔幻'`
- **THEN** 生成的角色的词条 SHALL 来自魔幻词条池（如"元素亲和"、"龙裔血脉"）
- **AND** 属性显示名 SHALL 使用魔幻体系（力量、魔力、敏捷、感知、魅力）

### Requirement: 属性显示名按世界类型映射

系统 SHALL 提供 `getStatDisplayName(statKey: string, worldType: WorldType): string` 函数，将内部属性键映射为世界对应的显示名。

#### Scenario: 修仙世界显示"灵根"
- **WHEN** 调用 `getStatDisplayName('灵根', '修仙')`
- **THEN** 返回 `'灵根'`

#### Scenario: 科技世界映射"灵根"为"智力"
- **WHEN** 调用 `getStatDisplayName('灵根', '科技')`
- **THEN** 返回 `'智力'`

#### Scenario: 魔幻世界映射"灵根"为"魔力"
- **WHEN** 调用 `getStatDisplayName('灵根', '魔幻')`
- **THEN** 返回 `'魔力'`

### Requirement: useStatLabels Hook 统一提供属性标签

系统 SHALL 提供 `useStatLabels(worldType: WorldType)` Hook，返回当前世界下 5 个属性的显示名映射和标签数组。

#### Scenario: Hook 返回当前世界属性标签
- **WHEN** 在科技世界下调用 `useStatLabels('科技')`
- **THEN** 返回 `{ labels: { '体质': '体能', '灵根': '智力', '悟性': '反应', '幸运': '技术', '意志': '魅力' }, statKeys: ['体质','灵根','悟性','幸运','意志'], displayNames: ['体能','智力','反应','技术','魅力'] }`

### Requirement: 词条池按世界类型配置

每个世界类型 SHALL 在 `src/modules/identity/data/` 中有独立的词条配置文件，包含出身、特质、性格、天赋四类词条。

#### Scenario: 加载科技世界词条池
- **WHEN** 系统需要为科技世界生成角色词条
- **THEN** 系统 SHALL 从科技世界词条配置中读取词条定义
- **AND** 词条描述 SHALL 使用科技世界的语言风格（如"对机械有着天生的直觉"）

## REMOVED Requirements

### Requirement: 无世界感知的硬编码角色生成
**Reason**: 所有世界共用修仙词条和修仙属性名，破坏了其他世界设定的沉浸感
**Migration**: `generateCharacters()` 改为 `generateCharacters(worldType)`，词条选择改为从 `WORLD_TRAIT_POOLS[worldType]` 读取
