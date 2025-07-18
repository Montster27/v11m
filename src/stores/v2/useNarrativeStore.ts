// /Users/montysharma/V11M2/src/stores/v2/useNarrativeStore.ts
// Consolidated store for storylets, unified flags, story arcs, and character concerns

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../../utils/debouncedStorage';
import type { Storylet } from '../../types/storylet';

// Store versioning for migration handling
const CURRENT_VERSION = 1;

export interface StoryArc {
  id: string;
  name: string;
  description: string;
  progress: number; // 0-1
  isCompleted: boolean;
  currentStorylet?: string;
  startedAt?: number;
  completedAt?: number;
  failures: number;
  metadata: {
    totalStorylets: number;
    completedStorylets: number;
    availableStorylets: string[];
    entryPoints: string[];
    deadEnds: string[];
    lastAccessed: number;
    createdAt: number;
  };
}

export interface ArcProgress {
  currentStoryletId?: string;
  completedStorylets: string[];
  availableStorylets: string[];
  flags: Record<string, any>;
  failures: Array<{
    storyletId: string;
    timestamp: number;
    reason: string;
  }>;
}

// Quest domain interface (Domain: Narrative)
export interface Quest {
  id: string;
  title: string;
  description: string;
  experienceReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  completed: boolean;
}

export interface NarrativeState {
  // Store hydration tracking
  _hasHydrated: boolean;
  
  storylets: {
    active: string[];
    completed: string[];
    cooldowns: Record<string, number>;
    userCreated: Storylet[]; // from storylet-catalog-store
  };
  
  // Quest domain (Domain: Narrative)
  quests: {
    active: Quest[];
    completed: Quest[];
  };
  
  flags: {
    // UNIFIED NAMESPACE - prevents conflicts from multiple flag stores
    storylet: Map<string, any>;     // from storylet-store
    storyletFlag: Map<string, any>; // from storylet-flag-store
    concerns: Map<string, any>;     // from character-concerns-store
    storyArc: Map<string, any>;     // from story-arc-store
  };
  
  // Enhanced Story Arc Management
  storyArcs: {
    [arcId: string]: StoryArc;
  };
  
  // Arc Progress Tracking  
  arcProgress: {
    [arcId: string]: ArcProgress;
  };
  
  concerns: {
    current: Record<string, any>;
    history: any[];
  };
  
  // Minigame achievement system
  achievements: {
    [achievementId: string]: {
      id: string;
      name: string;
      description: string;
      unlockedAt: number;
      gameId?: string;
      category: 'minigame' | 'story' | 'exploration' | 'character';
    };
  };
  
  // Minigame state (Domain: Narrative - Interactive Story Elements)
  minigames: {
    activeMinigame: string | null;
    completedMinigames: string[];
  };
  
  // Clue system (Domain: Narrative - Story Investigation)
  clues: {
    [clueId: string]: {
      id: string;
      name: string;
      description: string;
      content?: string;
      discovered: boolean;
      discoveredAt?: number;
      category?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      importance?: 'low' | 'medium' | 'high' | 'critical';
      storyArc?: string;
      arcOrder?: number;
      minigameTypes?: string[];
      associatedStorylets?: string[];
      positiveOutcomeStorylet?: string;
      negativeOutcomeStorylet?: string;
      tags?: string[];
      rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
    };
  };
  
  // Actions
  evaluateStoryletAvailability: (storyletId: string) => boolean;
  evaluateStorylets: () => void;
  evaluateStoryletTrigger: (storylet: any) => boolean;
  evaluateTimeTrigger: (trigger: any, coreGameStore: any) => boolean;
  evaluateFlagTrigger: (trigger: any, narrativeState: any) => boolean;
  evaluateResourceTrigger: (trigger: any, coreGameStore: any) => boolean;
  resetNarrative: () => void;
  migrateFromLegacyStores: () => void;
  
  // Storylet management
  addActiveStorylet: (storyletId: string) => void;
  removeActiveStorylet: (storyletId: string) => void;
  completeStorylet: (storyletId: string) => void;
  setCooldown: (storyletId: string, cooldownEnd: number) => void;
  unlockStorylet: (storyletId: string) => void;
  getCurrentStorylet: () => string | null;
  recordStoryletCompletion: (storyletId: string, choiceId: string, completionData?: any) => void;
  
  // Flag management
  setStoryletFlag: (key: string, value: any) => void;
  getStoryletFlag: (key: string) => any;
  setConcernFlag: (key: string, value: any) => void;
  getConcernFlag: (key: string) => any;
  setArcFlag: (key: string, value: any) => void;
  getArcFlag: (key: string) => any;
  
  // Enhanced Story arc management
  createArc: (arcData: Omit<StoryArc, 'id' | 'metadata'>) => string;
  updateArc: (arcId: string, updates: Partial<StoryArc>) => void;
  deleteArc: (arcId: string) => void;
  getArc: (arcId: string) => StoryArc | null;
  getAllArcs: () => StoryArc[];
  startArc: (arcId: string) => void;
  completeArc: (arcId: string) => void;
  recordArcFailure: (arcId: string, reason: string) => void;
  getArcProgress: (arcId: string) => ArcProgress | null;
  assignStoryletToArc: (storyletId: string, arcId: string) => void;
  getArcStorylets: (arcId: string) => string[];
  progressArcStorylet: (arcId: string, storyletId: string) => void;
  updateArcLastAccessed: (arcId: string) => void;
  
  // Clue management (Domain: Narrative - Story Investigation)  
  addClue: (clue: NarrativeState['clues'][string]) => void;
  updateClue: (clueId: string, updates: Partial<NarrativeState['clues'][string]>) => void;
  deleteClue: (clueId: string) => void;
  discoverClue: (clueId: string) => void;
  getClue: (clueId: string) => NarrativeState['clues'][string] | null;
  getAllClues: () => NarrativeState['clues'];
  getDiscoveredClues: () => NarrativeState['clues'][string][];
  getCluesByMinigame: (minigameId: string) => NarrativeState['clues'][string][];
  getCluesByStorylet: (storyletId: string) => NarrativeState['clues'][string][];
  createClue: (clueData: Partial<NarrativeState['clues'][string]> & { id: string }) => void;
  
  // Storylet catalog access (Domain: Narrative - User Created Content)
  getAllStorylets: () => Storylet[];
  getStorylet: (storyletId: string) => Storylet | null;
  addUserStorylet: (storylet: Storylet) => void;
  updateUserStorylet: (storyletId: string, updates: Partial<Storylet>) => void;
  removeUserStorylet: (storyletId: string) => void;
  getStoryletsForArc: (arcId: string) => Storylet[];
  
  // Concerns management
  updateConcerns: (concerns: Record<string, any>) => void;
  addConcernHistory: (entry: any) => void;
  
  // Quest management (Domain: Narrative)
  addQuest: (quest: Quest) => void;
  updateQuest: (questId: string, updatedQuest: Quest) => void;
  deleteQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  convertStoryletToQuest: (storyletId: string, choiceId: string) => void;
  getActiveQuests: () => Quest[];
  getCompletedQuests: () => Quest[];
  
  // Achievement system
  unlockAchievement: (achievementId: string, name: string, description: string, gameId?: string, category?: 'minigame' | 'story' | 'exploration' | 'character') => void;
  getUnlockedAchievements: (gameId?: string, category?: string) => NarrativeState['achievements'][string][];
  hasAchievement: (achievementId: string) => boolean;
  
  // Minigame management (Domain: Narrative - Interactive Story Elements)
  setActiveMinigame: (minigameId: string | null) => void;
  completeMinigame: (minigameId: string) => void;
  closeMinigame: () => void;
  getActiveMinigame: () => string | null;
  
  // Store hydration tracking
  setHasHydrated: (state: boolean) => void;
}

const getInitialNarrativeState = (): Omit<NarrativeState, 
  'evaluateStoryletAvailability' | 'evaluateStorylets' | 'evaluateStoryletTrigger' | 'evaluateTimeTrigger' | 'evaluateFlagTrigger' | 'evaluateResourceTrigger' | 'resetNarrative' | 'migrateFromLegacyStores' |
  'addActiveStorylet' | 'removeActiveStorylet' | 'completeStorylet' | 'setCooldown' | 'unlockStorylet' | 'getCurrentStorylet' | 'recordStoryletCompletion' |
  'setStoryletFlag' | 'getStoryletFlag' | 'setConcernFlag' | 'getConcernFlag' |
  'setArcFlag' | 'getArcFlag' | 'createArc' | 'updateArc' | 'deleteArc' |
  'getArc' | 'getAllArcs' | 'startArc' | 'completeArc' | 'recordArcFailure' |
  'getArcProgress' | 'assignStoryletToArc' | 'getArcStorylets' | 'progressArcStorylet' | 'updateArcLastAccessed' |
  'updateConcerns' | 'addConcernHistory' | 'addQuest' | 'updateQuest' | 'deleteQuest' | 'completeQuest' | 'convertStoryletToQuest' | 'getActiveQuests' | 'getCompletedQuests' |
  'unlockAchievement' | 'getUnlockedAchievements' | 'hasAchievement' |
  'setActiveMinigame' | 'completeMinigame' | 'closeMinigame' | 'getActiveMinigame' |
  'addClue' | 'updateClue' | 'deleteClue' | 'discoverClue' | 'getClue' | 'getAllClues' | 'getDiscoveredClues' | 'getCluesByMinigame' | 'getCluesByStorylet' | 'createClue' |
  'getAllStorylets' | 'getStorylet' | 'addUserStorylet' | 'updateUserStorylet' | 'removeUserStorylet' | 'getStoryletsForArc' | 'setHasHydrated'
> => ({
  // Store hydration tracking
  _hasHydrated: false,
  
  storylets: {
    active: [],
    completed: [],
    cooldowns: {},
    userCreated: []
  },
  
  // Quest domain initial state (Domain: Narrative)
  quests: {
    active: [],
    completed: []
  },
  
  flags: {
    storylet: new Map(),
    storyletFlag: new Map(),
    concerns: new Map(),
    storyArc: new Map()
  },
  storyArcs: {},
  arcProgress: {},
  concerns: {
    current: {},
    history: []
  },
  achievements: {},
  
  // Minigame state initial state (Domain: Narrative - Interactive Story Elements)
  minigames: {
    activeMinigame: null,
    completedMinigames: []
  },
  
  // Clue system initial state (Domain: Narrative - Story Investigation)
  clues: {}
});

export const useNarrativeStore = create<NarrativeState>()(
  persist(
    (set, get) => ({
      ...getInitialNarrativeState(),

      // Unified storylet evaluation
      evaluateStoryletAvailability: (storyletId: string): boolean => {
        // Single source of truth for all flag checks
        // No auto-save timing concerns
        const state = get();
        
        // Get storylet data
        const storylet = state.storylets.userCreated.find(s => s.id === storyletId);
        if (!storylet) return false;
        
        // Check if storylet is on cooldown
        const cooldownEnd = state.storylets.cooldowns[storyletId];
        if (cooldownEnd && Date.now() < cooldownEnd) {
          return false;
        }
        
        // Check if already completed and not repeatable
        if (state.storylets.completed.includes(storyletId)) {
          // Resource-based storylets are repeatable
          if (storylet.trigger?.type !== 'resource') {
            return false;
          }
        }
        
        // Check if already active
        if (state.storylets.active.includes(storyletId)) {
          return false;
        }
        
        // Evaluate trigger conditions
        return get().evaluateStoryletTrigger(storylet);
      },

      // Comprehensive storylet evaluation system
      evaluateStorylets: () => {
        console.log('🎭 ===== V2 STORYLET EVALUATION =====');
        
        const state = get();
        const newActiveIds: string[] = [];
        
        // Get core game state for trigger evaluation
        const coreGameStore = (window as any).useCoreGameStore?.getState();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 V2 Evaluation state:', {
            totalStorylets: state.storylets.userCreated.length,
            activeStorylets: state.storylets.active.length,
            completedStorylets: state.storylets.completed.length,
            coreGameDay: coreGameStore?.world?.day,
            coreGameResources: coreGameStore?.player?.resources
          });
        }
        
        // Evaluate each storylet
        state.storylets.userCreated.forEach((storylet) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 V2 Checking storylet: ${storylet.id} (${storylet.name})`);
          }
          
          // Skip if already active or completed (except resource-based)
          if (state.storylets.active.includes(storylet.id)) {
            return;
          }
          
          if (state.storylets.completed.includes(storylet.id) && storylet.trigger?.type !== 'resource') {
            return;
          }
          
          // Check cooldown
          const cooldownEnd = state.storylets.cooldowns[storylet.id];
          if (cooldownEnd && coreGameStore?.world?.day && coreGameStore.world.day < cooldownEnd) {
            return;
          }
          
          // Evaluate trigger
          const canTrigger = get().evaluateStoryletTrigger(storylet);
          
          if (canTrigger) {
            newActiveIds.push(storylet.id);
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ 🎉 V2 UNLOCKING STORYLET: ${storylet.id} - ${storylet.name}`);
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log(`❌ V2 Cannot trigger ${storylet.id}`);
            }
          }
        });
        
        // Add newly unlocked storylets
        if (newActiveIds.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🎆 V2 Activating ${newActiveIds.length} new storylets:`, newActiveIds);
          }
          
          set((state) => ({
            ...state,
            storylets: {
              ...state.storylets,
              active: [...state.storylets.active, ...newActiveIds]
            }
          }));
        } else if (process.env.NODE_ENV === 'development') {
          console.log('😴 V2 No new storylets activated');
        }
      },

      // Helper method to evaluate storylet triggers
      evaluateStoryletTrigger: (storylet: any): boolean => {
        if (!storylet.trigger) return false;
        
        const coreGameStore = (window as any).useCoreGameStore?.getState();
        const state = get();
        
        switch (storylet.trigger.type) {
          case 'time':
            return get().evaluateTimeTrigger(storylet.trigger, coreGameStore);
          
          case 'flag':
            return get().evaluateFlagTrigger(storylet.trigger, state);
          
          case 'resource':
            return get().evaluateResourceTrigger(storylet.trigger, coreGameStore);
          
          default:
            console.warn(`V2 Unsupported trigger type: ${storylet.trigger.type}`);
            return false;
        }
      },

      // Time-based trigger evaluation
      evaluateTimeTrigger: (trigger: any, coreGameStore: any): boolean => {
        const currentDay = coreGameStore?.world?.day || 1;
        const conditions = trigger.conditions || {};
        
        if (conditions.day !== undefined) {
          return currentDay >= conditions.day;
        }
        
        if (conditions.week !== undefined) {
          return currentDay >= (conditions.week * 7);
        }
        
        return false;
      },

      // Flag-based trigger evaluation
      evaluateFlagTrigger: (trigger: any, narrativeState: any): boolean => {
        const conditions = trigger.conditions || {};
        const requiredFlags = conditions.flags || [];
        
        if (requiredFlags.length === 0) return true;
        
        // Check if all required flags are set
        return requiredFlags.every((flagKey: string) => {
          const flagValue = narrativeState.flags?.storylet?.get?.(flagKey);
          return !!flagValue;
        });
      },

      // Resource-based trigger evaluation
      evaluateResourceTrigger: (trigger: any, coreGameStore: any): boolean => {
        const conditions = trigger.conditions || {};
        const currentResources = coreGameStore?.player?.resources || {};
        
        // Check each resource condition
        return Object.entries(conditions).every(([resource, condition]) => {
          const currentValue = currentResources[resource] || 0;
          
          if (typeof condition === 'number') {
            return currentValue >= condition;
          }
          
          if (typeof condition === 'object') {
            const { min, max } = condition as any;
            if (min !== undefined && currentValue < min) return false;
            if (max !== undefined && currentValue > max) return false;
            return true;
          }
          
          return false;
        });
      },

      resetNarrative: () => {
        const currentState = get();
        const initialState = getInitialNarrativeState();
        
        // Preserve user-created content when resetting
        set({
          ...initialState,
          // Keep user-created storylets and arcs
          storylets: {
            ...initialState.storylets,
            userCreated: currentState.storylets.userCreated // Preserve user storylets
          },
          storyArcs: currentState.storyArcs, // Preserve user arcs
          clues: currentState.clues, // Preserve user clues
          achievements: currentState.achievements, // Preserve achievements
          // Keep hydration state
          _hasHydrated: currentState._hasHydrated
        });
        
        console.log('🔄 Narrative store reset (preserved user content)');
      },

      migrateFromLegacyStores: () => {
        console.log('🔄 Migrating data from legacy stores to Narrative Store...');
        
        try {
          // Migrate from useStoryletStore
          const legacyStoryletStore = (window as any).useStoryletStore?.getState();
          if (legacyStoryletStore) {
            set((state) => ({
              ...state,
              storylets: {
                ...state.storylets,
                completed: legacyStoryletStore.completedStorylets || []
              }
            }));
            
            // Migrate storylet flags
            if (legacyStoryletStore.flags) {
              const newStoryletFlags = new Map(state.flags.storylet);
              Object.entries(legacyStoryletStore.flags).forEach(([key, value]) => {
                newStoryletFlags.set(key, value);
              });
              set((state) => ({
                ...state,
                flags: { ...state.flags, storylet: newStoryletFlags }
              }));
            }
          }

          // Migrate from useStoryletCatalogStore
          const legacyCatalogStore = (window as any).useStoryletCatalogStore?.getState();
          if (legacyCatalogStore?.allStorylets) {
            set((state) => ({
              ...state,
              storylets: {
                ...state.storylets,
                userCreated: legacyCatalogStore.allStorylets
              }
            }));
          }

          // Migrate character concerns if they exist
          const legacyCharacterStore = (window as any).useIntegratedCharacterStore?.getState();
          if (legacyCharacterStore?.concerns) {
            set((state) => ({
              ...state,
              concerns: {
                ...state.concerns,
                current: legacyCharacterStore.concerns
              }
            }));
          }

          // Migrate from useMinigameStore achievements
          const legacyMinigameStore = (window as any).useMinigameStore?.getState();
          if (legacyMinigameStore?.achievements) {
            set((state) => ({
              ...state,
              achievements: {
                ...state.achievements,
                ...Object.fromEntries(
                  Object.entries(legacyMinigameStore.achievements).map(([id, achievement]: [string, any]) => [
                    id,
                    {
                      ...achievement,
                      category: 'minigame'
                    }
                  ])
                )
              }
            }));
          }

          // Migrate quest data from useAppStore
          const legacyAppStore = (window as any).useAppStore?.getState();
          if (legacyAppStore) {
            const activeQuests = legacyAppStore.activeQuests || [];
            const completedQuests = legacyAppStore.completedQuests || [];
            
            set((state) => ({
              ...state,
              quests: {
                active: activeQuests,
                completed: completedQuests
              }
            }));
            
            console.log(`✅ Migrated ${activeQuests.length} active quests and ${completedQuests.length} completed quests from AppStore`);
          }

          // Migrate clue data from useClueStore
          const legacyClueStore = (window as any).useClueStore?.getState();
          if (legacyClueStore?.clues) {
            set((state) => ({
              ...state,
              clues: legacyClueStore.clues
            }));
            
            console.log(`✅ Migrated ${Object.keys(legacyClueStore.clues).length} clues from ClueStore`);
          }

          // Migrate minigame data from useStoryletStore
          const legacyStoryletStoreForMinigames = (window as any).useStoryletStore?.getState();
          if (legacyStoryletStoreForMinigames) {
            const activeMinigame = legacyStoryletStoreForMinigames.activeMinigame || null;
            const completedMinigames = legacyStoryletStoreForMinigames.completedMinigames || [];
            
            set((state) => ({
              ...state,
              minigames: {
                activeMinigame,
                completedMinigames
              }
            }));
            
            console.log(`✅ Migrated minigame state from StoryletStore: active=${activeMinigame}, completed=${completedMinigames.length}`);
          }

          console.log('✅ Narrative Store migration completed');
        } catch (error) {
          console.error('❌ Narrative Store migration failed:', error);
        }
      },

      // Storylet management
      addActiveStorylet: (storyletId) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
          
          // Don't add if already active
          if (activeArray.includes(storyletId)) {
            return state;
          }
          
          return {
            ...state,
            storylets: {
              ...state.storylets,
              active: [...activeArray, storyletId]
            }
          };
        });
      },

      removeActiveStorylet: (storyletId) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
          
          return {
            ...state,
            storylets: {
              ...state.storylets,
              active: activeArray.filter(id => id !== storyletId)
            }
          };
        });
      },

      completeStorylet: (storyletId) => {
        set((state) => {
          // Defensive programming: ensure arrays exist
          const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
          const completedArray = Array.isArray(state.storylets?.completed) ? state.storylets.completed : [];
          
          return {
            ...state,
            storylets: {
              ...state.storylets,
              active: activeArray.filter(id => id !== storyletId),
              completed: [...completedArray, storyletId]
            }
          };
        });
      },

      setCooldown: (storyletId, cooldownEnd) => {
        set((state) => ({
          ...state,
          storylets: {
            ...state.storylets,
            cooldowns: { ...state.storylets.cooldowns, [storyletId]: cooldownEnd }
          }
        }));
      },

      unlockStorylet: (storyletId) => {
        get().addActiveStorylet(storyletId);
      },

      getCurrentStorylet: () => {
        const state = get();
        const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
        return activeArray.length > 0 ? activeArray[0] : null;
      },

      recordStoryletCompletion: (storyletId: string, choiceId: string, completionData?: any) => {
        // Record the completion in our completion history
        set((state) => {
          const timestamp = Date.now();
          const completion = {
            storyletId,
            choiceId,
            timestamp,
            completionData
          };
          
          // For now, just mark as completed - can extend with completion history later
          const activeArray = Array.isArray(state.storylets?.active) ? state.storylets.active : [];
          const completedArray = Array.isArray(state.storylets?.completed) ? state.storylets.completed : [];
          
          return {
            ...state,
            storylets: {
              ...state.storylets,
              active: activeArray.filter(id => id !== storyletId),
              completed: [...completedArray, storyletId]
            }
          };
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 Recorded storylet completion: ${storyletId} -> choice: ${choiceId}`);
        }
      },

      // Flag management
      setStoryletFlag: (key, value) => {
        set((state) => {
          // Defensive programming: ensure Map exists
          const currentFlags = state.flags?.storylet instanceof Map ? state.flags.storylet : new Map();
          const newFlags = new Map(currentFlags);
          newFlags.set(key, value);
          return {
            ...state,
            flags: { ...state.flags, storylet: newFlags }
          };
        });
      },

      getStoryletFlag: (key) => {
        const state = get();
        const storyletFlags = state.flags?.storylet instanceof Map ? state.flags.storylet : new Map();
        return storyletFlags.get(key);
      },

      setConcernFlag: (key, value) => {
        set((state) => {
          // Defensive programming: ensure Map exists
          const currentFlags = state.flags?.concerns instanceof Map ? state.flags.concerns : new Map();
          const newFlags = new Map(currentFlags);
          newFlags.set(key, value);
          return {
            ...state,
            flags: { ...state.flags, concerns: newFlags }
          };
        });
      },

      getConcernFlag: (key) => {
        const state = get();
        const concernFlags = state.flags?.concerns instanceof Map ? state.flags.concerns : new Map();
        return concernFlags.get(key);
      },

      setArcFlag: (key, value) => {
        set((state) => {
          // Defensive programming: ensure Map exists
          const currentFlags = state.flags?.storyArc instanceof Map ? state.flags.storyArc : new Map();
          const newFlags = new Map(currentFlags);
          newFlags.set(key, value);
          return {
            ...state,
            flags: { ...state.flags, storyArc: newFlags }
          };
        });
      },

      getArcFlag: (key) => {
        const state = get();
        const arcFlags = state.flags?.storyArc instanceof Map ? state.flags.storyArc : new Map();
        return arcFlags.get(key);
      },

      // Enhanced Story Arc Management
      createArc: (arcData) => {
        const arcId = `arc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const newArc: StoryArc = {
          id: arcId,
          ...arcData,
          metadata: {
            totalStorylets: 0,
            completedStorylets: 0,
            availableStorylets: [],
            entryPoints: [],
            deadEnds: [],
            lastAccessed: now,
            createdAt: now
          }
        };

        const newProgress: ArcProgress = {
          completedStorylets: [],
          availableStorylets: [],
          flags: {},
          failures: []
        };

        set((state) => ({
          ...state,
          storyArcs: { ...state.storyArcs, [arcId]: newArc },
          arcProgress: { ...state.arcProgress, [arcId]: newProgress }
        }));

        return arcId;
      },

      updateArc: (arcId, updates) => {
        set((state) => {
          const existingArc = state.storyArcs[arcId];
          if (!existingArc) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...existingArc,
                ...updates,
                metadata: {
                  ...existingArc.metadata,
                  lastAccessed: Date.now()
                }
              }
            }
          };
        });
      },

      deleteArc: (arcId) => {
        set((state) => {
          const { [arcId]: removedArc, ...remainingArcs } = state.storyArcs;
          const { [arcId]: removedProgress, ...remainingProgress } = state.arcProgress;
          
          return {
            ...state,
            storyArcs: remainingArcs,
            arcProgress: remainingProgress
          };
        });
      },

      getArc: (arcId) => {
        const state = get();
        return state.storyArcs[arcId] || null;
      },

      getAllArcs: () => {
        const state = get();
        return Object.values(state.storyArcs);
      },

      startArc: (arcId) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          if (!arc) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                startedAt: Date.now(),
                metadata: {
                  ...arc.metadata,
                  lastAccessed: Date.now()
                }
              }
            }
          };
        });
      },

      completeArc: (arcId) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          if (!arc) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                isCompleted: true,
                completedAt: Date.now(),
                progress: 1.0,
                metadata: {
                  ...arc.metadata,
                  lastAccessed: Date.now()
                }
              }
            }
          };
        });
      },

      recordArcFailure: (arcId, reason) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          const progress = state.arcProgress[arcId];
          if (!arc || !progress) return state;
          
          const failure = {
            storyletId: arc.currentStorylet || '',
            timestamp: Date.now(),
            reason
          };
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                failures: arc.failures + 1,
                metadata: {
                  ...arc.metadata,
                  lastAccessed: Date.now()
                }
              }
            },
            arcProgress: {
              ...state.arcProgress,
              [arcId]: {
                ...progress,
                failures: [...progress.failures, failure]
              }
            }
          };
        });
      },

      getArcProgress: (arcId) => {
        const state = get();
        return state.arcProgress[arcId] || null;
      },

      assignStoryletToArc: (storyletId, arcId) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          const progress = state.arcProgress[arcId];
          if (!arc || !progress) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                metadata: {
                  ...arc.metadata,
                  totalStorylets: arc.metadata.totalStorylets + 1,
                  lastAccessed: Date.now()
                }
              }
            },
            arcProgress: {
              ...state.arcProgress,
              [arcId]: {
                ...progress,
                availableStorylets: [...progress.availableStorylets, storyletId]
              }
            }
          };
        });
      },

      getArcStorylets: (arcId) => {
        const state = get();
        const progress = state.arcProgress[arcId];
        return progress ? [...progress.completedStorylets, ...progress.availableStorylets] : [];
      },

      progressArcStorylet: (arcId, storyletId) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          const progress = state.arcProgress[arcId];
          if (!arc || !progress) return state;
          
          const newCompletedStorylets = [...progress.completedStorylets, storyletId];
          const newAvailableStorylets = progress.availableStorylets.filter(id => id !== storyletId);
          const newProgress = newCompletedStorylets.length / arc.metadata.totalStorylets;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                progress: newProgress,
                currentStorylet: storyletId,
                metadata: {
                  ...arc.metadata,
                  completedStorylets: newCompletedStorylets.length,
                  lastAccessed: Date.now()
                }
              }
            },
            arcProgress: {
              ...state.arcProgress,
              [arcId]: {
                ...progress,
                currentStoryletId: storyletId,
                completedStorylets: newCompletedStorylets,
                availableStorylets: newAvailableStorylets
              }
            }
          };
        });
      },

      // Concerns management
      updateConcerns: (concerns) => {
        set((state) => ({
          ...state,
          concerns: {
            ...state.concerns,
            current: { ...state.concerns.current, ...concerns }
          }
        }));
      },

      addConcernHistory: (entry) => {
        set((state) => ({
          ...state,
          concerns: {
            ...state.concerns,
            history: [...state.concerns.history, entry]
          }
        }));
      },

      // Achievement system
      unlockAchievement: (achievementId: string, name: string, description: string, gameId?: string, category: 'minigame' | 'story' | 'exploration' | 'character' = 'minigame') => {
        set((state) => {
          if (!state.achievements[achievementId]) {
            return {
              ...state,
              achievements: {
                ...state.achievements,
                [achievementId]: {
                  id: achievementId,
                  name,
                  description,
                  unlockedAt: Date.now(),
                  gameId,
                  category
                }
              }
            };
          }
          return state;
        });
      },

      getUnlockedAchievements: (gameId?: string, category?: string) => {
        const achievements = Object.values(get().achievements);
        return achievements.filter(achievement => {
          const matchesGame = !gameId || achievement.gameId === gameId;
          const matchesCategory = !category || achievement.category === category;
          return matchesGame && matchesCategory;
        });
      },

      hasAchievement: (achievementId: string) => {
        return !!get().achievements[achievementId];
      },

      // Quest management (Domain: Narrative)
      addQuest: (quest: Quest) => {
        set((state) => ({
          ...state,
          quests: {
            ...state.quests,
            active: [...state.quests.active, quest]
          }
        }));
      },

      updateQuest: (questId: string, updatedQuest: Quest) => {
        set((state) => ({
          ...state,
          quests: {
            ...state.quests,
            active: state.quests.active.map(quest => 
              quest.id === questId ? updatedQuest : quest
            )
          }
        }));
      },

      deleteQuest: (questId: string) => {
        set((state) => ({
          ...state,
          quests: {
            ...state.quests,
            active: state.quests.active.filter(quest => quest.id !== questId)
          }
        }));
      },

      completeQuest: (questId: string) => {
        set((state) => {
          const quest = state.quests.active.find(q => q.id === questId);
          if (!quest) return state;
          
          const updatedActiveQuests = state.quests.active.filter(q => q.id !== questId);
          const completedQuest = { ...quest, completed: true };
          
          return {
            ...state,
            quests: {
              active: updatedActiveQuests,
              completed: [...state.quests.completed, completedQuest]
            }
          };
        });
      },

      convertStoryletToQuest: (storyletId: string, choiceId: string) => {
        try {
          // Get storylet data from storylet store
          if (typeof window !== 'undefined' && (window as any).useStoryletStore) {
            const storyletStore = (window as any).useStoryletStore.getState();
            const storylet = storyletStore.allStorylets[storyletId];
            const choice = storylet?.choices.find((c: any) => c.id === choiceId);
            
            if (storylet && choice) {
              // Calculate XP reward based on choice effects
              const skillXpEffects = choice.effects.filter((e: any) => e.type === 'skillXp');
              const totalSkillXp = skillXpEffects.reduce((sum: number, effect: any) => sum + effect.amount, 0);
              const baseXp = Math.max(25, totalSkillXp * 10); // Convert skill XP to quest XP
              
              // Determine difficulty based on effects and complexity
              let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
              const effectCount = choice.effects.length;
              const hasNegativeEffects = choice.effects.some((e: any) => 
                e.type === 'resource' && e.delta < 0
              );
              
              if (effectCount >= 4 || totalSkillXp >= 5) {
                difficulty = 'hard';
              } else if (effectCount >= 2 || totalSkillXp >= 3 || hasNegativeEffects) {
                difficulty = 'medium';
              }
              
              // Map storylet themes to quest categories
              const categoryMap: Record<string, string> = {
                'midterm': 'Learning',
                'study': 'Learning',
                'library': 'Learning',
                'coffee': 'Social',
                'rival': 'Social',
                'dorm': 'Social',
                'stress': 'Health',
                'energy': 'Health',
                'sleep': 'Health',
                'money': 'Finance',
                'work': 'Career',
                'knowledge': 'Learning'
              };
              
              let category = 'General';
              for (const [keyword, cat] of Object.entries(categoryMap)) {
                if (storylet.name.toLowerCase().includes(keyword) || 
                    storylet.description.toLowerCase().includes(keyword)) {
                  category = cat;
                  break;
                }
              }
              
              const completedQuest: Quest = {
                id: `storylet_${storyletId}_${choiceId}_${Date.now()}`,
                title: `${storylet.name}: ${choice.text}`,
                description: `Completed storylet choice: ${storylet.description.substring(0, 100)}...`,
                experienceReward: baseXp,
                difficulty,
                category,
                completed: true
              };
              
              // Add to completed quests
              set((state) => ({
                ...state,
                quests: {
                  ...state.quests,
                  completed: [...state.quests.completed, completedQuest]
                }
              }));
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`🎯 Converted storylet to quest: ${completedQuest.title} (+${completedQuest.experienceReward} XP)`);
              }
            }
          }
        } catch (error) {
          console.warn('Could not convert storylet to quest:', error);
        }
      },

      getActiveQuests: () => {
        const state = get();
        return state.quests.active;
      },

      getCompletedQuests: () => {
        const state = get();
        return state.quests.completed;
      },

      // Minigame management (Domain: Narrative - Interactive Story Elements)
      setActiveMinigame: (minigameId: string | null) => {
        set((state) => ({
          ...state,
          minigames: {
            ...state.minigames,
            activeMinigame: minigameId
          }
        }));
      },

      completeMinigame: (minigameId: string) => {
        set((state) => ({
          ...state,
          minigames: {
            activeMinigame: null,
            completedMinigames: state.minigames.completedMinigames.includes(minigameId) 
              ? state.minigames.completedMinigames 
              : [...state.minigames.completedMinigames, minigameId]
          }
        }));
      },

      closeMinigame: () => {
        set((state) => ({
          ...state,
          minigames: {
            ...state.minigames,
            activeMinigame: null
          }
        }));
      },

      getActiveMinigame: () => {
        const state = get();
        return state.minigames.activeMinigame;
      },

      // Arc access management 
      updateArcLastAccessed: (arcId: string) => {
        set((state) => {
          const arc = state.storyArcs[arcId];
          if (!arc) return state;
          
          return {
            ...state,
            storyArcs: {
              ...state.storyArcs,
              [arcId]: {
                ...arc,
                metadata: {
                  ...arc.metadata,
                  lastAccessed: Date.now()
                }
              }
            }
          };
        });
      },

      // Clue management (Domain: Narrative - Story Investigation)
      addClue: (clue) => {
        set((state) => ({
          ...state,
          clues: {
            ...state.clues,
            [clue.id]: clue
          }
        }));
      },

      updateClue: (clueId: string, updates) => {
        set((state) => {
          const existingClue = state.clues[clueId];
          if (!existingClue) return state;
          
          return {
            ...state,
            clues: {
              ...state.clues,
              [clueId]: { ...existingClue, ...updates }
            }
          };
        });
      },

      discoverClue: (clueId: string) => {
        set((state) => {
          const clue = state.clues[clueId];
          if (!clue) return state;
          
          return {
            ...state,
            clues: {
              ...state.clues,
              [clueId]: {
                ...clue,
                discovered: true,
                discoveredAt: Date.now()
              }
            }
          };
        });
      },

      getClue: (clueId: string) => {
        const state = get();
        return state.clues[clueId] || null;
      },

      getAllClues: () => {
        const state = get();
        return state.clues;
      },

      getDiscoveredClues: () => {
        const state = get();
        return Object.values(state.clues).filter(clue => clue.discovered);
      },

      deleteClue: (clueId: string) => {
        set((state) => {
          const { [clueId]: deleted, ...remainingClues } = state.clues;
          return {
            ...state,
            clues: remainingClues
          };
        });
      },

      getCluesByMinigame: (minigameId: string) => {
        const state = get();
        return Object.values(state.clues).filter(clue => 
          (clue as any).minigameId === minigameId || (clue as any).source === minigameId
        );
      },

      getCluesByStorylet: (storyletId: string) => {
        const state = get();
        return Object.values(state.clues).filter(clue => 
          (clue as any).storyletId === storyletId || (clue as any).source === storyletId
        );
      },

      createClue: (clueData) => {
        const newClue = {
          name: '',
          description: '',
          content: '',
          discovered: false,
          category: 'general',
          difficulty: 'medium' as const,
          importance: 'medium' as const,
          minigameTypes: [],
          associatedStorylets: [],
          tags: [],
          rarity: 'common' as const,
          ...clueData
        };
        
        set((state) => ({
          ...state,
          clues: {
            ...state.clues,
            [clueData.id]: newClue
          }
        }));
      },

      // Storylet catalog access (Domain: Narrative - User Created Content)
      getAllStorylets: () => {
        const state = get();
        return state.storylets.userCreated;
      },

      getStorylet: (storyletId: string) => {
        const state = get();
        return state.storylets.userCreated.find(storylet => storylet.id === storyletId) || null;
      },

      addUserStorylet: (storylet: Storylet) => {
        set((state) => ({
          ...state,
          storylets: {
            ...state.storylets,
            userCreated: [...state.storylets.userCreated, storylet]
          }
        }));
      },

      updateUserStorylet: (storyletId: string, updates) => {
        set((state) => ({
          ...state,
          storylets: {
            ...state.storylets,
            userCreated: state.storylets.userCreated.map(storylet =>
              storylet.id === storyletId ? { ...storylet, ...updates } : storylet
            )
          }
        }));
      },

      removeUserStorylet: (storyletId: string) => {
        set((state) => ({
          ...state,
          storylets: {
            ...state.storylets,
            userCreated: state.storylets.userCreated.filter(storylet => storylet.id !== storyletId)
          }
        }));
      },

      getStoryletsForArc: (arcIdOrName: string) => {
        const state = get();
        
        // Try to find arc by ID first
        let arc = state.storyArcs[arcIdOrName];
        
        // If not found by ID, try to find by name
        if (!arc) {
          arc = Object.values(state.storyArcs).find(a => a.name === arcIdOrName);
        }
        
        if (!arc) return [];
        
        // Filter by arc name (how storylets are actually assigned)
        return state.storylets.userCreated.filter(storylet => 
          storylet.storyArc === arc.name || storylet.storyArc === arc.id || (storylet as any).arcId === arc.id
        );
      },
      
      // Store hydration tracking
      setHasHydrated: (state: boolean) => {
        set((prevState) => ({
          ...prevState,
          _hasHydrated: state
        }));
      }
    }),
    {
      name: 'mmv-narrative-store',
      version: CURRENT_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (state) => ({
        // Only persist data, not action functions
        _hasHydrated: state._hasHydrated,
        storylets: state.storylets,
        quests: state.quests,
        flags: state.flags,
        storyArcs: state.storyArcs,
        arcProgress: state.arcProgress,
        concerns: state.concerns,
        achievements: state.achievements,
        minigames: state.minigames,
        clues: state.clues
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('✅ Narrative store hydrated');
          console.log('🔍 Hydrated with arcs:', Object.keys(state.storyArcs || {}).length);
          console.log('🔍 Hydrated with clues:', Object.keys(state.clues || {}).length);
          state.setHasHydrated(true);
        } else {
          console.log('⚠️ Narrative store hydration failed - no state');
        }
      },
      migrate: (persistedState: any, version: number) => {
        console.log(`[NarrativeStore] Migrating from version ${version} to ${CURRENT_VERSION}`);
        
        // Handle unversioned saves (version 0 or undefined)
        if (!version || version === 0) {
          console.log('[NarrativeStore] Detected unversioned save, applying defaults and preserving data');
          const defaultState = getInitialNarrativeState();
          
          // Merge persisted data with defaults, preserving any existing values
          const migrated = {
            ...defaultState,
            ...persistedState,
            // Ensure nested objects are properly merged
            storylets: { 
              ...defaultState.storylets, 
              ...(persistedState.storylets || {}),
              // Ensure arrays are actually arrays
              active: Array.isArray(persistedState.storylets?.active) ? persistedState.storylets.active : [],
              completed: Array.isArray(persistedState.storylets?.completed) ? persistedState.storylets.completed : [],
              userCreated: Array.isArray(persistedState.storylets?.userCreated) ? persistedState.storylets.userCreated : []
            },
            storyArcs: { ...defaultState.storyArcs, ...(persistedState.storyArcs || {}) },
            arcProgress: { ...defaultState.arcProgress, ...(persistedState.arcProgress || {}) },
            concerns: { ...defaultState.concerns, ...(persistedState.concerns || {}) },
            achievements: { ...defaultState.achievements, ...(persistedState.achievements || {}) },
            quests: { 
              ...defaultState.quests, 
              ...(persistedState.quests || {}),
              active: Array.isArray(persistedState.quests?.active) ? persistedState.quests.active : [],
              completed: Array.isArray(persistedState.quests?.completed) ? persistedState.quests.completed : []
            },
            minigames: {
              ...defaultState.minigames,
              ...(persistedState.minigames || {}),
              activeMinigame: persistedState.minigames?.activeMinigame || null,
              completedMinigames: Array.isArray(persistedState.minigames?.completedMinigames) ? persistedState.minigames.completedMinigames : []
            },
            clues: { ...defaultState.clues, ...(persistedState.clues || {}) },
            // Handle flags - may need to recreate Maps
            flags: {
              storylet: new Map(persistedState.flags?.storylet || []),
              storyletFlag: new Map(persistedState.flags?.storyletFlag || []),
              concerns: new Map(persistedState.flags?.concerns || []),
              storyArc: new Map(persistedState.flags?.storyArc || [])
            }
          };
          
          return migrated;
        }
        
        // Future version migrations go here
        // if (version === 1) {
        //   // Migrate from v1 to v2
        //   return migrateV1ToV2(persistedState);
        // }
        
        return persistedState;
      },
      // Custom serialization for Maps
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          flags: {
            storylet: Array.from(state.flags.storylet.entries()),
            storyletFlag: Array.from(state.flags.storyletFlag.entries()),
            concerns: Array.from(state.flags.concerns.entries()),
            storyArc: Array.from(state.flags.storyArc.entries())
          }
        });
      },
      deserialize: (str) => {
        const state = JSON.parse(str);
        const initialState = getInitialNarrativeState();
        
        return {
          ...initialState,
          ...state,
          storylets: {
            ...initialState.storylets,
            ...(state.storylets || {}),
            active: Array.isArray(state.storylets?.active) ? state.storylets.active : [],
            completed: Array.isArray(state.storylets?.completed) ? state.storylets.completed : [],
            cooldowns: typeof state.storylets?.cooldowns === 'object' ? state.storylets.cooldowns : {},
            userCreated: Array.isArray(state.storylets?.userCreated) ? state.storylets.userCreated : []
          },
          storyArcs: state.storyArcs || {},
          arcProgress: state.arcProgress || {},
          achievements: state.achievements || {},
          quests: {
            ...initialState.quests,
            ...(state.quests || {}),
            active: Array.isArray(state.quests?.active) ? state.quests.active : [],
            completed: Array.isArray(state.quests?.completed) ? state.quests.completed : []
          },
          minigames: {
            ...initialState.minigames,
            ...(state.minigames || {}),
            activeMinigame: state.minigames?.activeMinigame || null,
            completedMinigames: Array.isArray(state.minigames?.completedMinigames) ? state.minigames.completedMinigames : []
          },
          clues: { ...initialState.clues, ...(state.clues || {}) },
          flags: {
            storylet: new Map(state.flags?.storylet || []),
            storyletFlag: new Map(state.flags?.storyletFlag || []),
            concerns: new Map(state.flags?.concerns || []),
            storyArc: new Map(state.flags?.storyArc || [])
          }
        };
      }
    }
  )
);