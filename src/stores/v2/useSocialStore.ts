// /Users/montysharma/V11M2/src/stores/v2/useSocialStore.ts
// Consolidated store for NPC relationships, clue discovery, and save system

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../../utils/debouncedStorage';
import type { Clue } from '../../types/clue';

// Store versioning for migration handling
const CURRENT_VERSION = 1;

export interface SocialState {
  npcs: {
    relationships: Record<string, number>;
    interactionHistory: Record<string, any[]>;
    memories: Record<string, any>;
    flags: Record<string, any>; // from npc-store
  };
  clues: {
    discovered: Clue[];
    connections: Record<string, string[]>;
    storyArcs: Record<string, string[]>;
    discoveryEvents: any[]; // from clue-store
  };
  saves: {
    // Integrate save system metadata from useSaveStore
    currentSaveId: string | null;
    saveSlots: Record<string, any>;
    saveHistory: any[];
  };
  
  // Actions
  resetSocial: () => void;
  migrateFromLegacyStores: () => void;
  
  // NPC management
  updateRelationship: (npcId: string, change: number) => void;
  recordNPCInteraction: (npcId: string, interaction: any) => void;
  setNPCMemory: (npcId: string, memory: any) => void;
  setNPCFlag: (npcId: string, flag: string, value: any) => void;
  
  // Clue management
  discoverClue: (clue: Clue) => void;
  connectClues: (clueId1: string, clueId2: string) => void;
  associateClueWithArc: (clueId: string, arcId: string) => void;
  recordClueDiscoveryEvent: (event: any) => void;
  
  // Save management
  setCurrentSave: (saveId: string | null) => void;
  createSaveSlot: (saveId: string, saveData: any) => void;
  updateSaveSlot: (saveId: string, saveData: any) => void;
  deleteSaveSlot: (saveId: string) => void;
  loadSaveSlot: (saveId: string) => void;
  addSaveHistoryEntry: (entry: any) => void;
}

const getInitialSocialState = (): Omit<SocialState, 
  'resetSocial' | 'migrateFromLegacyStores' |
  'updateRelationship' | 'recordNPCInteraction' | 'setNPCMemory' | 'setNPCFlag' |
  'discoverClue' | 'connectClues' | 'associateClueWithArc' | 'recordClueDiscoveryEvent' |
  'setCurrentSave' | 'createSaveSlot' | 'updateSaveSlot' | 'deleteSaveSlot' | 'loadSaveSlot' | 'addSaveHistoryEntry'
> => ({
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
    discoveryEvents: []
  },
  saves: {
    currentSaveId: null,
    saveSlots: {},
    saveHistory: []
  }
});

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      ...getInitialSocialState(),

      resetSocial: () => set(getInitialSocialState()),

      migrateFromLegacyStores: () => {
        console.log('🔄 Migrating data from legacy stores to Social Store...');
        
        try {
          // Migrate from useNPCStore
          const legacyNPCStore = (window as any).useNPCStore?.getState();
          if (legacyNPCStore) {
            set((state) => ({
              ...state,
              npcs: {
                ...state.npcs,
                relationships: legacyNPCStore.relationships || {},
                flags: legacyNPCStore.flags || {},
                memories: legacyNPCStore.memories || {},
                interactionHistory: legacyNPCStore.interactionHistory || {}
              }
            }));
          }

          // Migrate from useClueStore
          const legacyClueStore = (window as any).useClueStore?.getState();
          if (legacyClueStore) {
            set((state) => ({
              ...state,
              clues: {
                ...state.clues,
                discovered: legacyClueStore.discoveredClues || [],
                connections: legacyClueStore.connections || {},
                storyArcs: legacyClueStore.storyArcs || {},
                discoveryEvents: legacyClueStore.discoveryEvents || []
              }
            }));
          }

          // Migrate from useSaveStore
          const legacySaveStore = (window as any).useSaveStore?.getState();
          if (legacySaveStore) {
            set((state) => ({
              ...state,
              saves: {
                ...state.saves,
                currentSaveId: legacySaveStore.currentSaveId || null,
                saveSlots: legacySaveStore.saveSlots || {},
                saveHistory: legacySaveStore.saveHistory || []
              }
            }));
          }

          console.log('✅ Social Store migration completed');
        } catch (error) {
          console.error('❌ Social Store migration failed:', error);
        }
      },

      // NPC management
      updateRelationship: (npcId, change) => {
        set((state) => {
          const currentLevel = state.npcs.relationships[npcId] || 0;
          const newLevel = currentLevel + change;
          
          // Record the interaction
          const interaction = {
            type: 'relationship_change',
            change,
            newLevel,
            timestamp: Date.now()
          };
          
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
                [npcId]: [...(state.npcs.interactionHistory[npcId] || []), interaction]
              }
            }
          };
        });
      },

      recordNPCInteraction: (npcId, interaction) => {
        set((state) => ({
          ...state,
          npcs: {
            ...state.npcs,
            interactionHistory: {
              ...state.npcs.interactionHistory,
              [npcId]: [...(state.npcs.interactionHistory[npcId] || []), {
                ...interaction,
                timestamp: Date.now()
              }]
            }
          }
        }));
      },

      setNPCMemory: (npcId, memory) => {
        set((state) => ({
          ...state,
          npcs: {
            ...state.npcs,
            memories: {
              ...state.npcs.memories,
              [npcId]: memory
            }
          }
        }));
      },

      setNPCFlag: (npcId, flag, value) => {
        set((state) => ({
          ...state,
          npcs: {
            ...state.npcs,
            flags: {
              ...state.npcs.flags,
              [`${npcId}.${flag}`]: value
            }
          }
        }));
      },

      // Clue management
      discoverClue: (clue) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const discoveredArray = Array.isArray(state.clues?.discovered) ? state.clues.discovered : [];
          const discoveryEventsArray = Array.isArray(state.clues?.discoveryEvents) ? state.clues.discoveryEvents : [];
          
          // Check if clue is already discovered
          const alreadyDiscovered = discoveredArray.some(c => c.id === clue.id);
          if (alreadyDiscovered) {
            return state;
          }

          const discoveryEvent = {
            clueId: clue.id,
            clueName: clue.name,
            timestamp: Date.now(),
            discoveryMethod: clue.discoveryMethod || 'unknown'
          };

          return {
            ...state,
            clues: {
              ...state.clues,
              discovered: [...discoveredArray, clue],
              discoveryEvents: [...discoveryEventsArray, discoveryEvent]
            }
          };
        });
      },

      connectClues: (clueId1, clueId2) => {
        set((state) => ({
          ...state,
          clues: {
            ...state.clues,
            connections: {
              ...state.clues.connections,
              [clueId1]: [...(state.clues.connections[clueId1] || []), clueId2],
              [clueId2]: [...(state.clues.connections[clueId2] || []), clueId1]
            }
          }
        }));
      },

      associateClueWithArc: (clueId, arcId) => {
        set((state) => ({
          ...state,
          clues: {
            ...state.clues,
            storyArcs: {
              ...state.clues.storyArcs,
              [arcId]: [...(state.clues.storyArcs[arcId] || []), clueId]
            }
          }
        }));
      },

      recordClueDiscoveryEvent: (event) => {
        set((state) => ({
          ...state,
          clues: {
            ...state.clues,
            discoveryEvents: [...state.clues.discoveryEvents, {
              ...event,
              timestamp: Date.now()
            }]
          }
        }));
      },

      // Save management
      setCurrentSave: (saveId) => {
        set((state) => ({
          ...state,
          saves: {
            ...state.saves,
            currentSaveId: saveId
          }
        }));
      },

      createSaveSlot: (saveId, saveData) => {
        // Capture complete game state from all v2 stores
        const coreGameState = useCoreGameStore.getState();
        const narrativeState = useNarrativeStore.getState();
        const currentSocialState = get();
        
        const completeSaveData = {
          id: saveId,
          ...saveData,
          created: Date.now(),
          lastModified: Date.now(),
          // Store complete game state for full restoration
          gameState: {
            core: coreGameState,
            narrative: narrativeState,
            social: {
              ...currentSocialState,
              // Don't include saves in the saved state to avoid recursion
              saves: undefined
            }
          }
        };
        
        set((state) => {
          // Defensive programming: ensure arrays exist
          const saveHistoryArray = Array.isArray(state.saves?.saveHistory) ? state.saves.saveHistory : [];
          
          const historyEntry = {
            action: 'create',
            saveId,
            timestamp: Date.now()
          };

          return {
            ...state,
            saves: {
              ...state.saves,
              saveSlots: {
                ...state.saves.saveSlots,
                [saveId]: completeSaveData
              },
              currentSaveId: saveId,
              saveHistory: [...saveHistoryArray, historyEntry]
            }
          };
        });
        
        console.log(`✅ Save slot ${saveId} created with complete game state`);
      },

      updateSaveSlot: (saveId, saveData) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const saveHistoryArray = Array.isArray(state.saves?.saveHistory) ? state.saves.saveHistory : [];
          
          const existingSlot = state.saves.saveSlots[saveId];
          if (!existingSlot) {
            console.error(`Cannot update save slot ${saveId} - slot not found`);
            return state;
          }
          
          // For auto-save updates, capture current game state
          let updatedGameState = existingSlot.gameState;
          if (saveData.autoSave) {
            const coreGameState = useCoreGameStore.getState();
            const narrativeState = useNarrativeStore.getState();
            const currentSocialState = get();
            
            updatedGameState = {
              core: coreGameState,
              narrative: narrativeState,
              social: {
                ...currentSocialState,
                saves: undefined // Avoid recursion
              }
            };
          }
          
          const historyEntry = {
            action: 'update',
            saveId,
            timestamp: Date.now()
          };

          return {
            ...state,
            saves: {
              ...state.saves,
              saveSlots: {
                ...state.saves.saveSlots,
                [saveId]: {
                  ...existingSlot,
                  ...saveData,
                  lastModified: Date.now(),
                  gameState: updatedGameState
                }
              },
              saveHistory: [...saveHistoryArray, historyEntry]
            }
          };
        });
      },

      deleteSaveSlot: (saveId) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const saveHistoryArray = Array.isArray(state.saves?.saveHistory) ? state.saves.saveHistory : [];
          
          const { [saveId]: deletedSave, ...remainingSaves } = state.saves.saveSlots;
          
          const historyEntry = {
            action: 'delete',
            saveId,
            timestamp: Date.now()
          };

          return {
            ...state,
            saves: {
              ...state.saves,
              saveSlots: remainingSaves,
              currentSaveId: state.saves.currentSaveId === saveId ? null : state.saves.currentSaveId,
              saveHistory: [...saveHistoryArray, historyEntry]
            }
          };
        });
      },

      loadSaveSlot: (saveId) => {
        const state = get();
        const saveData = state.saves.saveSlots[saveId];
        
        if (!saveData) {
          console.error(`Save slot ${saveId} not found`);
          return;
        }
        
        if (!saveData.gameState) {
          console.error(`Save slot ${saveId} has no game state data - cannot restore`);
          return;
        }
        
        console.log(`🔄 Loading save slot: ${saveId} with full game state restoration`, saveData.name);
        
        try {
          // Restore complete game state across all v2 stores
          if (saveData.gameState.core) {
            useCoreGameStore.setState(saveData.gameState.core);
            console.log('✅ Core game state restored');
          }
          
          if (saveData.gameState.narrative) {
            useNarrativeStore.setState(saveData.gameState.narrative);
            console.log('✅ Narrative state restored');
          }
          
          if (saveData.gameState.social) {
            // Restore social state but preserve current save management
            const currentSaves = get().saves;
            set({
              ...saveData.gameState.social,
              saves: {
                ...currentSaves,
                currentSaveId: saveId
              }
            });
            console.log('✅ Social state restored');
          }
          
          // Add history entry
          const historyEntry = {
            action: 'load',
            saveId,
            timestamp: Date.now()
          };
          
          set((state) => ({
            ...state,
            saves: {
              ...state.saves,
              currentSaveId: saveId,
              saveHistory: [...(state.saves.saveHistory || []), historyEntry]
            }
          }));
          
          console.log(`✅ Save slot ${saveId} loaded successfully with complete state restoration`);
          
        } catch (error) {
          console.error(`❌ Failed to load save slot ${saveId}:`, error);
          throw error;
        }
      },

      addSaveHistoryEntry: (entry) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const saveHistoryArray = Array.isArray(state.saves?.saveHistory) ? state.saves.saveHistory : [];
          
          return {
            ...state,
            saves: {
              ...state.saves,
              saveHistory: [...saveHistoryArray, {
                ...entry,
                timestamp: Date.now()
              }]
            }
          };
        });
      }
    }),
    {
      name: 'mmv-social-store',
      version: CURRENT_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      migrate: (persistedState: any, version: number) => {
        console.log(`[SocialStore] Migrating from version ${version} to ${CURRENT_VERSION}`);
        
        // Handle unversioned saves (version 0 or undefined)
        if (!version || version === 0) {
          console.log('[SocialStore] Detected unversioned save, applying defaults and preserving data');
          const defaultState = getInitialSocialState();
          
          // Merge persisted data with defaults, preserving any existing values
          return {
            ...defaultState,
            ...persistedState,
            // Ensure nested objects are properly merged
            npcs: { 
              ...defaultState.npcs, 
              ...(persistedState.npcs || {}),
              relationships: { ...defaultState.npcs.relationships, ...(persistedState.npcs?.relationships || {}) },
              interactionHistory: { ...defaultState.npcs.interactionHistory, ...(persistedState.npcs?.interactionHistory || {}) },
              memories: { ...defaultState.npcs.memories, ...(persistedState.npcs?.memories || {}) },
              flags: { ...defaultState.npcs.flags, ...(persistedState.npcs?.flags || {}) }
            },
            clues: { 
              ...defaultState.clues, 
              ...(persistedState.clues || {}),
              discovered: Array.isArray(persistedState.clues?.discovered) ? persistedState.clues.discovered : [],
              connections: { ...defaultState.clues.connections, ...(persistedState.clues?.connections || {}) },
              storyArcs: { ...defaultState.clues.storyArcs, ...(persistedState.clues?.storyArcs || {}) },
              discoveryEvents: Array.isArray(persistedState.clues?.discoveryEvents) ? persistedState.clues.discoveryEvents : []
            },
            saves: { 
              ...defaultState.saves, 
              ...(persistedState.saves || {}),
              saveSlots: { ...defaultState.saves.saveSlots, ...(persistedState.saves?.saveSlots || {}) },
              saveHistory: Array.isArray(persistedState.saves?.saveHistory) ? persistedState.saves.saveHistory : []
            }
          };
        }
        
        // Future version migrations go here
        // if (version === 1) {
        //   // Migrate from v1 to v2
        //   return migrateV1ToV2(persistedState);
        // }
        
        return persistedState;
      },
      partialize: (state) => ({
        // Only persist data, not action functions
        npcs: state.npcs,
        clues: state.clues,
        saves: state.saves
      })
    }
  )
);