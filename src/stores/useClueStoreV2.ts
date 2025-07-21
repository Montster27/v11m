// /Users/montysharma/v11m2/src/stores/useClueStoreV2.ts
// V2 ClueStore with UnifiedPersistenceService integration
// Replaces zustand persist middleware with centralized persistence

import { create } from 'zustand';
import { Clue, StoryArc, ClueDiscoveryEvent, ClueFormData } from '../types/clue';
import { sampleClues, sampleStoryArcs } from '../data/sampleClues';
import { unifiedPersistence } from './middleware/unifiedPersistenceMiddleware';

interface ClueStateV2 {
  // Core data
  clues: Clue[];
  storyArcs: StoryArc[];
  discoveryEvents: ClueDiscoveryEvent[];
  
  // Current state
  discoveredClues: string[]; // IDs of discovered clues
  
  // Actions - Clue Management (with pre-action backups)
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
  
  // V2 Enhanced functionality
  bulkCreateClues: (clues: ClueFormData[]) => Promise<Clue[]>;
  bulkDeleteClues: (clueIds: string[]) => Promise<void>;
  updateStoryArcClueCount: (storyArcId: string) => void;
  updateStoryArcProgress: (storyArcId: string) => void;
  exportClues: (filter?: (clue: Clue) => boolean) => Clue[];
  importClues: (clues: Clue[]) => Promise<void>;
}

export const useClueStoreV2 = create<ClueStateV2>()(
  unifiedPersistence(
    (set, get) => ({
      // Initial state
      clues: [],
      storyArcs: [],
      discoveryEvents: [],
      discoveredClues: [],
      
      // Clue Management with pre-action backups
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
          
          // Update story arc clue count if applicable (and arc exists)
          if (newClue.storyArc && get().getStoryArcById(newClue.storyArc)) {
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
        } catch (error) {
          console.error(`❌ Failed to update clue ${id}:`, error);
          throw error;
        }
      },
      
      deleteClue: async (id: string) => {
        // Create pre-action backup before deletion
        await get()._createBackup(`Before deleting clue: ${id}`);
        
        const clue = get().getClueById(id);
        set(state => ({
          clues: state.clues.filter(c => c.id !== id),
          discoveredClues: state.discoveredClues.filter(cId => cId !== id)
        }));
        
        // Update story arc clue count if applicable (and arc exists)
        if (clue?.storyArc && get().getStoryArcById(clue.storyArc)) {
          get().updateStoryArcClueCount(clue.storyArc);
        }
        
        console.log(`✅ Successfully deleted clue: ${id}`);
      },
      
      // Discovery with automatic backup
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
        
        // Update story arc progress if applicable (and arc exists)
        if (clue.storyArc && get().getStoryArcById(clue.storyArc)) {
          get().updateStoryArcProgress(clue.storyArc);
        }
        
        console.log(`✅ Clue discovered: ${clueId} by ${context.characterId}`);
        return discoveryEvent;
      },
      
      // Story Arc Management with pre-action backups
      createStoryArc: (name: string, description: string, category: string) => {
        const existingArc = get().storyArcs.find(arc => arc.name === name);
        if (existingArc) {
          console.error(`❌ Story arc "${name}" already exists`);
          throw new Error(`Story arc "${name}" already exists`);
        }
        
        const newArc: StoryArc = {
          id: 'arc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          name,
          description,
          category,
          totalClues: 0,
          discoveredClues: 0,
          isCompleted: false,
          completedAt: undefined,
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set(state => ({
          storyArcs: [...state.storyArcs, newArc]
        }));
        
        console.log(`✅ Successfully created story arc: ${name}`);
        return newArc;
      },
      
      updateStoryArc: (id: string, updates: Partial<StoryArc>) => {
        const existingArc = get().getStoryArcById(id);
        if (!existingArc) {
          console.error(`❌ Cannot update story arc: Story arc with ID "${id}" not found`);
          throw new Error(`Story arc with ID "${id}" not found`);
        }
        
        set(state => ({
          storyArcs: state.storyArcs.map(arc => 
            arc.id === id 
              ? { ...arc, ...updates, updatedAt: new Date() }
              : arc
          )
        }));
        
        console.log(`✅ Successfully updated story arc: ${id}`);
      },
      
      deleteStoryArc: async (id: string) => {
        // Create pre-action backup before deletion
        await get()._createBackup(`Before deleting story arc: ${id}`);
        
        // Remove arc from all associated clues
        const cluesInArc = get().getCluesByStoryArc(id);
        cluesInArc.forEach(clue => {
          get().updateClue(clue.id, { storyArc: undefined, arcOrder: undefined });
        });
        
        set(state => ({
          storyArcs: state.storyArcs.filter(arc => arc.id !== id)
        }));
        
        console.log(`✅ Successfully deleted story arc: ${id}`);
      },
      
      // Getters (unchanged from original)
      getClueById: (id: string) => {
        return get().clues.find(clue => clue.id === id) || null;
      },
      
      getCluesByStoryArc: (storyArcId: string) => {
        return get().clues.filter(clue => clue.storyArc === storyArcId);
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
      
      getRandomClueForMinigame: (minigameType: string, storyletId?: string) => {
        let availableClues = get().getCluesByMinigame(minigameType)
          .filter(clue => !clue.isDiscovered);
        
        if (storyletId) {
          const storyletClues = availableClues.filter(clue => 
            clue.associatedStorylets.includes(storyletId)
          );
          if (storyletClues.length > 0) {
            availableClues = storyletClues;
          }
        }
        
        if (availableClues.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * availableClues.length);
        return availableClues[randomIndex];
      },
      
      getNextStoryArcClue: (storyArcId: string) => {
        const arcClues = get().getCluesByStoryArc(storyArcId)
          .filter(clue => !clue.isDiscovered)
          .sort((a, b) => (a.arcOrder || 999) - (b.arcOrder || 999));
        
        return arcClues.length > 0 ? arcClues[0] : null;
      },
      
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
        
        return success 
          ? clue.positiveOutcomeStorylet || null
          : clue.negativeOutcomeStorylet || null;
      },
      
      getDiscoveryStats: () => {
        const clues = get().clues;
        const storyArcs = get().storyArcs;
        const discoveredClues = clues.filter(clue => clue.isDiscovered);
        const completedArcs = storyArcs.filter(arc => arc.isCompleted);
        
        return {
          totalClues: clues.length,
          discoveredClues: discoveredClues.length,
          discoveryRate: clues.length > 0 ? (discoveredClues.length / clues.length) * 100 : 0,
          storyArcsCompleted: completedArcs.length,
          totalStoryArcs: storyArcs.length
        };
      },
      
      reset: async () => {
        // Create backup before reset
        await get()._createBackup('Before reset');
        
        set({
          clues: [],
          storyArcs: [],
          discoveryEvents: [],
          discoveredClues: []
        });
        
        console.log('✅ ClueStore reset completed');
      },
      
      initializeSampleData: () => {
        set({
          clues: [...sampleClues],
          storyArcs: [...sampleStoryArcs]
        });
        
        console.log('✅ Sample data initialized');
      },
      
      // V2 Enhanced functionality
      bulkCreateClues: async (clueDataList: ClueFormData[]) => {
        // Create pre-action backup for bulk operations
        await get()._createBackup(`Before bulk creating ${clueDataList.length} clues`);
        
        const newClues: Clue[] = [];
        const errors: string[] = [];
        
        for (const clueData of clueDataList) {
          try {
            const newClue = get().createClue(clueData);
            newClues.push(newClue);
          } catch (error) {
            errors.push(`Failed to create clue ${clueData.title}: ${error}`);
          }
        }
        
        if (errors.length > 0) {
          console.warn(`⚠️ Bulk create completed with ${errors.length} errors:`, errors);
        }
        
        console.log(`✅ Bulk created ${newClues.length} clues`);
        return newClues;
      },
      
      bulkDeleteClues: async (clueIds: string[]) => {
        // Create pre-action backup for bulk operations
        await get()._createBackup(`Before bulk deleting ${clueIds.length} clues`);
        
        for (const clueId of clueIds) {
          try {
            await get().deleteClue(clueId);
          } catch (error) {
            console.error(`Failed to delete clue ${clueId}:`, error);
          }
        }
        
        console.log(`✅ Bulk deleted ${clueIds.length} clues`);
      },
      
      updateStoryArcClueCount: (storyArcId: string) => {
        const arcClues = get().getCluesByStoryArc(storyArcId);
        const discoveredCount = arcClues.filter(clue => clue.isDiscovered).length;
        
        get().updateStoryArc(storyArcId, {
          totalClues: arcClues.length,
          discoveredClues: discoveredCount,
          isCompleted: arcClues.length > 0 && discoveredCount === arcClues.length,
          completedAt: discoveredCount === arcClues.length ? new Date() : undefined
        });
      },
      
      updateStoryArcProgress: (storyArcId: string) => {
        // Update clue counts and completion status
        get().updateStoryArcClueCount(storyArcId);
        
        const arc = get().getStoryArcById(storyArcId);
        if (arc?.isCompleted) {
          console.log(`🎉 Story arc completed: ${arc.name}`);
        }
      },
      
      exportClues: (filter?: (clue: Clue) => boolean) => {
        const clues = get().clues;
        return filter ? clues.filter(filter) : clues;
      },
      
      importClues: async (clues: Clue[]) => {
        // Create pre-action backup before import
        await get()._createBackup(`Before importing ${clues.length} clues`);
        
        const clueDataList: ClueFormData[] = clues.map(clue => ({
          id: clue.id,
          title: clue.title,
          description: clue.description,
          content: clue.content,
          category: clue.category,
          difficulty: clue.difficulty,
          storyArc: clue.storyArc,
          arcOrder: clue.arcOrder,
          minigameTypes: clue.minigameTypes,
          associatedStorylets: clue.associatedStorylets,
          positiveOutcomeStorylet: clue.positiveOutcomeStorylet,
          negativeOutcomeStorylet: clue.negativeOutcomeStorylet,
          tags: clue.tags,
          rarity: clue.rarity
        }));
        
        await get().bulkCreateClues(clueDataList);
        console.log(`✅ Imported ${clues.length} clues`);
      }
    }),
    {
      storeName: 'clue-store-v2',
      autoSaveEnabled: true,
      autoSaveIntervalMs: 30000, // 30 seconds
      maxBackups: 10,
      enablePreActionBackups: true
    }
  )
);

// Export the store for backward compatibility
export { useClueStoreV2 as useClueStore };