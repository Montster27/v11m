// /Users/montysharma/V11M2/src/components/minigames/core/index.ts
// Core minigame framework exports

export * from './types';
export { default as MinigameRegistry, MinigameRegistryImpl } from './MinigameRegistry';
export { DifficultyManager } from './DifficultyManager';
export { default as MinigameEngine } from './MinigameEngine';

// Re-export key types for convenience
export type {
  MinigamePlugin,
  MinigameProps,
  MinigameResult,
  MinigameContext,
  MinigameDifficulty,
  PlayerMinigameStats
} from './types';