## 1. 世界数据整合（审计问题 1、2、10）

- [x] 1.1 删除 `generators.ts` 中的内联 `worldPrefixes`、`worldSuffixes`、`worldDescriptions` 常量
- [x] 1.2 修改 `generateWorld()` 从 `WORLD_DATA[worldType]` 读取名称前缀/后缀/描述
- [x] 1.3 修改 `generateWorlds()` 同样从 `WORLD_DATA` 读取
- [x] 1.4 将 `generators.ts` 中的 `worldTypes` 常量移至 `worldData.ts` 并导出（作为世界类型权威列表）
- [x] 1.5 删除 `combat/logic/statsCalc.ts` 中重复的 `WORLD_COEFFICIENTS`，改为从 `@/modules/identity/data/worldData` 导入
- [x] 1.6 修改 `statsCalc.ts` 中使用系数的逻辑：将世界系数作为难度乘数而非直接属性系数（如 `1 + coefficient * 0.1`），使身份数据和战斗数据语义一致
- [x] 1.7 在 `WorldStats` 接口中新增 `statDisplayNames: Record<string, string>` 字段
- [x] 1.8 为 `WORLD_DATA` 中全部 8 种世界类型填充 `statDisplayNames`
- [x] 1.9 更新 `src/modules/identity/index.ts` 桶文件，导出新增内容

## 2. 世界机制补全（审计问题 3、4、9）

- [x] 2.1 创建 `src/modules/identity/logic/worlds/xiānxiáWorld.ts`：仙侠世界机制（仙石/仙元/剑诀/云游）
- [x] 2.2 创建 `src/modules/identity/logic/worlds/highMartialWorld.ts`：高武世界机制（气血丹/内力/武功/闯荡），可复用 martialWorld 部分逻辑
- [x] 2.3 创建 `src/modules/identity/logic/worlds/esperWorld.ts`：异能世界机制（源能/念力/超能力/巡逻）
- [x] 2.4 更新 `factory.ts`：注册表改为 8 个独立映射，每种 WorldType 映射到独立实现
- [x] 2.5 删除 `src/modules/identity/logic/worlds/mythWorld.ts`
- [x] 2.6 从 `factory.ts` 移除 `mythWorld` 导入和注册
- [x] 2.7 修复 `hasUniqueMechanics()` 移除 `'神话'` 引用
- [x] 2.8 更新 `src/modules/identity/logic/worlds/index.ts` 桶文件

## 3. 境界体系优化（审计问题 6）

- [x] 3.1 修改 `SUB_REALM_SYSTEMS` 类型从 `Record<string, string[]>` 改为 `Record<WorldType, Record<string, string[]>>`
- [x] 3.2 为每种 WorldType 定义可用的小境界集合：
  - 修仙/仙侠：一至九重、初期至大圆满、入门至大成
  - 高武/武侠：一二三四阶、星级、数字层
  - 科技：LV等级、品级、一二三四阶
  - 魔幻：星级、品级、数字层
  - 异能：一二三四阶、星级、数字层（异能世界不用字母等级避免与境界名冲突）
  - 末世：一二三四阶、数字层、LV等级
- [x] 3.3 修改 `generateRealmSystem()` 从 `SUB_REALM_SYSTEMS[worldType]` 选取小境界
- [x] 3.4 确保每种世界类型至少 2 种小境界可选（兜底通用：一二三四阶、星级）

## 4. 属性显示映射（审计问题 5）

- [x] 4.1 在 `src/modules/identity/data/statDisplayNames.ts` 中实现 `getStatDisplayName(statKey, worldType)` 纯函数，从 `WORLD_DATA[worldType].statDisplayNames` 读取
- [x] 4.2 创建 `src/modules/identity/hooks/useStatLabels.ts`：`useStatLabels(worldType)` Hook，返回 labels 映射和 displayNames 数组
- [x] 4.3 更新 `src/modules/identity/index.ts` 导出

## 5. 状态机与路由重排

- [x] 5.1 修改 `GamePhase` 类型定义为 `'world-select' | 'character-select' | 'backstory' | 'playing'`
- [x] 5.2 更新 `src/app/page.tsx`：`startNewGame()` 后跳转到 `/world-select`
- [x] 5.3 更新 `src/app/world-select/page.tsx`：移除 `selectedCharacter` 检查，选中世界后生成角色并跳转 `/character-select`
- [x] 5.4 更新 `src/app/character-select/page.tsx`：路由守卫改为检查 `selectedWorld` 存在，选中角色后跳转 `/backstory`
- [x] 5.5 更新 `src/app/game/page.tsx`：路由回退逻辑调整为新的阶段顺序
- [x] 5.6 更新 `src/app/backstory/page.tsx`：路由守卫适配新顺序

## 6. useGameState 逻辑调整

- [x] 6.1 修改 `startNewGame()`：只生成世界列表（调用 `generateWorlds()`），设置 `phase: 'world-select'`，不生成角色
- [x] 6.2 修改 `selectWorld()`：选中世界后触发 `generateCharacters(world.type)`，设置 `phase: 'character-select'`
- [x] 6.3 修改 `selectCharacter()`：选中角色后清除 `worlds` 数组，设置 `phase: 'backstory'`
- [x] 6.4 存档恢复逻辑兼容：检测到旧存档 phase 为旧顺序时自动修正

## 7. 世界感知角色生成

- [x] 7.1 修改 `generateCharacters()` 函数签名，增加 `worldType: WorldType` 参数
- [x] 7.2 创建 `src/modules/identity/data/worldTraitPools.ts`：为 8 种世界类型定义差异化的出身/特质/性格/天赋词条池
- [x] 7.3 修改 `generateCharacter()` 内部从 `WORLD_TRAIT_POOLS[worldType]` 读取词条定义
- [x] 7.4 更新 `src/modules/identity/index.ts` 导出

## 8. 世界选择界面重设计（万象星盘）

- [x] 8.1 创建 `WorldCard.tsx`：单个世界卡片的沉浸式视觉组件（世界类型图标、颜色主题、纹理背景、辉光悬停）
- [x] 8.2 创建 `StarDisk.tsx`：中央星盘装饰组件（CSS 旋转动画、`prefers-reduced-motion` 适配）
- [x] 8.3 创建 `WorldDetail.tsx`：世界详情展开面板（属性体系、势力、危险、机缘、难度）
- [x] 8.4 重写 `WorldSelect.tsx`：组合星盘 + 世界卡片，实现点击展开→确认两步交互，移动端降级为垂直列表
- [x] 8.5 武侠世界（系数 1.0）标记"推荐新手"，末世世界（系数 1.5）标记"挑战模式"
- [x] 8.6 为 8 种世界类型添加独特的 CSS 自定义属性（`--world-primary`、`--world-accent`）
- [x] 8.7 更新 `src/views/world-select/index.ts` 桶文件

## 9. 角色选择界面重设计（世界感知）

- [x] 9.1 创建 `WorldInfoBar.tsx`：顶部世界信息条（世界名、类型图标、属性体系说明、返回按钮）
- [x] 9.2 修改 `CharacterSelect.tsx`：接收 `worldType` prop，使用 `useStatLabels` 替换硬编码属性名
- [x] 9.3 角色卡牌属性标签渲染从 `useStatLabels` 获取世界对应的显示名
- [x] 9.4 刷新按钮文字改为"逆天改命"，使用修仙风格视觉（border 装饰、光泽动画）
- [x] 9.5 页面标题和空状态文案叙事化（"命运之契·谁将踏入此界"、"天道推演中…"）
- [x] 9.6 更新 `src/app/character-select/page.tsx`：传入 `worldType` 和世界信息给 CharacterSelect
- [x] 9.7 更新 `src/views/character-select/index.ts` 桶文件

## 10. 首页 UI 调整

- [x] 10.1 更新 `StartScreen.tsx` 标题和引导文字，增加世界观铺垫（如"万界之门已开启…择一方天地，书写你的传奇"）
- [x] 10.2 "开始新游戏"按钮改为叙事化文案（如"踏入万界"），添加修仙风格视觉装饰
- [x] 10.3 导入存档按钮保持功能但统一样式风格

## 11. 类型安全修复（审计问题 8）

- [x] 11.1 `worldMigration.ts` 中 `WorldSaveData.worldType` 从 `string` 改为 `WorldType`
- [x] 11.2 `buildNewWorldState()` 的 `newWorldType` 参数从 `string` 改为 `WorldType`
- [x] 11.3 `getWorldMechanics()` 的 `worldType` 参数从 `string` 改为 `WorldType`

## 12. 集成验证

- [x] 12.1 运行 `pnpm ts-check` 确保无类型错误
- [x] 12.2 运行 `pnpm lint:strict` 确保通过 ESLint + 文件大小检查
- [x] 12.3 运行 `pnpm build` 确保静态构建成功
- [x] 12.4 运行 `pnpm test` 确保现有测试通过
- [x] 12.5 手动验证完整流程：首页 → 选世界 → 选角色 → 背景故事 → 游戏
- [x] 12.6 验证旧存档加载兼容性
- [x] 12.7 验证移动端布局（世界选择列表、角色选择适配）
- [x] 12.8 验证各世界类型的术语显示正确（修炼/战斗/探索面板）
