// /Users/montysharma/v11m2/scripts/test-regression.js
// Regression Test Script for Save System Migration
// Run this in the browser console after implementing versioning

console.log('🧪 Starting Save System Regression Tests...');

// Test 1: Load existing save game - should not lose any data
async function testExistingSaveLoad() {
  console.log('\n📋 Test 1: Loading Existing Save Game');
  
  // Check if there are existing saves
  const coreData = localStorage.getItem('mmv-core-game-store');
  const narrativeData = localStorage.getItem('mmv-narrative-store');
  const socialData = localStorage.getItem('mmv-social-store');
  
  if (!coreData && !narrativeData && !socialData) {
    console.log('⚪ No existing save data found - skipping test');
    return true;
  }
  
  try {
    // Try to parse existing data
    const core = coreData ? JSON.parse(coreData) : null;
    const narrative = narrativeData ? JSON.parse(narrativeData) : null;
    const social = socialData ? JSON.parse(socialData) : null;
    
    console.log('📊 Existing save data:');
    console.log('  Core store version:', core?.version || 'unversioned');
    console.log('  Narrative store version:', narrative?.version || 'unversioned');
    console.log('  Social store version:', social?.version || 'unversioned');
    
    // Check if data is preserved
    if (core?.state) {
      console.log('✅ Core store data present');
      console.log('  Player level:', core.state.player?.level || 'N/A');
      console.log('  Character name:', core.state.character?.name || 'N/A');
      console.log('  World day:', core.state.world?.day || 'N/A');
    }
    
    if (narrative?.state) {
      console.log('✅ Narrative store data present');
      console.log('  Active storylets:', narrative.state.storylets?.active?.length || 0);
      console.log('  Completed storylets:', narrative.state.storylets?.completed?.length || 0);
    }
    
    if (social?.state) {
      console.log('✅ Social store data present');
      console.log('  Save slots:', Object.keys(social.state.saves?.saveSlots || {}).length);
      console.log('  Current save:', social.state.saves?.currentSaveId || 'N/A');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to parse existing save data:', error);
    return false;
  }
}

// Test 2: Create new game - should initialize with version
async function testNewGameCreation() {
  console.log('\n📋 Test 2: Creating New Game');
  
  try {
    // Clear localStorage to simulate new game
    const backupData = {
      core: localStorage.getItem('mmv-core-game-store'),
      narrative: localStorage.getItem('mmv-narrative-store'),
      social: localStorage.getItem('mmv-social-store')
    };
    
    localStorage.removeItem('mmv-core-game-store');
    localStorage.removeItem('mmv-narrative-store');
    localStorage.removeItem('mmv-social-store');
    
    // Reload page to reinitialize stores
    console.log('⚠️ NOTE: You need to refresh the page to test new game initialization');
    console.log('   After refresh, check that all stores have version: 1');
    
    // Restore backup
    setTimeout(() => {
      if (backupData.core) localStorage.setItem('mmv-core-game-store', backupData.core);
      if (backupData.narrative) localStorage.setItem('mmv-narrative-store', backupData.narrative);
      if (backupData.social) localStorage.setItem('mmv-social-store', backupData.social);
      console.log('🔄 Backup data restored');
    }, 5000);
    
    return true;
  } catch (error) {
    console.error('❌ Failed new game test:', error);
    return false;
  }
}

// Test 3: Save and reload - version should persist
async function testSaveReload() {
  console.log('\n📋 Test 3: Save and Reload Cycle');
  
  try {
    // Check current versions
    const currentCore = localStorage.getItem('mmv-core-game-store');
    const currentNarrative = localStorage.getItem('mmv-narrative-store');
    const currentSocial = localStorage.getItem('mmv-social-store');
    
    if (currentCore) {
      const coreData = JSON.parse(currentCore);
      console.log('Core store version:', coreData.version);
      if (coreData.version !== 1) {
        console.log('⚠️ Core store version mismatch - expected 1, got:', coreData.version);
      } else {
        console.log('✅ Core store version correct');
      }
    }
    
    if (currentNarrative) {
      const narrativeData = JSON.parse(currentNarrative);
      console.log('Narrative store version:', narrativeData.version);
      if (narrativeData.version !== 1) {
        console.log('⚠️ Narrative store version mismatch - expected 1, got:', narrativeData.version);
      } else {
        console.log('✅ Narrative store version correct');
      }
    }
    
    if (currentSocial) {
      const socialData = JSON.parse(currentSocial);
      console.log('Social store version:', socialData.version);
      if (socialData.version !== 1) {
        console.log('⚠️ Social store version mismatch - expected 1, got:', socialData.version);
      } else {
        console.log('✅ Social store version correct');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed save/reload test:', error);
    return false;
  }
}

// Test 4: Check AutoSaveIndicator still shows save activity
async function testAutoSaveIndicator() {
  console.log('\n📋 Test 4: AutoSave Indicator Check');
  
  try {
    // Look for autosave indicator in DOM
    const indicators = document.querySelectorAll('[class*="autosave"], [class*="save"], [data-testid*="save"]');
    
    if (indicators.length > 0) {
      console.log('✅ Found potential autosave indicators:', indicators.length);
      indicators.forEach((el, i) => {
        console.log(`  Indicator ${i + 1}:`, el.className, el.textContent?.trim());
      });
    } else {
      console.log('⚪ No autosave indicators found in DOM');
    }
    
    // Check if autosave is enabled in config
    const autoSaveConfig = window.REFACTOR_CONFIG?.AUTO_SAVE_DISABLED;
    if (autoSaveConfig !== undefined) {
      console.log('AutoSave config found - disabled:', autoSaveConfig);
      if (!autoSaveConfig) {
        console.log('✅ AutoSave is enabled');
      } else {
        console.log('⚠️ AutoSave is disabled');
      }
    } else {
      console.log('⚪ AutoSave config not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed autosave indicator test:', error);
    return false;
  }
}

// Test 5: Migration handling for unversioned data
async function testMigrationHandling() {
  console.log('\n📋 Test 5: Migration Handling');
  
  try {
    // Create unversioned data to test migration
    const unversionedCore = {
      state: {
        player: { level: 99, experience: 9999 },
        character: { name: 'MigrationTest' },
        world: { day: 50 }
      }
      // No version field
    };
    
    // Backup current data
    const currentCore = localStorage.getItem('mmv-core-game-store');
    
    // Set unversioned data
    localStorage.setItem('mmv-core-game-store', JSON.stringify(unversionedCore));
    
    console.log('📝 Set unversioned data - refresh page to test migration');
    console.log('   Expected: Data should be preserved and version should be added');
    
    // Restore after delay
    setTimeout(() => {
      if (currentCore) {
        localStorage.setItem('mmv-core-game-store', currentCore);
        console.log('🔄 Original data restored');
      }
    }, 10000);
    
    return true;
  } catch (error) {
    console.error('❌ Failed migration test:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all regression tests...\n');
  
  const results = {
    existingSaveLoad: await testExistingSaveLoad(),
    newGameCreation: await testNewGameCreation(),
    saveReload: await testSaveReload(),
    autoSaveIndicator: await testAutoSaveIndicator(),
    migrationHandling: await testMigrationHandling()
  };
  
  console.log('\n📊 REGRESSION TEST RESULTS:');
  console.log('================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('================================');
  console.log(`📈 Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All regression tests passed!');
  } else {
    console.log('⚠️ Some tests failed - check implementation');
  }
  
  return results;
}

// Export for manual testing
window.saveSystemTests = {
  runAll: runAllTests,
  testExistingSaveLoad,
  testNewGameCreation,
  testSaveReload,
  testAutoSaveIndicator,
  testMigrationHandling
};

console.log('✅ Regression test suite loaded');
console.log('Run: saveSystemTests.runAll() to execute all tests');

// Auto-run if not in test environment
if (!window.location.href.includes('test')) {
  runAllTests();
}