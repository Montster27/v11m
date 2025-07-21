// /Users/montysharma/v11m2/src/services/storage/ErrorHandlingService.ts
// Progressive error handling service for storage operations
// Provides retry logic, fallback strategies, and error recovery

import { StorageAdapter, StorageInfo } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';

export enum ErrorSeverity {
  LOW = 'low',       // Warning, operation continues
  MEDIUM = 'medium', // Error, retry attempted
  HIGH = 'high',     // Critical, fallback required
  CRITICAL = 'critical' // Fatal, user intervention needed
}

export interface StorageError {
  id: string;
  timestamp: Date;
  operation: string;
  error: Error;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  retryCount?: number;
  resolved?: boolean;
  resolution?: string;
}

export interface ErrorRecoveryStrategy {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  fallbackAdapter?: StorageAdapter;
  onError?: (error: StorageError) => void;
  onRecovery?: (error: StorageError, resolution: string) => void;
}

export interface ErrorStats {
  totalErrors: number;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByOperation: Record<string, number>;
  recoveryRate: number;
  lastError?: StorageError;
}

/**
 * ErrorHandlingService provides progressive error handling for storage operations
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Fallback to alternative storage adapters
 * - Error tracking and statistics
 * - Recovery strategies based on error type
 * - User notification for critical errors
 */
export class ErrorHandlingService {
  private errors: StorageError[] = [];
  private errorHandlers: Map<string, (error: StorageError) => Promise<boolean>> = new Map();
  private globalStrategy: ErrorRecoveryStrategy;
  
  constructor(
    private primaryAdapter: StorageAdapter,
    strategy?: Partial<ErrorRecoveryStrategy>
  ) {
    this.globalStrategy = {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 2,
      fallbackAdapter: new LocalStorageAdapter(),
      ...strategy
    };
    
    this.registerDefaultHandlers();
  }
  
  /**
   * Execute a storage operation with error handling
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Record<string, any>
  ): Promise<T> {
    let lastError: Error | null = null;
    let retryCount = 0;
    
    while (retryCount <= this.globalStrategy.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const storageError = this.createError(
          operationName,
          lastError,
          context,
          retryCount
        );
        
        // Log the error
        this.logError(storageError);
        
        // Determine if we should retry
        const shouldRetry = await this.shouldRetry(storageError);
        if (!shouldRetry || retryCount >= this.globalStrategy.maxRetries) {
          // Try fallback strategy
          const recovered = await this.attemptRecovery(storageError);
          if (recovered) {
            return await operation(); // Retry after recovery
          }
          throw lastError;
        }
        
        // Calculate backoff delay
        const delay = this.calculateBackoffDelay(retryCount);
        console.log(`⏳ Retrying ${operationName} after ${delay}ms (attempt ${retryCount + 1}/${this.globalStrategy.maxRetries})`);
        
        await this.delay(delay);
        retryCount++;
      }
    }
    
    throw lastError || new Error(`${operationName} failed after ${retryCount} retries`);
  }
  
  /**
   * Wrap a storage adapter with error handling
   */
  wrapAdapter(adapter: StorageAdapter): StorageAdapter {
    const self = this; // Capture reference to ErrorHandlingService instance
    
    const wrapped: StorageAdapter = {
      type: adapter.type,
      
      async getItem(key: string): Promise<string | null> {
        return self.executeWithRetry(
          () => adapter.getItem(key),
          'getItem',
          { key }
        );
      },
      
      async setItem(key: string, value: string): Promise<void> {
        return self.executeWithRetry(
          () => adapter.setItem(key, value),
          'setItem',
          { key, valueSize: value.length }
        );
      },
      
      async removeItem(key: string): Promise<void> {
        return self.executeWithRetry(
          () => adapter.removeItem(key),
          'removeItem',
          { key }
        );
      },
      
      async clear(): Promise<void> {
        return self.executeWithRetry(
          () => adapter.clear(),
          'clear'
        );
      },
      
      async getKeys(): Promise<string[]> {
        return self.executeWithRetry(
          () => adapter.getKeys(),
          'getKeys'
        );
      },
      
      async getStorageInfo(): Promise<StorageInfo> {
        return self.executeWithRetry(
          () => adapter.getStorageInfo(),
          'getStorageInfo'
        );
      },
      
      async initialize(): Promise<void> {
        if (adapter.initialize) {
          return self.executeWithRetry(
            () => adapter.initialize!(),
            'initialize'
          );
        }
      }
    };
    
    return wrapped;
  }
  
  /**
   * Register custom error handler for specific error types
   */
  registerErrorHandler(
    errorPattern: string | RegExp,
    handler: (error: StorageError) => Promise<boolean>
  ): void {
    const key = errorPattern instanceof RegExp ? errorPattern.source : errorPattern;
    this.errorHandlers.set(key, handler);
  }
  
  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    const stats: ErrorStats = {
      totalErrors: this.errors.length,
      errorsBySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      errorsByOperation: {},
      recoveryRate: 0
    };
    
    let recoveredCount = 0;
    
    for (const error of this.errors) {
      stats.errorsBySeverity[error.severity]++;
      stats.errorsByOperation[error.operation] = (stats.errorsByOperation[error.operation] || 0) + 1;
      if (error.resolved) {
        recoveredCount++;
      }
    }
    
    if (this.errors.length > 0) {
      stats.recoveryRate = (recoveredCount / this.errors.length) * 100;
      stats.lastError = this.errors[this.errors.length - 1];
    }
    
    return stats;
  }
  
  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
    console.log('🧹 Error history cleared');
  }
  
  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): StorageError[] {
    return this.errors.slice(-limit);
  }
  
  // Private helper methods
  
  private createError(
    operation: string,
    error: Error,
    context?: Record<string, any>,
    retryCount: number = 0
  ): StorageError {
    const severity = this.determineSeverity(error, operation);
    
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      operation,
      error,
      severity,
      context,
      retryCount,
      resolved: false
    };
  }
  
  private determineSeverity(error: Error, operation: string): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    // Critical errors
    if (message.includes('quota') || message.includes('no space')) {
      return ErrorSeverity.CRITICAL;
    }
    
    // High severity
    if (message.includes('permission') || message.includes('access denied')) {
      return ErrorSeverity.HIGH;
    }
    
    // Medium severity
    if (message.includes('network') || message.includes('timeout')) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Operation-specific severity
    if (operation === 'clear' || operation === 'initialize') {
      return ErrorSeverity.HIGH;
    }
    
    return ErrorSeverity.LOW;
  }
  
  private async shouldRetry(error: StorageError): Promise<boolean> {
    // Don't retry critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      return false;
    }
    
    // Check custom handlers
    for (const [pattern, handler] of this.errorHandlers) {
      if (error.error.message.includes(pattern)) {
        return await handler(error);
      }
    }
    
    // Default retry logic
    return error.severity !== ErrorSeverity.LOW;
  }
  
  private calculateBackoffDelay(retryCount: number): number {
    return this.globalStrategy.retryDelayMs * 
           Math.pow(this.globalStrategy.backoffMultiplier, retryCount);
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private logError(error: StorageError): void {
    this.errors.push(error);
    
    // Keep error history limited
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-500);
    }
    
    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error(`🚨 CRITICAL: ${error.operation} failed:`, error.error.message);
        break;
      case ErrorSeverity.HIGH:
        console.error(`❌ HIGH: ${error.operation} failed:`, error.error.message);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(`⚠️ MEDIUM: ${error.operation} failed:`, error.error.message);
        break;
      case ErrorSeverity.LOW:
        console.log(`ℹ️ LOW: ${error.operation} issue:`, error.error.message);
        break;
    }
    
    // Call custom error handler
    if (this.globalStrategy.onError) {
      this.globalStrategy.onError(error);
    }
  }
  
  private async attemptRecovery(error: StorageError): Promise<boolean> {
    console.log(`🔧 Attempting recovery for ${error.operation}...`);
    
    // Try fallback adapter for quota errors
    if (error.error.message.includes('quota') && this.globalStrategy.fallbackAdapter) {
      try {
        // Switch to fallback adapter temporarily
        this.primaryAdapter = this.globalStrategy.fallbackAdapter;
        error.resolved = true;
        error.resolution = 'Switched to fallback adapter';
        
        if (this.globalStrategy.onRecovery) {
          this.globalStrategy.onRecovery(error, error.resolution);
        }
        
        console.log(`✅ Recovered using fallback adapter`);
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback adapter also failed:', fallbackError);
      }
    }
    
    // Try clearing old data for space issues
    if (error.error.message.includes('space') || error.error.message.includes('quota')) {
      try {
        await this.clearOldData();
        error.resolved = true;
        error.resolution = 'Cleared old data';
        
        if (this.globalStrategy.onRecovery) {
          this.globalStrategy.onRecovery(error, error.resolution);
        }
        
        console.log(`✅ Recovered by clearing old data`);
        return true;
      } catch (clearError) {
        console.error('❌ Failed to clear old data:', clearError);
      }
    }
    
    return false;
  }
  
  private async clearOldData(): Promise<void> {
    const keys = await this.primaryAdapter.keys();
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Clear old backups and temporary data
    const keysToRemove = keys.filter(key => {
      if (key.includes('backup_') || key.includes('temp_')) {
        const match = key.match(/_(\d+)_/);
        if (match) {
          const timestamp = parseInt(match[1]);
          return timestamp < oneWeekAgo;
        }
      }
      return false;
    });
    
    console.log(`🧹 Clearing ${keysToRemove.length} old items...`);
    
    for (const key of keysToRemove) {
      try {
        await this.primaryAdapter.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    }
  }
  
  private registerDefaultHandlers(): void {
    // Quota exceeded handler
    this.registerErrorHandler('quota', async (error) => {
      console.log('📦 Handling quota error...');
      
      // Try to free up space
      await this.clearOldData();
      
      // Retry operation
      return true;
    });
    
    // Network error handler
    this.registerErrorHandler('network', async (error) => {
      console.log('🌐 Handling network error...');
      
      // For network errors, increase retry delay
      this.globalStrategy.retryDelayMs = 5000;
      
      return error.retryCount! < 5; // Allow more retries for network issues
    });
    
    // Permission error handler
    this.registerErrorHandler('permission', async (error) => {
      console.log('🔒 Handling permission error...');
      
      // Permission errors usually can't be retried
      return false;
    });
  }
}

/**
 * Factory function to create error-wrapped storage adapter
 */
export function createErrorHandledAdapter(
  adapter: StorageAdapter,
  strategy?: Partial<ErrorRecoveryStrategy>
): StorageAdapter {
  const errorService = new ErrorHandlingService(adapter, strategy);
  return errorService.wrapAdapter(adapter);
}