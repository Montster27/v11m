// Word lists for the word scramble minigame
// Themed around medieval life, college, and general knowledge

export interface WordData {
  word: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export const wordLists: WordData[] = [
  // Easy words (4-6 letters) - Medieval & College Theme
  { word: 'BOOK', hint: 'Reading material for scholars', difficulty: 'easy', category: 'Education' },
  { word: 'QUILL', hint: 'Writing instrument made from a feather', difficulty: 'easy', category: 'Medieval' },
  { word: 'KNIGHT', hint: 'Armored warrior on horseback', difficulty: 'easy', category: 'Medieval' },
  { word: 'CASTLE', hint: 'Fortified royal residence', difficulty: 'easy', category: 'Medieval' },
  { word: 'SWORD', hint: 'Blade weapon of warriors', difficulty: 'easy', category: 'Medieval' },
  { word: 'STUDY', hint: 'What scholars do with books', difficulty: 'easy', category: 'Education' },
  { word: 'HORSE', hint: 'Noble steed for travel', difficulty: 'easy', category: 'Medieval' },
  { word: 'CROWN', hint: 'Royal headpiece', difficulty: 'easy', category: 'Medieval' },
  { word: 'MAGIC', hint: 'Mystical arts and spells', difficulty: 'easy', category: 'Fantasy' },
  { word: 'QUEST', hint: 'Heroic journey or mission', difficulty: 'easy', category: 'Adventure' },
  
  // Medium words (6-8 letters)
  { word: 'SCHOLAR', hint: 'Learned person of great knowledge', difficulty: 'medium', category: 'Education' },
  { word: 'VILLAGE', hint: 'Small rural settlement', difficulty: 'medium', category: 'Medieval' },
  { word: 'TAVERN', hint: 'Inn where travelers rest and drink', difficulty: 'medium', category: 'Medieval' },
  { word: 'DRAGON', hint: 'Legendary fire-breathing beast', difficulty: 'medium', category: 'Fantasy' },
  { word: 'WIZARD', hint: 'Master of magical arts', difficulty: 'medium', category: 'Fantasy' },
  { word: 'LIBRARY', hint: 'Repository of books and knowledge', difficulty: 'medium', category: 'Education' },
  { word: 'COLLEGE', hint: 'Institution of higher learning', difficulty: 'medium', category: 'Education' },
  { word: 'CHAMBER', hint: 'Private room in a castle', difficulty: 'medium', category: 'Medieval' },
  { word: 'MANOR', hint: 'Lord\'s estate and dwelling', difficulty: 'medium', category: 'Medieval' },
  { word: 'SCROLL', hint: 'Ancient document rolled up', difficulty: 'medium', category: 'Medieval' },
  { word: 'DUNGEON', hint: 'Underground prison in castles', difficulty: 'medium', category: 'Medieval' },
  { word: 'POTION', hint: 'Magical liquid with special effects', difficulty: 'medium', category: 'Fantasy' },
  { word: 'SIEGE', hint: 'Military blockade of a fortress', difficulty: 'medium', category: 'Medieval' },
  { word: 'HERALD', hint: 'Royal messenger and announcer', difficulty: 'medium', category: 'Medieval' },
  
  // Hard words (8+ letters)
  { word: 'TOURNAMENT', hint: 'Grand competition of knights', difficulty: 'hard', category: 'Medieval' },
  { word: 'MANUSCRIPT', hint: 'Hand-written document or book', difficulty: 'hard', category: 'Education' },
  { word: 'CATHEDRAL', hint: 'Grand church with soaring spires', difficulty: 'hard', category: 'Medieval' },
  { word: 'ALCHEMIST', hint: 'Medieval scientist seeking gold', difficulty: 'hard', category: 'Fantasy' },
  { word: 'MONASTERY', hint: 'Peaceful home of religious monks', difficulty: 'hard', category: 'Medieval' },
  { word: 'APPRENTICE', hint: 'Student learning a craft or trade', difficulty: 'hard', category: 'Education' },
  { word: 'PHILOSOPHY', hint: 'Study of wisdom and knowledge', difficulty: 'hard', category: 'Education' },
  { word: 'MATHEMATICS', hint: 'Science of numbers and calculations', difficulty: 'hard', category: 'Education' },
  { word: 'BLACKSMITH', hint: 'Craftsman who forges metal tools', difficulty: 'hard', category: 'Medieval' },
  { word: 'COURTYARD', hint: 'Open space within castle walls', difficulty: 'hard', category: 'Medieval' },
  { word: 'ENCHANTMENT', hint: 'Magical spell or bewitchment', difficulty: 'hard', category: 'Fantasy' },
  { word: 'KNOWLEDGE', hint: 'Information and understanding gained', difficulty: 'hard', category: 'Education' },
  
  // College/Student Life
  { word: 'LECTURE', hint: 'Educational talk by a professor', difficulty: 'medium', category: 'Education' },
  { word: 'DORMITORY', hint: 'Student housing on campus', difficulty: 'hard', category: 'Education' },
  { word: 'PROFESSOR', hint: 'Teacher of highest academic rank', difficulty: 'medium', category: 'Education' },
  { word: 'EXAM', hint: 'Test of knowledge and skills', difficulty: 'easy', category: 'Education' },
  { word: 'DEGREE', hint: 'Academic qualification earned', difficulty: 'medium', category: 'Education' },
  { word: 'RESEARCH', hint: 'Systematic investigation of topics', difficulty: 'medium', category: 'Education' },
  
  // General Knowledge
  { word: 'WISDOM', hint: 'Deep understanding and insight', difficulty: 'medium', category: 'General' },
  { word: 'MEMORY', hint: 'Ability to remember and recall', difficulty: 'medium', category: 'General' },
  { word: 'PUZZLE', hint: 'Problem requiring clever solution', difficulty: 'medium', category: 'General' },
  { word: 'RIDDLE', hint: 'Mysterious question with hidden answer', difficulty: 'medium', category: 'General' },
  { word: 'CHALLENGE', hint: 'Difficult task testing abilities', difficulty: 'medium', category: 'General' }
];

// Utility functions
export const getWordsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): WordData[] => {
  return wordLists.filter(word => word.difficulty === difficulty);
};

export const getRandomWord = (difficulty?: 'easy' | 'medium' | 'hard'): WordData => {
  const availableWords = difficulty ? getWordsByDifficulty(difficulty) : wordLists;
  return availableWords[Math.floor(Math.random() * availableWords.length)];
};

export const scrambleWord = (word: string): string => {
  const letters = word.split('');
  
  // Fisher-Yates shuffle algorithm
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  
  // Ensure the scrambled word is different from the original
  const scrambled = letters.join('');
  if (scrambled === word && word.length > 1) {
    // If it's the same, swap the first two letters
    [letters[0], letters[1]] = [letters[1], letters[0]];
    return letters.join('');
  }
  
  return scrambled;
};

export const validateAnswer = (userAnswer: string, correctAnswer: string): boolean => {
  return userAnswer.toUpperCase().trim() === correctAnswer.toUpperCase().trim();
};