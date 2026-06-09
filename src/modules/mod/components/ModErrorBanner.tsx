/**
 * 组件：ModErrorBanner
 *
 * 非致命 Mod 加载警告横幅。
 * 当第三方 Mod 加载失败时，在页面顶部显示可关闭的 Toast。
 *
 * @module modules/mod
 */

import { useState } from 'react';
import type { ModLoadWarning } from '../hooks/useModLoader';

interface ModErrorBannerProps {
  /** 警告列表 */
  warnings: ModLoadWarning[];
}

export function ModErrorBanner({ warnings }: ModErrorBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (warnings.length === 0) return null;

  const visible = warnings.filter(w => !dismissed.has(w.id));
  if (visible.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex flex-col gap-1 p-2">
      {visible.map(w => (
        <div
          key={w.id}
          className="flex items-center gap-3 rounded-md border border-yellow-600/30 bg-yellow-950/90 px-4 py-2 text-sm text-yellow-200 shadow-lg"
        >
          <span className="shrink-0">⚠</span>
          <span className="flex-1">
            Mod <strong>{w.name}</strong> 加载失败：{w.error}
          </span>
          <button
            className="shrink-0 text-yellow-400 hover:text-yellow-100"
            onClick={() => setDismissed(prev => new Set(prev).add(w.id))}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
