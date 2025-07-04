// localStorage Backup Script - Run in Browser Console Before Migration
// This script backs up all localStorage data related to the game

console.log('🔄 Starting localStorage backup...');

// Create backup object
const backup = {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  gameStores: {},
  allData: {}
};

// Game-specific store keys
const gameStoreKeys = [
  'mmv-core-game-store',
  'mmv-narrative-store', 
  'mmv-social-store',
  'life-sim-store',
  'storylet-store',
  'character-concerns-store',
  'clue-store',
  'save-store',
  'npc-store',
  'app-store'
];

// Backup all localStorage
console.log('📦 Backing up all localStorage data...');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  backup.allData[key] = localStorage.getItem(key);
}

// Backup specific game stores
console.log('🎮 Backing up game-specific stores...');
gameStoreKeys.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    backup.gameStores[key] = data;
    console.log(`✅ Backed up: ${key} (${data.length} chars)`);
  } else {
    console.log(`⚪ Not found: ${key}`);
  }
});

// Display results
console.log('\n🎯 BACKUP SUMMARY:');
console.log(`Total localStorage items: ${localStorage.length}`);
console.log(`Game stores found: ${Object.keys(backup.gameStores).length}`);
console.log(`Backup size: ${JSON.stringify(backup).length} characters`);

// Show the backup data
console.log('\n📋 COPY THIS BACKUP DATA:');
console.log('=' * 50);
console.log(JSON.stringify(backup, null, 2));
console.log('=' * 50);

// Provide restore instructions
console.log('\n🔧 TO RESTORE THIS BACKUP:');
console.log('1. Copy the backup data above');
console.log('2. Run: restoreBackup = <paste backup data here>');
console.log('3. Run: Object.entries(restoreBackup.gameStores).forEach(([key, value]) => localStorage.setItem(key, value))');

// Return backup object for programmatic access
window.gameBackup = backup;
console.log('\n✅ Backup complete! Data also saved to window.gameBackup');

return backup;