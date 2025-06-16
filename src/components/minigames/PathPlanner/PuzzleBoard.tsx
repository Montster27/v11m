// /Users/montysharma/V11M2/src/components/minigames/PathPlanner/PuzzleBoard.tsx
import React, { useMemo } from 'react';
import { Coordinate, PuzzleLevel } from '../PathPlannerGame';

interface PuzzleBoardProps {
  level: PuzzleLevel;
  playerPosition: Coordinate;
  collectedKeys: string[];
  unlockedLocks: string[];
  obstaclePositions: Coordinate[];
  onCellClick: (position: Coordinate) => void;
  gameStatus: 'playing' | 'success' | 'failure';
}

type CellType = 'empty' | 'wall' | 'start' | 'goal' | 'player' | 'key' | 'lock' | 'obstacle';

interface CellInfo {
  type: CellType;
  position: Coordinate;
  cost?: number;
  keyId?: string;
  lockId?: string;
  isUnlocked?: boolean;
  isCollected?: boolean;
  obstacleId?: string;
}

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  level,
  playerPosition,
  collectedKeys,
  unlockedLocks,
  obstaclePositions,
  onCellClick,
  gameStatus
}) => {
  // Create grid data with all cell information
  const gridData = useMemo(() => {
    const grid: CellInfo[][] = [];
    
    // Initialize empty grid
    for (let y = 0; y < level.size.y; y++) {
      grid[y] = [];
      for (let x = 0; x < level.size.x; x++) {
        grid[y][x] = {
          type: 'empty',
          position: { x, y }
        };
      }
    }

    // Add walls
    level.walls.forEach(wall => {
      if (wall.y >= 0 && wall.y < level.size.y && wall.x >= 0 && wall.x < level.size.x) {
        grid[wall.y][wall.x].type = 'wall';
      }
    });

    // Add costs for cost optimization variant
    if (level.variant === 'costOptim' && level.costs) {
      level.costs.forEach(costCell => {
        const { x, y } = costCell.position;
        if (y >= 0 && y < level.size.y && x >= 0 && x < level.size.x) {
          grid[y][x].cost = costCell.cost;
        }
      });
    }

    // Add keys
    if (level.keys) {
      level.keys.forEach(key => {
        const { x, y } = key.position;
        if (y >= 0 && y < level.size.y && x >= 0 && x < level.size.x) {
          if (!collectedKeys.includes(key.id)) {
            grid[y][x].type = 'key';
            grid[y][x].keyId = key.id;
          }
        }
      });
    }

    // Add locks
    if (level.locks) {
      level.locks.forEach(lock => {
        const { x, y } = lock.position;
        if (y >= 0 && y < level.size.y && x >= 0 && x < level.size.x) {
          if (!unlockedLocks.includes(lock.id)) {
            grid[y][x].type = 'lock';
            grid[y][x].lockId = lock.id;
            grid[y][x].isUnlocked = unlockedLocks.includes(lock.id);
          }
        }
      });
    }

    // Add obstacles
    obstaclePositions.forEach((pos, index) => {
      const { x, y } = pos;
      if (y >= 0 && y < level.size.y && x >= 0 && x < level.size.x) {
        grid[y][x].type = 'obstacle';
        grid[y][x].obstacleId = `obstacle-${index}`;
      }
    });

    // Mark start and goal
    const { x: startX, y: startY } = level.start;
    if (startY >= 0 && startY < level.size.y && startX >= 0 && startX < level.size.x) {
      if (grid[startY][startX].type === 'empty') {
        grid[startY][startX].type = 'start';
      }
    }

    const { x: goalX, y: goalY } = level.goal;
    if (goalY >= 0 && goalY < level.size.y && goalX >= 0 && goalX < level.size.x) {
      if (grid[goalY][goalX].type === 'empty' || grid[goalY][goalX].type === 'start') {
        grid[goalY][goalX].type = 'goal';
      }
    }

    // Mark player position (overrides other types except obstacles)
    const { x: playerX, y: playerY } = playerPosition;
    if (playerY >= 0 && playerY < level.size.y && playerX >= 0 && playerX < level.size.x) {
      if (grid[playerY][playerX].type !== 'obstacle') {
        grid[playerY][playerX].type = 'player';
      }
    }

    return grid;
  }, [level, playerPosition, collectedKeys, unlockedLocks, obstaclePositions]);

  // Get cell styling
  const getCellClasses = (cell: CellInfo): string => {
    const baseClasses = "w-8 h-8 border border-gray-300 flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer relative";
    
    switch (cell.type) {
      case 'wall':
        return `${baseClasses} bg-gray-800 border-gray-700 cursor-not-allowed`;
      
      case 'player':
        return `${baseClasses} bg-blue-500 border-blue-600 text-white shadow-lg ring-2 ring-blue-300 animate-pulse`;
      
      case 'start':
        return `${baseClasses} bg-green-200 border-green-400 text-green-800`;
      
      case 'goal':
        const goalEffect = gameStatus === 'success' ? 'animate-bounce bg-yellow-300 ring-4 ring-yellow-400' : 'bg-yellow-200';
        return `${baseClasses} ${goalEffect} border-yellow-500 text-yellow-800`;
      
      case 'key':
        return `${baseClasses} bg-amber-200 border-amber-400 text-amber-800 hover:bg-amber-300`;
      
      case 'lock':
        const lockClasses = cell.isUnlocked 
          ? 'bg-gray-200 border-gray-400 text-gray-600 opacity-50' 
          : 'bg-red-200 border-red-400 text-red-800';
        return `${baseClasses} ${lockClasses}`;
      
      case 'obstacle':
        const obstacleEffect = gameStatus === 'failure' && 
                              cell.position.x === playerPosition.x && 
                              cell.position.y === playerPosition.y 
          ? 'animate-ping bg-red-600' 
          : 'bg-red-500 animate-pulse';
        return `${baseClasses} ${obstacleEffect} border-red-600 text-white`;
      
      default:
        const costClasses = cell.cost 
          ? `hover:bg-blue-50 ${getCostColorClasses(cell.cost)}` 
          : 'hover:bg-gray-50';
        return `${baseClasses} bg-white ${costClasses}`;
    }
  };

  // Get cost-based color classes
  const getCostColorClasses = (cost: number): string => {
    if (cost <= 1) return 'bg-green-50 border-green-200';
    if (cost <= 2) return 'bg-yellow-50 border-yellow-200';
    if (cost <= 3) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // Get cell content (icon/text)
  const getCellContent = (cell: CellInfo): string => {
    switch (cell.type) {
      case 'wall':
        return '█';
      case 'player':
        return '👤';
      case 'start':
        return '🏁';
      case 'goal':
        return '🎯';
      case 'key':
        return '🔑';
      case 'lock':
        return cell.isUnlocked ? '🔓' : '🔒';
      case 'obstacle':
        return '💀';
      default:
        return cell.cost ? cell.cost.toString() : '';
    }
  };

  // Calculate grid size for responsive design
  const maxSize = Math.max(level.size.x, level.size.y);
  const cellSize = maxSize <= 8 ? 'w-10 h-10' : maxSize <= 12 ? 'w-8 h-8' : 'w-6 h-6';
  const fontSize = maxSize <= 8 ? 'text-sm' : maxSize <= 12 ? 'text-xs' : 'text-xs';

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Board Title */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Navigate from 🏁 to 🎯 
          {level.variant === 'keyLock' && ' • Collect 🔑 to unlock 🔒'}
          {level.variant === 'dynamic' && ' • Avoid 💀 obstacles'}
          {level.variant === 'costOptim' && ' • Minimize path cost'}
        </p>
      </div>

      {/* Game Board */}
      <div 
        className="inline-block border-2 border-gray-400 bg-gray-50 p-2 rounded-lg shadow-lg"
        role="application"
        aria-label="Path planner puzzle grid"
        tabIndex={0}
      >
        <div 
          className="grid gap-0"
          style={{ 
            gridTemplateColumns: `repeat(${level.size.x}, ${cellSize.split(' ')[0].substring(2)})`,
            gridTemplateRows: `repeat(${level.size.y}, ${cellSize.split(' ')[1].substring(2)})`
          }}
        >
          {gridData.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={getCellClasses(cell).replace('w-8 h-8', cellSize).replace('text-xs', fontSize)}
                onClick={() => onCellClick(cell.position)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCellClick(cell.position);
                  }
                }}
                tabIndex={cell.type === 'wall' ? -1 : 0}
                role="button"
                aria-label={`Cell at row ${y + 1}, column ${x + 1}. ${
                  cell.type === 'wall' ? 'Wall' :
                  cell.type === 'player' ? 'Player position' :
                  cell.type === 'start' ? 'Start position' :
                  cell.type === 'goal' ? 'Goal position' :
                  cell.type === 'key' ? `Key ${cell.keyId}` :
                  cell.type === 'lock' ? `Lock ${cell.lockId}${cell.isUnlocked ? ' (unlocked)' : ''}` :
                  cell.type === 'obstacle' ? 'Obstacle' :
                  cell.cost ? `Empty cell, cost ${cell.cost}` : 'Empty cell'
                }`}
              >
                {getCellContent(cell)}
                
                {/* Cost overlay for cost optimization mode */}
                {level.variant === 'costOptim' && cell.cost && cell.type === 'empty' && (
                  <span className="absolute bottom-0 right-0 text-xs text-gray-500 bg-white rounded-tl px-1">
                    {cell.cost}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600 max-w-lg">
        <div className="flex items-center space-x-1">
          <span>👤</span>
          <span>Player</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>🏁</span>
          <span>Start</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>🎯</span>
          <span>Goal</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>█</span>
          <span>Wall</span>
        </div>
        {level.variant === 'keyLock' && (
          <>
            <div className="flex items-center space-x-1">
              <span>🔑</span>
              <span>Key</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🔒</span>
              <span>Lock</span>
            </div>
          </>
        )}
        {level.variant === 'dynamic' && (
          <div className="flex items-center space-x-1">
            <span>💀</span>
            <span>Obstacle</span>
          </div>
        )}
        {level.variant === 'costOptim' && (
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-gradient-to-r from-green-200 to-red-200 border rounded"></span>
            <span>Cost</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleBoard;