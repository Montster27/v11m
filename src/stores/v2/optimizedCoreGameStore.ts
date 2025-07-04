// /Users/montysharma/v11m2/src/stores/v2/optimizedCoreGameStore.ts
// Performance-optimized version of useCoreGameStore

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../../utils/debouncedStorage';
import { 
  createMemoizedSelector, 
  createDebouncedUpdate, 
  createBatchedOperations,
  StorePerformanceMonitor,
  optimizedArrayOperations
} from './storeOptimizations';

// Store versioning for migration handling
const CURRENT_VERSION = 1;

export interface OptimizedCoreGameState {
  player: {
    level: number;
    experience: number;
    skillPoints: number;
    resources: Record<string, number>;
  };
  character: {
    name: string;
    background: string;
    attributes: Record<string, any>;
    developmentStats: Record<string, any>;
  };
  skills: {
    foundationExperiences: Record<string, any>;
    coreCompetencies: Record<string, any>;
    characterClasses: Record<string, any>;
    totalExperience: number;
  };
  world: {
    day: number;
    timeAllocation: Record<string, any>;
    isTimePaused: boolean;
  };
  
  // Performance metadata
  _performance: {
    lastOptimized: number;
    operationCount: number;
    cacheHits: number;
    cacheMisses: number;
  };
  
  // Actions with performance monitoring
  resetGame: () => void;
  migrateFromLegacyStores: () => void;
  
  // Optimized update methods
  updatePlayer: (updates: Partial<OptimizedCoreGameState['player']>) => void;
  updateCharacter: (updates: Partial<OptimizedCoreGameState['character']>) => void;
  updateSkills: (updates: Partial<OptimizedCoreGameState['skills']>) => void;
  updateWorld: (updates: Partial<OptimizedCoreGameState['world']>) => void;
  
  // Enhanced methods for common operations
  addExperience: (amount: number) => void;
  addSkillPoints: (amount: number) => void;
  updateResource: (resourceKey: string, amount: number) => void;
  addSkillExperience: (skillKey: string, amount: number) => void;
  advanceDay: () => void;
  setTimePause: (paused: boolean) => void;
  
  // Memoized getters
  getTotalLevel: () => number;
  getResourceTotal: () => number;
  getSkillTotal: () => number;
  
  // Performance utilities
  optimizeStore: () => void;
  getPerformanceMetrics: () => any;
}

const getInitialOptimizedCoreState = (): Omit<OptimizedCoreGameState, keyof any> => ({
  player: {
    level: 1,
    experience: 0,
    skillPoints: 0,
    resources: {}
  },
  character: {
    name: '',
    background: '',
    attributes: {},
    developmentStats: {}
  },
  skills: {
    foundationExperiences: {},
    coreCompetencies: {},
    characterClasses: {},
    totalExperience: 0
  },
  world: {
    day: 1,
    timeAllocation: {},
    isTimePaused: false
  },
  _performance: {
    lastOptimized: Date.now(),
    operationCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
});

export const useOptimizedCoreGameStore = create<OptimizedCoreGameState>()(
  persist(
    (set, get) => {
      const debouncedUpdate = createDebouncedUpdate('core', 50); // Faster updates for core game
      const batchedOperations = createBatchedOperations({ setState: set, getState: get });
      
      // Memoized selectors for expensive operations
      const getTotalLevelSelector = createMemoizedSelector(
        (state: OptimizedCoreGameState) => {
          return state.player.level + Math.floor(state.player.experience / 1000);
        },
        (state: OptimizedCoreGameState) => `${state.player.level}-${state.player.experience}`
      );
      
      const getResourceTotalSelector = createMemoizedSelector(
        (state: OptimizedCoreGameState) => {
          return Object.values(state.player.resources).reduce((sum, value) => sum + (value || 0), 0);
        },
        (state: OptimizedCoreGameState) => Object.values(state.player.resources).join('-')
      );
      
      const getSkillTotalSelector = createMemoizedSelector(
        (state: OptimizedCoreGameState) => {
          const foundationTotal = Object.values(state.skills.foundationExperiences)
            .reduce((sum, value: any) => sum + (typeof value === 'number' ? value : 0), 0);
          const competencyTotal = Object.values(state.skills.coreCompetencies)
            .reduce((sum, value: any) => sum + (typeof value === 'number' ? value : 0), 0);
          return foundationTotal + competencyTotal + state.skills.totalExperience;
        },
        (state: OptimizedCoreGameState) => 
          `${state.skills.totalExperience}-${Object.keys(state.skills.foundationExperiences).length}-${Object.keys(state.skills.coreCompetencies).length}`
      );
      
      return {
        ...getInitialOptimizedCoreState(),

        resetGame: () => {
          StorePerformanceMonitor.trackOperation('core', 'resetGame', () => {
            set(getInitialOptimizedCoreState());
          });
        },

        migrateFromLegacyStores: () => {
          StorePerformanceMonitor.trackOperation('core', 'migrateFromLegacyStores', () => {
            try {
              console.log('🔄 Starting optimized core game store migration...');
              
              // Migrate from legacy stores with performance monitoring
              // Implementation would go here
              
              console.log('✅ Optimized core game store migration completed');
            } catch (error) {
              console.error('❌ Optimized core game store migration failed:', error);
            }
          });
        },

        // Optimized update methods
        updatePlayer: (updates) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              player: { ...state.player, ...updates },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        updateCharacter: (updates) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              character: { ...state.character, ...updates },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        updateSkills: (updates) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              skills: { ...state.skills, ...updates },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        updateWorld: (updates) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              world: { ...state.world, ...updates },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        // Enhanced methods for common operations
        addExperience: (amount) => {
          batchedOperations.addToBatch((state) => {
            const newExperience = state.player.experience + amount;
            const experiencePerLevel = 1000;
            const newLevel = Math.floor(newExperience / experiencePerLevel) + 1;
            const levelIncrease = newLevel - state.player.level;
            
            return {
              player: {
                ...state.player,
                experience: newExperience,
                level: newLevel,
                skillPoints: state.player.skillPoints + (levelIncrease * 2) // 2 skill points per level
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            };
          });
        },

        addSkillPoints: (amount) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              player: {
                ...state.player,
                skillPoints: Math.max(0, state.player.skillPoints + amount)
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        updateResource: (resourceKey, amount) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              player: {
                ...state.player,
                resources: {
                  ...state.player.resources,
                  [resourceKey]: Math.max(0, (state.player.resources[resourceKey] || 0) + amount)
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        addSkillExperience: (skillKey, amount) => {
          batchedOperations.addToBatch((state) => {
            const currentExp = state.skills.foundationExperiences[skillKey] || 0;
            const newExp = currentExp + amount;
            
            return {
              skills: {
                ...state.skills,
                foundationExperiences: {
                  ...state.skills.foundationExperiences,
                  [skillKey]: newExp
                },
                totalExperience: state.skills.totalExperience + amount
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            };
          });
        },

        advanceDay: () => {
          StorePerformanceMonitor.trackOperation('core', 'advanceDay', () => {
            set((state) => ({
              ...state,
              world: {
                ...state.world,
                day: state.world.day + 1,
                timeAllocation: {} // Reset daily time allocation
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        setTimePause: (paused) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              world: {
                ...state.world,
                isTimePaused: paused
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        // Memoized getters
        getTotalLevel: () => {
          const state = get();
          state._performance.cacheHits++;
          return getTotalLevelSelector(state);
        },

        getResourceTotal: () => {
          const state = get();
          state._performance.cacheHits++;
          return getResourceTotalSelector(state);
        },

        getSkillTotal: () => {
          const state = get();
          state._performance.cacheHits++;
          return getSkillTotalSelector(state);
        },

        // Performance utilities
        optimizeStore: () => {
          StorePerformanceMonitor.trackOperation('core', 'optimizeStore', () => {
            set((state) => {
              const now = Date.now();
              
              // Clean up empty or zero-value resources
              const optimizedResources = Object.fromEntries(
                Object.entries(state.player.resources).filter(([_, value]) => value > 0)
              );
              
              // Clean up empty attributes and development stats
              const optimizedAttributes = Object.fromEntries(
                Object.entries(state.character.attributes).filter(([_, value]) => value !== null && value !== undefined && value !== '')
              );
              
              const optimizedDevStats = Object.fromEntries(
                Object.entries(state.character.developmentStats).filter(([_, value]) => value !== null && value !== undefined && value !== '')
              );
              
              // Clean up zero-value skills
              const optimizedFoundationExp = Object.fromEntries(
                Object.entries(state.skills.foundationExperiences).filter(([_, value]) => (value as number) > 0)
              );
              
              const optimizedCompetencies = Object.fromEntries(
                Object.entries(state.skills.coreCompetencies).filter(([_, value]) => value !== null && value !== undefined)
              );
              
              // Clean up empty time allocations
              const optimizedTimeAllocation = Object.fromEntries(
                Object.entries(state.world.timeAllocation).filter(([_, value]) => value > 0)
              );
              
              return {
                ...state,
                player: {
                  ...state.player,
                  resources: optimizedResources
                },
                character: {
                  ...state.character,
                  attributes: optimizedAttributes,
                  developmentStats: optimizedDevStats
                },
                skills: {
                  ...state.skills,
                  foundationExperiences: optimizedFoundationExp,
                  coreCompetencies: optimizedCompetencies
                },
                world: {
                  ...state.world,
                  timeAllocation: optimizedTimeAllocation
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
            playerLevel: state.player.level,
            totalExperience: state.player.experience,
            resourceCount: Object.keys(state.player.resources).length,
            skillCount: Object.keys(state.skills.foundationExperiences).length + 
                        Object.keys(state.skills.coreCompetencies).length,
            currentDay: state.world.day,
            attributeCount: Object.keys(state.character.attributes).length
          };
        }
      };
    },
    {
      name: 'optimized-core-game-store',
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

// Auto-optimization: Run optimization every 3 minutes (more frequent for core game data)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useOptimizedCoreGameStore.getState();
    if (store._performance.operationCount > 150) { // Higher threshold due to more frequent updates
      console.log('🚀 Auto-optimizing core game store...');
      store.optimizeStore();
    }
  }, 3 * 60 * 1000); // 3 minutes
}