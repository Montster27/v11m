// /Users/montysharma/V11M2/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import MinigameManager from './components/minigames/MinigameManager';
import ClueNotification from './components/ClueNotification';
import ClueDiscoveryManager from './components/ClueDiscoveryManager';
import RefactorNotificationBanner from './components/RefactorNotificationBanner';
import { CharacterCreation, Planner, Quests, Skills, StoryletDeveloper, ContentCreator, SplashScreen } from './pages';
import { useAppStore } from './store/useAppStore';
import { useStoryletStore } from './store/useStoryletStore';
import { useGameOrchestrator, useStoryletNotifications } from './hooks/useGameOrchestrator';
import { useAutoSave } from './hooks/useAutoSave';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from './stores/v2';
import { Clue } from './types/clue';
// Development-only imports for testing utilities
if (process.env.NODE_ENV === 'development') {
  import('./utils/clueSystemTest'); // Import clue system test functions
  import('./utils/balanceSimulator'); // Import balance testing utilities
  import('./utils/quickBalanceTools'); // Import quick balance analysis tools
  import('./utils/clearAllData'); // Import data clearing utilities
  import('./utils/testClueDiscovery'); // Import clue discovery test utilities
  import('./utils/testArcClueDiscovery').then(module => {
    // Expose test functions globally for browser console access
    (window as any).createTestArcClueStorylets = module.createTestArcClueStorylets;
    (window as any).removeTestArcClueStorylets = module.removeTestArcClueStorylets;
  });
  import('./utils/testConcernFlags'); // Import character concerns test utilities
  import('./utils/testPathPlanner'); // Import path planner test utilities
  import('./utils/testClueOutcomes'); // Import clue outcome test utilities
  import('./utils/debugClueConnections'); // Import clue connection debug utilities
  import('./utils/refactorBackup'); // Import refactor backup utilities
  import('./utils/storeMigration'); // Import store migration utilities
  import('./utils/preRefactorBackup'); // Import pre-refactor backup utilities
  import('./utils/atomicResetValidation'); // Import atomic reset validation utilities
  import('./utils/legacyCleanup'); // Import legacy cleanup utilities
  import('../test/migration/dataMigrationTests'); // Import migration test suite
  import('../test/reset/atomicResetTests'); // Import atomic reset test suite
  import('../test/autosave/autoSaveIntegrationTests'); // Import auto-save test suite
  import('../test/consistency/crossStoreTests'); // Import cross-store consistency test suite
  import('../test/parity/featureParityTests'); // Import feature parity test suite
  // Enable Phase 3 imports one by one to debug
  import('./dev/storeInspector'); // Import Phase 3: Store Inspector utilities
  import('./store/middleware/optimisticUpdates'); // Import Phase 3: Optimistic Updates middleware
  import('./dev/testRunner'); // Import Phase 3: Enhanced Test Runner
  import('./test/storeTestUtils'); // Import Phase 3: Store Test Utilities
  
  // Expose consolidated stores globally for console access
  import('./stores/v2').then(module => {
    (window as any).useCoreGameStore = module.useCoreGameStore;
    (window as any).useNarrativeStore = module.useNarrativeStore;
    (window as any).useSocialStore = module.useSocialStore;
    console.log('🏪 Consolidated stores exposed globally for console access');
  });
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [clueNotification, setClueNotification] = useState<{clue: Clue; isVisible: boolean} | null>(null);
  const [orphanedStateChecked, setOrphanedStateChecked] = useState(false);
  
  // Core store hooks
  const { activeCharacter, day, userLevel, experience } = useAppStore();
  const { activeMinigame, completeMinigame, closeMinigame } = useStoryletStore();
  
  // Debug: Log app state on startup
  console.log('🚀 App startup - Current state:', { day, userLevel, experience, activeCharacter });
  
  // CRITICAL FIX: Check if we have unexpected state on startup (only once)
  useEffect(() => {
    if (!showSplash && !orphanedStateChecked && (day > 1 || userLevel > 1 || experience > 0)) {
      console.log('⚠️ Detected unexpected persisted state on startup');
      console.log('📦 localStorage keys:', Object.keys(localStorage));
      
      // Check if we have a valid currentSaveId that justifies this state
      const saveStore = (window as any).useSaveStore?.getState();
      const currentSaveId = saveStore?.currentSaveId;
      
      if (!currentSaveId && !activeCharacter) {
        console.log('🚨 No currentSaveId and no active character - forcing reset');
        // Force reset to initial state if no active save justifies the persisted data
        (window as any).useAppStore.setState({
          userLevel: 1,
          experience: 0,
          day: 1,
          activeCharacter: null
        });
      } else {
        console.log('ℹ️ State justified by:', { currentSaveId, activeCharacter: activeCharacter?.name });
      }
      
      setOrphanedStateChecked(true);
    }
  }, [showSplash, orphanedStateChecked, day, userLevel, experience, activeCharacter]);
  
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
        <RefactorNotificationBanner />
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