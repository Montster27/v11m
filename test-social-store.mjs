
import { useSocialStore } from '../src/stores/v2/useSocialStore.js';

console.log('Testing social store...');
const socialStore = useSocialStore.getState();

console.log('Initial relationships:', Object.keys(socialStore.npcs.relationships));
console.log('Initial interaction history:', Object.keys(socialStore.npcs.interactionHistory));

// Add some relationships
socialStore.updateRelationship('npc-0', 10);
socialStore.updateRelationship('npc-1', 15);

console.log('After adding 2 NPCs:');
console.log('Relationships:', Object.keys(socialStore.npcs.relationships));
console.log('Interaction history:', Object.keys(socialStore.npcs.interactionHistory));
