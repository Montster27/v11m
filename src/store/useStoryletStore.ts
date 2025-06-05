// /Users/montysharma/V11M2/src/store/useStoryletStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Storylet, Effect, MinigameType } from '../types/storylet';
import { collegeStorylets } from '../data/collegeStorylets';
import { immediateStorylets } from '../data/immediateStorylets';
import { frequentStorylets } from '../data/frequentStorylets';
import { minigameStorylets } from '../data/minigameStorylets';
import { integratedStorylets } from '../data/integratedStorylets';
import { developmentTriggeredStorylets } from '../data/developmentTriggeredStorylets';

interface StoryletState {
  // Core storylet data
  allStorylets: Record<string, Storylet>;           // the full catalog loaded at startup
  activeFlags: Record<string, boolean>;             // tracks boolean flags
  activeStoryletIds: string[];                      // IDs of storylets currently unlocked and available
  completedStoryletIds: string[];                   // storylets the player has finished (to prevent repeats)
  storyletCooldowns: Record<string, number>;        // storylet ID -> day when it can trigger again
  
  // Minigame state
  activeMinigame: MinigameType | null;              // currently active minigame
  minigameContext: {                                // context for the minigame
    effect: Effect;                                 // the original minigame effect
    storyletId: string;                            // the storylet this came from
    choiceId: string;                              // the choice this came from
  } | null;
  
  // Actions
  evaluateStorylets: () => void;                    // scan and unlock storylets based on triggers
  chooseStorylet: (storyletId: string, choiceId: string) => void;  // make a choice in a storylet
  unlockStorylet: (storyletId: string) => void;     // manually unlock a storylet
  addStorylet: (storylet: Storylet) => void;        // add a new storylet to the catalog
  setFlag: (key: string, value: boolean) => void;   // manually set a flag
  getFlag: (key: string) => boolean;                // get a flag value
  getCurrentStorylet: () => Storylet | null;        // get the first active storylet
  resetStorylets: () => void;                       // reset storylet system for testing
  applyEffect: (effect: Effect) => void;            // apply a single effect
  launchMinigame: (gameId: MinigameType, effect: Effect, storyletId: string, choiceId: string) => void;
  completeMinigame: (success: boolean, stats?: any) => void;
  closeMinigame: () => void;
}

// Helper functions to reduce cognitive complexity
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
    console.log('❌ No app state for time trigger evaluation');
    return false;
  }
  
  const currentDay = appState.day;
  const conditions = trigger.conditions;
  
  console.log('⏰ Evaluating time trigger:', {
    currentDay,
    conditions,
    dayCondition: conditions.day,
    weekCondition: conditions.week
  });
  
  // Check day-based trigger (exact day match)
  if (conditions.day !== undefined) {
    const meets = currentDay >= conditions.day;
    console.log(`📅 Day trigger: current=${currentDay}, required=${conditions.day}, meets=${meets}`);
    return meets;
  }
  
  // Check week-based trigger (convert weeks to days)
  if (conditions.week !== undefined) {
    const requiredDay = conditions.week * 7;
    const meets = currentDay >= requiredDay;
    console.log(`📅 Week trigger: current=${currentDay}, required=${requiredDay} (week ${conditions.week}), meets=${meets}`);
    return meets;
  }
  
  console.log('❌ No time conditions found');
  return false;
};

const evaluateFlagTrigger = (trigger: any, activeFlags: any) => {
  if (trigger.conditions.flags && Array.isArray(trigger.conditions.flags)) {
    // Check if ANY of the flags are true (OR logic)
    return trigger.conditions.flags.some((flagKey: string) => activeFlags[flagKey]);
  }
  return false;
};

const evaluateResourceTrigger = (trigger: any, appState: any) => {
  if (!appState || !trigger.conditions) return false;
  
  // Check resource conditions (e.g., { energy: { max: 25 }, stress: { min: 75 } })
  return Object.entries(trigger.conditions).every(([resourceKey, condition]) => {
    if (typeof condition !== 'object') return true;
    
    const resourceValue = appState.resources[resourceKey as keyof typeof appState.resources];
    if (resourceValue === undefined) return false;
    
    // Check min condition (inclusive)
    if (condition.min !== undefined && resourceValue < condition.min) {
      return false;
    }
    
    // Check max condition (inclusive)
    if (condition.max !== undefined && resourceValue > condition.max) {
      return false;
    }
    
    return true;
  });
};

const evaluateStoryletTrigger = (trigger: any, activeFlags: any, appState: any) => {
  switch (trigger.type) {
    case 'time':
      return evaluateTimeTrigger(trigger, appState);
      
    case 'flag':
      return evaluateFlagTrigger(trigger, activeFlags);
      
    case 'resource':
      return evaluateResourceTrigger(trigger, appState);
      
    default:
      return false;
  }
};

export const useStoryletStore = create<StoryletState>()(persist((set, get) => ({
  // Initial state
  allStorylets: { 
    ...immediateStorylets, 
    ...frequentStorylets, 
    ...collegeStorylets, 
    ...minigameStorylets, 
    ...integratedStorylets,
    ...developmentTriggeredStorylets 
  },
  activeFlags: {},
  activeStoryletIds: [],
  completedStoryletIds: [],
  storyletCooldowns: {},
  
  // Minigame state
  activeMinigame: null,
  minigameContext: null,
  
  // Evaluate storylets - check triggers and unlock eligible storylets
  evaluateStorylets: () => {
    const state = get();
    const appState = getAppState();
    const newActiveIds: string[] = [];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎭 ===== EVALUATING STORYLETS =====');
      console.log('📊 Current state:', {
        currentDay: appState?.day,
        resources: appState?.resources,
        activeFlags: state.activeFlags,
        activeStorylets: state.activeStoryletIds,
        completedStorylets: state.completedStoryletIds,
        totalStorylets: Object.keys(state.allStorylets).length
      });
    }
    
    Object.values(state.allStorylets).forEach((storylet) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n🔍 Checking storylet: ${storylet.id} (${storylet.name})`);
      }
      
      if (shouldSkipStorylet(storylet, state, appState)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏭️ Skipping ${storylet.id}:`, {
            alreadyActive: state.activeStoryletIds.includes(storylet.id),
            onCooldown: state.storyletCooldowns[storylet.id] && appState && appState.day < state.storyletCooldowns[storylet.id],
            alreadyCompleted: state.completedStoryletIds.includes(storylet.id) && storylet.trigger.type !== 'resource',
            cooldownDay: state.storyletCooldowns[storylet.id]
          });
        }
        return;
      }
      
      const canTrigger = evaluateStoryletTrigger(storylet.trigger, state.activeFlags, appState);
      
      if (process.env.NODE_ENV === 'development') {
        const triggerDetails = {
          trigger: storylet.trigger,
          canTrigger,
          currentState: {
            day: appState?.day,
            resources: appState?.resources,
            flags: state.activeFlags
          }
        };
        
        // Add specific trigger evaluation details
        if (storylet.trigger.type === 'time') {
          triggerDetails.timeEvaluation = {
            required: storylet.trigger.conditions,
            current: { day: appState?.day },
            met: evaluateTimeTrigger(storylet.trigger, appState)
          };
        } else if (storylet.trigger.type === 'flag') {
          triggerDetails.flagEvaluation = {
            required: storylet.trigger.conditions.flags,
            current: state.activeFlags,
            met: evaluateFlagTrigger(storylet.trigger, state.activeFlags)
          };
        } else if (storylet.trigger.type === 'resource') {
          triggerDetails.resourceEvaluation = {
            required: storylet.trigger.conditions,
            current: appState?.resources,
            met: evaluateResourceTrigger(storylet.trigger, appState)
          };
        }
        
        console.log(`📝 ${storylet.id} evaluation:`, triggerDetails);
      }
      
      if (canTrigger) {
        newActiveIds.push(storylet.id);
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ 🎉 UNLOCKING STORYLET: ${storylet.id} - ${storylet.name}`);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`❌ Cannot trigger ${storylet.id}`);
        }
      }
    });
    
    // Add newly unlocked storylets to active list
    if (newActiveIds.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎆 Activating ${newActiveIds.length} new storylets:`, newActiveIds);
      }
      set((state) => ({
        activeStoryletIds: [...state.activeStoryletIds, ...newActiveIds]
      }));
    } else if (process.env.NODE_ENV === 'development') {
      console.log('😴 No new storylets activated');
    }
  },
  
  // Choose a storylet option and apply effects
  chooseStorylet: (storyletId: string, choiceId: string) => {
    const { allStorylets, activeStoryletIds, completedStoryletIds } = get();
    
    // Find the storylet and choice
    const storylet = allStorylets[storyletId];
    if (!storylet) {
      console.error('Storylet not found:', storyletId);
      return;
    }
    
    const choice = storylet.choices.find(c => c.id === choiceId);
    if (!choice) {
      console.error('Choice not found:', choiceId);
      return;
    }
    
    // Log the storylet choice event
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎭 StoryletChoice: ${storylet.name} → ${choice.text}`);
      console.log('📋 Effects to apply:', choice.effects);
    }
    
    // Record storylet completion in save system
    try {
      if (typeof window !== 'undefined' && (window as any).useSaveStore) {
        (window as any).useSaveStore.getState().recordStoryletCompletion(storyletId, choiceId, choice);
      }
    } catch (error) {
      console.warn('Could not record storylet completion:', error);
    }
    
    // Check if there's a minigame effect that needs to be handled
    const hasMinigameEffect = choice.effects.some(effect => effect.type === 'minigame');
    
    if (hasMinigameEffect) {
      // Find and launch the minigame, but don't complete the storylet yet
      const minigameEffect = choice.effects.find(effect => effect.type === 'minigame');
      if (minigameEffect) {
        console.log(`🎮 Launching minigame: ${minigameEffect.gameId} from storylet ${storyletId}`);
        get().launchMinigame(minigameEffect.gameId as MinigameType, minigameEffect, storyletId, choiceId);
        
        // Apply non-minigame effects immediately
        choice.effects.forEach((effect) => {
          if (effect.type !== 'minigame') {
            get().applyEffect(effect);
          }
        });
        
        // Don't complete the storylet yet - it will be completed when the minigame finishes
        return;
      }
    }
    
    // Apply all effects (no minigame)
    choice.effects.forEach((effect) => {
      get().applyEffect(effect);
    });
    
    // Convert storylet choice to quest achievement
    try {
      if (typeof window !== 'undefined' && (window as any).useAppStore) {
        (window as any).useAppStore.getState().convertStoryletToQuest(storyletId, choiceId);
      }
    } catch (error) {
      console.warn('Could not convert storylet to quest:', error);
    }
    
    // Mark storylet as completed
    const newActiveIds = activeStoryletIds.filter(id => id !== storyletId);
    const newCompletedIds = [...completedStoryletIds, storyletId];
    
    // Set cooldown for resource-based storylets (3 days)
    const cooldownDay = storylet.trigger.type === 'resource' ? 
      ((() => {
        try {
          if (typeof window !== 'undefined' && (window as any).useAppStore) {
            return (window as any).useAppStore.getState().day + 3;
          }
          return 999; // fallback
        } catch {
          return 999; // fallback
        }
      })()) : undefined;
    
    set((state) => ({
      activeStoryletIds: newActiveIds,
      completedStoryletIds: newCompletedIds,
      storyletCooldowns: cooldownDay ? {
        ...state.storyletCooldowns,
        [storyletId]: cooldownDay
      } : state.storyletCooldowns
    }));
    
    // If choice has nextStoryletId, unlock it immediately
    if (choice.nextStoryletId) {
      get().unlockStorylet(choice.nextStoryletId);
    }
    
    // Re-evaluate storylets in case new conditions are met
    setTimeout(() => {
      get().evaluateStorylets();
    }, 100);
  },
  
  // Apply an individual effect
  applyEffect: (effect: Effect) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚙️ Applying effect:`, effect);
    }
    
    switch (effect.type) {
      case 'resource':
        try {
          if (typeof window !== 'undefined' && (window as any).useAppStore) {
            const appStore = (window as any).useAppStore.getState();
            const currentValue = appStore.resources[effect.key];
            const newValue = effect.key === 'money' || effect.key === 'knowledge' || effect.key === 'social'
              ? Math.max(0, Math.min(1000, currentValue + effect.delta))  // Knowledge, money, social capped at 1000
              : Math.max(0, Math.min(100, currentValue + effect.delta));   // Energy and stress capped at 100
            (window as any).useAppStore.getState().updateResource(effect.key, newValue);
          }
        } catch (error) {
          console.warn('Could not update resource:', error);
        }
        break;
        
      case 'flag':
        get().setFlag(effect.key, effect.value);
        break;
        
      case 'skillXp':
        try {
          // Check if using integrated character system (V2)
          if (typeof window !== 'undefined' && (window as any).useIntegratedCharacterStore) {
            const integratedStore = (window as any).useIntegratedCharacterStore.getState();
            if (integratedStore.currentCharacter && integratedStore.currentCharacter.version === 2) {
              integratedStore.addSkillXP(effect.key, effect.amount);
              return;
            }
          }
          
          // Fallback to V1 system
          if (typeof window !== 'undefined' && (window as any).useAppStore) {
            const appStore = (window as any).useAppStore.getState();
            appStore.addSkillXp(effect.key, effect.amount, 'Storylet');
          }
        } catch (error) {
          console.warn('Could not add skill XP:', error);
        }
        break;
        
      case 'domainXp':
        // New effect type for integrated character system
        try {
          if (typeof window !== 'undefined' && (window as any).addDevelopmentXP) {
            (window as any).addDevelopmentXP(effect.domain, effect.amount, 'Storylet');
          }
        } catch (error) {
          console.warn('Could not add domain XP:', error);
        }
        break;
        
      case 'unlock':
        get().unlockStorylet(effect.storyletId);
        break;
        
      case 'minigame':
        // Minigame effects are handled in chooseStorylet, not here
        console.warn('Minigame effect should be handled in chooseStorylet, not applyEffect');
        break;
    }
  },
  
  // Manually unlock a storylet
  unlockStorylet: (storyletId: string) => {
    const { allStorylets, activeStoryletIds, completedStoryletIds } = get();
    
    if (!allStorylets[storyletId]) {
      console.error('Cannot unlock unknown storylet:', storyletId);
      return;
    }
    
    if (activeStoryletIds.includes(storyletId) || completedStoryletIds.includes(storyletId)) {
      return; // Already active or completed
    }
    
    set((state) => ({
      activeStoryletIds: [...state.activeStoryletIds, storyletId]
    }));
  },
  
  // Add a new storylet to the catalog
  addStorylet: (storylet: Storylet) => {
    set((state) => ({
      allStorylets: {
        ...state.allStorylets,
        [storylet.id]: storylet
      }
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Added new storylet: ${storylet.id}`);
    }
  },
  
  // Flag management
  setFlag: (key: string, value: boolean) => {
    set((state) => ({
      activeFlags: {
        ...state.activeFlags,
        [key]: value
      }
    }));
  },
  
  getFlag: (key: string) => {
    const { activeFlags } = get();
    return activeFlags[key] || false;
  },
  
  // Get current active storylet (first one)
  getCurrentStorylet: () => {
    const { allStorylets, activeStoryletIds } = get();
    if (activeStoryletIds.length === 0) return null;
    return allStorylets[activeStoryletIds[0]] || null;
  },
  
  // Reset storylets for testing
  resetStorylets: () => {
    console.log('🔄 Resetting storylet store...');
    set({
      activeFlags: {},
      activeStoryletIds: [],
      completedStoryletIds: [],
      storyletCooldowns: {},
      activeMinigame: null,
      minigameContext: null
    });
    
    // Re-evaluate after reset
    setTimeout(() => {
      get().evaluateStorylets();
    }, 100);
    
    console.log('✅ Storylet store reset complete');
  },
  
  // Launch a minigame
  launchMinigame: (gameId: MinigameType, effect: Effect, storyletId: string, choiceId: string) => {
    console.log(`🎮 Launching minigame: ${gameId}`);
    
    // Pause time when launching minigame
    try {
      if (typeof window !== 'undefined' && (window as any).useAppStore) {
        (window as any).useAppStore.getState().pauseTime();
      }
    } catch (error) {
      console.warn('Could not pause time:', error);
    }
    
    set({
      activeMinigame: gameId,
      minigameContext: {
        effect,
        storyletId,
        choiceId
      }
    });
  },
  
  // Complete a minigame
  completeMinigame: (success: boolean, stats?: any) => {
    const { minigameContext, activeStoryletIds, completedStoryletIds, allStorylets } = get();
    
    if (!minigameContext) {
      console.warn('No minigame context found');
      return;
    }
    
    console.log(`🎮 Minigame completed: ${success ? 'SUCCESS' : 'FAILURE'}`, stats);
    
    const { effect, storyletId, choiceId } = minigameContext;
    
    // Apply success or failure effects
    if (success && effect.onSuccess) {
      effect.onSuccess.forEach(successEffect => get().applyEffect(successEffect));
    } else if (!success && effect.onFailure) {
      effect.onFailure.forEach(failureEffect => get().applyEffect(failureEffect));
    }
    
    // Complete the storylet now that the minigame is done
    if (storyletId && choiceId) {
      const storylet = allStorylets[storyletId];
      if (storylet) {
        // Convert storylet choice to quest achievement
        try {
          if (typeof window !== 'undefined' && (window as any).useAppStore) {
            (window as any).useAppStore.getState().convertStoryletToQuest(storyletId, choiceId);
          }
        } catch (error) {
          console.warn('Could not convert storylet to quest:', error);
        }
        
        // Mark storylet as completed
        const newActiveIds = activeStoryletIds.filter(id => id !== storyletId);
        const newCompletedIds = [...completedStoryletIds, storyletId];
        
        // Set cooldown for resource-based storylets (3 days)
        const cooldownDay = storylet.trigger.type === 'resource' ? 
          ((() => {
            try {
              if (typeof window !== 'undefined' && (window as any).useAppStore) {
                return (window as any).useAppStore.getState().day + 3;
              }
              return 999; // fallback
            } catch {
              return 999; // fallback
            }
          })()) : undefined;
        
        set((state) => ({
          activeStoryletIds: newActiveIds,
          completedStoryletIds: newCompletedIds,
          storyletCooldowns: cooldownDay ? {
            ...state.storyletCooldowns,
            [storyletId]: cooldownDay
          } : state.storyletCooldowns
        }));
        
        // Re-evaluate storylets in case new conditions are met
        setTimeout(() => {
          get().evaluateStorylets();
        }, 100);
      }
    }
    
    // Resume time when minigame completes
    try {
      if (typeof window !== 'undefined' && (window as any).useAppStore) {
        (window as any).useAppStore.getState().resumeTime();
      }
    } catch (error) {
      console.warn('Could not resume time:', error);
    }
    
    // Clear minigame state
    set({
      activeMinigame: null,
      minigameContext: null
    });
  },
  
  // Close minigame without completing
  closeMinigame: () => {
    const { minigameContext, activeStoryletIds, completedStoryletIds, allStorylets } = get();
    
    console.log('🎮 Minigame closed');
    
    // Complete the storylet even if minigame was closed (treat as cancellation)
    if (minigameContext && minigameContext.storyletId && minigameContext.choiceId) {
      const { storyletId, choiceId } = minigameContext;
      const storylet = allStorylets[storyletId];
      if (storylet) {
        // Mark storylet as completed
        const newActiveIds = activeStoryletIds.filter(id => id !== storyletId);
        const newCompletedIds = [...completedStoryletIds, storyletId];
        
        set((state) => ({
          activeStoryletIds: newActiveIds,
          completedStoryletIds: newCompletedIds
        }));
        
        // Re-evaluate storylets
        setTimeout(() => {
          get().evaluateStorylets();
        }, 100);
      }
    }
    
    // Resume time when minigame is closed
    try {
      if (typeof window !== 'undefined' && (window as any).useAppStore) {
        (window as any).useAppStore.getState().resumeTime();
      }
    } catch (error) {
      console.warn('Could not resume time:', error);
    }
    
    set({
      activeMinigame: null,
      minigameContext: null
    });
  }
}), {
  name: 'storylet-store',
  partialize: (state) => ({
    activeFlags: state.activeFlags,
    completedStoryletIds: state.completedStoryletIds,
    storyletCooldowns: state.storyletCooldowns
  })
}));

// Expose global testing function
if (typeof window !== 'undefined') {
  // Expose the store globally for console access
  (window as any).useStoryletStore = useStoryletStore;
  
  (window as any).testStorylets = () => {
    const store = useStoryletStore.getState();
    console.log('Current storylet state:');
    console.log('Active flags:', store.activeFlags);
    console.log('Active storylets:', store.activeStoryletIds);
    console.log('Completed storylets:', store.completedStoryletIds);
    console.log('Current storylet:', store.getCurrentStorylet()?.name || 'None');
    
    // Force evaluation
    store.evaluateStorylets();
    console.log('After evaluation - Active storylets:', store.activeStoryletIds);
    
    return store;
  };
  
  (window as any).resetStorylets = () => {
    const store = useStoryletStore.getState();
    store.resetStorylets();
    console.log('Storylets reset!');
    return store;
  };
}
