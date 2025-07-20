// /Users/montysharma/V11M2/src/stores/v2/initializeStores.ts
// Initialize V2 stores and expose them globally for cross-store access

import { useCoreGameStore } from './useCoreGameStore';
import { useNarrativeStore } from './useNarrativeStore';
import { useSocialStore } from './useSocialStore';

/**
 * Initialize V2 stores and expose them to window for cross-store access
 * This is necessary because stores need to access each other's state
 */
export const initializeV2Stores = () => {
  // Expose stores to window for cross-store access
  if (typeof window !== 'undefined') {
    (window as any).useCoreGameStore = useCoreGameStore;
    (window as any).useNarrativeStore = useNarrativeStore;
    (window as any).useSocialStore = useSocialStore;
    
    console.log('✅ V2 Stores initialized and exposed to window');
  }
};

/**
 * Get all V2 stores for debugging
 */
export const getV2StoresDebugInfo = () => {
  return {
    coreGame: {
      store: useCoreGameStore,
      state: useCoreGameStore.getState(),
      persist: (useCoreGameStore as any).persist
    },
    narrative: {
      store: useNarrativeStore,
      state: useNarrativeStore.getState(),
      persist: (useNarrativeStore as any).persist
    },
    social: {
      store: useSocialStore,
      state: useSocialStore.getState(),
      persist: (useSocialStore as any).persist
    }
  };
};

// Debug utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).getV2StoresDebugInfo = getV2StoresDebugInfo;
  (window as any).initializeV2Stores = initializeV2Stores;
}