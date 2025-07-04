// /Users/montysharma/v11m2/src/components/SubscriptionAwareMinigameManager.tsx
// Example minigame manager with proper subscription cleanup

import React, { useState, useEffect, useCallback } from 'react';
import { useSubscriptionCleanup, useRenderTracking } from '../utils/memoryLeakDetector';
import { useStoryletStore } from '../store/useStoryletStore';
import { useCoreGameStore } from '../stores/v2';

interface MinigameManagerProps {
  gameId: string | null;
  onGameComplete: (gameId: string, success: boolean, score?: number) => void;
  onClose: () => void;
}

interface MinigameState {
  currentGame: string | null;
  isActive: boolean;
  score: number;
  timeRemaining: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const SubscriptionAwareMinigameManager: React.FC<MinigameManagerProps> = ({
  gameId,
  onGameComplete,
  onClose
}) => {
  // Track renders for performance monitoring
  useRenderTracking('SubscriptionAwareMinigameManager');
  
  // Use subscription cleanup hook
  const { addSubscription, getSubscriptionCount } = useSubscriptionCleanup(
    'SubscriptionAwareMinigameManager',
    [gameId] // Re-setup subscriptions when gameId changes
  );

  const [minigameState, setMinigameState] = useState<MinigameState>({
    currentGame: null,
    isActive: false,
    score: 0,
    timeRemaining: 30,
    difficulty: 'medium'
  });

  const [isLoading, setIsLoading] = useState(false);

  // Store hooks for reactive updates
  const storyletStore = useStoryletStore();
  const coreStore = useCoreGameStore();

  // Game completion handler
  const handleGameComplete = useCallback((success: boolean, finalScore: number) => {
    if (minigameState.currentGame) {
      onGameComplete(minigameState.currentGame, success, finalScore);
    }
    
    setMinigameState(prev => ({
      ...prev,
      isActive: false
    }));
  }, [minigameState.currentGame, onGameComplete]);

  // Setup minigame when gameId changes
  useEffect(() => {
    if (!gameId) {
      setMinigameState(prev => ({ ...prev, currentGame: null, isActive: false }));
      return;
    }

    setIsLoading(true);
    setMinigameState(prev => ({
      ...prev,
      currentGame: gameId,
      isActive: true,
      score: 0,
      timeRemaining: 30
    }));

    // Subscribe to storylet store for minigame-specific events
    const unsubStorylet = useStoryletStore.subscribe(
      (state) => state.activeMinigame,
      (activeMinigame) => {
        if (activeMinigame !== gameId) {
          // Another minigame became active, close this one
          onClose();
        }
      }
    );

    // Subscribe to core store for game state changes that might affect minigame
    const unsubCore = useCoreGameStore.subscribe(
      (state) => ({
        isPaused: state.world?.gameState === 'paused',
        playerEnergy: state.player?.resources?.energy || 0
      }),
      ({ isPaused, playerEnergy }) => {
        if (isPaused && minigameState.isActive) {
          // Pause minigame when game is paused
          setMinigameState(prev => ({ ...prev, isActive: false }));
        } else if (!isPaused && minigameState.currentGame) {
          // Resume minigame when game is unpaused
          setMinigameState(prev => ({ ...prev, isActive: true }));
        }

        // Check if player has enough energy
        if (playerEnergy < 10 && minigameState.isActive) {
          console.warn('[MinigameManager] Player energy too low for minigame');
          handleGameComplete(false, minigameState.score);
        }
      }
    );

    // Track subscriptions for cleanup
    addSubscription(unsubStorylet, 'store', 'StoryletStore');
    addSubscription(unsubCore, 'store', 'CoreGameStore');

    // Game timer
    let timerId: NodeJS.Timeout;
    if (minigameState.isActive && minigameState.timeRemaining > 0) {
      timerId = setInterval(() => {
        setMinigameState(prev => {
          const newTime = prev.timeRemaining - 1;
          
          if (newTime <= 0) {
            // Time's up, complete game
            handleGameComplete(prev.score > 50, prev.score);
            return { ...prev, timeRemaining: 0, isActive: false };
          }
          
          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);

      // Track timer for cleanup
      addSubscription(() => clearInterval(timerId), 'timer', 'minigame-timer');
    }

    setIsLoading(false);

  }, [gameId, addSubscription, handleGameComplete, minigameState.isActive, minigameState.timeRemaining, minigameState.score, onClose]);

  // Handle input events (example for demonstration)
  useEffect(() => {
    if (!minigameState.isActive) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        // Simulate scoring points
        setMinigameState(prev => ({
          ...prev,
          score: prev.score + 10
        }));
      } else if (event.code === 'Escape') {
        event.preventDefault();
        handleGameComplete(false, minigameState.score);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Track event listener for cleanup
    addSubscription(() => {
      window.removeEventListener('keydown', handleKeyPress);
    }, 'event', 'keyboard');

  }, [minigameState.isActive, minigameState.score, addSubscription, handleGameComplete]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div>Loading minigame...</div>
        </div>
      </div>
    );
  }

  // Don't render if no active game
  if (!minigameState.currentGame) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Minigame: {minigameState.currentGame}</h2>
          <button
            onClick={() => handleGameComplete(false, minigameState.score)}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Game Stats */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-600">Score</div>
              <div className="text-2xl font-bold text-blue-600">{minigameState.score}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Time</div>
              <div className="text-2xl font-bold text-red-600">{minigameState.timeRemaining}s</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Difficulty</div>
              <div className="text-sm font-medium capitalize">{minigameState.difficulty}</div>
            </div>
          </div>

          {/* Game Status */}
          <div className="text-center">
            {minigameState.isActive ? (
              <div>
                <div className="text-green-600 font-medium mb-2">Game Active</div>
                <div className="text-sm text-gray-600">Press SPACE to score points, ESC to quit</div>
              </div>
            ) : (
              <div className="text-yellow-600 font-medium">Game Paused</div>
            )}
          </div>

          {/* Debug Info (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="border-t pt-4 text-xs text-gray-500">
              <div>Component Subscriptions: {getSubscriptionCount()}</div>
              <div>Player Energy: {coreStore.player?.resources?.energy || 0}</div>
              <div>Game State: {coreStore.world?.gameState || 'unknown'}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => handleGameComplete(true, minigameState.score)}
              disabled={!minigameState.isActive}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Complete Game
            </button>
            <button
              onClick={() => handleGameComplete(false, minigameState.score)}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Quit Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAwareMinigameManager;