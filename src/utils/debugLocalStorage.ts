// Debug localStorage to see what's actually being saved

export const debugLocalStorage = () => {
  console.log('🔍 Debugging localStorage...');
  
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  console.log('📦 All localStorage keys:', keys);
  
  // Check narrative store specifically
  const narrativeKey = 'mmv-narrative-store';
  const narrativeData = localStorage.getItem(narrativeKey);
  
  if (narrativeData) {
    try {
      const parsed = JSON.parse(narrativeData);
      console.log('📖 Narrative store data:');
      console.log('  - Version:', parsed.state?.version || 'none');
      console.log('  - Story Arcs:', Object.keys(parsed.state?.storyArcs || {}).length, 'arcs');
      console.log('  - Clues:', Object.keys(parsed.state?.clues || {}).length, 'clues');
      console.log('  - Storylets:', parsed.state?.storylets?.userCreated?.length || 0, 'user storylets');
      
      // Show actual arcs
      const arcs = parsed.state?.storyArcs || {};
      Object.values(arcs).forEach((arc: any) => {
        console.log(`    Arc: "${arc.name}" (${arc.id})`);
      });
      
      return parsed;
    } catch (e) {
      console.error('❌ Failed to parse narrative data:', e);
    }
  } else {
    console.log('❌ No narrative data found in localStorage');
  }
  
  return null;
};

// Backup current data
export const backupNarrativeData = () => {
  const data = localStorage.getItem('mmv-narrative-store');
  if (data) {
    const backup = `mmv-narrative-backup-${Date.now()}`;
    localStorage.setItem(backup, data);
    console.log(`✅ Backed up to ${backup}`);
    return backup;
  }
  return null;
};

// Restore from backup
export const restoreNarrativeData = (backupKey: string) => {
  const backup = localStorage.getItem(backupKey);
  if (backup) {
    localStorage.setItem('mmv-narrative-store', backup);
    console.log(`✅ Restored from ${backupKey}`);
    // Force reload stores
    window.location.reload();
  } else {
    console.error(`❌ Backup ${backupKey} not found`);
  }
};

// List all backups
export const listBackups = () => {
  const backups = Object.keys(localStorage)
    .filter(key => key.startsWith('mmv-narrative-backup-'))
    .sort();
  console.log('📦 Available backups:', backups);
  return backups;
};

// Expose to window
if (typeof window !== 'undefined') {
  (window as any).debugLocalStorage = debugLocalStorage;
  (window as any).backupNarrativeData = backupNarrativeData;
  (window as any).restoreNarrativeData = restoreNarrativeData;
  (window as any).listBackups = listBackups;
}