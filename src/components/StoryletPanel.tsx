// /Users/montysharma/V11M2/src/components/StoryletPanel.tsx

import React, { useMemo } from 'react';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';
import { useSaveStoreV2 } from '../store/useSaveStoreV2';
import { useAppStore } from '../store/useAppStore';
import { useCoreGameStore } from '../stores/v2';
import type { Storylet, Effect } from '../types/storylet';

const StoryletPanel: React.FC = () => {
  // V2 Store access
  const { 
    storylets: { active: activeStoryletIds },
    completeStorylet,
    setCooldown,
    unlockStorylet
  } = useNarrativeStore();
  
  const { 
    allStorylets,
    getStorylet 
  } = useStoryletCatalogStore();
  
  // Save and app store access via hooks
  const { recordStoryletCompletion } = useSaveStoreV2();
  const { day, updateResource, resources, addSkillXp } = useAppStore();
  const { player } = useCoreGameStore();
  
  // Get current storylet (first active one)
  const currentStorylet = useMemo(() => {
    if (activeStoryletIds.length === 0) return null;
    return getStorylet(activeStoryletIds[0]) || null;
  }, [activeStoryletIds, getStorylet]);
  
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
  
  // V2 Implementation of storylet choice handling
  const handleChoiceClick = (choiceId: string) => {
    if (!currentStorylet) return;
    
    const choice = currentStorylet.choices.find(c => c.id === choiceId);
    if (!choice) {
      console.error('Choice not found:', choiceId);
      return;
    }
    
    console.log(`🎭 V2 StoryletChoice: ${currentStorylet.name} → ${choice.text}`);
    
    // Record storylet completion in V2 save system
    try {
      recordStoryletCompletion(currentStorylet.id, choiceId, choice);
    } catch (error) {
      console.warn('Could not record storylet completion:', error);
    }
    
    // Apply all effects (V2 version will need to be implemented)
    choice.effects.forEach((effect) => {
      applyEffectV2(effect, { storyletId: currentStorylet.id, choiceId });
    });
    
    // Mark storylet as completed in V2 narrative store
    completeStorylet(currentStorylet.id);
    
    // Set cooldown for resource-based storylets (3 days)
    if (currentStorylet.trigger.type === 'resource') {
      try {
        setCooldown(currentStorylet.id, day + 3);
      } catch (error) {
        console.warn('Could not set cooldown:', error);
      }
    }
    
    // If choice has nextStoryletId, unlock it immediately
    if (choice.nextStoryletId) {
      unlockStorylet(choice.nextStoryletId);
    }
  };
  
  // V2 Effect application (simplified version for now)
  const applyEffectV2 = (effect: Effect, context?: { storyletId?: string; choiceId?: string }) => {
    console.log(`⚙️ V2 Applying effect:`, effect);
    
    switch (effect.type) {
      case 'resource':
        try {
          const currentValue = resources[effect.key] || 0;
          const newValue = effect.key === 'energy' || effect.key === 'stress'
            ? Math.max(0, Math.min(100, currentValue + effect.delta))
            : Math.max(0, currentValue + effect.delta);
          updateResource(effect.key as keyof typeof resources, newValue);
        } catch (error) {
          console.warn('Could not update resource:', error);
        }
        break;
        
      case 'flag':
        // Use V2 narrative store flag system
        useNarrativeStore.getState().setStoryletFlag(effect.key, effect.value);
        break;
        
      case 'skillXp':
        try {
          // Use V1 skill system via proper hook
          addSkillXp(effect.key, effect.amount, 'Storylet');
        } catch (error) {
          console.warn('Could not add skill XP:', error);
        }
        break;
        
      case 'unlock':
        unlockStorylet(effect.storyletId);
        break;
        
      // Add other effect types as needed
      default:
        console.warn(`V2 Effect type ${effect.type} not yet implemented`);
    }
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
