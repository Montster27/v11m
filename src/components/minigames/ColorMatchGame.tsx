import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../ui';

interface ColorMatchGameProps {
  onGameComplete: (success: boolean, stats: { score: number; matches: number; time: number; accuracy: number }) => void;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface ColorTile {
  id: string;
  color: string;
  colorName: string;
  isTarget: boolean;
  isMatched: boolean;
  isWrong: boolean;
}

const ColorMatchGame: React.FC<ColorMatchGameProps> = ({
  onGameComplete,
  onClose,
  difficulty = 'medium'
}) => {
  const [currentTarget, setCurrentTarget] = useState<string>('');
  const [currentTargetName, setCurrentTargetName] = useState<string>('');
  const [colorTiles, setColorTiles] = useState<ColorTile[]>([]);
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState(0);
  const [misses, setMisses] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [lives, setLives] = useState(3);

  // Game configuration based on difficulty
  const config = {
    easy: { gridSize: 4, targetMatches: 8, timeLimit: 90, colors: 6 },
    medium: { gridSize: 6, targetMatches: 12, timeLimit: 120, colors: 8 },
    hard: { gridSize: 8, targetMatches: 18, timeLimit: 150, colors: 12 }
  }[difficulty];

  // Color palette with names
  const colorPalette = [
    { color: '#FF6B6B', name: 'Red' },
    { color: '#4ECDC4', name: 'Teal' },
    { color: '#45B7D1', name: 'Blue' },
    { color: '#96CEB4', name: 'Green' },
    { color: '#FFEAA7', name: 'Yellow' },
    { color: '#DDA0DD', name: 'Plum' },
    { color: '#FFA07A', name: 'Salmon' },
    { color: '#98D8C8', name: 'Mint' },
    { color: '#FFCCCB', name: 'Pink' },
    { color: '#D3D3D3', name: 'Gray' },
    { color: '#F7DC6F', name: 'Gold' },
    { color: '#BB8FCE', name: 'Purple' },
    { color: '#85C1E9', name: 'Sky Blue' },
    { color: '#F8C471', name: 'Orange' },
    { color: '#82E0AA', name: 'Light Green' }
  ];

  // Generate a new round
  const generateRound = useCallback(() => {
    console.log('🎨 Generating new round:', round);
    
    const availableColors = colorPalette.slice(0, config.colors);
    const targetColorIndex = Math.floor(Math.random() * availableColors.length);
    const targetColor = availableColors[targetColorIndex];
    
    console.log('🎯 Target color:', targetColor);
    
    setCurrentTarget(targetColor.color);
    setCurrentTargetName(targetColor.name);
    
    // Create grid
    const totalTiles = config.gridSize * config.gridSize;
    const tiles: ColorTile[] = [];
    
    // Determine how many target tiles to place (2-4 depending on grid size)
    const minTargets = Math.max(2, Math.floor(totalTiles * 0.15)); // At least 15% of tiles
    const maxTargets = Math.max(3, Math.floor(totalTiles * 0.25)); // At most 25% of tiles
    const targetCount = Math.floor(Math.random() * (maxTargets - minTargets + 1)) + minTargets;
    
    console.log(`🎲 Placing ${targetCount} target tiles out of ${totalTiles} total tiles`);
    
    // Create tiles array with correct target count
    for (let i = 0; i < totalTiles; i++) {
      let isTarget = false;
      let colorToUse;
      
      if (i < targetCount) {
        // First targetCount tiles are targets
        isTarget = true;
        colorToUse = targetColor;
      } else {
        // Remaining tiles are non-targets, ensure they're different colors
        do {
          const randomIndex = Math.floor(Math.random() * availableColors.length);
          colorToUse = availableColors[randomIndex];
        } while (colorToUse.color === targetColor.color); // Ensure it's not the target color
      }
      
      tiles.push({
        id: `tile-${round}-${i}`,
        color: colorToUse.color,
        colorName: colorToUse.name,
        isTarget,
        isMatched: false,
        isWrong: false
      });
    }
    
    // Shuffle the tiles using Fisher-Yates algorithm
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    // Debug logging
    const targetTiles = tiles.filter(t => t.isTarget);
    const nonTargetTiles = tiles.filter(t => !t.isTarget);
    console.log('🎯 Target tiles:', targetTiles.length, targetTiles.map(t => t.colorName));
    console.log('❌ Non-target tiles:', nonTargetTiles.length, [...new Set(nonTargetTiles.map(t => t.colorName))]);
    
    setColorTiles(tiles);
    setFeedback(null);
  }, [config.colors, config.gridSize, round]);

  // Initialize game
  useEffect(() => {
    generateRound();
    setStartTime(Date.now());
  }, []);

  // Handle tile click
  const handleTileClick = (tileId: string) => {
    if (gameStatus !== 'playing') return;
    
    const tile = colorTiles.find(t => t.id === tileId);
    if (!tile || tile.isMatched || tile.isWrong) return;
    
    console.log('🖱️ Clicked tile:', tile.id, 'isTarget:', tile.isTarget, 'color:', tile.colorName);
    
    if (tile.isTarget) {
      // Correct match
      console.log('✅ Correct match!');
      setFeedback('correct');
      setScore(prev => prev + 10);
      setMatches(prev => {
        const newMatches = prev + 1;
        console.log('📊 Total matches now:', newMatches);
        return newMatches;
      });
      
      // Update tile state
      setColorTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, isMatched: true } : t
      ));
      
      // Check if all target tiles in this round are matched
      const remainingTargets = colorTiles.filter(t => t.isTarget && !t.isMatched && t.id !== tileId);
      console.log('🎯 Remaining targets in round:', remainingTargets.length);
      
      if (remainingTargets.length === 0) {
        console.log('🎉 Round complete!');
        
        // Check win condition
        const totalMatches = matches + 1;
        if (totalMatches >= config.targetMatches) {
          console.log('🏆 Game won!');
          setGameStatus('won');
          const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
          const accuracy = totalMatches / (totalMatches + misses) * 100;
          onGameComplete(true, { 
            score: score + 10, 
            matches: totalMatches, 
            time: timeElapsed,
            accuracy 
          });
          return;
        }
        
        // Start next round after delay
        setTimeout(() => {
          setRound(prev => prev + 1);
          // Clear feedback when starting new round
          setFeedback(null);
        }, 1500);
      } else {
        // Clear feedback after short delay for same round
        setTimeout(() => {
          setFeedback(null);
        }, 800);
      }
    } else {
      // Wrong tile
      console.log('❌ Wrong tile clicked!');
      setFeedback('incorrect');
      setMisses(prev => prev + 1);
      setLives(prev => {
        const newLives = prev - 1;
        console.log('💔 Lives remaining:', newLives);
        return newLives;
      });
      
      // Mark tile as wrong
      setColorTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, isWrong: true } : t
      ));
      
      // Check lose condition
      if (lives - 1 <= 0) {
        console.log('💀 Game over - no lives left!');
        setGameStatus('lost');
        const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
        const accuracy = matches / Math.max(1, matches + misses + 1) * 100;
        onGameComplete(false, { 
          score, 
          matches, 
          time: timeElapsed,
          accuracy 
        });
        return;
      }
      
      // Clear wrong indicator and feedback after delay
      setTimeout(() => {
        setColorTiles(prev => prev.map(t => 
          t.id === tileId ? { ...t, isWrong: false } : t
        ));
        setFeedback(null);
      }, 1000);
    }
  };

  // Generate new round when round number changes
  useEffect(() => {
    if (round > 1) {
      console.log('🔄 Round changed to:', round);
      generateRound();
    }
  }, [round, generateRound]);

  // Time tracking
  const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
  const timeRemaining = Math.max(0, config.timeLimit - timeElapsed);

  // Auto-lose when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && gameStatus === 'playing') {
      console.log('⏰ Time up!');
      setGameStatus('lost');
      const accuracy = matches / Math.max(1, matches + misses) * 100;
      onGameComplete(false, { score, matches, time: config.timeLimit, accuracy });
    }
  }, [timeRemaining, gameStatus, score, matches, misses, config.timeLimit, onGameComplete]);

  // Calculate accuracy
  const accuracy = matches + misses > 0 ? (matches / (matches + misses)) * 100 : 100;

  // Count current round targets and their status
  const currentRoundTargets = colorTiles.filter(t => t.isTarget);
  const matchedInRound = currentRoundTargets.filter(t => t.isMatched).length;
  const totalInRound = currentRoundTargets.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-white p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Color Match</h2>
            <p className="text-gray-600">Find all tiles matching the target color!</p>
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
            <div className="font-semibold text-green-800">Total Matches</div>
            <div className="text-lg font-bold text-green-600">{matches}/{config.targetMatches}</div>
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
            <div className="font-semibold text-indigo-800">Round</div>
            <div className="text-lg font-bold text-indigo-600">{round}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <div className="font-semibold text-gray-800">Accuracy</div>
            <div className="text-lg font-bold text-gray-600">{Math.round(accuracy)}%</div>
          </div>
        </div>

        {/* Round Progress */}
        <div className="bg-yellow-50 p-3 rounded-lg mb-6 text-center">
          <div className="text-sm font-semibold text-yellow-800">
            Round {round} Progress: {matchedInRound}/{totalInRound} targets found
          </div>
        </div>

        {/* Target Color Display */}
        <div className="text-center mb-6">
          <div className="text-lg font-semibold text-gray-700 mb-3">Find all tiles matching this color:</div>
          <div className="flex items-center justify-center gap-4">
            <div 
              className="w-16 h-16 rounded-lg border-4 border-gray-300 shadow-lg"
              style={{ backgroundColor: currentTarget }}
            />
            <div className="text-xl font-bold text-gray-900">{currentTargetName}</div>
          </div>
        </div>

        {/* Color Grid */}
        <div 
          className="grid gap-2 mb-6 mx-auto"
          style={{ 
            gridTemplateColumns: `repeat(${config.gridSize}, minmax(0, 1fr))`,
            maxWidth: `${config.gridSize * 60}px`
          }}
        >
          {colorTiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              disabled={gameStatus !== 'playing' || tile.isMatched || tile.isWrong}
              className={`
                w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 transition-all duration-200 transform
                ${tile.isMatched 
                  ? 'border-green-500 scale-110 shadow-lg ring-2 ring-green-300' 
                  : tile.isWrong 
                    ? 'border-red-500 scale-90 shadow-lg ring-2 ring-red-300' 
                    : 'border-gray-300 hover:border-gray-400 hover:scale-105 active:scale-95'
                }
                ${gameStatus !== 'playing' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
              style={{ backgroundColor: tile.color }}
              title={`${tile.colorName} ${tile.isTarget ? '(TARGET)' : '(DECOY)'}`}
            >
              {tile.isMatched && <span className="text-white text-xl drop-shadow-lg">✓</span>}
              {tile.isWrong && <span className="text-white text-xl drop-shadow-lg">✗</span>}
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
              {feedback === 'correct' ? '✅ Correct Match!' : '❌ Wrong Color'}
            </div>
            <div>
              {feedback === 'correct' 
                ? '+10 points' 
                : `That's not ${currentTargetName}. ${lives - 1} lives left.`
              }
            </div>
          </div>
        )}

        {/* Game Over Messages */}
        {gameStatus === 'won' && (
          <div className="bg-green-100 text-green-800 p-6 rounded-lg text-center mb-4">
            <div className="text-2xl font-bold mb-2">🎉 Excellent Color Vision!</div>
            <div className="space-y-1">
              <div>You found all {config.targetMatches} color matches!</div>
              <div>Final Score: {score} points</div>
              <div>Time: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
              <div>Accuracy: {Math.round(accuracy)}%</div>
              <div>Rounds Completed: {round}</div>
            </div>
          </div>
        )}

        {gameStatus === 'lost' && (
          <div className="bg-red-100 text-red-800 p-6 rounded-lg text-center mb-4">
            <div className="text-2xl font-bold mb-2">💔 Game Over</div>
            <div className="space-y-1">
              <div>Color Matches: {matches}/{config.targetMatches}</div>
              <div>Final Score: {score} points</div>
              <div>Accuracy: {Math.round(accuracy)}%</div>
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
              <strong>Instructions:</strong> Click on all tiles that match the target color shown above. 
              Avoid clicking wrong colors or you'll lose a life! Find all {totalInRound} matching tiles in this round.
            </div>
          </div>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div>Debug: Target={currentTargetName}, Targets in round={totalInRound}, Matched={matchedInRound}</div>
            <div>Total game matches: {matches}/{config.targetMatches}</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ColorMatchGame;