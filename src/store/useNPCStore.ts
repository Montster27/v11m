// /Users/montysharma/V11M2/src/store/useNPCStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NPC, NPCMemory, RelationshipType, NPCMemoryInput, NPCStatus, NPCStats } from '../types/npc';

interface NPCState {
  // Core data
  npcs: Record<string, NPC>;                    // all NPCs by ID
  
  // Actions - Basic CRUD
  addNPC: (npc: NPC) => void;
  updateNPC: (npcId: string, updates: Partial<NPC>) => void;
  removeNPC: (npcId: string) => void;
  getAllNPCs: () => NPC[];
  getNPC: (npcId: string) => NPC | undefined;
  
  // Relationship management
  adjustRelationship: (npcId: string, delta: number, reason?: string) => void;
  setRelationshipType: (npcId: string, type: RelationshipType) => void;
  getRelationshipLevel: (npcId: string) => number;
  getRelationshipType: (npcId: string) => RelationshipType;
  
  // Memory management
  addMemory: (npcId: string, memory: NPCMemoryInput, storyletId: string, choiceId: string) => void;
  getMemories: (npcId: string) => NPCMemory[];
  getMemoriesBySentiment: (npcId: string, sentiment: "positive" | "neutral" | "negative") => NPCMemory[];
  removeMemory: (npcId: string, memoryId: string) => void;
  
  // Flag management
  setNPCFlag: (npcId: string, flag: string, value: boolean) => void;
  getNPCFlag: (npcId: string, flag: string) => boolean;
  removeNPCFlag: (npcId: string, flag: string) => void;
  
  // Status management
  updateNPCMood: (npcId: string, mood: NPCStatus["mood"], duration?: number) => void;
  updateNPCAvailability: (npcId: string, availability: NPCStatus["availability"], duration?: number) => void;
  updateNPCStatus: (npcId: string, statusUpdates: Partial<NPCStatus>) => void;
  
  // Location and scheduling
  getNPCsByLocation: (locationId: string, currentTime?: Date) => NPC[];
  isNPCAvailableAt: (npcId: string, locationId: string, time?: Date) => boolean;
  
  // Storylet integration
  getNPCsForStorylet: (storyletId: string) => NPC[];
  getStoryletsForNPC: (npcId: string) => string[];
  addStoryletToNPC: (npcId: string, storyletId: string) => void;
  removeStoryletFromNPC: (npcId: string, storyletId: string) => void;
  
  // Utility functions
  searchNPCs: (query: string) => NPC[];
  getNPCsByArc: (storyArc: string) => NPC[];
  getNPCsByRelationshipType: (type: RelationshipType) => NPC[];
  getStats: () => NPCStats;
  
  // Development tools
  resetNPCRelationships: () => void;
  resetNPCMemories: () => void;
  resetAllNPCData: () => void;
  exportNPCData: () => string;
  importNPCData: (data: string) => boolean;
}

export const useNPCStore = create<NPCState>()(
  persist(
    (set, get) => ({
      npcs: {},
      
      // Basic CRUD operations
      addNPC: (npc: NPC) => {
        set((state) => ({
          npcs: {
            ...state.npcs,
            [npc.id]: {
              ...npc,
              memories: npc.memories || [],
              flags: npc.flags || {},
              lastInteraction: new Date()
            }
          }
        }));
      },
      
      updateNPC: (npcId: string, updates: Partial<NPC>) => {
        set((state) => {
          const existingNPC = state.npcs[npcId];
          if (!existingNPC) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...existingNPC,
                ...updates,
                lastInteraction: new Date()
              }
            }
          };
        });
      },
      
      removeNPC: (npcId: string) => {
        set((state) => {
          const { [npcId]: removed, ...rest } = state.npcs;
          return { npcs: rest };
        });
      },
      
      getAllNPCs: () => {
        return Object.values(get().npcs);
      },
      
      getNPC: (npcId: string) => {
        return get().npcs[npcId];
      },
      
      // Relationship management
      adjustRelationship: (npcId: string, delta: number, reason?: string) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          const newLevel = Math.max(0, Math.min(100, npc.relationshipLevel + delta));
          let newType = npc.relationshipType;
          
          // Auto-update relationship type based on level
          if (newLevel >= 90) newType = "dating";
          else if (newLevel >= 80) newType = "romantic_interest";
          else if (newLevel >= 70) newType = "close_friend";
          else if (newLevel >= 60) newType = "friend";
          else if (newLevel >= 40) newType = "acquaintance";
          else if (newLevel <= 20) newType = "rival";
          else if (newLevel <= 10) newType = "enemy";
          else newType = "stranger";
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                relationshipLevel: newLevel,
                relationshipType: newType,
                lastInteraction: new Date()
              }
            }
          };
        });
        
        // Log relationship change if reason provided
        if (reason) {
          console.log(`💕 ${get().npcs[npcId]?.name} relationship ${delta > 0 ? '+' : ''}${delta}: ${reason}`);
        }
      },
      
      setRelationshipType: (npcId: string, type: RelationshipType) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                relationshipType: type,
                lastInteraction: new Date()
              }
            }
          };
        });
      },
      
      getRelationshipLevel: (npcId: string) => {
        return get().npcs[npcId]?.relationshipLevel || 50;
      },
      
      getRelationshipType: (npcId: string) => {
        return get().npcs[npcId]?.relationshipType || "stranger";
      },
      
      // Memory management
      addMemory: (npcId: string, memory: NPCMemoryInput, storyletId: string, choiceId: string) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          const newMemory: NPCMemory = {
            id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            storyletId,
            choiceId,
            ...memory,
            timestamp: new Date()
          };
          
          // Add memory and keep only the most important/recent ones (max 50)
          const updatedMemories = [...npc.memories, newMemory]
            .sort((a, b) => b.importance - a.importance || b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 50);
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                memories: updatedMemories,
                lastInteraction: new Date()
              }
            }
          };
        });
        
        console.log(`🧠 ${get().npcs[npcId]?.name} remembers: ${memory.description}`);
      },
      
      getMemories: (npcId: string) => {
        return get().npcs[npcId]?.memories || [];
      },
      
      getMemoriesBySentiment: (npcId: string, sentiment: "positive" | "neutral" | "negative") => {
        return get().npcs[npcId]?.memories.filter(m => m.sentiment === sentiment) || [];
      },
      
      removeMemory: (npcId: string, memoryId: string) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                memories: npc.memories.filter(m => m.id !== memoryId)
              }
            }
          };
        });
      },
      
      // Flag management
      setNPCFlag: (npcId: string, flag: string, value: boolean) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                flags: {
                  ...npc.flags,
                  [flag]: value
                },
                lastInteraction: new Date()
              }
            }
          };
        });
      },
      
      getNPCFlag: (npcId: string, flag: string) => {
        return get().npcs[npcId]?.flags[flag] || false;
      },
      
      removeNPCFlag: (npcId: string, flag: string) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          const { [flag]: removed, ...restFlags } = npc.flags;
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                flags: restFlags
              }
            }
          };
        });
      },
      
      // Status management
      updateNPCMood: (npcId: string, mood: NPCStatus["mood"], duration?: number) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                currentStatus: {
                  ...npc.currentStatus,
                  mood
                },
                lastInteraction: new Date()
              }
            }
          };
        });
        
        // Auto-revert mood after duration if specified
        if (duration) {
          setTimeout(() => {
            get().updateNPCMood(npcId, "neutral");
          }, duration * 1000);
        }
      },
      
      updateNPCAvailability: (npcId: string, availability: NPCStatus["availability"], duration?: number) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                currentStatus: {
                  ...npc.currentStatus,
                  availability
                },
                lastInteraction: new Date()
              }
            }
          };
        });
        
        // Auto-revert availability after duration if specified
        if (duration) {
          setTimeout(() => {
            get().updateNPCAvailability(npcId, "available");
          }, duration * 1000);
        }
      },
      
      updateNPCStatus: (npcId: string, statusUpdates: Partial<NPCStatus>) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                currentStatus: {
                  ...npc.currentStatus,
                  ...statusUpdates
                },
                lastInteraction: new Date()
              }
            }
          };
        });
      },
      
      // Location and scheduling
      getNPCsByLocation: (locationId: string, currentTime?: Date) => {
        const npcs = get().getAllNPCs();
        return npcs.filter(npc => 
          npc.locations.some(loc => 
            loc.id === locationId && 
            (currentTime ? get().isNPCAvailableAt(npc.id, locationId, currentTime) : true)
          )
        );
      },
      
      isNPCAvailableAt: (npcId: string, locationId: string, time?: Date) => {
        const npc = get().npcs[npcId];
        if (!npc || npc.currentStatus.availability === "unavailable") return false;
        
        const location = npc.locations.find(loc => loc.id === locationId);
        if (!location) return false;
        
        // If no time specified or no time ranges, use probability
        if (!time || !location.timeRanges || location.timeRanges.length === 0) {
          return Math.random() < location.probability;
        }
        
        // Check if current time falls within any time range
        const currentHour = time.getHours();
        const currentMinute = time.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        return location.timeRanges.some(range => {
          const [startTime, endTime] = range.split('-');
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          
          const startInMinutes = startHour * 60 + startMin;
          const endInMinutes = endHour * 60 + endMin;
          
          return currentTimeInMinutes >= startInMinutes && currentTimeInMinutes <= endInMinutes;
        }) && Math.random() < location.probability;
      },
      
      // Storylet integration
      getNPCsForStorylet: (storyletId: string) => {
        const npcs = get().getAllNPCs();
        return npcs.filter(npc => npc.associatedStorylets.includes(storyletId));
      },
      
      getStoryletsForNPC: (npcId: string) => {
        return get().npcs[npcId]?.associatedStorylets || [];
      },
      
      addStoryletToNPC: (npcId: string, storyletId: string) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc || npc.associatedStorylets.includes(storyletId)) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                associatedStorylets: [...npc.associatedStorylets, storyletId]
              }
            }
          };
        });
      },
      
      removeStoryletFromNPC: (npcId: string, storyletId: string) => {
        set((state) => {
          const npc = state.npcs[npcId];
          if (!npc) return state;
          
          return {
            npcs: {
              ...state.npcs,
              [npcId]: {
                ...npc,
                associatedStorylets: npc.associatedStorylets.filter(id => id !== storyletId)
              }
            }
          };
        });
      },
      
      // Utility functions
      searchNPCs: (query: string) => {
        const npcs = get().getAllNPCs();
        const lowerQuery = query.toLowerCase();
        
        return npcs.filter(npc =>
          npc.name.toLowerCase().includes(lowerQuery) ||
          npc.description.toLowerCase().includes(lowerQuery) ||
          npc.personality.traits.some(trait => trait.toLowerCase().includes(lowerQuery)) ||
          npc.personality.interests.some(interest => interest.toLowerCase().includes(lowerQuery)) ||
          npc.background.major?.toLowerCase().includes(lowerQuery) ||
          npc.background.activities.some(activity => activity.toLowerCase().includes(lowerQuery))
        );
      },
      
      getNPCsByArc: (storyArc: string) => {
        const npcs = get().getAllNPCs();
        return npcs.filter(npc => npc.storyArc === storyArc);
      },
      
      getNPCsByRelationshipType: (type: RelationshipType) => {
        const npcs = get().getAllNPCs();
        return npcs.filter(npc => npc.relationshipType === type);
      },
      
      getStats: () => {
        const npcs = get().getAllNPCs();
        const relationshipDistribution = npcs.reduce((acc, npc) => {
          acc[npc.relationshipType] = (acc[npc.relationshipType] || 0) + 1;
          return acc;
        }, {} as Record<RelationshipType, number>);
        
        const averageRelationshipLevel = npcs.length > 0 
          ? npcs.reduce((sum, npc) => sum + npc.relationshipLevel, 0) / npcs.length 
          : 0;
        
        const memoriesCount = npcs.reduce((sum, npc) => sum + npc.memories.length, 0);
        const activeFlags = npcs.reduce((sum, npc) => sum + Object.keys(npc.flags).length, 0);
        
        return {
          totalNPCs: npcs.length,
          relationshipDistribution,
          averageRelationshipLevel: Math.round(averageRelationshipLevel * 10) / 10,
          memoriesCount,
          activeFlags
        };
      },
      
      // Development tools
      resetNPCRelationships: () => {
        set((state) => {
          const updatedNPCs = { ...state.npcs };
          Object.keys(updatedNPCs).forEach(npcId => {
            updatedNPCs[npcId] = {
              ...updatedNPCs[npcId],
              relationshipLevel: 50,
              relationshipType: "stranger" as RelationshipType
            };
          });
          return { npcs: updatedNPCs };
        });
      },
      
      resetNPCMemories: () => {
        set((state) => {
          const updatedNPCs = { ...state.npcs };
          Object.keys(updatedNPCs).forEach(npcId => {
            updatedNPCs[npcId] = {
              ...updatedNPCs[npcId],
              memories: []
            };
          });
          return { npcs: updatedNPCs };
        });
      },
      
      resetAllNPCData: () => {
        set({ npcs: {} });
      },
      
      exportNPCData: () => {
        return JSON.stringify(get().npcs, null, 2);
      },
      
      importNPCData: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          // Validate the data structure
          if (typeof parsed === 'object' && parsed !== null) {
            // Convert date strings back to Date objects
            const npcs = Object.fromEntries(
              Object.entries(parsed).map(([id, npc]: [string, any]) => [
                id,
                {
                  ...npc,
                  lastInteraction: npc.lastInteraction ? new Date(npc.lastInteraction) : undefined,
                  memories: npc.memories?.map((memory: any) => ({
                    ...memory,
                    timestamp: new Date(memory.timestamp)
                  })) || []
                }
              ])
            );
            set({ npcs });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to import NPC data:', error);
          return false;
        }
      }
    }),
    {
      name: 'npc-store',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration logic for future versions
          return persistedState;
        }
        return persistedState;
      }
    }
  )
);