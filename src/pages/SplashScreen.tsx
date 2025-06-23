import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaveStore } from '../store/useSaveStore';
import { Button } from '../components/ui';

interface SplashScreenProps {
  onChoiceMade: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onChoiceMade }) => {
  const navigate = useNavigate();
  const { getSaveSlots, loadSave } = useSaveStore();
  
  const saveSlots = getSaveSlots();
  const hasSaves = saveSlots.length > 0;
  const latestSave = saveSlots.sort((a, b) => b.timestamp - a.timestamp)[0];

  const handleNewGame = () => {
    console.log('🎮 User clicked New Game');
    console.log('📊 Current save slots:', saveSlots);
    console.log('📊 Has saves:', hasSaves);
    console.log('📊 Latest save:', latestSave);
    
    onChoiceMade();
    console.log('🎮 Navigating to character-creation');
    navigate('/character-creation');
  };

  const handleContinue = () => {
    if (latestSave) {
      console.log('🔄 Loading save file:', latestSave);
      const success = loadSave(latestSave.id);
      if (success) {
        onChoiceMade();
        navigate('/planner');
      } else {
        console.error('Failed to load save');
        // Could show an error message to user
      }
    }
  };

  const handleDeleteProgress = () => {
    if (confirm('Are you sure you want to delete ALL progress and start completely fresh? This cannot be undone.')) {
      console.log('🗑️ User requested complete progress deletion');
      
      // Clear all localStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Delete all save files
      const saveSlots = getSaveSlots();
      saveSlots.forEach(slot => {
        console.log(`🗑️ Deleting save: ${slot.name}`);
      });
      
      // Reset save store - CRITICAL: Clear currentSaveId to prevent auto-save interference
      if (typeof window !== 'undefined' && (window as any).useSaveStore) {
        (window as any).useSaveStore.setState({
          saveSlots: [],
          currentSaveId: null,
          storyletCompletions: []
        });
        console.log('🔄 Cleared currentSaveId to prevent auto-save interference');
      }
      
      // Reset app store
      if (typeof window !== 'undefined' && (window as any).useAppStore) {
        (window as any).useAppStore.getState().resetGame();
        (window as any).useAppStore.setState({
          userLevel: 1,
          experience: 0,
          day: 1,
          activeCharacter: null
        });
      }
      
      console.log('✅ All progress deleted - redirecting to character creation');
      onChoiceMade();
      navigate('/character-creation');
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
            disabled={!hasSaves}
            className={`w-full py-4 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 ${
              hasSaves
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </Button>
          
          {hasSaves && (
            <Button
              onClick={handleDeleteProgress}
              className="w-full py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all duration-200"
            >
              🗑️ Delete All Progress
            </Button>
          )}
          
          {hasSaves && latestSave && (
            <div className="text-sm text-amber-600 mt-2">
              Latest save: {latestSave.name} (Day {latestSave.gameDay})
            </div>
          )}
          
          {!hasSaves && (
            <div className="text-sm text-amber-600 mt-2">
              No saved games found
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