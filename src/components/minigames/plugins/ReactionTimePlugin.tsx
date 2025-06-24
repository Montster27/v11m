// /Users/montysharma/V11M2/src/components/minigames/plugins/ReactionTimePlugin.tsx
// Reaction Time Game - Test reflexes and response speed

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface ReactionTest {
  id: number;
  type: 'visual' | 'audio' | 'color' | 'direction';
  stimulus: string;
  correctResponse: string;
  startTime: number;
  responseTime?: number;
  correct?: boolean;
}

interface ReactionTimeGameState {
  currentTest: ReactionTest | null;
  testNumber: number;
  phase: 'waiting' | 'ready' | 'stimulus' | 'response' | 'feedback';
  reactionTimes: number[];
  correctResponses: number;
  totalTests: number;
  waitTime: number;
  hasResponded: boolean;
  lastResponseTime: number;
  averageReactionTime: number;
}

const ReactionTimeGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<ReactionTimeGameState>({
    currentTest: null,
    testNumber: 1,
    phase: 'waiting',
    reactionTimes: [],
    correctResponses: 0,
    totalTests: 0,
    waitTime: 0,
    hasResponded: false,
    lastResponseTime: 0,
    averageReactionTime: 0
  });

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { 
        targetTests: 10, 
        timeLimit: 120, 
        testTypes: ['visual'], 
        minWait: 2000, 
        maxWait: 5000 
      };
      case 'medium': return { 
        targetTests: 15, 
        timeLimit: 100, 
        testTypes: ['visual', 'color'], 
        minWait: 1500, 
        maxWait: 4000 
      };
      case 'hard': return { 
        targetTests: 20, 
        timeLimit: 90, 
        testTypes: ['visual', 'color', 'direction'], 
        minWait: 1000, 
        maxWait: 3500 
      };
      case 'expert': return { 
        targetTests: 25, 
        timeLimit: 75, 
        testTypes: ['visual', 'color', 'direction', 'audio'], 
        minWait: 800, 
        maxWait: 3000 
      };
      default: return { 
        targetTests: 15, 
        timeLimit: 100, 
        testTypes: ['visual', 'color'], 
        minWait: 1500, 
        maxWait: 4000 
      };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Generate new reaction test
  const generateTest = useCallback(() => {
    const testTypes = difficultyConfig.testTypes;
    const type = testTypes[Math.floor(Math.random() * testTypes.length)] as 'visual' | 'audio' | 'color' | 'direction';
    
    let stimulus: string;
    let correctResponse: string;
    
    switch (type) {
      case 'visual':
        stimulus = 'GO!';
        correctResponse = 'click';
        break;
      case 'color':
        const colors = ['red', 'green', 'blue', 'yellow'];
        stimulus = colors[Math.floor(Math.random() * colors.length)];
        correctResponse = stimulus;
        break;
      case 'direction':
        const directions = ['←', '→', '↑', '↓'];
        stimulus = directions[Math.floor(Math.random() * directions.length)];
        correctResponse = stimulus;
        break;
      case 'audio':
        stimulus = '♪';
        correctResponse = 'click';
        break;
      default:
        stimulus = 'GO!';
        correctResponse = 'click';
    }
    
    const test: ReactionTest = {
      id: gameSpecificState.testNumber,
      type,
      stimulus,
      correctResponse,
      startTime: 0
    };
    
    setGameSpecificState(prev => ({
      ...prev,
      currentTest: test,
      phase: 'waiting',
      hasResponded: false
    }));
  }, [difficultyConfig.testTypes, gameSpecificState.testNumber]);

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && !gameSpecificState.currentTest) {
      generateTest();
    }
  }, [gameState.isStarted, gameSpecificState.currentTest, generateTest]);

  // Start test sequence
  useEffect(() => {
    if (gameSpecificState.phase === 'waiting') {
      const waitTime = Math.random() * (difficultyConfig.maxWait - difficultyConfig.minWait) + difficultyConfig.minWait;
      
      setGameSpecificState(prev => ({
        ...prev,
        waitTime
      }));

      const timer = setTimeout(() => {
        setGameSpecificState(prev => ({
          ...prev,
          phase: 'ready'
        }));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [gameSpecificState.phase, difficultyConfig.minWait, difficultyConfig.maxWait]);

  // Show stimulus
  useEffect(() => {
    if (gameSpecificState.phase === 'ready') {
      const timer = setTimeout(() => {
        setGameSpecificState(prev => ({
          ...prev,
          phase: 'stimulus',
          currentTest: prev.currentTest ? {
            ...prev.currentTest,
            startTime: Date.now()
          } : null
        }));
      }, gameSpecificState.waitTime);

      return () => clearTimeout(timer);
    }
  }, [gameSpecificState.phase, gameSpecificState.waitTime]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.totalTests >= difficultyConfig.targetTests && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.correctResponses / gameSpecificState.totalTests * 100;
      
      completeGame(true, score, {
        averageReactionTime: gameSpecificState.averageReactionTime,
        accuracy,
        totalTests: gameSpecificState.totalTests,
        fastestTime: Math.min(...gameSpecificState.reactionTimes)
      });
    }
  }, [gameSpecificState.totalTests, difficultyConfig.targetTests, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.totalTests > 0 ? gameSpecificState.correctResponses / gameSpecificState.totalTests * 100 : 0;
      
      completeGame(false, score, {
        averageReactionTime: gameSpecificState.averageReactionTime,
        accuracy,
        totalTests: gameSpecificState.totalTests
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  const calculateScore = (): number => {
    const avgTime = gameSpecificState.averageReactionTime;
    const accuracy = gameSpecificState.correctResponses / Math.max(1, gameSpecificState.totalTests);
    
    // Score based on speed and accuracy
    const speedScore = Math.max(0, 1000 - avgTime); // Better score for faster reactions
    const accuracyScore = accuracy * 500; // Bonus for accuracy
    const completionBonus = gameSpecificState.totalTests >= difficultyConfig.targetTests ? 200 : 0;
    
    return Math.round(speedScore + accuracyScore + completionBonus);
  };

  // Handle user response
  const handleResponse = (response: string) => {
    if (gameSpecificState.phase !== 'stimulus' || 
        gameSpecificState.hasResponded || 
        !gameSpecificState.currentTest || 
        gameState.isPaused || 
        gameState.isCompleted) return;

    const responseTime = Date.now() - gameSpecificState.currentTest.startTime;
    const isCorrect = response === gameSpecificState.currentTest.correctResponse;
    
    incrementAttempts();

    const newReactionTimes = isCorrect ? [...gameSpecificState.reactionTimes, responseTime] : gameSpecificState.reactionTimes;
    const newAverage = newReactionTimes.length > 0 ? 
      newReactionTimes.reduce((sum, time) => sum + time, 0) / newReactionTimes.length : 0;

    setGameSpecificState(prev => ({
      ...prev,
      phase: 'feedback',
      hasResponded: true,
      lastResponseTime: responseTime,
      reactionTimes: newReactionTimes,
      correctResponses: isCorrect ? prev.correctResponses + 1 : prev.correctResponses,
      totalTests: prev.totalTests + 1,
      averageReactionTime: newAverage,
      currentTest: prev.currentTest ? {
        ...prev.currentTest,
        responseTime,
        correct: isCorrect
      } : null
    }));

    // Move to next test
    setTimeout(() => {
      if (gameSpecificState.totalTests + 1 < difficultyConfig.targetTests) {
        setGameSpecificState(prev => ({
          ...prev,
          testNumber: prev.testNumber + 1
        }));
        generateTest();
      }
    }, 2000);
  };

  // Handle early click (before stimulus)
  const handleEarlyClick = () => {
    if (gameSpecificState.phase === 'ready' || gameSpecificState.phase === 'waiting') {
      setGameSpecificState(prev => ({
        ...prev,
        phase: 'feedback',
        hasResponded: true,
        totalTests: prev.totalTests + 1,
        currentTest: prev.currentTest ? {
          ...prev.currentTest,
          correct: false,
          responseTime: -1
        } : null
      }));

      setTimeout(() => {
        if (gameSpecificState.totalTests + 1 < difficultyConfig.targetTests) {
          setGameSpecificState(prev => ({
            ...prev,
            testNumber: prev.testNumber + 1
          }));
          generateTest();
        }
      }, 2000);
    }
  };

  // Keyboard and click handlers
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState.isPaused || gameState.isCompleted) return;

      if (gameSpecificState.phase === 'stimulus' && gameSpecificState.currentTest) {
        switch (gameSpecificState.currentTest.type) {
          case 'direction':
            if (event.key === 'ArrowLeft' && gameSpecificState.currentTest.stimulus === '←') handleResponse('←');
            if (event.key === 'ArrowRight' && gameSpecificState.currentTest.stimulus === '→') handleResponse('→');
            if (event.key === 'ArrowUp' && gameSpecificState.currentTest.stimulus === '↑') handleResponse('↑');
            if (event.key === 'ArrowDown' && gameSpecificState.currentTest.stimulus === '↓') handleResponse('↓');
            break;
          case 'color':
            if (event.key === 'r' && gameSpecificState.currentTest.stimulus === 'red') handleResponse('red');
            if (event.key === 'g' && gameSpecificState.currentTest.stimulus === 'green') handleResponse('green');
            if (event.key === 'b' && gameSpecificState.currentTest.stimulus === 'blue') handleResponse('blue');
            if (event.key === 'y' && gameSpecificState.currentTest.stimulus === 'yellow') handleResponse('yellow');
            break;
          case 'visual':
          case 'audio':
            if (event.key === ' ') handleResponse('click');
            break;
        }
      } else if (gameSpecificState.phase === 'ready' || gameSpecificState.phase === 'waiting') {
        handleEarlyClick();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameSpecificState.phase, gameSpecificState.currentTest, gameState.isPaused, gameState.isCompleted]);

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);
  const accuracy = gameSpecificState.totalTests > 0 ? 
    (gameSpecificState.correctResponses / gameSpecificState.totalTests) * 100 : 100;

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.totalTests >= difficultyConfig.targetTests ? '⚡ Lightning Fast!' : '⏰ Time Up!'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Tests: {gameSpecificState.totalTests}/{difficultyConfig.targetTests}</div>
            <div>Accuracy: {Math.round(accuracy)}%</div>
            <div>Avg Time: {Math.round(gameSpecificState.averageReactionTime)}ms</div>
            {gameSpecificState.reactionTimes.length > 0 && (
              <div>Fastest: {Math.min(...gameSpecificState.reactionTimes)}ms</div>
            )}
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

  const getPhaseDisplay = () => {
    switch (gameSpecificState.phase) {
      case 'waiting':
        return {
          text: 'Get ready...',
          color: 'text-gray-600',
          bg: 'bg-gray-100'
        };
      case 'ready':
        return {
          text: 'Wait for it...',
          color: 'text-orange-600',
          bg: 'bg-orange-100'
        };
      case 'stimulus':
        return {
          text: gameSpecificState.currentTest?.stimulus || '',
          color: gameSpecificState.currentTest?.type === 'color' ? 
            `text-${gameSpecificState.currentTest.stimulus}-600` : 'text-green-600',
          bg: 'bg-green-100'
        };
      case 'feedback':
        return {
          text: gameSpecificState.currentTest?.correct === false && gameSpecificState.currentTest?.responseTime === -1 ? 
            'Too early!' : 
            gameSpecificState.currentTest?.correct ? 
              `${gameSpecificState.lastResponseTime}ms` : 'Incorrect',
          color: gameSpecificState.currentTest?.correct ? 'text-green-600' : 'text-red-600',
          bg: gameSpecificState.currentTest?.correct ? 'bg-green-100' : 'bg-red-100'
        };
      default:
        return {
          text: '',
          color: 'text-gray-600',
          bg: 'bg-gray-100'
        };
    }
  };

  const phaseDisplay = getPhaseDisplay();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Reaction Time Test</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">Test: {gameSpecificState.testNumber}/{difficultyConfig.targetTests}</div>
            <div className="text-sm">Score: {gameState.score}</div>
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
        <div className="p-8">
          {/* Main Display */}
          <div 
            className={`text-center p-16 rounded-lg mb-8 transition-all duration-200 ${phaseDisplay.bg} cursor-pointer`}
            onClick={() => {
              if (gameSpecificState.phase === 'stimulus') {
                handleResponse('click');
              } else {
                handleEarlyClick();
              }
            }}
          >
            <div className={`text-6xl font-bold ${phaseDisplay.color} mb-4`}>
              {phaseDisplay.text}
            </div>
            
            {gameSpecificState.phase === 'stimulus' && gameSpecificState.currentTest?.type === 'direction' && (
              <div className="text-lg text-gray-600">
                Use arrow keys
              </div>
            )}
            
            {gameSpecificState.phase === 'stimulus' && gameSpecificState.currentTest?.type === 'color' && (
              <div className="text-lg text-gray-600">
                Press: R, G, B, or Y
              </div>
            )}
            
            {gameSpecificState.phase === 'waiting' && (
              <div className="text-lg text-gray-600">
                Click or press spacebar when you see the signal
              </div>
            )}
          </div>

          {/* Stats Display */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6 text-center">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">Avg Time</div>
              <div className="text-lg font-bold text-blue-600">
                {gameSpecificState.averageReactionTime > 0 ? Math.round(gameSpecificState.averageReactionTime) : '-'}ms
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-800">Correct</div>
              <div className="text-lg font-bold text-green-600">
                {gameSpecificState.correctResponses}/{gameSpecificState.totalTests}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-800">Best</div>
              <div className="text-lg font-bold text-purple-600">
                {gameSpecificState.reactionTimes.length > 0 ? Math.min(...gameSpecificState.reactionTimes) : '-'}ms
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-gray-600">
            {gameSpecificState.currentTest?.type === 'visual' && 'Click when you see "GO!"'}
            {gameSpecificState.currentTest?.type === 'color' && 'Press the first letter of the color (R, G, B, Y)'}
            {gameSpecificState.currentTest?.type === 'direction' && 'Press the arrow key matching the direction'}
            {gameSpecificState.currentTest?.type === 'audio' && 'Click when you see the music note'}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            React as quickly as possible when you see the stimulus! • Don't click too early or you'll lose points
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const reactionTimePlugin: MinigamePlugin = {
  id: 'reaction-time',
  name: 'Reaction Time Test',
  description: 'Test your reflexes and response speed to various stimuli',
  category: 'reflexes',
  version: '1.0.0',
  
  difficultyConfig: {
    easy: { targetTests: 10, timeLimit: 120, testTypes: ['visual'], minWait: 2000, maxWait: 5000 },
    medium: { targetTests: 15, timeLimit: 100, testTypes: ['visual', 'color'], minWait: 1500, maxWait: 4000 },
    hard: { targetTests: 20, timeLimit: 90, testTypes: ['visual', 'color', 'direction'], minWait: 1000, maxWait: 3500 },
    expert: { targetTests: 25, timeLimit: 75, testTypes: ['visual', 'color', 'direction', 'audio'], minWait: 800, maxWait: 3000 }
  },
  
  defaultDifficulty: 'medium',
  component: ReactionTimeGame,
  
  tags: ['reflexes', 'speed', 'response-time', 'attention'],
  estimatedDuration: 100, // 1.6 minutes
  requiredSkills: ['reaction-speed', 'attention'],
  cognitiveLoad: 'low',
  
  helpText: 'React as quickly as possible when you see the stimulus. Different test types require different responses.',
  controls: ['Spacebar or click for visual/audio tests', 'Arrow keys for direction tests', 'R/G/B/Y keys for color tests'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.targetTests !== 'number' || typeof config.timeLimit !== 'number' || 
          typeof config.minWait !== 'number' || typeof config.maxWait !== 'number') {
        return false;
      }
      if (config.targetTests <= 0 || config.timeLimit <= 0 || config.minWait <= 0 || config.maxWait <= config.minWait) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.['reaction-speed']) {
      const reactionSkill = context.playerStats.skills['reaction-speed'] / 100;
      if (reactionSkill >= 0.8) return 'hard';
      if (reactionSkill >= 0.6) return 'medium';
      if (reactionSkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};