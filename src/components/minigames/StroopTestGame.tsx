import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../ui';

interface StroopTestGameProps {
  onGameComplete: (success: boolean, stats: { score: number; correct: number; time: number; accuracy: number; avgReactionTime: number }) => void;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface StroopItem {
  word: string;
  color: string;
  isCongruent: boolean;
}

interface ReactionTime {
  time: number;
  correct: boolean;
}

const StroopTestGame: React.FC<StroopTestGameProps> = ({
  onGameComplete,
  onClose,
  difficulty = 'medium'
}) => {
  const [currentItem, setCurrentItem] = useState<StroopItem | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [itemStartTime, setItemStartTime] = useState<number>(Date.now());
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [lives, setLives] = useState(3);
  const [reactionTimes, setReactionTimes] = useState<ReactionTime[]>([]);

  // Game configuration based on difficulty
  const config = {
    easy: { targetItems: 15, timeLimit: 120, congruentRatio: 0.6 },
    medium: { targetItems: 25, timeLimit: 90, congruentRatio: 0.4 },
    hard: { targetItems: 35, timeLimit: 75, congruentRatio: 0.3 }
  }[difficulty];

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

  // Generate a new Stroop item
  const generateItem = useCallback(() => {
    const wordIndex = Math.floor(Math.random() * colorData.length);
    const word = colorData[wordIndex].word;
    
    // Determine if this should be congruent or incongruent
    const shouldBeCongruent = Math.random() < config.congruentRatio;
    
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
    setCurrentItem(item);
    setItemStartTime(Date.now());
    setFeedback(null);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 New Stroop item:', {
        word: item.word,
        color: item.color,
        isCongruent: item.isCongruent,
        type: item.isCongruent ? 'CONGRUENT' : 'INCONGRUENT'
      });
    }
  }, [config.congruentRatio]);

  // Initialize game
  useEffect(() => {
    generateItem();
    setStartTime(Date.now());
  }, [generateItem]);

  // Handle color choice
  const handleColorChoice = (chosenColorName: string) => {
    if (gameStatus !== 'playing' || !currentItem) return;
    
    const reactionTime = Date.now() - itemStartTime;
    
    // Find the actual color that the text is displayed in
    const actualColorData = colorData.find(c => c.color === currentItem.color);
    const correctAnswer = actualColorData?.word || '';
    
    const isCorrect = chosenColorName === correctAnswer;
    
    console.log('🎯 Stroop choice:', {
      word: currentItem.word,
      displayColor: currentItem.color,
      correctAnswer,
      chosen: chosenColorName,
      isCorrect,
      reactionTime: `${reactionTime}ms`,
      isCongruent: currentItem.isCongruent
    });
    
    // Record reaction time
    setReactionTimes(prev => [...prev, { time: reactionTime, correct: isCorrect }]);
    
    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + (currentItem.isCongruent ? 5 : 10)); // More points for incongruent items
      setCorrect(prev => {
        const newCorrect = prev + 1;
        
        // Check win condition
        if (newCorrect >= config.targetItems) {
          setGameStatus('won');
          const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
          const accuracy = newCorrect / (newCorrect + incorrect) * 100;
          const avgReactionTime = reactionTimes.reduce((sum, rt) => sum + rt.time, 0) / reactionTimes.length;
          
          setTimeout(() => {
            onGameComplete(true, { 
              score: score + (currentItem.isCongruent ? 5 : 10), 
              correct: newCorrect, 
              time: timeElapsed,
              accuracy,
              avgReactionTime: avgReactionTime || 0
            });
          }, 1000);
          return newCorrect;
        }
        
        return newCorrect;
      });
      
      // Generate next item after brief delay
      setTimeout(() => {
        if (gameStatus === 'playing') {
          setRound(prev => prev + 1);
          generateItem();
        }
      }, 800);
    } else {
      setFeedback('incorrect');
      setIncorrect(prev => prev + 1);
      setLives(prev => {
        const newLives = prev - 1;
        
        // Check lose condition
        if (newLives <= 0) {
          setGameStatus('lost');
          const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
          const accuracy = correct / Math.max(1, correct + incorrect + 1) * 100;
          const avgReactionTime = reactionTimes.length > 0 
            ? reactionTimes.reduce((sum, rt) => sum + rt.time, 0) / reactionTimes.length 
            : 0;
          
          setTimeout(() => {
            onGameComplete(false, { 
              score, 
              correct, 
              time: timeElapsed,
              accuracy,
              avgReactionTime
            });
          }, 1000);
          return newLives;
        }
        
        return newLives;
      });
      
      // Generate next item after delay
      setTimeout(() => {
        if (gameStatus === 'playing') {
          setRound(prev => prev + 1);
          generateItem();
        }
      }, 1200);
    }
  };

  // Time tracking
  const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
  const timeRemaining = Math.max(0, config.timeLimit - timeElapsed);

  // Auto-lose when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && gameStatus === 'playing') {
      console.log('⏰ Time up!');
      setGameStatus('lost');
      const accuracy = correct / Math.max(1, correct + incorrect) * 100;
      const avgReactionTime = reactionTimes.length > 0 
        ? reactionTimes.reduce((sum, rt) => sum + rt.time, 0) / reactionTimes.length 
        : 0;
      onGameComplete(false, { score, correct, time: config.timeLimit, accuracy, avgReactionTime });
    }
  }, [timeRemaining, gameStatus, score, correct, incorrect, config.timeLimit, onGameComplete, reactionTimes]);

  // Calculate accuracy and average reaction time
  const accuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 100;
  const avgReactionTime = reactionTimes.length > 0 
    ? reactionTimes.reduce((sum, rt) => sum + rt.time, 0) / reactionTimes.length 
    : 0;

  if (!currentItem) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="bg-white p-6 max-w-md">
          <div className="text-center">Loading Stroop test...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-white p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Stroop Test</h2>
            <p className="text-gray-600">Name the COLOR of the text, not what it says!</p>
          </div>
          <Button onClick={onClose} variant="outline">
            ✕ Close
          </Button>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-blue-800">Score</div>
            <div className="text-lg font-bold text-blue-600">{score}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-green-800">Correct</div>
            <div className="text-lg font-bold text-green-600">{correct}/{config.targetItems}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-purple-800">Lives</div>
            <div className="text-lg font-bold text-purple-600">{'❤️'.repeat(lives)}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-orange-800">Time</div>
            <div className="text-lg font-bold text-orange-600">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-indigo-800">Accuracy</div>
            <div className="text-lg font-bold text-indigo-600">{Math.round(accuracy)}%</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-gray-800">Avg Time</div>
            <div className="text-lg font-bold text-gray-600">{Math.round(avgReactionTime)}ms</div>
          </div>
        </div>

        {/* Stroop Display */}
        <div className="text-center mb-8">
          <div className="text-lg font-semibold text-gray-700 mb-6">
            What COLOR is this text displayed in?
          </div>
          
          <div className="bg-gray-100 rounded-lg p-8 mb-6">
            <div 
              className="text-6xl font-bold"
              style={{ color: currentItem.color }}
            >
              {currentItem.word}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            {currentItem.isCongruent ? (
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
              disabled={gameStatus !== 'playing'}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 active:scale-95
                ${gameStatus !== 'playing' 
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
        {feedback && (
          <div className={`text-center p-4 rounded-lg mb-4 ${
            feedback === 'correct' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className="text-xl font-bold">
              {feedback === 'correct' ? '✅ Correct!' : '❌ Incorrect'}
            </div>
            <div>
              {feedback === 'correct' 
                ? `+${currentItem.isCongruent ? 5 : 10} points` 
                : `Wrong color! ${lives - 1} lives left.`
              }
            </div>
          </div>
        )}

        {/* Game Over Messages */}
        {gameStatus === 'won' && (
          <div className="bg-green-100 text-green-800 p-6 rounded-lg text-center mb-4">
            <div className="text-2xl font-bold mb-2">🧠 Excellent Cognitive Control!</div>
            <div className="space-y-1">
              <div>You completed all {config.targetItems} Stroop items!</div>
              <div>Final Score: {score} points</div>
              <div>Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
              <div>Accuracy: {Math.round(accuracy)}%</div>
              <div>Average Reaction Time: {Math.round(avgReactionTime)}ms</div>
            </div>
          </div>
        )}

        {gameStatus === 'lost' && (
          <div className="bg-red-100 text-red-800 p-6 rounded-lg text-center mb-4">
            <div className="text-2xl font-bold mb-2">💔 Game Over</div>
            <div className="space-y-1">
              <div>Correct Answers: {correct}/{config.targetItems}</div>
              <div>Final Score: {score} points</div>
              <div>Accuracy: {Math.round(accuracy)}%</div>
              <div>Average Reaction Time: {Math.round(avgReactionTime)}ms</div>
              {timeRemaining === 0 ? <div>Time ran out!</div> : <div>No lives remaining!</div>}
            </div>
          </div>
        )}

        {/* Game Over Actions */}
        {gameStatus !== 'playing' && (
          <div className="flex justify-center space-x-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Play Again
            </Button>
            <Button onClick={onClose} variant="primary">
              Continue
            </Button>
          </div>
        )}

        {/* Instructions */}
        {gameStatus === 'playing' && round === 1 && !feedback && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
            <div className="text-sm text-blue-800">
              <strong>Instructions:</strong> Click the button that matches the COLOR of the text, 
              not what the word says! Incongruent items (where word ≠ color) give more points.
            </div>
          </div>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div>Debug: Word="{currentItem.word}", Color={currentItem.color}, Congruent={currentItem.isCongruent ? 'Yes' : 'No'}</div>
            <div>Expected answer: {colorData.find(c => c.color === currentItem.color)?.word}</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StroopTestGame;