// Storage Adapter Interface
// Provides abstraction layer for different storage backends

export interface StorageInfo {
  usage: number;
  quota: number;
  available: number;
}

export interface StorageAdapter {
  /**
   * Get an item from storage
   */
  getItem(key: string): Promise<string | null>;
  
  /**
   * Set an item in storage
   */
  setItem(key: string, value: string): Promise<void>;
  
  /**
   * Remove an item from storage
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * Clear all items from storage
   */
  clear(): Promise<void>;
  
  /**
   * Get all keys in storage
   */
  getKeys(): Promise<string[]>;
  
  /**
   * Get storage information (usage, quota, etc.)
   */
  getStorageInfo(): Promise<StorageInfo>;
  
  /**
   * Initialize the storage adapter (for adapters that need setup)
   */
  initialize?(): Promise<void>;
  
  /**
   * Get the type of storage adapter
   */
  readonly type: 'localStorage' | 'indexedDB' | 'memory';
}

export interface StorageError extends Error {
  code: 'QUOTA_EXCEEDED' | 'STORAGE_UNAVAILABLE' | 'ITEM_NOT_FOUND' | 'UNKNOWN';
  originalError?: any;
}

export class StorageAdapterError extends Error implements StorageError {
  constructor(
    message: string,
    public code: StorageError['code'],
    public originalError?: any
  ) {
    super(message);
    this.name = 'StorageAdapterError';
  }
}