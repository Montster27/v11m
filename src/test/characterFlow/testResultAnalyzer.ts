// /Users/montysharma/V11M2/src/test/characterFlow/testResultAnalyzer.ts
// Analyze which specific test is failing

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { createCharacterAtomically, resetAllGameState } from '../../utils/characterFlowIntegration';

/**
 * Run each test individually to identify the failing one
 */
export const analyzeTestFailure = () => {
  console.log('🔍 TEST FAILURE ANALYSIS');
  console.log('========================\n');
  
  const testResults: any[] = [];
  
  try {
    // Reset to clean state
    resetAllGameState();
    
    // Test 1: Clean state - Level
    const level = useCoreGameStore.getState().player.level;
    const test1 = level === 1;
    testResults.push({ name: 'Clean State - Level 1', passed: test1, actual: level, expected: 1 });
    console.log(`${test1 ? '✅' : '❌'} Test 1: Clean State - Level 1 (actual: ${level})`);
    
    // Test 2: Clean state - Experience
    const experience = useCoreGameStore.getState().player.experience;
    const test2 = experience === 0;
    testResults.push({ name: 'Clean State - 0 XP', passed: test2, actual: experience, expected: 0 });
    console.log(`${test2 ? '✅' : '❌'} Test 2: Clean State - 0 XP (actual: ${experience})`);
    
    // Test 3: Clean state - Day
    const day = useCoreGameStore.getState().world.day;
    const test3 = day === 1;
    testResults.push({ name: 'Clean State - Day 1', passed: test3, actual: day, expected: 1 });
    console.log(`${test3 ? '✅' : '❌'} Test 3: Clean State - Day 1 (actual: ${day})`);
    
    // Test 4: Clean state - No character
    const characterName = useCoreGameStore.getState().character.name;
    const test4 = characterName === '';
    testResults.push({ name: 'Clean State - No Character', passed: test4, actual: characterName, expected: '' });
    console.log(`${test4 ? '✅' : '❌'} Test 4: Clean State - No Character (actual: "${characterName}")`);
    
    // Create character for remaining tests
    createCharacterAtomically({
      name: 'Quick Test Character',
      background: 'scholar',
      attributes: { intelligence: 80 },
      domainAdjustments: { intellectualCompetence: 5 }
    });
    
    // Test 5: Character created
    const newCharacterName = useCoreGameStore.getState().character.name;
    const test5 = newCharacterName === 'Quick Test Character';
    testResults.push({ name: 'Character Created', passed: test5, actual: newCharacterName, expected: 'Quick Test Character' });
    console.log(`${test5 ? '✅' : '❌'} Test 5: Character Created (actual: "${newCharacterName}")`);
    
    // Test 6: Background set
    const background = useCoreGameStore.getState().character.background;
    const test6 = background === 'scholar';
    testResults.push({ name: 'Background Set', passed: test6, actual: background, expected: 'scholar' });
    console.log(`${test6 ? '✅' : '❌'} Test 6: Background Set (actual: "${background}")`);
    
    // Test 7: Character created flag
    const narrativeStore = useNarrativeStore.getState();
    const flagValue = narrativeStore.getStoryletFlag('character_created');
    const test7 = flagValue === true;
    testResults.push({ name: 'Character Created Flag', passed: test7, actual: flagValue, expected: true });
    console.log(`${test7 ? '✅' : '❌'} Test 7: Character Created Flag (actual: ${flagValue})`);
    
    // Save system test (this would be test 8 if included)
    const socialStore = useSocialStore.getState();
    const testSaveId = 'analysis_test_' + Date.now();
    socialStore.createSaveSlot(testSaveId, {
      name: 'Analysis Test Save',
      characterName: newCharacterName,
      gameDay: 1,
      playerLevel: 1
    });
    const saveExists = testSaveId in socialStore.saves.saveSlots;
    console.log(`\n📝 Bonus Check - Save System: ${saveExists ? '✅ Working' : '❌ Not Working'}`);
    if (saveExists) {
      socialStore.deleteSaveSlot(testSaveId);
    }
    
    // Summary
    const passedTests = testResults.filter(t => t.passed);
    const failedTests = testResults.filter(t => !t.passed);
    
    console.log('\n📊 ANALYSIS SUMMARY');
    console.log('===================');
    console.log(`Tests Passed: ${passedTests.length}/${testResults.length}`);
    
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}`);
        console.log(`     Expected: ${JSON.stringify(test.expected)}`);
        console.log(`     Actual: ${JSON.stringify(test.actual)}`);
      });
    }
    
    // Check if it's the save test that's failing
    if (passedTests.length === 6 && testResults.length === 7) {
      console.log('\n💡 LIKELY CAUSE:');
      console.log('   The failing test is probably the save system test');
      console.log('   which is test #8 in the original quickValidationTest');
      console.log('   but only 7 tests are being counted in the summary.');
    }
    
    return {
      testResults,
      passed: passedTests.length,
      total: testResults.length,
      failedTests
    };
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    return { error: error.message, testResults };
  }
};

/**
 * Quick flag check
 */
export const checkStoryletFlags = () => {
  console.log('🚩 STORYLET FLAG CHECK');
  console.log('======================\n');
  
  try {
    const narrativeStore = useNarrativeStore.getState();
    
    console.log('1️⃣ Checking flag storage type...');
    console.log(`   flags type: ${typeof narrativeStore.flags}`);
    console.log(`   flags.storylet type: ${typeof narrativeStore.flags?.storylet}`);
    
    if (narrativeStore.flags?.storylet instanceof Map) {
      console.log('   ✅ Using Map for storylet flags');
      console.log(`   Map size: ${narrativeStore.flags.storylet.size}`);
      console.log('   Map entries:', Array.from(narrativeStore.flags.storylet.entries()));
    } else if (typeof narrativeStore.flags?.storylet === 'object') {
      console.log('   ✅ Using Object for storylet flags');
      console.log(`   Keys: ${Object.keys(narrativeStore.flags.storylet || {})}`);
      console.log('   Values:', narrativeStore.flags.storylet);
    }
    
    console.log('\n2️⃣ Testing flag operations...');
    
    // Test setting a flag
    narrativeStore.setStoryletFlag('test_flag', true);
    const testFlagValue = narrativeStore.getStoryletFlag('test_flag');
    console.log(`   Set test_flag=true, got: ${testFlagValue}`);
    console.log(`   ${testFlagValue === true ? '✅' : '❌'} Flag set/get working`);
    
    // Test character_created flag specifically
    console.log('\n3️⃣ Checking character_created flag...');
    const characterCreatedFlag = narrativeStore.getStoryletFlag('character_created');
    console.log(`   character_created flag: ${characterCreatedFlag}`);
    console.log(`   Type: ${typeof characterCreatedFlag}`);
    
    // Try setting it
    narrativeStore.setStoryletFlag('character_created', true);
    const afterSetting = narrativeStore.getStoryletFlag('character_created');
    console.log(`   After setting to true: ${afterSetting}`);
    
    return {
      flagType: narrativeStore.flags?.storylet instanceof Map ? 'Map' : 'Object',
      testFlagWorking: testFlagValue === true,
      characterCreatedFlag: afterSetting
    };
    
  } catch (error) {
    console.error('❌ Flag check failed:', error);
    return { error: error.message };
  }
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).analyzeTestFailure = analyzeTestFailure;
  (window as any).checkStoryletFlags = checkStoryletFlags;
  
  console.log('🔍 Test Result Analyzer loaded');
  console.log('   analyzeTestFailure() - Identify which test is failing');
  console.log('   checkStoryletFlags() - Check storylet flag system');
}