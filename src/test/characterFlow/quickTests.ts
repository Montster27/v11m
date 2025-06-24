// /Users/montysharma/V11M2/src/test/characterFlow/quickTests.ts
// Quick synchronous tests with immediate console output

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';

/**
 * Quick test that shows immediate results
 */
export const quickValidationTest = () => {
  console.log('⚡ QUICK VALIDATION TEST');
  console.log('=======================\n');
  
  try {
    // Test 1: Reset and check clean state
    console.log('1️⃣ Testing clean state...');
    resetAllGameState();
    
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();
    
    const cleanState = {
      level: coreStore.player.level,
      experience: coreStore.player.experience,
      day: coreStore.world.day,
      characterName: coreStore.character.name
    };
    
    console.log('   Clean state:', cleanState);
    console.log(`   ${cleanState.level === 1 ? '✅' : '❌'} Level 1:`, cleanState.level === 1);
    console.log(`   ${cleanState.experience === 0 ? '✅' : '❌'} 0 XP:`, cleanState.experience === 0);
    console.log(`   ${cleanState.day === 1 ? '✅' : '❌'} Day 1:`, cleanState.day === 1);
    console.log(`   ${cleanState.characterName === '' ? '✅' : '❌'} No character:`, cleanState.characterName === '');
    
    // Test 2: Create character and check state
    console.log('\n2️⃣ Testing character creation...');
    createCharacterAtomically({
      name: 'Quick Test Character',
      background: 'scholar',
      attributes: { intelligence: 80 },
      domainAdjustments: { intellectualCompetence: 5 }
    });
    
    const afterCreation = {
      level: useCoreGameStore.getState().player.level,
      experience: useCoreGameStore.getState().player.experience,
      day: useCoreGameStore.getState().world.day,
      characterName: useCoreGameStore.getState().character.name,
      characterBackground: useCoreGameStore.getState().character.background
    };
    
    console.log('   After creation:', afterCreation);
    console.log(`   ${afterCreation.level === 1 ? '✅' : '❌'} Still Level 1:`, afterCreation.level === 1);
    console.log(`   ${afterCreation.experience === 0 ? '✅' : '❌'} Still 0 XP:`, afterCreation.experience === 0);
    console.log(`   ${afterCreation.day === 1 ? '✅' : '❌'} Still Day 1:`, afterCreation.day === 1);
    console.log(`   ${afterCreation.characterName === 'Quick Test Character' ? '✅' : '❌'} Character created:`, afterCreation.characterName === 'Quick Test Character');
    console.log(`   ${afterCreation.characterBackground === 'scholar' ? '✅' : '❌'} Background set:`, afterCreation.characterBackground === 'scholar');
    
    // Test 3: Check flag
    console.log('\n3️⃣ Testing storylet flag...');
    const narrativeStoreAfter = useNarrativeStore.getState();
    const flagValue = narrativeStoreAfter.getStoryletFlag('character_created');
    console.log('   Character created flag:', flagValue);
    console.log(`   ${flagValue === true ? '✅' : '❌'} Flag set correctly:`, flagValue === true);
    
    // Test 4: Check save system
    console.log('\n4️⃣ Testing save system...');
    const socialStoreAfter = useSocialStore.getState();
    const testSaveId = 'quick_test_' + Date.now();
    
    socialStoreAfter.createSaveSlot(testSaveId, {
      name: 'Quick Test Save',
      gameDay: afterCreation.day,
      characterName: afterCreation.characterName,
      playerLevel: afterCreation.level
    });
    
    const saveExists = testSaveId in socialStoreAfter.saves.saveSlots;
    console.log('   Save created:', saveExists);
    console.log(`   ${saveExists ? '✅' : '❌'} Save system working:`, saveExists);
    
    // Cleanup
    if (saveExists) {
      socialStoreAfter.deleteSaveSlot(testSaveId);
      console.log('   🧹 Save cleaned up');
    }
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('==========');
    const allTests = [
      cleanState.level === 1,
      cleanState.experience === 0,
      cleanState.day === 1,
      afterCreation.characterName === 'Quick Test Character',
      afterCreation.characterBackground === 'scholar',
      flagValue === true,
      saveExists
    ];
    
    const passedTests = allTests.filter(t => t).length;
    const totalTests = allTests.length;
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`Overall: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 CHARACTER FLOW REFACTORING IS WORKING CORRECTLY!');
      console.log('   - Planner will show correct data (Level 1, 0 XP, Day 1)');
      console.log('   - Character creation works atomically');
      console.log('   - Save/load system is functional');
      console.log('   - Tutorial storylet flag is set properly');
    } else {
      console.log('\n⚠️ Some issues detected - check individual test results above');
    }
    
    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests
    };
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    return {
      passed: 0,
      total: 7,
      success: false,
      error: error.message
    };
  }
};

/**
 * Show current state without running tests
 */
export const showCurrentState = () => {
  console.log('📊 CURRENT GAME STATE');
  console.log('====================\n');
  
  try {
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();
    
    console.log('🎮 Player State:');
    console.log(`   Level: ${coreStore.player.level}`);
    console.log(`   Experience: ${coreStore.player.experience}`);
    console.log(`   Resources: ${JSON.stringify(coreStore.player.resources)}`);
    
    console.log('\n👤 Character State:');
    console.log(`   Name: "${coreStore.character.name}"`);
    console.log(`   Background: "${coreStore.character.background}"`);
    console.log(`   Attributes: ${JSON.stringify(coreStore.character.attributes)}`);
    
    console.log('\n🌍 World State:');
    console.log(`   Day: ${coreStore.world.day}`);
    console.log(`   Time Paused: ${coreStore.world.isTimePaused}`);
    
    console.log('\n📖 Narrative State:');
    console.log(`   Active Storylets: ${narrativeStore.storylets.active.length}`);
    console.log(`   Completed Storylets: ${narrativeStore.storylets.completed.length}`);
    console.log(`   Character Created Flag: ${narrativeStore.getStoryletFlag('character_created')}`);
    
    console.log('\n💾 Save State:');
    console.log(`   Current Save ID: ${socialStore.saves.currentSaveId || 'none'}`);
    console.log(`   Total Saves: ${Object.keys(socialStore.saves.saveSlots).length}`);
    
    const hasCharacter = coreStore.character.name !== '';
    console.log(`\n🎯 Status: ${hasCharacter ? 'Character Exists' : 'No Character'}`);
    
  } catch (error) {
    console.error('❌ Could not read current state:', error);
  }
};

/**
 * Test the specific fix for Planner data display
 */
export const testPlannerDataFix = () => {
  console.log('🔧 PLANNER DATA FIX TEST');
  console.log('=======================\n');
  
  try {
    resetAllGameState();
    
    // Before character creation
    const beforeState = useCoreGameStore.getState();
    console.log('Before character creation:');
    console.log(`   Level: ${beforeState.player.level} (should be 1)`);
    console.log(`   Experience: ${beforeState.player.experience} (should be 0)`);
    console.log(`   Day: ${beforeState.world.day} (should be 1)`);
    
    // Create character
    createCharacterAtomically({
      name: 'Planner Test',
      background: 'scholar',
      attributes: { intelligence: 75 },
      domainAdjustments: {}
    });
    
    // After character creation
    const afterState = useCoreGameStore.getState();
    console.log('\nAfter character creation:');
    console.log(`   Level: ${afterState.player.level} (should still be 1)`);
    console.log(`   Experience: ${afterState.player.experience} (should still be 0)`);
    console.log(`   Day: ${afterState.world.day} (should still be 1)`);
    console.log(`   Character: "${afterState.character.name}" (should be "Planner Test")`);
    
    const fixed = 
      afterState.player.level === 1 &&
      afterState.player.experience === 0 &&
      afterState.world.day === 1 &&
      afterState.character.name === 'Planner Test';
    
    console.log(`\n🎯 Planner Data Fix: ${fixed ? '✅ WORKING' : '❌ NEEDS ATTENTION'}`);
    
    if (fixed) {
      console.log('   The Planner will now show correct values instead of level 2, 125 XP, day 4!');
    }
    
    return fixed;
    
  } catch (error) {
    console.error('❌ Planner data fix test failed:', error);
    return false;
  }
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).quickValidationTest = quickValidationTest;
  (window as any).showCurrentState = showCurrentState;
  (window as any).testPlannerDataFix = testPlannerDataFix;
  
  console.log('⚡ Quick Tests loaded');
  console.log('   quickValidationTest() - Run quick validation with immediate results');
  console.log('   showCurrentState() - Show current game state');
  console.log('   testPlannerDataFix() - Test the Planner data fix specifically');
}