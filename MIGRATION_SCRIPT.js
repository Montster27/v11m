// Migration script to copy data from old stores to new stores
// Run this in browser console to transfer existing data

console.log('🔄 Starting data migration from old stores to new stores...');

// First, let's check what data exists in old stores
const oldAppStore = localStorage.getItem('life-sim-store');
const newCoreStore = localStorage.getItem('mmv-core-game-store');

console.log('📦 Old store data:', oldAppStore ? JSON.parse(oldAppStore) : 'No data');
console.log('📦 New store data:', newCoreStore ? JSON.parse(newCoreStore) : 'No data');

// If we have old data but no new data, let's migrate
if (oldAppStore && !newCoreStore) {
  console.log('🔄 Migrating data from old store to new store...');
  
  // Use the built-in migration function
  if (window.useCoreGameStore) {
    window.useCoreGameStore.getState().migrateFromLegacyStores();
    console.log('✅ Migration completed using built-in function');
  } else {
    console.log('⚠️ New store not available, manual migration needed');
  }
} else if (newCoreStore) {
  console.log('✅ New store already has data');
} else {
  console.log('ℹ️ No data in either store - fresh start');
}

// Check the state after migration
setTimeout(() => {
  const coreState = window.useCoreGameStore?.getState();
  console.log('📊 Current Core Game Store state:', {
    level: coreState?.player?.level,
    experience: coreState?.player?.experience,
    day: coreState?.world?.day,
    character: coreState?.character?.name
  });
}, 100);
