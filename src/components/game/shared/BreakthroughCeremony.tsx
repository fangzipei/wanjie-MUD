/**
 * 组件：BreakthroughCeremony
 *
 * 突破质变仪式界面 — 全屏展示天地异象和概率可视化。
 * 仅在命中质变节点突破时显示。
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Milestone } from '@/lib/game/cultivation/milestones';

interface BreakthroughCeremonyProps {
  /** 里程碑信息 */
  milestone: Milestone;
  /** 当前突破成功率 */
  successRate: number;
  /** 失败累计次数 */
  failCount: number;
  /** 开始突破回调 */
  onAttempt: () => void;
  /** 关闭回调 */
  onClose: () => void;
}

export function BreakthroughCeremony({
  milestone,
  successRate,
  failCount,
  onAttempt,
  onClose,
}: BreakthroughCeremonyProps) {
  const [phase, setPhase] = useState<'intro' | 'ready' | 'attempting'>('intro');
  const [animText, setAnimText] = useState('');

  // 打字机效果
  useEffect(() => {
    const text = milestone.phenomenon;
    let i = 0;
    setAnimText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setAnimText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setPhase('ready');
      }
    }, 50);
    return () => clearInterval(timer);
  }, [milestone.phenomenon]);

  const rateColor = successRate >= 70 ? 'text-green-400' : successRate >= 40 ? 'text-yellow-400' : 'text-red-400';
  const isGuaranteed = failCount >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 border-2 border-purple-500/50 rounded-xl p-6 max-w-md w-full mx-4 space-y-4 text-center">
        {/* 标题 */}
        <h2 className="text-xl font-bold text-purple-300">
          ✦ {milestone.name} ✦
        </h2>

        {/* 天地异象描述 */}
        <p className="text-sm text-purple-200/80 italic min-h-[60px]">
          {animText}
          {phase === 'intro' && <span className="animate-pulse">|</span>}
        </p>

        {/* 突破概率可视化 */}
        {phase === 'ready' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">突破成功率</span>
              <span className={`font-bold ${rateColor}`}>
                {isGuaranteed ? '100% (必定成功)' : `${successRate.toFixed(1)}%`}
              </span>
            </div>
            <Progress value={isGuaranteed ? 100 : successRate} className="h-3" />
            {failCount > 0 && (
              <p className="text-xs text-orange-400">
                已失败 {failCount} 次，累计保护进度 {Math.floor(milestone.failProgressRetention * failCount * 100)}%
              </p>
            )}
            {isGuaranteed && (
              <p className="text-xs text-green-400 font-bold">天道眷顾！本次突破必定成功！</p>
            )}
          </div>
        )}

        {/* 解锁预告 */}
        {phase === 'ready' && (
          <div className="bg-purple-900/30 rounded p-3 text-left">
            <p className="text-xs font-medium text-purple-300 mb-1">突破成功后将解锁：</p>
            <p className="text-sm text-white">{milestone.description}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-2">
          {phase === 'ready' && (
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={() => { setPhase('attempting'); onAttempt(); }}
            >
              开始突破
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {phase === 'attempting' ? '等待结果...' : '稍后再说'}
          </Button>
        </div>
      </div>
    </div>
  );
}
