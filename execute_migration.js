// Execute Store Migration - Run this in browser console
// This will sync all data from legacy stores to V2 stores

console.log('🔄 Starting Store Migration Process...');

// Import the migration utility
import('./src/utils/storeMigration.js').then(module => {
  console.log('📦 Migration utility loaded');
  
  // Execute the migration
  const result = module.migrateFromLegacyStores();
  
  if (result.success) {
    console.log('✅ Migration completed successfully!');
    console.log('🔄 Validating migration...');
    
    // Validate the migration worked
    const validation = module.validateMigration();
    console.log('📊 Validation results:', validation);
    
    console.log('🎉 MIGRATION COMPLETE! Refresh the page to see changes.');
    alert('Store migration completed! Please refresh the page.');
  } else {
    console.error('❌ Migration failed:', result.error);
  }
}).catch(error => {
  console.error('❌ Failed to load migration utility:', error);
  
  // Fallback: Execute migration manually
  console.log('🔄 Attempting manual migration...');
  
  if (window.migrateStores) {
    window.migrateStores();
    console.log('✅ Manual migration executed');
  } else {
    console.log('⚠️ Migration functions not available. Try running:');
    console.log('migrateStores() in console after page loads');
  }
});
