// /Users/montysharma/V11M2/storage_cleanup_test.js
// Copy and paste this into browser console to test the storage cleanup hypothesis

console.log('🧹 STORAGE CLEANUP TEST');
console.log('======================');

// 1. Show current storage state
console.log('📊 Current localStorage keys:', Object.keys(localStorage));

// 2. Look for store-related keys
const storeKeys = Object.keys(localStorage).filter(key => 
  key.includes('store') || key.includes('game') || key.includes('character') || key.includes('mmv')
);
console.log('🏪 Store-related keys:', storeKeys);

// 3. Show the data in each store key
storeKeys.forEach(key => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    console.log(`📝 ${key}:`, data);
  } catch (e) {
    console.log(`📝 ${key}: (not JSON)`, localStorage.getItem(key));
  }
});

// 4. Clear ALL storage
console.log('\n🧹 Clearing ALL localStorage...');
localStorage.clear();

// 5. Clear sessionStorage too
console.log('🧹 Clearing sessionStorage...');
sessionStorage.clear();

console.log('✅ Storage cleared! Now test character creation:');
console.log('1. Refresh the page');
console.log('2. Create a new character'); 
console.log('3. Check if Navigation shows Level: 1, XP: 0, Day: 1');

// 6. If you want to test just the new store system:
if (typeof useCoreGameStore !== 'undefined') {
  console.log('\n🧪 Testing new store system after cleanup...');
  const store = useCoreGameStore.getState();
  
  // Create test character
  store.updateCharacter({ name: 'Test Character', background: 'scholar' });
  store.updatePlayer({ level: 1, experience: 0 });
  store.updateWorld({ day: 1 });
  
  console.log('📊 New store state:', {
    character: store.character,
    player: store.player,
    world: store.world
  });
  
  console.log('✅ Check Navigation - it should now show correct values!');
}