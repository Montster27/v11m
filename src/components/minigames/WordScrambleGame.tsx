import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../ui';
import { WordData, getRandomWord, scrambleWord, validateAnswer } from './wordScrambleData';

interface WordScrambleGameProps {
  onGameComplete: (success: boolean, stats: { score: number; words: number; time: number }) => void;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface GameWord {
  original: string;
  scrambled: string;
  hint: string;
  category: string;
}

const WordScrambleGame: React.FC<WordScrambleGameProps> = ({
  onGameComplete,
  onClose,
  difficulty = 'medium'
}) => {
  const [currentWord, setCurrentWord] = useState<GameWord | null>(null);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [lives, setLives] = useState(3);
  const [usedHints, setUsedHints] = useState(0);

  const targetWords = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : 10;
  const timeLimit = difficulty === 'easy' ? 120 : difficulty === 'medium' ? 180 : 240; // seconds

  // Generate a new word
  const generateNewWord = useCallback(() => {
    const wordData = getRandomWord(difficulty);
    const scrambled = scrambleWord(wordData.word);
    
    setCurrentWord({
      original: wordData.word,
      scrambled: scrambled,
      hint: wordData.hint,
      category: wordData.category
    });
    setUserInput('');
    setShowHint(false);
  }, [difficulty]);

  // Initialize game
  useEffect(() => {
    generateNewWord();
    setStartTime(Date.now());
  }, [generateNewWord]);

  // Handle answer submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentWord || !userInput.trim()) return;

    const isCorrect = validateAnswer(userInput, currentWord.original);
    
    if (isCorrect) {
      setFeedback('correct');
      setScore(prev => prev + (showHint ? 5 : 10)); // Less points if hint was used
      setWordsCompleted(prev => prev + 1);
      
      // Check win condition
      if (wordsCompleted + 1 >= targetWords) {
        setGameStatus('won');
        const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
        onGameComplete(true, { 
          score: score + (showHint ? 5 : 10), 
          words: wordsCompleted + 1, 
          time: timeElapsed 
        });
        return;
      }
      
      // Generate new word after brief delay
      setTimeout(() => {
        generateNewWord();
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback('incorrect');
      setLives(prev => prev - 1);
      
      // Check lose condition
      if (lives - 1 <= 0) {
        setGameStatus('lost');
        const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
        onGameComplete(false, { 
          score, 
          words: wordsCompleted, 
          time: timeElapsed 
        });
        return;
      }
      
      // Clear feedback after delay
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
  };

  // Handle hint
  const handleHint = () => {
    setShowHint(true);
    setUsedHints(prev => prev + 1);
  };

  // Skip word (costs a life)
  const handleSkip = () => {
    setLives(prev => prev - 1);
    
    if (lives - 1 <= 0) {
      setGameStatus('lost');
      const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
      onGameComplete(false, { score, words: wordsCompleted, time: timeElapsed });
      return;
    }
    
    generateNewWord();
  };

  // Time tracking
  const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
  const timeRemaining = Math.max(0, timeLimit - timeElapsed);

  // Auto-lose when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && gameStatus === 'playing') {
      setGameStatus('lost');
      onGameComplete(false, { score, words: wordsCompleted, time: timeLimit });
    }
  }, [timeRemaining, gameStatus, score, wordsCompleted, timeLimit, onGameComplete]);

  if (!currentWord) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="bg-white p-6 max-w-md">
          <div className="text-center">Loading word...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-white p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Word Scramble</h2>
            <p className="text-gray-600">Unscramble the letters to form words!</p>
          </div>
          <Button onClick={onClose} variant="outline">
            ✕ Close
          </Button>
        </div>

        {/* Game Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-blue-800">Score</div>
            <div className="text-lg font-bold text-blue-600">{score}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-green-800">Words</div>
            <div className="text-lg font-bold text-green-600">{wordsCompleted}/{targetWords}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-purple-800">Lives</div>
            <div className="text-lg font-bold text-purple-600">{'❤️'.repeat(lives)}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-orange-800">Time</div>
            <div className="text-lg font-bold text-orange-600">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-gray-800">Difficulty</div>
            <div className="text-lg font-bold text-gray-600 capitalize">{difficulty}</div>
          </div>
        </div>

        {/* Game Area */}
        <div className="space-y-6">
          {/* Word Display */}
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600 uppercase tracking-wide">{currentWord.category}</div>
            <div className="text-4xl font-bold tracking-widest text-gray-900 bg-gray-100 p-4 rounded-lg">
              {currentWord.scrambled}
            </div>
            
            {/* Hint */}
            {showHint && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <strong>Hint:</strong> {currentWord.hint}
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                placeholder="Enter your answer..."
                className="w-full p-4 text-xl text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={gameStatus !== 'playing'}
                autoFocus
              />
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button 
                type="submit" 
                variant="primary"
                disabled={!userInput.trim() || gameStatus !== 'playing'}
              >
                Submit Answer
              </Button>
              
              {!showHint && (
                <Button 
                  type="button"
                  onClick={handleHint}
                  variant="outline"
                  disabled={gameStatus !== 'playing'}
                >
                  Show Hint (-5 pts)
                </Button>
              )}
              
              <Button 
                type="button"
                onClick={handleSkip}
                variant="outline"
                disabled={gameStatus !== 'playing'}
                className="text-red-600 hover:text-red-700"
              >
                Skip (-1 ❤️)
              </Button>
            </div>
          </form>

          {/* Feedback */}
          {feedback && (
            <div className={`text-center p-4 rounded-lg ${
              feedback === 'correct' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {feedback === 'correct' ? (
                <div>
                  <div className="text-xl font-bold">✅ Correct!</div>
                  <div>The word was: {currentWord.original}</div>
                  <div>+{showHint ? 5 : 10} points</div>
                </div>
              ) : (
                <div>
                  <div className="text-xl font-bold">❌ Incorrect</div>
                  <div>Try again! You have {lives - 1} lives left.</div>
                </div>
              )}
            </div>
          )}

          {/* Game Over Messages */}
          {gameStatus === 'won' && (
            <div className="bg-green-100 text-green-800 p-6 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">🎉 Congratulations!</div>
              <div className="space-y-1">
                <div>You completed all {targetWords} words!</div>
                <div>Final Score: {score} points</div>
                <div>Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
                <div>Hints Used: {usedHints}</div>
              </div>
            </div>
          )}

          {gameStatus === 'lost' && (
            <div className="bg-red-100 text-red-800 p-6 rounded-lg text-center">
              <div className="text-2xl font-bold mb-2">💔 Game Over</div>
              <div className="space-y-1">
                <div>Words Completed: {wordsCompleted}/{targetWords}</div>
                <div>Final Score: {score} points</div>
                <div>The current word was: <strong>{currentWord.original}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Game Over Actions */}
        {gameStatus !== 'playing' && (
          <div className="mt-6 flex justify-center space-x-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Play Again
            </Button>
            <Button onClick={onClose} variant="primary">
              Continue
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WordScrambleGame;