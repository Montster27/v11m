// /Users/montysharma/V11M2/src/utils/preRefactorBackup.ts
// Comprehensive backup of all 17+ persistence mechanisms

const createCompleteBackup = () => {
  console.log('🔄 Creating complete backup of all 17+ persistence mechanisms...');
  
  // Backup all 12+ Zustand stores
  const zustandStores = {
    appStore: (window as any).useAppStore?.getState() || null,
    storyletStore: (window as any).useStoryletStore?.getState() || null,
    storyletCatalogStore: (window as any).useStoryletCatalogStore?.getState() || null,
    clueStore: (window as any).useClueStore?.getState() || null,
    characterStore: (window as any).useCharacterStore?.getState() || null,
    saveStore: (window as any).useSaveStore?.getState() || null,
    npcStore: (window as any).useNPCStore?.getState() || null,
    skillSystemStore: (window as any).useSkillSystemStore?.getState() || null,
    integratedCharacterStore: (window as any).useIntegratedCharacterStore?.getState() || null,
    coreGameStore: (window as any).useCoreGameStore?.getState() || null,
    narrativeStore: (window as any).useNarrativeStore?.getState() || null,
    socialStore: (window as any).useSocialStore?.getState() || null
  };

  // Direct localStorage keys (character creation, saves, etc)
  const directLocalStorage = {};
  const knownKeys = [
    'storylet-store',
    'clue-store', 
    'character-store',
    'app-store',
    'save-store',
    'npc-store',
    'skill-system-v2-store',
    'integrated-character-store',
    'mmv-save-slots',
    'lifeSimulator_characters',
    'core-game-store-v2',
    'narrative-store-v2',
    'social-store-v2'
  ];
  
  knownKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      (directLocalStorage as any)[key] = value;
    }
  });

  // Migration data (existing backups)
  const migrationData = {};
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('content_backup_') || 
        key.startsWith('refactor-backup-') ||
        key.startsWith('mmv-pre-refactor-backup')) {
      const value = localStorage.getItem(key);
      if (value) {
        (migrationData as any)[key] = value;
      }
    }
  });

  // Complete backup structure
  const backup = {
    timestamp: Date.now(),
    zustandStores,
    directLocalStorage,
    migrationData,
    metadata: {
      totalStores: Object.keys(zustandStores).filter(key => zustandStores[key]).length,
      totalLocalStorageKeys: Object.keys(directLocalStorage).length,
      totalMigrationData: Object.keys(migrationData).length,
      version: '1.0',
      phase: 'pre-refactor'
    }
  };
  
  // Save to localStorage with specific key
  localStorage.setItem('mmv-pre-refactor-backup', JSON.stringify(backup));
  
  console.log('✅ Complete backup saved to localStorage');
  console.log('📊 Backup metadata:', backup.metadata);
  
  return backup;
};

// Global function for easy access
if (typeof window !== 'undefined') {
  (window as any).createCompleteBackup = createCompleteBackup;
  console.log('🛡️ Pre-refactor backup utility loaded: createCompleteBackup()');
}

export { createCompleteBackup };