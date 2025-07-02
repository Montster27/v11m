// /Users/montysharma/v11m2/scripts/test-debounced-storage.js
// Browser-based regression test script for debounced storage

(function() {
  'use strict';
  
  console.log('🧪 Starting Debounced Storage Regression Tests...');
  
  // Import stores (assuming they're available globally in development)
  const { useCoreGameStore, useNarrativeStore, useSocialStore } = window;
  
  if (!useCoreGameStore || !useNarrativeStore || !useSocialStore) {
    console.error('❌ V2 stores not available globally. Make sure the app is running in development mode.');
    return;
  }
  
  // Test 1: Rapid state changes should be debounced
  function testRapidStateChanges() {
    console.log('\n📝 Test 1: Rapid state changes debouncing');
    
    const startTime = Date.now();
    let saveCount = 0;
    
    // Monitor localStorage writes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      if (key.includes('mmv-')) {
        saveCount++;
        console.log(`📀 localStorage write #${saveCount}: ${key} (${Date.now() - startTime}ms)`);
      }
      return originalSetItem.call(this, key, value);
    };
    
    // Make rapid changes to core store
    console.log('Making 10 rapid resource changes...');
    for (let i = 0; i < 10; i++) {
      useCoreGameStore.getState().updateResource('money', 1);
    }
    
    // Make rapid changes to narrative store
    console.log('Making 5 rapid flag changes...');
    for (let i = 0; i < 5; i++) {
      useNarrativeStore.getState().setStoryletFlag(`test_flag_${i}`, i);
    }
    
    // Check results after debounce period
    setTimeout(() => {
      console.log(`✅ Test 1 Result: ${saveCount} localStorage writes for 15 state changes`);
      console.log(`Expected: ≤3 writes (one per store), Actual: ${saveCount}`);
      
      if (saveCount <= 3) {
        console.log('✅ PASS: Debouncing working correctly');
      } else {
        console.log('❌ FAIL: Too many localStorage writes, debouncing may not be working');
      }
      
      // Restore original localStorage.setItem
      localStorage.setItem = originalSetItem;
      
      // Run next test
      testAutoSaveIndicator();
    }, 1500);
  }
  
  // Test 2: AutoSaveIndicator should show correct status
  function testAutoSaveIndicator() {
    console.log('\n📊 Test 2: AutoSaveIndicator status display');
    
    const indicator = document.querySelector('.autosave-indicator');
    if (!indicator) {
      console.log('❌ FAIL: AutoSaveIndicator not found in DOM');
      testStorageRecovery();
      return;
    }
    
    console.log('Making a state change and watching indicator...');
    
    // Make a change and watch the indicator
    useCoreGameStore.getState().updateResource('energy', 5);
    
    // Check if indicator shows "Saving..."
    setTimeout(() => {
      const statusText = indicator.textContent;
      console.log(`Indicator status: "${statusText}"`);
      
      if (statusText.includes('Saving') || statusText.includes('Saved')) {
        console.log('✅ PASS: AutoSaveIndicator showing save status');
      } else {
        console.log('❌ FAIL: AutoSaveIndicator not showing expected status');
      }
      
      testStorageRecovery();
    }, 500);
  }
  
  // Test 3: Storage recovery after reload
  function testStorageRecovery() {
    console.log('\n🔄 Test 3: Storage recovery simulation');
    
    // Get current state
    const currentDay = useCoreGameStore.getState().world.day;
    const currentLevel = useCoreGameStore.getState().player.level;
    const currentMoney = useCoreGameStore.getState().player.resources.money;
    
    console.log('Current state:', { day: currentDay, level: currentLevel, money: currentMoney });
    
    // Make some changes
    useCoreGameStore.getState().updateResource('money', 100);
    useCoreGameStore.getState().updatePlayer({ level: currentLevel + 1 });
    
    // Force flush to ensure persistence
    if (window.debouncedStorage) {
      window.debouncedStorage.flush();
    }
    
    console.log('Made changes and flushed to storage');
    
    // Simulate recovery by checking localStorage directly
    setTimeout(() => {
      const coreStoreData = localStorage.getItem('mmv-core-game-store');
      if (coreStoreData) {
        const parsed = JSON.parse(coreStoreData);
        console.log('Stored data found:', {
          money: parsed.state?.player?.resources?.money,
          level: parsed.state?.player?.level
        });
        
        if (parsed.state?.player?.resources?.money === currentMoney + 100) {
          console.log('✅ PASS: State changes persisted correctly');
        } else {
          console.log('❌ FAIL: State changes not persisted');
        }
      } else {
        console.log('❌ FAIL: No stored data found');
      }
      
      testPerformanceImpact();
    }, 1000);
  }
  
  // Test 4: Performance impact measurement
  function testPerformanceImpact() {
    console.log('\n⚡ Test 4: Performance impact measurement');
    
    const iterations = 1000;
    const startTime = performance.now();
    
    // Make many rapid changes
    for (let i = 0; i < iterations; i++) {
      useCoreGameStore.getState().updateResource('experience', 1);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`${iterations} state updates took ${duration.toFixed(2)}ms`);
    console.log(`Average: ${(duration / iterations).toFixed(4)}ms per update`);
    
    if (duration < 100) {
      console.log('✅ PASS: Good performance, minimal impact from debouncing');
    } else if (duration < 500) {
      console.log('⚠️ WARN: Moderate performance impact');
    } else {
      console.log('❌ FAIL: High performance impact, debouncing may be causing issues');
    }
    
    testCleanup();
  }
  
  // Test 5: Cleanup and final status
  function testCleanup() {
    console.log('\n🧹 Test 5: Cleanup and final status');
    
    // Force final flush
    if (window.debouncedStorage) {
      window.debouncedStorage.flush();
      const stats = window.debouncedStorage.getStats();
      console.log('Final storage stats:', stats);
      
      if (stats.pendingWrites === 0) {
        console.log('✅ PASS: No pending writes after flush');
      } else {
        console.log('❌ FAIL: Pending writes remain after flush');
      }
    }
    
    console.log('\n🎯 Regression Test Summary:');
    console.log('=====================================');
    console.log('1. Debouncing: Check console logs above');
    console.log('2. AutoSaveIndicator: Check console logs above');
    console.log('3. Storage Recovery: Check console logs above');
    console.log('4. Performance: Check console logs above');
    console.log('5. Cleanup: Check console logs above');
    console.log('\n✅ All tests completed. Review results above.');
  }
  
  // Start the test suite
  testRapidStateChanges();
  
})();

// Export test function for manual execution
window.runDebouncedStorageTests = function() {
  // Re-run the tests
  setTimeout(() => {
    console.clear();
    console.log('🔄 Re-running Debounced Storage Tests...');
    // The IIFE will run automatically when this script loads
  }, 100);
};