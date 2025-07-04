// /Users/montysharma/V11M2/src/utils/saveFormatMigration.ts
// Save Format Migration Utilities
// Handles migration between legacy and V2 save formats

import type { SaveData, SaveSlot } from '../types/save';
import type { SaveDataV2 } from '../store/useSaveStoreV2';

export interface MigrationResult {
  success: boolean;
  migratedSaves: string[];
  errors: string[];
  backups: string[];
}

export interface SaveMigrationOptions {
  createBackups: boolean;
  validateIntegrity: boolean;
  preserveLegacy: boolean;
  logDetails: boolean;
}

const DEFAULT_MIGRATION_OPTIONS: SaveMigrationOptions = {
  createBackups: true,
  validateIntegrity: true,
  preserveLegacy: true,
  logDetails: true
};

/**
 * Detects all save files in localStorage and categorizes them
 */
export function detectSaveFiles(): {
  legacy: string[];
  v2: string[];
  unknown: string[];
} {
  const result = {
    legacy: [] as string[],
    v2: [] as string[],
    unknown: [] as string[]
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Legacy save pattern: mmv-save-slots_<saveId>
      if (key.startsWith('mmv-save-slots_') && !key.includes('_v2_')) {
        result.legacy.push(key);
      }
      // V2 save pattern: mmv-save-slots-v2_<saveId>
      else if (key.startsWith('mmv-save-slots-v2_')) {
        result.v2.push(key);
      }
      // Unknown save-like pattern
      else if (key.includes('save') && key.includes('mmv')) {
        result.unknown.push(key);
      }
    }

    console.log(`📊 Save detection: ${result.legacy.length} legacy, ${result.v2.length} V2, ${result.unknown.length} unknown`);
    return result;
  } catch (error) {
    console.error('Error detecting save files:', error);
    return result;
  }
}

/**
 * Migrates a single legacy save to V2 format
 */
export function migrateLegacySaveToV2(
  legacySaveKey: string, 
  options: Partial<SaveMigrationOptions> = {}
): { success: boolean; newSaveId?: string; error?: string; backupId?: string } {
  const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
  
  try {
    const legacySaveJson = localStorage.getItem(legacySaveKey);
    if (!legacySaveJson) {
      return { success: false, error: 'Legacy save data not found' };
    }

    const legacySave: SaveData = JSON.parse(legacySaveJson);
    
    // Validate legacy save structure
    if (!legacySave.id || !legacySave.name || !legacySave.timestamp) {
      return { success: false, error: 'Invalid legacy save structure' };
    }

    // Create backup if requested
    let backupId: string | undefined;
    if (opts.createBackups) {
      backupId = `backup_${legacySave.id}_${Date.now()}`;
      localStorage.setItem(`mmv-save-backups_${backupId}`, legacySaveJson);
      if (opts.logDetails) {
        console.log(`💾 Created backup: ${backupId}`);
      }
    }

    // Convert to V2 format
    const v2Save: SaveDataV2 = {
      ...legacySave,
      version: '2.0.0',
      v2Data: {
        narrative: {
          storyArcs: {},
          arcProgress: {},
          flags: {
            storylet: convertLegacyFlags(legacySave.storyletProgress.activeFlags),
            concerns: {},
            storyArc: {}
          },
          storylets: {
            completed: legacySave.storyletProgress.completedStorylets.map(c => c.storyletId),
            cooldowns: legacySave.storyletProgress.storyletCooldowns
          }
        },
        social: {
          arcRelationships: {},
          arcDiscoveryProgress: {},
          socialState: {}
        }
      }
    };

    // Generate new V2 save ID
    const newSaveId = `save_v2_migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    v2Save.id = newSaveId;
    v2Save.name = `${v2Save.name} (Migrated)`;
    v2Save.timestamp = Date.now();

    // Validate V2 save if requested
    if (opts.validateIntegrity && !validateV2SaveStructure(v2Save)) {
      return { success: false, error: 'V2 save validation failed', backupId };
    }

    // Save V2 format
    const v2SaveKey = `mmv-save-slots-v2_${newSaveId}`;
    localStorage.setItem(v2SaveKey, JSON.stringify(v2Save));

    // Remove legacy save unless preservation is requested
    if (!opts.preserveLegacy) {
      localStorage.removeItem(legacySaveKey);
      if (opts.logDetails) {
        console.log(`🗑️ Removed legacy save: ${legacySaveKey}`);
      }
    }

    if (opts.logDetails) {
      console.log(`✅ Migrated ${legacySave.name} from legacy to V2: ${newSaveId}`);
    }

    return { success: true, newSaveId, backupId };
  } catch (error) {
    console.error('Error migrating legacy save:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Migrates all legacy saves to V2 format
 */
export function migrateAllLegacySaves(
  options: Partial<SaveMigrationOptions> = {}
): MigrationResult {
  const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
  
  const result: MigrationResult = {
    success: true,
    migratedSaves: [],
    errors: [],
    backups: []
  };

  try {
    const { legacy } = detectSaveFiles();
    
    if (legacy.length === 0) {
      if (opts.logDetails) {
        console.log('📋 No legacy saves found to migrate');
      }
      return result;
    }

    if (opts.logDetails) {
      console.log(`🔄 Starting migration of ${legacy.length} legacy saves...`);
    }

    for (const legacySaveKey of legacy) {
      const migrationResult = migrateLegacySaveToV2(legacySaveKey, opts);
      
      if (migrationResult.success) {
        if (migrationResult.newSaveId) {
          result.migratedSaves.push(migrationResult.newSaveId);
        }
        if (migrationResult.backupId) {
          result.backups.push(migrationResult.backupId);
        }
      } else {
        result.success = false;
        result.errors.push(`${legacySaveKey}: ${migrationResult.error}`);
      }
    }

    if (opts.logDetails) {
      console.log(`✅ Migration complete: ${result.migratedSaves.length} migrated, ${result.errors.length} errors`);
    }

    return result;
  } catch (error) {
    console.error('Error during mass migration:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * Converts legacy flag format to V2 format
 */
function convertLegacyFlags(legacyFlags: Record<string, boolean>): Record<string, any> {
  const v2Flags: Record<string, any> = {};
  
  // Convert boolean flags to V2 format
  Object.entries(legacyFlags).forEach(([key, value]) => {
    v2Flags[key] = value;
  });
  
  return v2Flags;
}

/**
 * Validates V2 save structure
 */
function validateV2SaveStructure(saveData: SaveDataV2): boolean {
  try {
    // Basic validation
    if (!saveData.id || !saveData.name || !saveData.timestamp) {
      console.error('V2 save missing required fields');
      return false;
    }
    
    if (saveData.version !== '2.0.0' && saveData.version !== '1.0.0') {
      console.error('Invalid V2 save version');
      return false;
    }
    
    // V2 data validation
    if (saveData.version === '2.0.0' && saveData.v2Data) {
      if (!saveData.v2Data.narrative || !saveData.v2Data.social) {
        console.warn('V2 save missing narrative or social data');
      }
    }
    
    return true;
  } catch (error) {
    console.error('V2 save validation error:', error);
    return false;
  }
}

/**
 * Creates a backup of current save state before migration
 */
export function createFullSaveBackup(): string {
  try {
    const backupId = `full_backup_${Date.now()}`;
    const saveData: Record<string, string> = {};
    
    // Collect all save-related data from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('mmv-save') || key.includes('save'))) {
        const value = localStorage.getItem(key);
        if (value) {
          saveData[key] = value;
        }
      }
    }
    
    localStorage.setItem(`mmv-full-backup_${backupId}`, JSON.stringify(saveData));
    console.log(`💾 Created full save backup: ${backupId}`);
    return backupId;
  } catch (error) {
    console.error('Error creating full backup:', error);
    return '';
  }
}

/**
 * Restores from a full backup
 */
export function restoreFromFullBackup(backupId: string): boolean {
  try {
    const backupData = localStorage.getItem(`mmv-full-backup_${backupId}`);
    if (!backupData) {
      console.error('Backup not found:', backupId);
      return false;
    }
    
    const saveData: Record<string, string> = JSON.parse(backupData);
    
    // Clear existing save data
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('mmv-save') || key.includes('save'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Restore backup data
    Object.entries(saveData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log(`🔄 Restored from full backup: ${backupId}`);
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return false;
  }
}

/**
 * Cleans up old backup files
 */
export function cleanupOldBackups(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
  let cleaned = 0;
  const cutoffTime = Date.now() - maxAge;
  
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('backup')) {
        // Extract timestamp from backup key
        const timestampMatch = key.match(/_(\d+)(?:_|$)/);
        if (timestampMatch) {
          const timestamp = parseInt(timestampMatch[1]);
          if (timestamp < cutoffTime) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleaned++;
    });
    
    console.log(`🧹 Cleaned up ${cleaned} old backup files`);
    return cleaned;
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    return 0;
  }
}

/**
 * Gets migration status for the application
 */
export function getMigrationStatus(): {
  hasLegacySaves: boolean;
  hasV2Saves: boolean;
  legacyCount: number;
  v2Count: number;
  needsMigration: boolean;
  recommendation: string;
} {
  const { legacy, v2 } = detectSaveFiles();
  
  const hasLegacySaves = legacy.length > 0;
  const hasV2Saves = v2.length > 0;
  const needsMigration = hasLegacySaves;
  
  let recommendation = '';
  if (needsMigration && !hasV2Saves) {
    recommendation = 'Migrate all legacy saves to V2 format';
  } else if (needsMigration && hasV2Saves) {
    recommendation = 'Complete migration of remaining legacy saves';
  } else if (!needsMigration && hasV2Saves) {
    recommendation = 'Migration complete - all saves are V2 format';
  } else {
    recommendation = 'No saves found - create your first save';
  }
  
  return {
    hasLegacySaves,
    hasV2Saves,
    legacyCount: legacy.length,
    v2Count: v2.length,
    needsMigration,
    recommendation
  };
}

// Export for global access (development/debugging)
if (typeof window !== 'undefined') {
  (window as any).saveFormatMigration = {
    detectSaveFiles,
    migrateLegacySaveToV2,
    migrateAllLegacySaves,
    createFullSaveBackup,
    restoreFromFullBackup,
    cleanupOldBackups,
    getMigrationStatus
  };
}