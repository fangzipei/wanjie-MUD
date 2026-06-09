## Why

`extensible-mod-system` 已建立 Mod 基础设施，但消费端仍从硬编码 TS 数组读取数据——这套"兼容旧模式"的设计背离了 Mod 系统的初衷。本变更彻底移除硬编码数据依赖，让 **所有世界数据（包括内置的 8 个世界）都通过 Mod 加载**。加载失败时向用户展示明确的错误提示，而非静默降级。

## What Changes

- **移除硬编码数据 fallback**：`modules/identity/data/` 下的数据文件不再导出硬编码数组，改为从 `WorldDataRegistry` 读取。如果注册中心无数据，抛出明确错误。
- **wanjie-core 作为强制 Mod**：应用启动时首先加载 `wanjie-core`（内置数据），加载失败则显示致命错误并阻止进入游戏。
- **第三方 Mod 加载失败提示**：非核心 Mod 加载失败时，显示可关闭的警告 Toast/横幅，告知用户"xxx Mod 加载失败"。
- **Mod 加载状态 UI**：提供 `useModLoader` Hook 管理加载状态（loading / loaded / error），UI 层据此展示加载进度和错误。
- **移除重复文件**：统一 `time/idleSystem.ts` 和 `tower/idleSystem.ts`。

## Capabilities

### New Capabilities

- `mod-loading-ui`：Mod 加载状态 UI — 启动时展示加载进度，失败时展示错误提示

### Modified Capabilities

- `mod-loader`：Mod 加载器新增"强制 Mod"概念——标记为 required 的 Mod 加载失败时抛出致命错误
- `core-data-migration`：wanjie-core 从"可选 Mod"变为"强制内置 Mod"

## Impact

- **数据层**：4 个文件移除硬编码数组导出，改为纯注册中心读取
- **逻辑层**：`generators.ts`、`worldSystem.ts`、`worldAudit.ts` 移除 fallback
- **UI 层**：新增 `useModLoader` Hook、`ModLoadingOverlay` 组件
- **应用入口**：`layout.tsx` 添加 Mod 初始化
