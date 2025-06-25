// /Users/montysharma/V11M2/debug_current_state.js
// Debug script to check current store state
// Run this in browser console: copy and paste this entire script

console.log('🔍 DEBUGGING CURRENT STORE STATE');
console.log('================================');

// Check if the new consolidated stores are available
if (typeof useCoreGameStore !== 'undefined') {
  console.log('✅ New consolidated stores are available');
  
  const coreState = useCoreGameStore.getState();
  console.log('📊 Current Core Store State:');
  console.log('  Player:', coreState.player);
  console.log('  Character:', coreState.character);
  console.log('  World:', coreState.world);
  
  console.log('\n🎯 Key Values for Navigation:');
  console.log('  Level:', coreState.player.level);
  console.log('  Experience:', coreState.player.experience);
  console.log('  Day:', coreState.world.day);
  console.log('  Character Name:', coreState.character.name);
  
} else {
  console.log('❌ New consolidated stores NOT available in global scope');
}

// Check localStorage for store data
console.log('\n💾 Browser Storage Analysis:');
console.log('LocalStorage keys:', Object.keys(localStorage));

// Check for store-related keys
const storeKeys = Object.keys(localStorage).filter(key => 
  key.includes('store') || key.includes('game') || key.includes('character')
);

console.log('Store-related keys:', storeKeys);

storeKeys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    console.log(`📝 ${key}:`, data);
  } catch (e) {
    console.log(`📝 ${key}: (not JSON)`, localStorage.getItem(key));
  }
});

// Try to create a character manually to test the flow
console.log('\n🧪 Testing Manual Character Creation:');
try {
  if (typeof useCoreGameStore !== 'undefined') {
    const store = useCoreGameStore.getState();
    
    // Reset to clean state
    store.resetGame();
    
    // Set test character
    store.updateCharacter({
      name: 'Test Character',
      background: 'scholar',
      attributes: { intelligence: 75, charisma: 60 }
    });
    
    // Set test player stats
    store.updatePlayer({
      level: 1,
      experience: 0
    });
    
    // Set test world
    store.updateWorld({
      day: 1
    });
    
    console.log('✅ Manual character creation successful');
    console.log('📊 New state:', {
      player: store.player,
      character: store.character,
      world: store.world
    });
    
  } else {
    console.log('❌ Cannot test - stores not available');
  }
} catch (error) {
  console.log('❌ Manual character creation failed:', error);
}

console.log('\n📋 SUMMARY');
console.log('==========');
console.log('Check the Navigation component in the top right corner.');
console.log('It should show: Level: 1, XP: 0, Day: 1');
console.log('If it shows different values, there is a disconnect between stores.');
