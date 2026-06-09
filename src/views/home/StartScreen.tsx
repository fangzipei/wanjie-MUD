'use client';

import { useState } from 'react';

import { Sparkles, Upload, X } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

/** 背景浮动的修行符文 */
const FLOATING_RUNES = [
  { char: '道', x: '8%', y: '18%', delay: '0s', dur: '7s' },
  { char: '法', x: '88%', y: '12%', delay: '1.2s', dur: '8s' },
  { char: '修', x: '12%', y: '78%', delay: '0.6s', dur: '6.5s' },
  { char: '仙', x: '82%', y: '72%', delay: '2s', dur: '7.5s' },
  { char: '灵', x: '48%', y: '8%', delay: '1.8s', dur: '9s' },
  { char: '气', x: '52%', y: '88%', delay: '0.3s', dur: '7.2s' },
  { char: '天', x: '93%', y: '42%', delay: '2.5s', dur: '8.5s' },
  { char: '地', x: '4%', y: '52%', delay: '1.5s', dur: '6.8s' },
];

/** 光点位置 */
const LIGHT_DOTS = [
  { x: '20%', y: '30%', delay: '0s', size: '2px' },
  { x: '70%', y: '25%', delay: '0.8s', size: '3px' },
  { x: '35%', y: '65%', delay: '1.6s', size: '2px' },
  { x: '65%', y: '70%', delay: '2.2s', size: '1.5px' },
  { x: '25%', y: '85%', delay: '0.4s', size: '2.5px' },
  { x: '75%', y: '15%', delay: '1.2s', size: '2px' },
  { x: '55%', y: '55%', delay: '2.8s', size: '1.5px' },
  { x: '15%', y: '40%', delay: '3.2s', size: '3px' },
];

interface StartScreenProps {
  onStart: () => void;
  onImportSave?: (jsonString: string) => void;
}

export function StartScreen({ onStart, onImportSave }: StartScreenProps) {
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = () => {
    setImportError(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            onImportSave?.(content);
          } catch {
            setImportError('导入失败：存档格式无效');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-dvh md:min-h-screen relative overflow-hidden flex items-center justify-center bg-background">
      {/* ========== 背景层 ========== */}

      {/* 浮动的修行符文 */}
      {FLOATING_RUNES.map((rune) => (
        <span
          key={rune.char}
          className="absolute pointer-events-none select-none font-serif text-4xl sm:text-5xl text-primary/20"
          style={{
            left: rune.x,
            top: rune.y,
            animation: `float ${rune.dur} ease-in-out infinite`,
            animationDelay: rune.delay,
          }}
        >
          {rune.char}
        </span>
      ))}

      {/* 浮动的光点 — inline style 动画 */}
      {LIGHT_DOTS.map((dot, i) => (
        <span
          key={`dot-${i}`}
          className="absolute rounded-full bg-primary/40 pointer-events-none select-none"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            animation: `pulse-glow ${2 + i * 0.3}s ease-in-out infinite`,
            animationDelay: dot.delay,
          }}
        />
      ))}

      {/* 中央柔光 — inline style 动画 */}
      <div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none"
        style={{
          transform: 'translate(-50%, -50%)',
          animation: 'pulse-glow 4s ease-in-out infinite',
        }}
      />

      {/* 旋转光晕环 — inline style 动画 */}
      <div
        className="absolute top-1/2 left-1/2 w-[650px] h-[650px] rounded-full border border-primary/[0.04] pointer-events-none"
        style={{
          animation: 'glow-rotate 12s linear infinite',
        }}
      />

      {/* "万界" 背景大字 — inline style 脉冲 */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <span
          className="absolute text-[75vw] font-bold text-nowrap text-muted-foreground/[0.10] font-serif tracking-wider"
          style={{
            animation: 'pulse-glow 5s ease-in-out infinite',
          }}
        >
          万界
        </span>
      </div>

      {/* ========== 内容卡片 ========== */}
      <Card
        className="relative z-10 max-w-md w-full mx-4 shadow-2xl border-primary/10"
        style={{ animation: 'fade-in-up 0.8s ease-out forwards' }}
      >
        {/* 顶部渐变光线 */}
        <div className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        {/* 底部渐变光线 */}
        <div className="absolute -bottom-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <CardContent className="pt-10 pb-8 px-8 text-center space-y-7">
          {/* ===== 标题区域 ===== */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2.5">
              <Sparkles
                className="w-5 h-5 text-primary/50"
                style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }}
              />
              <h1 className="text-4xl font-bold tracking-[0.15em] text-foreground font-serif">
                万界修行录
              </h1>
              <Sparkles
                className="w-5 h-5 text-primary/50"
                style={{ animation: 'pulse-glow 2.5s ease-in-out infinite' }}
              />
            </div>
            <p className="text-lg text-muted-foreground tracking-[0.3em] font-serif">
              命运指引，万界归一
            </p>
          </div>

          {/* ===== 装饰分隔 ===== */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-primary/30 text-xs tracking-widest select-none">
              ◆ ◇ ◆
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* ===== 描述文字 ===== */}
          <p className="text-sm text-muted-foreground/80 leading-relaxed tracking-wide">
            万界之门已开启，星辰指引着命运的方向。
            <br />
            择一方天地，书写属于你的不朽传奇。
          </p>

          {/* ===== 开始按钮（带光晕） ===== */}
          <div className="relative pt-1">
            {/* 按钮外光晕 */}
            <div
              className="absolute inset-0 rounded-lg bg-primary/15 blur-xl"
              style={{ animation: 'button-glow 3s ease-in-out infinite' }}
            />
            <Button
              size="lg"
              onClick={onStart}
              className="relative w-full text-base font-semibold tracking-[0.15em] font-serif
                transition-all duration-500
                hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/20
                active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              踏入万界
            </Button>
          </div>

          {/* ===== 导入存档按钮 ===== */}
          {onImportSave && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleImport}
              className="w-full transition-all duration-300 hover:border-primary/30 hover:bg-primary/5"
            >
              <Upload className="w-4 h-4 mr-2" />
              导入存档
            </Button>
          )}

          {/* ===== 导入错误提示 ===== */}
          {importError && (
            <div
              className="flex items-center gap-1.5 p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs"
              style={{ animation: 'fade-in-up 0.4s ease-out forwards' }}
            >
              <X className="w-3.5 h-3.5 shrink-0" />
              <span>{importError}</span>
              <button
                className="ml-auto p-0.5 rounded hover:bg-destructive/20 transition-colors"
                onClick={() => setImportError(null)}
                aria-label="关闭错误提示"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* ===== 底部提示 ===== */}
          <p className="text-xs text-muted-foreground/50 tracking-wide">
            导入存档将覆盖当前游戏进度（消息记录不包含在存档中）
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
