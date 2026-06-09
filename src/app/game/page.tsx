'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { MainGame } from '@/views/game/MainGame';
import { useGame } from '@/views/game/useGameState';

export default function GamePage() {
  const router = useRouter();
  const game = useGame();
  const { gameState } = game;

  // Redirect if not playing
  useEffect(() => {
    if (!gameState.protagonist && gameState.phase !== 'playing') {
      if (gameState.selectedCharacter && gameState.selectedWorld) {
        router.replace('/backstory');
      } else if (gameState.selectedCharacter) {
        router.replace('/world-select');
      } else if (gameState.characters.length > 0) {
        router.replace('/character-select');
      } else {
        router.replace('/');
      }
    }
  }, [gameState.phase, gameState.protagonist, gameState.characters.length, gameState.selectedCharacter, gameState.selectedWorld, router]);

  if (!gameState.protagonist) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <MainGame
      protagonist={gameState.protagonist}
      timeSystem={gameState.timeSystem}
      currentEvent={gameState.currentEvent}
      adventureGrid={gameState.adventureGrid}
      adventurePosition={gameState.adventurePosition}
      adventureConfig={gameState.adventureConfig}
      adventurePhase={gameState.adventurePhase}
      adventureSession={gameState.adventureSession}
      lastResult={gameState.lastActionResult}
      currentTab={gameState.currentTab}
      battleState={gameState.battleState}
      messages={gameState.messages}
      totalMessageCount={gameState.totalMessageCount}
      hasMoreMessages={game.hasMoreMessages}
      isLoadingMessages={game.isLoadingMessages}
      autoCultivating={gameState.autoCultivating}
      lastExploreTime={gameState.lastExploreTime}
      adventureLoot={gameState.adventureLoot}
      adventureExperience={gameState.adventureExperience}
      crafting={gameState.crafting}
      forging={gameState.forging}
      onCultivate={game.performCultivation}
      onRest={game.performRest}
      onSeclusion={game.performSeclusion}
      onExplore={game.startExperience}
      onChooseEvent={game.handleEventChoice}
      onStartAdventure={game.startAdventure}
      onQuickSweep={game.quickSweep}
      onMoveAdventure={game.moveInAdventure}
      onExitAdventure={game.exitAdventure}
      onCloseResult={game.clearLastResult}
      onTabChange={game.setCurrentTab}
      onUseItem={game.useItem}
      addMessage={game.addMessage}
      onLoadMoreMessages={game.loadMoreMessages}
      availableDifficulties={game.getAvailableDifficulties()}
      onReset={game.resetGame}
      onToggleAutoCultivation={game.toggleAutoCultivation}
      onEquipTechnique={game.equipTechnique}
      onUnequipTechnique={game.unequipTechnique}
      onEquipEquipment={game.equipEquipment}
      onUnequipEquipment={game.unequipEquipment}
      onUpdateTechnique={game.updateTechnique}
      onUpdateEquipment={game.updateEquipment}
      onBuyShopItem={game.buyShopItem}
      onStartCrafting={game.startCrafting}
      onFinishCrafting={game.finishCrafting}
      onStartForging={game.startForging}
      onFinishForging={game.finishForging}
      onUpgradeTechnique={game.performUpgradeTechnique}
      onUpgradeEquipment={game.performUpgradeEquipment}
      onJoinFaction={game.joinFaction}
      onLeaveFaction={game.leaveFaction}
      claimTaskReward={game.claimTaskReward}
      claimDailySalary={game.claimDailySalary}
      onAcceptTask={game.acceptTask}
      onSubmitTask={game.submitTask}
      onRefreshTasks={game.refreshTasks}
      onDonate={game.donate}
      onPromoteRank={game.promoteRank}
      onTribulation={game.performTribulation}
      onExportSave={game.exportSave}
      onImportSave={game.importSave}
      onSynthesizeFragment={game.synthesizeFragment}
      statistics={gameState.statistics}
      completedTutorialTaskIds={gameState.completedTutorialTaskIds || []}
      unlockedAchievementIds={gameState.unlockedAchievementIds}
      claimedAchievementIds={gameState.claimedAchievementIds}
      onClaimAchievementReward={game.claimAchievementReward}
      onSelectCultivationPath={game.selectCultivationPath}
      devInvincible={game.devInvincible}
      onToggleDevInvincible={game.onToggleDevInvincible}
      devHandlers={game.devHandlers}
      onChallengeGuardian={game.challengeGuardian}
      onAscensionBattleEnd={game.onAscensionBattleEnd}
      onInheritanceConfirm={game.onInheritanceConfirm}
      onInheritanceSkip={game.onInheritanceSkip}
      onWorldConfirm={game.onWorldConfirm}
      onWorldReroll={game.onWorldReroll}
      ascensionFlow={gameState.ascensionFlow}
      showNoviceCompletionDialog={gameState.showNoviceCompletionDialog}
      onCloseNoviceCompletionDialog={game.clearNoviceCompletionDialog}
      showTutorialCompletionDialog={gameState.showTutorialCompletionDialog}
      onCloseTutorialCompletionDialog={game.clearTutorialCompletionDialog}
      deathState={gameState.deathState}
      onClearDeathState={game.clearDeathState}
      activeBattle={gameState.activeBattle}
      autoBattle={gameState.autoBattle}
      onBattleEnd={game.handleBattleEnd}
      onToggleAutoBattle={game.toggleAutoBattle}
      onChallengeTower={game.challengeTower}
    />
  );
}
