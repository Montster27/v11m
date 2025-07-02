// /Users/montysharma/v11m2/src/utils/createManagedStore.ts
// Wrapper for stores during migration to atomic save system

import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';

// Migration flags - can be toggled during rollout
const MIGRATION_CONFIG = {
  // During Phase 1: Run both systems in parallel
  ENABLE_LEGACY_PERSISTENCE: true,
  ENABLE_ATOMIC_SAVES: true,
  LOG_SAVE_CONFLICTS: true
};

/**
 * Creates a managed store that can operate in both legacy and atomic save modes
 * This allows for gradual migration with safety fallbacks
 */
export function createManagedStore<T>(
  storeCreator: StateCreator<T>,
  storeName: string,
  persistOptions?: Partial<PersistOptions<T>>
): UseBoundStore<StoreApi<T>> {
  
  if (MIGRATION_CONFIG.ENABLE_LEGACY_PERSISTENCE) {
    // Phase 1: Keep existing individual store persistence
    console.log(`[ManagedStore] Creating ${storeName} with legacy persistence enabled`);
    
    return create<T>()(
      persist(storeCreator, {
        name: storeName,
        ...persistOptions
      })
    );
  } else {
    // Phase 2: Pure atomic saves only
    console.log(`[ManagedStore] Creating ${storeName} with atomic saves only`);
    
    return create<T>()(storeCreator);
  }
}

/**
 * Monitor function to track save system usage and conflicts
 */
export function monitorSaveSystem() {
  if (!MIGRATION_CONFIG.LOG_SAVE_CONFLICTS) return;

  // Monitor localStorage writes to detect conflicts
  const originalSetItem = localStorage.setItem;
  const saveActivity: { key: string; timestamp: number; source: 'legacy' | 'atomic' }[] = [];
  
  localStorage.setItem = function(key: string, value: string) {
    // Track save activity
    if (key.includes('mmv-') || key.includes('v11m2-')) {
      const source = key.includes('unified') ? 'atomic' : 'legacy';
      saveActivity.push({ key, timestamp: Date.now(), source });
      
      // Check for conflicts (saves within 1 second)
      const recentSaves = saveActivity.filter(s => Date.now() - s.timestamp < 1000);
      const hasConflict = recentSaves.some(s => s.source === 'legacy') && 
                         recentSaves.some(s => s.source === 'atomic');
      
      if (hasConflict) {
        console.warn('[SaveMonitor] Save system conflict detected!', {
          recentSaves: recentSaves.map(s => `${s.source}:${s.key}`),
          recommendation: 'Consider disabling legacy persistence'
        });
      }
    }
    
    return originalSetItem.call(this, key, value);
  };
  
  // Cleanup old activity logs every 30 seconds
  setInterval(() => {
    const cutoff = Date.now() - 30000;
    saveActivity.splice(0, saveActivity.findIndex(s => s.timestamp > cutoff));
  }, 30000);
}

/**
 * Get current migration configuration
 */
export function getMigrationConfig() {
  return { ...MIGRATION_CONFIG };
}

/**
 * Update migration configuration (for runtime toggling)
 */
export function updateMigrationConfig(updates: Partial<typeof MIGRATION_CONFIG>) {
  Object.assign(MIGRATION_CONFIG, updates);
  console.log('[ManagedStore] Migration config updated:', MIGRATION_CONFIG);
}

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  monitorSaveSystem();
}