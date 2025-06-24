// /Users/montysharma/V11M2/src/components/minigames/plugins/PathPlannerPlugin.tsx
// Path Planner Game migrated to plugin architecture

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';
import PuzzleBoard from '../PathPlanner/PuzzleBoard';
import KeyLockHUD from '../PathPlanner/KeyLockHUD';
import ObstacleTimeline from '../PathPlanner/ObstacleTimeline';
import CostTracker from '../PathPlanner/CostTracker';
import { generatePuzzle, validateMove, checkWinCondition } from '../../../utils/pathPlannerUtils';

export type PathPlannerVariant = 'classic' | 'keyLock' | 'dynamic' | 'costOptim';

export interface Coordinate {
  x: number;
  y: number;
}

export interface Key {
  id: string;
  position: Coordinate;
  collected: boolean;
}

export interface Lock {
  id: string;
  position: Coordinate;
  keyId: string;
  unlocked: boolean;
}

export interface Obstacle {
  id: string;
  path: Coordinate[];
  currentIndex: number;
  period: number;
}

export interface CellCost {
  position: Coordinate;
  cost: number;
}

export interface PuzzleLevel {
  variant: PathPlannerVariant;
  size: Coordinate;
  start: Coordinate;
  goal: Coordinate;
  walls: Coordinate[];
  keys?: Key[];
  locks?: Lock[];
  obstacles?: Obstacle[];
  costs?: CellCost[];
  budget?: number;
  timeLimit?: number;
}

interface PathPlannerGameState {
  currentLevel: PuzzleLevel | null;
  playerPosition: Coordinate;
  moveCount: number;
  turnCount: number;
  collectedKeys: string[];
  unlockedLocks: string[];
  totalCost: number;
  showHint: boolean;
  variant: PathPlannerVariant;
}

const PathPlannerGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<PathPlannerGameState>({
    currentLevel: null,
    playerPosition: { x: 0, y: 0 },
    moveCount: 0,
    turnCount: 0,
    collectedKeys: [],
    unlockedLocks: [],
    totalCost: 0,
    showHint: false,
    variant: 'classic'
  });

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { size: { x: 8, y: 8 }, obstacles: 2, keys: 1 };
      case 'medium': return { size: { x: 10, y: 10 }, obstacles: 3, keys: 2 };
      case 'hard': return { size: { x: 12, y: 12 }, obstacles: 4, keys: 3 };
      case 'expert': return { size: { x: 15, y: 15 }, obstacles: 5, keys: 4 };
      default: return { size: { x: 10, y: 10 }, obstacles: 3, keys: 2 };
    }
  };

  // Initialize puzzle
  useEffect(() => {
    if (gameState.isStarted && !gameSpecificState.currentLevel) {
      const variants: PathPlannerVariant[] = ['classic', 'keyLock', 'dynamic', 'costOptim'];
      const selectedVariant = variants[Math.floor(Math.random() * variants.length)];
      
      const puzzle = generatePuzzle(selectedVariant, props.difficulty);
      
      setGameSpecificState(prev => ({
        ...prev,
        currentLevel: puzzle,
        playerPosition: puzzle.start,
        variant: selectedVariant,
        moveCount: 0,
        turnCount: 0,
        collectedKeys: [],
        unlockedLocks: [],
        totalCost: 0
      }));
    }
  }, [gameState.isStarted, gameSpecificState.currentLevel, props.difficulty]);

  // Handle player movement
  const handleMove = useCallback((direction: Coordinate) => {
    if (!gameSpecificState.currentLevel || gameState.isPaused || gameState.isCompleted) return;

    const newPosition = {
      x: gameSpecificState.playerPosition.x + direction.x,
      y: gameSpecificState.playerPosition.y + direction.y
    };

    // Validate move
    const moveResult = validateMove(
      newPosition,
      gameSpecificState.currentLevel,
      gameSpecificState.collectedKeys,
      gameSpecificState.unlockedLocks,
      gameSpecificState.turnCount
    );

    if (moveResult.type === 'invalid') {
      console.log('❌ Invalid move:', moveResult.message || 'Cannot move there');
      return;
    }

    if (moveResult.type === 'fail') {
      // Game over - collision with obstacle
      console.log('💥 Game Over:', moveResult.message || 'Collision with obstacle!');
      const score = calculateScore();
      completeGame(false, score, {
        moves: gameSpecificState.moveCount,
        variant: gameSpecificState.variant,
        efficiency: 0
      });
      return;
    }

    // Valid move - update game state
    incrementAttempts();
    
    setGameSpecificState(prev => ({
      ...prev,
      playerPosition: newPosition,
      moveCount: prev.moveCount + 1,
      turnCount: prev.turnCount + 1,
      collectedKeys: moveResult.keyCollected ? [...prev.collectedKeys, moveResult.keyCollected] : prev.collectedKeys,
      totalCost: prev.totalCost + (moveResult.moveCost || 0)
    }));

    // Handle key collection and lock unlocking
    if (moveResult.keyCollected && gameSpecificState.currentLevel.locks) {
      const newlyUnlocked = gameSpecificState.currentLevel.locks
        .filter(lock => lock.keyId === moveResult.keyCollected && !gameSpecificState.unlockedLocks.includes(lock.id))
        .map(lock => lock.id);
      
      if (newlyUnlocked.length > 0) {
        setGameSpecificState(prev => ({
          ...prev,
          unlockedLocks: [...prev.unlockedLocks, ...newlyUnlocked]
        }));
      }
    }

    // Check win condition
    const winResult = checkWinCondition(
      newPosition,
      gameSpecificState.currentLevel,
      gameSpecificState.collectedKeys,
      gameSpecificState.totalCost + (moveResult.moveCost || 0)
    );

    if (winResult.won) {
      const score = calculateScore();
      const optimalMoves = Math.abs(gameSpecificState.currentLevel.goal.x - gameSpecificState.currentLevel.start.x) + 
                          Math.abs(gameSpecificState.currentLevel.goal.y - gameSpecificState.currentLevel.start.y);
      const efficiency = Math.max(0, Math.round((optimalMoves / (gameSpecificState.moveCount + 1)) * 100));
      
      completeGame(true, score, {
        moves: gameSpecificState.moveCount + 1,
        variant: gameSpecificState.variant,
        efficiency,
        keysCollected: gameSpecificState.collectedKeys.length,
        cost: gameSpecificState.totalCost + (moveResult.moveCost || 0)
      });
    } else if (winResult.failed) {
      const score = calculateScore();
      completeGame(false, score, {
        moves: gameSpecificState.moveCount + 1,
        variant: gameSpecificState.variant,
        efficiency: 0
      });
    }
  }, [gameSpecificState, gameState.isPaused, gameState.isCompleted, incrementAttempts, completeGame]);

  // Handle cell click - move toward clicked cell
  const handleCellClick = useCallback((position: Coordinate) => {
    if (!gameSpecificState.currentLevel || gameState.isPaused || gameState.isCompleted) return;

    // Don't move if clicking current position
    if (position.x === gameSpecificState.playerPosition.x && position.y === gameSpecificState.playerPosition.y) return;

    // Calculate direction toward clicked cell (one step at a time)
    const deltaX = position.x - gameSpecificState.playerPosition.x;
    const deltaY = position.y - gameSpecificState.playerPosition.y;
    
    let direction: Coordinate;
    
    // Move one step in the most direct path
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Move horizontally first
      direction = { x: deltaX > 0 ? 1 : -1, y: 0 };
    } else if (Math.abs(deltaY) > 0) {
      // Move vertically
      direction = { x: 0, y: deltaY > 0 ? 1 : -1 };
    } else {
      // Move horizontally if equal
      direction = { x: deltaX > 0 ? 1 : -1, y: 0 };
    }
    
    handleMove(direction);
  }, [gameSpecificState.playerPosition, handleMove, gameState.isPaused, gameState.isCompleted]);

  // Reset puzzle
  const handleReset = useCallback(() => {
    if (!gameSpecificState.currentLevel) return;

    setGameSpecificState(prev => ({
      ...prev,
      playerPosition: prev.currentLevel!.start,
      moveCount: 0,
      turnCount: 0,
      collectedKeys: [],
      unlockedLocks: [],
      totalCost: 0
    }));
  }, [gameSpecificState.currentLevel]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState.isPaused || gameState.isCompleted) return;

      let direction: Coordinate = { x: 0, y: 0 };

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = { x: 1, y: 0 };
          break;
        case 'r':
        case 'R':
          handleReset();
          return;
        case 'h':
        case 'H':
          setGameSpecificState(prev => ({ ...prev, showHint: !prev.showHint }));
          return;
        default:
          return;
      }

      event.preventDefault();
      handleMove(direction);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleMove, handleReset, gameState.isPaused, gameState.isCompleted]);

  const calculateScore = (): number => {
    if (!gameSpecificState.currentLevel) return 0;
    
    const baseScore = 1000;
    const movePenalty = gameSpecificState.moveCount * 5;
    const timePenalty = Math.floor(getElapsedTime() / 1000) * 2;
    const costPenalty = gameSpecificState.totalCost;
    
    return Math.max(0, baseScore - movePenalty - timePenalty - costPenalty);
  };

  // Memoized obstacle positions for current turn
  const currentObstaclePositions = useMemo(() => {
    if (!gameSpecificState.currentLevel?.obstacles) return [];
    
    return gameSpecificState.currentLevel.obstacles.map(obstacle => {
      const index = gameSpecificState.turnCount % obstacle.path.length;
      return obstacle.path[index];
    });
  }, [gameSpecificState.currentLevel?.obstacles, gameSpecificState.turnCount]);

  if (!gameSpecificState.currentLevel) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating puzzle...</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameState.score > 0 ? '🎉 Puzzle Solved!' : '💥 Game Over'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Moves: {gameSpecificState.moveCount}</div>
            <div>Time: {Math.floor(getElapsedTime() / 1000)}s</div>
            <div>Variant: {gameSpecificState.variant}</div>
            {gameSpecificState.variant === 'keyLock' && (
              <div>Keys: {gameSpecificState.collectedKeys.length}</div>
            )}
            {gameSpecificState.variant === 'costOptim' && (
              <div>Cost: {gameSpecificState.totalCost}</div>
            )}
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

  const elapsedTime = Math.round(getElapsedTime() / 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-100">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">
              Path Planner - {gameSpecificState.currentLevel.variant === 'classic' ? 'Classic Maze' :
                             gameSpecificState.currentLevel.variant === 'keyLock' ? 'Key & Lock' :
                             gameSpecificState.currentLevel.variant === 'dynamic' ? 'Dynamic Obstacles' :
                             'Cost Optimization'}
            </h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Moves: {gameSpecificState.moveCount}</div>
            <div className="text-sm">Time: {elapsedTime}s</div>
            <div className="text-sm">Score: {gameState.score}</div>
            {gameSpecificState.currentLevel.variant === 'keyLock' && (
              <div className="text-sm">Keys: {gameSpecificState.collectedKeys.length}/{gameSpecificState.currentLevel.keys?.length || 0}</div>
            )}
            {gameSpecificState.currentLevel.variant === 'costOptim' && (
              <div className="text-sm">Cost: {gameSpecificState.totalCost}{gameSpecificState.currentLevel.budget ? `/${gameSpecificState.currentLevel.budget}` : ''}</div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setGameSpecificState(prev => ({ ...prev, showHint: !prev.showHint }))}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
            >
              {gameSpecificState.showHint ? 'Hide' : 'Show'} Controls
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Reset
            </button>
            <button
              onClick={props.onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Hint Panel */}
        {gameSpecificState.showHint && (
          <div className="p-4 bg-blue-50 border-b text-sm">
            <p className="font-medium text-blue-900 mb-2">Controls:</p>
            <div className="grid grid-cols-2 gap-2 text-blue-800">
              <span>• Arrow Keys or WASD: Move</span>
              <span>• Click adjacent cell: Move</span>
              <span>• R: Reset puzzle</span>
              <span>• H: Toggle this help</span>
            </div>
          </div>
        )}

        {/* Game Content */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="h-full flex flex-col lg:flex-row gap-4">
            {/* Main Game Board */}
            <div className="flex-1 flex items-center justify-center min-h-0">
              <div className="w-full h-full flex items-center justify-center">
                <PuzzleBoard
                  level={gameSpecificState.currentLevel}
                  playerPosition={gameSpecificState.playerPosition}
                  collectedKeys={gameSpecificState.collectedKeys}
                  unlockedLocks={gameSpecificState.unlockedLocks}
                  obstaclePositions={currentObstaclePositions}
                  onCellClick={handleCellClick}
                  gameStatus={gameState.isCompleted ? (gameState.score > 0 ? 'success' : 'failure') : 'playing'}
                />
              </div>
            </div>

            {/* Side Panel with Variant-Specific UI */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4 overflow-y-auto">
              {/* Instructions */}
              <div className="bg-white border rounded-lg p-3">
                <h4 className="font-semibold text-gray-900 mb-2">How to Play</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• <span className="text-green-600">•</span> = Valid moves</p>
                  <p>• Click a green dot or use arrow keys</p>
                  <p>• Reach 🎯 to win!</p>
                  {gameSpecificState.currentLevel.variant === 'keyLock' && <p>• Collect 🔑 to unlock 🔒</p>}
                  {gameSpecificState.currentLevel.variant === 'dynamic' && <p>• Avoid 💀 obstacles</p>}
                  {gameSpecificState.currentLevel.variant === 'costOptim' && <p>• Stay within budget</p>}
                </div>
              </div>
              
              {gameSpecificState.currentLevel.variant === 'keyLock' && (
                <KeyLockHUD
                  keys={gameSpecificState.currentLevel.keys || []}
                  collectedKeys={gameSpecificState.collectedKeys}
                  locks={gameSpecificState.currentLevel.locks || []}
                  unlockedLocks={gameSpecificState.unlockedLocks}
                />
              )}

              {gameSpecificState.currentLevel.variant === 'dynamic' && (
                <ObstacleTimeline
                  obstacles={gameSpecificState.currentLevel.obstacles || []}
                  currentTurn={gameSpecificState.turnCount}
                  previewTurns={3}
                />
              )}

              {gameSpecificState.currentLevel.variant === 'costOptim' && (
                <CostTracker
                  currentCost={gameSpecificState.totalCost}
                  budget={gameSpecificState.currentLevel.budget}
                  moves={gameSpecificState.moveCount}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Navigate from start to goal while avoiding obstacles and collecting keys! • Use arrow keys or click to move
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const pathPlannerPlugin: MinigamePlugin = {
  id: 'path-planner',
  name: 'Path Planner',
  description: 'Navigate mazes with various challenges and obstacles',
  category: 'strategy',
  version: '2.0.0',
  
  difficultyConfig: {
    easy: { size: { x: 8, y: 8 }, obstacles: 2, keys: 1 },
    medium: { size: { x: 10, y: 10 }, obstacles: 3, keys: 2 },
    hard: { size: { x: 12, y: 12 }, obstacles: 4, keys: 3 },
    expert: { size: { x: 15, y: 15 }, obstacles: 5, keys: 4 }
  },
  
  defaultDifficulty: 'medium',
  component: PathPlannerGame,
  
  tags: ['strategy', 'maze', 'pathfinding', 'logic'],
  estimatedDuration: 300, // 5 minutes
  requiredSkills: ['spatial-reasoning', 'planning'],
  cognitiveLoad: 'high',
  
  helpText: 'Navigate from start to goal. Different variants include key collection, moving obstacles, and budget constraints.',
  controls: ['Arrow keys or WASD to move', 'Click adjacent cells', 'R to reset', 'H for help'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || !config.size || typeof config.size.x !== 'number' || typeof config.size.y !== 'number') {
        return false;
      }
      if (config.size.x <= 0 || config.size.y <= 0) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.['spatial-reasoning']) {
      const spatialSkill = context.playerStats.skills['spatial-reasoning'] / 100;
      if (spatialSkill >= 0.8) return 'hard';
      if (spatialSkill >= 0.6) return 'medium';
      if (spatialSkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};