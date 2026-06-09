'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useGame } from '@/views/game/useGameState';
import { WorldSelect } from '@/views/world-select/WorldSelect';

export default function WorldSelectPage() {
  const router = useRouter();
  const { gameState, selectWorld } = useGame();

  // Redirect if not in world-select phase
  useEffect(() => {
    if (gameState.phase === 'playing' && gameState.protagonist) {
      router.replace('/game');
    } else if (gameState.phase === 'character-select' && gameState.selectedWorld) {
      router.replace('/character-select');
    } else if (gameState.phase === 'backstory' && gameState.protagonist) {
      router.replace('/backstory');
    }
  }, [gameState.phase, gameState.protagonist, gameState.selectedWorld, router]);

  const handleSelect = (world: Parameters<typeof selectWorld>[0]) => {
    selectWorld(world);
    router.push('/character-select');
  };

  return (
    <WorldSelect
      worlds={gameState.worlds}
      onSelect={handleSelect}
    />
  );
}
