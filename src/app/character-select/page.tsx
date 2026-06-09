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
    } else if (gameState.phase === 'world-select' && gameState.selectedCharacter) {
      router.replace('/world-select');
    } else if (gameState.phase === 'backstory' && gameState.protagonist) {
      router.replace('/backstory');
    } else if (gameState.characters.length === 0 && gameState.phase === 'character-select') {
      // Need to generate characters first
      router.replace('/');
    }
  }, [gameState.phase, gameState.protagonist, gameState.selectedCharacter, gameState.characters.length, router]);

  const handleSelect = (character: Parameters<typeof selectCharacter>[0]) => {
    selectCharacter(character);
    router.push('/world-select');
  };

  return (
    <CharacterSelect
      characters={gameState.characters}
      onSelect={handleSelect}
      onRefresh={refreshCharacters}
    />
  );
}
