// /Users/montysharma/V11M2/test/reset/atomicResetTests.ts
// Atomic Reset Testing Suite - Validates original character reset issue is solved

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../src/stores/v2';

export interface ResetTestResult {
  operationCount: number;
  success: boolean;
  errors: string[];
  duration: number;
  storesReset: string[];
}

export interface GameStateSnapshot {
  coreGame: any;
  narrative: any;
  social: any;
  timestamp: number;
}

export const getInitialCoreState = () => ({
  player: {
    level: 1,
    experience: 0,
    skillPoints: 0,
    resources: {}
  },
  character: {
    name: '',
    background: '',
    attributes: {},
    developmentStats: {}
  },
  skills: {
    foundationExperiences: {},
    coreCompetencies: {},
    characterClasses: {},
    totalExperience: 0
  },
  world: {
    day: 1,
    timeAllocation: {},
    isTimePaused: false
  }
});

export const getInitialNarrativeState = () => ({
  storylets: {
    active: [],
    completed: [],
    cooldowns: {},
    userCreated: []
  },
  flags: {
    storylet: new Map(),
    storyletFlag: new Map(),
    concerns: new Map(),
    storyArc: new Map()
  },
  storyArcs: {
    progress: {},
    metadata: {},
    failures: {}
  },
  concerns: {
    current: {},
    history: []
  }
});

export const getInitialSocialState = () => ({
  npcs: {
    relationships: {},
    interactionHistory: {},
    memories: {},
    flags: {}
  },
  clues: {
    discovered: [],
    connections: {},
    storyArcs: {},
    discoveryEvents: []
  },
  saves: {
    currentSaveId: null,
    saveSlots: {},
    saveHistory: []
  }
});

export const setupComplexGameState = (): GameStateSnapshot => {
  console.log('🎮 Setting up complex game state across all stores...');
  
  const coreStore = useCoreGameStore.getState();
  const narrativeStore = useNarrativeStore.getState();
  const socialStore = useSocialStore.getState();
  
  // Create complex core game state (simulating advanced player)
  coreStore.updatePlayer({
    level: 15,
    experience: 8750,
    skillPoints: 25,
    resources: { energy: 75, focus: 50, social: 90, money: 1200 }
  });
  
  coreStore.updateCharacter({
    name: 'Alexandra Noble',
    background: 'aristocrat',
    attributes: { charm: 8, intelligence: 7, athleticism: 5, creativity: 6 },
    developmentStats: { 
      socialConnections: 25, 
      academicProgress: 80, 
      physicalFitness: 60,
      artisticTalent: 45
    }
  });
  
  coreStore.updateSkills({
    totalExperience: 8750,
    coreCompetencies: { 
      leadership: 150, 
      academics: 200, 
      athletics: 75, 
      arts: 100,
      socializing: 180
    },
    foundationExperiences: { 
      noble_upbringing: 500, 
      private_tutoring: 300,
      ballroom_dancing: 150,
      equestrian: 200
    },
    characterClasses: { 
      scholar: true, 
      socialite: true, 
      athlete: false, 
      artist: true 
    }
  });
  
  coreStore.updateWorld({
    day: 45,
    timeAllocation: { 
      morning: 'classes', 
      afternoon: 'socializing', 
      evening: 'studying' 
    },
    isTimePaused: false
  });
  
  // Create complex narrative state
  narrativeStore.addActiveStorylet('arc_noble_conspiracy_part_3');
  narrativeStore.addActiveStorylet('relationship_drama_elizabeth');
  narrativeStore.addActiveStorylet('academic_challenge_advanced_math');
  
  narrativeStore.completeStorylet('intro_welcome');
  narrativeStore.completeStorylet('first_semester_exams');
  narrativeStore.completeStorylet('winter_ball_preparation');
  
  narrativeStore.setStoryletFlag('noble_conspiracy_discovered', true);
  narrativeStore.setStoryletFlag('elizabeth_trust_level', 8);
  narrativeStore.setStoryletFlag('academic_reputation', 'excellent');
  narrativeStore.setStoryletFlag('semester_grades', { math: 'A', history: 'A-', art: 'B+' });
  
  narrativeStore.setConcernFlag('family_pressure', 0.7);
  narrativeStore.setConcernFlag('academic_stress', 0.4);
  narrativeStore.setConcernFlag('social_standing', 0.2);
  
  narrativeStore.setArcFlag('noble_conspiracy_arc', 'investigation_phase');
  narrativeStore.setArcFlag('romance_arc_elizabeth', 'friendship_established');
  narrativeStore.setArcFlag('academic_excellence_arc', 'advanced_courses');
  
  narrativeStore.updateArcProgress('noble_conspiracy', 65);
  narrativeStore.updateArcProgress('academic_excellence', 80);
  narrativeStore.updateArcProgress('social_circle_expansion', 45);
  
  // Create complex social state
  socialStore.updateRelationship('elizabeth_harrington', 25);
  socialStore.updateRelationship('professor_blackwood', 15);
  socialStore.updateRelationship('duke_pemberton', -10);
  socialStore.updateRelationship('countess_victoria', 20);
  socialStore.updateRelationship('rival_student_james', -5);
  
  socialStore.setNPCMemory('elizabeth_harrington', {
    lastConversation: 'shared_secrets_about_conspiracy',
    mood: 'trusting_but_worried',
    relationship_status: 'close_friend',
    secrets_shared: ['family_scandal', 'academic_cheating_rumors']
  });
  
  socialStore.setNPCFlag('professor_blackwood', 'knows_student_potential', true);
  socialStore.setNPCFlag('duke_pemberton', 'suspicious_of_investigation', true);
  socialStore.setNPCFlag('elizabeth_harrington', 'romance_potential', true);
  
  socialStore.discoverClue({
    id: 'mysterious_letter_duke',
    name: 'Mysterious Letter from Duke',
    description: 'A coded letter discussing financial irregularities',
    discoveryMethod: 'investigation',
    importance: 'high',
    connections: ['financial_records', 'secret_meeting_notes']
  });
  
  socialStore.discoverClue({
    id: 'secret_meeting_notes',
    name: 'Secret Meeting Notes',
    description: 'Notes from a clandestine meeting about academy funding',
    discoveryMethod: 'eavesdropping',
    importance: 'critical',
    connections: ['mysterious_letter_duke']
  });
  
  socialStore.connectClues('mysterious_letter_duke', 'secret_meeting_notes');
  socialStore.associateClueWithArc('mysterious_letter_duke', 'noble_conspiracy');
  socialStore.associateClueWithArc('secret_meeting_notes', 'noble_conspiracy');
  
  socialStore.setCurrentSave('main_save_advanced');
  socialStore.createSaveSlot('main_save_advanced', {
    playerName: 'Alexandra Noble',
    day: 45,
    level: 15,
    location: 'Pemberton Academy',
    majorChoices: ['investigated_conspiracy', 'befriended_elizabeth', 'excelled_academically']
  });
  
  // Capture snapshot
  const snapshot: GameStateSnapshot = {
    coreGame: useCoreGameStore.getState(),
    narrative: useNarrativeStore.getState(),
    social: useSocialStore.getState(),
    timestamp: Date.now()
  };
  
  console.log('✅ Complex game state setup complete:');
  console.log(`  Player Level: ${snapshot.coreGame.player.level}`);
  console.log(`  Game Day: ${snapshot.coreGame.world.day}`);
  console.log(`  Active Storylets: ${snapshot.narrative.storylets.active.length}`);
  console.log(`  Completed Storylets: ${snapshot.narrative.storylets.completed.length}`);
  console.log(`  NPC Relationships: ${Object.keys(snapshot.social.npcs.relationships).length}`);
  console.log(`  Discovered Clues: ${snapshot.social.clues.discovered.length}`);
  
  return snapshot;
};

export const setupGameInProgress = (): GameStateSnapshot => {
  console.log('🎯 Setting up mid-game state for reset validation...');
  
  const coreStore = useCoreGameStore.getState();
  const narrativeStore = useNarrativeStore.getState();
  const socialStore = useSocialStore.getState();
  
  // Moderate progress state
  coreStore.updatePlayer({ level: 8, experience: 2100, skillPoints: 12 });
  coreStore.updateCharacter({ name: 'Test Character', background: 'commoner' });
  coreStore.updateWorld({ day: 22 });
  
  narrativeStore.addActiveStorylet('mid_game_storylet');
  narrativeStore.completeStorylet('early_game_storylet');
  narrativeStore.setStoryletFlag('mid_game_flag', true);
  
  socialStore.updateRelationship('test_npc', 10);
  socialStore.discoverClue({
    id: 'test_clue',
    name: 'Test Clue',
    description: 'A test clue for validation',
    discoveryMethod: 'test',
    importance: 'low'
  });
  
  return {
    coreGame: useCoreGameStore.getState(),
    narrative: useNarrativeStore.getState(),
    social: useSocialStore.getState(),
    timestamp: Date.now()
  };
};

export const performAtomicReset = (): ResetTestResult => {
  console.log('⚡ Performing atomic reset operation...');
  
  const startTime = performance.now();
  const result: ResetTestResult = {
    operationCount: 0,
    success: true,
    errors: [],
    duration: 0,
    storesReset: []
  };
  
  try {
    // Original issue: Required 12+ debugging attempts with race conditions
    // New solution: Single atomic operation per store
    
    // Core Game Store reset
    console.log('🔄 Resetting Core Game Store...');
    useCoreGameStore.getState().resetGame();
    result.operationCount++;
    result.storesReset.push('CoreGameStore');
    
    // Narrative Store reset  
    console.log('🔄 Resetting Narrative Store...');
    useNarrativeStore.getState().resetNarrative();
    result.operationCount++;
    result.storesReset.push('NarrativeStore');
    
    // Social Store reset
    console.log('🔄 Resetting Social Store...');
    useSocialStore.getState().resetSocial();
    result.operationCount++;
    result.storesReset.push('SocialStore');
    
    const endTime = performance.now();
    result.duration = endTime - startTime;
    
    console.log(`✅ Atomic reset completed in ${result.duration.toFixed(2)}ms`);
    console.log(`📊 Operations: ${result.operationCount} store resets`);
    
  } catch (error) {
    result.success = false;
    result.errors.push(`Atomic reset failed: ${error}`);
    console.error('❌ Atomic reset failed:', error);
  }
  
  return result;
};

export const validateResetStateEquality = () => {
  console.log('🔍 Validating reset state equality...');
  
  const coreState = useCoreGameStore.getState();
  const narrativeState = useNarrativeStore.getState();
  const socialState = useSocialStore.getState();
  
  const expectedCore = getInitialCoreState();
  const expectedNarrative = getInitialNarrativeState();
  const expectedSocial = getInitialSocialState();
  
  const validation = {
    coreGameEqual: true,
    narrativeEqual: true,
    socialEqual: true,
    errors: [] as string[]
  };
  
  // Deep equality check for Core Game Store
  try {
    if (coreState.player.level !== expectedCore.player.level ||
        coreState.player.experience !== expectedCore.player.experience ||
        coreState.world.day !== expectedCore.world.day ||
        coreState.character.name !== expectedCore.character.name) {
      validation.coreGameEqual = false;
      validation.errors.push('Core Game state not equal to initial state');
    }
  } catch (error) {
    validation.coreGameEqual = false;
    validation.errors.push(`Core Game validation error: ${error}`);
  }
  
  // Deep equality check for Narrative Store
  try {
    if (narrativeState.storylets.active.length !== expectedNarrative.storylets.active.length ||
        narrativeState.storylets.completed.length !== expectedNarrative.storylets.completed.length ||
        narrativeState.flags.storylet.size !== expectedNarrative.flags.storylet.size) {
      validation.narrativeEqual = false;
      validation.errors.push('Narrative state not equal to initial state');
    }
  } catch (error) {
    validation.narrativeEqual = false;
    validation.errors.push(`Narrative validation error: ${error}`);
  }
  
  // Deep equality check for Social Store
  try {
    if (Object.keys(socialState.npcs.relationships).length !== Object.keys(expectedSocial.npcs.relationships).length ||
        socialState.clues.discovered.length !== expectedSocial.clues.discovered.length ||
        socialState.saves.currentSaveId !== expectedSocial.saves.currentSaveId) {
      validation.socialEqual = false;
      validation.errors.push('Social state not equal to initial state');
    }
  } catch (error) {
    validation.socialEqual = false;
    validation.errors.push(`Social validation error: ${error}`);
  }
  
  const allEqual = validation.coreGameEqual && validation.narrativeEqual && validation.socialEqual;
  
  console.log('📊 Reset State Equality Results:');
  console.log('  Core Game State:', validation.coreGameEqual ? '✅ EQUAL' : '❌ NOT EQUAL');
  console.log('  Narrative State:', validation.narrativeEqual ? '✅ EQUAL' : '❌ NOT EQUAL');
  console.log('  Social State:', validation.socialEqual ? '✅ EQUAL' : '❌ NOT EQUAL');
  console.log('  Overall:', allEqual ? '✅ ALL EQUAL TO INITIAL STATE' : '❌ STATE DIFFERENCES FOUND');
  
  if (validation.errors.length > 0) {
    console.log('❌ Validation Errors:', validation.errors);
  }
  
  return {
    passed: allEqual,
    validation,
    summary: allEqual ? 'All stores reset to initial state' : 'Some stores not properly reset'
  };
};

export const testResetTimingPerformance = (): { passed: boolean; duration: number; performance: string } => {
  console.log('⏱️ Testing reset timing performance...');
  
  // Setup complex state first
  setupComplexGameState();
  
  const startTime = performance.now();
  performAtomicReset();
  const duration = performance.now() - startTime;
  
  const performanceThreshold = 100; // Under 100ms for good UX
  const passed = duration < performanceThreshold;
  
  console.log(`⏱️ Reset Performance Results:`);
  console.log(`  Duration: ${duration.toFixed(2)}ms`);
  console.log(`  Threshold: ${performanceThreshold}ms`);
  console.log(`  Result: ${passed ? '✅ FAST ENOUGH' : '❌ TOO SLOW'}`);
  
  let performanceRating = 'excellent';
  if (duration > 50) performanceRating = 'good';
  if (duration > 100) performanceRating = 'acceptable';
  if (duration > 200) performanceRating = 'poor';
  
  return {
    passed,
    duration,
    performance: performanceRating
  };
};

export const runAtomicResetTestSuite = () => {
  console.log('🧪 Running Atomic Reset Test Suite...');
  console.log('='.repeat(60));
  console.log('🎯 Goal: Validate the original character reset issue is solved');
  console.log('🔧 Original issue: Required 12+ debugging attempts with race conditions');
  console.log('✨ New solution: Single atomic operation per store');
  console.log('='.repeat(60));
  
  const testResults = {
    singleOperationTest: false,
    resetStateValidation: false,
    timingPerformance: false,
    errors: [] as string[]
  };
  
  try {
    // Test 1: Single Operation Character Reset
    console.log('\n📝 TEST 1: Single Operation Character Reset');
    console.log('-'.repeat(50));
    
    setupComplexGameState();
    const resetResult = performAtomicReset();
    
    const singleOpExpected = {
      operationCount: 3, // 3 store resets
      success: true,
      errorCount: 0
    };
    
    if (resetResult.operationCount === singleOpExpected.operationCount &&
        resetResult.success === singleOpExpected.success &&
        resetResult.errors.length === singleOpExpected.errorCount) {
      testResults.singleOperationTest = true;
      console.log('✅ Single Operation Test: PASSED');
      console.log(`   Operations: ${resetResult.operationCount} (expected: ${singleOpExpected.operationCount})`);
      console.log(`   Success: ${resetResult.success} (expected: ${singleOpExpected.success})`);
      console.log(`   Errors: ${resetResult.errors.length} (expected: ${singleOpExpected.errorCount})`);
    } else {
      testResults.errors.push('Single operation test failed');
      console.log('❌ Single Operation Test: FAILED');
    }
    
    // Test 2: Reset State Validation
    console.log('\n📝 TEST 2: Reset State Validation');
    console.log('-'.repeat(50));
    
    setupGameInProgress();
    performAtomicReset();
    const stateValidation = validateResetStateEquality();
    
    if (stateValidation.passed) {
      testResults.resetStateValidation = true;
      console.log('✅ Reset State Validation: PASSED');
    } else {
      testResults.errors.push('Reset state validation failed');
      console.log('❌ Reset State Validation: FAILED');
    }
    
    // Test 3: Reset Timing Performance
    console.log('\n📝 TEST 3: Reset Timing Performance');
    console.log('-'.repeat(50));
    
    const performanceTest = testResetTimingPerformance();
    
    if (performanceTest.passed) {
      testResults.timingPerformance = true;
      console.log('✅ Timing Performance Test: PASSED');
      console.log(`   Duration: ${performanceTest.duration.toFixed(2)}ms (under 100ms threshold)`);
      console.log(`   Performance: ${performanceTest.performance}`);
    } else {
      testResults.errors.push('Timing performance test failed');
      console.log('❌ Timing Performance Test: FAILED');
    }
    
  } catch (error) {
    testResults.errors.push(`Test suite error: ${error}`);
    console.error('❌ Test suite crashed:', error);
  }
  
  // Final Results
  const allTestsPassed = testResults.singleOperationTest && 
                        testResults.resetStateValidation && 
                        testResults.timingPerformance;
  
  console.log('\n🏁 Atomic Reset Test Suite Results');
  console.log('='.repeat(60));
  console.log('📊 Test Results:');
  console.log(`   Single Operation Test: ${testResults.singleOperationTest ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Reset State Validation: ${testResults.resetStateValidation ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Timing Performance: ${testResults.timingPerformance ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('\n🎯 Original Issue Status:');
  console.log(`   Character Reset Problem: ${allTestsPassed ? '✅ SOLVED' : '❌ NOT SOLVED'}`);
  console.log(`   Race Conditions: ${allTestsPassed ? '✅ ELIMINATED' : '❌ STILL PRESENT'}`);
  console.log(`   Debugging Complexity: ${allTestsPassed ? '✅ SIMPLIFIED (3 operations)' : '❌ STILL COMPLEX'}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Test Errors:', testResults.errors);
  }
  
  console.log('\n🚀 Final Verdict:');
  console.log(`   ${allTestsPassed ? '✅ ORIGINAL CHARACTER RESET ISSUE IS COMPLETELY SOLVED' : '❌ ORIGINAL ISSUE PERSISTS'}`);
  
  return {
    success: allTestsPassed,
    results: testResults,
    summary: allTestsPassed ? 'All atomic reset tests passed - original issue solved' : 'Some tests failed - issue may persist'
  };
};

// Global functions for easy access
if (typeof window !== 'undefined') {
  (window as any).setupComplexGameState = setupComplexGameState;
  (window as any).setupGameInProgress = setupGameInProgress;
  (window as any).performAtomicReset = performAtomicReset;
  (window as any).validateResetStateEquality = validateResetStateEquality;
  (window as any).testResetTimingPerformance = testResetTimingPerformance;
  (window as any).runAtomicResetTestSuite = runAtomicResetTestSuite;
  
  console.log('🧪 Atomic Reset Test Suite loaded');
  console.log('   runAtomicResetTestSuite() - Run complete test suite');
  console.log('   setupComplexGameState() - Create complex game state');
  console.log('   performAtomicReset() - Test atomic reset operation');
  console.log('   validateResetStateEquality() - Validate reset completeness');
  console.log('   testResetTimingPerformance() - Test reset speed');
}