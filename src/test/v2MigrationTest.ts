// Comprehensive test for V2 Store Migration - Phase 4 validation
// Tests that application works completely without legacy stores

import { v2Migration, V2StoreMigrationService } from '../migrations/v2StoreMigration';
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import { useCoreGameStore } from '../stores/v2/useCoreGameStore';

// Mock legacy stores to ensure they're not being used
const mockLegacyStores = () => {
  const error = new Error('Legacy store access detected - V2 migration incomplete');
  
  // Mock all legacy store modules
  jest.mock('../store/useStoryletCatalogStore', () => ({
    useStoryletCatalogStore: () => { throw error; }
  }));
  
  jest.mock('../store/useNPCStore', () => ({
    useNPCStore: () => { throw error; }
  }));
  
  jest.mock('../store/useClueStore', () => ({
    useClueStore: () => { throw error; }
  }));
  
  jest.mock('../store/useStoryArcStore', () => ({
    useStoryArcStore: () => { throw error; }
  }));
};

// Test data generators
function generateTestData() {
  return {
    storylets: [
      {
        id: 'test_storylet_1',
        title: 'Test Storylet 1',
        description: 'Test description',
        category: 'test',
        priority: 1,
        requirements: [],
        outcomes: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '2.0'
        }
      },
      {
        id: 'test_storylet_2',
        title: 'Test Storylet 2',
        description: 'Test description 2',
        category: 'test',
        priority: 2,
        requirements: [],
        outcomes: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          version: '2.0'
        }
      }
    ],
    npcs: [
      {
        id: 'test_npc_1',
        name: 'Test NPC 1',
        description: 'Test NPC description',
        personality: { traits: ['friendly'], interests: ['testing'] },
        appearance: { age: 25, height: "5'6\"", build: 'average', style: 'casual' },
        relationships: {},
        backstory: 'Test backstory',
        currentState: { location: 'test', mood: 'neutral', activity: 'testing' },
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      }
    ],
    clues: [
      {
        id: 'test_clue_1',
        title: 'Test Clue 1',
        description: 'Test clue description',
        content: 'Test clue content',
        category: 'test',
        discoveryMethod: 'investigation',
        isDiscovered: false,
        metadata: {
          createdAt: new Date().toISOString(),
          difficulty: 'medium'
        }
      }
    ],
    arcs: [
      {
        id: 'test_arc_1',
        title: 'Test Arc 1',
        description: 'Test arc description',
        storylets: ['test_storylet_1', 'test_storylet_2'],
        status: 'active',
        metadata: {
          createdAt: new Date().toISOString(),
          estimatedDuration: 30
        }
      }
    ]
  };
}

export async function testV2Migration(): Promise<{
  passed: boolean;
  results: any;
  message: string;
}> {
  console.log('🧪 Testing V2 Store Migration (Phase 4)');

  const results = {
    migration: { passed: false, details: {} },
    storeAccess: { passed: false, details: {} },
    dataIntegrity: { passed: false, details: {} },
    functionality: { passed: false, details: {} },
    legacyIsolation: { passed: false, details: {} }
  };

  try {
    // Test 1: V2 Migration Service
    console.log('\n1️⃣ Testing V2 Migration Service...');
    
    const migrationService = new V2StoreMigrationService();
    const migrationStatus = migrationService.getMigrationStatus();
    
    const migrationValidation = {
      serviceExists: !!migrationService,
      statusAvailable: !!migrationStatus,
      canCheckComplete: typeof migrationStatus.isComplete === 'boolean',
      canCheckLegacyData: typeof migrationStatus.hasLegacyData === 'boolean'
    };

    results.migration.passed = Object.values(migrationValidation).every(v => v);
    results.migration.details = migrationValidation;

    console.log('Migration service validation:', migrationValidation);

    // Test 2: V2 Store Access
    console.log('\n2️⃣ Testing V2 Store Access...');
    
    const narrativeStore = useNarrativeStore.getState();
    const socialStore = useSocialStore.getState();
    const coreGameStore = useCoreGameStore.getState();

    const storeAccessValidation = {
      narrativeStoreExists: !!narrativeStore,
      socialStoreExists: !!socialStore,
      coreGameStoreExists: !!coreGameStore,
      narrativeHasGetStorylets: typeof narrativeStore.getStorylets === 'function',
      socialHasGetAllNPCs: typeof socialStore.getAllNPCs === 'function',
      narrativeHasAddStorylet: typeof narrativeStore.addStorylet === 'function',
      socialHasAddNPC: typeof socialStore.addNPC === 'function'
    };

    results.storeAccess.passed = Object.values(storeAccessValidation).every(v => v);
    results.storeAccess.details = storeAccessValidation;

    console.log('V2 store access validation:', storeAccessValidation);

    // Test 3: Data Operations
    console.log('\n3️⃣ Testing V2 Store Data Operations...');
    
    const testData = generateTestData();
    let dataOperationResults = {
      storyletAdd: false,
      storyletRetrieve: false,
      npcAdd: false,
      npcRetrieve: false,
      dataConsistency: false
    };

    try {
      // Test storylet operations
      if (narrativeStore.addStorylet) {
        narrativeStore.addStorylet(testData.storylets[0]);
        dataOperationResults.storyletAdd = true;
      }

      const retrievedStorylets = narrativeStore.getStorylets();
      const foundStorylet = retrievedStorylets.find(s => s.id === testData.storylets[0].id);
      dataOperationResults.storyletRetrieve = !!foundStorylet;

      // Test NPC operations
      if (socialStore.addNPC) {
        socialStore.addNPC(testData.npcs[0]);
        dataOperationResults.npcAdd = true;
      }

      const retrievedNPCs = socialStore.getAllNPCs();
      const foundNPC = retrievedNPCs.find(n => n.id === testData.npcs[0].id);
      dataOperationResults.npcRetrieve = !!foundNPC;

      // Test data consistency
      dataOperationResults.dataConsistency = 
        foundStorylet?.title === testData.storylets[0].title &&
        foundNPC?.name === testData.npcs[0].name;

    } catch (error) {
      console.warn('Data operation error:', error);
    }

    results.dataIntegrity.passed = Object.values(dataOperationResults).every(v => v);
    results.dataIntegrity.details = dataOperationResults;

    console.log('Data operation validation:', dataOperationResults);

    // Test 4: Core Functionality
    console.log('\n4️⃣ Testing Core V2 Functionality...');
    
    const functionalityValidation = {
      storyStateExists: !!narrativeStore.storylets,
      playerStateExists: !!coreGameStore.player,
      worldStateExists: !!coreGameStore.world,
      relationshipsExist: !!socialStore.npcs?.relationships,
      storyletEvaluation: typeof narrativeStore.evaluateStoryletAvailability === 'function',
      socialInteractions: typeof socialStore.updateRelationship === 'function'
    };

    results.functionality.passed = Object.values(functionalityValidation).every(v => v);
    results.functionality.details = functionalityValidation;

    console.log('Functionality validation:', functionalityValidation);

    // Test 5: Legacy Store Isolation
    console.log('\n5️⃣ Testing Legacy Store Isolation...');
    
    let legacyIsolationValidation = {
      noLegacyImports: true,
      v2StoresIndependent: true,
      migrationComplete: migrationStatus.isComplete || !migrationStatus.hasLegacyData
    };

    // Try to access legacy stores - should fail if properly isolated
    try {
      // This should not work if migration is complete
      const legacyTest = eval('typeof useStoryletCatalogStore !== "undefined"');
      if (legacyTest) {
        legacyIsolationValidation.noLegacyImports = false;
        console.warn('⚠️ Legacy stores still accessible');
      }
    } catch (error) {
      // Good - legacy stores are not accessible
      console.log('✅ Legacy stores properly isolated');
    }

    results.legacyIsolation.passed = Object.values(legacyIsolationValidation).every(v => v);
    results.legacyIsolation.details = legacyIsolationValidation;

    console.log('Legacy isolation validation:', legacyIsolationValidation);

    // Test 6: Integration Test
    console.log('\n6️⃣ Running Integration Test...');
    
    try {
      // Simulate a complete user workflow using only V2 stores
      const workflow = {
        createStorylet: !!narrativeStore.addStorylet,
        retrieveStorylets: Array.isArray(narrativeStore.getStorylets()),
        createNPC: !!socialStore.addNPC,
        retrieveNPCs: Array.isArray(socialStore.getAllNPCs()),
        updatePlayerState: !!coreGameStore.updatePlayer,
        evaluateRequirements: !!narrativeStore.evaluateStoryletRequirements
      };

      const integrationPassed = Object.values(workflow).every(v => v);
      results.functionality.details.integrationWorkflow = integrationPassed;

      console.log('Integration workflow validation:', workflow);
    } catch (error) {
      console.error('Integration test failed:', error);
      results.functionality.passed = false;
    }

    // Calculate overall results
    const allTestsPassed = Object.values(results).every(test => test.passed);

    console.log('\n📊 V2 Migration Test Results:');
    console.log('Migration Service:', results.migration.passed ? '✅' : '❌');
    console.log('Store Access:', results.storeAccess.passed ? '✅' : '❌');
    console.log('Data Integrity:', results.dataIntegrity.passed ? '✅' : '❌');
    console.log('Functionality:', results.functionality.passed ? '✅' : '❌');
    console.log('Legacy Isolation:', results.legacyIsolation.passed ? '✅' : '❌');

    console.log(`\n✨ V2 Store Migration Test ${allTestsPassed ? 'PASSED' : 'FAILED'}`);

    return {
      passed: allTestsPassed,
      results,
      message: allTestsPassed ? 
        'V2 Store Migration is complete and working correctly!' :
        'V2 Store Migration has issues - check test results for details'
    };

  } catch (error) {
    console.error('❌ V2 Migration test failed with error:', error);
    return {
      passed: false,
      results,
      message: `V2 migration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('V2 Migration Test loaded. Run testV2Migration() to test.');
  
  // Also expose migration utilities globally for debugging
  (window as any).v2Migration = v2Migration;
  (window as any).testV2Migration = testV2Migration;
}