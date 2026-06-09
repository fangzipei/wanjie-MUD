## Why

当前游戏的所有世界数据（8 种世界类型、境界体系、词条池、危险/机缘效果、世界观文案、势力等）全部硬编码在 TypeScript 文件中。社区贡献者无法通过提交数据文件来添加新世界或扩展内容——任何新世界都需要修改核心类型定义（如 `WorldType` 联合类型）和多处散布的数据文件。本提案建立一套完整的 Mod 可扩展系统，让任何人可以通过 PR 提交纯数据文件来扩充世界设定和游戏内容，使"万界修行录"成为一个真正开放、可扩展的社区驱动游戏。

## What Changes

- **新增 Mod 清单格式**：定义 `mod.json` 标准格式，声明 Mod 的身份、版本、依赖和提供的内容类型
- **新增 Mod 加载器**：运行时（浏览器端）通过 `fetch()` 从 `public/mods/` 发现、校验、加载 Mod 数据，合并到运行时的数据注册中心
- **新增运行时注册中心**：将现有的硬编码数据数组（`WORLD_DANGERS`、`WORLD_OPPORTUNITIES`、`WORLD_TRAIT_DEFINITIONS` 等）改为可扩展的注册中心（Registry 模式），Mod 可向其注册新数据
- **`WorldType` 可扩展化**：将 `WorldType` 从硬编码的联合类型改为 `string` 品牌类型，运行时通过注册中心校验有效性——**BREAKING**
- **内置数据外部化**：将现有的 8 个世界数据从 TS 源码迁移为 `public/mods/wanjie-core/` 下的 JSON 数据文件（核心 Mod）
- **示例 Mod 模板**：在 `mods/` 目录提供可直接复制修改的示例 Mod（如 `mods/wanjie-template/`），包含完整的 JSON 数据结构和中文注释
- **Mod 校验工具**：提供 `pnpm validate-mods` 命令，本地校验 Mod 数据的格式正确性和完整性

## Capabilities

### New Capabilities

- `mod-manifest`: Mod 清单规范——定义 `mod.json` 的标准格式、字段含义、版本兼容性声明
- `mod-loader`: Mod 加载系统——运行时发现、校验、加载 Mod 数据，处理加载优先级和依赖顺序
- `mod-registry`: 运行时注册中心——替代硬编码数据数组，提供 Mod 数据的注册、查询、合并 API
- `mod-example`: 示例 Mod 模板——可复制修改的完整世界 Mod 示例，包含数据结构说明和中文注释
- `core-data-migration`: 核心数据迁移——将现有 8 个世界的硬编码数据重构为 JSON Mod 格式（wanjie-core Mod）

### Modified Capabilities

- `world-differentiation-audit`: 世界差异化审查——审查逻辑需适配新的注册中心 API（数据来源从硬编码数组变为注册中心查询）
- `world-balance-review`: 世界平衡审查——平衡检查需适配注册中心提供的世界数据接口

## Impact

- **类型系统**：`WorldType` 从联合类型变为品牌字符串类型，影响 `shared/lib/types.ts` 及所有使用 `WorldType` 的模块（约 30+ 文件）
- **数据层**：`modules/identity/data/` 下的 `worldEffectsData.ts`、`worldTraitPools.ts`、`worldSystem.ts`、`traits.ts` 需重构为从注册中心获取数据
- **叙事模块**：`modules/narrative/data/worlds/` 下的世界观文案需迁移到 JSON 格式，`WorldTextManager` 需支持 Mod 注册文案
- **构建流程**：需新增 `pnpm validate-mods` 校验脚本，构建时需将 `mods/` 目录复制到 `public/mods/`
- **旧目录保护**：`components/game/`、`hooks/`、`lib/`、`contexts/`、`types/` 等旧目录不受影响，不新增文件
