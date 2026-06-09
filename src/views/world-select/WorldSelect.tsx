'use client';

import { useState } from 'react';

import { Compass, Skull, Sparkles, ChevronRight, Sword } from 'lucide-react';

import { getStatLabels } from '@/modules/identity/data/statDisplayNames';
import {
  generateLevelStars,
} from '@/modules/identity/data/worldEffectsUtils';
import { RealmTable } from '@/shared/components';
import type { World, WorldType, WorldDifficulty } from '@/shared/lib/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { cn } from '@/shared/utils';

interface WorldSelectProps {
  worlds: World[];
  onSelect: (world: World) => void;
}

// 世界类型视觉主题
const worldTheme: Record<WorldType, { icon: string; gradient: string; accent: string; border: string }> = {
  '修仙': { icon: '☯', gradient: 'from-amber-500/20 to-yellow-600/10', accent: 'text-amber-400', border: 'border-amber-500/30' },
  '高武': { icon: '⚔', gradient: 'from-red-500/20 to-orange-600/10', accent: 'text-red-400', border: 'border-red-500/30' },
  '科技': { icon: '⬡', gradient: 'from-cyan-500/20 to-blue-600/10', accent: 'text-cyan-400', border: 'border-cyan-500/30' },
  '魔幻': { icon: '✦', gradient: 'from-purple-500/20 to-violet-600/10', accent: 'text-purple-400', border: 'border-purple-500/30' },
  '异能': { icon: '◈', gradient: 'from-indigo-500/20 to-blue-600/10', accent: 'text-indigo-400', border: 'border-indigo-500/30' },
  '仙侠': { icon: '◆', gradient: 'from-teal-500/20 to-emerald-600/10', accent: 'text-teal-400', border: 'border-teal-500/30' },
  '武侠': { icon: '◇', gradient: 'from-stone-500/20 to-neutral-600/10', accent: 'text-stone-400', border: 'border-stone-500/30' },
  '末世': { icon: '◉', gradient: 'from-zinc-500/20 to-slate-700/10', accent: 'text-zinc-400', border: 'border-zinc-500/40' },
};

// 难度样式
const difficultyStyles: Record<WorldDifficulty, { badge: string }> = {
  '简单': { badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  '普通': { badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  '困难': { badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  '噩梦': { badge: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
  '地狱': { badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  '深渊': { badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
};

export function WorldSelect({ worlds, onSelect }: WorldSelectProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="min-h-dvh md:min-h-screen bg-background overflow-auto">
      <div className="relative max-w-7xl mx-auto p-4 md:p-8">
        {/* 标题区 */}
        <div className="text-center mb-8" style={{ animation: 'fade-in-up 0.6s ease-out forwards' }}>
          <div className="flex items-center justify-center gap-3 mb-3">
            <Compass className="w-6 h-6 text-primary/50" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }} />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif tracking-[0.1em]">
              万象星盘 · 择一方天地
            </h1>
            <Compass className="w-6 h-6 text-primary/50" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }} />
          </div>
          <p className="text-muted-foreground text-sm tracking-wide">
            星辰流转，命运之轮已开始转动…选择你将降临的世界
          </p>
        </div>

        {/* 世界网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {worlds.map((world, index) => {
            const theme = worldTheme[world.type];
            const isSelected = selectedId === world.id;
            const statLabels = getStatLabels(world.type);

            return (
              <Card
                key={world.id}
                className={cn(
                  'cursor-pointer transition-all duration-300 border-2 flex flex-col relative overflow-hidden',
                  theme.border,
                  isSelected
                    ? 'scale-[1.02] shadow-lg shadow-primary/10 z-10'
                    : 'hover:shadow-md hover:scale-[1.01]',
                )}
                style={{ animation: `fade-in-up 0.5s ease-out ${index * 0.08}s both` }}
                onClick={() => setSelectedId(isSelected ? null : world.id)}
              >
                {/* 世界类型渐变背景 */}
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none', theme.gradient)} />

                <CardContent className="p-4 flex flex-col flex-1 relative">
                  {/* 头部 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden="true">{theme.icon}</span>
                      <h3 className="text-base font-bold text-foreground font-serif">{world.name}</h3>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px]', difficultyStyles[world.difficulty].badge)}>
                      {world.difficulty}
                    </Badge>
                  </div>

                  {/* 新手/挑战标记 */}
                  <div className="flex gap-1 mb-2">
                    <Badge className={cn('text-[10px]', theme.accent, theme.border.replace('border', 'bg').replace('/30', '/15'))}>
                      {world.type}
                    </Badge>
                    {world.baseCoefficient <= 1.0 && (
                      <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                        推荐新手
                      </Badge>
                    )}
                    {world.baseCoefficient >= 1.5 && (
                      <Badge className="text-[10px] bg-red-500/15 text-red-600 border-red-500/30">
                        挑战模式
                      </Badge>
                    )}
                  </div>

                  {/* 描述 */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {world.description}
                  </p>

                  {/* 属性体系 */}
                  <div className="bg-muted/30 rounded-md p-2 mb-2">
                    <div className="text-[10px] text-muted-foreground mb-1">属性体系</div>
                    <div className="flex gap-1 flex-wrap">
                      {statLabels.displayNames.map((name, i) => (
                        <span key={statLabels.statKeys[i]} className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 text-foreground/70">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 势力简述 */}
                  <div className="text-[10px] text-muted-foreground line-clamp-1 mb-3">
                    {world.majorForces}
                  </div>

                  {/* 展开区：选中后显示详情 */}
                  {isSelected && (
                    <div className="space-y-3 border-t border-border pt-3" style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}>
                      {/* 境界体系 */}
                      <div className="bg-muted/30 rounded-md p-2">
                        <div className="text-xs text-foreground/80 font-medium mb-1">境界体系</div>
                        <div className="text-xs text-muted-foreground">
                          <RealmTable realmSystem={world.realmSystem} compact />
                        </div>
                      </div>

                      {/* 危险 */}
                      {world.dangers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Skull className="w-3 h-3 text-destructive" />
                            <span className="text-[10px] text-destructive font-medium">危险</span>
                          </div>
                          <div className="space-y-1">
                            {world.dangers.map((d, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 p-1 rounded bg-destructive/5 cursor-help">
                                    <span className="text-[10px] text-destructive truncate flex-1">{d.name}</span>
                                    <span className="text-[9px] text-destructive/60">
                                      {generateLevelStars(d.dangerLevel)}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs p-2">
                                  <div className="font-medium text-destructive">{d.name}</div>
                                  <div className="text-[11px] text-muted-foreground">{d.description}</div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 机缘 */}
                      {world.opportunities.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-500 font-medium">机缘</span>
                          </div>
                          <div className="space-y-1">
                            {world.opportunities.map((o, i) => (
                              <div key={i} className="flex items-center gap-1 p-1 rounded bg-emerald-500/5">
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate flex-1">{o.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 确认按钮 */}
                      <Button
                        className="w-full font-serif tracking-wide"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onSelect(world); }}
                      >
                        <Sword className="w-3.5 h-3.5 mr-1.5" />
                        踏入此界
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
