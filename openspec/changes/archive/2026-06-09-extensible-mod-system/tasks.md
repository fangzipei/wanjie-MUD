## 1. 基础设施 — 注册中心

- [x] 1.1 创建 `shared/lib/registry/` 目录结构（`WorldDataRegistry.ts`、`schemas.ts`、`index.ts`）
- [x] 1.2 实现 `WorldDataRegistry` 单例类：世界类型注册/查询 API（`registerWorldType`、`getWorldType`、`getAllWorldTypes`、`isValidWorldType`）
- [x] 1.3 实现境界体系注册/查询 API（`registerRealmSystem`、`getRealmSystem`）
- [x] 1.4 实现词条池注册/查询 API（`registerTraitPool`、`getTraitPool`）
- [x] 1.5 实现危险/机缘全局池注册/查询 API（`registerDanger`、`registerOpportunity`、`getDangersForWorld`、`getOpportunitiesForWorld`）
- [x] 1.6 实现势力模板注册/查询 API（`registerFactionTemplate`、`getFactionTemplates`）
- [x] 1.7 实现世界观文案注册/查询 API（`registerWorldText`、`getWorldText`）
- [x] 1.8 实现姓名池注册/查询 API（`registerNamePool`、`getNamePool`）
- [x] 1.9 实现数据合并策略（标量覆盖 + 数组追加）
- [x] 1.10 编写注册中心的单元测试

## 2. 基础设施 — Mod 加载器

- [x] 2.1 创建 `shared/lib/mod/` 目录结构（`ModLoader.ts`、`ModManifest.ts`、`ModValidator.ts`、`index.ts`）
- [x] 2.2 定义 `ModManifest` TypeScript 接口和校验 schema
- [x] 2.3 实现 `ModLoader.discoverMods()` — 从 `mod-list.json` 获取 Mod 列表
- [x] 2.4 实现 `ModLoader.loadModManifest()` — fetch 并校验单个 Mod 的 `mod.json`
- [x] 2.5 实现依赖拓扑排序（检测循环依赖、缺失依赖）
- [x] 2.6 实现 `ModLoader.loadModData()` — fetch Mod 数据文件并按类型校验
- [x] 2.7 实现 Mod 数据向 `WorldDataRegistry` 注册
- [x] 2.8 实现加载进度事件发布（`mod-load-progress`、`mod-load-complete`）
- [x] 2.9 实现优雅降级：Mod 不存在或无效时不阻塞游戏启动
- [x] 2.10 编写 Mod 加载器的单元测试

## 3. WorldType 品牌类型化

- [x] 3.1 在 `shared/lib/types.ts` 中定义品牌字符串类型 `ExtensibleWorldType`
- [x] 3.2 实现 `asWorldType(id: string): ExtensibleWorldType | undefined` 工厂函数
- [x] 3.3 实现 `assertWorldType(id: string): ExtensibleWorldType` 断言函数（开发模式专用）
- [x] 3.4 保留旧联合类型为 `WorldType`，新品牌类型为 `ExtensibleWorldType`（渐进迁移）
- [x] 3.5 运行 `pnpm ts-check` 确保类型变更无错误
- [ ] 3.6 运行 `pnpm build` 确保构建成功（待 CI 验证）

## 4. 核心数据 JSON 化（wanjie-core Mod）

- [x] 4.1 创建 `mods/wanjie-core/` 目录和 `mod.json` 清单
- [x] 4.2 将 `WORLD_DATA`（世界基本信息）迁移到 `mods/wanjie-core/data/worlds.json`
- [x] 4.3 将境界体系数据迁移到 `mods/wanjie-core/data/realms.json`
- [x] 4.4 将词条池结构迁移到 `mods/wanjie-core/data/traits.json`（占位，后续充实）
- [x] 4.5 将 `WORLD_DANGERS` 迁移到 `mods/wanjie-core/data/dangers.json`
- [x] 4.6 将 `WORLD_OPPORTUNITIES` 迁移到 `mods/wanjie-core/data/opportunities.json`
- [x] 4.7 将势力模板迁移到 `mods/wanjie-core/data/factions.json`
- [x] 4.8 将姓名池迁移到 `mods/wanjie-core/data/names.json`
- [x] 4.9 将世界观文案迁移到 `mods/wanjie-core/data/text.json`
- [ ] 4.10 编写数据迁移一致性测试（JSON 数据生成的游戏结果与旧 TS 数据一致）— 后续迭代

## 5. 消费端重构

- [ ] 5.1 重构 `modules/identity/data/worldData.ts`：从注册中心读取世界数据，保留旧数据为 fallback
- [ ] 5.2 重构 `modules/identity/data/worldEffectsData.ts`：危险/机缘从注册中心读取
- [ ] 5.3 重构 `modules/identity/data/traits.ts`：词条池从注册中心读取
- [ ] 5.4 重构 `modules/identity/data/worldTraitPools.ts`：从注册中心读取
- [ ] 5.5 重构 `modules/identity/logic/generators.ts`：`generateWorld` 和 `generateWorlds` 使用注册中心
- [ ] 5.6 重构 `modules/identity/logic/worlds/worldSystem.ts`：生成函数使用注册中心数据
- [ ] 5.7 重构 `modules/narrative/logic/WorldTextManager.ts`：支持从注册中心获取文案
- [ ] 5.8 重构 `modules/progression/data/realmCore.ts`：支持从注册中心获取境界体系
- [ ] 5.9 重构 `modules/identity/logic/worldAudit.ts`：审查函数适配注册中心 API
- [ ] 5.10 更新所有 `index.ts` 桶文件，确保新导出正确

## 6. 示例 Mod 和文档

- [x] 6.1 创建 `mods/wanjie-template/` 目录结构
- [x] 6.2 编写示例 `mod.json`
- [x] 6.3 创建示例 `data/world.json`（"幻境"世界）
- [x] 6.4 创建示例 `data/realm.json`、`data/traits.json`、`data/dangers.json`、`data/opportunities.json`
- [x] 6.5 创建示例 `data/factions.json`、`data/names.json`、`data/text.json`
- [x] 6.6 ~~编写 `mods/wanjie-template/schema.md`~~ — 字段说明整合到 README.md 中
- [x] 6.7 编写 `mods/wanjie-template/README.md`（快速入门教程和 PR 贡献指南）

## 7. 构建工具和校验

- [x] 7.1 创建 `scripts/build-mods.ts`：构建时将 `mods/` 复制到 `public/mods/`，生成 `mod-list.json` 索引
- [x] 7.2 创建 `scripts/validate-mods.ts`：校验所有 Mod 的 `mod.json` 和数据文件格式
- [x] 7.3 添加 `pnpm validate-mods` 命令到 `package.json` scripts
- [x] 7.4 添加 `pnpm build-mods` 命令到 `package.json` scripts
- [x] 7.5 将 `build-mods` 集成到 `pnpm build` 流程中
- [ ] 7.6 添加 `pnpm lint:strict` 中对 Mod 数据目录存在的检查 — 后续迭代

## 8. 测试和最终验证

- [x] 8.1 运行 `pnpm test` 确保所有现有测试通过（41 tests passing）
- [x] 8.2 运行 `pnpm ts-check` 确保无类型错误
- [ ] 8.3 运行 `pnpm lint:strict` 确保代码质量 — 后续迭代
- [ ] 8.4 运行 `pnpm build` 确保静态导出成功 — 后续迭代（需完整 CI 环境）
- [x] 8.5 运行 `pnpm validate-mods` 确保核心 Mod 数据校验通过（2/2 mods pass）
- [ ] 8.6 手动测试：创建新 Mod 验证游戏加载 — 后续迭代
