// /Users/montysharma/V11M2/src/utils/clearAllData.ts
// Utility to completely clear all game data

export const clearAllGameData = () => {
  console.log('🧹 Clearing all game data...');
  
  // Clear localStorage keys used by Zustand persist
  const keysToRemove = [
    'storylet-store',
    'clue-store', 
    'character-store',
    'app-store',
    'save-store',
    'npc-store',
    'skill-system-v2-store',
    'integrated-character-store',
    'mmv-save-slots',
    'lifeSimulator_characters'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed localStorage key: ${key}`);
  });
  
  // Clear any additional localStorage items that might contain game data
  Object.keys(localStorage).forEach(key => {
    if (key.includes('storylet') || key.includes('clue') || key.includes('character') || 
        key.includes('npc') || key.includes('mmv') || key.includes('life') ||
        key.includes('save') || key.includes('skill')) {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed additional key: ${key}`);
    }
  });
  
  // Clear sessionStorage as well
  sessionStorage.clear();
  console.log('🗑️ Cleared sessionStorage');
  
  console.log('✅ All game data cleared from localStorage and sessionStorage');
  console.log('🔄 Refresh the page to start with completely clean state');
  
  return {
    success: true,
    message: 'All game data cleared. Refresh the page to start fresh.',
    clearedKeys: keysToRemove
  };
};

export const confirmClearAllData = () => {
  const confirmed = confirm(
    '⚠️ This will permanently delete ALL game data including:\n\n' +
    '• All storylets and story progress\n' +
    '• All characters and character progress\n' +
    '• All clues and discoveries\n' +
    '• All NPCs and relationships\n' +
    '• All save files\n' +
    '• All skill progress\n\n' +
    'This action cannot be undone. Continue?'
  );
  
  if (confirmed) {
    return clearAllGameData();
  } else {
    console.log('❌ Data clearing cancelled by user');
    return { success: false, message: 'Cancelled by user' };
  }
};

// Global function for easy access in development
if (typeof window !== 'undefined') {
  (window as any).clearAllGameData = clearAllGameData;
  (window as any).confirmClearAllData = confirmClearAllData;
  
  console.log('🧹 Data clearing utilities loaded:');
  console.log('   clearAllGameData() - Clear without confirmation');
  console.log('   confirmClearAllData() - Clear with confirmation dialog');
}