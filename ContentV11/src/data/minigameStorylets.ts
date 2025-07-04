import type { Storylet } from '../types/storylet';

export const minigameStorylets: Record<string, Storylet> = {
  // All minigame storylets removed
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🎮 Loaded', Object.keys(minigameStorylets).length, 'minigame storylets');
}