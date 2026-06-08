## Phase 1: 核心循环改造（直接影响每分钟操作体验）

### 1. 类型定义与数据准备

- [ ] 1.1 扩展 `src/lib/game/types.ts`：新增 `BattleState`、`BattleAction`、`CultivationStrategy`、`FogCell`、`RevealedMap` 类型
- [ ] 1.2 扩展 `Player` 接口：新增 `cultivationCooldown?: number`、`equippedTechniques?: TechniqueSlot[]` 可选字段
- [ ] 1.3 扩展 `GameState` 接口：新增 `eventHistory?: EventRecord[]`、`worldFlags?: Record<string, unknown>` 可选字段
- [ ] 1.4 运行 `pnpm ts-check` 确保新增类型无冲突

### 2. 手动战斗系统（manual-combat-system）

- [ ] 2.1 在 `src/lib/game/combat/` 下创建 `battleMachine.ts`：实现回合制纯函数 `executeBattleAction(state: BattleState, action: BattleAction, seed: number) => BattleResult`
- [ ] 2.2 实现元素克制计算函数 `calculateElementalModifier(attackerElement, defenderElement) => number`，基于现有克制表
- [ ] 2.3 实现招式选择验证：检查真气是否足够、是否处于冷却
- [ ] 2.4 实现防御指令逻辑：伤害减免40%、真气恢复5%
- [ ] 2.5 实现逃跑判定：速度比公式 `successRate = playerSpeed / (playerSpeed + enemySpeed)`
- [ ] 2.6 实现AI自动战斗策略（激进/保守/均衡三种），供自动战斗使用
- [ ] 2.7 在 `src/hooks/` 创建 `useBattle.ts`：管理战斗状态机生命周期（初始化→回合循环→结算）
- [ ] 2.8 改造战斗组件 `src/components/game/BattlePanel.tsx`：展示手动操作界面（招式列表+元素克制标注+HP/MP条）
- [ ] 2.9 添加自动战斗切换按钮和策略选择下拉框
- [ ] 2.10 编写 `battleMachine.test.ts` 测试：攻击/防御/逃跑/真气不足/战斗胜利/战斗失败场景

### 3. 修炼风险/收益系统（cultivation-risk-reward）

- [ ] 3.1 在 `src/lib/game/cultivation/cultivation.ts` 中扩展 `cultivate()` 函数：增加 `strategy: CultivationStrategy` 参数
- [ ] 3.2 实现稳健修炼分支：标准消耗/成功率/收益，失败返50%灵石
- [ ] 3.3 实现激进修炼分支：双倍消耗/低成功率/高收益/意外突破10%概率
- [ ] 3.4 实现顿悟尝试分支：零消耗/极低成功率/高收益/顿悟印记/冷却期
- [ ] 3.5 实现修炼暴击事件生成：`generateCultivationCritEvent(player, seed)` 纯函数
- [ ] 3.6 改造修炼 Hook `src/hooks/cultivation/useCultivation.ts`：支持策略参数传递和冷却期管理
- [ ] 3.7 改造修炼面板组件：三种策略按钮+冷却计时器+暴击事件弹窗
- [ ] 3.8 编写 `cultivation.test.ts` 测试：三种策略场景/暴击触发/冷却期限制

### 4. Roguelike探索系统（roguelike-exploration）

- [ ] 4.1 在 `src/lib/game/adventure/` 创建 `fogOfWar.ts`：实现迷雾计算纯函数 `calculateVisibility(map, playerPos, revealedCells) => VisibleMap`
- [ ] 4.2 实现路径提示生成：`generatePathHints(map, playerPos, revealedCells) => PathHint[]`
- [ ] 4.3 扩展地图生成器：支持高风险路径（高精英概率+高掉落）、安全路径（高休息点/宝箱+低奖励）
- [ ] 4.4 实现Boss随机位置放置（边缘区域，非固定底行）
- [ ] 4.5 实现Boss预警逻辑：距离检测+特殊标记显示
- [ ] 4.6 改造探索 Hook `src/hooks/adventure/useAdventure.ts`：集成迷雾状态管理
- [ ] 4.7 改造探索地图组件：渲染迷雾覆盖层+路径提示+分支标记+Boss预警
- [ ] 4.8 保留快速扫荡选项（扫荡时自动处理迷雾奖励为固定值）
- [ ] 4.9 编写 `fogOfWar.test.ts` 测试：迷雾揭露/已探索保留/路径提示/Boss预警

## Phase 2: 深度扩展（叙事深度与成长反馈）

### 5. 事件因果链系统（event-consequence-chain）

- [ ] 5.1 扩展 `src/lib/data/events.ts` 中的事件数据结构：增加 `prerequisite?: EventPrerequisite`、`branches?: EventBranch[]`、`consequences?: Consequence[]`
- [ ] 5.2 在 `src/lib/game/events/events.ts` 实现 `matchEventWithHistory(event, history) => EventDef` 纯函数
- [ ] 5.3 实现5条事件链定义（每条3-5事件），存储于 `src/lib/data/eventChains.ts`
- [ ] 5.4 实现后果传递逻辑：NPC关系值、状态标记、世界状态变更
- [ ] 5.5 在 `GameState` 的 `eventHistory` 字段中追加事件记录
- [ ] 5.6 改造事件选择 UI：显示可用的分支选项（因历史选择而异）
- [ ] 5.7 编写事件链测试：前置条件匹配/分支选择/跨次事件链延续

### 6. 门派叙事系统（faction-narrative）

- [ ] 6.1 在 `src/lib/data/factionData.ts` 中为每个门派扩展：任务线数据（6个连续任务）、NPC数据（2-3个命名NPC含对话树）
- [ ] 6.2 在 `src/lib/game/faction/` 创建 `factionQuests.ts`：任务进度管理 `updateQuestProgress(state, questAction) => GameState`
- [ ] 6.3 实现NPC对话树系统：`getDialogueTree(npc, playerFactionState) => DialogueNode[]`
- [ ] 6.4 实现门派冲突事件生成：`generateFactionConflict(worldState) => FactionConflictEvent`
- [ ] 6.5 实现冲突后果：敌意门派弟子额外遭遇概率、门派商店价格浮动
- [ ] 6.6 改造门派界面组件：NPC对话面板+任务线追踪+冲突事件弹窗
- [ ] 6.7 编写门派系统测试：任务线推进/NPC对话分支/冲突事件触发

### 7. 突破质变节点系统（breakthrough-milestones）

- [ ] 7.1 在 `src/lib/game/cultivation/` 创建 `milestones.ts`：定义突破里程碑注册表（6个等级节点的解锁内容）
- [ ] 7.2 扩展突破函数 `breakthrough(state, seed)`：检测是否命中里程碑等级，返回 `{ newState, milestone? }`
- [ ] 7.3 实现每个质变节点的解锁逻辑：招式系统解锁(10级)、炼制解锁(20级)、道侣系统(30级)、领域展开(45级)、分神化身(60级)、飞升资格(80级)
- [ ] 7.4 实现质变突破仪式UI：全屏界面+专属动画+叙事文本+概率可视化
- [ ] 7.5 实现质变突破失败保护：50%进度保留+下次15%成功率加成+最多3次必成功
- [ ] 7.6 编写里程碑测试：各节点解锁正确性/失败保护累计/UI触发

## Phase 3: 长线成长（飞升后内容和世界差异化）

### 8. 飞升元进程树（ascension-meta-tree）

- [ ] 8.1 在 `src/lib/game/ascension/` 创建 `metaTree.ts`：定义15个节点及三分支树结构（战斗/修炼/探索之道各5层）
- [ ] 8.2 实现传承点数计算：`calculateMetaPoints(completionStats) => number`（基础5+成就奖励0-10）
- [ ] 8.3 实现节点解锁与应用：`canUnlockNode(node, progress) => boolean`、`applyMetaNode(nodeId, gameState) => GameState`
- [ ] 8.4 实现元进程持久化：localStorage 读写 `meta_progress` key
- [ ] 8.5 创建飞升世界选择界面：8张世界卡片含机制说明+难度+专属奖励预览
- [ ] 8.6 创建元进程树UI组件：三分支树状图+节点详情+已解锁/可解锁状态
- [ ] 8.7 编写元进程树测试：点数计算/节点解锁/效果应用/持久化读写

### 9. 世界独特机制（world-unique-mechanics）

- [ ] 9.1 在 `src/lib/game/` 创建 `worlds/` 目录：定义 `WorldMechanics` 接口
- [ ] 9.2 实现修仙世界 mechanics（baseline — 标准修炼+战斗+探索，保持现有逻辑）
- [ ] 9.3 实现科技世界 mechanics：研究替代修炼+义体模块三槽位+过热冷却机制+科技点资源
- [ ] 9.4 实现武侠世界 mechanics：打坐替代修炼+内力资源+武功连招递增机制+神兵宝甲双槽位
- [ ] 9.5 实现魔法世界 mechanics：冥想替代修炼+法力值+法术记忆槽位（4槽位/每探索可换1次）
- [ ] 9.6 实现末世世界 mechanics：饱腹度+水源生存槽+进化替代修炼+变异能力树+资源点
- [ ] 9.7 实现神话世界 mechanics：祭祀替代修炼+神恩值+赐福/神降+神迹事件
- [ ] 9.8 创建 `getWorldMechanics(worldType): WorldMechanics` 工厂函数
- [ ] 9.9 改造核心 Hook（`useCultivation`/`useAdventure`/`useBattle`）：通过 worldMechanics 获取当前世界的行为函数
- [ ] 9.10 编写世界切换迁移逻辑：旧世界数据存档+新世界初始化
- [ ] 9.11 编写各世界 mechanics 测试：科技过热冷却/武侠连招叠加/魔法记忆槽位/末世生存消耗/神话神降

### 10. 集成验证与清理

- [ ] 10.1 运行 `pnpm ts-check` 确保所有类型无错误
- [ ] 10.2 运行 `pnpm lint:strict` 确保代码质量
- [ ] 10.3 运行 `pnpm test` 确保所有测试通过
- [ ] 10.4 运行 `pnpm build` 确保构建成功
- [ ] 10.5 手动测试：创建新角色→修炼（切换三种策略）→探索（迷雾+分支路径）→战斗（手动选招式+元素克制）
- [ ] 10.6 手动测试：门派任务线→事件链触发→突破里程碑→飞升→元进程树→新世界类型
- [ ] 10.7 验证存档向后兼容：加载旧存档确认无崩溃，所有新增字段使用默认值
