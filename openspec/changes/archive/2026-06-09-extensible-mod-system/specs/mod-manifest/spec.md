## ADDED Requirements

### Requirement: Mod 清单文件格式

系统 SHALL 支持通过 `mod.json` 文件声明 Mod 的元信息和提供的内容类型。每个 Mod 目录 SHALL 包含一个 `mod.json` 文件，该文件 SHALL 符合以下 JSON Schema：

- `id`: `string` — 全局唯一 Mod 标识符（kebab-case，如 `"wanjie-core"`、`"demon-world"`）
- `name`: `string` — Mod 的显示名称
- `version`: `string` — 语义化版本号（如 `"1.0.0"`）
- `description`: `string` — Mod 的简短描述（中文）
- `author`: `string` — 作者名称或 GitHub 用户名
- `gameVersion`: `string` — 目标游戏版本（语义化版本范围，如 `">=1.0.0"`）
- `dependencies`: `string[]` — 依赖的其他 Mod ID 列表（可选，默认为空数组 `[]`）
- `contentTypes`: `string[]` — 本 Mod 提供的内容类型列表，可选值包括 `"world"`、`"traits"`、`"dangers"`、`"opportunities"`、`"effects"`、`"text"`、`"realms"`、`"factions"`、`"items"`、`"names"`
- `dataFiles`: `Record<string, string>` — 内容类型到数据文件路径的映射（如 `{ "world": "data/world.json" }`）

#### Scenario: 加载有效的 Mod 清单
- **WHEN** Mod 加载器读取一个包含有效 `mod.json` 的 Mod 目录
- **AND** 所有必填字段均存在且类型正确
- **THEN** 系统 SHALL 成功解析 Mod 元信息
- **AND** 系统 SHALL 记录该 Mod 为"就绪"状态

#### Scenario: 缺少必填字段的清单被拒绝
- **WHEN** Mod 加载器读取一个 `mod.json`，且缺少 `id` 或 `version` 字段
- **THEN** 系统 SHALL 拒绝加载该 Mod
- **AND** 系统 SHALL 在控制台输出具体的校验错误信息

#### Scenario: 版本不兼容的 Mod 被跳过
- **WHEN** Mod 的 `gameVersion` 声明为 `">=2.0.0"`，但当前游戏版本为 `"1.0.0"`
- **THEN** 系统 SHALL 跳过该 Mod 的加载
- **AND** 系统 SHALL 在控制台输出警告，说明版本不兼容

### Requirement: 世界类型数据文件格式

每个声明 `contentTypes` 包含 `"world"` 的 Mod SHALL 在其数据文件中提供世界类型定义，格式符合以下结构：

```json
{
  "worlds": [
    {
      "id": "string（世界类型标识，如 demon）",
      "name": "string（世界类型显示名，如 魔域）",
      "description": "string（世界类型描述）",
      "baseCoefficient": "number（基础难度系数）",
      "namePrefixes": ["string（世界名前缀池）"],
      "nameSuffixes": ["string（世界名后缀池）"],
      "descriptions": ["string（世界描述文本池）"]
    }
  ]
}
```

#### Scenario: 加载包含世界定义的 Mod
- **WHEN** Mod 的数据文件包含 1 个或多个世界类型定义
- **AND** 每个世界定义所有必填字段均存在且 `baseCoefficient` 在 0.8-2.0 范围内
- **THEN** 系统 SHALL 将所有世界类型注册到运行时注册中心
- **AND** 新世界类型 SHALL 可通过其 `id` 查询

#### Scenario: 世界定义了重复 ID
- **WHEN** Mod 数据文件包含与已注册世界类型相同的 `id`
- **THEN** 系统 SHALL 输出冲突警告
- **AND** 后加载的 Mod SHALL 覆盖先加载的世界定义（后加载优先）
