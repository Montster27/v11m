// /Users/montysharma/V11M2/src/types/character.ts

export interface Skill {
  id: string;                // unique skill key, e.g. "bureaucraticNavigation"
  name: string;              // display name
  description: string;       // short paragraph describing the skill
  xp: number;                // current XP
  level: number;             // derived level based on XP thresholds
  xpToNextLevel: number;     // XP needed to reach the next level
}

export interface Character {
  id: string;
  name: string;
  attributes: {
    // Cognitive
    intelligence: number;
    creativity: number;
    memory: number;
    focus: number;
    // Physical
    strength: number;
    agility: number;
    endurance: number;
    dexterity: number;
    // Social
    charisma: number;
    empathy: number;
    communication: number;
    // Mental
    emotionalStability: number;
    perseverance: number;
    stressTolerance: number;
    adaptability: number;
    selfControl: number;
  };
  initialResources: {
    grades: number;
    money: number;
    social: number;
    energy: number;
    stress: number;
  };
  skills: Record<string, Skill>;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionnaireQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    attributeEffects: {
      attribute: keyof Character['attributes'];
      change: number;
    }[];
  }[];
}

export type AttributeCategory = 'cognitive' | 'physical' | 'social' | 'mental';

export interface AttributeInfo {
  key: keyof Character['attributes'];
  label: string;
  description: string;
  category: AttributeCategory;
}
