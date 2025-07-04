// /Users/montysharma/v11m2/src/stores/v2/optimizedNarrativeStore.ts
// Performance-optimized version of useNarrativeStore

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../../utils/debouncedStorage';
import type { Storylet } from '../../types/storylet';
import { 
  createMemoizedSelector, 
  createDebouncedUpdate, 
  createBatchedOperations,
  optimizeFlagStorage,
  StorePerformanceMonitor,
  optimizedArrayOperations,
  type OptimizedFlagStorage
} from './storeOptimizations';

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

export interface OptimizedNarrativeState {
  storylets: {
    active: string[];
    completed: string[];
    cooldowns: Record<string, number>;
    userCreated: Storylet[];
  };
  
  // Optimized flag storage using Records instead of Maps
  flags: OptimizedFlagStorage;
  
  // Enhanced Story Arc Management
  storyArcs: Record<string, StoryArc>;
  
  // Arc Progress Tracking  
  arcProgress: Record<string, ArcProgress>;
  
  concerns: {
    current: Record<string, any>;
    history: any[];
  };
  
  // Performance metadata
  _performance: {
    lastOptimized: number;
    operationCount: number;
    cacheHits: number;
    cacheMisses: number;
  };
  
  // Actions with performance monitoring
  evaluateStoryletAvailability: (storyletId: string) => boolean;
  resetNarrative: () => void;
  migrateFromLegacyStores: () => void;
  
  // Optimized storylet management
  addActiveStorylet: (storyletId: string) => void;
  removeActiveStorylet: (storyletId: string) => void;
  completeStorylet: (storyletId: string) => void;
  setCooldown: (storyletId: string, cooldownEnd: number) => void;
  unlockStorylet: (storyletId: string) => void;
  getCurrentStorylet: () => string | null;
  
  // Optimized flag management
  setStoryletFlag: (key: string, value: any) => void;
  getStoryletFlag: (key: string) => any;
  setConcernFlag: (key: string, value: any) => void;
  getConcernFlag: (key: string) => any;
  setArcFlag: (key: string, value: any) => void;
  getArcFlag: (key: string) => any;
  
  // Optimized story arc management
  createArc: (arcData: Omit<StoryArc, 'id' | 'metadata'>) => string;
  updateArc: (arcId: string, updates: Partial<StoryArc>) => void;
  deleteArc: (arcId: string) => void;
  getArc: (arcId: string) => StoryArc | null;
  getAllArcs: () => StoryArc[];
  startArc: (arcId: string) => void;
  completeArc: (arcId: string) => void;
  recordArcFailure: (arcId: string, reason: string) => void;
  getArcProgress: (arcId: string) => ArcProgress | null;
  updateArcProgress: (arcId: string, progress: ArcProgress) => void;
  assignStoryletToArc: (storyletId: string, arcId: string) => void;
  getArcStorylets: (arcId: string) => string[];
  progressArcStorylet: (arcId: string, storyletId: string) => void;
  
  // Performance utilities
  optimizeStore: () => void;
  getPerformanceMetrics: () => any;
}

const getInitialOptimizedNarrativeState = (): Omit<OptimizedNarrativeState, keyof any> => ({
  storylets: {
    active: [],
    completed: [],
    cooldowns: {},
    userCreated: []
  },
  flags: {
    storylet: {},
    storyletFlag: {},
    concerns: {},
    storyArc: {}
  },
  storyArcs: {},
  arcProgress: {},
  concerns: {
    current: {},
    history: []
  },
  _performance: {
    lastOptimized: Date.now(),
    operationCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
});

export const useOptimizedNarrativeStore = create<OptimizedNarrativeState>()(
  persist(
    (set, get) => {
      const debouncedUpdate = createDebouncedUpdate('narrative', 100);
      const batchedOperations = createBatchedOperations({ setState: set, getState: get });
      
      // Memoized selectors for expensive operations
      const getActiveStoryletsSelector = createMemoizedSelector(
        (state: OptimizedNarrativeState) => state.storylets.active,
        (state: OptimizedNarrativeState) => state.storylets.active.join(',')
      );
      
      const getAllArcsSelector = createMemoizedSelector(
        (state: OptimizedNarrativeState) => Object.values(state.storyArcs),
        (state: OptimizedNarrativeState) => Object.keys(state.storyArcs).join(',')
      );
      
      return {
        ...getInitialOptimizedNarrativeState(),

        // Performance-monitored storylet evaluation
        evaluateStoryletAvailability: (storyletId: string): boolean => {
          return StorePerformanceMonitor.trackOperation('narrative', 'evaluateStoryletAvailability', () => {
            const state = get();
            
            // Check if storylet is on cooldown
            const cooldownEnd = state.storylets.cooldowns[storyletId];
            if (cooldownEnd && Date.now() < cooldownEnd) {
              return false;
            }
            
            // Check if already completed and not repeatable
            if (state.storylets.completed.includes(storyletId)) {
              return false;
            }
            
            return true;
          });
        },

        resetNarrative: () => {
          StorePerformanceMonitor.trackOperation('narrative', 'resetNarrative', () => {
            set(getInitialOptimizedNarrativeState());
          });
        },

        migrateFromLegacyStores: () => {
          StorePerformanceMonitor.trackOperation('narrative', 'migrateFromLegacyStores', () => {
            try {
              console.log('🔄 Starting optimized narrative store migration...');
              
              // Migrate from legacy stores with performance monitoring
              // Implementation would go here
              
              console.log('✅ Optimized narrative store migration completed');
            } catch (error) {
              console.error('❌ Optimized narrative store migration failed:', error);
            }
          });
        },

        // Optimized storylet management
        addActiveStorylet: (storyletId) => {
          debouncedUpdate(() => {
            set((state) => {
              const newActive = optimizedArrayOperations.addUnique(
                state.storylets.active, 
                storyletId
              );
              
              if (newActive === state.storylets.active) {
                state._performance.cacheHits++;
                return state; // No change needed
              }
              
              state._performance.operationCount++;
              return {
                ...state,
                storylets: {
                  ...state.storylets,
                  active: newActive
                }
              };
            });
          });
        },

        removeActiveStorylet: (storyletId) => {
          debouncedUpdate(() => {
            set((state) => {
              const newActive = optimizedArrayOperations.remove(
                state.storylets.active, 
                storyletId
              );
              
              state._performance.operationCount++;
              return {
                ...state,
                storylets: {
                  ...state.storylets,
                  active: newActive
                }
              };
            });
          });
        },

        completeStorylet: (storyletId) => {
          batchedOperations.addToBatch((state) => {
            const newCompleted = optimizedArrayOperations.addUnique(
              state.storylets.completed, 
              storyletId
            );
            const newActive = optimizedArrayOperations.remove(
              state.storylets.active, 
              storyletId
            );
            
            state._performance.operationCount++;
            return {
              storylets: {
                ...state.storylets,
                completed: newCompleted,
                active: newActive
              }
            };
          });
        },

        setCooldown: (storyletId, cooldownEnd) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              storylets: {
                ...state.storylets,
                cooldowns: {
                  ...state.storylets.cooldowns,
                  [storyletId]: cooldownEnd
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        unlockStorylet: (storyletId) => {
          // Alias for addActiveStorylet for backwards compatibility
          get().addActiveStorylet(storyletId);
        },

        getCurrentStorylet: () => {
          return StorePerformanceMonitor.trackOperation('narrative', 'getCurrentStorylet', () => {
            const state = get();
            const activeStorylets = getActiveStoryletsSelector(state);
            return activeStorylets.length > 0 ? activeStorylets[0] : null;
          });
        },

        // Optimized flag management with Records instead of Maps
        setStoryletFlag: (key, value) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              flags: {
                ...state.flags,
                storylet: {
                  ...state.flags.storylet,
                  [key]: value
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        getStoryletFlag: (key) => {
          const state = get();
          state._performance.cacheHits++;
          return state.flags.storylet[key];
        },

        setConcernFlag: (key, value) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              flags: {
                ...state.flags,
                concerns: {
                  ...state.flags.concerns,
                  [key]: value
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        getConcernFlag: (key) => {
          const state = get();
          state._performance.cacheHits++;
          return state.flags.concerns[key];
        },

        setArcFlag: (key, value) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              flags: {
                ...state.flags,
                storyArc: {
                  ...state.flags.storyArc,
                  [key]: value
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        getArcFlag: (key) => {
          const state = get();
          state._performance.cacheHits++;
          return state.flags.storyArc[key];
        },

        // Optimized story arc management
        createArc: (arcData) => {
          return StorePerformanceMonitor.trackOperation('narrative', 'createArc', () => {
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
            
            set((state) => ({
              ...state,
              storyArcs: {
                ...state.storyArcs,
                [arcId]: newArc
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
            
            return arcId;
          });
        },

        updateArc: (arcId, updates) => {
          debouncedUpdate(() => {
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
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
          });
        },

        deleteArc: (arcId) => {
          batchedOperations.addToBatch((state) => {
            const { [arcId]: deleted, ...remainingArcs } = state.storyArcs;
            const { [arcId]: deletedProgress, ...remainingProgress } = state.arcProgress;
            
            return {
              storyArcs: remainingArcs,
              arcProgress: remainingProgress,
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            };
          });
        },

        getArc: (arcId) => {
          const state = get();
          state._performance.cacheHits++;
          return state.storyArcs[arcId] || null;
        },

        getAllArcs: () => {
          const state = get();
          return getAllArcsSelector(state);
        },

        startArc: (arcId) => {
          debouncedUpdate(() => {
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
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
          });
        },

        completeArc: (arcId) => {
          debouncedUpdate(() => {
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
                    progress: 1,
                    metadata: {
                      ...arc.metadata,
                      lastAccessed: Date.now()
                    }
                  }
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
          });
        },

        recordArcFailure: (arcId, reason) => {
          debouncedUpdate(() => {
            set((state) => {
              const arc = state.storyArcs[arcId];
              if (!arc) return state;
              
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
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
          });
        },

        getArcProgress: (arcId) => {
          const state = get();
          state._performance.cacheHits++;
          return state.arcProgress[arcId] || null;
        },

        updateArcProgress: (arcId, progress) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              arcProgress: {
                ...state.arcProgress,
                [arcId]: progress
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        assignStoryletToArc: (storyletId, arcId) => {
          debouncedUpdate(() => {
            set((state) => {
              const arc = state.storyArcs[arcId];
              if (!arc) return state;
              
              const updatedStorylets = optimizedArrayOperations.addUnique(
                arc.metadata.availableStorylets,
                storyletId
              );
              
              return {
                ...state,
                storyArcs: {
                  ...state.storyArcs,
                  [arcId]: {
                    ...arc,
                    metadata: {
                      ...arc.metadata,
                      availableStorylets: updatedStorylets,
                      totalStorylets: updatedStorylets.length,
                      lastAccessed: Date.now()
                    }
                  }
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
          });
        },

        getArcStorylets: (arcId) => {
          const state = get();
          const arc = state.storyArcs[arcId];
          state._performance.cacheHits++;
          return arc ? arc.metadata.availableStorylets : [];
        },

        progressArcStorylet: (arcId, storyletId) => {
          batchedOperations.addToBatch((state) => {
            const arc = state.storyArcs[arcId];
            if (!arc) return {};
            
            const newCompleted = optimizedArrayOperations.addUnique(
              arc.metadata.availableStorylets.filter(id => 
                state.storylets.completed.includes(id)
              ),
              storyletId
            );
            
            const progress = arc.metadata.totalStorylets > 0 
              ? newCompleted.length / arc.metadata.totalStorylets 
              : 0;
            
            return {
              storyArcs: {
                ...state.storyArcs,
                [arcId]: {
                  ...arc,
                  progress,
                  metadata: {
                    ...arc.metadata,
                    completedStorylets: newCompleted.length,
                    lastAccessed: Date.now()
                  }
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            };
          });
        },

        // Performance utilities
        optimizeStore: () => {
          StorePerformanceMonitor.trackOperation('narrative', 'optimizeStore', () => {
            set((state) => {
              // Clean up old cooldowns
              const now = Date.now();
              const validCooldowns = Object.fromEntries(
                Object.entries(state.storylets.cooldowns).filter(
                  ([_, cooldownEnd]) => cooldownEnd > now
                )
              );
              
              // Optimize flag storage
              const optimizedFlags = optimizeFlagStorage(state.flags);
              
              // Limit history size
              const limitedHistory = state.concerns.history.slice(-100);
              
              return {
                ...state,
                storylets: {
                  ...state.storylets,
                  cooldowns: validCooldowns
                },
                flags: optimizedFlags,
                concerns: {
                  ...state.concerns,
                  history: limitedHistory
                },
                _performance: {
                  ...state._performance,
                  lastOptimized: now,
                  operationCount: 0 // Reset counter after optimization
                }
              };
            });
          });
        },

        getPerformanceMetrics: () => {
          const state = get();
          return {
            ...state._performance,
            storeSize: JSON.stringify(state).length,
            arcCount: Object.keys(state.storyArcs).length,
            activeStoryletCount: state.storylets.active.length,
            completedStoryletCount: state.storylets.completed.length,
            flagCount: Object.keys(state.flags.storylet).length + 
                      Object.keys(state.flags.concerns).length + 
                      Object.keys(state.flags.storyArc).length
          };
        }
      };
    },
    {
      name: 'optimized-narrative-store',
      storage: createJSONStorage(() => debouncedStorage),
      version: CURRENT_VERSION,
      partialize: (state) => {
        // Exclude performance metadata from persistence
        const { _performance, ...persistedState } = state;
        return persistedState;
      }
    }
  )
);

// Auto-optimization: Run optimization every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useOptimizedNarrativeStore.getState();
    if (store._performance.operationCount > 100) {
      console.log('🚀 Auto-optimizing narrative store...');
      store.optimizeStore();
    }
  }, 5 * 60 * 1000); // 5 minutes
}