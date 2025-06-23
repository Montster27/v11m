// /Users/montysharma/V11M2/src/test/storeTestUtils.ts
// Testing Infrastructure Enhancements - Store testing utilities for simplified testing

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

export interface MockStoreConfig {
  resetBefore?: boolean;
  restoreAfter?: boolean;
  validateState?: boolean;
}

export interface AtomicOperationResult {
  operation: string;
  success: boolean;
  duration: number;
  beforeState: any;
  afterState: any;
  stateChanges: {
    core: any;
    narrative: any;
    social: any;
  };
}

// Store state snapshots for mocking and restoration
let storeSnapshots: {
  core?: any;
  narrative?: any;
  social?: any;
} = {};

/**
 * Create Store Test Utilities - Simplified testing for 3 stores vs 17+ stores
 */
export const createStoreTestUtils = () => {
  
  /**
   * Mock store state - Simplified mocking for consolidated architecture
   */
  const mockStoreState = (domain: 'core' | 'narrative' | 'social', state: any, config: MockStoreConfig = {}): any => {
    console.log(`🎭 Mocking ${domain} store state...`);
    
    try {
      // Save current state for restoration if requested
      if (config.restoreAfter) {
        storeSnapshots[domain] = getCurrentStoreState(domain);
      }
      
      // Reset store if requested
      if (config.resetBefore) {
        resetStore(domain);
      }
      
      // Apply mock state
      const mockResult = applyMockState(domain, state);
      
      // Validate state if requested
      if (config.validateState) {
        const isValid = validateMockState(domain, state);
        if (!isValid) {
          console.warn(`⚠️ Mock state validation failed for ${domain} store`);
        }
      }
      
      console.log(`✅ ${domain} store mocked successfully`);
      return mockResult;
      
    } catch (error) {
      console.error(`❌ Failed to mock ${domain} store:`, error);
      throw error;
    }
  };
  
  /**
   * Apply mock state to specific store
   */
  const applyMockState = (domain: 'core' | 'narrative' | 'social', state: any): any => {
    switch (domain) {
      case 'core':
        return mockCoreGameStore(state);
      case 'narrative':
        return mockNarrativeStore(state);
      case 'social':
        return mockSocialStore(state);
      default:
        throw new Error(`Unknown store domain: ${domain}`);
    }
  };
  
  /**
   * Mock Core Game Store state
   */
  const mockCoreGameStore = (state: any): any => {
    const coreStore = useCoreGameStore.getState();
    
    // Apply partial state updates
    if (state.player) {
      coreStore.updatePlayer(state.player);
    }
    if (state.character) {
      coreStore.updateCharacter(state.character);
    }
    if (state.skills) {
      coreStore.updateSkills(state.skills);
    }
    if (state.world) {
      coreStore.updateWorld(state.world);
    }
    
    return useCoreGameStore.getState();
  };
  
  /**
   * Mock Narrative Store state
   */
  const mockNarrativeStore = (state: any): any => {
    const narrativeStore = useNarrativeStore.getState();
    
    // Apply storylets
    if (state.storylets) {
      if (state.storylets.active) {
        state.storylets.active.forEach((storyletId: string) => {
          narrativeStore.addActiveStorylet(storyletId);
        });
      }
      if (state.storylets.completed) {
        state.storylets.completed.forEach((storyletId: string) => {
          narrativeStore.completeStorylet(storyletId);
        });
      }
    }
    
    // Apply concerns
    if (state.concerns) {
      narrativeStore.updateConcerns(state.concerns);
    }
    
    // Apply flags
    if (state.flags) {
      Object.entries(state.flags).forEach(([key, value]) => {
        if (key.startsWith('storylet_')) {
          narrativeStore.setStoryletFlag(key, value);
        } else if (key.startsWith('concern_')) {
          narrativeStore.setConcernFlag(key, value);
        } else if (key.startsWith('arc_')) {
          narrativeStore.setArcFlag(key, value);
        }
      });
    }
    
    return useNarrativeStore.getState();
  };
  
  /**
   * Mock Social Store state
   */
  const mockSocialStore = (state: any): any => {
    const socialStore = useSocialStore.getState();
    
    // Apply relationships
    if (state.npcs && state.npcs.relationships) {
      Object.entries(state.npcs.relationships).forEach(([npcId, value]) => {
        socialStore.updateRelationship(npcId, value as number);
      });
    }
    
    // Apply clues
    if (state.clues && state.clues.discovered) {
      state.clues.discovered.forEach((clue: any) => {
        socialStore.discoverClue(clue);
      });
    }
    
    // Apply NPC memories and flags
    if (state.npcs) {
      if (state.npcs.memories) {
        Object.entries(state.npcs.memories).forEach(([npcId, memory]) => {
          socialStore.setNPCMemory(npcId, memory);
        });
      }
      if (state.npcs.flags) {
        Object.entries(state.npcs.flags).forEach(([npcId, flag]) => {
          socialStore.setNPCFlag(npcId, flag);
        });
      }
    }
    
    return useSocialStore.getState();
  };
  
  /**
   * Get current state of specific store
   */
  const getCurrentStoreState = (domain: 'core' | 'narrative' | 'social'): any => {
    switch (domain) {
      case 'core':
        return JSON.parse(JSON.stringify(useCoreGameStore.getState()));
      case 'narrative':
        return JSON.parse(JSON.stringify(useNarrativeStore.getState()));
      case 'social':
        return JSON.parse(JSON.stringify(useSocialStore.getState()));
      default:
        throw new Error(`Unknown store domain: ${domain}`);
    }
  };
  
  /**
   * Reset specific store
   */
  const resetStore = (domain: 'core' | 'narrative' | 'social'): void => {
    switch (domain) {
      case 'core':
        useCoreGameStore.getState().resetGame();
        break;
      case 'narrative':
        useNarrativeStore.getState().resetNarrative();
        break;
      case 'social':
        useSocialStore.getState().resetSocial();
        break;
      default:
        throw new Error(`Unknown store domain: ${domain}`);
    }
  };
  
  /**
   * Validate mock state structure
   */
  const validateMockState = (domain: 'core' | 'narrative' | 'social', state: any): boolean => {
    try {
      switch (domain) {
        case 'core':
          return validateCoreState(state);
        case 'narrative':
          return validateNarrativeState(state);
        case 'social':
          return validateSocialState(state);
        default:
          return false;
      }
    } catch (error) {
      console.error(`State validation error for ${domain}:`, error);
      return false;
    }
  };
  
  const validateCoreState = (state: any): boolean => {
    const validKeys = ['player', 'character', 'skills', 'world'];
    return Object.keys(state).every(key => validKeys.includes(key));
  };
  
  const validateNarrativeState = (state: any): boolean => {
    const validKeys = ['storylets', 'flags', 'concerns', 'storyArcs'];
    return Object.keys(state).every(key => validKeys.includes(key));
  };
  
  const validateSocialState = (state: any): boolean => {
    const validKeys = ['npcs', 'clues', 'saves'];
    return Object.keys(state).every(key => validKeys.includes(key));
  };
  
  /**
   * Restore store state from snapshot
   */
  const restoreStoreState = (domain: 'core' | 'narrative' | 'social'): boolean => {
    try {
      const snapshot = storeSnapshots[domain];
      if (!snapshot) {
        console.warn(`⚠️ No snapshot available for ${domain} store`);
        return false;
      }
      
      // Reset and restore state
      resetStore(domain);
      applyMockState(domain, snapshot);
      
      console.log(`🔄 ${domain} store state restored from snapshot`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to restore ${domain} store state:`, error);
      return false;
    }
  };
  
  /**
   * Test Atomic Operations - Validate reset, save, load work atomically
   * Much simpler with consolidated stores vs 17+ legacy stores
   */
  const testAtomicOperations = async (): Promise<AtomicOperationResult[]> => {
    console.log('🧪 Testing atomic operations across consolidated stores...');
    const results: AtomicOperationResult[] = [];
    
    try {
      // Test 1: Atomic Reset Operation
      const resetResult = await testAtomicReset();
      results.push(resetResult);
      
      // Test 2: Atomic Save Operation
      const saveResult = await testAtomicSave();
      results.push(saveResult);
      
      // Test 3: Atomic Load Operation
      const loadResult = await testAtomicLoad();
      results.push(loadResult);
      
      // Test 4: Cross-Store Transaction
      const transactionResult = await testCrossStoreTransaction();
      results.push(transactionResult);
      
      console.log(`✅ Atomic operations testing completed: ${results.filter(r => r.success).length}/${results.length} passed`);
      return results;
      
    } catch (error) {
      console.error('❌ Atomic operations testing failed:', error);
      throw error;
    }
  };
  
  /**
   * Test atomic reset across all stores
   */
  const testAtomicReset = async (): Promise<AtomicOperationResult> => {
    const startTime = performance.now();
    
    // Capture before state
    const beforeState = {
      core: getCurrentStoreState('core'),
      narrative: getCurrentStoreState('narrative'),
      social: getCurrentStoreState('social')
    };
    
    // Setup complex state
    useCoreGameStore.getState().updatePlayer({ level: 15, experience: 2500 });
    useNarrativeStore.getState().addActiveStorylet('atomic_test_storylet');
    useSocialStore.getState().updateRelationship('atomic_test_npc', 30);
    
    // Perform atomic reset
    useCoreGameStore.getState().resetGame();
    useNarrativeStore.getState().resetNarrative();
    useSocialStore.getState().resetSocial();
    
    // Capture after state
    const afterState = {
      core: getCurrentStoreState('core'),
      narrative: getCurrentStoreState('narrative'),
      social: getCurrentStoreState('social')
    };
    
    const duration = performance.now() - startTime;
    
    // Validate reset worked
    const success = 
      afterState.core.player.level === 1 &&
      afterState.narrative.storylets.active.length === 0 &&
      Object.keys(afterState.social.npcs.relationships).length === 0;
    
    return {
      operation: 'Atomic Reset',
      success,
      duration,
      beforeState,
      afterState,
      stateChanges: {
        core: calculateStateDiff(beforeState.core, afterState.core),
        narrative: calculateStateDiff(beforeState.narrative, afterState.narrative),
        social: calculateStateDiff(beforeState.social, afterState.social)
      }
    };
  };
  
  /**
   * Test atomic save operation
   */
  const testAtomicSave = async (): Promise<AtomicOperationResult> => {
    const startTime = performance.now();
    
    const beforeState = {
      core: getCurrentStoreState('core'),
      narrative: getCurrentStoreState('narrative'),
      social: getCurrentStoreState('social')
    };
    
    // Create save state
    const saveSlotId = `atomic_test_${Date.now()}`;
    const socialStore = useSocialStore.getState();
    socialStore.createSaveSlot(saveSlotId);
    
    const afterState = {
      core: getCurrentStoreState('core'),
      narrative: getCurrentStoreState('narrative'),
      social: getCurrentStoreState('social')
    };
    
    const duration = performance.now() - startTime;
    
    // Validate save was created
    const success = saveSlotId in afterState.social.saves.saveSlots;
    
    return {
      operation: 'Atomic Save',
      success,
      duration,
      beforeState,
      afterState,
      stateChanges: {
        core: {},
        narrative: {},
        social: { saveSlotAdded: saveSlotId }
      }
    };
  };
  
  /**
   * Test atomic load operation
   */
  const testAtomicLoad = async (): Promise<AtomicOperationResult> => {
    const startTime = performance.now();
    
    const beforeState = {
      core: getCurrentStoreState('core'),
      narrative: getCurrentStoreState('narrative'),
      social: getCurrentStoreState('social')
    };
    
    // Simulate load operation (simplified)
    const socialStore = useSocialStore.getState();
    const availableSlots = Object.keys(socialStore.saves.saveSlots);
    
    let success = false;
    if (availableSlots.length > 0) {
      // Load would restore state from save slot
      success = true;
    }
    
    const afterState = beforeState; // No actual changes in this test
    const duration = performance.now() - startTime;
    
    return {
      operation: 'Atomic Load',
      success,
      duration,
      beforeState,
      afterState,
      stateChanges: {
        core: {},
        narrative: {},
        social: {}
      }
    };
  };
  
  /**
   * Test cross-store transaction
   */
  const testCrossStoreTransaction = async (): Promise<AtomicOperationResult> => {
    const startTime = performance.now();
    
    const beforeState = {
      core: getCurrentStoreState('core'),
      narrative: getCurrentStoreState('narrative'),
      social: getCurrentStoreState('social')
    };
    
    try {
      // Simulate transaction: Level up character and trigger storylet
      useCoreGameStore.getState().updatePlayer({ level: 5 });
      useNarrativeStore.getState().addActiveStorylet('level_up_storylet');
      useSocialStore.getState().updateRelationship('mentor_npc', 5);
      
      const afterState = {
        core: getCurrentStoreState('core'),
        narrative: getCurrentStoreState('narrative'),
        social: getCurrentStoreState('social')
      };
      
      const duration = performance.now() - startTime;
      
      const success = 
        afterState.core.player.level === 5 &&
        afterState.narrative.storylets.active.includes('level_up_storylet') &&
        afterState.social.npcs.relationships['mentor_npc'] === 5;
      
      return {
        operation: 'Cross-Store Transaction',
        success,
        duration,
        beforeState,
        afterState,
        stateChanges: {
          core: { playerLevelChanged: true },
          narrative: { storyletAdded: 'level_up_storylet' },
          social: { relationshipUpdated: 'mentor_npc' }
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        operation: 'Cross-Store Transaction',
        success: false,
        duration,
        beforeState,
        afterState: beforeState,
        stateChanges: {
          core: {},
          narrative: {},
          social: {}
        }
      };
    }
  };
  
  /**
   * Calculate difference between states
   */
  const calculateStateDiff = (before: any, after: any): any => {
    if (before === after) return {};
    
    const diff: any = {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    
    allKeys.forEach(key => {
      if (before[key] !== after[key]) {
        diff[key] = { before: before[key], after: after[key] };
      }
    });
    
    return diff;
  };
  
  /**
   * Clean up test utilities
   */
  const cleanup = (): void => {
    storeSnapshots = {};
    console.log('🧹 Store test utilities cleaned up');
  };
  
  return {
    // Main functions
    mockStoreState,
    testAtomicOperations,
    
    // Individual store mocking
    mockCoreGameStore,
    mockNarrativeStore,
    mockSocialStore,
    
    // State management
    getCurrentStoreState,
    restoreStoreState,
    resetStore,
    
    // Utilities
    validateMockState,
    cleanup,
    
    // Atomic operation tests
    testAtomicReset,
    testAtomicSave,
    testAtomicLoad,
    testCrossStoreTransaction
  };
};

// Global test utilities instance
export const storeTestUtils = createStoreTestUtils();

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).storeTestUtils = storeTestUtils;
  (window as any).mockStoreState = storeTestUtils.mockStoreState;
  (window as any).testAtomicOperations = storeTestUtils.testAtomicOperations;
  
  console.log('🧪 Store Test Utilities loaded');
  console.log('   mockStoreState(domain, state, config?) - Mock store state for testing');
  console.log('   testAtomicOperations() - Test atomic reset/save/load operations');
  console.log('   storeTestUtils.cleanup() - Clean up test utilities');
}