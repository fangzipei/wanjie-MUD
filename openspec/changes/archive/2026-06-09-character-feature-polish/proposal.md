## Why

上次世界整理确定了8种世界各有独立的属性体系和术语，但人物系统（词条、姓名、Selection UI、Backstory UI）仍然停留在修仙单一世界观。经审计发现：词条池全为修仙术语（科技世界出现"先天道体"），姓名池只有中文古风名，选角页缺少世界信息条，背 story 界面缺乏世界感和沉浸式游戏体验。人物是玩家与世界的第一个连接点，必须让角色系统与所选世界设定一致。

## What Changes

### 词条系统世界化（审计 P0）
- 为每种世界类型定义独立的出身/特质/性格/天赋词条池
- 科技世界词条：基因优化、黑客天赋、机械亲和、AI共生体
- 魔幻世界词条：元素之子、龙裔血脉、魔法共鸣、精灵血统
- `generateCharacter(worldType)` 实际使用世界对应的词条池（修复上次遗留问题）

### 姓名系统世界化（审计 P1）
- 姓名生成按世界类型使用不同命名池
- 科技世界：英文/代号风（Alex·陈、Zero、Nova）
- 魔幻世界：西幻风（艾琳·风语者、索林·铁锤）
- 末世世界：代号/简称风（铁牙、灰烬、独狼）

### 角色选择 UI 完善（审计 P2）
- 新增 WorldInfoBar：顶部固定世界信息条（世界名、类型图标、属性体系、返回按钮）
- 角色卡牌融入世界风味边框和主题色
- 词条描述中的属性引用使用世界显示名
- 删除 `sumImpacts` 重复定义，改为从 logic 层导入

### 背景故事 UI 优化（审计 P2）
- 叙事化标题："宿命之章 · <角色名>踏入<世界名>"
- 展示角色卡片快照（姓名、定位标签、属性）
- 世界信息卡片（世界名、类型、难度、势力简述）
- 段落渲染增加世界风格装饰（修仙用云纹分隔、科技用扫描线）
- 确认按钮文案世界化（修仙："踏上仙途"、科技："启动征程"）

### 清理与技术优化（审计 P3）
- 删除 `CharacterSelect.tsx` 中重复的 `sumImpacts`，导入 generators 中的版本
- `character.background` 字段不再置空，填入世界风味的简短背景描述

## Capabilities

### New Capabilities
- `world-aware-traits`: 词条系统按世界类型差异化，8种世界各有独立的出身/特质/性格/天赋词条池
- `world-aware-names`: 姓名生成按世界类型使用不同的命名池（中文古风/西幻/代号/英文）
- `character-select-polish`: 角色选择界面完善——WorldInfoBar、世界风味卡牌视觉、重复代码清理
- `backstory-ui-polish`: 背景故事界面优化——叙事化设计、角色+世界双卡片、世界风味装饰

### Modified Capabilities
<!-- 均为新增能力 -->

## Impact

- `src/modules/identity/data/traits.ts` — 词条池从单一修仙改为按 WorldType 分区
- `src/modules/identity/logic/generators.ts` — generateCharacter 使用世界词条池 + 世界姓名池，删除重复 sumImpacts
- `src/views/character-select/CharacterSelect.tsx` — WorldInfoBar组件、世界风味卡牌、删除重复代码
- `src/views/backstory/BackstoryView.tsx` — 叙事化标题、角色/世界信息卡、世界风味装饰
- `src/app/character-select/page.tsx` — 传入 selectedWorld 给 WorldInfoBar
- `src/app/backstory/page.tsx` — 传入 protagonist 额外信息给 BackstoryView
- `src/shared/lib/types.ts` — Character.background 字段语义更新
