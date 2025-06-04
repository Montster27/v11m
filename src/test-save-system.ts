// /Users/montysharma/V11M2/src/test-save-system.ts

// Test script to verify save system functionality
// Run this in the browser console to test the save system

export const testSaveSystem = () => {
  console.log('🧪 Testing Save System...');
  
  try {
    // Test 1: Check if stores are available
    console.log('\n1. 📊 Checking store availability...');
    const appStore = (window as any).useAppStore?.getState();
    const storyletStore = (window as any).useStoryletStore?.getState();
    const saveStore = (window as any).useSaveStore?.getState();
    
    if (!appStore) throw new Error('App store not available');
    if (!storyletStore) throw new Error('Storylet store not available');
    if (!saveStore) throw new Error('Save store not available');
    
    console.log('✅ All stores available');
    
    // Test 2: Check current game state
    console.log('\n2. 🎮 Current game state:');
    console.log(`   Day: ${appStore.day}`);
    console.log(`   Level: ${appStore.userLevel}`);
    console.log(`   XP: ${appStore.experience}`);
    console.log(`   Character: ${appStore.activeCharacter?.name || 'None'}`);
    console.log(`   Completed Storylets: ${storyletStore.completedStoryletIds.length}`);
    
    // Test 3: Test save creation
    console.log('\n3. 💾 Testing save creation...');
    const saveId = saveStore.createSave('Test Save - ' + new Date().toLocaleTimeString());
    
    if (saveId) {
      console.log(`✅ Save created successfully: ${saveId}`);
    } else {
      throw new Error('Failed to create save');
    }
    
    // Test 4: Test save listing
    console.log('\n4. 📁 Testing save listing...');
    const saves = saveStore.getSaveSlots();
    console.log(`✅ Found ${saves.length} saves`);
    console.table(saves.map(save => ({
      name: save.name,
      day: save.gameDay,
      level: save.preview.level,
      storylets: save.preview.storyletsCompleted,
      timestamp: new Date(save.timestamp).toLocaleString()
    })));
    
    // Test 5: Test storylet completion tracking
    console.log('\n5. 📚 Testing storylet completion tracking...');
    const completions = saveStore.getStoryletCompletions();
    console.log(`✅ Found ${completions.length} storylet completions`);
    
    if (completions.length > 0) {
      console.log('Recent completions:');
      completions.slice(-3).forEach(completion => {
        console.log(`   - ${completion.storyletId} on Day ${completion.day}: ${completion.choice.text}`);
      });
    }
    
    // Test 6: Test statistics
    console.log('\n6. 📈 Testing statistics...');
    const stats = saveStore.getStoryletStats();
    console.log(`   Total completed: ${stats.totalCompleted}`);
    console.log(`   Active days: ${Object.keys(stats.completionsByDay).length}`);
    console.log(`   Unique choices: ${Object.keys(stats.choiceFrequency).length}`);
    
    // Test 7: Test export functionality
    console.log('\n7. 📤 Testing export functionality...');
    if (saves.length > 0) {
      const exportData = saveStore.exportSave(saves[0].id);
      if (exportData) {
        console.log(`✅ Export successful (${exportData.length} characters)`);
        console.log('Export data preview:', exportData.substring(0, 100) + '...');
      } else {
        console.warn('⚠️ Export failed');
      }
    }
    
    console.log('\n🎉 Save system test completed successfully!');
    console.log('\n💡 Try these commands:');
    console.log('   - createTestSave("My Save")');
    console.log('   - listSaves()');
    console.log('   - exportSave(saveId)');
    console.log('   - Open Save Manager from navigation');
    console.log('   - Open Storylet Progress from navigation');
    
    return true;
  } catch (error) {
    console.error('❌ Save system test failed:', error);
    return false;
  }
};

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  (window as any).testSaveSystem = testSaveSystem;
  console.log('💾 Save system test function available as window.testSaveSystem()');
}
