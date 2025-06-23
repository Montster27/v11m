// /Users/montysharma/V11M2/src/utils/refactorBackup.ts
// Comprehensive backup system for persistence refactoring

export interface RefactorBackup {
  timestamp: string;
  version: string;
  stores: {
    appStore: any;
    storyletStore: any;
    storyletCatalogStore: any;
    clueStore: any;
    characterStore: any;
    saveStore: any;
    npcStore: any;
    skillSystemStore: any;
    integratedCharacterStore: any;
  };
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
}

export const createComprehensiveBackup = (): RefactorBackup => {
  console.log('🔄 Creating comprehensive pre-refactor backup...');
  
  // Collect all store states
  const stores = {
    appStore: (window as any).useAppStore?.getState() || null,
    storyletStore: (window as any).useStoryletStore?.getState() || null,
    storyletCatalogStore: (window as any).useStoryletCatalogStore?.getState() || null,
    clueStore: (window as any).useClueStore?.getState() || null,
    characterStore: (window as any).useCharacterStore?.getState() || null,
    saveStore: (window as any).useSaveStore?.getState() || null,
    npcStore: (window as any).useNPCStore?.getState() || null,
    skillSystemStore: (window as any).useSkillSystemStore?.getState() || null,
    integratedCharacterStore: (window as any).useIntegratedCharacterStore?.getState() || null,
  };

  // Collect all localStorage data
  const localStorageData: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      localStorageData[key] = localStorage.getItem(key) || '';
    }
  }

  // Collect all sessionStorage data
  const sessionStorageData: Record<string, string> = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key) {
      sessionStorageData[key] = sessionStorage.getItem(key) || '';
    }
  }

  const backup: RefactorBackup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    stores,
    localStorage: localStorageData,
    sessionStorage: sessionStorageData
  };

  return backup;
};

export const saveBackupToFile = (backup: RefactorBackup): void => {
  try {
    const backupJson = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `persistence-backup-${backup.timestamp.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Backup file saved successfully');
  } catch (error) {
    console.error('❌ Failed to save backup file:', error);
  }
};

export const saveBackupToLocalStorage = (backup: RefactorBackup): void => {
  try {
    const backupKey = `refactor-backup-${backup.timestamp}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    // Keep only the last 3 refactor backups
    const allBackupKeys = Object.keys(localStorage).filter(key => key.startsWith('refactor-backup-'));
    if (allBackupKeys.length > 3) {
      allBackupKeys.sort().slice(0, -3).forEach(key => localStorage.removeItem(key));
    }
    
    console.log('✅ Backup saved to localStorage:', backupKey);
  } catch (error) {
    console.error('❌ Failed to save backup to localStorage:', error);
  }
};

export const createAndSaveBackup = (): void => {
  const backup = createComprehensiveBackup();
  saveBackupToLocalStorage(backup);
  saveBackupToFile(backup);
  
  console.log('🛡️ Comprehensive backup complete');
  console.log('📊 Backup includes:', Object.keys(backup.stores).filter(key => backup.stores[key]).length, 'stores');
  console.log('💾 LocalStorage items:', Object.keys(backup.localStorage).length);
  console.log('📝 SessionStorage items:', Object.keys(backup.sessionStorage).length);
};

// Global function for easy access
if (typeof window !== 'undefined') {
  (window as any).createRefactorBackup = createAndSaveBackup;
  console.log('🛡️ Refactor backup utility loaded: createRefactorBackup()');
}