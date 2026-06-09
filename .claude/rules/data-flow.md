# 数据流与组件调用规范

> **级别：SHOULD（建议遵循）**
> 这些规则定义了各层之间的数据流和调用链，确保代码结构清晰可维护。

---

## 一、调用链总图

```
app/page.tsx          ← ① 路由入口（薄层）
  │
  ├── context / props
  │
  ▼
views/<View>.tsx      ← ② 视图层（组合编排）
  │
  ├──► modules/<A>/hooks/    ← ③ Hook 层（状态 + 行为）
  │     │
  │     ├──► modules/<A>/logic/  ← ④ 纯逻辑层（无 React）
  │     │
  │     └──► dispatch/setState   → 更新 A 模块状态
  │
  └──► modules/<A>/components/  ← ⑤ 组件层（渲染）
          │
          └──► shared/ui/       ← shadcn 基元
```

数据**从上到下传递**（ownership 链），事件**从下到上冒泡**（通过 callback/event）。

---

## 二、各层详细规约

### ① 路由层 `app/<route>/page.tsx`

**职责**：
- 读取 Context/ 数据源
- 路由跳转逻辑、重定向守卫
- 向 View 传递 props

**模板**：
```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/views/game/useGameState';
import { GameView } from '@/views/game/GameView';

export default function GamePage() {
  const router = useRouter();
  const game = useGame();

  // 路由守卫
  useEffect(() => {
    if (!game.gameState.protagonist) {
      router.replace('/');
    }
  }, [game.gameState.protagonist, router]);

  return <GameView {...game} />;
}
```

---

### ② 视图层 `views/<route>/`

**职责**：
- 组合模块 Panel
- Tab 切换、弹窗/对话框管理
- UI 临时状态（展开/折叠、输入框值）使用 `useState`

**禁止**：
- ❌ 在 views 中调用 `setGameState`
- ❌ 在 views 中写业务逻辑（应放 modules/）
- ❌ 在 views 中直接 import modules 的 logic/

**Props vs Context**：
- 视图接收的数据如果是**模块粒度的** → 用 props 显式传入
- 视图接收的数据如果是**全局跨模块的** → 用 Context 获取（如 `useGame()`）
- 偏好：优先显式 props，降低隐式依赖

---

### ③ Hook 层 `modules/<domain>/hooks/`

**职责**：
- 读取本模块的 state slice
- 提供 action 函数（`useCallback` 包装）
- 编排多个 logic 函数的调用顺序

**模板**：
```typescript
/**
 * Hook: use<Feature>
 *
 * 职责：[一句话描述]
 * 依赖的 state slice：<domain>Slice
 * 跨模块通信：[事件类型 / 无]
 */
export function use<Feature>(deps: HookDeps) {
  // 1. 只读取自己模块的 slice
  // 2. 提供 action 函数（useCallback）
  // 3. 编排 logic 调用
  // 4. 返回行为对象
}
```

**规则**：
- 一个 Hook 文件只负责一个关注点（≤200 行）
- **只访问自己模块的状态 slice**
- 跨模块**读取**：import 其他模块的 slice（只读，不修改）
- 跨模块**写入**：通过事件总线 `GameEventManager` 触发
- Hook 不直接调用其他模块的 Hook

---

### ④ 纯逻辑层 `modules/<domain>/logic/`

**规则**：
- 所有导出函数必须是纯函数（同入同出、无副作用）
- 不 import React / React Hook
- 不引用浏览器 API（`localStorage`、`document`、`window`）
- 不调用 `Math.random()` → 使用 `shared/utils/rng.ts` 的 seeded RNG
- 不修改输入参数（返回新对象）

**错误模式**：
```typescript
// ❌ 有副作用
export function applyDamage(state: BattleState, damage: number): BattleState {
  state.playerHp -= damage;  // 修改了输入参数
  return state;
}

// ✅ 纯函数
export function applyDamage(state: BattleState, damage: number): BattleState {
  return {
    ...state,
    playerHp: Math.max(0, state.playerHp - damage),
  };
}
```

---

### ⑤ 组件层 `modules/<domain>/components/`

**规则**：
- 接收 props 渲染 UI，不直接调用 `setGameState`
- 调用自己模块的 Hook（不跨模块调用 Hook）
- 事件通过 props callback 冒泡到 views/ 层
- 使用 `shared/ui/` 的 shadcn 组件作为 UI 基元

---

## 三、跨模块通信决策树

```
需要跨模块传递数据？
├── 纯数据转换（A logic 调用 B logic）？
│   └── ✅ 直接 import B 的 logic 函数
├── A 模块需要读取 B 模块的状态（只读）？
│   └── ✅ import B 的 state，只读访问
├── A 模块需要通知 B 模块做某事？
│   └── ✅ 通过 GameEventManager 发送事件
└── A 模块需要修改 B 模块的状态？
    └── ❌ 禁止直接修改 → 必须通过事件总线
```

---

## 四、状态更新模式

### 4.1 不可变更新（MUST）

```typescript
// ✅ 正确
setGameState(prev => ({
  ...prev,
  [sliceName]: {
    ...prev[sliceName],
    fieldToUpdate: newValue,
  },
}));

// ❌ 错误：直接修改
prev[sliceName].fieldToUpdate = newValue;
```

### 4.2 多个字段同时更新

```typescript
// ✅ 展开旧状态，覆盖新值
setGameState(prev => ({
  ...prev,
  protagonist: {
    ...prev.protagonist!,
    currentHp: newHp,
    currentMp: newMp,
    inventory: newInventory,
  },
}));
```

### 4.3 使用函数式更新（MUST）

始终使用回调形式 `setGameState(prev => ...)`，不依赖闭包中的旧值：
```typescript
// ✅ 安全：prev 一定是最新
setGameState(prev => ({ ...prev, count: prev.count + 1 }));

// ❌ 不安全：gameState 可能是过时的
setGameState({ ...gameState, count: gameState.count + 1 });
```

---

## 五、ActionResult 模式

所有 logic/ 函数的返回类型统一：

```typescript
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// 使用示例
export function performAction(state: GameState): ActionResult<GameState> {
  if (!isValid(state)) {
    return { success: false, error: '条件不满足' };
  }
  return { success: true, data: applyAction(state) };
}
```

---

## 六、Props 传递规范

### 6.1 Props 命名
- action callback: `on` 前缀 + 动词过去式，如 `onCultivate`、`onBattleEnd`、`onItemUsed`
- 数据 props: 直接使用领域名词，如 `protagonist`、`inventory`、`battleState`
- 布尔 flag: `is`/`has`/`show` 前缀，如 `isLoading`、`hasMoreMessages`、`showDialog`

### 6.2 Props 接口组织
- 按模块功能分组（注释 `// 修炼系统`、`// 战斗系统`）
- 避免 "将所有回调传到底" 的深层透传
- 透传超过 2 层时，考虑使用 Context 或重新设计组件边界

### 6.3 大型 Props 接口
- 超过 15 个 props 的接口应考虑拆分
- 使用 Pick/Partial/Omit 从已有类型派生
