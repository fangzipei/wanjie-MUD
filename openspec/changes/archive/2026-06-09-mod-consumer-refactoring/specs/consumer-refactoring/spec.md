## ADDED Requirements

### Requirement: 所有世界数据通过 Mod 加载

系统 SHALL 通过 Mod 加载管线获取所有世界数据，包括内置的 8 个世界类型。`modules/identity/data/` 下的数据文件 SHALL NOT 导出硬编码数据数组。数据读取 SHALL 通过 `WorldDataRegistry` 同步 API 进行。如果注册中心中不存在请求的数据，函数 SHALL 抛出错误。

#### Scenario: 正常加载后读取数据
- **WHEN** `ModLoader.loadAll()` 成功完成
- **AND** 游戏模块调用 `getWorldType('修仙')`
- **THEN** 返回注册中心中对应的世界数据

#### Scenario: 数据未加载时读取
- **WHEN** `ModLoader.loadAll()` 尚未调用或失败
- **AND** 游戏模块尝试读取世界数据
- **THEN** 抛出 `Error('世界数据未加载，请检查 Mod 加载状态')`

### Requirement: wanjie-core 为强制 Mod

`wanjie-core` Mod SHALL 标记为 `required: true`。如果 `wanjie-core` 加载失败，系统 SHALL 阻止用户进入游戏，并显示致命错误信息。

#### Scenario: wanjie-core 加载失败
- **WHEN** `wanjie-core` 的 `mod.json` 或数据文件无法加载
- **THEN** `ModLoader.loadAll()` SHALL 抛出 `ModLoadError`
- **AND** UI SHALL 显示"核心数据加载失败，请刷新页面重试"

### Requirement: 非强制 Mod 加载失败提示

非强制 Mod（第三方 Mod）加载失败时，系统 SHALL 向用户展示警告信息，包含失败 Mod 的名称和原因。警告 SHALL 可关闭，且 SHALL NOT 阻止游戏正常运行。

#### Scenario: 第三方 Mod 加载失败
- **WHEN** 一个非强制 Mod（如 `my-world`）的数据文件校验失败
- **THEN** 系统 SHALL 在页面上方显示 Toast："⚠ Mod "my-world" 加载失败：数据校验不通过"
- **AND** 游戏 SHALL 继续正常运行（使用已成功加载的 Mod 数据）

### Requirement: Mod 加载状态 UI

系统 SHALL 在 Mod 加载期间显示加载状态。加载完成后 SHALL 移除加载界面。如果发生致命错误，SHALL 显示错误页面。

#### Scenario: Mod 加载中
- **WHEN** 应用启动并开始加载 Mod
- **THEN** 显示加载动画和进度："正在加载世界数据... (2/3)"

#### Scenario: Mod 加载成功
- **WHEN** 所有强制 Mod 加载成功
- **THEN** 加载界面消失，游戏正常渲染

## MODIFIED Requirements

### Requirement: Mod 加载器支持强制 Mod

`ModLoader` SHALL 支持 `required` 字段。`mod.json` 中 `required: true` 的 Mod 加载失败时，`loadAll()` SHALL 抛出错误而非优雅降级。

#### Scenario: 混合加载（required + optional）
- **WHEN** 存在 1 个 required Mod 和 2 个 optional Mod
- **AND** required Mod 加载成功，1 个 optional Mod 加载失败
- **THEN** `loadAll()` SHALL 正常返回，`failedMods` 包含失败的 optional Mod
- **AND** required Mod 的数据 SHALL 已在注册中心可用
