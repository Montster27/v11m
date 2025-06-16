// /Users/montysharma/V11M2/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import DebugPanel from './components/DebugPanel';
import MinigameManager from './components/minigames/MinigameManager';
import ClueNotification from './components/ClueNotification';
import ClueDiscoveryManager from './components/ClueDiscoveryManager';
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
  import('./utils/clearAllData'); // Import data clearing utilities
  import('./utils/testClueDiscovery'); // Import clue discovery test utilities
  import('./utils/testConcernFlags'); // Import character concerns test utilities
  import('./utils/testPathPlanner'); // Import path planner test utilities
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [clueNotification, setClueNotification] = useState<{clue: Clue; isVisible: boolean} | null>(null);
  const [clueDiscovery, setClueDiscovery] = useState<{clueId: string; minigameType: string; isActive: boolean} | null>(null);
  // Save store available for splash screen
  const { activeCharacter } = useAppStore();
  const { activeMinigame, completeMinigame, closeMinigame } = useStoryletStore();

  // Make V2 skill system globally accessible
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).useSkillSystemV2Store = useSkillSystemV2Store;
    }
  }, []);

  // Set up global clue notification and discovery functions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showClueNotification = (clueResult: {clue: Clue}) => {
        setClueNotification({
          clue: clueResult.clue,
          isVisible: true
        });
      };

      (window as any).startClueDiscovery = (clueId: string, minigameType: string) => {
        console.log(`🔍 Starting clue discovery: ${clueId} with ${minigameType}`);
        setClueDiscovery({
          clueId,
          minigameType,
          isActive: true
        });
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).showClueNotification;
        delete (window as any).startClueDiscovery;
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
        
        {/* Clue Discovery Manager - handles full clue discovery flow */}
        {clueDiscovery?.isActive && (
          <ClueDiscoveryManager
            clueId={clueDiscovery.clueId}
            minigameType={clueDiscovery.minigameType as any}
            onComplete={(success, clue) => {
              console.log(`🔍 Clue discovery completed: ${success ? 'SUCCESS' : 'FAILURE'}`, { clue });
              
              // Trigger the storylet store's completion handler
              const { completeClueDiscovery } = useStoryletStore.getState();
              completeClueDiscovery(success, clueDiscovery.clueId);
              
              // Close the discovery manager
              setClueDiscovery(null);
              
              // Show notification if successful
              if (success && clue) {
                setClueNotification({
                  clue,
                  isVisible: true
                });
              }
            }}
            onClose={() => {
              console.log('🔍 Clue discovery cancelled by user');
              setClueDiscovery(null);
            }}
          />
        )}
      </div>
    </Router>
  );
}

export default App;