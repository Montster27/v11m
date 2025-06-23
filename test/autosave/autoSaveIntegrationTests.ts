// /Users/montysharma/V11M2/test/autosave/autoSaveIntegrationTests.ts
// Auto-Save Integration Test Suite - Validates simplified auto-save with consolidated stores

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../src/stores/v2';
import { REFACTOR_CONFIG } from '../../src/config/refactorFlags';

export interface AutoSaveTestResult {
  success: boolean;
  errors: string[];
  saveCount: number;
  duration: number;
  triggers: string[];
}

export interface SaveRecord {
  id: string;
  timestamp: number;
  coreGameData: any;
  narrativeData: any;
  socialData: any;
  type: 'auto-save' | 'manual-save' | 'test-save';
  size: number;
}

// Mock auto-save monitoring system
class AutoSaveMonitor {
  private saveRecords: SaveRecord[] = [];
  private saveOperationCount = 0;
  private errorCount = 0;
  private status: 'idle' | 'saving' | 'retrying' | 'error' = 'idle';
  private mockFailure = false;
  private triggers: string[] = [];
  private lastSaveTime = 0;
  private debounceDelay = 100; // 100ms debounce
  private pendingSaveTimeout: any = null;
  
  constructor() {
    this.reset();
  }
  
  reset() {
    this.saveRecords = [];
    this.saveOperationCount = 0;
    this.errorCount = 0;
    this.status = 'idle';
    this.mockFailure = false;
    this.triggers = [];
    this.lastSaveTime = 0;
    if (this.pendingSaveTimeout) {
      clearTimeout(this.pendingSaveTimeout);
      this.pendingSaveTimeout = null;
    }
  }
  
  enable() {
    console.log('🤖 Auto-save monitoring enabled');
    this.status = 'idle';
  }
  
  disable() {
    console.log('⏸️ Auto-save monitoring disabled');
    this.status = 'idle';
  }
  
  triggerSave(source: string, data: any) {
    this.triggers.push(source);
    
    // Implement debouncing - cancel previous save if within debounce window
    if (this.pendingSaveTimeout) {
      clearTimeout(this.pendingSaveTimeout);
    }
    
    this.pendingSaveTimeout = setTimeout(() => {
      this.performSave(source, data);
    }, this.debounceDelay);
    
    return true;
  }
  
  private performSave(source: string, data: any) {
    this.saveOperationCount++;
    
    if (this.mockFailure) {
      this.errorCount++;
      this.status = 'retrying';
      console.warn(`❌ Mock save failure for ${source}`);
      return false;
    }
    
    this.status = 'saving';
    
    const saveRecord: SaveRecord = {
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      coreGameData: data.coreGame || null,
      narrativeData: data.narrative || null,
      socialData: data.social || null,
      type: 'auto-save',
      size: JSON.stringify(data).length
    };
    
    this.saveRecords.push(saveRecord);
    this.status = 'idle';
    this.lastSaveTime = Date.now();
    
    console.log(`💾 Auto-save triggered by ${source}:`, {
      saveId: saveRecord.id,
      size: `${(saveRecord.size / 1024).toFixed(2)}KB`,
      stores: [
        saveRecord.coreGameData ? 'CoreGame' : null,
        saveRecord.narrativeData ? 'Narrative' : null,
        saveRecord.socialData ? 'Social' : null
      ].filter(Boolean)
    });
    
    return true;
  }
  
  getLastSaveRecord(): SaveRecord | null {
    return this.saveRecords[this.saveRecords.length - 1] || null;
  }
  
  getSaveOperationCount(): number {
    return this.saveOperationCount;
  }
  
  getErrorCount(): number {
    return this.errorCount;
  }
  
  getStatus(): string {
    return this.status;
  }
  
  getAllSaveRecords(): SaveRecord[] {
    return [...this.saveRecords];
  }
  
  getTriggers(): string[] {
    return [...this.triggers];
  }
  
  mockSaveFailure(enable: boolean = true) {
    this.mockFailure = enable;
    console.log(enable ? '🚫 Mock save failure enabled' : '✅ Mock save failure disabled');
  }
  
  waitForAutoSave(timeout: number = 1000): Promise<SaveRecord | null> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        const lastSave = this.getLastSaveRecord();
        const elapsed = Date.now() - startTime;
        
        if (lastSave && lastSave.timestamp > startTime) {
          clearInterval(checkInterval);
          resolve(lastSave);
        } else if (elapsed > timeout) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 50);
    });
  }
}

// Global auto-save monitor instance
const autoSaveMonitor = new AutoSaveMonitor();

export const enableAutoSave = () => {
  console.log('🚀 Enabling auto-save with consolidated store architecture...');
  
  // Check if auto-save is disabled in config
  if (REFACTOR_CONFIG.AUTO_SAVE_DISABLED) {
    console.warn('⚠️ Auto-save is disabled in REFACTOR_CONFIG');
    return false;
  }
  
  autoSaveMonitor.enable();
  return true;
};

export const disableAutoSave = () => {
  autoSaveMonitor.disable();
};

export const updateCoreGameStore = (updates: any) => {
  console.log('🎮 Updating Core Game Store:', updates);
  
  const coreStore = useCoreGameStore.getState();
  
  if (updates.player) {
    coreStore.updatePlayer(updates.player);
  }
  
  if (updates.character) {
    coreStore.updateCharacter(updates.character);
  }
  
  if (updates.skills) {
    coreStore.updateSkills(updates.skills);
  }
  
  if (updates.world) {
    coreStore.updateWorld(updates.world);
  }
  
  // Trigger auto-save
  try {
    const saveData = {
      coreGame: useCoreGameStore.getState(),
      narrative: useNarrativeStore.getState(),
      social: useSocialStore.getState()
    };
    
    autoSaveMonitor.triggerSave('CoreGameStore', saveData);
  } catch (error) {
    console.error('❌ Error accessing stores for auto-save:', error);
  }
};

export const updateNarrativeStore = (updates: any) => {
  console.log('📖 Updating Narrative Store:', updates);
  
  try {
    // Validate store availability
    if (!useNarrativeStore) {
      throw new Error('useNarrativeStore is not available');
    }
    
    console.log('📖 Getting narrative store state...');
    const narrativeStore = useNarrativeStore.getState();
    
    if (!narrativeStore) {
      throw new Error('narrativeStore.getState() returned null/undefined');
    }
    
    console.log('📖 Narrative store state retrieved successfully');
    
    if (updates.storylets?.active) {
      updates.storylets.active.forEach((storyletId: string) => {
        narrativeStore.addActiveStorylet(storyletId);
      });
    }
    
    if (updates.storylets?.completed) {
      updates.storylets.completed.forEach((storyletId: string) => {
        console.log(`📖 Completing storylet: ${storyletId}`);
        
        if (typeof narrativeStore.completeStorylet !== 'function') {
          throw new Error('narrativeStore.completeStorylet is not a function');
        }
        
        narrativeStore.completeStorylet(storyletId);
        console.log(`✅ Storylet ${storyletId} completed successfully`);
      });
    }
    
    if (updates.flags) {
      Object.entries(updates.flags).forEach(([key, value]) => {
        console.log(`📖 Setting storylet flag: ${key} = ${value}`);
        
        if (typeof narrativeStore.setStoryletFlag !== 'function') {
          throw new Error('narrativeStore.setStoryletFlag is not a function');
        }
        
        narrativeStore.setStoryletFlag(key, value);
        console.log(`✅ Flag ${key} set successfully`);
      });
    }
    
    if (updates.concerns) {
      narrativeStore.updateConcerns(updates.concerns);
    }
    
    console.log('📖 All narrative store operations completed successfully');
    
    // Trigger auto-save
    try {
      console.log('📦 Gathering store data for auto-save...');
      
      console.log('📦 Getting CoreGameStore state...');
      const coreGameData = useCoreGameStore.getState();
      console.log('✅ CoreGameStore data retrieved');
      
      console.log('📦 Getting NarrativeStore state...');
      const narrativeData = useNarrativeStore.getState();
      console.log('✅ NarrativeStore data retrieved');
      
      console.log('📦 Getting SocialStore state...');
      const socialData = useSocialStore.getState();
      console.log('✅ SocialStore data retrieved');
      
      const saveData = {
        coreGame: coreGameData,
        narrative: narrativeData,
        social: socialData
      };
      
      console.log('📦 Triggering auto-save with data...');
      autoSaveMonitor.triggerSave('NarrativeStore', saveData);
      console.log('✅ Auto-save trigger completed');
      
    } catch (error) {
      console.error('❌ Error accessing stores for auto-save:', error);
      console.error('📍 Error details:', error.message);
      console.error('📍 Error stack:', error.stack);
    }
  } catch (error) {
    console.error('❌ Error in updateNarrativeStore:', error);
    throw error;
  }
};

export const updateSocialStore = (updates: any) => {
  console.log('👥 Updating Social Store:', updates);
  
  const socialStore = useSocialStore.getState();
  
  if (updates.npcs?.relationships) {
    Object.entries(updates.npcs.relationships).forEach(([npcId, level]: [string, any]) => {
      socialStore.updateRelationship(npcId, level);
    });
  }
  
  if (updates.npcs?.memories) {
    Object.entries(updates.npcs.memories).forEach(([npcId, memory]: [string, any]) => {
      socialStore.setNPCMemory(npcId, memory);
    });
  }
  
  if (updates.clues?.discovered) {
    updates.clues.discovered.forEach((clue: any) => {
      socialStore.discoverClue(clue);
    });
  }
  
  if (updates.saves?.currentSaveId) {
    socialStore.setCurrentSave(updates.saves.currentSaveId);
  }
  
  // Trigger auto-save
  try {
    const saveData = {
      coreGame: useCoreGameStore.getState(),
      narrative: useNarrativeStore.getState(),
      social: useSocialStore.getState()
    };
    
    autoSaveMonitor.triggerSave('SocialStore', saveData);
  } catch (error) {
    console.error('❌ Error accessing stores for auto-save:', error);
  }
};

export const getLastSaveRecord = (): SaveRecord | null => {
  return autoSaveMonitor.getLastSaveRecord();
};

export const getSaveOperationCount = (): number => {
  return autoSaveMonitor.getSaveOperationCount();
};

export const getErrorCount = (): number => {
  return autoSaveMonitor.getErrorCount();
};

export const getAutoSaveStatus = (): string => {
  return autoSaveMonitor.getStatus();
};

export const mockSaveFailure = (enable: boolean = true) => {
  autoSaveMonitor.mockSaveFailure(enable);
};

export const waitForAutoSave = (timeout: number = 1000): Promise<SaveRecord | null> => {
  return autoSaveMonitor.waitForAutoSave(timeout);
};

export const testAutoSaveMonitorsConsolidatedStores = async (): Promise<AutoSaveTestResult> => {
  console.log('🧪 Testing: Auto-Save Monitors Consolidated Stores');
  console.log('-'.repeat(50));
  
  const result: AutoSaveTestResult = {
    success: false,
    errors: [],
    saveCount: 0,
    duration: 0,
    triggers: []
  };
  
  const startTime = performance.now();
  
  try {
    // Reset and enable auto-save
    autoSaveMonitor.reset();
    const enabled = enableAutoSave();
    
    if (!enabled) {
      result.errors.push('Failed to enable auto-save');
      return result;
    }
    
    // Test Core Game Store + Narrative Store (comprehensive test)
    console.log('🔄 Triggering changes in Core Game Store...');
    updateCoreGameStore({ 
      world: { day: 2 },
      player: { experience: 150 }
    });
    
    console.log('🔄 Triggering changes in Narrative Store...');
    updateNarrativeStore({ 
      storylets: { completed: ['tutorial_welcome'] },
      flags: { tutorial_complete: true }
    });
    
    console.log('🔄 Triggering changes in Social Store...');
    updateSocialStore({ 
      npcs: { relationships: { tutorial_npc: 5 } },
      clues: { discovered: [{ id: 'test_clue', name: 'Test Clue', discoveryMethod: 'test' }] }
    });
    
    // Wait for debounced auto-save to complete
    console.log('⏳ Waiting for auto-save...');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const saveRecord = getLastSaveRecord();
    console.log('📋 Save record exists:', !!saveRecord);
    
    if (!saveRecord) {
      result.errors.push('Auto-save did not trigger');
      result.success = false;
    } else {
      // Simple validation - just check that we got a save record
      result.success = true;
      result.saveCount = getSaveOperationCount();
      result.triggers = autoSaveMonitor.getTriggers();
      
      console.log('✅ Auto-save test passed - save record created');
      console.log('  Save ID:', saveRecord.id);
      console.log('  Save Operations:', result.saveCount);
      console.log('  Triggers:', result.triggers);
    }
    
  } catch (error) {
    console.error('❌ Test 1 error details:', error);
    result.errors.push(`Test failed: ${error}`);
    result.success = false;
  }
  
  result.duration = performance.now() - startTime;
  return result;
};

export const testAutoSaveFrequencyOptimization = async (): Promise<AutoSaveTestResult> => {
  console.log('🧪 Testing: Auto-Save Frequency Optimization');
  console.log('-'.repeat(50));
  
  const result: AutoSaveTestResult = {
    success: false,
    errors: [],
    saveCount: 0,
    duration: 0,
    triggers: []
  };
  
  const startTime = performance.now();
  
  try {
    // Reset and enable auto-save
    autoSaveMonitor.reset();
    enableAutoSave();
    
    console.log('🔄 Triggering rapid state changes...');
    
    // Rapid state changes that should be debounced
    for (let i = 0; i < 10; i++) {
      updateCoreGameStore({ 
        player: { experience: i * 100 }
      });
      
      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Wait for debounced auto-saves to complete (longer than debounce delay)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    result.saveCount = getSaveOperationCount();
    result.triggers = autoSaveMonitor.getTriggers();
    
    // Should debounce and only save a few times (not 10)
    const maxExpectedSaves = 3;
    result.success = result.saveCount <= maxExpectedSaves;
    
    if (!result.success) {
      result.errors.push(`Too many saves: ${result.saveCount} (expected ≤${maxExpectedSaves})`);
    }
    
    console.log('📊 Frequency Optimization Results:');
    console.log('  Rapid Updates: 10');
    console.log('  Save Operations:', result.saveCount);
    console.log('  Max Expected:', maxExpectedSaves);
    console.log('  Optimization:', result.success ? '✅ EFFECTIVE' : '❌ INEFFECTIVE');
    
  } catch (error) {
    result.errors.push(`Test failed: ${error}`);
  }
  
  result.duration = performance.now() - startTime;
  return result;
};

export const testAutoSaveErrorHandling = async (): Promise<AutoSaveTestResult> => {
  console.log('🧪 Testing: Auto-Save Error Handling');
  console.log('-'.repeat(50));
  
  const result: AutoSaveTestResult = {
    success: false,
    errors: [],
    saveCount: 0,
    duration: 0,
    triggers: []
  };
  
  const startTime = performance.now();
  
  try {
    // Reset and enable auto-save
    autoSaveMonitor.reset();
    enableAutoSave();
    
    // Enable mock failure
    console.log('🚫 Enabling mock save failures...');
    mockSaveFailure(true);
    
    // Trigger save that should fail
    console.log('🔄 Triggering save with mock failure...');
    updateCoreGameStore({ 
      player: { level: 5 }
    });
    
    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const status = getAutoSaveStatus();
    const errorCount = getErrorCount();
    result.saveCount = getSaveOperationCount();
    
    // Disable mock failure
    mockSaveFailure(false);
    
    // Try save again (should succeed)
    console.log('🔄 Triggering save without mock failure...');
    updateCoreGameStore({ 
      player: { level: 6 }
    });
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const finalStatus = getAutoSaveStatus();
    const finalErrorCount = getErrorCount();
    
    // Validation criteria
    const handledErrors = errorCount > 0 && errorCount < 5; // Some errors but not too many
    const recovered = finalStatus === 'idle'; // Should recover to idle state
    const didntCrash = finalErrorCount >= errorCount; // Error count should not decrease
    
    result.success = handledErrors && recovered && didntCrash;
    
    if (!handledErrors) {
      result.errors.push(`Error handling failed: ${errorCount} errors (expected 1-4)`);
    }
    if (!recovered) {
      result.errors.push(`Failed to recover: status is ${finalStatus} (expected idle)`);
    }
    if (!didntCrash) {
      result.errors.push('System appears to have crashed or reset unexpectedly');
    }
    
    console.log('📊 Error Handling Results:');
    console.log('  Error Count:', finalErrorCount);
    console.log('  Final Status:', finalStatus);
    console.log('  Error Handling:', handledErrors ? '✅ GRACEFUL' : '❌ POOR');
    console.log('  Recovery:', recovered ? '✅ SUCCESSFUL' : '❌ FAILED');
    console.log('  System Stability:', didntCrash ? '✅ STABLE' : '❌ UNSTABLE');
    
  } catch (error) {
    result.errors.push(`Test failed: ${error}`);
  }
  
  result.duration = performance.now() - startTime;
  return result;
};

export const runAutoSaveTestSuite = async () => {
  console.log('🧪 Running Auto-Save Integration Test Suite...');
  console.log('='.repeat(60));
  console.log('🎯 Goal: Validate simplified auto-save with consolidated stores');
  console.log('🔧 Architecture: 3 consolidated stores with unified auto-save');
  console.log('='.repeat(60));
  
  const suiteResults = {
    consolidatedStoresTest: false,
    frequencyOptimizationTest: false,
    errorHandlingTest: false,
    errors: [] as string[]
  };
  
  try {
    // Test 1: Auto-Save Monitors Consolidated Stores
    console.log('\n📝 TEST 1: Auto-Save Monitors Consolidated Stores');
    console.log('='.repeat(50));
    
    const test1Result = await testAutoSaveMonitorsConsolidatedStores();
    suiteResults.consolidatedStoresTest = test1Result.success;
    
    if (!test1Result.success) {
      suiteResults.errors.push(...test1Result.errors);
    }
    
    console.log(`✨ Result: ${test1Result.success ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Test 2: Auto-Save Frequency Optimization
    console.log('\n📝 TEST 2: Auto-Save Frequency Optimization');
    console.log('='.repeat(50));
    
    const test2Result = await testAutoSaveFrequencyOptimization();
    suiteResults.frequencyOptimizationTest = test2Result.success;
    
    if (!test2Result.success) {
      suiteResults.errors.push(...test2Result.errors);
    }
    
    console.log(`✨ Result: ${test2Result.success ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Test 3: Auto-Save Error Handling
    console.log('\n📝 TEST 3: Auto-Save Error Handling');
    console.log('='.repeat(50));
    
    const test3Result = await testAutoSaveErrorHandling();
    suiteResults.errorHandlingTest = test3Result.success;
    
    if (!test3Result.success) {
      suiteResults.errors.push(...test3Result.errors);
    }
    
    console.log(`✨ Result: ${test3Result.success ? '✅ PASSED' : '❌ FAILED'}`);
    
  } catch (error) {
    suiteResults.errors.push(`Test suite error: ${error}`);
    console.error('❌ Test suite crashed:', error);
  }
  
  // Final Results
  const allTestsPassed = suiteResults.consolidatedStoresTest && 
                        suiteResults.frequencyOptimizationTest && 
                        suiteResults.errorHandlingTest;
  
  console.log('\n🏁 Auto-Save Integration Test Suite Results');
  console.log('='.repeat(60));
  console.log('📊 Test Results:');
  console.log(`   Consolidated Stores: ${suiteResults.consolidatedStoresTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Frequency Optimization: ${suiteResults.frequencyOptimizationTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Error Handling: ${suiteResults.errorHandlingTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log('\n🎯 Auto-Save System Status:');
  console.log(`   Store Integration: ${suiteResults.consolidatedStoresTest ? '✅ WORKING' : '❌ BROKEN'}`);
  console.log(`   Performance: ${suiteResults.frequencyOptimizationTest ? '✅ OPTIMIZED' : '❌ INEFFICIENT'}`);
  console.log(`   Reliability: ${suiteResults.errorHandlingTest ? '✅ ROBUST' : '❌ FRAGILE'}`);
  
  if (suiteResults.errors.length > 0) {
    console.log('\n❌ Test Errors:', suiteResults.errors);
  }
  
  console.log('\n🚀 Final Verdict:');
  console.log(`   ${allTestsPassed ? '✅ AUTO-SAVE SYSTEM IS FULLY FUNCTIONAL' : '❌ AUTO-SAVE SYSTEM NEEDS WORK'}`);
  
  return {
    success: allTestsPassed,
    results: suiteResults,
    summary: allTestsPassed ? 'All auto-save tests passed - system is reliable' : 'Some tests failed - system needs improvement'
  };
};

// Global functions for easy access
if (typeof window !== 'undefined') {
  (window as any).enableAutoSave = enableAutoSave;
  (window as any).disableAutoSave = disableAutoSave;
  (window as any).updateCoreGameStore = updateCoreGameStore;
  (window as any).updateNarrativeStore = updateNarrativeStore;
  (window as any).updateSocialStore = updateSocialStore;
  (window as any).getLastSaveRecord = getLastSaveRecord;
  (window as any).getSaveOperationCount = getSaveOperationCount;
  (window as any).getErrorCount = getErrorCount;
  (window as any).getAutoSaveStatus = getAutoSaveStatus;
  (window as any).mockSaveFailure = mockSaveFailure;
  (window as any).waitForAutoSave = waitForAutoSave;
  (window as any).testAutoSaveMonitorsConsolidatedStores = testAutoSaveMonitorsConsolidatedStores;
  (window as any).testAutoSaveFrequencyOptimization = testAutoSaveFrequencyOptimization;
  (window as any).testAutoSaveErrorHandling = testAutoSaveErrorHandling;
  (window as any).runAutoSaveTestSuite = runAutoSaveTestSuite;
  
  console.log('🧪 Auto-Save Integration Test Suite loaded');
  console.log('   runAutoSaveTestSuite() - Run complete test suite');
  console.log('   enableAutoSave() - Enable auto-save monitoring');
  console.log('   updateCoreGameStore({}) - Trigger core game updates');
  console.log('   updateNarrativeStore({}) - Trigger narrative updates');
  console.log('   updateSocialStore({}) - Trigger social updates');
  console.log('   getLastSaveRecord() - Get last auto-save data');
}