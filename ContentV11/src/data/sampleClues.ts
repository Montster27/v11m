import { ClueFormData } from '../types/clue';

export const sampleClues: ClueFormData[] = [
  // All sample clues removed
];

export const sampleStoryArcs = [
  // All sample story arcs removed
];

// Export with logging for development
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Loaded', sampleClues.length, 'sample clues and', sampleStoryArcs.length, 'story arcs');
}