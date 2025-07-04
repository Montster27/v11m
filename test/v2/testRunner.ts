// /Users/montysharma/v11m2/test/v2/testRunner.ts
// Comprehensive V2 Test Suite Runner
// Coordinates all V2 integration tests and provides unified reporting

import { runV2IntegrationTests, type V2IntegrationTestSuite } from './v2IntegrationTests';
import { runComponentIntegrationTests, type ComponentTestSuite } from './componentIntegrationTests';

export interface V2TestSuiteResults {
  storeTests: V2IntegrationTestSuite;
  componentTests: ComponentTestSuite;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalDuration: number;
    successRate: number;
    criticalFailures: string[];
    warnings: string[];
    recommendations: string[];
  };
  timestamp: string;
  version: string;
}

export interface TestEnvironmentInfo {
  userAgent: string;
  nodeEnv: string;
  buildTime: string;
  storeVersions: {
    narrative: string;
    social: string;
    core: string;
  };
}

/**
 * Comprehensive V2 Test Suite Runner
 */
export const runCompleteV2TestSuite = async (): Promise<V2TestSuiteResults> => {
  console.log('🚀 Starting Complete V2 Test Suite...');
  console.log('═══════════════════════════════════════════════════════════');
  
  const startTime = performance.now();

  // Run store-level integration tests
  console.log('\n📦 Running Store Integration Tests...');
  const storeTests = await runV2IntegrationTests();

  // Run component-level integration tests
  console.log('\n🧩 Running Component Integration Tests...');
  const componentTests = await runComponentIntegrationTests();

  const endTime = performance.now();
  const totalDuration = endTime - startTime;

  // Calculate summary statistics
  const storeTestResults = Object.values(storeTests);
  const componentTestResults = Object.values(componentTests);
  const allTests = [...storeTestResults, ...componentTestResults];

  const totalTests = allTests.length;
  const passedTests = allTests.filter(t => t.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = (passedTests / totalTests) * 100;

  // Collect critical failures and warnings
  const criticalFailures: string[] = [];
  const warnings: string[] = [];

  allTests.forEach(test => {
    test.errors.forEach(error => {
      criticalFailures.push(`${test.testName}: ${error}`);
    });
    test.warnings?.forEach(warning => {
      warnings.push(`${test.testName}: ${warning}`);
    });
  });

  // Generate recommendations based on test results
  const recommendations = generateRecommendations(storeTests, componentTests);

  // Create summary
  const summary = {
    totalTests,
    passedTests,
    failedTests,
    totalDuration,
    successRate,
    criticalFailures,
    warnings,
    recommendations
  };

  const results: V2TestSuiteResults = {
    storeTests,
    componentTests,
    summary,
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  };

  // Generate detailed report
  generateTestReport(results);

  return results;
};

/**
 * Generate recommendations based on test results
 */
const generateRecommendations = (
  storeTests: V2IntegrationTestSuite,
  componentTests: ComponentTestSuite
): string[] => {
  const recommendations: string[] = [];

  // Store-level recommendations
  if (!storeTests.storeInitialization.success) {
    recommendations.push('Critical: Fix V2 store initialization issues before deployment');
  }

  if (!storeTests.crossStoreConsistency.success) {
    recommendations.push('High Priority: Resolve cross-store data consistency issues');
  }

  if (storeTests.performanceMetrics.warnings && storeTests.performanceMetrics.warnings.length > 0) {
    recommendations.push('Medium Priority: Optimize store performance for better user experience');
  }

  if (!storeTests.migrationCompatibility.success) {
    recommendations.push('High Priority: Fix migration compatibility to ensure smooth V1→V2 transition');
  }

  // Component-level recommendations
  const componentFailures = Object.values(componentTests).filter(t => !t.success);
  if (componentFailures.length > 0) {
    recommendations.push(`Medium Priority: Fix ${componentFailures.length} component integration issues`);
  }

  const renderingIssues = Object.values(componentTests).filter(t => !t.renderedCorrectly);
  if (renderingIssues.length > 0) {
    recommendations.push('Low Priority: Investigate component rendering issues');
  }

  // Performance recommendations
  const totalDuration = Object.values(storeTests).reduce((sum, t) => sum + t.duration, 0) +
                       Object.values(componentTests).reduce((sum, t) => sum + t.duration, 0);
  
  if (totalDuration > 5000) {
    recommendations.push('Medium Priority: Test suite runtime is high, consider optimization');
  }

  // Success rate recommendations
  const allTests = [...Object.values(storeTests), ...Object.values(componentTests)];
  const successRate = (allTests.filter(t => t.success).length / allTests.length) * 100;

  if (successRate < 80) {
    recommendations.push('Critical: Test success rate below 80%, significant issues detected');
  } else if (successRate < 95) {
    recommendations.push('High Priority: Test success rate below 95%, some issues need attention');
  } else {
    recommendations.push('Good: High test success rate indicates stable V2 migration');
  }

  return recommendations;
};

/**
 * Generate detailed test report
 */
const generateTestReport = (results: V2TestSuiteResults): void => {
  console.log('\n\n📋 V2 Integration Test Report');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Test Suite Version: ${results.version}`);
  console.log(`Execution Time: ${results.timestamp}`);
  console.log(`Total Duration: ${results.summary.totalDuration.toFixed(2)}ms`);
  
  console.log('\n📊 Test Summary:');
  console.log(`├─ Total Tests: ${results.summary.totalTests}`);
  console.log(`├─ Passed: ${results.summary.passedTests} ✅`);
  console.log(`├─ Failed: ${results.summary.failedTests} ❌`);
  console.log(`└─ Success Rate: ${results.summary.successRate.toFixed(1)}%`);

  console.log('\n🏪 Store Integration Tests:');
  Object.entries(results.storeTests).forEach(([testName, result]) => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration.toFixed(2);
    console.log(`├─ ${status} ${testName}: ${duration}ms`);
  });

  console.log('\n🧩 Component Integration Tests:');
  Object.entries(results.componentTests).forEach(([testName, result]) => {
    const status = result.success ? '✅' : '❌';
    const duration = result.duration.toFixed(2);
    const details = [
      result.renderedCorrectly ? 'R✅' : 'R❌',
      result.storeIntegrationWorking ? 'S✅' : 'S❌',
      result.userInteractionsWork ? 'I✅' : 'I❌'
    ].join(' ');
    console.log(`├─ ${status} ${result.componentName}: ${duration}ms (${details})`);
  });

  if (results.summary.criticalFailures.length > 0) {
    console.log('\n🚨 Critical Failures:');
    results.summary.criticalFailures.forEach(failure => {
      console.log(`├─ ❌ ${failure}`);
    });
  }

  if (results.summary.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    results.summary.warnings.forEach(warning => {
      console.log(`├─ ⚠️ ${warning}`);
    });
  }

  console.log('\n💡 Recommendations:');
  results.summary.recommendations.forEach((rec, index) => {
    const isLast = index === results.summary.recommendations.length - 1;
    const prefix = isLast ? '└─' : '├─';
    console.log(`${prefix} ${rec}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  
  // Overall assessment
  if (results.summary.successRate >= 95) {
    console.log('🎉 EXCELLENT: V2 migration is in excellent condition for deployment');
  } else if (results.summary.successRate >= 80) {
    console.log('✅ GOOD: V2 migration is stable with minor issues to address');
  } else if (results.summary.successRate >= 60) {
    console.log('⚠️ CAUTION: V2 migration has significant issues that need attention');
  } else {
    console.log('🚨 CRITICAL: V2 migration has major issues and should not be deployed');
  }
};

/**
 * Quick health check for V2 stores
 */
export const runV2HealthCheck = async (): Promise<boolean> => {
  console.log('🏥 Running Quick V2 Health Check...');
  
  try {
    // Import stores
    const { useCoreGameStore, useNarrativeStore, useSocialStore } = await import('../../src/stores/v2');
    
    // Basic store availability check
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();

    const storesAvailable = !!(coreStore && narrativeStore && socialStore);
    
    if (!storesAvailable) {
      console.log('❌ V2 stores not properly initialized');
      return false;
    }

    // Basic functionality check
    const hasBasicMethods = !!(
      narrativeStore.addActiveStorylet &&
      narrativeStore.completeStorylet &&
      socialStore.discoverClue &&
      socialStore.connectClues
    );

    if (!hasBasicMethods) {
      console.log('❌ V2 store methods not available');
      return false;
    }

    console.log('✅ V2 Health Check Passed');
    return true;

  } catch (error) {
    console.log(`❌ V2 Health Check Failed: ${error}`);
    return false;
  }
};

/**
 * Environment information collector
 */
export const getTestEnvironmentInfo = (): TestEnvironmentInfo => {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
    nodeEnv: process.env.NODE_ENV || 'unknown',
    buildTime: new Date().toISOString(),
    storeVersions: {
      narrative: '2.0.0',
      social: '2.0.0',
      core: '2.0.0'
    }
  };
};

/**
 * Export test results to JSON
 */
export const exportTestResults = (results: V2TestSuiteResults): string => {
  const exportData = {
    ...results,
    environment: getTestEnvironmentInfo()
  };
  
  return JSON.stringify(exportData, null, 2);
};

// Expose test runner globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).runCompleteV2TestSuite = runCompleteV2TestSuite;
  (window as any).runV2HealthCheck = runV2HealthCheck;
  (window as any).getTestEnvironmentInfo = getTestEnvironmentInfo;
  (window as any).exportTestResults = exportTestResults;
  
  console.log('🧪 V2 Test Runner exposed globally for console access');
  console.log('Available commands:');
  console.log('  - runCompleteV2TestSuite() // Full test suite');
  console.log('  - runV2HealthCheck() // Quick health check');
  console.log('  - getTestEnvironmentInfo() // Environment details');
}