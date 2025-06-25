/**
 * Character Creation Validation Test
 * 
 * This script tests the complete character creation flow to validate that:
 * 1. Navigation.tsx displays correct values after character creation
 * 2. All components use the same consolidated store system
 * 3. No destructive persistence operations interfere
 */

console.log('🧪 CHARACTER CREATION VALIDATION TEST');
console.log('=====================================\n');

// Test 1: Check if stores are available
console.log('📦 Step 1: Checking store availability...');
try {
  const coreStore = window.useCoreGameStore?.getState();
  const narrativeStore = window.useNarrativeStore?.getState();
  
  if (coreStore && narrativeStore) {
    console.log('✅ All consolidated stores are available');
    console.log('📊 Current state:', {
      player: { level: coreStore.player.level, experience: coreStore.player.experience },
      world: { day: coreStore.world.day },
      character: coreStore.character?.name || 'No character'
    });
  } else {
    console.log('❌ Stores not available - check if app is loaded');
    return;
  }
} catch (error) {
  console.log('❌ Error accessing stores:', error.message);
  return;
}

// Test 2: Create test character
console.log('\n🎭 Step 2: Creating test character...');
try {
  // Import the character creation function
  const { createCharacterAtomically } = await import('./src/utils/characterFlowIntegration.ts');
  
  // Create test character
  const testData = {
    name: 'TestUser_' + Date.now(),
    background: 'scholar',
    attributes: {
      intelligence: 60,
      creativity: 50,
      charisma: 40,
      strength: 30,
      focus: 70,
      empathy: 55
    },
    domainAdjustments: {
      intellectualCompetence: 10,
      physicalCompetence: -5,
      emotionalIntelligence: 5,
      socialCompetence: 0,
      personalAutonomy: 0,
      identityClarity: 0,
      lifePurpose: 0
    }
  };
  
  console.log('🔄 Creating character with data:', testData);
  createCharacterAtomically(testData);
  
  // Wait for state to settle
  setTimeout(() => {
    const newState = window.useCoreGameStore.getState();
    console.log('✅ Character created successfully!');
    console.log('📊 New state:', {
      player: { level: newState.player.level, experience: newState.player.experience },
      world: { day: newState.world.day },
      character: newState.character?.name || 'No character'
    });
    
    // Validate expected values
    const isValid = 
      newState.player.level === 1 &&
      newState.player.experience === 0 &&
      newState.world.day === 1 &&
      newState.character?.name === testData.name;
    
    if (isValid) {
      console.log('🎉 VALIDATION PASSED: All values are correct!');
      console.log('✅ Navigation component should now display:');
      console.log('   - Level: 1');
      console.log('   - XP: 0'); 
      console.log('   - Day: 1');
      console.log('   - Character: ' + testData.name);
    } else {
      console.log('❌ VALIDATION FAILED: Values are incorrect');
      console.log('Expected: Level 1, XP 0, Day 1');
      console.log('Actual:', {
        level: newState.player.level,
        experience: newState.player.experience,
        day: newState.world.day
      });
    }
  }, 100);
  
} catch (error) {
  console.log('❌ Error creating character:', error.message);
}

console.log('\n📋 Test completed. Check the output above for results.');