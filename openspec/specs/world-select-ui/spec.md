# world-select-ui

## Purpose

TBD — see change world-first-selection-flow for full context.

# world-select-ui

沉浸式世界选择界面，采用"万象星盘"主题，消除通用 SaaS 模板感，强化选择命运的仪式感。

## ADDED Requirements

### Requirement: 万象星盘主视觉

世界选择界面 SHALL 以"万象星盘"为核心视觉主题，8 个世界如星辰般展示，替代当前的卡片网格布局。

#### Scenario: 桌面端星盘布局
- **WHEN** 用户在桌面端访问世界选择页
- **THEN** 页面中央 SHALL 展示一个具有微弱旋转动画的星盘/罗盘元素
- **AND** 8 个世界 SHALL 以环绕或扇形布局展示在星盘周围
- **AND** 鼠标悬停时世界卡片 SHALL 有辉光/抬升效果

#### Scenario: 移动端降级布局
- **WHEN** 用户在移动端（宽度 < 768px）访问世界选择页
- **THEN** 世界 SHALL 以垂直滚动列表展示
- **AND** 每个世界 SHALL 有独特的背景色/纹理标识其类型

#### Scenario: 减少动画偏好
- **WHEN** 用户系统设置了 `prefers-reduced-motion`
- **THEN** 星盘旋转动画 SHALL 停止
- **AND** 所有过渡动画 SHALL 禁用

### Requirement: 世界卡片展示独特视觉主题

每个世界卡片 SHALL 使用与世界观匹配的视觉主题，包含世界类型图标、颜色、纹理和氛围。

#### Scenario: 修仙世界视觉
- **WHEN** 渲染修仙世界卡片
- **THEN** SHALL 使用金色/青色渐变、云纹装饰、飞剑或丹炉图标
- **AND** 悬停时 SHALL 有灵气流动的粒子效果

#### Scenario: 科技世界视觉
- **WHEN** 渲染科技世界卡片
- **THEN** SHALL 使用蓝色/霓虹色、电路板纹理、齿轮或芯片图标
- **AND** 悬停时 SHALL 有数据流扫描线效果

#### Scenario: 末世世界视觉
- **WHEN** 渲染末世世界卡片
- **THEN** SHALL 使用暗红/灰黑色、锈蚀纹理、警告标志图标
- **AND** 悬停时 SHALL 有火焰或辐射闪烁效果

### Requirement: 世界选择有仪式感的确认流程

选择世界 SHALL 是一个有仪式感的两步操作：点击预览 → 确认进入。

#### Scenario: 点击世界展开详情
- **WHEN** 用户点击一个世界
- **THEN** 该世界 SHALL 放大展开，显示完整信息（属性体系、势力、危险、机缘、难度）
- **AND** 其他世界 SHALL 缩小或变暗
- **AND** "确认选择"按钮 SHALL 出现在展开卡片底部

#### Scenario: 确认选择世界
- **WHEN** 用户点击"确认选择"
- **THEN** SHALL 播放简短的过渡动画（如星盘旋转加速、世界光芒扩散）
- **AND** SHALL 调用 `onSelect(world)` 进入角色选择

### Requirement: 标题与引导文字有游戏叙事感

页面标题和引导文字 SHALL 使用游戏叙事口吻，而非工具式标签。

#### Scenario: 标题文本
- **WHEN** 世界选择页渲染
- **THEN** 标题 SHALL 为"万象星盘 · 择一方天地"或类似叙事风格文本
- **AND** SHALL NOT 使用"选择你的世界"这类直白标签

#### Scenario: 引导提示
- **WHEN** 用户未选中任何世界时
- **THEN** 页面 SHALL 显示引导文字如"星辰流转，命运之轮已开始转动…选择你将降临的世界"
