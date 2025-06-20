// Global Type Definitions for Window Extensions
import { StoryletState } from '../store/useStoryletStore';
import type { Storylet, Choice } from './storylet';
import type { IntegratedCharacter } from './integratedCharacter';
import type { Clue } from './clue';

// NPC-related types
export interface NPCMemory {
  id: string;
  content: string;
  timestamp: number;
  storyletId: string;
  choiceId: string;
  importance: 'low' | 'medium' | 'high';
  category: 'interaction' | 'observation' | 'relationship' | 'event';
}

export interface NPC {
  id: string;
  name: string;
  relationship: number;
  mood: string;
  availability: string;
  location?: string;
  flags: Record<string, boolean>;
  memories: NPCMemory[];
}

export interface NPCStoreInternalState {
  npcs: Record<string, NPC>;
  globalNPCFlags: Record<string, boolean>;
}

// Store interfaces
interface AppStoreState {
  day: number;
  resources: {
    energy: number;
    stress: number;
    money: number;
    knowledge: number;
    social: number;
  };
  activeCharacter?: {
    id: string;
    name: string;
  };
  pauseTime: () => void;
  resumeTime: () => void;
  updateResource: (key: string, value: number) => void;
  addSkillXp: (skill: string, amount: number, source: string) => void;
  convertStoryletToQuest: (storyletId: string, choiceId: string) => void;
}

interface NPCStoreState {
  getState: () => NPCStoreInternalState;
  adjustRelationship: (npcId: string, delta: number, reason?: string) => void;
  getRelationshipLevel: (npcId: string) => number;
  getRelationshipType: (npcId: string) => string;
  addMemory: (npcId: string, memory: Omit<NPCMemory, 'id' | 'timestamp'>, storyletId: string, choiceId: string) => void;
  setNPCFlag: (npcId: string, flag: string, value: boolean) => void;
  updateNPCMood: (npcId: string, mood: string, duration?: number) => void;
  updateNPCAvailability: (npcId: string, availability: string, duration?: number) => void;
  getNPC: (npcId: string) => NPC | undefined;
  isNPCAvailableAt: (npcId: string, locationId: string) => boolean;
}

interface IntegratedCharacterStoreState {
  currentCharacter?: {
    version: number;
  };
  addSkillXP: (skill: string, amount: number) => void;
}

interface SkillSystemV2StoreState {
  addCompetencyXP: (competency: string, amount: number) => void;
  addFoundationXP: (foundation: string, amount: number) => void;
}

interface SaveStoreState {
  recordStoryletCompletion: (storyletId: string, choiceId: string, choice: Choice) => void;
}

interface ClueStoreState {
  // Add clue store types as needed
}

// Extend Window interface
declare global {
  interface Window {
    // Store instances
    useAppStore?: {
      getState: () => AppStoreState;
    };
    useStoryletStore?: {
      getState: () => StoryletState;
    };
    useNPCStore?: NPCStoreState;
    useIntegratedCharacterStore?: {
      getState: () => IntegratedCharacterStoreState;
    };
    useSkillSystemV2Store?: {
      getState: () => SkillSystemV2StoreState;
    };
    useSaveStore?: {
      getState: () => SaveStoreState;
    };
    useClueStore?: {
      getState: () => ClueStoreState;
    };

    // Global functions
    addDevelopmentXP?: (domain: string, amount: number, source: string) => void;
    triggerClueDiscovery?: (gameId: string, storyletId: string, characterId: string) => Promise<Clue | null>;
    showClueNotification?: (clueResult: Clue) => void;
    testStorylets?: () => void;
    resetStorylets?: () => void;

    // Internal arrays (for cleanup)
    __storyletTimeouts?: NodeJS.Timeout[];
  }
}

// Type guards for runtime checking
export const isAppStoreAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.useAppStore !== undefined &&
         typeof window.useAppStore.getState === 'function';
};

export const isNPCStoreAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.useNPCStore !== undefined;
};

export const isStoryletStoreAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.useStoryletStore !== undefined &&
         typeof window.useStoryletStore.getState === 'function';
};

export const isIntegratedCharacterStoreAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.useIntegratedCharacterStore !== undefined &&
         typeof window.useIntegratedCharacterStore.getState === 'function';
};

export const isSkillSystemV2StoreAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.useSkillSystemV2Store !== undefined &&
         typeof window.useSkillSystemV2Store.getState === 'function';
};

export const isSaveStoreAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.useSaveStore !== undefined &&
         typeof window.useSaveStore.getState === 'function';
};

// Safe accessor functions
export const getAppState = (): AppStoreState | null => {
  try {
    if (isAppStoreAvailable()) {
      return window.useAppStore!.getState();
    }
    return null;
  } catch (error) {
    console.warn('Could not access app store:', error);
    return null;
  }
};

export const getNPCStore = (): NPCStoreState | null => {
  try {
    if (isNPCStoreAvailable()) {
      return window.useNPCStore!;
    }
    return null;
  } catch (error) {
    console.warn('Could not access NPC store:', error);
    return null;
  }
};

export {}; // Ensure this is treated as a module