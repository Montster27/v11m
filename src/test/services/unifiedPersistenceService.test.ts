// /Users/montysharma/v11m2/src/test/services/unifiedPersistenceService.test.ts
// Test suite for UnifiedPersistenceService

import { UnifiedPersistenceService } from '../../services/UnifiedPersistenceService';
import { LocalStorageAdapter } from '../../services/storage/LocalStorageAdapter';
import { ChunkedStorageAdapter } from '../../services/storage/ChunkedStorageAdapter';

describe('UnifiedPersistenceService', () => {
  let baseAdapter: LocalStorageAdapter;
  let chunkedAdapter: ChunkedStorageAdapter;
  let service: UnifiedPersistenceService;

  beforeEach(async () => {
    baseAdapter = new LocalStorageAdapter();
    await baseAdapter.clear();
    
    // Use chunked adapter for realistic large backup testing
    chunkedAdapter = new ChunkedStorageAdapter(baseAdapter, {
      chunkSizeBytes: 1024, // 1KB chunks
      maxChunks: 100
    });
    
    service = new UnifiedPersistenceService(chunkedAdapter, {
      enabled: false, // Disable auto-save for controlled testing
      maxBackups: 5
    });
    await service.initialize();
  });

  afterEach(async () => {
    if (service) {
      service.destroy();
    }
    await chunkedAdapter.clear();
    await baseAdapter.clear();
  });

  describe('Backup Creation', () => {
    test('should create manual backup', async () => {
      const result = await service.createBackup('manual', 'Test backup');
      
      expect(result.success).toBe(true);
      expect(result.backupId).toBeDefined();
      
      const backups = await service.listBackups();
      expect(backups.length).toBe(1);
      expect(backups[0].label).toBe('Test backup');
      expect(backups[0].type).toBe('manual');
    });

    test('should create auto backup', async () => {
      const result = await service.createBackup('auto');
      
      expect(result.success).toBe(true);
      
      const backups = await service.listBackups();
      expect(backups.length).toBe(1);
      expect(backups[0].type).toBe('auto');
      expect(backups[0].label).toContain('Auto backup');
    });

    test('should create pre-action backup', async () => {
      const result = await service.createPreActionBackup('Delete storylet');
      
      expect(result).toBe(true);
      
      const backups = await service.listBackups();
      expect(backups.length).toBe(1);
      expect(backups[0].type).toBe('pre-action');
      expect(backups[0].label).toContain('Before Delete storylet');
    });

    test('should handle backup with compression', async () => {
      const result = await service.createBackup('manual', 'Compressed backup', {
        format: 'compressed',
        compressionLevel: 3
      });
      
      expect(result.success).toBe(true);
      
      const backups = await service.listBackups();
      expect(backups.length).toBe(1);
      expect(backups[0].size).toBeGreaterThan(0);
    });
  });

  describe('Backup Management', () => {
    test('should list backups in chronological order', async () => {
      // Create multiple backups with slight delays
      await service.createBackup('manual', 'First backup');
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.createBackup('manual', 'Second backup');
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.createBackup('manual', 'Third backup');
      
      const backups = await service.listBackups();
      expect(backups.length).toBe(3);
      
      // Should be sorted newest first
      expect(backups[0].label).toBe('Third backup');
      expect(backups[1].label).toBe('Second backup');
      expect(backups[2].label).toBe('First backup');
    });

    test('should delete backup', async () => {
      const result = await service.createBackup('manual', 'Test backup');
      expect(result.success).toBe(true);
      
      const backups = await service.listBackups();
      expect(backups.length).toBe(1);
      
      const deleted = await service.deleteBackup(backups[0].id);
      expect(deleted).toBe(true);
      
      const remainingBackups = await service.listBackups();
      expect(remainingBackups.length).toBe(0);
    });

    test('should cleanup old backups when limit exceeded', async () => {
      // Create more backups than the limit (5)
      for (let i = 1; i <= 7; i++) {
        await service.createBackup('manual', `Backup ${i}`);
        await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      }
      
      const backups = await service.listBackups();
      expect(backups.length).toBe(5); // Should be limited to 5
      
      // Newest backups should remain
      expect(backups[0].label).toBe('Backup 7');
      expect(backups[4].label).toBe('Backup 3');
    });
  });

  describe('Backup Load and Restore', () => {
    test('should load backup data', async () => {
      const result = await service.createBackup('manual', 'Test backup');
      expect(result.success).toBe(true);
      
      const backups = await service.listBackups();
      const backupId = backups[0].id;
      
      const loadResult = await service.loadBackup(backupId);
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toBeDefined();
      expect(loadResult.data?.version).toBe('2.0');
    });

    test('should handle missing backup', async () => {
      const loadResult = await service.loadBackup('nonexistent-backup');
      expect(loadResult.success).toBe(false);
      expect(loadResult.error).toBeDefined();
    });

    test('should restore from backup', async () => {
      // Create a backup
      const result = await service.createBackup('manual', 'Test backup');
      expect(result.success).toBe(true);
      
      const backups = await service.listBackups();
      const backupId = backups[0].id;
      
      // Restore from backup
      const restoreResult = await service.restoreFromBackup(backupId);
      expect(restoreResult.success).toBe(true);
    });
  });

  describe('State Management', () => {
    test('should track dirty state', async () => {
      const initialState = service.getState();
      expect(initialState.isDirty).toBe(false);
      
      service.markDirty();
      const dirtyState = service.getState();
      expect(dirtyState.isDirty).toBe(true);
      
      service.markClean();
      const cleanState = service.getState();
      expect(cleanState.isDirty).toBe(false);
    });

    test('should track saving state during backup', async () => {
      let capturedStates: any[] = [];
      
      // Create service with state callback
      const serviceWithCallback = new UnifiedPersistenceService(
        chunkedAdapter,
        { enabled: false, maxBackups: 5 },
        (state) => capturedStates.push({...state})
      );
      await serviceWithCallback.initialize();
      
      await serviceWithCallback.createBackup('manual', 'Test');
      
      expect(capturedStates.length).toBeGreaterThan(0);
      
      // Should have captured saving state
      const savingStates = capturedStates.filter(s => s.isSaving);
      expect(savingStates.length).toBeGreaterThan(0);
      
      serviceWithCallback.destroy();
    });

    test('should track backup count', async () => {
      const initialState = service.getState();
      expect(initialState.backupCount).toBe(0);
      
      await service.createBackup('manual', 'First backup');
      const stateAfterFirst = service.getState();
      expect(stateAfterFirst.backupCount).toBe(1);
      
      await service.createBackup('manual', 'Second backup');
      const stateAfterSecond = service.getState();
      expect(stateAfterSecond.backupCount).toBe(2);
    });
  });

  describe('Statistics and Storage Info', () => {
    test('should provide accurate statistics', async () => {
      await service.createBackup('auto', 'Auto backup 1');
      await service.createBackup('manual', 'Manual backup 1');
      await service.createBackup('auto', 'Auto backup 2');
      
      const stats = await service.getStats();
      expect(stats.totalBackups).toBe(3);
      expect(stats.autoBackups).toBe(2);
      expect(stats.manualBackups).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestBackup).toBeDefined();
      expect(stats.newestBackup).toBeDefined();
    });

    test('should provide storage information', async () => {
      const storageInfo = await service.getStorageInfo();
      expect(storageInfo.usage).toBeGreaterThanOrEqual(0);
      expect(storageInfo.quota).toBeGreaterThan(0);
      expect(storageInfo.available).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Auto-save functionality', () => {
    test('should perform auto-save when dirty', async () => {
      // Enable auto-save for this test
      const autoSaveService = new UnifiedPersistenceService(chunkedAdapter, {
        enabled: true,
        intervalMs: 100, // Very short for testing
        debounceMs: 50,
        maxBackups: 5
      });
      await autoSaveService.initialize();
      
      // Mark dirty and wait for auto-save
      autoSaveService.markDirty();
      const result = await autoSaveService.autoSave();
      
      expect(result).toBe(true);
      
      const backups = await autoSaveService.listBackups();
      expect(backups.length).toBe(1);
      expect(backups[0].type).toBe('auto');
      
      autoSaveService.destroy();
    });

    test('should not auto-save when clean', async () => {
      const autoSaveService = new UnifiedPersistenceService(chunkedAdapter, {
        enabled: true,
        maxBackups: 5
      });
      await autoSaveService.initialize();
      
      // Don't mark dirty
      const result = await autoSaveService.autoSave();
      expect(result).toBe(false);
      
      const backups = await autoSaveService.listBackups();
      expect(backups.length).toBe(0);
      
      autoSaveService.destroy();
    });
  });

  describe('Large Data Handling', () => {
    test('should handle large backup data with chunking', async () => {
      // Create a backup that will be chunked
      const result = await service.createBackup('manual', 'Large backup', {
        format: 'json', // Larger than compressed
        includeMetadata: true
      });
      
      expect(result.success).toBe(true);
      
      // Verify backup can be loaded
      const backups = await service.listBackups();
      const loadResult = await service.loadBackup(backups[0].id);
      
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      // Create a service with a failing adapter
      const failingAdapter = {
        ...chunkedAdapter,
        setItem: async () => { throw new Error('Storage failed'); }
      };
      
      const failingService = new UnifiedPersistenceService(failingAdapter as any, {
        enabled: false,
        maxBackups: 5
      });
      await failingService.initialize();
      
      const result = await failingService.createBackup('manual', 'Failing backup');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      failingService.destroy();
    });
  });
});