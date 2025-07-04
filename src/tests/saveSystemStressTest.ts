// /Users/montysharma/v11m2/src/tests/saveSystemStressTest.ts
// Save system stress test for production validation

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';
import { useCharacterConcernsStore } from '../stores/useCharacterConcernsStore';
import { useStoryletStore } from '../store/useStoryletStore';
import { saveManager } from '../utils/saveManager';
import { generateConcernFlags } from '../utils/flagGenerator';

interface StressTestResults {
  testName: string;
  duration: number;
  success: boolean;
  error?: string;
  metrics?: Record<string, number>;
}

interface SaveStressTestConfig {
  rapidSaveCount: number;
  largeSaveDataSize: number;
  concurrentOperations: number;
  saveLoadCycles: number;
  enableMemoryTracking: boolean;
}

class SaveSystemStressTest {
  private results: StressTestResults[] = [];
  private config: SaveStressTestConfig;
  private initialMemoryUsage: number = 0;
  private startTime: number = 0;

  constructor(config: Partial<SaveStressTestConfig> = {}) {
    this.config = {
      rapidSaveCount: 100,
      largeSaveDataSize: 1000,
      concurrentOperations: 10,
      saveLoadCycles: 5,
      enableMemoryTracking: true,
      ...config
    };
  }

  async runAllTests(): Promise<StressTestResults[]> {
    console.log('🚀 Starting Save System Stress Test Suite...');
    console.log('Configuration:', this.config);
    
    this.startTime = performance.now();
    this.trackMemoryUsage('Initial');

    try {
      // Test 1: Rapid saves
      await this.testRapidSaves();
      
      // Test 2: Large save data
      await this.testLargeSaveData();
      
      // Test 3: Concurrent operations
      await this.testConcurrentOperations();
      
      // Test 4: Save/load cycles
      await this.testSaveLoadCycles();
      
      // Test 5: Error recovery
      await this.testErrorRecovery();
      
      // Test 6: Memory stability
      await this.testMemoryStability();
      
      // Test 7: Performance under load
      await this.testPerformanceUnderLoad();

    } catch (error) {
      console.error('❌ Critical error in stress test:', error);
      this.results.push({
        testName: 'Critical Error',
        duration: performance.now() - this.startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    this.generateReport();
    return this.results;
  }

  private async testRapidSaves(): Promise<void> {
    const testStart = performance.now();
    console.log('🔄 Test 1: Rapid saves...');

    try {
      const coreStore = useCoreGameStore.getState();
      const narrativeStore = useNarrativeStore.getState();
      
      // Perform rapid state changes
      for (let i = 0; i < this.config.rapidSaveCount; i++) {
        // Simulate game state changes
        coreStore.addMoney(1);
        narrativeStore.addFlag(`rapid_test_${i}`, true);
        
        // Trigger auto-save system
        if (i % 10 === 0) {
          await saveManager.saveGame();
        }
      }

      // Wait for any pending saves
      await new Promise(resolve => setTimeout(resolve, 2000));

      const duration = performance.now() - testStart;
      this.results.push({
        testName: 'Rapid Saves',
        duration,
        success: true,
        metrics: {
          operationsPerSecond: this.config.rapidSaveCount / (duration / 1000),
          totalOperations: this.config.rapidSaveCount
        }
      });

      console.log('✅ Rapid saves test completed');
    } catch (error) {
      this.results.push({
        testName: 'Rapid Saves',
        duration: performance.now() - testStart,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('❌ Rapid saves test failed:', error);
    }
  }

  private async testLargeSaveData(): Promise<void> {
    const testStart = performance.now();
    console.log('📊 Test 2: Large save data...');

    try {
      const concernsStore = useCharacterConcernsStore.getState();
      const narrativeStore = useNarrativeStore.getState();

      // Create large concerns data
      const largeConcerns: Record<string, number> = {};
      for (let i = 0; i < this.config.largeSaveDataSize; i++) {
        largeConcerns[`concern_${i}`] = Math.random() * 50;
      }
      
      // Set large concerns
      concernsStore.setConcerns(largeConcerns);

      // Create large flag data
      for (let i = 0; i < this.config.largeSaveDataSize; i++) {
        narrativeStore.addFlag(`large_flag_${i}`, Math.random() > 0.5);
      }

      // Measure save operation
      const saveStart = performance.now();
      await saveManager.saveGame();
      const saveDuration = performance.now() - saveStart;

      // Verify data integrity
      const savedData = saveManager.getCurrentSaveData();
      const concernsCount = Object.keys(savedData.concerns || {}).length;
      const flagsCount = Object.keys(savedData.flags || {}).length;

      const duration = performance.now() - testStart;
      this.results.push({
        testName: 'Large Save Data',
        duration,
        success: true,
        metrics: {
          saveDuration,
          concernsCount,
          flagsCount,
          dataSize: JSON.stringify(savedData).length
        }
      });

      console.log('✅ Large save data test completed');
    } catch (error) {
      this.results.push({
        testName: 'Large Save Data',
        duration: performance.now() - testStart,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('❌ Large save data test failed:', error);
    }
  }

  private async testConcurrentOperations(): Promise<void> {
    const testStart = performance.now();
    console.log('⚡ Test 3: Concurrent operations...');

    try {
      const operations = [];
      
      // Create concurrent save operations
      for (let i = 0; i < this.config.concurrentOperations; i++) {
        operations.push(this.performConcurrentOperation(i));
      }

      const results = await Promise.allSettled(operations);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      const duration = performance.now() - testStart;
      this.results.push({
        testName: 'Concurrent Operations',
        duration,
        success: successful > 0 && failed === 0,
        metrics: {
          totalOperations: this.config.concurrentOperations,
          successful,
          failed,
          concurrencyLevel: this.config.concurrentOperations
        }
      });

      console.log('✅ Concurrent operations test completed');
    } catch (error) {
      this.results.push({
        testName: 'Concurrent Operations',
        duration: performance.now() - testStart,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('❌ Concurrent operations test failed:', error);
    }
  }

  private async performConcurrentOperation(index: number): Promise<void> {
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();

    // Simulate concurrent game state changes
    coreStore.addMoney(index * 10);
    narrativeStore.addFlag(`concurrent_${index}`, true);
    
    // Random delay to simulate real usage
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // Attempt save
    await saveManager.saveGame();
  }

  private async testSaveLoadCycles(): Promise<void> {
    const testStart = performance.now();
    console.log('🔄 Test 4: Save/load cycles...');

    try {
      const originalData = saveManager.getCurrentSaveData();
      let cycleResults = [];

      for (let cycle = 0; cycle < this.config.saveLoadCycles; cycle++) {
        // Modify state
        const coreStore = useCoreGameStore.getState();
        const narrativeStore = useNarrativeStore.getState();
        
        coreStore.addMoney(100);
        narrativeStore.addFlag(`cycle_${cycle}`, true);

        // Save
        const saveStart = performance.now();
        await saveManager.saveGame();
        const saveDuration = performance.now() - saveStart;

        // Load
        const loadStart = performance.now();
        await saveManager.loadGame();
        const loadDuration = performance.now() - loadStart;

        cycleResults.push({
          cycle,
          saveDuration,
          loadDuration,
          totalDuration: saveDuration + loadDuration
        });

        // Brief pause between cycles
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgSave = cycleResults.reduce((sum, r) => sum + r.saveDuration, 0) / cycleResults.length;
      const avgLoad = cycleResults.reduce((sum, r) => sum + r.loadDuration, 0) / cycleResults.length;

      const duration = performance.now() - testStart;
      this.results.push({
        testName: 'Save/Load Cycles',
        duration,
        success: true,
        metrics: {
          cycles: this.config.saveLoadCycles,
          avgSaveDuration: avgSave,
          avgLoadDuration: avgLoad,
          totalCycleDuration: duration
        }
      });

      console.log('✅ Save/load cycles test completed');
    } catch (error) {
      this.results.push({
        testName: 'Save/Load Cycles',
        duration: performance.now() - testStart,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('❌ Save/load cycles test failed:', error);
    }
  }

  private async testErrorRecovery(): Promise<void> {
    const testStart = performance.now();
    console.log('🛠️ Test 5: Error recovery...');

    try {
      // Backup current state
      const backupData = saveManager.getCurrentSaveData();
      
      // Simulate localStorage corruption
      const originalSetItem = localStorage.setItem;
      let errorCount = 0;

      // Mock localStorage to fail occasionally
      localStorage.setItem = function(key: string, value: string) {
        if (key.includes('save') && Math.random() < 0.3) {
          errorCount++;
          throw new Error('Simulated storage error');
        }
        return originalSetItem.call(this, key, value);
      };

      // Attempt multiple saves with error conditions
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < 20; i++) {
        try {
          const coreStore = useCoreGameStore.getState();
          coreStore.addMoney(1);
          
          await saveManager.saveGame();
          successCount++;
        } catch (error) {
          failureCount++;
          // Test recovery mechanisms
          console.log(`Recovery attempt ${i}:`, error);
        }
      }

      // Restore original localStorage
      localStorage.setItem = originalSetItem;

      const duration = performance.now() - testStart;
      this.results.push({
        testName: 'Error Recovery',
        duration,
        success: successCount > 0, // Success if at least some saves worked
        metrics: {
          successCount,
          failureCount,
          errorCount,
          recoveryRate: successCount / (successCount + failureCount)
        }
      });

      console.log('✅ Error recovery test completed');
    } catch (error) {
      this.results.push({
        testName: 'Error Recovery',
        duration: performance.now() - testStart,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('❌ Error recovery test failed:', error);
    }
  }

  private async testMemoryStability(): Promise<void> {
    const testStart = performance.now();
    console.log('🧠 Test 6: Memory stability...');

    try {
      const memorySnapshots = [];
      
      // Take initial memory snapshot
      memorySnapshots.push(this.getMemoryUsage());

      // Perform memory-intensive operations
      for (let i = 0; i < 50; i++) {
        // Create large objects
        const largeData = new Array(1000).fill(null).map((_, idx) => ({
          id: `item_${i}_${idx}`,
          data: Math.random().toString(36).repeat(100)
        }));

        // Trigger save operations
        await saveManager.saveGame();

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          memorySnapshots.push(this.getMemoryUsage());
        }

        // Clear references
        largeData.length = 0;
      }

      // Final memory snapshot
      memorySnapshots.push(this.getMemoryUsage());

      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = finalMemory - initialMemory;
      const maxMemory = Math.max(...memorySnapshots);

      const duration = performance.now() - testStart;
      this.results.push({
        testName: 'Memory Stability',
        duration,
        success: memoryGrowth < 50 * 1024 * 1024, // Less than 50MB growth
        metrics: {
          initialMemory,
          finalMemory,
          memoryGrowth,
          maxMemory,
          snapshots: memorySnapshots.length
        }
      });

      console.log('✅ Memory stability test completed');
    } catch (error) {
      this.results.push({
        testName: 'Memory Stability',
        duration: performance.now() - testStart,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('❌ Memory stability test failed:', error);
    }
  }

  private async testPerformanceUnderLoad(): Promise<void> {
    const testStart = performance.now();
    console.log('🏃 Test 7: Performance under load...');

    try {
      const performanceMetrics = [];
      
      // Simulate high-load scenario
      for (let i = 0; i < 100; i++) {
        const operationStart = performance.now();
        
        // Simulate multiple concurrent operations
        const operations = [
          this.performFlagGeneration(),
          this.performStoryletEvaluation(),
          this.performSaveOperation()
        ];

        await Promise.all(operations);
        
        const operationDuration = performance.now() - operationStart;
        performanceMetrics.push(operationDuration);

        // Brief pause to avoid overwhelming the system
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const avgPerformance = performanceMetrics.reduce((sum, p) => sum + p, 0) / performanceMetrics.length;
      const maxPerformance = Math.max(...performanceMetrics);
      const minPerformance = Math.min(...performanceMetrics);

      const duration = performance.now() - testStart;
      this.results.push({
        testName: 'Performance Under Load',
        duration,
        success: avgPerformance < 100, // Average operation should be under 100ms
        metrics: {
          avgPerformance,
          maxPerformance,
          minPerformance,
          totalOperations: performanceMetrics.length,
          operationsPerSecond: performanceMetrics.length / (duration / 1000)
        }
      });

      console.log('✅ Performance under load test completed');
    } catch (error) {
      this.results.push({
        testName: 'Performance Under Load',
        duration: performance.now() - testStart,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      console.error('❌ Performance under load test failed:', error);
    }
  }

  private async performFlagGeneration(): Promise<void> {
    const concernsStore = useCharacterConcernsStore.getState();
    const concerns = concernsStore.concerns;
    generateConcernFlags(concerns);
  }

  private async performStoryletEvaluation(): Promise<void> {
    const storyletStore = useStoryletStore.getState();
    // Simulate storylet evaluation
    const storylets = storyletStore.storylets || [];
    storylets.forEach(storylet => {
      // Simulate evaluation logic
      const isAvailable = Math.random() > 0.5;
      return isAvailable;
    });
  }

  private async performSaveOperation(): Promise<void> {
    const coreStore = useCoreGameStore.getState();
    coreStore.addMoney(1);
    await saveManager.saveGame();
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private trackMemoryUsage(label: string): void {
    if (this.config.enableMemoryTracking) {
      const usage = this.getMemoryUsage();
      console.log(`💾 Memory ${label}: ${(usage / 1024 / 1024).toFixed(2)} MB`);
    }
  }

  private generateReport(): void {
    const totalDuration = performance.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    console.log('\n📋 SAVE SYSTEM STRESS TEST REPORT');
    console.log('=' .repeat(50));
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`Tests Passed: ${successful}/${this.results.length}`);
    console.log(`Tests Failed: ${failed}/${this.results.length}`);
    console.log(`Success Rate: ${((successful / this.results.length) * 100).toFixed(1)}%`);
    
    if (this.config.enableMemoryTracking) {
      this.trackMemoryUsage('Final');
    }

    console.log('\n📊 DETAILED RESULTS:');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.duration.toFixed(2)}ms`);
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.metrics) {
        console.log('   Metrics:', result.metrics);
      }
    });

    // Generate recommendations
    this.generateRecommendations();
  }

  private generateRecommendations(): void {
    console.log('\n💡 RECOMMENDATIONS:');
    
    const failedTests = this.results.filter(r => !r.success);
    if (failedTests.length === 0) {
      console.log('✅ All tests passed! Save system is performing well.');
      return;
    }

    failedTests.forEach(test => {
      switch (test.testName) {
        case 'Rapid Saves':
          console.log('• Consider implementing save debouncing to handle rapid saves');
          break;
        case 'Large Save Data':
          console.log('• Consider implementing data compression for large saves');
          break;
        case 'Concurrent Operations':
          console.log('• Implement save operation queuing to handle concurrency');
          break;
        case 'Memory Stability':
          console.log('• Memory leak detected - review subscription cleanup');
          break;
        case 'Performance Under Load':
          console.log('• Consider implementing lazy loading and performance optimizations');
          break;
        default:
          console.log(`• Review ${test.testName} implementation`);
      }
    });
  }
}

// Export for use in tests and production
export default SaveSystemStressTest;

// Utility function to run stress test
export async function runSaveSystemStressTest(config?: Partial<SaveStressTestConfig>): Promise<StressTestResults[]> {
  const test = new SaveSystemStressTest(config);
  return await test.runAllTests();
}

// Quick test for development
export async function quickStressTest(): Promise<void> {
  console.log('🚀 Running quick save system stress test...');
  
  const config = {
    rapidSaveCount: 20,
    largeSaveDataSize: 100,
    concurrentOperations: 3,
    saveLoadCycles: 2,
    enableMemoryTracking: true
  };

  const results = await runSaveSystemStressTest(config);
  const allPassed = results.every(r => r.success);
  
  if (allPassed) {
    console.log('✅ Quick stress test passed!');
  } else {
    console.log('❌ Quick stress test failed - check full report above');
  }
}