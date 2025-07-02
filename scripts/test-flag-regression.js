// /Users/montysharma/v11m2/scripts/test-flag-regression.js
// Browser-based regression tests for flag generation and storylet behavior

(function() {
  'use strict';
  
  console.log('🧪 Starting Flag Generation Regression Tests...');
  
  // Import required modules (assuming they're globally available in development)
  const { generateConcernFlags, generateAllFlags, clearFlagCache, getFlagGeneratorStats, warmUpFlagCache } = window;
  const { useCharacterConcernsStore } = window;
  
  if (!generateConcernFlags) {
    console.error('❌ Flag generator functions not available. Make sure they are exposed globally.');
    return;
  }
  
  let testResults = [];
  
  function logResult(testName, passed, details = '', performance = null) {
    const result = { 
      testName, 
      passed, 
      details, 
      performance,
      timestamp: Date.now() 
    };
    testResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    const perfText = performance ? ` (${performance})` : '';
    console.log(`${icon} ${testName}: ${passed ? 'PASS' : 'FAIL'}${details ? ` - ${details}` : ''}${perfText}`);
  }
  
  // Test 1: Basic Flag Generation Correctness
  function testBasicFlagGeneration() {
    console.log('\n📝 Test 1: Basic Flag Generation Correctness');
    
    try {
      clearFlagCache();
      
      const concerns = {
        academic: 20,
        social: 15,
        financial: 5
      };
      
      const flags = generateConcernFlags(concerns);
      
      // Test basic presence flags
      const hasAcademicFlag = flags.concern_academic === true;
      const hasSocialFlag = flags.concern_social === true;
      const hasFinancialFlag = flags.concern_financial === true;
      
      // Test level-based flags
      const academicModerate = flags.concern_academic_moderate === true;
      const socialModerate = flags.concern_social_moderate === true;
      const financialLow = flags.concern_financial_low === true;
      
      // Test aggregate flags
      const hasMultipleConcerns = flags.has_multiple_concerns === true;
      const moderateStress = flags.moderate_overall_stress === true;
      
      const allBasicTests = hasAcademicFlag && hasSocialFlag && hasFinancialFlag &&
                           academicModerate && socialModerate && financialLow &&
                           hasMultipleConcerns && moderateStress;
      
      logResult(
        'Basic Flag Generation Correctness',
        allBasicTests,
        `Flags: ${Object.keys(flags).length}, Expected patterns match: ${allBasicTests}`
      );
      
    } catch (error) {
      logResult('Basic Flag Generation Correctness', false, error.message);
    }
  }
  
  // Test 2: Memoization Performance
  function testMemoizationPerformance() {
    console.log('\n⚡ Test 2: Memoization Performance');
    
    try {
      clearFlagCache();
      
      const concerns = {
        academic: 25,
        social: 20,
        financial: 15,
        health: 10
      };
      
      // First call (cache miss)
      const start1 = performance.now();
      const flags1 = generateConcernFlags(concerns);
      const time1 = performance.now() - start1;
      
      // Second call (cache hit)
      const start2 = performance.now();
      const flags2 = generateConcernFlags(concerns);
      const time2 = performance.now() - start2;
      
      // Third call (cache hit)
      const start3 = performance.now();
      const flags3 = generateConcernFlags(concerns);
      const time3 = performance.now() - start3;
      
      const isMemoized = flags1 === flags2 && flags2 === flags3;
      const isPerformant = time2 < time1 && time3 < time1;
      const speedImprovement = time1 / Math.max(time2, time3, 0.001);
      
      const stats = getFlagGeneratorStats();
      
      logResult(
        'Memoization Performance',
        isMemoized && isPerformant,
        `Cache hits: ${stats.cacheHits}, misses: ${stats.cacheMisses}`,
        `${speedImprovement.toFixed(1)}x faster`
      );
      
    } catch (error) {
      logResult('Memoization Performance', false, error.message);
    }
  }
  
  // Test 3: Flag Consistency Across Calls
  function testFlagConsistency() {
    console.log('\n🔄 Test 3: Flag Consistency Across Calls');
    
    try {
      const testPatterns = [
        { academic: 10, social: 0, financial: 20 },
        { academic: 30, social: 25, financial: 15, health: 10 },
        { academic: 0, social: 0, financial: 0 },
        { academic: 5, social: 8, financial: 12, health: 6, family: 9 }
      ];
      
      let allConsistent = true;
      let totalFlags = 0;
      
      testPatterns.forEach((concerns, index) => {
        clearFlagCache();
        
        // Generate flags multiple times
        const flags1 = generateConcernFlags(concerns);
        const flags2 = generateConcernFlags(concerns);
        const flags3 = generateConcernFlags(concerns);
        
        // Check reference equality (memoization)
        const referenceEqual = flags1 === flags2 && flags2 === flags3;
        
        // Check content equality (same flags generated)
        const contentEqual = JSON.stringify(flags1) === JSON.stringify(flags2);
        
        if (!referenceEqual || !contentEqual) {
          allConsistent = false;
          console.warn(`Inconsistency in pattern ${index}:`, concerns);
        }
        
        totalFlags += Object.keys(flags1).length;
      });
      
      logResult(
        'Flag Consistency Across Calls',
        allConsistent,
        `${testPatterns.length} patterns tested, ${totalFlags} total flags`
      );
      
    } catch (error) {
      logResult('Flag Consistency Across Calls', false, error.message);
    }
  }
  
  // Test 4: Edge Cases Handling
  function testEdgeCases() {
    console.log('\n🎯 Test 4: Edge Cases Handling');
    
    try {
      const edgeCases = [
        { input: {}, name: 'Empty concerns' },
        { input: null, name: 'Null concerns' },
        { input: undefined, name: 'Undefined concerns' },
        { input: { academic: 0, social: 0 }, name: 'Zero values' },
        { input: { academic: -5, social: 100 }, name: 'Extreme values' },
        { input: { academic: 10.5, social: 20.7 }, name: 'Decimal values' }
      ];
      
      let allEdgeCasesHandled = true;
      let edgeCaseResults = [];
      
      edgeCases.forEach(({ input, name }) => {
        try {
          const flags = generateConcernFlags(input);
          const flagCount = Object.keys(flags).length;
          
          // Should not throw and should return an object
          const handled = typeof flags === 'object' && flags !== null;
          edgeCaseResults.push({ name, handled, flagCount });
          
          if (!handled) {
            allEdgeCasesHandled = false;
          }
          
        } catch (error) {
          console.warn(`Edge case "${name}" threw error:`, error.message);
          allEdgeCasesHandled = false;
          edgeCaseResults.push({ name, handled: false, error: error.message });
        }
      });
      
      logResult(
        'Edge Cases Handling',
        allEdgeCasesHandled,
        `${edgeCaseResults.filter(r => r.handled).length}/${edgeCases.length} cases handled`
      );
      
    } catch (error) {
      logResult('Edge Cases Handling', false, error.message);
    }
  }
  
  // Test 5: Large Scale Performance
  function testLargeScalePerformance() {
    console.log('\n🏋️ Test 5: Large Scale Performance');
    
    try {
      clearFlagCache();
      
      // Generate many different concern patterns
      const patterns = [];
      for (let i = 0; i < 1000; i++) {
        patterns.push({
          academic: (i * 7) % 40,
          social: (i * 11) % 35,
          financial: (i * 13) % 30,
          health: (i * 17) % 25
        });
      }
      
      const startTime = performance.now();
      let totalFlags = 0;
      
      patterns.forEach(concerns => {
        const flags = generateConcernFlags(concerns);
        totalFlags += Object.keys(flags).length;
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTime = duration / patterns.length;
      
      const stats = getFlagGeneratorStats();
      const cacheEfficiency = stats.cacheHits / (stats.cacheHits + stats.cacheMisses);
      
      const isPerformant = duration < 2000; // Should complete within 2 seconds
      const isEfficient = cacheEfficiency > 0.1; // At least 10% cache hit rate
      
      logResult(
        'Large Scale Performance',
        isPerformant && isEfficient,
        `${patterns.length} patterns, cache efficiency: ${(cacheEfficiency * 100).toFixed(1)}%`,
        `${duration.toFixed(0)}ms total, ${avgTime.toFixed(2)}ms avg`
      );
      
    } catch (error) {
      logResult('Large Scale Performance', false, error.message);
    }
  }
  
  // Test 6: Integration with Store
  function testStoreIntegration() {
    console.log('\n🔗 Test 6: Store Integration');
    
    try {
      if (!useCharacterConcernsStore) {
        logResult('Store Integration', false, 'Store not available');
        return;
      }
      
      const store = useCharacterConcernsStore.getState();
      
      // Test setting concerns through store
      const testConcerns = {
        academic: 18,
        social: 12,
        financial: 22
      };
      
      store.setConcerns(testConcerns);
      
      // Get flags through store
      const storeFlags = store.generateConcernFlags();
      
      // Get flags directly
      const directFlags = generateConcernFlags(testConcerns);
      
      // Compare results (content should be similar)
      const storeFlagCount = Object.keys(storeFlags).length;
      const directFlagCount = Object.keys(directFlags).length;
      
      // Store may have additional custom flags, so just check that basic flags exist
      const hasBasicFlags = storeFlags.concern_academic && 
                           storeFlags.concern_social && 
                           storeFlags.concern_financial;
      
      const integrationWorks = hasBasicFlags && storeFlagCount > 0;
      
      logResult(
        'Store Integration',
        integrationWorks,
        `Store flags: ${storeFlagCount}, Direct flags: ${directFlagCount}`
      );
      
    } catch (error) {
      logResult('Store Integration', false, error.message);
    }
  }
  
  // Test 7: Memory Management
  function testMemoryManagement() {
    console.log('\n🧠 Test 7: Memory Management');
    
    try {
      // Clear cache and warm it up
      clearFlagCache();
      warmUpFlagCache();
      
      let initialStats = getFlagGeneratorStats();
      
      // Generate many unique patterns to fill cache
      for (let i = 0; i < 200; i++) {
        const uniqueConcerns = {
          academic: i % 50,
          social: (i * 2) % 40,
          financial: (i * 3) % 35,
          unique_field: i // Make each pattern unique
        };
        generateConcernFlags(uniqueConcerns);
      }
      
      let filledStats = getFlagGeneratorStats();
      
      // Test cache optimization doesn't break functionality
      const testConcerns = { academic: 15, social: 10 };
      const flagsBefore = generateConcernFlags(testConcerns);
      
      // Force optimization by creating many more entries
      for (let i = 200; i < 300; i++) {
        generateConcernFlags({ academic: i % 30, social: i % 25, test: i });
      }
      
      const flagsAfter = generateConcernFlags(testConcerns);
      let finalStats = getFlagGeneratorStats();
      
      const functionalityPreserved = JSON.stringify(flagsBefore) === JSON.stringify(flagsAfter);
      const cacheGrowing = finalStats.cacheSize >= initialStats.cacheSize;
      
      logResult(
        'Memory Management',
        functionalityPreserved && cacheGrowing,
        `Cache: ${initialStats.cacheSize} → ${filledStats.cacheSize} → ${finalStats.cacheSize}`
      );
      
    } catch (error) {
      logResult('Memory Management', false, error.message);
    }
  }
  
  // Test 8: Storylet Flag Requirements Compatibility
  function testStoryletCompatibility() {
    console.log('\n📚 Test 8: Storylet Flag Requirements Compatibility');
    
    try {
      // Test common storylet flag patterns
      const concerns = {
        academic: 22,
        social: 18,
        financial: 25,
        health: 8
      };
      
      const flags = generateConcernFlags(concerns);
      
      // Test common storylet requirement patterns
      const commonRequirements = [
        'concern_academic',
        'concern_academic_high',
        'has_multiple_concerns',
        'high_overall_stress',
        'academic_social_stress',
        'total_concerns_moderate',
        'overwhelmed'
      ];
      
      let compatibilityIssues = 0;
      const requirementResults = {};
      
      commonRequirements.forEach(req => {
        if (!(req in flags)) {
          compatibilityIssues++;
          console.warn(`Missing expected flag: ${req}`);
        }
        requirementResults[req] = flags[req] || false;
      });
      
      const isCompatible = compatibilityIssues === 0;
      const expectedTrue = ['concern_academic', 'concern_academic_high', 'has_multiple_concerns', 'high_overall_stress'];
      const correctValues = expectedTrue.every(req => flags[req] === true);
      
      logResult(
        'Storylet Flag Requirements Compatibility',
        isCompatible && correctValues,
        `${commonRequirements.length - compatibilityIssues}/${commonRequirements.length} flags present`
      );
      
    } catch (error) {
      logResult('Storylet Flag Requirements Compatibility', false, error.message);
    }
  }
  
  // Run all regression tests
  async function runRegressionTests() {
    console.log('🚀 Running Flag Generation Regression Test Suite...\n');
    
    testBasicFlagGeneration();
    testMemoizationPerformance();
    testFlagConsistency();
    testEdgeCases();
    testLargeScalePerformance();
    testStoreIntegration();
    testMemoryManagement();
    testStoryletCompatibility();
    
    // Summary
    console.log('\n📊 Regression Test Results:');
    console.log('=' .repeat(50));
    
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const percentage = ((passed / total) * 100).toFixed(1);
    
    console.log(`Tests Passed: ${passed}/${total} (${percentage}%)`);
    
    if (passed === total) {
      console.log('🎉 All regression tests passed! Flag generation is working correctly.');
    } else {
      console.log('⚠️ Some regression tests failed:');
      testResults.filter(r => !r.passed).forEach(result => {
        console.log(`   ❌ ${result.testName}: ${result.details}`);
      });
    }
    
    // Performance summary
    const performanceTests = testResults.filter(r => r.performance);
    if (performanceTests.length > 0) {
      console.log('\n⚡ Performance Summary:');
      performanceTests.forEach(test => {
        console.log(`   ${test.testName}: ${test.performance}`);
      });
    }
    
    return { passed, total, percentage, results: testResults };
  }
  
  // Export functions for manual execution
  window.runFlagRegressionTests = runRegressionTests;
  window.testBasicFlagGeneration = testBasicFlagGeneration;
  window.testMemoizationPerformance = testMemoizationPerformance;
  
  // Auto-run tests
  runRegressionTests();
  
})();