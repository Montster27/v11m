// /Users/montysharma/V11M2/src/data/immediateStorylets.ts

import { Storylet } from "../types/storylet";

export const immediateStorylets: Record<string, Storylet> = {
  // All immediate storylets removed
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Loaded', Object.keys(immediateStorylets).length, 'immediate storylets');
}