// /Users/montysharma/V11M2/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import DebugPanel from './components/DebugPanel';
import MinigameManager from './components/minigames/MinigameManager';
import ClueNotification from './components/ClueNotification';
import { CharacterCreation, Planner, Quests, Skills, StoryletDeveloper, SplashScreen } from './pages';
import { useSaveStore } from './store/useSaveStore';
import { useAppStore } from './store/useAppStore';
import { useStoryletStore } from './store/useStoryletStore';
import { useSkillSystemV2Store } from './store/useSkillSystemV2Store';
import { Clue } from './types/clue';
// Development-only imports for testing utilities
if (process.env.NODE_ENV === 'development') {
  import('./utils/clueSystemTest'); // Import clue system test functions
  import('./utils/balanceSimulator'); // Import balance testing utilities
  import('./utils/quickBalanceTools'); // Import quick balance analysis tools
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [clueNotification, setClueNotification] = useState<{clue: Clue; isVisible: boolean} | null>(null);
  // Save store available for splash screen
  const { activeCharacter } = useAppStore();
  const { activeMinigame, completeMinigame, closeMinigame } = useStoryletStore();

  // Make V2 skill system globally accessible
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).useSkillSystemV2Store = useSkillSystemV2Store;
    }
  }, []);

  // Set up global clue notification function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showClueNotification = (clueResult: {clue: Clue}) => {
        setClueNotification({
          clue: clueResult.clue,
          isVisible: true
        });
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).showClueNotification;
      }
    };
  }, []);

  if (showSplash) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<SplashScreen onChoiceMade={() => setShowSplash(false)} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/character-creation" element={<CharacterCreation />} />
          <Route path="/storylet-developer" element={<StoryletDeveloper />} />
          <Route path="/splash" element={<SplashScreen />} />
        </Routes>
        
        {/* Debug Panel - only in development */}
        <DebugPanel />
        
        {/* Minigame Manager - renders when a minigame is active */}
        <MinigameManager
          gameId={activeMinigame}
          onGameComplete={completeMinigame}
          onClose={closeMinigame}
        />
        
        {/* Clue Notification - shows when a clue is discovered */}
        <ClueNotification
          clue={clueNotification?.clue || null}
          isVisible={clueNotification?.isVisible || false}
          onClose={() => setClueNotification(null)}
        />
      </div>
    </Router>
  );
}

export default App;