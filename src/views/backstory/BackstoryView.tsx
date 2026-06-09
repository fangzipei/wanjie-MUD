'use client';

import { Sparkles, Scroll, User, Globe } from 'lucide-react';

import { useStatLabels } from '@/modules/identity/hooks/useStatLabels';
import type { WorldType } from '@/shared/lib/types';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { cn } from '@/shared/utils';

interface BackstoryProps {
  backstory: string;
  onConfirm: () => void;
  /** 角色名 */
  characterName?: string;
  /** 世界名 */
  worldName?: string;
  /** 世界类型 */
  worldType?: WorldType;
}

// 世界图标
const worldIcon: Record<WorldType, string> = {
  '修仙': '☯', '高武': '⚔', '科技': '⬡', '魔幻': '✦',
  '异能': '◈', '仙侠': '◆', '武侠': '◇', '末世': '◉',
};

// 世界风味确认按钮文案
const confirmText: Record<WorldType, string> = {
  '修仙': '踏上仙途', '仙侠': '踏上仙途',
  '高武': '踏入江湖', '武侠': '踏入江湖',
  '科技': '启动征程', '魔幻': '启程冒险',
  '异能': '觉醒启程', '末世': '踏入废土',
};

// 格式化文本（保留原有逻辑）
function formatText(text: string) {
  const processBookTitles = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    const regex = /《(.+?)》/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(processQuotes(str.slice(lastIndex, match.index)));
      parts.push(<span key={key++} className="text-primary font-medium">《{match[1]}》</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) parts.push(processQuotes(str.slice(lastIndex)));
    return parts.length > 0 ? parts : str;
  };

  const processQuotes = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    const regex = /(?:「(.+?)」|"(.+?)"|"(.+?)")/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(processNumbers(str.slice(lastIndex, match.index)));
      const quoteContent = match[1] || match[2] || match[3];
      parts.push(<span key={key++} className="text-amber-600 dark:text-amber-400 italic">「{quoteContent}」</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) parts.push(processNumbers(str.slice(lastIndex)));
    return parts.length > 0 ? parts : str;
  };

  const processNumbers = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    const regex = /(\d+(?:\.\d+)?(?:年|岁|天|月|日|个|次|倍|成|分|层|阶|级|品)?)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(str.slice(lastIndex, match.index));
      parts.push(<span key={key++} className="text-blue-600 dark:text-blue-400 font-medium tabular-nums">{match[1]}</span>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex));
    return parts.length > 0 ? parts : str;
  };

  return processBookTitles(text);
}

export function BackstoryView({ backstory, onConfirm, characterName, worldName, worldType = '修仙' }: BackstoryProps) {
  const paragraphs = backstory.split('\n\n').filter(p => p.trim());
  const { displayNames } = useStatLabels(worldType);

  return (
    <div className="min-h-dvh md:min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-5xl h-dvh md:h-auto flex flex-col px-4 sm:px-6 py-4">
        {/* 叙事化标题 */}
        <div className="text-center mb-3 shrink-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Scroll className="w-5 h-5 text-primary/60" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-serif">
              宿命之章
            </h1>
            <Scroll className="w-5 h-5 text-primary/60" />
          </div>
          {characterName && worldName && (
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground/80 font-medium">{characterName}</span>
              <span className="mx-1.5">踏入</span>
              <span className="text-foreground/80 font-medium">{worldName}</span>
            </p>
          )}
        </div>

        {/* 角色+世界双卡片 */}
        {(characterName || worldName) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 shrink-0">
            {/* 角色卡片 */}
            {characterName && (
              <Card className="border-primary/10 bg-primary/5">
                <CardContent className="p-3 flex items-center gap-3">
                  <User className="w-5 h-5 text-primary/60 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">命运之子</div>
                    <div className="text-sm font-semibold text-foreground font-serif truncate">{characterName}</div>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* 世界卡片 */}
            {worldName && (
              <Card className="border-primary/10 bg-primary/5">
                <CardContent className="p-3 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary/60 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">降临之地</div>
                    <div className="text-sm font-semibold text-foreground font-serif truncate">
                      <span className="mr-1.5">{worldIcon[worldType]}</span>
                      {worldName}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {displayNames.slice(0, 3).map((name, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] px-1">{name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 故事卡片 */}
        <Card className="flex-1 min-h-0 border-border/50 shadow-lg overflow-hidden">
          <CardContent className="p-4 sm:p-6 md:p-8 h-full">
            <ScrollArea className="h-full md:h-auto">
              <div className="space-y-4 md:flex md:flex-col md:justify-center md:min-h-full md:py-4">
                {paragraphs.map((paragraph, index) => (
                  <div key={index}>
                    <p className={cn(
                      'leading-relaxed text-foreground/85',
                      index === 0
                        ? 'text-base sm:text-lg md:text-xl font-medium text-foreground'
                        : 'text-sm sm:text-base md:text-lg',
                    )}>
                      {formatText(paragraph)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 确认按钮 */}
        <div className="text-center mt-4 shrink-0">
          <Button
            size="lg"
            onClick={onConfirm}
            className="transition-all duration-300 shadow-md hover:shadow-lg font-serif tracking-wide"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {confirmText[worldType]}
          </Button>
        </div>
      </div>
    </div>
  );
}
