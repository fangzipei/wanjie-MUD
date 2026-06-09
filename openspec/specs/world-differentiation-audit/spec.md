# world-differentiation-audit

## Purpose

世界差异化审查：定义三层差异化模型和审查标准，确保 8 种世界类型在数值、机制、内容三个层面有足够的差异化深度。

## Requirements

### Requirement: 三层差异化模型定义

系统 SHALL 使用三层差异化模型评估世界设计：
- **数值层（权重20%）**：coefficient、基础属性、境界倍率、属性映射
- **机制层（权重50%）**：修炼机制、战斗机制、探索机制、专属系统
- **内容层（权重30%）**：名称/文案、视觉主题、事件池、专属物品

每个世界类型 SHALL 在机制层有至少 1 个独特点，且整体差异化得分不低于 60%。

#### Scenario: 修仙世界差异化评估
- **WHEN** 对修仙世界执行三层差异化审计
- **THEN** 机制层得分 SHALL 不低于 40%（即使无独特机制，通过完善的术语差异化弥补）
- **AND** 内容层得分 SHALL 不低于 70%（姓名池、词条池、境界名称独有）

#### Scenario: 两个世界相似度检测
- **WHEN** 比较任意两个世界类型在三层的配置
- **THEN** 如果内容层相似度 > 80% 且机制层相似度 > 90%，系统 SHALL 标记为"高度重叠"需优化

### Requirement: 修仙与仙侠差异化验证

修仙（入门世界）和仙侠（进阶世界）SHALL 在以下维度有明显区分：
- 姓名池不得共用（修仙用 `CULTIVATION_NAMES`，仙侠用独立的 `XIANXIA_NAMES`）
- 世界系数差异 SHALL 保持 ≥ 0.2（修仙 1.0，仙侠 1.3）
- 仙侠 SHALL 拥有独特机制（本命飞剑），修仙 SHALL NOT

#### Scenario: 修仙与仙侠姓名池独立
- **WHEN** 检查 `WORLD_NAME_POOLS`
- **THEN** `WORLD_NAME_POOLS['修仙']` SHALL NOT 与 `WORLD_NAME_POOLS['仙侠']` 引用同一对象
- **AND** 仙侠姓名池 SHALL 包含剑修风格姓名（如"剑心""剑兰""凌霄"）

#### Scenario: 修仙和仙侠生成不同风格的世界描述
- **WHEN** 分别生成修仙和仙侠世界的描述
- **THEN** 修仙描述 SHALL 包含"仙门""灵脉""长生"等关键词
- **AND** 仙侠描述 SHALL 包含"剑气""剑道""剑修"等关键词

### Requirement: 世界差异化审查报告

系统 SHALL 在开发模式下输出世界差异化审查报告，包含：
- 每个世界在三层的差异化得分
- 高重叠世界对标记
- 差异化不足维度列表

#### Scenario: 开发模式审查报告输出
- **WHEN** 在开发模式下启动游戏
- **THEN** 控制台 SHALL 输出世界差异化审查报告

### Requirement: 禁止新增"虚影"世界类型

`WorldType` 类型 SHALL 从硬编码的联合类型改为运行时注册的品牌字符串类型。世界类型的有效性校验 SHALL 在运行时通过 `WorldDataRegistry.isValidWorldType(id)` 进行，而非编译时的 TypeScript 联合类型检查。任何新增的世界类型 SHALL 必须通过 Mod 数据文件注册到 `WorldDataRegistry` 中，SHALL NOT 仅在类型系统中声明。

#### Scenario: WorldType 与注册表一致性
- **WHEN** 检查已注册的世界类型列表
- **THEN** 所有 `WorldType` 值 SHALL 在 `WorldDataRegistry` 中有对应的注册条目
- **AND** 系统 SHALL 在启动时输出所有已注册世界类型的审计日志
