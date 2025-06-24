// /Users/montysharma/V11M2/src/components/minigames/plugins/ColorMatchPlugin.tsx
// Color Match Game migrated to plugin architecture

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface ColorTile {
  id: string;
  color: string;
  colorName: string;
  isTarget: boolean;
  isMatched: boolean;
  isWrong: boolean;
}

interface ColorMatchGameState {
  currentTarget: string;
  currentTargetName: string;
  colorTiles: ColorTile[];
  matches: number;
  misses: number;
  round: number;
  feedback: 'correct' | 'incorrect' | null;
  lives: number;
}

const ColorMatchGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<ColorMatchGameState>({
    currentTarget: '',
    currentTargetName: '',
    colorTiles: [],
    matches: 0,
    misses: 0,
    round: 1,
    feedback: null,
    lives: 3
  });

  // Color palette with names
  const colorPalette = [
    { color: '#FF6B6B', name: 'Red' },
    { color: '#4ECDC4', name: 'Teal' },
    { color: '#45B7D1', name: 'Blue' },
    { color: '#96CEB4', name: 'Green' },
    { color: '#FFEAA7', name: 'Yellow' },
    { color: '#DDA0DD', name: 'Plum' },
    { color: '#FFA07A', name: 'Salmon' },
    { color: '#98D8C8', name: 'Mint' },
    { color: '#FFCCCB', name: 'Pink' },
    { color: '#D3D3D3', name: 'Gray' },
    { color: '#F7DC6F', name: 'Gold' },
    { color: '#BB8FCE', name: 'Purple' },
    { color: '#85C1E9', name: 'Sky Blue' },
    { color: '#F8C471', name: 'Orange' },
    { color: '#82E0AA', name: 'Light Green' }
  ];

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { gridSize: 4, targetMatches: 8, timeLimit: 90, colors: 6 };
      case 'medium': return { gridSize: 6, targetMatches: 12, timeLimit: 120, colors: 8 };
      case 'hard': return { gridSize: 8, targetMatches: 18, timeLimit: 150, colors: 12 };
      case 'expert': return { gridSize: 10, targetMatches: 25, timeLimit: 180, colors: 15 };
      default: return { gridSize: 6, targetMatches: 12, timeLimit: 120, colors: 8 };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Generate a new round
  const generateRound = useCallback(() => {
    const availableColors = colorPalette.slice(0, difficultyConfig.colors);
    const targetColorIndex = Math.floor(Math.random() * availableColors.length);
    const targetColor = availableColors[targetColorIndex];
    
    const totalTiles = difficultyConfig.gridSize * difficultyConfig.gridSize;
    const tiles: ColorTile[] = [];
    
    // Determine how many target tiles to place (15-25% of tiles)
    const minTargets = Math.max(2, Math.floor(totalTiles * 0.15));
    const maxTargets = Math.max(3, Math.floor(totalTiles * 0.25));
    const targetCount = Math.floor(Math.random() * (maxTargets - minTargets + 1)) + minTargets;
    
    // Create tiles array with correct target count
    for (let i = 0; i < totalTiles; i++) {
      let isTarget = false;
      let colorToUse;
      
      if (i < targetCount) {
        isTarget = true;
        colorToUse = targetColor;
      } else {
        do {
          const randomIndex = Math.floor(Math.random() * availableColors.length);
          colorToUse = availableColors[randomIndex];
        } while (colorToUse.color === targetColor.color);
      }
      
      tiles.push({
        id: `tile-${gameSpecificState.round}-${i}`,
        color: colorToUse.color,
        colorName: colorToUse.name,
        isTarget,
        isMatched: false,
        isWrong: false
      });
    }
    
    // Shuffle the tiles
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    setGameSpecificState(prev => ({
      ...prev,
      currentTarget: targetColor.color,
      currentTargetName: targetColor.name,
      colorTiles: tiles,
      feedback: null
    }));
  }, [difficultyConfig.colors, difficultyConfig.gridSize, gameSpecificState.round]);

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && gameSpecificState.colorTiles.length === 0) {
      generateRound();
    }
  }, [gameState.isStarted, gameSpecificState.colorTiles.length, generateRound]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.matches >= difficultyConfig.targetMatches && !gameState.isCompleted) {
      const timeElapsed = getElapsedTime();
      const score = calculateScore();
      const accuracy = gameSpecificState.matches / (gameSpecificState.matches + gameSpecificState.misses) * 100;
      
      completeGame(true, score, {
        matches: gameSpecificState.matches,
        accuracy,
        rounds: gameSpecificState.round
      });
    }
  }, [gameSpecificState.matches, difficultyConfig.targetMatches, gameState.isCompleted]);

  // Check for lose condition
  useEffect(() => {
    if (gameSpecificState.lives <= 0 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.matches / Math.max(1, gameSpecificState.matches + gameSpecificState.misses) * 100;
      
      completeGame(false, score, {
        matches: gameSpecificState.matches,
        accuracy,
        rounds: gameSpecificState.round
      });
    }
  }, [gameSpecificState.lives, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.matches / Math.max(1, gameSpecificState.matches + gameSpecificState.misses) * 100;
      
      completeGame(false, score, {
        matches: gameSpecificState.matches,
        accuracy,
        rounds: gameSpecificState.round
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  const calculateScore = (): number => {
    return gameSpecificState.matches * 10;
  };

  // Handle tile click
  const handleTileClick = (tileId: string) => {
    if (gameState.isPaused || gameState.isCompleted) return;
    
    const tile = gameSpecificState.colorTiles.find(t => t.id === tileId);
    if (!tile || tile.isMatched || tile.isWrong) return;
    
    incrementAttempts();

    if (tile.isTarget) {
      // Correct match
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'correct',
        matches: prev.matches + 1,
        colorTiles: prev.colorTiles.map(t => 
          t.id === tileId ? { ...t, isMatched: true } : t
        )
      }));
      
      // Check if all target tiles in this round are matched
      const remainingTargets = gameSpecificState.colorTiles.filter(t => t.isTarget && !t.isMatched && t.id !== tileId);
      
      if (remainingTargets.length === 0) {
        // Round complete, start next round after delay
        setTimeout(() => {
          if (!gameState.isCompleted) {
            setGameSpecificState(prev => ({
              ...prev,
              round: prev.round + 1,
              feedback: null
            }));
          }
        }, 1500);
      } else {
        // Clear feedback after short delay for same round
        setTimeout(() => {
          setGameSpecificState(prev => ({ ...prev, feedback: null }));
        }, 800);
      }
    } else {
      // Wrong tile
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'incorrect',
        misses: prev.misses + 1,
        lives: prev.lives - 1,
        colorTiles: prev.colorTiles.map(t => 
          t.id === tileId ? { ...t, isWrong: true } : t
        )
      }));
      
      // Clear wrong indicator and feedback after delay
      setTimeout(() => {
        setGameSpecificState(prev => ({
          ...prev,
          colorTiles: prev.colorTiles.map(t => 
            t.id === tileId ? { ...t, isWrong: false } : t
          ),
          feedback: null
        }));
      }, 1000);
    }
  };

  // Generate new round when round number changes
  useEffect(() => {
    if (gameSpecificState.round > 1) {
      generateRound();
    }
  }, [gameSpecificState.round, generateRound]);

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);
  const accuracy = gameSpecificState.matches + gameSpecificState.misses > 0 ? 
    (gameSpecificState.matches / (gameSpecificState.matches + gameSpecificState.misses)) * 100 : 100;

  // Count current round targets and their status
  const currentRoundTargets = gameSpecificState.colorTiles.filter(t => t.isTarget);
  const matchedInRound = currentRoundTargets.filter(t => t.isMatched).length;
  const totalInRound = currentRoundTargets.length;

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.matches >= difficultyConfig.targetMatches ? '🎉 Excellent Color Vision!' : '💔 Game Over'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Matches: {gameSpecificState.matches}/{difficultyConfig.targetMatches}</div>
            <div>Time: {timeElapsed}s</div>
            <div>Accuracy: {Math.round(accuracy)}%</div>
            <div>Rounds: {gameSpecificState.round}</div>
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
            <h3 className="text-lg font-semibold">Color Match</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">Score: {gameState.score}</div>
            <div className="text-sm">Matches: {gameSpecificState.matches}/{difficultyConfig.targetMatches}</div>
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
          {/* Round Progress */}
          <div className="bg-yellow-50 p-3 rounded-lg mb-6 text-center">
            <div className="text-sm font-semibold text-yellow-800">
              Round {gameSpecificState.round} Progress: {matchedInRound}/{totalInRound} targets found
            </div>
          </div>

          {/* Target Color Display */}
          <div className="text-center mb-6">
            <div className="text-lg font-semibold text-gray-700 mb-3">Find all tiles matching this color:</div>
            <div className="flex items-center justify-center gap-4">
              <div 
                className="w-16 h-16 rounded-lg border-4 border-gray-300 shadow-lg"
                style={{ backgroundColor: gameSpecificState.currentTarget }}
              />
              <div className="text-xl font-bold text-gray-900">{gameSpecificState.currentTargetName}</div>
            </div>
          </div>

          {/* Color Grid */}
          <div 
            className="grid gap-2 mb-6 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${difficultyConfig.gridSize}, minmax(0, 1fr))`,
              maxWidth: `${difficultyConfig.gridSize * 60}px`
            }}
          >
            {gameSpecificState.colorTiles.map((tile) => (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile.id)}
                disabled={gameState.isPaused || gameState.isCompleted || tile.isMatched || tile.isWrong}
                className={`
                  w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 transition-all duration-200 transform
                  ${tile.isMatched 
                    ? 'border-green-500 scale-110 shadow-lg ring-2 ring-green-300' 
                    : tile.isWrong 
                      ? 'border-red-500 scale-90 shadow-lg ring-2 ring-red-300' 
                      : 'border-gray-300 hover:border-gray-400 hover:scale-105 active:scale-95'
                  }
                  ${gameState.isPaused || gameState.isCompleted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                style={{ backgroundColor: tile.color }}
              >
                {tile.isMatched && <span className="text-white text-xl drop-shadow-lg">✓</span>}
                {tile.isWrong && <span className="text-white text-xl drop-shadow-lg">✗</span>}
              </button>
            ))}
          </div>

          {/* Feedback */}
          {gameSpecificState.feedback && (
            <div className={`text-center p-4 rounded-lg mb-4 ${
              gameSpecificState.feedback === 'correct' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className="text-xl font-bold">
                {gameSpecificState.feedback === 'correct' ? '✅ Correct Match!' : '❌ Wrong Color'}
              </div>
              <div>
                {gameSpecificState.feedback === 'correct' 
                  ? '+10 points' 
                  : `That's not ${gameSpecificState.currentTargetName}. ${gameSpecificState.lives - 1} lives left.`
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Click on all tiles that match the target color shown above! • Time limit: {difficultyConfig.timeLimit}s
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const colorMatchPlugin: MinigamePlugin = {
  id: 'color-match',
  name: 'Color Match',
  description: 'Find all tiles matching the target color',
  category: 'visual',
  version: '2.0.0',
  
  difficultyConfig: {
    easy: { gridSize: 4, targetMatches: 8, timeLimit: 90, colors: 6 },
    medium: { gridSize: 6, targetMatches: 12, timeLimit: 120, colors: 8 },
    hard: { gridSize: 8, targetMatches: 18, timeLimit: 150, colors: 12 },
    expert: { gridSize: 10, targetMatches: 25, timeLimit: 180, colors: 15 }
  },
  
  defaultDifficulty: 'medium',
  component: ColorMatchGame,
  
  tags: ['visual', 'color-recognition', 'speed', 'accuracy'],
  estimatedDuration: 120, // 2 minutes
  requiredSkills: ['visual-processing', 'color-discrimination'],
  cognitiveLoad: 'low',
  
  helpText: 'Click on all tiles that match the target color. Avoid clicking wrong colors or you\'ll lose a life!',
  controls: ['Mouse click on tiles', 'Match target color only'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.gridSize !== 'number' || typeof config.targetMatches !== 'number' || typeof config.timeLimit !== 'number') {
        return false;
      }
      if (config.gridSize <= 0 || config.targetMatches <= 0 || config.timeLimit <= 0) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.['visual-processing']) {
      const visualSkill = context.playerStats.skills['visual-processing'] / 100;
      if (visualSkill >= 0.8) return 'hard';
      if (visualSkill >= 0.6) return 'medium';
      if (visualSkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};