// Test script for the new hybrid clue discovery follow-up approach
// Run this in browser console after the React app loads

console.log('🧪 Testing Hybrid Clue Discovery Follow-up Approach...');

// Step 1: Clear any existing data
localStorage.removeItem('clue-store');
localStorage.removeItem('storylet-store');
console.log('✅ Cleared localStorage');

// Step 2: Create test data with pre-authored follow-ups
setTimeout(() => {
    if (typeof createTestClueAndStorylet === 'function') {
        console.log('🔄 Creating test clue with pre-authored follow-ups...');
        const result = createTestClueAndStorylet();
        
        console.log('\n📋 Created Components:');
        console.log('1. Test Clue: test_clue_discovery');
        console.log('2. Main Storylet: test_clue_discovery_storylet');
        console.log('3. SUCCESS Follow-up: clue_followup_test_clue_discovery_success');
        console.log('4. FAILURE Follow-up: clue_followup_test_clue_discovery_failure');
        
        // Verify the storylets exist in the system
        if (typeof useStoryletStore !== 'undefined') {
            const storyletStore = useStoryletStore.getState();
            const successStorylet = storyletStore.allStorylets['clue_followup_test_clue_discovery_success'];
            const failureStorylet = storyletStore.allStorylets['clue_followup_test_clue_discovery_failure'];
            
            if (successStorylet && failureStorylet) {
                console.log('✅ Pre-authored follow-up storylets are in the system');
                console.log('📖 Success storylet has', successStorylet.choices.length, 'choices');
                console.log('📖 Failure storylet has', failureStorylet.choices.length, 'choices');
            } else {
                console.log('❌ Follow-up storylets not found in system');
            }
        }
        
        console.log('\n🎮 Testing Instructions:');
        console.log('1. Navigate to Planner page');
        console.log('2. Find "Library Investigation" storylet');
        console.log('3. Choose "Carefully examine the mysterious object"');
        console.log('4. Complete or fail the memory-cards minigame');
        console.log('5. Check console for "Using pre-authored follow-up storylet" message');
        console.log('6. See rich, custom follow-up content instead of generic text');
        
        console.log('\n🔍 What to Look For:');
        console.log('• SUCCESS: 3 meaningful choices about the mysterious note');
        console.log('• FAILURE: 3 different retry/alternative approaches');
        console.log('• Console log: "Using pre-authored follow-up storylet"');
        console.log('• NO console log: "generating dynamic storylet"');
        
    } else {
        console.log('❌ createTestClueAndStorylet not available, app may still be loading');
    }
}, 2000);

// Step 3: Test the fallback behavior by checking what happens with a non-existent clue
setTimeout(() => {
    console.log('\n🧪 Testing Fallback Behavior...');
    console.log('The system will fall back to dynamic generation for clues without pre-authored follow-ups');
    console.log('This ensures backward compatibility and rapid prototyping capability');
}, 3000);