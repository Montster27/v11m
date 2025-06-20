// /Users/montysharma/V11M2/src/types/save.ts
import type { Effect, Choice } from './storylet';
import type { IntegratedCharacter } from './integratedCharacter';

// Quest system types
export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  progress: number;
  maxProgress: number;
  rewards: Effect[];
  storyletId?: string;
  choiceId?: string;
}

// Task system types
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDay?: number;
  category: string;
}

// Goal system types
export interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  metric: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'permanent';
  completed: boolean;
}

export interface StoryletCompletion {
  storyletId: string;
  choiceId: string;
  timestamp: number;
  day: number;  // Day when completed
  choice: {
    id: string;
    text: string;
    effects: Effect[];
  };
}

export interface SaveData {
  // Save metadata
  id: string;
  name: string;
  timestamp: number;
  version: string;
  gameDay: number;
  
  // Character data
  activeCharacter: IntegratedCharacter | null;
  
  // Core game state
  userLevel: number;
  experience: number;
  day: number;
  
  // Time allocation
  allocations: {
    study: number;
    work: number;
    social: number;
    rest: number;
    exercise: number;
  };
  
  // Resources
  resources: {
    energy: number;
    stress: number;
    money: number;
    knowledge: number;
    social: number;
  };
  
  // Skills
  skills: Record<string, {
    id: string;
    name: string;
    description: string;
    xp: number;
    level: number;
    xpToNextLevel: number;
  }>;
  
  // Skill events
  skillEvents: {
    skillId: string;
    amount: number;
    timestamp: number;
    source: string;
  }[];
  
  // Storylet progress - enhanced with detailed completion data
  storyletProgress: {
    activeFlags: Record<string, boolean>;
    completedStorylets: StoryletCompletion[];  // Enhanced with full completion data
    storyletCooldowns: Record<string, number>;
    activeStoryletIds: string[];
  };
  
  // Quest system
  activeQuests: Quest[];
  completedQuests: Quest[];
  
  // Planner data
  goals: Goal[];
  tasks: Task[];
  
  // Game statistics
  stats: {
    totalStorylets: number;
    totalChoicesMade: number;
    totalDaysPlayed: number;
    totalXpEarned: number;
    totalQuestsCompleted: number;
  };
}

export interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
  gameDay: number;
  characterName?: string;
  preview: {
    level: number;
    storyletsCompleted: number;
    totalDaysPlayed: number;
  };
  data?: SaveData;  // Full save data when loaded
}
