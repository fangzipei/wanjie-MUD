## Why

玩家反馈游戏"不好玩"。经过对全部 20+ 游戏系统的深入审查，核心问题归结为三点：**玩家缺乏决策权（所有系统都是"点按钮→看数字变化"）**、**战斗系统有战术框架但无玩家参与（元素克制设计被自动战斗埋没）**、**所有系统只有"数值变大"一种反馈（缺少质变体验和意外惊喜）**。需要在保持现有架构的基础上，系统性地增加玩家选择、战术深度和质变性奖励。

## What Changes

### 核心玩法改造
- **手动战斗重设计**：将战斗从自动结算改为回合制手动选择，玩家每回合可主动选择招式、利用元素克制、管理真气消耗
- **修炼系统风险/收益化**：引入修炼方式选择（稳健/激进/顿悟），不同方式有不同的资源消耗、成功率和惊喜事件概率
- **探索地图Roguelike化**：引入战争迷雾、分支路径（而非全量可见的邻接格）、有意义的路径抉择（未知 vs 已知奖励）

### 游戏深度扩展
- **门派叙事与冲突**：每个门派获得独特的任务线、NPC角色和门派专属机制，而非仅"刷声望→买东西"
- **事件因果系统**：冒险事件的选择产生持久后果，影响后续事件、NPC态度和可解锁内容
- **境界质变节点**：在关键等级/境界突破时解锁全新能力或机制，而非仅数值增长

### 长线成长优化
- **元进程解锁树**：飞升后解锁永久性新机制（而非仅属性加成），使每次重开有新鲜感
- **世界差异化机制**：8种世界类型拥有各自独特的核心玩法循环（科技世界有义体改造、末世有生存资源管理），而非仅文字换皮

## Capabilities

### New Capabilities
- `manual-combat-system`: 手动回合制战斗，玩家每回合选择招式、管理真气、利用元素克制关系
- `cultivation-risk-reward`: 修炼方式选择系统，提供稳健/激进/顿悟三种修炼策略，各有不同风险收益曲线
- `roguelike-exploration`: 探索地图的战争迷雾、分支路径、风险/收益抉择系统
- `faction-narrative`: 门派专属任务线、NPC角色、门派特有机制和门派冲突系统
- `event-consequence-chain`: 事件选择产生持久后果，影响后续事件链和世界状态
- `breakthrough-milestones`: 境界突破时解锁全新机制或能力的质变节点系统
- `ascension-meta-tree`: 飞升后的永久性新机制解锁树，替代纯数值型元进程
- `world-unique-mechanics`: 每种世界类型的独特核心玩法循环，替代纯文本差异

### Modified Capabilities
<!-- 此变更不修改现有 infrastructure/architecture specs，仅新增 gameplay 能力 -->

## Impact

- **受影响文件范围**：
  - `src/lib/game/adventure/` — 探索地图生成、战斗结算逻辑
  - `src/lib/game/cultivation/` — 修炼成功率、突破逻辑
  - `src/lib/game/combat/` — 战斗伤害公式、回合逻辑（如存在则修改，否则新建）
  - `src/lib/game/faction/` — 门派任务、声望系统
  - `src/lib/game/ascension/` — 飞升传承、元进程
  - `src/lib/game/types.ts` — 核心类型扩展
  - `src/lib/data/` — 事件数据、世界数据、门派数据扩展
  - `src/hooks/` — 各系统 Hook 需适配新交互模型
  - `src/components/game/` — 战斗面板、修炼面板、探索面板需重设计 UI

- **依赖关系**：
  - 所有新能力依赖现有核心类型系统（`src/lib/game/types.ts`）
  - `manual-combat-system` 依赖 `balanceConfig.ts` 中的战斗数值
  - `roguelike-exploration` 依赖 `adventure.ts` 的地图生成逻辑
  - `event-consequence-chain` 依赖 `src/lib/data/events.ts` 的事件数据
  - `ascension-meta-tree` 依赖 `ascension/` 的飞升流程

- **风险**：
  - 需保持现有存档兼容性 — 新增字段应为可选
  - 手动战斗需保留自动战斗选项以满足挂机玩家需求
  - 变更范围大，建议按优先级分阶段实施
