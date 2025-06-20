// Core Storylet Data Management Store
// Manages the storylet catalog, active/completed tracking, and basic lifecycle

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Storylet } from '../types/storylet';
import { collegeStorylets } from '../data/collegeStorylets';
import { immediateStorylets } from '../data/immediateStorylets';
import { frequentStorylets } from '../data/frequentStorylets';
import { minigameStorylets } from '../data/minigameStorylets';
import { integratedStorylets } from '../data/integratedStorylets';
import { developmentTriggeredStorylets } from '../data/developmentTriggeredStorylets';
import { startingStorylets } from '../data/startingStorylets';
import { emmaRomanceStorylets, emmaInfluenceStorylets } from '../data/emmaRomanceArc';

export interface StoryletCatalogState {
  // Core storylet data
  allStorylets: Record<string, Storylet>;           // the full catalog loaded at startup
  activeStoryletIds: string[];                      // IDs of storylets currently unlocked and available
  completedStoryletIds: string[];                   // storylets the player has finished (to prevent repeats)
  storyletCooldowns: Record<string, number>;        // storylet ID -> day when it can trigger again
  
  // CRUD operations
  addStorylet: (storylet: Storylet) => void;
  updateStorylet: (storylet: Storylet) => void;
  deleteStorylet: (storyletId: string) => void;
  
  // Lifecycle management
  unlockStorylet: (storyletId: string) => void;
  completeStorylet: (storyletId: string) => void;
  setCooldown: (storyletId: string, day: number) => void;
  
  // Query operations
  getStorylet: (storyletId: string) => Storylet | undefined;
  hasStorylet: (storyletId: string) => boolean;
  isStoryletActive: (storyletId: string) => boolean;
  isStoryletCompleted: (storyletId: string) => boolean;
  isStoryletOnCooldown: (storyletId: string, currentDay: number) => boolean;
  
  // Batch operations
  getStorylets: (storyletIds: string[]) => Storylet[];
  getActiveStorylets: () => Storylet[];
  getCompletedStorylets: () => Storylet[];
  
  // Collection operations
  getAllStoryletIds: () => string[];
  getStoryletsForArc: (arcName: string) => Storylet[];
  getStoryletsWithDeploymentStatus: (status: string) => Storylet[];
  
  // Development utilities
  resetCatalog: () => void;
  reloadStorylets: () => void;
  exportCatalogData: () => string;
  importCatalogData: (data: string) => void;
  
  // Statistics
  getStats: () => {
    total: number;
    active: number;
    completed: number;
    onCooldown: number;
  };
}

// Helper function to load all default storylets
const loadDefaultStorylets = (): Record<string, Storylet> => {
  const allStoryletArrays = [
    collegeStorylets,
    immediateStorylets,
    frequentStorylets,
    minigameStorylets,
    integratedStorylets,
    developmentTriggeredStorylets,
    startingStorylets
  ];

  const storyletObjects = [
    emmaRomanceStorylets,
    emmaInfluenceStorylets
  ];

  const storyletMap: Record<string, Storylet> = {};
  
  // Process arrays of storylets
  allStoryletArrays.forEach(storyletArray => {
    if (Array.isArray(storyletArray)) {
      storyletArray.forEach(storylet => {
        if (storylet.id in storyletMap) {
          console.warn(`Duplicate storylet ID detected: ${storylet.id}`);
        }
        storyletMap[storylet.id] = storylet;
      });
    } else {
      console.warn('Expected array but got:', typeof storyletArray, storyletArray);
    }
  });

  // Process objects of storylets
  storyletObjects.forEach(storyletObject => {
    if (storyletObject && typeof storyletObject === 'object') {
      Object.values(storyletObject).forEach(storylet => {
        if (storylet && storylet.id) {
          if (storylet.id in storyletMap) {
            console.warn(`Duplicate storylet ID detected: ${storylet.id}`);
          }
          storyletMap[storylet.id] = storylet;
        }
      });
    } else {
      console.warn('Expected object but got:', typeof storyletObject, storyletObject);
    }
  });

  console.log(`Loaded ${Object.keys(storyletMap).length} storylets from data files`);
  return storyletMap;
};

export const useStoryletCatalogStore = create<StoryletCatalogState>()(
  persist(
    (set, get) => ({
      // State
      allStorylets: loadDefaultStorylets(),
      activeStoryletIds: [],
      completedStoryletIds: [],
      storyletCooldowns: {},
      
      // CRUD operations
      addStorylet: (storylet: Storylet) => {
        set((state) => ({
          allStorylets: {
            ...state.allStorylets,
            [storylet.id]: storylet
          }
        }));
      },

      updateStorylet: (storylet: Storylet) => {
        set((state) => {
          if (storylet.id in state.allStorylets) {
            return {
              allStorylets: {
                ...state.allStorylets,
                [storylet.id]: storylet
              }
            };
          }
          return state;
        });
      },

      deleteStorylet: (storyletId: string) => {
        set((state) => {
          const newStorylets = { ...state.allStorylets };
          delete newStorylets[storyletId];
          
          return {
            allStorylets: newStorylets,
            activeStoryletIds: state.activeStoryletIds.filter(id => id !== storyletId),
            completedStoryletIds: state.completedStoryletIds.filter(id => id !== storyletId),
            storyletCooldowns: Object.fromEntries(
              Object.entries(state.storyletCooldowns).filter(([id]) => id !== storyletId)
            )
          };
        });
      },

      // Lifecycle management
      unlockStorylet: (storyletId: string) => {
        set((state) => {
          if (state.allStorylets[storyletId] && !state.activeStoryletIds.includes(storyletId)) {
            return {
              activeStoryletIds: [...state.activeStoryletIds, storyletId]
            };
          }
          return state;
        });
      },

      completeStorylet: (storyletId: string) => {
        set((state) => ({
          activeStoryletIds: state.activeStoryletIds.filter(id => id !== storyletId),
          completedStoryletIds: state.completedStoryletIds.includes(storyletId)
            ? state.completedStoryletIds
            : [...state.completedStoryletIds, storyletId]
        }));
      },

      setCooldown: (storyletId: string, day: number) => {
        set((state) => ({
          storyletCooldowns: {
            ...state.storyletCooldowns,
            [storyletId]: day
          }
        }));
      },

      // Query operations
      getStorylet: (storyletId: string): Storylet | undefined => {
        const state = get();
        return state.allStorylets[storyletId];
      },

      hasStorylet: (storyletId: string): boolean => {
        const state = get();
        return storyletId in state.allStorylets;
      },

      isStoryletActive: (storyletId: string): boolean => {
        const state = get();
        return state.activeStoryletIds.includes(storyletId);
      },

      isStoryletCompleted: (storyletId: string): boolean => {
        const state = get();
        return state.completedStoryletIds.includes(storyletId);
      },

      isStoryletOnCooldown: (storyletId: string, currentDay: number): boolean => {
        const state = get();
        const cooldownDay = state.storyletCooldowns[storyletId];
        return cooldownDay !== undefined && currentDay < cooldownDay;
      },

      // Batch operations
      getStorylets: (storyletIds: string[]): Storylet[] => {
        const state = get();
        return storyletIds
          .map(id => state.allStorylets[id])
          .filter((storylet): storylet is Storylet => storylet !== undefined);
      },

      getActiveStorylets: (): Storylet[] => {
        const state = get();
        return state.activeStoryletIds
          .map(id => state.allStorylets[id])
          .filter((storylet): storylet is Storylet => storylet !== undefined);
      },

      getCompletedStorylets: (): Storylet[] => {
        const state = get();
        return state.completedStoryletIds
          .map(id => state.allStorylets[id])
          .filter((storylet): storylet is Storylet => storylet !== undefined);
      },

      // Collection operations
      getAllStoryletIds: (): string[] => {
        const state = get();
        return Object.keys(state.allStorylets);
      },

      getStoryletsForArc: (arcName: string): Storylet[] => {
        const state = get();
        return Object.values(state.allStorylets).filter(
          storylet => storylet.storyArc === arcName
        );
      },

      getStoryletsWithDeploymentStatus: (status: string): Storylet[] => {
        const state = get();
        return Object.values(state.allStorylets).filter(
          storylet => (storylet.deploymentStatus || 'live') === status
        );
      },

      // Development utilities
      resetCatalog: () => {
        set({
          allStorylets: loadDefaultStorylets(),
          activeStoryletIds: [],
          completedStoryletIds: [],
          storyletCooldowns: {}
        });
      },

      reloadStorylets: () => {
        set((state) => ({
          allStorylets: loadDefaultStorylets()
        }));
      },

      exportCatalogData: (): string => {
        const state = get();
        return JSON.stringify({
          activeStoryletIds: state.activeStoryletIds,
          completedStoryletIds: state.completedStoryletIds,
          storyletCooldowns: state.storyletCooldowns
        }, null, 2);
      },

      importCatalogData: (data: string) => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData && typeof parsedData === 'object') {
            set((state) => ({
              activeStoryletIds: parsedData.activeStoryletIds || state.activeStoryletIds,
              completedStoryletIds: parsedData.completedStoryletIds || state.completedStoryletIds,
              storyletCooldowns: parsedData.storyletCooldowns || state.storyletCooldowns
            }));
          }
        } catch (error) {
          console.error('Failed to import catalog data:', error);
        }
      },

      // Statistics
      getStats: () => {
        const state = get();
        const currentDay = 1; // TODO: Get from app store
        
        return {
          total: Object.keys(state.allStorylets).length,
          active: state.activeStoryletIds.length,
          completed: state.completedStoryletIds.length,
          onCooldown: Object.entries(state.storyletCooldowns)
            .filter(([_, day]) => currentDay < day).length
        };
      }
    }),
    {
      name: 'storylet-catalog-store',
      version: 1,
      // Don't persist the catalog itself, only the state data
      partialize: (state) => ({
        activeStoryletIds: state.activeStoryletIds,
        completedStoryletIds: state.completedStoryletIds,
        storyletCooldowns: state.storyletCooldowns
      })
    }
  )
);

// Utility hooks
export const useStorylet = (storyletId: string) => {
  return useStoryletCatalogStore(state => state.allStorylets[storyletId]);
};

export const useStoryletStatus = (storyletId: string) => {
  return useStoryletCatalogStore(state => ({
    exists: storyletId in state.allStorylets,
    isActive: state.activeStoryletIds.includes(storyletId),
    isCompleted: state.completedStoryletIds.includes(storyletId),
    cooldownDay: state.storyletCooldowns[storyletId]
  }));
};

export const useActiveStorylets = () => {
  return useStoryletCatalogStore(state => 
    state.activeStoryletIds
      .map(id => state.allStorylets[id])
      .filter((storylet): storylet is Storylet => storylet !== undefined)
  );
};

export const useStoryletsByArc = (arcName: string) => {
  return useStoryletCatalogStore(state => 
    Object.values(state.allStorylets).filter(
      storylet => storylet.storyArc === arcName
    )
  );
};