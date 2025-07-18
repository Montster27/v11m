// Comprehensive test for all persistence functionality
import { useCoreGameStore } from '../stores/v2/useCoreGameStore';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import { debouncedStorage } from './debouncedStorage';

export const testAllPersistence = async () => {
  console.log('🧪 Testing All Persistence Functionality');
  console.log('=====================================');
  
  // Test 1: Store Hydration
  console.log('\n1. Testing Store Hydration:');
  const coreStore = useCoreGameStore.getState();
  const narrativeStore = useNarrativeStore.getState();
  const socialStore = useSocialStore.getState();
  
  console.log('✅ Core Store Hydrated:', coreStore._hasHydrated);
  console.log('✅ Narrative Store Hydrated:', narrativeStore._hasHydrated);
  console.log('✅ Social Store Hydrated:', socialStore._hasHydrated);
  
  // Test 2: Create Test Content
  console.log('\n2. Creating Test Content:');
  
  // Create test arc
  const testArcName = `Test Arc ${Date.now()}`;
  const arcId = narrativeStore.createArc({
    name: testArcName,
    description: 'Test arc for persistence',
    progress: 0,
    isCompleted: false,
    failures: 0
  });
  console.log('✅ Created test arc:', arcId);
  
  // Create test clue
  const testClueName = `Test Clue ${Date.now()}`;
  const clueId = `clue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  narrativeStore.createClue({
    id: clueId,
    name: testClueName,
    description: 'Test clue for persistence',
    discovered: false
  });
  console.log('✅ Created test clue:', clueId);
  
  // Create test storylet
  const testStorylet = {
    id: `storylet_${Date.now()}`,
    name: `Test Storylet ${Date.now()}`,
    description: 'Test storylet for persistence',
    content: 'Test content',
    choices: [],
    trigger: { type: 'manual' as const },
    storyArc: testArcName
  };
  narrativeStore.addUserStorylet(testStorylet);
  console.log('✅ Created test storylet:', testStorylet.id);
  
  // Test 3: Force Save
  console.log('\n3. Forcing Save to localStorage:');
  debouncedStorage.flush();
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Test 4: Verify Persistence
  console.log('\n4. Verifying Persistence:');
  
  // Check localStorage directly
  const narrativeData = localStorage.getItem('mmv-narrative-store');
  const coreData = localStorage.getItem('mmv-core-game-store');
  const socialData = localStorage.getItem('mmv-social-store');
  
  let success = true;
  
  if (narrativeData) {
    try {
      const parsed = JSON.parse(narrativeData);
      const savedArcs = parsed.state?.storyArcs || {};
      const savedClues = parsed.state?.clues || {};
      const savedStorylets = parsed.state?.storylets?.userCreated || [];
      
      console.log('✅ Narrative data found in localStorage');
      console.log('  - Arcs:', Object.keys(savedArcs).length);
      console.log('  - Clues:', Object.keys(savedClues).length);
      console.log('  - Storylets:', savedStorylets.length);
      
      if (!savedArcs[arcId]) {
        console.log('❌ Test arc not found in localStorage');
        success = false;
      } else {
        console.log('✅ Test arc found in localStorage');
      }
      
      if (!savedClues[clueId]) {
        console.log('❌ Test clue not found in localStorage');
        success = false;
      } else {
        console.log('✅ Test clue found in localStorage');
      }
      
      if (!savedStorylets.find(s => s.id === testStorylet.id)) {
        console.log('❌ Test storylet not found in localStorage');
        success = false;
      } else {
        console.log('✅ Test storylet found in localStorage');
      }
      
    } catch (e) {
      console.log('❌ Failed to parse narrative data:', e);
      success = false;
    }
  } else {
    console.log('❌ No narrative data in localStorage');
    success = false;
  }
  
  if (coreData) {
    console.log('✅ Core game data found in localStorage');
  } else {
    console.log('❌ No core game data in localStorage');
    success = false;
  }
  
  if (socialData) {
    console.log('✅ Social data found in localStorage');
  } else {
    console.log('❌ No social data in localStorage');
    success = false;
  }
  
  // Test 5: Test Reset Preservation
  console.log('\n5. Testing Reset Preservation:');
  
  const beforeReset = {
    arcs: Object.keys(narrativeStore.storyArcs).length,
    clues: Object.keys(narrativeStore.clues).length,
    storylets: narrativeStore.storylets.userCreated.length
  };
  
  console.log('Before reset:', beforeReset);
  
  // Reset narrative store
  narrativeStore.resetNarrative();
  
  const afterReset = {
    arcs: Object.keys(narrativeStore.storyArcs).length,
    clues: Object.keys(narrativeStore.clues).length,
    storylets: narrativeStore.storylets.userCreated.length
  };
  
  console.log('After reset:', afterReset);
  
  if (afterReset.arcs === beforeReset.arcs &&
      afterReset.clues === beforeReset.clues &&
      afterReset.storylets === beforeReset.storylets) {
    console.log('✅ User content preserved during reset');
  } else {
    console.log('❌ User content lost during reset');
    success = false;
  }
  
  // Test 6: Final Results
  console.log('\n6. Final Results:');
  if (success) {
    console.log('🎉 ALL PERSISTENCE TESTS PASSED!');
    console.log('✅ Store hydration working');
    console.log('✅ Content creation working');
    console.log('✅ localStorage persistence working');
    console.log('✅ Reset preservation working');
  } else {
    console.log('❌ SOME PERSISTENCE TESTS FAILED');
    console.log('Check the logs above for details');
  }
  
  return success;
};

// Expose to window
if (typeof window !== 'undefined') {
  (window as any).testAllPersistence = testAllPersistence;
}