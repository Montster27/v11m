// /Users/montysharma/V11M2/src/components/minigames/plugins/MemoryCardPlugin.tsx
// Memory Card Game migrated to plugin architecture

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps, MinigameResult } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface MemoryCard {
  id: string;
  imageId: string;
  isRevealed: boolean;
  isMatched: boolean;
}

interface MemoryCardGameState {
  cards: MemoryCard[];
  selectedCards: string[];
  matches: string[];
  moves: number;
  isChecking: boolean;
  hintsUsed: number;
}

const MemoryCardGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<MemoryCardGameState>({
    cards: [],
    selectedCards: [],
    matches: [],
    moves: 0,
    isChecking: false,
    hintsUsed: 0
  });

  // Available images for the memory game
  const availableImages = [
    'cassette.png', 'coffee_mug.png', 'flyer.png', 'id_card.png',
    'lava_lamp.png', 'notebook.png', 'socks.png', 'walkman.png',
    'beer.png', 'rock_band.png', 'Girl_hair.png', 'police.png',
    'blondie.png', 'Clash.png', 'VHS.png', 'milk_crate.png', 'c64.png'
  ];

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { pairs: 6, timeLimit: 120, allowHints: true };
      case 'medium': return { pairs: 8, timeLimit: 180, allowHints: true };
      case 'hard': return { pairs: 12, timeLimit: 240, allowHints: false };
      case 'expert': return { pairs: 16, timeLimit: 300, allowHints: false };
      default: return { pairs: 8, timeLimit: 180, allowHints: true };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && gameSpecificState.cards.length === 0) {
      initializeCards();
    }
  }, [gameState.isStarted]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.matches.length === difficultyConfig.pairs && !gameState.isCompleted) {
      const timeElapsed = getElapsedTime();
      const score = calculateScore(timeElapsed, gameSpecificState.moves, gameSpecificState.hintsUsed);
      
      completeGame(true, score, {
        moves: gameSpecificState.moves,
        hintsUsed: gameSpecificState.hintsUsed,
        accuracy: 1 - (gameSpecificState.moves - difficultyConfig.pairs) / gameSpecificState.moves
      });
    }
  }, [gameSpecificState.matches.length, difficultyConfig.pairs, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      completeGame(false, gameState.score, {
        moves: gameSpecificState.moves,
        hintsUsed: gameSpecificState.hintsUsed,
        accuracy: gameSpecificState.matches.length / difficultyConfig.pairs
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  const initializeCards = () => {
    const { pairs } = difficultyConfig;
    const selectedImages = availableImages.slice(0, pairs);
    const cardPairs: MemoryCard[] = [];

    // Create pairs of cards
    selectedImages.forEach((imageId, index) => {
      cardPairs.push(
        {
          id: `${imageId}-1`,
          imageId,
          isRevealed: false,
          isMatched: false,
        },
        {
          id: `${imageId}-2`,
          imageId,
          isRevealed: false,
          isMatched: false,
        }
      );
    });

    // Shuffle cards
    const shuffledCards = cardPairs.sort(() => Math.random() - 0.5);
    
    setGameSpecificState(prev => ({
      ...prev,
      cards: shuffledCards
    }));
  };

  const calculateScore = (timeElapsed: number, moves: number, hintsUsed: number): number => {
    const timeInSeconds = timeElapsed / 1000;
    const timeBonus = Math.max(0, difficultyConfig.timeLimit - timeInSeconds);
    const movesPenalty = Math.max(0, moves - difficultyConfig.pairs);
    const hintsPenalty = hintsUsed * 10;
    
    return Math.max(0, Math.round(1000 + timeBonus * 10 - movesPenalty * 5 - hintsPenalty));
  };

  const handleCardClick = (cardId: string) => {
    if (gameState.isPaused || gameState.isCompleted || gameSpecificState.isChecking) return;
    
    const card = gameSpecificState.cards.find(c => c.id === cardId);
    if (!card || card.isRevealed || card.isMatched) return;

    const newSelectedCards = [...gameSpecificState.selectedCards, cardId];
    
    setGameSpecificState(prev => ({
      ...prev,
      selectedCards: newSelectedCards,
      cards: prev.cards.map(c => 
        c.id === cardId ? { ...c, isRevealed: true } : c
      )
    }));

    if (newSelectedCards.length === 2) {
      setGameSpecificState(prev => ({ ...prev, isChecking: true }));
      incrementAttempts();
      
      setTimeout(() => {
        checkForMatch(newSelectedCards);
      }, 1000);
    }
  };

  const checkForMatch = (selectedCardIds: string[]) => {
    const [firstId, secondId] = selectedCardIds;
    const firstCard = gameSpecificState.cards.find(c => c.id === firstId);
    const secondCard = gameSpecificState.cards.find(c => c.id === secondId);

    const isMatch = firstCard?.imageId === secondCard?.imageId;

    setGameSpecificState(prev => ({
      ...prev,
      moves: prev.moves + 1,
      isChecking: false,
      selectedCards: [],
      matches: isMatch ? [...prev.matches, firstCard!.imageId] : prev.matches,
      cards: prev.cards.map(card => {
        if (selectedCardIds.includes(card.id)) {
          return {
            ...card,
            isMatched: isMatch,
            isRevealed: isMatch
          };
        }
        return { ...card, isRevealed: card.isMatched };
      })
    }));
  };

  const useHint = () => {
    if (!difficultyConfig.allowHints || gameSpecificState.hintsUsed >= 3) return;

    // Find an unmatched pair and briefly reveal them
    const unmatchedCards = gameSpecificState.cards.filter(c => !c.isMatched);
    const imageGroups = unmatchedCards.reduce((acc, card) => {
      if (!acc[card.imageId]) acc[card.imageId] = [];
      acc[card.imageId].push(card);
      return acc;
    }, {} as Record<string, MemoryCard[]>);

    const pairToReveal = Object.values(imageGroups).find(group => group.length === 2);
    if (!pairToReveal) return;

    setGameSpecificState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
      cards: prev.cards.map(card => ({
        ...card,
        isRevealed: pairToReveal.some(p => p.id === card.id) ? true : card.isRevealed
      }))
    }));

    // Hide the hint after 2 seconds
    setTimeout(() => {
      setGameSpecificState(prev => ({
        ...prev,
        cards: prev.cards.map(card => ({
          ...card,
          isRevealed: card.isMatched ? true : false
        }))
      }));
    }, 2000);
  };

  const getCardImageUrl = (imageId: string) => {
    return `/public/game_assets/memory_game/${imageId}`;
  };

  const remainingTime = Math.max(0, difficultyConfig.timeLimit - Math.floor(getElapsedTime() / 1000));
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.matches.length === difficultyConfig.pairs ? '🎉 Congratulations!' : '⏰ Time\'s Up!'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Moves: {gameSpecificState.moves}</div>
            <div>Time: {Math.floor(getElapsedTime() / 1000)}s</div>
            {gameSpecificState.hintsUsed > 0 && <div>Hints Used: {gameSpecificState.hintsUsed}</div>}
          </div>
          <button
            onClick={props.onClose}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Memory Card Game</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {minutes}:{seconds.toString().padStart(2, '0')}</div>
            <div className="text-sm">Moves: {gameSpecificState.moves}</div>
            <div className="text-sm">Matches: {gameSpecificState.matches.length}/{difficultyConfig.pairs}</div>
          </div>
          
          <div className="flex space-x-2">
            {difficultyConfig.allowHints && gameSpecificState.hintsUsed < 3 && (
              <button
                onClick={useHint}
                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
              >
                💡 Hint ({3 - gameSpecificState.hintsUsed} left)
              </button>
            )}
            <button
              onClick={props.onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Game Area */}
        <div className="p-6">
          <div className={`grid gap-3 ${
            difficultyConfig.pairs <= 6 ? 'grid-cols-4' :
            difficultyConfig.pairs <= 8 ? 'grid-cols-4' :
            difficultyConfig.pairs <= 12 ? 'grid-cols-6' : 'grid-cols-8'
          }`}>
            {gameSpecificState.cards.map((card) => (
              <div
                key={card.id}
                className={`aspect-square bg-blue-500 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  card.isRevealed || card.isMatched ? 'bg-white' : 'bg-blue-500'
                } ${gameSpecificState.selectedCards.includes(card.id) ? 'ring-2 ring-yellow-400' : ''}`}
                onClick={() => handleCardClick(card.id)}
              >
                {card.isRevealed || card.isMatched ? (
                  <img
                    src={getCardImageUrl(card.imageId)}
                    alt="Memory card"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      // Fallback to colored background if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl">
                    ?
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Click cards to reveal them. Match all pairs to win! • Time limit: {difficultyConfig.timeLimit}s
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const memoryCardPlugin: MinigamePlugin = {
  id: 'memory-cards',
  name: 'Memory Card Game',
  description: 'Test your memory by matching pairs of cards',
  category: 'cognitive',
  version: '2.0.0',
  
  difficultyConfig: {
    easy: { pairs: 6, timeLimit: 120, allowHints: true },
    medium: { pairs: 8, timeLimit: 180, allowHints: true },
    hard: { pairs: 12, timeLimit: 240, allowHints: false },
    expert: { pairs: 16, timeLimit: 300, allowHints: false }
  },
  
  defaultDifficulty: 'medium',
  component: MemoryCardGame,
  
  tags: ['memory', 'matching', 'concentration', 'visual'],
  estimatedDuration: 180, // 3 minutes
  requiredSkills: ['memory', 'concentration'],
  cognitiveLoad: 'medium',
  
  helpText: 'Click on cards to reveal them. Remember their positions and match all pairs to win!',
  controls: ['Mouse click to reveal cards', 'Hint button for assistance (if available)'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.pairs !== 'number' || typeof config.timeLimit !== 'number') {
        return false;
      }
      if (config.pairs <= 0 || config.timeLimit <= 0) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.memory) {
      const memorySkill = context.playerStats.skills.memory / 100;
      if (memorySkill >= 0.8) return 'hard';
      if (memorySkill >= 0.6) return 'medium';
      if (memorySkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};