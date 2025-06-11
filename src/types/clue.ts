// /Users/montysharma/V11M2/src/types/clue.ts
// Type definitions for the clue system

export interface Clue {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'general' | 'academic' | 'social' | 'personal' | 'mystery' | 'achievement';
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Story arc grouping
  storyArc?: string;
  arcOrder?: number; // Order within the story arc (1, 2, 3, etc.)
  
  // Minigame association
  minigameTypes: string[]; // Which minigame types this clue applies to
  
  // Storylet connections
  associatedStorylets: string[]; // Storylet IDs that can trigger this clue
  
  // Discovery tracking
  isDiscovered: boolean;
  discoveredAt?: Date;
  discoveredBy?: string; // Character ID who discovered it
  
  // Metadata
  tags: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryArc {
  id: string;
  name: string;
  description: string;
  category: string;
  totalClues: number;
  discoveredClues: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface ClueDiscoveryEvent {
  id: string;
  clueId: string;
  storyletId: string;
  minigameType: string;
  characterId: string;
  timestamp: Date;
  context: {
    dayNumber: number;
    gameState: any;
  };
}

// For the dev panel
export interface ClueFormData {
  id: string;
  title: string;
  description: string;
  content: string;
  category: Clue['category'];
  difficulty: Clue['difficulty'];
  storyArc: string;
  arcOrder: number;
  minigameTypes: string[];
  associatedStorylets: string[];
  tags: string[];
  rarity: Clue['rarity'];
}