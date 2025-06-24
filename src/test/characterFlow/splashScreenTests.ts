// /Users/montysharma/V11M2/src/test/characterFlow/splashScreenTests.ts
// Comprehensive test suite for refactored SplashScreen component

import { useSocialStore } from '../../stores/v2';
import { resetAllGameState } from '../../utils/characterFlowIntegration';
import { 
  captureFlowState, 
  validateStoreIntegrity, 
  compareFlowStates,
  measurePerformance,
  type FlowTestResult 
} from './flowTestUtils';

/**
 * Test SplashScreen flow with consolidated stores
 */
export const testSplashScreenFlow = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing SplashScreen with consolidated stores...');
  
  const beforeState = captureFlowState();
  
  try {
    // Test save slot detection
    const socialStore = useSocialStore.getState();
    const initialSaveCount = Object.keys(socialStore.saves.saveSlots).length;
    
    // Test new game flow preparation
    const saveSlots = Object.values(socialStore.saves.saveSlots);
    const hasSaves = saveSlots.length > 0;
    const latestSave = socialStore.saves.currentSaveId 
      ? socialStore.saves.saveSlots[socialStore.saves.currentSaveId]
      : saveSlots.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
    
    console.log('📊 SplashScreen state check:', {
      initialSaveCount,
      hasSaves,
      latestSave: latestSave?.name || 'none',
      currentSaveId: socialStore.saves.currentSaveId
    });
    
    // Test atomic reset functionality
    resetAllGameState();
    const afterResetState = captureFlowState();
    
    // Validate clean state after reset
    const integrity = validateStoreIntegrity(afterResetState);
    const stateDiff = compareFlowStates(beforeState, afterResetState);
    
    const success = 
      integrity.passed &&
      afterResetState.core.player.level === 1 &&
      afterResetState.core.world.day === 1 &&
      Object.keys(afterResetState.social.saves.saveSlots).length === 0;
    
    return {
      testName: 'SplashScreen Flow',
      success,
      duration: Date.now() - beforeState.timestamp,
      details: { 
        integrity,
        stateDiff,
        initialSaveCount,
        hasSaves,
        resetSuccessful: success
      }
    };
    
  } catch (error) {
    return {
      testName: 'SplashScreen Flow',
      success: false,
      duration: Date.now() - beforeState.timestamp,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test save loading functionality in SplashScreen
 */
export const testSplashScreenSaveLoading = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing SplashScreen save loading...');
  
  const startTime = Date.now();
  
  try {
    const socialStore = useSocialStore.getState();
    
    // Create a test save slot
    const testSaveId = 'splash_test_save_' + Date.now();
    socialStore.createSaveSlot(testSaveId, {
      name: 'Test Save',
      gameDay: 5,
      timestamp: Date.now(),
      characterName: 'Test Character',
      playerLevel: 3
    });
    
    const beforeLoad = captureFlowState();
    
    // Test loading the save
    socialStore.loadSaveSlot(testSaveId);
    
    const afterLoad = captureFlowState();
    const stateDiff = compareFlowStates(beforeLoad, afterLoad);
    
    // Verify save was loaded correctly
    const saveLoaded = socialStore.saves.currentSaveId === testSaveId;
    const saveExists = testSaveId in socialStore.saves.saveSlots;
    
    // Cleanup
    socialStore.deleteSaveSlot(testSaveId);
    
    return {
      testName: 'SplashScreen Save Loading',
      success: saveLoaded && saveExists,
      duration: Date.now() - startTime,
      details: {
        saveLoaded,
        saveExists,
        stateDiff,
        testSaveId
      }
    };
    
  } catch (error) {
    return {
      testName: 'SplashScreen Save Loading',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test SplashScreen atomic reset performance
 */
export const testSplashScreenResetPerformance = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing SplashScreen atomic reset performance...');
  
  const iterations = 5;
  const times: number[] = [];
  
  try {
    for (let i = 0; i < iterations; i++) {
      const performanceResult = await measurePerformance(
        () => {
          resetAllGameState();
          return captureFlowState();
        },
        `Reset Operation ${i + 1}`
      );
      
      times.push(performanceResult.duration);
      
      if (!performanceResult.success) {
        throw new Error(`Reset operation ${i + 1} failed`);
      }
    }
    
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    // Performance targets: average < 50ms, max < 100ms
    const performanceAcceptable = avgTime < 50 && maxTime < 100;
    
    return {
      testName: 'SplashScreen Reset Performance',
      success: performanceAcceptable,
      duration: avgTime,
      details: {
        averageTime: avgTime,
        maxTime,
        minTime,
        iterations,
        times,
        performanceAcceptable
      }
    };
    
  } catch (error) {
    return {
      testName: 'SplashScreen Reset Performance',
      success: false,
      duration: 0,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test SplashScreen integration with save state detection
 */
export const testSplashScreenSaveDetection = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing SplashScreen save state detection...');
  
  const startTime = Date.now();
  
  try {
    const socialStore = useSocialStore.getState();
    
    // Start with clean state
    resetAllGameState();
    
    // Test 1: No saves scenario
    const noSavesState = captureFlowState();
    const saveSlots1 = Object.values(noSavesState.social.saves.saveSlots);
    const hasSaves1 = saveSlots1.length > 0;
    
    // Test 2: With saves scenario
    const testSaveIds = ['test_save_1', 'test_save_2'];
    testSaveIds.forEach((id, index) => {
      socialStore.createSaveSlot(id, {
        name: `Test Save ${index + 1}`,
        gameDay: index + 1,
        timestamp: Date.now() - (index * 1000), // Different timestamps
        characterName: `Character ${index + 1}`,
        playerLevel: index + 1
      });
    });
    
    const withSavesState = captureFlowState();
    const saveSlots2 = Object.values(withSavesState.social.saves.saveSlots);
    const hasSaves2 = saveSlots2.length > 0;
    
    // Test latest save detection
    const latestSave = socialStore.saves.currentSaveId 
      ? socialStore.saves.saveSlots[socialStore.saves.currentSaveId]
      : saveSlots2.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
    
    // Cleanup
    testSaveIds.forEach(id => {
      socialStore.deleteSaveSlot(id);
    });
    
    const success = 
      !hasSaves1 && // No saves initially
      hasSaves2 && // Has saves after creation
      saveSlots2.length === 2 && // Correct number of saves
      latestSave && // Latest save detected
      latestSave.name === 'Test Save 1'; // Correct latest save
    
    return {
      testName: 'SplashScreen Save Detection',
      success,
      duration: Date.now() - startTime,
      details: {
        noSavesInitially: !hasSaves1,
        hasSavesAfterCreation: hasSaves2,
        saveCount: saveSlots2.length,
        latestSaveName: latestSave?.name,
        detectionWorking: success
      }
    };
    
  } catch (error) {
    return {
      testName: 'SplashScreen Save Detection',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Run all SplashScreen tests
 */
export const runAllSplashScreenTests = async (): Promise<FlowTestResult[]> => {
  console.log('🧪 Running complete SplashScreen test suite...');
  
  const tests = [
    testSplashScreenFlow,
    testSplashScreenSaveLoading,
    testSplashScreenResetPerformance,
    testSplashScreenSaveDetection
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
        testName: test.name,
        success: false,
        duration: 0,
        details: { error: error.message },
        errors: [error.message]
      });
    }
  }
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`🧪 SplashScreen test suite complete: ${passedTests}/${totalTests} tests passed`);
  
  return results;
};

// Browser console access for development
if (typeof window !== 'undefined') {
  (window as any).testSplashScreenFlow = testSplashScreenFlow;
  (window as any).testSplashScreenSaveLoading = testSplashScreenSaveLoading;
  (window as any).testSplashScreenResetPerformance = testSplashScreenResetPerformance;
  (window as any).testSplashScreenSaveDetection = testSplashScreenSaveDetection;
  (window as any).runAllSplashScreenTests = runAllSplashScreenTests;
  
  console.log('🧪 SplashScreen Test Suite loaded');
  console.log('   testSplashScreenFlow() - Test basic flow functionality');
  console.log('   testSplashScreenSaveLoading() - Test save loading');
  console.log('   testSplashScreenResetPerformance() - Test reset performance');
  console.log('   testSplashScreenSaveDetection() - Test save detection');
  console.log('   runAllSplashScreenTests() - Run complete test suite');
}