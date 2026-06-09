## ADDED Requirements

### Requirement: 核心数据 Mod 化

项目 SHALL 将现有 8 个世界类型的硬编码 TS 数据迁移到 `mods/wanjie-core/` 目录下，以 JSON 格式存储，作为一个特殊的"核心 Mod"。该 Mod SHALL 始终加载且不可被禁用。

#### Scenario: 核心 Mod 存在且有效
- **WHEN** 游戏启动
- **THEN** `mods/wanjie-core/mod.json` SHALL 声明 `id: "wanjie-core"`
- **AND** `mod.json` SHALL 声明 `contentTypes` 包含 `["world", "traits", "dangers", "opportunities", "realms", "factions", "names", "text"]`

#### Scenario: 核心 Mod 数据完整性
- **WHEN** 加载 `wanjie-core` Mod
- **THEN** 系统 SHALL 成功注册全部 8 个世界类型（修仙、高武、科技、魔幻、异能、仙侠、武侠、末世）
- **AND** 每个世界类型 SHALL 有对应的境界体系、词条池、姓名池和世界观文案

### Requirement: 数据迁移策略

现有 `modules/identity/data/` 下的硬编码 TS 数据 SHALL 迁移为 JSON 文件，保留相同的字段结构。迁移后的 TS 文件 SHALL 变为简单的 re-export，从注册中心读取数据。渐进式迁移：第一步创建 JSON 数据文件，第二步将 TS 函数改为从注册中心读取，第三步删除旧硬编码数组。

#### Scenario: 迁移后游戏行为一致
- **WHEN** 使用从注册中心读取的数据生成世界和角色
- **THEN** 生成结果 SHALL 与迁移前（硬编码数据）的行为完全一致
- **AND** 所有现有单元测试 SHALL 继续通过

#### Scenario: 迁移后 TS 文件变为 re-export
- **WHEN** 迁移完成后检查 `modules/identity/data/worldEffectsData.ts`
- **THEN** 文件 SHALL NOT 包含硬编码的数据数组（如 `WORLD_DANGERS = [...]`）
- **AND** 文件 SHALL 从注册中心获取数据（通过 `WorldDataRegistry.getAllDangers()` 等 API）

### Requirement: 迁移后的构建产物

`mods/wanjie-core/` 目录 SHALL 在构建时被复制到 `public/mods/wanjie-core/`，确保静态导出后 Mod 数据可通过 HTTP 访问。

#### Scenario: 静态导出包含核心 Mod 数据
- **WHEN** 执行 `pnpm build` 生成静态导出
- **THEN** `out/mods/wanjie-core/` SHALL 存在且包含所有 JSON 数据文件
- **AND** `out/mods/mod-list.json` SHALL 包含 `wanjie-core` 条目
