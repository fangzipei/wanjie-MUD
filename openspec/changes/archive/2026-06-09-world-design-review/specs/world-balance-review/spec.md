# world-balance-review

世界数值平衡审查，修复系数、属性、境界的矛盾设计，确保世界难度标签与玩家体验一致。

## ADDED Requirements

### Requirement: 末世世界系数与属性解耦

末世世界 SHALL 保持高难度系数（1.5），同时下调基础属性至合理水平。高难度 SHALL 体现在敌人强化（`enemyAttackBonus`/`enemyDefenseBonus`）而非玩家属性起点。

#### Scenario: 末世基础属性下调
- **WHEN** 读取 `WORLD_DATA['末世']`
- **THEN** `baseHp` SHALL 为 90（原 120）
- **AND** `baseAttack` SHALL 为 12（原 16）
- **AND** `enemyAttackBonus` SHALL 为 0.3（原 0.2）
- **AND** `enemyDefenseBonus` SHALL 为 0.25（原 0.15）

#### Scenario: 末世难度标签正确
- **WHEN** 生成末世世界实例且 `ascensionCount = 0`
- **THEN** `world.difficulty` SHALL 为 `'噩梦'`（coefficient 1.5 对应噩梦级）
- **AND** 世界描述 SHALL 包含危险提示

### Requirement: 世界系数与难度等级映射一致性

世界基础系数（`baseCoefficient`）与难度等级（`WorldDifficulty`）的映射 SHALL 全局一致：

| coefficient 范围 | 难度等级 | 示例世界 |
|---|---|---|
| 0.8 - 1.1 | 简单 | 修仙(1.0) |
| 1.1 - 1.3 | 普通 | 魔幻(1.1) |
| 1.3 - 2.0 | 困难 | 仙侠(1.3)、高武(1.3) |
| 2.0 - 3.0 | 噩梦 | 末世(1.5) + 飞升加成 |
| 3.0 - 4.0 | 地狱 | 飞升后选择 |
| 4.0 - 5.0 | 深渊 | 多次飞升后 |

`calculateDifficulty(coefficient)` SHALL 使用此映射表。

#### Scenario: 修仙世界难度为简单
- **WHEN** 修仙世界 `coefficient = 1.0`
- **THEN** `calculateDifficulty(1.0)` SHALL 返回 `'简单'`

#### Scenario: 末世世界难度为噩梦
- **WHEN** 末世世界 `coefficient = 1.5`
- **THEN** `calculateDifficulty(1.5)` SHALL 返回 `'困难'`（基础系数在 1.3-2.0 范围，飞升加成后才进入噩梦）

### Requirement: 基础属性与系数关联约束

世界的 `baseHp` 和 `baseAttack` SHALL 与 `coefficient` 呈**负相关**：系数越高（越难），基础属性越低。SHALL NOT 出现高系数 + 高基础属性的倒挂。

#### Scenario: 属性-系数相关性验证
- **WHEN** 对所有 8 种世界执行 `baseHp ~ coefficient` 相关性检查
- **THEN** Pearson 相关系数 SHALL < -0.3（负相关）
- **AND** 末世 SHALL NOT 同时拥有最高的 coefficient 和最高的 baseHp

### Requirement: 修仙世界降为入门难度

修仙世界 `coefficient` SHALL 从 1.1 下调至 1.0，难度标签 SHALL 为"简单"。作为新玩家的入门世界，修仙应提供最宽容的数值环境。

#### Scenario: 修仙世界系数调整
- **WHEN** 读取 `WORLD_DATA['修仙']`
- **THEN** `coefficient` SHALL 为 1.0
- **AND** `baseHp` SHALL 为 100（保持）
- **AND** `baseAttack` SHALL 为 12（保持）

#### Scenario: 新玩家首次进入修仙世界
- **WHEN** 新玩家（ascensionCount = 0）首次生成修仙世界
- **THEN** `world.difficulty` SHALL 为 `'简单'`
- **AND** `world.actualCoefficient` SHALL 为 1.0

### Requirement: 世界选择难度分布梯度

初始世界选择（ascensionCount = 0）时，SHALL 至少提供 2 个不同难度等级的世界供选择。8 个世界中难度分布 SHALL 覆盖简单到困难至少 3 个等级。

#### Scenario: 初始 8 个世界难度分布
- **WHEN** 首次游戏生成 8 个世界（每种类型一个）
- **THEN** 难度分布 SHALL 覆盖至少 3 个等级（简单/普通/困难）
- **AND** 至少 1 个简单世界（入门推荐）
- **AND** 至少 1 个困难世界（挑战选项）
