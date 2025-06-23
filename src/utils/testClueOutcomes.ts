// Test utility for creating clues with outcome storylets in the Main Story arc
import { useClueStore } from '../store/useClueStore';
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';

export function createTestClueOutcomes() {
  const clueStore = useClueStore.getState();
  const catalogStore = useStoryletCatalogStore.getState();
  
  console.log('🧪 Creating test clue with outcomes for Main Story arc...');
  
  // Get existing storylets in Main Story arc
  const mainStoryStorylets = catalogStore.getStoryletsForArc('Main Story');
  console.log('📋 Found storylets in Main Story:', mainStoryStorylets.map(s => ({ id: s.id, name: s.name })));
  
  if (mainStoryStorylets.length < 3) {
    console.log('❌ Need at least 3 storylets in Main Story arc to create test clue');
    return;
  }
  
  // Use the first storylet as the trigger, and 2nd/3rd as outcomes
  const triggerStorylet = mainStoryStorylets[0];
  const positiveOutcome = mainStoryStorylets[1];
  const negativeOutcome = mainStoryStorylets[2];
  
  // Create a test clue with outcome storylets
  const testClue = clueStore.createClue({
    id: 'test-clue-with-outcomes',
    title: 'Test Clue with Outcomes',
    description: 'A test clue that demonstrates outcome connections',
    content: 'This clue shows how positive and negative outcomes work in the visualizer.',
    category: 'mystery',
    difficulty: 'medium',
    storyArc: 'Main Story',
    arcOrder: 1,
    minigameTypes: ['memory-cards'],
    associatedStorylets: [triggerStorylet.id],
    positiveOutcomeStorylet: positiveOutcome.id,
    negativeOutcomeStorylet: negativeOutcome.id,
    tags: ['test', 'outcomes'],
    rarity: 'common'
  });
  
  console.log('✅ Created test clue:', {
    id: testClue.id,
    title: testClue.title,
    associatedStorylets: testClue.associatedStorylets,
    positiveOutcome: testClue.positiveOutcomeStorylet,
    negativeOutcome: testClue.negativeOutcomeStorylet
  });
  
  console.log('🎯 Test clue should create connections:');
  console.log(`   ${triggerStorylet.name} --> ${positiveOutcome.name} (green)`);
  console.log(`   ${triggerStorylet.name} --> ${negativeOutcome.name} (red)`);
  
  return testClue;
}

export function removeTestClueOutcomes() {
  const clueStore = useClueStore.getState();
  clueStore.deleteClue('test-clue-with-outcomes');
  console.log('🧹 Removed test clue with outcomes');
}

// Global functions for console access
if (typeof window !== 'undefined') {
  (window as any).createTestClueOutcomes = createTestClueOutcomes;
  (window as any).removeTestClueOutcomes = removeTestClueOutcomes;
}