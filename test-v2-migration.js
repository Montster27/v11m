// Quick test script to verify V2 story arc migration
// Run this in the browser console after the app loads

console.log('🧪 Testing V2 Story Arc Migration...');

// Test 1: Check if StoryArcManager is accessible
if (typeof window.storyArcManager === 'undefined') {
  console.warn('⚠️ StoryArcManager not found on window');
} else {
  console.log('✅ StoryArcManager found');
}

// Test 2: Check V2 stores
const narrativeStore = window.useNarrativeStore;
const socialStore = window.useSocialStore;

if (!narrativeStore) {
  console.warn('⚠️ Narrative store not found');
} else {
  console.log('✅ Narrative store found');
}

if (!socialStore) {
  console.warn('⚠️ Social store not found');
} else {
  console.log('✅ Social store found');
}

// Test 3: Try to create a test arc
try {
  const testArcId = window.storyArcManager.createArc({
    name: 'Test Migration Arc',
    description: 'Testing V2 migration functionality',
    progress: 0,
    isCompleted: false
  });
  console.log('✅ Successfully created test arc:', testArcId);
  
  // Test clue assignment
  window.storyArcManager.assignClueToArc('test-clue-id', testArcId, 1);
  console.log('✅ Successfully assigned clue to arc');
  
  // Test arc statistics
  const stats = window.storyArcManager.getArcStatistics(testArcId);
  console.log('✅ Arc statistics:', stats);
  
  // Test arc validation
  const validation = window.storyArcManager.validateArc(testArcId);
  console.log('✅ Arc validation:', validation);
  
  // Clean up test arc
  window.storyArcManager.deleteArc(testArcId);
  console.log('✅ Successfully deleted test arc');
  
} catch (error) {
  console.error('❌ Test arc creation failed:', error);
}

// Test 4: Try to restore sample arcs
if (typeof window.restoreAllSampleArcs === 'function') {
  try {
    const sampleArcs = window.restoreAllSampleArcs();
    console.log('✅ Sample arcs restored:', sampleArcs.length);
    
    // Verify integrity
    const integrity = window.verifyArcDataIntegrity();
    console.log('✅ Arc data integrity:', integrity);
    
  } catch (error) {
    console.error('❌ Sample arc restoration failed:', error);
  }
} else {
  console.warn('⚠️ restoreAllSampleArcs function not found');
}

console.log('🎉 V2 Story Arc Migration Test Complete!');