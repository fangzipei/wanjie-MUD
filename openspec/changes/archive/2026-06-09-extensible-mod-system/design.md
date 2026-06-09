## Context

当前游戏的所有世界数据硬编码在 TypeScript 源码中。8 种世界类型的名称、系数、境界体系、词条池、危险/机缘效果、世界观文案等散布在 `modules/identity/data/`、`modules/narrative/data/`、`modules/progression/data/` 等多个模块中。`WorldType` 是一个硬编码的联合类型（`'修仙' | '高武' | ...`），新增世界类型需要修改核心类型定义和多处源码。

目标：建立一套纯数据驱动的 Mod 系统，让贡献者通过提交 JSON 数据文件来扩展世界设定和游戏内容。

**关键约束**：
- 项目是 Next.js 16 静态导出（`pnpm build` → `out/`），Mod 在浏览器端通过 HTTP fetch 加载
- 遵循四层架构：Mod 加载逻辑在 `shared/lib/`，Mod 相关组件在 `modules/mod/`，核心数据在 `mods/` 目录
- `WorldType` 变更影响约 30+ 文件，需要渐进式迁移策略

## Goals / Non-Goals

**Goals:**
- 建立标准的 Mod 清单格式（`mod.json`），Mod 为纯 JSON 数据包
- 实现运行时 Mod 发现、加载、校验、注册的完整管线
- 构建 `WorldDataRegistry` 注册中心，替代现有硬编码数据数组
- 将现有 8 个世界的硬编码数据迁移为 `wanjie-core` Mod 的 JSON 数据
- 提供可复制修改的示例 Mod 模板（`mods/wanjie-template/`）
- 提供 `pnpm validate-mods` 命令用于本地校验 Mod 数据

**Non-Goals:**
- 不支持 Mod 添加新的可执行代码（JavaScript/TypeScript）——Mod 仅是数据
- 不在此次变更中支持 Mod 的运行时启用/禁用 UI（后续迭代）
- 不涉及 Steam Workshop 或远程 Mod 仓库集成（后续迭代）
- 不改变旧目录（`components/game/`、`hooks/` 等）的代码
- 不提供 Mod 间的数据覆盖/补丁机制（仅支持追加合并）

## Decisions

### 1. Mod 格式：纯 JSON（而非 TypeScript/JavaScript）

**选择**：Mod 数据以 JSON 文件存储，通过 `fetch()` 在浏览器端加载。

**理由**：
- JSON 不需要编译，任何人都可以编辑（降低贡献门槛）
- 可在运行时校验（Zod schema），失败时优雅降级
- 与 Next.js 静态导出兼容——JSON 文件放在 `public/` 下可通过 HTTP 访问
- 避免了 eval/Function 构造器的安全风险

**替代方案考虑**：
- TypeScript 源文件：需要编译步骤，贡献者需要 Node.js 环境，与静态导出不兼容
- YAML：需要额外解析库，JSON 浏览器原生支持
- TOML：同样需要解析库，生态系统不如 JSON 成熟

### 2. WorldType 可扩展化：品牌字符串类型

**选择**：将 `WorldType` 从联合类型改为品牌字符串类型。

```typescript
// 之前（硬编码联合类型）
type WorldType = '修仙' | '高武' | '科技' | '魔幻' | '异能' | '仙侠' | '武侠' | '末世';

// 之后（品牌字符串类型，运行时校验）
declare const WorldTypeBrand: unique symbol;
type WorldType = string & { [WorldTypeBrand]: true };
```

**理由**：
- 字符串字面量（如 `'修仙'`）可自动赋值给品牌字符串类型——现有代码无需大幅修改
- TypeScript 的 `string` 不能直接赋值给品牌类型（需要类型守卫）——编译时安全
- 运行时通过 `asWorldType(id)` 工厂函数校验，避免无效世界类型流入系统

**迁移策略**：
1. 在 `shared/lib/types.ts` 中定义品牌类型
2. 提供 `asWorldType(id: string): WorldType | undefined` 工厂函数
3. 为开发模式提供 `assertWorldType(id: string): WorldType` 断言函数（抛错而非返回 undefined）
4. 渐进式替换：先改类型定义，再逐个文件替换 `'修仙'` 等字面量为 `asWorldType('修仙')!`，最后移除联合类型

### 3. Mod 加载架构

**选择**：两阶段加载——先扫描索引，再按需加载数据。

```
启动 → fetch /mods/mod-list.json → 解析依赖拓扑 → 并行 fetch 各 Mod 的 mod.json
→ 按依赖顺序加载数据文件 → Zod 校验 → 注册到 WorldDataRegistry → 发出加载完成事件
```

**理由**：
- `mod-list.json` 是构建时生成的索引文件，避免了运行时扫描目录的需要（浏览器无法 list 目录）
- 两阶段允许先展示加载进度，再逐步填充数据
- 拓扑排序确保依赖 Mod 的数据先注册

### 4. 注册中心设计：单例 Registry 模式

**选择**：`WorldDataRegistry` 为单例类，提供类型安全的 CRUD API。

```
shared/lib/
├── types.ts                    # WorldType 品牌类型、核心接口
├── registry/
│   ├── WorldDataRegistry.ts    # 注册中心单例
│   ├── schemas.ts              # Zod 校验 schema
│   └── index.ts
```

**API 设计**：
```typescript
class WorldDataRegistry {
  // 世界类型
  registerWorldType(data: WorldTypeData): void
  getWorldType(id: string): WorldTypeData | undefined
  getAllWorldTypes(): string[]
  isValidWorldType(id: string): boolean

  // 境界体系
  registerRealmSystem(worldTypeId: string, realm: RealmSystem): void
  getRealmSystem(worldTypeId: string): RealmSystem | undefined

  // 词条池
  registerTraitPool(worldTypeId: string, pool: WorldTraitPool): void
  getTraitPool(worldTypeId: string): WorldTraitPool | undefined

  // 危险/机缘（全局池，通过 worldTypes 字段筛选）
  registerDanger(danger: WorldDanger): void
  registerOpportunity(opportunity: WorldOpportunity): void
  getDangersForWorld(worldTypeId: string): WorldDanger[]
  getOpportunitiesForWorld(worldTypeId: string): WorldOpportunity[]

  // ... 其他数据类型
}
```

**理由**：
- 单例避免多实例间的数据不一致
- 类型安全 API 避免运行时类型错误
- 查询方法（如 `getDangersForWorld`）封装筛选逻辑

### 5. 数据合并策略

**选择**：Last-Write-Wins（标量字段）+ 追加合并（数组字段）。

| 数据类型 | 合并策略 | 示例 |
|----------|----------|------|
| 世界基本数据（WorldTypeData） | 覆盖 | Mod B 覆盖 Mod A 的相同 worldTypeId |
| 词条池（TraitPool） | 追加 | Mod A 和 B 的 trait 合并 |
| 危险/机缘（Danger/Opportunity） | 追加 | 所有 Mod 的 danger 合并到全局池 |
| 境界体系（RealmSystem） | 覆盖 | 后加载的覆盖先加载的 |
| 世界观文案（WorldText） | 浅合并 | 后加载的字段覆盖先加载的 |

**理由**：
- 数组类型追加合并确保 Mod 之间的内容不互相覆盖
- 标量类型覆盖确保"后加载优先"原则，允许 Mod 修改基础设置

### 6. 目录结构设计

```
mods/                          # Mod 源目录（项目根目录）
├── wanjie-core/               # 核心 Mod（8 个内置世界）
│   ├── mod.json
│   └── data/
│       ├── worlds.json
│       ├── realms.json
│       ├── traits.json
│       ├── dangers.json
│       ├── opportunities.json
│       ├── factions.json
│       ├── names.json
│       └── text.json
├── wanjie-template/           # 示例 Mod 模板
│   ├── mod.json
│   ├── schema.md              # JSON Schema 文档
│   ├── README.md
│   └── data/
│       └── ...（同上结构）
└── .gitkeep                   # 确保目录被 git 跟踪
```

**构建时**：`mods/` 目录被脚本复制到 `public/mods/`，同时生成 `public/mods/mod-list.json` 索引。

**理由**：
- `mods/` 在根目录方便贡献者发现和编辑
- 构建时复制确保只有有效 Mod 进入生产构建
- 索引文件避免运行时目录扫描

## Risks / Trade-offs

- **[风险] 品牌类型 `WorldType` 可能导致现有代码中 `switch` 语句失去穷举检查**
  → 缓解：为 `WorldType` 提供 `asConstWorldType(id)` 辅助函数，保留对 8 个核心类型的字面量类型推断；外挂 Mod 的世界类型通过 `string` 分支处理

- **[风险] JSON 格式不支持注释，可能降低 Mod 可读性**
  → 缓解：使用 `_comment` 字段作为 JSON 注释约定；在 `schema.md` 中提供详尽的字段说明

- **[风险] Mod 加载失败可能导致游戏数据不完整**
  → 缓解：`wanjie-core` 始终加载且不可跳过；Mod 加载失败时优雅降级（跳过该 Mod 的数据类型）

- **[风险] 静态导出后新增 Mod 需要重新构建**
  → 缓解：这是静态站点的固有限制。后续可考虑从 CDN 加载 Mod 数据（`mod-list.json` 中支持绝对 URL）

- **[权衡] Last-Write-Wins + 追加合并可能不够灵活（如 Mod 想删除某个 danger）**
  → 后续迭代可增加 `patch` 内容类型，支持 Mod 声明数据覆盖/删除操作

## Migration Plan

1. **Phase 1: 基础设施** — 创建 `shared/lib/registry/`、定义品牌 `WorldType`、Mod 加载器
2. **Phase 2: 数据迁移** — 将 8 个世界数据从 TS 迁移到 JSON（`wanjie-core` Mod）
3. **Phase 3: 消费端重构** — 逐个模块将数据读取从硬编码数组改为注册中心 API
4. **Phase 4: 示例和文档** — 创建 `wanjie-template` 示例 Mod、`schema.md`、`README.md`
5. **Phase 5: 工具和验证** — 实现 `pnpm validate-mods`、构建脚本

回滚策略：Phase 1 中保留旧数据文件不变，旧代码和新注册中心并行运行。迁移完成后删除旧硬编码数据。

## Open Questions

1. **Mod 的加载时机**：是在游戏启动页面就加载所有 Mod，还是在进入世界选择页时按需加载？（建议：启动时加载，避免世界选择页卡顿）

2. **Mod 数据的热更新**：开发模式下是否需要 watch `mods/` 目录变化并自动重新加载？（建议：首次实现只做启动时加载，后续迭代添加热更新）

3. **Mod 版本的兼容性策略**：当游戏版本升级时，旧 Mod 是否自动兼容？是否需要 `gameVersion` 的 semver range 匹配？（建议：`mod.json` 的 `gameVersion` 使用 semver range 声明兼容版本）

4. **核心 Mod 的覆盖限制**：外挂 Mod 是否可以覆盖 `wanjie-core` 中的世界数据？（建议：可以覆盖标量字段，但核心 8 个世界类型不可被删除）
