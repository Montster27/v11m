// Storylet Flag Management Store
// Manages boolean flags used for storylet trigger conditions and state tracking

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StoryletFlagState {
  // Flag state
  activeFlags: Record<string, boolean>;
  
  // Actions
  setFlag: (flag: string, value: boolean) => void;
  getFlag: (flag: string) => boolean;
  clearFlag: (flag: string) => void;
  clearAllFlags: () => void;
  
  // Batch operations
  setFlags: (flags: Record<string, boolean>) => void;
  getFlags: (flagNames: string[]) => Record<string, boolean>;
  
  // Query operations
  hasFlag: (flag: string) => boolean;
  getFlagCount: () => number;
  getAllFlags: () => Record<string, boolean>;
  
  // Development utilities
  exportFlags: () => string;
  importFlags: (flagData: string) => void;
}

export const useStoryletFlagStore = create<StoryletFlagState>()(
  persist(
    (set, get) => ({
      // State
      activeFlags: {},
      
      // Actions
      setFlag: (flag: string, value: boolean) => {
        set((state) => ({
          activeFlags: {
            ...state.activeFlags,
            [flag]: value
          }
        }));
      },

      getFlag: (flag: string): boolean => {
        const state = get();
        return state.activeFlags[flag] || false;
      },

      clearFlag: (flag: string) => {
        set((state) => {
          const newFlags = { ...state.activeFlags };
          delete newFlags[flag];
          return { activeFlags: newFlags };
        });
      },

      clearAllFlags: () => {
        set({ activeFlags: {} });
      },

      // Batch operations
      setFlags: (flags: Record<string, boolean>) => {
        set((state) => ({
          activeFlags: {
            ...state.activeFlags,
            ...flags
          }
        }));
      },

      getFlags: (flagNames: string[]): Record<string, boolean> => {
        const state = get();
        const result: Record<string, boolean> = {};
        
        flagNames.forEach(flag => {
          result[flag] = state.activeFlags[flag] || false;
        });
        
        return result;
      },

      // Query operations
      hasFlag: (flag: string): boolean => {
        const state = get();
        return flag in state.activeFlags && state.activeFlags[flag];
      },

      getFlagCount: (): number => {
        const state = get();
        return Object.keys(state.activeFlags).length;
      },

      getAllFlags: (): Record<string, boolean> => {
        const state = get();
        return { ...state.activeFlags };
      },

      // Development utilities
      exportFlags: (): string => {
        const state = get();
        return JSON.stringify(state.activeFlags, null, 2);
      },

      importFlags: (flagData: string) => {
        try {
          const flags = JSON.parse(flagData);
          if (typeof flags === 'object' && flags !== null) {
            set({ activeFlags: flags });
          } else {
            console.error('Invalid flag data format');
          }
        } catch (error) {
          console.error('Failed to import flags:', error);
        }
      }
    }),
    {
      name: 'storylet-flag-store',
      version: 1
    }
  )
);

// Utility functions for working with flags
export const flagUtils = {
  /**
   * Check if all required flags are set
   */
  hasAllFlags: (requiredFlags: string[]): boolean => {
    const store = useStoryletFlagStore.getState();
    return requiredFlags.every(flag => store.hasFlag(flag));
  },

  /**
   * Check if any of the required flags are set
   */
  hasAnyFlag: (flags: string[]): boolean => {
    const store = useStoryletFlagStore.getState();
    return flags.some(flag => store.hasFlag(flag));
  },

  /**
   * Set multiple flags based on conditions
   */
  setConditionalFlags: (conditions: Array<{ condition: boolean; flag: string; value: boolean }>) => {
    const store = useStoryletFlagStore.getState();
    const flagsToSet: Record<string, boolean> = {};
    
    conditions.forEach(({ condition, flag, value }) => {
      if (condition) {
        flagsToSet[flag] = value;
      }
    });
    
    if (Object.keys(flagsToSet).length > 0) {
      store.setFlags(flagsToSet);
    }
  },

  /**
   * Toggle a flag value
   */
  toggleFlag: (flag: string) => {
    const store = useStoryletFlagStore.getState();
    const currentValue = store.getFlag(flag);
    store.setFlag(flag, !currentValue);
  },

  /**
   * Get flags that match a pattern
   */
  getFlagsMatching: (pattern: RegExp): Record<string, boolean> => {
    const store = useStoryletFlagStore.getState();
    const allFlags = store.getAllFlags();
    const result: Record<string, boolean> = {};
    
    Object.entries(allFlags).forEach(([flag, value]) => {
      if (pattern.test(flag)) {
        result[flag] = value;
      }
    });
    
    return result;
  },

  /**
   * Clear flags that match a pattern
   */
  clearFlagsMatching: (pattern: RegExp) => {
    const store = useStoryletFlagStore.getState();
    const allFlags = store.getAllFlags();
    
    Object.keys(allFlags).forEach(flag => {
      if (pattern.test(flag)) {
        store.clearFlag(flag);
      }
    });
  }
};

// Hook for reactive flag subscriptions
export const useFlag = (flagName: string) => {
  return useStoryletFlagStore(state => state.activeFlags[flagName] || false);
};

// Hook for multiple flags
export const useFlags = (flagNames: string[]) => {
  return useStoryletFlagStore(state => 
    flagNames.reduce((acc, flag) => {
      acc[flag] = state.activeFlags[flag] || false;
      return acc;
    }, {} as Record<string, boolean>)
  );
};

// Hook for flag operations
export const useFlagActions = () => {
  return useStoryletFlagStore(state => ({
    setFlag: state.setFlag,
    getFlag: state.getFlag,
    clearFlag: state.clearFlag,
    setFlags: state.setFlags,
    hasFlag: state.hasFlag,
    toggleFlag: (flag: string) => {
      const currentValue = state.getFlag(flag);
      state.setFlag(flag, !currentValue);
    }
  }));
};