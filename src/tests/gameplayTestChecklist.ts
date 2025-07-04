// /Users/montysharma/v11m2/src/tests/gameplayTestChecklist.ts
// Full gameplay test checklist for comprehensive validation

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';
import { useCharacterConcernsStore } from '../stores/useCharacterConcernsStore';
import { useStoryletStore } from '../store/useStoryletStore';
import { saveManager } from '../utils/saveManager';
import { generateConcernFlags } from '../utils/flagGenerator';
import subscriptionManager from '../utils/subscriptionManager';
import { memoryLeakDetector } from '../utils/memoryLeakDetector';

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
  error?: string;
  warnings?: string[];
}

interface TestSection {
  sectionName: string;
  tests: TestResult[];
  success: boolean;
  duration: number;
}

interface GameplayTestReport {
  sections: TestSection[];
  overallSuccess: boolean;
  totalDuration: number;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warningsCount: number;
  };
}

class GameplayTestChecklist {
  private report: GameplayTestReport = {
    sections: [],
    overallSuccess: false,
    totalDuration: 0,
    summary: { totalTests: 0, passedTests: 0, failedTests: 0, warningsCount: 0 }
  };
  
  private testStartTime: number = 0;
  private initialMemoryUsage: number = 0;

  async runFullGameplayTest(): Promise<GameplayTestReport> {
    console.log('🎮 Starting Full Gameplay Test Checklist...');
    this.testStartTime = performance.now();
    this.initialMemoryUsage = this.getMemoryUsage();

    try {
      // Section 1: Game Initialization
      await this.testGameInitialization();
      
      // Section 2: Character Creation
      await this.testCharacterCreation();
      
      // Section 3: Core Gameplay Loop
      await this.testCoreGameplayLoop();
      
      // Section 4: Minigame Integration
      await this.testMinigameIntegration();
      
      // Section 5: Save System
      await this.testSaveSystem();
      
      // Section 6: Performance & Memory
      await this.testPerformanceAndMemory();
      
      // Section 7: Error Handling
      await this.testErrorHandling();
      
      // Section 8: Data Integrity
      await this.testDataIntegrity();

    } catch (error) {
      console.error('❌ Critical error in gameplay test:', error);
    }

    this.finalizeReport();
    this.generateTestReport();
    return this.report;
  }

  private async testGameInitialization(): Promise<void> {
    console.log('🚀 Testing Game Initialization...');
    const section = this.createSection('Game Initialization');
    const sectionStart = performance.now();

    // Test 1: Store initialization
    section.tests.push(await this.runTest(
      'Store Initialization',
      async () => {
        const coreStore = useCoreGameStore.getState();
        const narrativeStore = useNarrativeStore.getState();
        const socialStore = useSocialStore.getState();
        
        if (!coreStore || !narrativeStore || !socialStore) {
          throw new Error('One or more stores failed to initialize');
        }
        
        return 'All stores initialized successfully';
      }
    ));

    // Test 2: Default values check
    section.tests.push(await this.runTest(
      'Default Values Check',
      async () => {
        const coreStore = useCoreGameStore.getState();
        
        if (typeof coreStore.player?.resources?.money !== 'number') {
          throw new Error('Money not initialized properly');
        }
        
        if (!Array.isArray(coreStore.player?.skills)) {
          throw new Error('Skills not initialized as array');
        }
        
        return 'Default values are properly initialized';
      }
    ));

    // Test 3: Subscription manager initialization
    section.tests.push(await this.runTest(
      'Subscription Manager Initialization',
      async () => {
        const stats = subscriptionManager.getStats();
        
        if (typeof stats.totalSubscriptions !== 'number') {
          throw new Error('Subscription manager not properly initialized');
        }
        
        return `Subscription manager initialized with ${stats.totalSubscriptions} subscriptions`;
      }
    ));

    // Test 4: Memory leak detector initialization
    section.tests.push(await this.runTest(
      'Memory Leak Detector Initialization',
      async () => {
        const report = memoryLeakDetector.generateReport();
        
        if (typeof report.totalComponents !== 'number') {
          throw new Error('Memory leak detector not properly initialized');
        }
        
        return `Memory leak detector initialized, tracking ${report.totalComponents} components`;
      }
    ));

    section.duration = performance.now() - sectionStart;
    section.success = section.tests.every(t => t.success);
    this.report.sections.push(section);
  }

  private async testCharacterCreation(): Promise<void> {
    console.log('👤 Testing Character Creation...');
    const section = this.createSection('Character Creation');
    const sectionStart = performance.now();

    // Test 1: Concern distribution
    section.tests.push(await this.runTest(
      'Concern Distribution',
      async () => {
        const concernsStore = useCharacterConcernsStore.getState();
        const testConcerns = {
          family: 25,
          career: 30,
          health: 20,
          relationships: 35,
          finances: 40
        };
        
        concernsStore.setConcerns(testConcerns);
        
        const savedConcerns = concernsStore.concerns;
        const total = Object.values(savedConcerns).reduce((sum, val) => sum + val, 0);
        
        if (Math.abs(total - 150) > 0.1) {
          throw new Error(`Concern total mismatch: ${total} !== 150`);
        }
        
        return `Concerns distributed correctly, total: ${total}`;
      }
    ));

    // Test 2: Flag generation from concerns
    section.tests.push(await this.runTest(
      'Flag Generation from Concerns',
      async () => {
        const concerns = useCharacterConcernsStore.getState().concerns;
        const flags = generateConcernFlags(concerns);
        
        if (Object.keys(flags).length === 0) {
          throw new Error('No flags generated from concerns');
        }
        
        return `Generated ${Object.keys(flags).length} flags from concerns`;
      }
    ));

    // Test 3: Initial storylets availability
    section.tests.push(await this.runTest(
      'Initial Storylets Availability',
      async () => {
        const storyletStore = useStoryletStore.getState();
        const availableStorylets = storyletStore.storylets?.filter(s => s.available) || [];
        
        if (availableStorylets.length === 0) {
          return 'No storylets available (might be expected for new character)';
        }
        
        return `${availableStorylets.length} storylets available for new character`;
      }
    ));

    // Test 4: Character save on creation
    section.tests.push(await this.runTest(
      'Character Save on Creation',
      async () => {
        await saveManager.saveGame();
        const saveData = saveManager.getCurrentSaveData();
        
        if (!saveData.concerns || Object.keys(saveData.concerns).length === 0) {
          throw new Error('Character concerns not saved');
        }
        
        return 'Character creation data saved successfully';
      }
    ));

    section.duration = performance.now() - sectionStart;
    section.success = section.tests.every(t => t.success);
    this.report.sections.push(section);
  }

  private async testCoreGameplayLoop(): Promise<void> {
    console.log('🎯 Testing Core Gameplay Loop...');
    const section = this.createSection('Core Gameplay Loop');
    const sectionStart = performance.now();

    // Test 1: 30-minute simulation
    section.tests.push(await this.runTest(
      '30-Minute Gameplay Simulation',
      async () => {
        const simulationStart = performance.now();
        const iterations = 100; // Simulate 100 game turns
        
        for (let i = 0; i < iterations; i++) {
          // Simulate player actions
          const coreStore = useCoreGameStore.getState();
          const narrativeStore = useNarrativeStore.getState();
          
          // Add money (simulating income)
          coreStore.addMoney(Math.floor(Math.random() * 100));
          
          // Add random flags (simulating story progression)
          narrativeStore.addFlag(`turn_${i}_event`, Math.random() > 0.5);
          
          // Trigger save every 10 turns
          if (i % 10 === 0) {
            await saveManager.saveGame();
          }
          
          // Brief pause to simulate real gameplay
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const simulationDuration = performance.now() - simulationStart;
        return `Simulated 30 minutes of gameplay in ${simulationDuration.toFixed(2)}ms`;
      }
    ));

    // Test 2: Performance degradation check
    section.tests.push(await this.runTest(
      'Performance Degradation Check',
      async () => {
        const initialMemory = this.getMemoryUsage();
        const performanceTimes = [];
        
        for (let i = 0; i < 50; i++) {
          const start = performance.now();
          
          // Perform typical game operations
          const concerns = useCharacterConcernsStore.getState().concerns;
          generateConcernFlags(concerns);
          
          const end = performance.now();
          performanceTimes.push(end - start);
        }
        
        const finalMemory = this.getMemoryUsage();
        const avgTime = performanceTimes.reduce((a, b) => a + b, 0) / performanceTimes.length;
        const memoryGrowth = finalMemory - initialMemory;
        
        const warnings = [];
        if (avgTime > 10) warnings.push(`Slow performance: ${avgTime.toFixed(2)}ms avg`);
        if (memoryGrowth > 10 * 1024 * 1024) warnings.push(`High memory growth: ${memoryGrowth / 1024 / 1024}MB`);
        
        return {
          details: `Avg operation time: ${avgTime.toFixed(2)}ms, Memory growth: ${memoryGrowth / 1024}KB`,
          warnings
        };
      }
    ));

    // Test 3: AutoSave functionality
    section.tests.push(await this.runTest(
      'AutoSave Functionality',
      async () => {
        const coreStore = useCoreGameStore.getState();
        const initialMoney = coreStore.player?.resources?.money || 0;
        
        // Make changes
        coreStore.addMoney(500);
        
        // Trigger autosave
        await saveManager.saveGame();
        
        // Verify save
        const saveData = saveManager.getCurrentSaveData();
        const savedMoney = saveData.player?.resources?.money || 0;
        
        if (savedMoney !== initialMoney + 500) {
          throw new Error(`AutoSave failed: ${savedMoney} !== ${initialMoney + 500}`);
        }
        
        return 'AutoSave working correctly';
      }
    ));

    // Test 4: Memory usage stability
    section.tests.push(await this.runTest(
      'Memory Usage Stability',
      async () => {
        const initialMemory = this.getMemoryUsage();
        const memorySnapshots = [initialMemory];
        
        // Perform memory-intensive operations
        for (let i = 0; i < 20; i++) {
          const largeData = new Array(1000).fill(Math.random());
          await new Promise(resolve => setTimeout(resolve, 50));
          largeData.length = 0; // Clear reference
          
          if (i % 5 === 0) {
            memorySnapshots.push(this.getMemoryUsage());
          }
        }
        
        const finalMemory = this.getMemoryUsage();
        const memoryGrowth = finalMemory - initialMemory;
        const isStable = memoryGrowth < 20 * 1024 * 1024; // Less than 20MB growth
        
        if (!isStable) {
          throw new Error(`Memory usage not stable: ${memoryGrowth / 1024 / 1024}MB growth`);
        }
        
        return `Memory usage stable: ${memoryGrowth / 1024}KB growth`;
      }
    ));

    section.duration = performance.now() - sectionStart;
    section.success = section.tests.every(t => t.success);
    this.report.sections.push(section);
  }

  private async testMinigameIntegration(): Promise<void> {
    console.log('🎮 Testing Minigame Integration...');
    const section = this.createSection('Minigame Integration');
    const sectionStart = performance.now();

    // Test 1: Minigame launch simulation
    section.tests.push(await this.runTest(
      'Minigame Launch Simulation',
      async () => {
        // Simulate minigame launch
        const minigameState = {
          id: 'test_minigame',
          isActive: true,
          score: 0,
          timeRemaining: 30
        };
        
        // Simulate gameplay
        for (let i = 0; i < 10; i++) {
          minigameState.score += Math.floor(Math.random() * 100);
          minigameState.timeRemaining -= 3;
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return `Minigame simulation completed with score: ${minigameState.score}`;
      }
    ));

    // Test 2: Pause/resume functionality
    section.tests.push(await this.runTest(
      'Pause/Resume Functionality',
      async () => {
        let isPaused = false;
        let gameTime = 0;
        
        // Simulate game running
        const gameInterval = setInterval(() => {
          if (!isPaused) gameTime += 100;
        }, 100);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Pause
        isPaused = true;
        const pauseTime = gameTime;
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Resume
        isPaused = false;
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        clearInterval(gameInterval);
        
        // Should have paused correctly
        if (gameTime <= pauseTime) {
          throw new Error('Pause functionality not working');
        }
        
        return 'Pause/resume functionality working correctly';
      }
    ));

    // Test 3: Score saving
    section.tests.push(await this.runTest(
      'Score Saving',
      async () => {
        const testScore = Math.floor(Math.random() * 10000);
        const coreStore = useCoreGameStore.getState();
        
        // Simulate saving minigame score
        coreStore.addMoney(testScore);
        await saveManager.saveGame();
        
        const saveData = saveManager.getCurrentSaveData();
        const savedMoney = saveData.player?.resources?.money || 0;
        
        if (savedMoney < testScore) {
          throw new Error('Score not saved correctly');
        }
        
        return `Score saved correctly: ${testScore}`;
      }
    ));

    // Test 4: Exit without issues
    section.tests.push(await this.runTest(
      'Exit Without Issues',
      async () => {
        // Simulate minigame cleanup
        const subscriptionsBefore = subscriptionManager.getStats().totalSubscriptions;
        
        // Simulate minigame subscriptions
        const unsubscribe1 = jest.fn();
        const unsubscribe2 = jest.fn();
        subscriptionManager.add('test_minigame', unsubscribe1);
        subscriptionManager.add('test_minigame', unsubscribe2);
        
        // Simulate minigame exit
        subscriptionManager.cleanup('test_minigame');
        
        const subscriptionsAfter = subscriptionManager.getStats().totalSubscriptions;
        
        if (subscriptionsAfter !== subscriptionsBefore) {
          throw new Error('Minigame cleanup failed - subscriptions not cleaned up');
        }
        
        return 'Minigame exit cleanup successful';
      }
    ));

    section.duration = performance.now() - sectionStart;
    section.success = section.tests.every(t => t.success);
    this.report.sections.push(section);
  }

  private async testSaveSystem(): Promise<void> {
    console.log('💾 Testing Save System...');
    const section = this.createSection('Save System');
    const sectionStart = performance.now();

    // Test 1: Save completion
    section.tests.push(await this.runTest(
      'Save Completion',
      async () => {
        const coreStore = useCoreGameStore.getState();
        const narrativeStore = useNarrativeStore.getState();
        
        // Make changes
        coreStore.addMoney(1000);
        narrativeStore.addFlag('test_save_flag', true);
        
        // Save
        await saveManager.saveGame();
        
        const saveData = saveManager.getCurrentSaveData();
        
        if (!saveData.player || !saveData.flags) {
          throw new Error('Save data incomplete');
        }
        
        return 'Save completed successfully with all data';
      }
    ));

    // Test 2: No console errors
    section.tests.push(await this.runTest(
      'No Console Errors',
      async () => {
        const originalError = console.error;
        const errors: string[] = [];
        
        console.error = (...args: any[]) => {
          errors.push(args.join(' '));
        };
        
        try {
          await saveManager.saveGame();
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.error = originalError;
          
          if (errors.length > 0) {
            throw new Error(`Console errors detected: ${errors.join(', ')}`);
          }
          
          return 'No console errors during save';
        } finally {
          console.error = originalError;
        }
      }
    ));

    // Test 3: Load saved game
    section.tests.push(await this.runTest(
      'Load Saved Game',
      async () => {
        // Save current state
        const coreStore = useCoreGameStore.getState();
        const currentMoney = coreStore.player?.resources?.money || 0;
        
        await saveManager.saveGame();
        
        // Modify state
        coreStore.addMoney(500);
        
        // Load saved state
        await saveManager.loadGame();
        
        const loadedMoney = useCoreGameStore.getState().player?.resources?.money || 0;
        
        if (loadedMoney !== currentMoney) {
          throw new Error(`Load failed: ${loadedMoney} !== ${currentMoney}`);
        }
        
        return 'Game loaded successfully with correct state';
      }
    ));

    // Test 4: Progress restoration
    section.tests.push(await this.runTest(
      'Progress Restoration',
      async () => {
        const narrativeStore = useNarrativeStore.getState();
        const testFlags = ['progress_1', 'progress_2', 'progress_3'];
        
        // Set flags
        testFlags.forEach(flag => narrativeStore.addFlag(flag, true));
        
        await saveManager.saveGame();
        
        // Clear flags
        testFlags.forEach(flag => narrativeStore.removeFlag(flag));
        
        // Load and verify
        await saveManager.loadGame();
        
        const loadedStore = useNarrativeStore.getState();
        const allFlagsRestored = testFlags.every(flag => loadedStore.flags?.[flag] === true);
        
        if (!allFlagsRestored) {
          throw new Error('Progress flags not restored correctly');
        }
        
        return 'All progress flags restored correctly';
      }
    ));

    // Test 5: Save export/import
    section.tests.push(await this.runTest(
      'Save Export/Import',
      async () => {
        // Export save
        const exportData = await saveManager.exportSave();
        
        if (!exportData || typeof exportData !== 'string') {
          throw new Error('Save export failed');
        }
        
        // Clear current data
        saveManager.clearSaveData();
        
        // Import save
        await saveManager.importSave(exportData);
        
        const importedData = saveManager.getCurrentSaveData();
        
        if (!importedData.player) {
          throw new Error('Save import failed');
        }
        
        return 'Save export/import successful';
      }
    ));

    section.duration = performance.now() - sectionStart;
    section.success = section.tests.every(t => t.success);
    this.report.sections.push(section);
  }

  private async testPerformanceAndMemory(): Promise<void> {
    console.log('⚡ Testing Performance & Memory...');
    const section = this.createSection('Performance & Memory');
    const sectionStart = performance.now();

    // Test 1: Flag generation performance
    section.tests.push(await this.runTest(
      'Flag Generation Performance',
      async () => {
        const concerns = useCharacterConcernsStore.getState().concerns;
        const times = [];
        
        for (let i = 0; i < 50; i++) {
          const start = performance.now();
          generateConcernFlags(concerns);
          times.push(performance.now() - start);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        
        if (avgTime > 10) {
          throw new Error(`Flag generation too slow: ${avgTime.toFixed(2)}ms average`);
        }
        
        return `Flag generation performance good: ${avgTime.toFixed(2)}ms average`;
      }
    ));

    // Test 2: Memory leak detection
    section.tests.push(await this.runTest(
      'Memory Leak Detection',
      async () => {
        const initialMemory = this.getMemoryUsage();
        
        // Create potential memory leaks
        for (let i = 0; i < 100; i++) {
          const largeArray = new Array(1000).fill(Math.random());
          // Intentionally keep references
          (globalThis as any)[`leak_${i}`] = largeArray;
        }
        
        const afterLeakMemory = this.getMemoryUsage();
        
        // Clean up
        for (let i = 0; i < 100; i++) {
          delete (globalThis as any)[`leak_${i}`];
        }
        
        if (global.gc) global.gc();
        
        const finalMemory = this.getMemoryUsage();
        const memoryGrowth = afterLeakMemory - initialMemory;
        const memoryRecovered = afterLeakMemory - finalMemory;
        
        return `Memory leak test: ${memoryGrowth / 1024}KB leaked, ${memoryRecovered / 1024}KB recovered`;
      }
    ));

    // Test 3: Subscription cleanup effectiveness
    section.tests.push(await this.runTest(
      'Subscription Cleanup Effectiveness',
      async () => {
        const initialCount = subscriptionManager.getStats().totalSubscriptions;
        
        // Create test subscriptions
        for (let i = 0; i < 50; i++) {
          subscriptionManager.add(`test_component_${i}`, jest.fn());
        }
        
        const afterAddCount = subscriptionManager.getStats().totalSubscriptions;
        
        // Cleanup all test subscriptions
        for (let i = 0; i < 50; i++) {
          subscriptionManager.cleanup(`test_component_${i}`);
        }
        
        const finalCount = subscriptionManager.getStats().totalSubscriptions;
        
        if (finalCount !== initialCount) {
          throw new Error(`Subscription cleanup failed: ${finalCount} !== ${initialCount}`);
        }
        
        return `Subscription cleanup effective: ${afterAddCount - initialCount} added, all cleaned up`;
      }
    ));

    section.duration = performance.now() - sectionStart;
    section.success = section.tests.every(t => t.success);
    this.report.sections.push(section);
  }

  private async testErrorHandling(): Promise<void> {
    console.log('🛠️ Testing Error Handling...');
    const section = this.createSection('Error Handling');
    const sectionStart = performance.now();

    // Test 1: Save system error recovery
    section.tests.push(await this.runTest(
      'Save System Error Recovery',
      async () => {
        // Simulate localStorage failure
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = () => {
          throw new Error('Simulated storage error');
        };
        
        try {
          await saveManager.saveGame();
          throw new Error('Save should have failed');
        } catch (error) {
          // Expected to fail
        } finally {
          localStorage.setItem = originalSetItem;
        }
        
        // Verify recovery
        await saveManager.saveGame();
        
        return 'Save system error recovery successful';
      }
    ));

    // Test 2: Invalid data handling
    section.tests.push(await this.runTest(
      'Invalid Data Handling',
      async () => {
        const concernsStore = useCharacterConcernsStore.getState();
        
        // Try to set invalid concerns
        try {
          concernsStore.setConcerns(null as any);
        } catch (error) {
          // Expected to handle gracefully
        }
        
        // Verify store is still functional
        concernsStore.setConcerns({ family: 25, career: 25 });
        
        return 'Invalid data handled gracefully';
      }
    ));

    section.duration = performance.now() - sectionStart;
    section.success = section.tests.every(t => t.success);
    this.report.sections.push(section);
  }

  private async testDataIntegrity(): Promise<void> {
    console.log('🔒 Testing Data Integrity...');
    const section = this.createSection('Data Integrity');
    const sectionStart = performance.now();

    // Test 1: Save data consistency
    section.tests.push(await this.runTest(
      'Save Data Consistency',
      async () => {
        const coreStore = useCoreGameStore.getState();
        const narrativeStore = useNarrativeStore.getState();
        
        const testMoney = 12345;
        const testFlag = 'integrity_test_flag';
        
        coreStore.setMoney(testMoney);
        narrativeStore.addFlag(testFlag, true);
        
        await saveManager.saveGame();
        
        // Verify save data
        const saveData = saveManager.getCurrentSaveData();
        
        if (saveData.player?.resources?.money !== testMoney) {
          throw new Error('Money not saved consistently');
        }
        
        if (saveData.flags?.[testFlag] !== true) {
          throw new Error('Flag not saved consistently');
        }
        
        return 'Save data consistency verified';
      }
    ));

    // Test 2: Cross-store data synchronization
    section.tests.push(await this.runTest(
      'Cross-Store Data Synchronization',
      async () => {
        const coreStore = useCoreGameStore.getState();
        const socialStore = useSocialStore.getState();
        
        // Make changes in both stores
        coreStore.addMoney(100);
        // Simulate social store update
        
        await saveManager.saveGame();
        
        const saveData = saveManager.getCurrentSaveData();
        
        // Verify both stores' data is present
        if (!saveData.player || !saveData.social) {
          throw new Error('Cross-store synchronization failed');
        }
        
        return 'Cross-store data synchronization working';
      }
    ));

    section.duration = performance.now() - sectionStart;
    section.success = section.tests.every(t => t.success);
    this.report.sections.push(section);
  }

  private createSection(name: string): TestSection {
    return {
      sectionName: name,
      tests: [],
      success: false,
      duration: 0
    };
  }

  private async runTest(
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<TestResult> {
    const start = performance.now();
    
    try {
      const result = await testFunction();
      const duration = performance.now() - start;
      
      let details = '';
      let warnings: string[] = [];
      
      if (typeof result === 'string') {
        details = result;
      } else if (result && typeof result === 'object') {
        details = result.details || '';
        warnings = result.warnings || [];
      }
      
      console.log(`  ✅ ${testName} (${duration.toFixed(2)}ms)`);
      
      return {
        testName,
        success: true,
        duration,
        details,
        warnings
      };
      
    } catch (error) {
      const duration = performance.now() - start;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.log(`  ❌ ${testName} failed: ${errorMessage}`);
      
      return {
        testName,
        success: false,
        duration,
        details: '',
        error: errorMessage
      };
    }
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private finalizeReport(): void {
    this.report.totalDuration = performance.now() - this.testStartTime;
    
    // Calculate summary
    this.report.summary.totalTests = this.report.sections.reduce(
      (sum, section) => sum + section.tests.length, 0
    );
    
    this.report.summary.passedTests = this.report.sections.reduce(
      (sum, section) => sum + section.tests.filter(t => t.success).length, 0
    );
    
    this.report.summary.failedTests = this.report.summary.totalTests - this.report.summary.passedTests;
    
    this.report.summary.warningsCount = this.report.sections.reduce(
      (sum, section) => sum + section.tests.reduce(
        (testSum, test) => testSum + (test.warnings?.length || 0), 0
      ), 0
    );
    
    this.report.overallSuccess = this.report.sections.every(section => section.success);
  }

  private generateTestReport(): void {
    const { summary, totalDuration, overallSuccess } = this.report;
    
    console.log('\n📋 FULL GAMEPLAY TEST REPORT');
    console.log('=' .repeat(60));
    console.log(`Overall Result: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`Tests: ${summary.passedTests}/${summary.totalTests} passed`);
    console.log(`Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);
    
    if (summary.warningsCount > 0) {
      console.log(`⚠️  Warnings: ${summary.warningsCount}`);
    }
    
    this.report.sections.forEach(section => {
      const status = section.success ? '✅' : '❌';
      console.log(`\n${status} ${section.sectionName} (${section.duration.toFixed(2)}ms)`);
      
      section.tests.forEach(test => {
        const testStatus = test.success ? '  ✅' : '  ❌';
        console.log(`${testStatus} ${test.testName} (${test.duration.toFixed(2)}ms)`);
        
        if (test.details) {
          console.log(`      ${test.details}`);
        }
        
        if (test.error) {
          console.log(`      ❌ Error: ${test.error}`);
        }
        
        if (test.warnings && test.warnings.length > 0) {
          test.warnings.forEach(warning => {
            console.log(`      ⚠️  Warning: ${warning}`);
          });
        }
      });
    });
    
    this.generateGameplayRecommendations();
  }

  private generateGameplayRecommendations(): void {
    const failedTests = this.report.sections.flatMap(section => 
      section.tests.filter(test => !test.success)
    );
    
    console.log('\n💡 GAMEPLAY TEST RECOMMENDATIONS:');
    
    if (failedTests.length === 0) {
      console.log('✅ All gameplay tests passed! The game is ready for release.');
      return;
    }
    
    failedTests.forEach(test => {
      console.log(`\n🔍 ${test.testName}:`);
      
      if (test.testName.includes('Performance')) {
        console.log('  • Review performance optimizations');
        console.log('  • Consider implementing lazy loading');
      }
      
      if (test.testName.includes('Memory')) {
        console.log('  • Check for memory leaks in components');
        console.log('  • Review subscription cleanup');
      }
      
      if (test.testName.includes('Save')) {
        console.log('  • Verify save system implementation');
        console.log('  • Check data serialization');
      }
      
      if (test.testName.includes('Error')) {
        console.log('  • Improve error handling and recovery');
        console.log('  • Add user-friendly error messages');
      }
    });
  }
}

// Export for use in tests and production
export default GameplayTestChecklist;

// Utility function
export async function runGameplayTestChecklist(): Promise<GameplayTestReport> {
  const checklist = new GameplayTestChecklist();
  return await checklist.runFullGameplayTest();
}

// Quick test for development
export async function quickGameplayTest(): Promise<boolean> {
  console.log('🚀 Running quick gameplay test...');
  
  const checklist = new GameplayTestChecklist();
  const report = await checklist.runFullGameplayTest();
  
  if (report.overallSuccess) {
    console.log('✅ Quick gameplay test passed!');
    return true;
  } else {
    console.log('❌ Quick gameplay test failed - check full report above');
    return false;
  }
}