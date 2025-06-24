// /Users/montysharma/V11M2/src/components/minigames/plugins/StroopTestPlugin.tsx
// Stroop Test Game migrated to plugin architecture

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface StroopItem {
  word: string;
  color: string;
  isCongruent: boolean;
}

interface ReactionTime {
  time: number;
  correct: boolean;
}

interface StroopTestGameState {
  currentItem: StroopItem | null;
  correct: number;
  incorrect: number;
  round: number;
  feedback: 'correct' | 'incorrect' | null;
  lives: number;
  reactionTimes: ReactionTime[];
  itemStartTime: number;
}

const StroopTestGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<StroopTestGameState>({
    currentItem: null,
    correct: 0,
    incorrect: 0,
    round: 1,
    feedback: null,
    lives: 3,
    reactionTimes: [],
    itemStartTime: Date.now()
  });

  // Color words and their corresponding colors
  const colorData = [
    { word: 'RED', color: '#DC2626' },
    { word: 'BLUE', color: '#2563EB' },
    { word: 'GREEN', color: '#059669' },
    { word: 'YELLOW', color: '#EAB308' },
    { word: 'PURPLE', color: '#7C3AED' },
    { word: 'ORANGE', color: '#EA580C' },
    { word: 'PINK', color: '#DB2777' },
    { word: 'BROWN', color: '#92400E' }
  ];

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { targetItems: 15, timeLimit: 120, congruentRatio: 0.6 };
      case 'medium': return { targetItems: 25, timeLimit: 90, congruentRatio: 0.4 };
      case 'hard': return { targetItems: 35, timeLimit: 75, congruentRatio: 0.3 };
      case 'expert': return { targetItems: 50, timeLimit: 60, congruentRatio: 0.2 };
      default: return { targetItems: 25, timeLimit: 90, congruentRatio: 0.4 };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Generate a new Stroop item
  const generateItem = useCallback(() => {
    const wordIndex = Math.floor(Math.random() * colorData.length);
    const word = colorData[wordIndex].word;
    
    // Determine if this should be congruent or incongruent
    const shouldBeCongruent = Math.random() < difficultyConfig.congruentRatio;
    
    let color: string;
    let isCongruent: boolean;
    
    if (shouldBeCongruent) {
      // Congruent: word matches color
      color = colorData[wordIndex].color;
      isCongruent = true;
    } else {
      // Incongruent: word doesn't match color
      let colorIndex;
      do {
        colorIndex = Math.floor(Math.random() * colorData.length);
      } while (colorIndex === wordIndex); // Ensure different color
      
      color = colorData[colorIndex].color;
      isCongruent = false;
    }
    
    const item: StroopItem = { word, color, isCongruent };
    setGameSpecificState(prev => ({
      ...prev,
      currentItem: item,
      itemStartTime: Date.now(),
      feedback: null
    }));
  }, [difficultyConfig.congruentRatio]);

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && !gameSpecificState.currentItem) {
      generateItem();
    }
  }, [gameState.isStarted, gameSpecificState.currentItem, generateItem]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.correct >= difficultyConfig.targetItems && !gameState.isCompleted) {
      const timeElapsed = getElapsedTime();
      const score = calculateScore();
      const accuracy = gameSpecificState.correct / (gameSpecificState.correct + gameSpecificState.incorrect) * 100;
      const avgReactionTime = gameSpecificState.reactionTimes.length > 0 
        ? gameSpecificState.reactionTimes.reduce((sum, rt) => sum + rt.time, 0) / gameSpecificState.reactionTimes.length 
        : 0;
      
      completeGame(true, score, {
        correct: gameSpecificState.correct,
        accuracy,
        avgReactionTime
      });
    }
  }, [gameSpecificState.correct, difficultyConfig.targetItems, gameState.isCompleted]);

  // Check for lose condition
  useEffect(() => {
    if (gameSpecificState.lives <= 0 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.correct / Math.max(1, gameSpecificState.correct + gameSpecificState.incorrect) * 100;
      const avgReactionTime = gameSpecificState.reactionTimes.length > 0 
        ? gameSpecificState.reactionTimes.reduce((sum, rt) => sum + rt.time, 0) / gameSpecificState.reactionTimes.length 
        : 0;
      
      completeGame(false, score, {
        correct: gameSpecificState.correct,
        accuracy,
        avgReactionTime
      });
    }
  }, [gameSpecificState.lives, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.correct / Math.max(1, gameSpecificState.correct + gameSpecificState.incorrect) * 100;
      const avgReactionTime = gameSpecificState.reactionTimes.length > 0 
        ? gameSpecificState.reactionTimes.reduce((sum, rt) => sum + rt.time, 0) / gameSpecificState.reactionTimes.length 
        : 0;
      
      completeGame(false, score, {
        correct: gameSpecificState.correct,
        accuracy,
        avgReactionTime
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  const calculateScore = (): number => {
    // More points for incongruent items (they're harder)
    const congruentPoints = gameSpecificState.reactionTimes.filter(rt => rt.correct).length * 5;
    const totalPoints = gameSpecificState.correct * 10; // Simplified for now
    return totalPoints;
  };

  // Handle color choice
  const handleColorChoice = (chosenColorName: string) => {
    if (gameState.isPaused || gameState.isCompleted || !gameSpecificState.currentItem) return;
    
    const reactionTime = Date.now() - gameSpecificState.itemStartTime;
    
    // Find the actual color that the text is displayed in
    const actualColorData = colorData.find(c => c.color === gameSpecificState.currentItem!.color);
    const correctAnswer = actualColorData?.word || '';
    
    const isCorrect = chosenColorName === correctAnswer;
    
    incrementAttempts();

    // Record reaction time
    setGameSpecificState(prev => ({
      ...prev,
      reactionTimes: [...prev.reactionTimes, { time: reactionTime, correct: isCorrect }]
    }));
    
    if (isCorrect) {
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'correct',
        correct: prev.correct + 1
      }));
      
      // Generate next item after brief delay
      setTimeout(() => {
        if (!gameState.isCompleted) {
          setGameSpecificState(prev => ({ ...prev, round: prev.round + 1 }));
          generateItem();
        }
      }, 800);
    } else {
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'incorrect',
        incorrect: prev.incorrect + 1,
        lives: prev.lives - 1
      }));
      
      // Generate next item after delay
      setTimeout(() => {
        if (!gameState.isCompleted) {
          setGameSpecificState(prev => ({ ...prev, round: prev.round + 1 }));
          generateItem();
        }
      }, 1200);
    }
  };

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);
  const accuracy = gameSpecificState.correct + gameSpecificState.incorrect > 0 ? 
    (gameSpecificState.correct / (gameSpecificState.correct + gameSpecificState.incorrect)) * 100 : 100;
  const avgReactionTime = gameSpecificState.reactionTimes.length > 0 
    ? gameSpecificState.reactionTimes.reduce((sum, rt) => sum + rt.time, 0) / gameSpecificState.reactionTimes.length 
    : 0;

  if (!gameSpecificState.currentItem) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <div className="text-center">Loading Stroop test...</div>
        </div>
      </div>
    );
  }

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.correct >= difficultyConfig.targetItems ? '🧠 Excellent Cognitive Control!' : '💔 Game Over'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Correct: {gameSpecificState.correct}/{difficultyConfig.targetItems}</div>
            <div>Time: {timeElapsed}s</div>
            <div>Accuracy: {Math.round(accuracy)}%</div>
            <div>Avg Reaction: {Math.round(avgReactionTime)}ms</div>
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Stroop Test</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">Score: {gameState.score}</div>
            <div className="text-sm">Correct: {gameSpecificState.correct}/{difficultyConfig.targetItems}</div>
            <div className="text-sm">Lives: {'❤️'.repeat(gameSpecificState.lives)}</div>
            <div className="text-sm">Accuracy: {Math.round(accuracy)}%</div>
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
          {/* Instructions */}
          <div className="text-center mb-8">
            <div className="text-lg font-semibold text-gray-700 mb-6">
              What COLOR is this text displayed in?
            </div>
            
            <div className="bg-gray-100 rounded-lg p-8 mb-6">
              <div 
                className="text-6xl font-bold"
                style={{ color: gameSpecificState.currentItem.color }}
              >
                {gameSpecificState.currentItem.word}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              {gameSpecificState.currentItem.isCongruent ? (
                <span className="text-green-600">✓ Congruent (word matches color)</span>
              ) : (
                <span className="text-red-600">⚠ Incongruent (word doesn't match color)</span>
              )}
            </div>
          </div>

          {/* Color Choice Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {colorData.map((colorOption) => (
              <button
                key={colorOption.word}
                onClick={() => handleColorChoice(colorOption.word)}
                disabled={gameState.isPaused || gameState.isCompleted}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 active:scale-95
                  ${gameState.isPaused || gameState.isCompleted
                    ? 'cursor-not-allowed opacity-50' 
                    : 'cursor-pointer hover:border-gray-400'
                  }
                  border-gray-300 bg-white
                `}
                style={{ 
                  backgroundColor: colorOption.color,
                  color: 'white',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                <div className="font-bold text-lg">{colorOption.word}</div>
              </button>
            ))}
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
                  ? `+${gameSpecificState.currentItem.isCongruent ? 5 : 10} points` 
                  : `Wrong color! ${gameSpecificState.lives - 1} lives left.`
                }
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Click the button that matches the COLOR of the text, not what the word says! • Time limit: {difficultyConfig.timeLimit}s
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const stroopTestPlugin: MinigamePlugin = {
  id: 'stroop-test',
  name: 'Stroop Test',
  description: 'Name the color of the text, not what it says',
  category: 'cognitive',
  version: '2.0.0',
  
  difficultyConfig: {
    easy: { targetItems: 15, timeLimit: 120, congruentRatio: 0.6 },
    medium: { targetItems: 25, timeLimit: 90, congruentRatio: 0.4 },
    hard: { targetItems: 35, timeLimit: 75, congruentRatio: 0.3 },
    expert: { targetItems: 50, timeLimit: 60, congruentRatio: 0.2 }
  },
  
  defaultDifficulty: 'medium',
  component: StroopTestGame,
  
  tags: ['cognitive', 'attention', 'inhibition', 'reaction-time'],
  estimatedDuration: 90, // 1.5 minutes
  requiredSkills: ['attention', 'cognitive-control'],
  cognitiveLoad: 'high',
  
  helpText: 'Click the button that matches the COLOR of the text, not what the word says. Fight the urge to read!',
  controls: ['Mouse click on color buttons', 'Ignore the word text', 'Focus on display color only'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.targetItems !== 'number' || typeof config.timeLimit !== 'number' || typeof config.congruentRatio !== 'number') {
        return false;
      }
      if (config.targetItems <= 0 || config.timeLimit <= 0 || config.congruentRatio < 0 || config.congruentRatio > 1) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.attention) {
      const attentionSkill = context.playerStats.skills.attention / 100;
      if (attentionSkill >= 0.8) return 'hard';
      if (attentionSkill >= 0.6) return 'medium';
      if (attentionSkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};