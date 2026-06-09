/**
 * 组件：ModLoadingOverlay
 *
 * Mod 加载期间的全局遮罩层。
 * - 加载中：显示动画 + 进度条
 * - 致命错误：显示错误页面
 * - 加载完成：渲染子组件
 *
 * @module modules/mod
 */

import type { ModLoaderState } from '../hooks/useModLoader';

interface ModLoadingOverlayProps {
  /** Mod 加载状态 */
  state: ModLoaderState;
  /** 子组件（加载完成后渲染） */
  children: React.ReactNode;
}

/** 加载动画组件 */
function LoadingSpinner({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* 旋转动画 */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />

        <div className="text-center">
          <p className="text-lg font-medium text-foreground">
            正在加载世界数据...
          </p>
          <p className="text-sm text-muted-foreground">
            {current} / {total}
          </p>
        </div>

        {/* 进度条 */}
        <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** 致命错误页面 */
function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-destructive">数据加载失败</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          onClick={() => window.location.reload()}
        >
          刷新页面
        </button>
      </div>
    </div>
  );
}

export function ModLoadingOverlay({ state, children }: ModLoadingOverlayProps) {
  if (state.phase === 'loading') {
    return <LoadingSpinner current={state.progress.current} total={state.progress.total} />;
  }

  if (state.phase === 'error') {
    return <ErrorScreen message={state.fatalError ?? '未知错误'} />;
  }

  // phase === 'ready' 或 'idle'（idle 仅在开发模式下短暂出现）
  return <>{children}</>;
}
