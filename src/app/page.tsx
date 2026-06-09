'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useGame } from '@/views/game/useGameState';
import { StartScreen } from '@/views/home/StartScreen';

export default function HomePage() {
  const router = useRouter();
  const { gameState, startNewGame, importSave } = useGame();

  // Redirect to game if already playing
  useEffect(() => {
    if (gameState.phase === 'playing' && gameState.protagonist) {
      router.replace('/game');
    }
  }, [gameState.phase, gameState.protagonist, router]);

  const handleStart = () => {
    startNewGame();
    router.push('/character-select');
  };

  return (
    <StartScreen onStart={handleStart} onImportSave={importSave} />
  );
}
