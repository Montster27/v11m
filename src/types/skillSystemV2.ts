// MMV Skill System 2.0: Infiltration Through Life Paths
// Type definitions for the comprehensive skill and character class system

// Foundation System - Individual foundation experiences
export type FoundationExperienceId = 
  // Academic Track
  | 'stem'
  | 'liberal-arts'
  | 'business'
  | 'pre-med'
  | 'extracurricular-leadership'
  | 'social-networks'
  | 'work-experience'
  // Working Track
  | 'trade-specialization'
  | 'union-experience'
  | 'service-industry'
  | 'military-service'
  | 'entrepreneurship'
  | 'manufacturing-industrial';

export type FoundationCategory = 'academic' | 'working';

// Core Life Competencies - The 5 essential infiltration skills
export type CoreCompetency = 
  | 'bureaucratic-navigation'
  | 'resource-acquisition'
  | 'information-warfare'
  | 'alliance-building'
  | 'operational-security';

// Information Warfare subcategories
export type InformationWarfareType = 
  | 'narrative-manipulation'
  | 'intelligence-operations';

// Character Class Specializations
export type CharacterClass = 
  | 'corporate-climber'
  | 'political-operative'
  | 'technical-specialist'
  | 'security-expert'
  | 'financial-expert'
  | 'legal-eagle'
  | 'media-influencer'
  | 'healthcare-professional'
  | 'community-organizer'
  | 'education-specialist'
  | 'logistics-commander';

// Trade specializations for force multiplier synergies
export type TradeSpecialization = 
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'construction'
  | 'automotive';

// Foundation Experience details
export interface FoundationExperience {
  id: FoundationExperienceId;
  name: string;
  description: string;
  category: FoundationCategory;
  level: number; // 0-100
  experience: number;
  unlocked: boolean;
  
  // Development paths this experience contributes to
  contributes: {
    competency: CoreCompetency;
    multiplier: number; // How much this experience contributes
  }[];
  
  // Prerequisites
  requirements?: {
    minLevel?: number;
    requiredExperiences?: FoundationExperienceId[];
    storyletsCompleted?: string[];
  };
}

// Individual skill within a competency
export interface CompetencySkill {
  name: string;
  description: string;
  xpGain: number;
  synergyEffect: string;
}

// Core Competency details
export interface CoreCompetencySkill {
  id: CoreCompetency;
  name: string;
  description: string;
  level: number; // 0-100
  experience: number;
  
  // Individual skills within this competency
  skills: CompetencySkill[];
  
  // Subcategories (for Information Warfare)
  subcategories?: {
    [key in InformationWarfareType]?: {
      level: number;
      experience: number;
    };
  };
  
  // Foundation experiences that develop this competency
  developedBy: {
    academic: FoundationExperienceId[];
    working: FoundationExperienceId[];
  };
  
  // Applications/effects
  applications: string[];
  
  // Current effectiveness (influenced by external events)
  effectiveness: number; // 0.5-1.5 multiplier
}

// Character Class Specialization
export interface CharacterClassSpec {
  id: CharacterClass;
  name: string;
  description: string;
  unlocked: boolean;
  level: number; // 0-100
  experience: number;
  
  // Primary competencies (what this class specializes in)
  primaryCompetencies: CoreCompetency[];
  
  // Foundation requirements to unlock
  foundationRequirements: {
    required: FoundationExperienceId[];
    recommended: FoundationExperienceId[];
  };
  
  // Competency level requirements
  competencyRequirements: {
    [key in CoreCompetency]?: number; // minimum level required
  };
  
  // Infiltration targets
  infiltrationTargets: string[];
  
  // Unique abilities unlocked by this class
  abilities: ClassAbility[];
}

// Class-specific abilities
export interface ClassAbility {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  level: number;
  
  // Requirements to unlock
  requirements: {
    classLevel: number;
    competencyLevels?: { [key in CoreCompetency]?: number };
    foundationLevels?: { [key in FoundationExperienceId]?: number };
  };
  
  // Effects when used
  effects: {
    type: 'resource' | 'storylet' | 'synergy' | 'multiplier';
    target: string;
    value: number;
    duration?: number; // for temporary effects
  }[];
  
  // Cooldown/usage restrictions
  cooldown?: number; // days
  usesPerDay?: number;
}

// Force Multiplier Synergies
export interface SynergyEffect {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  
  // Requirements (Trade + Competency combination)
  requirements: {
    tradeSpecialization: TradeSpecialization;
    competency: CoreCompetency;
    minTradeLevel: number;
    minCompetencyLevel: number;
  };
  
  // Synergy effects
  effects: {
    infiltrationPower: string; // unique ability description
    gameplayEffects: {
      type: 'storylet-unlock' | 'resource-multiplier' | 'special-action';
      value: any;
    }[];
  };
}

// Dynamic World Conditions
export interface WorldCondition {
  id: string;
  name: string;
  description: string;
  active: boolean;
  duration: number; // days remaining, -1 for permanent
  
  // Effects on competencies
  competencyModifiers: {
    [key in CoreCompetency]?: {
      effectivenessMultiplier: number;
      riskIncrease?: number;
      newOpportunities?: string[];
    };
  };
  
  // Trigger conditions
  triggerConditions: {
    dayRange?: [number, number];
    playerActions?: string[];
    randomChance?: number;
  };
}

// Team Composition for organizational infiltration
export interface InfiltrationTeam {
  id: string;
  name: string;
  target: 'corporate' | 'government' | 'infrastructure';
  members: {
    class: CharacterClass;
    role: string;
    required: boolean;
  }[];
  
  // Team effectiveness
  synergy: number; // multiplier for combined operations
  unlocked: boolean;
  
  // Requirements to form team
  requirements: {
    playerClass: CharacterClass;
    minClassLevels: { [key in CharacterClass]?: number };
    storyletsCompleted?: string[];
  };
}

// Complete Skill System State
export interface SkillSystemV2 {
  // Foundation experiences
  foundationExperiences: { [key in FoundationExperienceId]: FoundationExperience };
  
  // Core competencies
  coreCompetencies: { [key in CoreCompetency]: CoreCompetencySkill };
  
  // Character classes
  characterClasses: { [key in CharacterClass]: CharacterClassSpec };
  
  // Current character's primary class
  primaryClass: CharacterClass | null;
  secondaryClass: CharacterClass | null;
  
  // Trade specializations
  tradeSpecializations: { [key in TradeSpecialization]: {
    level: number;
    experience: number;
    unlocked: boolean;
  } };
  
  // Active synergies
  activeSynergies: SynergyEffect[];
  
  // World conditions
  worldConditions: WorldCondition[];
  
  // Available teams
  infiltrationTeams: InfiltrationTeam[];
  
  // Progression tracking
  totalExperience: number;
  skillPoints: number; // spendable points for advancement
  
  // Metadata
  version: 2;
  lastUpdated: Date;
}

// XP Sources and Progression
export interface SkillExperienceGain {
  sourceType: 'storylet' | 'daily-activity' | 'quest' | 'special-event';
  sourceId: string;
  
  // XP distribution
  foundationGains: { [key in FoundationExperienceId]?: number };
  competencyGains: { [key in CoreCompetency]?: number };
  classGains: { [key in CharacterClass]?: number };
  tradeGains: { [key in TradeSpecialization]?: number };
  
  // Multipliers
  multipliers: {
    classBonus?: number;
    synergyBonus?: number;
    worldConditionModifier?: number;
  };
  
  timestamp: Date;
}

// Skill Check System
export interface SkillCheck {
  type: 'competency' | 'class' | 'foundation' | 'synergy';
  target: CoreCompetency | CharacterClass | FoundationExperienceId | string;
  difficulty: number; // 0-100
  
  // Modifiers
  modifiers: {
    classBonus?: number;
    foundationBonus?: number;
    synergyBonus?: number;
    worldConditionModifier?: number;
    situationalModifier?: number;
  };
  
  // Success thresholds
  thresholds: {
    criticalSuccess: number;
    success: number;
    partialSuccess: number;
    failure: number;
  };
}

// Skill Development Events
export interface SkillEvent {
  id: string;
  name: string;
  description: string;
  type: 'foundation-unlock' | 'class-unlock' | 'synergy-discovered' | 'world-event';
  
  // Event details
  requirements: {
    foundationLevels?: { [key in FoundationExperienceId]?: number };
    competencyLevels?: { [key in CoreCompetency]?: number };
    classLevels?: { [key in CharacterClass]?: number };
    storyletsCompleted?: string[];
    dayRange?: [number, number];
  };
  
  // Event outcomes
  outcomes: {
    skillGains: SkillExperienceGain;
    unlocks?: {
      foundations?: FoundationExperienceId[];
      classes?: CharacterClass[];
      synergies?: string[];
    };
    worldConditionChanges?: {
      activate?: string[];
      deactivate?: string[];
    };
  };
  
  // Trigger data
  triggered: boolean;
  triggerDay?: number;
}

// Export utility types
export type SkillCategory = 'foundation' | 'competency' | 'class' | 'trade';
export type SkillIdentifier = FoundationExperienceId | CoreCompetency | CharacterClass | TradeSpecialization;

// Infiltration operation results
export interface InfiltrationResult {
  success: boolean;
  target: string;
  method: 'individual' | 'team';
  
  // Participant details
  primaryClass: CharacterClass;
  teamComposition?: CharacterClass[];
  
  // Skill contributions
  skillContributions: {
    competencies: { [key in CoreCompetency]?: number };
    synergies: string[];
    classAbilities: string[];
  };
  
  // Outcomes
  rewards: {
    experience: SkillExperienceGain;
    resources?: { [key: string]: number };
    unlocks?: {
      storylets?: string[];
      locations?: string[];
      contacts?: string[];
    };
  };
  
  // Consequences
  risks: {
    detection: number;
    retaliation: string[];
    worldConditionChanges?: string[];
  };
  
  timestamp: Date;
}