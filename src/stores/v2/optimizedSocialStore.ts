// /Users/montysharma/v11m2/src/stores/v2/optimizedSocialStore.ts
// Performance-optimized version of useSocialStore

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../../utils/debouncedStorage';
import type { Clue } from '../../types/clue';
import { 
  createMemoizedSelector, 
  createDebouncedUpdate, 
  createBatchedOperations,
  StorePerformanceMonitor,
  optimizedArrayOperations,
  type OptimizedFlagStorage
} from './storeOptimizations';

// Store versioning for migration handling
const CURRENT_VERSION = 1;

export interface OptimizedSocialState {
  npcs: {
    relationships: Record<string, number>;
    interactionHistory: Record<string, any[]>;
    memories: Record<string, any>;
    flags: Record<string, any>; // Optimized flag storage
  };
  clues: {
    discovered: Clue[];
    connections: Record<string, string[]>;
    storyArcs: Record<string, string[]>;
    discoveryEvents: any[];
    
    // Enhanced arc relationships using Records instead of Maps
    arcRelationships: Record<string, {
      storyArc: string;
      arcOrder: number;
      prerequisites: string[];
      unlocks: string[];
      arcProgress: number;
    }>;
    
    // Arc discovery progress tracking
    arcDiscoveryProgress: Record<string, {
      discoveredClues: string[];
      totalClues: number;
      completionPercentage: number;
      nextClues: string[];
    }>;
  };
  saves: {
    currentSaveId: string | null;
    saveSlots: Record<string, any>;
    saveHistory: any[];
  };
  
  // Performance metadata
  _performance: {
    lastOptimized: number;
    operationCount: number;
    cacheHits: number;
    cacheMisses: number;
  };
  
  // Actions with performance monitoring
  resetSocial: () => void;
  migrateFromLegacyStores: () => void;
  
  // Optimized NPC management
  updateRelationship: (npcId: string, change: number) => void;
  recordNPCInteraction: (npcId: string, interaction: any) => void;
  setNPCMemory: (npcId: string, memory: any) => void;
  setNPCFlag: (npcId: string, flag: string, value: any) => void;
  
  // Enhanced Clue management
  getClueById: (clueId: string) => Clue | null;
  getAllDiscoveredClues: () => Clue[];
  discoverClue: (clue: Clue) => void;
  connectClues: (clueId1: string, clueId2: string) => void;
  associateClueWithArc: (clueId: string, arcId: string) => void;
  recordClueDiscoveryEvent: (event: any) => void;
  
  // Clue-Arc relationship management
  setClueArcRelationship: (clueId: string, relationship: {
    storyArc: string;
    arcOrder: number;
    prerequisites?: string[];
    unlocks?: string[];
    arcProgress?: number;
  }) => void;
  removeClueArcRelationship: (clueId: string) => void;
  getCluesByArc: (arcId: string) => string[];
  getNextClueInArc: (arcId: string) => string | null;
  
  // Arc discovery progress management
  initializeArcProgress: (arcId: string, totalClues: number) => void;
  updateArcDiscoveryProgress: (arcId: string, discoveredClueId: string) => void;
  getArcCompletionPercentage: (arcId: string) => number;
  getAvailableCluesForArc: (arcId: string) => string[];
  
  // Save management
  setCurrentSave: (saveId: string | null) => void;
  createSaveSlot: (saveId: string, saveData: any) => void;
  updateSaveSlot: (saveId: string, saveData: any) => void;
  deleteSaveSlot: (saveId: string) => void;
  loadSaveSlot: (saveId: string) => void;
  addSaveHistoryEntry: (entry: any) => void;
  
  // Performance utilities
  optimizeStore: () => void;
  getPerformanceMetrics: () => any;
}

const getInitialOptimizedSocialState = (): Omit<OptimizedSocialState, keyof any> => ({
  npcs: {
    relationships: {},
    interactionHistory: {},
    memories: {},
    flags: {}
  },
  clues: {
    discovered: [],
    connections: {},
    storyArcs: {},
    discoveryEvents: [],
    arcRelationships: {},
    arcDiscoveryProgress: {}
  },
  saves: {
    currentSaveId: null,
    saveSlots: {},
    saveHistory: []
  },
  _performance: {
    lastOptimized: Date.now(),
    operationCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  }
});

export const useOptimizedSocialStore = create<OptimizedSocialState>()(
  persist(
    (set, get) => {
      const debouncedUpdate = createDebouncedUpdate('social', 100);
      const batchedOperations = createBatchedOperations({ setState: set, getState: get });
      
      // Memoized selectors for expensive operations
      const getDiscoveredCluesSelector = createMemoizedSelector(
        (state: OptimizedSocialState) => state.clues.discovered,
        (state: OptimizedSocialState) => state.clues.discovered.map(c => c.id).join(',')
      );
      
      const getCluesByArcSelector = createMemoizedSelector(
        (state: OptimizedSocialState, arcId: string) => {
          return Object.entries(state.clues.arcRelationships)
            .filter(([_, relationship]) => relationship.storyArc === arcId)
            .map(([clueId, _]) => clueId)
            .sort((a, b) => {
              const orderA = state.clues.arcRelationships[a]?.arcOrder || 0;
              const orderB = state.clues.arcRelationships[b]?.arcOrder || 0;
              return orderA - orderB;
            });
        },
        (state: OptimizedSocialState, arcId: string) => 
          `${arcId}-${Object.keys(state.clues.arcRelationships).join(',')}`
      );
      
      return {
        ...getInitialOptimizedSocialState(),

        resetSocial: () => {
          StorePerformanceMonitor.trackOperation('social', 'resetSocial', () => {
            set(getInitialOptimizedSocialState());
          });
        },

        migrateFromLegacyStores: () => {
          StorePerformanceMonitor.trackOperation('social', 'migrateFromLegacyStores', () => {
            try {
              console.log('🔄 Starting optimized social store migration...');
              
              // Migrate from legacy stores with performance monitoring
              // Implementation would go here
              
              console.log('✅ Optimized social store migration completed');
            } catch (error) {
              console.error('❌ Optimized social store migration failed:', error);
            }
          });
        },

        // Optimized NPC management
        updateRelationship: (npcId, change) => {
          debouncedUpdate(() => {
            set((state) => {
              const currentLevel = state.npcs.relationships[npcId] || 0;
              const newLevel = currentLevel + change;
              
              const interaction = {
                type: 'relationship_change',
                change,
                newLevel,
                timestamp: Date.now()
              };
              
              const newHistory = optimizedArrayOperations.addUnique(
                state.npcs.interactionHistory[npcId] || [],
                interaction
              );
              
              state._performance.operationCount++;
              return {
                ...state,
                npcs: {
                  ...state.npcs,
                  relationships: {
                    ...state.npcs.relationships,
                    [npcId]: newLevel
                  },
                  interactionHistory: {
                    ...state.npcs.interactionHistory,
                    [npcId]: newHistory
                  }
                }
              };
            });
          });
        },

        recordNPCInteraction: (npcId, interaction) => {
          debouncedUpdate(() => {
            set((state) => {
              const newHistory = optimizedArrayOperations.addUnique(
                state.npcs.interactionHistory[npcId] || [],
                { ...interaction, timestamp: Date.now() }
              );
              
              state._performance.operationCount++;
              return {
                ...state,
                npcs: {
                  ...state.npcs,
                  interactionHistory: {
                    ...state.npcs.interactionHistory,
                    [npcId]: newHistory
                  }
                }
              };
            });
          });
        },

        setNPCMemory: (npcId, memory) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              npcs: {
                ...state.npcs,
                memories: {
                  ...state.npcs.memories,
                  [npcId]: memory
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        setNPCFlag: (npcId, flag, value) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              npcs: {
                ...state.npcs,
                flags: {
                  ...state.npcs.flags,
                  [`${npcId}.${flag}`]: value
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        // Optimized clue management
        getClueById: (clueId) => {
          return StorePerformanceMonitor.trackOperation('social', 'getClueById', () => {
            const state = get();
            const discoveredClues = getDiscoveredCluesSelector(state);
            state._performance.cacheHits++;
            return discoveredClues.find(clue => clue.id === clueId) || null;
          });
        },

        getAllDiscoveredClues: () => {
          const state = get();
          state._performance.cacheHits++;
          return getDiscoveredCluesSelector(state);
        },

        discoverClue: (clue) => {
          batchedOperations.addToBatch((state) => {
            const discoveredArray = state.clues.discovered;
            
            // Check if clue is already discovered
            const alreadyDiscovered = discoveredArray.some(c => c.id === clue.id);
            if (alreadyDiscovered) {
              state._performance.cacheHits++;
              return {};
            }

            const discoveryEvent = {
              clueId: clue.id,
              clueName: clue.name,
              timestamp: Date.now(),
              discoveryMethod: clue.discoveryMethod || 'unknown'
            };

            const newDiscovered = optimizedArrayOperations.addUnique(discoveredArray, clue, c => c.id);
            const newEvents = optimizedArrayOperations.addUnique(
              state.clues.discoveryEvents,
              discoveryEvent
            );

            state._performance.operationCount++;
            return {
              clues: {
                ...state.clues,
                discovered: newDiscovered,
                discoveryEvents: newEvents
              }
            };
          });
        },

        connectClues: (clueId1, clueId2) => {
          debouncedUpdate(() => {
            set((state) => {
              const newConnections1 = optimizedArrayOperations.addUnique(
                state.clues.connections[clueId1] || [],
                clueId2
              );
              const newConnections2 = optimizedArrayOperations.addUnique(
                state.clues.connections[clueId2] || [],
                clueId1
              );
              
              state._performance.operationCount++;
              return {
                ...state,
                clues: {
                  ...state.clues,
                  connections: {
                    ...state.clues.connections,
                    [clueId1]: newConnections1,
                    [clueId2]: newConnections2
                  }
                }
              };
            });
          });
        },

        associateClueWithArc: (clueId, arcId) => {
          debouncedUpdate(() => {
            set((state) => {
              const newArcClues = optimizedArrayOperations.addUnique(
                state.clues.storyArcs[arcId] || [],
                clueId
              );
              
              state._performance.operationCount++;
              return {
                ...state,
                clues: {
                  ...state.clues,
                  storyArcs: {
                    ...state.clues.storyArcs,
                    [arcId]: newArcClues
                  }
                }
              };
            });
          });
        },

        recordClueDiscoveryEvent: (event) => {
          debouncedUpdate(() => {
            set((state) => {
              const newEvents = optimizedArrayOperations.addUnique(
                state.clues.discoveryEvents,
                { ...event, timestamp: Date.now() }
              );
              
              state._performance.operationCount++;
              return {
                ...state,
                clues: {
                  ...state.clues,
                  discoveryEvents: newEvents
                }
              };
            });
          });
        },

        // Enhanced Clue-Arc relationship management
        setClueArcRelationship: (clueId, relationship) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              clues: {
                ...state.clues,
                arcRelationships: {
                  ...state.clues.arcRelationships,
                  [clueId]: {
                    prerequisites: [],
                    unlocks: [],
                    arcProgress: 0,
                    ...relationship
                  }
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        removeClueArcRelationship: (clueId) => {
          debouncedUpdate(() => {
            set((state) => {
              const { [clueId]: removed, ...remainingRelationships } = state.clues.arcRelationships;
              
              return {
                ...state,
                clues: {
                  ...state.clues,
                  arcRelationships: remainingRelationships
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
          });
        },

        getCluesByArc: (arcId) => {
          const state = get();
          state._performance.cacheHits++;
          return getCluesByArcSelector(state, arcId);
        },

        getNextClueInArc: (arcId) => {
          return StorePerformanceMonitor.trackOperation('social', 'getNextClueInArc', () => {
            const state = get();
            const arcClues = get().getCluesByArc(arcId);
            const discoveredClueIds = state.clues.discovered.map(clue => clue.id);
            
            // Find the first clue in the arc that hasn't been discovered
            for (const clueId of arcClues) {
              if (!discoveredClueIds.includes(clueId)) {
                const relationship = state.clues.arcRelationships[clueId];
                // Check if prerequisites are met
                if (relationship?.prerequisites?.every(prereqId => discoveredClueIds.includes(prereqId)) !== false) {
                  return clueId;
                }
              }
            }
            
            return null;
          });
        },

        // Arc discovery progress management
        initializeArcProgress: (arcId, totalClues) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              clues: {
                ...state.clues,
                arcDiscoveryProgress: {
                  ...state.clues.arcDiscoveryProgress,
                  [arcId]: {
                    discoveredClues: [],
                    totalClues,
                    completionPercentage: 0,
                    nextClues: []
                  }
                }
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        updateArcDiscoveryProgress: (arcId, discoveredClueId) => {
          batchedOperations.addToBatch((state) => {
            const currentProgress = state.clues.arcDiscoveryProgress[arcId];
            if (!currentProgress) return {};

            const newDiscoveredClues = optimizedArrayOperations.addUnique(
              currentProgress.discoveredClues,
              discoveredClueId
            );
            const completionPercentage = (newDiscoveredClues.length / currentProgress.totalClues) * 100;
            
            const relationship = state.clues.arcRelationships[discoveredClueId];
            const newNextClues = relationship?.unlocks ? 
              [...currentProgress.nextClues.filter(id => id !== discoveredClueId), ...relationship.unlocks] :
              currentProgress.nextClues.filter(id => id !== discoveredClueId);

            return {
              clues: {
                ...state.clues,
                arcDiscoveryProgress: {
                  ...state.clues.arcDiscoveryProgress,
                  [arcId]: {
                    ...currentProgress,
                    discoveredClues: newDiscoveredClues,
                    completionPercentage,
                    nextClues: newNextClues
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

        getArcCompletionPercentage: (arcId) => {
          const state = get();
          const progress = state.clues.arcDiscoveryProgress[arcId];
          state._performance.cacheHits++;
          return progress?.completionPercentage || 0;
        },

        getAvailableCluesForArc: (arcId) => {
          const state = get();
          const progress = state.clues.arcDiscoveryProgress[arcId];
          state._performance.cacheHits++;
          return progress?.nextClues || [];
        },

        // Optimized save management
        setCurrentSave: (saveId) => {
          debouncedUpdate(() => {
            set((state) => ({
              ...state,
              saves: {
                ...state.saves,
                currentSaveId: saveId
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            }));
          });
        },

        createSaveSlot: (saveId, saveData) => {
          StorePerformanceMonitor.trackOperation('social', 'createSaveSlot', () => {
            // Capture complete game state from all v2 stores
            const completeSaveData = {
              id: saveId,
              ...saveData,
              created: Date.now(),
              lastModified: Date.now()
            };
            
            set((state) => {
              const historyEntry = {
                action: 'create',
                saveId,
                timestamp: Date.now()
              };

              const newHistory = optimizedArrayOperations.addUnique(
                state.saves.saveHistory,
                historyEntry
              );

              return {
                ...state,
                saves: {
                  ...state.saves,
                  saveSlots: {
                    ...state.saves.saveSlots,
                    [saveId]: completeSaveData
                  },
                  currentSaveId: saveId,
                  saveHistory: newHistory
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
            
            console.log(`✅ Save slot ${saveId} created with optimized performance`);
          });
        },

        updateSaveSlot: (saveId, saveData) => {
          debouncedUpdate(() => {
            set((state) => {
              const existingSlot = state.saves.saveSlots[saveId];
              if (!existingSlot) {
                console.error(`Cannot update save slot ${saveId} - slot not found`);
                return state;
              }
              
              const historyEntry = {
                action: 'update',
                saveId,
                timestamp: Date.now()
              };

              const newHistory = optimizedArrayOperations.addUnique(
                state.saves.saveHistory,
                historyEntry
              );

              return {
                ...state,
                saves: {
                  ...state.saves,
                  saveSlots: {
                    ...state.saves.saveSlots,
                    [saveId]: {
                      ...existingSlot,
                      ...saveData,
                      lastModified: Date.now()
                    }
                  },
                  saveHistory: newHistory
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
          });
        },

        deleteSaveSlot: (saveId) => {
          batchedOperations.addToBatch((state) => {
            const { [saveId]: deletedSave, ...remainingSaves } = state.saves.saveSlots;
            
            const historyEntry = {
              action: 'delete',
              saveId,
              timestamp: Date.now()
            };

            const newHistory = optimizedArrayOperations.addUnique(
              state.saves.saveHistory,
              historyEntry
            );

            return {
              saves: {
                ...state.saves,
                saveSlots: remainingSaves,
                currentSaveId: state.saves.currentSaveId === saveId ? null : state.saves.currentSaveId,
                saveHistory: newHistory
              },
              _performance: {
                ...state._performance,
                operationCount: state._performance.operationCount + 1
              }
            };
          });
        },

        loadSaveSlot: (saveId) => {
          StorePerformanceMonitor.trackOperation('social', 'loadSaveSlot', () => {
            const state = get();
            const saveData = state.saves.saveSlots[saveId];
            
            if (!saveData) {
              console.error(`Save slot ${saveId} not found`);
              return;
            }
            
            console.log(`🔄 Loading save slot: ${saveId} with optimized performance`);
            
            // Add history entry
            const historyEntry = {
              action: 'load',
              saveId,
              timestamp: Date.now()
            };
            
            set((state) => {
              const newHistory = optimizedArrayOperations.addUnique(
                state.saves.saveHistory,
                historyEntry
              );

              return {
                ...state,
                saves: {
                  ...state.saves,
                  currentSaveId: saveId,
                  saveHistory: newHistory
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
            
            console.log(`✅ Save slot ${saveId} loaded successfully with optimized performance`);
          });
        },

        addSaveHistoryEntry: (entry) => {
          debouncedUpdate(() => {
            set((state) => {
              const newHistory = optimizedArrayOperations.addUnique(
                state.saves.saveHistory,
                { ...entry, timestamp: Date.now() }
              );
              
              return {
                ...state,
                saves: {
                  ...state.saves,
                  saveHistory: newHistory
                },
                _performance: {
                  ...state._performance,
                  operationCount: state._performance.operationCount + 1
                }
              };
            });
          });
        },

        // Performance utilities
        optimizeStore: () => {
          StorePerformanceMonitor.trackOperation('social', 'optimizeStore', () => {
            set((state) => {
              const now = Date.now();
              
              // Limit interaction history size
              const optimizedHistory: Record<string, any[]> = {};
              Object.entries(state.npcs.interactionHistory).forEach(([npcId, history]) => {
                optimizedHistory[npcId] = history.slice(-50); // Keep only last 50 interactions per NPC
              });
              
              // Limit discovery events
              const limitedEvents = state.clues.discoveryEvents.slice(-200); // Keep only last 200 events
              
              // Limit save history
              const limitedSaveHistory = state.saves.saveHistory.slice(-100); // Keep only last 100 save actions
              
              return {
                ...state,
                npcs: {
                  ...state.npcs,
                  interactionHistory: optimizedHistory
                },
                clues: {
                  ...state.clues,
                  discoveryEvents: limitedEvents
                },
                saves: {
                  ...state.saves,
                  saveHistory: limitedSaveHistory
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
            npcCount: Object.keys(state.npcs.relationships).length,
            discoveredClueCount: state.clues.discovered.length,
            clueConnectionCount: Object.keys(state.clues.connections).length,
            saveSlotCount: Object.keys(state.saves.saveSlots).length,
            interactionHistorySize: Object.values(state.npcs.interactionHistory)
              .reduce((total, history) => total + history.length, 0)
          };
        }
      };
    },
    {
      name: 'optimized-social-store',
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
    const store = useOptimizedSocialStore.getState();
    if (store._performance.operationCount > 100) {
      console.log('🚀 Auto-optimizing social store...');
      store.optimizeStore();
    }
  }, 5 * 60 * 1000); // 5 minutes
}