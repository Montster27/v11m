// /Users/montysharma/V11M2/src/data/sampleStorylets.ts

import { Storylet } from "../types/storylet";

export const sampleStorylets: Record<string, Storylet> = {
  // All sample storylets removed
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('📚 Loaded', Object.keys(sampleStorylets).length, 'sample storylets');
}