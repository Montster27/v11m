// /Users/montysharma/V11M2/src/store/useClueStore.ts
// Zustand store for managing clues and story arcs

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Clue, StoryArc, ClueDiscoveryEvent, ClueFormData } from '../types/clue';
import { sampleClues, sampleStoryArcs } from '../data/sampleClues';

interface ClueState {
  // Core data
  clues: Clue[];
  storyArcs: StoryArc[];
  discoveryEvents: ClueDiscoveryEvent[];
  
  // Current state
  discoveredClues: string[]; // IDs of discovered clues
  
  // Actions - Clue Management
  createClue: (clueData: ClueFormData) => Clue;
  updateClue: (id: string, updates: Partial<Clue>) => void;
  deleteClue: (id: string) => void;
  
  // Actions - Discovery
  discoverClue: (clueId: string, context: {
    storyletId: string;
    minigameType: string;
    characterId: string;
    dayNumber: number;
    gameState: any;
  }) => ClueDiscoveryEvent | null;
  
  // Actions - Story Arcs
  createStoryArc: (name: string, description: string, category: string) => StoryArc;
  updateStoryArc: (id: string, updates: Partial<StoryArc>) => void;
  deleteStoryArc: (id: string) => void;
  
  // Getters - Clues
  getClueById: (id: string) => Clue | null;
  getCluesByStoryArc: (storyArcId: string) => Clue[];
  getCluesByMinigame: (minigameType: string) => Clue[];
  getCluesByStorylet: (storyletId: string) => Clue[];
  getDiscoveredClues: () => Clue[];
  getUndiscoveredClues: () => Clue[];
  
  // Getters - Story Arcs
  getStoryArcById: (id: string) => StoryArc | null;
  getAllStoryArcs: () => StoryArc[];
  getCompletedStoryArcs: () => StoryArc[];
  
  // Getters - Random Selection
  getRandomClueForMinigame: (minigameType: string, storyletId?: string) => Clue | null;
  getNextStoryArcClue: (storyArcId: string) => Clue | null;
  
  // Outcome Storylets
  getPositiveOutcomeStorylet: (clueId: string) => string | null;
  getNegativeOutcomeStorylet: (clueId: string) => string | null;
  triggerOutcomeStorylet: (clueId: string, success: boolean) => string | null;
  
  // Utility
  getDiscoveryStats: () => {
    totalClues: number;
    discoveredClues: number;
    discoveryRate: number;
    storyArcsCompleted: number;
    totalStoryArcs: number;
  };
  
  reset: () => void;
  initializeSampleData: () => void;
}

export const useClueStore = create<ClueState>()(
  persist(
    (set, get) => ({
      // Initial state
      clues: [],
      storyArcs: [],
      discoveryEvents: [],
      discoveredClues: [],
      
      // Clue Management
      createClue: (clueData: ClueFormData) => {
        // Check for duplicate ID if one was provided
        if (clueData.id && get().getClueById(clueData.id)) {
          console.error(`❌ Cannot create clue: Clue with ID "${clueData.id}" already exists`);
          throw new Error(`Clue with ID "${clueData.id}" already exists`);
        }
        
        try {
          const newClue: Clue = {
            id: clueData.id || 'clue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            title: clueData.title,
            description: clueData.description,
            content: clueData.content,
            category: clueData.category,
            difficulty: clueData.difficulty,
            storyArc: clueData.storyArc || undefined,
            arcOrder: clueData.arcOrder || undefined,
            minigameTypes: clueData.minigameTypes,
            associatedStorylets: clueData.associatedStorylets,
            positiveOutcomeStorylet: clueData.positiveOutcomeStorylet || undefined,
            negativeOutcomeStorylet: clueData.negativeOutcomeStorylet || undefined,
            isDiscovered: false,
            tags: clueData.tags,
            rarity: clueData.rarity,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set(state => ({
            clues: [...state.clues, newClue]
          }));
          
          // Update story arc clue count if applicable
          if (newClue.storyArc) {
            get().updateStoryArcClueCount(newClue.storyArc);
          }
          
          console.log(`✅ Successfully created clue: ${newClue.id}`);
          return newClue;
        } catch (error) {
          console.error(`❌ Failed to create clue:`, error);
          throw error;
        }
      },
      
      updateClue: (id: string, updates: Partial<Clue>) => {
        const existingClue = get().getClueById(id);
        if (!existingClue) {
          console.error(`❌ Cannot update clue: Clue with ID "${id}" not found`);
          throw new Error(`Clue with ID "${id}" not found`);
        }
        
        try {
          set(state => ({
            clues: state.clues.map(clue => 
              clue.id === id 
                ? { ...clue, ...updates, updatedAt: new Date() }
                : clue
            )
          }));
          
          console.log(`✅ Successfully updated clue: ${id}`);
          return true;
        } catch (error) {
          console.error(`❌ Failed to update clue ${id}:`, error);
          throw error;
        }
      },
      
      deleteClue: (id: string) => {
        const clue = get().getClueById(id);
        set(state => ({
          clues: state.clues.filter(c => c.id !== id),
          discoveredClues: state.discoveredClues.filter(cId => cId !== id)
        }));
        
        // Update story arc clue count if applicable
        if (clue?.storyArc) {
          get().updateStoryArcClueCount(clue.storyArc);
        }
      },
      
      // Discovery
      discoverClue: (clueId: string, context) => {
        const clue = get().getClueById(clueId);
        if (!clue || clue.isDiscovered) return null;
        
        const discoveryEvent: ClueDiscoveryEvent = {
          id: 'discovery-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          clueId,
          storyletId: context.storyletId,
          minigameType: context.minigameType,
          characterId: context.characterId,
          timestamp: new Date(),
          context: {
            dayNumber: context.dayNumber,
            gameState: context.gameState
          }
        };
        
        // Mark clue as discovered
        get().updateClue(clueId, {
          isDiscovered: true,
          discoveredAt: new Date(),
          discoveredBy: context.characterId
        });
        
        set(state => ({
          discoveredClues: [...state.discoveredClues, clueId],
          discoveryEvents: [...state.discoveryEvents, discoveryEvent]
        }));
        
        // Update story arc progress if applicable
        if (clue.storyArc) {
          get().updateStoryArcProgress(clue.storyArc);
        }
        
        return discoveryEvent;
      },
      
      // Story Arc Management
      createStoryArc: (name: string, description: string, category: string) => {
        const newStoryArc: StoryArc = {
          id: 'arc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          name,
          description,
          category,
          totalClues: 0,
          discoveredClues: 0,
          isCompleted: false
        };
        
        set(state => ({
          storyArcs: [...state.storyArcs, newStoryArc]
        }));
        
        return newStoryArc;
      },
      
      updateStoryArc: (id: string, updates: Partial<StoryArc>) => {
        set(state => ({
          storyArcs: state.storyArcs.map(arc => 
            arc.id === id ? { ...arc, ...updates } : arc
          )
        }));
      },
      
      deleteStoryArc: (id: string) => {
        // Remove story arc reference from clues
        get().clues.forEach(clue => {
          if (clue.storyArc === id) {
            get().updateClue(clue.id, { storyArc: undefined, arcOrder: undefined });
          }
        });
        
        set(state => ({
          storyArcs: state.storyArcs.filter(arc => arc.id !== id)
        }));
      },
      
      // Getters
      getClueById: (id: string) => {
        return get().clues.find(clue => clue.id === id) || null;
      },
      
      getCluesByStoryArc: (storyArcId: string) => {
        return get().clues
          .filter(clue => clue.storyArc === storyArcId)
          .sort((a, b) => (a.arcOrder || 0) - (b.arcOrder || 0));
      },
      
      getCluesByMinigame: (minigameType: string) => {
        return get().clues.filter(clue => 
          clue.minigameTypes.includes(minigameType)
        );
      },
      
      getCluesByStorylet: (storyletId: string) => {
        return get().clues.filter(clue => 
          clue.associatedStorylets.includes(storyletId)
        );
      },
      
      getDiscoveredClues: () => {
        return get().clues.filter(clue => clue.isDiscovered);
      },
      
      getUndiscoveredClues: () => {
        return get().clues.filter(clue => !clue.isDiscovered);
      },
      
      getStoryArcById: (id: string) => {
        return get().storyArcs.find(arc => arc.id === id) || null;
      },
      
      getAllStoryArcs: () => {
        return get().storyArcs;
      },
      
      getCompletedStoryArcs: () => {
        return get().storyArcs.filter(arc => arc.isCompleted);
      },
      
      // Random Selection
      getRandomClueForMinigame: (minigameType: string, storyletId?: string) => {
        let availableClues = get().getCluesByMinigame(minigameType)
          .filter(clue => !clue.isDiscovered);
        
        // If storylet specified, prefer clues associated with it
        if (storyletId) {
          const storyletClues = availableClues.filter(clue => 
            clue.associatedStorylets.includes(storyletId)
          );
          if (storyletClues.length > 0) {
            availableClues = storyletClues;
          }
        }
        
        if (availableClues.length === 0) return null;
        
        // Weight by rarity (common clues more likely)
        const weightedClues: Clue[] = [];
        availableClues.forEach(clue => {
          const weight = clue.rarity === 'common' ? 4 
                       : clue.rarity === 'uncommon' ? 3
                       : clue.rarity === 'rare' ? 2 
                       : 1; // legendary
          
          for (let i = 0; i < weight; i++) {
            weightedClues.push(clue);
          }
        });
        
        return weightedClues[Math.floor(Math.random() * weightedClues.length)];
      },
      
      getNextStoryArcClue: (storyArcId: string) => {
        const arcClues = get().getCluesByStoryArc(storyArcId);
        return arcClues.find(clue => !clue.isDiscovered) || null;
      },
      
      // Outcome Storylets
      getPositiveOutcomeStorylet: (clueId: string) => {
        const clue = get().getClueById(clueId);
        return clue?.positiveOutcomeStorylet || null;
      },
      
      getNegativeOutcomeStorylet: (clueId: string) => {
        const clue = get().getClueById(clueId);
        return clue?.negativeOutcomeStorylet || null;
      },
      
      triggerOutcomeStorylet: (clueId: string, success: boolean) => {
        const clue = get().getClueById(clueId);
        if (!clue) return null;
        
        const outcomeStoryletId = success 
          ? clue.positiveOutcomeStorylet 
          : clue.negativeOutcomeStorylet;
        
        if (outcomeStoryletId) {
          // If we have access to storylet store, we could trigger the storylet here
          // For now, just return the storylet ID for the caller to handle
          console.log(`🎯 Clue outcome: ${success ? 'Success' : 'Failure'} - Triggering storylet: ${outcomeStoryletId}`);
          return outcomeStoryletId;
        }
        
        return null;
      },
      
      getDiscoveryStats: () => {
        const { clues, storyArcs, discoveredClues } = get();
        return {
          totalClues: clues.length,
          discoveredClues: discoveredClues.length,
          discoveryRate: clues.length > 0 ? (discoveredClues.length / clues.length) * 100 : 0,
          storyArcsCompleted: storyArcs.filter(arc => arc.isCompleted).length,
          totalStoryArcs: storyArcs.length
        };
      },
      
      // Utility functions (not exposed in interface)
      updateStoryArcClueCount: (storyArcId: string) => {
        const clues = get().getCluesByStoryArc(storyArcId);
        get().updateStoryArc(storyArcId, {
          totalClues: clues.length
        });
      },
      
      updateStoryArcProgress: (storyArcId: string) => {
        const clues = get().getCluesByStoryArc(storyArcId);
        const discoveredCount = clues.filter(clue => clue.isDiscovered).length;
        const isCompleted = discoveredCount === clues.length && clues.length > 0;
        
        get().updateStoryArc(storyArcId, {
          discoveredClues: discoveredCount,
          isCompleted,
          completedAt: isCompleted ? new Date() : undefined
        });
      },
      
      reset: () => {
        set({
          clues: [],
          storyArcs: [],
          discoveryEvents: [],
          discoveredClues: []
        });
      },

      initializeSampleData: () => {
        const state = get();
        
        // Don't initialize if we already have data
        if (state.clues.length > 0 || state.storyArcs.length > 0) {
          console.log('Sample clue data already exists, skipping initialization');
          return;
        }

        console.log('Initializing sample clue data...');
        
        // Create story arcs first
        const createdArcs: Record<string, string> = {};
        sampleStoryArcs.forEach(arcData => {
          const arc = state.createStoryArc(arcData.name, arcData.description, arcData.category);
          createdArcs[arcData.name.toLowerCase().replace(/\s+/g, '-')] = arc.id;
        });

        // Create clues and link them to story arcs
        sampleClues.forEach(clueData => {
          // Map story arc name to ID
          const arcKey = clueData.storyArc?.toLowerCase().replace(/\s+/g, '-');
          const clueWithArcId = {
            ...clueData,
            storyArc: arcKey && createdArcs[arcKey] ? createdArcs[arcKey] : undefined
          };
          
          state.createClue(clueWithArcId);
        });

        console.log(`Created ${sampleStoryArcs.length} story arcs and ${sampleClues.length} clues`);
      }
    }),
    {
      name: 'clue-store',
      partialize: (state) => ({
        clues: state.clues,
        storyArcs: state.storyArcs,
        discoveryEvents: state.discoveryEvents,
        discoveredClues: state.discoveredClues
      })
    }
  )
);

// Global functions for storylet integration
if (typeof window !== 'undefined') {
  (window as any).useClueStore = useClueStore;
  
  // Helper function for discovering clues from storylets
  (window as any).triggerClueDiscovery = (minigameType: string, storyletId: string, characterId: string) => {
    const clueStore = useClueStore.getState();
    const clue = clueStore.getRandomClueForMinigame(minigameType, storyletId);
    
    if (clue) {
      const discovery = clueStore.discoverClue(clue.id, {
        storyletId,
        minigameType,
        characterId,
        dayNumber: (window as any).useAppStore?.getState()?.day || 1,
        gameState: (window as any).useAppStore?.getState() || {}
      });
      
      return {
        clue,
        discovery,
        message: `You discovered a clue: "${clue.title}"`
      };
    }
    
    return null;
  };
}