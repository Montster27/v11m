// /Users/montysharma/V11M2/src/components/minigames/ModernMinigameManager.tsx
// Modern minigame manager using plugin architecture

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import ErrorBoundary from '../ErrorBoundary';
import { MinigameContext, MinigameResult } from './core/types';
import MinigameEngine from './core/MinigameEngine';
import MinigameRegistry from './core/MinigameRegistry';
import { useMinigameStore } from '../../stores/useMinigameStore';
import { useCoreGameStore, useNarrativeStore } from '../../stores/v2';
import MinigameTutorial from './ui/MinigameTutorial';
import MinigameFeedback from './ui/MinigameFeedback';
import AchievementNotification from './ui/AchievementNotification';
import { useSubscriptionCleanup, useRenderTracking } from '../../utils/memoryLeakDetector';

interface ModernMinigameManagerProps {
  gameId: string | null;
  context?: MinigameContext;
  onGameComplete: (success: boolean, stats?: any) => void;
  onClose: () => void;
}

interface LaunchedGame {
  component: React.ComponentType<any>;
  props: any;
  sessionId: string;
}

const ModernMinigameManager: React.FC<ModernMinigameManagerProps> = ({
  gameId,
  context = {},
  onGameComplete,
  onClose
}) => {
  // Track renders for performance monitoring
  useRenderTracking('ModernMinigameManager');
  
  // Use subscription cleanup hook
  const { addSubscription } = useSubscriptionCleanup(
    'ModernMinigameManager',
    [gameId] // Re-setup when gameId changes
  );

  const [launchedGame, setLaunchedGame] = useState<LaunchedGame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameResult, setGameResult] = useState<MinigameResult | null>(null);
  const [newAchievement, setNewAchievement] = useState<any | null>(null);

  // Store access
  const minigameStore = useMinigameStore();
  const coreStore = useCoreGameStore();
  const narrativeStore = useNarrativeStore();

  // Enhanced context with player data
  const enhancedContext: MinigameContext = {
    ...context,
    playerStats: {
      skills: coreStore.skills || {},
      attributes: coreStore.character?.attributes || {},
      previousPerformance: getPreviousPerformance()
    },
    practiceMode: context.practiceMode || false,
    allowHints: minigameStore.preferences.enableHints,
    timeLimit: context.timeLimit
  };

  function getPreviousPerformance(): Record<string, number> {
    if (!gameId) return {};
    
    const gameStats = minigameStore.getGameStats(gameId);
    if (!gameStats) return {};
    
    return {
      winRate: gameStats.totalPlays > 0 ? gameStats.totalWins / gameStats.totalPlays : 0,
      averageScore: gameStats.averageScore / (gameStats.bestScore || 1000), // Normalize to 0-1
      averageTime: Math.min(gameStats.averageTime / 300, 1) // Normalize to 0-1, capped at 5 minutes
    };
  }

  // Launch game when gameId changes
  useEffect(() => {
    if (gameId && !launchedGame) {
      launchGame();
    } else if (!gameId && launchedGame) {
      setLaunchedGame(null);
    }
  }, [gameId]);

  // Set up engine event listeners
  useEffect(() => {
    const handleSessionStart = (sessionData: any) => {
      minigameStore.startSession(sessionData.sessionId);
      console.log('🎮 Game session started:', sessionData.gameId);
    };

    const handleSessionEnd = (sessionData: any, result: MinigameResult) => {
      minigameStore.endSession(sessionData.sessionId, sessionData);
      minigameStore.recordGameResult(sessionData.gameId, result, sessionData.difficulty);
      
      // Store result for feedback display
      setGameResult(result);
      setLaunchedGame(null);
      setShowFeedback(true);
      
      // Check for achievements
      checkAchievements(sessionData.gameId, result);
      
      console.log('🏁 Game session completed:', {
        game: sessionData.gameId,
        success: result.success,
        score: result.stats.score
      });
    };

    MinigameEngine.addEventListener('sessionStart', handleSessionStart);
    MinigameEngine.addEventListener('sessionEnd', handleSessionEnd);

    // Track event listeners for cleanup
    addSubscription(() => {
      MinigameEngine.removeEventListener('sessionStart', handleSessionStart);
    }, 'event', 'MinigameEngine-sessionStart');
    
    addSubscription(() => {
      MinigameEngine.removeEventListener('sessionEnd', handleSessionEnd);
    }, 'event', 'MinigameEngine-sessionEnd');

  }, [onGameComplete, minigameStore, addSubscription]);

  const launchGame = async () => {
    if (!gameId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if plugin exists
      const plugin = MinigameRegistry.get(gameId);
      if (!plugin) {
        throw new Error(`Game not found: ${gameId}`);
      }

      // Check if tutorial should be shown
      const gameStats = minigameStore.getGameStats(gameId);
      const shouldShowTutorial = minigameStore.preferences.enableTutorials && 
                                 plugin.tutorialComponent &&
                                 (!gameStats || gameStats.totalPlays === 0);

      if (shouldShowTutorial) {
        setShowTutorial(true);
        setIsLoading(false);
        return;
      }

      // Launch game through engine
      const launched = await MinigameEngine.launchGame(
        gameId,
        enhancedContext,
        minigameStore.playerStats
      );

      setLaunchedGame(launched);
      setIsLoading(false);

    } catch (err) {
      console.error('Failed to launch minigame:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    launchGame(); // Launch the actual game after tutorial
  };

  const handleGameClose = () => {
    setLaunchedGame(null);
    onClose();
  };

  const checkAchievements = (gameId: string, result: MinigameResult) => {
    const gameStats = minigameStore.getGameStats(gameId);
    if (!gameStats) return;

    const gameName = MinigameRegistry.get(gameId)?.name || gameId;

    // First win achievement
    if (result.success && gameStats.totalWins === 1) {
      const achievement = {
        id: `${gameId}_first_win`,
        name: 'First Victory',
        description: `Won your first game of ${gameName}`,
        rarity: 'common' as const,
        gameId
      };
      minigameStore.unlockAchievement(achievement.id, achievement.name, achievement.description, achievement.gameId);
      setNewAchievement(achievement);
    }

    // Perfect score achievement
    if (result.stats.score >= 1000) {
      const achievement = {
        id: `${gameId}_perfect_score`,
        name: 'Perfect Score',
        description: 'Achieved a perfect score!',
        rarity: 'epic' as const,
        gameId
      };
      minigameStore.unlockAchievement(achievement.id, achievement.name, achievement.description, achievement.gameId);
      setNewAchievement(achievement);
    }

    // Streak achievements
    if (gameStats.currentStreak === 5) {
      const achievement = {
        id: `${gameId}_streak_5`,
        name: 'Hot Streak',
        description: 'Won 5 games in a row!',
        rarity: 'rare' as const,
        gameId
      };
      minigameStore.unlockAchievement(achievement.id, achievement.name, achievement.description, achievement.gameId);
      setNewAchievement(achievement);
    } else if (gameStats.currentStreak === 10) {
      const achievement = {
        id: `${gameId}_streak_10`,
        name: 'Unstoppable',
        description: 'Won 10 games in a row!',
        rarity: 'legendary' as const,
        gameId
      };
      minigameStore.unlockAchievement(achievement.id, achievement.name, achievement.description, achievement.gameId);
      setNewAchievement(achievement);
    }

    // Speed achievements (for games under 30 seconds)
    if (result.success && result.stats.timeElapsed < 30000) {
      const achievement = {
        id: `${gameId}_speed_demon`,
        name: 'Speed Demon',
        description: 'Completed the game in under 30 seconds!',
        rarity: 'rare' as const,
        gameId
      };
      minigameStore.unlockAchievement(achievement.id, achievement.name, achievement.description, achievement.gameId);
      setNewAchievement(achievement);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-md m-4">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="text-lg font-semibold">Loading Game...</h2>
            <p className="text-sm text-gray-600">
              Preparing {MinigameRegistry.get(gameId || '')?.name || 'minigame'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-md m-4 border-red-200 bg-red-50">
          <div className="text-center space-y-4">
            <div className="text-red-600">
              <h2 className="text-lg font-semibold">Game Error</h2>
              <p className="text-sm mt-2">{error}</p>
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button onClick={launchGame} variant="primary">
                Try Again
              </Button>
              <Button onClick={handleGameClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Tutorial state
  if (showTutorial && gameId) {
    const plugin = MinigameRegistry.get(gameId);
    
    if (plugin) {
      return (
        <MinigameTutorial
          plugin={plugin}
          onComplete={handleTutorialComplete}
          onSkip={handleGameClose}
        />
      );
    }
  }

  // Feedback state
  if (showFeedback && gameResult && gameId) {
    const plugin = MinigameRegistry.get(gameId);
    
    if (plugin) {
      return (
        <MinigameFeedback
          plugin={plugin}
          result={gameResult}
          difficulty={enhancedContext.difficulty || 'medium'}
          onClose={() => {
            setShowFeedback(false);
            setGameResult(null);
            // Call parent completion handler after feedback
            onGameComplete(gameResult.success, {
              ...gameResult.stats,
              feedback: 'shown'
            });
          }}
          onPlayAgain={() => {
            setShowFeedback(false);
            setGameResult(null);
            launchGame();
          }}
          onChangeDifficulty={(newDifficulty) => {
            setShowFeedback(false);
            setGameResult(null);
            // Update context and launch with new difficulty
            enhancedContext.difficulty = newDifficulty as any;
            launchGame();
          }}
        />
      );
    }
  }

  // Game state - render the actual game component
  if (launchedGame) {
    const GameComponent = launchedGame.component;
    
    return (
      <ErrorBoundary
        fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md m-4 border-red-200 bg-red-50">
              <div className="text-center space-y-4">
                <div className="text-red-600">
                  <h2 className="text-lg font-semibold">Game Crashed</h2>
                  <p className="text-sm mt-2">
                    The game encountered an unexpected error.
                  </p>
                </div>
                
                <div className="flex justify-center space-x-3">
                  <Button onClick={launchGame} variant="primary">
                    Restart Game
                  </Button>
                  <Button onClick={handleGameClose} variant="outline">
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        }
      >
        <GameComponent {...launchedGame.props} onClose={handleGameClose} />
      </ErrorBoundary>
    );
  }

  return (
    <>
      {/* Achievement Notification */}
      <AchievementNotification
        achievement={newAchievement}
        isVisible={!!newAchievement}
        onClose={() => setNewAchievement(null)}
      />
    </>
  );
};

export default ModernMinigameManager;