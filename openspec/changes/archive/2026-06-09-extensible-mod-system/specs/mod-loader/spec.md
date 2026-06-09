## ADDED Requirements

### Requirement: Mod 发现与扫描

系统 SHALL 在游戏启动时从 `public/mods/` 目录扫描所有子目录，发现其中包含有效 `mod.json` 的 Mod。Mod 发现 SHALL 通过 HTTP `fetch()` 请求实现，先获取 `public/mods/mod-list.json`（构建时自动生成的 Mod 索引文件），再按需加载各 Mod 的清单。

#### Scenario: 开发模式下扫描 Mod
- **WHEN** 在开发模式（`pnpm dev`）下启动游戏
- **AND** `mods/` 目录中存在 3 个有效 Mod 目录
- **THEN** Mod 加载器 SHALL 发现并成功加载全部 3 个 Mod
- **AND** 每个 Mod 的加载状态 SHALL 在控制台输出

#### Scenario: 生产模式下加载 Mod
- **WHEN** 在静态导出模式下访问游戏页面
- **AND** `public/mods/` 中存在 `mod-list.json` 索引文件
- **THEN** Mod 加载器 SHALL 通过 fetch 获取索引文件
- **AND** 随后按需加载每个 Mod 的数据文件

#### Scenario: 无 Mod 目录时优雅降级
- **WHEN** `public/mods/` 目录不存在或为空
- **THEN** 游戏 SHALL 正常启动，仅使用内置核心数据
- **AND** 控制台 SHALL 输出"未发现 Mod，使用内置数据"

### Requirement: Mod 依赖解析与加载顺序

系统 SHALL 在加载 Mod 数据前解析依赖关系。如果 Mod A 的 `dependencies` 声明依赖 Mod B，则 Mod B SHALL 在 Mod A 之前加载。如果存在循环依赖或无解依赖，系统 SHALL 拒绝加载相关 Mod 并输出错误。

#### Scenario: 拓扑排序正确的依赖链
- **WHEN** Mod A 依赖 Mod B，Mod B 依赖 Mod C
- **THEN** 加载顺序 SHALL 为 C → B → A

#### Scenario: 检测到循环依赖
- **WHEN** Mod A 依赖 Mod B，Mod B 依赖 Mod A
- **THEN** 系统 SHALL 拒绝加载 A 和 B
- **AND** 系统 SHALL 在控制台输出"循环依赖检测"错误，列出涉及的 Mod

#### Scenario: 依赖的 Mod 不存在
- **WHEN** Mod A 声明依赖一个不存在的 Mod ID
- **THEN** 系统 SHALL 拒绝加载 Mod A
- **AND** 控制台 SHALL 输出"缺失依赖"错误

### Requirement: 数据文件加载与校验

系统 SHALL 根据 Mod 清单中的 `dataFiles` 映射，加载每个内容类型对应的 JSON 数据文件。每个数据文件 SHALL 在加载后被类型校验（通过 Zod schema 或手写校验函数）。校验失败的数据文件 SHALL 导致对应内容类型被跳过，且不影响其他内容类型的加载。

#### Scenario: 所有数据文件校验通过
- **WHEN** Mod 声明提供 `world`、`traits`、`dangers` 三种内容类型
- **AND** 所有对应数据文件格式正确
- **THEN** 系统 SHALL 将所有三类数据注册到运行时注册中心

#### Scenario: 部分数据文件校验失败
- **WHEN** Mod 的 `dangers` 数据文件格式不正确（如 `dangerLevel` 字段值超出 1-5 范围）
- **THEN** 系统 SHALL 跳过 `dangers` 数据
- **AND** 系统 SHALL 继续加载 `world` 和 `traits` 数据
- **AND** 控制台 SHALL 输出具体校验错误及所在文件路径

### Requirement: 加载进度与错误上报

系统 SHALL 在加载 Mod 过程中通过游戏事件总线发布加载进度事件，允许 UI 层显示 Mod 加载状态。加载失败的 Mod SHALL 被记录但不应阻止游戏启动。

#### Scenario: Mod 加载进度通知
- **WHEN** Mod 加载器扫描发现 5 个 Mod
- **AND** 正在加载第 3 个 Mod
- **THEN** 事件总线 SHALL 发布 `mod-load-progress` 事件，包含 `{ current: 3, total: 5, currentModId: "..." }`

#### Scenario: Mod 加载完成总结
- **WHEN** 所有 Mod 加载完成（无论成功或失败）
- **THEN** 事件总线 SHALL 发布 `mod-load-complete` 事件
- **AND** 事件数据 SHALL 包含 `{ loaded: number, failed: number, total: number }`
