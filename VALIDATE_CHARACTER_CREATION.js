// Comprehensive validation script for character creation flow
// Run this in browser console to validate the entire system

console.log('🔍 COMPREHENSIVE CHARACTER CREATION VALIDATION');
console.log('===============================================');

// Step 1: Check store availability
console.log('\n1. 📦 STORE AVAILABILITY CHECK:');
const storesAvailable = {
  useCoreGameStore: typeof window.useCoreGameStore !== 'undefined',
  useNarrativeStore: typeof window.useNarrativeStore !== 'undefined',
  useSocialStore: typeof window.useSocialStore !== 'undefined',
  createCharacterAtomically: typeof createCharacterAtomically !== 'undefined'
};
console.log('Store availability:', storesAvailable);

if (!storesAvailable.useCoreGameStore) {
  console.log('❌ CRITICAL: New stores not available globally. Check App.tsx imports.');
  console.log('💡 Fix: Make sure stores are exposed in App.tsx development imports');
}

// Step 2: Check current store states
console.log('\n2. 📊 CURRENT STORE STATES:');
if (window.useCoreGameStore) {
  const initialState = window.useCoreGameStore.getState();
  console.log('Initial Core Game Store state:', {
    player: initialState.player,
    character: initialState.character,
    world: initialState.world
  });
} else {
  console.log('❌ Cannot check store state - useCoreGameStore not available');
}

// Step 3: Test character creation function
console.log('\n3. 🧪 CHARACTER CREATION FUNCTION TEST:');
if (window.useCoreGameStore && typeof createCharacterAtomically !== 'undefined') {
  console.log('✅ Both store and function available, testing character creation...');
  
  const testCharacterData = {
    name: 'TestUser' + Date.now(),
    background: 'scholar',
    attributes: {
      intelligence: 60,
      creativity: 50,
      charisma: 45,
      strength: 40,
      focus: 55,
      empathy: 50
    },
    domainAdjustments: {
      intellectualCompetence: 5,
      physicalCompetence: -5,
      emotionalIntelligence: 0,
      socialCompetence: 0,
      personalAutonomy: 0,
      identityClarity: 0,
      lifePurpose: 0
    }
  };
  
  console.log('Creating test character with data:', testCharacterData);
  
  try {
    createCharacterAtomically(testCharacterData);
    console.log('✅ Character creation function executed without errors');
    
    // Check the result
    setTimeout(() => {
      console.log('\n4. 📋 POST-CREATION VALIDATION:');
      const finalState = window.useCoreGameStore.getState();
      console.log('Final store state:', {
        player: finalState.player,
        character: finalState.character,
        world: finalState.world
      });
      
      // Validation checks
      const validationResults = {
        playerLevelReset: finalState.player.level === 1,
        playerExperienceReset: finalState.player.experience === 0,
        worldDayReset: finalState.world.day === 1,
        characterNameSet: finalState.character.name === testCharacterData.name,
        characterBackgroundSet: finalState.character.background === testCharacterData.background
      };
      
      console.log('\n5. ✅ VALIDATION RESULTS:');
      Object.entries(validationResults).forEach(([check, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${check}: ${passed ? 'PASS' : 'FAIL'}`);
      });
      
      const allPassed = Object.values(validationResults).every(Boolean);
      console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
      
      if (allPassed) {
        console.log('🎉 Character creation is working correctly!');
        console.log('📋 Check Navigation UI to confirm Level: 1, XP: 0, Day: 1');
      } else {
        console.log('⚠️ Character creation has issues - check failed tests above');
      }
      
      // Check localStorage persistence
      console.log('\n6. 💾 PERSISTENCE CHECK:');
      const persistedData = localStorage.getItem('mmv-core-game-store');
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        console.log('Persisted store data:', {
          player: parsed.state?.player,
          character: parsed.state?.character,
          world: parsed.state?.world
        });
      } else {
        console.log('❌ No persisted data found in localStorage');
      }
    }, 100);
    
  } catch (error) {
    console.log('❌ Character creation failed:', error);
  }
} else {
  console.log('❌ Cannot test - missing store or function');
  if (!window.useCoreGameStore) console.log('  - useCoreGameStore not available');
  if (typeof createCharacterAtomically === 'undefined') console.log('  - createCharacterAtomically not available');
}

console.log('\n💡 NEXT STEPS:');
console.log('1. Run this script and check the validation results');
console.log('2. If tests pass, create a character through the UI');
console.log('3. Verify Navigation shows Level: 1, XP: 0, Day: 1');
console.log('4. If tests fail, check the error messages above');
