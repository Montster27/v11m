// /Users/montysharma/v11m2/src/stores/v2/storeOptimizations.ts
// V2 Store Performance Optimizations and Memory Management

/**
 * Performance optimizations for V2 stores including:
 * - Memoized selectors to prevent unnecessary re-renders
 * - Debounced store operations
 * - Memory usage optimization
 * - Batched updates
 * - Efficient data structures
 */

import { StoreApi } from 'zustand';

// Memoized selector cache
const selectorCache = new Map<string, { result: any; timestamp: number; dependencies: string }>();
const CACHE_TTL = 5000; // 5 seconds cache TTL

/**
 * Memoized selector factory - prevents unnecessary re-computations
 */
export const createMemoizedSelector = <T, R>(
  selector: (state: T) => R,
  dependencies?: (state: T) => string
) => {
  return (state: T): R => {
    const depKey = dependencies ? dependencies(state) : JSON.stringify(state);
    const cacheKey = `${selector.toString()}-${depKey}`;
    const now = Date.now();
    
    // Check cache
    const cached = selectorCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL && cached.dependencies === depKey) {
      return cached.result;
    }
    
    // Compute new result
    const result = selector(state);
    
    // Cache result
    selectorCache.set(cacheKey, {
      result,
      timestamp: now,
      dependencies: depKey
    });
    
    // Clean old cache entries (keep only last 100)
    if (selectorCache.size > 100) {
      const entries = Array.from(selectorCache.entries());
      const oldEntries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, selectorCache.size - 50);
      
      oldEntries.forEach(([key]) => selectorCache.delete(key));
    }
    
    return result;
  };
};

/**
 * Debounced store update utility
 */
const updateQueues = new Map<string, { updates: (() => void)[]; timeout: NodeJS.Timeout | null }>();

export const createDebouncedUpdate = (storeId: string, delay: number = 100) => {
  return (updateFn: () => void) => {
    const queue = updateQueues.get(storeId) || { updates: [], timeout: null };
    
    // Add update to queue
    queue.updates.push(updateFn);
    
    // Clear existing timeout
    if (queue.timeout) {
      clearTimeout(queue.timeout);
    }
    
    // Set new timeout
    queue.timeout = setTimeout(() => {
      // Execute all queued updates
      queue.updates.forEach(fn => fn());
      queue.updates = [];
      queue.timeout = null;
    }, delay);
    
    updateQueues.set(storeId, queue);
  };
};

/**
 * Optimized flag storage using Records instead of Maps for better serialization
 */
export interface OptimizedFlagStorage {
  storylet: Record<string, any>;
  concerns: Record<string, any>;
  storyArc: Record<string, any>;
  storyletFlag: Record<string, any>;
}

/**
 * Convert Map-based flags to optimized Record structure
 */
export const optimizeFlagStorage = (flags: any): OptimizedFlagStorage => {
  const optimized: OptimizedFlagStorage = {
    storylet: {},
    concerns: {},
    storyArc: {},
    storyletFlag: {}
  };
  
  Object.keys(optimized).forEach(flagType => {
    const flagData = flags[flagType];
    if (flagData instanceof Map) {
      optimized[flagType as keyof OptimizedFlagStorage] = Object.fromEntries(flagData);
    } else if (typeof flagData === 'object' && flagData !== null) {
      optimized[flagType as keyof OptimizedFlagStorage] = { ...flagData };
    }
  });
  
  return optimized;
};

/**
 * Batch multiple store operations for better performance
 */
export const createBatchedOperations = <T>(store: StoreApi<T>) => {
  let batchQueue: Array<(state: T) => Partial<T>> = [];
  let batchTimeout: NodeJS.Timeout | null = null;
  
  const flushBatch = () => {
    if (batchQueue.length === 0) return;
    
    store.setState((state) => {
      return batchQueue.reduce((acc, operation) => {
        return { ...acc, ...operation(state) };
      }, {} as Partial<T>);
    });
    
    batchQueue = [];
    batchTimeout = null;
  };
  
  const addToBatch = (operation: (state: T) => Partial<T>) => {
    batchQueue.push(operation);
    
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }
    
    batchTimeout = setTimeout(flushBatch, 16); // Next frame
  };
  
  return {
    addToBatch,
    flushBatch
  };
};

/**
 * Memory usage monitoring and cleanup utilities
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryUsage: Array<{ timestamp: number; usage: number }> = [];
  private cleanupCallbacks: Array<() => void> = [];
  
  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }
  
  trackMemoryUsage(): void {
    const usage = this.estimateMemoryUsage();
    this.memoryUsage.push({
      timestamp: Date.now(),
      usage
    });
    
    // Keep only last 100 measurements
    if (this.memoryUsage.length > 100) {
      this.memoryUsage = this.memoryUsage.slice(-50);
    }
    
    // Trigger cleanup if memory usage is high
    if (usage > 50 * 1024 * 1024) { // 50MB threshold
      this.triggerCleanup();
    }
  }
  
  private estimateMemoryUsage(): number {
    // Rough estimate based on store sizes
    let totalSize = 0;
    
    // Check window object size (stores)
    if (typeof window !== 'undefined') {
      const storeKeys = Object.keys(window).filter(key => key.includes('Store'));
      storeKeys.forEach(key => {
        try {
          const store = (window as any)[key];
          if (store && typeof store.getState === 'function') {
            const stateString = JSON.stringify(store.getState());
            totalSize += stateString.length * 2; // Rough UTF-16 estimation
          }
        } catch (error) {
          // Ignore serialization errors
        }
      });
    }
    
    return totalSize;
  }
  
  addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }
  
  private triggerCleanup(): void {
    console.log('🧹 Triggering memory cleanup...');
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });
    
    // Clear selector cache
    selectorCache.clear();
    
    // Clear update queues
    updateQueues.forEach((queue, key) => {
      if (queue.timeout) {
        clearTimeout(queue.timeout);
      }
      updateQueues.delete(key);
    });
  }
  
  getMemoryReport(): {
    currentUsage: number;
    averageUsage: number;
    peakUsage: number;
    measurements: number;
  } {
    if (this.memoryUsage.length === 0) {
      return { currentUsage: 0, averageUsage: 0, peakUsage: 0, measurements: 0 };
    }
    
    const current = this.memoryUsage[this.memoryUsage.length - 1].usage;
    const average = this.memoryUsage.reduce((sum, m) => sum + m.usage, 0) / this.memoryUsage.length;
    const peak = Math.max(...this.memoryUsage.map(m => m.usage));
    
    return {
      currentUsage: current,
      averageUsage: average,
      peakUsage: peak,
      measurements: this.memoryUsage.length
    };
  }
}

/**
 * Performance monitoring for store operations
 */
export class StorePerformanceMonitor {
  private static operations: Array<{
    operation: string;
    duration: number;
    timestamp: number;
    storeId: string;
  }> = [];
  
  static trackOperation<T>(
    storeId: string,
    operationName: string,
    operation: () => T
  ): T {
    const startTime = performance.now();
    
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      
      this.operations.push({
        operation: operationName,
        duration,
        timestamp: Date.now(),
        storeId
      });
      
      // Keep only recent operations
      if (this.operations.length > 1000) {
        this.operations = this.operations.slice(-500);
      }
      
      // Log slow operations
      if (duration > 100) {
        console.warn(`🐌 Slow store operation: ${storeId}.${operationName} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ Store operation failed: ${storeId}.${operationName} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
  
  static getPerformanceReport(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: number;
    operationsByStore: Record<string, number>;
  } {
    if (this.operations.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: 0,
        operationsByStore: {}
      };
    }
    
    const totalDuration = this.operations.reduce((sum, op) => sum + op.duration, 0);
    const slowOps = this.operations.filter(op => op.duration > 50).length;
    
    const byStore = this.operations.reduce((acc, op) => {
      acc[op.storeId] = (acc[op.storeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalOperations: this.operations.length,
      averageDuration: totalDuration / this.operations.length,
      slowOperations: slowOps,
      operationsByStore: byStore
    };
  }
}

/**
 * Optimized array operations for store arrays
 */
export const optimizedArrayOperations = {
  // Efficient array addition without duplication
  addUnique: <T>(array: T[], item: T, keySelector?: (item: T) => string): T[] => {
    const key = keySelector ? keySelector(item) : item;
    const exists = keySelector 
      ? array.some(existing => keySelector(existing) === key)
      : array.includes(item);
    
    return exists ? array : [...array, item];
  },
  
  // Efficient array removal
  remove: <T>(array: T[], item: T, keySelector?: (item: T) => string): T[] => {
    if (keySelector) {
      const key = keySelector(item);
      return array.filter(existing => keySelector(existing) !== key);
    }
    return array.filter(existing => existing !== item);
  },
  
  // Efficient array update
  update: <T>(array: T[], item: T, keySelector: (item: T) => string): T[] => {
    const key = keySelector(item);
    const index = array.findIndex(existing => keySelector(existing) === key);
    
    if (index === -1) {
      return [...array, item];
    }
    
    const newArray = [...array];
    newArray[index] = item;
    return newArray;
  },
  
  // Batch array operations
  batchUpdate: <T>(
    array: T[], 
    operations: Array<{ type: 'add' | 'remove' | 'update'; item: T }>,
    keySelector?: (item: T) => string
  ): T[] => {
    return operations.reduce((acc, op) => {
      switch (op.type) {
        case 'add':
          return optimizedArrayOperations.addUnique(acc, op.item, keySelector);
        case 'remove':
          return optimizedArrayOperations.remove(acc, op.item, keySelector);
        case 'update':
          return keySelector ? optimizedArrayOperations.update(acc, op.item, keySelector) : acc;
        default:
          return acc;
      }
    }, array);
  }
};

// Initialize memory monitoring
if (typeof window !== 'undefined') {
  const memoryMonitor = MemoryMonitor.getInstance();
  
  // Track memory usage every 30 seconds
  setInterval(() => {
    memoryMonitor.trackMemoryUsage();
  }, 30000);
  
  // Expose performance utilities globally for development
  (window as any).storePerformance = {
    getMemoryReport: () => memoryMonitor.getMemoryReport(),
    getPerformanceReport: () => StorePerformanceMonitor.getPerformanceReport(),
    clearCache: () => selectorCache.clear(),
    triggerCleanup: () => memoryMonitor['triggerCleanup']()
  };
  
  console.log('🚀 Store performance monitoring initialized');
}