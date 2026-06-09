## Why

万界世界系统是游戏的核心差异化支柱——玩家在不同世界类型中应有截然不同的体验。经过 `world-first-flow` 的流程重构和 `world-mechanics-completion` 的机制补全，8 个世界的基础框架已搭建完成。但当前设计存在明显的"名异实同"问题：世界之间在数值、机制、内容上的差异不足以支撑"万界穿越"的核心幻想。需要在进入 Phase 2 大规模内容生产前，系统性审视并优化世界设计的差异化深度。

## What Changes

### 世界差异化审查与优化
- 审查 8 个世界类型的差异化程度，识别"名异实同"的重复设计
- 解决**修仙/仙侠**两个世界相似度过高的问题（命名池共用、系数接近、主题重叠）
- 建立世界差异化的**三层模型**：数值层（coefficient/stats）、机制层（WorldMechanics）、内容层（事件/物品/NPC）
- 为每个世界定义**唯一核心机制**（Unique Selling Point），确保每种世界类型有不可替代的玩法体验

### 世界数值平衡审查
- 审查基础系数（1.0-1.5）与基础属性（baseHp/baseAttack）的对应关系——当前末世同时拥有最高系数(1.5)和最高基础属性(120hp/16atk)，逻辑矛盾
- 审查境界系统在各世界的差异化程度——当前所有世界共用相同的 `generateRealmConfigs` 公式（每级+5%，跨大境界+30%）
- 审查世界危险/机缘系统的触发频率和实际影响

### 世界系统架构优化
- 审查 `WorldMechanics` 接口的完整性和扩展性
- 审查世界选择流程中的难度锁定规则是否提供有意义的渐进体验
- 审查新世界生成（飞升后）的随机化深度

## Capabilities

### New Capabilities
- `world-differentiation-audit`: 8 个世界差异化的完整审查报告，定义每层的差异化深度标准
- `world-unique-mechanics`: 为每个世界定义唯一核心机制（USP），确保玩家穿越世界的动机
- `world-balance-review`: 世界数值平衡审查，修复系数、属性、境界的矛盾设计

### Modified Capabilities
- `world-data-consolidation`: 在已有数据整合基础上，识别并消除修仙/仙侠的数据重叠，明确两者差异化方向
- `world-mechanics-completion`: 在已有机制补全基础上，为修仙/仙侠/高武/异能补充唯一核心机制（当前仅科技/武侠/魔幻/末世有独特机制标记）
- `world-realm-polish`: 在已有境界命名打磨基础上，增加境界数值差异化（不同世界可有不同的每级倍率、大境界跨越倍率）

## Impact

- **数据类型**: `WorldStats` 接口、`WorldType` 联合类型、`WorldMechanics` 接口
- **数据文件**: `src/modules/identity/data/worldData.ts`、`src/modules/identity/data/worldEffectsData.ts`、`src/modules/identity/data/worldSystem.ts`
- **逻辑模块**: `src/modules/identity/logic/worlds/` 下所有世界机制文件、`src/modules/identity/logic/worlds/factory.ts`
- **境界系统**: `src/modules/progression/logic/realmSystem.ts`、`src/modules/progression/data/realmCore.ts`
- **页面**: `src/views/world-select/WorldSelect.tsx`（需展示新的差异化信息）
- **Shared 类型**: 可能需要对 `World` 接口增加字段以支持唯一机制描述
