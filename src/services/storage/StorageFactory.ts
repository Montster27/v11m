// Storage Factory - provides storage adapter selection logic with error handling

import { StorageAdapter } from './StorageAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { ChunkedStorageAdapter } from './ChunkedStorageAdapter';
import { createErrorHandledAdapter, ErrorRecoveryStrategy } from './ErrorHandlingService';

export type StorageType = 'auto' | 'localStorage' | 'indexedDB' | 'chunked';

export interface StorageConfig {
  type?: StorageType;
  fallbackToLocalStorage?: boolean;
  enableChunking?: boolean; // Enable automatic chunking for large data
  enableErrorHandling?: boolean; // Enable progressive error handling
  chunkingOptions?: {
    chunkSizeBytes?: number;
    maxChunks?: number;
    compressionEnabled?: boolean;
  };
  indexedDBConfig?: {
    dbName?: string;
    storeName?: string;
    version?: number;
  };
  errorHandlingOptions?: Partial<ErrorRecoveryStrategy>;
}

export class StorageFactory {
  /**
   * Create a storage adapter based on configuration and availability
   */
  static async createAdapter(config: StorageConfig = {}): Promise<StorageAdapter> {
    const {
      type = 'auto',
      fallbackToLocalStorage = true,
      enableChunking = false,
      enableErrorHandling = true,
      chunkingOptions,
      indexedDBConfig,
      errorHandlingOptions
    } = config;

    // Helper function to wrap adapter with features
    const wrapAdapter = (adapter: StorageAdapter): StorageAdapter => {
      let wrapped = adapter;
      
      // Apply error handling first (innermost wrapper)
      if (enableErrorHandling) {
        wrapped = createErrorHandledAdapter(wrapped, {
          maxRetries: 3,
          retryDelayMs: 1000,
          backoffMultiplier: 2,
          ...errorHandlingOptions
        });
      }
      
      // Apply chunking on top (outermost wrapper)
      if (enableChunking) {
        wrapped = new ChunkedStorageAdapter(wrapped, chunkingOptions);
      }
      
      return wrapped;
    };

    // If specific type requested, try to create it
    if (type === 'localStorage') {
      if (LocalStorageAdapter.isAvailable()) {
        return wrapAdapter(new LocalStorageAdapter());
      }
      throw new Error('localStorage is not available');
    }

    if (type === 'indexedDB') {
      if (IndexedDBAdapter.isAvailable()) {
        const adapter = new IndexedDBAdapter(indexedDBConfig);
        await adapter.initialize();
        return wrapAdapter(adapter);
      }
      throw new Error('IndexedDB is not available');
    }

    if (type === 'chunked') {
      // Force chunking with best available base adapter
      const baseAdapter = await this.createAdapter({ 
        type: 'auto', 
        fallbackToLocalStorage, 
        indexedDBConfig,
        enableChunking: false // Prevent recursion
      });
      return new ChunkedStorageAdapter(baseAdapter, chunkingOptions);
    }

    // Auto-selection logic
    if (type === 'auto') {
      // Check if user has already migrated to IndexedDB
      const migrationFlag = localStorage.getItem('storage_migrated');
      
      if (migrationFlag === 'true' && IndexedDBAdapter.isAvailable()) {
        try {
          const adapter = new IndexedDBAdapter(indexedDBConfig);
          await adapter.initialize();
          console.log('🗄️ Using IndexedDB storage adapter');
          return wrapAdapter(adapter);
        } catch (error) {
          console.warn('Failed to initialize IndexedDB, falling back to localStorage:', error);
          
          if (fallbackToLocalStorage && LocalStorageAdapter.isAvailable()) {
            console.log('📦 Falling back to localStorage adapter');
            return wrapAdapter(new LocalStorageAdapter());
          }
          throw error;
        }
      }

      // Default to localStorage for now
      if (LocalStorageAdapter.isAvailable()) {
        console.log('📦 Using localStorage adapter');
        return wrapAdapter(new LocalStorageAdapter());
      }

      // Last resort: try IndexedDB
      if (IndexedDBAdapter.isAvailable()) {
        try {
          const adapter = new IndexedDBAdapter(indexedDBConfig);
          await adapter.initialize();
          console.log('🗄️ Using IndexedDB storage adapter (fallback)');
          return wrapAdapter(adapter);
        } catch (error) {
          console.error('Failed to initialize any storage adapter:', error);
          throw new Error('No storage adapters available');
        }
      }
    }

    throw new Error(`Unsupported storage type: ${type}`);
  }

  /**
   * Get information about available storage options
   */
  static getAvailableStorageTypes(): StorageType[] {
    const available: StorageType[] = ['auto', 'chunked'];
    
    if (LocalStorageAdapter.isAvailable()) {
      available.push('localStorage');
    }
    
    if (IndexedDBAdapter.isAvailable()) {
      available.push('indexedDB');
    }
    
    return available;
  }

  /**
   * Check if migration from localStorage to IndexedDB is recommended
   */
  static async shouldMigrate(): Promise<boolean> {
    // Check if already migrated
    if (localStorage.getItem('storage_migrated') === 'true') {
      return false;
    }

    // Check if IndexedDB is available
    if (!IndexedDBAdapter.isAvailable()) {
      return false;
    }

    // Check localStorage usage
    try {
      const localAdapter = new LocalStorageAdapter();
      const info = await localAdapter.getStorageInfo();
      
      // Recommend migration if using more than 50% of localStorage quota
      return info.usage > (info.quota * 0.5);
    } catch {
      return false;
    }
  }
}