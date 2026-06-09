# world-seed-system

## 已完成

- [x] World 增加 ratingScore 字段
- [x] World 移除静态 rewardCoefficient（改为运行时动态计算）
- [x] worldSystem.ts 透传 RNG 参数，去掉 Math.random 硬编码
- [x] generators.ts 用 createRng(seed) 做确定性生成
- [x] 创建 scripts/generate-world.ts CLI 工具
- [x] 生成初始 8 个世界 JSON 文件 + barrel
- [x] World 增加 specialPlot 字段
- [x] 创建 NPC 模块（types/index/data/logic）
- [x] 创建 Story 类型系统（modules/narrative/story/）
- [x] 创建 AI 工具模块（shared/lib/ai/）
- [x] generate-world.ts 支持 --ai 参数调用 Anthropic 生成剧情/NPC
- [x] 类型检查通过
