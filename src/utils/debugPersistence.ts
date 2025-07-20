// /Users/montysharma/V11M2/src/utils/debugPersistence.ts
// Debug utilities for persistence issues

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

/**
 * Check persistence status of all V2 stores
 */
export const checkPersistenceStatus = () => {
  console.log('🔍 PERSISTENCE STATUS CHECK');
  console.log('==========================\n');
  
  // Check localStorage for persisted data
  const persistedKeys = Object.keys(localStorage).filter(key => key.includes('mmv-'));
  
  console.log('📦 Persisted Keys:', persistedKeys);
  
  persistedKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      console.log(`\n🔑 ${key}:`);
      console.log('  Version:', data.version);
      console.log('  Has State:', !!data.state);
      
      if (data.state) {
        // Special handling for narrative store with Maps
        if (key === 'mmv-narrative-store' && data.state.flags) {
          console.log('  Flags:', {
            storylet: Array.isArray(data.state.flags.storylet) ? data.state.flags.storylet.length + ' entries' : 'invalid',
            storyletFlag: Array.isArray(data.state.flags.storyletFlag) ? data.state.flags.storyletFlag.length + ' entries' : 'invalid',
            concerns: Array.isArray(data.state.flags.concerns) ? data.state.flags.concerns.length + ' entries' : 'invalid',
            storyArc: Array.isArray(data.state.flags.storyArc) ? data.state.flags.storyArc.length + ' entries' : 'invalid'
          });
        }
        
        // Show key data
        if (key === 'mmv-narrative-store') {
          console.log('  Story Arcs:', Object.keys(data.state.storyArcs || {}).length);
          console.log('  Clues:', Object.keys(data.state.clues || {}).length);
        } else if (key === 'mmv-core-game-store') {
          console.log('  Character:', data.state.character?.name || 'None');
          console.log('  Day:', data.state.world?.day || 0);
        } else if (key === 'mmv-social-store') {
          console.log('  Save Slots:', Object.keys(data.state.saves?.saveSlots || {}).length);
          console.log('  Current Save:', data.state.saves?.currentSaveId || 'None');
        }
      }
    } catch (error) {
      console.error(`  ❌ Error parsing ${key}:`, error.message);
    }
  });
  
  // Check current store states
  console.log('\n📊 CURRENT STORE STATES:');
  console.log('========================');
  
  try {
    const coreState = useCoreGameStore.getState();
    console.log('\n🎮 Core Game Store:');
    console.log('  Character:', coreState.character?.name || 'None');
    console.log('  Day:', coreState.world.day);
    console.log('  Resources:', coreState.player.resources);
  } catch (error) {
    console.error('  ❌ Error accessing Core Game Store:', error.message);
  }
  
  try {
    const narrativeState = useNarrativeStore.getState();
    console.log('\n📖 Narrative Store:');
    console.log('  Story Arcs:', Object.keys(narrativeState.storyArcs).length);
    console.log('  Clues:', Object.keys(narrativeState.clues).length);
    console.log('  Active Storylets:', narrativeState.storylets.active.length);
    console.log('  Completed Storylets:', narrativeState.storylets.completed.length);
  } catch (error) {
    console.error('  ❌ Error accessing Narrative Store:', error.message);
  }
  
  try {
    const socialState = useSocialStore.getState();
    console.log('\n👥 Social Store:');
    console.log('  NPCs:', Object.keys(socialState.npcs.relationships).length);
    console.log('  Discovered Clues:', socialState.clues.discovered.length);
    console.log('  Save Slots:', Object.keys(socialState.saves.saveSlots).length);
    console.log('  Current Save:', socialState.saves.currentSaveId || 'None');
  } catch (error) {
    console.error('  ❌ Error accessing Social Store:', error.message);
  }
};

/**
 * Test persistence by creating test data
 */
export const testPersistence = async () => {
  console.log('🧪 TESTING PERSISTENCE');
  console.log('=====================\n');
  
  // Create test arc
  console.log('1️⃣ Creating test story arc...');
  const narrativeStore = useNarrativeStore.getState();
  const arcId = narrativeStore.createArc({
    name: 'Test Persistence Arc',
    description: 'Testing if this persists',
    progress: 0.5,
    isCompleted: false,
    failures: 0
  });
  console.log('  Created arc:', arcId);
  
  // Create test clue
  console.log('\n2️⃣ Creating test clue...');
  narrativeStore.createClue({
    id: 'test_clue_' + Date.now(),
    name: 'Test Persistence Clue',
    description: 'Testing if clues persist',
    discovered: true,
    importance: 'high'
  });
  
  // Wait for debounced storage
  console.log('\n3️⃣ Waiting for storage to persist...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Check localStorage
  console.log('\n4️⃣ Checking localStorage...');
  const narrativeData = localStorage.getItem('mmv-narrative-store');
  if (narrativeData) {
    const parsed = JSON.parse(narrativeData);
    console.log('  ✅ Data persisted to localStorage');
    console.log('  Story Arcs:', Object.keys(parsed.state?.storyArcs || {}).length);
    console.log('  Clues:', Object.keys(parsed.state?.clues || {}).length);
  } else {
    console.log('  ❌ No data found in localStorage');
  }
  
  console.log('\n5️⃣ Test complete - reload page to check if data persists');
};

/**
 * Force flush all pending saves
 */
export const forceFlushStorage = () => {
  console.log('💾 Force flushing all pending saves...');
  
  // Access debouncedStorage directly
  if ((window as any).debouncedStorageDebug) {
    const stats = (window as any).debouncedStorageDebug.getStats();
    console.log('  Pending saves:', stats.pendingCount);
    
    (window as any).debouncedStorageDebug.flush();
    console.log('  ✅ Flush complete');
  } else {
    console.log('  ❌ debouncedStorage debug not available');
  }
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).checkPersistenceStatus = checkPersistenceStatus;
  (window as any).testPersistence = testPersistence;
  (window as any).forceFlushStorage = forceFlushStorage;
  
  console.log('🔍 Persistence Debug Tools loaded:');
  console.log('   checkPersistenceStatus() - Check current persistence status');
  console.log('   testPersistence() - Test creating and persisting data');
  console.log('   forceFlushStorage() - Force flush pending saves');
}