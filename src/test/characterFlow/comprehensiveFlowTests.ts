// /Users/montysharma/V11M2/src/test/characterFlow/comprehensiveFlowTests.ts
// Phase 6: Comprehensive flow tests for complete character creation workflow

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';
import {
  captureFlowState,
  validateCharacterCreationState,
  validateStoreIntegrity,
  createMockCharacterData,
  type FlowTestResult
} from './flowTestUtils';

/**
 * Test complete end-to-end character flow
 */
export const testCompleteCharacterFlow = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Complete Character Flow...');
  
  const startTime = performance.now();
  
  try {
    // Step 1: Start from clean state (SplashScreen)
    resetAllGameState();
    const splashState = captureFlowState();
    
    // Verify clean splash state
    const cleanState = 
      splashState.core.player.level === 1 &&
      splashState.core.player.experience === 0 &&
      splashState.core.world.day === 1 &&
      splashState.core.character.name === '';
    
    if (!cleanState) {
      throw new Error('Initial splash state is not clean');
    }
    
    // Step 2: Navigate to character creation
    // (No state changes expected at navigation)
    const preCreationState = captureFlowState();
    
    // Step 3: Create character atomically
    const characterData = {
      name: 'Complete Flow Test',
      background: 'scholar',
      attributes: {
        intelligence: 85,
        creativity: 65,
        charisma: 55,
        strength: 45,
        focus: 75,
        empathy: 70
      },
      domainAdjustments: {
        intellectualCompetence: 10,
        physicalCompetence: -5,
        emotionalIntelligence: 5,
        socialCompetence: 0,
        personalAutonomy: 0,
        identityClarity: -5,
        lifePurpose: -5
      }
    };
    
    createCharacterAtomically(characterData);
    const postCreationState = captureFlowState();
    
    // Step 4: Validate character creation
    const creationValidation = validateCharacterCreationState(postCreationState);
    
    // Step 5: Check character_created flag for tutorial storylet
    let tutorialFlag = false;
    try {
      if (postCreationState.narrative.flags && postCreationState.narrative.flags.storylet) {
        if (postCreationState.narrative.flags.storylet instanceof Map) {
          tutorialFlag = postCreationState.narrative.flags.storylet.get('character_created') === true;
        } else if (typeof postCreationState.narrative.flags.storylet === 'object') {
          tutorialFlag = postCreationState.narrative.flags.storylet['character_created'] === true;
        }
      }
    } catch (error) {
      console.warn('Could not check tutorial flag:', error);
    }
    
    // Step 6: Navigate to Planner
    // (Character data should remain intact)
    const plannerState = captureFlowState();
    
    // Step 7: Verify Planner displays correct data
    const plannerDataCorrect = 
      plannerState.core.character.name === characterData.name &&
      plannerState.core.character.background === characterData.background &&
      plannerState.core.player.level === 1 &&
      plannerState.core.player.experience === 0 &&
      plannerState.core.world.day === 1;
    
    // Step 8: Test save functionality
    const socialStore = useSocialStore.getState();
    const testSaveId = 'complete_flow_test_' + Date.now();
    
    socialStore.createSaveSlot(testSaveId, {
      name: 'Complete Flow Test Save',
      gameDay: plannerState.core.world.day,
      characterName: plannerState.core.character.name,
      playerLevel: plannerState.core.player.level
    });
    
    const saveCreated = testSaveId in socialStore.saves.saveSlots;
    
    // Step 9: Final integrity check
    const finalIntegrity = validateStoreIntegrity(plannerState);
    
    // Cleanup
    if (saveCreated) {
      socialStore.deleteSaveSlot(testSaveId);
    }
    
    // Calculate overall success
    const success = 
      cleanState &&
      creationValidation.passed &&
      tutorialFlag &&
      plannerDataCorrect &&
      saveCreated &&
      finalIntegrity.passed;
    
    return {
      testName: 'Complete Character Flow',
      success,
      duration: performance.now() - startTime,
      details: {
        splashStateClean: cleanState,
        characterCreated: creationValidation.passed,
        tutorialFlagSet: tutorialFlag,
        plannerDataCorrect,
        saveSystemWorking: saveCreated,
        finalIntegrityPassed: finalIntegrity.passed,
        stepResults: {
          splash: cleanState,
          creation: creationValidation.passed,
          tutorial: tutorialFlag,
          planner: plannerDataCorrect,
          save: saveCreated,
          integrity: finalIntegrity.passed
        }
      }
    };
    
  } catch (error) {
    return {
      testName: 'Complete Character Flow',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test error recovery and edge cases
 */
export const testErrorRecoveryFlow = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Error Recovery Flow...');
  
  const startTime = performance.now();
  
  try {
    const results: any[] = [];
    
    // Test 1: Recovery from partial character creation
    resetAllGameState();
    
    // Simulate partial state corruption
    const coreStore = useCoreGameStore.getState();
    coreStore.updateCharacter({ name: 'Partial Character' });
    // Don't set background or complete creation
    
    const partialState = captureFlowState();
    const hasPartialCharacter = partialState.core.character.name !== '' && partialState.core.character.background === '';
    
    // Reset should clean this up
    resetAllGameState();
    const cleanedState = captureFlowState();
    const cleanedCorrectly = cleanedState.core.character.name === '' && cleanedState.core.character.background === '';
    
    results.push({
      test: 'Partial Character Recovery',
      passed: hasPartialCharacter && cleanedCorrectly
    });
    
    // Test 2: Duplicate character creation attempts
    resetAllGameState();
    const testData = {
      name: 'Duplicate Test',
      background: 'artist',
      attributes: { creativity: 80 },
      domainAdjustments: {}
    };
    
    createCharacterAtomically(testData);
    const firstCreation = captureFlowState();
    
    // Try to create another character (should not corrupt state)
    try {
      createCharacterAtomically({
        name: 'Second Character',
        background: 'athlete',
        attributes: { strength: 90 },
        domainAdjustments: {}
      });
    } catch (error) {
      // Expected behavior: should prevent duplicate creation
    }
    
    const afterDuplicate = captureFlowState();
    const duplicatePreventedCorrectly = 
      afterDuplicate.core.character.name === firstCreation.core.character.name &&
      afterDuplicate.core.character.background === firstCreation.core.character.background;
    
    results.push({
      test: 'Duplicate Creation Prevention',
      passed: duplicatePreventedCorrectly
    });
    
    // Test 3: Save system error recovery
    resetAllGameState();
    const socialStore = useSocialStore.getState();
    
    // Create valid save
    const validSaveId = 'valid_save_' + Date.now();
    socialStore.createSaveSlot(validSaveId, {
      name: 'Valid Save',
      gameDay: 1,
      characterName: '',
      playerLevel: 1
    });
    
    // Try to load non-existent save (suppress console errors for clean test output)
    const originalConsoleError = console.error;
    console.error = () => {}; // Temporarily suppress error logging for this test
    
    try {
      socialStore.loadSaveSlot('non_existent_save');
    } catch (error) {
      // Expected behavior - non-existent save should be handled gracefully
    } finally {
      console.error = originalConsoleError; // Restore console.error
    }
    
    const currentSaveAfterError = socialStore.saves.currentSaveId;
    
    // Should still have valid save as current (or null if load failed gracefully)
    const saveErrorRecovered = currentSaveAfterError === validSaveId || currentSaveAfterError === null;
    
    // Cleanup
    socialStore.deleteSaveSlot(validSaveId);
    
    results.push({
      test: 'Save Error Recovery',
      passed: saveErrorRecovered
    });
    
    const allPassed = results.every(r => r.passed);
    
    return {
      testName: 'Error Recovery Flow',
      success: allPassed,
      duration: performance.now() - startTime,
      details: {
        results,
        allTestsPassed: allPassed
      }
    };
    
  } catch (error) {
    return {
      testName: 'Error Recovery Flow',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test concurrent operations and race conditions
 */
export const testConcurrentOperations = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Concurrent Operations...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    
    // Test rapid successive operations
    const operations = [
      () => useCoreGameStore.getState().updatePlayer({ experience: 10 }),
      () => useNarrativeStore.getState().setStoryletFlag('test_flag_1', true),
      () => useSocialStore.getState().updateRelationship('test_npc', 1),
      () => useCoreGameStore.getState().updateWorld({ day: 2 }),
      () => useNarrativeStore.getState().setStoryletFlag('test_flag_2', false),
    ];
    
    // Execute operations rapidly
    operations.forEach(op => op());
    
    // Allow state to settle
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const finalState = captureFlowState();
    
    // Check that all operations completed without corruption
    const operationsCompleted = 
      finalState.core.player.experience === 10 &&
      finalState.core.world.day === 2 &&
      finalState.social.npcs.relationships['test_npc'] === 1;
    
    // Check flags using safe access
    let flagsSet = false;
    try {
      if (finalState.narrative.flags && finalState.narrative.flags.storylet) {
        if (finalState.narrative.flags.storylet instanceof Map) {
          flagsSet = 
            finalState.narrative.flags.storylet.get('test_flag_1') === true &&
            finalState.narrative.flags.storylet.get('test_flag_2') === false;
        } else if (typeof finalState.narrative.flags.storylet === 'object') {
          flagsSet = 
            finalState.narrative.flags.storylet['test_flag_1'] === true &&
            finalState.narrative.flags.storylet['test_flag_2'] === false;
        }
      }
    } catch (error) {
      console.warn('Could not check concurrent flags:', error);
    }
    
    const success = operationsCompleted && flagsSet;
    
    return {
      testName: 'Concurrent Operations',
      success,
      duration: performance.now() - startTime,
      details: {
        operationsCompleted,
        flagsSet,
        finalState: {
          experience: finalState.core.player.experience,
          day: finalState.core.world.day,
          npcRelationship: finalState.social.npcs.relationships['test_npc']
        }
      }
    };
    
  } catch (error) {
    return {
      testName: 'Concurrent Operations',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test cross-store data consistency
 */
export const testCrossStoreConsistency = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Cross-Store Consistency...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    
    // Create character to establish baseline
    createCharacterAtomically({
      name: 'Consistency Test',
      background: 'scholar',
      attributes: { intelligence: 80 },
      domainAdjustments: { intellectualCompetence: 5 }
    });
    
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();
    
    // Test 1: Character name consistency
    const characterName = coreStore.character.name;
    
    // Save should reflect character name
    const testSaveId = 'consistency_test_' + Date.now();
    socialStore.createSaveSlot(testSaveId, {
      name: 'Consistency Test Save',
      characterName: characterName,
      gameDay: coreStore.world.day,
      playerLevel: coreStore.player.level
    });
    
    const saveData = socialStore.saves.saveSlots[testSaveId];
    const nameConsistency = saveData && saveData.characterName === characterName;
    
    // Test 2: Level/day consistency
    const dayConsistency = saveData && saveData.gameDay === coreStore.world.day;
    const levelConsistency = saveData && saveData.playerLevel === coreStore.player.level;
    
    // Test 3: Story flag consistency with character creation
    let flagConsistency = false;
    try {
      if (narrativeStore.flags && narrativeStore.flags.storylet) {
        if (narrativeStore.flags.storylet instanceof Map) {
          flagConsistency = narrativeStore.flags.storylet.get('character_created') === true;
        } else if (typeof narrativeStore.flags.storylet === 'object') {
          flagConsistency = narrativeStore.flags.storylet['character_created'] === true;
        }
      }
    } catch (error) {
      console.warn('Could not check flag consistency:', error);
    }
    
    // Test 4: Resource initialization consistency
    const resourcesInitialized = typeof coreStore.player.resources === 'object' &&
                                 Object.keys(coreStore.player.resources).length > 0;
    
    // Cleanup
    socialStore.deleteSaveSlot(testSaveId);
    
    const success = nameConsistency && dayConsistency && levelConsistency && 
                   flagConsistency && resourcesInitialized;
    
    return {
      testName: 'Cross-Store Consistency',
      success,
      duration: performance.now() - startTime,
      details: {
        nameConsistency,
        dayConsistency,
        levelConsistency,
        flagConsistency,
        resourcesInitialized,
        characterName,
        saveData: saveData ? {
          name: saveData.name,
          characterName: saveData.characterName,
          gameDay: saveData.gameDay,
          playerLevel: saveData.playerLevel
        } : null
      }
    };
    
  } catch (error) {
    return {
      testName: 'Cross-Store Consistency',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Run all comprehensive flow tests
 */
export const runAllComprehensiveFlowTests = async (): Promise<FlowTestResult[]> => {
  console.log('🧪 Running Complete Comprehensive Flow test suite...');
  
  const tests = [
    testCompleteCharacterFlow,
    testErrorRecoveryFlow,
    testConcurrentOperations,
    testCrossStoreConsistency
  ];
  
  const results: FlowTestResult[] = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      console.log(`${result.success ? '✅' : '❌'} ${result.testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
      
      if (!result.success && result.errors) {
        console.error(`   Errors: ${result.errors.join(', ')}`);
      }
      
    } catch (error) {
      results.push({
        testName: 'Unknown Test',
        success: false,
        duration: 0,
        details: { error: error.message },
        errors: [error.message]
      });
    }
  }
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n🧪 Comprehensive Flow test suite complete: ${passedTests}/${totalTests} tests passed`);
  
  return results;
};

// Browser console access for development
if (typeof window !== 'undefined') {
  (window as any).testCompleteCharacterFlow = testCompleteCharacterFlow;
  (window as any).testErrorRecoveryFlow = testErrorRecoveryFlow;
  (window as any).testConcurrentOperations = testConcurrentOperations;
  (window as any).testCrossStoreConsistency = testCrossStoreConsistency;
  (window as any).runAllComprehensiveFlowTests = runAllComprehensiveFlowTests;
  
  console.log('🧪 Comprehensive Flow Test Suite loaded');
  console.log('   testCompleteCharacterFlow() - End-to-end flow test');
  console.log('   testErrorRecoveryFlow() - Error recovery and edge cases');
  console.log('   testConcurrentOperations() - Race condition testing');
  console.log('   testCrossStoreConsistency() - Cross-store data validation');
  console.log('   runAllComprehensiveFlowTests() - Run complete suite');
}