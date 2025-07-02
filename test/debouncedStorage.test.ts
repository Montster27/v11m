// /Users/montysharma/v11m2/test/debouncedStorage.test.ts
// Comprehensive test suite for debounced storage implementation

import { debouncedStorage } from '../src/utils/debouncedStorage';

describe('Debounced Storage Tests', () => {
  let mockLocalStorage: any;
  
  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      data: {} as Record<string, string>,
      getItem: jest.fn((key: string) => mockLocalStorage.data[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        mockLocalStorage.data[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockLocalStorage.data[key];
      }),
      clear: jest.fn(() => {
        mockLocalStorage.data = {};
      })
    };
    
    // Replace global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Clear any pending timeouts
    jest.clearAllTimers();
    debouncedStorage.flush();
  });

  afterEach(() => {
    jest.clearAllTimers();
    debouncedStorage.flush();
  });

  test('should debounce multiple rapid writes', (done) => {
    const testKey = 'test-key';
    const testValues = ['value1', 'value2', 'value3'];
    
    // Make rapid writes
    testValues.forEach((value, index) => {
      debouncedStorage.setItem(testKey, value);
    });
    
    // Should not have written to localStorage yet
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    
    // Wait for debounce delay + buffer
    setTimeout(() => {
      // Should only have written once with the final value
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'value3');
      done();
    }, 1100); // 1 second debounce + 100ms buffer
  });

  test('should call save callbacks on successful write', (done) => {
    const mockCallback = jest.fn();
    const unsubscribe = debouncedStorage.onSave(mockCallback);
    
    debouncedStorage.setItem('callback-test', 'test-value');
    
    setTimeout(() => {
      expect(mockCallback).toHaveBeenCalledWith(true, 'callback-test');
      unsubscribe();
      done();
    }, 1100);
  });

  test('should call save callbacks on failed write', (done) => {
    const mockCallback = jest.fn();
    const unsubscribe = debouncedStorage.onSave(mockCallback);
    
    // Mock localStorage.setItem to throw an error
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    
    debouncedStorage.setItem('error-test', 'test-value');
    
    setTimeout(() => {
      expect(mockCallback).toHaveBeenCalledWith(false, 'error-test');
      unsubscribe();
      done();
    }, 1100);
  });

  test('should immediately flush pending writes', () => {
    debouncedStorage.setItem('flush-test', 'test-value');
    
    // Should not have written yet
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    
    // Flush immediately
    debouncedStorage.flush();
    
    // Should have written immediately
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('flush-test', 'test-value');
  });

  test('should track statistics correctly', () => {
    const stats = debouncedStorage.getStats();
    const initialPendingCount = stats.pendingWrites;
    
    // Add some pending writes
    debouncedStorage.setItem('stats-test-1', 'value1');
    debouncedStorage.setItem('stats-test-2', 'value2');
    
    const updatedStats = debouncedStorage.getStats();
    expect(updatedStats.pendingWrites).toBe(initialPendingCount + 2);
    
    // Flush and check again
    debouncedStorage.flush();
    const finalStats = debouncedStorage.getStats();
    expect(finalStats.pendingWrites).toBe(0);
  });

  test('should handle getItem correctly', () => {
    mockLocalStorage.data['existing-key'] = 'existing-value';
    
    expect(debouncedStorage.getItem('existing-key')).toBe('existing-value');
    expect(debouncedStorage.getItem('non-existing-key')).toBeNull();
  });

  test('should handle removeItem correctly', () => {
    mockLocalStorage.data['remove-test'] = 'test-value';
    
    debouncedStorage.removeItem('remove-test');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('remove-test');
  });

  test('should handle multiple subscribers correctly', (done) => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    const unsub1 = debouncedStorage.onSave(callback1);
    const unsub2 = debouncedStorage.onSave(callback2);
    
    debouncedStorage.setItem('multi-sub-test', 'test-value');
    
    setTimeout(() => {
      expect(callback1).toHaveBeenCalledWith(true, 'multi-sub-test');
      expect(callback2).toHaveBeenCalledWith(true, 'multi-sub-test');
      
      unsub1();
      unsub2();
      done();
    }, 1100);
  });

  test('should auto-flush on page unload', () => {
    debouncedStorage.setItem('unload-test', 'test-value');
    
    // Simulate page unload
    window.dispatchEvent(new Event('beforeunload'));
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('unload-test', 'test-value');
  });

  test('should auto-flush on page visibility change', () => {
    debouncedStorage.setItem('visibility-test', 'test-value');
    
    // Simulate page hide
    window.dispatchEvent(new Event('pagehide'));
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('visibility-test', 'test-value');
  });
});