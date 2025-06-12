// /Users/montysharma/V11M2/src/data/integratedStorylets.ts

import type { Storylet } from '../types/storylet';

export const integratedStorylets: Record<string, Storylet> = {
  // All integrated storylets removed
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 Loaded', Object.keys(integratedStorylets).length, 'integrated storylets');
}