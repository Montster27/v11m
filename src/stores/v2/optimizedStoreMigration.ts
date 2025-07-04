// /Users/montysharma/v11m2/src/stores/v2/optimizedStoreMigration.ts
// Migration utilities for transitioning from V2 stores to optimized versions

import { useNarrativeStore } from './useNarrativeStore';
import { useSocialStore } from './useSocialStore';
import { useCoreGameStore } from './useCoreGameStore';
import { useOptimizedNarrativeStore } from './optimizedNarrativeStore';
import { useOptimizedSocialStore } from './optimizedSocialStore';
import { useOptimizedCoreGameStore } from './optimizedCoreGameStore';
import { StorePerformanceMonitor } from './storeOptimizations';

export interface MigrationResult {
  success: boolean;
  errors: string[];
  migratedStores: string[];
  performanceGains: {
    storeName: string;
    sizeReduction: number;
    operationSpeedup: number;
  }[];
}

/**
 * Migrate all V2 stores to their optimized versions
 */
export const migrateToOptimizedStores = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: true,
    errors: [],
    migratedStores: [],
    performanceGains: []
  };

  console.log('🚀 Starting migration to optimized V2 stores...');

  try {
    // Migrate Narrative Store
    await migrateNarrativeStore(result);
    
    // Migrate Social Store
    await migrateSocialStore(result);
    
    // Migrate Core Game Store
    await migrateCoreGameStore(result);

    if (result.errors.length === 0) {
      console.log('✅ All stores successfully migrated to optimized versions');
      result.success = true;
    } else {
      console.warn('⚠️ Migration completed with some errors:', result.errors);
      result.success = false;
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
  }

  return result;
};

/**
 * Migrate Narrative Store to optimized version
 */
const migrateNarrativeStore = async (result: MigrationResult): Promise<void> => {
  try {
    console.log('🔄 Migrating Narrative Store...');
    
    const startTime = performance.now();
    const originalState = useNarrativeStore.getState();
    const originalSize = JSON.stringify(originalState).length;
    
    // Transform data structure for optimized store
    const optimizedData = {
      storylets: originalState.storylets,
      storyArcs: originalState.storyArcs,
      arcProgress: originalState.arcProgress,
      concerns: originalState.concerns,
      
      // Convert Maps to Records for optimized storage
      flags: {
        storylet: Object.fromEntries(originalState.flags.storylet.entries()),
        storyletFlag: Object.fromEntries(originalState.flags.storyletFlag.entries()),
        concerns: Object.fromEntries(originalState.flags.concerns.entries()),
        storyArc: Object.fromEntries(originalState.flags.storyArc.entries())
      }
    };
    
    // Set the optimized store state
    useOptimizedNarrativeStore.setState(optimizedData);
    
    const migrationTime = performance.now() - startTime;
    const newSize = JSON.stringify(useOptimizedNarrativeStore.getState()).length;
    const sizeReduction = ((originalSize - newSize) / originalSize) * 100;
    
    result.migratedStores.push('narrative');
    result.performanceGains.push({
      storeName: 'narrative',
      sizeReduction,
      operationSpeedup: 0 // Will be measured during runtime
    });
    
    console.log(`✅ Narrative Store migrated in ${migrationTime.toFixed(2)}ms`);
    console.log(`📊 Size reduction: ${sizeReduction.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Narrative Store migration failed:', error);
    result.errors.push(`Narrative Store: ${error}`);
  }
};

/**
 * Migrate Social Store to optimized version
 */
const migrateSocialStore = async (result: MigrationResult): Promise<void> => {
  try {
    console.log('🔄 Migrating Social Store...');
    
    const startTime = performance.now();
    const originalState = useSocialStore.getState();
    const originalSize = JSON.stringify(originalState).length;
    
    // Transform data structure for optimized store
    const optimizedData = {
      npcs: originalState.npcs,
      clues: originalState.clues,
      saves: originalState.saves
    };
    
    // Set the optimized store state
    useOptimizedSocialStore.setState(optimizedData);
    
    const migrationTime = performance.now() - startTime;
    const newSize = JSON.stringify(useOptimizedSocialStore.getState()).length;
    const sizeReduction = ((originalSize - newSize) / originalSize) * 100;
    
    result.migratedStores.push('social');
    result.performanceGains.push({
      storeName: 'social',
      sizeReduction,
      operationSpeedup: 0 // Will be measured during runtime
    });
    
    console.log(`✅ Social Store migrated in ${migrationTime.toFixed(2)}ms`);
    console.log(`📊 Size reduction: ${sizeReduction.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Social Store migration failed:', error);
    result.errors.push(`Social Store: ${error}`);
  }
};

/**
 * Migrate Core Game Store to optimized version
 */
const migrateCoreGameStore = async (result: MigrationResult): Promise<void> => {
  try {
    console.log('🔄 Migrating Core Game Store...');
    
    const startTime = performance.now();
    const originalState = useCoreGameStore.getState();
    const originalSize = JSON.stringify(originalState).length;
    
    // Transform data structure for optimized store
    const optimizedData = {
      player: originalState.player,
      character: originalState.character,
      skills: originalState.skills,
      world: originalState.world
    };
    
    // Set the optimized store state
    useOptimizedCoreGameStore.setState(optimizedData);
    
    const migrationTime = performance.now() - startTime;
    const newSize = JSON.stringify(useOptimizedCoreGameStore.getState()).length;
    const sizeReduction = ((originalSize - newSize) / originalSize) * 100;
    
    result.migratedStores.push('core');
    result.performanceGains.push({
      storeName: 'core',
      sizeReduction,
      operationSpeedup: 0 // Will be measured during runtime
    });
    
    console.log(`✅ Core Game Store migrated in ${migrationTime.toFixed(2)}ms`);
    console.log(`📊 Size reduction: ${sizeReduction.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Core Game Store migration failed:', error);
    result.errors.push(`Core Game Store: ${error}`);
  }
};

/**
 * Compare performance between original and optimized stores
 */
export const benchmarkStorePerformance = async (): Promise<{
  narrative: { original: number; optimized: number; improvement: number };
  social: { original: number; optimized: number; improvement: number };
  core: { original: number; optimized: number; improvement: number };
}> => {
  console.log('📊 Benchmarking store performance...');
  
  const results = {
    narrative: await benchmarkNarrativeStore(),
    social: await benchmarkSocialStore(),
    core: await benchmarkCoreStore()
  };
  
  console.log('📈 Performance Benchmark Results:', results);
  return results;
};

const benchmarkNarrativeStore = async () => {
  const iterations = 1000;
  
  // Benchmark original store
  const originalStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    useNarrativeStore.getState().evaluateStoryletAvailability('test_storylet');
  }
  const originalTime = performance.now() - originalStart;
  
  // Benchmark optimized store
  const optimizedStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    useOptimizedNarrativeStore.getState().evaluateStoryletAvailability('test_storylet');
  }
  const optimizedTime = performance.now() - optimizedStart;
  
  const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
  
  return {
    original: originalTime,
    optimized: optimizedTime,
    improvement
  };
};

const benchmarkSocialStore = async () => {
  const iterations = 1000;
  
  // Benchmark original store
  const originalStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    useSocialStore.getState().getAllDiscoveredClues();
  }
  const originalTime = performance.now() - originalStart;
  
  // Benchmark optimized store
  const optimizedStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    useOptimizedSocialStore.getState().getAllDiscoveredClues();
  }
  const optimizedTime = performance.now() - optimizedStart;
  
  const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
  
  return {
    original: originalTime,
    optimized: optimizedTime,
    improvement
  };
};

const benchmarkCoreStore = async () => {
  const iterations = 1000;
  
  // Benchmark original store operations
  const originalStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    useCoreGameStore.getState().updatePlayer({ experience: i });
  }
  const originalTime = performance.now() - originalStart;
  
  // Benchmark optimized store operations
  const optimizedStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    useOptimizedCoreGameStore.getState().updatePlayer({ experience: i });
  }
  const optimizedTime = performance.now() - optimizedStart;
  
  const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
  
  return {
    original: originalTime,
    optimized: optimizedTime,
    improvement
  };
};

/**
 * Generate performance report comparing all stores
 */
export const generatePerformanceReport = (): {
  narrative: any;
  social: any;
  core: any;
  overall: any;
} => {
  console.log('📋 Generating performance report...');
  
  const narrativeMetrics = useOptimizedNarrativeStore.getState().getPerformanceMetrics();
  const socialMetrics = useOptimizedSocialStore.getState().getPerformanceMetrics();
  const coreMetrics = useOptimizedCoreGameStore.getState().getPerformanceMetrics();
  
  const overallMetrics = StorePerformanceMonitor.getPerformanceReport();
  
  const report = {
    narrative: narrativeMetrics,
    social: socialMetrics,
    core: coreMetrics,
    overall: overallMetrics
  };
  
  console.log('📊 Performance Report:', report);
  return report;
};

/**
 * Enable/disable optimized stores globally
 */
export const toggleOptimizedStores = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    (window as any).useOptimizedStores = enabled;
    console.log(`${enabled ? '✅' : '❌'} Optimized stores ${enabled ? 'enabled' : 'disabled'}`);
  }
};

/**
 * Check if optimized stores are available and working
 */
export const validateOptimizedStores = (): boolean => {
  try {
    // Test basic operations on all optimized stores
    const narrativeState = useOptimizedNarrativeStore.getState();
    const socialState = useOptimizedSocialStore.getState();
    const coreState = useOptimizedCoreGameStore.getState();
    
    // Verify all stores have performance metadata
    const hasPerformanceData = !!(
      narrativeState._performance &&
      socialState._performance &&
      coreState._performance
    );
    
    if (!hasPerformanceData) {
      console.error('❌ Optimized stores missing performance metadata');
      return false;
    }
    
    console.log('✅ All optimized stores validated successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Optimized store validation failed:', error);
    return false;
  }
};

// Expose utilities globally for development
if (typeof window !== 'undefined') {
  (window as any).optimizedStoreUtils = {
    migrate: migrateToOptimizedStores,
    benchmark: benchmarkStorePerformance,
    report: generatePerformanceReport,
    validate: validateOptimizedStores,
    toggle: toggleOptimizedStores
  };
  
  console.log('🛠️ Optimized store utilities available at window.optimizedStoreUtils');
}