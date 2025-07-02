// /Users/montysharma/v11m2/scripts/test-atomic-saves.js
// Browser-based regression tests for atomic save system

(function() {
  'use strict';
  
  console.log('🧪 Starting Atomic Save System Tests...');
  
  // Import required modules
  const { saveManager } = window;
  const { useCoreGameStore, useNarrativeStore, useSocialStore } = window;
  
  if (!saveManager) {
    console.error('❌ SaveManager not available. Make sure it\'s exposed globally.');
    return;
  }
  
  if (!useCoreGameStore || !useNarrativeStore || !useSocialStore) {
    console.error('❌ V2 stores not available globally. Make sure the app is running in development mode.');
    return;
  }
  
  let testResults = [];
  
  function logResult(testName, passed, details = '') {
    const result = { testName, passed, details, timestamp: Date.now() };
    testResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${passed ? 'PASS' : 'FAIL'}${details ? ` - ${details}` : ''}`);
  }
  
  // Test 1: Atomic Save Operation
  async function testAtomicSave() {
    console.log('\n📝 Test 1: Atomic Save Operation');
    
    try {
      // Set different data in each store
      useCoreGameStore.getState().updateResource('money', 1000);
      useCoreGameStore.setState({ 
        world: { day: 10, gameState: 'playing' },
        player: { level: 5 }
      });
      
      useNarrativeStore.getState().setStoryletFlag('test_save_flag', 'test_value');
      useSocialStore.getState().updateRelationship('test_npc', 15);
      
      // Perform atomic save
      const saveResult = await saveManager.saveGame();
      
      if (saveResult) {
        // Check if save exists
        const hasSave = saveManager.hasSave();
        const metadata = saveManager.getSaveMetadata();
        
        logResult('Atomic Save Operation', hasSave && metadata, 
          `Metadata: Day ${metadata?.gameDay}, Level ${metadata?.playerLevel}`);
      } else {
        logResult('Atomic Save Operation', false, 'Save operation returned false');
      }
    } catch (error) {
      logResult('Atomic Save Operation', false, error.message);
    }
  }
  
  // Test 2: Atomic Load Operation
  async function testAtomicLoad() {
    console.log('\n📊 Test 2: Atomic Load Operation');
    
    try {
      // Save current state first
      const originalDay = useCoreGameStore.getState().world?.day || 1;
      const originalMoney = useCoreGameStore.getState().player?.resources?.money || 0;
      
      await saveManager.saveGame();
      
      // Modify stores
      useCoreGameStore.setState({ 
        world: { day: 999, gameState: 'playing' },
        player: { resources: { money: 999999 } }
      });
      
      // Load from save
      const loadResult = await saveManager.loadGame();
      
      if (loadResult) {
        const loadedDay = useCoreGameStore.getState().world?.day;
        const loadedMoney = useCoreGameStore.getState().player?.resources?.money;
        
        const correctDay = loadedDay === originalDay;
        const correctMoney = loadedMoney === originalMoney;
        
        logResult('Atomic Load Operation', correctDay && correctMoney,
          `Day: ${loadedDay} (expected ${originalDay}), Money: ${loadedMoney} (expected ${originalMoney})`);
      } else {
        logResult('Atomic Load Operation', false, 'Load operation returned false');
      }
    } catch (error) {
      logResult('Atomic Load Operation', false, error.message);
    }
  }
  
  // Test 3: Map Serialization
  async function testMapSerialization() {
    console.log('\n🗺️ Test 3: Map Serialization');
    
    try {
      // Set Maps in narrative store
      useNarrativeStore.getState().setStoryletFlag('map_test_1', 'value1');
      useNarrativeStore.getState().setStoryletFlag('map_test_2', 'value2');
      useNarrativeStore.getState().setConcernFlag('concern_test', 42);
      
      // Save and load
      await saveManager.saveGame();
      
      // Clear flags
      useNarrativeStore.setState({
        flags: {
          storylet: new Map(),
          concerns: new Map(),
          storyArc: new Map(),
          storyletFlag: new Map()
        }
      });
      
      await saveManager.loadGame();
      
      // Check if Maps were restored
      const flag1 = useNarrativeStore.getState().getStoryletFlag('map_test_1');
      const flag2 = useNarrativeStore.getState().getStoryletFlag('map_test_2');
      const concern = useNarrativeStore.getState().getConcernFlag('concern_test');
      
      const mapsRestored = flag1 === 'value1' && flag2 === 'value2' && concern === 42;
      
      logResult('Map Serialization', mapsRestored,
        `Flags: ${flag1}, ${flag2}, Concern: ${concern}`);
    } catch (error) {
      logResult('Map Serialization', false, error.message);
    }
  }
  
  // Test 4: Compression and Size
  async function testCompressionAndSize() {
    console.log('\n🗜️ Test 4: Compression and Size');
    
    try {
      // Create substantial game state
      for (let i = 0; i < 10; i++) {
        useNarrativeStore.getState().setStoryletFlag(`bulk_flag_${i}`, `bulk_value_${i}`);
        useSocialStore.getState().updateRelationship(`npc_${i}`, i * 5);
      }
      
      await saveManager.saveGame();
      
      const stats = saveManager.getStats();
      const compressionRatio = stats.compressionRatio;
      const saveSize = stats.saveSize;
      
      // Good compression should achieve at least 2x ratio
      const goodCompression = compressionRatio >= 2;
      const reasonableSize = saveSize < 100000; // Less than 100KB
      
      logResult('Compression and Size', goodCompression && reasonableSize,
        `Ratio: ${compressionRatio.toFixed(2)}x, Size: ${(saveSize/1024).toFixed(2)}KB`);
    } catch (error) {
      logResult('Compression and Size', false, error.message);
    }
  }
  
  // Test 5: Export/Import
  async function testExportImport() {
    console.log('\n📤📥 Test 5: Export/Import');
    
    try {
      // Set unique data
      const testDay = Math.floor(Math.random() * 100) + 50;
      useCoreGameStore.setState({ world: { day: testDay } });
      
      // Export save
      const exportedSave = await saveManager.exportSave();
      
      if (!exportedSave) {
        logResult('Export/Import', false, 'Export returned null');
        return;
      }
      
      // Clear and change data
      useCoreGameStore.setState({ world: { day: 1 } });
      
      // Import save
      const importResult = await saveManager.importSave(exportedSave);
      
      if (importResult) {
        const importedDay = useCoreGameStore.getState().world?.day;
        const correctImport = importedDay === testDay;
        
        logResult('Export/Import', correctImport,
          `Imported day: ${importedDay} (expected ${testDay})`);
      } else {
        logResult('Export/Import', false, 'Import operation failed');
      }
    } catch (error) {
      logResult('Export/Import', false, error.message);
    }
  }
  
  // Test 6: Corruption Handling
  async function testCorruptionHandling() {
    console.log('\n🚨 Test 6: Corruption Handling');
    
    try {
      // Create valid save
      await saveManager.saveGame();
      
      // Corrupt localStorage data
      const originalSetItem = localStorage.setItem;
      localStorage.setItem('v11m2-unified-save', 'corrupted-data');
      
      // Attempt to load corrupted save
      const loadResult = await saveManager.loadGame();
      
      // Should handle corruption gracefully (return false, not crash)
      logResult('Corruption Handling', !loadResult,
        'Gracefully handled corrupted save data');
      
      // Restore localStorage
      localStorage.setItem = originalSetItem;
    } catch (error) {
      logResult('Corruption Handling', false, error.message);
    }
  }
  
  // Test 7: Performance Check
  async function testPerformance() {
    console.log('\n⚡ Test 7: Performance Check');
    
    try {
      // Create substantial state
      for (let i = 0; i < 100; i++) {
        useCoreGameStore.getState().updateResource('money', 1);
        useNarrativeStore.getState().setStoryletFlag(`perf_flag_${i}`, i);
      }
      
      // Time save operation
      const saveStart = performance.now();
      await saveManager.saveGame();
      const saveTime = performance.now() - saveStart;
      
      // Time load operation
      const loadStart = performance.now();
      await saveManager.loadGame();
      const loadTime = performance.now() - loadStart;
      
      // Should complete within reasonable time (< 100ms each)
      const goodSavePerf = saveTime < 100;
      const goodLoadPerf = loadTime < 100;
      
      logResult('Performance Check', goodSavePerf && goodLoadPerf,
        `Save: ${saveTime.toFixed(2)}ms, Load: ${loadTime.toFixed(2)}ms`);
    } catch (error) {
      logResult('Performance Check', false, error.message);
    }
  }
  
  // Test 8: Integration with Auto-Save
  async function testAutoSaveIntegration() {
    console.log('\n🔄 Test 8: Auto-Save Integration');
    
    try {
      // Check if auto-save hook is available
      const autoSaveStatus = window.useAutoSave || 'Hook not exposed';
      
      // Test force atomic save if available
      if (window.forceAtomicSave) {
        const forceResult = await window.forceAtomicSave();
        logResult('Auto-Save Integration', forceResult,
          'Force atomic save function works');
      } else {
        logResult('Auto-Save Integration', false,
          'Force atomic save function not available');
      }
    } catch (error) {
      logResult('Auto-Save Integration', false, error.message);
    }
  }
  
  // Run all tests
  async function runAllTests() {
    console.log('🚀 Running Atomic Save System Test Suite...\n');
    
    await testAtomicSave();
    await testAtomicLoad();
    await testMapSerialization();
    await testCompressionAndSize();
    await testExportImport();
    await testCorruptionHandling();
    await testPerformance();
    await testAutoSaveIntegration();
    
    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(50));
    
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const percentage = ((passed / total) * 100).toFixed(1);
    
    console.log(`Tests Passed: ${passed}/${total} (${percentage}%)`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Atomic save system is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Review the results above.');
      testResults.filter(r => !r.passed).forEach(result => {
        console.log(`   ❌ ${result.testName}: ${result.details}`);
      });
    }
    
    return { passed, total, percentage, results: testResults };
  }
  
  // Export functions for manual execution
  window.runAtomicSaveTests = runAllTests;
  window.testAtomicSave = testAtomicSave;
  window.testAtomicLoad = testAtomicLoad;
  window.testMapSerialization = testMapSerialization;
  
  // Auto-run tests
  runAllTests();
  
})();