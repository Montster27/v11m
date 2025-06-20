// /Users/montysharma/V11M2/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import MinigameManager from './components/minigames/MinigameManager';
import ClueNotification from './components/ClueNotification';
import ClueDiscoveryManager from './components/ClueDiscoveryManager';
import { CharacterCreation, Planner, Quests, Skills, StoryletDeveloper, ContentCreator, SplashScreen } from './pages';
import { useAppStore } from './store/useAppStore';
import { useStoryletStore } from './store/useStoryletStore';
import { useGameOrchestrator, useStoryletNotifications } from './hooks/useGameOrchestrator';
import { useAutoSave } from './hooks/useAutoSave';
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
  
  // Core store hooks
  const { activeCharacter } = useAppStore();
  const { activeMinigame, completeMinigame, closeMinigame } = useStoryletStore();
  
  // Set up reactive orchestration (replaces setTimeout patterns)
  useGameOrchestrator();
  
  // Set up reactive auto-save (replaces setTimeout-based auto-save)
  useAutoSave();
  
  // Set up reactive notifications (replaces window-based system)
  const { 
    newlyDiscoveredClue, 
    clueDiscoveryRequest, 
    clearDiscoveredClue, 
    clearClueDiscoveryRequest 
  } = useStoryletNotifications();

  // React to newly discovered clues
  useEffect(() => {
    if (newlyDiscoveredClue) {
      setClueNotification({
        clue: newlyDiscoveredClue,
        isVisible: true
      });
    }
  }, [newlyDiscoveredClue]);

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
          <Route path="/content-creator" element={<ContentCreator />} />
          <Route path="/splash" element={<SplashScreen />} />
        </Routes>
        
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
          onClose={() => {
            setClueNotification(null);
            clearDiscoveredClue();
          }}
        />
        
        {/* Clue Discovery Manager - handles full clue discovery flow */}
        {clueDiscoveryRequest && (
          <ClueDiscoveryManager
            clueId={clueDiscoveryRequest.clueId}
            minigameType={clueDiscoveryRequest.minigameType as any}
            onComplete={(success, clue) => {
              console.log(`🔍 Clue discovery completed: ${success ? 'SUCCESS' : 'FAILURE'}`, { clue });
              
              // Trigger the storylet store's completion handler
              const { completeClueDiscovery } = useStoryletStore.getState();
              completeClueDiscovery(success, clueDiscoveryRequest.clueId);
              
              // Clear the discovery request reactively
              clearClueDiscoveryRequest();
              
              // Show notification if successful via reactive system
              if (success && clue) {
                setClueNotification({
                  clue,
                  isVisible: true
                });
              }
            }}
            onClose={() => {
              console.log('🔍 Clue discovery cancelled by user');
              clearClueDiscoveryRequest();
            }}
          />
        )}
      </div>
    </Router>
  );
}

export default App;