// /Users/montysharma/v11m2/src/utils/subscriptionManager.ts
// Centralized subscription management to prevent memory leaks

import { useEffect, useRef } from 'react';

export type Unsubscribe = () => void;

export interface SubscriptionInfo {
  key: string;
  type: string;
  createdAt: number;
  componentName?: string;
  storeName?: string;
}

export interface SubscriptionStats {
  totalSubscriptions: number;
  activeComponents: number;
  subscriptionsByType: Record<string, number>;
  subscriptionsByStore: Record<string, number>;
  oldestSubscription: number | null;
  averageLifetime: number;
}

class SubscriptionManager {
  private subscriptions: Map<string, {
    unsubscribes: Unsubscribe[];
    info: SubscriptionInfo[];
  }> = new Map();
  
  private cleanupHistory: Array<{
    key: string;
    subscriptionCount: number;
    cleanupTime: number;
    lifetime: number;
  }> = [];
  
  private maxHistorySize = 1000;

  /**
   * Add a subscription to be tracked and cleaned up
   */
  add(
    key: string, 
    unsubscribe: Unsubscribe,
    info: Partial<SubscriptionInfo> = {}
  ): void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, {
        unsubscribes: [],
        info: []
      });
    }

    const subscription = this.subscriptions.get(key)!;
    subscription.unsubscribes.push(unsubscribe);
    subscription.info.push({
      key,
      type: info.type || 'unknown',
      createdAt: Date.now(),
      componentName: info.componentName,
      storeName: info.storeName
    });

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[SubscriptionManager] Added subscription: ${key} (${info.type})`);
    }
  }

  /**
   * Clean up all subscriptions for a specific key (usually component)
   */
  cleanup(key: string): number {
    const subscription = this.subscriptions.get(key);
    if (!subscription) {
      return 0;
    }

    const startTime = Date.now();
    const subscriptionCount = subscription.unsubscribes.length;

    // Calculate average lifetime
    const lifetimes = subscription.info.map(info => startTime - info.createdAt);
    const averageLifetime = lifetimes.reduce((sum, time) => sum + time, 0) / lifetimes.length;

    // Clean up all subscriptions
    subscription.unsubscribes.forEach(unsub => {
      try {
        unsub();
      } catch (error) {
        console.error(`[SubscriptionManager] Error during cleanup for ${key}:`, error);
      }
    });

    // Record cleanup history
    this.cleanupHistory.push({
      key,
      subscriptionCount,
      cleanupTime: startTime,
      lifetime: averageLifetime
    });

    // Limit history size
    if (this.cleanupHistory.length > this.maxHistorySize) {
      this.cleanupHistory.splice(0, this.cleanupHistory.length - this.maxHistorySize);
    }

    this.subscriptions.delete(key);

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[SubscriptionManager] Cleaned up ${subscriptionCount} subscriptions for: ${key}`);
    }

    return subscriptionCount;
  }

  /**
   * Clean up all tracked subscriptions (emergency cleanup)
   */
  cleanupAll(): number {
    let totalCleaned = 0;
    const keys = Array.from(this.subscriptions.keys());
    
    console.warn(`[SubscriptionManager] Emergency cleanup of ${keys.length} components`);
    
    keys.forEach(key => {
      totalCleaned += this.cleanup(key);
    });

    return totalCleaned;
  }

  /**
   * Get the number of active subscription groups
   */
  size(): number {
    return this.subscriptions.size;
  }

  /**
   * Get total number of individual subscriptions
   */
  totalSubscriptions(): number {
    let total = 0;
    this.subscriptions.forEach(subscription => {
      total += subscription.unsubscribes.length;
    });
    return total;
  }

  /**
   * Get detailed statistics about current subscriptions
   */
  getStats(): SubscriptionStats {
    const subscriptionsByType: Record<string, number> = {};
    const subscriptionsByStore: Record<string, number> = {};
    let oldestSubscription: number | null = null;
    const allCreationTimes: number[] = [];

    this.subscriptions.forEach(subscription => {
      subscription.info.forEach(info => {
        // Count by type
        subscriptionsByType[info.type] = (subscriptionsByType[info.type] || 0) + 1;
        
        // Count by store
        if (info.storeName) {
          subscriptionsByStore[info.storeName] = (subscriptionsByStore[info.storeName] || 0) + 1;
        }
        
        // Track oldest
        if (oldestSubscription === null || info.createdAt < oldestSubscription) {
          oldestSubscription = info.createdAt;
        }
        
        allCreationTimes.push(info.createdAt);
      });
    });

    // Calculate average lifetime of cleaned up subscriptions
    const recentCleanups = this.cleanupHistory.slice(-100); // Last 100 cleanups
    const averageLifetime = recentCleanups.length > 0
      ? recentCleanups.reduce((sum, cleanup) => sum + cleanup.lifetime, 0) / recentCleanups.length
      : 0;

    return {
      totalSubscriptions: this.totalSubscriptions(),
      activeComponents: this.size(),
      subscriptionsByType,
      subscriptionsByStore,
      oldestSubscription,
      averageLifetime
    };
  }

  /**
   * Get list of components with the most subscriptions (potential leaks)
   */
  getHeavyComponents(limit: number = 10): Array<{
    key: string;
    subscriptionCount: number;
    types: string[];
    oldestAge: number;
  }> {
    const components: Array<{
      key: string;
      subscriptionCount: number;
      types: string[];
      oldestAge: number;
    }> = [];

    const now = Date.now();

    this.subscriptions.forEach((subscription, key) => {
      const types = [...new Set(subscription.info.map(info => info.type))];
      const oldestAge = Math.min(...subscription.info.map(info => now - info.createdAt));
      
      components.push({
        key,
        subscriptionCount: subscription.unsubscribes.length,
        types,
        oldestAge
      });
    });

    return components
      .sort((a, b) => b.subscriptionCount - a.subscriptionCount)
      .slice(0, limit);
  }

  /**
   * Check for potential memory leaks and log warnings
   */
  detectLeaks(): Array<{
    type: 'high_subscription_count' | 'old_subscriptions' | 'heavy_component';
    severity: 'warning' | 'critical';
    message: string;
    data: any;
  }> {
    const leaks = [];
    const stats = this.getStats();
    const now = Date.now();

    // Check for high total subscription count
    if (stats.totalSubscriptions > 200) {
      leaks.push({
        type: 'high_subscription_count' as const,
        severity: (stats.totalSubscriptions > 500 ? 'critical' : 'warning') as const,
        message: `High subscription count: ${stats.totalSubscriptions}`,
        data: { count: stats.totalSubscriptions, components: stats.activeComponents }
      });
    }

    // Check for very old subscriptions (> 10 minutes)
    if (stats.oldestSubscription && (now - stats.oldestSubscription) > 10 * 60 * 1000) {
      leaks.push({
        type: 'old_subscriptions' as const,
        severity: 'warning' as const,
        message: `Very old subscriptions detected`,
        data: { 
          age: now - stats.oldestSubscription,
          oldestTimestamp: stats.oldestSubscription 
        }
      });
    }

    // Check for components with excessive subscriptions
    const heavyComponents = this.getHeavyComponents(5);
    heavyComponents.forEach(component => {
      if (component.subscriptionCount > 20) {
        leaks.push({
          type: 'heavy_component' as const,
          severity: (component.subscriptionCount > 50 ? 'critical' : 'warning') as const,
          message: `Component ${component.key} has ${component.subscriptionCount} subscriptions`,
          data: component
        });
      }
    });

    return leaks;
  }

  /**
   * Get cleanup history for analysis
   */
  getCleanupHistory(limit?: number): typeof this.cleanupHistory {
    return limit ? this.cleanupHistory.slice(-limit) : [...this.cleanupHistory];
  }

  /**
   * Clear cleanup history (for memory management)
   */
  clearHistory(): void {
    this.cleanupHistory = [];
  }
}

// Singleton instance
export const subscriptionManager = new SubscriptionManager();

/**
 * React hook for automatic subscription management
 * Use this in components to automatically track and cleanup subscriptions
 */
export function useSubscriptionCleanup(
  componentName: string,
  dependencies: any[] = []
): {
  addSubscription: (unsubscribe: Unsubscribe, type?: string, storeName?: string) => void;
  getSubscriptionCount: () => number;
} {
  const componentKey = useRef<string>();
  const mountTime = useRef<number>(Date.now());

  // Generate unique key for this component instance
  if (!componentKey.current) {
    componentKey.current = `${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  const addSubscription = (unsubscribe: Unsubscribe, type = 'store', storeName?: string) => {
    subscriptionManager.add(componentKey.current!, unsubscribe, {
      type,
      componentName,
      storeName
    });
  };

  const getSubscriptionCount = () => {
    const subscription = subscriptionManager['subscriptions'].get(componentKey.current!);
    return subscription ? subscription.unsubscribes.length : 0;
  };

  // Cleanup on unmount or dependency change
  useEffect(() => {
    return () => {
      if (componentKey.current) {
        const cleanedCount = subscriptionManager.cleanup(componentKey.current);
        
        if (process.env.NODE_ENV === 'development') {
          const lifetime = Date.now() - mountTime.current;
          console.debug(`[${componentName}] Cleaned up ${cleanedCount} subscriptions after ${lifetime}ms`);
        }
      }
    };
  }, dependencies);

  return {
    addSubscription,
    getSubscriptionCount
  };
}

/**
 * Hook for components that need manual subscription management
 * Returns cleanup function that should be called in useEffect return
 */
export function useManualSubscriptionCleanup(componentName: string) {
  const componentKey = `${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addSubscription = (unsubscribe: Unsubscribe, type = 'store', storeName?: string) => {
    subscriptionManager.add(componentKey, unsubscribe, {
      type,
      componentName,
      storeName
    });
  };

  const cleanup = () => {
    return subscriptionManager.cleanup(componentKey);
  };

  return {
    addSubscription,
    cleanup,
    componentKey
  };
}

// Export singleton for global access
export default subscriptionManager;