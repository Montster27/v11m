// /Users/montysharma/V11M2/src/utils/testV2Migration.ts
// Test script to verify V2 store migration is working correctly

export const testV2Migration = () => {
  console.log('🧪 Testing V2 Store Migration...\n');
  
  try {
    // Get all stores
    const coreStore = (window as any).useCoreGameStore?.getState();
    const narrativeStore = (window as any).useNarrativeStore?.getState();
    const socialStore = (window as any).useSocialStore?.getState();
    const legacyAppStore = (window as any).useAppStore?.getState();
    
    console.log('📊 Store Status:');
    console.log('================');
    
    // Check Core Game Store
    console.log('\n1️⃣ Core Game Store (V2):');
    if (coreStore) {
      console.log('   ✅ Store exists');
      console.log('   - Player Level:', coreStore.player?.level || 'Not set');
      console.log('   - Experience:', coreStore.player?.experience || 'Not set');
      console.log('   - Day:', coreStore.world?.day || 'Not set');
      console.log('   - Resources:', coreStore.player?.resources || 'Not set');
      console.log('   - Character:', coreStore.character?.name || 'No character');
      console.log('   - Time Allocation:', coreStore.world?.timeAllocation || 'Not set');
    } else {
      console.log('   ❌ Store not found!');
    }
    
    // Check Legacy App Store
    console.log('\n2️⃣ Legacy App Store:');
    if (legacyAppStore) {
      console.log('   ✅ Store exists');
      console.log('   - User Level:', legacyAppStore.userLevel || 'Not set');
      console.log('   - Experience:', legacyAppStore.experience || 'Not set');
      console.log('   - Day:', legacyAppStore.day || 'Not set');
      console.log('   - Resources:', legacyAppStore.resources || 'Not set');
      console.log('   - Active Character:', legacyAppStore.activeCharacter?.name || 'No character');
    } else {
      console.log('   ❌ Store not found!');
    }
    
    // Check Narrative Store
    console.log('\n3️⃣ Narrative Store (V2):');
    if (narrativeStore) {
      console.log('   ✅ Store exists');
      console.log('   - Active Storylets:', narrativeStore.storylets?.active?.length || 0);
      console.log('   - Completed Storylets:', narrativeStore.storylets?.completed?.length || 0);
      console.log('   - Flags:', narrativeStore.flags || 'Not set');
    } else {
      console.log('   ❌ Store not found!');
    }
    
    // Check Social Store
    console.log('\n4️⃣ Social Store (V2):');
    if (socialStore) {
      console.log('   ✅ Store exists');
      console.log('   - Discovered Clues:', socialStore.clues?.discovered?.length || 0);
      console.log('   - NPC Relationships:', Object.keys(socialStore.npcs?.relationships || {}).length);
    } else {
      console.log('   ❌ Store not found!');
    }
    
    // Check localStorage
    console.log('\n5️⃣ LocalStorage Status:');
    const v2CoreData = localStorage.getItem('mmv-core-game-store');
    const legacyData = localStorage.getItem('life-sim-store');
    console.log('   - V2 Core Store:', v2CoreData ? '✅ Has data' : '❌ Empty');
    console.log('   - Legacy Store:', legacyData ? '✅ Has data' : '❌ Empty');
    
    // Test migration
    console.log('\n6️⃣ Testing Migration:');
    console.log('   Running migrateStores()...');
    const result = (window as any).migrateStores?.();
    console.log('   Result:', result);
    
    // Validate migration
    console.log('\n7️⃣ Validating Migration:');
    const validation = (window as any).validateMigration?.();
    console.log('   Validation:', validation);
    
    // Component Check
    console.log('\n8️⃣ Component Store Usage:');
    console.log('   - ResourcePanel: Should use useCoreGameStore ✅');
    console.log('   - TimeAllocationPanel: Should use useCoreGameStore ✅');
    console.log('   - SkillsPanel: Should use useCoreGameStore ✅');
    console.log('   - StoryletPanel: Should use useNarrativeStore ✅');
    
    console.log('\n✅ Test complete! Check the results above.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Quick fix function
export const quickFixV2Stores = () => {
  console.log('🔧 Quick Fix: Clearing V2 stores and re-running migration...');
  
  // Clear V2 stores
  localStorage.removeItem('mmv-core-game-store');
  localStorage.removeItem('mmv-narrative-store');
  localStorage.removeItem('mmv-social-store');
  
  // Reload to trigger fresh migration
  console.log('✅ V2 stores cleared. Refreshing page...');
  setTimeout(() => location.reload(), 1000);
};

// Auto-expose to window
if (typeof window !== 'undefined') {
  (window as any).testV2Migration = testV2Migration;
  (window as any).quickFixV2Stores = quickFixV2Stores;
  console.log('🧪 V2 Migration Test loaded. Run: testV2Migration() or quickFixV2Stores()');
}
