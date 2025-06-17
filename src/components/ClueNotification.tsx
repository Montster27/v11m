import React, { useState, useEffect } from 'react';
import { Clue } from '../types/clue';

interface ClueNotificationProps {
  clue: Clue | null;
  onClose: () => void;
  isVisible: boolean;
}

const ClueNotification: React.FC<ClueNotificationProps> = ({ clue, onClose, isVisible }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isVisible && clue) {
      setAnimate(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setAnimate(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, clue, onClose]);

  if (!isVisible || !clue) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-50';
      case 'uncommon': return 'border-blue-400 bg-blue-50';
      case 'rare': return 'border-purple-400 bg-purple-50';
      case 'legendary': return 'border-yellow-400 bg-yellow-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-700';
      case 'uncommon': return 'text-blue-700';
      case 'rare': return 'text-purple-700';
      case 'legendary': return 'text-yellow-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div 
        className={`transition-all duration-300 ease-out transform ${
          animate ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className={`border-l-4 rounded-lg shadow-lg p-4 ${getRarityColor(clue.rarity)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🔍</span>
                <div>
                  <h3 className={`font-semibold ${getRarityTextColor(clue.rarity)}`}>
                    Clue Discovered!
                  </h3>
                  <div className={`text-xs px-2 py-1 rounded inline-block ${
                    clue.rarity === 'common' ? 'bg-gray-200 text-gray-700' :
                    clue.rarity === 'uncommon' ? 'bg-blue-200 text-blue-700' :
                    clue.rarity === 'rare' ? 'bg-purple-200 text-purple-700' :
                    'bg-yellow-200 text-yellow-700'
                  }`}>
                    {clue.rarity.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <h4 className={`font-medium mb-1 ${getRarityTextColor(clue.rarity)}`}>
                {clue.title}
              </h4>
              
              <p className={`text-sm ${getRarityTextColor(clue.rarity)} opacity-80`}>
                {clue.description}
              </p>
              
              {clue.storyArc && (
                <div className="text-xs mt-2 opacity-70">
                  Part of story arc: {clue.storyArc}
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setAnimate(false);
                setTimeout(onClose, 300);
              }}
              className={`ml-2 text-lg hover:opacity-70 ${getRarityTextColor(clue.rarity)}`}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClueNotification;