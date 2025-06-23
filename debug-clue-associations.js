// Debug script to check and fix clue associations
// Run this in the browser console to debug clue connection issues

console.log('🔍 Debugging Clue Associations...');

// Get current stores
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
  console.log('');
});

// List all storylets and look for ones with "eat" or "wake" in name/id
console.log('\n📚 Storylets containing "eat" or "wake":');
Object.values(catalogStore.allStorylets).forEach(storylet => {
  if (storylet.name.toLowerCase().includes('eat') || 
      storylet.name.toLowerCase().includes('wake') ||
      storylet.id.toLowerCase().includes('eat') || 
      storylet.id.toLowerCase().includes('wake')) {
    console.log(`Storylet: "${storylet.name}" (${storylet.id}) - Arc: ${storylet.storyArc}`);
  }
});

// Check for clues that should be associated with "eat" but aren't
console.log('\n🔧 Checking for mismatched associations...');
const eatStorylets = Object.values(catalogStore.allStorylets).filter(s => 
  s.name.toLowerCase().includes('eat') || s.id.toLowerCase().includes('eat')
);

const wakeStorylets = Object.values(catalogStore.allStorylets).filter(s => 
  s.name.toLowerCase().includes('wake') || s.id.toLowerCase().includes('wake')
);

console.log(`Found ${eatStorylets.length} "eat" storylets:`, eatStorylets.map(s => s.id));
console.log(`Found ${wakeStorylets.length} "wake" storylets:`, wakeStorylets.map(s => s.id));

// Function to fix clue associations if needed
window.fixClueAssociations = function() {
  console.log('🔧 Fixing clue associations...');
  
  clueStore.clues.forEach(clue => {
    // If clue is associated with "wake" but should be with "eat"
    if (clue.associatedStorylets.includes('wake') && eatStorylets.length > 0) {
      console.log(`Fixing clue "${clue.title}" - moving from wake to eat`);
      const updatedAssociations = clue.associatedStorylets.map(id => 
        id === 'wake' ? eatStorylets[0].id : id
      );
      clueStore.updateClue(clue.id, {
        associatedStorylets: updatedAssociations
      });
    }
  });
  
  console.log('✅ Clue associations fixed!');
};

console.log('\n💡 To fix associations, run: fixClueAssociations()');