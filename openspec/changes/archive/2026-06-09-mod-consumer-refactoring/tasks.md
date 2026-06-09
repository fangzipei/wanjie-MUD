## 1. Mod 加载器增强

- [x] 1.1 `ModManifest` 新增 `required: boolean` 字段（默认 false）
- [x] 1.2 `ModLoader.loadAll()` 支持 required Mod 失败时抛出 `ModLoadError`
- [x] 1.3 `ModLoader` 新增 `getFailedMods()` 方法，返回失败 Mod 列表
- [x] 1.4 更新 `mods/wanjie-core/mod.json` 添加 `"required": true`
- [x] 1.5 更新 `scripts/validate-mods.ts` 支持 `required` 字段校验

## 2. Mod 加载 UI

- [x] 2.1 创建 `src/modules/mod/hooks/useModLoader.ts` — 管理加载状态（loading/ready/error/warnings）
- [x] 2.2 创建 `src/modules/mod/components/ModLoadingOverlay.tsx` — 加载动画 + 进度条
- [x] 2.3 创建 `src/modules/mod/components/ModErrorBanner.tsx` — 非致命警告 Toast
- [x] 2.4 在 `src/app/layout.tsx` 中集成 `ModLoadingOverlay`

## 3. 移除硬编码数据

- [x] 3.1 重构 `modules/identity/data/worldData.ts` — `getWorldData()` 改为注册中心读取
- [x] 3.2 重构 `modules/identity/data/worldEffectsData.ts` — 新增 registry getter，旧导出标记废弃
- [x] 3.3 重构 `modules/identity/data/traits.ts` — 新增 `getTraitPoolFromRegistry()`，旧导出标记废弃
- [x] 3.4 重构 `modules/identity/data/worldTraitPools.ts` — 新增 `getWorldTraitFlavors()`，旧导出标记废弃

## 4. 逻辑层适配

- [x] 4.1 重构 `modules/identity/logic/generators.ts` — `generateWorld()`/`generateWorlds()` 使用注册中心
- [x] 4.2 `modules/identity/data/worldSystem.ts` — 使用中间 getter 函数（TS 通过）
- [x] 4.3 `modules/identity/logic/worldAudit.ts` — 使用中间 getter 函数（TS 通过）

## 5. 叙事与境界模块

- [x] 5.1 `modules/narrative/logic/WorldTextManager.ts` — 使用中间 getter 函数（TS 通过）
- [x] 5.2 `modules/progression/data/realmCore.ts` — 使用中间 getter 函数（TS 通过）

## 6. 重复文件处理

- [x] 6.1 统一 `time/idleSystem.ts` 和 `tower/idleSystem.ts`（保留 time/ 版本，tower/ 改为 re-export）

## 7. 桶文件与导出

- [x] 7.1 创建 `src/modules/mod/index.ts` 桶文件
- [x] 7.2 更新 `src/shared/lib/registry/index.ts`
- [x] 7.3 更新 `src/shared/lib/mod/index.ts`
- [x] 7.4 更新涉及变更模块的 `index.ts`

## 8. 验证

- [x] 8.1 运行 `pnpm test` — 41 tests passing ✓
- [x] 8.2 运行 `pnpm ts-check` — zero errors ✓
- [x] 8.3 运行 `pnpm validate-mods` — 2/2 mods pass ✓
- [ ] 8.4 运行 `pnpm build` — 静态导出成功（待 CI 验证）
- [ ] 8.5 手动测试：`pnpm dev` 启动，验证正常加载 + 故意破坏 mod.json 验证错误提示
