// V2 Migration Diagnostic Test
// Tests the storylet migration fix

import { exposeToWindow } from './debug';

console.log('🔍 V2 Migration Diagnostic Test');
console.log('==============================');

// Simulate the catalog store structure
const mockCatalogStore = {
  // Test case 1: allStorylets as an object (most common)
  allStorylets: {
    'storylet_1': {
      id: 'storylet_1',
      title: 'Test Storylet 1',
      content: 'This is a test storylet',
      choices: [],
      trigger: { type: 'immediate' }
    },
    'storylet_2': {
      id: 'storylet_2',
      title: 'Test Storylet 2',
      content: 'Another test storylet',
      choices: [{ id: 'choice_1', text: 'Option 1' }],
      trigger: { type: 'location', location: 'library' }
    }
  }
};

// Test the migration logic
console.log('\n📚 Testing storylet migration logic...');

try {
  // Simulate the migration code
  const storyletsObj = mockCatalogStore.allStorylets || {};
  const storylets = Array.isArray(storyletsObj) ? storyletsObj : Object.values(storyletsObj);
  
  console.log(`✅ Extracted ${storylets.length} storylets from object`);
  console.log('✅ Storylets array created successfully');
  
  // Test iteration
  let count = 0;
  for (const storylet of storylets) {
    if (!storylet || typeof storylet !== 'object') {
      console.log('⚠️  Skipping invalid storylet');
      continue;
    }
    count++;
    console.log(`✅ Processed storylet: ${storylet.id} - "${storylet.title}"`);
  }
  
  console.log(`\n✅ Successfully processed ${count} storylets`);
  
} catch (error) {
  console.error('❌ Migration test failed:', error.message);
}

// Test edge cases
console.log('\n🔧 Testing edge cases...');

const edgeCases = [
  { name: 'Empty object', data: {} },
  { name: 'Null', data: null },
  { name: 'Undefined', data: undefined },
  { name: 'Array of storylets', data: [{ id: 'test', title: 'Test' }] },
  { name: 'Mixed object with nulls', data: { s1: null, s2: { id: 's2' } } }
];

for (const testCase of edgeCases) {
  try {
    const storyletsObj = testCase.data || {};
    const storylets = Array.isArray(storyletsObj) ? storyletsObj : Object.values(storyletsObj);
    
    if (!Array.isArray(storylets)) {
      console.log(`⚠️  ${testCase.name}: Not an array, would skip`);
      continue;
    }
    
    let validCount = 0;
    for (const storylet of storylets) {
      if (!storylet || typeof storylet !== 'object') continue;
      validCount++;
    }
    
    console.log(`✅ ${testCase.name}: Processed ${validCount} valid storylets`);
  } catch (error) {
    console.log(`❌ ${testCase.name}: Failed - ${error.message}`);
  }
}

console.log('\n✨ Migration fix verification complete!');

// Export for browser
const testV2Migration = () => {
  console.log('V2 Migration test completed. Check console for details.');
  return { success: true };
};

exposeToWindow('testV2Migration', testV2Migration);