// /Users/montysharma/V11M2/src/utils/legacyCleanup.ts
// Legacy store cleanup utilities

export const identifyLegacyStores = () => {
  console.log('🔍 Identifying legacy stores for cleanup...');
  
  const legacyStores = [
    'useAppStore',
    'useStoryletStore',
    'useStoryletCatalogStore',
    'useClueStore',
    'useCharacterStore',
    'useSaveStore',
    'useNPCStore',
    'useSkillSystemV2Store',
    'useIntegratedCharacterStore'
  ];

  const foundStores = legacyStores.filter(storeName => {
    return (window as any)[storeName] !== undefined;
  });

  const legacyLocalStorageKeys = [
    'storylet-store',
    'clue-store',
    'character-store',
    'app-store',
    'save-store',
    'npc-store',
    'skill-system-v2-store',
    'integrated-character-store'
  ];

  const foundKeys = legacyLocalStorageKeys.filter(key => {
    return localStorage.getItem(key) !== null;
  });

  console.log('📊 Legacy cleanup assessment:');
  console.log('  Legacy stores found:', foundStores.length);
  console.log('  Legacy localStorage keys:', foundKeys.length);
  
  return {
    legacyStores: foundStores,
    legacyKeys: foundKeys,
    totalLegacyItems: foundStores.length + foundKeys.length
  };
};

export const performLegacyCleanup = () => {
  console.log('🧹 Performing legacy store cleanup...');
  
  const assessment = identifyLegacyStores();
  
  // Clear legacy localStorage keys
  assessment.legacyKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed legacy localStorage key: ${key}`);
  });

  // Note: We can't actually delete the store definitions as they might be imported
  // But we can clear their state and mark them as deprecated
  assessment.legacyStores.forEach(storeName => {
    try {
      const store = (window as any)[storeName];
      if (store && typeof store.getState === 'function') {
        console.log(`⚠️ Legacy store ${storeName} still exists (imported somewhere)`);
      }
    } catch (error) {
      console.log(`✅ Legacy store ${storeName} not accessible`);
    }
  });

  console.log('✅ Legacy cleanup completed');
  console.log(`📊 Cleaned ${assessment.legacyKeys.length} localStorage keys`);
  
  return {
    keysRemoved: assessment.legacyKeys.length,
    storesFound: assessment.legacyStores.length,
    success: true
  };
};

export const validateLegacyCleanup = () => {
  console.log('🔍 Validating legacy cleanup...');
  
  const postCleanupAssessment = identifyLegacyStores();
  
  const validation = {
    legacyKeysRemaining: postCleanupAssessment.legacyKeys.length,
    legacyStoresRemaining: postCleanupAssessment.legacyStores.length,
    cleanupComplete: postCleanupAssessment.legacyKeys.length === 0
  };

  if (validation.cleanupComplete) {
    console.log('✅ Legacy cleanup validation passed');
  } else {
    console.log('⚠️ Legacy cleanup validation found remaining items');
    console.log('  Remaining keys:', postCleanupAssessment.legacyKeys);
  }

  return validation;
};

// Global functions for easy access
if (typeof window !== 'undefined') {
  (window as any).identifyLegacyStores = identifyLegacyStores;
  (window as any).performLegacyCleanup = performLegacyCleanup;
  (window as any).validateLegacyCleanup = validateLegacyCleanup;
  
  console.log('🧹 Legacy cleanup utilities loaded');
  console.log('   identifyLegacyStores() - Identify legacy items');
  console.log('   performLegacyCleanup() - Remove legacy localStorage');
  console.log('   validateLegacyCleanup() - Validate cleanup success');
}