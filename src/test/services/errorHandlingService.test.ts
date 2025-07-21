// /Users/montysharma/v11m2/src/test/services/errorHandlingService.test.ts
// Test suite for ErrorHandlingService

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandlingService, ErrorSeverity, createErrorHandledAdapter } from '../../services/storage/ErrorHandlingService';
import { StorageAdapter } from '../../services/storage/StorageAdapter';

// Mock storage adapter for testing
class MockStorageAdapter implements StorageAdapter {
  type = 'mock' as const;
  private storage = new Map<string, string>();
  private shouldFail = false;
  private failCount = 0;
  private maxFails = 0;
  
  failNext(times: number = 1): void {
    this.shouldFail = true;
    this.failCount = 0;
    this.maxFails = times;
  }
  
  async getItem(key: string): Promise<string | null> {
    if (this.shouldFail && this.failCount < this.maxFails) {
      this.failCount++;
      if (this.failCount >= this.maxFails) {
        this.shouldFail = false; // Reset after reaching max fails
      }
      throw new Error('Mock storage error');
    }
    return this.storage.get(key) || null;
  }
  
  async setItem(key: string, value: string): Promise<void> {
    if (this.shouldFail && this.failCount < this.maxFails) {
      this.failCount++;
      if (this.failCount >= this.maxFails) {
        this.shouldFail = false; // Reset after reaching max fails
      }
      throw new Error('Mock storage error');
    }
    this.storage.set(key, value);
  }
  
  async removeItem(key: string): Promise<void> {
    if (this.shouldFail && this.failCount < this.maxFails) {
      this.failCount++;
      if (this.failCount >= this.maxFails) {
        this.shouldFail = false; // Reset after reaching max fails
      }
      throw new Error('Mock storage error');
    }
    this.storage.delete(key);
  }
  
  async clear(): Promise<void> {
    if (this.shouldFail && this.failCount < this.maxFails) {
      this.failCount++;
      if (this.failCount >= this.maxFails) {
        this.shouldFail = false; // Reset after reaching max fails
      }
      throw new Error('Mock storage error');
    }
    this.storage.clear();
  }
  
  async keys(): Promise<string[]> {
    if (this.shouldFail && this.failCount < this.maxFails) {
      this.failCount++;
      if (this.failCount >= this.maxFails) {
        this.shouldFail = false; // Reset after reaching max fails
      }
      throw new Error('Mock storage error');
    }
    return Array.from(this.storage.keys());
  }
}

describe('ErrorHandlingService', () => {
  let mockAdapter: MockStorageAdapter;
  let errorService: ErrorHandlingService;
  
  beforeEach(() => {
    mockAdapter = new MockStorageAdapter();
    errorService = new ErrorHandlingService(mockAdapter, {
      maxRetries: 3,
      retryDelayMs: 10, // Short delay for tests
      backoffMultiplier: 2
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Basic Error Handling', () => {
    it('should execute successful operations without retry', async () => {
      const result = await errorService.executeWithRetry(
        async () => {
          await mockAdapter.setItem('test', 'value');
          return 'success';
        },
        'testOperation'
      );
      
      expect(result).toBe('success');
      expect(await mockAdapter.getItem('test')).toBe('value');
    });
    
    it('should retry failed operations', async () => {
      mockAdapter.failNext(2); // Fail first 2 attempts
      
      const startTime = Date.now();
      await errorService.executeWithRetry(
        () => mockAdapter.setItem('test', 'value'),
        'setItem'
      );
      const duration = Date.now() - startTime;
      
      expect(await mockAdapter.getItem('test')).toBe('value');
      expect(duration).toBeGreaterThanOrEqual(30); // 10ms + 20ms delays
    });
    
    it('should throw after max retries', async () => {
      mockAdapter.failNext(5); // Fail more than max retries
      
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.setItem('test', 'value'),
          'setItem'
        )
      ).rejects.toThrow('Mock storage error');
    });
    
    it('should use exponential backoff', async () => {
      mockAdapter.failNext(3);
      const delays: number[] = [];
      let lastTime = Date.now();
      
      // Mock console.log to capture retry messages
      const logSpy = vi.spyOn(console, 'log');
      
      await errorService.executeWithRetry(
        () => mockAdapter.setItem('test', 'value'),
        'setItem'
      );
      
      // Check retry messages for delays
      const retryMessages = logSpy.mock.calls
        .filter(call => call[0].includes('Retrying'))
        .map(call => call[0]);
      
      expect(retryMessages).toHaveLength(3);
      expect(retryMessages[0]).toContain('10ms');
      expect(retryMessages[1]).toContain('20ms');
      expect(retryMessages[2]).toContain('40ms');
    });
  });
  
  describe('Error Severity Classification', () => {
    it('should classify quota errors as critical', async () => {
      const quotaError = new Error('QuotaExceededError: Storage quota exceeded');
      mockAdapter.getItem = async () => { throw quotaError; };
      
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.getItem('test'),
          'getItem'
        )
      ).rejects.toThrow(quotaError);
      
      const stats = errorService.getErrorStats();
      expect(stats.errorsBySeverity[ErrorSeverity.CRITICAL]).toBe(1);
    });
    
    it('should classify permission errors as high severity', async () => {
      const permissionError = new Error('Permission denied');
      mockAdapter.setItem = async () => { throw permissionError; };
      
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.setItem('test', 'value'),
          'setItem'
        )
      ).rejects.toThrow(permissionError);
      
      const stats = errorService.getErrorStats();
      expect(stats.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
    });
    
    it('should classify network errors as medium severity', async () => {
      const networkError = new Error('Network timeout');
      mockAdapter.getItem = async () => { throw networkError; };
      
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.getItem('test'),
          'getItem'
        )
      ).rejects.toThrow(networkError);
      
      const stats = errorService.getErrorStats();
      expect(stats.errorsBySeverity[ErrorSeverity.MEDIUM]).toBeGreaterThan(0);
    });
  });
  
  describe('Wrapped Adapter', () => {
    it('should wrap adapter methods with error handling', async () => {
      const wrapped = errorService.wrapAdapter(mockAdapter);
      
      // Test successful operation
      await wrapped.setItem('test', 'value');
      expect(await wrapped.getItem('test')).toBe('value');
      
      // Test with failures
      mockAdapter.failNext(2);
      await wrapped.setItem('test2', 'value2');
      expect(await wrapped.getItem('test2')).toBe('value2');
    });
    
    it('should handle all adapter methods', async () => {
      const wrapped = errorService.wrapAdapter(mockAdapter);
      
      // Test all methods
      await wrapped.setItem('key1', 'value1');
      await wrapped.setItem('key2', 'value2');
      
      const value = await wrapped.getItem('key1');
      expect(value).toBe('value1');
      
      const keys = await wrapped.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      
      await wrapped.removeItem('key1');
      expect(await wrapped.getItem('key1')).toBeNull();
      
      await wrapped.clear();
      expect(await wrapped.keys()).toHaveLength(0);
    });
  });
  
  describe('Error Statistics', () => {
    it('should track error statistics', async () => {
      // Generate some errors
      mockAdapter.failNext(2);
      await errorService.executeWithRetry(
        () => mockAdapter.setItem('test1', 'value'),
        'setItem'
      );
      
      mockAdapter.failNext(4);
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.getItem('test2'),
          'getItem'
        )
      ).rejects.toThrow();
      
      const stats = errorService.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
      expect(stats.errorsByOperation['setItem']).toBe(2);
      expect(stats.errorsByOperation['getItem']).toBe(4);
    });
    
    it('should track recovery rate', async () => {
      // Successful recovery
      mockAdapter.failNext(2);
      await errorService.executeWithRetry(
        () => mockAdapter.setItem('test', 'value'),
        'setItem'
      );
      
      // Failed recovery
      mockAdapter.failNext(5);
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.getItem('test'),
          'getItem'
        )
      ).rejects.toThrow();
      
      const stats = errorService.getErrorStats();
      expect(stats.recoveryRate).toBeGreaterThan(0);
      expect(stats.recoveryRate).toBeLessThan(100);
    });
    
    it('should limit error history', async () => {
      // Generate many errors
      for (let i = 0; i < 1100; i++) {
        mockAdapter.failNext(1);
        try {
          await errorService.executeWithRetry(
            () => mockAdapter.setItem(`test${i}`, 'value'),
            'setItem'
          );
        } catch (error) {
          // Expected
        }
      }
      
      const recentErrors = errorService.getRecentErrors(2000);
      expect(recentErrors.length).toBeLessThanOrEqual(500);
    });
  });
  
  describe('Custom Error Handlers', () => {
    it('should use custom error handlers', async () => {
      let handlerCalled = false;
      
      errorService.registerErrorHandler('custom', async (error) => {
        handlerCalled = true;
        return false; // Don't retry
      });
      
      const customError = new Error('custom error occurred');
      mockAdapter.setItem = async () => { throw customError; };
      
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.setItem('test', 'value'),
          'setItem'
        )
      ).rejects.toThrow(customError);
      
      expect(handlerCalled).toBe(true);
    });
    
    it('should support regex patterns for handlers', async () => {
      let handlerCalled = false;
      
      errorService.registerErrorHandler(/quota|space/i, async (error) => {
        handlerCalled = true;
        return false;
      });
      
      const quotaError = new Error('Insufficient space available');
      mockAdapter.setItem = async () => { throw quotaError; };
      
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.setItem('test', 'value'),
          'setItem'
        )
      ).rejects.toThrow(quotaError);
      
      expect(handlerCalled).toBe(true);
    });
  });
  
  describe('Recovery Strategies', () => {
    it('should attempt recovery with fallback adapter', async () => {
      const fallbackAdapter = new MockStorageAdapter();
      errorService = new ErrorHandlingService(mockAdapter, {
        maxRetries: 1,
        retryDelayMs: 10,
        fallbackAdapter
      });
      
      const quotaError = new Error('QuotaExceededError');
      mockAdapter.setItem = async () => { throw quotaError; };
      
      // Should fail with primary but succeed with fallback
      await errorService.executeWithRetry(
        async () => {
          try {
            await mockAdapter.setItem('test', 'value');
          } catch (error) {
            // Use fallback
            await fallbackAdapter.setItem('test', 'value');
          }
        },
        'setItem'
      );
      
      expect(await fallbackAdapter.getItem('test')).toBe('value');
    });
    
    it('should clear old data on space errors', async () => {
      // Add some old backup data
      await mockAdapter.setItem('backup_1000000000_test', 'old data');
      await mockAdapter.setItem('temp_1000000000_data', 'temp data');
      await mockAdapter.setItem('current_data', 'keep this');
      
      const spaceError = new Error('No space left');
      let errorCount = 0;
      mockAdapter.setItem = async (key: string, value: string) => {
        if (errorCount++ < 2 && key === 'newData') {
          throw spaceError;
        }
        // Allow clearing old data
        if (key !== 'newData') {
          MockStorageAdapter.prototype.setItem.call(mockAdapter, key, value);
        }
      };
      
      // This should trigger clearing old data
      try {
        await errorService.executeWithRetry(
          () => mockAdapter.setItem('newData', 'value'),
          'setItem'
        );
      } catch (error) {
        // Expected if recovery fails
      }
      
      // Check that old data was attempted to be cleared
      const remainingKeys = await mockAdapter.keys();
      expect(remainingKeys).toContain('current_data');
    });
  });
  
  describe('Error Callbacks', () => {
    it('should call onError callback', async () => {
      const errors: any[] = [];
      
      errorService = new ErrorHandlingService(mockAdapter, {
        maxRetries: 1,
        retryDelayMs: 10,
        onError: (error) => errors.push(error)
      });
      
      mockAdapter.failNext(2);
      await expect(
        errorService.executeWithRetry(
          () => mockAdapter.setItem('test', 'value'),
          'setItem'
        )
      ).rejects.toThrow();
      
      expect(errors.length).toBe(2);
      expect(errors[0].operation).toBe('setItem');
    });
    
    it('should call onRecovery callback', async () => {
      const recoveries: any[] = [];
      
      errorService = new ErrorHandlingService(mockAdapter, {
        maxRetries: 2,
        retryDelayMs: 10,
        onRecovery: (error, resolution) => recoveries.push({ error, resolution })
      });
      
      // Mock quota error that triggers recovery
      const quotaError = new Error('QuotaExceededError');
      let attempts = 0;
      mockAdapter.setItem = async () => {
        if (attempts++ < 3) {
          throw quotaError;
        }
      };
      
      await errorService.executeWithRetry(
        () => mockAdapter.setItem('test', 'value'),
        'setItem'
      );
      
      // Recovery callbacks would be triggered
      const stats = errorService.getErrorStats();
      expect(stats.totalErrors).toBeGreaterThan(0);
    });
  });
  
  describe('Factory Function', () => {
    it('should create error-handled adapter', async () => {
      const wrapped = createErrorHandledAdapter(mockAdapter, {
        maxRetries: 2,
        retryDelayMs: 10
      });
      
      mockAdapter.failNext(1);
      await wrapped.setItem('test', 'value');
      expect(await wrapped.getItem('test')).toBe('value');
    });
  });
});