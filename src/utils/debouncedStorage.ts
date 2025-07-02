// /Users/montysharma/v11m2/src/utils/debouncedStorage.ts
// Debounced storage utility to prevent excessive localStorage writes

import { StateStorage } from 'zustand/middleware';

type SaveCallback = (success: boolean, storeName: string) => void;

interface PendingSave {
  name: string;
  value: string;
  timestamp: number;
}

class DebouncedStorage implements StateStorage {
  private saveCallbacks: SaveCallback[] = [];
  private pendingSaves: Map<string, PendingSave> = new Map();
  private debounceTimeout: NodeJS.Timeout | null = null;
  private readonly debounceMs: number;
  
  constructor(debounceMs: number = 1000) {
    this.debounceMs = debounceMs;
  }

  getItem = (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error(`[DebouncedStorage] Failed to read ${name}:`, error);
      return null;
    }
  };

  setItem = (name: string, value: string): void => {
    // Store the pending save
    this.pendingSaves.set(name, {
      name,
      value,
      timestamp: Date.now()
    });

    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Set new timeout for debounced save
    this.debounceTimeout = setTimeout(() => {
      this.flushPendingSaves();
    }, this.debounceMs);
  };

  removeItem = (name: string): void => {
    try {
      localStorage.removeItem(name);
      this.pendingSaves.delete(name);
    } catch (error) {
      console.error(`[DebouncedStorage] Failed to remove ${name}:`, error);
    }
  };

  /**
   * Register a callback to be notified when saves complete
   * @param callback Function called with (success, storeName) when save completes
   * @returns Unsubscribe function
   */
  onSave = (callback: SaveCallback): (() => void) => {
    this.saveCallbacks.push(callback);
    return () => {
      this.saveCallbacks = this.saveCallbacks.filter(cb => cb !== callback);
    };
  };

  /**
   * Force immediate save of all pending changes
   * Useful for critical moments like page unload
   */
  flush = (): void => {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    this.flushPendingSaves();
  };

  /**
   * Get statistics about pending saves
   */
  getStats = () => {
    return {
      pendingCount: this.pendingSaves.size,
      oldestPending: this.pendingSaves.size > 0 
        ? Math.min(...Array.from(this.pendingSaves.values()).map(p => p.timestamp))
        : null,
      debounceMs: this.debounceMs
    };
  };

  private flushPendingSaves = (): void => {
    if (this.pendingSaves.size === 0) return;

    const saves = Array.from(this.pendingSaves.values());
    this.pendingSaves.clear();

    console.log(`[DebouncedStorage] Flushing ${saves.length} pending save(s)`);

    saves.forEach(({ name, value }) => {
      try {
        localStorage.setItem(name, value);
        this.notifyCallbacks(true, name);
        console.log(`[DebouncedStorage] ✅ Saved ${name} (${value.length} chars)`);
      } catch (error) {
        console.error(`[DebouncedStorage] ❌ Failed to save ${name}:`, error);
        this.notifyCallbacks(false, name);
        
        // Handle quota exceeded error
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('[DebouncedStorage] LocalStorage quota exceeded - consider cleanup');
          this.handleQuotaExceeded(name, value);
        }
      }
    });
  };

  private notifyCallbacks = (success: boolean, storeName: string): void => {
    this.saveCallbacks.forEach(callback => {
      try {
        callback(success, storeName);
      } catch (error) {
        console.error('[DebouncedStorage] Callback error:', error);
      }
    });
  };

  private handleQuotaExceeded = (name: string, value: string): void => {
    console.warn(`[DebouncedStorage] Attempting to clear space for ${name}`);
    
    // Try to clear old/unused keys
    const keysToCheck = ['old-save-', 'temp-', 'cache-'];
    let clearedAny = false;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && keysToCheck.some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key);
        clearedAny = true;
        console.log(`[DebouncedStorage] Cleared old key: ${key}`);
      }
    }
    
    if (clearedAny) {
      // Retry the save
      try {
        localStorage.setItem(name, value);
        this.notifyCallbacks(true, name);
        console.log(`[DebouncedStorage] ✅ Retry save successful for ${name}`);
      } catch (retryError) {
        console.error(`[DebouncedStorage] ❌ Retry save failed for ${name}:`, retryError);
        this.notifyCallbacks(false, name);
      }
    }
  };
}

// Create singleton instance
export const debouncedStorage = new DebouncedStorage(1000); // 1 second debounce

// Setup page unload handler to flush pending saves
if (typeof window !== 'undefined') {
  const handleBeforeUnload = () => {
    console.log('[DebouncedStorage] Page unloading - flushing pending saves');
    debouncedStorage.flush();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handleBeforeUnload);
  
  // Also flush on visibility change (mobile browsers)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      debouncedStorage.flush();
    }
  });
}

// Debug utilities for development
if (process.env.NODE_ENV === 'development') {
  (window as any).debouncedStorageDebug = {
    getStats: () => debouncedStorage.getStats(),
    flush: () => debouncedStorage.flush(),
    instance: debouncedStorage
  };
}