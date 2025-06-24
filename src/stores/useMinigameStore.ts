// /Users/montysharma/V11M2/src/stores/useMinigameStore.ts
// Dedicated Zustand store for minigame system

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  PlayerMinigameStats, 
  MinigameResult, 
  MinigameDifficulty,
  MinigameSessionData 
} from '../components/minigames/core/types';

interface MinigameState {
  // Player statistics and progress
  playerStats: PlayerMinigameStats;
  
  // Session management
  currentSessionId: string | null;
  sessionHistory: MinigameSessionData[];
  
  // User preferences
  preferences: {
    enableSounds: boolean;
    enableHints: boolean;
    enableTimers: boolean;
    enableTutorials: boolean;
    preferredDifficulty: MinigameDifficulty | 'auto';
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
  
  // Achievement system
  achievements: {
    [achievementId: string]: {
      id: string;
      name: string;
      description: string;
      unlockedAt: number;
      gameId?: string;
    };
  };
  
  // Analytics and metadata
  metadata: {
    totalPlayTime: number; // milliseconds
    favoriteGame: string | null;
    longestStreak: number;
    totalGamesPlayed: number;
    lastPlayedAt: number;
    version: number;
  };
}

interface MinigameActions {
  // Game result recording
  recordGameResult: (gameId: string, result: MinigameResult, difficulty: MinigameDifficulty) => void;
  
  // Session management
  startSession: (sessionId: string) => void;
  endSession: (sessionId: string, sessionData: MinigameSessionData) => void;
  
  // Statistics management
  getGameStats: (gameId: string) => PlayerMinigameStats[string] | null;
  updateGamePreferences: (gameId: string, preferences: Partial<PlayerMinigameStats[string]['preferences']>) => void;
  
  // User preferences
  updatePreferences: (preferences: Partial<MinigameState['preferences']>) => void;
  
  // Achievement system
  unlockAchievement: (achievementId: string, name: string, description: string, gameId?: string) => void;
  getUnlockedAchievements: (gameId?: string) => MinigameState['achievements'][string][];
  
  // Analytics
  updatePlayTime: (milliseconds: number) => void;
  updateFavoriteGame: () => void;
  
  // Data management
  resetGameStats: (gameId: string) => void;
  resetAllStats: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
  
  // Utility functions
  getOverallStats: () => {
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    overallWinRate: number;
    averageScore: number;
    totalPlayTime: number;
    gamesPlayed: string[];
  };
}

type MinigameStore = MinigameState & MinigameActions;

const initialState: MinigameState = {
  playerStats: {},
  currentSessionId: null,
  sessionHistory: [],
  preferences: {
    enableSounds: true,
    enableHints: true,
    enableTimers: true,
    enableTutorials: true,
    preferredDifficulty: 'auto',
    animationSpeed: 'normal'
  },
  achievements: {},
  metadata: {
    totalPlayTime: 0,
    favoriteGame: null,
    longestStreak: 0,
    totalGamesPlayed: 0,
    lastPlayedAt: 0,
    version: 1
  }
};

export const useMinigameStore = create<MinigameStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Record a game result and update statistics
      recordGameResult: (gameId: string, result: MinigameResult, difficulty: MinigameDifficulty) => {
        set((state) => {
          // Initialize game stats if not exists
          if (!state.playerStats[gameId]) {
            state.playerStats[gameId] = {
              totalPlays: 0,
              totalWins: 0,
              totalLosses: 0,
              averageScore: 0,
              bestScore: 0,
              averageTime: 0,
              bestTime: Infinity,
              currentStreak: 0,
              longestStreak: 0,
              currentDifficulty: difficulty,
              difficultyHistory: [],
              recentResults: [],
              preferences: {
                enableHints: state.preferences.enableHints,
                enableTimer: state.preferences.enableTimers,
                enableSounds: state.preferences.enableSounds
              }
            };
          }

          const gameStats = state.playerStats[gameId];
          
          // Update basic counters
          gameStats.totalPlays++;
          if (result.success) {
            gameStats.totalWins++;
            gameStats.currentStreak++;
          } else {
            gameStats.totalLosses++;
            gameStats.currentStreak = 0;
          }

          // Update streak records
          if (gameStats.currentStreak > gameStats.longestStreak) {
            gameStats.longestStreak = gameStats.currentStreak;
          }
          if (gameStats.currentStreak > state.metadata.longestStreak) {
            state.metadata.longestStreak = gameStats.currentStreak;
          }

          // Update score statistics
          const newAvgScore = (gameStats.averageScore * (gameStats.totalPlays - 1) + result.stats.score) / gameStats.totalPlays;
          gameStats.averageScore = newAvgScore;
          
          if (result.stats.score > gameStats.bestScore) {
            gameStats.bestScore = result.stats.score;
          }

          // Update time statistics
          const timeElapsed = result.stats.timeElapsed / 1000; // Convert to seconds
          const newAvgTime = (gameStats.averageTime * (gameStats.totalPlays - 1) + timeElapsed) / gameStats.totalPlays;
          gameStats.averageTime = newAvgTime;
          
          if (timeElapsed < gameStats.bestTime) {
            gameStats.bestTime = timeElapsed;
          }

          // Update difficulty tracking
          if (difficulty !== gameStats.currentDifficulty) {
            gameStats.difficultyHistory.push({
              difficulty: gameStats.currentDifficulty,
              timestamp: Date.now(),
              performance: result.success ? 1 : 0
            });
            gameStats.currentDifficulty = difficulty;
          }

          // Add to recent results (keep last 20)
          gameStats.recentResults.push(result);
          if (gameStats.recentResults.length > 20) {
            gameStats.recentResults = gameStats.recentResults.slice(-20);
          }

          // Update global metadata
          state.metadata.totalGamesPlayed++;
          state.metadata.lastPlayedAt = Date.now();
          state.metadata.totalPlayTime += result.stats.timeElapsed;

          console.log(`📊 Recorded game result for ${gameId}:`, {
            success: result.success,
            score: result.stats.score,
            totalPlays: gameStats.totalPlays,
            winRate: gameStats.totalWins / gameStats.totalPlays
          });
        });

        // Update favorite game
        get().updateFavoriteGame();
      },

      // Session management
      startSession: (sessionId: string) => {
        set((state) => {
          state.currentSessionId = sessionId;
        });
      },

      endSession: (sessionId: string, sessionData: MinigameSessionData) => {
        set((state) => {
          if (state.currentSessionId === sessionId) {
            state.currentSessionId = null;
          }
          
          // Add to history (keep last 100 sessions)
          state.sessionHistory.push(sessionData);
          if (state.sessionHistory.length > 100) {
            state.sessionHistory = state.sessionHistory.slice(-100);
          }
        });
      },

      // Get game statistics
      getGameStats: (gameId: string) => {
        return get().playerStats[gameId] || null;
      },

      // Update game-specific preferences
      updateGamePreferences: (gameId: string, preferences: Partial<PlayerMinigameStats[string]['preferences']>) => {
        set((state) => {
          if (state.playerStats[gameId]) {
            Object.assign(state.playerStats[gameId].preferences, preferences);
          }
        });
      },

      // Update global preferences
      updatePreferences: (preferences: Partial<MinigameState['preferences']>) => {
        set((state) => {
          Object.assign(state.preferences, preferences);
        });
      },

      // Achievement system
      unlockAchievement: (achievementId: string, name: string, description: string, gameId?: string) => {
        set((state) => {
          if (!state.achievements[achievementId]) {
            state.achievements[achievementId] = {
              id: achievementId,
              name,
              description,
              unlockedAt: Date.now(),
              gameId
            };
            console.log(`🏆 Achievement unlocked: ${name}`);
          }
        });
      },

      getUnlockedAchievements: (gameId?: string) => {
        const achievements = Object.values(get().achievements);
        if (gameId) {
          return achievements.filter(achievement => achievement.gameId === gameId);
        }
        return achievements;
      },

      // Analytics
      updatePlayTime: (milliseconds: number) => {
        set((state) => {
          state.metadata.totalPlayTime += milliseconds;
        });
      },

      updateFavoriteGame: () => {
        set((state) => {
          const { playerStats } = state;
          let favoriteGame = null;
          let maxPlays = 0;

          for (const [gameId, stats] of Object.entries(playerStats)) {
            if (stats.totalPlays > maxPlays) {
              maxPlays = stats.totalPlays;
              favoriteGame = gameId;
            }
          }

          state.metadata.favoriteGame = favoriteGame;
        });
      },

      // Data management
      resetGameStats: (gameId: string) => {
        set((state) => {
          delete state.playerStats[gameId];
          
          // Remove related achievements
          for (const [achievementId, achievement] of Object.entries(state.achievements)) {
            if (achievement.gameId === gameId) {
              delete state.achievements[achievementId];
            }
          }
          
          console.log(`🗑️ Reset stats for game: ${gameId}`);
        });
      },

      resetAllStats: () => {
        set(() => ({
          ...initialState,
          preferences: get().preferences // Preserve user preferences
        }));
        console.log('🗑️ Reset all minigame statistics');
      },

      exportData: () => {
        const state = get();
        const exportData = {
          playerStats: state.playerStats,
          achievements: state.achievements,
          metadata: state.metadata,
          exportedAt: Date.now(),
          version: state.metadata.version
        };
        return JSON.stringify(exportData, null, 2);
      },

      importData: (data: string) => {
        try {
          const importedData = JSON.parse(data);
          
          // Validate data structure
          if (!importedData.playerStats || !importedData.metadata) {
            console.error('Invalid import data structure');
            return false;
          }

          set((state) => {
            state.playerStats = importedData.playerStats;
            state.achievements = importedData.achievements || {};
            state.metadata = { ...state.metadata, ...importedData.metadata };
          });

          console.log('✅ Successfully imported minigame data');
          return true;
        } catch (error) {
          console.error('❌ Failed to import minigame data:', error);
          return false;
        }
      },

      // Overall statistics
      getOverallStats: () => {
        const { playerStats, metadata } = get();
        
        let totalWins = 0;
        let totalLosses = 0;
        let totalScore = 0;
        let totalGames = 0;

        for (const stats of Object.values(playerStats)) {
          totalWins += stats.totalWins;
          totalLosses += stats.totalLosses;
          totalScore += stats.averageScore * stats.totalPlays;
          totalGames += stats.totalPlays;
        }

        return {
          totalGames,
          totalWins,
          totalLosses,
          overallWinRate: totalGames > 0 ? totalWins / totalGames : 0,
          averageScore: totalGames > 0 ? totalScore / totalGames : 0,
          totalPlayTime: metadata.totalPlayTime,
          gamesPlayed: Object.keys(playerStats)
        };
      }
    })),
    {
      name: 'minigame-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Migrate function for future store updates
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          console.log('🔄 Migrating minigame store from v0 to v1');
          return {
            ...initialState,
            ...persistedState,
            metadata: {
              ...initialState.metadata,
              ...persistedState.metadata,
              version: 1
            }
          };
        }
        return persistedState;
      }
    }
  )
);

// Utility hook for commonly used statistics
export const useMinigameStats = () => {
  const store = useMinigameStore();
  
  return {
    getGameStats: store.getGameStats,
    overallStats: store.getOverallStats(),
    favoriteGame: store.metadata.favoriteGame,
    longestStreak: store.metadata.longestStreak,
    totalPlayTime: store.metadata.totalPlayTime,
    achievements: Object.values(store.achievements),
    preferences: store.preferences
  };
};