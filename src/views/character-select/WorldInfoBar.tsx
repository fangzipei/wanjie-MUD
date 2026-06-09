'use client';

import { ArrowLeft } from 'lucide-react';

import { useStatLabels } from '@/modules/identity/hooks/useStatLabels';
import type { WorldType } from '@/shared/lib/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/utils';

interface WorldInfoBarProps {
  worldName: string;
  worldType: WorldType;
  onBack: () => void;
}

const worldIcon: Record<WorldType, string> = {
  '修仙': '☯', '高武': '⚔', '科技': '⬡', '魔幻': '✦',
  '异能': '◈', '仙侠': '◆', '武侠': '◇', '末世': '◉',
};

const worldAccent: Record<WorldType, string> = {
  '修仙': 'text-amber-400', '高武': 'text-red-400', '科技': 'text-cyan-400', '魔幻': 'text-purple-400',
  '异能': 'text-indigo-400', '仙侠': 'text-teal-400', '武侠': 'text-stone-400', '末世': 'text-zinc-400',
};

export function WorldInfoBar({ worldName, worldType, onBack }: WorldInfoBarProps) {
  const { displayNames } = useStatLabels(worldType);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border rounded-lg mb-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0" aria-label="返回选择世界">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回
      </Button>

      <span className={cn('text-lg', worldAccent[worldType])} aria-hidden="true">
        {worldIcon[worldType]}
      </span>
      <span className="text-sm font-semibold text-foreground font-serif">{worldName}</span>

      <div className="flex-1" />

      <div className="flex gap-1 flex-wrap">
        {displayNames.map((name, i) => (
          <Badge key={i} variant="secondary" className="text-[10px]">
            {name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
