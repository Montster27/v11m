// Debug utility to check and fix clue connections in the Story Arc Visualizer
import { useClueStore } from '../store/useClueStore';
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';

export function debugClueConnections() {
  console.log('🔍 Debugging Clue Connections...');
  
  const clueStore = useClueStore.getState();
  const catalogStore = useStoryletCatalogStore.getState();
  
  // List all clues and their associations
  console.log('\n📋 Current Clues:');
  clueStore.clues.forEach(clue => {
    console.log(`Clue: "${clue.title}" (${clue.id})`);
    console.log(`  Story Arc: ${clue.storyArc}`);
    console.log(`  Associated Storylets: [${clue.associatedStorylets.join(', ')}]`);
    console.log(`  Positive Outcome: ${clue.positiveOutcomeStorylet || 'None'}`);
    console.log(`  Negative Outcome: ${clue.negativeOutcomeStorylet || 'None'}`);
    
    // Check if associated storylets exist
    clue.associatedStorylets.forEach(storyletId => {
      const storylet = catalogStore.allStorylets[storyletId];
      if (storylet) {
        console.log(`    ✅ Storylet "${storylet.name}" exists`);
      } else {
        console.log(`    ❌ Storylet "${storyletId}" NOT FOUND`);
      }
    });
    console.log('');
  });
  
  // List all storylets containing "eat" or "wake"
  console.log('\n📚 Storylets containing "eat" or "wake":');
  Object.values(catalogStore.allStorylets).forEach(storylet => {
    if (storylet.name.toLowerCase().includes('eat') || 
        storylet.name.toLowerCase().includes('wake') ||
        storylet.id.toLowerCase().includes('eat') || 
        storylet.id.toLowerCase().includes('wake')) {
      console.log(`  Storylet: "${storylet.name}" (${storylet.id}) - Arc: ${storylet.storyArc}`);
    }
  });
  
  return {
    clues: clueStore.clues,
    storylets: Object.values(catalogStore.allStorylets)
  };
}

export function fixClueEatAssociation(clueId: string, eatStoryletId: string) {
  console.log(`🔧 Fixing clue "${clueId}" to associate with "${eatStoryletId}"`);
  
  const clueStore = useClueStore.getState();
  const clue = clueStore.clues.find(c => c.id === clueId);
  
  if (!clue) {
    console.log(`❌ Clue "${clueId}" not found`);
    return;
  }
  
  // Update the clue to associate with the correct storylet
  clueStore.updateClue(clueId, {
    associatedStorylets: [eatStoryletId]
  });
  
  console.log(`✅ Updated clue "${clue.title}" to associate with "${eatStoryletId}"`);
}

export function findEatStorylets() {
  const catalogStore = useStoryletCatalogStore.getState();
  return Object.values(catalogStore.allStorylets).filter(storylet =>
    storylet.name.toLowerCase().includes('eat') || 
    storylet.id.toLowerCase().includes('eat')
  );
}

// Global functions for console access
if (typeof window !== 'undefined') {
  (window as any).debugClueConnections = debugClueConnections;
  (window as any).fixClueEatAssociation = fixClueEatAssociation;
  (window as any).findEatStorylets = findEatStorylets;
}