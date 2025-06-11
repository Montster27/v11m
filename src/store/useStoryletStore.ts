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
import { startingStorylets } from '../data/startingStorylets';
import { emmaRomanceStorylets, emmaInfluenceStorylets } from '../data/emmaRomanceArc';
import { globalTimeoutManager } from '../utils/timeoutManager';
import { getAppState, getNPCStore, isAppStoreAvailable, isNPCStoreAvailable, isIntegratedCharacterStoreAvailable, isSkillSystemV2StoreAvailable, isSaveStoreAvailable } from '../types/global';
import { debounce, AsyncQueue } from '../utils/debounce';

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

interface StoryletState {
  // Core storylet data
  allStorylets: Record<string, Storylet>;           // the full catalog loaded at startup
  activeFlags: Record<string, boolean>;             // tracks boolean flags
  activeStoryletIds: string[];                      // IDs of storylets currently unlocked and available
  completedStoryletIds: string[];                   // storylets the player has finished (to prevent repeats)
  storyletCooldowns: Record<string, number>;        // storylet ID -> day when it can trigger again
  
  // Story arc management
  storyArcs: string[];                              // list of available story arcs
  
  // Development settings
  deploymentFilter: Set<'live' | 'stage' | 'dev'>;  // which deployment statuses to show (can be multiple)
  
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
  updateStorylet: (storylet: Storylet) => void;     // update an existing storylet
  deleteStorylet: (storyletId: string) => void;     // delete a storylet from the catalog
  addStoryArc: (arcName: string) => void;           // add a new story arc
  removeStoryArc: (arcName: string) => void;        // remove a story arc (and clear from storylets)
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
  resetStorylets: () => void;                       // reset storylet system for testing
  applyEffect: (effect: Effect, context?: { storyletId?: string; choiceId?: string }) => void; // apply a single effect
  launchMinigame: (gameId: MinigameType, effect: Effect, storyletId: string, choiceId: string) => void;
  completeMinigame: (success: boolean, stats?: any) => void;
  closeMinigame: () => void;
  launchClueDiscovery: (effect: Effect, storyletId: string, choiceId: string) => void;
  completeClueDiscovery: (success: boolean, clueId: string) => void;
  
  // Development actions
  setDeploymentFilter: (filter: Set<'live' | 'stage' | 'dev'>) => void; // set which deployment statuses to show
  toggleDeploymentStatus: (status: 'live' | 'stage' | 'dev') => void; // toggle a deployment status in the filter
  updateStoryletDeploymentStatus: (storyletId: string, status: 'dev' | 'stage' | 'live') => void; // update storylet deployment status
}

// Helper functions to reduce cognitive complexity
// Note: getAppState is now imported from types/global.ts for type safety

// Global evaluation queue to prevent race conditions
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

const evaluateNPCRelationshipTrigger = (trigger: any) => {
  try {
    const npcStore = getNPCStore();
    if (!npcStore) return false;
    
    const { npcId, minLevel, maxLevel, relationshipType } = trigger.conditions;
    
    if (npcId) {
      const relationshipLevel = npcStore.getRelationshipLevel(npcId);
      const currentType = npcStore.getRelationshipType(npcId);
      
      // Check level requirements
      if (minLevel !== undefined && relationshipLevel < minLevel) return false;
      if (maxLevel !== undefined && relationshipLevel > maxLevel) return false;
      
      // Check type requirements
      if (relationshipType && currentType !== relationshipType) return false;
      
      return true;
    }
  } catch (error) {
    console.warn('Could not evaluate NPC relationship trigger:', error);
  }
  return false;
};

const evaluateNPCAvailabilityTrigger = (trigger: any) => {
  try {
    const npcStore = getNPCStore();
    if (!npcStore) return false;
    
    const { npcId, locationId, availability } = trigger.conditions;
    
    if (npcId) {
      const npc = npcStore.getNPC(npcId);
      if (!npc) return false;
      
      // Check availability status
      if (availability && npc.currentStatus.availability !== availability) return false;
      
      // Check location availability
      if (locationId) {
        return npcStore.isNPCAvailableAt(npcId, locationId);
      }
      
      return true;
    }
  } catch (error) {
    console.warn('Could not evaluate NPC availability trigger:', error);
  }
  return false;
};

const evaluateStoryletTrigger = (trigger: any, activeFlags: any, appState: any) => {
  switch (trigger.type) {
    case 'time':
      return evaluateTimeTrigger(trigger, appState);
      
    case 'flag':
      return evaluateFlagTrigger(trigger, activeFlags);
      
    case 'resource':
      return evaluateResourceTrigger(trigger, appState);
      
    case 'npc_relationship':
      return evaluateNPCRelationshipTrigger(trigger);
      
    case 'npc_availability':
      return evaluateNPCAvailabilityTrigger(trigger);
      
    default:
      return false;
  }
};

export const useStoryletStore = create<StoryletState>()(persist((set, get) => ({
  // Initial state
  allStorylets: { 
    ...startingStorylets,
    ...immediateStorylets, 
    ...frequentStorylets, 
    ...collegeStorylets, 
    ...minigameStorylets, 
    ...integratedStorylets,
    ...developmentTriggeredStorylets,
    ...emmaRomanceStorylets,
    ...emmaInfluenceStorylets
  },
  activeFlags: {},
  activeStoryletIds: [],
  completedStoryletIds: [],
  storyletCooldowns: {},
  
  // Story arc management
  storyArcs: ['Starting', 'Main Story', 'Side Quests', 'Character Development', 'Academic Journey'],
  
  // Development settings
  deploymentFilter: new Set(['live']) as Set<'live' | 'stage' | 'dev'>,
  
  // Minigame state
  activeMinigame: null,
  minigameContext: null,
  
  // Evaluate storylets - check triggers and unlock eligible storylets
  evaluateStorylets: () => {
    // Use queue to prevent race conditions during evaluation
    evaluationQueue.add(async () => {
      return get()._evaluateStoryletsSync();
    });
  },

  // Internal synchronous evaluation (for queue)
  _evaluateStoryletsSync: () => {
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
        
        // Special logging for Starting storylets
        if (storylet.storyArc === 'Starting') {
          console.log(`🎯 STARTING STORYLET: ${storylet.id}`, {
            trigger: storylet.trigger,
            deploymentStatus: storylet.deploymentStatus,
            currentDay: appState?.day
          });
        }
      }
      
      // Skip storylets based on deployment status
      const storyletStatus = storylet.deploymentStatus || 'live';
      const shouldShowByDeployment = state.deploymentFilter.has(storyletStatus);
      
      if (!shouldShowByDeployment) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚫 Skipping ${storylet.id} due to deployment filter:`, {
            storyletStatus,
            currentFilter: Array.from(state.deploymentFilter)
          });
        }
        return;
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
        } else if (storylet.trigger.type === 'npc_relationship') {
          triggerDetails.npcRelationshipEvaluation = {
            required: storylet.trigger.conditions,
            met: evaluateNPCRelationshipTrigger(storylet.trigger)
          };
        } else if (storylet.trigger.type === 'npc_availability') {
          triggerDetails.npcAvailabilityEvaluation = {
            required: storylet.trigger.conditions,
            met: evaluateNPCAvailabilityTrigger(storylet.trigger)
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
    // Input validation
    if (!storyletId || typeof storyletId !== 'string') {
      console.error('Invalid storyletId provided:', storyletId);
      return;
    }
    
    if (!choiceId || typeof choiceId !== 'string') {
      console.error('Invalid choiceId provided:', choiceId);
      return;
    }
    
    const { allStorylets, activeStoryletIds, completedStoryletIds } = get();
    
    // Find the storylet and choice
    const storylet = allStorylets[storyletId];
    if (!storylet) {
      console.error('Storylet not found:', storyletId);
      return;
    }
    
    if (!Array.isArray(storylet.choices)) {
      console.error('Storylet has invalid choices array:', storyletId);
      return;
    }
    
    const choice = storylet.choices.find(c => c.id === choiceId);
    if (!choice) {
      console.error('Choice not found:', choiceId, 'Available choices:', storylet.choices.map(c => c.id));
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
            get().applyEffect(effect, { storyletId, choiceId });
          }
        });
        
        // Don't complete the storylet yet - it will be completed when the minigame finishes
        return;
      }
    }

    // Check if there's a clue discovery effect that needs to be handled
    const hasClueDiscoveryEffect = choice.effects.some(effect => effect.type === 'clueDiscovery');
    
    if (hasClueDiscoveryEffect) {
      // Find and launch the clue discovery, potentially with minigame
      const clueEffect = choice.effects.find(effect => effect.type === 'clueDiscovery');
      if (clueEffect) {
        console.log(`🔍 Triggering clue discovery: ${clueEffect.clueId} from storylet ${storyletId}`);
        get().launchClueDiscovery(clueEffect, storyletId, choiceId);
        
        // Apply non-clue-discovery effects immediately
        choice.effects.forEach((effect) => {
          if (effect.type !== 'clueDiscovery') {
            get().applyEffect(effect, { storyletId, choiceId });
          }
        });
        
        // Don't complete the storylet yet - it will be completed when the clue discovery finishes
        return;
      }
    }
    
    // Apply all effects (no minigame)
    choice.effects.forEach((effect) => {
      get().applyEffect(effect, { storyletId, choiceId });
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
    
    // Re-evaluate storylets in case new conditions are met (using managed timeout)
    globalTimeoutManager.setTimeout(() => {
      const currentState = get();
      if (currentState && typeof currentState.evaluateStorylets === 'function') {
        currentState.evaluateStorylets();
      }
    }, 100);
  },
  
  // Apply an individual effect
  applyEffect: (effect: Effect, context?: { storyletId?: string; choiceId?: string }) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚙️ Applying effect:`, effect);
    }
    
    switch (effect.type) {
      case 'resource':
        try {
          if (typeof window !== 'undefined' && (window as any).useAppStore) {
            const appStore = (window as any).useAppStore.getState();
            const currentValue = appStore.resources[effect.key];
            const newValue = effect.key === 'energy' || effect.key === 'stress'
              ? Math.max(0, Math.min(100, currentValue + effect.delta))   // Energy and stress capped at 100
              : Math.max(0, currentValue + effect.delta);                 // Knowledge, social, money can grow unlimited
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
          
          // Try V2 Skill System
          if (typeof window !== 'undefined' && (window as any).useSkillSystemV2Store) {
            const skillStore = (window as any).useSkillSystemV2Store.getState();
            // Map old skill names to new competencies
            const competencyMap: Record<string, string> = {
              // V2 hyphenated names (direct mapping)
              'bureaucratic-navigation': 'bureaucratic-navigation',
              'resource-acquisition': 'resource-acquisition',
              'information-warfare': 'information-warfare',
              'alliance-building': 'alliance-building',
              'operational-security': 'operational-security',
              // V1 camelCase names (legacy mapping)
              'bureaucraticNavigation': 'bureaucratic-navigation',
              'resourceAcquisition': 'resource-acquisition',
              'informationWarfare': 'information-warfare',
              'allianceBuilding': 'alliance-building',
              'operationalSecurity': 'operational-security',
              'perseverance': 'operational-security' // Map perseverance to operational security
            };
            
            if (competencyMap[effect.key]) {
              skillStore.addCompetencyXP(competencyMap[effect.key], effect.amount);
              return;
            }
            
            // Try foundation tracks
            if (effect.key === 'academic' || effect.key === 'working') {
              skillStore.addFoundationXP(effect.key, effect.amount);
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
        
      case 'foundationXp':
        // Award XP to foundation experiences in V2 skill system
        try {
          if (typeof window !== 'undefined' && (window as any).useSkillSystemV2Store) {
            const skillStore = (window as any).useSkillSystemV2Store.getState();
            skillStore.addFoundationXP(effect.key, effect.amount);
          }
        } catch (error) {
          console.warn('Could not add foundation XP:', error);
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

      case 'clueDiscovery':
        // Clue discovery effects are handled in chooseStorylet, not here
        console.warn('Clue discovery effect should be handled in chooseStorylet, not applyEffect');
        break;
        
      case 'npcRelationship':
        try {
          if (typeof window !== 'undefined' && (window as any).useNPCStore) {
            const npcStore = (window as any).useNPCStore.getState();
            npcStore.adjustRelationship(effect.npcId, effect.delta, effect.reason || 'Storylet interaction');
            if (process.env.NODE_ENV === 'development') {
              console.log(`💝 Adjusted ${effect.npcId} relationship by ${effect.delta}`);
            }
          }
        } catch (error) {
          console.warn('Could not adjust NPC relationship:', error);
        }
        break;
        
      case 'npcMemory':
        try {
          if (typeof window !== 'undefined' && (window as any).useNPCStore) {
            const npcStore = (window as any).useNPCStore.getState();
            const storyletId = context?.storyletId || 'unknown_storylet';
            const choiceId = context?.choiceId || 'unknown_choice';
            npcStore.addMemory(effect.npcId, effect.memory, storyletId, choiceId);
            if (process.env.NODE_ENV === 'development') {
              console.log(`🧠 Added memory to ${effect.npcId}: ${effect.memory.description}`);
            }
          }
        } catch (error) {
          console.warn('Could not add NPC memory:', error);
        }
        break;
        
      case 'npcFlag':
        try {
          if (typeof window !== 'undefined' && (window as any).useNPCStore) {
            const npcStore = (window as any).useNPCStore.getState();
            npcStore.setNPCFlag(effect.npcId, effect.flag, effect.value);
            if (process.env.NODE_ENV === 'development') {
              console.log(`🏷️ Set ${effect.npcId} flag ${effect.flag} to ${effect.value}`);
            }
          }
        } catch (error) {
          console.warn('Could not set NPC flag:', error);
        }
        break;
        
      case 'npcMood':
        try {
          if (typeof window !== 'undefined' && (window as any).useNPCStore) {
            const npcStore = (window as any).useNPCStore.getState();
            npcStore.updateNPCMood(effect.npcId, effect.mood, effect.duration);
            if (process.env.NODE_ENV === 'development') {
              console.log(`😊 Set ${effect.npcId} mood to ${effect.mood}${effect.duration ? ` for ${effect.duration}s` : ''}`);
            }
          }
        } catch (error) {
          console.warn('Could not set NPC mood:', error);
        }
        break;
        
      case 'npcAvailability':
        try {
          if (typeof window !== 'undefined' && (window as any).useNPCStore) {
            const npcStore = (window as any).useNPCStore.getState();
            npcStore.updateNPCAvailability(effect.npcId, effect.availability, effect.duration);
            if (process.env.NODE_ENV === 'development') {
              console.log(`📍 Set ${effect.npcId} availability to ${effect.availability}${effect.duration ? ` for ${effect.duration}s` : ''}`);
            }
          }
        } catch (error) {
          console.warn('Could not set NPC availability:', error);
        }
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
    console.log(`🎯 addStorylet called with:`, storylet);
    console.log(`🎯 Current allStorylets keys:`, Object.keys(get().allStorylets));
    
    set((state) => {
      const newState = {
        allStorylets: {
          ...state.allStorylets,
          [storylet.id]: storylet
        }
      };
      console.log(`🎯 New allStorylets keys:`, Object.keys(newState.allStorylets));
      return newState;
    });
    
    console.log(`🎯 After set, allStorylets keys:`, Object.keys(get().allStorylets));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Added new storylet: ${storylet.id}`);
    }
  },

  // Update an existing storylet
  updateStorylet: (storylet: Storylet) => {
    set((state) => ({
      allStorylets: {
        ...state.allStorylets,
        [storylet.id]: storylet
      }
    }));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✏️ Updated storylet: ${storylet.id}`);
    }
  },

  // Delete a storylet from the catalog
  deleteStorylet: (storyletId: string) => {
    set((state) => {
      const { [storyletId]: deleted, ...remaining } = state.allStorylets;
      return {
        allStorylets: remaining,
        activeStoryletIds: state.activeStoryletIds.filter(id => id !== storyletId),
        completedStoryletIds: state.completedStoryletIds.filter(id => id !== storyletId),
        storyletCooldowns: Object.fromEntries(
          Object.entries(state.storyletCooldowns).filter(([id]) => id !== storyletId)
        )
      };
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Deleted storylet: ${storyletId}`);
    }
  },

  // Story arc management
  addStoryArc: (arcName: string) => {
    set((state) => {
      if (!state.storyArcs.includes(arcName)) {
        return {
          storyArcs: [...state.storyArcs, arcName]
        };
      }
      return state;
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📚 Added story arc: ${arcName}`);
    }
  },

  removeStoryArc: (arcName: string) => {
    set((state) => {
      // Remove arc from list
      const newStoryArcs = state.storyArcs.filter(arc => arc !== arcName);
      
      // Clear arc from all storylets that use it
      const updatedStorylets = Object.fromEntries(
        Object.entries(state.allStorylets).map(([id, storylet]) => [
          id,
          storylet.storyArc === arcName 
            ? { ...storylet, storyArc: undefined }
            : storylet
        ])
      );
      
      return {
        storyArcs: newStoryArcs,
        allStorylets: updatedStorylets
      };
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Removed story arc: ${arcName}`);
    }
  },

  getStoryletsByArc: (arcName: string) => {
    const { allStorylets } = get();
    return Object.values(allStorylets).filter(storylet => storylet.storyArc === arcName);
  },

  // Helper function to normalize arc names for flag keys
  _normalizeArcName: (arcName: string) => {
    return arcName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  },

  // Story arc progression helpers
  getArcProgress: (arcName: string) => {
    const { activeFlags, allStorylets, completedStoryletIds } = get();
    const arcKey = get()._normalizeArcName(arcName);
    
    const arcStorylets = Object.values(allStorylets)
      .filter(s => s.storyArc === arcName)
      .sort((a, b) => a.id.localeCompare(b.id));
    
    if (arcStorylets.length === 0) {
      return {
        total: 0,
        completed: 0,
        failed: false,
        percentage: 0
      };
    }
    
    // Check for terminal failure
    const failed = activeFlags[`${arcKey}:terminal_failure`] || false;
    const failureReason = failed ? activeFlags[`${arcKey}:failure_reason`] as string : undefined;
    
    // Count completed storylets (either via arc flags or completion system)
    const completed = arcStorylets.filter(s => 
      activeFlags[`${arcKey}:${s.id}_complete`] || 
      completedStoryletIds.includes(s.id)
    ).length;
    
    // Find current active storylet
    const currentStorylet = arcStorylets.find(s => 
      get().activeStoryletIds.includes(s.id)
    );
    
    return {
      total: arcStorylets.length,
      completed,
      failed,
      failureReason,
      current: currentStorylet?.name,
      percentage: Math.round((completed / arcStorylets.length) * 100)
    };
  },

  getActiveArcs: () => {
    const { storyArcs } = get();
    return storyArcs.filter(arc => {
      const progress = get().getArcProgress(arc);
      return progress.total > 0 && !progress.failed && progress.completed < progress.total;
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
    const { storyArcs } = get();
    return storyArcs.map(arc => {
      const progress = get().getArcProgress(arc);
      
      let status: 'active' | 'complete' | 'failed' | 'not_started';
      if (progress.total === 0) {
        status = 'not_started';
      } else if (progress.failed) {
        status = 'failed';
      } else if (progress.completed === progress.total) {
        status = 'complete';
      } else {
        status = 'active';
      }
      
      return {
        name: arc,
        status,
        progress: `${progress.completed}/${progress.total}`,
        current: progress.current,
        failureReason: progress.failureReason
      };
    });
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
    globalTimeoutManager.setTimeout(() => {
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
    
    // Handle clue discovery minigames differently from regular minigames
    if (effect.type === 'clueDiscovery') {
      // Let completeClueDiscovery handle this
      get().completeClueDiscovery(success, effect.clueId);
      return;
    }
    
    // Handle legacy minigame effects with gameId
    if (success && effect.gameId) {
      try {
        if (typeof window !== 'undefined' && (window as any).triggerClueDiscovery) {
          const appStore = getAppState();
          const characterId = appStore?.activeCharacter?.id || 'default';
          const clueResult = (window as any).triggerClueDiscovery(effect.gameId, storyletId, characterId);
          
          if (clueResult) {
            console.log(`🔍 Clue discovered: ${clueResult.clue.title}`);
            
            // Show notification
            if (typeof window !== 'undefined' && (window as any).showClueNotification) {
              (window as any).showClueNotification(clueResult);
            }
          }
        }
      } catch (error) {
        console.warn('Could not trigger clue discovery:', error);
      }
    }
    
    // Apply success or failure effects
    if (success && effect.onSuccess) {
      effect.onSuccess.forEach(successEffect => get().applyEffect(successEffect, { storyletId, choiceId }));
    } else if (!success && effect.onFailure) {
      effect.onFailure.forEach(failureEffect => get().applyEffect(failureEffect, { storyletId, choiceId }));
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
        globalTimeoutManager.setTimeout(() => {
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
        globalTimeoutManager.setTimeout(() => {
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
  },
  
  // Launch clue discovery (potentially with minigame)
  launchClueDiscovery: (effect: Effect, storyletId: string, choiceId: string) => {
    if (effect.type !== 'clueDiscovery') {
      console.error('Invalid effect type for clue discovery:', effect);
      return;
    }

    console.log(`🔍 Launching clue discovery: ${effect.clueId}`);
    
    // Check if clue discovery includes a minigame
    if (effect.minigameType) {
      console.log(`🎮 Clue discovery includes minigame: ${effect.minigameType}`);
      
      // Pause time when launching minigame
      try {
        if (typeof window !== 'undefined' && (window as any).useAppStore) {
          (window as any).useAppStore.getState().pauseTime();
        }
      } catch (error) {
        console.warn('Could not pause time:', error);
      }
      
      // Launch the minigame but with clue discovery context
      set({
        activeMinigame: effect.minigameType as MinigameType,
        minigameContext: {
          effect,
          storyletId,
          choiceId
        }
      });
    } else {
      // Direct clue discovery without minigame
      try {
        if (typeof window !== 'undefined' && (window as any).useClueStore) {
          const clueStore = (window as any).useClueStore.getState();
          const appState = getAppState();
          const characterId = appState?.activeCharacter?.id || 'default';
          
          // Discover the clue directly
          const discoveryResult = clueStore.discoverClue(effect.clueId, storyletId, characterId);
          
          if (discoveryResult) {
            console.log(`🔍 Clue discovered directly: ${discoveryResult.title}`);
            
            // Show notification if available
            if (typeof window !== 'undefined' && (window as any).showClueNotification) {
              (window as any).showClueNotification({
                clue: discoveryResult,
                minigameType: 'none',
                storyletId,
                characterId
              });
            }
            
            // Apply success effects if any
            if (effect.onSuccess) {
              effect.onSuccess.forEach(successEffect => 
                get().applyEffect(successEffect, { storyletId, choiceId })
              );
            }
          } else {
            console.warn(`Failed to discover clue: ${effect.clueId}`);
            
            // Apply failure effects if any
            if (effect.onFailure) {
              effect.onFailure.forEach(failureEffect => 
                get().applyEffect(failureEffect, { storyletId, choiceId })
              );
            }
          }
        }
      } catch (error) {
        console.warn('Could not trigger direct clue discovery:', error);
        
        // Apply failure effects on error
        if (effect.onFailure) {
          effect.onFailure.forEach(failureEffect => 
            get().applyEffect(failureEffect, { storyletId, choiceId })
          );
        }
      }
      
      // Complete the clue discovery process
      get().completeClueDiscovery(true, effect.clueId);
    }
  },
  
  // Complete clue discovery (called after minigame or direct discovery)
  completeClueDiscovery: (success: boolean, clueId: string) => {
    const { minigameContext, activeStoryletIds, completedStoryletIds, allStorylets } = get();
    
    console.log(`🔍 Clue discovery completed: ${success ? 'SUCCESS' : 'FAILURE'} for clue ${clueId}`);
    
    // If this was triggered by a minigame, handle the minigame completion
    if (minigameContext && minigameContext.effect.type === 'clueDiscovery') {
      const { effect, storyletId, choiceId } = minigameContext;
      
      if (success && effect.clueId === clueId) {
        // Trigger actual clue discovery
        try {
          if (typeof window !== 'undefined' && (window as any).useClueStore) {
            const clueStore = (window as any).useClueStore.getState();
            const appState = getAppState();
            const characterId = appState?.activeCharacter?.id || 'default';
            
            const discoveryResult = clueStore.discoverClue(clueId, storyletId, characterId);
            
            if (discoveryResult) {
              console.log(`🔍 Clue discovered via minigame: ${discoveryResult.title}`);
              
              // Show notification
              if (typeof window !== 'undefined' && (window as any).showClueNotification) {
                (window as any).showClueNotification({
                  clue: discoveryResult,
                  minigameType: effect.minigameType || 'unknown',
                  storyletId,
                  characterId
                });
              }
            }
          }
        } catch (error) {
          console.warn('Could not trigger clue discovery after minigame:', error);
        }
      }
      
      // Apply success or failure effects
      if (success && effect.onSuccess) {
        effect.onSuccess.forEach(successEffect => 
          get().applyEffect(successEffect, { storyletId, choiceId })
        );
      } else if (!success && effect.onFailure) {
        effect.onFailure.forEach(failureEffect => 
          get().applyEffect(failureEffect, { storyletId, choiceId })
        );
      }
      
      // Complete the storylet now that clue discovery is done
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
          globalTimeoutManager.setTimeout(() => {
            get().evaluateStorylets();
          }, 100);
        }
      }
      
      // Resume time when clue discovery completes (if there was a minigame)
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
    }
  },
  
  // Development actions
  setDeploymentFilter: (filter: Set<'live' | 'stage' | 'dev'>) => {
    console.log(`🔧 Setting deployment filter to: ${Array.from(filter).join(', ')}`);
    set({ deploymentFilter: new Set(filter) });
    
    // Re-evaluate storylets with new filter
    globalTimeoutManager.setTimeout(() => {
      get().evaluateStorylets();
    }, 100);
  },

  toggleDeploymentStatus: (status: 'live' | 'stage' | 'dev') => {
    const { deploymentFilter } = get();
    const newFilter = new Set(deploymentFilter);
    
    if (newFilter.has(status)) {
      newFilter.delete(status);
    } else {
      newFilter.add(status);
    }
    
    // Ensure at least one filter is always active
    if (newFilter.size === 0) {
      newFilter.add('live');
    }
    
    console.log(`🔧 Toggled ${status}, new filter: ${Array.from(newFilter).join(', ')}`);
    set({ deploymentFilter: newFilter });
    
    // Re-evaluate storylets with new filter
    globalTimeoutManager.setTimeout(() => {
      get().evaluateStorylets();
    }, 100);
  },
  
  updateStoryletDeploymentStatus: (storyletId: string, status: 'dev' | 'stage' | 'live') => {
    const { allStorylets } = get();
    const storylet = allStorylets[storyletId];
    
    if (storylet) {
      console.log(`🔧 Updating ${storyletId} deployment status to: ${status}`);
      
      set({
        allStorylets: {
          ...allStorylets,
          [storyletId]: {
            ...storylet,
            deploymentStatus: status
          }
        }
      });
      
      // Re-evaluate storylets
      globalTimeoutManager.setTimeout(() => {
        get().evaluateStorylets();
      }, 100);
    } else {
      console.warn(`Storylet ${storyletId} not found`);
    }
  }
}), {
  name: 'storylet-store',
  partialize: (state) => ({
    allStorylets: state.allStorylets,
    activeFlags: state.activeFlags,
    completedStoryletIds: state.completedStoryletIds,
    storyletCooldowns: state.storyletCooldowns,
    storyArcs: state.storyArcs,
    deploymentFilter: Array.from(state.deploymentFilter) // Convert Set to Array for serialization
  }),
  merge: (persistedState: any, currentState: any) => {
    const mergedStorylets = {
      ...currentState.allStorylets,
      ...(persistedState?.allStorylets || {})
    };
    console.log('🔄 Merging state - Current storylets:', Object.keys(currentState.allStorylets).length);
    console.log('🔄 Merging state - Persisted storylets:', Object.keys(persistedState?.allStorylets || {}).length);
    console.log('🔄 Merging state - Final storylets:', Object.keys(mergedStorylets).length);
    
    return {
      ...currentState,
      ...persistedState,
      // Always use current state's allStorylets to include any new storylets added in code
      allStorylets: mergedStorylets,
      deploymentFilter: new Set(persistedState?.deploymentFilter || ['live']) // Convert Array back to Set
    };
  }
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
