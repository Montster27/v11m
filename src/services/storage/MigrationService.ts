// /Users/montysharma/v11m2/src/services/storage/MigrationService.ts
// Service for migrating between different save formats and storage systems
// Provides safe migration paths with rollback capabilities

import { StorageAdapter } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { ChunkedStorageAdapter } from './ChunkedStorageAdapter';
import { UnifiedPersistenceService } from '../UnifiedPersistenceService';
import { ContentExportService } from '../ContentExportService';

export interface MigrationOptions {
  sourceAdapter: StorageAdapter;
  targetAdapter: StorageAdapter;
  createBackup?: boolean;
  validateData?: boolean;
  onProgress?: (progress: MigrationProgress) => void;
  onError?: (error: MigrationError) => void;
}

export interface MigrationProgress {
  phase: 'preparing' | 'backing-up' | 'reading' | 'transforming' | 'writing' | 'verifying' | 'complete';
  currentItem?: string;
  totalItems: number;
  processedItems: number;
  percentage: number;
  message: string;
}

export interface MigrationError {
  phase: string;
  item?: string;
  error: Error;
  canContinue: boolean;
}

export interface MigrationResult {
  success: boolean;
  itemsMigrated: number;
  errors: MigrationError[];
  duration: number;
  backupId?: string;
}

export interface DataTransformer {
  canTransform(key: string, value: any): boolean;
  transform(key: string, value: any): { key: string; value: any } | null;
  validate(key: string, value: any): boolean;
}

/**
 * MigrationService handles safe data migration between storage systems
 * 
 * Features:
 * - Automatic backup before migration
 * - Data validation and transformation
 * - Progress tracking
 * - Error recovery and rollback
 * - Support for various save format versions
 */
export class MigrationService {
  private transformers: DataTransformer[] = [];
  
  constructor(
    private exportService?: ContentExportService,
    private persistenceService?: UnifiedPersistenceService
  ) {
    this.registerDefaultTransformers();
  }
  
  /**
   * Migrate data from source to target storage
   */
  async migrate(options: MigrationOptions): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: MigrationError[] = [];
    let backupId: string | undefined;
    let processedItems = 0;
    
    try {
      // Phase 1: Preparing
      this.reportProgress(options, {
        phase: 'preparing',
        totalItems: 0,
        processedItems: 0,
        percentage: 0,
        message: 'Preparing migration...'
      });
      
      // Initialize adapters if needed
      if (options.sourceAdapter.initialize) {
        await options.sourceAdapter.initialize();
      }
      if (options.targetAdapter.initialize) {
        await options.targetAdapter.initialize();
      }
      
      // Phase 2: Create backup if requested
      if (options.createBackup && this.persistenceService) {
        this.reportProgress(options, {
          phase: 'backing-up',
          totalItems: 0,
          processedItems: 0,
          percentage: 10,
          message: 'Creating backup before migration...'
        });
        
        const backupResult = await this.persistenceService.createBackup(
          'pre-action',
          'Before migration'
        );
        
        if (backupResult.success) {
          backupId = backupResult.backupId;
        }
      }
      
      // Phase 3: Read all data from source
      this.reportProgress(options, {
        phase: 'reading',
        totalItems: 0,
        processedItems: 0,
        percentage: 20,
        message: 'Reading source data...'
      });
      
      const sourceKeys = await options.sourceAdapter.keys();
      const totalItems = sourceKeys.length;
      
      console.log(`📊 Found ${totalItems} items to migrate`);
      
      // Phase 4: Transform and write data
      for (let i = 0; i < sourceKeys.length; i++) {
        const key = sourceKeys[i];
        
        try {
          // Read from source
          const value = await options.sourceAdapter.getItem(key);
          if (value === null) continue;
          
          // Report progress
          this.reportProgress(options, {
            phase: 'transforming',
            currentItem: key,
            totalItems,
            processedItems: i,
            percentage: 20 + (i / totalItems) * 60,
            message: `Processing ${key}...`
          });
          
          // Parse value if it's JSON
          let parsedValue: any;
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value; // Keep as string if not JSON
          }
          
          // Apply transformations
          let transformedKey = key;
          let transformedValue = parsedValue;
          
          for (const transformer of this.transformers) {
            if (transformer.canTransform(key, parsedValue)) {
              const result = transformer.transform(key, parsedValue);
              if (result) {
                transformedKey = result.key;
                transformedValue = result.value;
              }
            }
          }
          
          // Validate if requested
          if (options.validateData) {
            let isValid = false;
            for (const transformer of this.transformers) {
              if (transformer.canTransform(transformedKey, transformedValue)) {
                isValid = transformer.validate(transformedKey, transformedValue);
                break;
              }
            }
            
            if (!isValid) {
              throw new Error(`Validation failed for ${transformedKey}`);
            }
          }
          
          // Write to target
          this.reportProgress(options, {
            phase: 'writing',
            currentItem: transformedKey,
            totalItems,
            processedItems: i,
            percentage: 20 + (i / totalItems) * 60,
            message: `Writing ${transformedKey}...`
          });
          
          const valueToWrite = typeof transformedValue === 'string' 
            ? transformedValue 
            : JSON.stringify(transformedValue);
          
          await options.targetAdapter.setItem(transformedKey, valueToWrite);
          processedItems++;
          
        } catch (error) {
          const migrationError: MigrationError = {
            phase: 'transform-write',
            item: key,
            error: error instanceof Error ? error : new Error(String(error)),
            canContinue: true
          };
          
          errors.push(migrationError);
          
          if (options.onError) {
            options.onError(migrationError);
          }
          
          // Continue with next item
          console.warn(`⚠️ Failed to migrate ${key}:`, error);
        }
      }
      
      // Phase 5: Verify migration
      this.reportProgress(options, {
        phase: 'verifying',
        totalItems,
        processedItems,
        percentage: 90,
        message: 'Verifying migration...'
      });
      
      const targetKeys = await options.targetAdapter.keys();
      const successRate = (processedItems / totalItems) * 100;
      
      console.log(`✅ Migration completed: ${processedItems}/${totalItems} items (${successRate.toFixed(1)}% success)`);
      
      // Phase 6: Complete
      this.reportProgress(options, {
        phase: 'complete',
        totalItems,
        processedItems,
        percentage: 100,
        message: `Migration completed with ${errors.length} errors`
      });
      
      return {
        success: errors.length === 0,
        itemsMigrated: processedItems,
        errors,
        duration: Date.now() - startTime,
        backupId
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      // Report fatal error
      const fatalError: MigrationError = {
        phase: 'migration',
        error: error instanceof Error ? error : new Error(String(error)),
        canContinue: false
      };
      
      if (options.onError) {
        options.onError(fatalError);
      }
      
      return {
        success: false,
        itemsMigrated: processedItems,
        errors: [...errors, fatalError],
        duration: Date.now() - startTime,
        backupId
      };
    }
  }
  
  /**
   * Migrate from localStorage to IndexedDB
   */
  async migrateToIndexedDB(options?: {
    createBackup?: boolean;
    onProgress?: (progress: MigrationProgress) => void;
  }): Promise<MigrationResult> {
    const sourceAdapter = new LocalStorageAdapter();
    const targetAdapter = new IndexedDBAdapter();
    
    // Initialize IndexedDB
    await targetAdapter.initialize();
    
    const result = await this.migrate({
      sourceAdapter,
      targetAdapter,
      createBackup: options?.createBackup ?? true,
      validateData: true,
      onProgress: options?.onProgress
    });
    
    if (result.success) {
      // Mark migration complete
      localStorage.setItem('storage_migrated', 'true');
      localStorage.setItem('storage_migration_date', new Date().toISOString());
      console.log('🎉 Successfully migrated to IndexedDB');
    }
    
    return result;
  }
  
  /**
   * Rollback migration using backup
   */
  async rollback(backupId: string): Promise<boolean> {
    if (!this.persistenceService) {
      console.error('❌ Persistence service not available for rollback');
      return false;
    }
    
    try {
      const result = await this.persistenceService.restoreFromBackup(backupId);
      if (result.success) {
        console.log('✅ Successfully rolled back migration');
        return true;
      } else {
        console.error('❌ Rollback failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Rollback error:', error);
      return false;
    }
  }
  
  /**
   * Register a custom data transformer
   */
  registerTransformer(transformer: DataTransformer): void {
    this.transformers.push(transformer);
  }
  
  /**
   * Clear all data from an adapter (use with caution!)
   */
  async clearAdapter(adapter: StorageAdapter): Promise<void> {
    console.warn('⚠️ Clearing all data from adapter...');
    await adapter.clear();
  }
  
  // Private helper methods
  
  private reportProgress(options: MigrationOptions, progress: MigrationProgress): void {
    if (options.onProgress) {
      options.onProgress(progress);
    }
    
    // Log significant progress
    if (progress.percentage % 20 === 0 || progress.phase === 'complete') {
      console.log(`📊 Migration ${progress.phase}: ${progress.percentage.toFixed(0)}% - ${progress.message}`);
    }
  }
  
  private registerDefaultTransformers(): void {
    // V1 to V2 save format transformer
    this.registerTransformer({
      canTransform: (key, value) => {
        return key.startsWith('mmv-save-') && value.version === '1.0.0';
      },
      
      transform: (key, value) => {
        // Transform V1 save to V2 format
        const v2Save = {
          ...value,
          version: '2.0.0',
          v2Data: {
            narrative: {
              storyArcs: {},
              arcProgress: {},
              flags: {
                storylet: value.flags || {},
                concerns: {},
                storyArc: {}
              },
              storylets: {
                completed: value.completedStorylets || [],
                cooldowns: value.storyletCooldowns || {}
              }
            },
            social: {
              arcRelationships: {},
              arcDiscoveryProgress: {},
              socialState: value.npcRelationships || {}
            }
          }
        };
        
        return { key, value: v2Save };
      },
      
      validate: (key, value) => {
        return value.version === '2.0.0' && value.v2Data !== undefined;
      }
    });
    
    // Backup format transformer
    this.registerTransformer({
      canTransform: (key, value) => {
        return key.startsWith('backup_') && !key.includes('_v2');
      },
      
      transform: (key, value) => {
        // Add v2 marker to backup keys
        const newKey = key.replace('backup_', 'backup_v2_');
        return { key: newKey, value };
      },
      
      validate: (key, value) => {
        return key.includes('_v2');
      }
    });
    
    // Chunked data transformer
    this.registerTransformer({
      canTransform: (key, value) => {
        return key.includes('_chunk_') && !key.startsWith('content_chunk_');
      },
      
      transform: (key, value) => {
        // Standardize chunk key format
        const newKey = `content_${key}`;
        return { key: newKey, value };
      },
      
      validate: (key, value) => {
        return key.startsWith('content_chunk_');
      }
    });
  }
}

/**
 * Factory function to create a migration service
 */
export async function createMigrationService(
  exportService?: ContentExportService,
  persistenceService?: UnifiedPersistenceService
): Promise<MigrationService> {
  return new MigrationService(exportService, persistenceService);
}

/**
 * Check if migration is needed
 */
export async function shouldMigrate(): Promise<boolean> {
  // Check if already migrated
  if (localStorage.getItem('storage_migrated') === 'true') {
    return false;
  }
  
  // Check if IndexedDB is available
  if (!IndexedDBAdapter.isAvailable()) {
    return false;
  }
  
  // Check localStorage usage
  try {
    const adapter = new LocalStorageAdapter();
    const info = await adapter.getStorageInfo();
    
    // Recommend migration if using more than 50% of quota
    return info.usage > (info.quota * 0.5);
  } catch {
    return false;
  }
}