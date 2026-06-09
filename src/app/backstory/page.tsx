'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { BackstoryView } from '@/views/backstory/BackstoryView';
import { useGame } from '@/views/game/useGameState';

export default function BackstoryPage() {
  const router = useRouter();
  const { gameState, confirmBackstory } = useGame();

  // Redirect if not in backstory phase
  useEffect(() => {
    if (!gameState.protagonist) {
      if (gameState.selectedCharacter && gameState.selectedWorld) {
        router.replace('/character-select');
      } else if (gameState.selectedWorld) {
        router.replace('/character-select');
      } else {
        router.replace('/world-select');
      }
    } else if (gameState.phase === 'playing') {
      router.replace('/game');
    }
  }, [gameState.phase, gameState.protagonist, gameState.selectedCharacter, gameState.selectedWorld, router]);

  const handleConfirm = () => {
    confirmBackstory();
    router.push('/game');
  };

  if (!gameState.protagonist) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <BackstoryView
      backstory={gameState.protagonist.backstory}
      onConfirm={handleConfirm}
      characterName={gameState.protagonist.character.name}
      worldName={gameState.protagonist.world.name}
      worldType={gameState.protagonist.world.type}
    />
  );
}
