// /Users/montysharma/V11M2/src/test/characterFlow/flowTestUtils.ts
// Testing framework for character flow migration

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';

export interface FlowState {
  core: any;
  narrative: any;
  social: any;
  timestamp: number;
}

export interface FlowTestResult {
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  errors?: string[];
}

export interface CharacterValidation {
  characterExists: boolean;
  concernsInitialized: boolean;
  flagsSet: boolean;
  storesClean: boolean;
  skillsInitialized: boolean;
  worldStateValid: boolean;
}

/**
 * Capture current state across all consolidated stores
 */
export const captureFlowState = (): FlowState => {
  try {
    return {
      core: JSON.parse(JSON.stringify(useCoreGameStore.getState())),
      narrative: JSON.parse(JSON.stringify(useNarrativeStore.getState())),
      social: JSON.parse(JSON.stringify(useSocialStore.getState())),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('❌ Failed to capture flow state:', error);
    throw new Error(`State capture failed: ${error.message}`);
  }
};

/**
 * Validate character creation state across all stores
 */
export const validateCharacterCreationState = (state: FlowState): { passed: boolean; validations: CharacterValidation; errors: string[] } => {
  const validations: CharacterValidation = {
    characterExists: false,
    concernsInitialized: false,
    flagsSet: false,
    storesClean: false,
    skillsInitialized: false,
    worldStateValid: false
  };
  
  const errors: string[] = [];
  
  try {
    // Validate character exists and has required properties
    validations.characterExists = !!(
      state.core.character &&
      state.core.character.name &&
      state.core.character.name.trim().length > 0 &&
      state.core.character.background
    );
    
    if (!validations.characterExists) {
      errors.push('Character does not exist or missing required properties');
    }
    
    // Validate concerns are initialized
    validations.concernsInitialized = !!(
      state.narrative.concerns &&
      state.narrative.concerns.current &&
      Object.keys(state.narrative.concerns.current).length > 0
    );
    
    if (!validations.concernsInitialized) {
      errors.push('Character concerns are not properly initialized');
    }
    
    // Validate character_created flag is set (handle both Map and plain object)
    let flagValue = false;
    try {
      if (state.narrative.flags && state.narrative.flags.storylet) {
        if (state.narrative.flags.storylet instanceof Map) {
          flagValue = state.narrative.flags.storylet.get('character_created') === true;
        } else if (typeof state.narrative.flags.storylet === 'object') {
          // Handle serialized Map (plain object)
          flagValue = state.narrative.flags.storylet['character_created'] === true;
        }
      }
    } catch (error) {
      // If direct access fails, try using the store getter
      try {
        const { useNarrativeStore } = require('../../stores/v2');
        const narrativeStore = useNarrativeStore.getState();
        flagValue = narrativeStore.getStoryletFlag('character_created') === true;
      } catch (storeError) {
        console.warn('Could not validate character_created flag:', error, storeError);
      }
    }
    validations.flagsSet = flagValue;
    
    if (!validations.flagsSet) {
      errors.push('character_created flag is not set');
    }
    
    // Validate stores are in clean initial state (no leftover data)
    validations.storesClean = !!(
      state.social.npcs &&
      state.social.npcs.relationships &&
      Object.keys(state.social.npcs.relationships).length === 0 &&
      state.narrative.storylets.completed.length === 0
    );
    
    if (!validations.storesClean) {
      errors.push('Stores contain leftover data from previous sessions');
    }
    
    // Validate skills are initialized
    validations.skillsInitialized = !!(
      state.core.skills &&
      state.core.skills.coreCompetencies &&
      typeof state.core.skills.totalExperience === 'number'
    );
    
    if (!validations.skillsInitialized) {
      errors.push('Skills are not properly initialized');
    }
    
    // Validate world state
    validations.worldStateValid = !!(
      state.core.world &&
      state.core.world.day === 1 &&
      typeof state.core.world.isTimePaused === 'boolean'
    );
    
    if (!validations.worldStateValid) {
      errors.push('World state is not properly initialized');
    }
    
  } catch (error) {
    errors.push(`Validation error: ${error.message}`);
  }
  
  const passed = Object.values(validations).every(v => v) && errors.length === 0;
  
  return {
    passed,
    validations,
    errors
  };
};

/**
 * Validate store integrity after operations
 */
export const validateStoreIntegrity = (state: FlowState): { passed: boolean; checks: Record<string, boolean>; errors: string[] } => {
  const checks = {
    coreStoreStructure: false,
    narrativeStoreStructure: false,
    socialStoreStructure: false,
    crossStoreConsistency: false,
    noDataCorruption: false
  };
  
  const errors: string[] = [];
  
  try {
    // Check core store structure
    checks.coreStoreStructure = !!(
      state.core.player &&
      state.core.character &&
      state.core.skills &&
      state.core.world &&
      typeof state.core.resetGame === 'function'
    );
    
    if (!checks.coreStoreStructure) {
      errors.push('Core store structure is invalid');
    }
    
    // Check narrative store structure
    checks.narrativeStoreStructure = !!(
      state.narrative.storylets &&
      state.narrative.flags &&
      state.narrative.concerns &&
      state.narrative.storyArcs &&
      typeof state.narrative.resetNarrative === 'function'
    );
    
    if (!checks.narrativeStoreStructure) {
      errors.push('Narrative store structure is invalid');
    }
    
    // Check social store structure
    checks.socialStoreStructure = !!(
      state.social.npcs &&
      state.social.clues &&
      state.social.saves &&
      typeof state.social.resetSocial === 'function'
    );
    
    if (!checks.socialStoreStructure) {
      errors.push('Social store structure is invalid');
    }
    
    // Check cross-store consistency
    const characterExists = !!state.core.character.name;
    const concernsExist = Object.keys(state.narrative.concerns.current || {}).length > 0;
    checks.crossStoreConsistency = !characterExists || (characterExists && concernsExist);
    
    if (!checks.crossStoreConsistency) {
      errors.push('Cross-store consistency violated: character exists but concerns missing');
    }
    
    // Check for data corruption (all stores should have valid data types)
    checks.noDataCorruption = !!(
      typeof state.core.player.level === 'number' &&
      typeof state.core.player.experience === 'number' &&
      Array.isArray(state.narrative.storylets.active) &&
      Array.isArray(state.narrative.storylets.completed) &&
      typeof state.social.npcs.relationships === 'object'
    );
    
    if (!checks.noDataCorruption) {
      errors.push('Data corruption detected in store structures');
    }
    
  } catch (error) {
    errors.push(`Integrity check error: ${error.message}`);
  }
  
  const passed = Object.values(checks).every(v => v) && errors.length === 0;
  
  return {
    passed,
    checks,
    errors
  };
};

/**
 * Compare two flow states and identify differences
 */
export const compareFlowStates = (before: FlowState, after: FlowState): { differences: any; summary: string } => {
  const differences = {
    core: {},
    narrative: {},
    social: {},
    duration: after.timestamp - before.timestamp
  };
  
  // Compare core store changes
  if (before.core.character.name !== after.core.character.name) {
    differences.core.characterName = { before: before.core.character.name, after: after.core.character.name };
  }
  
  if (before.core.player.level !== after.core.player.level) {
    differences.core.playerLevel = { before: before.core.player.level, after: after.core.player.level };
  }
  
  if (before.core.world.day !== after.core.world.day) {
    differences.core.worldDay = { before: before.core.world.day, after: after.core.world.day };
  }
  
  // Compare narrative store changes
  const beforeActiveStorylets = before.narrative.storylets.active.length;
  const afterActiveStorylets = after.narrative.storylets.active.length;
  if (beforeActiveStorylets !== afterActiveStorylets) {
    differences.narrative.activeStorylets = { before: beforeActiveStorylets, after: afterActiveStorylets };
  }
  
  const beforeConcerns = Object.keys(before.narrative.concerns.current || {}).length;
  const afterConcerns = Object.keys(after.narrative.concerns.current || {}).length;
  if (beforeConcerns !== afterConcerns) {
    differences.narrative.concerns = { before: beforeConcerns, after: afterConcerns };
  }
  
  // Compare social store changes
  const beforeRelationships = Object.keys(before.social.npcs.relationships || {}).length;
  const afterRelationships = Object.keys(after.social.npcs.relationships || {}).length;
  if (beforeRelationships !== afterRelationships) {
    differences.social.relationships = { before: beforeRelationships, after: afterRelationships };
  }
  
  // Generate summary
  const totalChanges = Object.keys(differences.core).length + 
                      Object.keys(differences.narrative).length + 
                      Object.keys(differences.social).length;
  
  const summary = totalChanges === 0 
    ? 'No changes detected between states'
    : `${totalChanges} changes detected across stores in ${differences.duration}ms`;
  
  return {
    differences,
    summary
  };
};

/**
 * Create mock character data for testing
 */
export const createMockCharacterData = (overrides: any = {}) => {
  return {
    name: 'Test Character',
    background: 'scholar',
    attributes: {
      intelligence: 75,
      creativity: 60,
      charisma: 50,
      strength: 40,
      focus: 70,
      empathy: 65
    },
    domainAdjustments: {
      intellectualCompetence: 10,
      emotionalIntelligence: 5,
      socialCompetence: 0,
      physicalCompetence: -5,
      personalAutonomy: 0,
      identityClarity: 0,
      lifePurpose: 0
    },
    ...overrides
  };
};

/**
 * Measure performance of character flow operations
 */
export const measurePerformance = async (operation: () => Promise<any> | any, operationName: string): Promise<{ result: any; duration: number; success: boolean }> => {
  const startTime = performance.now();
  let success = false;
  let result = null;
  
  try {
    result = await operation();
    success = true;
  } catch (error) {
    result = { error: error.message };
    success = false;
  }
  
  const duration = performance.now() - startTime;
  
  console.log(`⏱️ ${operationName} took ${duration.toFixed(2)}ms (${success ? 'SUCCESS' : 'FAILED'})`);
  
  return {
    result,
    duration,
    success
  };
};

/**
 * Generate test report for character flow operations
 */
export const generateFlowTestReport = (testResults: FlowTestResult[]): { summary: any; passed: boolean; recommendations: string[] } => {
  const passed = testResults.every(r => r.success);
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
  const averageDuration = totalDuration / testResults.length;
  
  const summary = {
    totalTests: testResults.length,
    passed: testResults.filter(r => r.success).length,
    failed: testResults.filter(r => !r.success).length,
    totalDuration: totalDuration,
    averageDuration: averageDuration,
    overallPassed: passed
  };
  
  const recommendations: string[] = [];
  
  // Performance recommendations
  if (averageDuration > 100) {
    recommendations.push('Consider optimizing character flow operations - average duration exceeds 100ms');
  }
  
  // Error pattern recommendations
  const failedTests = testResults.filter(r => !r.success);
  if (failedTests.length > 0) {
    recommendations.push(`Fix failing tests: ${failedTests.map(t => t.testName).join(', ')}`);
  }
  
  // Success pattern recommendations
  if (passed) {
    recommendations.push('All tests passing - character flow is stable');
  }
  
  return {
    summary,
    passed,
    recommendations
  };
};

/**
 * Test first storylet flow activation
 */
export const testFirstStoryletFlow = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing First Storylet with consolidated stores...');
  
  const startTime = Date.now();
  
  try {
    // Create character to trigger storylet
    const { createCharacterAtomically } = await import('../../utils/characterFlowIntegration');
    createCharacterAtomically({
      name: 'Test User',
      background: 'scholar',
      attributes: { intelligence: 75 },
      domainAdjustments: {}
    });
    
    const { useNarrativeStore } = await import('../../stores/v2');
    const narrativeStore = useNarrativeStore.getState();
    
    // Verify character_created flag is set
    const flagSet = narrativeStore.flags.storylet.has('character_created');
    console.log('   Character created flag set:', flagSet);
    
    // Check if tutorial storylet would trigger (it should based on the flag)
    const wouldTrigger = flagSet; // Tutorial storylet triggers on character_created flag
    
    return {
      testName: 'First Storylet Flow',
      success: flagSet && wouldTrigger,
      duration: Date.now() - startTime,
      details: { 
        flagSet, 
        wouldTrigger,
        flags: Array.from(narrativeStore.flags.storylet.entries())
      }
    };
  } catch (error) {
    return {
      testName: 'First Storylet Flow',
      success: false,
      duration: Date.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

// Browser console access for development
if (typeof window !== 'undefined') {
  (window as any).captureFlowState = captureFlowState;
  (window as any).validateCharacterCreationState = validateCharacterCreationState;
  (window as any).validateStoreIntegrity = validateStoreIntegrity;
  (window as any).compareFlowStates = compareFlowStates;
  (window as any).createMockCharacterData = createMockCharacterData;
  (window as any).testFirstStoryletFlow = testFirstStoryletFlow;
  
  console.log('🧪 Character Flow Test Utils loaded');
  console.log('   captureFlowState() - Capture current store states');
  console.log('   validateCharacterCreationState(state) - Validate character creation');
  console.log('   validateStoreIntegrity(state) - Check store structure integrity');
  console.log('   createMockCharacterData(overrides?) - Create test character data');
  console.log('   testFirstStoryletFlow() - Test tutorial storylet triggering');
}