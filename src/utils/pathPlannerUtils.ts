// /Users/montysharma/V11M2/src/utils/pathPlannerUtils.ts
import { 
  PathPlannerVariant, 
  Coordinate, 
  PuzzleLevel, 
  Key, 
  Lock, 
  Obstacle, 
  CellCost 
} from '../components/minigames/PathPlannerGame';

export interface MoveResult {
  type: 'valid' | 'invalid' | 'fail';
  keyCollected?: string;
  moveCost?: number;
  message?: string;
}

export interface WinResult {
  won: boolean;
  failed: boolean;
  reason?: string;
}

// Seeded random number generator for reproducible puzzles
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Generate a puzzle based on variant and difficulty
export function generatePuzzle(
  variant: PathPlannerVariant, 
  difficulty: 'easy' | 'medium' | 'hard',
  seed?: number
): PuzzleLevel {
  const rng = new SeededRandom(seed || Date.now());
  
  // Base difficulty settings
  const difficultySettings = {
    easy: { size: 6, complexity: 0.2, entities: 1 },
    medium: { size: 8, complexity: 0.3, entities: 2 },
    hard: { size: 10, complexity: 0.4, entities: 3 }
  };
  
  const settings = difficultySettings[difficulty];
  const size = { x: settings.size, y: settings.size };
  
  switch (variant) {
    case 'classic':
      return generateClassicMaze(size, settings.complexity, rng);
    case 'keyLock':
      return generateKeyLockPuzzle(size, settings.entities, rng);
    case 'dynamic':
      return generateDynamicObstaclePuzzle(size, settings.entities, rng);
    case 'costOptim':
      return generateCostOptimizationPuzzle(size, settings.complexity, rng);
    default:
      return generateClassicMaze(size, settings.complexity, rng);
  }
}

// Generate classic maze puzzle
function generateClassicMaze(size: Coordinate, complexity: number, rng: SeededRandom): PuzzleLevel {
  const walls: Coordinate[] = [];
  const totalCells = size.x * size.y;
  const wallCount = Math.floor(totalCells * complexity);
  
  // Create maze using randomized algorithm
  for (let i = 0; i < wallCount; i++) {
    let wall: Coordinate;
    let attempts = 0;
    
    do {
      wall = {
        x: rng.nextInt(0, size.x - 1),
        y: rng.nextInt(0, size.y - 1)
      };
      attempts++;
    } while (
      attempts < 50 && (
        isWall(wall, walls) ||
        isAdjacent(wall, { x: 0, y: 0 }) ||
        isAdjacent(wall, { x: size.x - 1, y: size.y - 1 })
      )
    );
    
    if (attempts < 50) {
      walls.push(wall);
    }
  }
  
  return {
    variant: 'classic',
    size,
    start: { x: 0, y: 0 },
    goal: { x: size.x - 1, y: size.y - 1 },
    walls
  };
}

// Generate key-lock puzzle
function generateKeyLockPuzzle(size: Coordinate, keyCount: number, rng: SeededRandom): PuzzleLevel {
  const walls: Coordinate[] = [];
  const keys: Key[] = [];
  const locks: Lock[] = [];
  
  // Create some walls for structure
  const wallCount = Math.floor(size.x * size.y * 0.2);
  for (let i = 0; i < wallCount; i++) {
    let wall: Coordinate;
    let attempts = 0;
    
    do {
      wall = {
        x: rng.nextInt(1, size.x - 2),
        y: rng.nextInt(1, size.y - 2)
      };
      attempts++;
    } while (attempts < 30 && isWall(wall, walls));
    
    if (attempts < 30) {
      walls.push(wall);
    }
  }
  
  // Generate keys and locks
  const keyIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  for (let i = 0; i < keyCount; i++) {
    const keyId = keyIds[i];
    
    // Place key
    const keyPos = findEmptyPosition(size, walls, keys.map(k => k.position), locks.map(l => l.position), rng);
    keys.push({
      id: keyId,
      position: keyPos,
      collected: false
    });
    
    // Place corresponding lock(s)
    const lockPos = findEmptyPosition(size, walls, 
      [...keys.map(k => k.position), ...locks.map(l => l.position)], [], rng);
    locks.push({
      id: `lock-${keyId}`,
      position: lockPos,
      keyId: keyId,
      unlocked: false
    });
  }
  
  return {
    variant: 'keyLock',
    size,
    start: { x: 0, y: 0 },
    goal: { x: size.x - 1, y: size.y - 1 },
    walls,
    keys,
    locks
  };
}

// Generate dynamic obstacle puzzle
function generateDynamicObstaclePuzzle(size: Coordinate, obstacleCount: number, rng: SeededRandom): PuzzleLevel {
  const walls: Coordinate[] = [];
  const obstacles: Obstacle[] = [];
  
  // Create minimal walls
  const wallCount = Math.floor(size.x * size.y * 0.15);
  for (let i = 0; i < wallCount; i++) {
    let wall: Coordinate;
    let attempts = 0;
    
    do {
      wall = {
        x: rng.nextInt(1, size.x - 2),
        y: rng.nextInt(1, size.y - 2)
      };
      attempts++;
    } while (attempts < 30 && isWall(wall, walls));
    
    if (attempts < 30) {
      walls.push(wall);
    }
  }
  
  // Generate moving obstacles
  for (let i = 0; i < obstacleCount; i++) {
    const pathLength = rng.nextInt(3, 6);
    const path: Coordinate[] = [];
    
    // Create a simple patrol path
    const startPos = findEmptyPosition(size, walls, 
      obstacles.flatMap(o => o.path), path, rng);
    path.push(startPos);
    
    // Generate path points
    let currentPos = startPos;
    for (let j = 1; j < pathLength; j++) {
      const directions = [
        { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
      ];
      
      const validDirections = directions.filter(dir => {
        const newPos = { x: currentPos.x + dir.x, y: currentPos.y + dir.y };
        return newPos.x >= 0 && newPos.x < size.x && 
               newPos.y >= 0 && newPos.y < size.y &&
               !isWall(newPos, walls);
      });
      
      if (validDirections.length > 0) {
        const dir = validDirections[rng.nextInt(0, validDirections.length - 1)];
        currentPos = { x: currentPos.x + dir.x, y: currentPos.y + dir.y };
        path.push(currentPos);
      }
    }
    
    obstacles.push({
      id: `obstacle-${i}`,
      path,
      currentIndex: 0,
      period: path.length
    });
  }
  
  return {
    variant: 'dynamic',
    size,
    start: { x: 0, y: 0 },
    goal: { x: size.x - 1, y: size.y - 1 },
    walls,
    obstacles
  };
}

// Generate cost optimization puzzle
function generateCostOptimizationPuzzle(size: Coordinate, complexity: number, rng: SeededRandom): PuzzleLevel {
  const walls: Coordinate[] = [];
  const costs: CellCost[] = [];
  
  // Create some walls for routing challenges
  const wallCount = Math.floor(size.x * size.y * complexity);
  for (let i = 0; i < wallCount; i++) {
    let wall: Coordinate;
    let attempts = 0;
    
    do {
      wall = {
        x: rng.nextInt(1, size.x - 2),
        y: rng.nextInt(1, size.y - 2)
      };
      attempts++;
    } while (attempts < 30 && isWall(wall, walls));
    
    if (attempts < 30) {
      walls.push(wall);
    }
  }
  
  // Assign costs to cells
  for (let y = 0; y < size.y; y++) {
    for (let x = 0; x < size.x; x++) {
      const pos = { x, y };
      if (!isWall(pos, walls) && !(x === 0 && y === 0) && !(x === size.x - 1 && y === size.y - 1)) {
        const cost = rng.nextInt(1, 5);
        costs.push({ position: pos, cost });
      }
    }
  }
  
  // Calculate a reasonable budget (optimal path + 20-50%)
  const optimalCost = calculateOptimalCost(size, walls, costs);
  const budget = Math.ceil(optimalCost * (1.2 + (complexity * 0.3)));
  
  return {
    variant: 'costOptim',
    size,
    start: { x: 0, y: 0 },
    goal: { x: size.x - 1, y: size.y - 1 },
    walls,
    costs,
    budget
  };
}

// Validate a move attempt
export function validateMove(
  newPosition: Coordinate,
  level: PuzzleLevel,
  collectedKeys: string[],
  unlockedLocks: string[],
  currentTurn: number
): MoveResult {
  // Check bounds
  if (newPosition.x < 0 || newPosition.x >= level.size.x ||
      newPosition.y < 0 || newPosition.y >= level.size.y) {
    return { type: 'invalid', message: 'Out of bounds' };
  }
  
  // Check walls
  if (isWall(newPosition, level.walls)) {
    return { type: 'invalid', message: 'Cannot move through wall' };
  }
  
  // Check locks (key-lock variant)
  if (level.variant === 'keyLock' && level.locks) {
    const lockAtPosition = level.locks.find(lock => 
      lock.position.x === newPosition.x && lock.position.y === newPosition.y
    );
    
    if (lockAtPosition && !unlockedLocks.includes(lockAtPosition.id)) {
      return { type: 'invalid', message: 'Door is locked' };
    }
  }
  
  // Check obstacle collision (dynamic variant)
  if (level.variant === 'dynamic' && level.obstacles) {
    // Check if any obstacle will be at newPosition after the turn
    const nextTurn = currentTurn + 1;
    for (const obstacle of level.obstacles) {
      const obstacleNextPos = obstacle.path[nextTurn % obstacle.path.length];
      if (obstacleNextPos.x === newPosition.x && obstacleNextPos.y === newPosition.y) {
        return { type: 'fail', message: 'Collision with obstacle!' };
      }
    }
  }
  
  // Check for key collection
  let keyCollected: string | undefined;
  if (level.variant === 'keyLock' && level.keys) {
    const keyAtPosition = level.keys.find(key => 
      key.position.x === newPosition.x && 
      key.position.y === newPosition.y &&
      !collectedKeys.includes(key.id)
    );
    
    if (keyAtPosition) {
      keyCollected = keyAtPosition.id;
    }
  }
  
  // Calculate move cost
  let moveCost: number | undefined;
  if (level.variant === 'costOptim' && level.costs) {
    const costCell = level.costs.find(cost => 
      cost.position.x === newPosition.x && cost.position.y === newPosition.y
    );
    moveCost = costCell?.cost || 1;
  }
  
  return { 
    type: 'valid', 
    keyCollected, 
    moveCost 
  };
}

// Check win condition
export function checkWinCondition(
  position: Coordinate,
  level: PuzzleLevel,
  collectedKeys: string[],
  totalCost: number
): WinResult {
  // Check if at goal
  if (position.x !== level.goal.x || position.y !== level.goal.y) {
    return { won: false, failed: false };
  }
  
  // Key-lock variant: check if all required keys are collected
  if (level.variant === 'keyLock' && level.keys) {
    const allKeysCollected = level.keys.every(key => collectedKeys.includes(key.id));
    if (!allKeysCollected) {
      return { won: false, failed: false, reason: 'Need all keys to complete' };
    }
  }
  
  // Cost optimization variant: check budget
  if (level.variant === 'costOptim' && level.budget) {
    if (totalCost > level.budget) {
      return { won: false, failed: true, reason: 'Exceeded budget' };
    }
  }
  
  return { won: true, failed: false };
}

// Helper functions

function isWall(position: Coordinate, walls: Coordinate[]): boolean {
  return walls.some(wall => wall.x === position.x && wall.y === position.y);
}

function isAdjacent(pos1: Coordinate, pos2: Coordinate): boolean {
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  return dx <= 1 && dy <= 1 && (dx + dy) > 0;
}

function findEmptyPosition(
  size: Coordinate, 
  walls: Coordinate[], 
  occupied: Coordinate[], 
  additionalOccupied: Coordinate[],
  rng: SeededRandom
): Coordinate {
  let position: Coordinate;
  let attempts = 0;
  
  do {
    position = {
      x: rng.nextInt(1, size.x - 2),
      y: rng.nextInt(1, size.y - 2)
    };
    attempts++;
  } while (
    attempts < 100 && (
      isWall(position, walls) ||
      occupied.some(pos => pos.x === position.x && pos.y === position.y) ||
      additionalOccupied.some(pos => pos.x === position.x && pos.y === position.y) ||
      (position.x === 0 && position.y === 0) ||
      (position.x === size.x - 1 && position.y === size.y - 1)
    )
  );
  
  return position;
}

// Simple pathfinding to calculate optimal cost (for budget setting)
function calculateOptimalCost(size: Coordinate, walls: Coordinate[], costs: CellCost[]): number {
  // Simple A* implementation
  interface Node {
    pos: Coordinate;
    gCost: number;
    hCost: number;
    fCost: number;
    parent?: Node;
  }
  
  const getCost = (pos: Coordinate): number => {
    const costCell = costs.find(c => c.position.x === pos.x && c.position.y === pos.y);
    return costCell?.cost || 1;
  };
  
  const heuristic = (pos: Coordinate, goal: Coordinate): number => {
    return Math.abs(pos.x - goal.x) + Math.abs(pos.y - goal.y);
  };
  
  const start = { x: 0, y: 0 };
  const goal = { x: size.x - 1, y: size.y - 1 };
  
  const openSet: Node[] = [];
  const closedSet: Set<string> = new Set();
  
  const startNode: Node = {
    pos: start,
    gCost: 0,
    hCost: heuristic(start, goal),
    fCost: heuristic(start, goal)
  };
  
  openSet.push(startNode);
  
  while (openSet.length > 0) {
    // Find node with lowest fCost
    openSet.sort((a, b) => a.fCost - b.fCost);
    const currentNode = openSet.shift()!;
    
    const posKey = `${currentNode.pos.x},${currentNode.pos.y}`;
    if (closedSet.has(posKey)) continue;
    closedSet.add(posKey);
    
    // Check if reached goal
    if (currentNode.pos.x === goal.x && currentNode.pos.y === goal.y) {
      return currentNode.gCost;
    }
    
    // Check neighbors
    const directions = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
    
    for (const dir of directions) {
      const neighborPos = {
        x: currentNode.pos.x + dir.x,
        y: currentNode.pos.y + dir.y
      };
      
      // Check bounds
      if (neighborPos.x < 0 || neighborPos.x >= size.x ||
          neighborPos.y < 0 || neighborPos.y >= size.y) {
        continue;
      }
      
      // Check walls
      if (isWall(neighborPos, walls)) {
        continue;
      }
      
      const neighborKey = `${neighborPos.x},${neighborPos.y}`;
      if (closedSet.has(neighborKey)) {
        continue;
      }
      
      const tentativeGCost = currentNode.gCost + getCost(neighborPos);
      
      const neighborNode: Node = {
        pos: neighborPos,
        gCost: tentativeGCost,
        hCost: heuristic(neighborPos, goal),
        fCost: tentativeGCost + heuristic(neighborPos, goal),
        parent: currentNode
      };
      
      openSet.push(neighborNode);
    }
  }
  
  // Fallback if no path found
  return Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
}