// Test utility to verify persistence is working
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
import { useSocialStore } from '../stores/v2/useSocialStore';
import { debouncedStorage } from './debouncedStorage';

export const testPersistence = () => {
  console.log('🧪 Testing persistence...');
  
  // Check localStorage keys
  const keys = Object.keys(localStorage);
  console.log('📦 localStorage keys:', keys);
  
  // Check narrative store
  const narrativeStore = useNarrativeStore.getState();
  console.log('📖 Narrative store - clues:', narrativeStore.clues);
  console.log('📖 Narrative store - arcs:', narrativeStore.storyArcs);
  
  // Check social store
  const socialStore = useSocialStore.getState();
  console.log('🤝 Social store:', socialStore);
  
  // Don't create test data - just check what's there
  console.log('Current clues:', Object.keys(narrativeStore.clues).length);
  console.log('Current arcs:', Object.keys(narrativeStore.storyArcs).length);
  
  // Force flush
  console.log('Flushing storage...');
  debouncedStorage.flush();
  
  // Check localStorage directly
  setTimeout(() => {
    const narrativeData = localStorage.getItem('mmv-narrative-store');
    console.log('📦 Raw narrative localStorage:', narrativeData);
    
    if (narrativeData) {
      try {
        const parsed = JSON.parse(narrativeData);
        console.log('✅ Parsed narrative data:', parsed);
      } catch (e) {
        console.error('❌ Failed to parse narrative data:', e);
      }
    } else {
      console.error('❌ No narrative data in localStorage!');
    }
  }, 100);
  
  return { narrativeStore, socialStore };
};

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testPersistence = testPersistence;
}