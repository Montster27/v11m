# Technical Implementation: Integrated Character System

## File Structure and Architecture

### New Type Definitions

<function_calls>
<invoke name="local__filesystem__write_file">
<parameter name="content">// /Users/montysharma/V11M2/src/types/integratedCharacter.ts

export interface DevelopmentStage {
  stage: number;
  name: string;
  description: string;
  requirements: number;
  unlocks: string[];
  benefits: string[];
}

export interface DomainComponent {
  reasoning?: number;
  innovation?: number;
  retention?: number;
  power?: number;
  coordination?: number;
  discipline?: number;
  awareness?: number;
  regulation?: number;
  resilience?: number;
  connection?: number;
  communication?: number;
  relationships?: number;
  independence?: number;
  interdependence?: number;
  responsibility?: number;
  selfAwareness?: number;
  values?: number;
  authenticity?: number;
  direction?: number;
  meaning?: number;
  integrity?: number;
}

export interface CharacterDomain {
  level: number;                    // 1-100 composite score
  components: DomainComponent;      // sub-components that make up this domain
  developmentStage: number;         // 1-5 current stage
  experiencePoints: number;         // progress toward next stage
  confidence: number;               // self-confidence in this domain (1-100)
  lastMilestone?: Date;            // when last milestone was reached
}

export interface IntegratedCharacter {
  id: string;
  name: string;
  version: 2; // distinguish from old character format
  
  // Seven core domains
  intellectualCompetence: CharacterDomain;
  physicalCompetence: CharacterDomain;
  emotionalIntelligence: CharacterDomain;
  socialCompetence: CharacterDomain;
  personalAutonomy: CharacterDomain;
  identityClarity: CharacterDomain;
  lifePurpose: CharacterDomain;
  
  // Simulation data
  initialResources: {
    grades: number;
    money: number;
    social: number;
    energy: number;
    stress: number;
  };
  
  // Development tracking
  totalDevelopmentPoints: number;
  developmentHistory: DevelopmentEvent[];
  
  // Skills (enhanced with domain connections)
  skills: Record<string, EnhancedSkill>;
  
  // Meta
  createdAt: Date;
  updatedAt: Date;
  migratedFrom?: string; // ID of original character if migrated
}

export interface DevelopmentEvent {
  id: string;
  timestamp: Date;
  domain: keyof Omit<IntegratedCharacter, 'id' | 'name' | 'version' | 'initialResources' | 'totalDevelopmentPoints' | 'developmentHistory' | 'skills' | 'createdAt' | 'updatedAt' | 'migratedFrom'>;
  eventType: 'stage_advance' | 'milestone' | 'storylet_completion' | 'skill_unlock';
  description: string;
  experienceGained: number;
  previousStage?: number;
  newStage?: number;
}

export interface EnhancedSkill {
  id: string;
  name: string;
  description: string;
  xp: number;
  level: number;
  xpToNextLevel: number;
  primaryDomain: keyof Omit<IntegratedCharacter, 'id' | 'name' | 'version' | 'initialResources' | 'totalDevelopmentPoints' | 'developmentHistory' | 'skills' | 'createdAt' | 'updatedAt' | 'migratedFrom'>;
  secondaryDomains: string[];
  unlockRequirements?: {
    domain: string;
    minStage: number;
  }[];
}

// Development stage definitions for each domain
export const DEVELOPMENT_STAGES: Record<string, DevelopmentStage[]> = {
  intellectualCompetence: [
    {
      stage: 1,
      name: "Learning",
      description: "Building basic cognitive skills and understanding",
      requirements: 0,
      unlocks: ["basic_study_storylets", "simple_problem_solving"],
      benefits: ["Improved focus during study", "Better comprehension"]
    },
    {
      stage: 2,
      name: "Applying",
      description: "Using knowledge to solve problems and create solutions",
      requirements: 250,
      unlocks: ["creative_projects", "research_opportunities"],
      benefits: ["Enhanced creativity", "Faster learning"]
    },
    {
      stage: 3,
      name: "Analyzing",
      description: "Breaking down complex concepts and making connections",
      requirements: 500,
      unlocks: ["critical_thinking_storylets", "debate_scenarios"],
      benefits: ["Superior problem-solving", "Pattern recognition"]
    },
    {
      stage: 4,
      name: "Expert",
      description: "Mastery of intellectual skills with consistent performance",
      requirements: 1000,
      unlocks: ["teaching_opportunities", "research_leadership"],
      benefits: ["Intellectual confidence", "Mentor capabilities"]
    },
    {
      stage: 5,
      name: "Innovator",
      description: "Creating new knowledge and pushing boundaries",
      requirements: 2000,
      unlocks: ["innovation_projects", "thought_leadership"],
      benefits: ["Breakthrough thinking", "Inspiring others"]
    }
  ],
  
  emotionalIntelligence: [
    {
      stage: 1,
      name: "Reactive",
      description: "Emotions often feel overwhelming and unpredictable",
      requirements: 0,
      unlocks: ["basic_emotion_storylets", "stress_awareness"],
      benefits: ["Emotional recognition", "Basic coping"]
    },
    {
      stage: 2,
      name: "Aware",
      description: "Beginning to recognize emotional patterns and triggers",
      requirements: 200,
      unlocks: ["emotion_tracking", "mindfulness_practices"],
      benefits: ["Emotion identification", "Trigger awareness"]
    },
    {
      stage: 3,
      name: "Managing",
      description: "Developing skills to regulate and express emotions appropriately",
      requirements: 400,
      unlocks: ["conflict_resolution", "emotional_support_giving"],
      benefits: ["Emotional control", "Stress resilience"]
    },
    {
      stage: 4,
      name: "Mastery",
      description: "Confident emotional regulation with empathetic understanding",
      requirements: 800,
      unlocks: ["leadership_roles", "counseling_others"],
      benefits: ["Emotional wisdom", "Inspiring presence"]
    },
    {
      stage: 5,
      name: "Teacher",
      description: "Helping others develop their emotional intelligence",
      requirements: 1500,
      unlocks: ["emotional_coaching", "crisis_intervention"],
      benefits: ["Emotional mastery", "Transformative influence"]
    }
  ],
  
  // ... similar definitions for other domains
};

export type DomainKey = keyof Omit<IntegratedCharacter, 'id' | 'name' | 'version' | 'initialResources' | 'totalDevelopmentPoints' | 'developmentHistory' | 'skills' | 'createdAt' | 'updatedAt' | 'migratedFrom'>;

export const DOMAIN_DISPLAY_INFO: Record<DomainKey, {
  icon: string;
  name: string;
  description: string;
  color: string;
}> = {
  intellectualCompetence: {
    icon: "🧠",
    name: "Intellectual Competence",
    description: "Reasoning, innovation, and learning abilities",
    color: "blue"
  },
  physicalCompetence: {
    icon: "💪",
    name: "Physical Competence", 
    description: "Physical capabilities, coordination, and discipline",
    color: "green"
  },
  emotionalIntelligence: {
    icon: "❤️",
    name: "Emotional Intelligence",
    description: "Understanding and managing emotions effectively",
    color: "red"
  },
  socialCompetence: {
    icon: "👥",
    name: "Social Competence",
    description: "Building and maintaining meaningful relationships",
    color: "purple"
  },
  personalAutonomy: {
    icon: "🎯",
    name: "Personal Autonomy",
    description: "Balancing independence with healthy interdependence",
    color: "orange"
  },
  identityClarity: {
    icon: "🔍",
    name: "Identity Clarity",
    description: "Understanding yourself and your place in the world",
    color: "indigo"
  },
  lifePurpose: {
    icon: "🌟",
    name: "Life Purpose",
    description: "Finding meaning, direction, and integrity in life",
    color: "yellow"
  }
};
