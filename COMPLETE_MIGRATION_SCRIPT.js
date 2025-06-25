// Complete migration script
// File: /Users/montysharma/V11M2/COMPLETE_MIGRATION_SCRIPT.js

console.log('🔄 Starting complete store migration...');

// Step 1: Run existing migration utilities
if (window.migrateStores) {
  window.migrateStores();
} else {
  console.log('⚠️ Migration utilities not loaded, importing...');
  import('./src/utils/storeMigration.js').then(module => {
    module.migrateFromLegacyStores();
  });
}

// Step 2: Validate migration
if (window.validateMigration) {
  window.validateMigration();
}

// Step 3: Update all components to use v2 stores
const componentsToUpdate = [
  'src/components/Navigation.tsx',
  'src/pages/Planner.tsx', 
  'src/hooks/useAutoSave.ts',
  'src/components/SaveManager.tsx'
];

console.log('📝 Components that need updating:', componentsToUpdate);
console.log('🔧 Update these components to import from stores/v2 instead of store/');

// Step 4: Clean up old stores after validation
console.log('🧹 After validation, remove old store files:');
console.log('- src/store/useAppStore.ts');
console.log('- src/store/useStoryletStore.ts');
console.log('- Update App.tsx imports');
