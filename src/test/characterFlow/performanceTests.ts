// /Users/montysharma/V11M2/src/test/characterFlow/performanceTests.ts
// Phase 6: Performance tests for character flow refactoring

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';
import {
  captureFlowState,
  measurePerformance,
  type FlowTestResult
} from './flowTestUtils';

/**
 * Test character creation performance under load
 */
export const testCharacterCreationPerformance = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Character Creation Performance...');
  
  const startTime = performance.now();
  const iterations = 50;
  const times: number[] = [];
  const memoryUsage: any[] = [];
  
  try {
    for (let i = 0; i < iterations; i++) {
      resetAllGameState();
      
      // Measure memory before creation
      const memoryBefore = (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : { used: 0, total: 0 };
      
      const creationResult = await measurePerformance(
        () => {
          createCharacterAtomically({
            name: `Performance Test ${i}`,
            background: ['scholar', 'athlete', 'artist', 'social'][i % 4],
            attributes: {
              intelligence: 50 + (i * 3) % 50,
              creativity: 50 + (i * 7) % 50,
              charisma: 50 + (i * 5) % 50,
              strength: 50 + (i * 2) % 50,
              focus: 50 + (i * 4) % 50,
              empathy: 50 + (i * 6) % 50
            },
            domainAdjustments: {
              intellectualCompetence: (i % 3) * 5 - 5,
              physicalCompetence: ((i + 1) % 3) * 5 - 5,
              emotionalIntelligence: ((i + 2) % 3) * 5 - 5
            }
          });
        },
        `Character Creation ${i + 1}`
      );
      
      times.push(creationResult.duration);
      
      // Measure memory after creation
      const memoryAfter = (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      } : { used: 0, total: 0 };
      
      memoryUsage.push({
        iteration: i,
        before: memoryBefore,
        after: memoryAfter,
        delta: memoryAfter.used - memoryBefore.used
      });
    }
    
    // Calculate statistics
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    const stdDev = Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / times.length);
    
    // Memory statistics
    const avgMemoryDelta = memoryUsage.reduce((sum, m) => sum + m.delta, 0) / memoryUsage.length;
    const maxMemoryDelta = Math.max(...memoryUsage.map(m => m.delta));
    
    // Performance targets
    const avgTimeAcceptable = avgTime < 25; // 25ms average
    const maxTimeAcceptable = maxTime < 100; // 100ms max
    const consistencyAcceptable = stdDev < 20; // Low variance
    const memoryAcceptable = avgMemoryDelta < 1000000; // < 1MB per creation
    
    const success = avgTimeAcceptable && maxTimeAcceptable && consistencyAcceptable && memoryAcceptable;
    
    return {
      testName: 'Character Creation Performance',
      success,
      duration: performance.now() - startTime,
      details: {
        iterations,
        timing: {
          average: avgTime,
          max: maxTime,
          min: minTime,
          standardDeviation: stdDev,
          times: times.slice(0, 10) // First 10 for debugging
        },
        memory: {
          averageDelta: avgMemoryDelta,
          maxDelta: maxMemoryDelta,
          samples: memoryUsage.slice(0, 5) // First 5 for debugging
        },
        performance: {
          avgTimeAcceptable,
          maxTimeAcceptable,
          consistencyAcceptable,
          memoryAcceptable
        }
      }
    };
    
  } catch (error) {
    return {
      testName: 'Character Creation Performance',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test store update performance
 */
export const testStoreUpdatePerformance = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Store Update Performance...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    createCharacterAtomically({
      name: 'Store Update Test',
      background: 'scholar',
      attributes: { intelligence: 80 },
      domainAdjustments: {}
    });
    
    const operations = 1000;
    const updateTimes: number[] = [];
    
    // Test Core Store updates
    for (let i = 0; i < operations / 3; i++) {
      const updateStart = performance.now();
      useCoreGameStore.getState().updatePlayer({ experience: i });
      updateTimes.push(performance.now() - updateStart);
    }
    
    // Test Narrative Store updates
    for (let i = 0; i < operations / 3; i++) {
      const updateStart = performance.now();
      useNarrativeStore.getState().setStoryletFlag(`test_flag_${i}`, i % 2 === 0);
      updateTimes.push(performance.now() - updateStart);
    }
    
    // Test Social Store updates
    for (let i = 0; i < operations / 3; i++) {
      const updateStart = performance.now();
      useSocialStore.getState().updateRelationship(`npc_${i % 10}`, 1);
      updateTimes.push(performance.now() - updateStart);
    }
    
    const avgUpdateTime = updateTimes.reduce((a, b) => a + b) / updateTimes.length;
    const maxUpdateTime = Math.max(...updateTimes);
    const operationsPerSecond = 1000 / avgUpdateTime;
    
    // Performance targets
    const avgUpdateAcceptable = avgUpdateTime < 1; // < 1ms per update
    const maxUpdateAcceptable = maxUpdateTime < 10; // < 10ms max
    const throughputAcceptable = operationsPerSecond > 500; // > 500 ops/sec
    
    const success = avgUpdateAcceptable && maxUpdateAcceptable && throughputAcceptable;
    
    return {
      testName: 'Store Update Performance',
      success,
      duration: performance.now() - startTime,
      details: {
        operations,
        averageUpdateTime: avgUpdateTime,
        maxUpdateTime,
        operationsPerSecond,
        performance: {
          avgUpdateAcceptable,
          maxUpdateAcceptable,
          throughputAcceptable
        },
        sampleTimes: updateTimes.slice(0, 20)
      }
    };
    
  } catch (error) {
    return {
      testName: 'Store Update Performance',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test state capture performance
 */
export const testStateCapturePerformance = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing State Capture Performance...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    createCharacterAtomically({
      name: 'State Capture Test',
      background: 'artist',
      attributes: { creativity: 85 },
      domainAdjustments: {}
    });
    
    // Add some data to make capture more realistic
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();
    
    for (let i = 0; i < 10; i++) {
      narrativeStore.setStoryletFlag(`flag_${i}`, true);
      socialStore.updateRelationship(`npc_${i}`, i * 2);
    }
    
    const captures = 100;
    const captureTimes: number[] = [];
    
    for (let i = 0; i < captures; i++) {
      const captureStart = performance.now();
      const state = captureFlowState();
      captureTimes.push(performance.now() - captureStart);
      
      // Verify capture integrity
      if (!state.core || !state.narrative || !state.social) {
        throw new Error('Captured state is incomplete');
      }
    }
    
    const avgCaptureTime = captureTimes.reduce((a, b) => a + b) / captureTimes.length;
    const maxCaptureTime = Math.max(...captureTimes);
    const capturesPerSecond = 1000 / avgCaptureTime;
    
    // Performance targets
    const avgCaptureAcceptable = avgCaptureTime < 5; // < 5ms per capture
    const maxCaptureAcceptable = maxCaptureTime < 20; // < 20ms max
    const throughputAcceptable = capturesPerSecond > 100; // > 100 captures/sec
    
    const success = avgCaptureAcceptable && maxCaptureAcceptable && throughputAcceptable;
    
    return {
      testName: 'State Capture Performance',
      success,
      duration: performance.now() - startTime,
      details: {
        captures,
        averageCaptureTime: avgCaptureTime,
        maxCaptureTime,
        capturesPerSecond,
        performance: {
          avgCaptureAcceptable,
          maxCaptureAcceptable,
          throughputAcceptable
        },
        sampleTimes: captureTimes.slice(0, 10)
      }
    };
    
  } catch (error) {
    return {
      testName: 'State Capture Performance',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test reset performance
 */
export const testResetPerformance = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Reset Performance...');
  
  const startTime = performance.now();
  
  try {
    const resets = 50;
    const resetTimes: number[] = [];
    
    for (let i = 0; i < resets; i++) {
      // Create some state to reset
      createCharacterAtomically({
        name: `Reset Test ${i}`,
        background: 'social',
        attributes: { charisma: 75 },
        domainAdjustments: {}
      });
      
      // Add some additional state
      useNarrativeStore.getState().setStoryletFlag('test_flag', true);
      useSocialStore.getState().updateRelationship('test_npc', 5);
      
      // Measure reset time
      const resetStart = performance.now();
      resetAllGameState();
      resetTimes.push(performance.now() - resetStart);
      
      // Verify reset completed
      const state = captureFlowState();
      if (state.core.character.name !== '' || state.core.player.experience !== 0) {
        throw new Error('Reset did not complete properly');
      }
    }
    
    const avgResetTime = resetTimes.reduce((a, b) => a + b) / resetTimes.length;
    const maxResetTime = Math.max(...resetTimes);
    
    // Performance targets
    const avgResetAcceptable = avgResetTime < 10; // < 10ms per reset
    const maxResetAcceptable = maxResetTime < 50; // < 50ms max
    
    const success = avgResetAcceptable && maxResetAcceptable;
    
    return {
      testName: 'Reset Performance',
      success,
      duration: performance.now() - startTime,
      details: {
        resets,
        averageResetTime: avgResetTime,
        maxResetTime,
        performance: {
          avgResetAcceptable,
          maxResetAcceptable
        },
        sampleTimes: resetTimes.slice(0, 10)
      }
    };
    
  } catch (error) {
    return {
      testName: 'Reset Performance',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test memory stability under load
 */
export const testMemoryStability = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Memory Stability...');
  
  const startTime = performance.now();
  
  try {
    if (!(performance as any).memory) {
      return {
        testName: 'Memory Stability',
        success: true,
        duration: performance.now() - startTime,
        details: { 
          message: 'Memory API not available - test skipped',
          note: 'This is normal in some browsers'
        }
      };
    }
    
    const cycles = 20;
    const memorySnapshots: any[] = [];
    
    // Record initial memory
    memorySnapshots.push({
      cycle: 0,
      memory: {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize
      }
    });
    
    for (let cycle = 1; cycle <= cycles; cycle++) {
      // Simulate heavy usage
      resetAllGameState();
      
      for (let i = 0; i < 10; i++) {
        createCharacterAtomically({
          name: `Memory Test ${cycle}-${i}`,
          background: ['scholar', 'athlete', 'artist', 'social'][i % 4],
          attributes: {
            intelligence: 60 + (i * 5),
            creativity: 60 + (i * 3),
            charisma: 60 + (i * 7)
          },
          domainAdjustments: {}
        });
        
        resetAllGameState();
      }
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Record memory
      memorySnapshots.push({
        cycle,
        memory: {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize
        }
      });
    }
    
    // Analyze memory growth
    const initialMemory = memorySnapshots[0].memory.used;
    const finalMemory = memorySnapshots[memorySnapshots.length - 1].memory.used;
    const memoryGrowth = finalMemory - initialMemory;
    const growthPercentage = (memoryGrowth / initialMemory) * 100;
    
    // Check for memory leaks (growth > 50% is concerning)
    const memoryStable = growthPercentage < 50;
    
    return {
      testName: 'Memory Stability',
      success: memoryStable,
      duration: performance.now() - startTime,
      details: {
        cycles,
        initialMemory,
        finalMemory,
        memoryGrowth,
        growthPercentage,
        memoryStable,
        snapshots: memorySnapshots
      }
    };
    
  } catch (error) {
    return {
      testName: 'Memory Stability',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Run all performance tests
 */
export const runAllPerformanceTests = async (): Promise<FlowTestResult[]> => {
  console.log('🧪 Running Complete Performance test suite...');
  
  const tests = [
    testCharacterCreationPerformance,
    testStoreUpdatePerformance,
    testStateCapturePerformance,
    testResetPerformance,
    testMemoryStability
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
  
  console.log(`\n🧪 Performance test suite complete: ${passedTests}/${totalTests} tests passed`);
  
  return results;
};

// Browser console access for development
if (typeof window !== 'undefined') {
  (window as any).testCharacterCreationPerformance = testCharacterCreationPerformance;
  (window as any).testStoreUpdatePerformance = testStoreUpdatePerformance;
  (window as any).testStateCapturePerformance = testStateCapturePerformance;
  (window as any).testResetPerformance = testResetPerformance;
  (window as any).testMemoryStability = testMemoryStability;
  (window as any).runAllPerformanceTests = runAllPerformanceTests;
  
  console.log('🧪 Performance Test Suite loaded');
  console.log('   testCharacterCreationPerformance() - Character creation under load');
  console.log('   testStoreUpdatePerformance() - Store update throughput');
  console.log('   testStateCapturePerformance() - State capture speed');
  console.log('   testResetPerformance() - Reset operation speed');
  console.log('   testMemoryStability() - Memory leak detection');
  console.log('   runAllPerformanceTests() - Run complete suite');
}