# Tasks: 世界设计审查与优化

## 1. 数据层差异化 — 修仙/仙侠分离

- [x] 1.1 在 `namePools.ts` 中新增 `XIANXIA_NAMES` 独立姓名池（剑修风格姓氏、男名、女名）
- [x] 1.2 更新 `WORLD_NAME_POOLS` 映射：`'仙侠'` 指向 `XIANXIA_NAMES`（不再复用 `CULTIVATION_NAMES`）
- [x] 1.3 审查并差异化 `WORLD_DATA['修仙']` 和 `WORLD_DATA['仙侠']` 的 `namePrefixes`/`nameSuffixes`/`descriptions`
- [x] 1.4 更新 `index.ts` 桶文件导出新的姓名池

## 2. 数据层差异化 — 末世数值修复

- [x] 2.1 下调 `WORLD_DATA['末世'].baseHp` 从 120 → 90
- [x] 2.2 下调 `WORLD_DATA['末世'].baseAttack` 从 16 → 12
- [x] 2.3 上调 `WORLD_DATA['末世'].enemyAttackBonus` 从 0.2 → 0.3
- [x] 2.4 上调 `WORLD_DATA['末世'].enemyDefenseBonus` 从 0.15 → 0.25

## 3. 数据层差异化 — 修仙入门世界调整

- [x] 3.1 下调 `WORLD_DATA['修仙'].coefficient` 从 1.1 → 1.0
- [x] 3.2 验证修仙世界难度标签在 ascensionCount=0 时显示"简单"

## 4. WorldMechanics 接口扩展

- [x] 4.1 在 `worlds/types.ts` 的 `WorldMechanics` 接口中新增 `getUniqueMechanicDescription` 方法签名
- [x] 4.2 在 `WorldMechanics` 接口中新增可选的 `onWorldEnter` 和 `onWorldLeave` 钩子签名
- [x] 4.3 为所有 8 个世界实现添加 `getUniqueMechanicDescription` 方法
- [x] 4.4 在 `cultivationWorld` 的 `getUniqueMechanicDescription` 中返回入门世界说明（非 USP）
- [x] 4.5 更新 `factory.ts` 的 `hasUniqueMechanics` 函数：除修仙外全部返回 `true`

## 5. 仙侠世界 — 本命飞剑系统

- [x] 5.1 定义 `SwordSpirit` 接口（id, name, level, attackBonus, coopChance）
- [x] 5.2 在 `xiānxiáWorld.ts` 中实现 `onWorldEnter`：首次进入生成初始飞剑
- [x] 5.3 在 `xiānxiáWorld.ts` 中实现 `customAutoStrategy`：飞剑协同攻击逻辑（20% + level×0.5% 触发率）
- [x] 5.4 在 `xiānxiáWorld.ts` 的 `getUniqueMechanicDescription` 中返回 `{ name: '本命飞剑', description: '...', icon: 'Swords' }`

## 6. 高武世界 — 气血爆发机制

- [x] 6.1 在 `highMartialWorld.ts` 中实现 `customSuccessRate`：HP < 50% 时攻击加成
- [x] 6.2 在 `highMartialWorld.ts` 中实现 `customAutoStrategy`：含气血爆发逻辑（低血量增伤+减伤，每场战斗限 2 次）
- [x] 6.3 在 `highMartialWorld.ts` 的 `getUniqueMechanicDescription` 中返回 `{ name: '气血爆发', description: '...', icon: 'Flame' }`

## 7. 异能世界 — 源能共鸣系统

- [x] 7.1 定义 `ResonanceAbility` 接口（id, name, effect, remainingExplores, remainingBattles）
- [x] 7.2 在 `esperWorld.ts` 中实现 `onWorldEnter`：初始化共鸣能力池
- [x] 7.3 在 `esperWorld.ts` 中实现探索后随机获取临时能力的逻辑
- [x] 7.4 在 `esperWorld.ts` 中实现 `onWorldLeave`：清理所有临时能力
- [x] 7.5 在 `esperWorld.ts` 的 `getUniqueMechanicDescription` 中返回 `{ name: '源能共鸣', description: '...', icon: 'Sparkles' }`

## 8. 境界数值差异化

- [x] 8.1 在 `realmCore.ts` 的 `RealmSystem` 接口中新增可选字段 `subRealmMultiplier` 和 `tierJumpMultiplier`
- [x] 8.2 修改 `getRealmMultiplier` 函数：优先使用 `RealmSystem` 上的自定义倍率，未设置时使用默认值 1.05/1.30
- [x] 8.3 在 `realmSystem.ts` 的 `generateRealmConfigs` 中，支持传入自定义倍率参数
- [x] 8.4 创建世界境界倍率配置表（按 design.md 中的表格）
- [x] 8.5 为 8 个世界生成 `RealmSystem` 时应用各自的倍率

## 9. 世界选择 UI 更新

- [x] 9.1 在 `WorldSelect.tsx` 的世界卡片中展示 `getUniqueMechanicDescription` 的 USP 名称和图标
- [x] 9.2 确保世界难度标签正确反映调整后的 coefficient → difficulty 映射
- [x] 9.3 在修仙世界卡片上标记"推荐入门"

## 10. 差异化审查工具

- [x] 10.1 实现审查函数的纯逻辑版本：输入两个 WorldStats，输出三层相似度得分
- [x] 10.2 在开发模式下控制台输出世界差异化审查报告
- [x] 10.3 验证报告标记出修仙/仙侠为"已优化"（高度重叠但在本次变更中已分离）

## 11. 验证与质量门

- [x] 11.1 运行 `pnpm ts-check` 确保无类型错误
- [x] 11.2 运行 `pnpm lint:strict` 确保代码质量
- [x] 11.3 运行 `pnpm build` 确保构建成功
- [x] 11.4 运行 `pnpm test` 确保现有测试通过
- [ ] 11.5 手动验证：世界选择页展示 8 个世界，每个世界有独特的 USP 描述
- [ ] 11.6 手动验证：修仙世界标记为"推荐入门"，末世显示"困难"
- [ ] 11.7 手动验证：8 个世界生成的角色使用正确的姓名池（仙侠≠修仙）
