# character-select-ui

## Purpose

TBD — see change world-first-selection-flow for full context.

# character-select-ui

世界感知的角色选择界面，展示当前世界的属性体系，角色卡牌反映世界风味。

## ADDED Requirements

### Requirement: 顶部世界信息条

角色选择页顶部 SHALL 展示当前已选世界的信息条，包含世界名称、类型图标和属性体系说明。

#### Scenario: 展示世界属性体系
- **WHEN** 角色选择页渲染且 `selectedWorld` 存在
- **THEN** 页面顶部 SHALL 显示世界名称、类型图标和该世界的 5 个属性名
- **AND** 属性名 SHALL 使用世界对应的显示名（如科技世界显示"智力"而非"灵根"）

#### Scenario: 可返回重新选世界
- **WHEN** 用户在世界信息条点击"返回"或世界名称
- **THEN** 系统 SHALL 清除 `selectedWorld` 并返回 `/world-select`

### Requirement: 角色卡牌使用世界感知的属性标签

角色卡牌中的属性值 SHALL 使用当前世界的属性显示名作为标签。

#### Scenario: 科技世界角色卡牌
- **WHEN** 在科技世界下渲染角色卡牌
- **THEN** 属性标签 SHALL 显示"智力"而非"灵根"
- **AND** 属性标签 SHALL 显示"反应"而非"悟性"

#### Scenario: 修仙世界角色卡牌
- **WHEN** 在修仙世界下渲染角色卡牌
- **THEN** 属性标签 SHALL 显示"灵根"、"悟性"等修仙原名
- **AND** 属性数值的视觉呈现 SHALL 与修仙主题协调

### Requirement: 角色词条展示世界风味

角色卡牌中的出身/特质/性格/天赋词条 SHALL 反映当前世界的语言风格。

#### Scenario: 科技世界词条语言
- **WHEN** 在科技世界下渲染角色
- **THEN** 天赋词条可能为"黑客"、"机械亲和"、"基因优化"
- **AND** 词条描述使用科技语言（如"对代码和系统有着与生俱来的掌控力"）

### Requirement: 角色选择界面叙事化设计

页面整体设计 SHALL 使用游戏叙事风格，而非工具式表单。

#### Scenario: 标题叙事化
- **WHEN** 角色选择页渲染
- **THEN** 标题 SHALL 为"命运之契 · 谁将踏入此界"或类似叙事风格文本
- **AND** SHALL NOT 使用"选择你的角色"这类直白标签

#### Scenario: 空状态引导
- **WHEN** 暂无角色生成（刷新中）
- **THEN** SHALL 显示修仙风格的加载动画（如八卦旋转、灵气汇聚）
- **AND** 文字 SHALL 为"天道推演中…"或类似叙事文本

### Requirement: 角色刷新按钮叙事化

刷新角色的按钮 SHALL 使用游戏叙事语言和修仙风格视觉。

#### Scenario: 刷新按钮
- **WHEN** 角色选择页有刷新功能
- **THEN** 按钮文字 SHALL 为"逆天改命"、"重铸命格"或类似
- **AND** 按钮 SHALL 使用修仙风格的视觉样式（非默认 shadcn button）
