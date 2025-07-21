// /Users/montysharma/v11m2/src/stores/middleware/unifiedPersistenceMiddleware.ts
// Zustand middleware to integrate stores with UnifiedPersistenceService
// Replaces individual store persistence with centralized management

import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { UnifiedPersistenceService } from '../../services/UnifiedPersistenceService';
import { StorageFactory } from '../../services/storage/StorageFactory';

interface PersistenceState {
  _persistenceService?: UnifiedPersistenceService;
  _storeName: string;
  _isDirty: boolean;
  _lastSaveTime: number;
  _markDirty: () => void;
  _markClean: () => void;
  _createBackup: (label?: string) => Promise<boolean>;
  _autoSave: () => Promise<boolean>;
}

type UnifiedPersistenceOptions = {
  storeName: string;
  autoSaveEnabled?: boolean;
  autoSaveIntervalMs?: number;
  maxBackups?: number;
  enablePreActionBackups?: boolean;
};

type UnifiedPersistence = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs, T & PersistenceState>,
  options: UnifiedPersistenceOptions
) => StateCreator<T, Mps, Mcs, T & PersistenceState>;

// Global service instance (shared across all stores)
let globalPersistenceService: UnifiedPersistenceService | null = null;

async function getOrCreatePersistenceService(): Promise<UnifiedPersistenceService> {
  if (!globalPersistenceService) {
    const adapter = await StorageFactory.createAdapter({
      type: 'auto',
      enableChunking: true,
      chunkingOptions: {
        chunkSizeBytes: 1024 * 1024, // 1MB chunks
        maxChunks: 500
      }
    });

    globalPersistenceService = new UnifiedPersistenceService(adapter, {
      enabled: true,
      intervalMs: 30000, // 30 seconds
      debounceMs: 2000,  // 2 seconds
      maxBackups: 10
    });

    await globalPersistenceService.initialize();
    console.log('🔄 UnifiedPersistenceService initialized for stores');
  }

  return globalPersistenceService;
}

/**
 * Zustand middleware that integrates stores with UnifiedPersistenceService
 * 
 * Features:
 * - Automatic backup creation when store state changes
 * - Centralized persistence management across all stores
 * - Pre-action backups for destructive operations
 * - Auto-save with debouncing
 * - Store-specific backup labeling
 * 
 * Usage:
 * ```typescript
 * export const useMyStore = create<MyState>()(
 *   unifiedPersistence(
 *     (set, get) => ({
 *       // Your store implementation
 *       items: [],
 *       addItem: (item) => {
 *         get()._createBackup('Before adding item'); // Pre-action backup
 *         set((state) => ({ items: [...state.items, item] }));
 *         get()._markDirty(); // Trigger auto-save
 *       }
 *     }),
 *     {
 *       storeName: 'my-store',
 *       autoSaveEnabled: true,
 *       maxBackups: 5
 *     }
 *   )
 * );
 * ```
 */
export const unifiedPersistence: UnifiedPersistence = (f, options) => (set, get, api) => {
  const {
    storeName,
    autoSaveEnabled = true,
    autoSaveIntervalMs = 30000,
    maxBackups = 10,
    enablePreActionBackups = true
  } = options;

  // Initialize persistence service
  let persistenceService: UnifiedPersistenceService | null = null;

  const initializePersistence = async () => {
    try {
      persistenceService = await getOrCreatePersistenceService();
      console.log(`📦 Store "${storeName}" connected to UnifiedPersistenceService`);
    } catch (error) {
      console.error(`❌ Failed to initialize persistence for store "${storeName}":`, error);
    }
  };

  // Initialize async
  initializePersistence();

  const persistenceState: PersistenceState = {
    _persistenceService: undefined, // Will be set after initialization
    _storeName: storeName,
    _isDirty: false,
    _lastSaveTime: Date.now(),

    _markDirty: () => {
      const state = get();
      if (!state._isDirty) {
        set({ _isDirty: true } as Partial<typeof state>);
        
        // Trigger auto-save if enabled
        if (autoSaveEnabled && persistenceService) {
          persistenceService.markDirty();
        }
      }
    },

    _markClean: () => {
      const state = get();
      if (state._isDirty) {
        set({ 
          _isDirty: false, 
          _lastSaveTime: Date.now() 
        } as Partial<typeof state>);
        
        if (persistenceService) {
          persistenceService.markClean();
        }
      }
    },

    _createBackup: async (label?: string) => {
      if (!persistenceService) {
        console.warn(`⚠️ Persistence service not ready for store "${storeName}"`);
        return false;
      }

      try {
        const backupLabel = label || `${storeName} backup`;
        const result = await persistenceService.createBackup('manual', backupLabel);
        
        if (result.success) {
          console.log(`✅ Backup created for ${storeName}: ${backupLabel}`);
          get()._markClean();
          return true;
        } else {
          console.error(`❌ Backup failed for ${storeName}:`, result.error);
          return false;
        }
      } catch (error) {
        console.error(`❌ Backup error for ${storeName}:`, error);
        return false;
      }
    },

    _autoSave: async () => {
      if (!persistenceService) {
        return false;
      }

      const state = get();
      if (!state._isDirty) {
        return false;
      }

      try {
        const result = await persistenceService.autoSave();
        if (result) {
          state._markClean();
        }
        return result;
      } catch (error) {
        console.error(`❌ Auto-save error for ${storeName}:`, error);
        return false;
      }
    }
  };

  // Create the store state with persistence methods
  const storeState = f(
    (partial, replace) => {
      // Intercept set calls to mark dirty
      const newState = typeof partial === 'function' ? partial(get()) : partial;
      set(newState, replace);
      
      // Mark dirty after any state change (unless it's a persistence method call)
      const isInternalUpdate = newState && typeof newState === 'object' && 
        ('_isDirty' in newState || '_lastSaveTime' in newState || '_persistenceService' in newState);
      
      if (!isInternalUpdate) {
        // Use a timeout to avoid calling _markDirty during store initialization
        setTimeout(() => {
          const state = get();
          if (state._markDirty) {
            state._markDirty();
          }
        }, 0);
      }
    },
    get,
    api
  );

  return {
    ...storeState,
    ...persistenceState
  };
};

/**
 * Hook for manual persistence operations in components
 */
export const usePersistenceActions = (storeName: string) => {
  return {
    createBackup: async (label?: string) => {
      if (!globalPersistenceService) {
        console.warn('⚠️ Persistence service not initialized');
        return false;
      }

      const backupLabel = label || `${storeName} manual backup`;
      const result = await globalPersistenceService.createBackup('manual', backupLabel);
      return result.success;
    },

    createPreActionBackup: async (action: string) => {
      if (!globalPersistenceService) {
        console.warn('⚠️ Persistence service not initialized');
        return false;
      }

      return await globalPersistenceService.createPreActionBackup(action);
    },

    listBackups: async () => {
      if (!globalPersistenceService) {
        return [];
      }

      return await globalPersistenceService.listBackups();
    },

    restoreBackup: async (backupId: string) => {
      if (!globalPersistenceService) {
        return false;
      }

      const result = await globalPersistenceService.restoreFromBackup(backupId);
      return result.success;
    },

    getStats: async () => {
      if (!globalPersistenceService) {
        return null;
      }

      return await globalPersistenceService.getStats();
    }
  };
};

/**
 * Cleanup function for testing or app shutdown
 */
export const destroyGlobalPersistenceService = () => {
  if (globalPersistenceService) {
    globalPersistenceService.destroy();
    globalPersistenceService = null;
    console.log('🔄 Global persistence service destroyed');
  }
};