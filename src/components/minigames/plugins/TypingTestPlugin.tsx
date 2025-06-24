// /Users/montysharma/V11M2/src/components/minigames/plugins/TypingTestPlugin.tsx
// Typing Test Game - Test typing speed and accuracy

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface TypingTestGameState {
  targetText: string;
  userInput: string;
  currentWordIndex: number;
  currentCharIndex: number;
  wordsPerMinute: number;
  accuracy: number;
  errors: number;
  correctChars: number;
  totalChars: number;
  isFinished: boolean;
  startTime: number;
  lastUpdateTime: number;
}

const TypingTestGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<TypingTestGameState>({
    targetText: '',
    userInput: '',
    currentWordIndex: 0,
    currentCharIndex: 0,
    wordsPerMinute: 0,
    accuracy: 100,
    errors: 0,
    correctChars: 0,
    totalChars: 0,
    isFinished: false,
    startTime: 0,
    lastUpdateTime: 0
  });

  // Sample texts for different difficulties
  const sampleTexts = {
    easy: [
      "The quick brown fox jumps over the lazy dog. This is a simple test for typing speed.",
      "Pack my box with five dozen liquor jugs. The five boxing wizards jump quickly.",
      "How vexingly quick daft zebras jump. Bright vixens jump quickly and foxy zebras."
    ],
    medium: [
      "Technology has revolutionized the way we communicate and work. Modern computers can process information at incredible speeds, making tasks that once took hours now complete in seconds.",
      "The art of programming requires both logical thinking and creative problem-solving. Developers must understand complex algorithms while also considering user experience and interface design.",
      "Climate change represents one of the most significant challenges facing humanity today. Scientists around the world are working together to develop sustainable solutions."
    ],
    hard: [
      "Artificial intelligence and machine learning algorithms are transforming industries across the globe, from healthcare and finance to transportation and entertainment, creating unprecedented opportunities for innovation.",
      "Quantum computing represents a paradigm shift in computational capability, potentially revolutionizing cryptography, drug discovery, and complex optimization problems that are intractable for classical computers.",
      "The philosophical implications of consciousness and free will continue to perplex researchers, as neuroscience advances reveal the intricate mechanisms underlying human cognition and decision-making processes."
    ],
    expert: [
      "Bioinformatics exemplifies the convergence of computational science and biological research, utilizing sophisticated algorithms to analyze genomic sequences, predict protein structures, and understand evolutionary relationships.",
      "Cryptographic protocols ensure data security through mathematical complexity, employing techniques such as elliptic curve cryptography and post-quantum algorithms to protect against emerging computational threats.",
      "Epistemological considerations regarding the nature of knowledge and justified belief systems influence contemporary debates in philosophy of science, particularly concerning the reliability of empirical methodologies."
    ]
  };

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { 
        timeLimit: 120, 
        targetWPM: 25, 
        minAccuracy: 85,
        allowBackspace: true 
      };
      case 'medium': return { 
        timeLimit: 90, 
        targetWPM: 35, 
        minAccuracy: 90,
        allowBackspace: true 
      };
      case 'hard': return { 
        timeLimit: 75, 
        targetWPM: 45, 
        minAccuracy: 95,
        allowBackspace: false 
      };
      case 'expert': return { 
        timeLimit: 60, 
        targetWPM: 55, 
        minAccuracy: 98,
        allowBackspace: false 
      };
      default: return { 
        timeLimit: 90, 
        targetWPM: 35, 
        minAccuracy: 90,
        allowBackspace: true 
      };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Initialize text
  useEffect(() => {
    if (gameState.isStarted && !gameSpecificState.targetText) {
      const texts = sampleTexts[props.difficulty] || sampleTexts.medium;
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      
      setGameSpecificState(prev => ({
        ...prev,
        targetText: randomText,
        startTime: Date.now(),
        lastUpdateTime: Date.now()
      }));
    }
  }, [gameState.isStarted, gameSpecificState.targetText, props.difficulty]);

  // Calculate WPM and accuracy
  const updateStats = useCallback(() => {
    const now = Date.now();
    const elapsedMinutes = (now - gameSpecificState.startTime) / 60000;
    
    if (elapsedMinutes > 0) {
      const wordsTyped = gameSpecificState.userInput.trim().split(' ').length;
      const wpm = Math.round(wordsTyped / elapsedMinutes);
      const accuracy = gameSpecificState.totalChars > 0 ? 
        (gameSpecificState.correctChars / gameSpecificState.totalChars) * 100 : 100;
      
      setGameSpecificState(prev => ({
        ...prev,
        wordsPerMinute: wpm,
        accuracy: Math.round(accuracy),
        lastUpdateTime: now
      }));
    }
  }, [gameSpecificState.startTime, gameSpecificState.userInput, gameSpecificState.correctChars, gameSpecificState.totalChars]);

  // Update stats periodically
  useEffect(() => {
    if (gameSpecificState.startTime > 0 && !gameSpecificState.isFinished) {
      const interval = setInterval(updateStats, 1000);
      return () => clearInterval(interval);
    }
  }, [gameSpecificState.startTime, gameSpecificState.isFinished, updateStats]);

  // Check for completion
  useEffect(() => {
    if (gameSpecificState.userInput.length === gameSpecificState.targetText.length && !gameState.isCompleted) {
      const finalWPM = gameSpecificState.wordsPerMinute;
      const finalAccuracy = gameSpecificState.accuracy;
      const success = finalWPM >= difficultyConfig.targetWPM && finalAccuracy >= difficultyConfig.minAccuracy;
      
      setGameSpecificState(prev => ({ ...prev, isFinished: true }));
      
      const score = calculateScore(finalWPM, finalAccuracy);
      completeGame(success, score, {
        wpm: finalWPM,
        accuracy: finalAccuracy,
        errors: gameSpecificState.errors,
        timeElapsed: getElapsedTime() / 1000
      });
    }
  }, [gameSpecificState.userInput.length, gameSpecificState.targetText.length, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const finalWPM = gameSpecificState.wordsPerMinute;
      const finalAccuracy = gameSpecificState.accuracy;
      const success = finalWPM >= difficultyConfig.targetWPM && finalAccuracy >= difficultyConfig.minAccuracy;
      
      setGameSpecificState(prev => ({ ...prev, isFinished: true }));
      
      const score = calculateScore(finalWPM, finalAccuracy);
      completeGame(success, score, {
        wpm: finalWPM,
        accuracy: finalAccuracy,
        errors: gameSpecificState.errors,
        timeElapsed: difficultyConfig.timeLimit
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  const calculateScore = (wpm: number, accuracy: number): number => {
    const wpmScore = Math.max(0, wpm * 10);
    const accuracyBonus = accuracy >= 95 ? 200 : accuracy >= 90 ? 100 : 0;
    const speedBonus = wpm >= difficultyConfig.targetWPM + 10 ? 150 : 0;
    
    return Math.round(wpmScore + accuracyBonus + speedBonus);
  };

  // Handle typing input
  const handleInputChange = (value: string) => {
    if (gameState.isPaused || gameState.isCompleted || gameSpecificState.isFinished) return;

    // Check if backspace is allowed
    if (!difficultyConfig.allowBackspace && value.length < gameSpecificState.userInput.length) {
      return;
    }

    const newInput = value;
    const targetText = gameSpecificState.targetText;
    
    // Calculate character-by-character accuracy
    let correctChars = 0;
    let errors = 0;
    
    for (let i = 0; i < newInput.length; i++) {
      if (i < targetText.length) {
        if (newInput[i] === targetText[i]) {
          correctChars++;
        } else {
          errors++;
        }
      } else {
        errors++; // Extra characters are errors
      }
    }
    
    // Find current word and character position
    let currentWordIndex = 0;
    let currentCharIndex = 0;
    let charCount = 0;
    
    const words = targetText.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (charCount + words[i].length >= newInput.length) {
        currentWordIndex = i;
        currentCharIndex = newInput.length - charCount;
        break;
      }
      charCount += words[i].length + 1; // +1 for space
    }

    incrementAttempts();
    
    setGameSpecificState(prev => ({
      ...prev,
      userInput: newInput,
      currentWordIndex,
      currentCharIndex,
      correctChars,
      errors,
      totalChars: newInput.length
    }));
  };

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);

  if (!gameSpecificState.targetText) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Loading typing test...</div>
        </div>
      </div>
    );
  }

  if (gameState.isCompleted) {
    const success = gameSpecificState.wordsPerMinute >= difficultyConfig.targetWPM && 
                   gameSpecificState.accuracy >= difficultyConfig.minAccuracy;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {success ? '⌨️ Typing Master!' : '⏰ Test Complete'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>WPM: {gameSpecificState.wordsPerMinute} (Target: {difficultyConfig.targetWPM})</div>
            <div>Accuracy: {gameSpecificState.accuracy}% (Target: {difficultyConfig.minAccuracy}%)</div>
            <div>Errors: {gameSpecificState.errors}</div>
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

  // Render text with highlighting
  const renderText = () => {
    const text = gameSpecificState.targetText;
    const userInput = gameSpecificState.userInput;
    
    return text.split('').map((char, index) => {
      let className = 'text-gray-400'; // Not typed yet
      
      if (index < userInput.length) {
        if (userInput[index] === char) {
          className = 'text-green-600 bg-green-100'; // Correct
        } else {
          className = 'text-red-600 bg-red-100'; // Incorrect
        }
      } else if (index === userInput.length) {
        className = 'text-gray-800 bg-blue-200'; // Current position
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Typing Test</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">WPM: {gameSpecificState.wordsPerMinute}</div>
            <div className="text-sm">Accuracy: {gameSpecificState.accuracy}%</div>
            <div className="text-sm">Errors: {gameSpecificState.errors}</div>
          </div>
          
          <button
            onClick={props.onClose}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Stats Display */}
        <div className="p-4 bg-blue-50 border-b">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-blue-800">Target WPM</div>
              <div className="text-lg font-bold text-blue-600">{difficultyConfig.targetWPM}</div>
            </div>
            <div>
              <div className="text-sm text-green-800">Current WPM</div>
              <div className={`text-lg font-bold ${gameSpecificState.wordsPerMinute >= difficultyConfig.targetWPM ? 'text-green-600' : 'text-red-600'}`}>
                {gameSpecificState.wordsPerMinute}
              </div>
            </div>
            <div>
              <div className="text-sm text-purple-800">Target Accuracy</div>
              <div className="text-lg font-bold text-purple-600">{difficultyConfig.minAccuracy}%</div>
            </div>
            <div>
              <div className="text-sm text-orange-800">Current Accuracy</div>
              <div className={`text-lg font-bold ${gameSpecificState.accuracy >= difficultyConfig.minAccuracy ? 'text-green-600' : 'text-red-600'}`}>
                {gameSpecificState.accuracy}%
              </div>
            </div>
          </div>
        </div>

        {/* Text Display */}
        <div className="p-6">
          <div className="bg-gray-50 p-6 rounded-lg mb-6 text-xl leading-relaxed font-mono">
            {renderText()}
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <textarea
              value={gameSpecificState.userInput}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={gameState.isPaused || gameState.isCompleted || gameSpecificState.isFinished}
              placeholder="Start typing here..."
              className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono resize-none"
              rows={4}
              autoFocus
            />
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm text-gray-600">
                {gameSpecificState.userInput.length}/{gameSpecificState.targetText.length} characters
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(gameSpecificState.userInput.length / gameSpecificState.targetText.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Type the text above as quickly and accurately as possible! • 
            {difficultyConfig.allowBackspace ? ' Backspace allowed' : ' No backspace allowed'} • 
            Target: {difficultyConfig.targetWPM} WPM, {difficultyConfig.minAccuracy}% accuracy
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const typingTestPlugin: MinigamePlugin = {
  id: 'typing-test',
  name: 'Typing Test',
  description: 'Test your typing speed and accuracy',
  category: 'skill',
  version: '1.0.0',
  
  difficultyConfig: {
    easy: { timeLimit: 120, targetWPM: 25, minAccuracy: 85, allowBackspace: true },
    medium: { timeLimit: 90, targetWPM: 35, minAccuracy: 90, allowBackspace: true },
    hard: { timeLimit: 75, targetWPM: 45, minAccuracy: 95, allowBackspace: false },
    expert: { timeLimit: 60, targetWPM: 55, minAccuracy: 98, allowBackspace: false }
  },
  
  defaultDifficulty: 'medium',
  component: TypingTestGame,
  
  tags: ['typing', 'speed', 'accuracy', 'skill'],
  estimatedDuration: 90, // 1.5 minutes
  requiredSkills: ['typing', 'hand-eye-coordination'],
  cognitiveLoad: 'low',
  
  helpText: 'Type the displayed text as quickly and accurately as possible. Meet both speed and accuracy targets to succeed.',
  controls: ['Type on keyboard', 'Match the text exactly', 'Maintain accuracy while building speed'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.timeLimit !== 'number' || typeof config.targetWPM !== 'number' || typeof config.minAccuracy !== 'number') {
        return false;
      }
      if (config.timeLimit <= 0 || config.targetWPM <= 0 || config.minAccuracy <= 0 || config.minAccuracy > 100) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.typing) {
      const typingSkill = context.playerStats.skills.typing / 100;
      if (typingSkill >= 0.8) return 'hard';
      if (typingSkill >= 0.6) return 'medium';
      if (typingSkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};