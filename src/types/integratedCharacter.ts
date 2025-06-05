// /Users/montysharma/V11M2/src/types/integratedCharacter.ts
// Integrated Character System based on Chickering's Seven Vectors of Development

export interface DevelopmentStage {
  stage: number;
  name: string;
  description: string;
  requirements: number; // experience points needed to reach this stage
  unlocks: string[];     // new capabilities/storylets unlocked at this stage
  benefits: string[];    // benefits gained at this stage
}

export interface DomainComponent {
  // Intellectual Competence components
  reasoning?: number;      // intelligence + focus
  innovation?: number;     // creativity + adaptability  
  retention?: number;      // memory + perseverance
  
  // Physical Competence components
  power?: number;          // strength + endurance
  coordination?: number;   // agility + dexterity
  discipline?: number;     // perseverance applied to physical
  
  // Emotional Intelligence components
  awareness?: number;      // emotional self-awareness
  regulation?: number;     // emotionalStability + selfControl
  resilience?: number;     // stressTolerance + adaptability
  
  // Social Competence components
  connection?: number;     // charisma + empathy
  communication?: number;  // existing communication
  relationships?: number;  // relationship depth/maturity
  
  // Personal Autonomy components
  independence?: number;   // self-reliance
  interdependence?: number; // healthy collaboration
  responsibility?: number; // perseverance + selfControl
  
  // Identity Clarity components
  selfAwareness?: number;  // understanding of self
  values?: number;         // clarity of personal values
  authenticity?: number;   // alignment between self and actions
  
  // Life Purpose components
  direction?: number;      // clarity of life direction
  meaning?: number;        // sense of meaning and fulfillment
  integrity?: number;      // values-behavior alignment
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
  version: 2; // distinguish from old character format (version 1)
  
  // Seven core domains based on Chickering's vectors
  intellectualCompetence: CharacterDomain;  // Vector 1a: Intellectual competence
  physicalCompetence: CharacterDomain;      // Vector 1b: Physical competence
  emotionalIntelligence: CharacterDomain;   // Vector 2: Managing emotions
  socialCompetence: CharacterDomain;        // Vector 1c + 4: Interpersonal competence & relationships
  personalAutonomy: CharacterDomain;        // Vector 3: Autonomy toward interdependence
  identityClarity: CharacterDomain;         // Vector 5: Establishing identity
  lifePurpose: CharacterDomain;             // Vector 6 + 7: Purpose and integrity
  
  // Simulation data (preserved from original system)
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
  migratedFrom?: string; // ID of original character if migrated from v1
}

export interface DevelopmentEvent {
  id: string;
  timestamp: Date;
  domain: DomainKey;
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
  primaryDomain: DomainKey;        // which domain this skill primarily affects
  secondaryDomains: DomainKey[];   // domains that receive secondary benefits
  unlockRequirements?: {
    domain: DomainKey;
    minStage: number;
  }[];
}

// Type for the seven domains
export type DomainKey = 'intellectualCompetence' | 'physicalCompetence' | 'emotionalIntelligence' | 
                       'socialCompetence' | 'personalAutonomy' | 'identityClarity' | 'lifePurpose';

// Development stage definitions for each domain
export const DEVELOPMENT_STAGES: Record<DomainKey, DevelopmentStage[]> = {
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
  
  physicalCompetence: [
    {
      stage: 1,
      name: "Basic",
      description: "Developing fundamental physical abilities and awareness",
      requirements: 0,
      unlocks: ["basic_exercise_storylets", "health_awareness"],
      benefits: ["Better energy management", "Basic fitness"]
    },
    {
      stage: 2,
      name: "Active",
      description: "Regular physical activity with improved strength and coordination",
      requirements: 200,
      unlocks: ["sports_participation", "fitness_challenges"],
      benefits: ["Increased stamina", "Better stress relief"]
    },
    {
      stage: 3,
      name: "Capable",
      description: "Strong physical foundation with good discipline and control",
      requirements: 400,
      unlocks: ["athletic_leadership", "physical_mentoring"],
      benefits: ["Physical confidence", "Injury prevention"]
    },
    {
      stage: 4,
      name: "Athletic",
      description: "High level of physical competence and body awareness",
      requirements: 800,
      unlocks: ["competitive_sports", "fitness_coaching"],
      benefits: ["Peak performance", "Physical mastery"]
    },
    {
      stage: 5,
      name: "Elite",
      description: "Exceptional physical abilities inspiring others",
      requirements: 1500,
      unlocks: ["elite_competition", "physical_education"],
      benefits: ["Physical excellence", "Inspiring physical achievement"]
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
  
  socialCompetence: [
    {
      stage: 1,
      name: "Isolated",
      description: "Limited social connections and interaction skills",
      requirements: 0,
      unlocks: ["basic_social_storylets", "conversation_practice"],
      benefits: ["Basic social awareness", "Reduced social anxiety"]
    },
    {
      stage: 2,
      name: "Connected",
      description: "Building meaningful connections and improving communication",
      requirements: 250,
      unlocks: ["friendship_building", "group_activities"],
      benefits: ["Better communication", "Growing social circle"]
    },
    {
      stage: 3,
      name: "Intimate",
      description: "Developing deep relationships and trust with others",
      requirements: 500,
      unlocks: ["close_relationships", "emotional_intimacy"],
      benefits: ["Deep connections", "Emotional support network"]
    },
    {
      stage: 4,
      name: "Interdependent",
      description: "Balanced relationships with mutual support and growth",
      requirements: 1000,
      unlocks: ["relationship_counseling", "social_leadership"],
      benefits: ["Relationship wisdom", "Social influence"]
    },
    {
      stage: 5,
      name: "Mentoring",
      description: "Guiding others in developing their social competence",
      requirements: 2000,
      unlocks: ["social_coaching", "community_building"],
      benefits: ["Social mastery", "Community impact"]
    }
  ],
  
  personalAutonomy: [
    {
      stage: 1,
      name: "Dependent",
      description: "Relying heavily on others for decisions and support",
      requirements: 0,
      unlocks: ["independence_storylets", "decision_making_practice"],
      benefits: ["Basic self-reliance", "Decision awareness"]
    },
    {
      stage: 2,
      name: "Independent",
      description: "Developing self-reliance and personal responsibility",
      requirements: 300,
      unlocks: ["leadership_opportunities", "project_management"],
      benefits: ["Self-confidence", "Personal responsibility"]
    },
    {
      stage: 3,
      name: "Interdependent",
      description: "Balancing independence with healthy collaboration",
      requirements: 600,
      unlocks: ["team_leadership", "collaborative_projects"],
      benefits: ["Balanced autonomy", "Collaborative leadership"]
    },
    {
      stage: 4,
      name: "Leading",
      description: "Guiding others while maintaining personal integrity",
      requirements: 1200,
      unlocks: ["mentorship_roles", "organizational_leadership"],
      benefits: ["Leadership confidence", "Inspiring autonomy"]
    },
    {
      stage: 5,
      name: "Mentoring",
      description: "Helping others develop their own autonomy and leadership",
      requirements: 2500,
      unlocks: ["leadership_development", "organizational_change"],
      benefits: ["Leadership mastery", "Transformational impact"]
    }
  ],
  
  identityClarity: [
    {
      stage: 1,
      name: "Exploring",
      description: "Questioning and experimenting with different aspects of identity",
      requirements: 0,
      unlocks: ["identity_exploration", "value_clarification"],
      benefits: ["Self-awareness", "Identity questioning"]
    },
    {
      stage: 2,
      name: "Experimenting",
      description: "Actively trying different roles and perspectives",
      requirements: 400,
      unlocks: ["role_experimentation", "identity_projects"],
      benefits: ["Role flexibility", "Value development"]
    },
    {
      stage: 3,
      name: "Committing",
      description: "Making conscious choices about values and identity",
      requirements: 800,
      unlocks: ["identity_commitment", "authentic_expression"],
      benefits: ["Clear values", "Authentic self"]
    },
    {
      stage: 4,
      name: "Integrated",
      description: "Consistent identity across different contexts and relationships",
      requirements: 1600,
      unlocks: ["identity_leadership", "authentic_influence"],
      benefits: ["Identity confidence", "Authentic leadership"]
    },
    {
      stage: 5,
      name: "Evolved",
      description: "Flexible yet consistent identity that inspires others",
      requirements: 3000,
      unlocks: ["identity_mentoring", "transformational_modeling"],
      benefits: ["Identity mastery", "Inspiring authenticity"]
    }
  ],
  
  lifePurpose: [
    {
      stage: 1,
      name: "Searching",
      description: "Feeling uncertain about life direction and meaning",
      requirements: 0,
      unlocks: ["purpose_exploration", "meaning_making"],
      benefits: ["Purpose awareness", "Meaning seeking"]
    },
    {
      stage: 2,
      name: "Exploring",
      description: "Actively exploring different purposes and meanings",
      requirements: 500,
      unlocks: ["purpose_projects", "service_opportunities"],
      benefits: ["Purpose experimentation", "Value alignment"]
    },
    {
      stage: 3,
      name: "Clarifying",
      description: "Developing clearer sense of personal mission and values",
      requirements: 1000,
      unlocks: ["mission_development", "purposeful_action"],
      benefits: ["Clear direction", "Meaningful work"]
    },
    {
      stage: 4,
      name: "Committed",
      description: "Living with clear purpose and consistent values",
      requirements: 2000,
      unlocks: ["purpose_leadership", "mission_driven_projects"],
      benefits: ["Purpose confidence", "Inspiring purpose"]
    },
    {
      stage: 5,
      name: "Fulfilled",
      description: "Living with deep fulfillment and helping others find purpose",
      requirements: 4000,
      unlocks: ["purpose_mentoring", "legacy_building"],
      benefits: ["Purpose mastery", "Transformational legacy"]
    }
  ]
};

// Display information for UI rendering
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

// Helper type for backward compatibility
export interface CharacterUnion {
  version: 1 | 2;
  data: any; // Will be typed as Character | IntegratedCharacter in migration
}

// Experience calculation constants
export const EXPERIENCE_MULTIPLIERS = {
  STORYLET_COMPLETION: 10,
  SKILL_LEVEL_UP: 25,
  MILESTONE_ACHIEVEMENT: 50,
  STAGE_ADVANCE_BONUS: 100
};