// /Users/montysharma/V11M2/src/utils/characterFlowIntegration.ts
// Character flow integration utilities for consolidated store architecture

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

export interface CharacterCreationData {
  name: string;
  background: string;
  attributes: Record<string, number>;
  domainAdjustments: Record<string, number>;
}

export interface BackgroundConfig {
  concerns: Record<string, number>;
  skills: Record<string, number>;
  developmentStats: Record<string, number>;
}

// Background-specific configurations
const BACKGROUND_CONFIGS: Record<string, BackgroundConfig> = {
  scholar: {
    concerns: {
      academic: 0.7,
      social: 0.3,
      family: 0.2,
      financial: 0.4
    },
    skills: {
      academics: 15,
      reading: 10,
      writing: 10,
      research: 12
    },
    developmentStats: {
      socialConnections: 2,
      academicProgress: 10,
      physicalFitness: 3,
      artisticTalent: 5
    }
  },
  athlete: {
    concerns: {
      academic: 0.4,
      social: 0.6,
      family: 0.3,
      physical: 0.8
    },
    skills: {
      athletics: 20,
      teamwork: 15,
      leadership: 10,
      endurance: 18
    },
    developmentStats: {
      socialConnections: 8,
      academicProgress: 3,
      physicalFitness: 15,
      artisticTalent: 2
    }
  },
  artist: {
    concerns: {
      academic: 0.5,
      social: 0.4,
      family: 0.4,
      creative: 0.9
    },
    skills: {
      creativity: 18,
      artistic: 20,
      expression: 15,
      innovation: 12
    },
    developmentStats: {
      socialConnections: 5,
      academicProgress: 6,
      physicalFitness: 4,
      artisticTalent: 18
    }
  },
  social: {
    concerns: {
      academic: 0.4,
      social: 0.8,
      family: 0.5,
      relationships: 0.7
    },
    skills: {
      socializing: 18,
      communication: 16,
      leadership: 12,
      networking: 14
    },
    developmentStats: {
      socialConnections: 12,
      academicProgress: 5,
      physicalFitness: 6,
      artisticTalent: 4
    }
  },
  default: {
    concerns: {
      academic: 0.5,
      social: 0.5,
      family: 0.3,
      personal: 0.4
    },
    skills: {
      academics: 8,
      socializing: 8,
      creativity: 6,
      athletics: 6
    },
    developmentStats: {
      socialConnections: 5,
      academicProgress: 5,
      physicalFitness: 5,
      artisticTalent: 5
    }
  }
};

/**
 * Get initial concerns based on character background
 */
export const getInitialConcerns = (background: string): Record<string, number> => {
  const config = BACKGROUND_CONFIGS[background] || BACKGROUND_CONFIGS.default;
  return { ...config.concerns };
};

/**
 * Get initial development stats based on character background
 */
export const getInitialDevelopmentStats = (background: string): Record<string, number> => {
  const config = BACKGROUND_CONFIGS[background] || BACKGROUND_CONFIGS.default;
  return { ...config.developmentStats };
};

/**
 * Get initial skills based on character background
 */
export const getInitialSkills = (background: string): Record<string, number> => {
  const config = BACKGROUND_CONFIGS[background] || BACKGROUND_CONFIGS.default;
  return { ...config.skills };
};

/**
 * Calculate final attributes from base attributes and domain adjustments
 */
export const calculateFinalAttributes = (
  baseAttributes: Record<string, number>,
  domainAdjustments: Record<string, number>
): Record<string, number> => {
  const finalAttributes = { ...baseAttributes };
  
  // Apply domain adjustments with bounds checking
  Object.entries(domainAdjustments).forEach(([domain, adjustment]) => {
    if (finalAttributes[domain] !== undefined) {
      finalAttributes[domain] = Math.max(5, Math.min(100, finalAttributes[domain] + adjustment));
    }
  });
  
  return finalAttributes;
};

/**
 * Create character atomically across all consolidated stores
 */
export const createCharacterAtomically = (data: CharacterCreationData): void => {
  console.log('🔄 Creating character atomically across consolidated stores...');
  console.log('📊 Character data:', data);
  
  const startTime = performance.now();
  
  try {
    // Get store instances
    const coreStore = useCoreGameStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();
    
    // Step 1: Reset all stores to clean state
    console.log('🔄 Resetting all stores to clean state...');
    coreStore.resetGame();
    narrativeStore.resetNarrative();
    socialStore.resetSocial();
    
    // Step 2: Calculate final attributes
    const baseAttributes = {
      intelligence: 50,
      creativity: 50,
      charisma: 50,
      strength: 50,
      focus: 50,
      empathy: 50,
      ...data.attributes
    };
    
    const finalAttributes = calculateFinalAttributes(baseAttributes, data.domainAdjustments);
    
    // Step 3: Set up character in core store
    console.log('👤 Setting up character in core store...');
    coreStore.updateCharacter({
      name: data.name,
      background: data.background,
      attributes: finalAttributes,
      developmentStats: getInitialDevelopmentStats(data.background)
    });
    
    // Step 4: Set up skills in core store
    console.log('🎯 Setting up skills in core store...');
    const initialSkills = getInitialSkills(data.background);
    coreStore.updateSkills({
      totalExperience: 0,
      coreCompetencies: initialSkills,
      foundationExperiences: {},
      characterClasses: {}
    });
    
    // Step 5: Initialize world state
    console.log('🌍 Initializing world state...');
    coreStore.updateWorld({
      day: 1,
      timeAllocation: {},
      isTimePaused: false
    });
    
    // Step 6: Set up narrative concerns and flags
    console.log('📖 Setting up narrative concerns and flags...');
    const initialConcerns = getInitialConcerns(data.background);
    narrativeStore.updateConcerns(initialConcerns);
    
    // Set character created flag to trigger tutorial storylet
    narrativeStore.setStoryletFlag('character_created', true);
    
    // Step 7: Initialize social store with empty state
    console.log('👥 Initializing social store...');
    // Social store is already reset, just ensure it's ready
    
    const duration = performance.now() - startTime;
    console.log(`✅ Character creation completed atomically in ${duration.toFixed(2)}ms`);
    
    // Log final state for debugging
    console.log('📊 Final character state:', {
      character: coreStore.character,
      concerns: narrativeStore.concerns,
      flags: narrativeStore.getStoryletFlag('character_created')
    });
    
  } catch (error) {
    console.error('❌ Character creation failed:', error);
    throw new Error(`Character creation failed: ${error.message}`);
  }
};

/**
 * Reset all game state atomically across consolidated stores
 */
export const resetAllGameState = (): void => {
  console.log('🔄 Resetting all game state atomically...');
  
  const startTime = performance.now();
  
  try {
    // Reset all consolidated stores atomically
    useCoreGameStore.getState().resetGame();
    useNarrativeStore.getState().resetNarrative();
    useSocialStore.getState().resetSocial();
    
    const duration = performance.now() - startTime;
    console.log(`✅ All game state reset atomically in ${duration.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Game state reset failed:', error);
    throw new Error(`Game state reset failed: ${error.message}`);
  }
};

/**
 * Validate character creation data
 */
export const validateCharacterCreationData = (data: CharacterCreationData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Character name is required');
  }
  
  if (data.name && data.name.length > 50) {
    errors.push('Character name must be 50 characters or less');
  }
  
  // Validate background
  const validBackgrounds = ['scholar', 'athlete', 'artist', 'social', 'default'];
  if (!validBackgrounds.includes(data.background)) {
    errors.push('Invalid character background');
  }
  
  // Validate attributes
  if (data.attributes) {
    Object.entries(data.attributes).forEach(([attr, value]) => {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        errors.push(`Invalid attribute value for ${attr}: ${value}`);
      }
    });
  }
  
  // Validate domain adjustments
  if (data.domainAdjustments) {
    const totalAdjustments = Object.values(data.domainAdjustments).reduce((sum, val) => sum + Math.abs(val), 0);
    if (totalAdjustments > 40) {
      errors.push('Total domain adjustments cannot exceed 40 points');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get character creation summary for debugging
 */
export const getCharacterCreationSummary = (): any => {
  const coreStore = useCoreGameStore.getState();
  const narrativeStore = useNarrativeStore.getState();
  const socialStore = useSocialStore.getState();
  
  return {
    character: coreStore.character,
    player: coreStore.player,
    skills: coreStore.skills,
    world: coreStore.world,
    concerns: narrativeStore.concerns,
    flags: {
      characterCreated: narrativeStore.getStoryletFlag('character_created'),
      totalFlags: narrativeStore.flags.storylet instanceof Map ? narrativeStore.flags.storylet.size : 0
    },
    storylets: {
      active: narrativeStore.storylets.active,
      completed: narrativeStore.storylets.completed
    },
    saves: {
      currentSaveId: socialStore.saves.currentSaveId,
      totalSaves: Object.keys(socialStore.saves.saveSlots).length
    }
  };
};

// Export background configurations for external use
export { BACKGROUND_CONFIGS };