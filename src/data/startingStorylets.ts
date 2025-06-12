// /Users/montysharma/V11M2/src/data/startingStorylets.ts

import type { Storylet } from '../types/storylet';

export const startingStorylets: Record<string, Storylet> = {
  // All starting storylets removed
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Loaded', Object.keys(startingStorylets).length, 'starting storylets');
}