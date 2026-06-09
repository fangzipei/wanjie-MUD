'use client';

/**
 * 组件：ModInitProvider
 *
 * 客户端组件，在应用根布局中包裹所有子组件。
 * 负责初始化 Mod 加载流程并展示加载状态。
 *
 * @module modules/mod
 */

import { useModLoader } from '../hooks/useModLoader';
import { ModLoadingOverlay } from './ModLoadingOverlay';
import { ModErrorBanner } from './ModErrorBanner';

interface ModInitProviderProps {
  children: React.ReactNode;
}

export function ModInitProvider({ children }: ModInitProviderProps) {
  const state = useModLoader();

  return (
    <ModLoadingOverlay state={state}>
      <ModErrorBanner warnings={state.warnings} />
      {children}
    </ModLoadingOverlay>
  );
}
