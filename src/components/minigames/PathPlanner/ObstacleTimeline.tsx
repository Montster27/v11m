// /Users/montysharma/V11M2/src/components/minigames/PathPlanner/ObstacleTimeline.tsx
import React from 'react';
import { Card } from '../../ui';
import { Obstacle, Coordinate } from '../PathPlannerGame';

interface ObstacleTimelineProps {
  obstacles: Obstacle[];
  currentTurn: number;
  previewTurns: number;
}

const ObstacleTimeline: React.FC<ObstacleTimelineProps> = ({
  obstacles,
  currentTurn,
  previewTurns = 3
}) => {
  // Calculate obstacle positions for upcoming turns
  const getObstaclePositionAtTurn = (obstacle: Obstacle, turn: number): Coordinate => {
    const index = turn % obstacle.path.length;
    return obstacle.path[index];
  };

  const upcomingTurns = Array.from({ length: previewTurns + 1 }, (_, i) => currentTurn + i);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        <span className="mr-2">💀</span>
        Obstacle Timeline
      </h3>

      {/* Current Turn Indicator */}
      <div className="mb-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-sm font-medium text-yellow-800">
          Current Turn: {currentTurn}
        </div>
        <div className="text-xs text-yellow-600 mt-1">
          Obstacles move after your move
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {upcomingTurns.map((turn, turnIndex) => (
          <div 
            key={turn} 
            className={`p-3 rounded-lg border ${
              turnIndex === 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${
                turnIndex === 0 ? 'text-blue-900' : 'text-gray-700'
              }`}>
                {turnIndex === 0 ? `Turn ${turn} (Current)` : `Turn ${turn}`}
              </span>
              {turnIndex === 0 && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Now
                </span>
              )}
            </div>

            {/* Obstacle Positions */}
            <div className="space-y-2">
              {obstacles.map((obstacle, obstacleIndex) => {
                const position = getObstaclePositionAtTurn(obstacle, turn);
                const nextPosition = turn < currentTurn + previewTurns 
                  ? getObstaclePositionAtTurn(obstacle, turn + 1)
                  : null;

                return (
                  <div key={obstacle.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-500">💀</span>
                      <span className="text-gray-600">Obstacle {obstacleIndex + 1}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-800 font-mono">
                        ({position.x}, {position.y})
                      </span>
                      {nextPosition && turnIndex < previewTurns && (
                        <>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-600 font-mono">
                            ({nextPosition.x}, {nextPosition.y})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Obstacle Movement Patterns */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Movement Patterns:</h4>
        <div className="space-y-2">
          {obstacles.map((obstacle, index) => (
            <div key={obstacle.id} className="text-xs bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-700 mb-1">
                Obstacle {index + 1}:
              </div>
              <div className="text-gray-600">
                Pattern: {obstacle.path.map(pos => `(${pos.x},${pos.y})`).join(' → ')}
              </div>
              <div className="text-gray-500 mt-1">
                Cycle: {obstacle.path.length} turns
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
        <h4 className="text-sm font-medium text-red-900 mb-1">Danger Zone:</h4>
        <ul className="text-xs text-red-800 space-y-1">
          <li>• Avoid stepping on obstacle positions</li>
          <li>• Obstacles move after your turn</li>
          <li>• Plan your timing carefully</li>
          <li>• You can wait by trying to move into a wall</li>
        </ul>
      </div>
    </Card>
  );
};

export default ObstacleTimeline;