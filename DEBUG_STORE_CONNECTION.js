// Debug script to check store states and localStorage
// Run this in browser console to diagnose the issue

console.log('🔍 DEBUGGING STORE CONNECTION ISSUE');
console.log('=====================================');

// Check if new stores are available
console.log('\n1. 📦 CHECKING STORE AVAILABILITY:');
console.log('useCoreGameStore available:', typeof window.useCoreGameStore !== 'undefined');
console.log('useNarrativeStore available:', typeof window.useNarrativeStore !== 'undefined');
console.log('useSocialStore available:', typeof window.useSocialStore !== 'undefined');

// Check current store states
console.log('\n2. 📊 CURRENT STORE STATES:');
if (window.useCoreGameStore) {
  const coreState = window.useCoreGameStore.getState();
  console.log('Core Game Store state:', {
    player: coreState.player,
    character: coreState.character,
    world: coreState.world
  });
} else {
  console.log('❌ Core Game Store not available');
}

// Check localStorage keys
console.log('\n3. 💾 LOCALSTORAGE KEYS:');
const allKeys = Object.keys(localStorage);
console.log('All localStorage keys:', allKeys);

const relevantKeys = allKeys.filter(key => 
  key.includes('store') || key.includes('mmv') || key.includes('character')
);
console.log('Relevant keys:', relevantKeys);

// Check specific store persistence keys
console.log('\n4. 🔐 SPECIFIC STORE DATA:');
const oldStoreData = localStorage.getItem('life-sim-store');
const newCoreStoreData = localStorage.getItem('mmv-core-game-store');
const newNarrativeStoreData = localStorage.getItem('mmv-narrative-store');
const newSocialStoreData = localStorage.getItem('mmv-social-store');

console.log('Old store (life-sim-store):', oldStoreData ? JSON.parse(oldStoreData) : 'No data');
console.log('New core store (mmv-core-game-store):', newCoreStoreData ? JSON.parse(newCoreStoreData) : 'No data');
console.log('New narrative store (mmv-narrative-store):', newNarrativeStoreData ? JSON.parse(newNarrativeStoreData) : 'No data');
console.log('New social store (mmv-social-store):', newSocialStoreData ? JSON.parse(newSocialStoreData) : 'No data');

// Test character creation function
console.log('\n5. 🧪 TESTING CHARACTER CREATION:');
try {
  console.log('createCharacterAtomically function available:', typeof createCharacterAtomically !== 'undefined');
  
  // Test call to see what happens
  console.log('Attempting to call createCharacterAtomically...');
  // Don't actually call it, just check if it exists
  console.log('Function signature:', createCharacterAtomically.toString().substring(0, 200) + '...');
} catch (error) {
  console.log('❌ Error checking createCharacterAtomically:', error);
}

// Check Navigation component connection
console.log('\n6. 🧭 NAVIGATION COMPONENT CONNECTION:');
console.log('Check if Navigation is reading from correct store...');
// We can't directly check this from console, but we can verify the store state

// Manual store update test
console.log('\n7. 🔄 MANUAL STORE UPDATE TEST:');
if (window.useCoreGameStore) {
  console.log('Current player level:', window.useCoreGameStore.getState().player.level);
  console.log('Attempting manual update...');
  
  window.useCoreGameStore.getState().updatePlayer({
    level: 99,
    experience: 999
  });
  
  console.log('After manual update:');
  console.log('New player level:', window.useCoreGameStore.getState().player.level);
  console.log('New player experience:', window.useCoreGameStore.getState().player.experience);
  
  // Check if it persisted
  setTimeout(() => {
    const updatedStoreData = localStorage.getItem('mmv-core-game-store');
    console.log('Updated localStorage data:', updatedStoreData ? JSON.parse(updatedStoreData) : 'No data');
  }, 100);
}

console.log('\n🎯 DIAGNOSIS COMPLETE - Check Navigation UI to see if values changed');
