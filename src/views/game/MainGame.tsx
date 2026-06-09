'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

import { Swords, Sparkles, Building2, Zap, Package, LogOut, Shield, ShoppingBag, Trophy, BookOpen, Clock, BarChart3, FlaskConical, Anvil, Landmark } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Separator } from '@/shared/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { isDebugMode } from '@/shared/config/env';
import { createEmptyFragmentInventory, getSynthesizableCount } from '@/modules/crafting/logic/fragmentSystem';
import { TowerEnemy, createDefaultTowerProgress } from '@/modules/tower/logic/types';
import { Protagonist, ActionResult, ActionTab, BattleState, DungeonConfig, Technique, TechniqueType, InventoryItem, Equipment, EquipmentSlot, ItemDefinition, CraftingState, ForgingState, AchievementStatus, CollectionStatus, GameStatistics, CultivationPath, ItemRarity, MessageRecord, getFinalStats } from '@/shared/lib/types';
import type { SeclusionType } from '@/modules/progression/logic/seclusion';
import { TimeSystemState } from '@/modules/time/logic/timeSystem';

// Tab panels
import { AchievementPanel } from '@/modules/collection/components/AchievementPanel';
import { AdventurePanel } from '@/modules/exploration/components/AdventurePanel';
import { CultivationPanel } from '@/modules/progression/components/CultivationPanel';
import { CultivationPathSelect } from '@/modules/progression/components/CultivationPathSelect';
import { SeclusionPanel } from '@/modules/progression/components/SeclusionPanel';
import { FactionPanel } from '@/modules/faction/components/FactionPanel';
import { InventoryPanel } from '@/modules/equipment/components/InventoryPanel';
import { SkillsTab } from '@/modules/techniques/components/SkillsTab';
import { TechniquePanel } from '@/modules/techniques/components/TechniquePanel';
import { EquipmentPanel } from '@/modules/equipment/components/EquipmentPanel';
import { ShopPanel } from '@/modules/economy/components/ShopPanel';
import { AlchemyPanel } from '@/modules/crafting/components/AlchemyPanel';
import { ForgePanel } from '@/modules/crafting/components/ForgePanel';
import { TowerPanel } from '@/modules/tower/components/TowerPanel';
import { UpgradePanel } from '@/views/game/UpgradePanel';
import { CollectionPanel } from '@/modules/collection/components/CollectionPanel';
import { FragmentPanel } from '@/modules/equipment/components/FragmentPanel';
import { StatisticsPanel } from '@/modules/collection/components/StatisticsPanel';

// Dialogs
import { DifficultySelect } from './DifficultySelect';
import { GameDialogs } from './GameDialogs';
import { InheritanceSelect } from './InheritanceSelect';
import { WorldReveal } from './WorldReveal';

// Battle
import { GuardianBattle } from '@/modules/combat/components/GuardianBattle';
import { BattleDialog } from '@/modules/combat/components/BattleDialog';

// Shared
import { CharacterInfoInline } from '@/shared/components/CharacterInfo';
import { GameHeader } from '@/shared/components/Header';
import { AdventureLootPanel } from '@/shared/components/AdventureLootPanel';
import { DeveloperPanel } from '@/shared/components/DeveloperPanel';
import { CriticalHealthOverlay } from '@/shared/components/CriticalHealthOverlay';
import { DeathDialog } from '@/shared/components/DeathDialog';

// Layout
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { MobileLayout } from './MobileLayout';
import { CenterPanel } from './CenterPanel';

import { InheritanceChoice, NewWorldInfo, DEFAULT_ASCENSION_MARK, AscensionFlowState, DeathState } from '@/shared/lib/typesExtension';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { getRealmName } from '@/modules/progression/data/realmData';
import { 
  AlchemyRecipe, 
  PillQuality, 
  calculateFinalEffect,
  MaterialRequirement,
} from '@/modules/crafting/data/alchemyRecipes';
import { 
  ForgeRecipe, 
  EquipmentQuality, 
  calculateFinalStats,
  ForgeMaterialRequirement,
} from '@/modules/crafting/data/forgeRecipes';
import { generateId } from '@/modules/identity/logic/generators';
import { MentalState, DEFAULT_PROTAGONIST_EXTENSION } from '@/shared/lib/typesExtension';
import { checkRankPromotion } from '@/shared/lib/expansionLogic';
import { getFactionById } from '@/modules/faction/data/factionData';

// 多人游戏相关
import { useMultiplayerHttp } from '@/shared/lib/multiplayer/useMultiplayerHttp';

import { AnnouncementContainer } from '@/modules/social/components';

import type { Announcement } from '@/modules/social/announcementTypes';

interface MainGameProps {
  protagonist: Protagonist;
  timeSystem?: TimeSystemState | null;
  currentEvent: any;
  adventureGrid: any;
  adventurePosition: any;
  adventureConfig: DungeonConfig | null;
  adventurePhase: 'select' | 'playing';
  adventureSession?: any; // 行动力会话状态
  lastResult: ActionResult | null;
  currentTab: ActionTab;
  battleState: BattleState | null;
  messages: MessageRecord[];
  totalMessageCount?: number;
  hasMoreMessages?: boolean;
  isLoadingMessages?: boolean;
  autoCultivating: boolean;
  lastExploreTime: number;
  adventureLoot?: InventoryItem[];
  adventureExperience?: number; // 待结算经验值
  onCultivate: () => void;
  onRest: () => void;
  onSeclusion?: (type: SeclusionType) => void;
  onExplore: () => void;
  onChooseEvent: (index: number) => void;
  onStartAdventure: (config: DungeonConfig) => void;
  onQuickSweep?: (config: DungeonConfig) => void;
  onMoveAdventure: (row: number, col: number) => void;
  onExitAdventure: (exitType?: 'completed' | 'stamina_exhausted' | 'quit' | 'fled') => void;
  onCloseResult: () => void;
  onTabChange: (tab: ActionTab) => void;
  onUseItem: (itemId: string) => void;
  addMessage: (type: MessageRecord['type'], title: string, content: string, details?: string, rewards?: MessageRecord['rewards']) => void;
  onLoadMoreMessages?: () => Promise<boolean>;
  availableDifficulties: DungeonConfig[];
  onReset: () => void;
  onToggleAutoCultivation: () => void;
  onEquipTechnique: (technique: Technique, slotIndex?: number) => void;
  onUnequipTechnique: (type: TechniqueType, slotIndex?: number) => void;
  onEquipEquipment: (equipment: Equipment) => void;
  onUnequipEquipment: (slot: EquipmentSlot) => void;
  onUpdateTechnique: (updatedTechnique: Technique) => void;
  onUpdateEquipment: (updatedEquipment: Equipment) => void;
  onBuyShopItem: (
    itemId: string,
    price: number,
    currencyType: string,
    type: 'item' | 'technique' | 'equipment',
    itemData?: any,
    quantity?: number,
    newCurrencies?: { spirit_stone?: number; contribution?: number }
  ) => void;
  onBuyWithContribution?: (itemId: string, price: number) => void;
  // 炼丹相关
  crafting: CraftingState | null;
  onStartCrafting: (recipeId: string, duration: number, quality: PillQuality, success: boolean) => void;
  onFinishCrafting: (recipe: AlchemyRecipe, quality: PillQuality, success: boolean) => void;
  // 炼器相关
  forging: ForgingState | null;
  onStartForging: (recipeId: string, duration: number, quality: EquipmentQuality, success: boolean) => void;
  onFinishForging: (recipe: ForgeRecipe, quality: EquipmentQuality, success: boolean) => void;
  // 升级相关
  onUpgradeTechnique: (targetId: string, materialIds: string[]) => void;
  onUpgradeEquipment: (targetId: string, materialIds: string[]) => void;
  // 势力相关
  onJoinFaction: (factionId: string) => void;
  onLeaveFaction: () => void;
  claimTaskReward?: (taskId: string) => { success: boolean; message: string };
  claimDailySalary?: () => { success: boolean; amount: number };
  onAcceptTask?: (taskId: string, roundType?: 'daily' | 'weekly') => { success: boolean; message: string };
  onSubmitTask?: (taskId: string, roundType?: 'daily' | 'weekly') => { success: boolean; message: string };
  onRefreshTasks?: () => { success: boolean; message: string };
  onDonate?: (amount: number) => { success: boolean; message: string };
  onPromoteRank?: () => { success: boolean; message: string };
  // 渡劫相关
  onTribulation?: () => void;
  // 飞升系统相关
  onChallengeGuardian?: () => void;
  onAscensionBattleEnd?: (result: { victory: boolean; turnsUsed: number; remainingHpPercent: number; phasesCleared: number }) => void;
  onInheritanceConfirm?: (choice: { techniqueId: string | null; equipmentId: string | null; spiritStonesPercent: number }) => void;
  onInheritanceSkip?: () => void;
  onWorldConfirm?: (newWorld?: NewWorldInfo) => void;
  onWorldReroll?: () => void;
  // 存档相关
  onExportSave: () => string;
  onImportSave: (jsonString: string) => void;
  // 成就和图鉴相关
  statistics: GameStatistics;
  completedTutorialTaskIds: string[];
  unlockedAchievementIds: string[];
  claimedAchievementIds: string[];
  onClaimAchievementReward?: (achievementId: string) => void;
  // 碎片合成相关
  onSynthesizeFragment?: (type: 'technique' | 'equipment', rarity: ItemRarity, sourceName?: string) => void;
  // 扩展系统相关
  onSelectCultivationPath?: (path: CultivationPath) => void;
  // 开发者模式相关
  devInvincible?: boolean; // 开发者无敌模式状态
  onToggleDevInvincible?: () => void; // 切换开发者无敌模式
  devHandlers?: {
    onUpdateLevel: (level: number) => void;
    onUpdateExperience: (experience: number) => void;
    onUpdateHp: (hp: number, maxHp?: number) => void;
    onUpdateMp: (mp: number, maxMp?: number) => void;
    onUpdateStat: (stat: string, value: number) => void;
    onUpdateMentalState: (mental: number, demonProbability?: number) => void;
    onUpdatePathLevel: (pathLevel: number) => void;
    onAddItem: (itemId: string, quantity: number) => void;
    onAddSpiritStones: (amount: number) => void;
    onAddTechnique: (techniqueId: string) => void;
    onAddEquipment: (equipmentId: string) => void;
    onSetCultivationPath: (pathId: string) => void;
    onTriggerBreakthrough: () => void;
    onTriggerTribulation: () => void;
    onTriggerDemon: () => void;
    onResetCooldowns: () => void;
    onSetWorldType: (worldType: string) => void;
    onFullRestore: () => void;
    onAddAllItems: () => void;
    onMaxStats: () => void;
  };
  // 飞升流程状态
  ascensionFlow?: AscensionFlowState;
  // 新手引导完成弹窗
  showNoviceCompletionDialog?: boolean;
  onCloseNoviceCompletionDialog?: () => void;
  // 新手任务全部完成弹窗
  showTutorialCompletionDialog?: boolean;
  onCloseTutorialCompletionDialog?: () => void;
  // 死亡状态
  deathState?: DeathState;
  onClearDeathState?: () => void;
  // 交互式战斗
  activeBattle?: import('@/shared/lib/types').ActiveBattleState | null;
  autoBattle?: boolean;
  onBattleEnd?: (result: { victory: boolean; fled?: boolean; playerHpAfter: number; playerMpAfter?: number }) => void;
  onToggleAutoBattle?: () => void;
  // 爬塔系统
  onChallengeTower?: (floor: number, enemy: TowerEnemy) => void;
}

export function MainGame({
  protagonist,
  timeSystem,
  currentEvent,
  adventureGrid,
  adventurePosition,
  adventureConfig,
  adventurePhase,
  adventureSession,
  lastResult,
  currentTab,
  battleState,
  messages,
  totalMessageCount = 0,
  hasMoreMessages = false,
  isLoadingMessages = false,
  autoCultivating,
  lastExploreTime,
  adventureLoot = [],
  adventureExperience = 0, // 待结算经验值
  crafting,
  forging,
  onCultivate,
  onRest,
  onSeclusion,
  onExplore,
  onChooseEvent,
  onStartAdventure,
  onQuickSweep,
  onMoveAdventure,
  onExitAdventure,
  onCloseResult,
  onTabChange,
  onUseItem,
  addMessage,
  onLoadMoreMessages,
  availableDifficulties,
  onReset,
  onToggleAutoCultivation,
  onEquipTechnique,
  onUnequipTechnique,
  onEquipEquipment,
  onUnequipEquipment,
  onUpdateTechnique,
  onUpdateEquipment,
  onBuyShopItem,
  onBuyWithContribution,
  onStartCrafting,
  onFinishCrafting,
  onStartForging,
  onFinishForging,
  onUpgradeTechnique,
  onUpgradeEquipment,
  onJoinFaction,
  onLeaveFaction,
  claimTaskReward,
  claimDailySalary,
  onAcceptTask,
  onSubmitTask,
  onRefreshTasks,
  onDonate,
  onPromoteRank,
  onTribulation,
  // 飞升系统
  onChallengeGuardian,
  onAscensionBattleEnd,
  onInheritanceConfirm,
  onInheritanceSkip,
  onWorldConfirm,
  onWorldReroll,
  onExportSave,
  onImportSave,
  statistics,
  completedTutorialTaskIds,
  unlockedAchievementIds,
  claimedAchievementIds,
  onClaimAchievementReward,
  onSynthesizeFragment,
  onSelectCultivationPath,
  // 开发者模式相关
  devInvincible = false,
  onToggleDevInvincible,
  devHandlers,
  // 飞升流程状态
  ascensionFlow,
  // 新手引导完成弹窗
  showNoviceCompletionDialog,
  onCloseNoviceCompletionDialog,
  showTutorialCompletionDialog,
  onCloseTutorialCompletionDialog,
  // 死亡状态
  deathState,
  onClearDeathState,
  // 交互式战斗
  activeBattle,
  autoBattle = false,
  onBattleEnd,
  onToggleAutoBattle,
  // 爬塔系统
  onChallengeTower,
}: MainGameProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showPathSelect, setShowPathSelect] = useState(false);
  
  // 技能 Tab 状态
  const [skillTabActiveTab, setSkillTabActiveTab] = useState<'technique' | 'combat'>('technique');
  
  // 防止飞升战斗结束重复调用的标志
  const ascensionBattleEndedRef = useRef(false);
  
  // 升级面板状态
  const [upgradeTarget, setUpgradeTarget] = useState<{item: Technique | Equipment; type: 'technique' | 'equipment'} | null>(null);
  
  // 心境状态管理 - 从protagonist读取或使用默认值
  const [mentalState, setMentalState] = useState<MentalState>(
    protagonist.mentalState ?? DEFAULT_PROTAGONIST_EXTENSION.mentalState
  );
  
  // ========== 多人游戏状态 ==========
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // HTTP 轮询连接（替代 WebSocket）
  const {
    isConnected,
    onlineCount,
    leaderboards,
    setActiveMode,
  } = useMultiplayerHttp({
    playerId: `player-${protagonist.character.id}`,
    playerName: protagonist.character.name,
    worldType: protagonist.world.type,
    level: protagonist.level,
    realm: getRealmName(protagonist.world.realmSystem, protagonist.level),
    combatPower: Math.floor(
      protagonist.level * 100 + 
      (protagonist.maxHp || 100) + 
      (protagonist.maxMp || 50)
    ),
    statistics: {
      totalEnemiesKilled: statistics.totalEnemiesKilled || 0,
      totalBossKilled: statistics.totalBossKilled || 0,
      legendaryItems: statistics.legendaryItemsObtained || 0,
      adventuresCompleted: statistics.totalAdventuresCompleted || 0,
    },
    onAnnouncement: (announcement) => {
      setAnnouncements(prev => [announcement, ...prev].slice(0, 50));
    },
  });
  
  // 飞升系统状态 - 全部从 ascensionFlow 获取
  const showGuardianBattle = ascensionFlow?.phase === 'battle';
  const showInheritanceSelect = ascensionFlow?.phase === 'inheritance';
  const showWorldReveal = ascensionFlow?.phase === 'world_reveal';
  const ascensionNewWorld = ascensionFlow?.newWorld || null;
  
  // 调试日志
  useEffect(() => {
    console.log('[MainGame] ascensionFlow updated:', ascensionFlow);
    console.log('[MainGame] showGuardianBattle:', showGuardianBattle);
    console.log('[MainGame] showInheritanceSelect:', showInheritanceSelect);
    console.log('[MainGame] showWorldReveal:', showWorldReveal);
  }, [ascensionFlow, showGuardianBattle, showInheritanceSelect, showWorldReveal]);
  
  // 同步protagonist的mentalState变化
  useEffect(() => {
    if (protagonist.mentalState) {
      setMentalState(protagonist.mentalState);
    }
  }, [protagonist.mentalState]);

  // 计算探索完成状态
  const isExplorationComplete = useMemo(() => {
    if (!adventureGrid) return false;
    
    let explored = 0;
    let total = 0;
    const explorableTypes = ['treasure', 'enemy', 'elite', 'miniboss', 'boss', 'event', 'rest'];
    
    for (const row of adventureGrid) {
      for (const cell of row) {
        if (explorableTypes.includes(cell.type)) {
          total++;
          if (cell.visited || cell.cleared) {
            explored++;
          }
        }
      }
    }
    
    return total > 0 && explored >= total;
  }, [adventureGrid]);

  // Tabs 内容组件
  const TabsContentSection = () => (
    <Tabs value={currentTab} onValueChange={(v) => onTabChange(v as ActionTab)} className="w-full">
      {/* 三行Tab布局 */}
      <div className="flex flex-col gap-1">
        {/* 第一行：修炼核心 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground shrink-0 px-1">修炼</span>
          <TabsList className="grid grid-cols-5 h-8 flex-1">
            <TabsTrigger value="cultivation" className="flex items-center gap-1 text-xs px-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>修炼</span>
            </TabsTrigger>
            <TabsTrigger value="technique" className="flex items-center gap-1 text-xs px-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>功法</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-1 text-xs px-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>装备</span>
            </TabsTrigger>
            <TabsTrigger value="fragment" className="flex items-center gap-1 text-xs px-1.5 relative">
              <Package className="w-3.5 h-3.5" />
              <span>碎片</span>
              {(() => {
                const fragmentInventory = protagonist.fragmentInventory ?? createEmptyFragmentInventory();
                const synthesizableCount = getSynthesizableCount(fragmentInventory);
                if (synthesizableCount > 0) {
                  return (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  );
                }
                return null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="skill" className="flex items-center gap-1 text-xs px-1.5">
              <Swords className="w-3.5 h-3.5" />
              <span>技能</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* 第二行：制造系统 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground shrink-0 px-1">制造</span>
          <TabsList className="grid grid-cols-5 h-8 flex-1">
            <TabsTrigger value="alchemy" className="flex items-center gap-1 text-xs px-1.5 relative">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>炼丹</span>
              {crafting && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="forge" className="flex items-center gap-1 text-xs px-1.5 relative">
              <Anvil className="w-3.5 h-3.5" />
              <span>炼器</span>
              {forging && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="adventure" className="flex items-center gap-1 text-xs px-1">
              <Swords className="w-3.5 h-3.5" />
              <span>机缘</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-1 text-xs px-1 relative">
              <Building2 className="w-3.5 h-3.5" />
              <span>势力</span>
              {(() => {
                // 检查是否可以晋升
                if (protagonist.factionProgress && protagonist.factionId) {
                  const faction = getFactionById(protagonist.factionId);
                  if (faction) {
                    const promotionResult = checkRankPromotion(protagonist.factionProgress, faction.type);
                    if (promotionResult.canPromote) {
                      return (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                      );
                    }
                  }
                }
                return null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="shop" className="flex items-center gap-1 text-xs px-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>商店</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* 第三行：收集系统 */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground shrink-0 px-1">收集</span>
          <TabsList className="grid grid-cols-5 h-8 flex-1">
            <TabsTrigger value="tower" className="flex items-center gap-1 text-xs px-1">
              <Landmark className="w-3.5 h-3.5" />
              <span>试炼</span>
            </TabsTrigger>
            <TabsTrigger value="achievement" className="flex items-center gap-1 text-xs px-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>成就</span>
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center gap-1 text-xs px-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>图鉴</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-1 text-xs px-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>统计</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
    
      <TabsContent value="cultivation" className="mt-3 space-y-3">
        <CultivationPanel 
          onCultivate={onCultivate}
          onRest={onRest}
          onChallengeGuardian={() => {
            // 调用原回调设置状态（会设置 ascensionFlow.phase = 'battle'）
            // showGuardianBattle 会自动变为 true
            if (onChallengeGuardian) {
              onChallengeGuardian();
            }
          }}
          worldType={protagonist.world.type}
          inventory={protagonist.inventory}
          activeEffects={protagonist.activeEffects}
          experience={protagonist.experience}
          overflowExperience={protagonist.overflowExperience}
          level={protagonist.level}
          currentHp={protagonist.currentHp}
          maxHp={protagonist.maxHp}
          currentMp={protagonist.currentMp}
          maxMp={protagonist.maxMp}
          autoCultivating={autoCultivating}
          onToggleAutoCultivation={onToggleAutoCultivation}
          luck={getFinalStats(protagonist.stats).幸运}
          cultivationPath={protagonist.cultivationPath}
          pathLevel={protagonist.pathLevel}
          stats={getFinalStats(protagonist.stats)}
          onSelectPath={() => setShowPathSelect(true)}
          onTribulation={() => {
            if (onTribulation) {
              const result = onTribulation();
              // 渡劫结果已通过消息系统处理
            }
          }}
          mentalState={mentalState}
          onMentalStateChange={setMentalState}
          statistics={statistics}
          completedTutorialTaskIds={completedTutorialTaskIds}
        />

        {/* 闭关面板 */}
        {onSeclusion && (
          <SeclusionPanel
            onSeclusion={onSeclusion}
            disabled={autoCultivating}
            worldType={protagonist.world.type}
            inventory={protagonist.inventory}
            level={protagonist.level}
          />
        )}
        
        <InventoryPanel
          inventory={protagonist.inventory}
          activeEffects={protagonist.activeEffects}
          onUseItem={onUseItem}
          worldType={protagonist.world.type}
          className="min-h-[150px] max-h-[300px]"
        />
      </TabsContent>
      
      <TabsContent value="experience" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <FactionPanel
          worldType={protagonist.world.type}
          worldFactions={protagonist.world.factions}
          currentFactionId={protagonist.factionId}
          factionProgress={protagonist.factionProgress}
          contribution={protagonist.currencies?.contribution ?? 0}
          onJoinFaction={onJoinFaction}
          onLeaveFaction={onLeaveFaction}
          onAcceptTask={onAcceptTask}
          onSubmitTask={onSubmitTask}
          onRefreshTasks={onRefreshTasks}
          onClaimDailySalary={claimDailySalary}
          onPromoteRank={onPromoteRank}
          spiritStoneCount={protagonist.inventory.find(i => i.definition.id === 'spirit_stone')?.quantity ?? 0}
          onDonate={onDonate}
          currentEvent={currentEvent}
          onExplore={onExplore}
          onChoose={onChooseEvent}
          lastExploreTime={lastExploreTime}
          playerLevel={protagonist.level}
        />
      </TabsContent>
      
      <TabsContent value="adventure" className="mt-3 space-y-3">
        {adventurePhase === 'select' ? (
          <DifficultySelect
            difficulties={availableDifficulties}
            playerLevel={protagonist.level}
            playerRealm={getRealmName(protagonist.world.realmSystem, protagonist.level)}
            worldType={protagonist.world.type}
            onSelect={onStartAdventure}
            onQuickSweep={onQuickSweep}
            protagonist={protagonist}
            totalBossKilled={statistics.totalBossKilled}
            clearedDifficulties={statistics.clearedDifficulties || []}
          />
        ) : (
          <>
            <AdventurePanel
              grid={adventureGrid}
              position={adventurePosition}
              config={adventureConfig}
              adventureSession={adventureSession}
              isBattling={!!activeBattle}
              onStart={() => {}}
              onMove={onMoveAdventure}
              onExit={() => setShowExitConfirm(true)}
              onForceExit={() => onExitAdventure('completed')}
              worldType={protagonist.world.type}
            />
            
            <AdventureLootPanel loot={adventureLoot} experience={adventureExperience} worldType={protagonist?.world?.type} />
            
            <Button 
              variant="outline" 
              className="w-full h-9 text-xs"
              onClick={() => setShowExitConfirm(true)}
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              退出机缘
            </Button>
          </>
        )}
      </TabsContent>
      
      <TabsContent value="shop" className="mt-3">
        <ShopPanel
          inventory={protagonist.inventory}
          worldType={protagonist.world.type}
          playerLevel={protagonist.level}
          realm={protagonist.realm}
          currencies={{
            spirit_stone: protagonist.inventory.find(i => i.definition.id === 'spirit_stone')?.quantity || 0,
            contribution: protagonist.currencies?.contribution ?? 0,
            sect_point: protagonist.currencies?.sect_point ?? 0,
            honor: protagonist.currencies?.honor_point ?? 0,
            ascension_mark: protagonist.currencies?.ascension_mark ?? 0,
            event_token: protagonist.currencies?.event_token ?? 0,
          }}
          factionId={protagonist.factionProgress?.factionId}
          factionRank={protagonist.factionProgress?.rank}
          onBuy={onBuyShopItem}
        />
      </TabsContent>
      
      <TabsContent value="technique" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <TechniquePanel
          techniques={protagonist.techniques}
          equippedAttackTechniques={protagonist.equippedAttackTechniques}
          equippedDefenseTechniques={protagonist.equippedDefenseTechniques}
          onEquip={onEquipTechnique}
          onUnequip={onUnequipTechnique}
          onUpgrade={(technique) => setUpgradeTarget({ item: technique, type: 'technique' })}
          useGlobalState={false}
        />
      </TabsContent>
      
      <TabsContent value="equipment" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <EquipmentPanel
          equipments={protagonist.equipments}
          equippedMelee={protagonist.equippedMelee}
          equippedRanged={protagonist.equippedRanged}
          equippedHead={protagonist.equippedHead}
          equippedBody={protagonist.equippedBody}
          equippedLegs={protagonist.equippedLegs}
          equippedFeet={protagonist.equippedFeet}
          onEquip={onEquipEquipment}
          onUnequip={onUnequipEquipment}
          onUpgrade={(equipment) => setUpgradeTarget({ item: equipment, type: 'equipment' })}
        />
      </TabsContent>
      
      <TabsContent value="fragment" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <FragmentPanel
          fragmentInventory={protagonist.fragmentInventory ?? createEmptyFragmentInventory()}
          playerLevel={protagonist.level}
          worldType={protagonist.world.type}
          onSynthesize={(type, rarity, sourceName) => onSynthesizeFragment?.(type, rarity, sourceName)}
        />
      </TabsContent>
      
      <TabsContent value="skill" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <SkillsTab
          techniques={protagonist.techniques}
          equipments={protagonist.equipments}
          equippedMelee={protagonist.equippedMelee}
          equippedRanged={protagonist.equippedRanged}
          activeTab={skillTabActiveTab}
          onTabChange={setSkillTabActiveTab}
          onTechniqueChange={onUpdateTechnique}
          onEquipmentChange={onUpdateEquipment}
        />
      </TabsContent>
      
      <TabsContent value="alchemy" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <AlchemyPanel
          inventory={protagonist.inventory}
          playerLevel={protagonist.level}
          crafting={crafting}
          onStartCrafting={onStartCrafting}
          onFinishCrafting={onFinishCrafting}
        />
      </TabsContent>
      
      <TabsContent value="forge" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <ForgePanel
          inventory={protagonist.inventory}
          playerLevel={protagonist.level}
          forging={forging}
          onStartForging={onStartForging}
          onFinishForging={onFinishForging}
        />
      </TabsContent>
      
      <TabsContent value="tower" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <TowerPanel
          towerProgress={protagonist.towerProgress ?? createDefaultTowerProgress()}
          playerLevel={protagonist.level}
          worldType={protagonist.world.type}
          currentHp={protagonist.currentHp}
          maxHp={protagonist.maxHp}
          currentMp={protagonist.currentMp}
          maxMp={protagonist.maxMp}
          currentStamina={protagonist.stamina ?? 100}
          maxStamina={protagonist.maxStamina ?? 100}
          disabled={false}
          onChallenge={(floor, enemy) => onChallengeTower?.(floor, enemy)}
        />
      </TabsContent>
      
      <TabsContent value="achievement" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <AchievementPanel
          statistics={statistics}
          unlockedAchievementIds={unlockedAchievementIds}
          claimedAchievementIds={claimedAchievementIds}
          onClaimReward={onClaimAchievementReward}
        />
      </TabsContent>
      
      <TabsContent value="collection" className="mt-3 h-[calc(100%-3rem)] min-h-[300px]">
        <CollectionPanel
          techniques={protagonist.techniques}
          equipments={protagonist.equipments}
          statistics={statistics}
        />
      </TabsContent>
      
      <TabsContent value="statistics" className="mt-3 h-[calc(100%-3rem)] overflow-auto min-h-[300px]">
        <StatisticsPanel
          statistics={statistics}
          protagonist={protagonist}
        />
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="min-h-dvh md:h-dvh flex flex-col bg-background">
      {/* 顶部标题栏 - 固定 */}
      <header className="shrink-0 z-10 bg-gradient-to-r from-card via-muted/80 to-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4">
          <GameHeader protagonist={protagonist} timeSystem={timeSystem} mentalState={mentalState} />
        </div>
      </header>

      {/* ========== 移动端布局：内容依次平铺，整体可滚动 ========== */}
      <MobileLayout
        protagonist={protagonist}
        cultivationPath={protagonist.cultivationPath}
        pathLevel={protagonist.pathLevel}
        pathExp={protagonist.pathExp}
        mentalState={mentalState}
        battleState={battleState}
        onReset={() => setShowResetConfirm(true)}
        onExportSave={onExportSave}
        onImportSave={onImportSave}
        onCloseResult={onCloseResult}
        TabsContentSection={<TabsContentSection />}
        playerTechniques={protagonist.equippedAttackTechniques.filter(Boolean) as Technique[]}
        playerWeapons={{ melee: protagonist.equippedMelee, ranged: protagonist.equippedRanged }}
      />

      {/* ========== PC端布局：三栏布局，内部滚动 ========== */}
      <main className="hidden md:flex flex-1 min-h-0 max-w-7xl mx-auto w-full p-3">
        <div className="grid grid-cols-12 gap-3 h-full w-full">
          {/* 左侧：状态面板 */}
          <LeftSidebar
            protagonist={protagonist}
            cultivationPath={protagonist.cultivationPath}
            pathLevel={protagonist.pathLevel}
            pathExp={protagonist.pathExp}
            mentalState={mentalState}
            onReset={() => setShowResetConfirm(true)}
            onExportSave={onExportSave}
            onImportSave={onImportSave}
          />

          {/* 中间：操作面板 */}
          <CenterPanel
            TabsContentSection={<TabsContentSection />}
            battleState={battleState}
            onCloseResult={onCloseResult}
            playerTechniques={protagonist.equippedAttackTechniques.filter(Boolean) as Technique[]}
            playerWeapons={{ melee: protagonist.equippedMelee, ranged: protagonist.equippedRanged }}
          />

          {/* 右侧：聊天室和消息面板（Tab切换） */}
          <RightSidebar
            protagonistId={protagonist.character.id}
            protagonistName={protagonist.character.name}
            protagonistLevel={protagonist.level}
            realmSystem={protagonist.world.realmSystem}
            messages={messages}
            totalMessageCount={totalMessageCount}
            hasMoreMessages={hasMoreMessages}
            isLoadingMessages={isLoadingMessages}
            onLoadMoreMessages={onLoadMoreMessages}
            leaderboards={leaderboards}
            onlineCount={onlineCount}
            announcements={announcements}
            setActiveMode={setActiveMode}
          />
        </div>
      </main>

      {/* 流派选择弹窗 - 移到 Tabs 外部避免 Tab 切换导致的状态重置 */}
      <CultivationPathSelect
        isOpen={showPathSelect}
        onClose={() => setShowPathSelect(false)}
        playerLevel={protagonist.level}
        playerStats={getFinalStats(protagonist.stats)}
        currentPath={protagonist.cultivationPath ?? null}
        worldType={protagonist.world.type}
        pathLevel={protagonist.pathLevel ?? 1}
        onSelectPath={(path) => {
          if (onSelectCultivationPath) {
            onSelectCultivationPath(path);
          }
          setShowPathSelect(false);
        }}
      />
      
      {/* 游戏弹窗 */}
      <GameDialogs
        showResetConfirm={showResetConfirm}
        onCloseResetConfirm={() => setShowResetConfirm(false)}
        onReset={onReset}
        showExitConfirm={showExitConfirm}
        adventureLoot={adventureLoot ?? []}
        isExplorationComplete={isExplorationComplete}
        isBossDefeated={adventureSession?.bossDefeated ?? false}
        onCloseExitConfirm={() => setShowExitConfirm(false)}
        onExitAdventure={onExitAdventure}
        upgradeTarget={upgradeTarget}
        onCloseUpgradeTarget={() => setUpgradeTarget(null)}
        protagonist={protagonist}
        onUpgradeTechnique={onUpgradeTechnique}
        onUpgradeEquipment={onUpgradeEquipment}
        devHandlers={devHandlers}
        devInvincible={devInvincible}
        onToggleDevInvincible={onToggleDevInvincible}
        showGuardianBattle={showGuardianBattle}
        onOpenChangeGuardianBattle={() => {}}
        ascensionBattleEndedRef={ascensionBattleEndedRef}
        onAscensionBattleEnd={onAscensionBattleEnd}
        showInheritanceSelect={showInheritanceSelect}
        onInheritanceConfirm={onInheritanceConfirm}
        onInheritanceSkip={onInheritanceSkip}
        showWorldReveal={showWorldReveal}
        ascensionNewWorld={ascensionNewWorld}
        onWorldConfirm={onWorldConfirm}
        onWorldReroll={onWorldReroll}
        showNoviceCompletionDialog={showNoviceCompletionDialog}
        onCloseNoviceCompletionDialog={onCloseNoviceCompletionDialog}
        showTutorialCompletionDialog={showTutorialCompletionDialog}
        onCloseTutorialCompletionDialog={onCloseTutorialCompletionDialog}
      />
      
      {/* 残血蒙层 */}
      <CriticalHealthOverlay 
        currentHp={protagonist.currentHp} 
        maxHp={protagonist.maxHp} 
      />
      
      {/* 死亡弹窗 */}
      <DeathDialog 
        deathState={deathState}
        onClose={onClearDeathState || (() => {})}
        recoveryHp={deathState?.recoveryHp}
      />
      
      {/* 交互式战斗弹窗 */}
      {activeBattle?.isActive && (adventureConfig || activeBattle.source === 'tower') && (() => {
        // 爬塔战斗使用满状态，不影响玩家实际状态
        const battleProtagonist = activeBattle.source === 'tower' 
          ? { ...protagonist, currentHp: protagonist.maxHp, currentMp: protagonist.maxMp }
          : protagonist;
        
        return (
          <BattleDialog
            open={true}
            onOpenChange={(open) => {
              if (!open && onBattleEnd) {
                // 战斗中关闭视为逃跑
                onBattleEnd({ 
                  victory: false, 
                  fled: true,
                  playerHpAfter: protagonist.currentHp,
                  playerMpAfter: protagonist.currentMp,
                });
              }
            }}
            protagonist={battleProtagonist}
            cellType={activeBattle.cellType}
            enemyContent={`${activeBattle.enemyName}(Lv.${activeBattle.enemyLevel})`}
            config={adventureConfig || {
              rows: 5,
              cols: 5,
              difficulty: activeBattle.enemyLevel,
              realmName: '试炼挑战',
              enemyLevelMin: activeBattle.enemyLevel,
              enemyLevelMax: activeBattle.enemyLevel,
              rewardMultiplier: 1,
              portalCount: 0,
            }}
            onBattleEnd={(result) => {
              if (onBattleEnd) {
                onBattleEnd({
                  victory: result.victory,
                  fled: result.fled,
                  playerHpAfter: result.playerHpAfter ?? protagonist.currentHp,
                  playerMpAfter: result.playerMpAfter ?? protagonist.currentMp,
                });
              }
            }}
            autoMode={autoBattle}
            onToggleAutoMode={onToggleAutoBattle}
            devInvincible={devInvincible}
            towerFloor={activeBattle.towerFloor}
            towerEnemy={activeBattle.towerEnemy}
          />
        );
      })()}
      
      {/* 全服公告 Toast 容器 */}
      <AnnouncementContainer
        announcement={announcements[0]}
        maxVisible={3}
        maxQueue={10}
        position="top-right"
      />
    </div>
  );
}
