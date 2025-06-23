// /Users/montysharma/V11M2/test/consistency/crossStoreTests.ts
// Cross-Store Consistency Test Suite - Validates data integrity across consolidated stores

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../src/stores/v2';

export interface ConsistencyTestResult {
  success: boolean;
  errors: string[];
  testName: string;
  duration: number;
  validations: {
    [key: string]: boolean;
  };
}

export interface CrossStoreTestSuite {
  characterNarrativeConsistency: boolean;
  narrativeSocialReferences: boolean;
  socialCoreIntegration: boolean;
  errors: string[];
}

// Validation function for Character-Narrative consistency
export const validateCharacterConcernReferences = (characterData: any, concerns: any): boolean => {
  console.log('🔍 Validating Character-Narrative consistency...');
  
  try {
    // Check if character exists when concerns reference character data
    if (!characterData || !characterData.name) {
      console.log('❌ Character data missing when concerns exist');
      return false;
    }
    
    // Check if concerns are properly structured
    if (!concerns || !concerns.current) {
      console.log('❌ Concerns data missing or improperly structured');
      return false;
    }
    
    // Validate that character background influences concerns
    const { background } = characterData;
    const { current: currentConcerns } = concerns;
    
    // Noble background should have family concerns
    if (background === 'noble' && !('family' in currentConcerns)) {
      console.log('⚠️ Noble character missing expected family concerns');
      // This is a warning, not a failure - concerns may be set later
    }
    
    // Validate concern values are in valid range [0, 1]
    for (const [concernType, value] of Object.entries(currentConcerns)) {
      if (typeof value !== 'number' || value < 0 || value > 1) {
        console.log(`❌ Invalid concern value for ${concernType}: ${value}`);
        return false;
      }
    }
    
    console.log('✅ Character-Narrative consistency validated');
    return true;
    
  } catch (error) {
    console.error('❌ Character-Narrative validation error:', error);
    return false;
  }
};

// Validation function for Narrative-Social cross-references
export const validateStoryletNPCReferences = (storylets: any, npcs: any): boolean => {
  console.log('🔍 Validating Narrative-Social cross-references...');
  
  try {
    // Check if storylets exist
    if (!storylets || !Array.isArray(storylets.active)) {
      console.log('❌ Storylets data missing or invalid');
      return false;
    }
    
    // Check if NPCs exist
    if (!npcs || !npcs.relationships) {
      console.log('❌ NPCs data missing or invalid');
      return false;
    }
    
    // Validate each active storylet's NPC references
    for (const storylet of storylets.active) {
      if (typeof storylet === 'string') {
        // Simple storylet ID - no direct NPC reference to validate
        continue;
      }
      
      if (storylet && typeof storylet === 'object' && storylet.npcRef) {
        const npcId = storylet.npcRef;
        
        // Check if referenced NPC exists in social store
        if (!(npcId in npcs.relationships)) {
          console.log(`❌ Storylet ${storylet.id} references non-existent NPC: ${npcId}`);
          return false;
        }
        
        // Check if NPC relationship is properly initialized
        const relationship = npcs.relationships[npcId];
        if (typeof relationship !== 'number') {
          console.log(`❌ NPC ${npcId} has invalid relationship value: ${relationship}`);
          return false;
        }
        
        console.log(`✅ Storylet ${storylet.id} -> NPC ${npcId} reference validated`);
      }
    }
    
    console.log('✅ Narrative-Social cross-references validated');
    return true;
    
  } catch (error) {
    console.error('❌ Narrative-Social validation error:', error);
    return false;
  }
};

// Validation function for Social-Core integration
export const validateSocialCoreIntegration = (socialData: any, coreData: any): boolean => {
  console.log('🔍 Validating Social-Core integration...');
  
  try {
    // Check if character exists in core store when social interactions occur
    if (!coreData || !coreData.character || !coreData.character.name) {
      console.log('❌ Core character data missing when social interactions exist');
      return false;
    }
    
    // Check if social data exists
    if (!socialData || !socialData.npcs) {
      console.log('❌ Social data missing or invalid');
      return false;
    }
    
    // Validate that character level influences social interactions
    const characterLevel = coreData.player?.level || 1;
    const relationshipCount = Object.keys(socialData.npcs.relationships || {}).length;
    
    // High-level characters should potentially have more relationships
    if (characterLevel >= 10 && relationshipCount === 0) {
      console.log('⚠️ High-level character has no social relationships');
      // Warning only - relationships may develop over time
    }
    
    // Validate clue discovery aligns with character capabilities
    const discoveredClues = socialData.clues?.discovered || [];
    const characterSkills = coreData.skills?.coreCompetencies || {};
    
    // Characters with high investigation skills should be able to discover clues
    if (characterSkills.investigation >= 50 && discoveredClues.length === 0) {
      console.log('⚠️ High investigation skill character has no discovered clues');
      // Warning only - clues may be discovered later
    }
    
    console.log('✅ Social-Core integration validated');
    return true;
    
  } catch (error) {
    console.error('❌ Social-Core validation error:', error);
    return false;
  }
};

// Test 1: Character-Narrative Consistency
export const testCharacterNarrativeConsistency = async (): Promise<ConsistencyTestResult> => {
  console.log('🧪 Testing: Character-Narrative Consistency');
  console.log('-'.repeat(50));
  
  const result: ConsistencyTestResult = {
    success: false,
    errors: [],
    testName: 'Character-Narrative Consistency',
    duration: 0,
    validations: {}
  };
  
  const startTime = performance.now();
  
  try {
    // Reset stores to ensure clean test
    console.log('🔄 Resetting stores for clean test...');
    useCoreGameStore.getState().resetGame();
    useNarrativeStore.getState().resetNarrative();
    
    // Character concerns should reference character data
    console.log('📝 Setting up character data...');
    const coreStore = useCoreGameStore.getState();
    coreStore.updateCharacter({ 
      name: 'Alice', 
      background: 'noble',
      attributes: { charm: 7, intelligence: 6 }
    });
    
    console.log('📝 Setting up narrative concerns...');
    const narrativeStore = useNarrativeStore.getState();
    narrativeStore.updateConcerns({ 
      family: 0.8, 
      social: 0.3, 
      academic: 0.5 
    });
    
    // Validate references remain consistent
    console.log('🔍 Performing consistency validation...');
    const characterData = useCoreGameStore.getState().character;
    const concerns = useNarrativeStore.getState().concerns;
    
    console.log('📊 Character data:', characterData);
    console.log('📊 Concerns data:', concerns);
    
    const isConsistent = validateCharacterConcernReferences(characterData, concerns);
    result.validations.characterConcernReferences = isConsistent;
    
    if (isConsistent) {
      result.success = true;
      console.log('✅ Character-Narrative consistency test PASSED');
    } else {
      result.errors.push('Character-Narrative consistency validation failed');
      console.log('❌ Character-Narrative consistency test FAILED');
    }
    
  } catch (error) {
    result.errors.push(`Test failed: ${error}`);
    console.error('❌ Character-Narrative consistency test error:', error);
  }
  
  result.duration = performance.now() - startTime;
  return result;
};

// Test 2: Narrative-Social Cross-References
export const testNarrativeSocialReferences = async (): Promise<ConsistencyTestResult> => {
  console.log('🧪 Testing: Narrative-Social Cross-References');
  console.log('-'.repeat(50));
  
  const result: ConsistencyTestResult = {
    success: false,
    errors: [],
    testName: 'Narrative-Social Cross-References',
    duration: 0,
    validations: {}
  };
  
  const startTime = performance.now();
  
  try {
    // Reset stores to ensure clean test
    console.log('🔄 Resetting stores for clean test...');
    useNarrativeStore.getState().resetNarrative();
    useSocialStore.getState().resetSocial();
    
    // Storylets may reference NPCs
    console.log('📝 Setting up NPC relationships...');
    const socialStore = useSocialStore.getState();
    socialStore.updateRelationship('lord_pemberton', 15); // Adds to 0, so result is 15
    socialStore.updateRelationship('lady_victoria', 10);
    
    console.log('📝 Setting up storylets with NPC references...');
    const narrativeStore = useNarrativeStore.getState();
    // Note: For now we'll test with string IDs since our current implementation uses string arrays
    // In a real implementation, we might have objects with npcRef properties
    narrativeStore.addActiveStorylet('meet_lord_pemberton');
    narrativeStore.addActiveStorylet('talk_to_lady_victoria');
    
    // Validate cross-references work
    console.log('🔍 Performing cross-reference validation...');
    const storylets = useNarrativeStore.getState().storylets;
    const npcs = useSocialStore.getState().npcs;
    
    console.log('📊 Storylets data:', storylets);
    console.log('📊 NPCs data:', npcs);
    
    // Custom validation for string-based storylet system
    let referencesValid = true;
    const errors = [];
    
    // Check if storylets that reference NPCs have corresponding NPC data
    for (const storyletId of storylets.active) {
      if (storyletId.includes('lord_pemberton') && !npcs.relationships['lord_pemberton']) {
        errors.push(`Storylet ${storyletId} references lord_pemberton but NPC doesn't exist`);
        referencesValid = false;
      }
      if (storyletId.includes('lady_victoria') && !npcs.relationships['lady_victoria']) {
        errors.push(`Storylet ${storyletId} references lady_victoria but NPC doesn't exist`);
        referencesValid = false;
      }
    }
    
    // Also validate using the original function for structure validation
    const structureValid = validateStoryletNPCReferences(storylets, npcs);
    
    result.validations.storyletNPCReferences = referencesValid && structureValid;
    
    if (referencesValid && structureValid) {
      result.success = true;
      console.log('✅ Narrative-Social cross-references test PASSED');
    } else {
      result.errors.push(...errors);
      if (!structureValid) {
        result.errors.push('Storylet-NPC structure validation failed');
      }
      console.log('❌ Narrative-Social cross-references test FAILED');
    }
    
  } catch (error) {
    result.errors.push(`Test failed: ${error}`);
    console.error('❌ Narrative-Social cross-references test error:', error);
  }
  
  result.duration = performance.now() - startTime;
  return result;
};

// Test 3: Social-Core Integration
export const testSocialCoreIntegration = async (): Promise<ConsistencyTestResult> => {
  console.log('🧪 Testing: Social-Core Integration');
  console.log('-'.repeat(50));
  
  const result: ConsistencyTestResult = {
    success: false,
    errors: [],
    testName: 'Social-Core Integration',
    duration: 0,
    validations: {}
  };
  
  const startTime = performance.now();
  
  try {
    // Reset stores to ensure clean test
    console.log('🔄 Resetting stores for clean test...');
    useCoreGameStore.getState().resetGame();
    useSocialStore.getState().resetSocial();
    
    // Set up core character data
    console.log('📝 Setting up core character data...');
    const coreStore = useCoreGameStore.getState();
    coreStore.updateCharacter({ 
      name: 'Bob', 
      background: 'commoner',
      attributes: { charm: 5, intelligence: 8 }
    });
    coreStore.updatePlayer({ 
      level: 12, 
      experience: 3500 
    });
    coreStore.updateSkills({
      coreCompetencies: { 
        investigation: 60, 
        socializing: 40,
        academics: 75
      }
    });
    
    // Set up social interactions
    console.log('📝 Setting up social interactions...');
    const socialStore = useSocialStore.getState();
    socialStore.updateRelationship('scholar_thompson', 20);
    socialStore.updateRelationship('merchant_alice', 8);
    socialStore.discoverClue({
      id: 'ancient_text',
      name: 'Ancient Academic Text',
      description: 'A rare manuscript with hidden knowledge',
      discoveryMethod: 'investigation',
      importance: 'high'
    });
    
    // Validate integration
    console.log('🔍 Performing integration validation...');
    const coreData = useCoreGameStore.getState();
    const socialData = useSocialStore.getState();
    
    console.log('📊 Core data:', {
      character: coreData.character,
      player: coreData.player,
      skills: coreData.skills
    });
    console.log('📊 Social data:', {
      relationships: socialData.npcs.relationships,
      clues: socialData.clues.discovered
    });
    
    const isIntegrated = validateSocialCoreIntegration(socialData, coreData);
    result.validations.socialCoreIntegration = isIntegrated;
    
    if (isIntegrated) {
      result.success = true;
      console.log('✅ Social-Core integration test PASSED');
    } else {
      result.errors.push('Social-Core integration validation failed');
      console.log('❌ Social-Core integration test FAILED');
    }
    
  } catch (error) {
    result.errors.push(`Test failed: ${error}`);
    console.error('❌ Social-Core integration test error:', error);
  }
  
  result.duration = performance.now() - startTime;
  return result;
};

// Main test suite runner
export const runCrossStoreConsistencyTestSuite = async () => {
  console.log('🧪 Running Cross-Store Consistency Test Suite...');
  console.log('='.repeat(60));
  console.log('🎯 Goal: Validate data integrity across consolidated stores');
  console.log('🔧 Architecture: Test character/narrative/social cross-references');
  console.log('='.repeat(60));
  
  const suiteResults: CrossStoreTestSuite = {
    characterNarrativeConsistency: false,
    narrativeSocialReferences: false,
    socialCoreIntegration: false,
    errors: []
  };
  
  try {
    // Test 1: Character-Narrative Consistency
    console.log('\n📝 TEST 1: Character-Narrative Consistency');
    console.log('='.repeat(50));
    
    const test1Result = await testCharacterNarrativeConsistency();
    suiteResults.characterNarrativeConsistency = test1Result.success;
    
    if (!test1Result.success) {
      suiteResults.errors.push(...test1Result.errors);
    }
    
    console.log(`✨ Result: ${test1Result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`⏱️ Duration: ${test1Result.duration.toFixed(2)}ms`);
    
    // Test 2: Narrative-Social Cross-References
    console.log('\n📝 TEST 2: Narrative-Social Cross-References');
    console.log('='.repeat(50));
    
    const test2Result = await testNarrativeSocialReferences();
    suiteResults.narrativeSocialReferences = test2Result.success;
    
    if (!test2Result.success) {
      suiteResults.errors.push(...test2Result.errors);
    }
    
    console.log(`✨ Result: ${test2Result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`⏱️ Duration: ${test2Result.duration.toFixed(2)}ms`);
    
    // Test 3: Social-Core Integration
    console.log('\n📝 TEST 3: Social-Core Integration');
    console.log('='.repeat(50));
    
    const test3Result = await testSocialCoreIntegration();
    suiteResults.socialCoreIntegration = test3Result.success;
    
    if (!test3Result.success) {
      suiteResults.errors.push(...test3Result.errors);
    }
    
    console.log(`✨ Result: ${test3Result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`⏱️ Duration: ${test3Result.duration.toFixed(2)}ms`);
    
  } catch (error) {
    suiteResults.errors.push(`Test suite error: ${error}`);
    console.error('❌ Test suite crashed:', error);
  }
  
  // Final Results
  const allTestsPassed = suiteResults.characterNarrativeConsistency && 
                        suiteResults.narrativeSocialReferences && 
                        suiteResults.socialCoreIntegration;
  
  console.log('\n🏁 Cross-Store Consistency Test Suite Results');
  console.log('='.repeat(60));
  console.log('📊 Test Results:');
  console.log(`   Character-Narrative Consistency: ${suiteResults.characterNarrativeConsistency ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Narrative-Social Cross-References: ${suiteResults.narrativeSocialReferences ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Social-Core Integration: ${suiteResults.socialCoreIntegration ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log('\n🎯 Data Integrity Status:');
  console.log(`   Character-Concerns Links: ${suiteResults.characterNarrativeConsistency ? '✅ CONSISTENT' : '❌ BROKEN'}`);
  console.log(`   Storylet-NPC References: ${suiteResults.narrativeSocialReferences ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`   Social-Core Alignment: ${suiteResults.socialCoreIntegration ? '✅ ALIGNED' : '❌ MISALIGNED'}`);
  
  if (suiteResults.errors.length > 0) {
    console.log('\n❌ Test Errors:', suiteResults.errors);
  }
  
  console.log('\n🚀 Final Verdict:');
  console.log(`   ${allTestsPassed ? '✅ ALL STORES ARE PROPERLY INTEGRATED' : '❌ STORE INTEGRATION NEEDS WORK'}`);
  
  return {
    success: allTestsPassed,
    results: suiteResults,
    summary: allTestsPassed ? 'All cross-store consistency tests passed' : 'Some consistency tests failed'
  };
};

// Global functions for easy access
if (typeof window !== 'undefined') {
  (window as any).validateCharacterConcernReferences = validateCharacterConcernReferences;
  (window as any).validateStoryletNPCReferences = validateStoryletNPCReferences;
  (window as any).validateSocialCoreIntegration = validateSocialCoreIntegration;
  (window as any).testCharacterNarrativeConsistency = testCharacterNarrativeConsistency;
  (window as any).testNarrativeSocialReferences = testNarrativeSocialReferences;
  (window as any).testSocialCoreIntegration = testSocialCoreIntegration;
  (window as any).runCrossStoreConsistencyTestSuite = runCrossStoreConsistencyTestSuite;
  
  console.log('🧪 Cross-Store Consistency Test Suite loaded');
  console.log('   runCrossStoreConsistencyTestSuite() - Run complete test suite');
  console.log('   testCharacterNarrativeConsistency() - Test character-concerns links');
  console.log('   testNarrativeSocialReferences() - Test storylet-NPC references');
  console.log('   testSocialCoreIntegration() - Test social-core alignment');
}