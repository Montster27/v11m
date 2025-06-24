// /Users/montysharma/V11M2/src/components/minigames/plugins/LogicPuzzlePlugin.tsx
// Logic Puzzle Game - Solve deductive reasoning puzzles

import React, { useState, useEffect, useCallback } from 'react';
import { MinigamePlugin, MinigameProps } from '../core/types';
import { useBaseMinigameState } from './BaseMinigamePlugin';

interface LogicClue {
  text: string;
  type: 'positive' | 'negative' | 'conditional';
}

interface LogicPuzzle {
  id: number;
  title: string;
  categories: string[];
  items: string[][];
  solution: Record<string, string>;
  clues: LogicClue[];
  difficulty: number;
}

interface LogicPuzzleGameState {
  currentPuzzle: LogicPuzzle | null;
  puzzleNumber: number;
  userSolution: Record<string, string>;
  selectedCell: { category: string; item: string } | null;
  completedPuzzles: number;
  hintsUsed: number;
  feedback: 'correct' | 'incorrect' | 'partial' | null;
  showSolution: boolean;
}

const LogicPuzzleGame: React.FC<MinigameProps> = (props) => {
  const { gameState, completeGame, incrementAttempts, getElapsedTime } = useBaseMinigameState(props);
  
  const [gameSpecificState, setGameSpecificState] = useState<LogicPuzzleGameState>({
    currentPuzzle: null,
    puzzleNumber: 1,
    userSolution: {},
    selectedCell: null,
    completedPuzzles: 0,
    hintsUsed: 0,
    feedback: null,
    showSolution: false
  });

  // Difficulty configuration
  const getDifficultyConfig = () => {
    switch (props.difficulty) {
      case 'easy': return { 
        targetPuzzles: 3, 
        timeLimit: 300, 
        maxCategories: 3, 
        maxItems: 3,
        allowHints: true 
      };
      case 'medium': return { 
        targetPuzzles: 4, 
        timeLimit: 360, 
        maxCategories: 4, 
        maxItems: 4,
        allowHints: true 
      };
      case 'hard': return { 
        targetPuzzles: 5, 
        timeLimit: 420, 
        maxCategories: 4, 
        maxItems: 5,
        allowHints: false 
      };
      case 'expert': return { 
        targetPuzzles: 6, 
        timeLimit: 480, 
        maxCategories: 5, 
        maxItems: 5,
        allowHints: false 
      };
      default: return { 
        targetPuzzles: 4, 
        timeLimit: 360, 
        maxCategories: 4, 
        maxItems: 4,
        allowHints: true 
      };
    }
  };

  const difficultyConfig = getDifficultyConfig();

  // Generate logic puzzle
  const generatePuzzle = useCallback(() => {
    const puzzleTemplates = [
      {
        title: "Pet Owners",
        categories: ["Owner", "Pet", "Color"],
        items: [
          ["Alice", "Bob", "Carol"],
          ["Cat", "Dog", "Bird"],
          ["Red", "Blue", "Green"]
        ]
      },
      {
        title: "Sports Teams",
        categories: ["Player", "Sport", "Team", "City"],
        items: [
          ["John", "Mike", "Sarah", "Lisa"],
          ["Soccer", "Tennis", "Basketball", "Swimming"],
          ["Tigers", "Eagles", "Lions", "Bears"],
          ["New York", "Boston", "Chicago", "Miami"]
        ]
      },
      {
        title: "Food Preferences",
        categories: ["Person", "Food", "Drink", "Day"],
        items: [
          ["Emma", "David", "Grace", "Tom"],
          ["Pizza", "Salad", "Burger", "Pasta"],
          ["Coffee", "Tea", "Juice", "Water"],
          ["Monday", "Tuesday", "Wednesday", "Thursday"]
        ]
      },
      {
        title: "Book Club",
        categories: ["Reader", "Genre", "Author", "Month"],
        items: [
          ["Alex", "Beth", "Chris", "Dana", "Eve"],
          ["Mystery", "Romance", "Sci-Fi", "Fantasy", "Biography"],
          ["Smith", "Jones", "Brown", "Wilson", "Taylor"],
          ["January", "March", "May", "July", "September"]
        ]
      }
    ];

    const template = puzzleTemplates[Math.min(gameSpecificState.puzzleNumber - 1, puzzleTemplates.length - 1)];
    const numItems = Math.min(difficultyConfig.maxItems, template.items[0].length);
    const numCategories = Math.min(difficultyConfig.maxCategories, template.categories.length);

    // Create puzzle with limited items/categories based on difficulty
    const categories = template.categories.slice(0, numCategories);
    const items = template.items.slice(0, numCategories).map(category => category.slice(0, numItems));

    // Generate solution by creating random valid assignments
    const solution: Record<string, string> = {};
    const usedItems: Record<string, Set<string>> = {};
    categories.forEach(cat => usedItems[cat] = new Set());

    // Start with first category and assign each item to a different item in other categories
    for (let i = 0; i < numItems; i++) {
      const baseItem = items[0][i];
      
      for (let catIndex = 1; catIndex < categories.length; catIndex++) {
        const category = categories[catIndex];
        const availableItems = items[catIndex].filter(item => !usedItems[category].has(item));
        
        if (availableItems.length > 0) {
          const assignedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
          solution[`${baseItem}-${category}`] = assignedItem;
          usedItems[category].add(assignedItem);
        }
      }
    }

    // Generate clues based on solution
    const clues: LogicClue[] = [];
    const connections = Object.entries(solution);
    
    // Add some direct positive clues
    for (let i = 0; i < Math.min(3, connections.length); i++) {
      const [key, value] = connections[i];
      const [person, category] = key.split('-');
      clues.push({
        text: `${person} has ${value.toLowerCase()}.`,
        type: 'positive'
      });
    }

    // Add some negative clues
    for (let i = 0; i < 2; i++) {
      const randomConnection = connections[Math.floor(Math.random() * connections.length)];
      const [key, correctValue] = randomConnection;
      const [person, category] = key.split('-');
      const categoryItems = items[categories.indexOf(category)];
      const wrongValues = categoryItems.filter(item => item !== correctValue);
      
      if (wrongValues.length > 0) {
        const wrongValue = wrongValues[Math.floor(Math.random() * wrongValues.length)];
        clues.push({
          text: `${person} does not have ${wrongValue.toLowerCase()}.`,
          type: 'negative'
        });
      }
    }

    // Add conditional clues
    if (connections.length >= 2) {
      const [key1, value1] = connections[0];
      const [key2, value2] = connections[1];
      const [person1] = key1.split('-');
      const [person2] = key2.split('-');
      
      if (person1 !== person2) {
        clues.push({
          text: `If ${person1} has ${value1.toLowerCase()}, then ${person2} has ${value2.toLowerCase()}.`,
          type: 'conditional'
        });
      }
    }

    const puzzle: LogicPuzzle = {
      id: gameSpecificState.puzzleNumber,
      title: template.title,
      categories,
      items,
      solution,
      clues,
      difficulty: numItems * numCategories
    };

    setGameSpecificState(prev => ({
      ...prev,
      currentPuzzle: puzzle,
      userSolution: {},
      selectedCell: null,
      feedback: null,
      showSolution: false
    }));
  }, [gameSpecificState.puzzleNumber, difficultyConfig]);

  // Initialize game
  useEffect(() => {
    if (gameState.isStarted && !gameSpecificState.currentPuzzle) {
      generatePuzzle();
    }
  }, [gameState.isStarted, gameSpecificState.currentPuzzle, generatePuzzle]);

  // Check for game completion
  useEffect(() => {
    if (gameSpecificState.completedPuzzles >= difficultyConfig.targetPuzzles && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.completedPuzzles / gameSpecificState.puzzleNumber;
      
      completeGame(true, score, {
        puzzlesCompleted: gameSpecificState.completedPuzzles,
        accuracy,
        hintsUsed: gameSpecificState.hintsUsed
      });
    }
  }, [gameSpecificState.completedPuzzles, difficultyConfig.targetPuzzles, gameState.isCompleted]);

  // Time limit check
  useEffect(() => {
    if (getElapsedTime() > difficultyConfig.timeLimit * 1000 && !gameState.isCompleted) {
      const score = calculateScore();
      const accuracy = gameSpecificState.completedPuzzles / Math.max(1, gameSpecificState.puzzleNumber);
      
      completeGame(false, score, {
        puzzlesCompleted: gameSpecificState.completedPuzzles,
        accuracy,
        hintsUsed: gameSpecificState.hintsUsed
      });
    }
  }, [getElapsedTime(), difficultyConfig.timeLimit, gameState.isCompleted]);

  const calculateScore = (): number => {
    const baseScore = gameSpecificState.completedPuzzles * 200;
    const timeBonus = Math.max(0, difficultyConfig.timeLimit - Math.floor(getElapsedTime() / 1000)) * 2;
    const hintPenalty = gameSpecificState.hintsUsed * 50;
    
    return Math.max(0, baseScore + timeBonus - hintPenalty);
  };

  // Handle cell assignment
  const handleCellClick = (person: string, category: string) => {
    if (!gameSpecificState.currentPuzzle || gameState.isPaused || gameState.isCompleted) return;

    const key = `${person}-${category}`;
    setGameSpecificState(prev => ({
      ...prev,
      selectedCell: { category, item: person }
    }));
  };

  // Handle value assignment
  const handleValueSelect = (value: string) => {
    if (!gameSpecificState.selectedCell || !gameSpecificState.currentPuzzle) return;

    const { category, item: person } = gameSpecificState.selectedCell;
    const key = `${person}-${category}`;
    
    setGameSpecificState(prev => ({
      ...prev,
      userSolution: {
        ...prev.userSolution,
        [key]: value
      },
      selectedCell: null
    }));
  };

  // Check solution
  const checkSolution = () => {
    if (!gameSpecificState.currentPuzzle) return;

    incrementAttempts();
    const { solution } = gameSpecificState.currentPuzzle;
    const userSol = gameSpecificState.userSolution;
    
    const totalConnections = Object.keys(solution).length;
    let correctConnections = 0;
    
    for (const [key, value] of Object.entries(solution)) {
      if (userSol[key] === value) {
        correctConnections++;
      }
    }
    
    const isComplete = correctConnections === totalConnections;
    const isPartial = correctConnections > 0 && correctConnections < totalConnections;
    
    if (isComplete) {
      setGameSpecificState(prev => ({
        ...prev,
        feedback: 'correct',
        completedPuzzles: prev.completedPuzzles + 1
      }));
      
      // Move to next puzzle
      setTimeout(() => {
        if (gameSpecificState.completedPuzzles + 1 < difficultyConfig.targetPuzzles) {
          setGameSpecificState(prev => ({
            ...prev,
            puzzleNumber: prev.puzzleNumber + 1
          }));
          generatePuzzle();
        }
      }, 2000);
    } else {
      setGameSpecificState(prev => ({
        ...prev,
        feedback: isPartial ? 'partial' : 'incorrect'
      }));
      
      setTimeout(() => {
        setGameSpecificState(prev => ({ ...prev, feedback: null }));
      }, 3000);
    }
  };

  // Show hint
  const showHint = () => {
    if (!gameSpecificState.currentPuzzle || !difficultyConfig.allowHints) return;

    const unsolvedConnections = Object.entries(gameSpecificState.currentPuzzle.solution)
      .filter(([key]) => !gameSpecificState.userSolution[key]);
    
    if (unsolvedConnections.length > 0) {
      const [key, value] = unsolvedConnections[0];
      setGameSpecificState(prev => ({
        ...prev,
        userSolution: {
          ...prev.userSolution,
          [key]: value
        },
        hintsUsed: prev.hintsUsed + 1
      }));
    }
  };

  const timeElapsed = Math.floor(getElapsedTime() / 1000);
  const timeRemaining = Math.max(0, difficultyConfig.timeLimit - timeElapsed);

  if (!gameSpecificState.currentPuzzle) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-center">Loading puzzle...</div>
        </div>
      </div>
    );
  }

  if (gameState.isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg max-w-md mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {gameSpecificState.completedPuzzles >= difficultyConfig.targetPuzzles ? '🧩 Logic Master!' : '⏰ Time Up!'}
          </h2>
          <div className="space-y-2 text-lg">
            <div>Score: {gameState.score}</div>
            <div>Puzzles: {gameSpecificState.completedPuzzles}/{difficultyConfig.targetPuzzles}</div>
            <div>Time: {timeElapsed}s</div>
            <div>Hints: {gameSpecificState.hintsUsed}</div>
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
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">Logic Puzzle: {gameSpecificState.currentPuzzle.title}</h3>
            <div className="text-sm text-gray-600">
              Difficulty: <span className="capitalize font-medium">{props.difficulty}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">Time: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <div className="text-sm">Puzzle: {gameSpecificState.puzzleNumber}</div>
            <div className="text-sm">Score: {gameState.score}</div>
            <div className="text-sm">Completed: {gameSpecificState.completedPuzzles}/{difficultyConfig.targetPuzzles}</div>
          </div>
          
          <button
            onClick={props.onClose}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Game Area */}
        <div className="p-6 flex gap-6">
          {/* Clues Panel */}
          <div className="w-1/3">
            <h4 className="font-semibold text-gray-900 mb-4">Clues:</h4>
            <div className="space-y-3">
              {gameSpecificState.currentPuzzle.clues.map((clue, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    clue.type === 'positive' ? 'bg-green-50 text-green-800' :
                    clue.type === 'negative' ? 'bg-red-50 text-red-800' :
                    'bg-blue-50 text-blue-800'
                  }`}
                >
                  {clue.text}
                </div>
              ))}
            </div>
            
            {/* Controls */}
            <div className="mt-6 space-y-3">
              <button
                onClick={checkSolution}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                disabled={Object.keys(gameSpecificState.userSolution).length === 0}
              >
                Check Solution
              </button>
              
              {difficultyConfig.allowHints && (
                <button
                  onClick={showHint}
                  className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Show Hint (-50 pts)
                </button>
              )}
              
              <button
                onClick={() => setGameSpecificState(prev => ({ ...prev, showSolution: !prev.showSolution }))}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                {gameSpecificState.showSolution ? 'Hide' : 'Show'} Solution
              </button>
            </div>
          </div>

          {/* Logic Grid */}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-4">Logic Grid:</h4>
            
            {/* Category Headers */}
            <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `200px repeat(${gameSpecificState.currentPuzzle.categories.length - 1}, 1fr)` }}>
              <div></div>
              {gameSpecificState.currentPuzzle.categories.slice(1).map(category => (
                <div key={category} className="text-center font-semibold text-gray-700 p-2">
                  {category}
                </div>
              ))}
            </div>

            {/* Grid Rows */}
            {gameSpecificState.currentPuzzle.items[0].map(person => (
              <div key={person} className="grid gap-2 mb-2" style={{ gridTemplateColumns: `200px repeat(${gameSpecificState.currentPuzzle.categories.length - 1}, 1fr)` }}>
                <div className="font-semibold text-gray-700 p-2 bg-gray-50 rounded">
                  {person}
                </div>
                
                {gameSpecificState.currentPuzzle.categories.slice(1).map((category, catIndex) => {
                  const key = `${person}-${category}`;
                  const assignedValue = gameSpecificState.userSolution[key];
                  const correctValue = gameSpecificState.showSolution ? gameSpecificState.currentPuzzle.solution[key] : null;
                  
                  return (
                    <div key={category} className="relative">
                      <button
                        onClick={() => handleCellClick(person, category)}
                        className={`w-full p-2 border-2 rounded transition-all ${
                          gameSpecificState.selectedCell?.category === category && gameSpecificState.selectedCell?.item === person
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {correctValue && gameSpecificState.showSolution ? (
                          <span className="text-green-600 font-bold">{correctValue}</span>
                        ) : assignedValue ? (
                          <span className={assignedValue === correctValue ? 'text-green-600' : 'text-black'}>
                            {assignedValue}
                          </span>
                        ) : (
                          <span className="text-gray-400">?</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Value Selection */}
            {gameSpecificState.selectedCell && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold mb-3">
                  Select {gameSpecificState.selectedCell.category} for {gameSpecificState.selectedCell.item}:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {gameSpecificState.currentPuzzle.items[
                    gameSpecificState.currentPuzzle.categories.indexOf(gameSpecificState.selectedCell.category)
                  ].map(value => (
                    <button
                      key={value}
                      onClick={() => handleValueSelect(value)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {value}
                    </button>
                  ))}
                  <button
                    onClick={() => handleValueSelect('')}
                    className="px-3 py-1 bg-red-100 border border-red-300 text-red-700 rounded hover:bg-red-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        {gameSpecificState.feedback && (
          <div className={`mx-6 mb-6 p-4 rounded-lg text-center ${
            gameSpecificState.feedback === 'correct' ? 'bg-green-100 text-green-800' :
            gameSpecificState.feedback === 'partial' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            <div className="text-xl font-bold">
              {gameSpecificState.feedback === 'correct' ? '🎉 Puzzle Solved!' :
               gameSpecificState.feedback === 'partial' ? '🤔 Partially Correct' :
               '❌ Not Quite Right'}
            </div>
            <div>
              {gameSpecificState.feedback === 'correct' ? 'Great job! Moving to next puzzle...' :
               gameSpecificState.feedback === 'partial' ? 'Some connections are correct. Keep trying!' :
               'Check your logic and try again.'}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-600 text-center">
            Use the clues to deduce the correct relationships between people and their attributes • Click cells to assign values
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin configuration
export const logicPuzzlePlugin: MinigamePlugin = {
  id: 'logic-puzzle',
  name: 'Logic Puzzle',
  description: 'Solve deductive reasoning puzzles using clues',
  category: 'logic',
  version: '1.0.0',
  
  difficultyConfig: {
    easy: { targetPuzzles: 3, timeLimit: 300, maxCategories: 3, maxItems: 3, allowHints: true },
    medium: { targetPuzzles: 4, timeLimit: 360, maxCategories: 4, maxItems: 4, allowHints: true },
    hard: { targetPuzzles: 5, timeLimit: 420, maxCategories: 4, maxItems: 5, allowHints: false },
    expert: { targetPuzzles: 6, timeLimit: 480, maxCategories: 5, maxItems: 5, allowHints: false }
  },
  
  defaultDifficulty: 'medium',
  component: LogicPuzzleGame,
  
  tags: ['logic', 'deduction', 'reasoning', 'puzzle'],
  estimatedDuration: 360, // 6 minutes
  requiredSkills: ['logical-reasoning', 'deduction'],
  cognitiveLoad: 'high',
  
  helpText: 'Use the clues to figure out which person has which attributes. Click on grid cells to assign values.',
  controls: ['Click grid cells to select', 'Choose values from the selection menu', 'Use hints if available'],
  
  validateConfig: (plugin) => {
    // Validate that required difficulty configs have necessary properties
    const requiredLevels = ['easy', 'medium', 'hard'];
    for (const level of requiredLevels) {
      const config = plugin.difficultyConfig[level];
      if (!config || typeof config.targetPuzzles !== 'number' || typeof config.timeLimit !== 'number' || 
          typeof config.maxCategories !== 'number' || typeof config.maxItems !== 'number') {
        return false;
      }
      if (config.targetPuzzles <= 0 || config.timeLimit <= 0 || config.maxCategories <= 0 || config.maxItems <= 0) {
        return false;
      }
    }
    return true;
  },
  
  calculateDifficulty: (context) => {
    if (context.playerStats?.skills?.['logical-reasoning']) {
      const logicSkill = context.playerStats.skills['logical-reasoning'] / 100;
      if (logicSkill >= 0.8) return 'hard';
      if (logicSkill >= 0.6) return 'medium';
      if (logicSkill <= 0.3) return 'easy';
    }
    return 'medium';
  }
};