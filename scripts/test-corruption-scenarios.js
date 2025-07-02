// /Users/montysharma/v11m2/scripts/test-corruption-scenarios.js
// Test various corruption scenarios and recovery mechanisms

(function() {
  'use strict';
  
  console.log('🚨 Starting Corruption Handling Tests...');
  
  const { saveManager } = window;
  const { useCoreGameStore, useNarrativeStore, useSocialStore } = window;
  
  if (!saveManager) {
    console.error('❌ SaveManager not available');
    return;
  }
  
  let testResults = [];
  
  function logResult(testName, passed, details = '') {
    const result = { testName, passed, details, timestamp: Date.now() };
    testResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${passed ? 'PASS' : 'FAIL'}${details ? ` - ${details}` : ''}`);
  }
  
  // Test 1: Malformed JSON
  async function testMalformedJSON() {
    console.log('\n📝 Test 1: Malformed JSON Handling');
    
    try {
      // Create valid save first
      await saveManager.saveGame();
      
      // Corrupt with malformed JSON
      localStorage.setItem('v11m2-unified-save', 'compressed:{invalid json}');
      
      // Should handle gracefully
      const loadResult = await saveManager.loadGame();
      
      logResult('Malformed JSON Handling', !loadResult, 
        'Gracefully rejected malformed JSON');
    } catch (error) {
      logResult('Malformed JSON Handling', false, `Unexpected error: ${error.message}`);
    }
  }
  
  // Test 2: Partial data corruption
  async function testPartialCorruption() {
    console.log('\n🔧 Test 2: Partial Data Corruption');
    
    try {
      // Create test data
      useCoreGameStore.setState({ world: { day: 50 }, player: { level: 10 } });
      await saveManager.saveGame();
      
      // Get save and partially corrupt it
      const originalSave = localStorage.getItem('v11m2-unified-save');
      const corrupted = originalSave.slice(0, -50) + 'CORRUPTED_END';
      localStorage.setItem('v11m2-unified-save', corrupted);
      
      const loadResult = await saveManager.loadGame();
      
      logResult('Partial Data Corruption', !loadResult,
        'Detected and rejected partially corrupted data');
    } catch (error) {
      logResult('Partial Data Corruption', false, error.message);
    }
  }
  
  // Test 3: Checksum mismatch
  async function testChecksumMismatch() {
    console.log('\n🔐 Test 3: Checksum Mismatch Detection');
    
    try {
      // Create valid save
      useCoreGameStore.setState({ world: { day: 25 } });
      await saveManager.saveGame();
      
      // Get and modify save data without updating checksum
      const saveString = localStorage.getItem('v11m2-unified-save');
      const decompressed = saveString.replace('compressed:', '');
      const saveData = JSON.parse(decompressed);
      
      // Change data but keep old checksum
      saveData.data.core.world.day = 999;
      const modifiedSave = `compressed:${JSON.stringify(saveData)}`;
      localStorage.setItem('v11m2-unified-save', modifiedSave);
      
      const loadResult = await saveManager.loadGame();
      
      logResult('Checksum Mismatch Detection', !loadResult,
        'Detected checksum mismatch and rejected save');
    } catch (error) {
      logResult('Checksum Mismatch Detection', false, error.message);
    }
  }
  
  // Test 4: Missing required fields
  async function testMissingFields() {
    console.log('\n📋 Test 4: Missing Required Fields');
    
    try {
      // Create save with missing fields
      const incompleteSave = {
        timestamp: Date.now()
        // Missing version, data, etc.
      };
      
      const saveString = `compressed:${JSON.stringify(incompleteSave)}`;
      localStorage.setItem('v11m2-unified-save', saveString);
      
      const loadResult = await saveManager.loadGame();
      
      logResult('Missing Required Fields', !loadResult,
        'Rejected save with missing required fields');
    } catch (error) {
      logResult('Missing Required Fields', false, error.message);
    }
  }
  
  // Test 5: Backup recovery
  async function testBackupRecovery() {
    console.log('\n🔄 Test 5: Backup Recovery Mechanism');
    
    try {
      // Create initial save
      useCoreGameStore.setState({ world: { day: 15 } });
      await saveManager.saveGame();
      
      // Create another save (this creates backup)
      useCoreGameStore.setState({ world: { day: 30 } });
      await saveManager.saveGame();
      
      // Corrupt main save
      localStorage.setItem('v11m2-unified-save', 'corrupted');
      
      // Should recover from backup
      const loadResult = await saveManager.loadGame();
      
      if (loadResult) {
        const day = useCoreGameStore.getState().world?.day;
        logResult('Backup Recovery Mechanism', day === 15,
          `Recovered day: ${day} (expected previous backup)`);
      } else {
        logResult('Backup Recovery Mechanism', false, 'Failed to recover from backup');
      }
    } catch (error) {
      logResult('Backup Recovery Mechanism', false, error.message);
    }
  }
  
  // Test 6: Storage quota exceeded
  async function testStorageQuota() {
    console.log('\n💾 Test 6: Storage Quota Exceeded');
    
    try {
      // Mock localStorage to simulate quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key === 'v11m2-unified-save') {
          const error = new DOMException('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        return originalSetItem.call(this, key, value);
      };
      
      const saveResult = await saveManager.saveGame();
      
      // Restore original function
      localStorage.setItem = originalSetItem;
      
      logResult('Storage Quota Exceeded', !saveResult,
        'Gracefully handled storage quota exceeded');
    } catch (error) {
      localStorage.setItem = originalSetItem;
      logResult('Storage Quota Exceeded', false, error.message);
    }
  }
  
  // Test 7: Decompression failure
  async function testDecompressionFailure() {
    console.log('\n🗜️ Test 7: Decompression Failure');
    
    try {
      // Create invalid compressed data
      localStorage.setItem('v11m2-unified-save', 'invalid_compressed_data');
      
      const loadResult = await saveManager.loadGame();
      
      logResult('Decompression Failure', !loadResult,
        'Handled decompression failure gracefully');
    } catch (error) {
      logResult('Decompression Failure', false, error.message);
    }
  }
  
  // Test 8: Version migration
  async function testVersionMigration() {
    console.log('\n🔄 Test 8: Version Migration');
    
    try {
      // Create old version save
      const oldVersionSave = {
        version: 0, // Old version
        timestamp: Date.now(),
        data: {
          core: { world: { day: 5 } },
          narrative: { storylets: { completed: [] } },
          social: { npcs: { relationships: {} } }
        }
      };
      
      const saveString = `compressed:${JSON.stringify(oldVersionSave)}`;
      localStorage.setItem('v11m2-unified-save', saveString);
      
      const loadResult = await saveManager.loadGame();
      
      if (loadResult) {
        // Check that migration occurred
        const metadata = saveManager.getSaveMetadata();
        logResult('Version Migration', metadata && metadata.gameDay === 5,
          'Successfully migrated old version save');
      } else {
        logResult('Version Migration', false, 'Failed to migrate old version');
      }
    } catch (error) {
      logResult('Version Migration', false, error.message);
    }
  }
  
  // Test 9: Import corruption resistance
  async function testImportCorruption() {
    console.log('\n📥 Test 9: Import Corruption Resistance');
    
    try {
      // Test various invalid import formats
      const invalidFormats = [
        'not_compressed_data',
        'compressed:invalid_json',
        '',
        null,
        undefined
      ];
      
      let allRejected = true;
      
      for (const invalidFormat of invalidFormats) {
        try {
          const result = await saveManager.importSave(invalidFormat);
          if (result) {
            allRejected = false;
            break;
          }
        } catch (error) {
          // Expected to throw/reject
        }
      }
      
      logResult('Import Corruption Resistance', allRejected,
        'Rejected all invalid import formats');
    } catch (error) {
      logResult('Import Corruption Resistance', false, error.message);
    }
  }
  
  // Test 10: Recovery after corruption
  async function testRecoveryAfterCorruption() {
    console.log('\n🩹 Test 10: Recovery After Corruption');
    
    try {
      // Corrupt save
      localStorage.setItem('v11m2-unified-save', 'corrupted');
      
      // Attempt load (should fail)
      await saveManager.loadGame();
      
      // Clear corruption and create new save
      saveManager.clearSave();
      useCoreGameStore.setState({ world: { day: 1 } });
      const saveResult = await saveManager.saveGame();
      
      // Verify new save works
      const loadResult = await saveManager.loadGame();
      
      logResult('Recovery After Corruption', saveResult && loadResult,
        'Successfully recovered with new save after corruption');
    } catch (error) {
      logResult('Recovery After Corruption', false, error.message);
    }
  }
  
  // Run all corruption tests
  async function runCorruptionTests() {
    console.log('🚨 Running Corruption Handling Test Suite...\n');
    
    // Save current state for restoration
    const originalState = {
      core: useCoreGameStore.getState(),
      narrative: useNarrativeStore.getState(),
      social: useSocialStore.getState()
    };
    
    try {
      await testMalformedJSON();
      await testPartialCorruption();
      await testChecksumMismatch();
      await testMissingFields();
      await testBackupRecovery();
      await testStorageQuota();
      await testDecompressionFailure();
      await testVersionMigration();
      await testImportCorruption();
      await testRecoveryAfterCorruption();
      
      // Summary
      console.log('\n📊 Corruption Test Results:');
      console.log('=' .repeat(50));
      
      const passed = testResults.filter(r => r.passed).length;
      const total = testResults.length;
      const percentage = ((passed / total) * 100).toFixed(1);
      
      console.log(`Tests Passed: ${passed}/${total} (${percentage}%)`);
      
      if (passed === total) {
        console.log('🎉 All corruption tests passed! System is robust.');
      } else {
        console.log('⚠️ Some corruption tests failed.');
        testResults.filter(r => !r.passed).forEach(result => {
          console.log(`   ❌ ${result.testName}: ${result.details}`);
        });
      }
      
    } finally {
      // Restore original state
      try {
        useCoreGameStore.setState(originalState.core);
        useNarrativeStore.setState(originalState.narrative);
        useSocialStore.setState(originalState.social);
        console.log('🔄 Original state restored');
      } catch (error) {
        console.log('⚠️ Could not restore original state:', error.message);
      }
    }
    
    return { passed: testResults.filter(r => r.passed).length, total: testResults.length, results: testResults };
  }
  
  // Export for manual execution
  window.runCorruptionTests = runCorruptionTests;
  
  // Auto-run
  runCorruptionTests();
  
})();