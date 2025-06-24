// /Users/montysharma/V11M2/src/components/minigames/plugins/MathQuizPlugin.tsx
// Math Quiz Game - Answer arithmetic questions quickly and accurately

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface MathQuestion {
  num1: number;
  num2: number;
  operation: '+' | '-' | '×' | '÷';
  answer: number;
  choices: number[];
}

interface MathQuizGameState {
  currentQuestion: MathQuestion | null;
  questionNumber: number;
  correct: number;
  incorrect: number;
  streak: number;
  longestStreak: number;
  feedback: 'correct' | 'incorrect' | null;
  selectedAnswer: number | null;
  lives: number;
  questionStartTime: number;
}

const MathQuizGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<MathQuizGameState>({
    currentQuestion: null,
    questionNumber: 1,
    correct: 0,
    incorrect: 0,
    streak: 0,
    longestStreak: 0,
    feedback: null,
    selectedAnswer: null,
    lives: 3,
    questionStartTime: Date.now()
  });

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { 
        targetQuestions: 15, 
        timeLimit: 120, 
        maxNumber: 20, 
        operations: ['+', '-'], 
        questionTime: 15 
      };
      case 'medium': return { 
        targetQuestions: 20, 
        timeLimit: 100, 
        maxNumber: 50, 
        operations: ['+', '-', '×'], 
        questionTime: 12 
      };
      case 'hard': return { 
        targetQuestions: 25, 
        timeLimit: 90, 
        maxNumber: 100, 
        operations: ['+', '-', '×', '÷'], 
        questionTime: 10 
      };
      case 'expert': return { 
        targetQuestions: 30, 
        timeLimit: 75, 
        maxNumber: 200, 
        operations: ['+', '-', '×', '÷'], 
        questionTime: 8 
      };
      default: return { 
        targetQuestions: 20, 
        timeLimit: 100, 
        maxNumber: 50, 
        operations: ['+', '-', '×'], 
        questionTime: 12 
      };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Generate new math question
  const generateQuestion = useCallback(() => {
    const operations = difficultyConfig.operations;
    const operation = operations[Math.floor(Math.random() * operations.length)] as '+' | '-' | '×' | '÷';
    
    let num1: number, num2: number, answer: number;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * difficultyConfig.maxNumber) + 1;
        num2 = Math.floor(Math.random() * difficultyConfig.maxNumber) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * difficultyConfig.maxNumber) + 10;
        num2 = Math.floor(Math.random() * Math.min(num1, difficultyConfig.maxNumber)) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * Math.min(20, difficultyConfig.maxNumber / 5)) + 1;
        num2 = Math.floor(Math.random() * Math.min(20, difficultyConfig.maxNumber / 5)) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = Math.floor(Math.random() * Math.min(20, difficultyConfig.maxNumber / 10)) + 1;
        num1 = num2 * answer;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }
    
    // Generate wrong answer choices
    const choices = [answer];
    while (choices.length < 4) {
      let wrongAnswer: number;
      
      switch (operation) {
        case '+':
          wrongAnswer = answer + (Math.floor(Math.random() * 20) - 10);
          break;
        case '-':
          wrongAnswer = answer + (Math.floor(Math.random() * 20) - 10);
          break;
        case '×':
          wrongAnswer = answer + (Math.floor(Math.random() * 40) - 20);
          break;
        case '÷':
          wrongAnswer = answer + (Math.floor(Math.random() * 10) - 5);
          break;
        default:
          wrongAnswer = answer + 1;
      }
      
      if (wrongAnswer > 0 && !choices.includes(wrongAnswer)) {
        choices.push(wrongAnswer);
      }
    }
    
    // Shuffle choices
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    
    const question: MathQuestion = { num1, num2, operation, answer, choices };
    
    setGameSpecificState(prev => ({
      ...prev,
      currentQuestion: question,
      feedback: null,
      selectedAnswer: null,
      questionStartTime: Date.now()
    }));
  }, [difficultyConfig]);

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && !gameSpecificState.currentQuestion) {
      generateQuestion();
    }
  }, [gameState.isStarted, gameSpecificState.currentQuestion, generateQuestion]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.correct >= difficultyConfig.targetQuestions && !gameState.isCompleted) {
      const timeElapsed = getElapsedTime();
      const score = calculateScore();
      const accuracy = gameSpecificState.correct / (gameSpecificState.correct + gameSpecificState.incorrect) * 100;
      
      completeGame(true, score, {
        correct: gameSpecificState.correct,
        accuracy,
        longestStreak: gameSpecificState.longestStreak,
        avgQuestionTime: timeElapsed / gameSpecificState.correct
      });
    }
  }, [gameSpecificState.correct, difficultyConfig.targetQuestions, gameState.isCompleted]);

  // Check for lose condition
  useEffect(() => {
    if (gameSpecificState.lives <= 0 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.correct / Math.max(1, gameSpecificState.correct + gameSpecificState.incorrect) * 100;
      
      completeGame(false, score, {
        correct: gameSpecificState.correct,
        accuracy,
        longestStreak: gameSpecificState.longestStreak
      });
    }
  }, [gameSpecificState.lives, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.correct / Math.max(1, gameSpecificState.correct + gameSpecificState.incorrect) * 100;
      
      completeGame(false, score, {
        correct: gameSpecificState.correct,
        accuracy,
        longestStreak: gameSpecificState.longestStreak
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  // Question time limit
  useEffect(() => {
    const questionElapsed = Date.now() - gameSpecificState.questionStartTime;
    if (questionElapsed > difficultyConfig.questionTime * 1000 && 
        gameSpecificState.feedback === null && 
        !gameState.isCompleted && 
        !gameState.isPaused) {
      
      // Time up for this question
      handleAnswer(-1); // Invalid answer
    }
  }, [gameSpecificState.questionStartTime, difficultyConfig.questionTime, gameSpecificState.feedback, gameState.isCompleted, gameState.isPaused]);

  const calculateScore = (): number => {
    const baseScore = gameSpecificState.correct * 10;
    const streakBonus = gameSpecificState.longestStreak * 5;
    const speedBonus = Math.max(0, difficultyConfig.timeLimit - Math.floor(getElapsedTime() / 1000)) * 2;
    
    return baseScore + streakBonus + speedBonus;
  };

  // Handle answer selection
  const handleAnswer = (selectedAnswer: number) => {
    if (!gameSpecificState.currentQuestion || gameState.isPaused || gameState.isCompleted || gameSpecificState.feedback !== null) return;

    incrementAttempts();
    const isCorrect = selectedAnswer === gameSpecificState.currentQuestion.answer;
    
    setGameSpecificState(prev => ({
      ...prev,
      selectedAnswer,
      feedback: isCorrect ? 'correct' : 'incorrect',
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1,
      streak: isCorrect ? prev.streak + 1 : 0,
      longestStreak: isCorrect ? Math.max(prev.longestStreak, prev.streak + 1) : prev.longestStreak,
      lives: isCorrect ? prev.lives : prev.lives - 1,
      questionNumber: prev.questionNumber + 1
    }));

    // Generate next question after showing feedback
    setTimeout(() => {
      if (!gameState.isCompleted) {
        generateQuestion();
      }
    }, 1500);
  };

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);
  const questionTimeRemaining = Math.max(0, difficultyConfig.questionTime - Math.floor((Date.now() - gameSpecificState.questionStartTime) / 1000));
  const accuracy = gameSpecificState.correct + gameSpecificState.incorrect > 0 ? 
    (gameSpecificState.correct / (gameSpecificState.correct + gameSpecificState.incorrect)) * 100 : 100;

  if (!gameSpecificState.currentQuestion) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Loading question...</div>
        </div>
      </div>
    );
  }

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.correct >= difficultyConfig.targetQuestions ? '🧮 Math Master!' : '💔 Game Over'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Correct: {gameSpecificState.correct}/{difficultyConfig.targetQuestions}</div>
            <div>Accuracy: {Math.round(accuracy)}%</div>
            <div>Best Streak: {gameSpecificState.longestStreak}</div>
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
            <h3 className="text-lg font-semibold">Math Quiz</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">Question: {gameSpecificState.questionNumber}</div>
            <div className="text-sm">Score: {gameState.score}</div>
            <div className="text-sm">Correct: {gameSpecificState.correct}/{difficultyConfig.targetQuestions}</div>
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
                style={{ width: `${(questionTimeRemaining / difficultyConfig.questionTime) * 100}%` }}
              />
            </div>
          </div>

          {/* Math Question */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-gray-900 mb-4">
              {gameSpecificState.currentQuestion.num1} {gameSpecificState.currentQuestion.operation} {gameSpecificState.currentQuestion.num2} = ?
            </div>
            
            <div className="text-lg text-gray-600">
              Question {gameSpecificState.questionNumber} of {difficultyConfig.targetQuestions}
            </div>
          </div>

          {/* Answer Choices */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
            {gameSpecificState.currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(choice)}
                disabled={gameState.isPaused || gameState.isCompleted || gameSpecificState.feedback !== null}
                className={`
                  p-4 text-2xl font-bold rounded-lg border-2 transition-all duration-200 transform hover:scale-105 active:scale-95
                  ${gameSpecificState.selectedAnswer === choice
                    ? (choice === gameSpecificState.currentQuestion.answer
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-red-100 border-red-500 text-red-800')
                    : (gameSpecificState.feedback && choice === gameSpecificState.currentQuestion.answer
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-white border-gray-300 hover:border-blue-400 text-gray-900')
                  }
                  ${gameState.isPaused || gameState.isCompleted || gameSpecificState.feedback !== null
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                  }
                `}
              >
                {choice}
              </button>
            ))}
          </div>

          {/* Stats Display */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">Accuracy</div>
              <div className="text-lg font-bold text-blue-600">{Math.round(accuracy)}%</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-800">Streak</div>
              <div className="text-lg font-bold text-green-600">{gameSpecificState.streak}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-800">Best</div>
              <div className="text-lg font-bold text-purple-600">{gameSpecificState.longestStreak}</div>
            </div>
          </div>

          {/* Feedback */}
          {gameSpecificState.feedback && (
            <div className={`text-center p-4 rounded-lg mb-4 ${
              gameSpecificState.feedback === 'correct' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className="text-xl font-bold">
                {gameSpecificState.feedback === 'correct' ? '✅ Correct!' : '❌ Incorrect'}
              </div>
              <div>
                {gameSpecificState.feedback === 'correct' 
                  ? `Great job! Streak: ${gameSpecificState.streak}` 
                  : `The answer was ${gameSpecificState.currentQuestion.answer}. ${gameSpecificState.lives - 1} lives left.`
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Solve math problems quickly and accurately! • Each question has a time limit of {difficultyConfig.questionTime}s
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const mathQuizPlugin: MinigamePlugin = {
  id: 'math-quiz',
  name: 'Math Quiz',
  description: 'Answer arithmetic questions quickly and accurately',
  category: 'educational',
  version: '1.0.0',
  
  difficultyConfig: {
    easy: { targetQuestions: 15, timeLimit: 120, maxNumber: 20, operations: ['+', '-'], questionTime: 15 },
    medium: { targetQuestions: 20, timeLimit: 100, maxNumber: 50, operations: ['+', '-', '×'], questionTime: 12 },
    hard: { targetQuestions: 25, timeLimit: 90, maxNumber: 100, operations: ['+', '-', '×', '÷'], questionTime: 10 },
    expert: { targetQuestions: 30, timeLimit: 75, maxNumber: 200, operations: ['+', '-', '×', '÷'], questionTime: 8 }
  },
  
  defaultDifficulty: 'medium',
  component: MathQuizGame,
  
  tags: ['math', 'arithmetic', 'speed', 'education'],
  estimatedDuration: 100, // 1.6 minutes
  requiredSkills: ['arithmetic', 'mental-math'],
  cognitiveLoad: 'medium',
  
  helpText: 'Solve arithmetic problems as quickly and accurately as possible. Each question has a time limit!',
  controls: ['Click the correct answer', 'Work quickly but accurately', 'Build up streaks for bonus points'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.targetQuestions !== 'number' || typeof config.timeLimit !== 'number' || typeof config.questionTime !== 'number') {
        return false;
      }
      if (config.targetQuestions <= 0 || config.timeLimit <= 0 || config.questionTime <= 0) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.['mental-math']) {
      const mathSkill = context.playerStats.skills['mental-math'] / 100;
      if (mathSkill >= 0.8) return 'hard';
      if (mathSkill >= 0.6) return 'medium';
      if (mathSkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};