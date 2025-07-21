// /Users/montysharma/v11m2/src/utils/storeMigrationHelper.ts
// Helper utilities for migrating existing stores to V2 with UnifiedPersistenceService
// Provides automated migration paths and compatibility layers

import { usePersistenceActions } from '../stores/middleware/unifiedPersistenceMiddleware';
import { UnifiedPersistenceService } from '../services/UnifiedPersistenceService';
import { StorageFactory } from '../services/storage/StorageFactory';

export interface StoreConfig {
  storeName: string;
  legacyKey?: string; // Old zustand persist key
  backupBeforeMigration?: boolean;
  validateAfterMigration?: boolean;
}

export interface MigrationResult {
  success: boolean;
  storeName: string;
  itemsMigrated: number;
  backupId?: string;
  error?: string;
  duration: number;
}

export interface StoreState {
  [key: string]: any;
}

/**
 * StoreMigrationHelper provides utilities for migrating existing stores
 * to use the UnifiedPersistenceService architecture
 */
export class StoreMigrationHelper {
  private persistenceService?: UnifiedPersistenceService;
  
  constructor() {
    this.initializePersistenceService();
  }
  
  private async initializePersistenceService(): Promise<void> {
    try {
      const adapter = await StorageFactory.createAdapter({
        type: 'auto',
        enableChunking: true,
        enableErrorHandling: true
      });
      
      this.persistenceService = new UnifiedPersistenceService(adapter, {
        enabled: true,
        maxBackups: 10
      });
      
      await this.persistenceService.initialize();
      console.log('📦 StoreMigrationHelper: Persistence service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize persistence service:', error);
    }
  }
  
  /**
   * Migrate a Zustand store with persist middleware to V2
   */
  async migrateZustandStore(config: StoreConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Starting migration for store: ${config.storeName}`);
      
      // Create backup if requested
      let backupId: string | undefined;
      if (config.backupBeforeMigration && this.persistenceService) {
        const backupResult = await this.persistenceService.createBackup(
          'pre-action',
          `Before migrating ${config.storeName}`
        );
        
        if (backupResult.success) {
          backupId = backupResult.backupId;
          console.log(`✅ Backup created: ${backupId}`);
        }
      }
      
      // Read legacy store data
      const legacyKey = config.legacyKey || config.storeName;
      const legacyData = this.readLegacyStore(legacyKey);
      
      if (!legacyData) {
        console.log(`ℹ️ No legacy data found for ${config.storeName}`);
        return {
          success: true,
          storeName: config.storeName,
          itemsMigrated: 0,
          backupId,
          duration: Date.now() - startTime
        };
      }
      
      // Transform data if needed
      const transformedData = this.transformStoreData(config.storeName, legacyData);
      
      // Write to new V2 format
      const newKey = `${config.storeName}-v2`;
      const serializedData = JSON.stringify({
        state: transformedData,
        version: 2,
        migratedAt: new Date().toISOString(),
        originalKey: legacyKey
      });
      
      localStorage.setItem(newKey, serializedData);
      
      // Mark as migrated
      localStorage.setItem(`${config.storeName}-migration-complete`, 'true');
      
      // Validate if requested
      if (config.validateAfterMigration) {
        const validated = this.validateMigratedData(newKey, transformedData);
        if (!validated) {
          throw new Error('Migration validation failed');
        }
      }
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Migration completed for ${config.storeName} in ${duration}ms`);
      
      return {
        success: true,
        storeName: config.storeName,
        itemsMigrated: 1,
        backupId,
        duration
      };
      
    } catch (error) {
      console.error(`❌ Migration failed for ${config.storeName}:`, error);
      
      return {
        success: false,
        storeName: config.storeName,
        itemsMigrated: 0,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Batch migrate multiple stores
   */
  async migrateBatch(configs: StoreConfig[]): Promise<MigrationResult[]> {
    console.log(`🚀 Starting batch migration for ${configs.length} stores`);
    
    const results: MigrationResult[] = [];
    
    for (const config of configs) {
      const result = await this.migrateZustandStore(config);
      results.push(result);
      
      // Small delay between migrations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`📊 Batch migration complete: ${successful}/${configs.length} successful`);
    
    return results;
  }
  
  /**
   * Check if a store has been migrated
   */
  isMigrated(storeName: string): boolean {
    return localStorage.getItem(`${storeName}-migration-complete`) === 'true';
  }
  
  /**
   * Get migration status for all known stores
   */
  getMigrationStatus(): Record<string, boolean> {
    const knownStores = [
      'clue-store',
      'storylet-store',
      'npc-store',
      'save-store',
      'character-store',
      'skill-system',
      'app-store'
    ];
    
    const status: Record<string, boolean> = {};
    
    for (const store of knownStores) {
      status[store] = this.isMigrated(store);
    }
    
    return status;
  }
  
  /**
   * Create a compatibility layer for legacy store access
   */
  createCompatibilityLayer(storeName: string): {
    read: () => StoreState | null;
    write: (data: StoreState) => void;
    migrate: () => Promise<MigrationResult>;
  } {
    return {
      read: () => {
        // Try V2 first, fallback to legacy
        const v2Key = `${storeName}-v2`;
        const v2Data = localStorage.getItem(v2Key);
        
        if (v2Data) {
          try {
            const parsed = JSON.parse(v2Data);
            return parsed.state;
          } catch (error) {
            console.warn(`Failed to parse V2 data for ${storeName}:`, error);
          }
        }
        
        // Fallback to legacy
        return this.readLegacyStore(storeName);
      },
      
      write: (data: StoreState) => {
        // Write to V2 format
        const v2Key = `${storeName}-v2`;
        const serializedData = JSON.stringify({
          state: data,
          version: 2,
          updatedAt: new Date().toISOString()
        });
        
        localStorage.setItem(v2Key, serializedData);
      },
      
      migrate: () => this.migrateZustandStore({
        storeName,
        backupBeforeMigration: true,
        validateAfterMigration: true
      })
    };
  }
  
  /**
   * Clean up legacy store data after successful migration
   */
  async cleanupLegacyData(storeName: string, confirmationCallback?: () => boolean): Promise<boolean> {
    if (!this.isMigrated(storeName)) {
      console.warn(`⚠️ Store ${storeName} has not been migrated yet`);
      return false;
    }
    
    if (confirmationCallback && !confirmationCallback()) {
      console.log(`ℹ️ Cleanup cancelled by user for ${storeName}`);
      return false;
    }
    
    try {
      // Remove legacy data
      const legacyKeys = [
        storeName,
        `${storeName}-persist`,
        `zustand-${storeName}`,
        `mmv-${storeName}`
      ];
      
      let removedCount = 0;
      for (const key of legacyKeys) {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      }
      
      console.log(`🧹 Cleaned up ${removedCount} legacy items for ${storeName}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to cleanup legacy data for ${storeName}:`, error);
      return false;
    }
  }
  
  // Private helper methods
  
  private readLegacyStore(key: string): StoreState | null {
    try {
      // Try various key formats
      const possibleKeys = [
        key,
        `${key}-persist`,
        `zustand-${key}`,
        `mmv-${key}`
      ];
      
      for (const possibleKey of possibleKeys) {
        const data = localStorage.getItem(possibleKey);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            // Handle different zustand persist formats
            return parsed.state || parsed;
          } catch (parseError) {
            console.warn(`Failed to parse data for key ${possibleKey}:`, parseError);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to read legacy store ${key}:`, error);
      return null;
    }
  }
  
  private transformStoreData(storeName: string, data: StoreState): StoreState {
    // Store-specific transformations
    switch (storeName) {
      case 'clue-store':
        return this.transformClueStore(data);
      case 'storylet-store':
        return this.transformStoryletStore(data);
      case 'npc-store':
        return this.transformNPCStore(data);
      default:
        // Generic transformation
        return this.transformGenericStore(data);
    }
  }
  
  private transformClueStore(data: StoreState): StoreState {
    // Ensure clues have required V2 fields
    const transformed = { ...data };
    
    if (transformed.clues && Array.isArray(transformed.clues)) {
      transformed.clues = transformed.clues.map((clue: any) => ({
        ...clue,
        createdAt: clue.createdAt || new Date(),
        updatedAt: clue.updatedAt || new Date(),
        tags: clue.tags || [],
        rarity: clue.rarity || 'common'
      }));
    }
    
    return transformed;
  }
  
  private transformStoryletStore(data: StoreState): StoreState {
    // Ensure storylets have required V2 fields
    const transformed = { ...data };
    
    if (transformed.allStorylets) {
      const updatedStorylets: Record<string, any> = {};
      
      for (const [id, storylet] of Object.entries(transformed.allStorylets)) {
        updatedStorylets[id] = {
          ...storylet,
          metadata: {
            deployment: 'live',
            createdAt: new Date().toISOString(),
            category: 'general',
            ...(storylet as any).metadata
          }
        };
      }
      
      transformed.allStorylets = updatedStorylets;
    }
    
    // Ensure deploymentFilter is a Set (will be serialized as array)
    if (!transformed.deploymentFilter) {
      transformed.deploymentFilter = ['live', 'stage', 'dev'];
    }
    
    return transformed;
  }
  
  private transformNPCStore(data: StoreState): StoreState {
    // Ensure NPCs have required V2 fields
    const transformed = { ...data };
    
    if (transformed.npcs && Array.isArray(transformed.npcs)) {
      transformed.npcs = transformed.npcs.map((npc: any) => ({
        ...npc,
        createdAt: npc.createdAt || new Date(),
        updatedAt: npc.updatedAt || new Date(),
        traits: npc.traits || [],
        relationships: npc.relationships || {}
      }));
    }
    
    return transformed;
  }
  
  private transformGenericStore(data: StoreState): StoreState {
    // Generic transformation - add common V2 fields
    return {
      ...data,
      _v2Migration: {
        migratedAt: new Date().toISOString(),
        version: '2.0.0'
      }
    };
  }
  
  private validateMigratedData(key: string, data: StoreState): boolean {
    try {
      // Basic validation - ensure data can be read back
      const stored = localStorage.getItem(key);
      if (!stored) return false;
      
      const parsed = JSON.parse(stored);
      if (!parsed.state) return false;
      
      // Store-specific validation could be added here
      
      return true;
    } catch (error) {
      console.error('Validation failed:', error);
      return false;
    }
  }
}

/**
 * Global migration helper instance
 */
export const migrationHelper = new StoreMigrationHelper();

/**
 * Convenience function to migrate all known stores
 */
export async function migrateAllStores(): Promise<MigrationResult[]> {
  const configs: StoreConfig[] = [
    {
      storeName: 'clue-store',
      legacyKey: 'clue-store-persist',
      backupBeforeMigration: true,
      validateAfterMigration: true
    },
    {
      storeName: 'storylet-store',
      legacyKey: 'storylet-store-persist',
      backupBeforeMigration: true,
      validateAfterMigration: true
    },
    {
      storeName: 'npc-store',
      legacyKey: 'npc-store-persist',
      backupBeforeMigration: true,
      validateAfterMigration: true
    },
    {
      storeName: 'save-store',
      legacyKey: 'save-store-persist',
      backupBeforeMigration: true,
      validateAfterMigration: true
    }
  ];
  
  return await migrationHelper.migrateBatch(configs);
}

/**
 * React hook for store migration status
 */
export function useMigrationStatus() {
  const status = migrationHelper.getMigrationStatus();
  
  return {
    status,
    migrateAll: migrateAllStores,
    migrateSingle: (storeName: string) => migrationHelper.migrateZustandStore({
      storeName,
      backupBeforeMigration: true,
      validateAfterMigration: true
    }),
    isComplete: Object.values(status).every(Boolean),
    completedCount: Object.values(status).filter(Boolean).length,
    totalCount: Object.keys(status).length
  };
}