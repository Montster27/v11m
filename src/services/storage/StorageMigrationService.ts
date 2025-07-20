// Storage Migration Service - handles seamless migration from localStorage to IndexedDB
// Ensures no data loss during transition

import { LocalStorageAdapter } from './LocalStorageAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { StorageAdapter } from './StorageAdapter';

export interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  currentKey?: string;
  percentage: number;
}

export interface MigrationResult {
  success: boolean;
  migrated: string[];
  failed: string[];
  total: number;
  errors: Array<{
    key: string;
    error: string;
  }>;
}

export interface MigrationOptions {
  includePatterns?: string[]; // Keys to include (default: backup and studio data)
  excludePatterns?: string[]; // Keys to exclude
  batchSize?: number; // Number of items to migrate per batch
  onProgress?: (progress: MigrationProgress) => void;
  validateData?: boolean; // Whether to validate JSON data before migration
  dryRun?: boolean; // Test migration without actually moving data
}

export class StorageMigrationService {
  private localStorage: LocalStorageAdapter;
  private indexedDB: IndexedDBAdapter;

  constructor() {
    this.localStorage = new LocalStorageAdapter();
    this.indexedDB = new IndexedDBAdapter({
      dbName: 'ContentStudioDB',
      storeName: 'backups',
      version: 1
    });
  }

  /**
   * Check if migration is needed
   */
  async shouldMigrate(): Promise<boolean> {
    // Check if already migrated
    if (localStorage.getItem('storage_migrated') === 'true') {
      return false;
    }

    // Check if IndexedDB is available
    if (!IndexedDBAdapter.isAvailable()) {
      return false;
    }

    // Check if there's significant data in localStorage
    try {
      const info = await this.localStorage.getStorageInfo();
      // Recommend migration if using more than 1MB or 20% of quota
      return info.usage > 1024 * 1024 || info.usage > (info.quota * 0.2);
    } catch {
      return false;
    }
  }

  /**
   * Get migration candidates from localStorage
   */
  async getMigrationCandidates(options: MigrationOptions = {}): Promise<string[]> {
    const {
      includePatterns = [
        'content_backup_',
        'studio_data',
        'arc_visualizer_',
        'storylet_',
        'clue_',
        'npc_'
      ],
      excludePatterns = [
        'debug_',
        'temp_',
        'cache_'
      ]
    } = options;

    try {
      const allKeys = await this.localStorage.getKeys();
      
      return allKeys.filter(key => {
        // Check include patterns
        const included = includePatterns.some(pattern => key.includes(pattern));
        if (!included) return false;

        // Check exclude patterns
        const excluded = excludePatterns.some(pattern => key.includes(pattern));
        return !excluded;
      });
    } catch (error) {
      console.error('Failed to get migration candidates:', error);
      return [];
    }
  }

  /**
   * Validate that a piece of data can be migrated
   */
  private async validateMigrationData(key: string, data: string): Promise<boolean> {
    try {
      // Check if it's valid JSON
      JSON.parse(data);
      
      // Check if data is not too large (IndexedDB can handle much more than localStorage)
      if (data.length > 50 * 1024 * 1024) { // 50MB limit per item
        console.warn(`Data for key ${key} is very large (${data.length} bytes)`);
        return false;
      }

      return true;
    } catch {
      console.warn(`Invalid data format for key: ${key}`);
      return false;
    }
  }

  /**
   * Migrate a single item from localStorage to IndexedDB
   */
  private async migrateItem(key: string, validateData = true): Promise<boolean> {
    try {
      const data = await this.localStorage.getItem(key);
      if (!data) {
        return false; // Item doesn't exist
      }

      // Validate data if requested
      if (validateData && !(await this.validateMigrationData(key, data))) {
        return false;
      }

      // Store in IndexedDB
      await this.indexedDB.setItem(key, data);
      
      return true;
    } catch (error) {
      console.error(`Failed to migrate item ${key}:`, error);
      return false;
    }
  }

  /**
   * Perform the actual migration
   */
  async migrateFromLocalStorage(options: MigrationOptions = {}): Promise<MigrationResult> {
    const {
      batchSize = 10,
      onProgress,
      validateData = true,
      dryRun = false
    } = options;

    console.log('🚚 Starting storage migration from localStorage to IndexedDB...');

    const result: MigrationResult = {
      success: false,
      migrated: [],
      failed: [],
      total: 0,
      errors: []
    };

    try {
      // Initialize IndexedDB
      if (!dryRun) {
        await this.indexedDB.initialize();
        console.log('✅ IndexedDB initialized successfully');
      }

      // Get all candidate keys
      const candidateKeys = await this.getMigrationCandidates(options);
      result.total = candidateKeys.length;

      console.log(`📋 Found ${candidateKeys.length} items to migrate`);

      if (candidateKeys.length === 0) {
        result.success = true;
        return result;
      }

      // Migrate in batches
      for (let i = 0; i < candidateKeys.length; i += batchSize) {
        const batch = candidateKeys.slice(i, i + batchSize);
        
        for (const key of batch) {
          try {
            const progress: MigrationProgress = {
              total: result.total,
              completed: result.migrated.length,
              failed: result.failed.length,
              currentKey: key,
              percentage: Math.round((result.migrated.length / result.total) * 100)
            };

            if (onProgress) {
              onProgress(progress);
            }

            if (dryRun) {
              // Just validate, don't actually migrate
              const data = await this.localStorage.getItem(key);
              if (data && (!validateData || await this.validateMigrationData(key, data))) {
                result.migrated.push(key);
              } else {
                result.failed.push(key);
                result.errors.push({
                  key,
                  error: 'Data validation failed'
                });
              }
            } else {
              // Actually migrate the item
              const success = await this.migrateItem(key, validateData);
              if (success) {
                result.migrated.push(key);
                console.log(`✅ Migrated: ${key}`);
              } else {
                result.failed.push(key);
                result.errors.push({
                  key,
                  error: 'Migration failed'
                });
                console.warn(`❌ Failed to migrate: ${key}`);
              }
            }
          } catch (error) {
            result.failed.push(key);
            result.errors.push({
              key,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error(`❌ Error migrating ${key}:`, error);
          }
        }

        // Small delay between batches to avoid blocking UI
        if (i + batchSize < candidateKeys.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Final progress update
      if (onProgress) {
        onProgress({
          total: result.total,
          completed: result.migrated.length,
          failed: result.failed.length,
          percentage: 100
        });
      }

      result.success = result.failed.length === 0;

      console.log(`🏁 Migration complete: ${result.migrated.length} succeeded, ${result.failed.length} failed`);

      return result;
    } catch (error) {
      console.error('Migration failed with error:', error);
      result.errors.push({
        key: 'SYSTEM',
        error: error instanceof Error ? error.message : 'Unknown system error'
      });
      return result;
    }
  }

  /**
   * Verify that migration was successful
   */
  async verifyMigration(): Promise<{
    verified: boolean;
    mismatches: string[];
    missing: string[];
  }> {
    console.log('🔍 Verifying migration integrity...');

    const verification = {
      verified: true,
      mismatches: [] as string[],
      missing: [] as string[]
    };

    try {
      // Ensure IndexedDB is initialized
      await this.indexedDB.initialize();

      // Get migrated keys
      const candidateKeys = await this.getMigrationCandidates();
      
      for (const key of candidateKeys) {
        try {
          const localData = await this.localStorage.getItem(key);
          const indexedData = await this.indexedDB.getItem(key);

          if (!localData && !indexedData) {
            continue; // Both empty, OK
          }

          if (localData && !indexedData) {
            verification.missing.push(key);
            verification.verified = false;
          } else if (localData !== indexedData) {
            verification.mismatches.push(key);
            verification.verified = false;
          }
        } catch (error) {
          console.warn(`Verification failed for key ${key}:`, error);
          verification.missing.push(key);
          verification.verified = false;
        }
      }

      console.log(`✅ Verification complete: ${verification.verified ? 'PASSED' : 'FAILED'}`);
      if (!verification.verified) {
        console.log(`Missing: ${verification.missing.length}, Mismatches: ${verification.mismatches.length}`);
      }

      return verification;
    } catch (error) {
      console.error('Verification process failed:', error);
      return {
        verified: false,
        mismatches: [],
        missing: ['VERIFICATION_FAILED']
      };
    }
  }

  /**
   * Mark migration as complete
   */
  async markMigrationComplete(): Promise<void> {
    try {
      localStorage.setItem('storage_migrated', 'true');
      localStorage.setItem('migration_completed_at', new Date().toISOString());
      console.log('✅ Migration marked as complete');
    } catch (error) {
      console.error('Failed to mark migration as complete:', error);
      throw error;
    }
  }

  /**
   * Rollback migration (revert to localStorage)
   */
  async rollbackMigration(): Promise<void> {
    try {
      localStorage.removeItem('storage_migrated');
      localStorage.removeItem('migration_completed_at');
      console.log('🔄 Migration rolled back - will use localStorage');
    } catch (error) {
      console.error('Failed to rollback migration:', error);
      throw error;
    }
  }

  /**
   * Get migration status and statistics
   */
  getMigrationStatus(): {
    isMigrated: boolean;
    completedAt: string | null;
    canMigrate: boolean;
  } {
    return {
      isMigrated: localStorage.getItem('storage_migrated') === 'true',
      completedAt: localStorage.getItem('migration_completed_at'),
      canMigrate: IndexedDBAdapter.isAvailable()
    };
  }

  /**
   * Clean up old localStorage data after successful migration
   * WARNING: This permanently deletes data from localStorage
   */
  async cleanupLocalStorageAfterMigration(options: MigrationOptions = {}): Promise<{
    cleaned: string[];
    errors: string[];
  }> {
    console.warn('🧹 Starting localStorage cleanup - this will permanently delete migrated data');
    
    const cleanup = {
      cleaned: [] as string[],
      errors: [] as string[]
    };

    try {
      const candidateKeys = await this.getMigrationCandidates(options);
      
      for (const key of candidateKeys) {
        try {
          // Verify the item exists in IndexedDB before deleting from localStorage
          const indexedData = await this.indexedDB.getItem(key);
          if (indexedData) {
            await this.localStorage.removeItem(key);
            cleanup.cleaned.push(key);
            console.log(`🗑️ Cleaned up: ${key}`);
          } else {
            console.warn(`⚠️ Skipping cleanup of ${key} - not found in IndexedDB`);
          }
        } catch (error) {
          cleanup.errors.push(key);
          console.error(`❌ Failed to cleanup ${key}:`, error);
        }
      }

      console.log(`🧹 Cleanup complete: ${cleanup.cleaned.length} items removed from localStorage`);
      return cleanup;
    } catch (error) {
      console.error('Cleanup process failed:', error);
      throw error;
    }
  }
}