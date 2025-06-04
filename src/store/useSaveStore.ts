// /Users/montysharma/V11M2/src/store/useSaveStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SaveData, SaveSlot, StoryletCompletion } from '../types/save';

interface SaveState {
  // Save slots (metadata only for quick loading)
  saveSlots: SaveSlot[];
  currentSaveId: string | null;
  
  // Actions
  createSave: (name: string) => string;
  loadSave: (saveId: string) => boolean;
  deleteSave: (saveId: string) => void;
  updateCurrentSave: () => void;
  exportSave: (saveId: string) => string | null;
  importSave: (saveDataJson: string) => boolean;
  getSaveSlots: () => SaveSlot[];
  getCurrentSave: () => SaveSlot | null;
  
  // Enhanced storylet tracking
  recordStoryletCompletion: (storyletId: string, choiceId: string, choice: any) => void;
  getStoryletCompletions: () => StoryletCompletion[];
  getStoryletStats: () => {
    totalCompleted: number;
    completionsByDay: Record<number, number>;
    choiceFrequency: Record<string, number>;
  };
}

const SAVE_VERSION = '1.0.0';
const SAVE_STORAGE_KEY = 'mmv-save-slots';

// Helper to get current app state
const getAppState = () => {
  try {
    if (typeof window !== 'undefined' && (window as any).useAppStore) {
      return (window as any).useAppStore.getState();
    }
    return null;
  } catch (error) {
    console.warn('Could not access app store:', error);
    return null;
  }
};

// Helper to get current storylet state
const getStoryletState = () => {
  try {
    if (typeof window !== 'undefined' && (window as any).useStoryletStore) {
      return (window as any).useStoryletStore.getState();
    }
    return null;
  } catch (error) {
    console.warn('Could not access storylet store:', error);
    return null;
  }
};

// Helper to create save data from current game state
const createSaveData = (id: string, name: string): SaveData | null => {
  const appState = getAppState();
  const storyletState = getStoryletState();
  
  if (!appState || !storyletState) {
    console.error('Cannot create save: missing game state');
    return null;
  }
  
  // Get completed storylets from our enhanced tracking
  const saveStore = useSaveStore.getState();
  const completedStorylets = saveStore.getStoryletCompletions();
  
  // Calculate stats
  const stats = {
    totalStorylets: completedStorylets.length,
    totalChoicesMade: completedStorylets.length,
    totalDaysPlayed: appState.day,
    totalXpEarned: appState.experience,
    totalQuestsCompleted: appState.completedQuests.length
  };
  
  const saveData: SaveData = {
    id,
    name,
    timestamp: Date.now(),
    version: SAVE_VERSION,
    gameDay: appState.day,
    
    // Character data
    activeCharacter: appState.activeCharacter,
    
    // Core game state
    userLevel: appState.userLevel,
    experience: appState.experience,
    day: appState.day,
    
    // Time allocation
    allocations: { ...appState.allocations },
    
    // Resources
    resources: { ...appState.resources },
    
    // Skills
    skills: { ...appState.skills },
    
    // Skill events
    skillEvents: [...appState.skillEvents],
    
    // Storylet progress
    storyletProgress: {
      activeFlags: { ...storyletState.activeFlags },
      completedStorylets,
      storyletCooldowns: { ...storyletState.storyletCooldowns },
      activeStoryletIds: [...storyletState.activeStoryletIds]
    },
    
    // Quest system
    activeQuests: [...appState.activeQuests],
    completedQuests: [...appState.completedQuests],
    
    // Planner data
    goals: [...appState.goals],
    tasks: [...appState.tasks],
    
    // Statistics
    stats
  };
  
  return saveData;
};

// Helper to apply save data to game state
const applySaveData = (saveData: SaveData): boolean => {
  try {
    const appState = getAppState();
    const storyletState = getStoryletState();
    
    if (!appState || !storyletState) {
      console.error('Cannot load save: missing game state');
      return false;
    }
    
    // Apply to app store
    (window as any).useAppStore.setState({
      activeCharacter: saveData.activeCharacter,
      userLevel: saveData.userLevel,
      experience: saveData.experience,
      day: saveData.day,
      allocations: saveData.allocations,
      resources: saveData.resources,
      skills: saveData.skills,
      skillEvents: saveData.skillEvents,
      activeQuests: saveData.activeQuests,
      completedQuests: saveData.completedQuests,
      goals: saveData.goals,
      tasks: saveData.tasks
    });
    
    // Apply to storylet store
    (window as any).useStoryletStore.setState({
      activeFlags: saveData.storyletProgress.activeFlags,
      completedStoryletIds: saveData.storyletProgress.completedStorylets.map(c => c.storyletId),
      storyletCooldowns: saveData.storyletProgress.storyletCooldowns,
      activeStoryletIds: saveData.storyletProgress.activeStoryletIds
    });
    
    // Update our enhanced storylet tracking
    const saveStore = useSaveStore.getState();
    saveStore.setState({
      storyletCompletions: saveData.storyletProgress.completedStorylets
    });
    
    console.log(`✅ Successfully loaded save: ${saveData.name} (Day ${saveData.day})`);
    return true;
  } catch (error) {
    console.error('Error applying save data:', error);
    return false;
  }
};

export const useSaveStore = create<SaveState & {
  storyletCompletions: StoryletCompletion[];
  setState: (partial: Partial<SaveState & { storyletCompletions: StoryletCompletion[] }>) => void;
}>()(persist((set, get) => ({
  // Initial state
  saveSlots: [],
  currentSaveId: null,
  storyletCompletions: [],
  
  // Expose setState for external use
  setState: (partial) => set(partial),
  
  // Create a new save from current game state
  createSave: (name: string) => {
    const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const saveData = createSaveData(saveId, name);
    
    if (!saveData) {
      console.error('Failed to create save data');
      return '';
    }
    
    const saveSlot: SaveSlot = {
      id: saveId,
      name,
      timestamp: saveData.timestamp,
      gameDay: saveData.gameDay,
      characterName: saveData.activeCharacter?.name || 'Unnamed Character',
      preview: {
        level: saveData.userLevel,
        storyletsCompleted: saveData.stats.totalStorylets,
        totalDaysPlayed: saveData.stats.totalDaysPlayed
      },
      data: saveData
    };
    
    // Store the full save data in localStorage separately
    try {
      localStorage.setItem(`${SAVE_STORAGE_KEY}_${saveId}`, JSON.stringify(saveData));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return '';
    }
    
    set((state) => ({
      saveSlots: [...state.saveSlots, saveSlot],
      currentSaveId: saveId
    }));
    
    console.log(`💾 Created save: ${name} (ID: ${saveId})`);
    return saveId;
  },
  
  // Load a save by ID
  loadSave: (saveId: string) => {
    try {
      // Get save data from localStorage
      const saveDataJson = localStorage.getItem(`${SAVE_STORAGE_KEY}_${saveId}`);
      if (!saveDataJson) {
        console.error('Save data not found:', saveId);
        return false;
      }
      
      const saveData: SaveData = JSON.parse(saveDataJson);
      
      // Apply the save data to game state
      if (applySaveData(saveData)) {
        set({ currentSaveId: saveId });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error loading save:', error);
      return false;
    }
  },
  
  // Delete a save slot
  deleteSave: (saveId: string) => {
    try {
      // Remove from localStorage
      localStorage.removeItem(`${SAVE_STORAGE_KEY}_${saveId}`);
      
      set((state) => ({
        saveSlots: state.saveSlots.filter(slot => slot.id !== saveId),
        currentSaveId: state.currentSaveId === saveId ? null : state.currentSaveId
      }));
      
      console.log(`🗑️ Deleted save: ${saveId}`);
    } catch (error) {
      console.error('Error deleting save:', error);
    }
  },
  
  // Update current save with latest game state
  updateCurrentSave: () => {
    const { currentSaveId, saveSlots } = get();
    if (!currentSaveId) return;
    
    const currentSlot = saveSlots.find(slot => slot.id === currentSaveId);
    if (!currentSlot) return;
    
    const saveData = createSaveData(currentSaveId, currentSlot.name);
    if (!saveData) return;
    
    try {
      // Update localStorage
      localStorage.setItem(`${SAVE_STORAGE_KEY}_${currentSaveId}`, JSON.stringify(saveData));
      
      // Update slot metadata
      set((state) => ({
        saveSlots: state.saveSlots.map(slot => 
          slot.id === currentSaveId
            ? {
                ...slot,
                timestamp: saveData.timestamp,
                gameDay: saveData.gameDay,
                preview: {
                  level: saveData.userLevel,
                  storyletsCompleted: saveData.stats.totalStorylets,
                  totalDaysPlayed: saveData.stats.totalDaysPlayed
                }
              }
            : slot
        )
      }));
      
      console.log(`💾 Updated save: ${currentSlot.name}`);
    } catch (error) {
      console.error('Error updating save:', error);
    }
  },
  
  // Export save data as JSON string
  exportSave: (saveId: string) => {
    try {
      const saveDataJson = localStorage.getItem(`${SAVE_STORAGE_KEY}_${saveId}`);
      if (!saveDataJson) {
        console.error('Save data not found for export:', saveId);
        return null;
      }
      
      return saveDataJson;
    } catch (error) {
      console.error('Error exporting save:', error);
      return null;
    }
  },
  
  // Import save data from JSON string
  importSave: (saveDataJson: string) => {
    try {
      const saveData: SaveData = JSON.parse(saveDataJson);
      
      // Validate save data structure
      if (!saveData.id || !saveData.name || !saveData.version) {
        console.error('Invalid save data format');
        return false;
      }
      
      // Create new ID to avoid conflicts
      const newSaveId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const importedSaveData = { ...saveData, id: newSaveId };
      
      // Store in localStorage
      localStorage.setItem(`${SAVE_STORAGE_KEY}_${newSaveId}`, JSON.stringify(importedSaveData));
      
      // Create save slot
      const saveSlot: SaveSlot = {
        id: newSaveId,
        name: `${saveData.name} (Imported)`,
        timestamp: Date.now(),
        gameDay: saveData.gameDay,
        characterName: saveData.activeCharacter?.name || 'Imported Character',
        preview: {
          level: saveData.userLevel,
          storyletsCompleted: saveData.stats.totalStorylets,
          totalDaysPlayed: saveData.stats.totalDaysPlayed
        }
      };
      
      set((state) => ({
        saveSlots: [...state.saveSlots, saveSlot]
      }));
      
      console.log(`📥 Imported save: ${saveSlot.name}`);
      return true;
    } catch (error) {
      console.error('Error importing save:', error);
      return false;
    }
  },
  
  // Get all save slots
  getSaveSlots: () => {
    return get().saveSlots;
  },
  
  // Get current save slot
  getCurrentSave: () => {
    const { currentSaveId, saveSlots } = get();
    if (!currentSaveId) return null;
    return saveSlots.find(slot => slot.id === currentSaveId) || null;
  },
  
  // Record a storylet completion with full details
  recordStoryletCompletion: (storyletId: string, choiceId: string, choice: any) => {
    const appState = getAppState();
    if (!appState) return;
    
    const completion: StoryletCompletion = {
      storyletId,
      choiceId,
      timestamp: Date.now(),
      day: appState.day,
      choice: {
        id: choice.id,
        text: choice.text,
        effects: choice.effects
      }
    };
    
    set((state) => ({
      storyletCompletions: [...state.storyletCompletions, completion]
    }));
    
    console.log(`📝 Recorded storylet completion: ${storyletId} -> ${choice.text}`);
  },
  
  // Get all storylet completions
  getStoryletCompletions: () => {
    return get().storyletCompletions;
  },
  
  // Get storylet statistics
  getStoryletStats: () => {
    const completions = get().storyletCompletions;
    
    const completionsByDay: Record<number, number> = {};
    const choiceFrequency: Record<string, number> = {};
    
    completions.forEach(completion => {
      // Count by day
      completionsByDay[completion.day] = (completionsByDay[completion.day] || 0) + 1;
      
      // Count choice frequency
      const choiceKey = `${completion.storyletId}:${completion.choiceId}`;
      choiceFrequency[choiceKey] = (choiceFrequency[choiceKey] || 0) + 1;
    });
    
    return {
      totalCompleted: completions.length,
      completionsByDay,
      choiceFrequency
    };
  }
}), {
  name: 'mmv-save-manager',
  partialize: (state) => ({
    saveSlots: state.saveSlots.map(slot => ({ ...slot, data: undefined })), // Don't persist full save data
    currentSaveId: state.currentSaveId,
    storyletCompletions: state.storyletCompletions
  })
}));

// Expose store globally for console access
if (typeof window !== 'undefined') {
  (window as any).useSaveStore = useSaveStore;
  
  // Convenience functions for console testing
  (window as any).createTestSave = (name = 'Test Save') => {
    const saveId = useSaveStore.getState().createSave(name);
    console.log(`Created save with ID: ${saveId}`);
    return saveId;
  };
  
  (window as any).listSaves = () => {
    const saves = useSaveStore.getState().getSaveSlots();
    console.table(saves.map(save => ({
      id: save.id,
      name: save.name,
      day: save.gameDay,
      level: save.preview.level,
      storylets: save.preview.storyletsCompleted
    })));
    return saves;
  };
  
  (window as any).exportSave = (saveId: string) => {
    const data = useSaveStore.getState().exportSave(saveId);
    if (data) {
      console.log('Save data:', data);
      // Copy to clipboard if possible
      navigator.clipboard?.writeText(data);
    }
    return data;
  };
}
