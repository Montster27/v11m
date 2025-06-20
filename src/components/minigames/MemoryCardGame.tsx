import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '../ui';

interface MemoryCard {
  id: string;
  imageId: string;
  isRevealed: boolean;
  isMatched: boolean;
}

interface MemoryCardGameProps {
  onGameComplete: (success: boolean, stats: { moves: number; time: number }) => void;
  onClose: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const MemoryCardGame: React.FC<MemoryCardGameProps> = ({
  onGameComplete,
  onClose,
  difficulty = 'easy'
}) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isChecking, setIsChecking] = useState(false);

  // Available images for the memory game
  const availableImages = [
    'cassette.png',
    'coffee_mug.png',
    'flyer.png',
    'id_card.png',
    'lava_lamp.png',
    'notebook.png',
    'socks.png',
    'walkman.png',
    'beer.png',
    'rock_band.png',
    'Girl_hair.png',
    'police.png',
    'blondie.png',
    'Clash.png',
    'VHS.png',
    'milk_crate.png',
    'c64.png'
  ];

  // Get grid size and pairs based on difficulty
  const getGameConfig = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { rows: 3, cols: 4, pairs: 6 };
      case 'medium':
        return { rows: 4, cols: 4, pairs: 8 };
      case 'hard':
        return { rows: 4, cols: 5, pairs: 10 };
      default:
        return { rows: 3, cols: 4, pairs: 6 };
    }
  };

  // Shuffle array utility
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize game
  const initializeGame = useCallback(() => {
    const config = getGameConfig(difficulty);
    const selectedImages = shuffleArray(availableImages).slice(0, config.pairs);
    
    // Create pairs
    const gameCards: MemoryCard[] = [];
    selectedImages.forEach((image, index) => {
      // First card of the pair
      gameCards.push({
        id: `${index}-a`,
        imageId: image,
        isRevealed: false,
        isMatched: false
      });
      // Second card of the pair
      gameCards.push({
        id: `${index}-b`,
        imageId: image,
        isRevealed: false,
        isMatched: false
      });
    });

    // Shuffle the cards
    const shuffledCards = shuffleArray(gameCards);
    setCards(shuffledCards);
    setSelectedCards([]);
    setMatches([]);
    setMoves(0);
    setStartTime(Date.now());
    setGameStatus('playing');
  }, [difficulty]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Handle card click
  const handleCardClick = (cardId: string) => {
    if (isChecking || selectedCards.length >= 2) return;
    if (selectedCards.includes(cardId)) return;
    if (matches.includes(cardId)) return;

    const newSelectedCards = [...selectedCards, cardId];
    setSelectedCards(newSelectedCards);

    // Update card visibility
    setCards(prevCards =>
      prevCards.map(card =>
        card.id === cardId ? { ...card, isRevealed: true } : card
      )
    );

    // Check for match if two cards are selected
    if (newSelectedCards.length === 2) {
      setIsChecking(true);
      setMoves(prev => prev + 1);

      const [firstCardId, secondCardId] = newSelectedCards;
      const firstCard = cards.find(c => c.id === firstCardId);
      const secondCard = cards.find(c => c.id === secondCardId);

      setTimeout(() => {
        if (firstCard && secondCard && firstCard.imageId === secondCard.imageId) {
          // Match found
          const newMatches = [...matches, firstCardId, secondCardId];
          setMatches(newMatches);
          
          // Mark cards as matched
          setCards(prevCards =>
            prevCards.map(card =>
              newMatches.includes(card.id) ? { ...card, isMatched: true } : card
            )
          );

          // Check for win condition
          if (newMatches.length === cards.length) {
            setGameStatus('won');
            const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
            onGameComplete(true, { moves: moves + 1, time: timeElapsed });
          }
        } else {
          // No match - hide cards
          setCards(prevCards =>
            prevCards.map(card =>
              newSelectedCards.includes(card.id) ? { ...card, isRevealed: false } : card
            )
          );
        }
        
        setSelectedCards([]);
        setIsChecking(false);
      }, 1000);
    }
  };

  const config = getGameConfig(difficulty);
  const timeElapsed = Math.floor((Date.now() - startTime) / 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-white p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Memory Card Game</h2>
            <p className="text-gray-600">Match all pairs to win!</p>
          </div>
          <Button onClick={onClose} variant="outline">
            ✕ Close
          </Button>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center mb-6 text-sm text-gray-600">
          <div>Difficulty: <span className="font-semibold capitalize">{difficulty}</span></div>
          <div>Moves: <span className="font-semibold">{moves}</span></div>
          <div>Time: <span className="font-semibold">{timeElapsed}s</span></div>
          <div>Matched: <span className="font-semibold">{matches.length / 2}/{config.pairs}</span></div>
        </div>

        {/* Game Board */}
        <div 
          className="grid gap-3 mx-auto justify-center"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, 80px)`,
            gridTemplateRows: `repeat(${config.rows}, 80px)`
          }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className={`
                relative w-20 h-20 cursor-pointer rounded-lg shadow-md transition-all duration-300
                ${card.isRevealed || card.isMatched ? 'transform-none' : 'hover:scale-105'}
                ${card.isMatched ? 'ring-2 ring-green-400' : ''}
              `}
              onClick={() => handleCardClick(card.id)}
            >
              {/* Card Back */}
              <div
                className={`
                  absolute inset-0 bg-blue-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold
                  transition-transform duration-300 backface-hidden
                  ${card.isRevealed || card.isMatched ? 'transform rotate-y-180' : ''}
                `}
              >
                ?
              </div>

              {/* Card Front */}
              <div
                className={`
                  absolute inset-0 bg-white rounded-lg p-2 flex items-center justify-center
                  transition-transform duration-300 backface-hidden transform rotate-y-180
                  ${card.isRevealed || card.isMatched ? 'transform rotate-y-0' : ''}
                `}
              >
                <img
                  src={`/images/memory-game/${card.imageId}`}
                  alt={card.imageId.replace('.png', '').replace(/_/g, ' ')}
                  className="w-full h-full object-contain"
                  onLoad={() => {
                    console.log(`✅ Image loaded: ${card.imageId}`);
                  }}
                  onError={(e) => {
                    console.error(`❌ Image failed to load: ${card.imageId}`);
                    console.error('Full path:', `/images/memory-game/${card.imageId}`);
                    // Simple fallback - just hide the broken image
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Game Over Message */}
        {gameStatus === 'won' && (
          <div className="mt-6 text-center">
            <div className="bg-green-100 text-green-800 p-4 rounded-lg">
              <h3 className="text-lg font-bold">Congratulations!</h3>
              <p>You won in {moves} moves and {timeElapsed} seconds!</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-6 flex justify-center space-x-4">
          <Button onClick={initializeGame} variant="outline">
            New Game
          </Button>
          {gameStatus === 'won' && (
            <Button onClick={onClose} variant="primary">
              Continue
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MemoryCardGame;