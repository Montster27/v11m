// /Users/montysharma/V11M2/src/test/minigameMigrationValidation.test.ts
// Validation tests for minigame migration to V2 stores

import { describe, it, expect, beforeEach } from 'vitest';
import { V2MinigameManager, useV2MinigameStore } from '../stores/v2/minigameMigrationUtils';
import { useCoreGameStore } from '../stores/v2/useCoreGameStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import type { MinigameResult, MinigameSessionData } from '../components/minigames/core/types';

describe('Minigame Migration to V2 Stores', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useCoreGameStore.getState().resetGame();
    useSocialStore.getState().resetSocial();
    useNarrativeStore.getState().resetNarrative();
  });

  describe('V2MinigameManager', () => {
    it('should record game results in Core Game Store', () => {
      const gameId = 'test-game';
      const result: MinigameResult = {
        success: true,
        stats: {
          score: 100,
          timeElapsed: 5000,
          attempts: 1
        }
      };
      const difficulty = 'medium' as const;

      V2MinigameManager.recordGameResult(gameId, result, difficulty);

      const stats = V2MinigameManager.getGameStats(gameId);
      expect(stats).toBeDefined();
      expect(stats?.totalPlays).toBe(1);
      expect(stats?.totalWins).toBe(1);
      expect(stats?.bestScore).toBe(100);
    });

    it('should manage sessions in Social Store', () => {
      const sessionId = 'test-session-123';
      const sessionData: MinigameSessionData = {
        sessionId,
        gameId: 'test-game',
        startTime: Date.now(),
        difficulty: 'easy',
        context: { practiceMode: true },
        events: [
          { type: 'start', timestamp: Date.now() }
        ]
      };

      V2MinigameManager.startSession(sessionId, sessionData);
      expect(V2MinigameManager.getCurrentSession()).toBe(sessionId);

      const completedSessionData: MinigameSessionData = {
        ...sessionData,
        endTime: Date.now(),
        result: {
          success: true,
          stats: { score: 85, timeElapsed: 3000, attempts: 1 }
        }
      };

      V2MinigameManager.endSession(sessionId, completedSessionData);
      expect(V2MinigameManager.getCurrentSession()).toBeNull();

      const history = V2MinigameManager.getSessionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].sessionId).toBe(sessionId);
    });

    it('should manage achievements in Narrative Store', () => {
      const achievementId = 'first-win';
      const name = 'First Victory';
      const description = 'Win your first minigame';
      const gameId = 'test-game';

      expect(V2MinigameManager.hasAchievement(achievementId)).toBe(false);

      V2MinigameManager.unlockAchievement(achievementId, name, description, gameId);

      expect(V2MinigameManager.hasAchievement(achievementId)).toBe(true);

      const achievements = V2MinigameManager.getUnlockedAchievements(gameId);
      expect(achievements).toHaveLength(1);
      expect(achievements[0].name).toBe(name);
      expect(achievements[0].category).toBe('minigame');
    });

    it('should provide overall statistics', () => {
      const gameId1 = 'test-game-1';
      const gameId2 = 'test-game-2';
      
      const result1: MinigameResult = {
        success: true,
        stats: { score: 100, timeElapsed: 5000, attempts: 1 }
      };
      
      const result2: MinigameResult = {
        success: false,
        stats: { score: 50, timeElapsed: 3000, attempts: 2 }
      };

      V2MinigameManager.recordGameResult(gameId1, result1, 'easy');
      V2MinigameManager.recordGameResult(gameId2, result2, 'medium');

      const overallStats = V2MinigameManager.getOverallStats();
      expect(overallStats.totalGames).toBe(2);
      expect(overallStats.totalWins).toBe(1);
      expect(overallStats.totalLosses).toBe(1);
      expect(overallStats.overallWinRate).toBe(0.5);
      expect(overallStats.gamesPlayed).toContain(gameId1);
      expect(overallStats.gamesPlayed).toContain(gameId2);
    });
  });

  describe('useV2MinigameStore hook', () => {
    it('should provide access to distributed minigame state', () => {
      // Since this is a custom hook, we test the underlying stores it depends on
      const coreGameStore = useCoreGameStore.getState();
      const socialStore = useSocialStore.getState();
      const narrativeStore = useNarrativeStore.getState();

      // Test initial state structure
      expect(coreGameStore.minigames).toBeDefined();
      expect(coreGameStore.minigames.playerStats).toBeDefined();
      expect(coreGameStore.minigames.preferences).toBeDefined();
      expect(coreGameStore.minigames.metadata).toBeDefined();

      expect(socialStore.minigameSessions).toBeDefined();
      expect(socialStore.minigameSessions.currentSessionId).toBeNull();
      expect(socialStore.minigameSessions.sessionHistory).toEqual([]);

      expect(narrativeStore.achievements).toBeDefined();
    });
  });

  describe('Store Integration', () => {
    it('should maintain data consistency across all three stores', () => {
      const gameId = 'integration-test';
      const sessionId = 'session-123';
      const achievementId = 'consistency-test';

      // Record a game result
      const result: MinigameResult = {
        success: true,
        stats: { score: 150, timeElapsed: 4000, attempts: 1 }
      };
      
      V2MinigameManager.recordGameResult(gameId, result, 'hard');

      // Create a session
      const sessionData: MinigameSessionData = {
        sessionId,
        gameId,
        startTime: Date.now(),
        difficulty: 'hard',
        context: { requiredDifficulty: 'hard' },
        events: [{ type: 'start', timestamp: Date.now() }],
        result
      };
      
      V2MinigameManager.startSession(sessionId, sessionData);
      V2MinigameManager.endSession(sessionId, { ...sessionData, endTime: Date.now() });

      // Unlock an achievement
      V2MinigameManager.unlockAchievement(achievementId, 'Consistency Test', 'Test achievement', gameId);

      // Verify data exists in appropriate stores
      const gameStats = useCoreGameStore.getState().minigames.playerStats[gameId];
      expect(gameStats.totalPlays).toBe(1);
      expect(gameStats.bestScore).toBe(150);

      const sessionHistory = useSocialStore.getState().minigameSessions.sessionHistory;
      expect(sessionHistory).toHaveLength(1);
      expect(sessionHistory[0].gameId).toBe(gameId);

      const achievements = useNarrativeStore.getState().achievements;
      expect(achievements[achievementId]).toBeDefined();
      expect(achievements[achievementId].gameId).toBe(gameId);
    });

    it('should support simultaneous operations without conflicts', () => {
      const gameId = 'concurrent-test';
      
      // Simulate concurrent operations
      V2MinigameManager.recordGameResult(gameId, {
        success: true,
        stats: { score: 100, timeElapsed: 2000, attempts: 1 }
      }, 'easy');

      V2MinigameManager.unlockAchievement('concurrent-1', 'First Achievement', 'Description', gameId);
      
      V2MinigameManager.recordGameResult(gameId, {
        success: false,
        stats: { score: 75, timeElapsed: 3000, attempts: 2 }
      }, 'easy');

      V2MinigameManager.unlockAchievement('concurrent-2', 'Second Achievement', 'Description', gameId);

      // Verify final state
      const gameStats = V2MinigameManager.getGameStats(gameId);
      expect(gameStats?.totalPlays).toBe(2);
      expect(gameStats?.totalWins).toBe(1);
      expect(gameStats?.totalLosses).toBe(1);

      const achievements = V2MinigameManager.getUnlockedAchievements(gameId);
      expect(achievements).toHaveLength(2);
    });
  });
});