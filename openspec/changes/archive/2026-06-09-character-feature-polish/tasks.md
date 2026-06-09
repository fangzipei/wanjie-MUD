## 1. 词条系统世界化

- [x] 1.1 升级 `traits.ts` 结构：`ORIGIN_TRAITS` 等改为 `Record<WorldType, Record<ImpactLevel, TraitDefinition[]>>`
- [x] 1.2 为科技世界编写独立词条（每品质3条，4个类别共约48条，优先实现出身+天赋共24条）
- [x] 1.3 为魔幻世界编写独立词条（优先实现出身+天赋共24条）
- [x] 1.4 为末世世界编写独立词条（优先实现出身+天赋共24条）
- [x] 1.5 其余5个世界类型 fallback 到修仙词条
- [x] 1.6 修改 `selectRandomTrait` 导出按 worldType 选择
- [x] 1.7 修改 `generateCharacter` 使用 `WORLD_TRAIT_DEFINITIONS[worldType]`
- [x] 1.8 更新 traits.ts 和 generators.ts 的导出

## 2. 姓名系统世界化

- [x] 2.1 创建 `src/modules/identity/data/namePools.ts`：定义 8 种世界的姓名池
- [x] 2.2 科技世界姓名池：姓氏（编号/英文前缀）、名字（Alex·陈、Zero、Nova、赛博等）
- [x] 2.3 魔幻世界姓名池：姓氏（风语者、铁锤、星歌等）、名字（艾琳、索林、莉亚等）
- [x] 2.4 末世世界姓名池：代号风格（铁牙、灰烬、独狼、雷光等）
- [x] 2.5 其余世界复用修仙姓名池
- [x] 2.6 修改 `generateCharacter` 使用 `WORLD_NAME_POOLS[worldType]`
- [x] 2.7 更新 identity/index.ts 导出

## 3. 角色选择 UI 完善

- [x] 3.1 创建 `WorldInfoBar.tsx` 组件：世界名、类型图标、属性显示名标签、返回按钮
- [x] 3.2 WorldInfoBar 使用 `useStatLabels` 显示世界正确的属性名
- [x] 3.3 更新 `CharacterSelect.tsx`：顶部插入 WorldInfoBar
- [x] 3.4 角色卡牌边框改为世界主题色（不再用性别蓝/粉）
- [x] 3.5 删除 CharacterSelect.tsx 中重复的 `sumImpacts`，改为从 generators 导入
- [x] 3.6 `generateCharacter` 中 `background` 填入世界风味简短描述
- [x] 3.7 更新 character-select/index.ts 桶文件

## 4. 背景故事 UI 优化

- [x] 4.1 重写 BackstoryView 标题为叙事化格式（含角色名和世界名）
- [x] 4.2 新增角色快照卡片（姓名、定位、属性摘要）
- [x] 4.3 新增世界信息卡片（世界名、类型、难度、势力）
- [x] 4.4 段落间添加世界风味分隔装饰（修仙用云纹、科技用扫描线）
- [x] 4.5 确认按钮文案世界化（6种世界类型各有不同文案）
- [x] 4.6 更新 app/backstory/page.tsx 传入角色和世界信息

## 5. 集成验证

- [x] 5.1 `pnpm ts-check` 类型检查
- [x] 5.2 `pnpm lint:strict` 质量门
- [x] 5.3 `pnpm build` 构建验证
- [x] 5.4 手动验证：各世界类型生成角色词条正确
- [x] 5.5 手动验证：各世界类型角色姓名风格正确
- [x] 5.6 手动验证：角色选择页 WorldInfoBar 正常
- [x] 5.7 手动验证：背景故事页叙事化渲染正常
