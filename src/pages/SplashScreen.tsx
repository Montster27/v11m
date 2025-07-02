import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoreGameStore, useSocialStore } from '../stores/v2';
import { resetAllGameState } from '../utils/characterFlowIntegration';
import { Button } from '../components/ui';

interface SplashScreenProps {
  onChoiceMade: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onChoiceMade }) => {
  const navigate = useNavigate();
  const coreStore = useCoreGameStore();
  const socialStore = useSocialStore();
  
  // Use consolidated save system
  const saveSlots = Object.values(socialStore.saves.saveSlots);
  const hasSaves = saveSlots.length > 0;
  const latestSave = socialStore.saves.currentSaveId 
    ? socialStore.saves.saveSlots[socialStore.saves.currentSaveId]
    : saveSlots.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
  
  // Check for character existence in core store
  const hasCharacter = !!(
    coreStore.character &&
    coreStore.character.name &&
    coreStore.character.name.trim().length > 0 &&
    coreStore.character.background
  );
  
  // Combined check - can continue if either has saves OR has character
  const canContinue = hasSaves || hasCharacter;

  const handleNewGame = () => {
    console.log('🎮 Starting new game with consolidated stores');
    console.log('📊 Current save slots:', saveSlots.length);
    console.log('📊 Has saves:', hasSaves);
    console.log('📊 Has character:', hasCharacter);
    console.log('📊 Character name:', coreStore.character?.name || 'none');
    console.log('📊 Latest save:', latestSave?.name || 'none');
    
    // Reset all game state for a truly new game
    try {
      const { resetAllGameState } = require('../utils/characterFlowIntegration');
      resetAllGameState();
      console.log('✅ Game state reset for new game');
    } catch (error) {
      console.error('❌ Failed to reset game state:', error);
    }
    
    onChoiceMade();
    console.log('🎮 Navigating to character-creation');
    navigate('/character-creation');
  };

  const handleContinue = () => {
    if (hasSaves && latestSave) {
      console.log('🔄 Loading save with consolidated stores:', latestSave.name);
      try {
        // Load save through consolidated store system
        socialStore.loadSaveSlot(latestSave.id);
        console.log('✅ Save loaded successfully');
        onChoiceMade();
        navigate('/planner');
      } catch (error) {
        console.error('❌ Failed to load save:', error);
        // Could show an error message to user
      }
    } else if (hasCharacter) {
      console.log('🔄 Continuing with existing character:', coreStore.character.name);
      // Continue with existing character (no save loading needed)
      onChoiceMade();
      navigate('/character-creation');
    }
  };

  const handleDeleteProgress = () => {
    if (confirm('Are you sure you want to delete ALL progress and start completely fresh? This cannot be undone.')) {
      console.log('🗑️ Resetting all game state atomically');
      try {
        // Single atomic reset across all consolidated stores
        resetAllGameState();
        console.log('✅ All game state reset atomically - redirecting to character creation');
        onChoiceMade();
        navigate('/character-creation');
      } catch (error) {
        console.error('❌ Failed to reset game state:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-amber-900 tracking-wide">
            Middle Age
          </h1>
          <h2 className="text-4xl font-semibold text-amber-800">
            Multiverse
          </h2>
          <p className="text-lg text-amber-700 max-w-md mx-auto">
            A life simulation where every choice shapes your destiny across the college experience
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4 max-w-xs mx-auto">
          <Button
            onClick={handleNewGame}
            className="w-full py-4 text-lg font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            New Game
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`w-full py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 ${
              canContinue
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </Button>
          
          {canContinue && (
            <Button
              onClick={handleDeleteProgress}
              className="w-full py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all duration-200"
            >
              🗑️ Delete All Progress
            </Button>
          )}
          
          {hasSaves && latestSave && (
            <div className="text-sm text-amber-600 mt-2">
              Latest save: {latestSave.name} (Day {latestSave.gameDay || latestSave.day || 1})
            </div>
          )}
          
          {!hasSaves && hasCharacter && (
            <div className="text-sm text-amber-600 mt-2">
              Character: {coreStore.character.name} (Continue current session)
            </div>
          )}
          
          {!hasSaves && !hasCharacter && (
            <div className="text-sm text-amber-600 mt-2">
              No saved games or character found
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="mt-12 opacity-60">
          <div className="text-amber-400 text-2xl">⚔️ 🏰 📜</div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;