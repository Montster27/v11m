// /Users/montysharma/V11M2/src/types/save.ts

export interface StoryletCompletion {
  storyletId: string;
  choiceId: string;
  timestamp: number;
  day: number;  // Day when completed
  choice: {
    id: string;
    text: string;
    effects: any[];
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
  activeCharacter: any | null;
  
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
  activeQuests: any[];
  completedQuests: any[];
  
  // Planner data
  goals: any[];
  tasks: any[];
  
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
