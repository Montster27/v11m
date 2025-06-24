// /Users/montysharma/V11M2/src/test/characterFlow/plannerIntegrationTests.ts
// Test suite for Planner integration with consolidated stores

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';
import {
  captureFlowState,
  validateCharacterCreationState,
  validateStoreIntegrity,
  type FlowTestResult
} from './flowTestUtils';

/**
 * Test Planner displays correct data from consolidated stores
 */
export const testPlannerDataDisplay = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Planner Data Display...');
  
  const startTime = performance.now();
  
  try {
    // Start with clean state
    resetAllGameState();
    
    // Create a character to ensure data exists
    createCharacterAtomically({
      name: 'Planner Test Character',
      background: 'scholar',
      attributes: { intelligence: 80 },
      domainAdjustments: { intellectualCompetence: 10 }
    });
    
    const state = captureFlowState();
    
    // Test that Planner would receive correct data
    const plannerData = {
      userLevel: state.core.player.level,
      experience: state.core.player.experience,
      day: state.core.world.day,
      characterName: state.core.character.name,
      characterBackground: state.core.character.background,
      resources: state.core.player.resources,
      storyletFlag: (() => {
        try {
          if (state.narrative.flags && state.narrative.flags.storylet) {
            if (state.narrative.flags.storylet instanceof Map) {
              return state.narrative.flags.storylet.get('character_created');
            } else if (typeof state.narrative.flags.storylet === 'object') {
              return state.narrative.flags.storylet['character_created'];
            }
          }
        } catch (error) {
          console.warn('Could not access character_created flag:', error);
        }
        return false;
      })()
    };
    
    // Verify correct initial values
    const correctData = 
      plannerData.userLevel === 1 &&
      plannerData.experience === 0 &&
      plannerData.day === 1 &&
      plannerData.characterName === 'Planner Test Character' &&
      plannerData.characterBackground === 'scholar' &&
      plannerData.storyletFlag === true;
    
    return {
      testName: 'Planner Data Display',
      success: correctData,
      duration: performance.now() - startTime,
      details: {
        plannerData,
        correctData,
        expectedValues: {
          userLevel: 1,
          experience: 0,
          day: 1,
          characterName: 'Planner Test Character',
          characterBackground: 'scholar',
          storyletFlag: true
        }
      }
    };
    
  } catch (error) {
    return {
      testName: 'Planner Data Display',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test Planner resource management
 */
export const testPlannerResourceManagement = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Planner Resource Management...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    createCharacterAtomically({
      name: 'Resource Test',
      background: 'athlete',
      attributes: { strength: 90 },
      domainAdjustments: {}
    });
    
    const coreStore = useCoreGameStore.getState();
    
    // Initialize resources like Planner would
    coreStore.updatePlayer({
      resources: {
        energy: 75,
        stress: 20,
        money: 0,
        knowledge: 0,
        social: 0
      }
    });
    
    // Test resource updates
    coreStore.updatePlayer({
      resources: {
        ...coreStore.player.resources,
        energy: 50,
        stress: 40
      }
    });
    
    const afterUpdate = captureFlowState();
    
    const resourcesCorrect = 
      afterUpdate.core.player.resources.energy === 50 &&
      afterUpdate.core.player.resources.stress === 40;
    
    return {
      testName: 'Planner Resource Management',
      success: resourcesCorrect,
      duration: performance.now() - startTime,
      details: {
        initialResources: { energy: 75, stress: 20 },
        updatedResources: afterUpdate.core.player.resources,
        resourcesCorrect
      }
    };
    
  } catch (error) {
    return {
      testName: 'Planner Resource Management',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test Planner day progression
 */
export const testPlannerDayProgression = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Planner Day Progression...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    createCharacterAtomically({
      name: 'Day Test',
      background: 'social',
      attributes: { charisma: 85 },
      domainAdjustments: {}
    });
    
    const coreStore = useCoreGameStore.getState();
    
    const initialDay = coreStore.world.day;
    
    // Simulate day progression like Planner would
    coreStore.updateWorld({ day: initialDay + 1 });
    
    const afterProgression = captureFlowState();
    
    const dayProgressed = afterProgression.core.world.day === initialDay + 1;
    
    return {
      testName: 'Planner Day Progression',
      success: dayProgressed,
      duration: performance.now() - startTime,
      details: {
        initialDay,
        newDay: afterProgression.core.world.day,
        dayProgressed
      }
    };
    
  } catch (error) {
    return {
      testName: 'Planner Day Progression',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test tutorial storylet visibility in Planner
 */
export const testTutorialStoryletVisibility = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Tutorial Storylet Visibility...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    
    // Before character creation - no storylet flag
    const beforeState = captureFlowState();
    const flagBeforeCreation = (() => {
      try {
        if (beforeState.narrative.flags && beforeState.narrative.flags.storylet) {
          if (beforeState.narrative.flags.storylet instanceof Map) {
            return beforeState.narrative.flags.storylet.get('character_created');
          } else if (typeof beforeState.narrative.flags.storylet === 'object') {
            return beforeState.narrative.flags.storylet['character_created'];
          }
        }
      } catch (error) {
        console.warn('Could not access character_created flag before creation:', error);
      }
      return false;
    })();
    
    // Create character
    createCharacterAtomically({
      name: 'Storylet Test',
      background: 'artist',
      attributes: { creativity: 90 },
      domainAdjustments: {}
    });
    
    // After character creation - storylet flag should be set
    const afterState = captureFlowState();
    const flagAfterCreation = (() => {
      try {
        if (afterState.narrative.flags && afterState.narrative.flags.storylet) {
          if (afterState.narrative.flags.storylet instanceof Map) {
            return afterState.narrative.flags.storylet.get('character_created');
          } else if (typeof afterState.narrative.flags.storylet === 'object') {
            return afterState.narrative.flags.storylet['character_created'];
          }
        }
      } catch (error) {
        console.warn('Could not access character_created flag after creation:', error);
      }
      return false;
    })();
    
    // Check if tutorial storylets are in the data
    const { tutorialStorylets } = await import('../../data/tutorialStorylets');
    const tutorialExists = 'welcome_to_college' in tutorialStorylets;
    
    const success = 
      flagBeforeCreation !== true &&
      flagAfterCreation === true &&
      tutorialExists;
    
    return {
      testName: 'Tutorial Storylet Visibility',
      success,
      duration: performance.now() - startTime,
      details: {
        flagBeforeCreation,
        flagAfterCreation,
        tutorialExists,
        tutorialStoryletId: 'welcome_to_college',
        activeStorylets: afterState.narrative.storylets.active
      }
    };
    
  } catch (error) {
    return {
      testName: 'Tutorial Storylet Visibility',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test Planner store consistency
 */
export const testPlannerStoreConsistency = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Planner Store Consistency...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    createCharacterAtomically({
      name: 'Consistency Test',
      background: 'scholar',
      attributes: { intelligence: 75, focus: 80 },
      domainAdjustments: { intellectualCompetence: 5 }
    });
    
    const state = captureFlowState();
    const integrity = validateStoreIntegrity(state);
    const characterValidation = validateCharacterCreationState(state);
    
    const success = integrity.passed && characterValidation.passed;
    
    return {
      testName: 'Planner Store Consistency',
      success,
      duration: performance.now() - startTime,
      details: {
        integrity,
        characterValidation,
        allStoresValid: success
      }
    };
    
  } catch (error) {
    return {
      testName: 'Planner Store Consistency',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Run all Planner integration tests
 */
export const runAllPlannerIntegrationTests = async (): Promise<FlowTestResult[]> => {
  console.log('🧪 Running complete Planner Integration test suite...');
  
  const tests = [
    testPlannerDataDisplay,
    testPlannerResourceManagement,
    testPlannerDayProgression,
    testTutorialStoryletVisibility,
    testPlannerStoreConsistency
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
  
  console.log(`\n🧪 Planner Integration test suite complete: ${passedTests}/${totalTests} tests passed`);
  
  return results;
};

// Browser console access for development
if (typeof window !== 'undefined') {
  (window as any).testPlannerDataDisplay = testPlannerDataDisplay;
  (window as any).testPlannerResourceManagement = testPlannerResourceManagement;
  (window as any).testPlannerDayProgression = testPlannerDayProgression;
  (window as any).testTutorialStoryletVisibility = testTutorialStoryletVisibility;
  (window as any).testPlannerStoreConsistency = testPlannerStoreConsistency;
  (window as any).runAllPlannerIntegrationTests = runAllPlannerIntegrationTests;
  
  console.log('🧪 Planner Integration Test Suite loaded');
  console.log('   testPlannerDataDisplay() - Test data display correctness');
  console.log('   testPlannerResourceManagement() - Test resource updates');
  console.log('   testPlannerDayProgression() - Test day progression');
  console.log('   testTutorialStoryletVisibility() - Test storylet visibility');
  console.log('   testPlannerStoreConsistency() - Test store consistency');
  console.log('   runAllPlannerIntegrationTests() - Run complete test suite');
}