// /Users/montysharma/V11M2/src/stores/v2/useCoreGameStore.ts
// Consolidated store for player stats, character data, skill progression, and world state

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../../utils/debouncedStorage';

// Store versioning for migration handling
const CURRENT_VERSION = 1;

export interface CoreGameState {
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
  
  // Actions
  resetGame: () => void;
  migrateFromLegacyStores: () => void;
  updatePlayer: (updates: Partial<CoreGameState['player']>) => void;
  updateCharacter: (updates: Partial<CoreGameState['character']>) => void;
  updateSkills: (updates: Partial<CoreGameState['skills']>) => void;
  updateWorld: (updates: Partial<CoreGameState['world']>) => void;
}

const getInitialCoreState = (): Omit<CoreGameState, 'resetGame' | 'migrateFromLegacyStores' | 'updatePlayer' | 'updateCharacter' | 'updateSkills' | 'updateWorld'> => ({
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
  }
});

export const useCoreGameStore = create<CoreGameState>()(
  persist(
    (set, get) => ({
      ...getInitialCoreState(),

      // CRITICAL: Single atomic reset - solves original issue
      resetGame: () => {
        set(getInitialCoreState());
        // No auto-save concerns = pure function, no side effects
      },

      // Migration helpers
      migrateFromLegacyStores: () => {
        console.log('🔄 Migrating data from legacy stores to Core Game Store...');
        
        try {
          // Migrate from useAppStore
          const legacyAppStore = (window as any).useAppStore?.getState();
          if (legacyAppStore) {
            set((state) => ({
              ...state,
              player: {
                ...state.player,
                level: legacyAppStore.userLevel || 1,
                experience: legacyAppStore.experience || 0,
                resources: legacyAppStore.resources || {}
              },
              world: {
                ...state.world,
                day: legacyAppStore.day || 1
              }
            }));
          }

          // Migrate from integratedCharacterStore
          const legacyCharacterStore = (window as any).useIntegratedCharacterStore?.getState();
          if (legacyCharacterStore?.activeCharacter) {
            set((state) => ({
              ...state,
              character: {
                ...state.character,
                name: legacyCharacterStore.activeCharacter.name || '',
                background: legacyCharacterStore.activeCharacter.background || '',
                attributes: legacyCharacterStore.activeCharacter.attributes || {},
                developmentStats: legacyCharacterStore.activeCharacter.developmentStats || {}
              }
            }));
          }

          // Migrate from useSkillSystemV2Store
          const legacySkillStore = (window as any).useSkillSystemV2Store?.getState();
          if (legacySkillStore) {
            set((state) => ({
              ...state,
              skills: {
                ...state.skills,
                foundationExperiences: legacySkillStore.foundationExperiences || {},
                coreCompetencies: legacySkillStore.coreCompetencies || {},
                characterClasses: legacySkillStore.characterClasses || {},
                totalExperience: legacySkillStore.totalExperience || 0
              }
            }));
          }

          console.log('✅ Core Game Store migration completed');
        } catch (error) {
          console.error('❌ Core Game Store migration failed:', error);
        }
      },

      // Update methods
      updatePlayer: (updates) => {
        set((state) => ({
          ...state,
          player: { ...state.player, ...updates }
        }));
      },

      updateCharacter: (updates) => {
        set((state) => ({
          ...state,
          character: { ...state.character, ...updates }
        }));
      },

      updateSkills: (updates) => {
        set((state) => ({
          ...state,
          skills: { ...state.skills, ...updates }
        }));
      },

      updateWorld: (updates) => {
        set((state) => ({
          ...state,
          world: { ...state.world, ...updates }
        }));
      }
    }),
    {
      name: 'mmv-core-game-store',
      version: CURRENT_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      migrate: (persistedState: any, version: number) => {
        console.log(`[CoreGameStore] Migrating from version ${version} to ${CURRENT_VERSION}`);
        
        // Handle unversioned saves (version 0 or undefined)
        if (!version || version === 0) {
          console.log('[CoreGameStore] Detected unversioned save, applying defaults and preserving data');
          const defaultState = getInitialCoreState();
          
          // Merge persisted data with defaults, preserving any existing values
          return {
            ...defaultState,
            ...persistedState,
            // Ensure nested objects are properly merged
            player: { ...defaultState.player, ...(persistedState.player || {}) },
            character: { ...defaultState.character, ...(persistedState.character || {}) },
            skills: { ...defaultState.skills, ...(persistedState.skills || {}) },
            world: { ...defaultState.world, ...(persistedState.world || {}) }
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
        player: state.player,
        character: state.character,
        skills: state.skills,
        world: state.world
      })
    }
  )
);