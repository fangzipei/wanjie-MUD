# 万界修行录 Mod 开发模板

本目录是一个完整的 Mod 模板，你可以复制它来创建自己的万界修行录世界扩展。

## 🚀 快速开始（5 分钟）

1. **复制模板**
   ```bash
   cp -r mods/wanjie-template mods/my-world
   ```

2. **修改清单**
   - 编辑 `mod.json`，修改 `id` 为你的 Mod ID（如 `my-world`）
   - 修改 `name`、`description`、`author` 等字段

3. **填写数据**
   - 编辑 `data/world.json` — 定义你的世界类型
   - 编辑 `data/realm.json` — 定义境界体系
   - 编辑 `data/traits.json` — 定义专属词条
   - 编辑 `data/dangers.json` — 定义危险效果
   - 编辑 `data/opportunities.json` — 定义机缘效果
   - 编辑 `data/factions.json` — 定义势力模板
   - 编辑 `data/names.json` — 定义姓名池
   - 编辑 `data/text.json` — 定义世界观文案

4. **启动游戏验证**
   ```bash
   pnpm dev
   ```
   在浏览器控制台中查看 Mod 加载日志，确认你的 Mod 被成功加载。

## 📁 Mod 目录结构

```
my-mod/
├── mod.json          # Mod 清单（必须）
├── data/             # 数据文件目录（必须）
│   ├── world.json    # 世界类型定义
│   ├── realm.json    # 境界体系定义
│   ├── traits.json   # 词条池定义
│   ├── dangers.json  # 危险效果定义
│   ├── opportunities.json  # 机缘效果定义
│   ├── factions.json # 势力模板定义
│   ├── names.json    # 姓名池定义
│   └── text.json     # 世界观文案定义
└── README.md         # 说明文档（推荐）
```

## 📋 mod.json 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识，kebab-case 格式（如 `my-world`） |
| `name` | string | ✅ | 显示名称，支持中文 |
| `version` | string | ✅ | 版本号，格式 `主版本.次版本.修订号` |
| `description` | string | ✅ | 简短描述 |
| `author` | string | ✅ | 作者名或 GitHub 用户名 |
| `gameVersion` | string | ✅ | 兼容的游戏版本范围（如 `>=1.0.0`） |
| `dependencies` | string[] | 否 | 依赖的 Mod ID 列表，默认 `[]` |
| `contentTypes` | string[] | ✅ | 提供的内容类型列表 |
| `dataFiles` | object | ✅ | 内容类型到数据文件路径的映射 |

## 📊 数据文件格式

### world.json — 世界类型

```jsonc
{
  "worlds": [
    {
      "id": "string",           // 世界类型唯一标识
      "name": "string",         // 显示名称
      "description": "string",  // 描述
      "baseCoefficient": 1.0,   // 基础难度系数 (0.8-2.0)
      "namePrefixes": ["..."]  // 世界名前缀池
      "nameSuffixes": ["..."],  // 世界名后缀池
      "descriptions": ["..."],  // 世界描述文本池
      "powerSystems": ["..."],  // 力量体系描述池（可选）
      "majorForces": ["..."]    // 主要势力描述池（可选）
    }
  ]
}
```

### 其他数据格式

| 文件 | 顶层 key | 结构说明 |
|------|----------|----------|
| `realm.json` | `{ "worldTypeId": RealmSystem }` | key 为世界类型 ID |
| `traits.json` | `{ "worldTypeId": TraitPool }` | key 为世界类型 ID |
| `dangers.json` | `{ "dangers": [...] }` | 全局危险池，`worldTypes` 字段限定适用范围 |
| `opportunities.json` | `{ "opportunities": [...] }` | 全局机缘池，`worldTypes` 字段限定适用范围 |
| `factions.json` | `{ "worldTypeId": { templates: [...] } }` | key 为世界类型 ID |
| `names.json` | `{ "worldTypeId": NamePool }` | key 为世界类型 ID |
| `text.json` | `{ "worldTypeId": WorldText }` | key 为世界类型 ID |

## ⚠️ 注意事项

- JSON 不支持注释，请使用 `_comment` 字段作为临时注释（会在校验时被忽略）
- 所有 `id` 字段必须全局唯一，不要与 `wanjie-core` 中的 ID 冲突
- 世界类型的 `baseCoefficient` 建议在 0.8-2.0 之间
- 可以依赖 `wanjie-core` 来使用已有的世界类型
- 提交 PR 前请在本地运行 `pnpm validate-mods` 校验数据格式

## 🔗 相关资源

- 项目主页：https://github.com/[your-org]/wanjie-MUD
- 核心 Mod 数据参考：`mods/wanjie-core/data/`
- JSON 字段详细说明：`schema.md`

## 📝 贡献流程

1. Fork 本仓库
2. 复制 `mods/wanjie-template/` 到 `mods/<你的-mod-id>/`
3. 填写 Mod 数据
4. 运行 `pnpm validate-mods` 校验
5. 提交 Pull Request

我们期待你的创意世界！✨
