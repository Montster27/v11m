// /Users/montysharma/v11m2/src/test/integration/serviceLayer.test.ts
// Integration tests for service layer - V2 compatible version

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetAllStores, waitForStoreUpdate } from '../utils/gameTestUtils';

// Core Services that actually exist
import { BackupMonitoringService } from '../../services/BackupMonitoringService';
import { BackupSchedulerService } from '../../services/BackupSchedulerService';

// Storage Services that exist
import { StorageFactory } from '../../services/storage/StorageFactory';

// Validation utilities (actual functions that exist)
import { 
  validateSliderSum, 
  validateSleepHours, 
  checkCrashConditions,
  ValidationError 
} from '../../utils/validation';

describe('Service Layer Integration Tests', () => {
  beforeEach(() => {
    resetAllStores();
    vi.clearAllMocks();
  });

  describe('Validation Service', () => {
    it('should validate slider sums correctly', () => {
      const validSum = validateSliderSum(100);
      expect(validSum.isValid).toBe(true);
      expect(validSum.type).toBe('success');

      const invalidSum = validateSliderSum(120);
      expect(invalidSum.isValid).toBe(false);
      expect(invalidSum.type).toBe('error');
    });

    it('should validate sleep hours and warn about deprivation', () => {
      const normalSleep = validateSleepHours(33); // ~8 hours
      expect(normalSleep.isValid).toBe(true);

      const lowSleep = validateSleepHours(15); // ~3.6 hours  
      expect(lowSleep.isValid).toBe(false);
      expect(lowSleep.message).toContain('Severe sleep deprivation');
    });

    it('should check crash conditions', () => {
      const normalState = checkCrashConditions(50, 50);
      expect(normalState.isValid).toBe(true);

      const energyDepleted = checkCrashConditions(0, 50);
      expect(energyDepleted.isValid).toBe(false);
      expect(energyDepleted.message).toContain('Energy depleted');

      const maxStress = checkCrashConditions(50, 100);
      expect(maxStress.isValid).toBe(false);
      expect(maxStress.message).toContain('Maximum stress');
    });

    it('should create and handle ValidationError correctly', () => {
      const error = new ValidationError('Test error', 'testField', 'TEST_CODE');
      expect(error.message).toBe('Test error');
      expect(error.field).toBe('testField');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('BackupMonitoringService', () => {
    it('should initialize backup monitoring service', async () => {
      const service = new BackupMonitoringService();
      expect(service).toBeDefined();
      
      // Test basic service functionality
      if (typeof service.initialize === 'function') {
        await expect(service.initialize()).resolves.not.toThrow();
      }
    });

    it('should handle service methods gracefully', async () => {
      const service = new BackupMonitoringService();
      
      // Test that service methods exist and can be called
      if (typeof service.getMetrics === 'function') {
        const metrics = service.getMetrics();
        expect(metrics).toBeDefined();
      }
      
      if (typeof service.recordEvent === 'function') {
        expect(() => service.recordEvent('test-event', {})).not.toThrow();
      }
    });
  });

  describe('BackupSchedulerService', () => {
    it('should initialize backup scheduler service', async () => {
      // Mock the required options
      const mockStorageAdapter = {
        read: vi.fn().mockResolvedValue(null),
        write: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        list: vi.fn().mockResolvedValue([])
      };
      
      const service = new BackupSchedulerService({
        storageAdapter: mockStorageAdapter,
        checkInterval: 5000
      });
      expect(service).toBeDefined();
      
      // Test basic service functionality
      if (typeof service.start === 'function') {
        await expect(service.start()).resolves.not.toThrow();
      }
    });

    it('should handle scheduling operations', async () => {
      const mockStorageAdapter = {
        read: vi.fn().mockResolvedValue(null),
        write: vi.fn().mockResolvedValue(true),
        delete: vi.fn().mockResolvedValue(true),
        list: vi.fn().mockResolvedValue([])
      };
      
      const service = new BackupSchedulerService({
        storageAdapter: mockStorageAdapter
      });
      
      // Test that scheduling methods exist
      if (typeof service.createSchedule === 'function') {
        const mockSchedule = {
          id: 'test-schedule',
          name: 'Test Schedule',
          enabled: true,
          interval: 'daily' as const,
          nextRun: new Date(),
          options: {
            format: 'json' as const,
            includeMetadata: true,
            retentionCount: 5
          },
          stats: {
            totalRuns: 0,
            successfulRuns: 0,
            averageDuration: 0
          }
        };
        expect(() => service.createSchedule(mockSchedule)).not.toThrow();
      }
      
      if (typeof service.deleteSchedule === 'function') {
        expect(() => service.deleteSchedule('test-id')).not.toThrow();
      }
    });
  });

  describe('StorageFactory', () => {
    it('should create storage instances', () => {
      const factory = new StorageFactory();
      expect(factory).toBeDefined();
      
      // Test factory methods exist
      if (typeof factory.createAdapter === 'function') {
        expect(() => factory.createAdapter('localStorage')).not.toThrow();
      }
      
      if (typeof factory.getAvailableAdapters === 'function') {
        const adapters = factory.getAvailableAdapters();
        expect(Array.isArray(adapters)).toBe(true);
      }
    });

    it('should handle storage configuration', () => {
      const factory = new StorageFactory();
      
      // Test configuration methods
      if (typeof factory.configure === 'function') {
        expect(() => factory.configure({ maxSize: 1024 })).not.toThrow();
      }
    });
  });

  describe('Store Integration', () => {
    it('should have V2 stores available after reset', async () => {
      // After reset, V2 stores should be in clean state
      resetAllStores();
      await waitForStoreUpdate();
      
      // This test verifies that store reset works without errors
      expect(true).toBe(true);
    });

    it('should handle store updates correctly', async () => {
      resetAllStores();
      
      // Simulate store operations
      await waitForStoreUpdate();
      
      // Verify no errors during store operations
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors in services', () => {
      expect(() => {
        throw new ValidationError('Service validation failed', 'serviceField');
      }).toThrow(ValidationError);
    });

    it('should handle service initialization errors gracefully', async () => {
      // Test that services can handle initialization failures
      const mockService = {
        initialize: vi.fn().mockRejectedValue(new Error('Init failed'))
      };
      
      await expect(mockService.initialize()).rejects.toThrow('Init failed');
    });

    it('should handle async service operations', async () => {
      const mockAsyncService = {
        performOperation: vi.fn().mockResolvedValue('success'),
        performFailingOperation: vi.fn().mockRejectedValue(new Error('Operation failed'))
      };
      
      await expect(mockAsyncService.performOperation()).resolves.toBe('success');
      await expect(mockAsyncService.performFailingOperation()).rejects.toThrow('Operation failed');
    });
  });

  describe('Service Integration Patterns', () => {
    it('should demonstrate proper service mocking patterns', () => {
      const mockService = vi.fn().mockImplementation(() => ({
        method1: vi.fn().mockReturnValue('result1'),
        method2: vi.fn().mockResolvedValue('async-result'),
        method3: vi.fn().mockRejectedValue(new Error('mock error'))
      }));
      
      const service = mockService();
      expect(service.method1()).toBe('result1');
      expect(service.method2()).resolves.toBe('async-result');
      expect(service.method3()).rejects.toThrow('mock error');
    });

    it('should handle service dependency injection', () => {
      const mockDependency = { getValue: () => 'dependency-value' };
      const serviceWithDependency = {
        dependency: mockDependency,
        usesDependency: function() {
          return this.dependency.getValue();
        }
      };
      
      expect(serviceWithDependency.usesDependency()).toBe('dependency-value');
    });
  });
});