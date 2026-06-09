## Context

上次 `world-first-selection-flow` 变更建立了世界优先的流程，并为每个世界定义了属性显示名。但人物系统的核心——词条、姓名、选择界面、背景故事——仍使用修仙单一世界观。本次变更将人物系统完全世界化，并优化两个关键界面的游戏感。

**约束：** 词条系统（traits.ts）已有 `Record<ImpactLevel, TraitDefinition[]>` 结构，按品质分层。世界化需改为 `Record<WorldType, Record<ImpactLevel, TraitDefinition[]>>`，但每个世界至少需要 4(品质)×4(类别)×3(词条)=48 个词条定义。全量实现工作量大，采用**渐进策略**。

## Goals / Non-Goals

**Goals:**
- 词条系统按世界类型分区，优先实现差异最大的3个世界（科技/魔幻/末世），其余复用修仙
- 姓名生成按世界类型使用不同命名池
- 角色选择页新增 WorldInfoBar，删除重复代码，增强世界风味视觉
- 背景故事页重新设计为叙事化双卡片布局

**Non-Goals:**
- 不修改 BaseStats/GrowthStats 底层键名
- 不修改游戏核心战斗/修炼逻辑
- 不修改 Protagonist 结构

## Decisions

### 决策 1：词条按世界渐进分区，共享通用词条

**选择：** traits.ts 结构升级为 `WORLD_TRAIT_DEFINITIONS: Record<WorldType, Record<ImpactLevel, TraitDefinition[]>>`。修仙/仙侠/高武/武侠/异能 5 个世界复用现有修仙词条。科技/魔幻/末世 3 个世界提供全新词条。

**理由：** 词条内容创作量大（每个世界 48+ 条），渐进策略在保证差异化体验的同时控制实现规模。词条描述中使用内部属性键（如"灵根"），UI 层通过 `useStatLabels` 显示世界正确的属性名。

### 决策 2：姓名池按世界类型分组

**选择：** 在 generators.ts 中新增 `WORLD_NAME_POOLS: Record<WorldType, { surnames: string[], maleNames: string[], femaleNames: string[] }>`。

| WorldType | 姓氏风格 | 名字风格 |
|-----------|----------|----------|
| 修仙/仙侠 | 李王张刘陈（中文古风） | 天行/浩然/清雪/梦璃 |
| 高武/武侠 | 同上 + 复姓（慕容/南宫） | 铁心/破军/如烟/霜华 |
| 科技 | 编号/英文混血 | Alex·陈/Nova/Zero/赛博 |
| 魔幻 | 西幻姓氏 | 艾琳·风语者/索林·铁锤 |
| 异能/末世 | 代号/简称 | 铁牙/灰烬/独狼/雷光 |

### 决策 3：角色选择 UI WorldInfoBar 置顶

**选择：** CharacterSelect 组件顶部新增 WorldInfoBar：显示已选世界名称、类型图标、5 个属性显示名、返回按钮（清除选择回 world-select）。

**理由：** 玩家在选角时需要持续感知"这是哪个世界"，属性显示名帮助玩家理解该世界看重什么能力。

### 决策 4：背景故事 UI 改为叙事化双卡片布局

**选择：** BackstoryView 重新设计为：顶部标题"宿命之章"→ 角色卡片（姓名、定位、属性）→ 世界卡片（世界名、类型、难度）→ 故事文本（带世界风味装饰）→ 确认按钮。

**理由：** 当前单卡片纯文本布局太功能化，缺少仪式感。角色+世界双卡片让玩家在确认前最后检视自己的选择。

## Risks / Trade-offs

- **[风险] 词条世界化后生成的角色可能属性差异大** → 缓解：词条的 positiveAttrs/negativeAttrs 保持相同的属性影响幅度，仅名称和描述不同
- **[风险] 姓名池扩展可能导致文件过大** → 缓解：姓名池放在独立 data/namePools.ts 中，generators.ts 仅引用
- **[权衡] 科技/魔幻/末世外的世界复用修仙词条** → 后续迭代补充，优先级基于"与修仙的设定差异度"排序

## Migration Plan

1. traits.ts 结构升级，新增科技/魔幻/末世词条
2. generators.ts 新增世界姓名池 + 使用世界词条池
3. CharacterSelect 新增 WorldInfoBar + 删除重复 sumImpacts
4. BackstoryView 重设计
5. `pnpm ts-check` + `pnpm build` 验证
