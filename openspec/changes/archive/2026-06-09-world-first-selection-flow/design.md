## Context

当前新游戏流程为：首页 → 选角页 → 选世界页 → 背景故事页 → 游戏主页。经全面审计发现 10 个问题：数据双源重复、世界系数矛盾、4/8 世界共享同一 mechanics、属性体系全为修仙、存在死代码、小境界搭配违和等。本次变更一并修复。

**约束**：`BaseStats`/`GrowthStats` 接口使用硬编码属性名（体质/灵根/悟性/幸运/意志），被 50+ 处引用。将其完全动态化是一次大型重构。本次采用**显示层映射**方案。

## Goals / Non-Goals

**Goals:**
- 调整新游戏流程为：首页 → 选世界 → 选角色 → 背景故事 → 游戏
- 整合世界数据为单一数据源，删除所有重复定义
- 补全 8 种世界类型的独立 WorldMechanics 实现
- 实现属性显示名按世界映射
- 小境界体系按世界类型限定
- 世界选择/角色选择 UI 重设计
- 修复 worldMigration 类型安全问题

**Non-Goals:**
- 不修改 `BaseStats`/`GrowthStats` 的底层键名结构
- 不修改背景故事页和游戏主页的核心逻辑
- 不改变已存储存档的数据结构
- 不引入新的第三方依赖

## Decisions

### 决策 1：状态机顺序调整为 `world-select → character-select → backstory → playing`

**选择**：修改 `GamePhase` 联合类型，将 `world-select` 移到 `character-select` 之前。

**理由**：World 是 Character 的上下文——角色的属性名、词条、数值范围都由世界决定。先选世界符合依赖方向。

**替代方案**：保持 phase 顺序不变，仅改路由跳转顺序。放弃——会导致 phase 名与路由名不一致。

### 决策 2：属性名采用显示层映射而非底层重构

**选择**：保持 `BaseStats`/`GrowthStats` 键名不变，新增 `getStatDisplayName(statKey, worldType)` 映射函数。在 `WORLD_DATA` 中新增 `statDisplayNames` 字段。

**映射表设计**：
| 内部 Key | 修仙 | 科技 | 魔幻 | 武侠 | 末世 | 仙侠 | 高武 | 异能 |
|----------|------|------|------|------|------|------|------|------|
| 体质 | 体质 | 体能 | 力量 | 根骨 | 体质 | 体质 | 体魄 | 体能 |
| 灵根 | 灵根 | 智力 | 魔力 | 悟性 | 适应性 | 仙根 | 根骨 | 源能 |
| 悟性 | 悟性 | 反应 | 感知 | 悟性 | 洞察 | 剑心 | 悟性 | 感知 |
| 幸运 | 幸运 | 技术 | 魅力 | 机缘 | 运气 | 仙缘 | 机缘 | 幸运 |
| 意志 | 意志 | 魅力 | 精神 | 意志 | 意志 | 道心 | 战意 | 意志 |

**理由**：`BaseStats` 被 50+ 处引用，重构风险极高。显示层映射可在本次变更中完成，存档兼容。

### 决策 3：WORLD_DATA 作为世界唯一数据源

**选择**：删除 `generators.ts` 中的内联 `worldPrefixes`/`worldSuffixes`/`worldDescriptions`，`generateWorld()` 改为从 `WORLD_DATA[worldType]` 读取。删除 `combat/logic/statsCalc.ts` 中重复的 `WORLD_COEFFICIENTS`。

**理由**：当前 3 处定义了世界数据（generators.ts、worldData.ts、statsCalc.ts），且 WORLD_COEFFICIENTS 在两处数值矛盾。统一后新增世界类型只需修改一处。

### 决策 4：补全 8 种 WorldMechanics 实现

**选择**：为 `仙侠`（xiānxiáWorld）、`高武`（martialWorld 复用+覆盖）、`异能`（esperWorld）创建独立实现。删除 `mythWorld`。

**各世界术语设计**：

| WorldType | 修炼行为 | 资源名 | 法力名 | 招式名 | 探索名 |
|-----------|----------|--------|--------|--------|--------|
| 修仙 | 修炼 | 灵石 | 真气 | 功法 | 历练 |
| 仙侠 | 修仙 | 仙石 | 仙元 | 剑诀 | 云游 |
| 高武 | 练功 | 气血丹 | 内力 | 武功 | 闯荡 |
| 科技 | 研究 | 科技点 | 能量 | 义体模块 | 任务 |
| 魔幻 | 冥想 | 魔晶 | 法力值 | 法术 | 冒险 |
| 异能 | 觉醒 | 源能 | 念力 | 超能力 | 巡逻 |
| 武侠 | 打坐 | 银两 | 内力 | 武功 | 闯荡江湖 |
| 末世 | 进化 | 变异点数 | 体力 | 变异能力 | 废土探索 |

### 决策 5：小境界体系按世界类型限定

**选择**：`SUB_REALM_SYSTEMS` 从全局共享改为 `Record<WorldType, Record<string, string[]>>`。

| WorldType | 可用小境界体系 |
|-----------|---------------|
| 修仙/仙侠 | 一至九重、初期至大圆满、入门至大成 |
| 高武/武侠 | 一二三四阶、星级、数字层 |
| 科技 | LV等级、品级、一二三四阶 |
| 魔幻 | 星级、品级、数字层 |
| 异能 | 字母等级(转为F-SSS)、星级、一二三四阶 |
| 末世 | 一二三四阶、数字层、LV等级 |

### 决策 6：世界选择 UI 采用"万象星盘"主题

**选择**：中央旋转星盘，8 世界环绕，两步交互（预览→确认）。武侠标记"推荐新手"（系数 1.0），末世标记"挑战模式"（系数 1.5）。移动端降级为垂直列表。

### 决策 7：删除 mythWorld 死代码

**选择**：删除 `src/modules/identity/logic/worlds/mythWorld.ts`，从 `factory.ts` 和 `hasUniqueMechanics()` 中移除引用。

**理由**：`WorldType` 中没有 `'神话'` 类型，该代码永远无法执行。神话世界的神恩系统设计保留在文档中，后续如需可恢复。

## Risks / Trade-offs

- **[风险] WORLD_COEFFICIENTS 统一后可能影响战斗平衡** → 缓解：以 `identity/data/worldData.ts` 中的值为准，`statsCalc.ts` 改为通过世界系数计算敌人属性的方式而非直接使用系数（系数 1.5 → 敌人属性 × (1 + coefficient * 0.1) 等转换公式）
- **[风险] 删除 mythWorld 可能影响未来计划** → 缓解：保留在 git history 中，本次变更有清晰的 commit message 便于回溯
- **[风险] WorldMechanics 补全可能影响已有世界的游戏体验** → 缓解：仅修改术语层（params），不修改核心玩法逻辑
- **[权衡] 保留 BaseStats 硬编码键名** → 技术债务，后续单独立项

## Migration Plan

1. 整合世界数据：删除重复定义，统一从 WORLD_DATA 读取
2. 修复 WORLD_COEFFICIENTS：statsCalc.ts 导入统一源
3. 补全 WorldMechanics：为仙侠/高武/异能创建实现，删除 mythWorld
4. 修复 SUB_REALM_SYSTEMS：按世界类型限定
5. 属性显示映射：实现 getStatDisplayName + useStatLabels
6. 修改 GamePhase 和路由
7. 更新 useGameState 逻辑
8. 重设计 UI 组件
9. 修复 worldMigration 类型
10. 运行 `pnpm ts-check` + `pnpm build` + `pnpm lint:strict` 验证

**回滚**：恢复 `GamePhase` 定义和路由跳转顺序即可回退流程变更。WorldMechanics 回退需恢复 factory.ts 旧注册表。
