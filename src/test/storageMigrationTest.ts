// Test script for storage migration functionality
// Phase 2 migration testing

import { StorageMigrationService } from '../services/storage/StorageMigrationService';
import { LocalStorageAdapter } from '../services/storage/LocalStorageAdapter';
import { IndexedDBAdapter } from '../services/storage/IndexedDBAdapter';

export async function testStorageMigration() {
  console.log('🧪 Testing Storage Migration (Phase 2)');
  
  const migrationService = new StorageMigrationService();
  const localStorage = new LocalStorageAdapter();
  const indexedDB = new IndexedDBAdapter({
    dbName: 'TestContentStudioDB',
    storeName: 'test_backups',
    version: 1
  });

  try {
    // 1. Setup test data in localStorage
    console.log('\n1️⃣ Setting up test data in localStorage...');
    const testData = {
      content_backup_1: JSON.stringify({
        storylets: [{ id: 'test1', title: 'Test Storylet 1' }],
        timestamp: Date.now()
      }),
      studio_data: JSON.stringify({
        preferences: { theme: 'dark' },
        lastSaved: Date.now()
      }),
      content_backup_large: JSON.stringify({
        storylets: Array.from({ length: 100 }, (_, i) => ({
          id: `storylet_${i}`,
          title: `Generated Storylet ${i}`,
          content: `This is test content for storylet ${i}`.repeat(50)
        }))
      })
    };

    // Add test data to localStorage
    for (const [key, value] of Object.entries(testData)) {
      await localStorage.setItem(key, value);
    }
    console.log('✅ Test data added to localStorage');

    // 2. Test migration candidate detection
    console.log('\n2️⃣ Testing migration candidate detection...');
    const candidates = await migrationService.getMigrationCandidates();
    console.log(`Found ${candidates.length} migration candidates:`, candidates);

    // 3. Test dry run migration
    console.log('\n3️⃣ Testing dry run migration...');
    const dryRunResult = await migrationService.migrateFromLocalStorage({
      dryRun: true,
      onProgress: (progress) => {
        if (progress.percentage % 25 === 0) {
          console.log(`Dry run progress: ${progress.percentage}%`);
        }
      }
    });
    console.log('Dry run result:', {
      success: dryRunResult.success,
      total: dryRunResult.total,
      migrated: dryRunResult.migrated.length,
      failed: dryRunResult.failed.length
    });

    // 4. Test actual migration
    console.log('\n4️⃣ Testing actual migration...');
    await indexedDB.initialize();
    
    const migrationResult = await migrationService.migrateFromLocalStorage({
      validateData: true,
      batchSize: 2,
      onProgress: (progress) => {
        console.log(`Migration progress: ${progress.percentage}% (${progress.completed}/${progress.total})`);
      }
    });

    console.log('Migration result:', {
      success: migrationResult.success,
      migrated: migrationResult.migrated.length,
      failed: migrationResult.failed.length,
      errors: migrationResult.errors.length
    });

    if (migrationResult.errors.length > 0) {
      console.log('Errors:', migrationResult.errors);
    }

    // 5. Test verification
    console.log('\n5️⃣ Testing migration verification...');
    const verification = await migrationService.verifyMigration();
    console.log('Verification result:', {
      verified: verification.verified,
      missing: verification.missing.length,
      mismatches: verification.mismatches.length
    });

    if (!verification.verified) {
      console.log('Missing items:', verification.missing);
      console.log('Mismatched items:', verification.mismatches);
    }

    // 6. Test data integrity
    console.log('\n6️⃣ Testing data integrity...');
    for (const key of migrationResult.migrated) {
      const originalData = await localStorage.getItem(key);
      const migratedData = await indexedDB.getItem(key);
      
      if (originalData !== migratedData) {
        console.error(`❌ Data mismatch for key: ${key}`);
        return false;
      }
    }
    console.log('✅ Data integrity verified');

    // 7. Test storage info
    console.log('\n7️⃣ Testing storage information...');
    const localStorageInfo = await localStorage.getStorageInfo();
    const indexedDBInfo = await indexedDB.getStorageInfo();
    
    console.log('LocalStorage info:', {
      usage: `${Math.round(localStorageInfo.usage / 1024)}KB`,
      quota: `${Math.round(localStorageInfo.quota / 1024)}KB`,
      percentage: Math.round((localStorageInfo.usage / localStorageInfo.quota) * 100)
    });
    
    console.log('IndexedDB info:', {
      usage: `${Math.round(indexedDBInfo.usage / 1024)}KB`,
      quota: `${Math.round(indexedDBInfo.quota / 1024 / 1024)}MB`,
      percentage: Math.round((indexedDBInfo.usage / indexedDBInfo.quota) * 100)
    });

    // 8. Cleanup test data
    console.log('\n8️⃣ Cleaning up test data...');
    for (const key of Object.keys(testData)) {
      await localStorage.removeItem(key);
      await indexedDB.removeItem(key);
    }
    console.log('✅ Test data cleaned up');

    const allTestsPassed = 
      migrationResult.success &&
      verification.verified &&
      migrationResult.migrated.length >= 3 &&
      migrationResult.failed.length === 0;

    console.log(`\n✨ Storage Migration Test ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
    
    return {
      passed: allTestsPassed,
      results: {
        migration: migrationResult,
        verification,
        storageInfo: { localStorage: localStorageInfo, indexedDB: indexedDBInfo }
      },
      message: allTestsPassed ? 
        'Storage migration system working correctly!' :
        'Storage migration system has issues - check implementation'
    };

  } catch (error) {
    console.error('❌ Migration test failed with error:', error);
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Migration test failed with exception'
    };
  }
}

// Auto-run test if in browser
if (typeof window !== 'undefined') {
  console.log('Storage Migration Test loaded. Run testStorageMigration() to test.');
}