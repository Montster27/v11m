// /Users/montysharma/V11M2/fix_persistence_refactoring.js
// COMPREHENSIVE FIX FOR PERSISTENCE REFACTORING ISSUES

console.log('🔧 FIXING PERSISTENCE REFACTORING ISSUES...');
console.log('='.repeat(60));

/**
 * PHASE 1: IMMEDIATE STABILIZATION
 * Disable V2 stores temporarily to stabilize on old system
 */

function phase1_stabilizeOldSystem() {
  console.log('\n📦 PHASE 1: STABILIZING OLD SYSTEM');
  console.log('─'.repeat(40));
  
  try {
    // Step 1: Clear V2 store persistence to avoid conflicts
    const v2Keys = [
      'mmv-core-game-store',
      'mmv-narrative-store', 
      'mmv-social-store'
    ];
    
    console.log('Clearing V2 store persistence...');
    v2Keys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`  🗑️ Removed ${key}`);
      }
    });
    
    // Step 2: Ensure old stores are in clean state
    if (window.useAppStore) {
      console.log('Resetting useAppStore to fresh state...');
      window.useAppStore.setState({
        userLevel: 1,
        experience: 0,
        day: 1,
        activeCharacter: null,
        resources: { 
          energy: 75, 
          stress: 25, 
          money: 20, 
          knowledge: 100, 
          social: 200 
        },
        storyletFlags: {},
        activeStoryletIds: [],
        isTimePaused: false
      });
    }
    
    // Step 3: Reset storylet store
    if (window.useStoryletStore) {
      console.log('Resetting storylet store...');
      window.useStoryletStore.getState().resetStorylets();
    }
    
    // Step 4: Clear save system interference  
    if (window.useSaveStore) {
      console.log('Clearing save store interference...');
      window.useSaveStore.setState({
        currentSaveId: null,
        saveSlots: [],
        storyletCompletions: []
      });
    }
    
    // Step 5: Clear all save files
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mmv-save-slots_')) {
        localStorage.removeItem(key);
        console.log(`  🗑️ Removed save file ${key}`);
      }
    });
    
    console.log('✅ Phase 1 complete - Old system stabilized');
    
  } catch (error) {
    console.error('❌ Phase 1 failed:', error);
    return false;
  }
  
  return true;
}

/**
 * PHASE 2: CODE CLEANUP INSTRUCTIONS
 * Generate the exact code changes needed
 */

function phase2_generateCodeFixes() {
  console.log('\n📝 PHASE 2: CODE CHANGES NEEDED');
  console.log('─'.repeat(40));
  
  console.log('1. APP.TSX CHANGES:');
  console.log('   Comment out these imports in src/App.tsx:');
  console.log('   // import { useCoreGameStore, useNarrativeStore, useSocialStore } from \'./stores/v2\';');
  console.log('');
  
  console.log('2. APP.TSX V2 STORE EXPOSURE:');
  console.log('   Comment out the V2 store exposure section (around lines 75-85):');
  console.log('   /*');
  console.log('   // Expose consolidated stores globally for console access');
  console.log('   import(\'./stores/v2\').then(module => {');
  console.log('     (window as any).useCoreGameStore = module.useCoreGameStore;');
  console.log('     (window as any).useNarrativeStore = module.useNarrativeStore;');
  console.log('     (window as any).useSocialStore = module.useSocialStore;');
  console.log('     console.log(\'🏪 Consolidated stores exposed globally for console access\');');
  console.log('   });');
  console.log('   */');
  console.log('');
  
  console.log('3. REMOVE V2 IMPORTS:');
  console.log('   Remove this line from imports section:');
  console.log('   // import { useCoreGameStore, useNarrativeStore, useSocialStore } from \'./stores/v2\';');
  console.log('');
  
  console.log('4. TEMPORARILY DISABLE V2 STORES DIRECTORY:');
  console.log('   Rename src/stores/v2 to src/stores/v2_disabled');
  console.log('   This