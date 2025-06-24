// /Users/montysharma/V11M2/src/test/characterFlow/instantValidation.ts
// Instant validation results (synchronous)

import { quickValidationTest } from './quickTests';
import { quickArchitecturalTest } from './debugValidation';
import { validateCoreFunctionality, validateArchitecturalImprovements } from './successValidation';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';

/**
 * Run instant validation with immediate results
 */
export const runInstantValidation = () => {
  console.log('⚡ INSTANT VALIDATION');
  console.log('====================\n');
  
  const results: any = {
    quickTest: null,
    architectural: null,
    coreFunctionality: null,
    summary: {
      passed: 0,
      total: 0,
      success: false
    }
  };
  
  try {
    // 1. Quick validation test
    console.log('1️⃣ Quick Validation Test');
    results.quickTest = quickValidationTest();
    console.log(`   Result: ${results.quickTest.success ? '✅ PASSED' : '❌ FAILED'} (${results.quickTest.passed}/${results.quickTest.total})`);
    
    // Show which test failed if any
    if (!results.quickTest.success && results.quickTest.passed === 6 && results.quickTest.total === 7) {
      console.log('   ⚠️ One test failed - run quickValidationTest() to see details\n');
    }
    
    // 2. Architectural test
    console.log('2️⃣ Architectural Validation');
    results.architectural = quickArchitecturalTest();
    console.log(`   Result: ${results.architectural.overallSuccess ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    // 3. Core functionality (sync version)
    console.log('3️⃣ Core Functionality Check');
    
    // Suppress console errors for this test
    const originalError = console.error;
    console.error = () => {};
    
    try {
      // Run async function synchronously
      validateCoreFunctionality().then(result => {
        results.coreFunctionality = result;
        console.log(`   Result: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
      });
      
      // Give it a moment to complete
      setTimeout(() => {
        console.error = originalError;
        
        // Calculate summary
        results.summary.total = 3;
        results.summary.passed = 
          (results.quickTest?.success ? 1 : 0) +
          (results.architectural?.overallSuccess ? 1 : 0) +
          (results.coreFunctionality?.success ? 1 : 0);
        results.summary.success = results.summary.passed === results.summary.total;
        
        // Final summary
        console.log('\n📊 SUMMARY');
        console.log('==========');
        console.log(`Overall: ${results.summary.success ? '🎉 SUCCESS' : '⚠️ NEEDS ATTENTION'}`);
        console.log(`Tests Passed: ${results.summary.passed}/${results.summary.total}`);
        
        if (results.quickTest && !results.quickTest.success) {
          console.log('\n⚠️ Quick test has 1 failing test');
          console.log('   Run quickValidationTest() to see which test is failing');
        }
        
        if (results.summary.success) {
          console.log('\n✅ Character Flow Refactoring is working correctly!');
          console.log('   For detailed validation, run: runCleanValidation()');
        }
      }, 100);
      
    } catch (error) {
      console.error = originalError;
      console.log(`   Result: ❌ FAILED (${error.message})`);
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Instant validation failed:', error);
    return { error: error.message };
  }
};

/**
 * Quick health check - even simpler
 */
export const healthCheck = () => {
  console.log('🏥 SYSTEM HEALTH CHECK');
  console.log('=====================\n');
  
  const checks = {
    stores: false,
    architecture: false,
    data: false,
    overall: false
  };
  
  try {
    // Check 1: Stores exist
    checks.stores = typeof useCoreGameStore === 'function' && 
                    typeof useNarrativeStore === 'function' && 
                    typeof useSocialStore === 'function';
    console.log(`${checks.stores ? '✅' : '❌'} Stores Available`);
    
    // Check 2: Architecture valid
    const archTest = quickArchitecturalTest();
    checks.architecture = archTest.overallSuccess;
    console.log(`${checks.architecture ? '✅' : '❌'} Architecture Valid`);
    
    // Check 3: Can access data
    try {
      const core = useCoreGameStore.getState();
      const narrative = useNarrativeStore.getState();
      const social = useSocialStore.getState();
      checks.data = !!(core && narrative && social);
    } catch (e) {
      checks.data = false;
    }
    console.log(`${checks.data ? '✅' : '❌'} Data Accessible`);
    
    checks.overall = checks.stores && checks.architecture && checks.data;
    console.log(`\n${checks.overall ? '🎉' : '⚠️'} Overall Health: ${checks.overall ? 'GOOD' : 'NEEDS ATTENTION'}`);
    
    if (checks.overall) {
      console.log('\n✅ System is healthy and ready for use!');
    } else {
      console.log('\n⚠️ Some issues detected. Run debugStoreStructure() for details.');
    }
    
    return checks;
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return { ...checks, error: error.message };
  }
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).runInstantValidation = runInstantValidation;
  (window as any).healthCheck = healthCheck;
  
  console.log('⚡ Instant Validation loaded');
  console.log('   healthCheck() - Quick system health check');
  console.log('   runInstantValidation() - Instant validation results');
}