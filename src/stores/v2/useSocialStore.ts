// /Users/montysharma/V11M2/src/stores/v2/useSocialStore.ts
// Consolidated store for NPC relationships, clue discovery, and save system

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Clue } from '../../types/clue';

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
  addSaveHistoryEntry: (entry: any) => void;
}

const getInitialSocialState = (): Omit<SocialState, 
  'resetSocial' | 'migrateFromLegacyStores' |
  'updateRelationship' | 'recordNPCInteraction' | 'setNPCMemory' | 'setNPCFlag' |
  'discoverClue' | 'connectClues' | 'associateClueWithArc' | 'recordClueDiscoveryEvent' |
  'setCurrentSave' | 'createSaveSlot' | 'updateSaveSlot' | 'deleteSaveSlot' | 'addSaveHistoryEntry'
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
                [saveId]: {
                  ...saveData,
                  created: Date.now(),
                  lastModified: Date.now()
                }
              },
              saveHistory: [...saveHistoryArray, historyEntry]
            }
          };
        });
      },

      updateSaveSlot: (saveId, saveData) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const saveHistoryArray = Array.isArray(state.saves?.saveHistory) ? state.saves.saveHistory : [];
          
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
                  ...state.saves.saveSlots[saveId],
                  ...saveData,
                  lastModified: Date.now()
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
      version: 1
    }
  )
);