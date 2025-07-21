// /Users/montysharma/v11m2/src/services/UnifiedPersistenceService.ts
// Unified Persistence Service - Consolidates all backup/persistence functionality
// Replaces: ContentStudio.createBackup(), useStudioPersistence, ArcExportImport

import { ContentExportService, ExportOptions, ImportOptions, ExportPackage, ImportResult } from './ContentExportService';
import { StorageAdapter } from './storage/StorageAdapter';
import { ChunkedStorageAdapter } from './storage/ChunkedStorageAdapter';
import { StorageFactory } from './storage/StorageFactory';

interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  debounceMs: number;
  maxBackups: number;
  backupIntervalMs: number;
}

interface BackupMetadata {
  id: string;
  label: string;
  timestamp: Date;
  size: number;
  type: 'auto' | 'manual' | 'pre-action';
  exportOptions: ExportOptions;
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

interface PersistenceStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup: Date | null;
  newestBackup: Date | null;
  autoBackups: number;
  manualBackups: number;
}

/**
 * UnifiedPersistenceService consolidates all backup and persistence functionality
 * into a single, comprehensive service that replaces fragmented implementations.
 * 
 * Features:
 * - Auto-save with debouncing and intervals
 * - Backup management with rotation and labeling
 * - Manual and pre-action backups
 * - Storage adapter abstraction with chunking
 * - ContentExportService integration
 * - Real-time status tracking
 */
export class UnifiedPersistenceService {
  private contentExportService: ContentExportService;
  private storageAdapter: StorageAdapter;
  private autoSaveConfig: AutoSaveConfig;
  
  // State management
  private state: PersistenceState = {
    isDirty: false,
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    lastAutoSave: null,
    saveError: null,
    backupCount: 0
  };
  
  // Timers for auto-save
  private autoSaveTimeout: NodeJS.Timeout | null = null;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private backupInterval: NodeJS.Timeout | null = null;
  
  // Event callbacks
  private stateChangeCallback?: (state: PersistenceState) => void;
  private backupCreatedCallback?: (backup: BackupMetadata) => void;
  
  constructor(
    storageAdapter?: StorageAdapter,
    config: Partial<AutoSaveConfig> = {},
    onStateChange?: (state: PersistenceState) => void,
    onBackupCreated?: (backup: BackupMetadata) => void
  ) {
    this.autoSaveConfig = {
      enabled: true,
      intervalMs: 30000, // 30 seconds
      debounceMs: 2000,  // 2 seconds after last change
      maxBackups: 10,    // Keep more backups than individual systems
      backupIntervalMs: 300000, // 5 minutes
      ...config
    };
    
    this.stateChangeCallback = onStateChange;
    this.backupCreatedCallback = onBackupCreated;
    
    // Initialize storage adapter with chunking enabled by default
    // Note: This is async but we don't await in constructor
    this.initializeStorage(storageAdapter);
  }

  /**
   * Ensure the service is fully initialized before use
   */
  async initialize(): Promise<void> {
    // Wait for storage initialization to complete
    if (!this.storageAdapter) {
      await new Promise(resolve => {
        const checkInitialized = () => {
          if (this.storageAdapter) {
            resolve(undefined);
          } else {
            setTimeout(checkInitialized, 10);
          }
        };
        checkInitialized();
      });
    }
  }

  private async initializeStorage(providedAdapter?: StorageAdapter): Promise<void> {
    try {
      if (providedAdapter) {
        this.storageAdapter = providedAdapter;
      } else {
        // Create chunked storage adapter for large backup handling
        this.storageAdapter = await StorageFactory.createAdapter({
          type: 'auto',
          enableChunking: true,
          chunkingOptions: {
            chunkSizeBytes: 1024 * 1024, // 1MB chunks
            maxChunks: 500, // Support up to 500MB backups
            compressionEnabled: false // Let ContentExportService handle compression
          }
        });
      }
      
      this.contentExportService = new ContentExportService(this.storageAdapter);
      
      // Initialize backup count
      await this.updateBackupCount();
      
      // Setup auto-save intervals if enabled
      if (this.autoSaveConfig.enabled) {
        this.setupAutoSave();
      }
      
      console.log('✅ UnifiedPersistenceService initialized with chunked storage');
    } catch (error) {
      console.error('❌ Failed to initialize UnifiedPersistenceService:', error);
      throw error;
    }
  }

  /**
   * Create a backup with specified type and options
   */
  async createBackup(
    type: 'auto' | 'manual' | 'pre-action' = 'manual',
    label?: string,
    exportOptions?: Partial<ExportOptions>
  ): Promise<{ success: boolean; backupId?: string; error?: string }> {
    const startTime = Date.now();
    
    try {
      this.updateState({ isSaving: true, saveError: null });
      
      const timestamp = new Date().toISOString();
      const backupId = `backup_${type}_${Date.now()}`;
      
      // Default export options optimized for backups
      const defaultOptions: ExportOptions = {
        format: 'compressed', // Use compression for backups
        includeMetadata: true,
        validateDependencies: false, // Skip for speed
        includePreferences: true,
        compressionLevel: 3 // Balanced compression
      };
      
      const finalOptions = { ...defaultOptions, ...exportOptions };
      
      // Create export package
      const exportPackage = await this.contentExportService.exportProject(finalOptions);
      
      // Create backup metadata
      const backupMetadata: BackupMetadata = {
        id: backupId,
        label: label || `${type.charAt(0).toUpperCase() + type.slice(1)} backup ${new Date().toLocaleString()}`,
        timestamp: new Date(),
        size: JSON.stringify(exportPackage).length,
        type,
        exportOptions: finalOptions
      };
      
      // Store backup data and metadata
      await this.storageAdapter.setItem(`backup_data_${backupId}`, JSON.stringify(exportPackage));
      await this.storageAdapter.setItem(`backup_meta_${backupId}`, JSON.stringify(backupMetadata));
      
      // Manage backup retention
      await this.cleanupOldBackups();
      
      // Update state
      const duration = Date.now() - startTime;
      this.updateState({
        isSaving: false,
        lastSaved: new Date(),
        isDirty: false
      });
      
      if (type === 'auto') {
        this.updateState({ lastAutoSave: new Date() });
      }
      
      await this.updateBackupCount();
      
      // Notify callback
      if (this.backupCreatedCallback) {
        this.backupCreatedCallback(backupMetadata);
      }
      
      console.log(`✅ ${type} backup created: ${backupId} (${this.formatBytes(backupMetadata.size)}) in ${duration}ms`);
      return { success: true, backupId };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ ${type} backup failed:`, error);
      
      this.updateState({
        isSaving: false,
        saveError: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Auto-save functionality - creates backup when data is dirty
   */
  async autoSave(): Promise<boolean> {
    if (!this.state.isDirty || this.state.isSaving) {
      return false;
    }
    
    const result = await this.createBackup('auto', undefined, {
      format: 'json', // Faster for auto-saves
      compressionLevel: 1 // Fastest compression
    });
    
    return result.success;
  }

  /**
   * Pre-action backup - called before destructive operations
   */
  async createPreActionBackup(actionName: string): Promise<boolean> {
    const result = await this.createBackup('pre-action', `Before ${actionName}`, {
      format: 'compressed',
      compressionLevel: 2 // Good compression for safety
    });
    
    return result.success;
  }

  /**
   * Load backup by ID
   */
  async loadBackup(backupId: string): Promise<{ success: boolean; data?: ExportPackage; error?: string }> {
    try {
      this.updateState({ isLoading: true, saveError: null });
      
      const backupData = await this.storageAdapter.getItem(`backup_data_${backupId}`);
      if (!backupData) {
        throw new Error('Backup not found');
      }
      
      const exportPackage: ExportPackage = JSON.parse(backupData);
      
      this.updateState({ isLoading: false });
      console.log(`✅ Loaded backup: ${backupId}`);
      
      return { success: true, data: exportPackage };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to load backup ${backupId}:`, error);
      
      this.updateState({
        isLoading: false,
        saveError: errorMessage
      });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(
    backupId: string,
    importOptions?: Partial<ImportOptions>
  ): Promise<ImportResult> {
    try {
      const loadResult = await this.loadBackup(backupId);
      if (!loadResult.success || !loadResult.data) {
        throw new Error(loadResult.error || 'Failed to load backup');
      }
      
      // Import the backup data
      const result = await this.contentExportService.importProject(loadResult.data, {
        allowLegacyFormat: true,
        overwriteExisting: true,
        validateContent: true,
        ...importOptions
      });
      
      if (result.success) {
        console.log(`✅ Restored from backup: ${backupId}`);
        this.markClean();
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to restore from backup ${backupId}:`, error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const allKeys = await this.storageAdapter.getKeys();
      const metaKeys = allKeys.filter(key => key.startsWith('backup_meta_'));
      
      const backups: BackupMetadata[] = [];
      
      for (const metaKey of metaKeys) {
        try {
          const metaData = await this.storageAdapter.getItem(metaKey);
          if (metaData) {
            const backup: BackupMetadata = JSON.parse(metaData);
            // Convert timestamp string to Date object if needed
            if (typeof backup.timestamp === 'string') {
              backup.timestamp = new Date(backup.timestamp);
            }
            backups.push(backup);
          }
        } catch (error) {
          console.warn(`Failed to parse backup metadata: ${metaKey}`, error);
        }
      }
      
      // Sort by timestamp (newest first)
      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      await this.storageAdapter.removeItem(`backup_data_${backupId}`);
      await this.storageAdapter.removeItem(`backup_meta_${backupId}`);
      
      await this.updateBackupCount();
      console.log(`✅ Deleted backup: ${backupId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to delete backup ${backupId}:`, error);
      return false;
    }
  }

  /**
   * Get persistence statistics
   */
  async getStats(): Promise<PersistenceStats> {
    const backups = await this.listBackups();
    
    return {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      newestBackup: backups.length > 0 ? backups[0].timestamp : null,
      autoBackups: backups.filter(b => b.type === 'auto').length,
      manualBackups: backups.filter(b => b.type === 'manual').length
    };
  }

  /**
   * Storage adapter management
   */
  getStorageAdapter(): StorageAdapter {
    return this.storageAdapter;
  }

  getContentExportService(): ContentExportService {
    return this.contentExportService;
  }

  async getStorageInfo() {
    return this.storageAdapter.getStorageInfo();
  }

  /**
   * State management
   */
  getState(): PersistenceState {
    return { ...this.state };
  }

  markDirty(): void {
    if (!this.state.isDirty) {
      this.updateState({ isDirty: true });
      this.scheduleAutoSave();
    }
  }

  markClean(): void {
    this.updateState({ isDirty: false });
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
  }

  clearError(): void {
    this.updateState({ saveError: null });
  }

  /**
   * Auto-save control
   */
  enableAutoSave(): void {
    this.autoSaveConfig.enabled = true;
    this.setupAutoSave();
  }

  disableAutoSave(): void {
    this.autoSaveConfig.enabled = false;
    this.clearAutoSaveTimers();
  }

  private setupAutoSave(): void {
    this.clearAutoSaveTimers();
    
    if (!this.autoSaveConfig.enabled) return;
    
    // Periodic auto-save interval
    this.autoSaveInterval = setInterval(() => {
      if (this.state.isDirty && !this.state.isSaving) {
        this.autoSave();
      }
    }, this.autoSaveConfig.intervalMs);
    
    // Periodic backup interval
    this.backupInterval = setInterval(() => {
      this.createBackup('auto');
    }, this.autoSaveConfig.backupIntervalMs);
  }

  private scheduleAutoSave(): void {
    if (!this.autoSaveConfig.enabled) return;
    
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      if (this.state.isDirty && !this.state.isSaving) {
        this.autoSave();
      }
    }, this.autoSaveConfig.debounceMs);
  }

  private clearAutoSaveTimers(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= this.autoSaveConfig.maxBackups) {
        return;
      }
      
      // Keep newest backups, delete oldest
      const backupsToDelete = backups
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) // Oldest first
        .slice(0, backups.length - this.autoSaveConfig.maxBackups);
      
      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.id);
      }
      
      console.log(`🧹 Cleaned up ${backupsToDelete.length} old backups`);
      
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  private async updateBackupCount(): Promise<void> {
    try {
      const backups = await this.listBackups();
      this.updateState({ backupCount: backups.length });
    } catch (error) {
      console.warn('Failed to update backup count:', error);
    }
  }

  private updateState(updates: Partial<PersistenceState>): void {
    this.state = { ...this.state, ...updates };
    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.state);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearAutoSaveTimers();
    console.log('🧹 UnifiedPersistenceService destroyed');
  }
}