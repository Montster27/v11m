// /Users/montysharma/V11M2/src/test/characterFlow/characterCreationTests.ts
// Comprehensive test suite for consolidated character creation flow

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';
import { 
  createCharacterAtomically, 
  validateCharacterCreationData,
  resetAllGameState,
  getInitialConcerns,
  getInitialDevelopmentStats,
  getInitialSkills
} from '../../utils/characterFlowIntegration';
import {
  captureFlowState,
  validateCharacterCreationState,
  createMockCharacterData,
  measurePerformance,
  type FlowTestResult
} from './flowTestUtils';

/**
 * Test character data validation
 */
export const testCharacterDataValidation = (): FlowTestResult => {
  console.log('🧪 Testing Character Data Validation...');
  
  const testCases = [
    {
      name: 'Valid character',
      data: createMockCharacterData(),
      shouldPass: true
    },
    {
      name: 'Empty name',
      data: createMockCharacterData({ name: '' }),
      shouldPass: false
    },
    {
      name: 'Invalid background',
      data: createMockCharacterData({ background: 'invalid' }),
      shouldPass: false
    },
    {
      name: 'Excessive domain adjustments',
      data: createMockCharacterData({
        domainAdjustments: {
          intellectualCompetence: 20,
          physicalCompetence: 20,
          emotionalIntelligence: 20
        }
      }),
      shouldPass: false
    }
  ];
  
  const results = testCases.map(test => {
    const validation = validateCharacterCreationData(test.data);
    const passed = validation.valid === test.shouldPass;
    return {
      testCase: test.name,
      passed,
      errors: validation.errors
    };
  });
  
  const allPassed = results.every(r => r.passed);
  
  return {
    testName: 'Character Data Validation',
    success: allPassed,
    duration: 0,
    details: { results }
  };
};

/**
 * Test atomic character creation
 */
export const testAtomicCharacterCreation = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Atomic Character Creation...');
  
  const startTime = performance.now();
  
  try {
    // Reset to clean state
    resetAllGameState();
    const beforeState = captureFlowState();
    
    // Create character
    const testData = {
      name: 'Atomic Test Character',
      background: 'artist',
      attributes: { creativity: 85, empathy: 70 },
      domainAdjustments: { intellectualCompetence: -5, physicalCompetence: -5 }
    };
    
    createCharacterAtomically(testData);
    
    const afterState = captureFlowState();
    const validation = validateCharacterCreationState(afterState);
    
    // Verify all stores were updated atomically
    const characterCreated = afterState.core.character.name === testData.name;
    const backgroundSet = afterState.core.character.background === testData.background;
    const concernsSet = Object.keys(afterState.narrative.concerns.current).length > 0;
    // Check flag using safe access method
    let flagSet = false;
    try {
      if (afterState.narrative.flags && afterState.narrative.flags.storylet) {
        if (afterState.narrative.flags.storylet instanceof Map) {
          flagSet = afterState.narrative.flags.storylet.get('character_created') === true;
        } else if (typeof afterState.narrative.flags.storylet === 'object') {
          flagSet = afterState.narrative.flags.storylet['character_created'] === true;
        }
      }
    } catch (error) {
      console.warn('Could not check character_created flag:', error);
    }
    const skillsInitialized = afterState.core.skills.totalExperience === 0;
    
    const success = validation.passed && 
                   characterCreated && 
                   backgroundSet && 
                   concernsSet && 
                   flagSet && 
                   skillsInitialized;
    
    return {
      testName: 'Atomic Character Creation',
      success,
      duration: performance.now() - startTime,
      details: {
        validation,
        characterCreated,
        backgroundSet,
        concernsSet,
        flagSet,
        skillsInitialized
      }
    };
    
  } catch (error) {
    return {
      testName: 'Atomic Character Creation',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test background-specific initialization
 */
export const testBackgroundInitialization = (): FlowTestResult => {
  console.log('🧪 Testing Background-Specific Initialization...');
  
  const backgrounds = ['scholar', 'athlete', 'artist', 'social'];
  const results: any[] = [];
  
  backgrounds.forEach(background => {
    const concerns = getInitialConcerns(background);
    const stats = getInitialDevelopmentStats(background);
    const skills = getInitialSkills(background);
    
    results.push({
      background,
      hasConcerns: Object.keys(concerns).length > 0,
      hasStats: Object.keys(stats).length > 0,
      hasSkills: Object.keys(skills).length > 0,
      concernsValid: Object.values(concerns).every(v => typeof v === 'number' && v >= 0 && v <= 1),
      statsValid: Object.values(stats).every(v => typeof v === 'number' && v >= 0),
      skillsValid: Object.values(skills).every(v => typeof v === 'number' && v >= 0)
    });
  });
  
  const allPassed = results.every(r => 
    r.hasConcerns && r.hasStats && r.hasSkills &&
    r.concernsValid && r.statsValid && r.skillsValid
  );
  
  return {
    testName: 'Background Initialization',
    success: allPassed,
    duration: 0,
    details: { results }
  };
};

/**
 * Test character creation UI flow simulation
 */
export const testCharacterCreationUIFlow = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Character Creation UI Flow...');
  
  const startTime = performance.now();
  
  try {
    resetAllGameState();
    
    // Simulate step-by-step creation
    const steps = [
      { name: 'Name Entry', duration: 0 },
      { name: 'Background Selection', duration: 0 },
      { name: 'Attribute Setting', duration: 0 },
      { name: 'Domain Adjustments', duration: 0 },
      { name: 'Final Creation', duration: 0 }
    ];
    
    // Step 1: Name
    const nameStart = performance.now();
    const characterName = 'UI Test Character';
    steps[0].duration = performance.now() - nameStart;
    
    // Step 2: Background
    const bgStart = performance.now();
    const background = 'scholar';
    steps[1].duration = performance.now() - bgStart;
    
    // Step 3: Attributes
    const attrStart = performance.now();
    const attributes = {
      intelligence: 80,
      creativity: 60,
      charisma: 50,
      strength: 40,
      focus: 70,
      empathy: 65
    };
    steps[2].duration = performance.now() - attrStart;
    
    // Step 4: Domain Adjustments
    const domainStart = performance.now();
    const domainAdjustments = {
      intellectualCompetence: 10,
      physicalCompetence: -10,
      emotionalIntelligence: 0,
      socialCompetence: 0,
      personalAutonomy: 0,
      identityClarity: 0,
      lifePurpose: 0
    };
    steps[3].duration = performance.now() - domainStart;
    
    // Step 5: Create
    const createStart = performance.now();
    createCharacterAtomically({
      name: characterName,
      background,
      attributes,
      domainAdjustments
    });
    steps[4].duration = performance.now() - createStart;
    
    const finalState = captureFlowState();
    const validation = validateCharacterCreationState(finalState);
    
    const totalDuration = performance.now() - startTime;
    
    return {
      testName: 'Character Creation UI Flow',
      success: validation.passed,
      duration: totalDuration,
      details: {
        steps,
        validation,
        totalDuration,
        averageStepTime: totalDuration / steps.length
      }
    };
    
  } catch (error) {
    return {
      testName: 'Character Creation UI Flow',
      success: false,
      duration: performance.now() - startTime,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Test character creation performance
 */
export const testCharacterCreationPerformance = async (): Promise<FlowTestResult> => {
  console.log('🧪 Testing Character Creation Performance...');
  
  const iterations = 10;
  const times: number[] = [];
  
  try {
    for (let i = 0; i < iterations; i++) {
      resetAllGameState();
      
      const result = await measurePerformance(
        () => {
          createCharacterAtomically({
            name: `Perf Test ${i}`,
            background: ['scholar', 'athlete', 'artist', 'social'][i % 4],
            attributes: {
              intelligence: 50 + (i * 5) % 50,
              creativity: 50 + (i * 3) % 50,
              charisma: 50 + (i * 7) % 50,
              strength: 50 + (i * 2) % 50,
              focus: 50 + (i * 4) % 50,
              empathy: 50 + (i * 6) % 50
            },
            domainAdjustments: {}
          });
        },
        `Character Creation ${i + 1}`
      );
      
      times.push(result.duration);
    }
    
    const avgTime = times.reduce((a, b) => a + b) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    // Performance target: < 50ms average, < 100ms max
    const performanceAcceptable = avgTime < 50 && maxTime < 100;
    
    return {
      testName: 'Character Creation Performance',
      success: performanceAcceptable,
      duration: avgTime,
      details: {
        iterations,
        averageTime: avgTime,
        maxTime,
        minTime,
        times,
        performanceAcceptable
      }
    };
    
  } catch (error) {
    return {
      testName: 'Character Creation Performance',
      success: false,
      duration: 0,
      details: { error: error.message },
      errors: [error.message]
    };
  }
};

/**
 * Run all character creation tests
 */
export const runAllCharacterCreationTests = async (): Promise<FlowTestResult[]> => {
  console.log('🧪 Running complete Character Creation test suite...');
  
  const tests = [
    testCharacterDataValidation,
    testBackgroundInitialization,
    async () => testAtomicCharacterCreation(),
    async () => testCharacterCreationUIFlow(),
    async () => testCharacterCreationPerformance()
  ];
  
  const results: FlowTestResult[] = [];
  
  for (const test of tests) {
    try {
      const result = await test();
      results.push(result);
      console.log(`${result.success ? '✅' : '❌'} ${result.testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
      
      if (!result.success && result.errors) {
        console.error(`   Errors: ${result.errors.join(', ')}`);
      }
      
    } catch (error) {
      results.push({
        testName: 'Unknown Test',
        success: false,
        duration: 0,
        details: { error: error.message },
        errors: [error.message]
      });
    }
  }
  
  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n🧪 Character Creation test suite complete: ${passedTests}/${totalTests} tests passed`);
  
  return results;
};

// Browser console access for development
if (typeof window !== 'undefined') {
  (window as any).testCharacterDataValidation = testCharacterDataValidation;
  (window as any).testBackgroundInitialization = testBackgroundInitialization;
  (window as any).testAtomicCharacterCreation = testAtomicCharacterCreation;
  (window as any).testCharacterCreationUIFlow = testCharacterCreationUIFlow;
  (window as any).testCharacterCreationPerformance = testCharacterCreationPerformance;
  (window as any).runAllCharacterCreationTests = runAllCharacterCreationTests;
  
  console.log('🧪 Character Creation Test Suite loaded');
  console.log('   testCharacterDataValidation() - Test data validation');
  console.log('   testBackgroundInitialization() - Test background configs');
  console.log('   testAtomicCharacterCreation() - Test atomic creation');
  console.log('   testCharacterCreationUIFlow() - Test UI flow simulation');
  console.log('   testCharacterCreationPerformance() - Test performance');
  console.log('   runAllCharacterCreationTests() - Run complete test suite');
}