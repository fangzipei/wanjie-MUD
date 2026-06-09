## ADDED Requirements

### Requirement: 示例 Mod 目录结构

项目 SHALL 在根目录提供 `mods/wanjie-template/` 示例目录，包含完整的可复制 Mod 结构。目录结构 SHALL 如下：

```
mods/wanjie-template/
├── mod.json                 # Mod 清单文件，含中文注释
├── data/
│   ├── world.json           # 世界类型定义示例
│   ├── realm.json           # 境界体系定义示例
│   ├── traits.json          # 词条池定义示例
│   ├── dangers.json         # 危险效果定义示例
│   ├── opportunities.json   # 机缘效果定义示例
│   ├── factions.json        # 势力模板定义示例
│   ├── names.json           # 姓名池定义示例
│   └── text.json            # 世界观文案定义示例
└── README.md                # 中文使用说明，包含贡献指南
```

#### Scenario: 复制示例 Mod 目录
- **WHEN** 贡献者将 `mods/wanjie-template/` 复制为 `mods/my-world/`
- **AND** 修改 `mod.json` 中的 `id` 为 `"my-world"`
- **AND** 填写世界数据 JSON 文件
- **THEN** 游戏在下次启动时 SHALL 自动发现并加载 `my-world` Mod

#### Scenario: 示例 Mod 的 README 包含贡献指南
- **WHEN** 贡献者阅读 `mods/wanjie-template/README.md`
- **THEN** 文档 SHALL 包含以下内容：
  - Mod 开发快速入门（复制 → 改名 → 填数据 → 提交 PR）
  - 每个数据文件的字段说明
  - JSON Schema 约束说明（哪些字段必填、值范围等）
  - PR 提交流程说明

### Requirement: 示例数据内容

`wanjie-template` 示例 Mod SHALL 包含一个名为"幻境"的虚构世界类型作为模板示例。该世界 SHALL 不使用真实游戏数据，但 SHALL 包含所有必填字段的中文注释，说明每个字段的含义和取值范围。

#### Scenario: 世界数据模板可读性
- **WHEN** 贡献者打开 `data/world.json`
- **THEN** 文件的 JSON 结构中 SHALL 包含注释（通过 `_comment` 字段）说明每个字段的含义
- **AND** 示例值 SHALL 使用明显为占位符的值（如 `"示例世界名"`、`0`、`"在此填写..."`）

### Requirement: 数据文件 JSON Schema 文档

示例 Mod 目录 SHALL 包含一个 `schema.md` 文件，以表格形式列出所有 Mod 数据类型的 JSON 字段定义（字段名、类型、必填/可选、取值范围、中文说明）。

#### Scenario: Schema 文档完整性
- **WHEN** 贡献者打开 `mods/wanjie-template/schema.md`
- **THEN** 文档 SHALL 包含至少以下数据类型的字段表格：
  - 世界类型（world）
  - 境界体系（realm）
  - 词条定义（traits）
  - 危险效果（dangers）
  - 机缘效果（opportunities）
  - 势力模板（factions）
  - 姓名池（names）
  - 世界观文案（text）
