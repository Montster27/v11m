// /Users/montysharma/V11M2/src/store/useStoryletStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Storylet, Effect } from '../types/storylet';
import { sampleStorylets } from '../data/sampleStorylets';

interface StoryletState {
  // Core storylet data
  allStorylets: Record<string, Storylet>;           // the full catalog loaded at startup
  activeFlags: Record<string, boolean>;             // tracks boolean flags
  activeStoryletIds: string[];                      // IDs of storylets currently unlocked and available
  completedStoryletIds: string[];                   // storylets the player has finished (to prevent repeats)
  storyletCooldowns: Record<string, number>;        // storylet ID -> day when it can trigger again
  
  // Actions
  evaluateStorylets: () => void;                    // scan and unlock storylets based on triggers
  chooseStorylet: (storyletId: string, choiceId: string) => void;  // make a choice in a storylet
  unlockStorylet: (storyletId: string) => void;     // manually unlock a storylet
  setFlag: (key: string, value: boolean) => void;   // manually set a flag
  getFlag: (key: string) => boolean;                // get a flag value
  getCurrentStorylet: () => Storylet | null;        // get the first active storylet
  resetStorylets: () => void;                       // reset storylet system for testing
  applyEffect: (effect: Effect) => void;            // apply a single effect
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
  if (!appState) return false;
  
  if (trigger.conditions.day && appState.day >= trigger.conditions.day) {
    return true;
  }
  if (trigger.conditions.week && appState.day >= (trigger.conditions.week * 7)) {
    return true;
  }
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
    
    // Check min condition
    if (condition.min !== undefined && resourceValue < condition.min) {
      return false;
    }
    
    // Check max condition  
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
  allStorylets: sampleStorylets,
  activeFlags: {},
  activeStoryletIds: [],
  completedStoryletIds: [],
  storyletCooldowns: {},
  
  // Evaluate storylets - check triggers and unlock eligible storylets
  evaluateStorylets: () => {
    const state = get();
    const appState = getAppState();
    const newActiveIds: string[] = [];
    
    Object.values(state.allStorylets).forEach((storylet) => {
      if (shouldSkipStorylet(storylet, state, appState)) {
        return;
      }
      
      if (evaluateStoryletTrigger(storylet.trigger, state.activeFlags, appState)) {
        newActiveIds.push(storylet.id);
      }
    });
    
    // Add newly unlocked storylets to active list
    if (newActiveIds.length > 0) {
      set((state) => ({
        activeStoryletIds: [...state.activeStoryletIds, ...newActiveIds]
      }));
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
    
    // Apply effects
    choice.effects.forEach((effect) => {
      get().applyEffect(effect);
    });
    
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
          if (typeof window !== 'undefined' && (window as any).useAppStore) {
            const appStore = (window as any).useAppStore.getState();
            appStore.addSkillXp(effect.key, effect.amount, 'Storylet');
          }
        } catch (error) {
          console.warn('Could not add skill XP:', error);
        }
        break;
        
      case 'unlock':
        get().unlockStorylet(effect.storyletId);
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
    set({
      activeFlags: {},
      activeStoryletIds: [],
      completedStoryletIds: [],
      storyletCooldowns: {}
    });
    
    // Re-evaluate after reset
    setTimeout(() => {
      get().evaluateStorylets();
    }, 100);
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
