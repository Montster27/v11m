// /Users/montysharma/v11m2/src/test/integration/serviceLayer.test.ts
// Integration tests for service layer, API endpoints, and business logic validation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAllStores, waitForStoreUpdate } from '../utils/gameTestUtils';

// Core Services
import { UnifiedPersistenceService } from '../../services/UnifiedPersistenceService';
import { ContentExportService } from '../../services/ContentExportService';
import { BackupMonitoringService } from '../../services/BackupMonitoringService';
import { BackupSchedulerService } from '../../services/BackupSchedulerService';

// Storage Services
import { MigrationService } from '../../services/storage/MigrationService';
import { StorageFactory } from '../../services/storage/StorageFactory';
import { CompressionService } from '../../services/compression/CompressionService';

// Business Logic
import { questEngine } from '../../engine/questEngine';
import { MinigameEngine } from '../../components/minigames/core/MinigameEngine';
import { DifficultyManager } from '../../components/minigames/core/DifficultyManager';

// Validation and Utilities
import { validation } from '../../utils/validation';
import { errorHandling } from '../../utils/errorHandling';

// API Layer
import { storyletFileOperations } from '../../api/storyletFileOperations';

describe('Service Layer Integration Tests', () => {
  beforeEach(() => {
    resetAllStores();
    vi.clearAllMocks();
  });

  describe('UnifiedPersistenceService', () => {
    it('should handle auto-save functionality with debouncing', async () => {
      const persistenceService = new UnifiedPersistenceService();
      const mockAdapter = vi.fn();
      
      // Initialize with test configuration
      await persistenceService.initialize({
        adapter: mockAdapter,
        autoSaveInterval: 100, // Short interval for testing
        debounceMs: 50,
        maxBackups: 5
      });

      // Trigger multiple save operations quickly
      persistenceService.requestSave({ test: 'data1' });
      persistenceService.requestSave({ test: 'data2' });
      persistenceService.requestSave({ test: 'data3' });

      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 100));

      // Only the last save should have been processed due to debouncing
      expect(persistenceService.getLastSaveTime()).toBeGreaterThan(0);
      expect(persistenceService.getPendingSaves()).toBe(0);
    });

    it('should manage backup rotation correctly', async () => {
      const persistenceService = new UnifiedPersistenceService();
      
      // Create multiple backups
      for (let i = 0; i < 7; i++) {
        await persistenceService.createBackup(`backup-${i}`, { data: `test-${i}` });
      }

      const backups = persistenceService.listBackups();
      expect(backups.length).toBeLessThanOrEqual(5); // Should respect maxBackups limit
      expect(backups[0].label).toContain('backup-'); // Most recent should be first
    });

    it('should handle storage failures gracefully', async () => {
      const persistenceService = new UnifiedPersistenceService();
      const failingAdapter = {
        save: vi.fn().mockRejectedValue(new Error('Storage failed')),
        load: vi.fn().mockRejectedValue(new Error('Load failed')),
        delete: vi.fn().mockRejectedValue(new Error('Delete failed'))
      };

      await persistenceService.initialize({
        adapter: failingAdapter,
        retryAttempts: 3,
        retryDelayMs: 10
      });

      // Should handle failures and retry
      await expect(persistenceService.requestSave({ test: 'data' })).rejects.toThrow();
      expect(failingAdapter.save).toHaveBeenCalledTimes(3); // Should retry 3 times
    });

    it('should validate data integrity during save/load', async () => {
      const persistenceService = new UnifiedPersistenceService();
      const testData = {
        storylets: { 'test-1': { id: 'test-1', title: 'Test' } },
        player: { level: 5, experience: 1000 },
        checksum: 'test-checksum'
      };

      await persistenceService.createBackup('integrity-test', testData);
      const loaded = await persistenceService.loadBackup('integrity-test');

      expect(loaded).toEqual(testData);
      expect(persistenceService.validateDataIntegrity(loaded)).toBe(true);
    });
  });

  describe('ContentExportService', () => {
    it('should export project content with proper structure', async () => {
      const exportService = new ContentExportService();
      
      // Mock project data
      const projectData = {
        storylets: {
          'storylet-1': { id: 'storylet-1', title: 'Test Storylet' },
          'storylet-2': { id: 'storylet-2', title: 'Another Storylet' }
        },
        storyArcs: ['arc-1', 'arc-2'],
        characters: { 'char-1': { id: 'char-1', name: 'Test Character' } }
      };

      const exported = await exportService.exportProject(projectData);

      expect(exported).toHaveProperty('metadata');
      expect(exported.metadata).toHaveProperty('version');
      expect(exported.metadata).toHaveProperty('exportedAt');
      expect(exported).toHaveProperty('content');
      expect(exported.content.storylets).toHaveLength(2);
      expect(exported.content.storyArcs).toHaveLength(2);
    });

    it('should validate dependencies during export', async () => {
      const exportService = new ContentExportService();
      
      // Create content with missing dependencies
      const invalidData = {
        storylets: {
          'storylet-1': { 
            id: 'storylet-1', 
            title: 'Test',
            requirements: { flags: { 'missing-flag': true } }
          }
        },
        flags: {} // Missing the required flag
      };

      const validationResult = await exportService.validateDependencies(invalidData);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.missingDependencies).toContain('missing-flag');
    });

    it('should handle import with transaction support', async () => {
      const exportService = new ContentExportService();
      
      const validImportData = {
        metadata: { version: '1.0.0', exportedAt: Date.now() },
        content: {
          storylets: [{ id: 'imported-1', title: 'Imported Storylet' }],
          storyArcs: ['imported-arc']
        }
      };

      const result = await exportService.importProject(validImportData);
      expect(result.success).toBe(true);
      expect(result.imported.storylets).toBe(1);
      expect(result.imported.storyArcs).toBe(1);

      // Test rollback on failure
      const invalidImportData = {
        metadata: { version: '999.0.0' }, // Unsupported version
        content: { malformed: 'data' }
      };

      const failResult = await exportService.importProject(invalidImportData);
      expect(failResult.success).toBe(false);
      expect(failResult.rollbackPerformed).toBe(true);
    });

    it('should compress large exports efficiently', async () => {
      const exportService = new ContentExportService();
      
      // Create large dataset
      const largeData = {
        storylets: {}
      };
      
      for (let i = 0; i < 1000; i++) {
        largeData.storylets[`storylet-${i}`] = {
          id: `storylet-${i}`,
          title: `Storylet ${i}`,
          content: 'Lorem ipsum '.repeat(100) // Large content
        };
      }

      const exportOptions = { compress: true, compressionLevel: 6 };
      const exported = await exportService.exportProject(largeData, exportOptions);

      expect(exported.metadata.compressed).toBe(true);
      expect(exported.metadata.originalSize).toBeGreaterThan(exported.metadata.compressedSize);
      expect(exported.metadata.compressionRatio).toBeGreaterThan(0.5); // Should achieve decent compression
    });
  });

  describe('BackupMonitoringService', () => {
    it('should track storage usage and trends', async () => {
      const monitoringService = new BackupMonitoringService();
      await monitoringService.initialize();

      // Simulate storage usage over time
      for (let i = 0; i < 10; i++) {
        await monitoringService.recordStorageUsage(1000 + i * 100); // Increasing usage
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const metrics = monitoringService.getStorageMetrics();
      expect(metrics.currentUsage).toBe(1900);
      expect(metrics.trend).toBe('increasing');
      expect(metrics.growthRate).toBeGreaterThan(0);
    });

    it('should generate alerts for critical conditions', async () => {
      const monitoringService = new BackupMonitoringService();
      await monitoringService.initialize({
        storageThreshold: 5000, // 5KB threshold
        backupFailureThreshold: 3
      });

      const alerts = [];
      monitoringService.onAlert(alert => alerts.push(alert));

      // Trigger storage threshold alert
      await monitoringService.recordStorageUsage(6000);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('storage_threshold');

      // Trigger backup failure alert
      for (let i = 0; i < 3; i++) {
        await monitoringService.recordBackupFailure('test-backup', new Error('Test error'));
      }
      expect(alerts).toHaveLength(2);
      expect(alerts[1].type).toBe('backup_failures');
    });

    it('should calculate backup frequency metrics', async () => {
      const monitoringService = new BackupMonitoringService();
      await monitoringService.initialize();

      // Record backup events
      const now = Date.now();
      await monitoringService.recordBackupSuccess('backup-1', now - 3600000); // 1 hour ago
      await monitoringService.recordBackupSuccess('backup-2', now - 1800000); // 30 min ago
      await monitoringService.recordBackupSuccess('backup-3', now); // Now

      const frequency = monitoringService.getBackupFrequency();
      expect(frequency.averageInterval).toBeLessThan(3600000); // Less than 1 hour
      expect(frequency.lastBackup).toBeLessThan(60000); // Less than 1 minute ago
      expect(frequency.successRate).toBe(1.0); // 100% success rate
    });
  });

  describe('BackupSchedulerService', () => {
    it('should create and execute scheduled backups', async () => {
      const schedulerService = new BackupSchedulerService();
      const backupCallbacks = [];

      await schedulerService.initialize({
        onBackupCreated: (backup) => backupCallbacks.push(backup)
      });

      // Schedule a backup every 100ms for testing
      schedulerService.scheduleBackup('test-schedule', {
        interval: 100,
        label: 'Test Backup',
        retentionDays: 7
      });

      // Wait for at least one backup to be created
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(backupCallbacks.length).toBeGreaterThan(0);
      expect(backupCallbacks[0].label).toContain('Test Backup');

      // Clean up
      schedulerService.cancelSchedule('test-schedule');
    });

    it('should handle schedule conflicts and priorities', async () => {
      const schedulerService = new BackupSchedulerService();
      
      // Schedule multiple overlapping backups
      schedulerService.scheduleBackup('high-priority', {
        interval: 100,
        priority: 10,
        label: 'High Priority'
      });

      schedulerService.scheduleBackup('low-priority', {
        interval: 100,
        priority: 1,
        label: 'Low Priority'
      });

      const schedules = schedulerService.getActiveSchedules();
      expect(schedules).toHaveLength(2);
      expect(schedules[0].priority).toBe(10); // Should be sorted by priority

      // Clean up
      schedulerService.cancelAllSchedules();
    });
  });

  describe('Quest Engine Business Logic', () => {
    it('should generate quests based on game state', async () => {
      const gameState = {
        day: 15,
        resources: { energy: 80, stress: 30, money: 100, knowledge: 150 },
        flags: { 'intro_completed': true, 'has_job': false }
      };

      const availableQuests = questEngine.generateQuests(gameState);
      
      expect(availableQuests).toBeDefined();
      expect(Array.isArray(availableQuests)).toBe(true);
      
      // Should have appropriate quests for mid-game state
      const questIds = availableQuests.map(q => q.id);
      expect(questIds.some(id => id.includes('job') || id.includes('employment'))).toBe(true);
    });

    it('should evaluate quest completion conditions', async () => {
      const testQuest = {
        id: 'test-quest',
        title: 'Test Quest',
        conditions: {
          resources: { knowledge: 200 },
          flags: { 'study_hard': true }
        },
        rewards: {
          resources: { money: 50 },
          flags: { 'quest_completed': true }
        }
      };

      const gameState = {
        resources: { knowledge: 250 },
        flags: { 'study_hard': true }
      };

      const isComplete = questEngine.evaluateCompletion(testQuest, gameState);
      expect(isComplete).toBe(true);

      // Test incomplete state
      const incompleteState = {
        resources: { knowledge: 150 },
        flags: { 'study_hard': false }
      };

      const isIncomplete = questEngine.evaluateCompletion(testQuest, incompleteState);
      expect(isIncomplete).toBe(false);
    });

    it('should prioritize quests correctly', async () => {
      const quests = [
        { id: 'urgent', priority: 10, urgency: 'high' },
        { id: 'normal', priority: 5, urgency: 'medium' },
        { id: 'optional', priority: 1, urgency: 'low' }
      ];

      const prioritized = questEngine.prioritizeQuests(quests);
      expect(prioritized[0].id).toBe('urgent');
      expect(prioritized[1].id).toBe('normal');
      expect(prioritized[2].id).toBe('optional');
    });
  });

  describe('Minigame Engine Business Logic', () => {
    it('should manage game sessions correctly', async () => {
      const sessionId = await MinigameEngine.createSession('memory-cards', {
        difficulty: 'medium',
        timeLimit: 180
      });

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');

      const session = MinigameEngine.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session.gameId).toBe('memory-cards');
      expect(session.config.difficulty).toBe('medium');
      expect(session.status).toBe('active');

      // End session
      await MinigameEngine.endSession(sessionId, { success: true, score: 100 });
      const endedSession = MinigameEngine.getSession(sessionId);
      expect(endedSession.status).toBe('completed');
    });

    it('should handle pause and resume functionality', async () => {
      const sessionId = await MinigameEngine.createSession('word-scramble', {
        difficulty: 'easy'
      });

      const session = MinigameEngine.getSession(sessionId);
      const startTime = session.startTime;

      // Pause the session
      MinigameEngine.pauseSession(sessionId);
      const pausedSession = MinigameEngine.getSession(sessionId);
      expect(pausedSession.status).toBe('paused');
      expect(pausedSession.pausedAt).toBeDefined();

      // Wait and resume
      await new Promise(resolve => setTimeout(resolve, 50));
      MinigameEngine.resumeSession(sessionId);
      const resumedSession = MinigameEngine.getSession(sessionId);
      expect(resumedSession.status).toBe('active');
      expect(resumedSession.totalPausedTime).toBeGreaterThan(0);
    });

    it('should track comprehensive game statistics', async () => {
      // Record multiple game results
      const gameResults = [
        { gameId: 'memory-cards', success: true, score: 100, timeElapsed: 120000 },
        { gameId: 'memory-cards', success: false, score: 60, timeElapsed: 180000 },
        { gameId: 'word-scramble', success: true, score: 85, timeElapsed: 90000 }
      ];

      for (const result of gameResults) {
        await MinigameEngine.recordResult(result.gameId, result);
      }

      const memoryStats = MinigameEngine.getGameStats('memory-cards');
      expect(memoryStats.totalPlays).toBe(2);
      expect(memoryStats.totalWins).toBe(1);
      expect(memoryStats.totalLosses).toBe(1);
      expect(memoryStats.bestScore).toBe(100);
      expect(memoryStats.winRate).toBe(0.5);

      const overallStats = MinigameEngine.getOverallStats();
      expect(overallStats.totalGames).toBe(2); // 2 unique games
      expect(overallStats.totalPlays).toBe(3);
      expect(overallStats.overallWinRate).toBeCloseTo(0.67, 2); // 2/3 wins
    });
  });

  describe('Difficulty Manager Business Logic', () => {
    it('should calculate appropriate difficulty adjustments', async () => {
      const difficultyManager = new DifficultyManager();
      
      // Simulate player performance history
      const performanceHistory = [
        { success: true, score: 95, timeElapsed: 100000 },
        { success: true, score: 88, timeElapsed: 110000 },
        { success: true, score: 92, timeElapsed: 95000 },
        { success: false, score: 45, timeElapsed: 180000 },
        { success: true, score: 87, timeElapsed: 105000 }
      ];

      for (const performance of performanceHistory) {
        difficultyManager.recordPerformance('memory-cards', performance);
      }

      const adjustment = difficultyManager.calculateDifficultyAdjustment('memory-cards');
      expect(adjustment).toBeDefined();
      expect(adjustment.direction).toBeOneOf(['increase', 'decrease', 'maintain']);
      expect(adjustment.confidence).toBeGreaterThan(0);
      expect(adjustment.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle adaptive difficulty for different game types', async () => {
      const difficultyManager = new DifficultyManager();
      
      // Test cognitive game adjustment (memory cards)
      difficultyManager.recordPerformance('memory-cards', { success: true, score: 100 });
      const cognitiveAdjustment = difficultyManager.calculateDifficultyAdjustment('memory-cards');
      
      // Test reaction game adjustment (color match)
      difficultyManager.recordPerformance('color-match', { success: false, score: 30 });
      const reactionAdjustment = difficultyManager.calculateDifficultyAdjustment('color-match');
      
      expect(cognitiveAdjustment.parameters).toBeDefined();
      expect(reactionAdjustment.parameters).toBeDefined();
      
      // Different games should have different adjustment strategies
      expect(cognitiveAdjustment.gameType).toBe('cognitive');
      expect(reactionAdjustment.gameType).toBe('reaction');
    });

    it('should prevent difficulty oscillation', async () => {
      const difficultyManager = new DifficultyManager();
      
      // Simulate alternating performance that could cause oscillation
      const alternatingResults = [
        { success: true, score: 100 },
        { success: false, score: 30 },
        { success: true, score: 95 },
        { success: false, score: 35 },
        { success: true, score: 90 }
      ];

      for (const result of alternatingResults) {
        difficultyManager.recordPerformance('test-game', result);
      }

      const adjustment = difficultyManager.calculateDifficultyAdjustment('test-game');
      expect(adjustment.stabilityCheck).toBe(true);
      expect(adjustment.oscillationRisk).toBeDefined();
    });
  });

  describe('Validation Service', () => {
    it('should validate storylet structure and safety', async () => {
      const validStorylet = {
        id: 'valid-storylet',
        title: 'Valid Storylet',
        description: 'A safe storylet',
        sections: [{
          id: 'section1',
          content: 'Safe content',
          choices: [{
            id: 'choice1',
            text: 'Continue',
            effects: [{ type: 'flag', flag: 'safe_flag', value: true }]
          }]
        }],
        requirements: { flags: {} },
        tags: ['safe'],
        deployment: 'live'
      };

      const validationResult = validation.validateStorylet(validStorylet);
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Test invalid storylet
      const invalidStorylet = {
        id: '', // Invalid empty ID
        title: '<script>alert("xss")</script>', // XSS attempt
        sections: [], // Empty sections
        requirements: null // Invalid requirements
      };

      const invalidResult = validation.validateStorylet(invalidStorylet);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
      expect(invalidResult.securityWarnings.length).toBeGreaterThan(0);
    });

    it('should sanitize user input effectively', async () => {
      const unsafeInput = '<script>alert("xss")</script><img src="x" onerror="alert(1)">';
      const sanitized = validation.sanitizeInput(unsafeInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should validate resource constraints', async () => {
      const resourceConstraints = {
        energy: { min: 0, max: 100 },
        stress: { min: 0, max: 100 },
        money: { min: 0, max: Infinity }
      };

      const validResources = { energy: 50, stress: 25, money: 150 };
      const invalidResources = { energy: -10, stress: 150, money: -50 };

      expect(validation.validateResources(validResources, resourceConstraints)).toBe(true);
      expect(validation.validateResources(invalidResources, resourceConstraints)).toBe(false);
    });
  });

  describe('Error Handling Service', () => {
    it('should classify and handle different error types', async () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      const validationError = new Error('Invalid input data');
      validationError.name = 'ValidationError';

      const criticalError = new Error('System critical failure');
      criticalError.name = 'CriticalError';

      const networkClassification = errorHandling.classifyError(networkError);
      expect(networkClassification.category).toBe('network');
      expect(networkClassification.severity).toBe('medium');
      expect(networkClassification.recoverable).toBe(true);

      const validationClassification = errorHandling.classifyError(validationError);
      expect(validationClassification.category).toBe('validation');
      expect(validationClassification.severity).toBe('low');

      const criticalClassification = errorHandling.classifyError(criticalError);
      expect(criticalClassification.category).toBe('system');
      expect(criticalClassification.severity).toBe('high');
      expect(criticalClassification.recoverable).toBe(false);
    });

    it('should implement retry logic for recoverable errors', async () => {
      let attemptCount = 0;
      const flakyFunction = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await errorHandling.withRetry(flakyFunction, {
        maxAttempts: 3,
        delayMs: 10,
        backoff: 'linear'
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should maintain error history and patterns', async () => {
      const errors = [
        new Error('Connection timeout'),
        new Error('Connection timeout'),
        new Error('Validation failed'),
        new Error('Connection timeout')
      ];

      for (const error of errors) {
        errorHandling.recordError(error);
      }

      const patterns = errorHandling.analyzeErrorPatterns();
      expect(patterns.mostCommon).toBe('Connection timeout');
      expect(patterns.frequency['Connection timeout']).toBe(3);
      expect(patterns.recentTrends.length).toBeGreaterThan(0);
    });
  });

  describe('Storage Factory and Adapters', () => {
    it('should select appropriate storage adapter based on environment', async () => {
      // Test IndexedDB availability detection
      const factory = new StorageFactory();
      
      // Mock different browser environments
      global.indexedDB = {}; // IndexedDB available
      const indexedDBAdapter = await factory.createAdapter({ preferredType: 'indexeddb' });
      expect(indexedDBAdapter.type).toBe('indexeddb');

      // Mock localStorage only environment
      delete global.indexedDB;
      global.localStorage = {}; // LocalStorage available
      const localStorageAdapter = await factory.createAdapter({ preferredType: 'localstorage' });
      expect(localStorageAdapter.type).toBe('localstorage');

      // Test fallback behavior
      const fallbackAdapter = await factory.createAdapter({ 
        preferredType: 'nonexistent',
        fallback: true 
      });
      expect(fallbackAdapter).toBeDefined();
    });

    it('should handle storage quota and limitations', async () => {
      const factory = new StorageFactory();
      const adapter = await factory.createAdapter({ type: 'localstorage' });

      // Test large data handling
      const largeData = { content: 'x'.repeat(1000000) }; // 1MB of data
      
      try {
        await adapter.save('large-data', largeData);
        const retrieved = await adapter.load('large-data');
        expect(retrieved.content.length).toBe(1000000);
      } catch (error) {
        // Storage quota exceeded - should be handled gracefully
        expect(error.name).toContain('Quota');
      }
    });

    it('should implement chunked storage for large objects', async () => {
      const factory = new StorageFactory();
      const chunkedAdapter = await factory.createAdapter({ 
        type: 'chunked',
        chunkSize: 1024 // 1KB chunks
      });

      const largeObject = {
        storylets: {},
        metadata: { size: 'large' }
      };

      // Generate large storylet data
      for (let i = 0; i < 100; i++) {
        largeObject.storylets[`storylet-${i}`] = {
          id: `storylet-${i}`,
          content: 'Lorem ipsum '.repeat(100) // ~1KB per storylet
        };
      }

      await chunkedAdapter.save('large-project', largeObject);
      const retrieved = await chunkedAdapter.load('large-project');

      expect(retrieved.storylets).toBeDefined();
      expect(Object.keys(retrieved.storylets)).toHaveLength(100);
      expect(retrieved.metadata.size).toBe('large');
    });
  });

  describe('Migration Service', () => {
    it('should safely migrate data between versions', async () => {
      const migrationService = new MigrationService();
      
      const v1Data = {
        version: '1.0.0',
        storylets: {
          'old-storylet': {
            id: 'old-storylet',
            name: 'Old Format Storylet', // v1 used 'name'
            text: 'Old format content' // v1 used 'text'
          }
        }
      };

      const migrated = await migrationService.migrate(v1Data, '2.0.0');
      
      expect(migrated.version).toBe('2.0.0');
      expect(migrated.storylets['old-storylet']).toBeDefined();
      expect(migrated.storylets['old-storylet'].title).toBe('Old Format Storylet'); // v2 uses 'title'
      expect(migrated.storylets['old-storylet'].description).toBe('Old format content'); // v2 uses 'description'
    });

    it('should provide rollback capability', async () => {
      const migrationService = new MigrationService();
      
      const originalData = {
        version: '1.0.0',
        data: { test: 'original' }
      };

      // Create backup before migration
      const backupId = await migrationService.createBackup(originalData);
      
      // Perform migration
      const migrated = await migrationService.migrate(originalData, '2.0.0');
      
      // Simulate migration failure and rollback
      const rolledBack = await migrationService.rollback(backupId);
      
      expect(rolledBack.version).toBe('1.0.0');
      expect(rolledBack.data.test).toBe('original');
    });

    it('should validate migration integrity', async () => {
      const migrationService = new MigrationService();
      
      const testData = {
        version: '1.0.0',
        storylets: { 'test-1': { id: 'test-1' } },
        checksum: 'original-checksum'
      };

      const migrationResult = await migrationService.migrateWithValidation(testData, '2.0.0');
      
      expect(migrationResult.success).toBe(true);
      expect(migrationResult.integrityCheck).toBe(true);
      expect(migrationResult.migratedData.version).toBe('2.0.0');
      expect(migrationResult.migratedData.checksum).not.toBe('original-checksum'); // Should be recalculated
    });
  });

  describe('Compression Service', () => {
    it('should compress and decompress data efficiently', async () => {
      const compressionService = new CompressionService();
      
      const testData = {
        storylets: {},
        repeated: 'This string is repeated many times. '.repeat(1000)
      };

      const compressed = await compressionService.compress(testData);
      expect(compressed.size).toBeLessThan(JSON.stringify(testData).length);
      expect(compressed.algorithm).toBeDefined();
      expect(compressed.compressionRatio).toBeGreaterThan(0);

      const decompressed = await compressionService.decompress(compressed);
      expect(decompressed).toEqual(testData);
    });

    it('should handle different compression algorithms', async () => {
      const compressionService = new CompressionService();
      
      const testData = { content: 'test data '.repeat(100) };

      const gzipResult = await compressionService.compress(testData, { algorithm: 'gzip' });
      const lz4Result = await compressionService.compress(testData, { algorithm: 'lz4' });

      expect(gzipResult.algorithm).toBe('gzip');
      expect(lz4Result.algorithm).toBe('lz4');
      
      // Both should decompress to original data
      const gzipDecompressed = await compressionService.decompress(gzipResult);
      const lz4Decompressed = await compressionService.decompress(lz4Result);
      
      expect(gzipDecompressed).toEqual(testData);
      expect(lz4Decompressed).toEqual(testData);
    });

    it('should provide progress tracking for large compressions', async () => {
      const compressionService = new CompressionService();
      
      const largeData = { content: 'large data '.repeat(10000) };
      const progressUpdates = [];

      const compressed = await compressionService.compress(largeData, {
        chunkSize: 1024,
        onProgress: (progress) => progressUpdates.push(progress)
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100); // Should reach 100%
      expect(compressed.chunked).toBe(true);
    });
  });
});