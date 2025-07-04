// /Users/montysharma/V11M2/src/store/useSaveStoreV2.ts
// V2 Save System - Unified save/load for both legacy and V2 stores
// Provides backwards compatibility while supporting new V2 architecture

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SaveData, SaveSlot, StoryletCompletion } from '../types/save';

// V2 Save Data Structure - extends legacy with V2 data
export interface SaveDataV2 extends SaveData {
  version: '2.0.0' | '1.0.0'; // Support both versions
  v2Data?: {
    // V2 Narrative Store Data
    narrative: {
      storyArcs: Record<string, any>;
      arcProgress: Record<string, any>;
      flags: {
        storylet: Record<string, any>;
        concerns: Record<string, any>;
        storyArc: Record<string, any>;
      };
      storylets: {
        completed: string[];
        cooldowns: Record<string, number>;
      };
    };
    
    // V2 Social Store Data
    social: {
      arcRelationships: Record<string, any>;
      arcDiscoveryProgress: Record<string, any>;
      socialState: any;
    };
    
    // V2 Core Game Store Data (if exists)
    coreGame?: {
      gameState: any;
      metadata: any;
    };
  };
}

interface SaveStateV2 {
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
  
  // V2 Enhanced functionality
  migrateLegacySave: (saveId: string) => boolean;
  validateSaveIntegrity: (saveData: SaveDataV2) => boolean;
  createBackup: (saveId: string) => string;
  
  // Enhanced storylet tracking
  recordStoryletCompletion: (storyletId: string, choiceId: string, choice: any) => void;
  getStoryletCompletions: () => StoryletCompletion[];
  getStoryletStats: () => {
    totalCompleted: number;
    completionsByDay: Record<number, number>;
    choiceFrequency: Record<string, number>;
  };
}

const SAVE_VERSION_V2 = '2.0.0';
const SAVE_VERSION_LEGACY = '1.0.0';
const SAVE_STORAGE_KEY = 'mmv-save-slots-v2';
const BACKUP_STORAGE_KEY = 'mmv-save-backups';

// Helper to get current app state (unchanged from legacy)
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

// Helper to get current V2 stores state
const getV2StoresState = () => {
  try {
    const narrativeStore = (window as any).useNarrativeStore?.getState();
    const socialStore = (window as any).useSocialStore?.getState();
    const coreGameStore = (window as any).useCoreGameStore?.getState();
    
    return {
      narrative: narrativeStore,
      social: socialStore,
      coreGame: coreGameStore
    };
  } catch (error) {
    console.warn('Could not access V2 stores:', error);
    return { narrative: null, social: null, coreGame: null };
  }
};

// Helper to get current legacy stores state (for backwards compatibility)
const getLegacyStoresState = () => {
  try {
    const storyletStore = (window as any).useStoryletStore?.getState();
    const clueStore = (window as any).useClueStore?.getState();
    
    return {
      storylet: storyletStore,
      clue: clueStore
    };
  } catch (error) {
    console.warn('Could not access legacy stores:', error);
    return { storylet: null, clue: null };
  }
};

// Helper to create V2 save data from current game state
const createSaveDataV2 = (id: string, name: string): SaveDataV2 | null => {
  const appState = getAppState();
  const v2Stores = getV2StoresState();
  const legacyStores = getLegacyStoresState();
  
  if (!appState) {
    console.error('Cannot create save: missing app state');
    return null;
  }
  
  // Get completed storylets from enhanced tracking
  const saveStore = useSaveStoreV2.getState();
  const completedStorylets = saveStore.getStoryletCompletions();
  
  // Calculate stats
  const stats = {
    totalStorylets: completedStorylets.length,
    totalChoicesMade: completedStorylets.length,
    totalDaysPlayed: appState.day,
    totalXpEarned: appState.experience,
    totalQuestsCompleted: appState.completedQuests.length
  };
  
  // Base save data (compatible with legacy format)
  const baseSaveData: SaveData = {
    id,
    name,
    timestamp: Date.now(),
    version: SAVE_VERSION_LEGACY, // Keep legacy compatibility for base structure
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
    
    // Storylet progress (use legacy for backwards compatibility)
    storyletProgress: {
      activeFlags: legacyStores.storylet?.activeFlags || {},
      completedStorylets,
      storyletCooldowns: legacyStores.storylet?.storyletCooldowns || {},
      activeStoryletIds: legacyStores.storylet?.activeStoryletIds || []
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
  
  // Create V2 enhanced save data
  const v2SaveData: SaveDataV2 = {
    ...baseSaveData,
    version: SAVE_VERSION_V2,
    v2Data: undefined // Will be set below if V2 stores are available
  };
  
  // Add V2 store data if available
  if (v2Stores.narrative || v2Stores.social) {
    v2SaveData.v2Data = {
      narrative: {
        storyArcs: v2Stores.narrative?.storyArcs || {},
        arcProgress: v2Stores.narrative?.arcProgress || {},
        flags: {
          storylet: v2Stores.narrative?.flags?.storylet || new Map(),
          concerns: v2Stores.narrative?.flags?.concerns || new Map(),
          storyArc: v2Stores.narrative?.flags?.storyArc || new Map()
        },
        storylets: {
          completed: v2Stores.narrative?.storylets?.completed || [],
          cooldowns: v2Stores.narrative?.storylets?.cooldowns || {}
        }
      },
      social: {
        arcRelationships: v2Stores.social?.arcRelationships || {},
        arcDiscoveryProgress: v2Stores.social?.arcDiscoveryProgress || {},
        socialState: v2Stores.social?.socialState || {}
      }
    };
    
    if (v2Stores.coreGame) {
      v2SaveData.v2Data.coreGame = {
        gameState: v2Stores.coreGame.gameState || {},
        metadata: v2Stores.coreGame.metadata || {}
      };
    }
    
    console.log('💾 Created V2 save data with enhanced store information');
  } else {
    console.log('💾 Created legacy-compatible save data (V2 stores not available)');
  }
  
  return v2SaveData;
};

// Helper to apply V2 save data to game state
const applySaveDataV2 = (saveData: SaveDataV2): boolean => {
  try {
    const appState = getAppState();
    const v2Stores = getV2StoresState();
    const legacyStores = getLegacyStoresState();
    
    if (!appState) {
      console.error('Cannot load save: missing app state');
      return false;
    }
    
    // Apply to app store (same as legacy)
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
    
    // Apply V2 store data if available
    if (saveData.v2Data && saveData.version === SAVE_VERSION_V2) {
      console.log('🔄 Loading V2 store data...');
      
      // Apply narrative store data
      if (v2Stores.narrative && saveData.v2Data.narrative) {
        (window as any).useNarrativeStore.setState({
          storyArcs: saveData.v2Data.narrative.storyArcs,
          arcProgress: saveData.v2Data.narrative.arcProgress,
          flags: {
            storylet: new Map(Object.entries(saveData.v2Data.narrative.flags.storylet || {})),
            concerns: new Map(Object.entries(saveData.v2Data.narrative.flags.concerns || {})),
            storyArc: new Map(Object.entries(saveData.v2Data.narrative.flags.storyArc || {}))
          },
          storylets: saveData.v2Data.narrative.storylets
        });
        console.log('✅ Applied narrative store data');
      }
      
      // Apply social store data
      if (v2Stores.social && saveData.v2Data.social) {
        (window as any).useSocialStore.setState({
          arcRelationships: saveData.v2Data.social.arcRelationships,
          arcDiscoveryProgress: saveData.v2Data.social.arcDiscoveryProgress,
          socialState: saveData.v2Data.social.socialState
        });
        console.log('✅ Applied social store data');
      }
      
      // Apply core game store data if available
      if (v2Stores.coreGame && saveData.v2Data.coreGame) {
        (window as any).useCoreGameStore.setState({
          gameState: saveData.v2Data.coreGame.gameState,
          metadata: saveData.v2Data.coreGame.metadata
        });
        console.log('✅ Applied core game store data');
      }
    }
    
    // Apply legacy store data (for backwards compatibility or as fallback)
    if (legacyStores.storylet) {
      (window as any).useStoryletStore.setState({
        activeFlags: saveData.storyletProgress.activeFlags,
        completedStoryletIds: saveData.storyletProgress.completedStorylets.map(c => c.storyletId),
        storyletCooldowns: saveData.storyletProgress.storyletCooldowns,
        activeStoryletIds: saveData.storyletProgress.activeStoryletIds
      });
      console.log('✅ Applied legacy storylet store data');
    }
    
    // Update enhanced storylet tracking
    const saveStore = useSaveStoreV2.getState();
    saveStore.setState({
      storyletCompletions: saveData.storyletProgress.completedStorylets
    });
    
    console.log(`✅ Successfully loaded ${saveData.version} save: ${saveData.name} (Day ${saveData.day})`);
    return true;
  } catch (error) {
    console.error('Error applying save data:', error);
    return false;
  }
};

// Helper to validate save data integrity
const validateSaveIntegrity = (saveData: SaveDataV2): boolean => {
  try {
    // Basic validation
    if (!saveData.id || !saveData.name || !saveData.timestamp) {
      console.error('Save validation failed: missing required fields');
      return false;
    }
    
    // Version validation
    if (saveData.version !== SAVE_VERSION_V2 && saveData.version !== SAVE_VERSION_LEGACY) {
      console.error('Save validation failed: unsupported version', saveData.version);
      return false;
    }
    
    // V2 data validation
    if (saveData.version === SAVE_VERSION_V2 && saveData.v2Data) {
      if (!saveData.v2Data.narrative && !saveData.v2Data.social) {
        console.warn('V2 save has no V2 store data, but this may be expected');
      }
    }
    
    console.log(`✅ Save data validation passed for ${saveData.name} (${saveData.version})`);
    return true;
  } catch (error) {
    console.error('Save validation error:', error);
    return false;
  }
};

export const useSaveStoreV2 = create<SaveStateV2 & {
  storyletCompletions: StoryletCompletion[];
  setState: (partial: Partial<SaveStateV2 & { storyletCompletions: StoryletCompletion[] }>) => void;
}>()(persist((set, get) => ({
  // Initial state
  saveSlots: [],
  currentSaveId: null,
  storyletCompletions: [],
  
  // Expose setState for external use
  setState: (partial) => set(partial),
  
  // Create a new V2 save from current game state
  createSave: (name: string) => {
    const saveId = `save_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const saveData = createSaveDataV2(saveId, name);
    
    if (!saveData) {
      console.error('Failed to create save data');
      return '';
    }
    
    // Validate before saving
    if (!validateSaveIntegrity(saveData)) {
      console.error('Save data validation failed');
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
    
    console.log(`💾 Created V2 save: ${name} (ID: ${saveId}, Version: ${saveData.version})`);
    return saveId;
  },
  
  // Load a save by ID (supports both V2 and legacy)
  loadSave: (saveId: string) => {
    try {
      // Try V2 storage first
      let saveDataJson = localStorage.getItem(`${SAVE_STORAGE_KEY}_${saveId}`);
      
      // Fallback to legacy storage if not found
      if (!saveDataJson) {
        saveDataJson = localStorage.getItem(`mmv-save-slots_${saveId}`);
        if (saveDataJson) {
          console.log('📦 Loading legacy save data, will migrate to V2 format');
        }
      }
      
      if (!saveDataJson) {
        console.error('Save data not found:', saveId);
        return false;
      }
      
      const saveData: SaveDataV2 = JSON.parse(saveDataJson);
      
      // Validate integrity
      if (!validateSaveIntegrity(saveData)) {
        console.error('Save data integrity check failed');
        return false;
      }
      
      // Apply the save data to game state
      if (applySaveDataV2(saveData)) {
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
      // Remove from both V2 and legacy storage
      localStorage.removeItem(`${SAVE_STORAGE_KEY}_${saveId}`);
      localStorage.removeItem(`mmv-save-slots_${saveId}`);
      
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
    if (!currentSaveId) {
      console.log('⏸️ updateCurrentSave skipped - no currentSaveId');
      return;
    }
    
    // Defensive checks to prevent race conditions
    if (typeof window !== 'undefined' && (window as any).useAppStore) {
      const appState = (window as any).useAppStore.getState();
      if (appState.isResetting) {
        console.log('⏸️ updateCurrentSave skipped - reset in progress');
        return;
      }
      
      if (appState.day === 1 && appState.experience === 0 && appState.userLevel === 1) {
        console.log('⏸️ updateCurrentSave skipped - fresh start detected');
        return;
      }
    }
    
    // Find current save
    const currentSlot = saveSlots.find(slot => slot.id === currentSaveId);
    if (!currentSlot) {
      console.error('Current save slot not found:', currentSaveId);
      return;
    }
    
    // Create new save data
    const updatedSaveData = createSaveDataV2(currentSaveId, currentSlot.name);
    if (!updatedSaveData) {
      console.error('Failed to create updated save data');
      return;
    }
    
    // Update localStorage
    try {
      localStorage.setItem(`${SAVE_STORAGE_KEY}_${currentSaveId}`, JSON.stringify(updatedSaveData));
    } catch (error) {
      console.error('Failed to update save in localStorage:', error);
      return;
    }
    
    // Update save slot metadata
    const updatedSlot: SaveSlot = {
      ...currentSlot,
      timestamp: updatedSaveData.timestamp,
      gameDay: updatedSaveData.gameDay,
      preview: {
        level: updatedSaveData.userLevel,
        storyletsCompleted: updatedSaveData.stats.totalStorylets,
        totalDaysPlayed: updatedSaveData.stats.totalDaysPlayed
      },
      data: updatedSaveData
    };
    
    set((state) => ({
      saveSlots: state.saveSlots.map(slot => 
        slot.id === currentSaveId ? updatedSlot : slot
      )
    }));
    
    console.log(`💾 Updated current save: ${currentSlot.name} (V${updatedSaveData.version})`);
  },
  
  // Export save data as JSON string
  exportSave: (saveId: string) => {
    try {
      const saveDataJson = localStorage.getItem(`${SAVE_STORAGE_KEY}_${saveId}`);
      if (!saveDataJson) {
        console.error('Save data not found for export:', saveId);
        return null;
      }
      
      const saveData: SaveDataV2 = JSON.parse(saveDataJson);
      
      // Create export object with metadata
      const exportData = {
        exportVersion: '2.0.0',
        exportTimestamp: Date.now(),
        gameVersion: saveData.version,
        saveData
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting save:', error);
      return null;
    }
  },
  
  // Import save data from JSON string
  importSave: (saveDataJson: string) => {
    try {
      const importData = JSON.parse(saveDataJson);
      let saveData: SaveDataV2;
      
      // Handle different import formats
      if (importData.exportVersion && importData.saveData) {
        saveData = importData.saveData;
      } else {
        saveData = importData;
      }
      
      // Generate new ID for imported save
      const newSaveId = `save_imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      saveData.id = newSaveId;
      saveData.name = `${saveData.name} (Imported)`;
      saveData.timestamp = Date.now();
      
      // Validate imported data
      if (!validateSaveIntegrity(saveData)) {
        console.error('Imported save data validation failed');
        return false;
      }
      
      // Store imported save
      localStorage.setItem(`${SAVE_STORAGE_KEY}_${newSaveId}`, JSON.stringify(saveData));
      
      const saveSlot: SaveSlot = {
        id: newSaveId,
        name: saveData.name,
        timestamp: saveData.timestamp,
        gameDay: saveData.gameDay,
        characterName: saveData.activeCharacter?.name || 'Imported Character',
        preview: {
          level: saveData.userLevel,
          storyletsCompleted: saveData.stats.totalStorylets,
          totalDaysPlayed: saveData.stats.totalDaysPlayed
        },
        data: saveData
      };
      
      set((state) => ({
        saveSlots: [...state.saveSlots, saveSlot]
      }));
      
      console.log(`📥 Imported save: ${saveData.name} (${saveData.version})`);
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
    return saveSlots.find(slot => slot.id === currentSaveId) || null;
  },
  
  // Migrate legacy save to V2 format
  migrateLegacySave: (saveId: string) => {
    try {
      // Try to load from legacy storage
      const legacySaveJson = localStorage.getItem(`mmv-save-slots_${saveId}`);
      if (!legacySaveJson) {
        console.error('Legacy save not found:', saveId);
        return false;
      }
      
      const legacySave: SaveData = JSON.parse(legacySaveJson);
      
      // Convert to V2 format
      const v2Save: SaveDataV2 = {
        ...legacySave,
        version: SAVE_VERSION_V2,
        v2Data: {
          narrative: {
            storyArcs: {},
            arcProgress: {},
            flags: {
              storylet: {},
              concerns: {},
              storyArc: {}
            },
            storylets: {
              completed: legacySave.storyletProgress.completedStorylets.map(c => c.storyletId),
              cooldowns: legacySave.storyletProgress.storyletCooldowns
            }
          },
          social: {
            arcRelationships: {},
            arcDiscoveryProgress: {},
            socialState: {}
          }
        }
      };
      
      // Save in V2 format
      const newSaveId = `save_migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      v2Save.id = newSaveId;
      v2Save.name = `${v2Save.name} (Migrated)`;
      
      localStorage.setItem(`${SAVE_STORAGE_KEY}_${newSaveId}`, JSON.stringify(v2Save));
      
      console.log(`🔄 Migrated legacy save to V2: ${v2Save.name}`);
      return true;
    } catch (error) {
      console.error('Error migrating legacy save:', error);
      return false;
    }
  },
  
  // Validate save data integrity
  validateSaveIntegrity: (saveData: SaveDataV2) => {
    return validateSaveIntegrity(saveData);
  },
  
  // Create backup of save
  createBackup: (saveId: string) => {
    try {
      const saveDataJson = localStorage.getItem(`${SAVE_STORAGE_KEY}_${saveId}`);
      if (!saveDataJson) {
        console.error('Save data not found for backup:', saveId);
        return '';
      }
      
      const backupId = `backup_${saveId}_${Date.now()}`;
      localStorage.setItem(`${BACKUP_STORAGE_KEY}_${backupId}`, saveDataJson);
      
      console.log(`🔄 Created backup: ${backupId}`);
      return backupId;
    } catch (error) {
      console.error('Error creating backup:', error);
      return '';
    }
  },
  
  // Record storylet completion (enhanced tracking)
  recordStoryletCompletion: (storyletId: string, choiceId: string, choice: any) => {
    const completion: StoryletCompletion = {
      storyletId,
      choiceId,
      timestamp: Date.now(),
      choice: {
        text: choice.text || '',
        effects: choice.effects || []
      }
    };
    
    set((state) => ({
      storyletCompletions: [...state.storyletCompletions, completion]
    }));
  },
  
  // Get storylet completions
  getStoryletCompletions: () => {
    return get().storyletCompletions;
  },
  
  // Get storylet statistics
  getStoryletStats: () => {
    const completions = get().storyletCompletions;
    
    const totalCompleted = completions.length;
    const completionsByDay: Record<number, number> = {};
    const choiceFrequency: Record<string, number> = {};
    
    completions.forEach(completion => {
      // Group by day (assuming day can be derived from timestamp)
      const day = Math.floor((Date.now() - completion.timestamp) / (1000 * 60 * 60 * 24));
      completionsByDay[day] = (completionsByDay[day] || 0) + 1;
      
      // Track choice frequency
      choiceFrequency[completion.choiceId] = (choiceFrequency[completion.choiceId] || 0) + 1;
    });
    
    return {
      totalCompleted,
      completionsByDay,
      choiceFrequency
    };
  }
}), {
  name: 'mmv-save-store-v2',
  version: 1
}));