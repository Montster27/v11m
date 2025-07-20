// /Users/montysharma/V11M2/src/store/middleware/optimisticUpdates.ts
// Advanced State Management Features - Optimistic updates and batch operations

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';

export interface OptimisticUpdate {
  id: string;
  timestamp: number;
  store: 'core' | 'narrative' | 'social';
  operation: string;
  optimisticState: any;
  originalState: any;
  persistent: boolean;
  rollbackTimeout?: NodeJS.Timeout;
}

export interface BatchOperation {
  id: string;
  operations: Array<{
    store: 'core' | 'narrative' | 'social';
    method: string;
    args: any[];
  }>;
  atomic: boolean;
  rollbackOnFailure: boolean;
}

// Global optimistic update tracking
let activeOptimisticUpdates: Map<string, OptimisticUpdate> = new Map();
let updateCounter = 0;

// Optimistic Updates Middleware
export const createOptimisticMiddleware = () => {
  
  const generateUpdateId = (): string => {
    return `opt_${Date.now()}_${++updateCounter}`;
  };
  
  const captureStoreState = (store: 'core' | 'narrative' | 'social'): any => {
    switch (store) {
      case 'core':
        return JSON.parse(JSON.stringify(useCoreGameStore.getState()));
      case 'narrative':
        return JSON.parse(JSON.stringify(useNarrativeStore.getState()));
      case 'social':
        return JSON.parse(JSON.stringify(useSocialStore.getState()));
      default:
        throw new Error(`Unknown store: ${store}`);
    }
  };
  
  const applyStateToStore = (store: 'core' | 'narrative' | 'social', state: any): void => {
    switch (store) {
      case 'core':
        useCoreGameStore.setState(state);
        break;
      case 'narrative':
        useNarrativeStore.setState(state);
        break;
      case 'social':
        useSocialStore.setState(state);
        break;
      default:
        throw new Error(`Unknown store: ${store}`);
    }
  };
  
  /**
   * Optimistic Character Update - Update UI immediately, persist asynchronously
   * Clean stores make rollback simpler
   */
  const optimisticCharacterUpdate = (changes: Partial<any>, options: {
    persistAfter?: number;
    rollbackAfter?: number;
    skipPersistence?: boolean;
  } = {}): string => {
    console.log('🚀 Applying optimistic character update:', changes);
    
    const updateId = generateUpdateId();
    const originalState = captureStoreState('core');
    
    // Apply optimistic update immediately
    const coreStore = useCoreGameStore.getState();
    coreStore.updateCharacter(changes);
    const optimisticState = captureStoreState('core');
    
    // Track the optimistic update
    const update: OptimisticUpdate = {
      id: updateId,
      timestamp: Date.now(),
      store: 'core',
      operation: 'updateCharacter',
      optimisticState,
      originalState,
      persistent: false
    };
    
    // Set up automatic rollback if specified
    if (options.rollbackAfter) {
      update.rollbackTimeout = setTimeout(() => {
        console.log(`⏪ Rolling back optimistic update ${updateId} after timeout`);
        rollbackOptimisticUpdate(updateId);
      }, options.rollbackAfter);
    }
    
    activeOptimisticUpdates.set(updateId, update);
    
    // Set up automatic persistence if specified
    if (!options.skipPersistence && options.persistAfter) {
      setTimeout(() => {
        console.log(`💾 Confirming optimistic update ${updateId} after delay`);
        confirmOptimisticUpdate(updateId);
      }, options.persistAfter);
    }
    
    console.log(`✨ Optimistic update ${updateId} applied to character`);
    return updateId;
  };
  
  /**
   * Optimistic Storylet Update - Update storylet state optimistically
   */
  const optimisticStoryletUpdate = (storyletId: string, operation: 'complete' | 'activate' | 'deactivate', options: {
    persistAfter?: number;
    rollbackAfter?: number;
  } = {}): string => {
    console.log(`🚀 Applying optimistic storylet ${operation}:`, storyletId);
    
    const updateId = generateUpdateId();
    const originalState = captureStoreState('narrative');
    
    // Apply optimistic update immediately
    const narrativeStore = useNarrativeStore.getState();
    switch (operation) {
      case 'complete':
        narrativeStore.completeStorylet(storyletId);
        break;
      case 'activate':
        narrativeStore.addActiveStorylet(storyletId);
        break;
      case 'deactivate':
        narrativeStore.removeActiveStorylet(storyletId);
        break;
    }
    
    const optimisticState = captureStoreState('narrative');
    
    // Track the optimistic update
    const update: OptimisticUpdate = {
      id: updateId,
      timestamp: Date.now(),
      store: 'narrative',
      operation: `storylet_${operation}`,
      optimisticState,
      originalState,
      persistent: false
    };
    
    // Set up automatic rollback if specified
    if (options.rollbackAfter) {
      update.rollbackTimeout = setTimeout(() => {
        console.log(`⏪ Rolling back optimistic storylet update ${updateId}`);
        rollbackOptimisticUpdate(updateId);
      }, options.rollbackAfter);
    }
    
    activeOptimisticUpdates.set(updateId, update);
    
    // Set up automatic persistence if specified
    if (options.persistAfter) {
      setTimeout(() => {
        console.log(`💾 Confirming optimistic storylet update ${updateId}`);
        confirmOptimisticUpdate(updateId);
      }, options.persistAfter);
    }
    
    console.log(`✨ Optimistic ${operation} ${updateId} applied to storylet ${storyletId}`);
    return updateId;
  };
  
  /**
   * Optimistic Social Update - Update relationships/clues optimistically
   */
  const optimisticSocialUpdate = (updateType: 'relationship' | 'clue', data: any, options: {
    persistAfter?: number;
    rollbackAfter?: number;
  } = {}): string => {
    console.log(`🚀 Applying optimistic social ${updateType} update:`, data);
    
    const updateId = generateUpdateId();
    const originalState = captureStoreState('social');
    
    // Apply optimistic update immediately
    const socialStore = useSocialStore.getState();
    if (updateType === 'relationship' && data.npcId !== undefined && data.change !== undefined) {
      socialStore.updateRelationship(data.npcId, data.change);
    } else if (updateType === 'clue' && data.clue) {
      socialStore.discoverClue(data.clue);
    }
    
    const optimisticState = captureStoreState('social');
    
    // Track the optimistic update
    const update: OptimisticUpdate = {
      id: updateId,
      timestamp: Date.now(),
      store: 'social',
      operation: `social_${updateType}`,
      optimisticState,
      originalState,
      persistent: false
    };
    
    // Set up automatic rollback if specified
    if (options.rollbackAfter) {
      update.rollbackTimeout = setTimeout(() => {
        console.log(`⏪ Rolling back optimistic social update ${updateId}`);
        rollbackOptimisticUpdate(updateId);
      }, options.rollbackAfter);
    }
    
    activeOptimisticUpdates.set(updateId, update);
    
    // Set up automatic persistence if specified
    if (options.persistAfter) {
      setTimeout(() => {
        console.log(`💾 Confirming optimistic social update ${updateId}`);
        confirmOptimisticUpdate(updateId);
      }, options.persistAfter);
    }
    
    console.log(`✨ Optimistic social ${updateType} ${updateId} applied`);
    return updateId;
  };
  
  /**
   * Confirm an optimistic update (make it permanent)
   */
  const confirmOptimisticUpdate = (updateId: string): boolean => {
    const update = activeOptimisticUpdates.get(updateId);
    if (!update) {
      console.warn(`⚠️ Cannot confirm unknown optimistic update: ${updateId}`);
      return false;
    }
    
    // Clear rollback timeout if it exists
    if (update.rollbackTimeout) {
      clearTimeout(update.rollbackTimeout);
    }
    
    // Mark as persistent
    update.persistent = true;
    activeOptimisticUpdates.set(updateId, update);
    
    console.log(`✅ Optimistic update ${updateId} confirmed and made persistent`);
    return true;
  };
  
  /**
   * Rollback an optimistic update
   */
  const rollbackOptimisticUpdate = (updateId: string): boolean => {
    const update = activeOptimisticUpdates.get(updateId);
    if (!update) {
      console.warn(`⚠️ Cannot rollback unknown optimistic update: ${updateId}`);
      return false;
    }
    
    // Clear rollback timeout if it exists
    if (update.rollbackTimeout) {
      clearTimeout(update.rollbackTimeout);
    }
    
    // Restore original state
    try {
      applyStateToStore(update.store, update.originalState);
      console.log(`⏪ Optimistic update ${updateId} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Failed to rollback optimistic update ${updateId}:`, error);
      return false;
    }
    
    // Remove from tracking
    activeOptimisticUpdates.delete(updateId);
    return true;
  };
  
  /**
   * Rollback all non-persistent optimistic updates
   */
  const rollbackAllOptimisticUpdates = (): number => {
    console.log('⏪ Rolling back all non-persistent optimistic updates...');
    
    let rolledBackCount = 0;
    for (const [updateId, update] of activeOptimisticUpdates.entries()) {
      if (!update.persistent) {
        if (rollbackOptimisticUpdate(updateId)) {
          rolledBackCount++;
        }
      }
    }
    
    console.log(`⏪ Rolled back ${rolledBackCount} optimistic updates`);
    return rolledBackCount;
  };
  
  /**
   * Batch State Updates - Batch multiple store updates for performance
   * Possible due to reduced store complexity
   */
  const batchStateUpdates = (operations: BatchOperation): Promise<boolean> => {
    console.log(`🔄 Executing batch operation ${operations.id} with ${operations.operations.length} operations`);
    
    return new Promise((resolve) => {
      const originalStates: Record<string, any> = {};
      const executedOperations: Array<{ store: string; success: boolean; error?: any }> = [];
      
      try {
        // Capture original states for potential rollback
        const affectedStores = new Set(operations.operations.map(op => op.store));
        for (const store of affectedStores) {
          originalStates[store] = captureStoreState(store);
        }
        
        // Execute operations in sequence
        for (const operation of operations.operations) {
          try {
            console.log(`🔧 Executing ${operation.store}.${operation.method}(${JSON.stringify(operation.args)})`);
            
            const store = operation.store === 'core' ? useCoreGameStore.getState() :
                         operation.store === 'narrative' ? useNarrativeStore.getState() :
                         operation.store === 'social' ? useSocialStore.getState() : null;
            
            if (!store) {
              throw new Error(`Unknown store: ${operation.store}`);
            }
            
            // Execute the method with arguments
            const method = (store as any)[operation.method];
            if (typeof method !== 'function') {
              throw new Error(`Method ${operation.method} not found on ${operation.store} store`);
            }
            
            method.apply(store, operation.args);
            executedOperations.push({ store: operation.store, success: true });
            
          } catch (error) {
            console.error(`❌ Batch operation failed on ${operation.store}.${operation.method}:`, error);
            executedOperations.push({ store: operation.store, success: false, error });
            
            // If atomic and rollback on failure, restore all states
            if (operations.atomic && operations.rollbackOnFailure) {
              console.log('⏪ Atomic batch operation failed - rolling back all changes...');
              
              for (const [storeKey, originalState] of Object.entries(originalStates)) {
                try {
                  applyStateToStore(storeKey as any, originalState);
                } catch (rollbackError) {
                  console.error(`❌ Failed to rollback ${storeKey} during batch operation failure:`, rollbackError);
                }
              }
              
              resolve(false);
              return;
            }
          }
        }
        
        // All operations completed successfully (or non-atomic mode)
        const allSuccessful = executedOperations.every(op => op.success);
        console.log(`${allSuccessful ? '✅' : '⚠️'} Batch operation ${operations.id} completed. Success rate: ${executedOperations.filter(op => op.success).length}/${executedOperations.length}`);
        
        resolve(allSuccessful);
        
      } catch (error) {
        console.error(`❌ Batch operation ${operations.id} failed catastrophically:`, error);
        
        // Attempt rollback if specified
        if (operations.rollbackOnFailure) {
          for (const [storeKey, originalState] of Object.entries(originalStates)) {
            try {
              applyStateToStore(storeKey as any, originalState);
            } catch (rollbackError) {
              console.error(`❌ Failed to rollback ${storeKey}:`, rollbackError);
            }
          }
        }
        
        resolve(false);
      }
    });
  };
  
  /**
   * Get active optimistic updates summary
   */
  const getOptimisticUpdatesSummary = () => {
    const updates = Array.from(activeOptimisticUpdates.values());
    return {
      total: updates.length,
      persistent: updates.filter(u => u.persistent).length,
      pending: updates.filter(u => !u.persistent).length,
      byStore: {
        core: updates.filter(u => u.store === 'core').length,
        narrative: updates.filter(u => u.store === 'narrative').length,
        social: updates.filter(u => u.store === 'social').length
      },
      oldest: updates.length > 0 ? Math.min(...updates.map(u => u.timestamp)) : null
    };
  };
  
  return {
    // Optimistic update methods
    optimisticCharacterUpdate,
    optimisticStoryletUpdate,
    optimisticSocialUpdate,
    confirmOptimisticUpdate,
    rollbackOptimisticUpdate,
    rollbackAllOptimisticUpdates,
    
    // Batch operation methods
    batchStateUpdates,
    
    // Utility methods
    getOptimisticUpdatesSummary,
    getActiveUpdates: () => Array.from(activeOptimisticUpdates.values()),
    clearAllOptimisticUpdates: () => {
      // Clear all timeouts
      for (const update of activeOptimisticUpdates.values()) {
        if (update.rollbackTimeout) {
          clearTimeout(update.rollbackTimeout);
        }
      }
      activeOptimisticUpdates.clear();
      console.log('🧹 All optimistic updates cleared');
    }
  };
};

// Global middleware instance
export const optimisticMiddleware = createOptimisticMiddleware();

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).optimisticMiddleware = optimisticMiddleware;
  (window as any).optimisticCharacterUpdate = optimisticMiddleware.optimisticCharacterUpdate;
  (window as any).optimisticStoryletUpdate = optimisticMiddleware.optimisticStoryletUpdate;
  (window as any).optimisticSocialUpdate = optimisticMiddleware.optimisticSocialUpdate;
  (window as any).batchStateUpdates = optimisticMiddleware.batchStateUpdates;
  (window as any).getOptimisticUpdatesSummary = optimisticMiddleware.getOptimisticUpdatesSummary;
  
  console.log('🚀 Optimistic Updates Middleware loaded');
  console.log('   optimisticCharacterUpdate(changes, options) - Optimistic character updates');
  console.log('   optimisticStoryletUpdate(storyletId, operation, options) - Optimistic storylet updates');
  console.log('   optimisticSocialUpdate(type, data, options) - Optimistic social updates');
  console.log('   batchStateUpdates(batchOperation) - Execute multiple store updates atomically');
  console.log('   getOptimisticUpdatesSummary() - View active optimistic updates');
}