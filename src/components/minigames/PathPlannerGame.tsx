// /Users/montysharma/V11M2/src/components/minigames/PathPlannerGame.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card } from '../ui';
import PuzzleBoard from './PathPlanner/PuzzleBoard';
import KeyLockHUD from './PathPlanner/KeyLockHUD';
import ObstacleTimeline from './PathPlanner/ObstacleTimeline';
import CostTracker from './PathPlanner/CostTracker';
import { generatePuzzle, validateMove, checkWinCondition } from '../../utils/pathPlannerUtils';

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

export interface GameStats {
  moves: number;
  time: number;
  cost?: number;
  efficiency: number;
  keysCollected?: number;
  variant: PathPlannerVariant;
}

interface PathPlannerGameProps {
  onGameComplete: (success: boolean, stats: GameStats) => void;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  variant?: PathPlannerVariant;
  levelData?: PuzzleLevel;
}

const PathPlannerGame: React.FC<PathPlannerGameProps> = ({
  onGameComplete,
  onClose,
  difficulty = 'medium',
  variant = 'classic',
  levelData
}) => {
  // Game state
  const [gameStatus, setGameStatus] = useState<'playing' | 'success' | 'failure'>('playing');
  const [currentLevel, setCurrentLevel] = useState<PuzzleLevel | null>(null);
  const [playerPosition, setPlayerPosition] = useState<Coordinate>({ x: 0, y: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [turnCount, setTurnCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [collectedKeys, setCollectedKeys] = useState<string[]>([]);
  const [unlockedLocks, setUnlockedLocks] = useState<string[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Timer for elapsed time and obstacle movement
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus]);

  // Initialize puzzle
  useEffect(() => {
    const initPuzzle = () => {
      let puzzle: PuzzleLevel;
      
      if (levelData) {
        puzzle = levelData;
      } else {
        // Generate puzzle based on variant and difficulty
        puzzle = generatePuzzle(variant, difficulty);
      }
      
      setCurrentLevel(puzzle);
      setPlayerPosition(puzzle.start);
      setMoveCount(0);
      setTurnCount(0);
      setCollectedKeys([]);
      setUnlockedLocks([]);
      setTotalCost(0);
      setGameStatus('playing');
    };

    initPuzzle();
  }, [variant, difficulty, levelData]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

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
          setShowHint(!showHint);
          return;
        default:
          return;
      }

      event.preventDefault();
      handleMove(direction);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, playerPosition, currentLevel, collectedKeys, unlockedLocks, totalCost, turnCount, showHint]);

  // Handle player movement
  const handleMove = useCallback((direction: Coordinate) => {
    if (!currentLevel || gameStatus !== 'playing') return;

    const newPosition = {
      x: playerPosition.x + direction.x,
      y: playerPosition.y + direction.y
    };

    // Validate move
    const moveResult = validateMove(
      newPosition,
      currentLevel,
      collectedKeys,
      unlockedLocks,
      turnCount
    );

    if (moveResult.type === 'invalid') {
      // Provide feedback for invalid move
      return;
    }

    if (moveResult.type === 'fail') {
      // Game over - collision with obstacle
      setGameStatus('failure');
      return;
    }

    // Valid move - update game state
    setPlayerPosition(newPosition);
    setMoveCount(prev => prev + 1);
    setTurnCount(prev => prev + 1);

    // Handle cell interactions
    if (moveResult.keyCollected) {
      setCollectedKeys(prev => [...prev, moveResult.keyCollected!]);
      
      // Unlock corresponding locks
      const newlyUnlocked = currentLevel.locks?.filter(
        lock => lock.keyId === moveResult.keyCollected && !unlockedLocks.includes(lock.id)
      ).map(lock => lock.id) || [];
      
      if (newlyUnlocked.length > 0) {
        setUnlockedLocks(prev => [...prev, ...newlyUnlocked]);
      }
    }

    // Handle cost accumulation
    if (currentLevel.variant === 'costOptim' && moveResult.moveCost) {
      setTotalCost(prev => prev + moveResult.moveCost!);
    }

    // Check win condition
    const winResult = checkWinCondition(
      newPosition,
      currentLevel,
      collectedKeys,
      totalCost + (moveResult.moveCost || 0)
    );

    if (winResult.won) {
      setGameStatus('success');
    } else if (winResult.failed) {
      setGameStatus('failure');
    }
  }, [playerPosition, currentLevel, gameStatus, collectedKeys, unlockedLocks, totalCost, turnCount]);

  // Handle cell click (alternative to keyboard)
  const handleCellClick = useCallback((position: Coordinate) => {
    if (!currentLevel || gameStatus !== 'playing') return;

    // Calculate direction from current position
    const direction = {
      x: position.x - playerPosition.x,
      y: position.y - playerPosition.y
    };

    // Only allow adjacent moves (manhattan distance = 1)
    if (Math.abs(direction.x) + Math.abs(direction.y) === 1) {
      handleMove(direction);
    }
  }, [playerPosition, handleMove, currentLevel, gameStatus]);

  // Reset puzzle
  const handleReset = useCallback(() => {
    if (!currentLevel) return;

    setPlayerPosition(currentLevel.start);
    setMoveCount(0);
    setTurnCount(0);
    setCollectedKeys([]);
    setUnlockedLocks([]);
    setTotalCost(0);
    setGameStatus('playing');
  }, [currentLevel]);

  // Complete game
  useEffect(() => {
    if (gameStatus === 'playing' || !currentLevel) return;

    const elapsedTime = currentTime - startTime;
    const success = gameStatus === 'success';

    // Calculate efficiency score (0-100)
    const optimalMoves = Math.abs(currentLevel.goal.x - currentLevel.start.x) + 
                        Math.abs(currentLevel.goal.y - currentLevel.start.y);
    const efficiency = success ? Math.max(0, Math.round((optimalMoves / moveCount) * 100)) : 0;

    const stats: GameStats = {
      moves: moveCount,
      time: Math.round(elapsedTime / 1000),
      efficiency,
      variant: currentLevel.variant,
      ...(currentLevel.variant === 'costOptim' && { cost: totalCost }),
      ...(currentLevel.variant === 'keyLock' && { keysCollected: collectedKeys.length })
    };

    // Delay completion to show final state
    const timer = setTimeout(() => {
      onGameComplete(success, stats);
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameStatus, currentLevel, moveCount, currentTime, startTime, totalCost, collectedKeys.length, onGameComplete]);

  // Memoized obstacle positions for current turn
  const currentObstaclePositions = useMemo(() => {
    if (!currentLevel?.obstacles) return [];
    
    return currentLevel.obstacles.map(obstacle => {
      const index = turnCount % obstacle.path.length;
      return obstacle.path[index];
    });
  }, [currentLevel?.obstacles, turnCount]);

  if (!currentLevel) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating puzzle...</p>
          </div>
        </Card>
      </div>
    );
  }

  const elapsedTime = Math.round((currentTime - startTime) / 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 my-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Path Planner - {currentLevel.variant === 'classic' ? 'Classic Maze' :
                            currentLevel.variant === 'keyLock' ? 'Key & Lock' :
                            currentLevel.variant === 'dynamic' ? 'Dynamic Obstacles' :
                            'Cost Optimization'}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span>Moves: {moveCount}</span>
              <span>Time: {elapsedTime}s</span>
              {currentLevel.variant === 'keyLock' && (
                <span>Keys: {collectedKeys.length}/{currentLevel.keys?.length || 0}</span>
              )}
              {currentLevel.variant === 'costOptim' && (
                <span>Cost: {totalCost}{currentLevel.budget ? `/${currentLevel.budget}` : ''}</span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowHint(!showHint)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {showHint ? 'Hide' : 'Show'} Controls
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Hint Panel */}
        {showHint && (
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
        <div className="p-4 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Game Board */}
            <div className="lg:col-span-3">
              <PuzzleBoard
                level={currentLevel}
                playerPosition={playerPosition}
                collectedKeys={collectedKeys}
                unlockedLocks={unlockedLocks}
                obstaclePositions={currentObstaclePositions}
                onCellClick={handleCellClick}
                gameStatus={gameStatus}
              />
            </div>

            {/* Side Panel with Variant-Specific UI */}
            <div className="space-y-4">
              {currentLevel.variant === 'keyLock' && (
                <KeyLockHUD
                  keys={currentLevel.keys || []}
                  collectedKeys={collectedKeys}
                  locks={currentLevel.locks || []}
                  unlockedLocks={unlockedLocks}
                />
              )}

              {currentLevel.variant === 'dynamic' && (
                <ObstacleTimeline
                  obstacles={currentLevel.obstacles || []}
                  currentTurn={turnCount}
                  previewTurns={3}
                />
              )}

              {currentLevel.variant === 'costOptim' && (
                <CostTracker
                  currentCost={totalCost}
                  budget={currentLevel.budget}
                  moves={moveCount}
                />
              )}

              {/* Game Status */}
              {gameStatus !== 'playing' && (
                <Card className="p-4 text-center">
                  {gameStatus === 'success' ? (
                    <div className="text-green-600">
                      <div className="text-2xl mb-2">🎉</div>
                      <p className="font-bold">Success!</p>
                      <p className="text-sm">Puzzle completed in {moveCount} moves</p>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <div className="text-2xl mb-2">💥</div>
                      <p className="font-bold">Game Over</p>
                      <p className="text-sm">Try again with a different path</p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PathPlannerGame;