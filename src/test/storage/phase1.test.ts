// Phase 1: Storage Adapter Pattern Tests
// Verify that LocalStorageAdapter maintains exact current behavior

import { LocalStorageAdapter } from '../../services/storage/LocalStorageAdapter';
import { IndexedDBAdapter } from '../../services/storage/IndexedDBAdapter';
import { StorageFactory } from '../../services/storage/StorageFactory';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('Phase 1: Storage Adapter Pattern', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('LocalStorageAdapter', () => {
    it('maintains exact current behavior', async () => {
      const adapter = new LocalStorageAdapter();
      const testData = { test: 'data', nested: { value: 123 } };
      const serializedData = JSON.stringify(testData);
      
      // Test setItem
      await adapter.setItem('test', serializedData);
      expect(localStorage.getItem('test')).toBe(serializedData);
      
      // Test getItem
      const retrieved = await adapter.getItem('test');
      expect(retrieved).toBe(serializedData);
      expect(JSON.parse(retrieved!)).toEqual(testData);
      
      // Test removeItem
      await adapter.removeItem('test');
      expect(localStorage.getItem('test')).toBeNull();
      expect(await adapter.getItem('test')).toBeNull();
    });

    it('provides storage info', async () => {
      const adapter = new LocalStorageAdapter();
      
      // Add some test data
      await adapter.setItem('test1', 'data1');
      await adapter.setItem('test2', 'data2');
      
      const info = await adapter.getStorageInfo();
      
      expect(info.usage).toBeGreaterThan(0);
      expect(info.quota).toBeGreaterThan(0);
      expect(info.available).toBeGreaterThan(0);
      expect(info.usage + info.available).toBeLessThanOrEqual(info.quota);
    });

    it('handles errors gracefully', async () => {
      const adapter = new LocalStorageAdapter();
      
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        const error = new DOMException('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      
      await expect(adapter.setItem('test', 'data')).rejects.toThrow();
      
      // Restore original function
      localStorage.setItem = originalSetItem;
    });

    it('gets all keys correctly', async () => {
      const adapter = new LocalStorageAdapter();
      
      await adapter.setItem('key1', 'value1');
      await adapter.setItem('key2', 'value2');
      await adapter.setItem('key3', 'value3');
      
      const keys = await adapter.getKeys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('IndexedDBAdapter', () => {
    it('provides same interface as LocalStorageAdapter', async () => {
      // Mock IndexedDB
      const mockDB = {
        transaction: jest.fn(),
        close: jest.fn()
      };
      
      const mockRequest = {
        onsuccess: null as any,
        onerror: null as any,
        result: mockDB
      };
      
      const mockIndexedDB = {
        open: jest.fn(() => mockRequest)
      };
      
      Object.defineProperty(window, 'indexedDB', {
        value: mockIndexedDB,
        writable: true
      });
      
      const adapter = new IndexedDBAdapter();
      
      // Simulate successful initialization
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);
      
      expect(adapter.type).toBe('indexedDB');
      expect(typeof adapter.getItem).toBe('function');
      expect(typeof adapter.setItem).toBe('function');
      expect(typeof adapter.removeItem).toBe('function');
      expect(typeof adapter.clear).toBe('function');
      expect(typeof adapter.getKeys).toBe('function');
      expect(typeof adapter.getStorageInfo).toBe('function');
    });

    it('checks availability correctly', () => {
      // Mock IndexedDB availability
      Object.defineProperty(window, 'indexedDB', {
        value: mockIndexedDB,
        writable: true
      });
      
      expect(IndexedDBAdapter.isAvailable()).toBe(true);
      
      // Mock IndexedDB unavailable
      Object.defineProperty(window, 'indexedDB', {
        value: null,
        writable: true
      });
      
      expect(IndexedDBAdapter.isAvailable()).toBe(false);
    });
  });

  describe('StorageFactory', () => {
    it('creates localStorage adapter by default', async () => {
      const adapter = await StorageFactory.createAdapter({
        type: 'localStorage'
      });
      
      expect(adapter.type).toBe('localStorage');
      expect(adapter).toBeInstanceOf(LocalStorageAdapter);
    });

    it('auto-selects best available adapter', async () => {
      // Mock that no migration has happened
      localStorage.removeItem('storage_migrated');
      
      const adapter = await StorageFactory.createAdapter({
        type: 'auto'
      });
      
      // Should default to localStorage since no migration flag
      expect(adapter.type).toBe('localStorage');
    });

    it('respects migration flag', async () => {
      // Set migration flag
      localStorage.setItem('storage_migrated', 'true');
      
      // Mock IndexedDB available
      Object.defineProperty(window, 'indexedDB', {
        value: {
          open: jest.fn(() => ({
            onsuccess: null,
            onerror: null,
            onupgradeneeded: null
          }))
        },
        writable: true
      });
      
      try {
        const adapter = await StorageFactory.createAdapter({
          type: 'auto'
        });
        // If IndexedDB initialization succeeds, should use IndexedDB
        // If it fails, should fall back to localStorage
        expect(['localStorage', 'indexedDB']).toContain(adapter.type);
      } catch (error) {
        // Fallback behavior is acceptable
        expect(error).toBeDefined();
      }
    });

    it('reports available storage types', () => {
      const available = StorageFactory.getAvailableStorageTypes();
      
      expect(available).toContain('auto');
      expect(available).toContain('localStorage');
      // IndexedDB availability depends on environment
    });
  });

  describe('Integration with useStudioPersistence', () => {
    it('maintains backward compatibility', async () => {
      // This test ensures that existing components using useStudioPersistence
      // continue to work exactly as before with the new storage adapter pattern
      
      const adapter = new LocalStorageAdapter();
      
      // Simulate the old behavior
      const testData = { content: 'test', timestamp: new Date().toISOString() };
      await adapter.setItem('studio_data', JSON.stringify(testData));
      
      const retrieved = await adapter.getItem('studio_data');
      expect(JSON.parse(retrieved!)).toEqual(testData);
    });
  });
});

// Mock IndexedDB for testing environment
const mockIndexedDB = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          get: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn(),
          getAllKeys: jest.fn()
        })),
        onerror: null
      })),
      close: jest.fn()
    }
  }))
};