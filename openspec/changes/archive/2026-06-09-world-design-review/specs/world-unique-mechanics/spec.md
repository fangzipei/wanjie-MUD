# world-unique-mechanics

为每个世界类型定义唯一核心机制（USP），确保玩家从当前世界穿越到其他世界时获得有意义的玩法变化。

## ADDED Requirements

### Requirement: 每个世界拥有唯一核心机制

全部 8 种世界类型 SHALL 各自拥有至少一个唯一核心机制（USP）。`hasUniqueMechanics()` 函数 SHALL 对所有 8 种世界类型返回 `true`，修仙除外（作为入门世界）。

#### Scenario: 所有世界 USP 定义完整
- **WHEN** 遍历 8 种 WorldType
- **THEN** 除修仙外，每种世界 SHALL 有定义明确的 USP 名称和描述
- **AND** USP 描述 SHALL 通过 `getUniqueMechanicDescription()` 方法获取

### Requirement: 仙侠世界 — 本命飞剑系统

仙侠世界 SHALL 实现本命飞剑系统：
- 玩家在仙侠世界可获得一柄本命飞剑，拥有独立等级（1-100）和属性
- 战斗时飞剑 SHALL 以一定概率（基础 20%）发动协同攻击
- 飞剑等级提升 SHALL 消耗"剑意"（仙侠世界特有修炼资源）

#### Scenario: 首次进入仙侠世界获得本命飞剑
- **WHEN** 玩家首次进入仙侠世界
- **THEN** 系统 SHALL 为玩家生成一柄初始本命飞剑（等级 1，随机名称）
- **AND** 飞剑信息 SHALL 存储在世界状态中

#### Scenario: 飞剑协同攻击
- **WHEN** 玩家在仙侠世界进行战斗
- **THEN** 每回合有 20% + 飞剑等级 × 0.5% 的概率触发飞剑协同攻击
- **AND** 协同攻击伤害 SHALL 为玩家普通攻击的 30% + 飞剑等级 × 1%

### Requirement: 高武世界 — 气血爆发机制

高武世界 SHALL 实现气血爆发机制：
- 玩家 HP 低于 50% 时，攻击力 SHALL 增加（基于低血量比例）
- 玩家 HP 低于 30% 时，额外获得伤害减免
- 爆发效果有内置冷却（每场战斗最多触发 2 次）

#### Scenario: 低血量触发攻击加成
- **WHEN** 玩家在高武世界战斗且当前 HP < 最大 HP 的 50%
- **THEN** 攻击力 SHALL 增加 `(1 - currentHp/maxHp) × 30%`
- **AND** 该效果在 HP 恢复到 50% 以上后消失

#### Scenario: 濒死触发伤害减免
- **WHEN** 玩家在高武世界战斗且当前 HP < 最大 HP 的 30%
- **THEN** 玩家 SHALL 获得 15% 伤害减免
- **AND** 该效果在 HP 恢复到 30% 以上后消失

### Requirement: 异能世界 — 源能共鸣系统

异能世界 SHALL 实现源能共鸣系统：
- 每次探索后，玩家 SHALL 获得一个随机的临时能力（从异能池中抽取）
- 临时能力持续 3 次探索或 5 次战斗，取先到者
- 临时能力效果 SHALL 包含属性加成、特殊战斗效果或探索增益

#### Scenario: 探索后获得随机能力
- **WHEN** 玩家在异能世界完成一次探索
- **THEN** 系统 SHALL 从异能池中随机抽取一个能力赋予玩家
- **AND** 该能力的持续次数 SHALL 初始化为 3（探索）/ 5（战斗）

#### Scenario: 临时能力过期
- **WHEN** 玩家持有的临时能力剩余次数归零
- **THEN** 该能力 SHALL 被自动移除
- **AND** 下次探索时 SHALL 重新随机获取新能力

### Requirement: 末世世界 — 生存资源系统增强

末世世界的生存资源系统 SHALL 增强：
- 每日消耗生存资源（食物、水），资源归零时玩家属性每日递减
- 探索可获取生存资源
- 生存资源充足时（>70%），玩家 SHALL 获得小幅属性加成（生存奖励）

#### Scenario: 每日资源消耗
- **WHEN** 在末世世界经过 1 游戏日
- **THEN** 系统 SHALL 消耗食物 × 1、水 × 1
- **AND** 若任一资源归零，所有属性每日递减 5%（最低降至 50%）

#### Scenario: 资源充足获得加成
- **WHEN** 玩家食物和水均 > 最大值的 70%
- **THEN** 玩家 SHALL 获得"生存充裕"加成：全属性 + 5%

### Requirement: WorldMechanics 接口扩展 USP 支持

`WorldMechanics` 接口 SHALL 新增 `getUniqueMechanicDescription` 方法，返回该世界 USP 的名称、描述和图标名。

#### Scenario: 获取世界 USP 信息
- **WHEN** 调用 `getWorldMechanics('科技').getUniqueMechanicDescription()`
- **THEN** SHALL 返回 `{ name: '芯片研究', description: '消耗科技点提升芯片等级...', icon: 'Cpu' }`
