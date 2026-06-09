# world-aware-names

姓名生成按世界类型使用不同的命名池（中文古风、西幻、代号、英文混血等）。

## ADDED Requirements

### Requirement: 姓名池按世界类型分组

名称生成系统 SHALL 提供 `WORLD_NAME_POOLS: Record<WorldType, { surnames: string[], maleNames: string[], femaleNames: string[] }>`，`generateCharacter(worldType)` SHALL 从对应世界姓名池选取名字。

#### Scenario: 修仙世界使用中文古风名
- **WHEN** 为修仙世界生成角色
- **THEN** 姓氏 SHALL 来自 [李,王,张,刘,陈,杨,赵,黄,周,吴...]
- **AND** 男名 SHALL 来自 [天行,浩然,子轩,逸风...]
- **AND** 女名 SHALL 来自 [清雪,梦璃,紫嫣,灵韵...]

#### Scenario: 科技世界使用代号/英文混血名
- **WHEN** 为科技世界生成角色
- **THEN** 姓名 SHALL 来自科技命名池（如"Alex·陈"、"Zero"、"Nova·林"、"赛博"）
- **AND** SHALL NOT 出现"紫嫣"、"浩然"等古风名

#### Scenario: 魔幻世界使用西幻名
- **WHEN** 为魔幻世界生成角色
- **THEN** 姓名 SHALL 来自魔幻命名池（如"艾琳·风语者"、"索林·铁锤"、"莉亚·星歌"）

#### Scenario: 末世世界使用代号/简称
- **WHEN** 为末世世界生成角色
- **THEN** 姓名 SHALL 来自末世命名池（如"铁牙"、"灰烬"、"独狼"、"雷光"）

### Requirement: 姓名池数据文件独立

姓名池数据 SHALL 存放在 `src/modules/identity/data/namePools.ts` 独立文件中，`generators.ts` SHALL 从此导入。

#### Scenario: 数据与逻辑分离
- **WHEN** 检查 `generators.ts`
- **THEN** SHALL NOT 包含大段姓名数组
- **AND** 姓名数据 SHALL 从 `../data/namePools` 导入
