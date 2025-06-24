// /Users/montysharma/V11M2/src/components/minigames/plugins/WordAssociationPlugin.tsx
// Word Association Game - Find connections between words

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface WordPair {
  word1: string;
  word2: string;
  connection: string;
  difficulty: number;
}

interface WordAssociationGameState {
  currentPair: WordPair | null;
  roundNumber: number;
  userAnswer: string;
  correctAnswers: number;
  totalAnswers: number;
  feedback: 'correct' | 'incorrect' | 'close' | null;
  hintsUsed: number;
  showHint: boolean;
  streak: number;
  longestStreak: number;
  timePerQuestion: number[];
  questionStartTime: number;
}

const WordAssociationGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<WordAssociationGameState>({
    currentPair: null,
    roundNumber: 1,
    userAnswer: '',
    correctAnswers: 0,
    totalAnswers: 0,
    feedback: null,
    hintsUsed: 0,
    showHint: false,
    streak: 0,
    longestStreak: 0,
    timePerQuestion: [],
    questionStartTime: Date.now()
  });

  // Word pairs database organized by difficulty
  const wordPairs = {
    easy: [
      { word1: "cat", word2: "dog", connection: "pets", difficulty: 1 },
      { word1: "sun", word2: "moon", connection: "celestial", difficulty: 1 },
      { word1: "hot", word2: "cold", connection: "temperature", difficulty: 1 },
      { word1: "red", word2: "blue", connection: "colors", difficulty: 1 },
      { word1: "big", word2: "small", connection: "size", difficulty: 1 },
      { word1: "happy", word2: "sad", connection: "emotions", difficulty: 1 },
      { word1: "day", word2: "night", connection: "time", difficulty: 1 },
      { word1: "up", word2: "down", connection: "directions", difficulty: 1 }
    ],
    medium: [
      { word1: "ocean", word2: "desert", connection: "geography", difficulty: 2 },
      { word1: "violin", word2: "piano", connection: "instruments", difficulty: 2 },
      { word1: "thunder", word2: "lightning", connection: "weather", difficulty: 2 },
      { word1: "courage", word2: "fear", connection: "emotions", difficulty: 2 },
      { word1: "microscope", word2: "telescope", connection: "tools", difficulty: 2 },
      { word1: "ancient", word2: "modern", connection: "time", difficulty: 2 },
      { word1: "democracy", word2: "monarchy", connection: "government", difficulty: 2 },
      { word1: "herbivore", word2: "carnivore", connection: "diet", difficulty: 2 }
    ],
    hard: [
      { word1: "metamorphosis", word2: "transformation", connection: "change", difficulty: 3 },
      { word1: "serendipity", word2: "coincidence", connection: "chance", difficulty: 3 },
      { word1: "ephemeral", word2: "eternal", connection: "duration", difficulty: 3 },
      { word1: "cacophony", word2: "harmony", connection: "sound", difficulty: 3 },
      { word1: "ubiquitous", word2: "rare", connection: "frequency", difficulty: 3 },
      { word1: "benevolent", word2: "malevolent", connection: "intent", difficulty: 3 },
      { word1: "pragmatic", word2: "idealistic", connection: "approach", difficulty: 3 },
      { word1: "verbose", word2: "concise", connection: "communication", difficulty: 3 }
    ],
    expert: [
      { word1: "paradigm", word2: "archetype", connection: "patterns", difficulty: 4 },
      { word1: "quixotic", word2: "pragmatic", connection: "realism", difficulty: 4 },
      { word1: "dialectical", word2: "synthesis", connection: "philosophy", difficulty: 4 },
      { word1: "epistemology", word2: "ontology", connection: "philosophy", difficulty: 4 },
      { word1: "hermeneutics", word2: "interpretation", connection: "understanding", difficulty: 4 },
      { word1: "phenomenology", word2: "empiricism", connection: "knowledge", difficulty: 4 },
      { word1: "teleological", word2: "causal", connection: "explanation", difficulty: 4 },
      { word1: "heuristic", word2: "algorithm", connection: "methods", difficulty: 4 }
    ]
  };

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { 
        targetQuestions: 8, 
        timeLimit: 180, 
        allowHints: true,
        questionTimeLimit: 30
      };
      case 'medium': return { 
        targetQuestions: 10, 
        timeLimit: 150, 
        allowHints: true,
        questionTimeLimit: 25
      };
      case 'hard': return { 
        targetQuestions: 12, 
        timeLimit: 120, 
        allowHints: false,
        questionTimeLimit: 20
      };
      case 'expert': return { 
        targetQuestions: 15, 
        timeLimit: 100, 
        allowHints: false,
        questionTimeLimit: 15
      };
      default: return { 
        targetQuestions: 10, 
        timeLimit: 150, 
        allowHints: true,
        questionTimeLimit: 25
      };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Generate new word pair
  const generateWordPair = useCallback(() => {
    const pairs = wordPairs[props.difficulty] || wordPairs.medium;
    const availablePairs = pairs.filter(pair => 
      !gameSpecificState.timePerQuestion.some((_, index) => pairs[index % pairs.length] === pair)
    );
    
    const selectedPair = availablePairs.length > 0 ? 
      availablePairs[Math.floor(Math.random() * availablePairs.length)] :
      pairs[Math.floor(Math.random() * pairs.length)];
    
    setGameSpecificState(prev => ({
      ...prev,
      currentPair: selectedPair,
      userAnswer: '',
      feedback: null,
      showHint: false,
      questionStartTime: Date.now()
    }));
  }, [props.difficulty, gameSpecificState.timePerQuestion]);

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && !gameSpecificState.currentPair) {
      generateWordPair();
    }
  }, [gameState.isStarted, gameSpecificState.currentPair, generateWordPair]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.totalAnswers >= difficultyConfig.targetQuestions && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.correctAnswers / gameSpecificState.totalAnswers * 100;
      const avgTime = gameSpecificState.timePerQuestion.reduce((sum, time) => sum + time, 0) / gameSpecificState.timePerQuestion.length;
      
      completeGame(true, score, {
        correct: gameSpecificState.correctAnswers,
        accuracy,
        averageTime: avgTime,
        longestStreak: gameSpecificState.longestStreak,
        hintsUsed: gameSpecificState.hintsUsed
      });
    }
  }, [gameSpecificState.totalAnswers, difficultyConfig.targetQuestions, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.totalAnswers > 0 ? 
        gameSpecificState.correctAnswers / gameSpecificState.totalAnswers * 100 : 0;
      
      completeGame(false, score, {
        correct: gameSpecificState.correctAnswers,
        accuracy,
        longestStreak: gameSpecificState.longestStreak,
        hintsUsed: gameSpecificState.hintsUsed
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  // Question time limit
  useEffect(() => {
    const questionElapsed = Date.now() - gameSpecificState.questionStartTime;
    if (questionElapsed > difficultyConfig.questionTimeLimit * 1000 && 
        gameSpecificState.feedback === null && 
        !gameState.isCompleted && 
        !gameState.isPaused) {
      
      // Time up for this question
      handleSubmit(true); // Mark as timeout
    }
  }, [gameSpecificState.questionStartTime, difficultyConfig.questionTimeLimit, gameSpecificState.feedback, gameState.isCompleted, gameState.isPaused]);

  const calculateScore = (): number => {
    const baseScore = gameSpecificState.correctAnswers * 100;
    const streakBonus = gameSpecificState.longestStreak * 25;
    const speedBonus = gameSpecificState.timePerQuestion.length > 0 ? 
      Math.max(0, (difficultyConfig.questionTimeLimit - (gameSpecificState.timePerQuestion.reduce((sum, time) => sum + time, 0) / gameSpecificState.timePerQuestion.length)) * 10) : 0;
    const hintPenalty = gameSpecificState.hintsUsed * 30;
    
    return Math.max(0, Math.round(baseScore + streakBonus + speedBonus - hintPenalty));
  };

  // Check if answer is close to correct
  const isAnswerClose = (userAnswer: string, correctAnswer: string): boolean => {
    const user = userAnswer.toLowerCase().trim();
    const correct = correctAnswer.toLowerCase();
    
    // Check for partial matches, synonyms, or related words
    const closeMatches = {
      'pets': ['animals', 'companions', 'creatures'],
      'colors': ['colour', 'hues', 'shades'],
      'emotions': ['feelings', 'moods', 'sentiment'],
      'temperature': ['heat', 'thermal', 'warmth'],
      'instruments': ['music', 'musical', 'tools'],
      'weather': ['climate', 'atmospheric', 'meteorology'],
      'government': ['politics', 'political', 'ruling'],
      'philosophy': ['thought', 'thinking', 'ideas'],
      'change': ['transformation', 'evolution', 'modification'],
      'sound': ['audio', 'noise', 'acoustic']
    };
    
    if (user === correct) return false; // Exact match is not "close"
    
    // Check if user answer is in close matches for correct answer
    const matches = closeMatches[correct] || [];
    return matches.some(match => user.includes(match) || match.includes(user));
  };

  // Handle answer submission
  const handleSubmit = (isTimeout = false) => {
    if (!gameSpecificState.currentPair || gameState.isPaused || gameState.isCompleted) return;

    const userAnswer = gameSpecificState.userAnswer.toLowerCase().trim();
    const correctAnswer = gameSpecificState.currentPair.connection.toLowerCase();
    const questionTime = (Date.now() - gameSpecificState.questionStartTime) / 1000;
    
    incrementAttempts();

    let isCorrect = false;
    let isClose = false;
    
    if (!isTimeout && userAnswer) {
      isCorrect = userAnswer === correctAnswer;
      isClose = !isCorrect && isAnswerClose(userAnswer, correctAnswer);
    }
    
    const newTimePerQuestion = [...gameSpecificState.timePerQuestion, questionTime];
    
    setGameSpecificState(prev => ({
      ...prev,
      feedback: isTimeout ? 'incorrect' : (isCorrect ? 'correct' : (isClose ? 'close' : 'incorrect')),
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      totalAnswers: prev.totalAnswers + 1,
      streak: isCorrect ? prev.streak + 1 : 0,
      longestStreak: isCorrect ? Math.max(prev.longestStreak, prev.streak + 1) : prev.longestStreak,
      timePerQuestion: newTimePerQuestion,
      roundNumber: prev.roundNumber + 1
    }));

    // Move to next question after showing feedback
    setTimeout(() => {
      if (gameSpecificState.totalAnswers + 1 < difficultyConfig.targetQuestions) {
        generateWordPair();
      }
    }, 2500);
  };

  // Show hint
  const showHint = () => {
    if (!difficultyConfig.allowHints || gameSpecificState.showHint) return;
    
    setGameSpecificState(prev => ({
      ...prev,
      showHint: true,
      hintsUsed: prev.hintsUsed + 1
    }));
  };

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);
  const questionTimeRemaining = Math.max(0, difficultyConfig.questionTimeLimit - Math.floor((Date.now() - gameSpecificState.questionStartTime) / 1000));
  const accuracy = gameSpecificState.totalAnswers > 0 ? 
    (gameSpecificState.correctAnswers / gameSpecificState.totalAnswers) * 100 : 100;

  if (!gameSpecificState.currentPair) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Loading word pair...</div>
        </div>
      </div>
    );
  }

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.totalAnswers >= difficultyConfig.targetQuestions ? '🔗 Word Master!' : '⏰ Time Up!'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Correct: {gameSpecificState.correctAnswers}/{difficultyConfig.targetQuestions}</div>
            <div>Accuracy: {Math.round(accuracy)}%</div>
            <div>Best Streak: {gameSpecificState.longestStreak}</div>
            <div>Hints Used: {gameSpecificState.hintsUsed}</div>
            <div>Time: {timeElapsed}s</div>
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
            <h3 className="text-lg font-semibold">Word Association</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">Question: {gameSpecificState.roundNumber}/{difficultyConfig.targetQuestions}</div>
            <div className="text-sm">Score: {gameState.score}</div>
            <div className="text-sm">Streak: {gameSpecificState.streak}</div>
          </div>
          
          <button
            onClick={props.onClose}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Game Area */}
        <div className="p-6">
          {/* Question Timer */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Question Time</span>
              <span className="text-sm font-bold text-orange-600">{questionTimeRemaining}s</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(questionTimeRemaining / difficultyConfig.questionTimeLimit) * 100}%` }}
              />
            </div>
          </div>

          {/* Word Pair Display */}
          <div className="text-center mb-8">
            <div className="text-lg text-gray-600 mb-4">What connects these words?</div>
            <div className="flex items-center justify-center space-x-8 mb-6">
              <div className="text-4xl font-bold text-blue-600 bg-blue-50 px-6 py-4 rounded-lg">
                {gameSpecificState.currentPair.word1.toUpperCase()}
              </div>
              <div className="text-2xl text-gray-400">↔</div>
              <div className="text-4xl font-bold text-purple-600 bg-purple-50 px-6 py-4 rounded-lg">
                {gameSpecificState.currentPair.word2.toUpperCase()}
              </div>
            </div>
            
            {gameSpecificState.showHint && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
                <div className="text-sm text-yellow-800">
                  <strong>Hint:</strong> Think about what category or theme these words share. 
                  The answer is: <strong>{gameSpecificState.currentPair.connection}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mb-6">
            <div className="flex space-x-3">
              <input
                type="text"
                value={gameSpecificState.userAnswer}
                onChange={(e) => setGameSpecificState(prev => ({ ...prev, userAnswer: e.target.value }))}
                placeholder="Enter the connection..."
                className="flex-1 p-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={gameState.isPaused || gameState.isCompleted || gameSpecificState.feedback !== null}
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={!gameSpecificState.userAnswer.trim() || gameState.isPaused || gameState.isCompleted || gameSpecificState.feedback !== null}
              >
                Submit
              </button>
            </div>
          </form>

          {/* Hint Button */}
          {difficultyConfig.allowHints && !gameSpecificState.showHint && gameSpecificState.feedback === null && (
            <div className="text-center mb-6">
              <button
                onClick={showHint}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Show Hint (-30 pts)
              </button>
            </div>
          )}

          {/* Stats Display */}
          <div className="grid grid-cols-4 gap-4 mb-6 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">Correct</div>
              <div className="text-lg font-bold text-blue-600">{gameSpecificState.correctAnswers}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-800">Accuracy</div>
              <div className="text-lg font-bold text-green-600">{Math.round(accuracy)}%</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-800">Current Streak</div>
              <div className="text-lg font-bold text-purple-600">{gameSpecificState.streak}</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-sm text-orange-800">Best Streak</div>
              <div className="text-lg font-bold text-orange-600">{gameSpecificState.longestStreak}</div>
            </div>
          </div>

          {/* Feedback */}
          {gameSpecificState.feedback && (
            <div className={`text-center p-4 rounded-lg mb-4 ${
              gameSpecificState.feedback === 'correct' ? 'bg-green-100 text-green-800' :
              gameSpecificState.feedback === 'close' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              <div className="text-xl font-bold">
                {gameSpecificState.feedback === 'correct' ? '✅ Correct!' :
                 gameSpecificState.feedback === 'close' ? '🤔 Close!' :
                 '❌ Incorrect'}
              </div>
              <div>
                {gameSpecificState.feedback === 'correct' ? 
                  `Great job! The connection is "${gameSpecificState.currentPair.connection}".` :
                 gameSpecificState.feedback === 'close' ? 
                  `You're thinking in the right direction. The answer is "${gameSpecificState.currentPair.connection}".` :
                  `The correct answer is "${gameSpecificState.currentPair.connection}".`
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Find the connection between the two words! • Think about categories, themes, or relationships
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const wordAssociationPlugin: MinigamePlugin = {
  id: 'word-association',
  name: 'Word Association',
  description: 'Find the connections between pairs of words',
  category: 'word-games',
  version: '1.0.0',
  
  difficultyConfig: {
    easy: { targetQuestions: 8, timeLimit: 180, allowHints: true, questionTimeLimit: 30 },
    medium: { targetQuestions: 10, timeLimit: 150, allowHints: true, questionTimeLimit: 25 },
    hard: { targetQuestions: 12, timeLimit: 120, allowHints: false, questionTimeLimit: 20 },
    expert: { targetQuestions: 15, timeLimit: 100, allowHints: false, questionTimeLimit: 15 }
  },
  
  defaultDifficulty: 'medium',
  component: WordAssociationGame,
  
  tags: ['word-games', 'association', 'vocabulary', 'lateral-thinking'],
  estimatedDuration: 150, // 2.5 minutes
  requiredSkills: ['vocabulary', 'lateral-thinking'],
  cognitiveLoad: 'medium',
  
  helpText: 'Look at two words and find what connects them. Think about categories, themes, or relationships.',
  controls: ['Type your answer', 'Submit button', 'Hint button (if available)'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.targetQuestions !== 'number' || typeof config.timeLimit !== 'number' || typeof config.questionTimeLimit !== 'number') {
        return false;
      }
      if (config.targetQuestions <= 0 || config.timeLimit <= 0 || config.questionTimeLimit <= 0) {
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