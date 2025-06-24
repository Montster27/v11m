// /Users/montysharma/V11M2/src/components/minigames/plugins/WordScramblePlugin.tsx
// Word Scramble Game migrated to plugin architecture

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';
import { WordData, getRandomWord, scrambleWord, validateAnswer } from '../wordScrambleData';

interface GameWord {
  original: string;
  scrambled: string;
  hint: string;
  category: string;
}

interface WordScrambleGameState {
  currentWord: GameWord | null;
  userInput: string;
  wordsCompleted: number;
  feedback: 'correct' | 'incorrect' | null;
  showHint: boolean;
  usedHints: number;
  lives: number;
}

const WordScrambleGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<WordScrambleGameState>({
    currentWord: null,
    userInput: '',
    wordsCompleted: 0,
    feedback: null,
    showHint: false,
    usedHints: 0,
    lives: 3
  });

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { targetWords: 5, timeLimit: 120 };
      case 'medium': return { targetWords: 7, timeLimit: 180 };
      case 'hard': return { targetWords: 10, timeLimit: 240 };
      case 'expert': return { targetWords: 12, timeLimit: 300 };
      default: return { targetWords: 7, timeLimit: 180 };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Generate a new word
  const generateNewWord = useCallback(() => {
    const wordData = getRandomWord(props.difficulty);
    const scrambled = scrambleWord(wordData.word);
    
    setGameSpecificState(prev => ({
      ...prev,
      currentWord: {
        original: wordData.word,
        scrambled: scrambled,
        hint: wordData.hint,
        category: wordData.category
      },
      userInput: '',
      showHint: false
    }));
  }, [props.difficulty]);

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && !gameSpecificState.currentWord) {
      generateNewWord();
    }
  }, [gameState.isStarted, gameSpecificState.currentWord, generateNewWord]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.wordsCompleted >= difficultyConfig.targetWords && !gameState.isCompleted) {
      const timeElapsed = getElapsedTime();
      const score = calculateScore();
      
      completeGame(true, score, {
        words: gameSpecificState.wordsCompleted,
        hintsUsed: gameSpecificState.usedHints,
        accuracy: gameSpecificState.wordsCompleted / (gameSpecificState.wordsCompleted + (3 - gameSpecificState.lives))
      });
    }
  }, [gameSpecificState.wordsCompleted, difficultyConfig.targetWords, gameState.isCompleted]);

  // Check for lose condition
  useEffect(() => {
    if (gameSpecificState.lives <= 0 && !gameState.isCompleted) {
      const score = calculateScore();
      
      completeGame(false, score, {
        words: gameSpecificState.wordsCompleted,
        hintsUsed: gameSpecificState.usedHints,
        accuracy: gameSpecificState.wordsCompleted / Math.max(1, gameSpecificState.wordsCompleted + (3 - gameSpecificState.lives))
      });
    }
  }, [gameSpecificState.lives, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const score = calculateScore();
      
      completeGame(false, score, {
        words: gameSpecificState.wordsCompleted,
        hintsUsed: gameSpecificState.usedHints,
        accuracy: gameSpecificState.wordsCompleted / Math.max(1, gameSpecificState.wordsCompleted + (3 - gameSpecificState.lives))
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  const calculateScore = (): number => {
    const baseScore = gameSpecificState.wordsCompleted * 10;
    const hintPenalty = gameSpecificState.usedHints * 5;
    const timeBonus = Math.max(0, difficultyConfig.timeLimit - Math.floor(getElapsedTime() / 1000)) * 2;
    
    return Math.max(0, baseScore - hintPenalty + timeBonus);
  };

  // Handle answer submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gameSpecificState.currentWord || !gameSpecificState.userInput.trim() || gameState.isPaused || gameState.isCompleted) return;

    incrementAttempts();
    const isCorrect = validateAnswer(gameSpecificState.userInput, gameSpecificState.currentWord.original);
    
    if (isCorrect) {
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'correct',
        wordsCompleted: prev.wordsCompleted + 1
      }));
      
      // Generate new word after brief delay
      setTimeout(() => {
        if (!gameState.isCompleted) {
          generateNewWord();
          setGameSpecificState(prev => ({ ...prev, feedback: null }));
        }
      }, 1500);
    } else {
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'incorrect',
        lives: prev.lives - 1
      }));
      
      // Clear feedback after delay
      setTimeout(() => {
        setGameSpecificState(prev => ({ ...prev, feedback: null }));
      }, 1500);
    }
  };

  // Handle hint
  const handleHint = () => {
    setGameSpecificState(prev => ({
      ...prev,
      showHint: true,
      usedHints: prev.usedHints + 1
    }));
  };

  // Skip word (costs a life)
  const handleSkip = () => {
    setGameSpecificState(prev => ({
      ...prev,
      lives: prev.lives - 1
    }));
    
    if (gameSpecificState.lives - 1 > 0) {
      generateNewWord();
    }
  };

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);

  if (!gameSpecificState.currentWord) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <div className="text-center">Loading word...</div>
        </div>
      </div>
    );
  }

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.wordsCompleted >= difficultyConfig.targetWords ? '🎉 Congratulations!' : '💔 Game Over'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Words: {gameSpecificState.wordsCompleted}/{difficultyConfig.targetWords}</div>
            <div>Time: {timeElapsed}s</div>
            {gameSpecificState.usedHints > 0 && <div>Hints Used: {gameSpecificState.usedHints}</div>}
          </div>
          <button
            onClick={props.onClose}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Word Scramble</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">Score: {gameState.score}</div>
            <div className="text-sm">Words: {gameSpecificState.wordsCompleted}/{difficultyConfig.targetWords}</div>
            <div className="text-sm">Lives: {'❤️'.repeat(gameSpecificState.lives)}</div>
          </div>
          
          <button
            onClick={props.onClose}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Game Area */}
        <div className="p-6 space-y-6">
          {/* Word Display */}
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600 uppercase tracking-wide">{gameSpecificState.currentWord.category}</div>
            <div className="text-4xl font-bold tracking-widest text-gray-900 bg-gray-100 p-4 rounded-lg">
              {gameSpecificState.currentWord.scrambled}
            </div>
            
            {/* Hint */}
            {gameSpecificState.showHint && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <strong>Hint:</strong> {gameSpecificState.currentWord.hint}
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={gameSpecificState.userInput}
                onChange={(e) => setGameSpecificState(prev => ({ ...prev, userInput: e.target.value.toUpperCase() }))}
                placeholder="Enter your answer..."
                className="w-full p-4 text-xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={gameState.isPaused || gameState.isCompleted}
                autoFocus
              />
            </div>
            
            <div className="flex justify-center space-x-3">
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!gameSpecificState.userInput.trim() || gameState.isPaused || gameState.isCompleted}
              >
                Submit Answer
              </button>
              
              {!gameSpecificState.showHint && (
                <button 
                  type="button"
                  onClick={handleHint}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  disabled={gameState.isPaused || gameState.isCompleted}
                >
                  Show Hint (-5 pts)
                </button>
              )}
              
              <button 
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={gameState.isPaused || gameState.isCompleted}
              >
                Skip (-1 ❤️)
              </button>
            </div>
          </form>

          {/* Feedback */}
          {gameSpecificState.feedback && (
            <div className={`text-center p-4 rounded-lg ${
              gameSpecificState.feedback === 'correct' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {gameSpecificState.feedback === 'correct' ? (
                <div>
                  <div className="text-xl font-bold">✅ Correct!</div>
                  <div>The word was: {gameSpecificState.currentWord.original}</div>
                  <div>+{gameSpecificState.showHint ? 5 : 10} points</div>
                </div>
              ) : (
                <div>
                  <div className="text-xl font-bold">❌ Incorrect</div>
                  <div>Try again! You have {gameSpecificState.lives - 1} lives left.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Unscramble the letters to form words! • Time limit: {difficultyConfig.timeLimit}s
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const wordScramblePlugin: MinigamePlugin = {
  id: 'word-scramble',
  name: 'Word Scramble',
  description: 'Unscramble letters to form words',
  category: 'word-games',
  version: '2.0.0',
  
  difficultyConfig: {
    easy: { targetWords: 5, timeLimit: 120 },
    medium: { targetWords: 7, timeLimit: 180 },
    hard: { targetWords: 10, timeLimit: 240 },
    expert: { targetWords: 12, timeLimit: 300 }
  },
  
  defaultDifficulty: 'medium',
  component: WordScrambleGame,
  
  tags: ['word-games', 'vocabulary', 'spelling', 'logic'],
  estimatedDuration: 180, // 3 minutes
  requiredSkills: ['vocabulary', 'pattern-recognition'],
  cognitiveLoad: 'medium',
  
  helpText: 'Unscramble the letters to form valid words. Use hints if you get stuck, but they cost points!',
  controls: ['Type your answer', 'Submit button', 'Hint button (optional)', 'Skip button (costs life)'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.targetWords !== 'number' || typeof config.timeLimit !== 'number') {
        return false;
      }
      if (config.targetWords <= 0 || config.timeLimit <= 0) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.vocabulary) {
      const vocabSkill = context.playerStats.skills.vocabulary / 100;
      if (vocabSkill >= 0.8) return 'hard';
      if (vocabSkill >= 0.6) return 'medium';
      if (vocabSkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};