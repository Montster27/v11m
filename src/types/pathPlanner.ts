// /Users/montysharma/v11m2/src/types/pathPlanner.ts
// Shared types for PathPlanner components to avoid circular dependencies

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

export type PathPlannerVariant = 'classic' | 'keyLock' | 'dynamic' | 'costOptim';

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

export interface PathPlannerGameProps {
  onGameComplete: (success: boolean, stats: GameStats) => void;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
  variant?: PathPlannerVariant;
  levelData?: PuzzleLevel;
}

export interface GameConfig {
  gridSize: { width: number; height: number };
  cellSize: number;
  playerSpeed: number;
  gameTimeLimit?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LevelData {
  id: number;
  name: string;
  description: string;
  initialPlayerPosition: Coordinate;
  goal: Coordinate;
  keys: Omit<Key, 'acquired' | 'timestamp'>[];
  locks: Omit<Lock, 'isUnlocked' | 'timestamp'>[];
  obstacles: Omit<Obstacle, 'timestamp'>[];
  timeLimit?: number;
  par: number; // Target completion time
}

// Game events
export type GameEvent = 
  | { type: 'PLAYER_MOVE'; position: Coordinate; direction: 'up' | 'down' | 'left' | 'right' }
  | { type: 'KEY_COLLECTED'; keyId: string; timestamp: number }
  | { type: 'LOCK_UNLOCKED'; lockId: string; timestamp: number }
  | { type: 'OBSTACLE_HIT'; obstacleId: string; timestamp: number }
  | { type: 'GAME_WON'; stats: GameStats }
  | { type: 'GAME_LOST'; reason: string }
  | { type: 'GAME_PAUSED'; timestamp: number }
  | { type: 'GAME_RESUMED'; timestamp: number };

// Utility function types
export type CollisionDetector = (
  playerPos: Coordinate,
  obstacles: Obstacle[],
  timestamp: number
) => boolean;

export type PathValidator = (
  from: Coordinate,
  to: Coordinate,
  level: PuzzleLevel
) => boolean;

export type ScoreCalculator = (
  moves: number,
  timeElapsed: number,
  efficiency: number
) => number;