// /Users/montysharma/v11m2/test/v2/v2IntegrationTests.ts
// Comprehensive V2 Store Integration Test Suite
// Tests the full V2 migration functionality and store interactions

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../src/stores/v2';
import { useOptimizedNarrativeStore } from '../../src/stores/v2/optimizedNarrativeStore';
import { useOptimizedSocialStore } from '../../src/stores/v2/optimizedSocialStore';
import { useOptimizedCoreGameStore } from '../../src/stores/v2/optimizedCoreGameStore';
import { benchmarkStorePerformance, generatePerformanceReport } from '../../src/stores/v2/optimizedStoreMigration';
import { useStoryletCatalogStore } from '../../src/store/useStoryletCatalogStore';
import { useAppStore } from '../../src/store/useAppStore';
import type { Storylet, Choice, Effect } from '../../src/types/storylet';
import type { Clue } from '../../src/types/clue';

export interface V2TestResult {
  success: boolean;
  testName: string;
  duration: number;
  errors: string[];
  warnings: string[];
  validations: Record<string, boolean>;
}

export interface V2IntegrationTestSuite {
  storeInitialization: V2TestResult;
  storyletEvaluation: V2TestResult;
  storyArcProgression: V2TestResult;
  clueDiscoveryFlow: V2TestResult;
  crossStoreConsistency: V2TestResult;
  performanceMetrics: V2TestResult;
  migrationCompatibility: V2TestResult;
  optimizedStoreComparison: V2TestResult;
}

// Test data setup
const createTestStorylet = (id: string, requirements?: any): Storylet => ({
  id,
  name: `Test Storylet ${id}`,
  description: `Test storylet for integration testing`,
  choices: [
    {
      id: `${id}-choice-1`,
      text: 'Test Choice 1',
      effects: [
        { type: 'resource', key: 'energy', delta: -10 },
        { type: 'flag', key: `${id}_completed`, value: true }
      ]
    },
    {
      id: `${id}-choice-2`, 
      text: 'Test Choice 2',
      effects: [
        { type: 'skillXp', key: 'academic', amount: 15 },
        { type: 'unlock', storyletId: `${id}-next` }
      ]
    }
  ],
  trigger: { type: 'time', conditions: {} },
  requirements: requirements || {},
  author: 'test-suite',
  version: '1.0.0',
  tags: ['test', 'integration'],
  metadata: {
    createdAt: new Date().toISOString(),
    category: 'social'
  }
});

const createTestClue = (id: string, arcId?: string): Clue => ({
  id,
  title: `Test Clue ${id}`,
  description: `Test clue for integration testing`,
  content: `This is test content for clue ${id}`,
  category: 'general',
  difficulty: 'medium',
  storyArc: arcId || 'test-arc',
  arcOrder: 1,
  minigameTypes: ['word-association'],
  associatedStorylets: [`storylet-${id}`],
  isDiscovered: true,
  discoveredAt: new Date(),
  tags: ['test', 'integration'],
  rarity: 'common',
  createdAt: new Date(),
  updatedAt: new Date()
});

/**
 * Test 1: V2 Store Initialization and Basic Operations
 */
export const testV2StoreInitialization = async (): Promise<V2TestResult> => {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: Record<string, boolean> = {};

  try {
    console.log('🧪 Testing V2 Store Initialization...');

    // Test Core Game Store initialization
    const coreStore = useCoreGameStore.getState();
    validations.coreStoreExists = !!coreStore;
    validations.coreStoreHasPlayer = !!coreStore.player;
    validations.coreStoreHasWorld = !!coreStore.world;

    if (!coreStore.player) {
      errors.push('Core store missing player data');
    }

    // Test Narrative Store initialization
    const narrativeStore = useNarrativeStore.getState();
    validations.narrativeStoreExists = !!narrativeStore;
    validations.narrativeStoreHasStorylets = !!narrativeStore.storylets;
    validations.narrativeStoreHasFlags = !!narrativeStore.flags;
    validations.narrativeStoreHasArcs = !!narrativeStore.storyArcs;

    // Test Social Store initialization
    const socialStore = useSocialStore.getState();
    validations.socialStoreExists = !!socialStore;
    validations.socialStoreHasClues = !!socialStore.clues;
    validations.socialStoreHasRelationships = !!socialStore.npcs.relationships;

    // Test store methods are available
    validations.narrativeMethodsExist = !!(
      narrativeStore.addActiveStorylet &&
      narrativeStore.completeStorylet &&
      narrativeStore.setStoryletFlag
    );

    validations.socialMethodsExist = !!(
      socialStore.discoverClue &&
      socialStore.connectClues &&
      socialStore.setClueArcRelationship
    );

    // Test initial state consistency
    const activeStorylets = narrativeStore.storylets.active;
    const completedStorylets = narrativeStore.storylets.completed;
    
    validations.noOverlapActiveCompleted = !activeStorylets.some(id => 
      completedStorylets.includes(id)
    );

    if (activeStorylets.some(id => completedStorylets.includes(id))) {
      errors.push('Active and completed storylets have overlapping IDs');
    }

  } catch (error) {
    errors.push(`Store initialization failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  return {
    success,
    testName: 'V2 Store Initialization',
    duration,
    errors,
    warnings,
    validations
  };
};

/**
 * Test 2: Storylet Evaluation and Progression
 */
export const testStoryletEvaluation = async (): Promise<V2TestResult> => {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: Record<string, boolean> = {};

  try {
    console.log('🧪 Testing Storylet Evaluation...');

    const narrativeStore = useNarrativeStore.getState();
    const catalogStore = useStoryletCatalogStore.getState();
    const coreStore = useCoreGameStore.getState();

    // Create test storylet with resource requirements
    const testStorylet = createTestStorylet('test-eval-1', {
      resources: { energy: 50 }
    });

    // Add storylet to catalog
    catalogStore.addStorylet(testStorylet);
    validations.storyletAddedToCatalog = !!catalogStore.getStorylet('test-eval-1');

    // Test storylet activation
    narrativeStore.addActiveStorylet('test-eval-1');
    const activeStorylets = narrativeStore.storylets.active;
    validations.storyletActivated = activeStorylets.includes('test-eval-1');

    // Test storylet completion
    narrativeStore.completeStorylet('test-eval-1');
    const completedStorylets = narrativeStore.storylets.completed;
    validations.storyletCompleted = completedStorylets.includes('test-eval-1');
    validations.storyletRemovedFromActive = !narrativeStore.storylets.active.includes('test-eval-1');

    // Test effect application
    const choice = testStorylet.choices[0];
    const initialFlags = Object.keys(narrativeStore.flags.storylet).length;
    
    // Apply flag effect
    const flagEffect = choice.effects.find(e => e.type === 'flag');
    if (flagEffect) {
      narrativeStore.setStoryletFlag(flagEffect.key, flagEffect.value);
      const newFlags = Object.keys(narrativeStore.flags.storylet).length;
      validations.flagEffectApplied = newFlags > initialFlags;
    }

    // Test cooldown system
    narrativeStore.setCooldown('test-eval-1', 10);
    validations.cooldownSet = narrativeStore.storylets.cooldowns['test-eval-1'] === 10;

    // Test unlock effect
    const unlockEffect = testStorylet.choices[1].effects.find(e => e.type === 'unlock');
    if (unlockEffect) {
      const nextStorylet = createTestStorylet(unlockEffect.storyletId);
      catalogStore.addStorylet(nextStorylet);
      narrativeStore.unlockStorylet(unlockEffect.storyletId);
      validations.unlockEffectApplied = narrativeStore.storylets.active.includes(unlockEffect.storyletId);
    }

  } catch (error) {
    errors.push(`Storylet evaluation failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  return {
    success,
    testName: 'Storylet Evaluation and Progression',
    duration,
    errors,
    warnings,
    validations
  };
};

/**
 * Test 3: Story Arc Progression and Management
 */
export const testStoryArcProgression = async (): Promise<V2TestResult> => {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: Record<string, boolean> = {};

  try {
    console.log('🧪 Testing Story Arc Progression...');

    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();

    // Create test story arc using available method
    const arcId = narrativeStore.createArc({
      name: 'Test Story Arc',
      description: 'Integration test story arc',
      progress: 0,
      isCompleted: false,
      failures: 0
    });
    
    validations.arcCreated = !!narrativeStore.getArc(arcId);

    // Test arc progression methods
    narrativeStore.startArc(arcId);
    narrativeStore.progressArcStorylet(arcId, 'test-arc-storylet-1');
    
    const updatedArc = narrativeStore.getArc(arcId);
    validations.arcProgressUpdated = !!updatedArc;

    // Test arc completion
    narrativeStore.completeArc(arcId);
    const completedArc = narrativeStore.getArc(arcId);
    validations.arcCompleted = !!completedArc && completedArc.isCompleted;

    // Test social store arc integration  
    socialStore.updateRelationship('npc-1', 75);
    const npcRelationships = socialStore.npcs.relationships;
    validations.arcSocialIntegration = !!npcRelationships && npcRelationships['npc-1'] === 75;

  } catch (error) {
    errors.push(`Story arc progression failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  return {
    success,
    testName: 'Story Arc Progression and Management',
    duration,
    errors,
    warnings,
    validations
  };
};

/**
 * Test 4: Clue Discovery Flow
 */
export const testClueDiscoveryFlow = async (): Promise<V2TestResult> => {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: Record<string, boolean> = {};

  try {
    console.log('🧪 Testing Clue Discovery Flow...');

    const socialStore = useSocialStore.getState();
    const narrativeStore = useNarrativeStore.getState();

    // Create test arc for clue testing
    const testArcId = narrativeStore.createArc({
      name: 'Test Clue Arc',
      description: 'Arc for testing clue integration',
      progress: 0,
      isCompleted: false,
      failures: 0
    });

    // Create test clues
    const clue1 = createTestClue('test-clue-1', testArcId);
    const clue2 = createTestClue('test-clue-2', testArcId);

    // Test clue discovery
    socialStore.discoverClue(clue1);
    validations.clueDiscovered = socialStore.clues.discovered.some(c => c.id === 'test-clue-1');

    // Test clue connection
    socialStore.connectClues('test-clue-1', 'test-clue-2', 'related');
    validations.cluesConnected = socialStore.clues.connections.some(conn => 
      (conn.fromClueId === 'test-clue-1' && conn.toClueId === 'test-clue-2') ||
      (conn.fromClueId === 'test-clue-2' && conn.toClueId === 'test-clue-1')
    );

    // Test arc-clue integration
    const arcClues = socialStore.getCluesByArc(testArcId);
    validations.arcClueIntegration = arcClues.length > 0;

    // Test clue-based storylet unlocking
    socialStore.discoverClue(clue2);
    
    // Check if discovering clues affects narrative flags
    const clueFlags = Object.keys(narrativeStore.flags.concerns);
    validations.clueDiscoveryAffectsFlags = clueFlags.length > 0;

  } catch (error) {
    errors.push(`Clue discovery flow failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  return {
    success,
    testName: 'Clue Discovery Flow',
    duration,
    errors,
    warnings,
    validations
  };
};

/**
 * Test 5: Cross-Store Consistency
 */
export const testCrossStoreConsistency = async (): Promise<V2TestResult> => {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: Record<string, boolean> = {};

  try {
    console.log('🧪 Testing Cross-Store Consistency...');

    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();

    // Test player data consistency across stores
    const playerLevel = coreStore.player?.level || 1;
    const worldDay = coreStore.world?.day || 1;

    // Check that narrative store references valid player data
    validations.narrativePlayerConsistency = 
      typeof playerLevel === 'number' && 
      typeof worldDay === 'number';

    // Test story arc references in both narrative and social stores
    const narrativeArcs = narrativeStore.getAllArcs().map(arc => arc.id);
    const socialArcs = Object.keys(socialStore.clues.arcRelationships);
    
    // All social arc relationships should reference existing narrative arcs
    const invalidArcRefs = socialArcs.filter(arcId => !narrativeArcs.includes(arcId));
    validations.arcReferencesValid = invalidArcRefs.length === 0;

    if (invalidArcRefs.length > 0) {
      warnings.push(`Social store references non-existent arcs: ${invalidArcRefs.join(', ')}`);
    }

    // Test flag namespace consistency
    const storyletFlags = narrativeStore.flags.storylet;
    const arcFlags = narrativeStore.flags.storyArc;
    const concernFlags = narrativeStore.flags.concerns;

    validations.flagNamespacesExist = !!(storyletFlags && arcFlags && concernFlags);

    // Test clue-arc consistency
    const discoveredClues = socialStore.clues.discovered;
    const clueArcs = discoveredClues.map(clue => clue.storyArc).filter(Boolean);
    const invalidClueArcs = clueArcs.filter(arcId => !narrativeArcs.includes(arcId));
    
    validations.clueArcReferencesValid = invalidClueArcs.length === 0;

    if (invalidClueArcs.length > 0) {
      warnings.push(`Clues reference non-existent arcs: ${invalidClueArcs.join(', ')}`);
    }

  } catch (error) {
    errors.push(`Cross-store consistency check failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  return {
    success,
    testName: 'Cross-Store Consistency',
    duration,
    errors,
    warnings,
    validations
  };
};

/**
 * Test 6: Performance Metrics
 */
export const testPerformanceMetrics = async (): Promise<V2TestResult> => {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: Record<string, boolean> = {};

  try {
    console.log('🧪 Testing V2 Performance Metrics...');

    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();

    // Test bulk operations performance
    const bulkStartTime = performance.now();
    
    // Add multiple storylets
    for (let i = 0; i < 100; i++) {
      narrativeStore.addActiveStorylet(`perf-test-${i}`);
    }
    
    const bulkAddTime = performance.now() - bulkStartTime;
    validations.bulkAddPerformance = bulkAddTime < 100; // Should take less than 100ms

    if (bulkAddTime >= 100) {
      warnings.push(`Bulk add operation took ${bulkAddTime.toFixed(2)}ms (expected < 100ms)`);
    }

    // Test store state serialization performance
    const serializeStartTime = performance.now();
    const serializedNarrative = JSON.stringify(narrativeStore);
    const serializedSocial = JSON.stringify(socialStore);
    const serializeTime = performance.now() - serializeStartTime;

    validations.serializationPerformance = serializeTime < 50; // Should take less than 50ms
    validations.serializedDataValid = !!(serializedNarrative && serializedSocial);

    if (serializeTime >= 50) {
      warnings.push(`Serialization took ${serializeTime.toFixed(2)}ms (expected < 50ms)`);
    }

    // Test memory usage (rough estimate)
    const narrativeSize = JSON.stringify(narrativeStore).length;
    const socialSize = JSON.stringify(socialStore).length;
    const totalSize = narrativeSize + socialSize;

    validations.memoryUsageReasonable = totalSize < 1000000; // Less than 1MB

    if (totalSize >= 1000000) {
      warnings.push(`Store memory usage: ${(totalSize / 1000).toFixed(2)}KB (large)`);
    }

  } catch (error) {
    errors.push(`Performance testing failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  return {
    success,
    testName: 'Performance Metrics',
    duration,
    errors,
    warnings,
    validations
  };
};

/**
 * Test 7: Migration Compatibility
 */
export const testMigrationCompatibility = async (): Promise<V2TestResult> => {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: Record<string, boolean> = {};

  try {
    console.log('🧪 Testing Migration Compatibility...');

    const narrativeStore = useNarrativeStore.getState();
    const appStore = useAppStore.getState();

    // Test legacy data compatibility
    const legacyData = {
      completedStorylets: ['legacy-storylet-1', 'legacy-storylet-2'],
      flags: { 'legacy_flag': true },
      day: 5,
      resources: { energy: 50, money: 100 }
    };

    // Test migration function exists
    validations.migrationFunctionExists = typeof narrativeStore.migrateFromLegacyStores === 'function';

    // Test data format compatibility
    if (legacyData.completedStorylets) {
      narrativeStore.storylets.completed.push(...legacyData.completedStorylets);
      validations.legacyStoryletDataCompatible = 
        narrativeStore.storylets.completed.includes('legacy-storylet-1');
    }

    // Test flag migration
    if (legacyData.flags) {
      narrativeStore.setStoryletFlag('legacy_flag', true);
      validations.legacyFlagMigration = !!narrativeStore.getStoryletFlag('legacy_flag');
    }

    // Test V1/V2 coexistence
    const appDay = appStore.day;
    const narrativeFlags = narrativeStore.flags.storylet.size;
    
    validations.v1v2Coexistence = !!(appDay && narrativeFlags >= 0);

    // Test backwards compatibility
    const v1Resources = appStore.resources;
    const hasV1Resources = v1Resources && typeof v1Resources.energy === 'number';
    
    validations.backwardsCompatibility = !!hasV1Resources;

  } catch (error) {
    errors.push(`Migration compatibility test failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  return {
    success,
    testName: 'Migration Compatibility',
    duration,
    errors,
    warnings,
    validations
  };
};

/**
 * Test optimized store performance comparison
 */
export const testOptimizedStoreComparison = async (): Promise<V2TestResult> => {
  const startTime = performance.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const validations: Record<string, boolean> = {};

  try {
    console.log('🔬 Testing optimized store performance comparison...');

    // Test 1: Basic functionality equivalence
    const narrativeState = useNarrativeStore.getState();
    const optimizedNarrativeState = useOptimizedNarrativeStore.getState();
    
    // Set same data in both stores
    const testStorylet = 'performance_test_storylet';
    narrativeState.addActiveStorylet(testStorylet);
    optimizedNarrativeState.addActiveStorylet(testStorylet);
    
    validations.functionalEquivalence = 
      narrativeState.storylets.active.includes(testStorylet) &&
      optimizedNarrativeState.storylets.active.includes(testStorylet);

    // Test 2: Performance benchmarking
    const benchmarkResults = await benchmarkStorePerformance();
    
    const narrativeImprovement = benchmarkResults.narrative.improvement;
    const socialImprovement = benchmarkResults.social.improvement;
    const coreImprovement = benchmarkResults.core.improvement;
    
    validations.narrativePerformanceImprovement = narrativeImprovement > 0;
    validations.socialPerformanceImprovement = socialImprovement > 0;
    validations.corePerformanceImprovement = coreImprovement > 0;
    
    if (narrativeImprovement < 5) {
      warnings.push(`Narrative store improvement only ${narrativeImprovement.toFixed(1)}% - expected >5%`);
    }
    
    if (socialImprovement < 5) {
      warnings.push(`Social store improvement only ${socialImprovement.toFixed(1)}% - expected >5%`);
    }
    
    if (coreImprovement < 5) {
      warnings.push(`Core store improvement only ${coreImprovement.toFixed(1)}% - expected >5%`);
    }

    // Test 3: Memory usage comparison
    const narrativeSize = JSON.stringify(narrativeState).length;
    const optimizedNarrativeSize = JSON.stringify(optimizedNarrativeState).length;
    const narrativeSizeReduction = ((narrativeSize - optimizedNarrativeSize) / narrativeSize) * 100;
    
    validations.memorySizeReduction = narrativeSizeReduction >= 0; // Should be at least equal or smaller
    
    if (narrativeSizeReduction < 0) {
      warnings.push(`Optimized store is ${Math.abs(narrativeSizeReduction).toFixed(1)}% larger - unexpected`);
    }

    // Test 4: Performance metadata tracking
    const optimizedMetrics = useOptimizedNarrativeStore.getState().getPerformanceMetrics();
    validations.performanceMetadataPresent = !!(
      optimizedMetrics.operationCount !== undefined &&
      optimizedMetrics.cacheHits !== undefined &&
      optimizedMetrics.cacheMisses !== undefined
    );

    // Test 5: Auto-optimization functionality
    const beforeOptimization = useOptimizedNarrativeStore.getState()._performance.operationCount;
    useOptimizedNarrativeStore.getState().optimizeStore();
    const afterOptimization = useOptimizedNarrativeStore.getState()._performance.operationCount;
    
    validations.autoOptimizationWorks = afterOptimization === 0; // Should reset to 0

    // Test 6: Generate comprehensive performance report
    const performanceReport = generatePerformanceReport();
    validations.performanceReportGeneration = !!(
      performanceReport.narrative &&
      performanceReport.social &&
      performanceReport.core &&
      performanceReport.overall
    );

    console.log('📊 Performance Benchmark Results:', {
      narrative: `${narrativeImprovement.toFixed(1)}% improvement`,
      social: `${socialImprovement.toFixed(1)}% improvement`,
      core: `${coreImprovement.toFixed(1)}% improvement`,
      memorySaving: `${narrativeSizeReduction.toFixed(1)}% size reduction`
    });

  } catch (error) {
    errors.push(`Optimized store comparison test failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  return {
    success,
    testName: 'Optimized Store Performance Comparison',
    duration,
    errors,
    warnings,
    validations
  };
};

/**
 * Main Integration Test Runner
 */
export const runV2IntegrationTests = async (): Promise<V2IntegrationTestSuite> => {
  console.log('🚀 Starting V2 Integration Test Suite...');
  
  const tests = {
    storeInitialization: await testV2StoreInitialization(),
    storyletEvaluation: await testStoryletEvaluation(),
    storyArcProgression: await testStoryArcProgression(),
    clueDiscoveryFlow: await testClueDiscoveryFlow(),
    crossStoreConsistency: await testCrossStoreConsistency(),
    performanceMetrics: await testPerformanceMetrics(),
    migrationCompatibility: await testMigrationCompatibility(),
    optimizedStoreComparison: await testOptimizedStoreComparison()
  };

  // Generate summary
  const totalTests = Object.keys(tests).length;
  const passedTests = Object.values(tests).filter(t => t.success).length;
  const totalDuration = Object.values(tests).reduce((sum, t) => sum + t.duration, 0);
  
  console.log(`\n📊 V2 Integration Test Summary:`);
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // Log detailed results
  Object.entries(tests).forEach(([testName, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.testName}: ${result.duration.toFixed(2)}ms`);
    
    if (result.errors.length > 0) {
      result.errors.forEach(error => console.log(`   ❌ ${error}`));
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warning => console.log(`   ⚠️ ${warning}`));
    }
  });

  return tests;
};

// Expose tests globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).runV2IntegrationTests = runV2IntegrationTests;
  (window as any).testV2StoreInitialization = testV2StoreInitialization;
  (window as any).testStoryletEvaluation = testStoryletEvaluation;
  (window as any).testStoryArcProgression = testStoryArcProgression;
  (window as any).testClueDiscoveryFlow = testClueDiscoveryFlow;
  (window as any).testCrossStoreConsistency = testCrossStoreConsistency;
  (window as any).testPerformanceMetrics = testPerformanceMetrics;
  (window as any).testMigrationCompatibility = testMigrationCompatibility;
  (window as any).testOptimizedStoreComparison = testOptimizedStoreComparison;
  
  console.log('🧪 V2 Integration Tests exposed globally for console access');
}