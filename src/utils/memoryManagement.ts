// Memory Management Utilities
// Provides hooks and utilities for proper cleanup of timers, intervals, and subscriptions

import { useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing multiple timeouts with automatic cleanup
 */
export function useTimeoutManager() {
  const timeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const createTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const timeoutId = setTimeout(() => {
      timeoutRefs.current.delete(timeoutId);
      callback();
    }, delay);
    timeoutRefs.current.add(timeoutId);
    return timeoutId;
  }, []);

  const clearTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    if (timeoutRefs.current.has(timeoutId)) {
      globalThis.clearTimeout(timeoutId);
      timeoutRefs.current.delete(timeoutId);
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeoutId => globalThis.clearTimeout(timeoutId));
    timeoutRefs.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  return {
    createTimeout,
    clearTimeout,
    clearAllTimeouts,
    activeTimeouts: timeoutRefs.current.size
  };
}

/**
 * Hook for managing multiple intervals with automatic cleanup
 */
export function useIntervalManager() {
  const intervalRefs = useRef<Set<NodeJS.Timeout>>(new Set());

  const createInterval = useCallback((callback: () => void, delay: number): NodeJS.Timeout => {
    const intervalId = setInterval(callback, delay);
    intervalRefs.current.add(intervalId);
    return intervalId;
  }, []);

  const clearInterval = useCallback((intervalId: NodeJS.Timeout) => {
    if (intervalRefs.current.has(intervalId)) {
      globalThis.clearInterval(intervalId);
      intervalRefs.current.delete(intervalId);
    }
  }, []);

  const clearAllIntervals = useCallback(() => {
    intervalRefs.current.forEach(intervalId => globalThis.clearInterval(intervalId));
    intervalRefs.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  return {
    createInterval,
    clearInterval,
    clearAllIntervals,
    activeIntervals: intervalRefs.current.size
  };
}

/**
 * Hook for managing event listeners with automatic cleanup
 */
export function useEventListenerManager() {
  const listenersRef = useRef<Array<{
    element: EventTarget;
    event: string;
    handler: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
  }>>([]);

  const addEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    listenersRef.current.push({ element, event, handler, options });
  }, []);

  const removeEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListenerOrEventListenerObject
  ) => {
    element.removeEventListener(event, handler);
    listenersRef.current = listenersRef.current.filter(
      listener => !(listener.element === element && listener.event === event && listener.handler === handler)
    );
  }, []);

  const removeAllEventListeners = useCallback(() => {
    listenersRef.current.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    listenersRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeAllEventListeners();
    };
  }, [removeAllEventListeners]);

  return {
    addEventListener,
    removeEventListener,
    removeAllEventListeners,
    activeListeners: listenersRef.current.length
  };
}

/**
 * Combined hook for managing all types of subscriptions
 */
export function useResourceManager() {
  const timeouts = useTimeoutManager();
  const intervals = useIntervalManager();
  const listeners = useEventListenerManager();

  const cleanupAll = useCallback(() => {
    timeouts.clearAllTimeouts();
    intervals.clearAllIntervals();
    listeners.removeAllEventListeners();
  }, [timeouts, intervals, listeners]);

  return {
    timeouts,
    intervals,
    listeners,
    cleanupAll,
    totalActiveResources: timeouts.activeTimeouts + intervals.activeIntervals + listeners.activeListeners
  };
}

/**
 * Hook for debugging memory leaks in development
 */
export function useMemoryLeakDetector(componentName: string) {
  const resourceManager = useResourceManager();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logResources = () => {
        const total = resourceManager.totalActiveResources;
        if (total > 0) {
          console.warn(`🧠 [${componentName}] Active resources:`, {
            timeouts: resourceManager.timeouts.activeTimeouts,
            intervals: resourceManager.intervals.activeIntervals,
            listeners: resourceManager.listeners.activeListeners,
            total
          });
        }
      };
      
      // Log immediately
      logResources();
      
      // Set up periodic logging
      const intervalId = setInterval(logResources, 5000); // Every 5 seconds
      
      return () => {
        clearInterval(intervalId);
        const finalTotal = resourceManager.totalActiveResources;
        if (finalTotal > 0) {
          console.error(`🚨 [${componentName}] Memory leak detected! ${finalTotal} resources not cleaned up`);
        } else {
          console.log(`✅ [${componentName}] All resources cleaned up properly`);
        }
      };
    }
  }, [componentName, resourceManager]);

  return resourceManager;
}

/**
 * Utility function to wrap async operations with timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutManager?: ReturnType<typeof useTimeoutManager>
): Promise<T> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    
    const cleanup = () => {
      if (timeoutManager) {
        timeoutManager.clearTimeout(timeoutId);
      } else {
        clearTimeout(timeoutId);
      }
    };

    timeoutId = (timeoutManager?.createTimeout || setTimeout)(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then(result => {
        cleanup();
        resolve(result);
      })
      .catch(error => {
        cleanup();
        reject(error);
      });
  });
}

/**
 * Debounce function with proper cleanup
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  timeoutManager?: ReturnType<typeof useTimeoutManager>
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      if (timeoutManager) {
        timeoutManager.clearTimeout(timeoutId);
      } else {
        clearTimeout(timeoutId);
      }
    }
    
    timeoutId = (timeoutManager?.createTimeout || setTimeout)(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function with proper cleanup
 */
export function createThrottledFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  timeoutManager?: ReturnType<typeof useTimeoutManager>
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      const remaining = delay - (now - lastCall);
      timeoutId = (timeoutManager?.createTimeout || setTimeout)(() => {
        lastCall = Date.now();
        func.apply(this, args);
        timeoutId = null;
      }, remaining);
    }
  };
}

/**
 * Safe interval that handles errors and cleanup
 */
export function createSafeInterval(
  callback: () => void,
  delay: number,
  options: {
    onError?: (error: Error) => void;
    maxExecutions?: number;
    intervalManager?: ReturnType<typeof useIntervalManager>;
  } = {}
): NodeJS.Timeout {
  let executions = 0;
  const { onError, maxExecutions, intervalManager } = options;

  const safeCallback = () => {
    try {
      callback();
      executions++;
      
      if (maxExecutions && executions >= maxExecutions) {
        if (intervalManager) {
          intervalManager.clearInterval(intervalId);
        } else {
          clearInterval(intervalId);
        }
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        console.error('Interval callback error:', error);
      }
      
      // Optionally stop interval on error
      if (intervalManager) {
        intervalManager.clearInterval(intervalId);
      } else {
        clearInterval(intervalId);
      }
    }
  };

  const intervalId = (intervalManager?.createInterval || setInterval)(safeCallback, delay);
  return intervalId;
}