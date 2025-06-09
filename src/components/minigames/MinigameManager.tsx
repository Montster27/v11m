import React, { useState } from 'react';
import MemoryCardGame from './MemoryCardGame';
import WordScrambleGame from './WordScrambleGame';
import ColorMatchGame from './ColorMatchGame';
import StroopTestGame from './StroopTestGame';
import ErrorBoundary from '../ErrorBoundary';
import { Button, Card } from '../ui';
import type { MinigameType } from '../../types/storylet';

interface MinigameManagerProps {
  gameId: MinigameType | null;
  onGameComplete: (success: boolean, stats?: any) => void;
  onClose: () => void;
}

// Error fallback for minigames
const MinigameErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <Card className="p-6 max-w-md m-4 border-red-200 bg-red-50">
      <div className="text-center space-y-4">
        <div className="text-red-600">
          <h2 className="text-lg font-semibold">Minigame Error</h2>
          <p className="text-sm mt-2">
            The minigame encountered an error and cannot continue.
          </p>
        </div>
        
        <div className="flex justify-center space-x-3">
          <Button onClick={retry} variant="primary">
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Reload Game
          </Button>
        </div>
      </div>
    </Card>
  </div>
);

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

  return (
    <ErrorBoundary fallback={MinigameErrorFallback}>
      {renderGame()}
    </ErrorBoundary>
  );
};

export default MinigameManager;