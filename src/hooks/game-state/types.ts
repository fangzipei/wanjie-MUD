/**
 * 游戏状态上下文类型定义
 *
 * 从 useGameState.tsx 提取，减少巨型文件体积
 */

import type {
  GameState,
  MessageRecord,
  ItemRarity,
  Equipment,
  EquipmentSlot,
  Technique,
  TechniqueType,
  CultivationPath,
  World,
  Character,
  DungeonConfig,
  ActionTab,
  Protagonist,
} from '@/lib/game/types';
import type {
  InheritanceChoice,
  NewWorldInfo,
} from '@/lib/game/typesExtension';
import type { SeclusionType } from '@/lib/game/cultivation/seclusion';
import type { TowerEnemy } from '@/lib/game/tower/types';

/** 游戏上下文接口 */
export interface GameContextType {
  gameState: GameState;
  startNewGame: () => void;
  refreshCharacters: () => Promise<void>;
  selectCharacter: (character: Character) => void;
  selectWorld: (world: World) => void;
  confirmBackstory: () => void;
  performCultivation: () => void;
  performRest: () => void;
  performSeclusion: (type: SeclusionType) => void;
  startExperience: () => void;
  handleEventChoice: (choiceIndex: number) => void;
  startAdventure: (config: DungeonConfig) => void;
  quickSweep: (config: DungeonConfig) => void;
  moveInAdventure: (row: number, col: number) => void;
  clearLastResult: () => void;
  handleBattleEnd: (result: { victory: boolean; playerHpAfter: number; playerMpAfter?: number }) => void;
  toggleAutoBattle: () => void;
  setCurrentTab: (tab: ActionTab) => void;
  useItem: (itemId: string) => void;
  exitAdventure: (exitType?: 'completed' | 'stamina_exhausted' | 'quit' | 'fled') => void;
  addMessage: (type: MessageRecord['type'], title: string, content: string, details?: string, rewards?: MessageRecord['rewards']) => void;
  loadMoreMessages: () => Promise<boolean>;
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  getAvailableDifficulties: () => DungeonConfig[];
  resetGame: () => void;
  toggleAutoCultivation: () => void;
  equipTechnique: (technique: Technique, slotIndex?: number) => void;
  unequipTechnique: (type: 'attack' | 'defense', slotIndex?: number) => void;
  equipEquipment: (equipment: Equipment) => void;
  unequipEquipment: (slot: EquipmentSlot) => void;
  updateTechnique: (updatedTechnique: Technique) => void;
  updateEquipment: (updatedEquipment: Equipment) => void;
  buyShopItem: (
    itemId: string,
    price: number,
    currencyType: string,
    type: 'item' | 'technique' | 'equipment',
    itemData?: any,
    quantity?: number,
    newCurrencies?: { spirit_stone?: number; contribution?: number }
  ) => void;
  buyWithContribution: (
    itemId: string,
    price: number,
    type: 'item' | 'technique' | 'equipment',
    itemData?: any,
    quantity?: number
  ) => void;
  startCrafting: (recipeId: string) => void;
  finishCrafting: () => void;
  startForging: (recipeId: string) => void;
  finishForging: () => void;
  performUpgradeTechnique: (targetId: string, materialIds: string[]) => void;
  performUpgradeEquipment: (targetId: string, materialIds: string[]) => void;
  joinFaction: (factionId: string) => void;
  leaveFaction: () => void;
  claimAchievementReward: (achievementId: string) => void;
  selectCultivationPath: (path: CultivationPath) => void;
  performEnhanceEquipment: (equipmentId: string) => { success: boolean; message: string };
  performRefineEquipment: (equipmentId: string) => { success: boolean; message: string };
  claimTaskReward: (taskId: string) => { success: boolean; message: string };
  claimDailySalary: () => { success: boolean; amount: number };
  acceptTask: (taskId: string, roundType?: 'daily' | 'weekly') => { success: boolean; message: string };
  submitTask: (taskId: string, roundType?: 'daily' | 'weekly') => { success: boolean; message: string };
  refreshTasks: () => { success: boolean; message: string };
  donate: (amount: number) => { success: boolean; message: string };
  promoteRank: () => { success: boolean; message: string };
  performTribulation: () => void;
  challengeGuardian: () => void;
  onAscensionBattleEnd: (result: { victory: boolean; turnsUsed: number; remainingHpPercent: number; phasesCleared: number }) => void;
  onInheritanceConfirm: (choice: InheritanceChoice) => void;
  onInheritanceSkip: () => void;
  onWorldConfirm: (newWorld?: NewWorldInfo) => void;
  onWorldReroll: () => void;
  devInvincible: boolean;
  onToggleDevInvincible: () => void;
  exportSave: () => string;
  synthesizeFragment: (type: 'technique' | 'equipment', rarity: ItemRarity) => void;
  importSave: (jsonString: string) => void;
  clearOfflineResult: () => void;
  applyOfflineRewards: () => void;
  clearNoviceCompletionDialog: () => void;
  clearTutorialCompletionDialog: () => void;
  clearDeathState: () => void;
  challengeTower: (floor: number, enemy: TowerEnemy) => void;
  devHandlers: {
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
    onAddTechniqueByConfig: (type: TechniqueType, rarity: ItemRarity) => void;
    onAddEquipmentByConfig: (slot: EquipmentSlot, rarity: ItemRarity) => void;
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
}
