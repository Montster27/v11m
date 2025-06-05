// /Users/montysharma/V11M2/src/utils/characterMigration.ts

import { Character } from '../types/character';
import { IntegratedCharacter, CharacterDomain, DomainKey, DEVELOPMENT_STAGES, EnhancedSkill } from '../types/integratedCharacter';

/**
 * Calculates average of multiple numbers, handling undefined values
 */
function average(values: number[]): number {
  const validValues = values.filter(v => v !== undefined && v !== null);
  return validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
}

/**
 * Determines development stage based on composite level
 */
function calculateInitialStage(level: number): number {
  if (level >= 90) return 5;
  if (level >= 75) return 4;
  if (level >= 60) return 3;
  if (level >= 40) return 2;
  return 1;
}

/**
 * Calculates initial experience points based on level within stage
 */
function calculateInitialXP(level: number, stage: number, domainKey: DomainKey): number {
  const stages = DEVELOPMENT_STAGES[domainKey];
  if (!stages || stage < 1 || stage > stages.length) return 0;
  
  const currentStageInfo = stages[stage - 1];
  const nextStageInfo = stages[stage] || { requirements: currentStageInfo.requirements + 500 };
  
  // Calculate percentage through current stage based on level
  const stageRanges = {
    1: { min: 0, max: 40 },
    2: { min: 40, max: 60 },
    3: { min: 60, max: 75 },
    4: { min: 75, max: 90 },
    5: { min: 90, max: 100 }
  };
  
  const range = stageRanges[stage as keyof typeof stageRanges];
  const progressInStage = Math.max(0, (level - range.min) / (range.max - range.min));
  const xpInStage = progressInStage * (nextStageInfo.requirements - currentStageInfo.requirements);
  
  return Math.floor(currentStageInfo.requirements + xpInStage);
}

/**
 * Creates a character domain from old character attributes
 */
function createDomain(
  level: number,
  components: Record<string, number>,
  domainKey: DomainKey
): CharacterDomain {
  const stage = calculateInitialStage(level);
  const xp = calculateInitialXP(level, stage, domainKey);
  
  return {
    level: Math.round(level),
    components,
    developmentStage: stage,
    experiencePoints: xp,
    confidence: Math.min(100, level + 10), // slight confidence boost over raw level
    lastMilestone: new Date()
  };
}

/**
 * Migrates old skills to enhanced skills with domain connections
 */
function migrateSkills(oldSkills: Record<string, any>): Record<string, EnhancedSkill> {
  const skillDomainMappings: Record<string, { primary: DomainKey; secondary: DomainKey[] }> = {
    bureaucraticNavigation: {
      primary: 'intellectualCompetence',
      secondary: ['personalAutonomy', 'socialCompetence']
    },
    resourceAcquisition: {
      primary: 'personalAutonomy',
      secondary: ['intellectualCompetence', 'socialCompetence']
    },
    informationWarfare: {
      primary: 'intellectualCompetence',
      secondary: ['socialCompetence', 'emotionalIntelligence']
    },
    allianceBuilding: {
      primary: 'socialCompetence',
      secondary: ['emotionalIntelligence', 'personalAutonomy']
    },
    operationalSecurity: {
      primary: 'personalAutonomy',
      secondary: ['intellectualCompetence', 'emotionalIntelligence']
    }
  };

  const enhancedSkills: Record<string, EnhancedSkill> = {};

  Object.entries(oldSkills).forEach(([skillId, skill]) => {
    const mapping = skillDomainMappings[skillId];
    enhancedSkills[skillId] = {
      ...skill,
      primaryDomain: mapping?.primary || 'intellectualCompetence',
      secondaryDomains: mapping?.secondary || [],
      unlockRequirements: []
    };
  });

  return enhancedSkills;
}

/**
 * Migrates a V1 character to V2 integrated character model
 */
export function migrateCharacterToIntegrated(oldCharacter: Character): IntegratedCharacter {
  const { attributes } = oldCharacter;
  
  // Calculate domain levels and components
  const intellectualLevel = average([
    attributes.intelligence,
    attributes.creativity,
    attributes.memory,
    attributes.focus
  ]);
  
  const physicalLevel = average([
    attributes.strength,
    attributes.agility,
    attributes.endurance,
    attributes.dexterity
  ]);
  
  const emotionalLevel = average([
    attributes.emotionalStability,
    attributes.stressTolerance,
    attributes.selfControl
  ]);
  
  const socialLevel = average([
    attributes.charisma,
    attributes.empathy,
    attributes.communication
  ]);
  
  // New domains start with moderate levels based on related attributes
  const autonomyLevel = average([
    attributes.selfControl,
    attributes.perseverance,
    attributes.adaptability
  ]);
  
  const identityLevel = average([
    attributes.emotionalStability,
    attributes.selfControl,
    attributes.adaptability
  ]) * 0.8; // Start lower as identity development is ongoing
  
  const purposeLevel = average([
    attributes.perseverance,
    attributes.focus,
    attributes.emotionalStability
  ]) * 0.6; // Start lower as purpose often develops later
  
  const integratedCharacter: IntegratedCharacter = {
    id: oldCharacter.id,
    name: oldCharacter.name,
    version: 2,
    
    intellectualCompetence: createDomain(intellectualLevel, {
      reasoning: average([attributes.intelligence, attributes.focus]),
      innovation: average([attributes.creativity, attributes.adaptability]),
      retention: average([attributes.memory, attributes.perseverance])
    }, 'intellectualCompetence'),
    
    physicalCompetence: createDomain(physicalLevel, {
      power: average([attributes.strength, attributes.endurance]),
      coordination: average([attributes.agility, attributes.dexterity]),
      discipline: attributes.perseverance
    }, 'physicalCompetence'),
    
    emotionalIntelligence: createDomain(emotionalLevel, {
      awareness: Math.min(100, (attributes.emotionalStability + attributes.empathy) / 2),
      regulation: average([attributes.emotionalStability, attributes.selfControl]),
      resilience: average([attributes.stressTolerance, attributes.adaptability])
    }, 'emotionalIntelligence'),
    
    socialCompetence: createDomain(socialLevel, {
      connection: average([attributes.charisma, attributes.empathy]),
      communication: attributes.communication,
      relationships: Math.min(100, (attributes.empathy + attributes.communication) / 2)
    }, 'socialCompetence'),
    
    personalAutonomy: createDomain(autonomyLevel, {
      independence: average([attributes.selfControl, attributes.perseverance]),
      interdependence: average([attributes.empathy, attributes.communication]) * 0.8,
      responsibility: average([attributes.perseverance, attributes.selfControl])
    }, 'personalAutonomy'),
    
    identityClarity: createDomain(identityLevel, {
      selfAwareness: average([attributes.emotionalStability, attributes.focus]) * 0.9,
      values: attributes.perseverance * 0.8,
      authenticity: average([attributes.emotionalStability, attributes.selfControl]) * 0.7
    }, 'identityClarity'),
    
    lifePurpose: createDomain(purposeLevel, {
      direction: attributes.focus * 0.7,
      meaning: attributes.perseverance * 0.6,
      integrity: average([attributes.emotionalStability, attributes.selfControl]) * 0.6
    }, 'lifePurpose'),
    
    initialResources: { ...oldCharacter.initialResources },
    
    totalDevelopmentPoints: 0,
    developmentHistory: [{
      id: 'migration-' + Date.now(),
      timestamp: new Date(),
      domain: 'intellectualCompetence',
      eventType: 'milestone',
      description: 'Character migrated from V1 to V2 system',
      experienceGained: 0
    }],
    
    skills: migrateSkills(oldCharacter.skills),
    
    createdAt: oldCharacter.createdAt,
    updatedAt: new Date(),
    migratedFrom: oldCharacter.id
  };

  return integratedCharacter;
}

/**
 * Validates that a character migration was successful
 */
export function validateMigration(oldCharacter: Character, newCharacter: IntegratedCharacter): boolean {
  try {
    // Check basic properties
    if (newCharacter.id !== oldCharacter.id || newCharacter.name !== oldCharacter.name) {
      return false;
    }

    // Check that all domains have valid values
    const domains: DomainKey[] = [
      'intellectualCompetence', 'physicalCompetence', 'emotionalIntelligence',
      'socialCompetence', 'personalAutonomy', 'identityClarity', 'lifePurpose'
    ];

    for (const domain of domains) {
      const domainData = newCharacter[domain];
      if (!domainData || 
          domainData.level < 0 || domainData.level > 100 ||
          domainData.developmentStage < 1 || domainData.developmentStage > 5 ||
          domainData.confidence < 0 || domainData.confidence > 100) {
        return false;
      }
    }

    // Check that resources were preserved
    const resourceKeys = ['grades', 'money', 'social', 'energy', 'stress'] as const;
    for (const key of resourceKeys) {
      if (newCharacter.initialResources[key] !== oldCharacter.initialResources[key]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Migration validation error:', error);
    return false;
  }
}

/**
 * Batch migrate multiple characters
 */
export function batchMigrateCharacters(oldCharacters: Character[]): IntegratedCharacter[] {
  const results: IntegratedCharacter[] = [];
  const errors: string[] = [];

  oldCharacters.forEach((oldChar, index) => {
    try {
      const newChar = migrateCharacterToIntegrated(oldChar);
      if (validateMigration(oldChar, newChar)) {
        results.push(newChar);
      } else {
        errors.push(`Validation failed for character ${oldChar.name} (index ${index})`);
      }
    } catch (error) {
      errors.push(`Migration failed for character ${oldChar.name} (index ${index}): ${error}`);
    }
  });

  if (errors.length > 0) {
    console.warn('Migration errors:', errors);
  }

  return results;
}

/**
 * Create a backup of old character data before migration
 */
export function createMigrationBackup(characters: Character[]): void {
  const backup = {
    timestamp: new Date().toISOString(),
    version: 1,
    characters: characters
  };

  try {
    localStorage.setItem('lifeSimulator_v1_backup', JSON.stringify(backup));
    console.log('Created migration backup with', characters.length, 'characters');
  } catch (error) {
    console.error('Failed to create migration backup:', error);
  }
}
