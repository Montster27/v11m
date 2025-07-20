// Cleanup test data from narrative store

import { useNarrativeStore } from '../stores/v2/useNarrativeStore';

export const cleanupTestData = () => {
  console.log('🧹 Cleaning up test data...');
  
  const narrativeStore = useNarrativeStore.getState();
  const { storyArcs, deleteArc } = narrativeStore;
  
  // Find and remove test arcs
  const testArcs = Object.values(storyArcs).filter(arc => 
    arc.name.startsWith('Test Arc')
  );
  
  console.log(`Found ${testArcs.length} test arc(s) to remove`);
  
  testArcs.forEach(arc => {
    console.log(`Removing test arc: ${arc.name}`);
    deleteArc(arc.id);
  });
  
  // Force save
  import('../utils/debouncedStorage').then(({ debouncedStorage }) => {
    debouncedStorage.flush();
    console.log('✅ Test data cleaned up and saved');
  });
};

// Expose to window
if (typeof window !== 'undefined') {
  (window as any).cleanupTestData = cleanupTestData;
}