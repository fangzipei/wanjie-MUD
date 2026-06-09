'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { CharacterSelect } from '@/views/character-select/CharacterSelect';
import { useGame } from '@/views/game/useGameState';

export default function CharacterSelectPage() {
  const router = useRouter();
  const { gameState, selectCharacter, refreshCharacters } = useGame();

  // Redirect if not in character-select phase
  useEffect(() => {
    if (gameState.phase === 'playing' && gameState.protagonist) {
      router.replace('/game');
    } else if (gameState.phase === 'world-select') {
      router.replace('/world-select');
    } else if (gameState.phase === 'backstory' && gameState.protagonist) {
      router.replace('/backstory');
    } else if (gameState.characters.length === 0 && gameState.phase === 'character-select') {
      // Need to go back to world select
      router.replace('/world-select');
    }
  }, [gameState.phase, gameState.protagonist, gameState.selectedWorld, gameState.characters.length, router]);

  const handleSelect = (character: Parameters<typeof selectCharacter>[0]) => {
    selectCharacter(character);
    router.push('/backstory');
  };

  return (
    <CharacterSelect
      characters={gameState.characters}
      onSelect={handleSelect}
      onRefresh={refreshCharacters}
      worldType={gameState.selectedWorld?.type}
      worldName={gameState.selectedWorld?.name}
      onBack={() => router.push('/world-select')}
    />
  );
}
