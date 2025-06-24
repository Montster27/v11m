// /Users/montysharma/V11M2/src/components/minigames/core/types.ts
// Core type definitions for the modernized minigame system

import { ReactElement } from 'react';

export type MinigameDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface MinigameStats {
  score: number;
  timeElapsed: number;
  attempts: number;
  hintsUsed?: number;
  accuracy?: number;
  [key: string]: any; // Allow game-specific stats
}

export interface DifficultyConfig {
  easy: Record<string, any>;
  medium: Record<string, any>;
  hard: Record<string, any>;
  expert?: Record<string, any>;
}

export interface MinigameContext {
  // Game launch context
  storyletId?: string;
  choiceId?: string;
  clueId?: string;
  
  // Player context
  playerStats?: {
    skills: Record<string, number>;
    attributes: Record<string, number>;
    previousPerformance: Record<string, number>;
  };
  
  // Game configuration
  requiredDifficulty?: MinigameDifficulty;
  timeLimit?: number;
  allowHints?: boolean;
  practiceMode?: boolean;
}

export interface MinigameResult {
  success: boolean;
  stats: MinigameStats;
  achievementUnlocked?: string[];
  nextRecommendedDifficulty?: MinigameDifficulty;
}

export interface MinigameProps {
  difficulty: MinigameDifficulty;
  context: MinigameContext;
  onGameComplete: (result: MinigameResult) => void;
  onClose: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export interface MinigamePlugin {
  // Plugin metadata
  id: string;
  name: string;
  description: string;
  category: 'cognitive' | 'academic' | 'social' | 'physical' | 'creative';
  version: string;
  
  // Difficulty configuration
  difficultyConfig: DifficultyConfig;
  defaultDifficulty: MinigameDifficulty;
  
  // Component and validation
  component: React.ComponentType<MinigameProps>;
  validateConfig?: (config: any) => boolean;
  
  // Integration hooks
  calculateDifficulty?: (context: MinigameContext) => MinigameDifficulty;
  preprocessContext?: (context: MinigameContext) => MinigameContext;
  postprocessResult?: (result: MinigameResult, context: MinigameContext) => MinigameResult;
  
  // Metadata for discovery and organization
  tags: string[];
  estimatedDuration: number; // seconds
  requiredSkills?: string[];
  cognitiveLoad: 'low' | 'medium' | 'high';
  
  // Tutorial and help
  tutorialComponent?: React.ComponentType<{ onComplete: () => void }>;
  helpText?: string;
  controls?: string[];
}

export interface MinigameRegistry {
  plugins: Map<string, MinigamePlugin>;
  register: (plugin: MinigamePlugin) => void;
  unregister: (id: string) => void;
  get: (id: string) => MinigamePlugin | undefined;
  list: () => MinigamePlugin[];
  listByCategory: (category: string) => MinigamePlugin[];
  search: (query: string) => MinigamePlugin[];
}

export interface PlayerMinigameStats {
  // Per-game statistics
  [gameId: string]: {
    totalPlays: number;
    totalWins: number;
    totalLosses: number;
    averageScore: number;
    bestScore: number;
    averageTime: number;
    bestTime: number;
    currentStreak: number;
    longestStreak: number;
    currentDifficulty: MinigameDifficulty;
    difficultyHistory: Array<{
      difficulty: MinigameDifficulty;
      timestamp: number;
      performance: number; // 0-1 normalized
    }>;
    recentResults: MinigameResult[];
    preferences: {
      preferredDifficulty?: MinigameDifficulty;
      enableHints: boolean;
      enableTimer: boolean;
      enableSounds: boolean;
    };
  };
}

export interface DifficultyAdjustment {
  gameId: string;
  oldDifficulty: MinigameDifficulty;
  newDifficulty: MinigameDifficulty;
  reason: 'performance' | 'streak' | 'manual' | 'context';
  confidence: number; // 0-1, how confident we are in this adjustment
}

export interface MinigameSessionData {
  sessionId: string;
  gameId: string;
  startTime: number;
  endTime?: number;
  difficulty: MinigameDifficulty;
  context: MinigameContext;
  result?: MinigameResult;
  events: Array<{
    type: 'start' | 'pause' | 'resume' | 'hint' | 'action' | 'complete';
    timestamp: number;
    data?: any;
  }>;
}