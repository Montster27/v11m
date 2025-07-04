// /Users/montysharma/V11M2/src/data/startingStorylets.ts

import type { Storylet } from '../types/storylet';
import { tutorialStorylets } from './tutorialStorylets';

export const startingStorylets: Record<string, Storylet> = {
  ...tutorialStorylets
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 Loaded', Object.keys(startingStorylets).length, 'starting storylets');
}