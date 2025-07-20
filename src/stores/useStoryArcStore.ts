// Story Arc Management Store
// Manages story arc organization, progress tracking, and arc-based queries

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStoryletCatalogStore } from './useStoryletCatalogStore';
import { useStoryletFlagStore } from './useStoryletFlagStore';

// Arc progression types
export interface ArcProgress {
  total: number;
  completed: number;
  failed: boolean;
  failureReason?: string;
  current?: string;
  percentage: number;
}

export interface ArcStats {
  name: string;
  status: 'active' | 'complete' | 'failed' | 'not_started';
  progress: string;
  current?: string;
  failureReason?: string;
}

export interface StoryArcState {
  // Story arc management
  storyArcs: string[];                              // list of available story arcs
  arcFailures: Record<string, string>;             // arc name -> failure reason
  
  // Arc management
  addStoryArc: (arcName: string) => void;
  removeStoryArc: (arcName: string) => void;
  getStoryArcs: () => string[];
  hasStoryArc: (arcName: string) => boolean;
  
  // Arc progress tracking
  getArcProgress: (arcName: string) => ArcProgress;
  isArcComplete: (arcName: string) => boolean;
  isArcFailed: (arcName: string) => boolean;
  isArcActive: (arcName: string) => boolean;
  setArcFailed: (arcName: string, reason: string) => void;
  clearArcFailure: (arcName: string) => void;
  
  // Arc statistics
  getArcStats: () => ArcStats[];
  getActiveArcs: () => string[];
  getCompletedArcs: () => string[];
  getFailedArcs: () => string[];
  
  // Arc-based storylet queries
  getStoryletsByArc: (arcName: string) => any[]; // Returns storylets from catalog store
  getActiveStoryletsInArc: (arcName: string) => any[];
  getCompletedStoryletsInArc: (arcName: string) => any[];
  
  // Utility functions
  normalizeArcName: (arcName: string) => string;
  generateArcId: (arcName: string) => string;
  
  // Development utilities
  resetArcProgress: () => void;
  exportArcData: () => string;
  importArcData: (data: string) => void;
}

export const useStoryArcStore = create<StoryArcState>()(
  persist(
    (set, get) => ({
      // State
      storyArcs: [],
      arcFailures: {},
      
      // Arc management
      addStoryArc: (arcName: string) => {
        const normalized = get().normalizeArcName(arcName);
        set((state) => {
          if (!state.storyArcs.includes(normalized)) {
            return {
              storyArcs: [...state.storyArcs, normalized]
            };
          }
          return state;
        });
      },

      removeStoryArc: (arcName: string) => {
        const normalized = get().normalizeArcName(arcName);
        set((state) => ({
          storyArcs: state.storyArcs.filter(arc => arc !== normalized),
          arcFailures: Object.fromEntries(
            Object.entries(state.arcFailures).filter(([arc]) => arc !== normalized)
          )
        }));
      },

      getStoryArcs: (): string[] => {
        return get().storyArcs;
      },

      hasStoryArc: (arcName: string): boolean => {
        const normalized = get().normalizeArcName(arcName);
        return get().storyArcs.includes(normalized);
      },

      // Arc progress tracking
      getArcProgress: (arcName: string): ArcProgress => {
        const normalized = get().normalizeArcName(arcName);
        const catalogStore = useStoryletCatalogStore.getState();
        const flagStore = useStoryletFlagStore.getState();
        
        // Get all storylets for this arc
        const arcStorylets = catalogStore.getStoryletsForArc(normalized);
        const total = arcStorylets.length;
        
        if (total === 0) {
          return {
            total: 0,
            completed: 0,
            failed: false,
            percentage: 0
          };
        }
        
        // Count completed storylets
        const completed = arcStorylets.filter(storylet => 
          catalogStore.isStoryletCompleted(storylet.id)
        ).length;
        
        // Check for failure
        const state = get();
        const failed = normalized in state.arcFailures;
        const failureReason = state.arcFailures[normalized];
        
        // Find current active storylet
        const currentStorylet = arcStorylets.find(storylet => 
          catalogStore.isStoryletActive(storylet.id)
        );
        
        return {
          total,
          completed,
          failed,
          failureReason,
          current: currentStorylet?.name,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      },

      isArcComplete: (arcName: string): boolean => {
        const progress = get().getArcProgress(arcName);
        return progress.total > 0 && progress.completed === progress.total && !progress.failed;
      },

      isArcFailed: (arcName: string): boolean => {
        const normalized = get().normalizeArcName(arcName);
        const state = get();
        return normalized in state.arcFailures;
      },

      isArcActive: (arcName: string): boolean => {
        const normalized = get().normalizeArcName(arcName);
        const catalogStore = useStoryletCatalogStore.getState();
        const arcStorylets = catalogStore.getStoryletsForArc(normalized);
        
        return arcStorylets.some(storylet => 
          catalogStore.isStoryletActive(storylet.id)
        );
      },

      setArcFailed: (arcName: string, reason: string) => {
        const normalized = get().normalizeArcName(arcName);
        set((state) => ({
          arcFailures: {
            ...state.arcFailures,
            [normalized]: reason
          }
        }));
      },

      clearArcFailure: (arcName: string) => {
        const normalized = get().normalizeArcName(arcName);
        set((state) => {
          const newFailures = { ...state.arcFailures };
          delete newFailures[normalized];
          return { arcFailures: newFailures };
        });
      },

      // Arc statistics
      getArcStats: (): ArcStats[] => {
        const state = get();
        return state.storyArcs.map(arcName => {
          const progress = state.getArcProgress(arcName);
          let status: ArcStats['status'];
          
          if (progress.failed) {
            status = 'failed';
          } else if (progress.completed === progress.total && progress.total > 0) {
            status = 'complete';
          } else if (progress.completed > 0 || state.isArcActive(arcName)) {
            status = 'active';
          } else {
            status = 'not_started';
          }
          
          return {
            name: arcName,
            status,
            progress: `${progress.completed}/${progress.total} (${progress.percentage}%)`,
            current: progress.current,
            failureReason: progress.failureReason
          };
        });
      },

      getActiveArcs: (): string[] => {
        const state = get();
        return state.storyArcs.filter(arc => state.isArcActive(arc));
      },

      getCompletedArcs: (): string[] => {
        const state = get();
        return state.storyArcs.filter(arc => state.isArcComplete(arc));
      },

      getFailedArcs: (): string[] => {
        const state = get();
        return state.storyArcs.filter(arc => state.isArcFailed(arc));
      },

      // Arc-based storylet queries
      getStoryletsByArc: (arcName: string) => {
        const normalized = get().normalizeArcName(arcName);
        const catalogStore = useStoryletCatalogStore.getState();
        return catalogStore.getStoryletsForArc(normalized);
      },

      getActiveStoryletsInArc: (arcName: string) => {
        const normalized = get().normalizeArcName(arcName);
        const catalogStore = useStoryletCatalogStore.getState();
        const arcStorylets = catalogStore.getStoryletsForArc(normalized);
        
        return arcStorylets.filter(storylet => 
          catalogStore.isStoryletActive(storylet.id)
        );
      },

      getCompletedStoryletsInArc: (arcName: string) => {
        const normalized = get().normalizeArcName(arcName);
        const catalogStore = useStoryletCatalogStore.getState();
        const arcStorylets = catalogStore.getStoryletsForArc(normalized);
        
        return arcStorylets.filter(storylet => 
          catalogStore.isStoryletCompleted(storylet.id)
        );
      },

      // Utility functions
      normalizeArcName: (arcName: string): string => {
        if (!arcName) return '';
        return arcName.charAt(0).toUpperCase() + arcName.slice(1).toLowerCase();
      },

      generateArcId: (arcName: string): string => {
        return get().normalizeArcName(arcName).replace(/\s+/g, '_').toLowerCase();
      },

      // Development utilities
      resetArcProgress: () => {
        set({
          storyArcs: [],
          arcFailures: {}
        });
      },

      exportArcData: (): string => {
        const state = get();
        return JSON.stringify({
          storyArcs: state.storyArcs,
          arcFailures: state.arcFailures
        }, null, 2);
      },

      importArcData: (data: string) => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData && typeof parsedData === 'object') {
            set({
              storyArcs: parsedData.storyArcs || [],
              arcFailures: parsedData.arcFailures || {}
            });
          }
        } catch (error) {
          console.error('Failed to import arc data:', error);
        }
      }
    }),
    {
      name: 'story-arc-store',
      version: 1
    }
  )
);

// Auto-populate story arcs based on storylets in catalog
export const initializeStoryArcs = () => {
  const catalogStore = useStoryletCatalogStore.getState();
  const arcStore = useStoryArcStore.getState();
  
  const storylets = Object.values(catalogStore.allStorylets);
  const detectedArcs = new Set<string>();
  
  storylets.forEach(storylet => {
    if (storylet.storyArc) {
      const normalized = arcStore.normalizeArcName(storylet.storyArc);
      detectedArcs.add(normalized);
    }
  });
  
  // Add any new arcs
  detectedArcs.forEach(arc => {
    if (!arcStore.hasStoryArc(arc)) {
      arcStore.addStoryArc(arc);
    }
  });
  
  console.log(`Initialized ${detectedArcs.size} story arcs from storylet catalog`);
};

// Utility hooks
export const useArcProgress = (arcName: string) => {
  return useStoryArcStore(state => state.getArcProgress(arcName));
};

export const useArcStatus = (arcName: string) => {
  return useStoryArcStore(state => ({
    isComplete: state.isArcComplete(arcName),
    isFailed: state.isArcFailed(arcName),
    isActive: state.isArcActive(arcName),
    progress: state.getArcProgress(arcName)
  }));
};

export const useAllArcStats = () => {
  return useStoryArcStore(state => state.getArcStats());
};