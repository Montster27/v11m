// /Users/montysharma/v11m2/src/hooks/useUnifiedPersistence.ts
// React hook for UnifiedPersistenceService
// Replaces useStudioPersistence with comprehensive backup and auto-save functionality

import { useState, useEffect, useRef, useCallback } from 'react';
import { UnifiedPersistenceService } from '../services/UnifiedPersistenceService';
import { StorageAdapter } from '../services/storage/StorageAdapter';
import type { ExportOptions, ImportOptions, ExportPackage, ImportResult } from '../services/ContentExportService';

interface UnifiedPersistenceConfig {
  // Auto-save configuration
  autoSaveEnabled?: boolean;
  autoSaveIntervalMs?: number;
  autoSaveDebounceMs?: number;
  
  // Storage configuration
  storageAdapter?: StorageAdapter;
  
  // Backup configuration
  maxBackups?: number;
  backupIntervalMs?: number;
  
  // Export configuration
  defaultExportOptions?: Partial<ExportOptions>;
  
  // Callbacks
  onBackupCreated?: (backup: { id: string; label: string; size: number }) => void;
  onError?: (error: string) => void;
}

interface BackupMetadata {
  id: string;
  label: string;
  timestamp: Date;
  size: number;
  type: 'auto' | 'manual' | 'pre-action';
}

interface PersistenceState {
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  lastAutoSave: Date | null;
  saveError: string | null;
  backupCount: number;
}

interface UseUnifiedPersistenceReturn extends PersistenceState {
  // Core backup operations
  createBackup: (label?: string, type?: 'manual' | 'pre-action') => Promise<boolean>;
  createPreActionBackup: (actionName: string) => Promise<boolean>;
  loadBackup: (backupId: string) => Promise<ExportPackage | null>;
  restoreBackup: (backupId: string) => Promise<boolean>;
  
  // Backup management
  listBackups: () => Promise<BackupMetadata[]>;
  deleteBackup: (backupId: string) => Promise<boolean>;
  
  // State management
  markDirty: () => void;
  markClean: () => void;
  clearError: () => void;
  
  // Auto-save control
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  forceAutoSave: () => Promise<boolean>;
  
  // Export/Import operations
  exportProject: (options?: Partial<ExportOptions>) => Promise<ExportPackage | null>;
  importProject: (data: ExportPackage, options?: Partial<ImportOptions>) => Promise<boolean>;
  
  // Storage info
  getStorageInfo: () => Promise<{ used: number; available: number; quota: number }>;
  getStats: () => Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  }>;
  
  // Service access
  getService: () => UnifiedPersistenceService | null;
}

/**
 * Hook for unified persistence functionality
 * Replaces useStudioPersistence with enhanced backup management and auto-save
 */
export function useUnifiedPersistence(
  config: UnifiedPersistenceConfig = {}
): UseUnifiedPersistenceReturn {
  const serviceRef = useRef<UnifiedPersistenceService | null>(null);
  const [state, setState] = useState<PersistenceState>({
    isDirty: false,
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    lastAutoSave: null,
    saveError: null,
    backupCount: 0
  });

  // Initialize service
  useEffect(() => {
    const initializeService = async () => {
      try {
        const service = new UnifiedPersistenceService(
          config.storageAdapter,
          {
            enabled: config.autoSaveEnabled ?? true,
            intervalMs: config.autoSaveIntervalMs ?? 30000,
            debounceMs: config.autoSaveDebounceMs ?? 2000,
            maxBackups: config.maxBackups ?? 10,
            backupIntervalMs: config.backupIntervalMs ?? 300000
          },
          // State change callback
          (newState) => setState(newState),
          // Backup created callback
          (backup) => {
            if (config.onBackupCreated) {
              config.onBackupCreated({
                id: backup.id,
                label: backup.label,
                size: backup.size
              });
            }
          }
        );
        
        serviceRef.current = service;
        
        // Initial state sync
        setState(service.getState());
        
        console.log('✅ UnifiedPersistence hook initialized');
      } catch (error) {
        console.error('❌ Failed to initialize UnifiedPersistence:', error);
        if (config.onError) {
          config.onError(error instanceof Error ? error.message : 'Initialization failed');
        }
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy();
        serviceRef.current = null;
      }
    };
  }, []);

  // Core backup operations
  const createBackup = useCallback(async (
    label?: string,
    type: 'manual' | 'pre-action' = 'manual'
  ): Promise<boolean> => {
    if (!serviceRef.current) return false;
    
    try {
      const result = await serviceRef.current.createBackup(type, label, config.defaultExportOptions);
      return result.success;
    } catch (error) {
      console.error('Create backup failed:', error);
      if (config.onError) {
        config.onError(error instanceof Error ? error.message : 'Backup failed');
      }
      return false;
    }
  }, [config.defaultExportOptions, config.onError]);

  const createPreActionBackup = useCallback(async (actionName: string): Promise<boolean> => {
    if (!serviceRef.current) return false;
    return serviceRef.current.createPreActionBackup(actionName);
  }, []);

  const loadBackup = useCallback(async (backupId: string): Promise<ExportPackage | null> => {
    if (!serviceRef.current) return null;
    
    const result = await serviceRef.current.loadBackup(backupId);
    return result.success ? result.data || null : null;
  }, []);

  const restoreBackup = useCallback(async (backupId: string): Promise<boolean> => {
    if (!serviceRef.current) return false;
    
    const result = await serviceRef.current.restoreFromBackup(backupId);
    return result.success;
  }, []);

  // Backup management
  const listBackups = useCallback(async (): Promise<BackupMetadata[]> => {
    if (!serviceRef.current) return [];
    return serviceRef.current.listBackups();
  }, []);

  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    if (!serviceRef.current) return false;
    return serviceRef.current.deleteBackup(backupId);
  }, []);

  // State management
  const markDirty = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.markDirty();
    }
  }, []);

  const markClean = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.markClean();
    }
  }, []);

  const clearError = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearError();
    }
  }, []);

  // Auto-save control
  const enableAutoSave = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.enableAutoSave();
    }
  }, []);

  const disableAutoSave = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disableAutoSave();
    }
  }, []);

  const forceAutoSave = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current) return false;
    return serviceRef.current.autoSave();
  }, []);

  // Export/Import operations
  const exportProject = useCallback(async (
    options?: Partial<ExportOptions>
  ): Promise<ExportPackage | null> => {
    if (!serviceRef.current) return null;
    
    try {
      const mergedOptions = { ...config.defaultExportOptions, ...options };
      return await serviceRef.current.getContentExportService().exportProject(mergedOptions);
    } catch (error) {
      console.error('Export project failed:', error);
      if (config.onError) {
        config.onError(error instanceof Error ? error.message : 'Export failed');
      }
      return null;
    }
  }, [config.defaultExportOptions, config.onError]);

  const importProject = useCallback(async (
    data: ExportPackage,
    options?: Partial<ImportOptions>
  ): Promise<boolean> => {
    if (!serviceRef.current) return false;
    
    try {
      const result = await serviceRef.current.getContentExportService().importProject(data, options);
      if (result.success) {
        markClean();
      }
      return result.success;
    } catch (error) {
      console.error('Import project failed:', error);
      if (config.onError) {
        config.onError(error instanceof Error ? error.message : 'Import failed');
      }
      return false;
    }
  }, [markClean, config.onError]);

  // Storage info
  const getStorageInfo = useCallback(async () => {
    if (!serviceRef.current) {
      return { used: 0, available: 0, quota: 0 };
    }
    
    try {
      const info = await serviceRef.current.getStorageInfo();
      return {
        used: info.usage,
        available: info.available,
        quota: info.quota
      };
    } catch (error) {
      console.warn('Failed to get storage info:', error);
      return { used: 0, available: 0, quota: 0 };
    }
  }, []);

  const getStats = useCallback(async () => {
    if (!serviceRef.current) {
      return {
        totalBackups: 0,
        totalSize: 0,
        oldestBackup: null,
        newestBackup: null
      };
    }
    
    const stats = await serviceRef.current.getStats();
    return {
      totalBackups: stats.totalBackups,
      totalSize: stats.totalSize,
      oldestBackup: stats.oldestBackup,
      newestBackup: stats.newestBackup
    };
  }, []);

  // Service access
  const getService = useCallback((): UnifiedPersistenceService | null => {
    return serviceRef.current;
  }, []);

  return {
    // State
    ...state,
    
    // Core backup operations
    createBackup,
    createPreActionBackup,
    loadBackup,
    restoreBackup,
    
    // Backup management
    listBackups,
    deleteBackup,
    
    // State management
    markDirty,
    markClean,
    clearError,
    
    // Auto-save control
    enableAutoSave,
    disableAutoSave,
    forceAutoSave,
    
    // Export/Import operations
    exportProject,
    importProject,
    
    // Storage info
    getStorageInfo,
    getStats,
    
    // Service access
    getService
  };
}

// Convenience hook for simple backup operations
export function useSimpleBackup(storageAdapter?: StorageAdapter) {
  const persistence = useUnifiedPersistence({
    storageAdapter,
    autoSaveEnabled: false, // Disable auto-save for simple use
    maxBackups: 5
  });

  return {
    createBackup: (label?: string) => persistence.createBackup(label),
    listBackups: persistence.listBackups,
    restoreBackup: persistence.restoreBackup,
    deleteBackup: persistence.deleteBackup,
    isLoading: persistence.isLoading,
    error: persistence.saveError
  };
}

// Convenience hook for auto-save functionality
export function useAutoSave(config: {
  enabled?: boolean;
  intervalMs?: number;
  debounceMs?: number;
  onSaved?: () => void;
} = {}) {
  const persistence = useUnifiedPersistence({
    autoSaveEnabled: config.enabled ?? true,
    autoSaveIntervalMs: config.intervalMs ?? 30000,
    autoSaveDebounceMs: config.debounceMs ?? 2000,
    onBackupCreated: config.onSaved
  });

  return {
    markDirty: persistence.markDirty,
    markClean: persistence.markClean,
    isDirty: persistence.isDirty,
    isSaving: persistence.isSaving,
    lastSaved: persistence.lastSaved,
    enableAutoSave: persistence.enableAutoSave,
    disableAutoSave: persistence.disableAutoSave,
    forceAutoSave: persistence.forceAutoSave
  };
}