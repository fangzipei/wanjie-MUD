# 万界修行录 — 世界设计文档

> **版本**: 2026-06-09 | **状态**: Phase 1 框架完成，进入审查优化阶段

---

## 目录

1. [概述](#1-概述)
2. [八种世界类型](#2-八种世界类型)
3. [三层设计架构](#3-三层设计架构)
4. [难度与系数系统](#4-难度与系数系统)
5. [境界与成长系统](#5-境界与成长系统)
6. [世界机制系统](#6-世界机制系统)
7. [世界效果系统](#7-世界效果系统)
8. [世界优先游戏流程](#8-世界优先游戏流程)
9. [飞升与世界穿越](#9-飞升与世界穿越)
10. [世界感知系统](#10-世界感知系统)
11. [核心代码索引](#11-核心代码索引)
12. [问题分析](#12-问题分析)
13. [优化方向](#13-优化方向)

---

## 1. 概述

万界修行录的核心 fantasy 是"穿越万界，在不同世界类型中修行成长"。世界系统是整个游戏的骨架——它决定了玩家在哪个世界中冒险、面对怎样的难度、使用怎样的力量体系、以及穿越到新世界时获得怎样的新鲜体验。

### 1.1 设计目标

- **多样性**: 8 种世界类型覆盖修仙、武道、科技、魔法等幻想题材
- **渐进式**: 通过飞升系统，玩家从简单世界逐步进入更高难度世界
- **差异化**: 不同世界有不同的力量体系、术语、危险和机缘
- **可重玩性**: 每次穿越生成随机化的世界参数（名称、特性、危险组合）

### 1.2 当前状态

Phase 1 的世界系统框架已通过 `world-first-flow` 变更完成搭建：
- ✅ 8 种世界类型全部定义并实现
- ✅ 世界优先的选择流程（世界选择 → 角色选择 → 背景故事 → 游戏）
- ✅ 世界感知的角色生成（差异化姓名、词条、属性显示名）
- ✅ 世界感知的境界系统（不同世界有不同大/小境界名称）
- ✅ 飞升/世界穿越系统（含传承、印记、世界状态迁移）
- ⚠️ 差异化深度不足（详见[第12节](#12-问题分析)）

---

## 2. 八种世界类型

### 2.1 世界类型定义

```typescript
// src/shared/lib/types.ts:343
export type WorldType = '修仙' | '高武' | '科技' | '魔幻' | '异能' | '仙侠' | '武侠' | '末世';
```

### 2.2 各世界详细配置

#### 修仙 — 标准修炼世界（入门）

| 维度 | 内容 |
|------|------|
| **系数** | 1.1（普通）→ 建议调整为 1.0（简单） |
| **力量体系** | 炼气化神，以灵力为根基，追求天人合一 |
| **境界体系** | 炼气 → 筑基 → 金丹 → 元婴 → 化神 → 合体 → 大乘 → 渡劫 → 真仙 → 金仙 |
| **修炼资源** | 灵石（actionName: 修炼） |
| **战斗资源** | 真气（abilityName: 招式） |
| **属性显示** | 体质 / 灵根 / 悟性 / 幸运 / 意志（默认名） |
| **基础属性** | HP:100, ATK:12, DEF:6 |
| **独特机制** | ❌ 无（baseline，入门世界） |
| **姓名风格** | 中文古风（李王张刘陈…） |
| **世界命名** | 青云/紫霄/太虚/玄天/昆仑/蓬莱 + 界/域/天/境/州 |

#### 仙侠 — 剑道修行世界

| 维度 | 内容 |
|------|------|
| **系数** | 1.3（困难） |
| **力量体系** | 以剑入道，剑心通明，追求剑道极致 |
| **境界体系** | 剑徒 → 剑士 → 剑师 → 剑宗 → 剑尊 → 剑圣 → 剑仙 → 剑神 → 剑帝 → 剑祖 |
| **修炼资源** | 仙石（actionName: 修仙） |
| **战斗资源** | 仙元（abilityName: 剑诀） |
| **属性显示** | 体质 / 仙根 / 剑心 / 仙缘 / 道心 |
| **基础属性** | HP:100, ATK:15, DEF:6 |
| **独特机制** | ❌ 无（共用修仙 baseline）→ 建议增加**本命飞剑** |
| **姓名风格** | ⚠️ 共用修仙姓名池 |

#### 高武 — 武道通神世界

| 维度 | 内容 |
|------|------|
| **系数** | 1.3（困难） |
| **力量体系** | 以武入道，炼体化神，追求武道巅峰 |
| **境界体系** | 武徒 → 武者 → 武师 → 武宗 → 武王 → 武皇 → 武圣 → 武帝 → 武神 → 破碎虚空 |
| **修炼资源** | 气血丹（actionName: 练功） |
| **战斗资源** | 内力（abilityName: 武功） |
| **属性显示** | 体魄 / 根骨 / 悟性 / 机缘 / 战意 |
| **基础属性** | HP:110, ATK:14, DEF:8 |
| **独特机制** | ❌ 无 → 建议增加**气血爆发** |
| **姓名风格** | 中文古风+复姓（慕容/南宫/欧阳…） |

#### 科技 — 赛博未来世界

| 维度 | 内容 |
|------|------|
| **系数** | 1.2（普通~困难） |
| **力量体系** | 基因改造与机械飞升，科技改变命运 |
| **境界体系** | 列兵 → 少尉 → 中尉 → 上尉 → 少校 → 中校 → 上校 → 少将 → 中将 → 上将 |
| **修炼资源** | 科技点（actionName: 研究） |
| **战斗资源** | 能量（abilityName: 义体模块） |
| **属性显示** | 体能 / 智力 / 反应 / 技术 / 魅力 |
| **基础属性** | HP:90, ATK:15, DEF:5 |
| **独特机制** | ✅ 芯片研究（+5%成功率）+ 义体模块过热冷却 |
| **姓名风格** | 英文混血/代号风（Alex·/Nova·/Zero·…） |

#### 魔幻 — 魔法奇幻世界

| 维度 | 内容 |
|------|------|
| **系数** | 1.1（普通） |
| **力量体系** | 元素魔法与奥术之力，法师追求真理 |
| **境界体系** | 学徒 → 见习法师 → 正式法师 → 高阶法师 → 大法师 → 魔导师 → 大魔导师 → 贤者 → 法神 → 奥术之主 |
| **修炼资源** | 魔晶（actionName: 冥想） |
| **战斗资源** | 法力值（abilityName: 法术） |
| **属性显示** | 力量 / 魔力 / 感知 / 魅力 / 精神 |
| **基础属性** | HP:95, ATK:13, DEF:7 |
| **独特机制** | ✅ 法术记忆槽位（最多4个槽位，探索时可在魔力节点更换） |
| **姓名风格** | 西幻风（风语者/铁锤/星歌…） |

#### 异能 — 都市超能世界

| 维度 | 内容 |
|------|------|
| **系数** | 1.2（普通~困难） |
| **力量体系** | 基因觉醒与异能开发，突破人类极限 |
| **境界体系** | 觉醒者 → E级 → D级 → C级 → B级 → A级 → S级 → SS级 → SSS级 → 超越者 |
| **修炼资源** | 源能（actionName: 觉醒） |
| **战斗资源** | 念力（abilityName: 超能力） |
| **属性显示** | 体能 / 源能 / 感知 / 幸运 / 意志 |
| **基础属性** | HP:85, ATK:14, DEF:6 |
| **独特机制** | ❌ 无 → 建议增加**源能共鸣**（探索后获得随机临时能力） |
| **姓名风格** | 现代都市风（林陈王李…晓峰/宇轩/诗雨…） |

#### 武侠 — 江湖武林世界

| 维度 | 内容 |
|------|------|
| **系数** | 1.0（简单） |
| **力量体系** | 内外兼修，武道通神，成就一代宗师 |
| **境界体系** | 三流 → 二流 → 一流 → 后天 → 先天 → 宗师 → 大宗师 → 传说 → 神话 → 破碎虚空 |
| **修炼资源** | 银两（actionName: 打坐） |
| **战斗资源** | 内力（abilityName: 武功） |
| **属性显示** | 根骨 / 悟性 / 慧根 / 机缘 / 毅力 |
| **基础属性** | HP:80, ATK:11, DEF:7 |
| **独特机制** | ✅ 连招递增（连续使用同门派武功每回合伤害+15%，最多3层） |
| **姓名风格** | 中文古风+复姓（共用高武姓名池） |

#### 末世 — 废土生存世界

| 维度 | 内容 |
|------|------|
| **系数** | 1.5（噩梦）⚠️ |
| **力量体系** | 变异进化，适应废土，成为新时代的霸主 |
| **境界体系** | 幸存者 → 拾荒者 → 猎手 → 变异者 → 进化者 → 领主 → 霸主 → 灾厄 → 天灾 → 新人类 |
| **修炼资源** | 生存物资（actionName: 搜寻） |
| **战斗资源** | 体力（abilityName: 变异能力） |
| **属性显示** | 体质 / 适应性 / 洞察 / 运气 / 意志 |
| **基础属性** | HP:120, ATK:16, DEF:10 |
| **独特机制** | ✅ 生存资源管理（食物/水每日消耗，探索获取） |
| **姓名风格** | 代号/简称风（铁/石/灰…牙/拳/爪…） |

### 2.3 世界数值对比总览

| 世界 | coefficient | baseHp | baseAttack | baseDefense | enemyAtkBonus | enemyDefBonus | 独特机制 |
|------|------------|--------|------------|-------------|---------------|---------------|----------|
| 修仙 | 1.1 | 100 | 12 | 6 | 0 | 0 | ❌ |
| 仙侠 | 1.3 | 100 | 15 | 6 | 0.1 | 0 | ❌ |
| 高武 | 1.3 | 110 | 14 | 8 | 0.1 | 0.1 | ❌ |
| 科技 | 1.2 | 90 | 15 | 5 | 0.15 | 0 | ✅ |
| 魔幻 | 1.1 | 95 | 13 | 7 | 0.05 | 0.05 | ✅ |
| 异能 | 1.2 | 85 | 14 | 6 | 0.1 | 0.05 | ❌ |
| 武侠 | 1.0 | 80 | 11 | 7 | 0 | 0.1 | ✅ |
| 末世 | 1.5 | 120 | 16 | 10 | 0.2 | 0.15 | ✅ |

---

## 3. 三层设计架构

世界差异化通过三个层级实现：

### 第一层：数值层（权重 20%）

**定义**: 影响游戏平衡的纯数值差异。玩家感知弱，但对数值平衡敏感。

**包含内容**:
- 世界系数 (`coefficient`): 影响突破成功率、修炼效率
- 基础属性 (`baseHp`, `baseAttack`, `baseDefense`): 玩家初始属性
- 属性成长率 (`hpPerLevel`, `attackPerLevel` 等): 升级时的属性增长
- 敌人强化 (`enemyAttackBonus`, `enemyDefenseBonus`): 敌人的额外加成
- 境界倍率 (`subRealmMultiplier`, `tierJumpMultiplier`): 境界提升的倍率

**关键代码**: `src/modules/identity/data/worldData.ts` → `WORLD_DATA`

### 第二层：机制层（权重 50%）

**定义**: 改变玩法规则的系统性差异。玩家感知最强，是穿越世界的核心动力。

**包含内容**:
- 修炼机制（资源名称、消耗、成功率修正）
- 战斗机制（MP名称、技能名称、AI策略、特殊战斗规则）
- 探索机制（探索行为名称、特殊地图机制）
- 专属系统（如科技芯片研究、魔幻法术记忆、武侠连招）

**关键代码**: `src/modules/identity/logic/worlds/` → `WorldMechanics` 接口实现

### 第三层：内容层（权重 30%）

**定义**: 影响沉浸感的文案和主题差异。玩家感受直接，但不改变核心玩法。

**包含内容**:
- 世界名称/描述（随机生成池）
- 属性显示名（如科技世界"灵根"→"智力"）
- 境界名称体系（大境界 + 小境界风格）
- 角色姓名池（不同世界使用不同命名风格）
- 词条名称和描述（危险、机缘的文案）
- 势力名称和背景

**关键代码**: `namePools.ts`, `worldData.ts`(statDisplayNames), `realmData.ts`, `worldEffectsData.ts`

---

## 4. 难度与系数系统

### 4.1 世界系数

每个世界有一个基础系数（`baseCoefficient`），决定世界的"困难程度"：

```typescript
// src/modules/identity/data/worldData.ts (各处)
coefficient 范围: 1.0（武侠/简单） ~ 1.5（末世/噩梦）
```

系数的实际作用通过 `WorldDifficulty` 体现：

```typescript
// src/shared/lib/types.ts:346
export type WorldDifficulty = '简单' | '普通' | '困难' | '噩梦' | '地狱' | '深渊';
```

### 4.2 实际系数计算

实际系数 = 基础系数 + 飞升加成：

```typescript
// 飞升加成: 每次飞升 +0.1 (ascensionLogic.ts:462)
const difficulty = 1.0 + (ascensionCount * 0.1);
```

### 4.3 世界选择规则

世界按系数范围分档，不同飞升次数解锁不同档位：

```typescript
// src/modules/identity/data/worldSystem.ts:48-54
{ minAscension: 0, coefficientRange: [0.8, 1.3],  unlockMessage: '初始可选世界' },
{ minAscension: 1, coefficientRange: [1.3, 2.0],  unlockMessage: '解锁困难世界' },
{ minAscension: 3, coefficientRange: [2.0, 3.0],  unlockMessage: '解锁噩梦世界' },
{ minAscension: 5, coefficientRange: [3.0, 4.0],  unlockMessage: '解锁地狱世界' },
{ minAscension: 8, coefficientRange: [4.0, 5.0],  unlockMessage: '解锁深渊世界' },
```

### 4.4 系数与难度的映射

当前 `calculateDifficulty` 将实际系数映射为难度标签。系数越高 → 突破成功率越低 → 敌人越强 → 资源获取越困难。

---

## 5. 境界与成长系统

### 5.1 境界系统架构

```
RealmSystem (interface)
├── mainRealmName: string      // 大境界体系名称（如"修仙境界"）
├── subRealmName: string       // 小境界体系名称（如"重"）
└── tiers: RealmTier[]         // 境界层级数组
    ├── name: string           // 大境界名称（如"炼气"）
    ├── subRealms: string[]    // 小境界名称列表
    └── levelRange: [number, number]  // 等级范围
```

### 5.2 各世界境界体系

每个世界有 10 个大境界 × 10 个小境界 = 100 级：

| 世界 | 大境界风格 | 小境界风格示例 |
|------|-----------|---------------|
| 修仙 | 炼气→筑基→金丹→元婴→… | 一重/二重…/圆满，初期/中期…/大圆满 |
| 仙侠 | 剑徒→剑士→剑师→剑宗→… | 初窥/入门/小成…/通明 |
| 高武 | 武徒→武者→武师→武宗→… | 一重/二重…/圆满 |
| 科技 | 列兵→少尉→中尉→…→上将 | LV1/LV2…/LV10，一品/二品… |
| 魔幻 | 学徒→见习→正式→…→奥术之主 | 1星/2星…/5星，一层/二层… |
| 异能 | 觉醒者→E级→D级→…→超越者 | 一阶/二阶…，LV1/LV2… |
| 武侠 | 三流→二流→一流→后天→… | 一重/二重…/圆满 |
| 末世 | 幸存者→拾荒者→猎手→…→新人类 | 一阶/二阶…，LV1/LV2… |

### 5.3 境界数值公式

**当前**: 所有 8 个世界使用完全相同的成长公式：

```typescript
// src/modules/progression/logic/realmSystem.ts:38-52
// 每小级 +5% 倍率，跨大境界额外 ×1.3
每级倍率: multiplier *= 1.05
跨大境界: multiplier *= 1.30
```

`getRealmMultiplier()` 函数（`realmCore.ts:143`）计算指定等级的总战力倍率。

### 5.4 修炼流派（CultivationPath）

独立于世界类型，所有世界均可选择：

| 流派 | 主属性 | 特色 |
|------|--------|------|
| 体修 | 体质 | 金刚不坏，伤害减免 |
| 剑修 | 灵根 | 暴击专精，多段攻击 |
| 法修 | 灵根 | MP护盾，法术连击 |
| 丹修 | 悟性 | 丹药加成，炼制专精 |
| 魔修 | 意志 | 高风险高回报，生命偷取 |

---

## 6. 世界机制系统

### 6.1 WorldMechanics 接口

```typescript
// src/modules/identity/logic/worlds/types.ts:68-89
export interface WorldMechanics {
  worldType: string;
  getCultivationParams: () => WorldCultivationParams;   // 修炼参数
  getCombatParams: () => WorldCombatParams;             // 战斗参数
  getExplorationParams: () => WorldExplorationParams;   // 探索参数
  customSuccessRate?: (baseRate: number, state: GameState) => number;
  customCombatActions?: (state: ManualBattleState) => BattleAction[];
  customAutoStrategy?: (state: ManualBattleState, strategy: AutoBattleStrategy) => BattleAction;
}
```

### 6.2 各世界机制实现

| 世界 | 实现文件 | customSuccessRate | customAutoStrategy | 特殊系统 |
|------|---------|-------------------|--------------------|----------|
| 修仙 | `cultivationWorld.ts` | 无 | 无 | baseline |
| 仙侠 | `xiānxiáWorld.ts` | 无 | 无 | ⚠️ 仅术语差异 |
| 高武 | `highMartialWorld.ts` | 无 | 无 | ⚠️ 仅术语差异 |
| 科技 | `techWorld.ts` | ✅ +5% | ✅ 过热冷却 | 芯片研究 |
| 魔幻 | `magicWorld.ts` | 无 | ✅ 槽位优先 | 法术记忆(4槽) |
| 异能 | `esperWorld.ts` | 无 | 无 | ⚠️ 仅术语差异 |
| 武侠 | `martialWorld.ts` | 无 | ✅ 连招优先 | 连招递增(3层+45%) |
| 末世 | `wastelandWorld.ts` | 无 | ✅ 生存策略 | 食物/水管理 |

### 6.3 工厂模式注册

```typescript
// src/modules/identity/logic/worlds/factory.ts:19-28
const WORLD_MECHANICS: Record<WorldType, WorldMechanics> = {
  '修仙': cultivationWorld, '仙侠': xiānxiáWorld, '高武': highMartialWorld,
  '科技': techWorld, '魔幻': magicWorld, '异能': esperWorld,
  '武侠': martialWorld, '末世': wastelandWorld,
};

// hasUniqueMechanics(): 仅 科技/武侠/魔幻/末世 返回 true
```

---

## 7. 世界效果系统

### 7.1 危险系统 (WorldDanger)

世界危险是在特定条件下触发的负面效果：

```typescript
// src/modules/identity/data/worldEffectsData.ts:97-109
interface WorldDanger {
  id: string;
  type: 'stat_debuff' | 'resource_drain' | 'enemy_buff' | 'special_mechanic' | 'random_event';
  name: string;
  description: string;
  triggerCondition: { type: TriggerType; chance: number };  // 触发时机+概率
  effect: DangerEffect;
  duration: number;        // -1=永久, 0=即时
  dispellable: boolean;
  dangerLevel: 1|2|3|4|5;
  worldTypes?: WorldType[]; // 空=通用
}
```

**危险效果类型**:
- `stat_debuff`: 属性削弱（如体质-5）
- `resource_drain`: 资源消耗（每回合HP-3）
- `enemy_buff`: 敌人强化（攻击+20%）
- `special_mechanic`: 特殊机制（禁止治疗、无法逃跑、经验减少）
- `random_event`: 随机负面事件

**生成规则** (`worldSystem.ts:149-194`):
- 危险数量由系数决定：`calculateDangerCount(coefficient)`
- 高等级危险有更高权重（`dangerLevel²`）
- 按世界类型过滤（`worldTypes` 字段）
- 不重复选择（`usedIds` 去重）

### 7.2 机缘系统 (WorldOpportunity)

世界机缘是正面增益效果：

```typescript
// src/modules/identity/data/worldEffectsData.ts:112-125
interface WorldOpportunity {
  id: string;
  type: 'stat_buff' | 'resource_gain' | 'special_ability' | 'rare_drop' | 'favorable_event';
  name: string;
  description: string;
  triggerCondition: { type: TriggerType; chance: number };
  effect: OpportunityEffect;
  duration: number;
  opportunityLevel: 1|2|3|4|5;
  conflictsWith?: string[];  // 与危险冲突ID
  worldTypes?: WorldType[];
}
```

**机缘效果类型**:
- `stat_buff`: 属性加成
- `resource_gain`: 资源获取（HP/MP/灵石/经验）
- `special_ability`: 特殊能力（双倍经验、双倍掉落、免费撤退）
- `rare_drop`: 稀有掉落加成（品质提升、额外掉落率）
- `favorable_event`: 有利事件

**生成规则**: 类似危险生成，但排除了与已选危险冲突的机缘。

### 7.3 触发时机

```typescript
type TriggerType = 'on_enter' | 'on_battle_start' | 'on_battle_end' | 'on_turn' | 'on_explore' | 'random';
```

### 7.4 效果适配器

世界效果通过适配器模式转换为统一的 `UnifiedEffect` 格式，用于计算引擎：

```
WorldDangerAdapter    → UnifiedEffect[] (sourceType: 'world_danger')
WorldOpportunityAdapter → UnifiedEffect[] (sourceType: 'world_opportunity')
```

---

## 8. 世界优先游戏流程

### 8.1 流程顺序

```
首页 → 世界选择(/world-select) → 角色选择(/character-select) → 背景故事(/backstory) → 游戏(/game)
```

这是 `world-first-flow` 变更确立的流程，取代了之前的"角色选择 → 世界选择"顺序。

### 8.2 GamePhase 状态机

```typescript
// Phase 联合类型
GamePhase = 'world-select' | 'character-select' | 'backstory' | 'playing'
```

### 8.3 路由守卫

每个页面检查前置条件：
- `/world-select`: 无前置条件（或重定向到 `/game` 如果已在游戏中）
- `/character-select`: 需要 `selectedWorld` 非空，否则重定向到 `/world-select`
- `/backstory`: 需要 `selectedWorld` + `selectedCharacter` 非空
- `/game`: 需要 `protagonist` 非空，否则按层级回退

### 8.4 初始世界生成

首次游戏时生成 8 个世界（每种类型一个），供玩家选择：
- 每个世界使用 `WORLD_DATA[worldType]` 的名称池随机生成名称
- 世界系数使用基础值 `baseCoefficient`（ascensionCount=0 时 `actualCoefficient = baseCoefficient`）
- 生成危险和机缘列表

### 8.5 世界感知角色生成

选择世界后，基于世界类型生成角色：
- 姓名：使用该世界的 `NamePool`（`WORLD_NAME_POOLS[worldType]`）
- 词条：使用该世界的词条池（`WORLD_TRAIT_DEFINITIONS[worldType]`）
- 属性：使用该世界的 `WorldStats` 基础值 + 词条影响

---

## 9. 飞升与世界穿越

### 9.1 飞升流程

```
达成飞升条件 → 飞升挑战战斗 → 传承选择 → 新世界生成 → 世界切换
```

核心状态类型：

```typescript
// src/shared/lib/typesExtension.ts:706
interface AscensionFlowState {
  phase: 'none' | 'battle' | 'inheritance' | 'world_reveal' | 'complete';
  battleResult?: AscensionChallengeResult;
  inheritanceChoice?: InheritanceChoice;
  newWorld?: NewWorldInfo;
  discoveredWorlds: DiscoveredWorld[];
}
```

### 9.2 新世界生成

```typescript
// src/modules/ascension/logic/ascensionLogic.ts:443
function generateNewWorld(ascensionCount: number, currentWorldType: WorldType): NewWorldInfo {
  // 计算权重（飞升次数越多，稀有世界概率越高）
  const weights = calculateWorldWeights(ascensionCount);
  // 排除当前世界
  const availableTypes = allTypes.filter(t => t !== currentWorldType);
  // 加权随机选择
  const selectedType = weightedRandom(availableTypes, weights);
  // 生成名称、特性、难度、资源丰富度、危险等级
  // difficulty = 1.0 + ascensionCount * 0.1
}
```

### 9.3 世界权重

飞升次数影响不同世界的出现概率：

```typescript
// ascensionData.ts:617-627
科技权重 += ascensionCount × 0.5
魔幻权重 += ascensionCount × 0.8
末世权重 += ascensionCount × 1.0
```

### 9.4 传承系统

飞升时可选择传承：
- **传承功法**: 携带 1 本功法到新世界
- **传承装备**: 携带 1 件装备到新世界
- **携带灵石**: 保留部分灵石

### 9.5 世界状态迁移

```typescript
// worldMigration.ts
saveCurrentWorld(state)    → WorldSaveData  // 保存旧世界状态
buildNewWorldState(...)    → Partial<GameState>  // 构建新世界初始状态
restoreWorldState(...)     → Partial<GameState>  // 恢复到之前的世界
```

### 9.6 飞升印记 (AscensionMark)

累计飞升带来的永久加成：

```typescript
interface AscensionMark {
  count: number;                  // 飞升次数
  totalStatBonus: LegacyStats;   // 累计属性加成
  unlockedTitles: string[];       // 已解锁称号
  specialAbilities: string[];     // 特殊能力
  currentTitle: string | null;    // 当前佩戴称号
  rerollAvailable: boolean;       // 是否有重新随机机会
}
```

### 9.7 飞升里程碑

```
次数 1: 飞升者    — 全属性+10, 跨界感知
次数 2: 多界行者  — 全属性+8, 经验获取+10%
次数 3: 世界穿梭者— 全属性+7, 传承等级+2
次数 5: 万界至尊  — 全属性+10, 资源丰富度+20%
次数10: 永恒存在  — 全属性+15, 可携带2功法+2装备
```

---

## 10. 世界感知系统

### 10.1 属性显示名差异化

不同世界使用不同的属性名，但底层仍映射到 5 个标准属性：

| 标准属性 | 修仙 | 高武 | 科技 | 魔幻 | 异能 | 仙侠 | 武侠 | 末世 |
|----------|------|------|------|------|------|------|------|------|
| 体质 | 体质 | 体魄 | 体能 | 力量 | 体能 | 体质 | 根骨 | 体质 |
| 灵根 | 灵根 | 根骨 | 智力 | 魔力 | 源能 | 仙根 | 悟性 | 适应性 |
| 悟性 | 悟性 | 悟性 | 反应 | 感知 | 感知 | 剑心 | 慧根 | 洞察 |
| 幸运 | 幸运 | 机缘 | 技术 | 魅力 | 幸运 | 仙缘 | 机缘 | 运气 |
| 意志 | 意志 | 战意 | 魅力 | 精神 | 意志 | 道心 | 毅力 | 意志 |

### 10.2 姓名池映射

```typescript
// src/modules/identity/data/namePools.ts:58-67
export const WORLD_NAME_POOLS: Record<WorldType, NamePool> = {
  '修仙': CULTIVATION_NAMES,     // 中文古风
  '仙侠': CULTIVATION_NAMES,     // ⚠️ 共用修仙池
  '高武': MARTIAL_NAMES,         // 中文古风+复姓
  '武侠': MARTIAL_NAMES,         // ⚠️ 共用高武池
  '科技': TECH_NAMES,            // 英文混血/代号风
  '魔幻': MAGIC_NAMES,           // 西幻风
  '异能': ESPER_NAMES,           // 现代都市风
  '末世': WASTELAND_NAMES,      // 代号/简称风
};
```

### 10.3 词条池

每个世界有不同的词条池（`WORLD_TRAIT_DEFINITIONS`），影响角色的出身、特性、性格、天赋的随机选项。

### 10.4 术语系统 (Terminology)

`src/modules/narrative/logic/terminology.ts` 提供世界感知的术语翻译，如：
- 修仙世界："修炼" → "修炼"
- 科技世界："修炼" → "研究"
- 魔幻世界："修炼" → "冥想"

---

## 11. 核心代码索引

### 类型定义

| 文件 | 关键类型 |
|------|---------|
| `src/shared/lib/types.ts` | `WorldType`, `WorldDifficulty`, `World`, `WorldFaction`, `WorldImpact`, `CharacterStats`, `StatName`, `StatImpact` |
| `src/shared/lib/typesExtension.ts` | `NewWorldInfo`, `DiscoveredWorld`, `AscensionFlowState`, `AscensionMark`, `AscensionRecord` |
| `src/modules/identity/data/worldData.ts` | `WorldStats`, `WORLD_DATA` |
| `src/modules/identity/data/worldEffectsData.ts` | `WorldDanger`, `WorldOpportunity`, `DangerEffect`, `OpportunityEffect` |
| `src/modules/identity/logic/worlds/types.ts` | `WorldMechanics`, `WorldCultivationParams`, `WorldCombatParams`, `WorldExplorationParams` |
| `src/modules/progression/data/realmCore.ts` | `RealmSystem`, `RealmTier` |
| `src/modules/identity/logic/worlds/worldMigration.ts` | `WorldSaveData`, `WorldMigrationResult` |

### 数据/配置

| 文件 | 内容 |
|------|------|
| `src/modules/identity/data/worldData.ts` | `WORLD_DATA` — 8个世界的完整数值配置 |
| `src/modules/identity/data/worldEffectsData.ts` | `WORLD_DANGERS`, `WORLD_OPPORTUNITIES` — 危险/机缘池 |
| `src/modules/identity/data/worldSystem.ts` | 世界选择规则、危险/机缘生成函数 |
| `src/modules/identity/data/namePools.ts` | `WORLD_NAME_POOLS` — 各世界姓名池 |
| `src/modules/identity/data/worldTraitPools.ts` | `WORLD_TRAIT_DEFINITIONS` — 各世界词条池 |
| `src/modules/identity/data/statDisplayNames.ts` | `getStatDisplayName` — 世界感知属性显示名 |
| `src/modules/ascension/data/ascensionData.ts` | 飞升里程碑、世界名称生成器、世界特性池 |
| `src/modules/progression/data/realmData.ts` | 各世界境界名称和层级配置 |

### 逻辑/纯函数

| 文件 | 关键函数 |
|------|---------|
| `src/modules/identity/logic/generators.ts` | `generateCharacter()`, `generateCharacters()` |
| `src/modules/identity/logic/worlds/factory.ts` | `getWorldMechanics()`, `hasUniqueMechanics()` |
| `src/modules/progression/logic/realmSystem.ts` | `generateRealmConfigs()`, `worldRealms` |
| `src/modules/progression/data/realmCore.ts` | `getRealmName()`, `getRealmMultiplier()`, `getMainRealmName()` |
| `src/modules/ascension/logic/ascensionLogic.ts` | `generateNewWorld()`, `updateAscensionMark()` |
| `src/modules/identity/logic/worlds/worldMigration.ts` | `saveCurrentWorld()`, `buildNewWorldState()`, `restoreWorldState()` |
| `src/shared/lib/calculation/adapters/worldEffectAdapter.ts` | `WorldDangerAdapter`, `WorldOpportunityAdapter` |

### UI/页面

| 文件 | 内容 |
|------|------|
| `src/views/world-select/WorldSelect.tsx` | 世界选择页面（8个世界卡片） |
| `src/views/character-select/CharacterSelect.tsx` | 角色选择页面（含世界信息） |
| `src/views/character-select/WorldInfoBar.tsx` | 世界信息栏（在角色选择页显示） |
| `src/views/home/StartScreen.tsx` | 首页（开始新游戏 → 世界选择） |

---

## 12. 问题分析

### 问题 1：修仙与仙侠高度重叠 🔴 严重

**现象**: 修仙和仙侠在多个维度几乎相同：

| 维度 | 修仙 | 仙侠 | 差异度 |
|------|------|------|--------|
| 姓名池 | `CULTIVATION_NAMES` | `CULTIVATION_NAMES`（同对象引用） | **0%** |
| 独特机制 | 无 | 无 | **0%** |
| 境界数值 | 1.05/1.30 | 1.05/1.30（完全相同） | **0%** |
| 系数 | 1.1 | 1.3 | 仅 0.2 差异 |
| 基础属性 | HP:100/ATK:12 | HP:100/ATK:15 | 仅 ATK 不同 |
| 属性显示名 | 修仙默认 | 剑修风格 | 名称不同 |
| 力量体系 | 炼气修仙 | 剑道修仙 | 主题有差异 |

**影响**: 玩家从修仙世界穿越到仙侠世界，几乎感受不到变化。两个世界占据了 25% 的世界类型，但差异化不足。

### 问题 2：8 世界中仅 4 个有独特机制 🔴 严重

```typescript
// factory.ts:46-48 — 当前实现
hasUniqueMechanics('修仙') → false
hasUniqueMechanics('仙侠') → false  // 与修仙共用 baseline
hasUniqueMechanics('高武') → false  // 与修仙共用 baseline
hasUniqueMechanics('异能') → false  // 与修仙共用 baseline
hasUniqueMechanics('科技') → true   // 芯片研究+过热冷却
hasUniqueMechanics('武侠') → true   // 连招递增
hasUniqueMechanics('魔幻') → true   // 法术记忆槽位
hasUniqueMechanics('末世') → true   // 生存资源管理
```

**影响**: 50% 的世界在玩法层面完全相同，仅靠名称和文案区分。"穿越万界"的核心体验被严重削弱。

### 问题 3：末世数值倒挂 🟡 中等

```
末世: coefficient = 1.5 (最高/最难), baseHp = 120 (最高), baseAttack = 16 (最高)
修仙: coefficient = 1.1 (普通),     baseHp = 100,       baseAttack = 12
武侠: coefficient = 1.0 (最低/最易), baseHp = 80 (最低),  baseAttack = 11 (最低)
```

**矛盾**: 末世号称"噩梦"难度，但给了玩家最高的初始属性。"高难度"标签与实际体验不一致。系数高导致突破成功率低，但高属性又让战斗更轻松——两者互相抵消，让难度设计失去意义。

换个角度：如果末世因为"变异进化"所以玩家属性高，那么 coefficient 不应该也是最高的——因为 coefficient 的语义是"这个世界有多危险"。玩家初始强和世界危险是两个独立的维度，当前设计混淆了它们。

### 问题 4：境界数值公式完全统一 🟡 中等

所有 8 个世界使用完全相同的 `generateRealmConfigs` 公式：
- 每小级：×1.05
- 跨大境界：×1.30

从"炼气一重 → 炼气圆满"和从"幸存者一阶 → 幸存者十阶"的数值成长幅度完全相同。境界名称有差异，但数值节奏没有体现世界特色。

**具体问题**:
- 科技世界应该是"缓慢但稳定"的研究式成长，但实际与修仙的"顿悟式"成长完全相同
- 末世应该是"极端环境快速进化"，但成长曲线与其他世界一致
- 武侠应该是"勤学苦练式"的线性成长，但用的是统一的指数曲线

### 问题 5：生命值差异化缺乏一惯性 🟡 中等

末世 HP 最高（120）、异能 HP 最低（85），但缺乏设计理由：

```
末世(120) > 高武(110) > 修仙(100)=仙侠(100) > 魔幻(95) > 科技(90) > 异能(85) > 武侠(80)
```

系数最高（末世 1.5）的反而 HP 最高——这两者应该是反比关系才能在难度上形成互补。

### 问题 6：危险/机缘系统静态化 🟡 中等

- 危险和机缘在**进入世界时一次性生成**，后续不会变化
- `generateWorldDangers` 和 `generateWorldOpportunities` 是纯随机函数，不随玩家进度动态调整
- 所有世界的危险/机缘效果类型相同（5 种危险类型 + 5 种机缘类型），差异仅体现在名称和数值
- 触发机制依赖 `TriggerCondition.chance` 的概率判定，但实际触发逻辑可能未完全实现

### 问题 7：危险生成逻辑中的 null 安全问题 🟢 轻微

```typescript
// worldSystem.ts:185
const danger = availableDangers.filter(d => !usedIds.has(d.id))[selectedIndex];
```

`selectedIndex` 来自过滤后的数组的 `weightedRandomIndex`，但 `danger` 的获取却是从 `availableDangers.filter(...)` 重新过滤的。由于 `Math.random()` 在两次调用之间可能不同步（理论上权重计算和索引取值之间应使用同一份数据），存在潜在的索引越界风险。

### 问题 8：世界选择页缺乏机制信息展示 🟢 轻微

当前 `WorldSelect.tsx` 展示的每个世界包含：
- 世界名称、类型、描述
- 危险和机缘列表
- 系数和难度标签

但**不包含**该世界的独特机制信息（如"科技世界的芯片研究"、"武侠世界的连招系统"）。玩家在选择世界时无法了解该世界的玩法特色。

### 问题 9：世界效果适配器中的类型安全问题 🟢 轻微

```typescript
// worldEffectAdapter.ts — WorldEffectInput 类型
// 同时被 WorldDangerAdapter 和 WorldOpportunityAdapter 使用
// 但实际上 WorldDanger 和 WorldOpportunity 的结构不完全相同
// 导致了不必要的类型宽松
```

### 问题 10：飞升新世界与初始世界的生成逻辑不统一 🟢 轻微

- **初始世界生成**: 使用 `WORLD_DATA` 的 coefficient/baseHp 等完整数据
- **飞升世界生成**: 使用 `ascensionLogic.generateNewWorld()` 的简化逻辑（仅 `difficulty = 1.0 + ascensionCount * 0.1`）

两套生成逻辑产出的世界数据结构不完全一致，可能导致显示不一致。

---

## 13. 优化方向

### 方向 1：修仙与仙侠差异化 🔴 优先级高

**方案**:
- 修仙定位为"入门世界"：coefficient 降至 1.0，不添加独特机制，保持简单
- 仙侠定位为"剑道专精世界"：新增**本命飞剑系统**作为独特机制
  - 玩家在仙侠世界获得一柄可成长的本命飞剑
  - 战斗时飞剑有概率协同攻击
  - 独立于修仙世界的玩法体验
- 为仙侠创建独立的姓名池（剑修风格）

### 方向 2：补全缺失的独特机制 🔴 优先级高

| 世界 | 建议的 USP |
|------|-----------|
| 高武 | **气血爆发** — HP 低于 50% 时攻击力增加，体现"越战越勇"的武道精神 |
| 异能 | **源能共鸣** — 每次探索后随机获得临时能力，体现"能力觉醒"的不确定性 |

### 方向 3：修复末世数值倒挂 🟡 优先级中

- 保持 coefficient = 1.5（高难度）
- 降低 baseHp: 120 → 90, baseAttack: 16 → 12
- 提升 enemyAttackBonus: 0.2 → 0.3, enemyDefenseBonus: 0.15 → 0.25
- 高难度体现在"敌人更强"，而非"玩家基础属性更高"

### 方向 4：境界数值差异化 🟡 优先级中

在 `RealmSystem` 中增加可选的倍率配置：

| 世界 | subRealmMultiplier | tierJumpMultiplier | 风格 |
|------|--------------------|--------------------|------|
| 修仙 | 1.05 | 1.30 | 标准修仙成长 |
| 仙侠 | 1.05 | 1.30 | 标准剑修成长 |
| 高武 | 1.06 | 1.35 | 武道爆发式突破 |
| 科技 | 1.03 | 1.20 | 科技研究稳定渐进 |
| 魔幻 | 1.06 | 1.30 | 魔法感悟式成长 |
| 异能 | 1.04 | 1.40 | 觉醒跃迁式突破 |
| 武侠 | 1.05 | 1.25 | 勤学苦练式成长 |
| 末世 | 1.08 | 1.50 | 极端环境快速进化 |

### 方向 5：WorldMechanics 接口增强 🟡 优先级中

新增方法：
- `getUniqueMechanicDescription()`: 返回 USP 的名称、描述、图标（用于 UI 展示）
- `onWorldEnter(state)`: 进入世界时的初始化钩子
- `onWorldLeave(state)`: 离开世界时的清理钩子

### 方向 6：世界选择 UI 增强 🟢 优先级低

在世界选择卡片上展示：
- 独特机制名称和图标
- 入门/推荐标签
- 修正后的难度标签

### 方向 7：危险/机缘系统动态化 🟢 优先级低（Phase 2）

- 根据玩家在当前世界的停留时间动态增减危险/机缘
- 增加世界专属的危险/机缘类型（不仅是通用的 5 种）

---

> **文档维护者**: AI Agent | **最后更新**: 2026-06-09
> 
> 本文档描述了万界修行录世界系统的完整设计现状和已知问题。
> 当世界系统发生重大变更时，请同步更新本文档。
