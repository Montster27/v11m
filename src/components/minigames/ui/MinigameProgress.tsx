// /Users/montysharma/V11M2/src/components/minigames/ui/MinigameProgress.tsx
// Real-time progress and hint system for minigames

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui';

interface MinigameProgressProps {
  timeLimit?: number;
  score: number;
  maxScore?: number;
  hints?: string[];
  showHints?: boolean;
  gameState?: 'playing' | 'paused' | 'completed';
  onHintRequest?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  customMetrics?: { label: string; value: string | number; color?: string }[];
}

const MinigameProgress: React.FC<MinigameProgressProps> = ({
  timeLimit,
  score,
  maxScore = 1000,
  hints = [],
  showHints = true,
  gameState = 'playing',
  onHintRequest,
  onPause,
  onResume,
  customMetrics = []
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 100);
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameState]);

  useEffect(() => {
    // Pulse effect for score increases
    setIsPulsing(true);
    const timeout = setTimeout(() => setIsPulsing(false), 200);
    return () => clearTimeout(timeout);
  }, [score]);

  const timeRemaining = timeLimit ? Math.max(0, timeLimit - timeElapsed) : null;
  const timePercentage = timeLimit ? (timeElapsed / timeLimit) * 100 : 0;
  const scorePercentage = (score / maxScore) * 100;

  const getTimeColor = () => {
    if (!timeRemaining || !timeLimit) return 'text-gray-600';
    const percentRemaining = (timeRemaining / timeLimit) * 100;
    if (percentRemaining > 50) return 'text-green-600';
    if (percentRemaining > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = () => {
    if (!timeRemaining || !timeLimit) return 'bg-blue-500';
    const percentRemaining = (timeRemaining / timeLimit) * 100;
    if (percentRemaining > 50) return 'bg-green-500';
    if (percentRemaining > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = Math.floor((milliseconds % 1000) / 100);
    return `${seconds}.${ms}s`;
  };

  const showNextHint = () => {
    if (hints.length > 0) {
      setCurrentHintIndex((prev) => (prev + 1) % hints.length);
      setIsHintVisible(true);
      
      // Auto-hide hint after 5 seconds
      setTimeout(() => {
        setIsHintVisible(false);
      }, 5000);
      
      onHintRequest?.();
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-40 pointer-events-none">
      <div className="max-w-md mx-auto">
        {/* Main Progress Card */}
        <Card className="bg-white/95 backdrop-blur-sm border shadow-lg pointer-events-auto">
          <div className="p-4">
            {/* Top Row: Time and Score */}
            <div className="flex items-center justify-between mb-3">
              {/* Timer */}
              {timeLimit && (
                <div className="flex items-center space-x-2">
                  <div className={`text-lg font-mono font-bold ${getTimeColor()}`}>
                    {formatTime(timeRemaining || 0)}
                  </div>
                  <div className="text-sm text-gray-500">
                    / {formatTime(timeLimit)}
                  </div>
                </div>
              )}
              
              {/* Elapsed Time (if no time limit) */}
              {!timeLimit && (
                <div className="flex items-center space-x-2">
                  <div className="text-lg font-mono font-bold text-blue-600">
                    {formatTime(timeElapsed)}
                  </div>
                  <div className="text-sm text-gray-500">elapsed</div>
                </div>
              )}

              {/* Score */}
              <div className="flex items-center space-x-2">
                <div className={`text-lg font-bold transition-all duration-200 ${
                  isPulsing ? 'scale-110 text-green-600' : 'text-gray-900'
                }`}>
                  {score.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  / {maxScore.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2">
              {/* Time Progress Bar */}
              {timeLimit && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Time</span>
                    <span>{Math.round(100 - timePercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                      style={{ width: `${Math.min(timePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Score Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Score</span>
                  <span>{Math.round(scorePercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(scorePercentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Custom Metrics */}
            {customMetrics.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {customMetrics.map((metric, index) => (
                  <div key={index} className="text-center">
                    <div className={`font-medium ${metric.color || 'text-gray-900'}`}>
                      {metric.value}
                    </div>
                    <div className="text-xs text-gray-500">{metric.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="mt-3 flex items-center justify-between">
              {/* Game State Controls */}
              <div className="flex space-x-2">
                {gameState === 'playing' && onPause && (
                  <button
                    onClick={onPause}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                  >
                    ⏸️ Pause
                  </button>
                )}
                {gameState === 'paused' && onResume && (
                  <button
                    onClick={onResume}
                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                  >
                    ▶️ Resume
                  </button>
                )}
              </div>

              {/* Hint Button */}
              {showHints && hints.length > 0 && (
                <button
                  onClick={showNextHint}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                >
                  💡 Hint ({currentHintIndex + 1}/{hints.length})
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Hint Card */}
        {isHintVisible && hints[currentHintIndex] && (
          <Card className="mt-2 bg-blue-50/95 backdrop-blur-sm border-blue-200 shadow-lg pointer-events-auto animate-in slide-in-from-top-2 duration-300">
            <div className="p-3">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 text-lg">💡</div>
                <div>
                  <div className="font-medium text-blue-900 text-sm">Hint</div>
                  <div className="text-blue-800 text-sm mt-1">
                    {hints[currentHintIndex]}
                  </div>
                </div>
                <button
                  onClick={() => setIsHintVisible(false)}
                  className="ml-auto text-blue-400 hover:text-blue-600 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Game State Indicator */}
        {gameState === 'paused' && (
          <Card className="mt-2 bg-yellow-50/95 backdrop-blur-sm border-yellow-200 shadow-lg pointer-events-auto">
            <div className="p-3 text-center">
              <div className="text-yellow-600 font-medium text-sm">
                ⏸️ Game Paused
              </div>
              <div className="text-yellow-700 text-xs mt-1">
                Click Resume to continue
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MinigameProgress;