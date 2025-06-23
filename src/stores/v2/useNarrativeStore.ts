// /Users/montysharma/V11M2/src/stores/v2/useNarrativeStore.ts
// Consolidated store for storylets, unified flags, story arcs, and character concerns

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Storylet } from '../../types/storylet';

export interface NarrativeState {
  storylets: {
    active: string[];
    completed: string[];
    cooldowns: Record<string, number>;
    userCreated: Storylet[]; // from storylet-catalog-store
  };
  flags: {
    // UNIFIED NAMESPACE - prevents conflicts from multiple flag stores
    storylet: Map<string, any>;     // from storylet-store
    storyletFlag: Map<string, any>; // from storylet-flag-store
    concerns: Map<string, any>;     // from character-concerns-store
    storyArc: Map<string, any>;     // from story-arc-store
  };
  storyArcs: {
    progress: Record<string, number>;
    metadata: Record<string, any>;
    failures: Record<string, number>;
  };
  concerns: {
    current: Record<string, any>;
    history: any[];
  };
  
  // Actions
  evaluateStoryletAvailability: (storyletId: string) => boolean;
  resetNarrative: () => void;
  migrateFromLegacyStores: () => void;
  
  // Storylet management
  addActiveStorylet: (storyletId: string) => void;
  completeStorylet: (storyletId: string) => void;
  setCooldown: (storyletId: string, cooldownEnd: number) => void;
  
  // Flag management
  setStoryletFlag: (key: string, value: any) => void;
  getStoryletFlag: (key: string) => any;
  setConcernFlag: (key: string, value: any) => void;
  getConcernFlag: (key: string) => any;
  setArcFlag: (key: string, value: any) => void;
  getArcFlag: (key: string) => any;
  
  // Story arc management
  updateArcProgress: (arcId: string, progress: number) => void;
  setArcMetadata: (arcId: string, metadata: any) => void;
  recordArcFailure: (arcId: string) => void;
  
  // Concerns management
  updateConcerns: (concerns: Record<string, any>) => void;
  addConcernHistory: (entry: any) => void;
}

const getInitialNarrativeState = (): Omit<NarrativeState, 
  'evaluateStoryletAvailability' | 'resetNarrative' | 'migrateFromLegacyStores' |
  'addActiveStorylet' | 'completeStorylet' | 'setCooldown' |
  'setStoryletFlag' | 'getStoryletFlag' | 'setConcernFlag' | 'getConcernFlag' |
  'setArcFlag' | 'getArcFlag' | 'updateArcProgress' | 'setArcMetadata' |
  'recordArcFailure' | 'updateConcerns' | 'addConcernHistory'
> => ({
  storylets: {
    active: [],
    completed: [],
    cooldowns: {},
    userCreated: []
  },
  flags: {
    storylet: new Map(),
    storyletFlag: new Map(),
    concerns: new Map(),
    storyArc: new Map()
  },
  storyArcs: {
    progress: {},
    metadata: {},
    failures: {}
  },
  concerns: {
    current: {},
    history: []
  }
});

export const useNarrativeStore = create<NarrativeState>()(
  persist(
    (set, get) => ({
      ...getInitialNarrativeState(),

      // Unified storylet evaluation
      evaluateStoryletAvailability: (storyletId: string): boolean => {
        // Single source of truth for all flag checks
        // No auto-save timing concerns
        const state = get();
        
        // Check if storylet is on cooldown
        const cooldownEnd = state.storylets.cooldowns[storyletId];
        if (cooldownEnd && Date.now() < cooldownEnd) {
          return false;
        }
        
        // Check if already completed and not repeatable
        if (state.storylets.completed.includes(storyletId)) {
          // Would need storylet data to check if repeatable
          return false;
        }
        
        // Additional flag-based checks would go here
        // This provides a unified evaluation point
        return true;
      },

      resetNarrative: () => set(getInitialNarrativeState()),

      migrateFromLegacyStores: () => {
        console.log('🔄 Migrating data from legacy stores to Narrative Store...');
        
        try {
          // Migrate from useStoryletStore
          const legacyStoryletStore = (window as any).useStoryletStore?.getState();
          if (legacyStoryletStore) {
            set((state) => ({
              ...state,
              storylets: {
                ...state.storylets,
                completed: legacyStoryletStore.completedStorylets || []
              }
            }));
            
            // Migrate storylet flags
            if (legacyStoryletStore.flags) {
              const newStoryletFlags = new Map(state.flags.storylet);
              Object.entries(legacyStoryletStore.flags).forEach(([key, value]) => {
                newStoryletFlags.set(key, value);
              });
              set((state) => ({
                ...state,
                flags: { ...state.flags, storylet: newStoryletFlags }
              }));
            }
          }

          // Migrate from useStoryletCatalogStore
          const legacyCatalogStore = (window as any).useStoryletCatalogStore?.getState();
          if (legacyCatalogStore?.allStorylets) {
            set((state) => ({
              ...state,
              storylets: {
                ...state.storylets,
                userCreated: legacyCatalogStore.allStorylets
              }
            }));
          }

          // Migrate character concerns if they exist
          const legacyCharacterStore = (window as any).useIntegratedCharacterStore?.getState();
          if (legacyCharacterStore?.concerns) {
            set((state) => ({
              ...state,
              concerns: {
                ...state.concerns,
                current: legacyCharacterStore.concerns
              }
            }));
          }

          console.log('✅ Narrative Store migration completed');
        } catch (error) {
          console.error('❌ Narrative Store migration failed:', error);
        }
      },

      // Storylet management
      addActiveStorylet: (storyletId) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
          
          return {
            ...state,
            storylets: {
              ...state.storylets,
              active: [...activeArray, storyletId]
            }
          };
        });
      },

      completeStorylet: (storyletId) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
          const completedArray = Array.isArray(state.storylets?.completed) ? state.storylets.completed : [];
          
          return {
            ...state,
            storylets: {
              ...state.storylets,
              active: activeArray.filter(id => id !== storyletId),
              completed: [...completedArray, storyletId]
            }
          };
        });
      },

      setCooldown: (storyletId, cooldownEnd) => {
        set((state) => ({
          ...state,
          storylets: {
            ...state.storylets,
            cooldowns: { ...state.storylets.cooldowns, [storyletId]: cooldownEnd }
          }
        }));
      },

      // Flag management
      setStoryletFlag: (key, value) => {
        set((state) => {
          // Defensive programming: ensure Map exists
          const currentFlags = state.flags?.storylet instanceof Map ? state.flags.storylet : new Map();
          const newFlags = new Map(currentFlags);
          newFlags.set(key, value);
          return {
            ...state,
            flags: { ...state.flags, storylet: newFlags }
          };
        });
      },

      getStoryletFlag: (key) => {
        const state = get();
        const storyletFlags = state.flags?.storylet instanceof Map ? state.flags.storylet : new Map();
        return storyletFlags.get(key);
      },

      setConcernFlag: (key, value) => {
        set((state) => {
          // Defensive programming: ensure Map exists
          const currentFlags = state.flags?.concerns instanceof Map ? state.flags.concerns : new Map();
          const newFlags = new Map(currentFlags);
          newFlags.set(key, value);
          return {
            ...state,
            flags: { ...state.flags, concerns: newFlags }
          };
        });
      },

      getConcernFlag: (key) => {
        const state = get();
        const concernFlags = state.flags?.concerns instanceof Map ? state.flags.concerns : new Map();
        return concernFlags.get(key);
      },

      setArcFlag: (key, value) => {
        set((state) => {
          // Defensive programming: ensure Map exists
          const currentFlags = state.flags?.storyArc instanceof Map ? state.flags.storyArc : new Map();
          const newFlags = new Map(currentFlags);
          newFlags.set(key, value);
          return {
            ...state,
            flags: { ...state.flags, storyArc: newFlags }
          };
        });
      },

      getArcFlag: (key) => {
        const state = get();
        const arcFlags = state.flags?.storyArc instanceof Map ? state.flags.storyArc : new Map();
        return arcFlags.get(key);
      },

      // Story arc management
      updateArcProgress: (arcId, progress) => {
        set((state) => ({
          ...state,
          storyArcs: {
            ...state.storyArcs,
            progress: { ...state.storyArcs.progress, [arcId]: progress }
          }
        }));
      },

      setArcMetadata: (arcId, metadata) => {
        set((state) => ({
          ...state,
          storyArcs: {
            ...state.storyArcs,
            metadata: { ...state.storyArcs.metadata, [arcId]: metadata }
          }
        }));
      },

      recordArcFailure: (arcId) => {
        set((state) => ({
          ...state,
          storyArcs: {
            ...state.storyArcs,
            failures: { 
              ...state.storyArcs.failures, 
              [arcId]: (state.storyArcs.failures[arcId] || 0) + 1 
            }
          }
        }));
      },

      // Concerns management
      updateConcerns: (concerns) => {
        set((state) => ({
          ...state,
          concerns: {
            ...state.concerns,
            current: { ...state.concerns.current, ...concerns }
          }
        }));
      },

      addConcernHistory: (entry) => {
        set((state) => ({
          ...state,
          concerns: {
            ...state.concerns,
            history: [...state.concerns.history, entry]
          }
        }));
      }
    }),
    {
      name: 'mmv-narrative-store',
      version: 1,
      // Custom serialization for Maps
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          flags: {
            storylet: Array.from(state.flags.storylet.entries()),
            storyletFlag: Array.from(state.flags.storyletFlag.entries()),
            concerns: Array.from(state.flags.concerns.entries()),
            storyArc: Array.from(state.flags.storyArc.entries())
          }
        });
      },
      deserialize: (str) => {
        const state = JSON.parse(str);
        const initialState = getInitialNarrativeState();
        
        return {
          ...initialState,
          ...state,
          storylets: {
            ...initialState.storylets,
            ...(state.storylets || {}),
            active: Array.isArray(state.storylets?.active) ? state.storylets.active : [],
            completed: Array.isArray(state.storylets?.completed) ? state.storylets.completed : [],
            cooldowns: typeof state.storylets?.cooldowns === 'object' ? state.storylets.cooldowns : {},
            userCreated: Array.isArray(state.storylets?.userCreated) ? state.storylets.userCreated : []
          },
          flags: {
            storylet: new Map(state.flags?.storylet || []),
            storyletFlag: new Map(state.flags?.storyletFlag || []),
            concerns: new Map(state.flags?.concerns || []),
            storyArc: new Map(state.flags?.storyArc || [])
          }
        };
      }
    }
  )
);