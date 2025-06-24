// /Users/montysharma/V11M2/src/test/characterFlow/quickFixValidation.ts
// Quick validation to test the recent fixes

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';

/**
 * Test the specific fixes we just made
 */
export const testRecentFixes = () => {
  console.log('🔧 Testing Recent Fixes...');
  console.log('===========================\n');
  
  try {
    const results: any[] = [];
    
    // Test 1: Save error recovery (should not crash)
    console.log('1️⃣ Testing save error recovery...');
    resetAllGameState();
    const socialStore = useSocialStore.getState();
    
    // Create a valid save first
    const validSaveId = 'test_valid_' + Date.now();
    socialStore.createSaveSlot(validSaveId, {
      name: 'Valid Save',
      characterName: 'Test Character',
      gameDay: 1,
      playerLevel: 1
    });
    
    const beforeError = socialStore.saves.currentSaveId;
    console.log('   Current save before error:', beforeError);
    
    // Try to load non-existent save (should handle gracefully)
    const originalConsoleError = console.error;
    console.error = () => {}; // Temporarily suppress error logging
    
    try {
      socialStore.loadSaveSlot('definitely_does_not_exist');
    } catch (error) {
      console.log('   Load error caught:', error.message);
    } finally {
      console.error = originalConsoleError; // Restore console.error
    }
    
    const afterError = socialStore.saves.currentSaveId;
    console.log('   Current save after error:', afterError);
    
    const saveErrorFixed = afterError === beforeError || afterError === validSaveId;
    results.push({ test: 'Save Error Recovery', passed: saveErrorFixed });
    
    // Cleanup
    socialStore.deleteSaveSlot(validSaveId);
    
    // Test 2: Cross-store consistency with defensive programming
    console.log('\n2️⃣ Testing cross-store consistency...');
    resetAllGameState();
    
    createCharacterAtomically({
      name: 'Consistency Test',
      background: 'scholar',
      attributes: { intelligence: 80 },
      domainAdjustments: {}
    });
    
    const testSaveId = 'consistency_test_' + Date.now();
    socialStore.createSaveSlot(testSaveId, {
      name: 'Consistency Test Save',
      characterName: 'Consistency Test',
      gameDay: 1,
      playerLevel: 1
    });
    
    const saveData = socialStore.saves.saveSlots[testSaveId];
    const saveDataExists = saveData !== undefined && saveData !== null;
    console.log('   Save data exists:', saveDataExists);
    console.log('   Save data:', saveData ? {
      name: saveData.name,
      characterName: saveData.characterName
    } : 'null');
    
    results.push({ test: 'Save Data Creation', passed: saveDataExists });
    
    // Cleanup
    if (saveDataExists) {
      socialStore.deleteSaveSlot(testSaveId);
    }
    
    // Test 3: Architectural validation
    console.log('\n3️⃣ Testing architectural validation...');
    
    let architecturalTestPassed = false;
    try {
      const coreStore = useCoreGameStore.getState();
      const narrativeStore = useNarrativeStore.getState();
      const socialStoreState = useSocialStore.getState();
      
      const hasCorrectStructure = 
        coreStore.player && coreStore.character && coreStore.world &&
        narrativeStore.storylets && narrativeStore.flags &&
        socialStoreState.npcs && socialStoreState.clues && socialStoreState.saves;
        
      architecturalTestPassed = hasCorrectStructure;
      console.log('   Architectural structure valid:', architecturalTestPassed);
      
    } catch (error) {
      console.log('   Architectural test error:', error.message);
    }
    
    results.push({ test: 'Architectural Validation', passed: architecturalTestPassed });
    
    // Summary
    console.log('\n📊 SUMMARY');
    console.log('==========');
    
    results.forEach(result => {
      console.log(`   ${result.passed ? '✅' : '❌'} ${result.test}: ${result.passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = results.every(r => r.passed);
    console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL FIXES WORKING' : 'SOME ISSUES REMAIN'}`);
    
    if (allPassed) {
      console.log('\n✅ The error fixes have been successfully applied!');
      console.log('   You can now run generateSuccessReport() safely.');
    } else {
      console.log('\n⚠️ Some issues remain. Check the failed tests above.');
    }
    
    return {
      allPassed,
      results,
      message: allPassed ? 'All fixes working correctly' : 'Some issues remain'
    };
    
  } catch (error) {
    console.error('❌ Fix validation failed:', error);
    return {
      allPassed: false,
      results: [],
      error: error.message
    };
  }
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).testRecentFixes = testRecentFixes;
  
  console.log('🔧 Quick Fix Validation loaded');
  console.log('   testRecentFixes() - Test the recent error fixes');
}