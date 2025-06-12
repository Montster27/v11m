// /Users/montysharma/V11M2/src/data/secretGroupClues.ts

import { ClueFormData } from '../types/clue';

export const secretGroupClues: ClueFormData[] = [
  // All secret group clues removed
];

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🤐 Loaded', secretGroupClues.length, 'secret group clues');
}