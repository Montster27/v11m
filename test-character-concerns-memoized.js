// Test script to validate the updated character concerns store with memoized flag generation
const { useCharacterConcernsStore } = require('./src/store/useCharacterConcernsStore.ts');

console.log('🧪 Testing Character Concerns Store with Memoized Flag Generation');
console.log('===============================================================');

// Test concerns data
const testConcerns = {
  academics: 25,
  socialFitting: 15,
  financial: 20,
  isolation: 10,
  genderIssues: 5,
  raceIssues: 0,
  classIssues: 8
};

// Get store instance
const store = useCharacterConcernsStore.getState();

console.log('\n1. Setting test concerns...');
store.setConcerns(testConcerns);

console.log('\n2. Testing flag generation (should use memoized version)...');
const flags1 = store.generateConcernFlags();
console.log('First flag generation complete. Flag count:', Object.keys(flags1).length);

console.log('\n3. Testing memoization (should be cached)...');
const flags2 = store.generateConcernFlags();
console.log('Second flag generation complete. Flag count:', Object.keys(flags2).length);

console.log('\n4. Sample custom concern flags:');
const customFlags = [
  'concern_academics_high',
  'concern_socialFitting_moderate', 
  'concern_financial_high',
  'socially_concerned',
  'academically_focused',
  'culturally_aware'
];

customFlags.forEach(flag => {
  console.log(`  ${flag}: ${flags1[flag] || false}`);
});

console.log('\n5. Testing cache management...');
const cacheStats = store.getFlagCacheStats();
console.log('Cache stats:', cacheStats);

console.log('\n6. Testing profile generation...');
const profile = store.getConcernsProfile();
console.log('Character profile:', profile);

console.log('\n7. Testing top concerns...');
const topConcerns = store.getTopConcerns();
console.log('Top concerns:', topConcerns);

console.log('\n8. Clearing cache...');
store.clearFlagCache();
console.log('Cache cleared');

console.log('\n✅ Character concerns store memoization integration test complete!');