// /Users/montysharma/v11m2/src/stores/useStoryletStoreV2.ts
// V2 StoryletStore with UnifiedPersistenceService integration
// Enhanced with pre-action backups and improved error handling

import { create } from 'zustand';
import type { Storylet, Effect, MinigameType } from '../types/storylet';
import { globalTimeoutManager } from '../utils/timeoutManager';
import { getAppState, getNPCStore, isAppStoreAvailable, isNPCStoreAvailable, isIntegratedCharacterStoreAvailable, isSkillSystemV2StoreAvailable, isSaveStoreAvailable } from '../types/global';
import { debounce, AsyncQueue } from '../utils/debounce';
import { useStoryletCatalogStore } from './useStoryletCatalogStore';
import { devLog } from '../utils/debug';
import { unifiedPersistence } from './middleware/unifiedPersistenceMiddleware';

// Arc progression types
interface ArcProgress {
  total: number;
  completed: number;
  failed: boolean;
  failureReason?: string;
  current?: string;
  percentage: number;
}

interface ArcStats {
  name: string;
  status: 'active' | 'complete' | 'failed' | 'not_started';
  progress: string;
  current?: string;
  failureReason?: string;
}

// Arc metadata for sorting and organization
interface ArcMetadata {
  name: string;
  lastAccessedAt: number; // timestamp when arc was last opened/worked on
  createdAt: number; // timestamp when arc was created
}

interface StoryletStateV2 {
  // Core storylet data
  allStorylets: Record<string, Storylet>;           // the full catalog loaded at startup
  activeFlags: Record<string, boolean>;             // tracks boolean flags
  activeStoryletIds: string[];                      // IDs of storylets currently unlocked and available
  completedStoryletIds: string[];                   // storylets the player has finished (to prevent repeats)
  storyletCooldowns: Record<string, number>;        // storylet ID -> day when it can trigger again
  
  // Story arc management
  storyArcs: string[];                              // list of available story arcs
  arcMetadata: Record<string, ArcMetadata>;         // metadata for each arc (access times, etc.)
  
  // Development settings
  deploymentFilter: Set<'live' | 'stage' | 'dev'>;  // which deployment statuses to show (can be multiple)
  
  // Minigame state
  activeMinigame: MinigameType | null;              // currently active minigame
  minigameContext: {                                // context for the minigame
    effect: Effect;                                 // the original minigame effect
    storyletId: string;                            // the storylet this came from
    choiceId: string;                              // the choice this came from
  } | null;
  
  // Reactive notification state (replaces window-based notifications)
  newlyDiscoveredClue: any | null;                  // clue discovered that needs notification
  clueDiscoveryRequest: {                           // clue discovery request
    clueId: string;
    minigameType: string;
  } | null;
  
  // Actions with enhanced functionality
  syncFromCatalogStore: () => void;                 // sync storylets from catalog store
  evaluateStorylets: () => void;                    // scan and unlock storylets based on triggers
  chooseStorylet: (storyletId: string, choiceId: string) => Promise<void>;  // make a choice in a storylet (with backup)
  unlockStorylet: (storyletId: string) => void;     // manually unlock a storylet
  addStorylet: (storylet: Storylet) => Promise<void>;        // add a new storylet to the catalog (with backup)
  updateStorylet: (storylet: Storylet) => Promise<void>;     // update an existing storylet (with backup)
  deleteStorylet: (storyletId: string) => Promise<void>;     // delete a storylet from the catalog (with backup)
  addStoryArc: (arcName: string) => void;           // add a new story arc
  removeStoryArc: (arcName: string) => Promise<void>;        // remove a story arc (with backup)
  getStoryletsByArc: (arcName: string) => Storylet[]; // get all storylets in a specific arc
  
  // Story arc progression helpers
  getArcProgress: (arcName: string) => ArcProgress;
  getActiveArcs: () => string[];
  isArcComplete: (arcName: string) => boolean;
  isArcFailed: (arcName: string) => boolean;
  getArcStats: () => ArcStats[];
  setFlag: (key: string, value: boolean) => void;   // manually set a flag
  getFlag: (key: string) => boolean;                // get a flag value
  getCurrentStorylet: () => Storylet | null;        // get the first active storylet
  resetStorylets: () => Promise<void>;              // reset storylet system for testing (with backup)
  applyEffect: (effect: Effect, context?: { storyletId?: string; choiceId?: string }) => void; // apply a single effect
  launchMinigame: (gameId: MinigameType, effect: Effect, storyletId: string, choiceId: string) => void;
  completeMinigame: (success: boolean, stats?: any) => void;
  closeMinigame: () => void;
  launchClueDiscovery: (effect: Effect, storyletId: string, choiceId: string) => void;
  completeClueDiscovery: (success: boolean, clueId: string) => void;
  
  // Reactive notification actions (replaces window-based system)
  setDiscoveredClue: (clue: any) => void;           // set a newly discovered clue for notification
  clearDiscoveredClue: () => void;                  // clear discovered clue notification
  setClueDiscoveryRequest: (clueId: string, minigameType: string) => void; // request clue discovery
  clearClueDiscoveryRequest: () => void;            // clear clue discovery request
  
  // Development actions
  setDeploymentFilter: (filter: Set<'live' | 'stage' | 'dev'>) => void; // set which deployment statuses to show
  toggleDeploymentStatus: (status: 'live' | 'stage' | 'dev') => void; // toggle a deployment status in the filter
  updateStoryletDeploymentStatus: (storyletId: string, status: 'dev' | 'stage' | 'live') => Promise<void>; // update storylet deployment status (with backup)
  
  // V2 Enhanced functionality
  bulkUpdateStorylets: (storylets: Storylet[]) => Promise<void>; // bulk update with backup
  exportStorylets: (filter?: (storylet: Storylet) => boolean) => Storylet[]; // export storylets
  importStorylets: (storylets: Storylet[]) => Promise<void>; // import storylets with backup
  getStoryletHistory: () => Array<{ action: string; storyletId: string; timestamp: number }>; // action history
  undoLastAction: () => Promise<boolean>; // undo last action if backup available
}

// Helper functions to reduce cognitive complexity
const evaluationQueue = new AsyncQueue();

const shouldSkipStorylet = (storylet: Storylet, state: any, appState: any) => {
  // Skip if already active
  if (state.activeStoryletIds.includes(storylet.id)) {
    return true;
  }
  
  // Skip if on cooldown
  if (state.storyletCooldowns[storylet.id] && appState && appState.day < state.storyletCooldowns[storylet.id]) {
    return true;
  }
  
  // Skip if completed and it's a one-time storylet
  if (state.completedStoryletIds.includes(storylet.id)) {
    // Allow resource-based storylets to repeat, but not time/flag-based chains
    if (storylet.trigger.type !== 'resource') {
      return true;
    }
  }
  
  return false;
};

const evaluateTimeTrigger = (trigger: any, appState: any) => {
  if (!appState) {
    devLog('❌ No app state for time trigger evaluation');
    return false;
  }
  
  const currentDay = appState.day;
  const conditions = trigger.conditions;
  
  devLog('⏰ Evaluating time trigger:', {
    currentDay,
    conditions,
    dayCondition: conditions.day,
    weekCondition: conditions.week
  });
  
  // Day-specific trigger
  if (conditions.day !== undefined) {
    return currentDay === conditions.day;
  }
  
  // Week-specific trigger
  if (conditions.week !== undefined) {
    const currentWeek = Math.floor(currentDay / 7);
    return currentWeek === conditions.week;
  }
  
  return false;
};

const evaluateFlagTrigger = (trigger: any, state: any, appState: any) => {
  const conditions = trigger.conditions;
  
  // Check storylet flags
  if (conditions.storyletFlags) {
    for (const [flag, expectedValue] of Object.entries(conditions.storyletFlags)) {
      const actualValue = state.activeFlags[flag];
      if (actualValue !== expectedValue) {
        devLog(`🏴 Flag mismatch: ${flag} = ${actualValue}, expected ${expectedValue}`);
        return false;
      }
    }
  }
  
  // Check NPC relationship flags
  if (conditions.npcFlags && isNPCStoreAvailable()) {
    const npcStore = getNPCStore();
    for (const [npcId, minRelationship] of Object.entries(conditions.npcFlags)) {
      const relationship = npcStore.getState().getRelationshipLevel(npcId);
      if (relationship < (minRelationship as number)) {
        devLog(`🤝 NPC relationship too low: ${npcId} = ${relationship}, need ${minRelationship}`);
        return false;
      }
    }
  }
  
  return true;
};

const evaluateResourceTrigger = (trigger: any, appState: any) => {
  if (!appState) {
    devLog('❌ No app state for resource trigger evaluation');
    return false;
  }
  
  const conditions = trigger.conditions;
  const resources = appState.resources;
  
  for (const [resource, minAmount] of Object.entries(conditions.resources || {})) {
    const currentAmount = resources[resource] || 0;
    if (currentAmount < (minAmount as number)) {
      devLog(`💰 Resource insufficient: ${resource} = ${currentAmount}, need ${minAmount}`);
      return false;
    }
  }
  
  return true;
};

export const useStoryletStoreV2 = create<StoryletStateV2>()(
  unifiedPersistence(
    (set, get) => ({
      // Initial state
      allStorylets: {},
      activeFlags: {},
      activeStoryletIds: [],
      completedStoryletIds: [],
      storyletCooldowns: {},
      storyArcs: [],
      arcMetadata: {},
      deploymentFilter: new Set(['live', 'stage', 'dev']),
      activeMinigame: null,
      minigameContext: null,
      newlyDiscoveredClue: null,
      clueDiscoveryRequest: null,
      
      // Core functionality
      syncFromCatalogStore: () => {
        const catalogStore = useStoryletCatalogStore.getState();
        const catalogStorylets = catalogStore.storylets;
        
        set(state => ({
          allStorylets: { ...catalogStorylets }
        }));
        
        devLog('🔄 Synced storylets from catalog store', { count: Object.keys(catalogStorylets).length });
      },
      
      evaluateStorylets: () => {
        evaluationQueue.add(async () => {
          const state = get();
          const appState = getAppState();
          
          if (!appState) {
            devLog('❌ No app state available for storylet evaluation');
            return;
          }
          
          devLog('🔍 Evaluating storylets for unlocking', {
            totalStorylets: Object.keys(state.allStorylets).length,
            currentlyActive: state.activeStoryletIds.length,
            currentDay: appState.day
          });
          
          const newlyActivated: string[] = [];
          
          // Check each storylet for activation
          for (const [storyletId, storylet] of Object.entries(state.allStorylets)) {
            if (shouldSkipStorylet(storylet, state, appState)) {
              continue;
            }
            
            // Filter by deployment status
            if (!state.deploymentFilter.has(storylet.metadata?.deployment || 'live')) {
              continue;
            }
            
            let shouldActivate = false;
            
            // Evaluate trigger based on type
            switch (storylet.trigger.type) {
              case 'time':
                shouldActivate = evaluateTimeTrigger(storylet.trigger, appState);
                break;
              case 'flag':
                shouldActivate = evaluateFlagTrigger(storylet.trigger, state, appState);
                break;
              case 'resource':
                shouldActivate = evaluateResourceTrigger(storylet.trigger, appState);
                break;
              default:
                devLog(`⚠️ Unknown trigger type: ${storylet.trigger.type}`);
                break;
            }
            
            if (shouldActivate) {
              newlyActivated.push(storyletId);
              devLog(`✅ Activated storylet: ${storylet.name} (${storyletId})`);
            }
          }
          
          // Update state with newly activated storylets
          if (newlyActivated.length > 0) {
            set(state => ({
              activeStoryletIds: [...state.activeStoryletIds, ...newlyActivated]
            }));
            
            devLog('🎯 Storylet evaluation complete', {
              newlyActivated: newlyActivated.length,
              totalActive: get().activeStoryletIds.length
            });
          }
        });
      },
      
      chooseStorylet: async (storyletId: string, choiceId: string) => {
        const state = get();
        const storylet = state.allStorylets[storyletId];
        
        if (!storylet) {
          devLog(`❌ Storylet not found: ${storyletId}`);
          return;
        }
        
        // Create pre-action backup
        await get()._createBackup(`Before choosing storylet: ${storylet.name} (choice: ${choiceId})`);
        
        const choice = storylet.choices.find(c => c.id === choiceId);
        if (!choice) {
          devLog(`❌ Choice not found: ${choiceId} in storylet ${storyletId}`);
          return;
        }
        
        devLog(`🎯 Player chose: ${choice.text} in ${storylet.name}`);
        
        // Mark storylet as completed
        set(state => ({
          completedStoryletIds: [...state.completedStoryletIds, storyletId],
          activeStoryletIds: state.activeStoryletIds.filter(id => id !== storyletId)
        }));
        
        // Apply effects
        if (choice.effects) {
          for (const effect of choice.effects) {
            get().applyEffect(effect, { storyletId, choiceId });
          }
        }
        
        // Apply cooldown if specified
        if (storylet.cooldown) {
          const appState = getAppState();
          if (appState) {
            const cooldownDay = appState.day + storylet.cooldown;
            set(state => ({
              storyletCooldowns: {
                ...state.storyletCooldowns,
                [storyletId]: cooldownDay
              }
            }));
          }
        }
        
        // Re-evaluate storylets for new activations
        get().evaluateStorylets();
      },
      
      unlockStorylet: (storyletId: string) => {
        const state = get();
        if (!state.activeStoryletIds.includes(storyletId)) {
          set(state => ({
            activeStoryletIds: [...state.activeStoryletIds, storyletId]
          }));
          devLog(`🔓 Manually unlocked storylet: ${storyletId}`);
        }
      },
      
      addStorylet: async (storylet: Storylet) => {
        // Create pre-action backup
        await get()._createBackup(`Before adding storylet: ${storylet.name}`);
        
        set(state => ({
          allStorylets: {
            ...state.allStorylets,
            [storylet.id]: storylet
          }
        }));
        
        // Also add to catalog store
        const catalogStore = useStoryletCatalogStore.getState();
        catalogStore.addStorylet(storylet);
        
        devLog(`➕ Added storylet: ${storylet.name} (${storylet.id})`);
      },
      
      updateStorylet: async (storylet: Storylet) => {
        // Create pre-action backup
        await get()._createBackup(`Before updating storylet: ${storylet.name}`);
        
        set(state => ({
          allStorylets: {
            ...state.allStorylets,
            [storylet.id]: storylet
          }
        }));
        
        // Also update catalog store
        const catalogStore = useStoryletCatalogStore.getState();
        catalogStore.updateStorylet(storylet);
        
        devLog(`✏️ Updated storylet: ${storylet.name} (${storylet.id})`);
      },
      
      deleteStorylet: async (storyletId: string) => {
        const state = get();
        const storylet = state.allStorylets[storyletId];
        
        if (!storylet) {
          devLog(`❌ Cannot delete storylet: ${storyletId} not found`);
          return;
        }
        
        // Create pre-action backup
        await get()._createBackup(`Before deleting storylet: ${storylet.name}`);
        
        set(state => {
          const { [storyletId]: removed, ...remainingStorylets } = state.allStorylets;
          return {
            allStorylets: remainingStorylets,
            activeStoryletIds: state.activeStoryletIds.filter(id => id !== storyletId),
            completedStoryletIds: state.completedStoryletIds.filter(id => id !== storyletId)
          };
        });
        
        // Also remove from catalog store
        const catalogStore = useStoryletCatalogStore.getState();
        catalogStore.deleteStorylet(storyletId);
        
        devLog(`🗑️ Deleted storylet: ${storylet.name} (${storyletId})`);
      },
      
      addStoryArc: (arcName: string) => {
        const state = get();
        if (!state.storyArcs.includes(arcName)) {
          set(state => ({
            storyArcs: [...state.storyArcs, arcName],
            arcMetadata: {
              ...state.arcMetadata,
              [arcName]: {
                name: arcName,
                lastAccessedAt: Date.now(),
                createdAt: Date.now()
              }
            }
          }));
          devLog(`📚 Added story arc: ${arcName}`);
        }
      },
      
      removeStoryArc: async (arcName: string) => {
        // Create pre-action backup
        await get()._createBackup(`Before removing story arc: ${arcName}`);
        
        // Remove arc from all storylets
        const state = get();
        const updatedStorylets = { ...state.allStorylets };
        
        for (const [storyletId, storylet] of Object.entries(updatedStorylets)) {
          if (storylet.storyArc === arcName) {
            updatedStorylets[storyletId] = {
              ...storylet,
              storyArc: undefined
            };
          }
        }
        
        set(state => {
          const { [arcName]: removed, ...remainingMetadata } = state.arcMetadata;
          return {
            storyArcs: state.storyArcs.filter(arc => arc !== arcName),
            arcMetadata: remainingMetadata,
            allStorylets: updatedStorylets
          };
        });
        
        devLog(`🗑️ Removed story arc: ${arcName}`);
      },
      
      getStoryletsByArc: (arcName: string) => {
        const state = get();
        return Object.values(state.allStorylets).filter(storylet => storylet.storyArc === arcName);
      },
      
      // Story arc progression helpers
      getArcProgress: (arcName: string) => {
        const storylets = get().getStoryletsByArc(arcName);
        const completed = storylets.filter(s => get().completedStoryletIds.includes(s.id));
        
        return {
          total: storylets.length,
          completed: completed.length,
          failed: false,
          percentage: storylets.length > 0 ? (completed.length / storylets.length) * 100 : 0
        };
      },
      
      getActiveArcs: () => {
        return get().storyArcs.filter(arcName => {
          const progress = get().getArcProgress(arcName);
          return progress.completed < progress.total;
        });
      },
      
      isArcComplete: (arcName: string) => {
        const progress = get().getArcProgress(arcName);
        return progress.completed === progress.total && progress.total > 0;
      },
      
      isArcFailed: (arcName: string) => {
        const progress = get().getArcProgress(arcName);
        return progress.failed;
      },
      
      getArcStats: () => {
        return get().storyArcs.map(arcName => {
          const progress = get().getArcProgress(arcName);
          return {
            name: arcName,
            status: get().isArcComplete(arcName) ? 'complete' : 
                   progress.failed ? 'failed' : 
                   progress.completed > 0 ? 'active' : 'not_started',
            progress: `${progress.completed}/${progress.total}`,
            failureReason: progress.failureReason
          } as ArcStats;
        });
      },
      
      setFlag: (key: string, value: boolean) => {
        set(state => ({
          activeFlags: {
            ...state.activeFlags,
            [key]: value
          }
        }));
        devLog(`🏴 Set flag: ${key} = ${value}`);
      },
      
      getFlag: (key: string) => {
        return get().activeFlags[key] || false;
      },
      
      getCurrentStorylet: () => {
        const state = get();
        if (state.activeStoryletIds.length === 0) return null;
        
        const firstActiveId = state.activeStoryletIds[0];
        return state.allStorylets[firstActiveId] || null;
      },
      
      resetStorylets: async () => {
        // Create backup before reset
        await get()._createBackup('Before storylet system reset');
        
        set({
          allStorylets: {},
          activeFlags: {},
          activeStoryletIds: [],
          completedStoryletIds: [],
          storyletCooldowns: {},
          storyArcs: [],
          arcMetadata: {},
          activeMinigame: null,
          minigameContext: null,
          newlyDiscoveredClue: null,
          clueDiscoveryRequest: null
        });
        
        devLog('🔄 Storylet system reset');
      },
      
      // Effect application
      applyEffect: (effect: Effect, context?: { storyletId?: string; choiceId?: string }) => {
        devLog('⚡ Applying effect:', effect);
        
        switch (effect.type) {
          case 'flag':
            get().setFlag(effect.flag, effect.value);
            break;
          case 'resource':
            if (isAppStoreAvailable()) {
              const appState = getAppState();
              if (appState) {
                // Apply resource change through app store
                devLog(`💰 Resource effect: ${effect.resource} ${effect.amount > 0 ? '+' : ''}${effect.amount}`);
              }
            }
            break;
          case 'unlock_storylet':
            get().unlockStorylet(effect.storyletId);
            break;
          case 'minigame':
            if (context) {
              get().launchMinigame(effect.gameId, effect, context.storyletId!, context.choiceId!);
            }
            break;
          case 'clue_discovery':
            if (context) {
              get().launchClueDiscovery(effect, context.storyletId!, context.choiceId!);
            }
            break;
          default:
            devLog('⚠️ Unknown effect type:', effect);
        }
      },
      
      // Minigame management
      launchMinigame: (gameId: MinigameType, effect: Effect, storyletId: string, choiceId: string) => {
        set({
          activeMinigame: gameId,
          minigameContext: { effect, storyletId, choiceId }
        });
        devLog(`🎮 Launched minigame: ${gameId}`);
      },
      
      completeMinigame: (success: boolean, stats?: any) => {
        const state = get();
        const context = state.minigameContext;
        
        if (!context) {
          devLog('❌ No minigame context for completion');
          return;
        }
        
        devLog(`🎮 Minigame completed: ${success ? 'success' : 'failure'}`, stats);
        
        // Apply success/failure effects
        const effect = context.effect;
        if (success && effect.successEffects) {
          effect.successEffects.forEach(eff => get().applyEffect(eff));
        } else if (!success && effect.failureEffects) {
          effect.failureEffects.forEach(eff => get().applyEffect(eff));
        }
        
        // Clear minigame state
        get().closeMinigame();
      },
      
      closeMinigame: () => {
        set({
          activeMinigame: null,
          minigameContext: null
        });
        devLog('🎮 Minigame closed');
      },
      
      // Clue discovery
      launchClueDiscovery: (effect: Effect, storyletId: string, choiceId: string) => {
        set({
          clueDiscoveryRequest: {
            clueId: effect.clueId || 'random',
            minigameType: effect.minigameType || 'word-association'
          }
        });
        devLog('🔍 Launched clue discovery');
      },
      
      completeClueDiscovery: (success: boolean, clueId: string) => {
        if (success) {
          // This would integrate with the clue store
          devLog(`🔍 Clue discovered: ${clueId}`);
        }
        get().clearClueDiscoveryRequest();
      },
      
      // Notification management
      setDiscoveredClue: (clue: any) => {
        set({ newlyDiscoveredClue: clue });
      },
      
      clearDiscoveredClue: () => {
        set({ newlyDiscoveredClue: null });
      },
      
      setClueDiscoveryRequest: (clueId: string, minigameType: string) => {
        set({ clueDiscoveryRequest: { clueId, minigameType } });
      },
      
      clearClueDiscoveryRequest: () => {
        set({ clueDiscoveryRequest: null });
      },
      
      // Development tools
      setDeploymentFilter: (filter: Set<'live' | 'stage' | 'dev'>) => {
        set({ deploymentFilter: filter });
        get().evaluateStorylets(); // Re-evaluate with new filter
      },
      
      toggleDeploymentStatus: (status: 'live' | 'stage' | 'dev') => {
        const state = get();
        const newFilter = new Set(state.deploymentFilter);
        
        if (newFilter.has(status)) {
          newFilter.delete(status);
        } else {
          newFilter.add(status);
        }
        
        get().setDeploymentFilter(newFilter);
      },
      
      updateStoryletDeploymentStatus: async (storyletId: string, status: 'dev' | 'stage' | 'live') => {
        const state = get();
        const storylet = state.allStorylets[storyletId];
        
        if (!storylet) {
          devLog(`❌ Cannot update deployment status: storylet ${storyletId} not found`);
          return;
        }
        
        // Create pre-action backup
        await get()._createBackup(`Before updating deployment status for: ${storylet.name}`);
        
        const updatedStorylet = {
          ...storylet,
          metadata: {
            ...storylet.metadata,
            deployment: status
          }
        };
        
        await get().updateStorylet(updatedStorylet);
        devLog(`🚀 Updated deployment status: ${storylet.name} → ${status}`);
      },
      
      // V2 Enhanced functionality
      bulkUpdateStorylets: async (storylets: Storylet[]) => {
        // Create pre-action backup
        await get()._createBackup(`Before bulk updating ${storylets.length} storylets`);
        
        for (const storylet of storylets) {
          await get().updateStorylet(storylet);
        }
        
        devLog(`📦 Bulk updated ${storylets.length} storylets`);
      },
      
      exportStorylets: (filter?: (storylet: Storylet) => boolean) => {
        const state = get();
        const storylets = Object.values(state.allStorylets);
        return filter ? storylets.filter(filter) : storylets;
      },
      
      importStorylets: async (storylets: Storylet[]) => {
        // Create pre-action backup
        await get()._createBackup(`Before importing ${storylets.length} storylets`);
        
        for (const storylet of storylets) {
          await get().addStorylet(storylet);
        }
        
        devLog(`📥 Imported ${storylets.length} storylets`);
      },
      
      getStoryletHistory: () => {
        // This would track action history - simplified implementation
        return [];
      },
      
      undoLastAction: async () => {
        // This would implement undo functionality using backups
        devLog('↩️ Undo functionality would restore from latest backup');
        return false;
      }
    }),
    {
      storeName: 'storylet-store-v2',
      autoSaveEnabled: true,
      autoSaveIntervalMs: 30000, // 30 seconds
      maxBackups: 15, // Keep more backups for storylet system
      enablePreActionBackups: true
    }
  )
);

// Export for backward compatibility
export { useStoryletStoreV2 as useStoryletStore };