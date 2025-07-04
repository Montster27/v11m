// Reliability Test Suite
import { globalTimeoutManager } from './timeoutManager';
import { isAppStoreAvailable, isNPCStoreAvailable, getAppState, getNPCStore } from '../types/global';
import { AsyncQueue } from './debounce';

interface ReliabilityTestResult {
  testName: string;
  passed: boolean;
  details: string;
  timing?: number;
}

export class ReliabilityTester {
  private results: ReliabilityTestResult[] = [];

  async runAllTests(): Promise<ReliabilityTestResult[]> {
    this.results = [];
    
    console.log('🔬 Starting Reliability Test Suite...');
    
    await this.testTimeoutManager();
    await this.testGlobalTypeGuards();
    await this.testAsyncQueue();
    await this.testErrorBoundaryRecovery();
    await this.testMemoryLeakPrevention();
    
    console.log('✅ Reliability Test Suite Complete');
    this.printResults();
    
    return this.results;
  }

  private async testTimeoutManager(): Promise<void> {
    const start = performance.now();
    
    try {
      let callCount = 0;
      
      // Test timeout management
      globalTimeoutManager.setTimeout(() => {
        callCount++;
      }, 10);
      
      globalTimeoutManager.setTimeout(() => {
        callCount++;
      }, 20);
      
      // Wait for timeouts to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const activeCount = globalTimeoutManager.getActiveCount();
      
      this.results.push({
        testName: 'Timeout Manager',
        passed: callCount === 2 && activeCount.timeouts === 0,
        details: `Executed ${callCount}/2 timeouts, ${activeCount.timeouts} still active`,
        timing: performance.now() - start
      });
      
    } catch (error) {
      this.results.push({
        testName: 'Timeout Manager',
        passed: false,
        details: `Error: ${error}`,
        timing: performance.now() - start
      });
    }
  }

  private async testGlobalTypeGuards(): Promise<void> {
    const start = performance.now();
    
    try {
      // Test type guards
      const appAvailable = isAppStoreAvailable();
      const npcAvailable = isNPCStoreAvailable();
      
      // Test safe accessors
      const appState = getAppState();
      const npcStore = getNPCStore();
      
      let passed = true;
      let details = '';
      
      // Validate type guards return boolean
      if (typeof appAvailable !== 'boolean') {
        passed = false;
        details += 'isAppStoreAvailable not returning boolean. ';
      }
      
      if (typeof npcAvailable !== 'boolean') {
        passed = false;
        details += 'isNPCStoreAvailable not returning boolean. ';
      }
      
      // Validate safe accessors handle missing stores gracefully
      if (appState !== null && typeof appState !== 'object') {
        passed = false;
        details += 'getAppState not returning object or null. ';
      }
      
      if (npcStore !== null && typeof npcStore !== 'object') {
        passed = false;
        details += 'getNPCStore not returning object or null. ';
      }
      
      this.results.push({
        testName: 'Global Type Guards',
        passed,
        details: details || 'All type guards functioning correctly',
        timing: performance.now() - start
      });
      
    } catch (error) {
      this.results.push({
        testName: 'Global Type Guards',
        passed: false,
        details: `Error: ${error}`,
        timing: performance.now() - start
      });
    }
  }

  private async testAsyncQueue(): Promise<void> {
    const start = performance.now();
    
    try {
      const queue = new AsyncQueue();
      const results: number[] = [];
      
      // Add multiple operations
      const promises = [
        queue.add(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          results.push(1);
          return 1;
        }),
        queue.add(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          results.push(2);
          return 2;
        }),
        queue.add(async () => {
          results.push(3);
          return 3;
        })
      ];
      
      await Promise.all(promises);
      
      // Verify operations executed in order
      const passed = results.length === 3 && 
                   results[0] === 1 && 
                   results[1] === 2 && 
                   results[2] === 3;
      
      this.results.push({
        testName: 'Async Queue',
        passed,
        details: `Executed ${results.length}/3 operations in order: [${results.join(', ')}]`,
        timing: performance.now() - start
      });
      
    } catch (error) {
      this.results.push({
        testName: 'Async Queue',
        passed: false,
        details: `Error: ${error}`,
        timing: performance.now() - start
      });
    }
  }

  private async testErrorBoundaryRecovery(): Promise<void> {
    const start = performance.now();
    
    try {
      // Test error boundary exists and is importable
      const ErrorBoundary = await import('../components/ErrorBoundary');
      
      const passed = typeof ErrorBoundary.ErrorBoundary === 'function' ||
                    typeof ErrorBoundary.default === 'function';
      
      this.results.push({
        testName: 'Error Boundary',
        passed,
        details: passed ? 'Error boundary component available' : 'Error boundary not found',
        timing: performance.now() - start
      });
      
    } catch (error) {
      this.results.push({
        testName: 'Error Boundary',
        passed: false,
        details: `Error importing: ${error}`,
        timing: performance.now() - start
      });
    }
  }

  private async testMemoryLeakPrevention(): Promise<void> {
    const start = performance.now();
    
    try {
      // Test timeout cleanup
      const initialCount = globalTimeoutManager.getActiveCount();
      
      // Create and clear timeouts
      const timeoutId = globalTimeoutManager.setTimeout(() => {}, 1000);
      globalTimeoutManager.clearTimeout(timeoutId);
      
      const afterCount = globalTimeoutManager.getActiveCount();
      
      const passed = afterCount.timeouts === initialCount.timeouts;
      
      this.results.push({
        testName: 'Memory Leak Prevention',
        passed,
        details: `Timeout cleanup working: ${initialCount.timeouts} → ${afterCount.timeouts}`,
        timing: performance.now() - start
      });
      
    } catch (error) {
      this.results.push({
        testName: 'Memory Leak Prevention',
        passed: false,
        details: `Error: ${error}`,
        timing: performance.now() - start
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 Reliability Test Results:');
    console.log('═'.repeat(60));
    
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const timing = result.timing ? ` (${result.timing.toFixed(2)}ms)` : '';
      console.log(`${status} ${result.testName}${timing}`);
      console.log(`   ${result.details}`);
    });
    
    console.log('═'.repeat(60));
    console.log(`📈 Overall: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
    
    if (passed === total) {
      console.log('🎉 All reliability tests passed!');
    } else {
      console.log('⚠️  Some reliability issues detected. Review failed tests.');
    }
  }

  getResults(): ReliabilityTestResult[] {
    return this.results;
  }

  getPassRate(): number {
    if (this.results.length === 0) return 0;
    const passed = this.results.filter(r => r.passed).length;
    return (passed / this.results.length) * 100;
  }
}

// Global instance for console access
if (typeof window !== 'undefined') {
  (window as any).runReliabilityTests = async () => {
    const tester = new ReliabilityTester();
    return await tester.runAllTests();
  };
}