// /Users/montysharma/V11M2/diagnostic_tool.js
// COMPREHENSIVE DIAGNOSTIC TOOL FOR PERSISTENCE REFACTORING ISSUES

console.log('🔍 RUNNING COMPREHENSIVE PERSISTENCE DIAGNOSTIC...');
console.log('='.repeat(60));

// Check if we're in the right environment
if (typeof window === 'undefined') {
  console.log('❌ This tool must be run in browser console');
  process.exit(1);
}

function checkStoreAvailability() {
  console.log('\n📦 STORE AVAILABILITY CHECK:');
  console.log('─'.repeat(40));
  
  const oldStores = [
    'useAppStore',
    'useStoryletStore', 
    'useIntegratedCharacterStore',
    'useSkillSystemV2Store',
    'useClueStore',
    'useNPCStore',
    'useSaveStore',
    'useCharacterConcernsStore',
    'useStoryletFlagStore',
    'useStoryArcStore',
    'useStoryletCatalogStore'
  ];
  
  const newStores = [
    'useCoreGameStore',
    'useNarrativeStore', 
    'useSocialStore'
  ];
  
  console.log('OLD STORES (should be migrated):');
  oldStores.forEach(store => {
    const exists = !!(window[store]);
    const state = exists ? Object.keys(window[store].getState()).length : 0;
    console.log(`  ${exists ? '✅' : '❌'} ${store} (${state} properties)`);
  });
  
  console.log('\nNEW STORES (V2 - should be active):');
  newStores.forEach(store => {
    const exists = !!(window[store]);
    const state = exists ? Object.keys(window[store].getState()).length : 0;
    console.log(`  ${exists ? '✅' : '❌'} ${store} (${state} properties)`);
  });
}

function checkLocalStorageKeys() {
  console.log('\n💾 LOCAL STORAGE ANALYSIS:');
  console.log('─'.repeat(40));
  
  const allKeys = Object.keys(localStorage);
  const storeKeys = allKeys.filter(key => 
    key.includes('store') || 
    key.includes('mmv') || 
    key.includes('storylet') ||
    key.includes('character') ||
    key.includes('save') ||
    key.includes('life-sim')
  );
  
  console.log('Found storage keys:');
  storeKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      const size = JSON.stringify(data).length;
      console.log(`  📦 ${key} (${size} bytes)`);
      
      // Check for suspicious data
      if (data.state && data.state.day > 1) {
        console.log(`    ⚠️  Contains day ${data.state.day} - not fresh state`);
      }
      if (data.state && data.state.userLevel > 1) {
        console.log(`    ⚠️  Contains userLevel ${data.state.userLevel} - not fresh state`);
      }
      if (data.state && data.state.experience > 0) {
        console.log(`    ⚠️  Contains experience ${data.state.experience} - not fresh state`);
      }
    } catch (e) {
      console.log(`  📦 ${key} (invalid JSON)`);
    }
  });
}

function checkCurrentAppState() {
  console.log('\n🎮 CURRENT APP STATE:');
  console.log('─'.repeat(40));
  
  // Check old store state
  if (window.useAppStore) {
    const state = window.useAppStore.getState();
    console.log('OLD useAppStore state:');
    console.log(`  Day: ${state.day}`);
    console.log(`  UserLevel: ${state.userLevel}`);
    console.log(`  Experience: ${state.experience}`);
    console.log(`  ActiveCharacter: ${state.activeCharacter?.name || 'null'}`);
    console.log(`  Resources: Energy ${state.resources.energy}, Knowledge ${state.resources.knowledge}`);
  }
  
  // Check new store state
  if (window.useCoreGameStore) {
    const state = window.useCoreGameStore.getState();
    console.log('\nNEW useCoreGameStore state:');
    console.log(`  Day: ${state.world.day}`);
    console.log(`  Level: ${state.player.level}`);
    console.log(`  Experience: ${state.player.experience}`);
    console.log(`  Character: ${state.character.name || 'empty'}`);
  }
}

function identifyIssues() {
  console.log('\n🚨 ISSUE IDENTIFICATION:');
  console.log('─'.repeat(40));
  
  const issues = [];
  
  // Check for dual store problem
  if (window.useAppStore && window.useCoreGameStore) {
    issues.push('DUAL STORES: Both old and new stores are active simultaneously');
  }
  
  // Check for orphaned state
  if (window.useAppStore) {
    const state = window.useAppStore.getState();
    if (state.day > 1 || state.userLevel > 1 || state.experience > 0) {
      issues.push(`ORPHANED STATE: Old store has non-fresh data (Day ${state.day}, Level ${state.userLevel}, XP ${state.experience})`);
    }
  }
  
  // Check for storage conflicts
  const oldStoreKeys = Object.keys(localStorage).filter(key => 
    ['life-sim-store', 'storylet-store', 'integrated-character-store'].includes(key)
  );
  const newStoreKeys = Object.keys(localStorage).filter(key => 
    ['mmv-core-game-store', 'mmv-narrative-store', 'mmv-social-store'].includes(key)
  );
  
  if (oldStoreKeys.length > 0 && newStoreKeys.length > 0) {
    issues.push('STORAGE CONFLICT: Both old and new persistence keys exist');
  }
  
  // Check for App.tsx import conflicts
  console.log('Identified issues:');
  issues.forEach(issue => console.log(`  🔥 ${issue}`));
  
  if (issues.length === 0) {
    console.log('  ✅ No obvious issues detected');
  }
}

function generateFixActions() {
  console.log('\n🔧 RECOMMENDED FIX ACTIONS:');
  console.log('─'.repeat(40));
  
  const actions = [];
  
  // Check what state we're in
  const hasOldStores = !!(window.useAppStore);
  const hasNewStores = !!(window.useCoreGameStore);
  const hasOldStorage = Object.keys(localStorage).some(key => 
    ['life-sim-store', 'storylet-store'].includes(key)
  );
  const hasNewStorage = Object.keys(localStorage).some(key => 
    key.startsWith('mmv-') && key.includes('store')
  );
  
  if (hasOldStores && hasNewStores) {
    actions.push('1. DISABLE OLD STORES: Comment out old store imports in App.tsx');
    actions.push('2. UPDATE COMPONENTS: Switch all components to use new V2 stores');
    actions.push('3. CLEAN STORAGE: Remove old localStorage keys');
  }
  
  if (hasOldStorage && hasNewStorage) {
    actions.push('4. MIGRATE DATA: Move data from old storage to new storage format');
    actions.push('5. CLEAN OLD STORAGE: Remove conflicting old storage keys');
  }
  
  if (!hasNewStores) {
    actions.push('6. ENABLE NEW STORES: Uncomment/import V2 stores in App.tsx');
  }
  
  actions.forEach(action => console.log(`  📋 ${action}`));
  
  return actions;
}

function runQuickFix() {
  console.log('\n⚡ ATTEMPTING QUICK FIX:');
  console.log('─'.repeat(40));
  
  try {
    // Step 1: Clear problematic localStorage
    const keysToRemove = [
      'life-sim-store',
      'storylet-store', 
      'integrated-character-store',
      'mmv-skill-system-v2',
      'clue-store',
      'npc-store',
      'mmv-save-manager'
    ];
    
    console.log('Clearing old localStorage keys...');
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`  🗑️ Removed ${key}`);
      }
    });
    
    // Step 2: Clear save files
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mmv-save-slots_')) {
        localStorage.removeItem(key);
        console.log(`  🗑️ Removed save file ${key}`);
      }
    });
    
    // Step 3: Reset old stores if available
    if (window.useAppStore) {
      console.log('Resetting old useAppStore...');
      window.useAppStore.setState({
        userLevel: 1,
        experience: 0,
        day: 1,
        activeCharacter: null,
        resources: { energy: 75, stress: 25, money: 20, knowledge: 100, social: 200 }
      });
    }
    
    // Step 4: Reset save store
    if (window.useSaveStore) {
      console.log('Resetting save store...');
      window.useSaveStore.setState({
        currentSaveId: null,
        saveSlots: [],
        storyletCompletions: []
      });
    }
    
    console.log('✅ Quick fix completed! Refresh the page to see results.');
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
  }
}

// Run diagnostics
checkStoreAvailability();
checkLocalStorageKeys();
checkCurrentAppState();
identifyIssues();
const actions = generateFixActions();

console.log('\n🎯 SUMMARY:');
console.log('─'.repeat(40));
console.log('This diagnostic tool has identified the current persistence state.');
console.log('You appear to be in the middle of a store refactoring process.');
console.log('\nTo run the quick fix, type: runQuickFix()');
console.log('To re-run diagnostics, refresh and run this script again.');

// Make functions available
window.runQuickFix = runQuickFix;
window.checkStoreAvailability = checkStoreAvailability;
window.checkLocalStorageKeys = checkLocalStorageKeys;
window.checkCurrentAppState = checkCurrentAppState;

console.log('\n🔧 Available commands:');
console.log('  runQuickFix() - Attempt automatic fix');
console.log('  checkStoreAvailability() - Re-check store status');
console.log('  checkLocalStorageKeys() - Re-check storage');
console.log('  checkCurrentAppState() - Re-check app state');
