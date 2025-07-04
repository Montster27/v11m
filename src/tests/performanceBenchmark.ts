// /Users/montysharma/v11m2/src/tests/performanceBenchmark.ts
// Performance benchmark suite for all optimizations

import { generateConcernFlags, getFlagGeneratorStats } from '../utils/flagGenerator';
import { useAvailableStorylets } from '../hooks/useAvailableStorylets';
import { saveManager } from '../utils/saveManager';
import { useCharacterConcernsStore } from '../stores/useCharacterConcernsStore';
import { useStoryletStore } from '../store/useStoryletStore';
import { useCoreGameStore, useNarrativeStore } from '../stores/v2';
import subscriptionManager from '../utils/subscriptionManager';
import { memoryLeakDetector } from '../utils/memoryLeakDetector';

interface BenchmarkResult {
  testName: string;
  iterations: number;
  avgTime: number;
  maxTime: number;
  minTime: number;
  medianTime: number;
  standardDeviation: number;
  operationsPerSecond: number;
  memoryUsage?: number;
  cacheHitRate?: number;
  success: boolean;
  error?: string;
}

interface BenchmarkSuite {
  suiteName: string;
  results: BenchmarkResult[];
  totalDuration: number;
  overallSuccess: boolean;
}

interface BenchmarkConfig {
  iterations: number;
  warmupIterations: number;
  enableMemoryTracking: boolean;
  enableCacheAnalysis: boolean;
  targetPerformance: {
    flagGeneration: number; // ms
    storyletEvaluation: number; // ms
    saveOperation: number; // ms
    subscriptionManagement: number; // ms
  };
}

class PerformanceBenchmark {
  private config: BenchmarkConfig;
  private results: BenchmarkSuite[] = [];

  constructor(config: Partial<BenchmarkConfig> = {}) {
    this.config = {
      iterations: 100,
      warmupIterations: 10,
      enableMemoryTracking: true,
      enableCacheAnalysis: true,
      targetPerformance: {
        flagGeneration: 10, // 10ms target
        storyletEvaluation: 50, // 50ms target
        saveOperation: 100, // 100ms target
        subscriptionManagement: 5 // 5ms target
      },
      ...config
    };
  }

  async runFullBenchmark(): Promise<BenchmarkSuite[]> {
    console.log('🏃 Starting Performance Benchmark Suite...');
    console.log('Configuration:', this.config);

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Run benchmark suites
      await this.runFlagGenerationBenchmark();
      await this.runStoryletEvaluationBenchmark();
      await this.runSaveOperationBenchmark();
      await this.runSubscriptionManagementBenchmark();
      await this.runMemoryManagementBenchmark();
      await this.runIntegratedWorkflowBenchmark();

      // Generate comprehensive report
      this.generateBenchmarkReport();

    } catch (error) {
      console.error('❌ Benchmark suite failed:', error);
    }

    return this.results;
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');
    
    // Reset all stores and managers
    subscriptionManager.cleanupAll();
    memoryLeakDetector.reset();
    
    // Initialize test data
    const concernsStore = useCharacterConcernsStore.getState();
    const testConcerns = {
      family: 25,
      career: 30,
      health: 20,
      relationships: 35,
      finances: 40
    };
    concernsStore.setConcerns(testConcerns);

    // Initialize storylets
    const storyletStore = useStoryletStore.getState();
    const testStorylets = Array.from({ length: 100 }, (_, i) => ({
      id: `test_storylet_${i}`,
      title: `Test Storylet ${i}`,
      description: `Test storylet for benchmarking ${i}`,
      requirements: {
        flags: [`flag_${i % 10}`],
        concerns: i % 2 === 0 ? { family: 10 } : { career: 15 }
      },
      effects: {
        flags: [`result_${i}`],
        concerns: { family: 1 }
      }
    }));
    
    // Set test storylets
    storyletStore.setStorylets(testStorylets);

    console.log('✅ Test environment ready');
  }

  private async runFlagGenerationBenchmark(): Promise<void> {
    console.log('🏴 Flag Generation Benchmark...');
    
    const suite: BenchmarkSuite = {
      suiteName: 'Flag Generation',
      results: [],
      totalDuration: 0,
      overallSuccess: true
    };

    const suiteStart = performance.now();

    // Test 1: Basic flag generation
    suite.results.push(await this.benchmarkFunction(
      'Basic Flag Generation',
      () => {
        const concerns = useCharacterConcernsStore.getState().concerns;
        return generateConcernFlags(concerns);
      }
    ));

    // Test 2: Memoization effectiveness
    suite.results.push(await this.benchmarkFunction(
      'Memoized Flag Generation',
      () => {
        const concerns = useCharacterConcernsStore.getState().concerns;
        // Call multiple times to test cache
        generateConcernFlags(concerns);
        generateConcernFlags(concerns);
        return generateConcernFlags(concerns);
      }
    ));

    // Test 3: Large concern sets
    suite.results.push(await this.benchmarkFunction(
      'Large Concern Set Flag Generation',
      () => {
        const largeConcerns = Array.from({ length: 50 }, (_, i) => [
          `concern_${i}`, Math.random() * 50
        ]).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, number>);
        
        return generateConcernFlags(largeConcerns);
      }
    ));

    // Test 4: Cache performance analysis
    if (this.config.enableCacheAnalysis) {
      const initialStats = getFlagGeneratorStats();
      
      suite.results.push(await this.benchmarkFunction(
        'Cache Performance Analysis',
        () => {
          const concerns = useCharacterConcernsStore.getState().concerns;
          // Mix of cached and uncached calls
          generateConcernFlags(concerns);
          generateConcernFlags({ ...concerns, test: Math.random() });
          return generateConcernFlags(concerns);
        }
      ));

      const finalStats = getFlagGeneratorStats();
      const cacheHitRate = (finalStats.cacheHits / (finalStats.cacheHits + finalStats.cacheMisses)) * 100;
      console.log(`📊 Cache hit rate: ${cacheHitRate.toFixed(1)}%`);
    }

    suite.totalDuration = performance.now() - suiteStart;
    suite.overallSuccess = suite.results.every(r => r.success);
    this.results.push(suite);
  }

  private async runStoryletEvaluationBenchmark(): Promise<void> {
    console.log('📚 Storylet Evaluation Benchmark...');
    
    const suite: BenchmarkSuite = {
      suiteName: 'Storylet Evaluation',
      results: [],
      totalDuration: 0,
      overallSuccess: true
    };

    const suiteStart = performance.now();

    // Test 1: Standard storylet evaluation
    suite.results.push(await this.benchmarkFunction(
      'Standard Storylet Evaluation',
      () => {
        const { evaluateStorylets } = useAvailableStorylets();
        return evaluateStorylets();
      }
    ));

    // Test 2: Batched evaluation
    suite.results.push(await this.benchmarkFunction(
      'Batched Storylet Evaluation',
      () => {
        const { evaluateStorylets } = useAvailableStorylets({
          batchSize: 25,
          enableIdleCallback: false
        });
        return evaluateStorylets();
      }
    ));

    // Test 3: Large storylet set
    suite.results.push(await this.benchmarkFunction(
      'Large Storylet Set Evaluation',
      async () => {
        // Create large storylet set
        const largeStorylets = Array.from({ length: 500 }, (_, i) => ({
          id: `large_storylet_${i}`,
          title: `Large Storylet ${i}`,
          description: `Large storylet for benchmarking ${i}`,
          requirements: {
            flags: [`flag_${i % 20}`],
            concerns: { family: Math.random() * 50 }
          },
          effects: {
            flags: [`result_${i}`],
            concerns: { family: 1 }
          }
        }));

        const storyletStore = useStoryletStore.getState();
        storyletStore.setStorylets(largeStorylets);

        const { evaluateStorylets } = useAvailableStorylets({
          batchSize: 50,
          enableIdleCallback: false
        });
        
        return evaluateStorylets();
      }
    ));

    // Test 4: Concurrent evaluation
    suite.results.push(await this.benchmarkFunction(
      'Concurrent Storylet Evaluation',
      async () => {
        const { evaluateStorylets } = useAvailableStorylets();
        
        // Run multiple evaluations concurrently
        const promises = Array.from({ length: 5 }, () => evaluateStorylets());
        return Promise.all(promises);
      }
    ));

    suite.totalDuration = performance.now() - suiteStart;
    suite.overallSuccess = suite.results.every(r => r.success);
    this.results.push(suite);
  }

  private async runSaveOperationBenchmark(): Promise<void> {
    console.log('💾 Save Operation Benchmark...');
    
    const suite: BenchmarkSuite = {
      suiteName: 'Save Operations',
      results: [],
      totalDuration: 0,
      overallSuccess: true
    };

    const suiteStart = performance.now();

    // Test 1: Basic save operation
    suite.results.push(await this.benchmarkFunction(
      'Basic Save Operation',
      async () => {
        const coreStore = useCoreGameStore.getState();
        coreStore.addMoney(1);
        await saveManager.saveGame();
        return true;
      }
    ));

    // Test 2: Large save data
    suite.results.push(await this.benchmarkFunction(
      'Large Save Data Operation',
      async () => {
        const narrativeStore = useNarrativeStore.getState();
        
        // Create large save data
        for (let i = 0; i < 100; i++) {
          narrativeStore.addFlag(`large_save_flag_${i}`, Math.random() > 0.5);
        }
        
        await saveManager.saveGame();
        return true;
      }
    ));

    // Test 3: Compressed save operation
    suite.results.push(await this.benchmarkFunction(
      'Compressed Save Operation',
      async () => {
        await saveManager.saveGame({ compress: true });
        return true;
      }
    ));

    // Test 4: Atomic save operation
    suite.results.push(await this.benchmarkFunction(
      'Atomic Save Operation',
      async () => {
        await saveManager.saveGame({ atomic: true });
        return true;
      }
    ));

    // Test 5: Save with validation
    suite.results.push(await this.benchmarkFunction(
      'Save with Validation',
      async () => {
        await saveManager.saveGame({ validate: true });
        return true;
      }
    ));

    suite.totalDuration = performance.now() - suiteStart;
    suite.overallSuccess = suite.results.every(r => r.success);
    this.results.push(suite);
  }

  private async runSubscriptionManagementBenchmark(): Promise<void> {
    console.log('🔗 Subscription Management Benchmark...');
    
    const suite: BenchmarkSuite = {
      suiteName: 'Subscription Management',
      results: [],
      totalDuration: 0,
      overallSuccess: true
    };

    const suiteStart = performance.now();

    // Test 1: Basic subscription management
    suite.results.push(await this.benchmarkFunction(
      'Basic Subscription Management',
      () => {
        const unsubscribe = jest.fn();
        subscriptionManager.add('benchmark_component', unsubscribe);
        const stats = subscriptionManager.getStats();
        subscriptionManager.cleanup('benchmark_component');
        return stats;
      }
    ));

    // Test 2: High-volume subscription tracking
    suite.results.push(await this.benchmarkFunction(
      'High-Volume Subscription Tracking',
      () => {
        for (let i = 0; i < 100; i++) {
          subscriptionManager.add(`benchmark_component_${i}`, jest.fn());
        }
        const stats = subscriptionManager.getStats();
        subscriptionManager.cleanupAll();
        return stats;
      }
    ));

    // Test 3: Memory leak detection
    suite.results.push(await this.benchmarkFunction(
      'Memory Leak Detection',
      () => {
        // Create components with excessive subscriptions
        for (let i = 0; i < 20; i++) {
          subscriptionManager.add('leak_test_component', jest.fn());
        }
        
        const leaks = subscriptionManager.detectLeaks();
        subscriptionManager.cleanupAll();
        return leaks;
      }
    ));

    // Test 4: Render tracking performance
    suite.results.push(await this.benchmarkFunction(
      'Render Tracking Performance',
      () => {
        for (let i = 0; i < 100; i++) {
          memoryLeakDetector.trackRender(`render_benchmark_${i % 10}`);
        }
        
        const report = memoryLeakDetector.generateReport();
        memoryLeakDetector.reset();
        return report;
      }
    ));

    suite.totalDuration = performance.now() - suiteStart;
    suite.overallSuccess = suite.results.every(r => r.success);
    this.results.push(suite);
  }

  private async runMemoryManagementBenchmark(): Promise<void> {
    console.log('🧠 Memory Management Benchmark...');
    
    const suite: BenchmarkSuite = {
      suiteName: 'Memory Management',
      results: [],
      totalDuration: 0,
      overallSuccess: true
    };

    const suiteStart = performance.now();

    // Test 1: Memory usage tracking
    suite.results.push(await this.benchmarkFunction(
      'Memory Usage Tracking',
      () => {
        const initialMemory = this.getMemoryUsage();
        
        // Create large objects
        const largeArray = new Array(10000).fill(0).map((_, i) => ({
          id: i,
          data: Math.random().toString(36).repeat(100)
        }));
        
        const finalMemory = this.getMemoryUsage();
        
        // Cleanup
        largeArray.length = 0;
        
        return { initialMemory, finalMemory, growth: finalMemory - initialMemory };
      }
    ));

    // Test 2: Garbage collection efficiency
    suite.results.push(await this.benchmarkFunction(
      'Garbage Collection Efficiency',
      () => {
        const initialMemory = this.getMemoryUsage();
        
        // Create and immediately discard objects
        for (let i = 0; i < 1000; i++) {
          const temp = new Array(1000).fill(Math.random());
          temp.length = 0;
        }
        
        // Force GC if available
        if (global.gc) {
          global.gc();
        }
        
        const finalMemory = this.getMemoryUsage();
        return { initialMemory, finalMemory, efficiency: initialMemory / finalMemory };
      }
    ));

    // Test 3: Memory leak detection accuracy
    suite.results.push(await this.benchmarkFunction(
      'Memory Leak Detection Accuracy',
      () => {
        const detector = memoryLeakDetector;
        
        // Create known leak patterns
        for (let i = 0; i < 50; i++) {
          detector.trackRender('leak_component');
        }
        
        const report = detector.generateReport();
        const hasWarnings = (report.warnings || []).length > 0;
        
        detector.reset();
        return { hasWarnings, warnings: report.warnings?.length || 0 };
      }
    ));

    suite.totalDuration = performance.now() - suiteStart;
    suite.overallSuccess = suite.results.every(r => r.success);
    this.results.push(suite);
  }

  private async runIntegratedWorkflowBenchmark(): Promise<void> {
    console.log('🔄 Integrated Workflow Benchmark...');
    
    const suite: BenchmarkSuite = {
      suiteName: 'Integrated Workflows',
      results: [],
      totalDuration: 0,
      overallSuccess: true
    };

    const suiteStart = performance.now();

    // Test 1: Complete game turn workflow
    suite.results.push(await this.benchmarkFunction(
      'Complete Game Turn Workflow',
      async () => {
        const concerns = useCharacterConcernsStore.getState().concerns;
        const coreStore = useCoreGameStore.getState();
        
        // 1. Generate flags
        const flags = generateConcernFlags(concerns);
        
        // 2. Evaluate storylets
        const { evaluateStorylets } = useAvailableStorylets();
        const storylets = await evaluateStorylets();
        
        // 3. Update game state
        coreStore.addMoney(10);
        
        // 4. Save game
        await saveManager.saveGame();
        
        return { flags: Object.keys(flags).length, storylets: storylets.length };
      }
    ));

    // Test 2: High-frequency game operations
    suite.results.push(await this.benchmarkFunction(
      'High-Frequency Game Operations',
      async () => {
        const results = [];
        
        for (let i = 0; i < 20; i++) {
          const concerns = useCharacterConcernsStore.getState().concerns;
          const flags = generateConcernFlags(concerns);
          const { evaluateStorylets } = useAvailableStorylets();
          const storylets = await evaluateStorylets();
          
          results.push({ flags: Object.keys(flags).length, storylets: storylets.length });
        }
        
        return results;
      }
    ));

    // Test 3: Concurrent user interactions
    suite.results.push(await this.benchmarkFunction(
      'Concurrent User Interactions',
      async () => {
        const operations = [
          this.simulateUserInteraction('save_game'),
          this.simulateUserInteraction('generate_flags'),
          this.simulateUserInteraction('evaluate_storylets'),
          this.simulateUserInteraction('update_concerns'),
          this.simulateUserInteraction('check_subscriptions')
        ];
        
        return Promise.all(operations);
      }
    ));

    suite.totalDuration = performance.now() - suiteStart;
    suite.overallSuccess = suite.results.every(r => r.success);
    this.results.push(suite);
  }

  private async simulateUserInteraction(type: string): Promise<any> {
    switch (type) {
      case 'save_game':
        return saveManager.saveGame();
      case 'generate_flags':
        const concerns = useCharacterConcernsStore.getState().concerns;
        return generateConcernFlags(concerns);
      case 'evaluate_storylets':
        const { evaluateStorylets } = useAvailableStorylets();
        return evaluateStorylets();
      case 'update_concerns':
        const concernsStore = useCharacterConcernsStore.getState();
        concernsStore.setConcerns({ ...concernsStore.concerns, test: Math.random() });
        return true;
      case 'check_subscriptions':
        return subscriptionManager.getStats();
      default:
        return true;
    }
  }

  private async benchmarkFunction(
    testName: string,
    fn: () => any,
    iterations = this.config.iterations
  ): Promise<BenchmarkResult> {
    console.log(`  🔍 ${testName}...`);
    
    const times: number[] = [];
    const initialMemory = this.getMemoryUsage();
    let error: string | undefined;
    
    try {
      // Warmup
      for (let i = 0; i < this.config.warmupIterations; i++) {
        await fn();
      }
      
      // Clear caches if needed
      if (global.gc) {
        global.gc();
      }
      
      // Actual benchmark
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        times.push(end - start);
      }
      
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error(`    ❌ ${testName} failed:`, error);
    }
    
    const finalMemory = this.getMemoryUsage();
    const sortedTimes = times.sort((a, b) => a - b);
    
    const result: BenchmarkResult = {
      testName,
      iterations,
      avgTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      maxTime: times.length > 0 ? Math.max(...times) : 0,
      minTime: times.length > 0 ? Math.min(...times) : 0,
      medianTime: times.length > 0 ? sortedTimes[Math.floor(sortedTimes.length / 2)] : 0,
      standardDeviation: this.calculateStandardDeviation(times),
      operationsPerSecond: times.length > 0 ? 1000 / (times.reduce((a, b) => a + b, 0) / times.length) : 0,
      memoryUsage: finalMemory - initialMemory,
      success: times.length > 0 && !error,
      error
    };
    
    // Check against target performance
    const targetKey = this.getTargetKey(testName);
    if (targetKey && result.avgTime > this.config.targetPerformance[targetKey]) {
      console.log(`    ⚠️  ${testName} exceeded target (${result.avgTime.toFixed(2)}ms > ${this.config.targetPerformance[targetKey]}ms)`);
    }
    
    return result;
  }

  private getTargetKey(testName: string): keyof BenchmarkConfig['targetPerformance'] | null {
    if (testName.toLowerCase().includes('flag')) return 'flagGeneration';
    if (testName.toLowerCase().includes('storylet')) return 'storyletEvaluation';
    if (testName.toLowerCase().includes('save')) return 'saveOperation';
    if (testName.toLowerCase().includes('subscription')) return 'subscriptionManagement';
    return null;
  }

  private calculateStandardDeviation(times: number[]): number {
    if (times.length === 0) return 0;
    
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
    return Math.sqrt(variance);
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private generateBenchmarkReport(): void {
    const totalDuration = this.results.reduce((sum, suite) => sum + suite.totalDuration, 0);
    const totalTests = this.results.reduce((sum, suite) => sum + suite.results.length, 0);
    const passedTests = this.results.reduce((sum, suite) => sum + suite.results.filter(r => r.success).length, 0);
    
    console.log('\n📊 PERFORMANCE BENCHMARK REPORT');
    console.log('=' .repeat(60));
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed Tests: ${passedTests}/${totalTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    this.results.forEach(suite => {
      console.log(`\n📋 ${suite.suiteName} (${suite.totalDuration.toFixed(2)}ms)`);
      console.log('-'.repeat(40));
      
      suite.results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const targetKey = this.getTargetKey(result.testName);
        const targetMet = targetKey ? result.avgTime <= this.config.targetPerformance[targetKey] : true;
        const performanceStatus = targetMet ? '🎯' : '⚠️';
        
        console.log(`${status} ${performanceStatus} ${result.testName}`);
        console.log(`    Avg: ${result.avgTime.toFixed(2)}ms | Max: ${result.maxTime.toFixed(2)}ms | Min: ${result.minTime.toFixed(2)}ms`);
        console.log(`    Ops/sec: ${result.operationsPerSecond.toFixed(0)} | Memory: ${(result.memoryUsage || 0) / 1024}KB`);
        
        if (result.error) {
          console.log(`    ❌ Error: ${result.error}`);
        }
        
        if (targetKey) {
          const target = this.config.targetPerformance[targetKey];
          const performance = result.avgTime <= target ? 'PASS' : 'FAIL';
          console.log(`    🎯 Target: ${target}ms | Performance: ${performance}`);
        }
      });
    });
    
    this.generatePerformanceRecommendations();
  }

  private generatePerformanceRecommendations(): void {
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
    
    const failedTests = this.results.flatMap(suite => 
      suite.results.filter(r => !r.success || this.isPerformancePoor(r))
    );
    
    if (failedTests.length === 0) {
      console.log('✅ All performance benchmarks passed target thresholds!');
      return;
    }
    
    failedTests.forEach(test => {
      console.log(`\n🔍 ${test.testName}:`);
      
      if (test.avgTime > 100) {
        console.log('  • Consider implementing caching or memoization');
      }
      
      if (test.memoryUsage && test.memoryUsage > 1024 * 1024) {
        console.log('  • Memory usage is high - review for memory leaks');
      }
      
      if (test.operationsPerSecond < 100) {
        console.log('  • Low throughput - consider optimizing algorithm');
      }
      
      if (test.standardDeviation > test.avgTime * 0.5) {
        console.log('  • High variance - inconsistent performance');
      }
      
      const targetKey = this.getTargetKey(test.testName);
      if (targetKey && test.avgTime > this.config.targetPerformance[targetKey]) {
        console.log(`  • Exceeds target by ${(test.avgTime - this.config.targetPerformance[targetKey]).toFixed(2)}ms`);
      }
    });
  }

  private isPerformancePoor(result: BenchmarkResult): boolean {
    const targetKey = this.getTargetKey(result.testName);
    return targetKey ? result.avgTime > this.config.targetPerformance[targetKey] : false;
  }
}

// Export for use in tests and production
export default PerformanceBenchmark;

// Utility functions
export async function runPerformanceBenchmark(config?: Partial<BenchmarkConfig>): Promise<BenchmarkSuite[]> {
  const benchmark = new PerformanceBenchmark(config);
  return await benchmark.runFullBenchmark();
}

export async function quickPerformanceBenchmark(): Promise<void> {
  console.log('🚀 Running quick performance benchmark...');
  
  const config = {
    iterations: 20,
    warmupIterations: 5,
    enableMemoryTracking: true,
    enableCacheAnalysis: true
  };
  
  const results = await runPerformanceBenchmark(config);
  const allPassed = results.every(suite => suite.overallSuccess);
  
  if (allPassed) {
    console.log('✅ Quick performance benchmark passed!');
  } else {
    console.log('❌ Quick performance benchmark failed - check full report above');
  }
}

// Development utility
export function average(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}