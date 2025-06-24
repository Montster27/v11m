// /Users/montysharma/V11M2/src/test/characterFlow/runPhase1and2Tests.ts
// Comprehensive test runner for Phase 1 & 2 of character flow refactoring

import { 
  captureFlowState,
  validateCharacterCreationState,
  validateStoreIntegrity,
  testFirstStoryletFlow,
  generateFlowTestReport,
  type FlowTestResult
} from './flowTestUtils';

import {
  runAllSplashScreenTests
} from './splashScreenTests';

import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';

/**
 * Test Phase 1: Foundation Setup
 */
export const testPhase1Foundation = async (): Promise<FlowTestResult[]> => {
  console.log('\n🔧 PHASE 1 TESTS: Foundation Setup');
  console.log('==================================\n');
  
  const results: FlowTestResult[] = [];
  
  // Test 1: Tutorial storylets exist
  try {
    const { tutorialStorylets } = await import('../../data/tutorialStorylets');
    const storyletCount = Object.keys(tutorialStorylets).length;
    const hasWelcomeStorylet = 'welcome_to_college' in tutorialStorylets;
    
    results.push({
      testName: 'Tutorial Storylets Exist',
      success: storyletCount >= 2 && hasWelcomeStorylet,
      duration: 0,
      details: { storyletCount, hasWelcomeStorylet }
    });
  } catch (error) {
    results.push({
      testName: 'Tutorial Storylets Exist',
      success: false,
      duration: 0,
      details: { error: error.message },
      errors: [error.message]
    });
  }
  
  // Test 2: Character flow integration utilities
  try {
    resetAllGameState();
    const beforeState = captureFlowState();
    
    createCharacterAtomically({
      name: 'Phase 1 Test',
      background: 'scholar',
      attributes: { intelligence: 80 },
      domainAdjustments: { intellectualCompetence: 5 }
    });
    
    const afterState = captureFlowState();
    const validation = validateCharacterCreationState(afterState);
    
    results.push({
      testName: 'Character Flow Integration',
      success: validation.passed,
      duration: afterState.timestamp - beforeState.timestamp,
      details: { validation }
    });
  } catch (error) {
    results.push({
      testName: 'Character Flow Integration',
      success: false,
      duration: 0,
      details: { error: error.message },
      errors: [error.message]
    });
  }
  
  // Test 3: First storylet triggering
  const storyletResult = await testFirstStoryletFlow();
  results.push(storyletResult);
  
  return results;
};

/**
 * Test Phase 2: SplashScreen Refactoring
 */
export const testPhase2SplashScreen = async (): Promise<FlowTestResult[]> => {
  console.log('\n🎮 PHASE 2 TESTS: SplashScreen Refactoring');
  console.log('==========================================\n');
  
  // Run all splash screen tests
  return await runAllSplashScreenTests();
};

/**
 * Integration test across Phase 1 & 2
 */
export const testPhase1and2Integration = async (): Promise<FlowTestResult> => {
  console.log('\n🔗 INTEGRATION TEST: Phase 1 & 2 Flow');
  console.log('=====================================\n');
  
  const startTime = Date.now();
  
  try {
    // Start with clean state
    resetAllGameState();
    const cleanState = captureFlowState();
    
    // Simulate splash screen → character creation → first storylet flow
    console.log('1️⃣ Starting from splash screen state...');
    const hasSaves = Object.keys(cleanState.social.saves.saveSlots).length > 0;
    console.log(`   Has saves: ${hasSaves}`);
    
    console.log('2️⃣ Creating character atomically...');
    createCharacterAtomically({
      name: 'Integration Test User',
      background: 'artist',
      attributes: { creativity: 85 },
      domainAdjustments: { intellectualCompetence: -5, physicalCompetence: -5 }
    });
    
    const afterCreation = captureFlowState();
    
    console.log('3️⃣ Validating character creation state...');
    const validation = validateCharacterCreationState(afterCreation);
    
    console.log('4️⃣ Checking storylet flag...');
    const flagSet = afterCreation.narrative.flags.storylet?.get?.('character_created') === true;
    
    console.log('5️⃣ Validating store integrity...');
    const integrity = validateStoreIntegrity(afterCreation);
    
    const success = validation.passed && flagSet && integrity.passed;
    
    return {
      testName: 'Phase 1 & 2 Integration',
      success,
      duration: Date.now() - startTime,
      details: {
        validation,
        flagSet,
        integrity,
        characterName: afterCreation.core.character.name,
        characterBackground: afterCreation.core.character.background
      }
    };
  } catch (error) {
    return {
      testName: 'Phase 1 & 2 Integration',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Run all Phase 1 & 2 tests
 */
export const runAllPhase1and2Tests = async (): Promise<void> => {
  console.log('🚀 RUNNING COMPLETE PHASE 1 & 2 TEST SUITE');
  console.log('==========================================\n');
  
  const allResults: FlowTestResult[] = [];
  
  // Phase 1 Tests
  const phase1Results = await testPhase1Foundation();
  allResults.push(...phase1Results);
  
  // Phase 2 Tests
  const phase2Results = await testPhase2SplashScreen();
  allResults.push(...phase2Results);
  
  // Integration Test
  const integrationResult = await testPhase1and2Integration();
  allResults.push(integrationResult);
  
  // Generate final report
  console.log('\n📊 FINAL TEST REPORT');
  console.log('===================\n');
  
  const report = generateFlowTestReport(allResults);
  
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed} ✅`);
  console.log(`Failed: ${report.summary.failed} ❌`);
  console.log(`Average Duration: ${report.summary.averageDuration.toFixed(2)}ms`);
  console.log(`\nOverall Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n📝 Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }
  
  // Log failed tests for debugging
  if (!report.passed) {
    console.log('\n❌ Failed Tests:');
    allResults.filter(r => !r.success).forEach(test => {
      console.log(`- ${test.testName}`);
      if (test.errors) {
        test.errors.forEach(err => console.log(`  Error: ${err}`));
      }
    });
  }
  
  return;
};

// Browser console access for development
if (typeof window !== 'undefined') {
  (window as any).testPhase1Foundation = testPhase1Foundation;
  (window as any).testPhase2SplashScreen = testPhase2SplashScreen;
  (window as any).testPhase1and2Integration = testPhase1and2Integration;
  (window as any).runAllPhase1and2Tests = runAllPhase1and2Tests;
  
  console.log('🚀 Phase 1 & 2 Test Runner loaded');
  console.log('   testPhase1Foundation() - Test Phase 1 components');
  console.log('   testPhase2SplashScreen() - Test Phase 2 components');
  console.log('   testPhase1and2Integration() - Test full integration');
  console.log('   runAllPhase1and2Tests() - Run complete test suite');
}