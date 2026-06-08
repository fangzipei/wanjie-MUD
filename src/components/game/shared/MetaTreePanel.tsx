/**
 * 组件：MetaTreePanel
 *
 * 飞升元进程树 UI — 三分支树状图，显示节点详情和已解锁/可解锁状态。
 */
'use client';

import { Button } from '@/components/ui/button';
import type { MetaProgress, MetaBranch, MetaNode } from '@/lib/game/ascension/metaTree';
import { META_TREE, canUnlockNode } from '@/lib/game/ascension/metaTree';

interface MetaTreePanelProps {
  /** 元进程状态 */
  progress: MetaProgress;
  /** 解锁节点回调 */
  onUnlock: (nodeId: string) => void;
  /** 关闭回调 */
  onClose: () => void;
}

const BRANCH_NAMES: Record<MetaBranch, string> = {
  combat: '战斗之道',
  cultivation: '修炼之道',
  exploration: '探索之道',
};

const BRANCH_COLORS: Record<MetaBranch, string> = {
  combat: 'border-red-500/50 bg-red-900/20',
  cultivation: 'border-blue-500/50 bg-blue-900/20',
  exploration: 'border-green-500/50 bg-green-900/20',
};

/** 获取分支的节点列表（按层级排序） */
function getBranchNodes(branch: MetaBranch): MetaNode[] {
  return Object.values(META_TREE)
    .filter(n => n.branch === branch)
    .sort((a, b) => a.tier - b.tier);
}

/** 单个节点渲染 */
function MetaNodeCard({
  node,
  progress,
  onUnlock,
}: {
  node: MetaNode;
  progress: MetaProgress;
  onUnlock: (id: string) => void;
}) {
  const unlocked = progress.unlockedNodes.includes(node.id);
  const canUnlock = !unlocked && canUnlockNode(node.id, progress);
  const locked = !unlocked && !canUnlock;

  return (
    <div
      className={`border rounded p-2 text-xs transition-all ${
        unlocked
          ? 'border-yellow-500/70 bg-yellow-900/20'
          : canUnlock
            ? 'border-green-500/50 bg-green-900/10 cursor-pointer hover:border-green-400'
            : 'border-gray-700 bg-gray-900/50 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`font-medium ${unlocked ? 'text-yellow-300' : ''}`}>
          {unlocked ? '✦ ' : locked ? '🔒 ' : ''}{node.name}
        </span>
        <span className="text-muted-foreground">{node.cost}点</span>
      </div>
      <p className="text-muted-foreground mt-0.5">{node.description}</p>
      {canUnlock && (
        <Button
          size="sm"
          className="w-full h-6 mt-1 text-[10px]"
          onClick={() => onUnlock(node.id)}
        >
          解锁
        </Button>
      )}
    </div>
  );
}

export function MetaTreePanel({ progress, onUnlock, onClose }: MetaTreePanelProps) {
  const branches: MetaBranch[] = ['combat', 'cultivation', 'exploration'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">传承之树</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-yellow-400 font-bold">{progress.totalPoints} 传承点</span>
            <Button variant="outline" size="sm" onClick={onClose}>关闭</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {branches.map(branch => {
            const nodes = getBranchNodes(branch);
            return (
              <div key={branch} className={`border rounded-lg p-2 ${BRANCH_COLORS[branch]}`}>
                <h3 className="text-sm font-bold text-center mb-1">{BRANCH_NAMES[branch]}</h3>
                <div className="space-y-1">
                  {nodes.map(node => (
                    <MetaNodeCard
                      key={node.id}
                      node={node}
                      progress={progress}
                      onUnlock={onUnlock}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
