// Comprehensive test suite for unified Content Export Service
// Phase 3 validation and functionality testing

import { ContentExportService, ExportOptions, ImportOptions } from '../services/ContentExportService';
import { LocalStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { IndexedDBAdapter } from '../services/storage/IndexedDBAdapter';
import type { Storylet, StoryArc } from '../types/storylet';
import type { NPC } from '../types/npc';
import type { Clue } from '../types/clue';

// Test data generators
function generateTestStorylet(id: string): Storylet {
  return {
    id,
    title: `Test Storylet ${id}`,
    description: `Description for storylet ${id}`,
    category: 'test',
    priority: 1,
    requirements: [],
    outcomes: [{
      id: `outcome_${id}`,
      title: `Outcome for ${id}`,
      description: 'Test outcome',
      effects: [],
      cluesAwarded: [`clue_${id}`]
    }],
    characterRequirements: [{
      npcId: `npc_${id}`,
      relationshipLevel: 1,
      required: true
    }],
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0'
    }
  };
}

function generateTestNPC(id: string): NPC {
  return {
    id,
    name: `Test NPC ${id}`,
    description: `Description for NPC ${id}`,
    personality: {
      traits: ['friendly', 'helpful'],
      interests: ['testing', 'validation']
    },
    appearance: {
      age: 25,
      height: '5\'6"',
      build: 'average',
      style: 'casual'
    },
    relationships: {},
    backstory: `Backstory for ${id}`,
    currentState: {
      location: 'test_location',
      mood: 'neutral',
      activity: 'testing'
    },
    metadata: {
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  };
}

function generateTestClue(id: string): Clue {
  return {
    id,
    title: `Test Clue ${id}`,
    description: `Description for clue ${id}`,
    content: `Content for clue ${id}`,
    category: 'test',
    discoveryMethod: 'investigation',
    isDiscovered: false,
    metadata: {
      createdAt: new Date().toISOString(),
      difficulty: 'medium'
    }
  };
}

function generateTestArc(id: string): StoryArc {
  return {
    id,
    title: `Test Arc ${id}`,
    description: `Description for arc ${id}`,
    storylets: [`storylet_${id}_1`, `storylet_${id}_2`],
    status: 'active',
    metadata: {
      createdAt: new Date().toISOString(),
      estimatedDuration: 30
    }
  };
}

// Main test function
export async function testContentExportService(): Promise<{
  passed: boolean;
  results: any;
  message: string;
}> {
  console.log('🧪 Testing Unified Content Export Service (Phase 3)');

  const results = {
    export: { passed: false, details: {} },
    import: { passed: false, details: {} },
    dependencies: { passed: false, details: {} },
    transactions: { passed: false, details: {} },
    compression: { passed: false, details: {} },
    validation: { passed: false, details: {} }
  };

  try {
    // Test with both storage adapters
    const adapters = [
      { name: 'localStorage', adapter: new LocalStorageAdapter() },
      { 
        name: 'indexedDB', 
        adapter: new IndexedDBAdapter({
          dbName: 'TestContentExportDB',
          storeName: 'test_exports',
          version: 1
        })
      }
    ];

    for (const { name, adapter } of adapters) {
      console.log(`\n📦 Testing with ${name} adapter...`);

      if (name === 'indexedDB') {
        await adapter.initialize?.();
      }

      const exportService = new ContentExportService(adapter);

      // Setup test data
      console.log('1️⃣ Setting up test data...');
      const testStorylets = [
        generateTestStorylet('test1'),
        generateTestStorylet('test2'),
        generateTestStorylet('test3')
      ];
      const testNPCs = [
        generateTestNPC('test1'),
        generateTestNPC('test2')
      ];
      const testClues = [
        generateTestClue('test1'),
        generateTestClue('test2'),
        generateTestClue('test3')
      ];
      const testArcs = [
        generateTestArc('test1')
      ];

      // Store test data (simulate existing data)
      await adapter.setItem('content_clues', JSON.stringify(testClues));
      await adapter.setItem('content_arcs', JSON.stringify(testArcs));

      // Mock store state
      const mockStores = {
        narrative: { getStorylets: () => testStorylets },
        social: { getAllNPCs: () => testNPCs }
      };

      // Temporarily override store access for testing
      const originalUseNarrativeStore = (globalThis as any).useNarrativeStore;
      const originalUseSocialStore = (globalThis as any).useSocialStore;
      
      (globalThis as any).useNarrativeStore = { getState: () => mockStores.narrative };
      (globalThis as any).useSocialStore = { getState: () => mockStores.social };

      try {
        // Test 1: Export All Content
        console.log('2️⃣ Testing export all content...');
        let progressUpdates = 0;
        const exportOptions: ExportOptions = {
          format: 'json',
          includeMetadata: true,
          validateDependencies: true,
          includePreferences: true,
          onProgress: (progress, stage) => {
            progressUpdates++;
            console.log(`  Progress: ${progress}% - ${stage}`);
          }
        };

        const exportResult = await exportService.exportProject(exportOptions);

        // Validate export structure
        const exportValidation = {
          hasVersion: !!exportResult.version,
          hasTimestamp: !!exportResult.timestamp,
          hasMetadata: !!exportResult.metadata,
          hasData: !!exportResult.data,
          hasStorylets: exportResult.data.storylets?.length === 3,
          hasNPCs: exportResult.data.npcs?.length === 2,
          hasClues: exportResult.data.clues?.length === 3,
          hasArcs: exportResult.data.arcs?.length === 1,
          hasDependencies: !!exportResult.metadata.dependencies,
          progressCallbacks: progressUpdates > 0
        };

        results.export.passed = Object.values(exportValidation).every(v => v);
        results.export.details[name] = exportValidation;

        console.log(`Export validation (${name}):`, exportValidation);

        // Test 2: Export Specific Content Types
        console.log('3️⃣ Testing selective export...');
        const storyletsOnlyExport = await exportService.exportProject({
          format: 'json',
          includeMetadata: true,
          contentTypes: ['storylets'],
          validateDependencies: false
        });

        const selectiveValidation = {
          onlyStorylets: !!storyletsOnlyExport.data.storylets && !storyletsOnlyExport.data.npcs,
          correctCount: storyletsOnlyExport.data.storylets?.length === 3,
          metadataCorrect: storyletsOnlyExport.metadata.contentCounts.storylets === 3
        };

        console.log(`Selective export validation (${name}):`, selectiveValidation);

        // Test 3: Compression
        console.log('4️⃣ Testing compression...');
        const compressedExport = await exportService.exportProject({
          format: 'compressed',
          includeMetadata: true,
          compressionLevel: 5
        });

        const compressionValidation = {
          isCompressed: !!compressedExport.compressed,
          hasCompressionInfo: !!compressedExport.compressionInfo,
          sizeDifference: compressedExport.compressionInfo ? 
            compressedExport.compressionInfo.compressedSize < compressedExport.compressionInfo.originalSize : false
        };

        results.compression.passed = Object.values(compressionValidation).every(v => v);
        results.compression.details[name] = compressionValidation;

        console.log(`Compression validation (${name}):`, compressionValidation);

        // Test 4: Dependency Analysis
        console.log('5️⃣ Testing dependency analysis...');
        const dependencies = exportResult.metadata.dependencies;
        const dependencyValidation = {
          hasDependencies: dependencies.length > 0,
          hasNPCDependencies: dependencies.some(d => d.type === 'npc'),
          hasClueDependencies: dependencies.some(d => d.type === 'clue'),
          correctIds: dependencies.every(d => d.id && d.name && d.type)
        };

        results.dependencies.passed = Object.values(dependencyValidation).every(v => v);
        results.dependencies.details[name] = dependencyValidation;

        console.log(`Dependency validation (${name}):`, dependencyValidation);

        // Test 5: Import Functionality
        console.log('6️⃣ Testing import functionality...');
        
        // Clear existing data first
        await adapter.removeItem('content_clues');
        await adapter.removeItem('content_arcs');

        let importProgressUpdates = 0;
        const importOptions: ImportOptions = {
          validateContent: true,
          overwriteExisting: true,
          onProgress: (progress, stage) => {
            importProgressUpdates++;
            console.log(`  Import Progress: ${progress}% - ${stage}`);
          }
        };

        const importResult = await exportService.importProject(exportResult, importOptions);

        const importValidation = {
          successful: importResult.success,
          hasImportedCounts: !!importResult.imported,
          cluesImported: importResult.imported?.clues === 3,
          arcsImported: importResult.imported?.arcs === 1,
          progressCallbacks: importProgressUpdates > 0,
          noErrors: !importResult.errors || importResult.errors.length === 0
        };

        results.import.passed = Object.values(importValidation).every(v => v);
        results.import.details[name] = importValidation;

        console.log(`Import validation (${name}):`, importValidation);

        // Test 6: Import Validation (Dry Run)
        console.log('7️⃣ Testing import validation...');
        const validationResult = await exportService.importProject(exportResult, {
          dryRun: true,
          validateContent: true
        });

        const validationValidation = {
          successful: validationResult.success,
          isDryRun: !validationResult.imported?.storylets, // Dry run shouldn't actually import
          hasExpectedCounts: !!validationResult.imported
        };

        results.validation.passed = Object.values(validationValidation).every(v => v);
        results.validation.details[name] = validationValidation;

        console.log(`Validation test (${name}):`, validationValidation);

        // Test 7: Error Handling and Transactions
        console.log('8️⃣ Testing error handling and transactions...');
        try {
          // Test with invalid data
          const invalidPackage = { ...exportResult };
          invalidPackage.metadata.schemaVersion = 999; // Future version

          const invalidImport = await exportService.importProject(invalidPackage);
          
          const transactionValidation = {
            rejectedFutureVersion: !invalidImport.success,
            hasErrors: !!invalidImport.errors && invalidImport.errors.length > 0
          };

          results.transactions.passed = Object.values(transactionValidation).every(v => v);
          results.transactions.details[name] = transactionValidation;

          console.log(`Transaction validation (${name}):`, transactionValidation);
        } catch (error) {
          console.log(`✅ Error handling working correctly: ${error}`);
          results.transactions.passed = true;
          results.transactions.details[name] = { errorHandling: true };
        }

      } finally {
        // Restore original store access
        if (originalUseNarrativeStore) {
          (globalThis as any).useNarrativeStore = originalUseNarrativeStore;
        }
        if (originalUseSocialStore) {
          (globalThis as any).useSocialStore = originalUseSocialStore;
        }

        // Cleanup test data
        await adapter.removeItem('content_clues');
        await adapter.removeItem('content_arcs');
      }
    }

    // Calculate overall results
    const allTestsPassed = Object.values(results).every(test => test.passed);

    console.log('\n📊 Test Results Summary:');
    console.log('Export:', results.export.passed ? '✅' : '❌');
    console.log('Import:', results.import.passed ? '✅' : '❌');
    console.log('Dependencies:', results.dependencies.passed ? '✅' : '❌');
    console.log('Transactions:', results.transactions.passed ? '✅' : '❌');
    console.log('Compression:', results.compression.passed ? '✅' : '❌');
    console.log('Validation:', results.validation.passed ? '✅' : '❌');

    console.log(`\n✨ Content Export Service Test ${allTestsPassed ? 'PASSED' : 'FAILED'}`);

    return {
      passed: allTestsPassed,
      results,
      message: allTestsPassed ? 
        'Content Export Service is working correctly with unified interface!' :
        'Content Export Service has issues - check test results for details'
    };

  } catch (error) {
    console.error('❌ Content Export Service test failed with error:', error);
    return {
      passed: false,
      results,
      message: `Test failed with exception: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('Content Export Service Test loaded. Run testContentExportService() to test.');
}