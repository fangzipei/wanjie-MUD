/**
 * Hook: useModLoader
 *
 * 管理 Mod 加载状态（loading / ready / error / warnings）。
 * 在应用根组件中调用一次，驱动整个 Mod 加载管线。
 *
 * @module modules/mod
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ModLoader, ModLoadError } from '@/shared/lib/mod';
import type { ModLoadProgressEvent } from '@/shared/lib/mod';

/** Mod 加载阶段 */
export type ModLoadPhase = 'idle' | 'loading' | 'ready' | 'error';

/** 非致命警告 */
export interface ModLoadWarning {
  id: string;
  name: string;
  error: string;
}

/** Mod 加载状态 */
export interface ModLoaderState {
  /** 加载阶段 */
  phase: ModLoadPhase;
  /** 加载进度 */
  progress: { current: number; total: number };
  /** 致命错误消息（required Mod 失败时） */
  fatalError: string | null;
  /** 非致命警告列表 */
  warnings: ModLoadWarning[];
}

/**
 * Mod 加载 Hook
 *
 * 应用启动时自动调用 ModLoader.loadAll()。
 * 加载成功后 phase 变为 'ready'。
 * 强制 Mod 失败时 phase 变为 'error'。
 *
 * @example
 * ```tsx
 * const { phase, progress, fatalError, warnings } = useModLoader();
 * if (phase === 'loading') return <LoadingScreen progress={progress} />;
 * if (phase === 'error') return <ErrorScreen message={fatalError} />;
 * return <App />;
 * ```
 */
export function useModLoader(): ModLoaderState {
  const [phase, setPhase] = useState<ModLoadPhase>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ModLoadWarning[]>([]);
  const startedRef = useRef(false);

  const startLoading = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase('loading');

    const loader = new ModLoader();

    loader.setProgressCallback((e: ModLoadProgressEvent) => {
      setProgress({ current: e.current, total: e.total });
    });

    try {
      await loader.loadAll();

      const failed = loader.getFailedMods();
      if (failed.length > 0) {
        setWarnings(failed.map(f => ({ id: f.id, name: f.name, error: f.error })));
      }

      setPhase('ready');
    } catch (err) {
      if (err instanceof ModLoadError) {
        const names = err.failedMods.map(m => `"${m.name || m.id}"`).join('、');
        setFatalError(`核心数据加载失败：${names}。请刷新页面重试。`);
      } else {
        setFatalError(`Mod 加载失败：${err instanceof Error ? err.message : '未知错误'}`);
      }
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    startLoading();
  }, [startLoading]);

  return { phase, progress, fatalError, warnings };
}
