// LocalStorage Adapter - maintains current behavior
// Provides async interface for localStorage to match other adapters

import { StorageAdapter, StorageInfo, StorageAdapterError } from './StorageAdapter';

export class LocalStorageAdapter implements StorageAdapter {
  readonly type = 'localStorage' as const;

  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      throw new StorageAdapterError(
        `Failed to get item from localStorage: ${key}`,
        'STORAGE_UNAVAILABLE',
        error
      );
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageAdapterError(
          'localStorage quota exceeded',
          'QUOTA_EXCEEDED',
          error
        );
      }
      throw new StorageAdapterError(
        `Failed to set item in localStorage: ${key}`,
        'STORAGE_UNAVAILABLE',
        error
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      throw new StorageAdapterError(
        `Failed to remove item from localStorage: ${key}`,
        'STORAGE_UNAVAILABLE',
        error
      );
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      throw new StorageAdapterError(
        'Failed to clear localStorage',
        'STORAGE_UNAVAILABLE',
        error
      );
    }
  }

  async getKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch (error) {
      throw new StorageAdapterError(
        'Failed to get keys from localStorage',
        'STORAGE_UNAVAILABLE',
        error
      );
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    try {
      // Estimate localStorage usage
      let usage = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          usage += key.length + (value?.length || 0);
        }
      }

      // localStorage typically has ~5MB quota
      const quota = 5 * 1024 * 1024; // 5MB in bytes
      
      return {
        usage,
        quota,
        available: quota - usage
      };
    } catch (error) {
      throw new StorageAdapterError(
        'Failed to get localStorage info',
        'STORAGE_UNAVAILABLE',
        error
      );
    }
  }

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = 'localStorage-test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}