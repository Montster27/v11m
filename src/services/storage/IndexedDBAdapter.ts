// IndexedDB Adapter - provides large storage capacity
// Implements async interface for IndexedDB operations

import { StorageAdapter, StorageInfo, StorageAdapterError } from './StorageAdapter';

interface IndexedDBConfig {
  dbName?: string;
  storeName?: string;
  version?: number;
}

export class IndexedDBAdapter implements StorageAdapter {
  readonly type = 'indexedDB' as const;
  
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;
  private initialized = false;

  constructor(config: IndexedDBConfig = {}) {
    this.dbName = config.dbName || 'ContentStudioDB';
    this.storeName = config.storeName || 'backups';
    this.version = config.version || 1;
  }

  async initialize(): Promise<void> {
    if (this.initialized && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new StorageAdapterError(
          'Failed to open IndexedDB',
          'STORAGE_UNAVAILABLE',
          request.error
        ));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized || !this.db) {
      await this.initialize();
    }
  }

  private async performTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    await this.ensureInitialized();
    
    if (!this.db) {
      throw new StorageAdapterError(
        'IndexedDB not initialized',
        'STORAGE_UNAVAILABLE'
      );
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], mode);
      const store = transaction.objectStore(this.storeName);
      const request = operation(store);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new StorageAdapterError(
          'IndexedDB transaction failed',
          'UNKNOWN',
          request.error
        ));
      };

      transaction.onerror = () => {
        reject(new StorageAdapterError(
          'IndexedDB transaction failed',
          'UNKNOWN',
          transaction.error
        ));
      };
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const result = await this.performTransaction(
        'readonly',
        (store) => store.get(key)
      );
      return result || null;
    } catch (error) {
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new StorageAdapterError(
        `Failed to get item from IndexedDB: ${key}`,
        'UNKNOWN',
        error
      );
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.performTransaction(
        'readwrite',
        (store) => store.put(value, key)
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageAdapterError(
          'IndexedDB quota exceeded',
          'QUOTA_EXCEEDED',
          error
        );
      }
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new StorageAdapterError(
        `Failed to set item in IndexedDB: ${key}`,
        'UNKNOWN',
        error
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.performTransaction(
        'readwrite',
        (store) => store.delete(key)
      );
    } catch (error) {
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new StorageAdapterError(
        `Failed to remove item from IndexedDB: ${key}`,
        'UNKNOWN',
        error
      );
    }
  }

  async clear(): Promise<void> {
    try {
      await this.performTransaction(
        'readwrite',
        (store) => store.clear()
      );
    } catch (error) {
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new StorageAdapterError(
        'Failed to clear IndexedDB',
        'UNKNOWN',
        error
      );
    }
  }

  async getKeys(): Promise<string[]> {
    try {
      const keys = await this.performTransaction(
        'readonly',
        (store) => store.getAllKeys()
      );
      return keys.map(key => String(key));
    } catch (error) {
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new StorageAdapterError(
        'Failed to get keys from IndexedDB',
        'UNKNOWN',
        error
      );
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    try {
      // Get storage estimate if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        };
      }

      // Fallback: estimate based on stored data
      const keys = await this.getKeys();
      let usage = 0;
      
      for (const key of keys) {
        const value = await this.getItem(key);
        usage += key.length + (value?.length || 0);
      }

      // IndexedDB typically has much larger quota than localStorage
      const quota = 50 * 1024 * 1024; // 50MB default estimate
      
      return {
        usage,
        quota,
        available: quota - usage
      };
    } catch (error) {
      throw new StorageAdapterError(
        'Failed to get IndexedDB storage info',
        'UNKNOWN',
        error
      );
    }
  }

  /**
   * Check if IndexedDB is available
   */
  static isAvailable(): boolean {
    return 'indexedDB' in window && indexedDB !== null;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}