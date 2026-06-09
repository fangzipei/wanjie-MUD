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
      if (gameState.selectedCharacter) {
        router.replace('/world-select');
      } else {
        router.replace('/');
      }
    } else if (gameState.phase === 'playing') {
      router.replace('/game');
    }
  }, [gameState.phase, gameState.protagonist, gameState.selectedCharacter, router]);

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
    />
  );
}
