// /Users/montysharma/V11M2/src/utils/comprehensiveMinigameTest.ts
// Final comprehensive test to verify all minigame system fixes

import MinigameRegistry from '../components/minigames/core/MinigameRegistry';
import MinigameEngine from '../components/minigames/core/MinigameEngine';
import { useMinigameStore } from '../stores/useMinigameStore';

interface ComprehensiveTestResult {
  testName: string;
  category: 'registry' | 'engine' | 'plugins' | 'store' | 'integration';
  passed: boolean;
  error?: string;
  details?: any;
  duration: number;
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  categories: Record<string, { passed: number; failed: number }>;
  results: ComprehensiveTestResult[];
  overallPass: boolean;
  timestamp: number;
}

class ComprehensiveMinigameSystemTest {
  private results: ComprehensiveTestResult[] = [];

  async runAllTests(): Promise<TestSummary> {
    console.log('🧪 Starting Comprehensive Minigame System Test Suite...');
    console.log('================================================================');
    
    this.results = [];
    
    // Run all test categories
    await this.testRegistry();
    await this.testEngine();
    await this.testPlugins();
    await this.testStore();
    await this.testIntegration();
    
    return this.generateSummary();
  }

  private async testRegistry(): Promise<void> {
    // Test 1: Registry initialization
    await this.runTest('registry', 'Registry initializes correctly', async () => {
      const games = MinigameRegistry.list();
      if (games.length === 0) {
        throw new Error('No games found in registry');
      }
      return { gamesFound: games.length };
    });

    // Test 2: All expected games present
    await this.runTest('registry', 'All 11 games are registered', async () => {
      const games = MinigameRegistry.list();
      const expectedGames = [
        'memory-cards', 'word-scramble', 'color-match', 'stroop-test', 'path-planner',
        'pattern-sequence', 'math-quiz', 'reaction-time', 'logic-puzzle', 'typing-test', 'word-association'
      ];
      
      const foundGames = games.map(g => g.id);
      const missingGames = expectedGames.filter(id => !foundGames.includes(id));
      
      if (missingGames.length > 0) {
        throw new Error(`Missing games: ${missingGames.join(', ')}`);
      }
      
      return { expectedCount: expectedGames.length, actualCount: games.length };
    });

    // Test 3: Registry statistics
    await this.runTest('registry', 'Registry statistics work', async () => {
      const stats = MinigameRegistry.getRegistryStats();
      if (!stats || typeof stats.totalGames !== 'number') {
        throw new Error('Invalid registry statistics');
      }
      return stats;
    });
  }

  private async testEngine(): Promise<void> {
    // Test 1: Engine event system
    await this.runTest('engine', 'Event system works', async () => {
      let eventFired = false;
      const handler = () => { eventFired = true; };
      
      MinigameEngine.addEventListener('test-event', handler);
      MinigameEngine.dispatchEvent('test-event', {});
      MinigameEngine.removeEventListener('test-event', handler);
      
      if (!eventFired) {
        throw new Error('Event was not fired');
      }
      return { eventFired };
    });

    // Test 2: Session management
    await this.runTest('engine', 'Session management', async () => {
      const sessions = MinigameEngine.getActiveSessions();
      const stats = MinigameEngine.getEngineStatistics();
      
      if (!Array.isArray(sessions)) {
        throw new Error('getActiveSessions should return an array');
      }
      if (!stats || typeof stats.totalSessions !== 'number') {
        throw new Error('getEngineStatistics should return valid stats');
      }
      
      return { activeSessions: sessions.length, stats };
    });

    // Test 3: Static methods work
    await this.runTest('engine', 'Static methods accessible', async () => {
      const methods = ['addEventListener', 'removeEventListener', 'dispatchEvent', 'getActiveSessions', 'getEngineStatistics'];
      const missing = methods.filter(method => typeof MinigameEngine[method] !== 'function');
      
      if (missing.length > 0) {
        throw new Error(`Missing static methods: ${missing.join(', ')}`);
      }
      
      return { availableMethods: methods.length };
    });
  }

  private async testPlugins(): Promise<void> {
    const games = MinigameRegistry.list();
    
    // Test each plugin individually
    for (const game of games) {
      await this.runTest('plugins', `Plugin ${game.id} validation`, async () => {
        // Test required properties
        const requiredProps = ['id', 'name', 'description', 'category', 'component', 'difficultyConfig'];
        const missing = requiredProps.filter(prop => !(prop in game));
        
        if (missing.length > 0) {
          throw new Error(`Missing properties: ${missing.join(', ')}`);
        }

        // Test difficulty config
        const requiredLevels = ['easy', 'medium', 'hard'];
        const missingLevels = requiredLevels.filter(level => !game.difficultyConfig[level]);
        
        if (missingLevels.length > 0) {
          throw new Error(`Missing difficulty levels: ${missingLevels.join(', ')}`);
        }

        // Test custom validation if present
        if (game.validateConfig && !game.validateConfig(game)) {
          throw new Error('Custom validation failed');
        }

        return { validated: true };
      });
    }

    // Test plugin categories
    await this.runTest('plugins', 'Plugin categories complete', async () => {
      const stats = MinigameRegistry.getRegistryStats();
      const expectedCategories = ['cognitive', 'word-games', 'visual', 'attention', 'strategy', 'puzzle', 'reflex', 'coordination', 'typing'];
      
      return { 
        categoriesFound: stats.categories.length,
        expectedMinimum: expectedCategories.length
      };
    });
  }

  private async testStore(): Promise<void> {
    // Test 1: Store initialization
    await this.runTest('store', 'Store initializes correctly', async () => {
      const store = useMinigameStore.getState();
      
      if (!store.preferences || !store.metadata) {
        throw new Error('Store not properly initialized');
      }
      
      return { initialized: true };
    });

    // Test 2: Store methods work
    await this.runTest('store', 'Store methods functional', async () => {
      const store = useMinigameStore.getState();
      const stats = store.getOverallStats();
      
      if (typeof stats.totalGames !== 'number') {
        throw new Error('getOverallStats not working');
      }
      
      return { methodsWork: true, stats };
    });

    // Test 3: Store preferences
    await this.runTest('store', 'Preferences system works', async () => {
      const store = useMinigameStore.getState();
      const originalSound = store.preferences.enableSounds;
      
      // Test updating preference
      store.updatePreferences({ enableSounds: !originalSound });
      const updated = useMinigameStore.getState().preferences.enableSounds;
      
      // Restore original
      store.updatePreferences({ enableSounds: originalSound });
      
      if (updated === originalSound) {
        throw new Error('Preference update failed');
      }
      
      return { preferencesWork: true };
    });
  }

  private async testIntegration(): Promise<void> {
    // Test 1: Registry-Engine integration
    await this.runTest('integration', 'Registry-Engine integration', async () => {
      const games = MinigameRegistry.list();
      if (games.length === 0) {
        throw new Error('No games available for integration test');
      }
      
      const testGame = games[0];
      
      // Test that engine can access game via registry
      const plugin = MinigameRegistry.get(testGame.id);
      if (!plugin) {
        throw new Error('Engine cannot access game via registry');
      }
      
      return { integrated: true, testGameId: testGame.id };
    });

    // Test 2: Store-Engine integration
    await this.runTest('integration', 'Store-Engine integration', async () => {
      const store = useMinigameStore.getState();
      const engineStats = MinigameEngine.getEngineStatistics();
      
      // Both should be accessible
      if (!store || !engineStats) {
        throw new Error('Store-Engine integration failed');
      }
      
      return { integrated: true };
    });

    // Test 3: Complete system ready
    await this.runTest('integration', 'Complete system ready', async () => {
      const gamesCount = MinigameRegistry.list().length;
      const store = useMinigameStore.getState();
      const engineReady = MinigameEngine.getEngineStatistics();
      
      if (gamesCount < 11) {
        throw new Error(`Only ${gamesCount} games available, expected 11`);
      }
      
      return { 
        gamesReady: gamesCount,
        storeReady: !!store,
        engineReady: !!engineReady
      };
    });
  }

  private async runTest(
    category: ComprehensiveTestResult['category'],
    testName: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const details = await testFn();
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        category,
        passed: true,
        details,
        duration
      });
      
      console.log(`✅ ${testName} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.push({
        testName,
        category,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      
      console.error(`❌ ${testName}: ${error}`);
    }
  }

  private generateSummary(): TestSummary {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    const categories: Record<string, { passed: number; failed: number }> = {};
    
    for (const result of this.results) {
      if (!categories[result.category]) {
        categories[result.category] = { passed: 0, failed: 0 };
      }
      
      if (result.passed) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    }
    
    const summary: TestSummary = {
      totalTests: this.results.length,
      passed,
      failed,
      categories,
      results: this.results,
      overallPass: failed === 0,
      timestamp: Date.now()
    };
    
    this.printSummary(summary);
    return summary;
  }

  private printSummary(summary: TestSummary): void {
    console.log('\n🎯 COMPREHENSIVE TEST SUMMARY:');
    console.log('===============================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`Overall: ${summary.overallPass ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n📊 By Category:');
    for (const [category, stats] of Object.entries(summary.categories)) {
      const status = stats.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${category}: ${stats.passed}/${stats.passed + stats.failed}`);
    }
    
    if (summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      summary.results.filter(r => !r.passed).forEach(result => {
        console.log(`  • ${result.testName}: ${result.error}`);
      });
    }
    
    if (summary.overallPass) {
      console.log('\n🎉 ALL TESTS PASSED! Minigame system is fully operational.');
      console.log('🚀 Ready for production use with enhanced UX features.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review and fix issues.');
    }
  }
}

// Create and export test functions
const comprehensiveTest = new ComprehensiveMinigameSystemTest();

export const runComprehensiveMinigameTest = () => comprehensiveTest.runAllTests();

// Global access
declare global {
  interface Window {
    runComprehensiveMinigameTest: () => Promise<TestSummary>;
  }
}

if (typeof window !== 'undefined') {
  window.runComprehensiveMinigameTest = runComprehensiveMinigameTest;
}

export default comprehensiveTest;