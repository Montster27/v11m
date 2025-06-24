// /Users/montysharma/V11M2/src/components/contentStudio/shared/useStudioPersistence.ts
// Shared persistence patterns for Content Studio components - auto-save, backup, restore

import { useState, useEffect, useRef, useCallback } from 'react';
import { UndoRedoAction } from '../../../hooks/useUndoRedo';

interface PersistenceConfig<T> {
  // Auto-save configuration
  autoSaveEnabled?: boolean;
  autoSaveIntervalMs?: number;
  autoSaveDebounceMs?: number;
  
  // Storage configuration
  storageKey?: string;
  useLocalStorage?: boolean;
  
  // Persistence callbacks
  onSave?: (data: T) => Promise<void> | void;
  onLoad?: () => Promise<T> | T;
  onAutoSave?: (data: T) => Promise<void> | void;
  
  // Backup configuration
  maxBackups?: number;
  backupIntervalMs?: number;
  
  // Validation
  validateBeforeSave?: (data: T) => boolean;
  
  // Change detection
  compareFunction?: (a: T, b: T) => boolean;
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

interface UseStudioPersistenceReturn<T> extends PersistenceState {
  // State from PersistenceState
  
  // Actions
  save: (data: T, options?: { force?: boolean; silent?: boolean }) => Promise<boolean>;
  load: () => Promise<T | null>;
  markDirty: () => void;
  markClean: () => void;
  
  // Auto-save control
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  
  // Backup management
  createBackup: (data: T, label?: string) => Promise<boolean>;
  restoreBackup: (backupId: string) => Promise<T | null>;
  listBackups: () => Array<{ id: string; label: string; timestamp: Date; size: number }>;
  deleteBackup: (backupId: string) => Promise<boolean>;
  
  // Utilities
  clearError: () => void;
  hasUnsavedChanges: () => boolean;
  getStorageInfo: () => { used: number; available: number; quota: number };
}

const defaultConfig = {
  autoSaveEnabled: true,
  autoSaveIntervalMs: 30000, // 30 seconds
  autoSaveDebounceMs: 2000,  // 2 seconds after last change
  useLocalStorage: true,
  maxBackups: 5,
  backupIntervalMs: 300000,  // 5 minutes
};

export function useStudioPersistence<T>(
  initialData: T,
  config: PersistenceConfig<T> = {}
): UseStudioPersistenceReturn<T> {
  const finalConfig = { ...defaultConfig, ...config };
  
  // State
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [backupCount, setBackupCount] = useState(0);
  
  // Refs for debouncing and intervals
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T>(initialData);
  const autoSaveEnabledRef = useRef(finalConfig.autoSaveEnabled);

  // Storage key generation
  const getStorageKey = useCallback((suffix = '') => {
    const base = finalConfig.storageKey || 'studio_data';
    return suffix ? `${base}_${suffix}` : base;
  }, [finalConfig.storageKey]);

  // Compare function for change detection
  const hasChanged = useCallback((newData: T, oldData: T): boolean => {
    if (finalConfig.compareFunction) {
      return !finalConfig.compareFunction(newData, oldData);
    }
    
    // Default deep comparison
    try {
      return JSON.stringify(newData) !== JSON.stringify(oldData);
    } catch {
      // Fallback to reference comparison
      return newData !== oldData;
    }
  }, [finalConfig.compareFunction]);

  // Save operation
  const save = useCallback(async (
    data: T, 
    options: { force?: boolean; silent?: boolean } = {}
  ): Promise<boolean> => {
    try {
      setIsSaving(true);
      setSaveError(null);

      // Validation
      if (finalConfig.validateBeforeSave && !finalConfig.validateBeforeSave(data)) {
        throw new Error('Data validation failed before save');
      }

      // Check if data has actually changed
      if (!options.force && !hasChanged(data, lastDataRef.current)) {
        return true;
      }

      // Perform save operation
      if (finalConfig.onSave) {
        await finalConfig.onSave(data);
      }

      // Local storage backup
      if (finalConfig.useLocalStorage) {
        try {
          localStorage.setItem(getStorageKey(), JSON.stringify({
            data,
            timestamp: new Date().toISOString(),
            version: '1.0'
          }));
        } catch (storageError) {
          console.warn('Local storage save failed:', storageError);
        }
      }

      // Update state
      lastDataRef.current = data;
      setLastSaved(new Date());
      setIsDirty(false);
      
      if (!options.silent) {
        console.log('💾 Content Studio: Data saved successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Save failed');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [finalConfig, hasChanged, getStorageKey]);

  // Auto-save operation
  const performAutoSave = useCallback(async (data: T) => {
    try {
      if (finalConfig.onAutoSave) {
        await finalConfig.onAutoSave(data);
      } else {
        await save(data, { silent: true });
      }
      
      setLastAutoSave(new Date());
      console.log('🔄 Content Studio: Auto-save completed');
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }, [finalConfig.onAutoSave, save]);

  // Load operation
  const load = useCallback(async (): Promise<T | null> => {
    try {
      setIsLoading(true);
      setSaveError(null);

      // Try custom load function first
      if (finalConfig.onLoad) {
        const data = await finalConfig.onLoad();
        lastDataRef.current = data;
        return data;
      }

      // Fallback to local storage
      if (finalConfig.useLocalStorage) {
        const stored = localStorage.getItem(getStorageKey());
        if (stored) {
          const parsed = JSON.parse(stored);
          lastDataRef.current = parsed.data;
          return parsed.data;
        }
      }

      return null;
    } catch (error) {
      console.error('Load failed:', error);
      setSaveError(error instanceof Error ? error.message : 'Load failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [finalConfig.onLoad, finalConfig.useLocalStorage, getStorageKey]);

  // Backup management
  const createBackup = useCallback(async (data: T, label?: string): Promise<boolean> => {
    try {
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const backupData = {
        id: backupId,
        label: label || `Backup ${new Date().toLocaleString()}`,
        data,
        timestamp: new Date().toISOString(),
        size: JSON.stringify(data).length
      };

      // Store backup
      localStorage.setItem(getStorageKey(`backup_${backupId}`), JSON.stringify(backupData));

      // Update backup list
      const backupListKey = getStorageKey('backup_list');
      const existingList = JSON.parse(localStorage.getItem(backupListKey) || '[]');
      existingList.push({
        id: backupId,
        label: backupData.label,
        timestamp: new Date(),
        size: backupData.size
      });

      // Limit number of backups
      if (existingList.length > finalConfig.maxBackups!) {
        const toDelete = existingList.splice(0, existingList.length - finalConfig.maxBackups!);
        toDelete.forEach((backup: any) => {
          localStorage.removeItem(getStorageKey(`backup_${backup.id}`));
        });
      }

      localStorage.setItem(backupListKey, JSON.stringify(existingList));
      setBackupCount(existingList.length);

      console.log(`💾 Content Studio: Backup created - ${backupData.label}`);
      return true;
    } catch (error) {
      console.error('Backup creation failed:', error);
      return false;
    }
  }, [finalConfig.maxBackups, getStorageKey]);

  const restoreBackup = useCallback(async (backupId: string): Promise<T | null> => {
    try {
      const backupData = localStorage.getItem(getStorageKey(`backup_${backupId}`));
      if (!backupData) {
        throw new Error('Backup not found');
      }

      const parsed = JSON.parse(backupData);
      console.log(`🔄 Content Studio: Restored backup - ${parsed.label}`);
      return parsed.data;
    } catch (error) {
      console.error('Backup restore failed:', error);
      return null;
    }
  }, [getStorageKey]);

  const listBackups = useCallback(() => {
    try {
      const backupList = localStorage.getItem(getStorageKey('backup_list'));
      return backupList ? JSON.parse(backupList) : [];
    } catch {
      return [];
    }
  }, [getStorageKey]);

  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      localStorage.removeItem(getStorageKey(`backup_${backupId}`));
      
      const backupListKey = getStorageKey('backup_list');
      const existingList = JSON.parse(localStorage.getItem(backupListKey) || '[]');
      const updatedList = existingList.filter((backup: any) => backup.id !== backupId);
      
      localStorage.setItem(backupListKey, JSON.stringify(updatedList));
      setBackupCount(updatedList.length);
      
      return true;
    } catch (error) {
      console.error('Backup deletion failed:', error);
      return false;
    }
  }, [getStorageKey]);

  // Auto-save setup
  const setupAutoSave = useCallback((data: T) => {
    if (!autoSaveEnabledRef.current) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set debounced auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (isDirty && hasChanged(data, lastDataRef.current)) {
        performAutoSave(data);
      }
    }, finalConfig.autoSaveDebounceMs);
  }, [isDirty, hasChanged, performAutoSave, finalConfig.autoSaveDebounceMs]);

  // Control functions
  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);
  
  const enableAutoSave = useCallback(() => {
    autoSaveEnabledRef.current = true;
  }, []);
  
  const disableAutoSave = useCallback(() => {
    autoSaveEnabledRef.current = false;
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, []);

  const clearError = useCallback(() => setSaveError(null), []);
  
  const hasUnsavedChanges = useCallback(() => isDirty, [isDirty]);

  const getStorageInfo = useCallback(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        };
      });
    }
    return { used: 0, quota: 0, available: 0 };
  }, []);

  // Setup intervals
  useEffect(() => {
    // Auto-save interval
    if (finalConfig.autoSaveEnabled) {
      autoSaveIntervalRef.current = setInterval(() => {
        if (isDirty && lastDataRef.current) {
          performAutoSave(lastDataRef.current);
        }
      }, finalConfig.autoSaveIntervalMs);
    }

    // Backup interval
    if (finalConfig.maxBackups! > 0) {
      backupIntervalRef.current = setInterval(() => {
        if (lastDataRef.current) {
          createBackup(lastDataRef.current, `Auto-backup ${new Date().toLocaleString()}`);
        }
      }, finalConfig.backupIntervalMs);
    }

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
      if (backupIntervalRef.current) clearInterval(backupIntervalRef.current);
    };
  }, [finalConfig, isDirty, performAutoSave, createBackup]);

  // Initialize backup count
  useEffect(() => {
    setBackupCount(listBackups().length);
  }, [listBackups]);

  return {
    // State
    isDirty,
    isSaving,
    isLoading,
    lastSaved,
    lastAutoSave,
    saveError,
    backupCount,
    
    // Actions
    save,
    load,
    markDirty,
    markClean,
    
    // Auto-save control
    enableAutoSave,
    disableAutoSave,
    
    // Backup management
    createBackup,
    restoreBackup,
    listBackups,
    deleteBackup,
    
    // Utilities
    clearError,
    hasUnsavedChanges,
    getStorageInfo
  };
}