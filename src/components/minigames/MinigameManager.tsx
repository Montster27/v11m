import React, { useState } from 'react';
import MemoryCardGame from './MemoryCardGame';
import WordScrambleGame from './WordScrambleGame';
import ColorMatchGame from './ColorMatchGame';
import StroopTestGame from './StroopTestGame';
import type { MinigameType } from '../../types/storylet';

interface MinigameManagerProps {
  gameId: MinigameType | null;
  onGameComplete: (success: boolean, stats?: any) => void;
  onClose: () => void;
}

const MinigameManager: React.FC<MinigameManagerProps> = ({
  gameId,
  onGameComplete,
  onClose
}) => {
  if (!gameId) return null;

  const renderGame = () => {
    switch (gameId) {
      case 'memory-cards':
        return (
          <MemoryCardGame
            onGameComplete={onGameComplete}
            onClose={onClose}
            difficulty="easy"
          />
        );
      
      case 'pattern-sequence':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-4">Pattern Sequence</h2>
              <p className="mb-4">This minigame is coming soon!</p>
              <button 
                onClick={() => onGameComplete(true, { score: 100 })}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Win (Demo)
              </button>
              <button 
                onClick={() => onGameComplete(false, { score: 0 })}
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
              >
                Lose (Demo)
              </button>
              <button 
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        );
      
      case 'math-quiz':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-4">Math Quiz</h2>
              <p className="mb-4">This minigame is coming soon!</p>
              <button 
                onClick={() => onGameComplete(true, { score: 100 })}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Win (Demo)
              </button>
              <button 
                onClick={() => onGameComplete(false, { score: 0 })}
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
              >
                Lose (Demo)
              </button>
              <button 
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        );
      
      case 'reaction-time':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-4">Reaction Time</h2>
              <p className="mb-4">This minigame is coming soon!</p>
              <button 
                onClick={() => onGameComplete(true, { time: 350 })}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Win (Demo)
              </button>
              <button 
                onClick={() => onGameComplete(false, { time: 1200 })}
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
              >
                Lose (Demo)
              </button>
              <button 
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        );
      
      case 'word-scramble':
        return (
          <WordScrambleGame
            onGameComplete={onGameComplete}
            onClose={onClose}
            difficulty="medium"
          />
        );
      
      case 'logic-puzzle':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-4">Logic Puzzle</h2>
              <p className="mb-4">This minigame is coming soon!</p>
              <button 
                onClick={() => onGameComplete(true, { puzzles: 3 })}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Win (Demo)
              </button>
              <button 
                onClick={() => onGameComplete(false, { puzzles: 1 })}
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
              >
                Lose (Demo)
              </button>
              <button 
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        );
      
      case 'typing-test':
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-4">Typing Test</h2>
              <p className="mb-4">This minigame is coming soon!</p>
              <button 
                onClick={() => onGameComplete(true, { wpm: 65 })}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Win (Demo)
              </button>
              <button 
                onClick={() => onGameComplete(false, { wpm: 25 })}
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
              >
                Lose (Demo)
              </button>
              <button 
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        );
      
      case 'color-match':
        return (
          <ColorMatchGame
            onGameComplete={onGameComplete}
            onClose={onClose}
            difficulty="medium"
          />
        );
      
      case 'stroop-test':
        return (
          <StroopTestGame
            onGameComplete={onGameComplete}
            onClose={onClose}
            difficulty="medium"
          />
        );
      
      default:
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-4">Unknown Game</h2>
              <p className="mb-4">Game type "{gameId}" not found.</p>
              <button 
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        );
    }
  };

  return renderGame();
};

export default MinigameManager;