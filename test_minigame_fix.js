// Test script to verify clue discovery minigame fix
// Run this in the browser console after loading the React app

console.log('🧪 Testing Clue Discovery Minigame Fix...');

// Step 1: Clear old localStorage data that might have incorrect minigame types
localStorage.removeItem('clue-store');
localStorage.removeItem('storylet-store');
console.log('✅ Cleared localStorage');

// Step 2: Wait for app to load and then create test data
setTimeout(() => {
    console.log('🔄 Creating test clue and storylet...');
    
    // Create test clue with correct minigame types
    if (typeof createTestClueAndStorylet === 'function') {
        const result = createTestClueAndStorylet();
        console.log('✅ Test data created:', result);
        
        // Step 3: Verify the clue has correct minigame types
        if (typeof useClueStore !== 'undefined') {
            const clueStore = useClueStore.getState();
            const testClue = clueStore.getClueById('test_clue_discovery');
            if (testClue) {
                console.log('🔍 Test clue minigame types:', testClue.minigameTypes);
                
                // Verify all types are valid
                const validTypes = ['memory-cards', 'word-scramble', 'color-match', 'stroop-test'];
                const allValid = testClue.minigameTypes.every(type => validTypes.includes(type));
                
                if (allValid) {
                    console.log('✅ All minigame types are valid!');
                } else {
                    console.log('❌ Some minigame types are invalid:', 
                        testClue.minigameTypes.filter(type => !validTypes.includes(type)));
                }
            }
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. Go to Planner page');
        console.log('2. Look for "Library Investigation" storylet');
        console.log('3. Choose "Carefully examine the mysterious object"');
        console.log('4. Should launch memory-cards minigame without error');
        
    } else {
        console.log('❌ createTestClueAndStorylet function not available');
        console.log('Make sure the app has fully loaded and try again');
    }
}, 2000);

// Step 4: Test minigame availability
setTimeout(() => {
    console.log('\n🎮 Testing minigame availability...');
    
    const availableMinigames = ['memory-cards', 'word-scramble', 'color-match', 'stroop-test'];
    
    availableMinigames.forEach(type => {
        // Simulate clue discovery launch
        if (typeof startClueDiscovery === 'function') {
            console.log(`✅ ${type} minigame function available`);
        } else {
            console.log(`⚠️ startClueDiscovery function not yet available`);
        }
    });
    
    console.log('\n🏁 Test complete! Check the console output above for results.');
}, 3000);