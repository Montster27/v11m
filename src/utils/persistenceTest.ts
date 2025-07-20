// Simple test to verify persistence is working
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { debouncedStorage } from './debouncedStorage';

export const testArcPersistence = async () => {
  console.log('🧪 Testing Arc Persistence');
  
  // Step 1: Check initial state
  const initialStore = useNarrativeStore.getState();
  console.log('1. Initial arcs:', Object.keys(initialStore.storyArcs).length);
  console.log('1. Store hydrated:', initialStore._hasHydrated);
  
  // Step 2: Create a test arc
  const testArcName = `Test Arc ${Date.now()}`;
  console.log('2. Creating test arc:', testArcName);
  
  const arcId = initialStore.createArc({
    name: testArcName,
    description: 'Test arc for persistence',
    progress: 0,
    isCompleted: false,
    failures: 0
  });
  
  console.log('2. Arc created with ID:', arcId);
  
  // Step 3: Verify arc was created in store
  const afterCreateStore = useNarrativeStore.getState();
  console.log('3. Arcs after create:', Object.keys(afterCreateStore.storyArcs).length);
  console.log('3. Arc exists in store:', !!afterCreateStore.storyArcs[arcId]);
  
  // Step 4: Force save to localStorage
  console.log('4. Forcing save to localStorage...');
  debouncedStorage.flush();
  
  // Step 5: Check localStorage directly
  await new Promise(resolve => setTimeout(resolve, 100)); // Wait for save
  
  const narrativeData = localStorage.getItem('mmv-narrative-store');
  if (narrativeData) {
    try {
      const parsed = JSON.parse(narrativeData);
      const savedArcs = parsed.state?.storyArcs || {};
      console.log('5. Arcs in localStorage:', Object.keys(savedArcs).length);
      console.log('5. Test arc in localStorage:', !!savedArcs[arcId]);
      
      if (savedArcs[arcId]) {
        console.log('✅ Arc persistence test PASSED');
        return true;
      } else {
        console.log('❌ Arc persistence test FAILED - arc not in localStorage');
        return false;
      }
    } catch (e) {
      console.log('❌ Arc persistence test FAILED - localStorage parse error:', e);
      return false;
    }
  } else {
    console.log('❌ Arc persistence test FAILED - no narrative data in localStorage');
    return false;
  }
};

// Expose to window
if (typeof window !== 'undefined') {
  (window as any).testArcPersistence = testArcPersistence;
}