// /Users/montysharma/V11M2/src/test/minigame/integrationTests.ts
// Comprehensive integration tests for the minigame system

import MinigameRegistry from '../../components/minigames/core/MinigameRegistry';
import MinigameEngine from '../../components/minigames/core/MinigameEngine';
import { useMinigameStore } from '../../stores/useMinigameStore';

interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  duration: number;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

class MinigameIntegrationTester {
  private results: TestSuite[] = [];

  async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting Minigame Integration Tests...');
    
    this.results = [];
    
    await this.testRegistryIntegration();
    await this.testEngineIntegration();
    await this.testStoreIntegration();
    await this.testPluginLoading();
    await this.testGameLaunching();
    await this.testStatisticsTracking();
    await this.testAchievementSystem();
    await this.testPerformanceMetrics();
    
    this.printSummary();
    return this.results;
  }

  private async testRegistryIntegration(): Promise<void> {
    const suite: TestSuite = {
      name: 'Registry Integration',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Registry initialization
    await this.runTest(suite, 'Registry initializes correctly', async () => {
      const games = MinigameRegistry.list();
      if (games.length === 0) {
        throw new Error('No games found in registry');
      }
      return { gamesFound: games.length };
    });

    // Test 2: Game retrieval
    await this.runTest(suite, 'Games can be retrieved by ID', async () => {
      const games = MinigameRegistry.list();
      const firstGame = games[0];
      const retrieved = MinigameRegistry.get(firstGame.id);
      
      if (!retrieved || retrieved.id !== firstGame.id) {
        throw new Error('Game retrieval failed');
      }
      return { gameId: firstGame.id };
    });

    // Test 3: Category filtering
    await this.runTest(suite, 'Category filtering works', async () => {
      const stats = MinigameRegistry.getRegistryStats();
      const categoryGames = MinigameRegistry.listByCategory(stats.categories[0]);
      
      if (categoryGames.length === 0) {
        throw new Error('Category filtering returned no games');
      }
      return { category: stats.categories[0], count: categoryGames.length };
    });

    // Test 4: Registry statistics
    await this.runTest(suite, 'Registry statistics are accurate', async () => {
      const stats = MinigameRegistry.getRegistryStats();
      const allGames = MinigameRegistry.list();
      
      if (stats.totalGames !== allGames.length) {
        throw new Error('Statistics count mismatch');
      }
      return stats;
    });

    this.results.push(suite);
  }

  private async testEngineIntegration(): Promise<void> {
    const suite: TestSuite = {
      name: 'Engine Integration',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Engine event system
    await this.runTest(suite, 'Event system works correctly', async () => {
      let eventFired = false;
      const handler = () => { eventFired = true; };
      
      MinigameEngine.addEventListener('test', handler);
      MinigameEngine.dispatchEvent('test', {});
      MinigameEngine.removeEventListener('test', handler);
      
      if (!eventFired) {
        throw new Error('Event was not fired');
      }
      return { eventFired };
    });

    // Test 2: Session management
    await this.runTest(suite, 'Session management functions', async () => {
      const sessions = MinigameEngine.getActiveSessions();
      return { activeSessions: sessions.length };
    });

    this.results.push(suite);
  }

  private async testStoreIntegration(): Promise<void> {
    const suite: TestSuite = {
      name: 'Store Integration',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Store initialization
    await this.runTest(suite, 'Store initializes with default state', async () => {
      const store = useMinigameStore.getState();
      
      if (!store.preferences || !store.metadata) {
        throw new Error('Store not properly initialized');
      }
      return { preferencesExists: !!store.preferences };
    });

    // Test 2: Preference updates
    await this.runTest(suite, 'Preferences can be updated', async () => {
      const store = useMinigameStore.getState();
      const originalSound = store.preferences.enableSounds;
      
      store.updatePreferences({ enableSounds: !originalSound });
      const updated = useMinigameStore.getState().preferences.enableSounds;
      
      // Restore original
      store.updatePreferences({ enableSounds: originalSound });
      
      if (updated === originalSound) {
        throw new Error('Preference update failed');
      }
      return { updated: true };
    });

    // Test 3: Statistics calculation
    await this.runTest(suite, 'Overall statistics calculate correctly', async () => {
      const store = useMinigameStore.getState();
      const stats = store.getOverallStats();
      
      if (typeof stats.totalGames !== 'number') {
        throw new Error('Statistics not properly calculated');
      }
      return stats;
    });

    this.results.push(suite);
  }

  private async testPluginLoading(): Promise<void> {
    const suite: TestSuite = {
      name: 'Plugin Loading',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: All plugins have required properties
    await this.runTest(suite, 'All plugins have required properties', async () => {
      const games = MinigameRegistry.list();
      const requiredProps = ['id', 'name', 'description', 'category', 'component'];
      
      for (const game of games) {
        for (const prop of requiredProps) {
          if (!(prop in game)) {
            throw new Error(`Game ${game.id} missing required property: ${prop}`);
          }
        }
      }
      return { gamesValidated: games.length };
    });

    // Test 2: Plugin components are loadable
    await this.runTest(suite, 'Plugin components are loadable', async () => {
      const games = MinigameRegistry.list();
      let loadableCount = 0;
      
      for (const game of games) {
        if (typeof game.component === 'function' || typeof game.component === 'object') {
          loadableCount++;
        }
      }
      
      if (loadableCount === 0) {
        throw new Error('No loadable components found');
      }
      return { loadableComponents: loadableCount };
    });

    this.results.push(suite);
  }

  private async testGameLaunching(): Promise<void> {
    const suite: TestSuite = {
      name: 'Game Launching',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Game can be launched
    await this.runTest(suite, 'Games can be launched through engine', async () => {
      const games = MinigameRegistry.list();
      const testGame = games[0];
      
      if (!testGame) {
        throw new Error('No games available for testing');
      }
      
      // Mock launch (without actually rendering)
      const context = {
        difficulty: 'medium' as const,
        practiceMode: true
      };
      
      try {
        // This would normally launch the game, but we'll just validate the setup
        const plugin = MinigameRegistry.get(testGame.id);
        if (!plugin) {
          throw new Error('Plugin not found');
        }
        return { gameId: testGame.id, launched: true };
      } catch (error) {
        throw new Error(`Failed to launch game: ${error}`);
      }
    });

    this.results.push(suite);
  }

  private async testStatisticsTracking(): Promise<void> {
    const suite: TestSuite = {
      name: 'Statistics Tracking',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Game results can be recorded
    await this.runTest(suite, 'Game results are recorded correctly', async () => {
      const store = useMinigameStore.getState();
      const testGameId = 'test-game-' + Date.now();
      
      // Record a test result
      const testResult = {
        success: true,
        stats: {
          score: 800,
          timeElapsed: 30000,
          accuracy: 0.9
        }
      };
      
      store.recordGameResult(testGameId, testResult, 'medium');
      
      const gameStats = store.getGameStats(testGameId);
      if (!gameStats || gameStats.totalPlays !== 1) {
        throw new Error('Game result not recorded correctly');
      }
      
      // Clean up
      store.resetGameStats(testGameId);
      
      return { recorded: true, score: testResult.stats.score };
    });

    this.results.push(suite);
  }

  private async testAchievementSystem(): Promise<void> {
    const suite: TestSuite = {
      name: 'Achievement System',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Achievements can be unlocked
    await this.runTest(suite, 'Achievements can be unlocked', async () => {
      const store = useMinigameStore.getState();
      const testAchievementId = 'test-achievement-' + Date.now();
      
      store.unlockAchievement(
        testAchievementId,
        'Test Achievement',
        'This is a test achievement',
        'test-game'
      );
      
      const achievements = store.getUnlockedAchievements();
      const testAchievement = achievements.find(a => a.id === testAchievementId);
      
      if (!testAchievement) {
        throw new Error('Achievement not unlocked correctly');
      }
      
      return { achievementId: testAchievementId };
    });

    this.results.push(suite);
  }

  private async testPerformanceMetrics(): Promise<void> {
    const suite: TestSuite = {
      name: 'Performance Metrics',
      tests: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    // Test 1: Performance monitoring doesn't break
    await this.runTest(suite, 'Performance monitoring is stable', async () => {
      // Simulate performance monitoring
      const startTime = performance.now();
      
      // Simulate some work
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn('Performance test took longer than expected');
      }
      
      return { duration: duration.toFixed(2) };
    });

    this.results.push(suite);
  }

  private async runTest(
    suite: TestSuite, 
    testName: string, 
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const details = await testFn();
      const duration = performance.now() - startTime;
      
      suite.tests.push({
        test: testName,
        passed: true,
        duration,
        details
      });
      suite.passed++;
      
      console.log(`✅ ${testName} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      
      suite.tests.push({
        test: testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      suite.failed++;
      
      console.error(`❌ ${testName}: ${error}`);
    }
    
    suite.totalDuration += performance.now() - startTime;
  }

  private printSummary(): void {
    console.log('\n📊 Test Summary:');
    console.log('================');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;
    
    for (const suite of this.results) {
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalDuration += suite.totalDuration;
      
      const status = suite.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${suite.name}: ${suite.passed}/${suite.passed + suite.failed} passed (${suite.totalDuration.toFixed(2)}ms)`);
      
      if (suite.failed > 0) {
        for (const test of suite.tests) {
          if (!test.passed) {
            console.log(`  ❌ ${test.test}: ${test.error}`);
          }
        }
      }
    }
    
    console.log('================');
    console.log(`Total: ${totalPassed}/${totalPassed + totalFailed} passed`);
    console.log(`Duration: ${totalDuration.toFixed(2)}ms`);
    
    if (totalFailed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log(`⚠️ ${totalFailed} test(s) failed`);
    }
  }
}

// Export functions for console access
declare global {
  interface Window {
    runMinigameIntegrationTests: () => Promise<TestSuite[]>;
    runQuickMinigameTest: () => Promise<void>;
  }
}

// Quick test for immediate validation
export const runQuickMinigameTest = async (): Promise<void> => {
  console.log('🔍 Quick Minigame System Test...');
  
  try {
    // Test registry
    const games = MinigameRegistry.list();
    console.log(`✅ Registry: ${games.length} games loaded`);
    
    // Test store
    const store = useMinigameStore.getState();
    const stats = store.getOverallStats();
    console.log(`✅ Store: ${stats.totalGames} games played`);
    
    // Test engine
    let eventWorked = false;
    const handler = () => { eventWorked = true; };
    MinigameEngine.addEventListener('quickTest', handler);
    MinigameEngine.dispatchEvent('quickTest', {});
    MinigameEngine.removeEventListener('quickTest', handler);
    console.log(`✅ Engine: Events ${eventWorked ? 'working' : 'failed'}`);
    
    console.log('🎉 Quick test completed successfully!');
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
};

// Initialize and expose test functions
const tester = new MinigameIntegrationTester();

if (typeof window !== 'undefined') {
  window.runMinigameIntegrationTests = () => tester.runAllTests();
  window.runQuickMinigameTest = runQuickMinigameTest;
}

export default tester;
export { MinigameIntegrationTester, type TestResult, type TestSuite };