// /Users/montysharma/V11M2/src/stores/v2/minigameMigrationUtils.ts
// Migration utilities for minigame system transition to V2 stores

import { useCoreGameStore } from './useCoreGameStore';
import { useSocialStore } from './useSocialStore';
import { useNarrativeStore } from './useNarrativeStore';
import type { 
  MinigameResult, 
  MinigameDifficulty, 
  MinigameSessionData 
} from '../../components/minigames/core/types';

/**
 * V2 Minigame Manager - Replaces useMinigameStore functionality
 * Distributes minigame functionality across appropriate V2 stores
 */
export class V2MinigameManager {
  
  // Game statistics and preferences (Core Game Store)
  static recordGameResult(gameId: string, result: MinigameResult, difficulty: MinigameDifficulty): void {
    useCoreGameStore.getState().recordGameResult(gameId, result, difficulty);
  }

  static getGameStats(gameId: string) {
    return useCoreGameStore.getState().getGameStats(gameId);
  }

  static updateGamePreferences(gameId: string, preferences: any): void {
    useCoreGameStore.getState().updateGamePreferences(gameId, preferences);
  }

  static updateMinigamePreferences(preferences: any): void {
    useCoreGameStore.getState().updateMinigamePreferences(preferences);
  }

  static getOverallStats() {
    return useCoreGameStore.getState().getOverallMinigameStats();
  }

  // Session management (Social Store)
  static startSession(sessionId: string, sessionData: MinigameSessionData): void {
    useSocialStore.getState().startMinigameSession(sessionId, sessionData);
  }

  static endSession(sessionId: string, sessionData: MinigameSessionData): void {
    useSocialStore.getState().endMinigameSession(sessionId, sessionData);
  }

  static getCurrentSession(): string | null {
    return useSocialStore.getState().getCurrentMinigameSession();
  }

  static getSessionHistory(): MinigameSessionData[] {
    return useSocialStore.getState().getMinigameSessionHistory();
  }

  // Achievement system (Narrative Store)
  static unlockAchievement(achievementId: string, name: string, description: string, gameId?: string): void {
    useNarrativeStore.getState().unlockAchievement(achievementId, name, description, gameId, 'minigame');
  }

  static getUnlockedAchievements(gameId?: string) {
    return useNarrativeStore.getState().getUnlockedAchievements(gameId, 'minigame');
  }

  static hasAchievement(achievementId: string): boolean {
    return useNarrativeStore.getState().hasAchievement(achievementId);
  }

  // Migration helper
  static migrateFromLegacyStore(): void {
    console.log('🔄 Migrating minigame data to V2 stores...');
    
    try {
      // Trigger migrations in all V2 stores
      useCoreGameStore.getState().migrateFromLegacyStores();
      useNarrativeStore.getState().migrateFromLegacyStores();
      
      console.log('✅ Minigame migration to V2 stores completed');
    } catch (error) {
      console.error('❌ Minigame migration failed:', error);
    }
  }

  // Utility for components transitioning from legacy hooks
  static getCompatibilityWrapper() {
    return {
      // Legacy useMinigameStore compatibility
      recordGameResult: this.recordGameResult,
      getGameStats: this.getGameStats,
      updateGamePreferences: this.updateGamePreferences,
      updatePreferences: this.updateMinigamePreferences,
      getOverallStats: this.getOverallStats,
      
      // Session management
      startSession: this.startSession,
      endSession: this.endSession,
      currentSessionId: this.getCurrentSession(),
      sessionHistory: this.getSessionHistory(),
      
      // Achievement system
      unlockAchievement: this.unlockAchievement,
      getUnlockedAchievements: this.getUnlockedAchievements,
      hasAchievement: this.hasAchievement,
      
      // Access to store state for reactive components
      playerStats: useCoreGameStore.getState().minigames.playerStats,
      preferences: useCoreGameStore.getState().minigames.preferences,
      metadata: useCoreGameStore.getState().minigames.metadata,
      achievements: useNarrativeStore.getState().achievements
    };
  }
}

/**
 * Custom hook for minigame functionality using V2 stores
 * Drop-in replacement for useMinigameStore
 */
export function useV2MinigameStore() {
  // Subscribe to relevant V2 store state
  const coreGameState = useCoreGameStore();
  const socialState = useSocialStore();
  const narrativeState = useNarrativeStore();

  return {
    // Game statistics and preferences
    playerStats: coreGameState.minigames.playerStats,
    preferences: coreGameState.minigames.preferences,
    metadata: coreGameState.minigames.metadata,
    
    // Session management
    currentSessionId: socialState.minigameSessions.currentSessionId,
    sessionHistory: socialState.minigameSessions.sessionHistory,
    
    // Achievement system
    achievements: narrativeState.achievements,
    
    // Actions
    recordGameResult: coreGameState.recordGameResult,
    getGameStats: coreGameState.getGameStats,
    updateGamePreferences: coreGameState.updateGamePreferences,
    updateMinigamePreferences: coreGameState.updateMinigamePreferences,
    getOverallStats: coreGameState.getOverallMinigameStats,
    
    startMinigameSession: socialState.startMinigameSession,
    endMinigameSession: socialState.endMinigameSession,
    getCurrentMinigameSession: socialState.getCurrentMinigameSession,
    getMinigameSessionHistory: socialState.getMinigameSessionHistory,
    
    unlockAchievement: narrativeState.unlockAchievement,
    getUnlockedAchievements: narrativeState.getUnlockedAchievements,
    hasAchievement: narrativeState.hasAchievement
  };
}

/**
 * Migration utility to help transition components
 * Run this once to migrate legacy minigame data to V2 stores
 */
export function migrateMinigameDataToV2(): void {
  V2MinigameManager.migrateFromLegacyStore();
}