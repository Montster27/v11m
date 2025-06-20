// Dedicated Arc Visualizer Store
// Self-contained state management for the Arc Visualizer component
// Avoids conflicts with existing fragmented store architecture

import { create } from 'zustand';
import { useCallback } from 'react';
import type { Storylet, StoryletDeploymentStatus, Choice, Effect } from '../types/storylet';

export interface ArcVisualizerState {
  // Core data
  storylets: Record<string, Storylet>;
  currentArcName: string;
  
  // Cached data to prevent infinite loops
  cachedArcStorylets: Storylet[];
  lastCacheUpdate: number;
  
  // UI state
  selectedStoryletId: string | null;
  editingStoryletId: string | null;
  
  // Actions
  loadArc: (arcName: string) => void;
  createStorylet: (template: 'basic' | 'choice_hub' | 'branch_point', arcName: string) => string;
  updateStorylet: (storylet: Storylet) => void;
  deleteStorylet: (storyletId: string) => void;
  setSelectedStorylet: (storyletId: string | null) => void;
  setEditingStorylet: (storyletId: string | null) => void;
  
  // Query functions
  getStoryletsForCurrentArc: () => Storylet[];
  getStorylet: (storyletId: string) => Storylet | undefined;
  updateCache: () => void;
  
  // Sync functions
  importFromMainStore: (storylets: Storylet[], arcName: string) => void;
  exportToMainStore: () => Storylet[];
  
  // Utility
  generateStoryletId: () => string;
  reset: () => void;
}

// Template functions
const getStoryletTemplate = (type: 'basic' | 'choice_hub' | 'branch_point'): Omit<Storylet, 'id' | 'storyArc'> => {
  const templates = {
    basic: {
      name: 'New Storylet',
      description: 'A new storylet waiting to be written.',
      deploymentStatus: 'dev' as StoryletDeploymentStatus,
      trigger: { type: 'time' as const, conditions: { day: 1 } },
      choices: [
        {
          id: 'choice_1',
          text: 'Continue',
          effects: [] as Effect[]
        }
      ] as Choice[]
    },
    choice_hub: {
      name: 'Choice Hub',
      description: 'A storylet that presents multiple paths to the player.',
      deploymentStatus: 'dev' as StoryletDeploymentStatus,
      trigger: { type: 'flag' as const, conditions: { flags: [''] } },
      choices: [
        { id: 'choice_1', text: 'Take the analytical approach', effects: [{ type: 'flag' as const, key: 'analyticalApproach', value: true }] },
        { id: 'choice_2', text: 'Take the social approach', effects: [{ type: 'flag' as const, key: 'socialApproach', value: true }] },
        { id: 'choice_3', text: 'Take the creative approach', effects: [{ type: 'flag' as const, key: 'creativeApproach', value: true }] }
      ] as Choice[]
    },
    branch_point: {
      name: 'Branch Point',
      description: 'A storylet that leads to different outcomes based on player state.',
      deploymentStatus: 'dev' as StoryletDeploymentStatus,
      trigger: { type: 'resource' as const, conditions: { energy: { min: 10 } } },
      choices: [
        { id: 'choice_1', text: 'High energy path', effects: [{ type: 'resource' as const, key: 'energy', delta: -10 }] },
        { id: 'choice_2', text: 'Low energy path', effects: [{ type: 'resource' as const, key: 'energy', delta: -5 }] }
      ] as Choice[]
    }
  };
  return templates[type];
};

export const useArcVisualizerStore = create<ArcVisualizerState>((set, get) => ({
  // Initial state
  storylets: {},
  currentArcName: '',
  cachedArcStorylets: [],
  lastCacheUpdate: 0,
  selectedStoryletId: null,
  editingStoryletId: null,
  
  // Load storylets for a specific arc
  loadArc: (arcName: string) => {
    console.log(`🏛️ Arc Visualizer: Loading arc "${arcName}"`);
    set({ 
      currentArcName: arcName,
      selectedStoryletId: null,
      editingStoryletId: null
    });
    // Update cache after setting arc name
    get().updateCache();
  },
  
  // Create a new storylet with the specified template
  createStorylet: (template: 'basic' | 'choice_hub' | 'branch_point', arcName: string): string => {
    const newId = get().generateStoryletId();
    const templateData = getStoryletTemplate(template);
    
    const newStorylet: Storylet = {
      ...templateData,
      id: newId,
      storyArc: arcName
    };
    
    console.log(`🆕 Arc Visualizer: Creating ${template} storylet:`, newStorylet);
    
    set((state) => ({
      storylets: {
        ...state.storylets,
        [newId]: newStorylet
      }
    }));
    
    // Update cache after adding storylet
    get().updateCache();
    
    return newId;
  },
  
  // Update an existing storylet
  updateStorylet: (storylet: Storylet) => {
    console.log(`✏️ Arc Visualizer: Updating storylet ${storylet.id}`);
    set((state) => ({
      storylets: {
        ...state.storylets,
        [storylet.id]: storylet
      }
    }));
    // Update cache after updating storylet
    get().updateCache();
  },
  
  // Delete a storylet
  deleteStorylet: (storyletId: string) => {
    console.log(`🗑️ Arc Visualizer: Deleting storylet ${storyletId}`);
    set((state) => {
      const { [storyletId]: deleted, ...remaining } = state.storylets;
      return {
        storylets: remaining,
        selectedStoryletId: state.selectedStoryletId === storyletId ? null : state.selectedStoryletId,
        editingStoryletId: state.editingStoryletId === storyletId ? null : state.editingStoryletId
      };
    });
    // Update cache after deleting storylet
    get().updateCache();
  },
  
  // Set selected storylet
  setSelectedStorylet: (storyletId: string | null) => {
    set({ selectedStoryletId: storyletId });
  },
  
  // Set editing storylet
  setEditingStorylet: (storyletId: string | null) => {
    console.log(`${storyletId ? '✏️' : '💾'} Arc Visualizer: ${storyletId ? 'Starting edit' : 'Stopping edit'} mode`);
    set({ editingStoryletId: storyletId });
  },
  
  // Update cache when storylets change
  updateCache: () => {
    const state = get();
    const newStorylets = Object.values(state.storylets).filter(storylet => storylet.storyArc === state.currentArcName);
    set({
      cachedArcStorylets: newStorylets,
      lastCacheUpdate: Date.now()
    });
  },

  // Get all storylets for the current arc (cached to prevent infinite loops)
  getStoryletsForCurrentArc: (): Storylet[] => {
    const state = get();
    // Return cached version to prevent creating new arrays
    return state.cachedArcStorylets;
  },
  
  // Get a specific storylet
  getStorylet: (storyletId: string): Storylet | undefined => {
    return get().storylets[storyletId];
  },
  
  // Import storylets from the main store
  importFromMainStore: (storylets: Storylet[], arcName: string) => {
    console.log(`📥 Arc Visualizer: Importing ${storylets.length} storylets for arc "${arcName}"`);
    const storyletMap = storylets.reduce((acc, storylet) => {
      acc[storylet.id] = storylet;
      return acc;
    }, {} as Record<string, Storylet>);
    
    set({
      storylets: storyletMap,
      currentArcName: arcName,
      selectedStoryletId: null,
      editingStoryletId: null
    });
    // Update cache after importing storylets
    get().updateCache();
  },
  
  // Export storylets to sync back to main store
  exportToMainStore: (): Storylet[] => {
    const storylets = Object.values(get().storylets);
    console.log(`📤 Arc Visualizer: Exporting ${storylets.length} storylets`);
    return storylets;
  },
  
  // Generate a unique storylet ID
  generateStoryletId: (): string => {
    return `storylet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Reset the store
  reset: () => {
    console.log('🔄 Arc Visualizer: Resetting store');
    set({
      storylets: {},
      currentArcName: '',
      cachedArcStorylets: [],
      lastCacheUpdate: 0,
      selectedStoryletId: null,
      editingStoryletId: null
    });
  }
}));

// Stable selectors to prevent infinite loops
const selectArcStorylets = (state: ArcVisualizerState) => {
  // Return cached storylets to prevent creating new arrays
  return state.cachedArcStorylets;
};

const selectSelectedStorylet = (state: ArcVisualizerState) => {
  const { selectedStoryletId, storylets } = state;
  return selectedStoryletId ? storylets[selectedStoryletId] : null;
};

const selectEditingStorylet = (state: ArcVisualizerState) => {
  const { editingStoryletId, storylets } = state;
  return editingStoryletId ? storylets[editingStoryletId] : null;
};

// Utility hooks for common operations
export const useArcStorylets = () => {
  return useArcVisualizerStore(selectArcStorylets);
};

export const useSelectedStorylet = () => {
  return useArcVisualizerStore(selectSelectedStorylet);
};

export const useEditingStorylet = () => {
  return useArcVisualizerStore(selectEditingStorylet);
};