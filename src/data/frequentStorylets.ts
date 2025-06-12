// /Users/montysharma/V11M2/src/data/frequentStorylets.ts

import { Storylet } from "../types/storylet";

export const frequentStorylets: Record<string, Storylet> = {
  // All frequent storylets removed
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🔄 Loaded', Object.keys(frequentStorylets).length, 'frequent storylets');
}