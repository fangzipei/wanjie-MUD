## MODIFIED Requirements

### Requirement: 禁止新增"虚影"世界类型

`WorldType` 类型 SHALL 从硬编码的联合类型改为运行时注册的品牌字符串类型。世界类型的有效性校验 SHALL 在运行时通过 `WorldDataRegistry.isValidWorldType(id)` 进行，而非编译时的 TypeScript 联合类型检查。任何新增的世界类型 SHALL 必须通过 Mod 数据文件注册到 `WorldDataRegistry` 中，SHALL NOT 仅在类型系统中声明。

#### Scenario: WorldType 与注册表一致性
- **WHEN** 检查已注册的世界类型列表
- **THEN** 所有 `WorldType` 值 SHALL 在 `WorldDataRegistry` 中有对应的注册条目
- **AND** 系统 SHALL 在启动时输出所有已注册世界类型的审计日志
