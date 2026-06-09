# character-select-polish

## Purpose

TBD — see change character-feature-polish for full context.

# character-select-polish

角色选择界面完善——WorldInfoBar、世界风味卡牌视觉、重复代码清理。

## ADDED Requirements

### Requirement: WorldInfoBar 世界信息条

角色选择页顶部 SHALL 显示 WorldInfoBar 组件，包含：已选世界名称、世界类型图标/颜色、5 个属性显示名标签、返回按钮（回到世界选择页）。

#### Scenario: WorldInfoBar 显示世界属性体系
- **WHEN** 在科技世界下渲染角色选择页
- **THEN** WorldInfoBar SHALL 显示世界名称、科技类型图标
- **AND** SHALL 展示 5 个科技属性显示名标签（体能/智力/反应/技术/魅力）

#### Scenario: 返回按钮清除世界选择
- **WHEN** 用户点击 WorldInfoBar 的返回按钮
- **THEN** SHALL 清除 `selectedWorld` 并跳转到 `/world-select`

### Requirement: 角色卡牌融入世界风味视觉

角色卡牌 SHALL 使用当前世界的主题色和风格，替代纯性别颜色区分。

#### Scenario: 科技世界卡牌边框为科技色
- **WHEN** 在科技世界渲染角色卡牌
- **THEN** 卡牌边框 SHALL 使用青色/科技蓝主题色
- **AND** 悬停时 SHALL 有扫描线效果

#### Scenario: 魔幻世界卡牌边框为魔幻色
- **WHEN** 在魔幻世界渲染角色卡牌
- **THEN** 卡牌边框 SHALL 使用紫色/魔法风格

### Requirement: 删除重复 sumImpacts 定义

`CharacterSelect.tsx` 中的 `sumImpacts` 函数 SHALL 被删除，SHALL 改为从 `@/modules/identity/logic/generators` 导入。

#### Scenario: sumImpacts 单一定义
- **WHEN** 搜索项目中的 `sumImpacts`
- **THEN** SHALL 仅在 `generators.ts` 中存在定义
- **AND** `CharacterSelect.tsx` SHALL 通过导入使用

### Requirement: Character.background 填充内容

`generateCharacter()` 中的 `background` 字段 SHALL 不再为空字符串，SHALL 填入基于世界类型和出身的简短描述。

#### Scenario: 修仙角色 background
- **WHEN** 修仙世界角色拥有"名门世家"出身
- **THEN** `background` SHALL 为"出身名门世家，自幼接触修行之道，底蕴深厚"

## REMOVED Requirements

### Requirement: CharacterSelect 内联 sumImpacts
**Reason**: 与 generators.ts 中的实现重复，违反 DRY 原则
**Migration**: 删除 CharacterSelect.tsx 中的定义，从 generators 导入
