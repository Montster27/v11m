// /Users/montysharma/V11M2/src/test/characterFlow/edgeCaseTests.ts
// Phase 6: Edge case testing for character flow refactoring

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { 
  createCharacterAtomically, 
  resetAllGameState, 
  validateCharacterCreationData 
} from '../../utils/characterFlowIntegration';
import {
  captureFlowState,
  validateCharacterCreationState,
  type FlowTestResult
} from './flowTestUtils';

/**
 * Test boundary value conditions
 */
export const testBoundaryValues = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Boundary Values...');
  
  const startTime = performance.now();
  
  try {
    const testCases = [
      {
        name: 'Minimum Valid Attributes',
        data: {
          name: 'Min Test',
          background: 'scholar',
          attributes: {
            intelligence: 1,
            creativity: 1,
            charisma: 1,
            strength: 1,
            focus: 1,
            empathy: 1
          },
          domainAdjustments: {}
        },
        shouldPass: true
      },
      {
        name: 'Maximum Valid Attributes',
        data: {
          name: 'Max Test',
          background: 'athlete',
          attributes: {
            intelligence: 100,
            creativity: 100,
            charisma: 100,
            strength: 100,
            focus: 100,
            empathy: 100
          },
          domainAdjustments: {}
        },
        shouldPass: true
      },
      {
        name: 'Maximum Domain Adjustments',
        data: {
          name: 'Max Domain Test',
          background: 'artist',
          attributes: { creativity: 75 },
          domainAdjustments: {
            intellectualCompetence: 15,
            physicalCompetence: 0,
            emotionalIntelligence: 0,
            socialCompetence: 0,
            personalAutonomy: 0,
            identityClarity: 0,
            lifePurpose: 0
          }
        },
        shouldPass: true
      },
      {
        name: 'Minimum Domain Adjustments',
        data: {
          name: 'Min Domain Test',
          background: 'social',
          attributes: { charisma: 80 },
          domainAdjustments: {
            intellectualCompetence: -15,
            physicalCompetence: 0,
            emotionalIntelligence: 0,
            socialCompetence: 0,
            personalAutonomy: 0,
            identityClarity: 0,
            lifePurpose: 0
          }
        },
        shouldPass: true
      }
    ];
    
    const results: any[] = [];
    
    for (const testCase of testCases) {
      resetAllGameState();
      
      try {
        // Validate data first
        const validation = validateCharacterCreationData(testCase.data);
        
        if (validation.valid === testCase.shouldPass) {
          if (testCase.shouldPass) {
            // Try to create character
            createCharacterAtomically(testCase.data);
            const state = captureFlowState();
            const stateValidation = validateCharacterCreationState(state);
            
            results.push({
              testCase: testCase.name,
              passed: stateValidation.passed,
              details: { validation, stateValidation }
            });
          } else {
            results.push({
              testCase: testCase.name,
              passed: true,
              details: { validation }
            });
          }
        } else {
          results.push({
            testCase: testCase.name,
            passed: false,
            details: { 
              validation, 
              expected: testCase.shouldPass,
              actual: validation.valid 
            }
          });
        }
      } catch (error) {
        results.push({
          testCase: testCase.name,
          passed: !testCase.shouldPass, // If it should pass but threw, it failed
          details: { error: error.message }
        });
      }
    }
    
    const allPassed = results.every(r => r.passed);
    
    return {
      testName: 'Boundary Values',
      success: allPassed,
      duration: performance.now() - startTime,
      details: { results }
    };
    
  } catch (error) {
    return {
      testName: 'Boundary Values',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test invalid input handling
 */
export const testInvalidInputHandling = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Invalid Input Handling...');
  
  const startTime = performance.now();
  
  try {
    const invalidCases = [
      {
        name: 'Empty Name',
        data: {
          name: '',
          background: 'scholar',
          attributes: { intelligence: 75 },
          domainAdjustments: {}
        }
      },
      {
        name: 'Null Name',
        data: {
          name: null,
          background: 'scholar',
          attributes: { intelligence: 75 },
          domainAdjustments: {}
        }
      },
      {
        name: 'Invalid Background',
        data: {
          name: 'Invalid Background Test',
          background: 'invalid_background',
          attributes: { intelligence: 75 },
          domainAdjustments: {}
        }
      },
      {
        name: 'Negative Attributes',
        data: {
          name: 'Negative Test',
          background: 'scholar',
          attributes: { intelligence: -50 },
          domainAdjustments: {}
        }
      },
      {
        name: 'Excessive Attributes',
        data: {
          name: 'Excessive Test',
          background: 'scholar',
          attributes: { intelligence: 150 },
          domainAdjustments: {}
        }
      },
      {
        name: 'Excessive Domain Adjustments',
        data: {
          name: 'Excessive Domain Test',
          background: 'scholar',
          attributes: { intelligence: 75 },
          domainAdjustments: {
            intellectualCompetence: 25, // Over limit
            physicalCompetence: 25,
            emotionalIntelligence: 25
          }
        }
      },
      {
        name: 'Missing Attributes',
        data: {
          name: 'Missing Attributes Test',
          background: 'scholar',
          attributes: {},
          domainAdjustments: {}
        }
      }
    ];
    
    const results: any[] = [];
    
    for (const testCase of invalidCases) {
      resetAllGameState();
      
      try {
        // This should either fail validation or throw an error
        const validation = validateCharacterCreationData(testCase.data as any);
        
        if (!validation.valid) {
          // Expected behavior - validation caught the issue
          results.push({
            testCase: testCase.name,
            passed: true,
            details: { validation, behavior: 'validation_caught' }
          });
        } else {
          // Validation passed but shouldn't have
          try {
            createCharacterAtomically(testCase.data as any);
            // If we get here, both validation and creation passed incorrectly
            results.push({
              testCase: testCase.name,
              passed: false,
              details: { 
                validation, 
                behavior: 'should_have_failed',
                issue: 'Both validation and creation passed invalid data'
              }
            });
          } catch (error) {
            // Creation threw an error (good fallback)
            results.push({
              testCase: testCase.name,
              passed: true,
              details: { 
                validation, 
                behavior: 'creation_caught',
                error: error.message
              }
            });
          }
        }
      } catch (error) {
        // Validation itself threw an error (acceptable for very invalid data)
        results.push({
          testCase: testCase.name,
          passed: true,
          details: { 
            behavior: 'validation_threw',
            error: error.message
          }
        });
      }
    }
    
    const allPassed = results.every(r => r.passed);
    
    return {
      testName: 'Invalid Input Handling',
      success: allPassed,
      duration: performance.now() - startTime,
      details: { results }
    };
    
  } catch (error) {
    return {
      testName: 'Invalid Input Handling',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test state corruption scenarios
 */
export const testStateCorruption = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing State Corruption Scenarios...');
  
  const startTime = performance.now();
  
  try {
    const scenarios = [
      {
        name: 'Partial Character State',
        setup: () => {
          const coreStore = useCoreGameStore.getState();
          coreStore.updateCharacter({ name: 'Partial Character' });
          // Don't set background or complete creation
        }
      },
      {
        name: 'Corrupted Player Stats',
        setup: () => {
          const coreStore = useCoreGameStore.getState();
          coreStore.updatePlayer({ 
            level: -1, 
            experience: NaN,
            resources: null as any
          });
        }
      },
      {
        name: 'Invalid Flag State',
        setup: () => {
          const narrativeStore = useNarrativeStore.getState();
          // Corrupt the flags object
          (narrativeStore as any).flags = null;
        }
      },
      {
        name: 'Corrupted Save Data',
        setup: () => {
          const socialStore = useSocialStore.getState();
          // Corrupt save slots
          (socialStore.saves as any).saveSlots = 'not_an_object';
        }
      }
    ];
    
    const results: any[] = [];
    
    for (const scenario of scenarios) {
      try {
        resetAllGameState();
        
        // Apply corruption
        scenario.setup();
        
        // Try to detect and recover
        const beforeRecovery = captureFlowState();
        
        // Reset should clean up corruption
        resetAllGameState();
        
        const afterRecovery = captureFlowState();
        
        // Verify recovery
        const recovered = 
          afterRecovery.core.character.name === '' &&
          afterRecovery.core.player.level === 1 &&
          afterRecovery.core.player.experience === 0 &&
          typeof afterRecovery.core.player.resources === 'object' &&
          afterRecovery.core.player.resources !== null;
        
        results.push({
          scenario: scenario.name,
          passed: recovered,
          details: { 
            recovered,
            beforeRecovery: beforeRecovery ? 'captured' : 'failed_to_capture',
            afterRecovery: afterRecovery ? 'captured' : 'failed_to_capture'
          }
        });
        
      } catch (error) {
        // Recovery from corruption may legitimately throw errors
        // Reset and check if we can continue
        try {
          resetAllGameState();
          const finalState = captureFlowState();
          const cleanAfterError = finalState.core.character.name === '';
          
          results.push({
            scenario: scenario.name,
            passed: cleanAfterError,
            details: { 
              recoveryError: error.message,
              cleanAfterError
            }
          });
        } catch (finalError) {
          results.push({
            scenario: scenario.name,
            passed: false,
            details: { 
              recoveryError: error.message,
              finalError: finalError.message
            }
          });
        }
      }
    }
    
    const allPassed = results.every(r => r.passed);
    
    return {
      testName: 'State Corruption',
      success: allPassed,
      duration: performance.now() - startTime,
      details: { results }
    };
    
  } catch (error) {
    return {
      testName: 'State Corruption',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test timing-related edge cases
 */
export const testTimingEdgeCases = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Timing Edge Cases...');
  
  const startTime = performance.now();
  
  try {
    const results: any[] = [];
    
    // Test 1: Rapid successive operations
    resetAllGameState();
    
    const rapidOps = [];
    for (let i = 0; i < 10; i++) {
      rapidOps.push(
        () => useCoreGameStore.getState().updatePlayer({ experience: i })
      );
    }
    
    // Execute all operations immediately
    rapidOps.forEach(op => op());
    
    // Check final state consistency
    const finalExp = useCoreGameStore.getState().player.experience;
    const rapidOpsWorked = finalExp === 9; // Should be the last value
    
    results.push({
      test: 'Rapid Operations',
      passed: rapidOpsWorked,
      details: { finalExperience: finalExp, expected: 9 }
    });
    
    // Test 2: Interleaved store updates
    resetAllGameState();
    
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();
    
    // Interleave updates across stores
    coreStore.updatePlayer({ experience: 10 });
    narrativeStore.setStoryletFlag('test1', true);
    coreStore.updateWorld({ day: 2 });
    socialStore.updateRelationship('npc1', 5);
    narrativeStore.setStoryletFlag('test2', false);
    coreStore.updatePlayer({ level: 2 });
    
    const state = captureFlowState();
    const interleavedWorked = 
      state.core.player.experience === 10 &&
      state.core.player.level === 2 &&
      state.core.world.day === 2 &&
      state.social.npcs.relationships['npc1'] === 5;
    
    // Check flags safely
    let flagsWorked = false;
    try {
      if (state.narrative.flags && state.narrative.flags.storylet) {
        if (state.narrative.flags.storylet instanceof Map) {
          flagsWorked = 
            state.narrative.flags.storylet.get('test1') === true &&
            state.narrative.flags.storylet.get('test2') === false;
        } else if (typeof state.narrative.flags.storylet === 'object') {
          flagsWorked = 
            state.narrative.flags.storylet['test1'] === true &&
            state.narrative.flags.storylet['test2'] === false;
        }
      }
    } catch (error) {
      console.warn('Could not check interleaved flags:', error);
    }
    
    results.push({
      test: 'Interleaved Updates',
      passed: interleavedWorked && flagsWorked,
      details: { 
        interleavedWorked, 
        flagsWorked,
        finalState: {
          experience: state.core.player.experience,
          level: state.core.player.level,
          day: state.core.world.day,
          npcRelation: state.social.npcs.relationships['npc1']
        }
      }
    });
    
    // Test 3: Reset during operations
    resetAllGameState();
    createCharacterAtomically({
      name: 'Reset Test',
      background: 'scholar',
      attributes: { intelligence: 80 },
      domainAdjustments: {}
    });
    
    // Start some operations
    coreStore.updatePlayer({ experience: 50 });
    narrativeStore.setStoryletFlag('mid_operation', true);
    
    // Reset in the middle
    resetAllGameState();
    
    const afterMidReset = captureFlowState();
    const resetDuringOpsWorked = 
      afterMidReset.core.character.name === '' &&
      afterMidReset.core.player.experience === 0 &&
      afterMidReset.core.player.level === 1;
    
    results.push({
      test: 'Reset During Operations',
      passed: resetDuringOpsWorked,
      details: { 
        resetDuringOpsWorked,
        finalState: {
          name: afterMidReset.core.character.name,
          experience: afterMidReset.core.player.experience,
          level: afterMidReset.core.player.level
        }
      }
    });
    
    const allPassed = results.every(r => r.passed);
    
    return {
      testName: 'Timing Edge Cases',
      success: allPassed,
      duration: performance.now() - startTime,
      details: { results }
    };
    
  } catch (error) {
    return {
      testName: 'Timing Edge Cases',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test browser-specific edge cases
 */
export const testBrowserEdgeCases = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Browser Edge Cases...');
  
  const startTime = performance.now();
  
  try {
    const results: any[] = [];
    
    // Test 1: localStorage availability
    const localStorageAvailable = (() => {
      try {
        const testKey = 'mmv_test_key';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch (error) {
        return false;
      }
    })();
    
    results.push({
      test: 'localStorage Available',
      passed: localStorageAvailable,
      details: { localStorageAvailable }
    });
    
    // Test 2: Performance API availability
    const performanceAPIAvailable = 
      typeof performance !== 'undefined' && 
      typeof performance.now === 'function';
    
    results.push({
      test: 'Performance API Available',
      passed: performanceAPIAvailable,
      details: { performanceAPIAvailable }
    });
    
    // Test 3: Console API availability
    const consoleAPIAvailable = 
      typeof console !== 'undefined' && 
      typeof console.log === 'function';
    
    results.push({
      test: 'Console API Available',
      passed: consoleAPIAvailable,
      details: { consoleAPIAvailable }
    });
    
    // Test 4: JSON serialization edge cases
    resetAllGameState();
    createCharacterAtomically({
      name: 'JSON Test',
      background: 'artist',
      attributes: { creativity: 85 },
      domainAdjustments: {}
    });
    
    try {
      const state = captureFlowState();
      const serialized = JSON.stringify(state);
      const deserialized = JSON.parse(serialized);
      
      const jsonWorked = 
        deserialized.core.character.name === 'JSON Test' &&
        deserialized.core.character.background === 'artist';
      
      results.push({
        test: 'JSON Serialization',
        passed: jsonWorked,
        details: { 
          jsonWorked,
          serializedLength: serialized.length,
          characterName: deserialized.core.character.name
        }
      });
      
    } catch (error) {
      results.push({
        test: 'JSON Serialization',
        passed: false,
        details: { error: error.message }
      });
    }
    
    // Test 5: Window object pollution check
    const windowBefore = Object.keys(window).length;
    
    // Our stores should add some globals
    const hasExpectedGlobals = 
      typeof (window as any).useCoreGameStore === 'function' &&
      typeof (window as any).useNarrativeStore === 'function' &&
      typeof (window as any).useSocialStore === 'function';
    
    const windowAfter = Object.keys(window).length;
    
    results.push({
      test: 'Window Object Management',
      passed: hasExpectedGlobals,
      details: { 
        hasExpectedGlobals,
        windowKeysBefore: windowBefore,
        windowKeysAfter: windowAfter,
        additionalKeys: windowAfter - windowBefore
      }
    });
    
    const allPassed = results.every(r => r.passed);
    
    return {
      testName: 'Browser Edge Cases',
      success: allPassed,
      duration: performance.now() - startTime,
      details: { results }
    };
    
  } catch (error) {
    return {
      testName: 'Browser Edge Cases',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Run all edge case tests
 */
export const runAllEdgeCaseTests = async (): Promise<FlowTestResult[]> => {
  console.log('🧪 Running Complete Edge Case test suite...');
  
  const tests = [
    testBoundaryValues,
    testInvalidInputHandling,
    testStateCorruption,
    testTimingEdgeCases,
    testBrowserEdgeCases
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
  
  console.log(`\n🧪 Edge Case test suite complete: ${passedTests}/${totalTests} tests passed`);
  
  return results;
};

// Browser console access for development
if (typeof window !== 'undefined') {
  (window as any).testBoundaryValues = testBoundaryValues;
  (window as any).testInvalidInputHandling = testInvalidInputHandling;
  (window as any).testStateCorruption = testStateCorruption;
  (window as any).testTimingEdgeCases = testTimingEdgeCases;
  (window as any).testBrowserEdgeCases = testBrowserEdgeCases;
  (window as any).runAllEdgeCaseTests = runAllEdgeCaseTests;
  
  console.log('🧪 Edge Case Test Suite loaded');
  console.log('   testBoundaryValues() - Boundary value testing');
  console.log('   testInvalidInputHandling() - Invalid input validation');
  console.log('   testStateCorruption() - State corruption recovery');
  console.log('   testTimingEdgeCases() - Timing-related edge cases');
  console.log('   testBrowserEdgeCases() - Browser-specific issues');
  console.log('   runAllEdgeCaseTests() - Run complete suite');
}