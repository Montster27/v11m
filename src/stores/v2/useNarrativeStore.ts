// /Users/montysharma/V11M2/src/stores/v2/useNarrativeStore.ts
// Consolidated store for storylets, unified flags, story arcs, and character concerns

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../../utils/debouncedStorage';
import type { Storylet } from '../../types/storylet';

// Store versioning for migration handling
const CURRENT_VERSION = 1;

export interface StoryArc {
  id: string;
  name: string;
  description: string;
  progress: number; // 0-1
  isCompleted: boolean;
  currentStorylet?: string;
  startedAt?: number;
  completedAt?: number;
  failures: number;
  metadata: {
    totalStorylets: number;
    completedStorylets: number;
    availableStorylets: string[];
    entryPoints: string[];
    deadEnds: string[];
    lastAccessed: number;
    createdAt: number;
  };
}

export interface ArcProgress {
  currentStoryletId?: string;
  completedStorylets: string[];
  availableStorylets: string[];
  flags: Record<string, any>;
  failures: Array<{
    storyletId: string;
    timestamp: number;
    reason: string;
  }>;
}

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
  
  // Enhanced Story Arc Management
  storyArcs: {
    [arcId: string]: StoryArc;
  };
  
  // Arc Progress Tracking  
  arcProgress: {
    [arcId: string]: ArcProgress;
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
  removeActiveStorylet: (storyletId: string) => void;
  completeStorylet: (storyletId: string) => void;
  setCooldown: (storyletId: string, cooldownEnd: number) => void;
  unlockStorylet: (storyletId: string) => void;
  getCurrentStorylet: () => string | null;
  
  // Flag management
  setStoryletFlag: (key: string, value: any) => void;
  getStoryletFlag: (key: string) => any;
  setConcernFlag: (key: string, value: any) => void;
  getConcernFlag: (key: string) => any;
  setArcFlag: (key: string, value: any) => void;
  getArcFlag: (key: string) => any;
  
  // Enhanced Story arc management
  createArc: (arcData: Omit<StoryArc, 'id' | 'metadata'>) => string;
  updateArc: (arcId: string, updates: Partial<StoryArc>) => void;
  deleteArc: (arcId: string) => void;
  getArc: (arcId: string) => StoryArc | null;
  getAllArcs: () => StoryArc[];
  startArc: (arcId: string) => void;
  completeArc: (arcId: string) => void;
  recordArcFailure: (arcId: string, reason: string) => void;
  getArcProgress: (arcId: string) => ArcProgress | null;
  assignStoryletToArc: (storyletId: string, arcId: string) => void;
  getArcStorylets: (arcId: string) => string[];
  progressArcStorylet: (arcId: string, storyletId: string) => void;
  
  // Concerns management
  updateConcerns: (concerns: Record<string, any>) => void;
  addConcernHistory: (entry: any) => void;
}

const getInitialNarrativeState = (): Omit<NarrativeState, 
  'evaluateStoryletAvailability' | 'resetNarrative' | 'migrateFromLegacyStores' |
  'addActiveStorylet' | 'completeStorylet' | 'setCooldown' |
  'setStoryletFlag' | 'getStoryletFlag' | 'setConcernFlag' | 'getConcernFlag' |
  'setArcFlag' | 'getArcFlag' | 'createArc' | 'updateArc' | 'deleteArc' |
  'getArc' | 'getAllArcs' | 'startArc' | 'completeArc' | 'recordArcFailure' |
  'getArcProgress' | 'assignStoryletToArc' | 'getArcStorylets' | 'progressArcStorylet' |
  'updateConcerns' | 'addConcernHistory'
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
  storyArcs: {},
  arcProgress: {},
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
          
          // Don't add if already active
          if (activeArray.includes(storyletId)) {
            return state;
          }
          
          return {
            ...state,
            storylets: {
              ...state.storylets,
              active: [...activeArray, storyletId]
            }
          };
        });
      },

      removeActiveStorylet: (storyletId) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
          
          return {
            ...state,
            storylets: {
              ...state.storylets,
              active: activeArray.filter(id => id !== storyletId)
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

      unlockStorylet: (storyletId) => {
        get().addActiveStorylet(storyletId);
      },

      getCurrentStorylet: () => {
        const state = get();
        const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
        return activeArray.length > 0 ? activeArray[0] : null;
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

      // Enhanced Story Arc Management
      createArc: (arcData) => {
        const arcId = `arc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const newArc: StoryArc = {
          id: arcId,
          ...arcData,
          metadata: {
            totalStorylets: 0,
            completedStorylets: 0,
            availableStorylets: [],
            entryPoints: [],
            deadEnds: [],
            lastAccessed: now,
            createdAt: now
          }
        };

        const newProgress: ArcProgress = {
          completedStorylets: [],
          availableStorylets: [],
          flags: {},
          failures: []
        };

        set((state) => ({
          ...state,
          storyArcs: { ...state.storyArcs, [arcId]: newArc },
          arcProgress: { ...state.arcProgress, [arcId]: newProgress }
        }));

        return arcId;
      },

      updateArc: (arcId, updates) => {
        set((state) => {
          const existingArc = state.storyArcs[arcId];
          if (!existingArc) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...existingArc,
                ...updates,
                metadata: {
                  ...existingArc.metadata,
                  lastAccessed: Date.now()
                }
              }
            }
          };
        });
      },

      deleteArc: (arcId) => {
        set((state) => {
          const { [arcId]: removedArc, ...remainingArcs } = state.storyArcs;
          const { [arcId]: removedProgress, ...remainingProgress } = state.arcProgress;
          
          return {
            ...state,
            storyArcs: remainingArcs,
            arcProgress: remainingProgress
          };
        });
      },

      getArc: (arcId) => {
        const state = get();
        return state.storyArcs[arcId] || null;
      },

      getAllArcs: () => {
        const state = get();
        return Object.values(state.storyArcs);
      },

      startArc: (arcId) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          if (!arc) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                startedAt: Date.now(),
                metadata: {
                  ...arc.metadata,
                  lastAccessed: Date.now()
                }
              }
            }
          };
        });
      },

      completeArc: (arcId) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          if (!arc) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                isCompleted: true,
                completedAt: Date.now(),
                progress: 1.0,
                metadata: {
                  ...arc.metadata,
                  lastAccessed: Date.now()
                }
              }
            }
          };
        });
      },

      recordArcFailure: (arcId, reason) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          const progress = state.arcProgress[arcId];
          if (!arc || !progress) return state;
          
          const failure = {
            storyletId: arc.currentStorylet || '',
            timestamp: Date.now(),
            reason
          };
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                failures: arc.failures + 1,
                metadata: {
                  ...arc.metadata,
                  lastAccessed: Date.now()
                }
              }
            },
            arcProgress: {
              ...state.arcProgress,
              [arcId]: {
                ...progress,
                failures: [...progress.failures, failure]
              }
            }
          };
        });
      },

      getArcProgress: (arcId) => {
        const state = get();
        return state.arcProgress[arcId] || null;
      },

      assignStoryletToArc: (storyletId, arcId) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          const progress = state.arcProgress[arcId];
          if (!arc || !progress) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                metadata: {
                  ...arc.metadata,
                  totalStorylets: arc.metadata.totalStorylets + 1,
                  lastAccessed: Date.now()
                }
              }
            },
            arcProgress: {
              ...state.arcProgress,
              [arcId]: {
                ...progress,
                availableStorylets: [...progress.availableStorylets, storyletId]
              }
            }
          };
        });
      },

      getArcStorylets: (arcId) => {
        const state = get();
        const progress = state.arcProgress[arcId];
        return progress ? [...progress.completedStorylets, ...progress.availableStorylets] : [];
      },

      progressArcStorylet: (arcId, storyletId) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          const progress = state.arcProgress[arcId];
          if (!arc || !progress) return state;
          
          const newCompletedStorylets = [...progress.completedStorylets, storyletId];
          const newAvailableStorylets = progress.availableStorylets.filter(id => id !== storyletId);
          const newProgress = newCompletedStorylets.length / arc.metadata.totalStorylets;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                progress: newProgress,
                currentStorylet: storyletId,
                metadata: {
                  ...arc.metadata,
                  completedStorylets: newCompletedStorylets.length,
                  lastAccessed: Date.now()
                }
              }
            },
            arcProgress: {
              ...state.arcProgress,
              [arcId]: {
                ...progress,
                currentStoryletId: storyletId,
                completedStorylets: newCompletedStorylets,
                availableStorylets: newAvailableStorylets
              }
            }
          };
        });
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
      version: CURRENT_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      migrate: (persistedState: any, version: number) => {
        console.log(`[NarrativeStore] Migrating from version ${version} to ${CURRENT_VERSION}`);
        
        // Handle unversioned saves (version 0 or undefined)
        if (!version || version === 0) {
          console.log('[NarrativeStore] Detected unversioned save, applying defaults and preserving data');
          const defaultState = getInitialNarrativeState();
          
          // Merge persisted data with defaults, preserving any existing values
          const migrated = {
            ...defaultState,
            ...persistedState,
            // Ensure nested objects are properly merged
            storylets: { 
              ...defaultState.storylets, 
              ...(persistedState.storylets || {}),
              // Ensure arrays are actually arrays
              active: Array.isArray(persistedState.storylets?.active) ? persistedState.storylets.active : [],
              completed: Array.isArray(persistedState.storylets?.completed) ? persistedState.storylets.completed : [],
              userCreated: Array.isArray(persistedState.storylets?.userCreated) ? persistedState.storylets.userCreated : []
            },
            storyArcs: { ...defaultState.storyArcs, ...(persistedState.storyArcs || {}) },
            arcProgress: { ...defaultState.arcProgress, ...(persistedState.arcProgress || {}) },
            concerns: { ...defaultState.concerns, ...(persistedState.concerns || {}) },
            // Handle flags - may need to recreate Maps
            flags: {
              storylet: new Map(persistedState.flags?.storylet || []),
              storyletFlag: new Map(persistedState.flags?.storyletFlag || []),
              concerns: new Map(persistedState.flags?.concerns || []),
              storyArc: new Map(persistedState.flags?.storyArc || [])
            }
          };
          
          return migrated;
        }
        
        // Future version migrations go here
        // if (version === 1) {
        //   // Migrate from v1 to v2
        //   return migrateV1ToV2(persistedState);
        // }
        
        return persistedState;
      },
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
          storyArcs: state.storyArcs || {},
          arcProgress: state.arcProgress || {},
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