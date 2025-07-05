// /Users/montysharma/V11M2/src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import MinigameManager from './components/minigames/MinigameManager';
import ClueNotification from './components/ClueNotification';
import ClueDiscoveryManager from './components/ClueDiscoveryManager';
// import RefactorNotificationBanner from './components/RefactorNotificationBanner'; // Removed - refactor complete
import AutoSaveIndicator from './components/AutoSaveIndicator';
import { CharacterCreation, Planner, Quests, Skills, StoryletDeveloper, ContentCreator, SplashScreen } from './pages';
import { useGameOrchestrator, useStoryletNotifications } from './hooks/useGameOrchestrator';
import { useAutoSave } from './hooks/useAutoSave';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from './stores/v2';
import { Clue } from './types/clue';
// Development-only imports for testing utilities
if (process.env.NODE_ENV === 'development') {
  // import('./utils/clueSystemTest'); // Removed - orphaned test utility
  import('./utils/balanceSimulator'); // Import balance testing utilities
  // import('./utils/quickBalanceTools'); // Removed - orphaned test utility
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
  
  // Character Flow Refactoring Test Suite
  import('./test/characterFlow/flowTestUtils'); // Import character flow test utilities
  import('./test/characterFlow/splashScreenTests'); // Import splash screen tests
  import('./test/characterFlow/characterCreationTests'); // Import character creation tests
  import('./test/characterFlow/plannerIntegrationTests'); // Import planner integration tests
  import('./test/characterFlow/saveLoadTest'); // Import save/load tests
  import('./test/characterFlow/runPhase1and2Tests'); // Import Phase 1 & 2 test runner
  import('./test/characterFlow/runPhase3and4Tests'); // Import Phase 3 & 4 test runner
  import('./test/characterFlow/runPhase5Tests'); // Import Phase 5 test runner
  import('./test/characterFlow/listTests'); // Import test listing helper
  import('./test/characterFlow/quickTests'); // Import quick tests with immediate results
  
  // Phase 6: Integration Testing imports
  import('./test/characterFlow/comprehensiveFlowTests'); // Import comprehensive flow tests
  
  // V2 Store Migration Integration Tests
  import('../test/v2/testRunner').then(module => {
    // Expose V2 test functions globally for browser console access
    (window as any).runCompleteV2TestSuite = module.runCompleteV2TestSuite;
    (window as any).runV2HealthCheck = module.runV2HealthCheck;
    (window as any).getTestEnvironmentInfo = module.getTestEnvironmentInfo;
    (window as any).exportTestResults = module.exportTestResults;
  });
  
  // Memory Game Image Test
  import('./utils/testMemoryGame'); // Import memory game test utility
  import('./utils/quickMemoryGameTest'); // Import quick memory game test
  
  import('../test/v2/v2IntegrationTests').then(module => {
    (window as any).runV2IntegrationTests = module.runV2IntegrationTests;
    console.log('🏪 V2 Store Tests loaded successfully');
  });
  import('../test/v2/componentIntegrationTests').then(module => {
    (window as any).runComponentIntegrationTests = module.runComponentIntegrationTests;
    console.log('🧩 V2 Component Tests loaded successfully');
  });
  import('./test/characterFlow/performanceTests'); // Import performance tests
  import('./test/characterFlow/edgeCaseTests'); // Import edge case tests
  
  // Phase 7: Success Validation imports
  import('./test/characterFlow/successValidation'); // Import success validation suite
  import('./test/characterFlow/quickFixValidation'); // Import quick fix validation
  import('./test/characterFlow/finalValidationRunner'); // Import complete validation runner
  import('./test/characterFlow/debugValidation'); // Import debug validation tools
  import('./test/characterFlow/cleanValidationRunner'); // Import clean validation runner
  import('./test/characterFlow/instantValidation'); // Import instant validation
  import('./test/characterFlow/testResultAnalyzer'); // Import test result analyzer
  import('./test/characterFlow/fixQuickTest'); // Import quick test debugger
  import('./test/characterFlow/fixSaveTest'); // Import save test debugger
  import('./test/characterFlow/quickTestFix'); // Import fixed quick test
  
  // Minigame System Integration Tests
  import('./test/minigame/integrationTests'); // Import minigame integration tests
  import('./utils/minigameValidationTest'); // Import minigame validation utilities
  import('./utils/comprehensiveMinigameTest'); // Import comprehensive test suite
  
  // Phase 2: Planner Decomposition Tests
  import('./test/plannerRefactor/decompositionTest'); // Import planner decomposition tests
  
  // Phase 3: Content Studio Unification Tests
  import('./test/contentStudioRefactor/unificationTest'); // Import content studio unification tests
  
  // Show test availability banner
  setTimeout(() => {
    console.log('\n🧪 CHARACTER FLOW TESTS LOADED!');
    console.log('================================');
    console.log('Type listAllCharacterFlowTests() to see all available tests');
    console.log('Type showTestStatus() to see refactoring status');
    console.log('Type quickStatusCheck() for quick validation overview');
    console.log('Type runCompleteValidation() for COMPLETE validation suite');
    console.log('Type generateSuccessReport() for final success validation');
    console.log('Type testRecentFixes() to validate recent bug fixes');
    console.log('Type runDecompositionTests() to test Planner refactoring');
    console.log('Type runContentStudioUnificationTests() to test Content Studio');
    console.log('Type runMinigameIntegrationTests() to test minigame system');
    console.log('Type runQuickMinigameTest() for quick minigame validation');
    console.log('Type validateAllMinigamePlugins() for comprehensive plugin validation');
    console.log('Type quickMinigameValidationTest() for quick plugin validation');
    console.log('Type runComprehensiveMinigameTest() for COMPLETE system validation\n');
  }, 2000);
  import('./utils/debugClueConnections'); // Import clue connection debug utilities
  // import('./utils/refactorBackup'); // Removed - refactor complete
  import('./utils/storeMigration'); // Import store migration utilities
  // import('./utils/preRefactorBackup'); // Removed - refactor complete
  import('./utils/atomicResetValidation'); // Import atomic reset validation utilities
  // import('./utils/legacyCleanup'); // Removed - cleanup complete
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
  
  // Expose SaveManager and auto-save functions globally for testing
  import('./utils/saveManager').then(module => {
    (window as any).saveManager = module.saveManager;
    console.log('💾 SaveManager exposed globally for console access');
  });
  
  import('./hooks/useAutoSave').then(module => {
    (window as any).AUTO_SAVE_CONFIG = module.AUTO_SAVE_CONFIG;
    console.log('🔄 Auto-save config exposed globally for console access');
  });
  
  // Expose flag generator functions globally for testing
  import('./utils/flagGenerator').then(module => {
    (window as any).generateConcernFlags = module.generateConcernFlags;
    (window as any).generateAllFlags = module.generateAllFlags;
    (window as any).clearFlagCache = module.clearFlagCache;
    (window as any).getFlagGeneratorStats = module.getFlagGeneratorStats;
    (window as any).warmUpFlagCache = module.warmUpFlagCache;
    (window as any).optimizeFlagCache = module.optimizeFlagCache;
    console.log('🏷️ Flag generator functions exposed globally for console access');
  });
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [clueNotification, setClueNotification] = useState<{clue: Clue; isVisible: boolean} | null>(null);
  const [orphanedStateChecked, setOrphanedStateChecked] = useState(false);
  
  // V2 stores - Core Game domain  
  const { activeCharacter, player, world } = useCoreGameStore();
  const { level: userLevel, experience } = player;
  const { day } = world;
  
  // V2 stores - Narrative domain
  const { getActiveMinigame, completeMinigame, closeMinigame, migrateFromLegacyStores } = useNarrativeStore();
  const activeMinigame = getActiveMinigame();
  
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
        const coreStore = useCoreGameStore.getState();
        coreStore.resetGame();
      } else {
        console.log('ℹ️ State justified by:', { currentSaveId, activeCharacter: activeCharacter?.name });
      }
      
      setOrphanedStateChecked(true);
    }
  }, [showSplash, orphanedStateChecked, day, userLevel, experience, activeCharacter]);
  
  // Initialize V2 stores with data migration
  useEffect(() => {
    if (!orphanedStateChecked) {
      console.log('🔄 Initializing V2 stores and migrating data...');
      migrateFromLegacyStores();
    }
  }, [orphanedStateChecked, migrateFromLegacyStores]);
  
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
        {/* <RefactorNotificationBanner /> - Removed: refactor complete */}
        
        {/* Auto-save indicator in top-right corner */}
        <div className="fixed top-4 right-4 z-50">
          <AutoSaveIndicator className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border" />
        </div>
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
              
              // Trigger the legacy storylet store's completion handler for now
              // TODO: Migrate clue discovery to V2 stores
              const legacyStoryletStore = (window as any).useStoryletStore?.getState();
              if (legacyStoryletStore?.completeClueDiscovery) {
                legacyStoryletStore.completeClueDiscovery(success, clueDiscoveryRequest.clueId);
              }
              
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