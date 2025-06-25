// /Users/montysharma/V11M2/src/components/StoryletPanel.tsx

import React from 'react';
import { useNarrativeStore } from '../stores/v2';

const StoryletPanel: React.FC = () => {
  // V2 narrative store has different structure - need to adapt
  const storylets = useNarrativeStore((state) => state.storylets);
  const activeStoryletIds = storylets?.active || [];
  
  // For now, create placeholder functions until V2 story methods are implemented
  const chooseStorylet = (storyletId: string, choiceId: string) => {
    console.log('V2 storylet choice not yet implemented', { storyletId, choiceId });
  };
  
  const getCurrentStorylet = () => {
    // V2 stores structure storylets differently
    return null;
  };
  
  const currentStorylet = getCurrentStorylet();
  
  // If no active storylets, show placeholder
  if (!currentStorylet || activeStoryletIds.length === 0) {
    return (
      <div className="bg-white border-l-4 border-gray-400 rounded-md p-6 shadow">
        <h2 className="text-xl font-semibold mb-2 text-gray-600">No Current Event</h2>
        <p className="text-gray-500">
          Keep progressing through your daily activities. New storylets will become available as you meet their requirements.
        </p>
      </div>
    );
  }
  
  const handleChoiceClick = (choiceId: string) => {
    chooseStorylet(currentStorylet.id, choiceId);
  };
  
  return (
    <div className="bg-white border-l-4 border-green-400 rounded-md p-6 shadow">
      <h2 className="text-xl font-semibold mb-2 text-gray-800">
        {currentStorylet.name}
      </h2>
      <p className="text-gray-700 mb-4 leading-relaxed">
        {currentStorylet.description}
      </p>
      
      <div className="space-y-3">
        {currentStorylet.choices.map((choice) => (
          <button
            key={choice.id}
            className="w-full bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded hover:bg-green-100 transition-colors duration-200 text-left"
            onClick={() => handleChoiceClick(choice.id)}
          >
            <div className="font-medium">{choice.text}</div>
            {choice.effects.length > 0 && (
              <div className="text-xs text-green-600 mt-1">
                Effects: {choice.effects.map((effect, index) => {
                  let effectText = '';
                  switch (effect.type) {
                    case 'resource':
                      const sign = effect.delta > 0 ? '+' : '';
                      effectText = `${sign}${effect.delta} ${effect.key}`;
                      break;
                    case 'skillXp':
                      effectText = `+${effect.amount} XP ${effect.key}`;
                      break;
                    case 'flag':
                      effectText = `Set ${effect.key}`;
                      break;
                    case 'unlock':
                      effectText = `Unlock storylet`;
                      break;
                    case 'minigame':
                      effectText = `Play ${effect.gameId.replace('-', ' ')}`;
                      break;
                  }
                  return effectText;
                }).join(', ')}
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-xs text-gray-400 border-t pt-2">
          <div>Storylet ID: {currentStorylet.id}</div>
          <div>Active storylets: {activeStoryletIds.length}</div>
        </div>
      )}
    </div>
  );
};

export default StoryletPanel;
