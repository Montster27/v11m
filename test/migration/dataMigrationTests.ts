// /Users/montysharma/V11M2/test/migration/dataMigrationTests.ts
// Comprehensive migration test suite

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../src/stores/v2';

export interface OldStoreData {
  appStore: {
    day: number;
    userLevel: number;
    experience: number;
    resources: Record<string, number>;
    skills: Record<string, number>;
  };
  characterStore: {
    name: string;
    background: string;
    attributes: Record<string, any>;
    concerns: Record<string, any>;
  };
  skillStore: {
    totalExperience: number;
    coreCompetencies: Record<string, any>;
    foundationExperiences: Record<string, any>;
    characterClasses: Record<string, any>;
  };
  storyletStore: {
    completedStorylets: string[];
    flags: Record<string, any>;
  };
  clueStore: {
    discoveredClues: any[];
    connections: Record<string, string[]>;
    storyArcs: Record<string, string[]>;
  };
  npcStore: {
    relationships: Record<string, number>;
    flags: Record<string, any>;
    memories: Record<string, any>;
  };
  saveStore: {
    currentSaveId: string | null;
    saveSlots: Record<string, any>;
    saveHistory: any[];
  };
}

export const setupOldStoreData = (): OldStoreData => {
  console.log('🧪 Setting up realistic test data in old store format...');
  
  const testData: OldStoreData = {
    appStore: {
      day: 15,
      userLevel: 5,
      experience: 750,
      resources: { energy: 100, focus: 80, social: 60 },
      skills: { athletics: 3, academics: 4, leadership: 2 }
    },
    characterStore: {
      name: 'TestCharacter',
      background: 'noble',
      attributes: { charm: 4, intelligence: 5, athleticism: 3 },
      concerns: { family: 0.8, academics: 0.6, social: 0.4 }
    },
    skillStore: {
      totalExperience: 1500,
      coreCompetencies: { leadership: 25, academics: 40, athletics: 15 },
      foundationExperiences: { noble_background: 100, tutoring: 50 },
      characterClasses: { scholar: true, athlete: false }
    },
    storyletStore: {
      completedStorylets: ['intro_welcome', 'first_class', 'meet_professor'],
      flags: { quest_completed_1: true, tutorial_finished: true, nobles_met: 3 }
    },
    clueStore: {
      discoveredClues: [
        { id: 'clue_1', name: 'Mysterious Letter', discoveryMethod: 'search' },
        { id: 'clue_2', name: 'Strange Symbol', discoveryMethod: 'minigame' }
      ],
      connections: { clue_1: ['clue_2'], clue_2: ['clue_1'] },
      storyArcs: { noble_mystery: ['clue_1', 'clue_2'] }
    },
    npcStore: {
      relationships: { professor_smith: 15, duke_wellington: -5, mary_student: 8 },
      flags: { 'professor_smith.met': true, 'duke_wellington.hostile': true },
      memories: { professor_smith: { last_conversation: 'academics', mood: 'pleased' } }
    },
    saveStore: {
      currentSaveId: 'save_main',
      saveSlots: { 
        save_main: { day: 15, character: 'TestCharacter', created: Date.now() },
        save_backup: { day: 10, character: 'TestCharacter', created: Date.now() - 86400000 }
      },
      saveHistory: [
        { action: 'create', saveId: 'save_main', timestamp: Date.now() - 3600000 },
        { action: 'update', saveId: 'save_main', timestamp: Date.now() - 1800000 }
      ]
    }
  };

  // Simulate old stores in global window
  (window as any).mockOldStoreData = testData;
  
  return testData;
};

export const migrateToCoreGameStore = (oldData: OldStoreData) => {
  console.log('🔄 Testing Core Game Store migration...');
  
  const coreGameStore = useCoreGameStore.getState();
  
  // Simulate migration logic
  coreGameStore.updatePlayer({
    level: oldData.appStore.userLevel,
    experience: oldData.appStore.experience,
    resources: oldData.appStore.resources
  });
  
  coreGameStore.updateCharacter({
    name: oldData.characterStore.name,
    background: oldData.characterStore.background,
    attributes: oldData.characterStore.attributes
  });
  
  coreGameStore.updateSkills({
    totalExperience: oldData.skillStore.totalExperience,
    coreCompetencies: oldData.skillStore.coreCompetencies,
    foundationExperiences: oldData.skillStore.foundationExperiences,
    characterClasses: oldData.skillStore.characterClasses
  });
  
  coreGameStore.updateWorld({
    day: oldData.appStore.day
  });
  
  return useCoreGameStore.getState();
};

export const migrateToNarrativeStore = (oldFlags: any) => {
  console.log('🔄 Testing Narrative Store flag unification...');
  
  const narrativeStore = useNarrativeStore.getState();
  
  // Migrate storylet flags
  if (oldFlags.storyletStore) {
    Object.entries(oldFlags.storyletStore).forEach(([key, value]) => {
      narrativeStore.setStoryletFlag(key, value);
    });
  }
  
  // Migrate concern flags
  if (oldFlags.concernsStore) {
    Object.entries(oldFlags.concernsStore).forEach(([key, value]) => {
      narrativeStore.setConcernFlag(key, value);
    });
  }
  
  // Migrate arc flags
  if (oldFlags.arcStore) {
    Object.entries(oldFlags.arcStore).forEach(([key, value]) => {
      narrativeStore.setArcFlag(key, value);
    });
  }
  
  return useNarrativeStore.getState();
};

export const migrateToSocialStore = (oldData: OldStoreData) => {
  console.log('🔄 Testing Social Store migration...');
  
  const socialStore = useSocialStore.getState();
  
  // Reset store first to ensure clean migration
  socialStore.resetSocial();
  
  // Migrate NPCs - updateRelationship adds to existing, so we need to set directly
  Object.entries(oldData.npcStore.relationships).forEach(([npcId, level]) => {
    // Since updateRelationship adds to existing value, and we start from 0, this works correctly
    socialStore.updateRelationship(npcId, level);
  });
  
  Object.entries(oldData.npcStore.memories).forEach(([npcId, memory]) => {
    socialStore.setNPCMemory(npcId, memory);
  });
  
  // Set NPC flags
  Object.entries(oldData.npcStore.flags).forEach(([flagKey, value]) => {
    const [npcId, flag] = flagKey.split('.');
    if (npcId && flag) {
      socialStore.setNPCFlag(npcId, flag, value);
    }
  });
  
  // Migrate clues
  oldData.clueStore.discoveredClues.forEach(clue => {
    socialStore.discoverClue(clue);
  });
  
  Object.entries(oldData.clueStore.storyArcs).forEach(([arcId, clueIds]) => {
    clueIds.forEach(clueId => {
      socialStore.associateClueWithArc(clueId, arcId);
    });
  });
  
  // Migrate saves
  if (oldData.saveStore.currentSaveId) {
    socialStore.setCurrentSave(oldData.saveStore.currentSaveId);
  }
  Object.entries(oldData.saveStore.saveSlots).forEach(([saveId, saveData]) => {
    socialStore.createSaveSlot(saveId, saveData);
  });
  
  return useSocialStore.getState();
};

export const performFullMigration = () => {
  console.log('🔄 Performing complete migration test...');
  
  const oldData = setupOldStoreData();
  
  // Perform migrations
  const coreGameMigrated = migrateToCoreGameStore(oldData);
  const narrativeMigrated = migrateToNarrativeStore({
    storyletStore: oldData.storyletStore.flags,
    concernsStore: oldData.characterStore.concerns,
    arcStore: { arc_noble_path: 'active', arc_academic: 'completed' }
  });
  const socialMigrated = migrateToSocialStore(oldData);
  
  return {
    original: oldData,
    migrated: {
      coreGame: coreGameMigrated,
      narrative: narrativeMigrated,
      social: socialMigrated
    }
  };
};

export const validateNoDataLoss = (originalData: OldStoreData, migratedData: any) => {
  console.log('🔍 Validating no data loss during migration...');
  
  const validations = {
    coreGameData: false,
    narrativeData: false,
    socialData: false,
    errors: [] as string[]
  };
  
  try {
    // Validate Core Game migration
    const core = migratedData.migrated.coreGame;
    if (core.player.level === originalData.appStore.userLevel &&
        core.player.experience === originalData.appStore.experience &&
        core.world.day === originalData.appStore.day &&
        core.character.name === originalData.characterStore.name &&
        core.skills.totalExperience === originalData.skillStore.totalExperience) {
      validations.coreGameData = true;
    } else {
      validations.errors.push('Core Game data migration incomplete');
    }
  } catch (error) {
    validations.errors.push(`Core Game validation error: ${error}`);
  }
  
  try {
    // Validate Narrative migration
    const narrative = migratedData.migrated.narrative;
    const hasStoryletFlags = narrative.flags.storylet.get('quest_completed_1') === true;
    const hasConcernFlags = narrative.flags.concerns.get('family') === 0.8;
    
    if (hasStoryletFlags && hasConcernFlags) {
      validations.narrativeData = true;
    } else {
      validations.errors.push('Narrative flag migration incomplete');
    }
  } catch (error) {
    validations.errors.push(`Narrative validation error: ${error}`);
  }
  
  try {
    // Validate Social migration
    const social = migratedData.migrated.social;
    
    // Debug: Log actual social data for inspection
    console.log('🔍 Debugging social migration data:');
    console.log('  NPC Relationships:', social.npcs.relationships);
    console.log('  Discovered Clues:', social.clues.discovered.length);
    console.log('  Current Save ID:', social.saves.currentSaveId);
    console.log('  Save Slots:', Object.keys(social.saves.saveSlots));
    
    const hasNPCRelationships = social.npcs.relationships['professor_smith'] === 15;
    const hasClues = social.clues.discovered.length >= 2;
    const hasSaves = social.saves.currentSaveId === 'save_main';
    
    console.log('  Validation checks:');
    console.log('    NPC relationship check:', hasNPCRelationships, `(expected: 15, actual: ${social.npcs.relationships['professor_smith']})`);
    console.log('    Clues check:', hasClues, `(expected: >=2, actual: ${social.clues.discovered.length})`);
    console.log('    Save check:', hasSaves, `(expected: save_main, actual: ${social.saves.currentSaveId})`);
    
    if (hasNPCRelationships && hasClues && hasSaves) {
      validations.socialData = true;
    } else {
      const issues = [];
      if (!hasNPCRelationships) issues.push('NPC relationships');
      if (!hasClues) issues.push('clue discovery');
      if (!hasSaves) issues.push('save system');
      validations.errors.push(`Social data migration incomplete: ${issues.join(', ')}`);
    }
  } catch (error) {
    validations.errors.push(`Social validation error: ${error}`);
  }
  
  const allValid = validations.coreGameData && validations.narrativeData && validations.socialData;
  
  console.log('📊 Data Loss Validation Results:');
  console.log('  Core Game Data:', validations.coreGameData ? '✅' : '❌');
  console.log('  Narrative Data:', validations.narrativeData ? '✅' : '❌');
  console.log('  Social Data:', validations.socialData ? '✅' : '❌');
  console.log('  Overall:', allValid ? '✅ NO DATA LOSS' : '❌ DATA LOSS DETECTED');
  
  if (validations.errors.length > 0) {
    console.log('❌ Validation Errors:', validations.errors);
  }
  
  return {
    passed: allValid,
    validations,
    summary: `${Object.values(validations).filter(v => v === true).length}/3 domains validated successfully`
  };
};

export const validateDataConsistency = (migratedData: any) => {
  console.log('🔍 Validating data consistency across stores...');
  
  const consistencyChecks = {
    characterNameConsistency: false,
    dayConsistency: false,
    flagConsistency: false,
    errors: [] as string[]
  };
  
  try {
    const { coreGame, narrative, social } = migratedData.migrated;
    
    // Check character name consistency
    if (coreGame.character.name && coreGame.character.name.length > 0) {
      consistencyChecks.characterNameConsistency = true;
    }
    
    // Check day consistency
    if (coreGame.world.day >= 1 && coreGame.world.day <= 365) {
      consistencyChecks.dayConsistency = true;
    }
    
    // Check flag consistency (Maps should be properly initialized)
    if (narrative.flags.storylet instanceof Map &&
        narrative.flags.concerns instanceof Map &&
        narrative.flags.storyArc instanceof Map) {
      consistencyChecks.flagConsistency = true;
    }
    
  } catch (error) {
    consistencyChecks.errors.push(`Consistency validation error: ${error}`);
  }
  
  const allConsistent = Object.values(consistencyChecks).filter(v => typeof v === 'boolean').every(v => v);
  
  console.log('📊 Data Consistency Results:');
  console.log('  Character Name:', consistencyChecks.characterNameConsistency ? '✅' : '❌');
  console.log('  Day Values:', consistencyChecks.dayConsistency ? '✅' : '❌');
  console.log('  Flag Maps:', consistencyChecks.flagConsistency ? '✅' : '❌');
  console.log('  Overall:', allConsistent ? '✅ CONSISTENT' : '❌ INCONSISTENCIES FOUND');
  
  return {
    passed: allConsistent,
    checks: consistencyChecks,
    summary: 'Data consistency validation completed'
  };
};

// Main test runner
export const runMigrationTestSuite = () => {
  console.log('🧪 Running Migration Test Suite...');
  console.log('='.repeat(50));
  
  try {
    // Setup test data
    const oldData = setupOldStoreData();
    console.log('✅ Test data setup complete');
    
    // Test individual migrations
    console.log('\n📝 Testing individual store migrations...');
    const coreResult = migrateToCoreGameStore(oldData);
    console.log('✅ Core Game Store migration test complete');
    
    const narrativeResult = migrateToNarrativeStore({
      storyletStore: oldData.storyletStore.flags,
      concernsStore: oldData.characterStore.concerns,
      arcStore: { arc_noble_path: 'active' }
    });
    console.log('✅ Narrative Store migration test complete');
    
    const socialResult = migrateToSocialStore(oldData);
    console.log('✅ Social Store migration test complete');
    
    // Test full migration
    console.log('\n🔄 Testing complete migration...');
    const fullMigrationResult = performFullMigration();
    
    // Validate results
    console.log('\n🔍 Running validation tests...');
    const dataLossResults = validateNoDataLoss(oldData, fullMigrationResult);
    const consistencyResults = validateDataConsistency(fullMigrationResult);
    
    // Final summary
    const overallSuccess = dataLossResults.passed && consistencyResults.passed;
    
    console.log('\n🏁 Migration Test Suite Results:');
    console.log('='.repeat(50));
    console.log('📊 Individual Migrations: ✅ Complete');
    console.log('🔒 Data Loss Validation:', dataLossResults.passed ? '✅ PASSED' : '❌ FAILED');
    console.log('🔍 Consistency Validation:', consistencyResults.passed ? '✅ PASSED' : '❌ FAILED');
    console.log('🎯 Overall Result:', overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    return {
      success: overallSuccess,
      results: {
        dataLoss: dataLossResults,
        consistency: consistencyResults
      },
      summary: overallSuccess ? 'Migration test suite passed' : 'Migration test suite failed'
    };
    
  } catch (error) {
    console.error('❌ Migration test suite failed:', error);
    return {
      success: false,
      error: error,
      summary: 'Migration test suite crashed'
    };
  }
};

// Global functions for easy access
if (typeof window !== 'undefined') {
  (window as any).setupOldStoreData = setupOldStoreData;
  (window as any).migrateToCoreGameStore = migrateToCoreGameStore;
  (window as any).migrateToNarrativeStore = migrateToNarrativeStore;
  (window as any).migrateToSocialStore = migrateToSocialStore;
  (window as any).performFullMigration = performFullMigration;
  (window as any).validateNoDataLoss = validateNoDataLoss;
  (window as any).validateDataConsistency = validateDataConsistency;
  (window as any).runMigrationTestSuite = runMigrationTestSuite;
  
  console.log('🧪 Migration test suite loaded');
  console.log('   runMigrationTestSuite() - Run complete test suite');
  console.log('   setupOldStoreData() - Create test data');
  console.log('   performFullMigration() - Test full migration');
}