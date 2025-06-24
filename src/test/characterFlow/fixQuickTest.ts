// /Users/montysharma/V11M2/src/test/characterFlow/fixQuickTest.ts
// Fix for the quick validation test

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';

/**
 * Debug the exact test that's failing
 */
export const debugQuickTest = () => {
  console.log('🐛 DEBUGGING QUICK TEST');
  console.log('=======================\n');
  
  try {
    // Reset and check clean state
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
    
    console.log('📊 Clean State Values:');
    console.log('   level:', cleanState.level, '(should be 1)');
    console.log('   experience:', cleanState.experience, '(should be 0)');
    console.log('   day:', cleanState.day, '(should be 1)');
    console.log('   characterName:', `"${cleanState.characterName}"`, `(should be "")`);
    console.log('   characterName length:', cleanState.characterName.length);
    console.log('   characterName === "":', cleanState.characterName === '');
    console.log('   typeof characterName:', typeof cleanState.characterName);
    
    // Check if character name has whitespace or hidden characters
    if (cleanState.characterName !== '') {
      console.log('   ⚠️ Character name is not empty!');
      console.log('   Character name bytes:', Array.from(cleanState.characterName).map(c => c.charCodeAt(0)));
    }
    
    // Create character
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
    
    console.log('\n📊 After Creation Values:');
    console.log('   level:', afterCreation.level, '(should be 1)');
    console.log('   experience:', afterCreation.experience, '(should be 0)');
    console.log('   day:', afterCreation.day, '(should be 1)');
    console.log('   characterName:', `"${afterCreation.characterName}"`, '(should be "Quick Test Character")');
    console.log('   background:', `"${afterCreation.characterBackground}"`, '(should be "scholar")');
    
    // Check flag
    const flagValue = useNarrativeStore.getState().getStoryletFlag('character_created');
    console.log('\n🚩 Flag Check:');
    console.log('   character_created flag:', flagValue, '(should be true)');
    console.log('   typeof flag:', typeof flagValue);
    
    // Test save
    const testSaveId = 'debug_test_' + Date.now();
    const socialStoreAfter = useSocialStore.getState();
    socialStoreAfter.createSaveSlot(testSaveId, {
      name: 'Debug Test Save',
      gameDay: afterCreation.day,
      characterName: afterCreation.characterName,
      playerLevel: afterCreation.level
    });
    
    const saveExists = testSaveId in socialStoreAfter.saves.saveSlots;
    console.log('\n💾 Save Check:');
    console.log('   Save exists:', saveExists, '(should be true)');
    
    if (saveExists) {
      socialStoreAfter.deleteSaveSlot(testSaveId);
    }
    
    // Now count the exact tests from quickValidationTest
    console.log('\n📋 Test Array (as counted in quickValidationTest):');
    const allTests = [
      cleanState.level === 1,
      cleanState.experience === 0,
      cleanState.day === 1,
      cleanState.characterName === '',  // This might be the failing one
      afterCreation.characterName === 'Quick Test Character',
      afterCreation.characterBackground === 'scholar',
      flagValue === true,
      saveExists
    ];
    
    console.log('   Test results:', allTests.map((t, i) => `[${i}]: ${t}`));
    console.log('   Passed:', allTests.filter(t => t).length);
    console.log('   Total:', allTests.length);
    
    // Find failing test
    const failingTests = allTests.map((result, index) => ({ index, result }))
                                  .filter(t => !t.result);
    
    if (failingTests.length > 0) {
      console.log('\n❌ FAILING TESTS:');
      failingTests.forEach(t => {
        const testNames = [
          'Clean state - Level === 1',
          'Clean state - Experience === 0',
          'Clean state - Day === 1',
          'Clean state - Character name === ""',
          'After creation - Character name === "Quick Test Character"',
          'After creation - Background === "scholar"',
          'Flag - character_created === true',
          'Save - Save exists'
        ];
        console.log(`   Test ${t.index}: ${testNames[t.index]}`);
      });
    }
    
    return {
      cleanState,
      afterCreation,
      flagValue,
      saveExists,
      testResults: allTests,
      passed: allTests.filter(t => t).length,
      total: allTests.length
    };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return { error: error.message };
  }
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).debugQuickTest = debugQuickTest;
  
  console.log('🐛 Quick Test Debugger loaded');
  console.log('   debugQuickTest() - Debug the failing quick test');
}