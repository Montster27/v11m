// Test function for the clue system integration

export const testClueSystem = () => {
  console.log('🧪 Testing Clue System Integration...');
  
  try {
    // Check if clue store is available
    if (typeof window === 'undefined' || !(window as any).useClueStore) {
      console.error('❌ Clue store not available');
      return false;
    }
    
    const clueStore = (window as any).useClueStore.getState();
    
    // Test 1: Initialize sample data
    console.log('📋 Test 1: Initialize sample data');
    clueStore.initializeSampleData();
    
    const clues = clueStore.clues;
    const storyArcs = clueStore.storyArcs;
    
    console.log(`✅ Created ${clues.length} clues and ${storyArcs.length} story arcs`);
    
    // Test 2: Test clue discovery simulation
    console.log('📋 Test 2: Simulate clue discovery');
    
    if (typeof (window as any).triggerClueDiscovery === 'function') {
      const result = (window as any).triggerClueDiscovery('memory-cards', 'test-storylet', 'test-character');
      
      if (result) {
        console.log(`✅ Clue discovery successful: "${result.clue.title}"`);
        
        // Test notification system
        if (typeof (window as any).showClueNotification === 'function') {
          console.log('📋 Test 3: Show clue notification');
          (window as any).showClueNotification(result);
          console.log('✅ Notification triggered');
        } else {
          console.warn('⚠️ Clue notification function not available');
        }
      } else {
        console.log('ℹ️ No clue discovered (expected if no matching clues available)');
      }
    } else {
      console.error('❌ triggerClueDiscovery function not available');
      return false;
    }
    
    // Test 3: Test minigame types
    console.log('📋 Test 4: Check minigame associations');
    const memoryClues = clueStore.getCluesByMinigame('memory-cards');
    const wordClues = clueStore.getCluesByMinigame('word-scramble');
    const colorClues = clueStore.getCluesByMinigame('color-match');
    
    console.log(`✅ Memory game clues: ${memoryClues.length}`);
    console.log(`✅ Word scramble clues: ${wordClues.length}`);
    console.log(`✅ Color match clues: ${colorClues.length}`);
    
    // Test 4: Test story arc functionality
    console.log('📋 Test 5: Check story arc grouping');
    storyArcs.forEach(arc => {
      const arcClues = clueStore.getCluesByStoryArc(arc.id);
      console.log(`✅ Story arc "${arc.name}": ${arcClues.length} clues`);
    });
    
    // Test 5: Test discovery statistics
    console.log('📋 Test 6: Check discovery statistics');
    const stats = clueStore.getDiscoveryStats();
    console.log(`✅ Discovery stats: ${stats.discoveredClues}/${stats.totalClues} clues discovered (${stats.discoveryRate.toFixed(1)}%)`);
    
    console.log('🎉 Clue System Integration Test Complete!');
    return true;
    
  } catch (error) {
    console.error('❌ Clue system test failed:', error);
    return false;
  }
};

// Make function globally available for testing
if (typeof window !== 'undefined') {
  (window as any).testClueSystem = testClueSystem;
}