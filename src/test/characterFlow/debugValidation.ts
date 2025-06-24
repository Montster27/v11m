// /Users/montysharma/V11M2/src/test/characterFlow/debugValidation.ts
// Debug validation to identify issues

import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../../stores/v2';

export const debugStoreStructure = () => {
  console.log('🔍 DEBUG: Store Structure Analysis');
  console.log('==================================\n');
  
  try {
    // Core Store Analysis
    console.log('📊 Core Store Analysis:');
    const coreStore = useCoreGameStore.getState();
    console.log('   Store exists:', !!coreStore);
    console.log('   Store keys:', coreStore ? Object.keys(coreStore) : 'undefined');
    console.log('   Player exists:', !!coreStore?.player);
    console.log('   Character exists:', !!coreStore?.character);
    console.log('   World exists:', !!coreStore?.world);
    console.log('   Player structure:', coreStore?.player ? Object.keys(coreStore.player) : 'undefined');
    console.log('');
    
    // Narrative Store Analysis
    console.log('📖 Narrative Store Analysis:');
    const narrativeStore = useNarrativeStore.getState();
    console.log('   Store exists:', !!narrativeStore);
    console.log('   Store keys:', narrativeStore ? Object.keys(narrativeStore) : 'undefined');
    console.log('   Storylets exists:', !!narrativeStore?.storylets);
    console.log('   Flags exists:', !!narrativeStore?.flags);
    console.log('   Concerns exists:', !!narrativeStore?.concerns);
    console.log('   Storylets structure:', narrativeStore?.storylets ? Object.keys(narrativeStore.storylets) : 'undefined');
    console.log('');
    
    // Social Store Analysis
    console.log('👥 Social Store Analysis:');
    const socialStore = useSocialStore.getState();
    console.log('   Store exists:', !!socialStore);
    console.log('   Store keys:', socialStore ? Object.keys(socialStore) : 'undefined');
    console.log('   NPCs exists:', !!socialStore?.npcs);
    console.log('   Clues exists:', !!socialStore?.clues);
    console.log('   Saves exists:', !!socialStore?.saves);
    console.log('   NPCs structure:', socialStore?.npcs ? Object.keys(socialStore.npcs) : 'undefined');
    console.log('');
    
    // Test architectural validation logic
    console.log('🏗️ Architectural Validation Test:');
    const hasConsolidatedStores = 
      typeof useCoreGameStore !== 'undefined' &&
      typeof useNarrativeStore !== 'undefined' &&
      typeof useSocialStore !== 'undefined';
    console.log('   Has consolidated stores:', hasConsolidatedStores);
    
    const coreValid = coreStore && 
      typeof coreStore.player === 'object' && 
      typeof coreStore.character === 'object' && 
      typeof coreStore.world === 'object';
    console.log('   Core store valid:', coreValid);
    
    const narrativeValid = narrativeStore && 
      typeof narrativeStore.storylets === 'object' && 
      (narrativeStore.flags !== undefined);
    console.log('   Narrative store valid:', narrativeValid);
    
    const socialValid = socialStore && 
      typeof socialStore.npcs === 'object' && 
      typeof socialStore.clues === 'object' && 
      typeof socialStore.saves === 'object';
    console.log('   Social store valid:', socialValid);
    
    const overallValid = hasConsolidatedStores && coreValid && narrativeValid && socialValid;
    console.log('   Overall architectural validation:', overallValid);
    console.log('');
    
    console.log('✅ Debug analysis complete');
    
    return {
      coreStore: !!coreStore,
      narrativeStore: !!narrativeStore,
      socialStore: !!socialStore,
      hasConsolidatedStores,
      coreValid,
      narrativeValid,
      socialValid,
      overallValid
    };
    
  } catch (error) {
    console.error('❌ Debug analysis failed:', error);
    return { error: error.message };
  }
};

export const quickArchitecturalTest = () => {
  console.log('⚡ Quick Architectural Test');
  console.log('===========================\n');
  
  try {
    // Test 1: Store functions exist
    console.log('1️⃣ Testing store function availability...');
    const storesExist = 
      typeof useCoreGameStore === 'function' &&
      typeof useNarrativeStore === 'function' &&
      typeof useSocialStore === 'function';
    console.log(`   Store functions exist: ${storesExist ? '✅' : '❌'}`);
    
    // Test 2: Can get state from stores
    console.log('\n2️⃣ Testing state access...');
    let stateAccessible = false;
    try {
      const core = useCoreGameStore.getState();
      const narrative = useNarrativeStore.getState();
      const social = useSocialStore.getState();
      stateAccessible = !!(core && narrative && social);
    } catch (error) {
      console.log(`   State access error: ${error.message}`);
    }
    console.log(`   State accessible: ${stateAccessible ? '✅' : '❌'}`);
    
    // Test 3: Store structure check
    console.log('\n3️⃣ Testing store structure...');
    let structureValid = false;
    if (stateAccessible) {
      const core = useCoreGameStore.getState();
      const narrative = useNarrativeStore.getState();
      const social = useSocialStore.getState();
      
      structureValid = 
        !!(core.player && core.character && core.world &&
        narrative.storylets && narrative.flags &&
        social.npcs && social.clues && social.saves);
    }
    console.log(`   Structure valid: ${structureValid ? '✅' : '❌'}`);
    
    const overallSuccess = storesExist && stateAccessible && structureValid;
    console.log(`\n🎯 Overall: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      storesExist,
      stateAccessible,
      structureValid,
      overallSuccess
    };
    
  } catch (error) {
    console.error('❌ Quick architectural test failed:', error);
    return { error: error.message, overallSuccess: false };
  }
};

// Browser console access
if (typeof window !== 'undefined') {
  (window as any).debugStoreStructure = debugStoreStructure;
  (window as any).quickArchitecturalTest = quickArchitecturalTest;
  
  console.log('🔍 Debug Validation loaded');
  console.log('   debugStoreStructure() - Detailed store analysis');
  console.log('   quickArchitecturalTest() - Quick architecture check');
}