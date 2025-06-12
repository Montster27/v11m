// /Users/montysharma/V11M2/src/data/collegeStorylets.ts

import { Storylet } from "../types/storylet";

export const collegeStorylets: Record<string, Storylet> = {
  // All college storylets removed
};

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🎓 Loaded', Object.keys(collegeStorylets).length, 'college storylets');
}