// /Users/montysharma/V11M2/test/testRunner.ts
// Testing Infrastructure Enhancements - Centralized test execution and enhanced tooling

import { runMigrationTestSuite } from '../../test/migration/dataMigrationTests';
import { runAtomicResetTestSuite } from '../../test/reset/atomicResetTests';
import { runAutoSaveTestSuite } from '../../test/autosave/autoSaveIntegrationTests';
import { runCrossStoreConsistencyTestSuite } from '../../test/consistency/crossStoreTests';
import { runFeatureParityTestSuite } from '../../test/parity/featureParityTests';
import { storeInspector } from './storeInspector';
import { optimisticMiddleware } from '../store/middleware/optimisticUpdates';

export interface TestSuiteResult {
  suiteName: string;
  success: boolean;
  duration: number;
  errors: string[];
  details: any;
  timestamp: number;
}

export interface TestRunResult {
  success: boolean;
  totalDuration: number;
  suiteResults: TestSuiteResult[];
  summary: {
    totalSuites: number;
    passedSuites: number;
    failedSuites: number;
    totalErrors: number;
  };
  timestamp: number;
}

export interface TestConfiguration {
  suites: {
    migration: boolean;
    atomicReset: boolean;
    autoSave: boolean;
    consistency: boolean;
    featureParity: boolean;
  };
  options: {
    stopOnFirstFailure: boolean;
    generateDetailedReport: boolean;
    cleanupAfterEach: boolean;
    captureStateSnapshots: boolean;
    validateStoreIntegrity: boolean;
  };
}

// Default test configuration
const DEFAULT_CONFIG: TestConfiguration = {
  suites: {
    migration: true,
    atomicReset: true,
    autoSave: true,
    consistency: true,
    featureParity: true
  },
  options: {
    stopOnFirstFailure: false,
    generateDetailedReport: true,
    cleanupAfterEach: true,
    captureStateSnapshots: false,
    validateStoreIntegrity: true
  }
};

/**
 * Enhanced Test Runner - Centralized execution of all test suites
 */
export class EnhancedTestRunner {
  private config: TestConfiguration;
  private stateSnapshots: Map<string, any> = new Map();
  
  constructor(config: Partial<TestConfiguration> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('🧪 Enhanced Test Runner initialized with config:', this.config);
  }
  
  /**
   * Run all configured test suites
   */
  async runAllTests(): Promise<TestRunResult> {
    console.log('🚀 Starting comprehensive test suite execution...');
    console.log('='.repeat(80));
    
    const startTime = performance.now();
    const suiteResults: TestSuiteResult[] = [];
    let shouldStop = false;
    
    // Pre-test store integrity check
    if (this.config.options.validateStoreIntegrity) {
      console.log('🔍 Pre-test store integrity validation...');
      const integrityReport = storeInspector.validateStoreIntegrity();
      if (!integrityReport.passed) {
        console.warn('⚠️ Store integrity issues detected before testing:', integrityReport.errors);
      }
    }
    
    // Capture initial state snapshot if requested
    if (this.config.options.captureStateSnapshots) {
      this.captureStateSnapshot('initial');
    }
    
    try {
      // Migration Test Suite
      if (this.config.suites.migration && !shouldStop) {
        const result = await this.runSuite('Data Migration', runMigrationTestSuite);
        suiteResults.push(result);
        
        if (!result.success && this.config.options.stopOnFirstFailure) {
          shouldStop = true;
        }
        
        if (this.config.options.cleanupAfterEach) {
          await this.cleanupBetweenSuites('migration');
        }
      }
      
      // Atomic Reset Test Suite
      if (this.config.suites.atomicReset && !shouldStop) {
        const result = await this.runSuite('Atomic Reset', runAtomicResetTestSuite);
        suiteResults.push(result);
        
        if (!result.success && this.config.options.stopOnFirstFailure) {
          shouldStop = true;
        }
        
        if (this.config.options.cleanupAfterEach) {
          await this.cleanupBetweenSuites('atomicReset');
        }
      }
      
      // Auto-Save Integration Test Suite
      if (this.config.suites.autoSave && !shouldStop) {
        const result = await this.runSuite('Auto-Save Integration', runAutoSaveTestSuite);
        suiteResults.push(result);
        
        if (!result.success && this.config.options.stopOnFirstFailure) {
          shouldStop = true;
        }
        
        if (this.config.options.cleanupAfterEach) {
          await this.cleanupBetweenSuites('autoSave');
        }
      }
      
      // Cross-Store Consistency Test Suite
      if (this.config.suites.consistency && !shouldStop) {
        const result = await this.runSuite('Cross-Store Consistency', runCrossStoreConsistencyTestSuite);
        suiteResults.push(result);
        
        if (!result.success && this.config.options.stopOnFirstFailure) {
          shouldStop = true;
        }
        
        if (this.config.options.cleanupAfterEach) {
          await this.cleanupBetweenSuites('consistency');
        }
      }
      
      // Feature Parity Test Suite
      if (this.config.suites.featureParity && !shouldStop) {
        const result = await this.runSuite('Feature Parity', runFeatureParityTestSuite);
        suiteResults.push(result);
        
        if (!result.success && this.config.options.stopOnFirstFailure) {
          shouldStop = true;
        }
        
        if (this.config.options.cleanupAfterEach) {
          await this.cleanupBetweenSuites('featureParity');
        }
      }
      
    } catch (error) {
      console.error('❌ Test runner encountered a fatal error:', error);
      suiteResults.push({
        suiteName: 'FATAL_ERROR',
        success: false,
        duration: 0,
        errors: [`Fatal test runner error: ${error}`],
        details: { error },
        timestamp: Date.now()
      });
    }
    
    // Capture final state snapshot if requested
    if (this.config.options.captureStateSnapshots) {
      this.captureStateSnapshot('final');
    }
    
    // Post-test store integrity check
    if (this.config.options.validateStoreIntegrity) {
      console.log('🔍 Post-test store integrity validation...');
      const integrityReport = storeInspector.validateStoreIntegrity();
      if (!integrityReport.passed) {
        console.warn('⚠️ Store integrity issues detected after testing:', integrityReport.errors);
      }
    }
    
    const totalDuration = performance.now() - startTime;
    const result = this.generateFinalReport(suiteResults, totalDuration);
    
    console.log('🏁 Comprehensive test execution completed');
    console.log('='.repeat(80));
    
    return result;
  }
  
  /**
   * Run individual test suite with enhanced reporting
   */
  private async runSuite(suiteName: string, suiteFunction: Function): Promise<TestSuiteResult> {
    console.log(`\n🧪 Running ${suiteName} Test Suite...`);
    console.log('-'.repeat(60));
    
    const startTime = performance.now();
    
    try {
      const suiteResult = await suiteFunction();
      const duration = performance.now() - startTime;
      
      const result: TestSuiteResult = {
        suiteName,
        success: suiteResult.success || false,
        duration,
        errors: suiteResult.errors || suiteResult.results?.errors || [],
        details: suiteResult,
        timestamp: Date.now()
      };
      
      console.log(`${result.success ? '✅' : '❌'} ${suiteName} Suite: ${result.success ? 'PASSED' : 'FAILED'}`);
      console.log(`⏱️ Duration: ${duration.toFixed(2)}ms`);
      
      if (!result.success && result.errors.length > 0) {
        console.log('❌ Errors:', result.errors);
      }
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ ${suiteName} Suite crashed:`, error);
      
      return {
        suiteName,
        success: false,
        duration,
        errors: [`Suite crashed: ${error}`],
        details: { error },
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Cleanup between test suites
   */
  private async cleanupBetweenSuites(suiteName: string): Promise<void> {
    console.log(`🧹 Cleaning up after ${suiteName} suite...`);
    
    try {
      // Rollback any optimistic updates
      optimisticMiddleware.rollbackAllOptimisticUpdates();
      
      // Reset all stores to clean state
      const { useCoreGameStore, useNarrativeStore, useSocialStore } = await import('../stores/v2');
      useCoreGameStore.getState().resetGame();
      useNarrativeStore.getState().resetNarrative();
      useSocialStore.getState().resetSocial();
      
      // Brief delay to allow state to settle
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log(`✅ Cleanup after ${suiteName} completed`);
    } catch (error) {
      console.warn(`⚠️ Cleanup after ${suiteName} failed:`, error);
    }
  }
  
  /**
   * Capture state snapshot for analysis
   */
  private captureStateSnapshot(label: string): void {
    try {
      const snapshot = storeInspector.exportStateSnapshot();
      this.stateSnapshots.set(label, snapshot);
      console.log(`📸 State snapshot '${label}' captured`);
    } catch (error) {
      console.warn(`⚠️ Failed to capture state snapshot '${label}':`, error);
    }
  }
  
  /**
   * Generate comprehensive final report
   */
  private generateFinalReport(suiteResults: TestSuiteResult[], totalDuration: number): TestRunResult {
    const passedSuites = suiteResults.filter(r => r.success).length;
    const failedSuites = suiteResults.length - passedSuites;
    const totalErrors = suiteResults.reduce((sum, r) => sum + r.errors.length, 0);
    
    const result: TestRunResult = {
      success: failedSuites === 0,
      totalDuration,
      suiteResults,
      summary: {
        totalSuites: suiteResults.length,
        passedSuites,
        failedSuites,
        totalErrors
      },
      timestamp: Date.now()
    };
    
    // Print comprehensive report
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));
    console.log(`⏱️ Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`📋 Suite Results:`);
    
    suiteResults.forEach(suite => {
      const status = suite.success ? '✅ PASSED' : '❌ FAILED';
      const duration = suite.duration.toFixed(2);
      console.log(`   ${suite.suiteName}: ${status} (${duration}ms)`);
      
      if (!suite.success && suite.errors.length > 0) {
        suite.errors.forEach(error => {
          console.log(`      └─ ❌ ${error}`);
        });
      }
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Suites: ${result.summary.totalSuites}`);
    console.log(`   Passed: ${result.summary.passedSuites}`);
    console.log(`   Failed: ${result.summary.failedSuites}`);
    console.log(`   Total Errors: ${result.summary.totalErrors}`);
    
    // State snapshot comparison if available
    if (this.stateSnapshots.has('initial') && this.stateSnapshots.has('final')) {
      console.log(`\n📸 State Snapshot Analysis:`);
      const initialSnapshot = this.stateSnapshots.get('initial');
      const finalSnapshot = this.stateSnapshots.get('final');
      const stateDiff = storeInspector.compareStates(initialSnapshot, finalSnapshot);
      
      console.log(`   Core Store Changes: ${Object.keys(stateDiff.core).length} differences`);
      console.log(`   Narrative Store Changes: ${Object.keys(stateDiff.narrative).length} differences`);
      console.log(`   Social Store Changes: ${Object.keys(stateDiff.social).length} differences`);
    }
    
    // Store metrics analysis
    if (this.config.options.generateDetailedReport) {
      console.log(`\n🔍 Store Metrics Analysis:`);
      const metrics = storeInspector.getStoreMetrics();
      console.log(`   Core Store: ${(metrics.core.size / 1024).toFixed(2)}KB (complexity: ${metrics.core.complexity})`);
      console.log(`   Narrative Store: ${(metrics.narrative.size / 1024).toFixed(2)}KB (complexity: ${metrics.narrative.complexity})`);
      console.log(`   Social Store: ${(metrics.social.size / 1024).toFixed(2)}KB (complexity: ${metrics.social.complexity})`);
    }
    
    console.log(`\n🚀 Final Verdict: ${result.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(80));
    
    return result;
  }
  
  /**
   * Run specific test suite by name
   */
  async runSpecificSuite(suiteName: string): Promise<TestSuiteResult> {
    console.log(`🎯 Running specific suite: ${suiteName}`);
    
    switch (suiteName.toLowerCase()) {
      case 'migration':
        return this.runSuite('Data Migration', runMigrationTestSuite);
      case 'atomic':
      case 'reset':
        return this.runSuite('Atomic Reset', runAtomicResetTestSuite);
      case 'autosave':
        return this.runSuite('Auto-Save Integration', runAutoSaveTestSuite);
      case 'consistency':
        return this.runSuite('Cross-Store Consistency', runCrossStoreConsistencyTestSuite);
      case 'parity':
      case 'feature':
        return this.runSuite('Feature Parity', runFeatureParityTestSuite);
      default:
        throw new Error(`Unknown test suite: ${suiteName}`);
    }
  }
  
  /**
   * Get available test suites
   */
  getAvailableSuites(): string[] {
    return ['migration', 'atomic', 'autosave', 'consistency', 'parity'];
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TestConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Test runner configuration updated:', this.config);
  }
}

// Global test runner instance
export const globalTestRunner = new EnhancedTestRunner();

// Convenience functions for quick testing
export const runAllTests = (config?: Partial<TestConfiguration>) => {
  if (config) {
    globalTestRunner.updateConfig(config);
  }
  return globalTestRunner.runAllTests();
};

export const runQuickTests = () => {
  return globalTestRunner.runAllTests();
};

export const runSpecificTest = (suiteName: string) => {
  return globalTestRunner.runSpecificSuite(suiteName);
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).testRunner = globalTestRunner;
  (window as any).runAllTests = runAllTests;
  (window as any).runQuickTests = runQuickTests;
  (window as any).runSpecificTest = runSpecificTest;
  
  console.log('🧪 Enhanced Test Runner loaded');
  console.log('   runAllTests(config?) - Run all test suites with optional configuration');
  console.log('   runQuickTests() - Run all tests with default configuration');
  console.log('   runSpecificTest(suiteName) - Run specific test suite');
  console.log('   testRunner.getAvailableSuites() - List available test suites');
}