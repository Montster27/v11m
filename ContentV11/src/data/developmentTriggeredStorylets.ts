// /Users/montysharma/V11M2/src/data/developmentTriggeredStorylets.ts

import type { Storylet } from '../types/storylet';

export const developmentTriggeredStorylets: Record<string, Storylet> = {
  // All development triggered storylets removed
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🌱 Loaded', Object.keys(developmentTriggeredStorylets).length, 'development triggered storylets');
}