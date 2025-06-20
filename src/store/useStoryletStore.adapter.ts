// Storylet Store Adapter
// Provides backwards compatibility while migrating to focused stores

import { useStoryletCatalogStore } from './useStoryletCatalogStore';
import { useStoryletFlagStore } from './useStoryletFlagStore';
import { useStoryArcStore, initializeStoryArcs } from './useStoryArcStore';
import type { Storylet } from '../types/storylet';

// Initialize story arcs on first load
let initialized = false;
const ensureInitialized = () => {
  if (!initialized) {
    initializeStoryArcs();
    initialized = true;
  }
};

/**
 * Adapter that provides the legacy useStoryletStore interface
 * while delegating to the new focused stores
 */
export const useStoryletStoreAdapter = () => {
  ensureInitialized();
  
  const catalogStore = useStoryletCatalogStore();
  const flagStore = useStoryletFlagStore();
  const arcStore = useStoryArcStore();

  return {
    // Core storylet data (delegated to catalog store)
    allStorylets: catalogStore.allStorylets,
    activeStoryletIds: catalogStore.activeStoryletIds,
    completedStoryletIds: catalogStore.completedStoryletIds,
    storyletCooldowns: catalogStore.storyletCooldowns,
    
    // Flag data (delegated to flag store)
    activeFlags: flagStore.activeFlags,
    
    // Arc data (delegated to arc store)
    storyArcs: arcStore.storyArcs,
    
    // CRUD operations (delegated to catalog store)
    addStorylet: catalogStore.addStorylet,
    updateStorylet: catalogStore.updateStorylet,
    deleteStorylet: catalogStore.deleteStorylet,
    unlockStorylet: catalogStore.unlockStorylet,
    
    // Flag operations (delegated to flag store)
    setFlag: flagStore.setFlag,
    getFlag: flagStore.getFlag,
    
    // Arc operations (delegated to arc store)
    addStoryArc: arcStore.addStoryArc,
    removeStoryArc: arcStore.removeStoryArc,
    getStoryletsByArc: arcStore.getStoryletsByArc,
    getArcProgress: arcStore.getArcProgress,
    getActiveArcs: arcStore.getActiveArcs,
    isArcComplete: arcStore.isArcComplete,
    isArcFailed: arcStore.isArcFailed,
    getArcStats: arcStore.getArcStats,
    
    // Combined operations
    getCurrentStorylet: (): Storylet | null => {
      const activeStorylets = catalogStore.getActiveStorylets();
      return activeStorylets.length > 0 ? activeStorylets[0] : null;
    },
    
    // Reset operations (reset all stores)
    resetStorylets: () => {
      catalogStore.resetCatalog();
      flagStore.clearAllFlags();
      arcStore.resetArcProgress();
    }
  };
};

/**
 * Hook for getting storylets by arc with reactive updates
 */
export const useStoryletsForArc = (arcName: string) => {
  return useStoryArcStore(state => state.getStoryletsByArc(arcName));
};

/**
 * Hook for getting filtered storylets with deployment status
 */
export const useFilteredStorylets = (deploymentStatuses: string[] = ['live']) => {
  return useStoryletCatalogStore(state => {
    const allStorylets = Object.values(state.allStorylets);
    return allStorylets.filter(storylet => 
      deploymentStatuses.includes(storylet.deploymentStatus || 'live')
    );
  });
};

/**
 * Hook for getting storylet stats across all stores
 */
export const useStoryletStats = () => {
  const catalogStats = useStoryletCatalogStore(state => state.getStats());
  const flagCount = useStoryletFlagStore(state => state.getFlagCount());
  const arcStats = useStoryArcStore(state => state.getArcStats());
  
  return {
    storylets: catalogStats,
    flags: flagCount,
    arcs: {
      total: arcStats.length,
      active: arcStats.filter(arc => arc.status === 'active').length,
      completed: arcStats.filter(arc => arc.status === 'complete').length,
      failed: arcStats.filter(arc => arc.status === 'failed').length
    }
  };
};

/**
 * Migration utility to export all store data
 */
export const exportAllStoreData = () => {
  const catalogStore = useStoryletCatalogStore.getState();
  const flagStore = useStoryletFlagStore.getState();
  const arcStore = useStoryArcStore.getState();
  
  return {
    catalog: catalogStore.exportCatalogData(),
    flags: flagStore.exportFlags(),
    arcs: arcStore.exportArcData(),
    timestamp: new Date().toISOString()
  };
};

/**
 * Migration utility to import all store data
 */
export const importAllStoreData = (data: {
  catalog: string;
  flags: string;
  arcs: string;
}) => {
  const catalogStore = useStoryletCatalogStore.getState();
  const flagStore = useStoryletFlagStore.getState();
  const arcStore = useStoryArcStore.getState();
  
  try {
    catalogStore.importCatalogData(data.catalog);
    flagStore.importFlags(data.flags);
    arcStore.importArcData(data.arcs);
    console.log('Successfully imported store data');
  } catch (error) {
    console.error('Failed to import store data:', error);
  }
};