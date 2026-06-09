## Context

`extensible-mod-system` 建立了基础设施，但采用了"注册中心优先 + 硬编码 fallback"的渐进策略。用户要求彻底移除 fallback，所有数据走 Mod 加载。

**核心原则**：
- 没有 Mod 数据 → 游戏无法运行
- 内置核心数据（wanjie-core）是一个"强制 Mod"，必须加载成功
- 第三方 Mod 失败时给出提示，但不阻塞游戏

## Goals / Non-Goals

**Goals:**
- 移除所有硬编码数据数组的 fallback
- `wanjie-core` 作为强制 Mod，加载失败 → 致命错误
- 第三方 Mod 失败 → 用户可见的警告提示
- 提供 Mod 加载状态 UI（loading / error）

**Non-Goals:**
- 不改变游戏逻辑行为
- 不改变类型定义
- 不增加 Mod 管理界面（后续迭代）

## Decisions

### 1. 数据流：纯 Mod 加载

```
应用启动
  → ModLoader.loadAll()
    → 加载 mod-list.json
    → 分类：required mods（wanjie-core） vs optional mods
    → 先加载 required mods
      → 任一 required 失败 → 抛出致命错误，阻止进入游戏
    → 再加载 optional mods
      → 单个失败 → 记录错误，继续加载其他
  → 数据全部注册到 WorldDataRegistry
  → 游戏模块从注册中心读取（同步 API）
```

### 2. 强制 Mod 机制

`mod.json` 新增 `required: boolean` 字段（默认 false）。`wanjie-core` 设置为 `required: true`。

`ModLoader.loadAll()` 新增逻辑：
- required Mod 加载失败 → 抛出 `ModLoadError`，包含失败 Mod 列表
- optional Mod 加载失败 → 存入 `failedMods` 数组，通过回调通知 UI

### 3. 错误提示 UI

新增 `useModLoader` Hook：
```typescript
interface ModLoaderState {
  phase: 'idle' | 'loading' | 'ready' | 'error';
  progress: { current: number; total: number };
  fatalError: string | null;        // 致命错误（required mod 失败）
  warnings: ModLoadWarning[];       // 非致命警告
}
```

新增 `ModLoadingOverlay` 组件：
- `phase === 'loading'` → 全屏加载动画 + 进度条
- `phase === 'error'` → 错误页面："核心数据加载失败，请刷新页面重试"
- `phase === 'ready'` → 渲染子组件
- 非致命警告 → 页面顶部 Toast 横幅："⚠ xxx Mod 加载失败：<原因>"

### 4. 移除硬编码数据

具体操作：
- `worldData.ts`：删除 `WORLD_DATA` 导出，`getWorldData()` 改为纯注册中心读取
- `worldEffectsData.ts`：删除 `WORLD_DANGERS`/`WORLD_OPPORTUNITIES` 导出
- `traits.ts`：删除 `WORLD_TRAIT_DEFINITIONS` 导出
- `worldTraitPools.ts`：删除 `WORLD_TRAIT_FLAVORS` 导出
- 各文件保留类型定义和纯函数逻辑

### 5. 重复文件处理

`src/modules/time/logic/idleSystem.ts` 和 `src/modules/tower/logic/idleSystem.ts` 完全相同。保留 `time/` 版本，`tower/` 改为 re-export。

## Risks / Trade-offs

- **[风险] wanjie-core 数据不完整导致游戏无法启动** → 缓解：`validate-mods` 脚本在构建时校验数据完整性，CI 环节拦截
- **[风险] 首次加载时 Mod 数据未就绪** → 缓解：`ModLoadingOverlay` 阻塞渲染直到加载完成
- **[权衡] 完全移除 fallback 意味着开发时也必须先构建 Mod 数据** → 接受：`pnpm dev` 前需运行 `pnpm build-mods`，或在 dev 脚本中自动执行

## Migration Plan

1. 先更新 `ModLoader` 支持 required Mod
2. 创建 `useModLoader` Hook 和 `ModLoadingOverlay`
3. 逐个文件移除 fallback
4. 应用入口集成
5. 验证 all green
