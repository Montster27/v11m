// /Users/montysharma/V11M2/src/components/minigames/plugins/PatternSequencePlugin.tsx
// Pattern Sequence Memory Game - Follow and repeat sequences

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface SequenceItem {
  id: number;
  color: string;
  sound?: string;
}

interface PatternSequenceGameState {
  sequence: SequenceItem[];
  playerSequence: SequenceItem[];
  currentLevel: number;
  isShowing: boolean;
  isPlayerTurn: boolean;
  currentShowIndex: number;
  feedback: 'correct' | 'incorrect' | null;
  lives: number;
}

const PatternSequenceGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<PatternSequenceGameState>({
    sequence: [],
    playerSequence: [],
    currentLevel: 1,
    isShowing: false,
    isPlayerTurn: false,
    currentShowIndex: 0,
    feedback: null,
    lives: 3
  });

  // Available sequence items with colors
  const sequenceItems: SequenceItem[] = [
    { id: 0, color: '#FF6B6B' }, // Red
    { id: 1, color: '#4ECDC4' }, // Teal
    { id: 2, color: '#45B7D1' }, // Blue
    { id: 3, color: '#96CEB4' }, // Green
    { id: 4, color: '#FFEAA7' }, // Yellow
    { id: 5, color: '#DDA0DD' }, // Plum
    { id: 6, color: '#FFA07A' }, // Salmon
    { id: 7, color: '#98D8C8' }  // Mint
  ];

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { targetLevel: 8, sequenceItems: 4, timeLimit: 300, showSpeed: 800 };
      case 'medium': return { targetLevel: 12, sequenceItems: 6, showSpeed: 600, timeLimit: 240 };
      case 'hard': return { targetLevel: 16, sequenceItems: 8, showSpeed: 400, timeLimit: 180 };
      case 'expert': return { targetLevel: 20, sequenceItems: 8, showSpeed: 300, timeLimit: 120 };
      default: return { targetLevel: 12, sequenceItems: 6, showSpeed: 600, timeLimit: 240 };
    }
  };

  const difficultyConfig = getDifficultyConfig();
  const availableItems = sequenceItems.slice(0, difficultyConfig.sequenceItems);

  // Generate new sequence level
  const generateSequence = useCallback(() => {
    const sequenceLength = Math.min(gameSpecificState.currentLevel + 2, 20);
    const newSequence: SequenceItem[] = [];
    
    for (let i = 0; i < sequenceLength; i++) {
      const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
      newSequence.push(randomItem);
    }
    
    setGameSpecificState(prev => ({
      ...prev,
      sequence: newSequence,
      playerSequence: [],
      isShowing: true,
      isPlayerTurn: false,
      currentShowIndex: 0,
      feedback: null
    }));
  }, [gameSpecificState.currentLevel, availableItems]);

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && gameSpecificState.sequence.length === 0) {
      generateSequence();
    }
  }, [gameState.isStarted, gameSpecificState.sequence.length, generateSequence]);

  // Show sequence animation
  useEffect(() => {
    if (!gameSpecificState.isShowing) return;

    const timer = setTimeout(() => {
      if (gameSpecificState.currentShowIndex >= gameSpecificState.sequence.length) {
        // Finished showing sequence
        setGameSpecificState(prev => ({
          ...prev,
          isShowing: false,
          isPlayerTurn: true,
          currentShowIndex: 0
        }));
      } else {
        // Show next item
        setGameSpecificState(prev => ({
          ...prev,
          currentShowIndex: prev.currentShowIndex + 1
        }));
      }
    }, difficultyConfig.showSpeed);

    return () => clearTimeout(timer);
  }, [gameSpecificState.isShowing, gameSpecificState.currentShowIndex, gameSpecificState.sequence.length, difficultyConfig.showSpeed]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.currentLevel > difficultyConfig.targetLevel && !gameState.isCompleted) {
      const timeElapsed = getElapsedTime();
      const score = calculateScore();
      
      completeGame(true, score, {
        level: gameSpecificState.currentLevel - 1,
        accuracy: 1 - ((3 - gameSpecificState.lives) / 3)
      });
    }
  }, [gameSpecificState.currentLevel, difficultyConfig.targetLevel, gameState.isCompleted]);

  // Check for lose condition
  useEffect(() => {
    if (gameSpecificState.lives <= 0 && !gameState.isCompleted) {
      const score = calculateScore();
      
      completeGame(false, score, {
        level: gameSpecificState.currentLevel,
        accuracy: 1 - ((3 - gameSpecificState.lives) / 3)
      });
    }
  }, [gameSpecificState.lives, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const score = calculateScore();
      
      completeGame(false, score, {
        level: gameSpecificState.currentLevel,
        accuracy: 1 - ((3 - gameSpecificState.lives) / 3)
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  const calculateScore = (): number => {
    const baseScore = (gameSpecificState.currentLevel - 1) * 100;
    const timeBonus = Math.max(0, difficultyConfig.timeLimit - Math.floor(getElapsedTime() / 1000)) * 5;
    const livesBonus = gameSpecificState.lives * 50;
    
    return baseScore + timeBonus + livesBonus;
  };

  // Handle player input
  const handleItemClick = (item: SequenceItem) => {
    if (!gameSpecificState.isPlayerTurn || gameState.isPaused || gameState.isCompleted) return;

    incrementAttempts();
    const newPlayerSequence = [...gameSpecificState.playerSequence, item];
    const currentIndex = gameSpecificState.playerSequence.length;
    const expectedItem = gameSpecificState.sequence[currentIndex];

    if (item.id !== expectedItem.id) {
      // Wrong item
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'incorrect',
        lives: prev.lives - 1,
        isPlayerTurn: false
      }));

      // Reset after showing feedback
      setTimeout(() => {
        if (gameSpecificState.lives - 1 > 0) {
          generateSequence(); // Restart same level
        }
      }, 2000);
      return;
    }

    // Correct item
    setGameSpecificState(prev => ({
      ...prev,
      playerSequence: newPlayerSequence
    }));

    // Check if sequence is complete
    if (newPlayerSequence.length === gameSpecificState.sequence.length) {
      // Level complete!
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'correct',
        currentLevel: prev.currentLevel + 1,
        isPlayerTurn: false
      }));

      // Start next level
      setTimeout(() => {
        generateSequence();
      }, 2000);
    }
  };

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.currentLevel > difficultyConfig.targetLevel ? '🧠 Pattern Master!' : '💔 Game Over'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Level Reached: {gameSpecificState.currentLevel - 1}</div>
            <div>Time: {timeElapsed}s</div>
            <div>Lives Used: {3 - gameSpecificState.lives}</div>
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Pattern Sequence</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">Level: {gameSpecificState.currentLevel}</div>
            <div className="text-sm">Score: {gameState.score}</div>
            <div className="text-sm">Lives: {'❤️'.repeat(gameSpecificState.lives)}</div>
          </div>
          
          <button
            onClick={props.onClose}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Game Area */}
        <div className="p-6">
          {/* Status Display */}
          <div className="text-center mb-6">
            {gameSpecificState.isShowing && (
              <div className="text-lg font-semibold text-blue-600">
                Watch the sequence... ({gameSpecificState.currentShowIndex}/{gameSpecificState.sequence.length})
              </div>
            )}
            {gameSpecificState.isPlayerTurn && (
              <div className="text-lg font-semibold text-green-600">
                Repeat the sequence! ({gameSpecificState.playerSequence.length}/{gameSpecificState.sequence.length})
              </div>
            )}
          </div>

          {/* Sequence Display Grid */}
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-6">
            {availableItems.map((item, index) => {
              const isHighlighted = gameSpecificState.isShowing && 
                                   gameSpecificState.currentShowIndex > 0 && 
                                   gameSpecificState.sequence[gameSpecificState.currentShowIndex - 1]?.id === item.id;
              
              const isClickable = gameSpecificState.isPlayerTurn;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={!isClickable}
                  className={`
                    w-20 h-20 rounded-lg border-4 transition-all duration-200 transform
                    ${isHighlighted 
                      ? 'scale-110 shadow-lg ring-4 ring-yellow-300 border-yellow-400' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                    ${isClickable 
                      ? 'hover:scale-105 active:scale-95 cursor-pointer' 
                      : 'cursor-not-allowed opacity-60'
                    }
                  `}
                  style={{ backgroundColor: item.color }}
                >
                  <span className="text-white font-bold text-lg drop-shadow-lg">
                    {index + 1}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="max-w-md mx-auto mb-6">
            <div className="text-sm text-gray-600 mb-2">
              Sequence Length: {gameSpecificState.sequence.length}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: gameSpecificState.isPlayerTurn 
                    ? `${(gameSpecificState.playerSequence.length / gameSpecificState.sequence.length) * 100}%`
                    : `${(gameSpecificState.currentShowIndex / gameSpecificState.sequence.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Feedback */}
          {gameSpecificState.feedback && (
            <div className={`text-center p-4 rounded-lg mb-4 ${
              gameSpecificState.feedback === 'correct' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className="text-xl font-bold">
                {gameSpecificState.feedback === 'correct' ? '✅ Perfect!' : '❌ Wrong Sequence'}
              </div>
              <div>
                {gameSpecificState.feedback === 'correct' 
                  ? `Level ${gameSpecificState.currentLevel - 1} completed! Moving to next level...` 
                  : `Incorrect! ${gameSpecificState.lives - 1} lives left. Restarting level...`
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Watch the sequence, then repeat it by clicking the colored buttons in order! • Target: Level {difficultyConfig.targetLevel}
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const patternSequencePlugin: MinigamePlugin = {
  id: 'pattern-sequence',
  name: 'Pattern Sequence',
  description: 'Watch and repeat increasingly complex color sequences',
  category: 'memory',
  version: '1.0.0',
  
  difficultyConfig: {
    easy: { targetLevel: 8, sequenceItems: 4, timeLimit: 300, showSpeed: 800 },
    medium: { targetLevel: 12, sequenceItems: 6, timeLimit: 240, showSpeed: 600 },
    hard: { targetLevel: 16, sequenceItems: 8, timeLimit: 180, showSpeed: 400 },
    expert: { targetLevel: 20, sequenceItems: 8, timeLimit: 120, showSpeed: 300 }
  },
  
  defaultDifficulty: 'medium',
  component: PatternSequenceGame,
  
  tags: ['memory', 'sequence', 'pattern-recognition', 'concentration'],
  estimatedDuration: 240, // 4 minutes
  requiredSkills: ['memory', 'attention'],
  cognitiveLoad: 'medium',
  
  helpText: 'Watch the sequence of colored buttons light up, then repeat the pattern by clicking them in the same order.',
  controls: ['Watch the sequence carefully', 'Click buttons in order', 'Complete increasingly longer sequences'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.targetLevel !== 'number' || typeof config.sequenceItems !== 'number' || typeof config.timeLimit !== 'number') {
        return false;
      }
      if (config.targetLevel <= 0 || config.sequenceItems <= 0 || config.timeLimit <= 0) {
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