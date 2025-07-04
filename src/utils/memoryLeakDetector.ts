// /Users/montysharma/v11m2/src/utils/memoryLeakDetector.ts
// Memory leak detection and monitoring system

import React from 'react';
import { subscriptionManager } from './subscriptionManager';
import { useCoreGameStore, useNarrativeStore, useSocialStore } from '../stores/v2';

export interface MemoryLeakReport {
  timestamp: number;
  subscriptions: {
    total: number;
    components: number;
    byType: Record<string, number>;
    byStore: Record<string, number>;
    heavyComponents: Array<{
      key: string;
      count: number;
      age: number;
    }>;
  };
  stores: Array<{
    name: string;
    listenerCount: number;
    stateSize: number;
  }>;
  performance: {
    memoryUsage?: MemoryInfo;
    renderCount?: number;
    slowComponents?: string[];
  };
  leaks: Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    data: any;
  }>;
}

export interface MemoryMonitoringConfig {
  enabled: boolean;
  checkIntervalMs: number;
  reportIntervalMs: number;
  thresholds: {
    subscriptionCount: number;
    subscriptionAge: number;
    storeListeners: number;
    memoryGrowthMB: number;
  };
  storeInspection: boolean;
  performanceTracking: boolean;
}

class MemoryLeakDetector {
  private config: MemoryMonitoringConfig = {
    enabled: process.env.NODE_ENV === 'development',
    checkIntervalMs: 30000, // Check every 30 seconds
    reportIntervalMs: 300000, // Report every 5 minutes
    thresholds: {
      subscriptionCount: 100,
      subscriptionAge: 10 * 60 * 1000, // 10 minutes
      storeListeners: 50,
      memoryGrowthMB: 50
    },
    storeInspection: true,
    performanceTracking: true
  };

  private checkInterval?: NodeJS.Timeout;
  private reportInterval?: NodeJS.Timeout;
  private reports: MemoryLeakReport[] = [];
  private maxReports = 50;
  private baselineMemory?: number;
  private renderCounts: Map<string, number> = new Map();

  constructor(config?: Partial<MemoryMonitoringConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Start memory leak detection monitoring
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('[MemoryLeakDetector] Disabled in production mode');
      return;
    }

    console.log('[MemoryLeakDetector] Starting memory leak detection');

    // Set baseline memory usage
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      this.baselineMemory = (performance as any).memory.usedJSHeapSize;
    }

    // Start monitoring intervals
    this.checkInterval = setInterval(() => {
      this.performCheck();
    }, this.config.checkIntervalMs);

    this.reportInterval = setInterval(() => {
      this.generateReport();
    }, this.config.reportIntervalMs);

    // Initial check
    this.performCheck();
  }

  /**
   * Stop memory leak detection monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = undefined;
    }

    console.log('[MemoryLeakDetector] Stopped monitoring');
  }

  /**
   * Perform immediate memory leak check
   */
  performCheck(): MemoryLeakReport {
    const report = this.generateReport();
    
    // Check for critical issues and warn
    const criticalLeaks = report.leaks.filter(leak => leak.severity === 'critical');
    if (criticalLeaks.length > 0) {
      console.error('[MemoryLeakDetector] CRITICAL memory leaks detected:', criticalLeaks);
    }

    const warningLeaks = report.leaks.filter(leak => leak.severity === 'warning');
    if (warningLeaks.length > 0) {
      console.warn('[MemoryLeakDetector] Memory leak warnings:', warningLeaks);
    }

    return report;
  }

  /**
   * Generate comprehensive memory leak report
   */
  generateReport(): MemoryLeakReport {
    const timestamp = Date.now();
    const subscriptionStats = subscriptionManager.getStats();
    const heavyComponents = subscriptionManager.getHeavyComponents(10);

    // Store inspection
    const stores = this.config.storeInspection ? this.inspectStores() : [];

    // Performance data
    const performance = this.config.performanceTracking ? this.getPerformanceData() : {};

    // Detect leaks
    const leaks = [
      ...subscriptionManager.detectLeaks(),
      ...this.detectStoreLeaks(stores),
      ...this.detectPerformanceLeaks(performance)
    ];

    const report: MemoryLeakReport = {
      timestamp,
      subscriptions: {
        total: subscriptionStats.totalSubscriptions,
        components: subscriptionStats.activeComponents,
        byType: subscriptionStats.subscriptionsByType,
        byStore: subscriptionStats.subscriptionsByStore,
        heavyComponents: heavyComponents.map(comp => ({
          key: comp.key,
          count: comp.subscriptionCount,
          age: comp.oldestAge
        }))
      },
      stores,
      performance,
      leaks
    };

    // Store report
    this.reports.push(report);
    if (this.reports.length > this.maxReports) {
      this.reports.shift();
    }

    return report;
  }

  /**
   * Inspect store listener counts and state sizes
   */
  private inspectStores(): Array<{
    name: string;
    listenerCount: number;
    stateSize: number;
  }> {
    const stores = [
      { name: 'CoreGame', store: useCoreGameStore },
      { name: 'Narrative', store: useNarrativeStore },
      { name: 'Social', store: useSocialStore }
    ];

    return stores.map(({ name, store }) => {
      let listenerCount = 0;
      let stateSize = 0;

      try {
        // Get the store instance to inspect listeners
        const storeInstance = store.getState();
        
        // Try to access Zustand's internal listener count
        // This is implementation-dependent and may change
        const storeInternal = (store as any).getInitialState || (store as any).subscribe;
        if (storeInternal && (store as any).listeners) {
          listenerCount = (store as any).listeners.size || 0;
        }

        // Estimate state size
        try {
          const stateJson = JSON.stringify(storeInstance);
          stateSize = stateJson.length;
        } catch (error) {
          // State may contain non-serializable objects
          stateSize = -1;
        }

      } catch (error) {
        console.debug(`[MemoryLeakDetector] Error inspecting ${name} store:`, error);
      }

      return {
        name,
        listenerCount,
        stateSize
      };
    });
  }

  /**
   * Get performance-related data
   */
  private getPerformanceData(): any {
    const data: any = {};

    // Memory usage (Chrome/Edge)
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      data.memoryUsage = (performance as any).memory;
    }

    // Render count tracking
    data.renderCount = Array.from(this.renderCounts.values()).reduce((sum, count) => sum + count, 0);

    return data;
  }

  /**
   * Detect store-related memory leaks
   */
  private detectStoreLeaks(stores: Array<{ name: string; listenerCount: number; stateSize: number }>): Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    data: any;
  }> {
    const leaks = [];

    stores.forEach(store => {
      // Check for excessive listeners
      if (store.listenerCount > this.config.thresholds.storeListeners) {
        leaks.push({
          type: 'store_listener_leak',
          severity: store.listenerCount > this.config.thresholds.storeListeners * 2 ? 'critical' : 'warning',
          message: `${store.name} store has ${store.listenerCount} listeners`,
          data: store
        });
      }

      // Check for large state objects (potential memory bloat)
      if (store.stateSize > 1024 * 1024) { // > 1MB
        leaks.push({
          type: 'large_store_state',
          severity: 'warning',
          message: `${store.name} store state is ${(store.stateSize / 1024 / 1024).toFixed(2)}MB`,
          data: store
        });
      }
    });

    return leaks;
  }

  /**
   * Detect performance-related leaks
   */
  private detectPerformanceLeaks(performance: any): Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    data: any;
  }> {
    const leaks = [];

    // Memory growth detection
    if (performance.memoryUsage && this.baselineMemory) {
      const currentMemory = performance.memoryUsage.usedJSHeapSize;
      const memoryGrowthMB = (currentMemory - this.baselineMemory) / 1024 / 1024;

      if (memoryGrowthMB > this.config.thresholds.memoryGrowthMB) {
        leaks.push({
          type: 'memory_growth',
          severity: memoryGrowthMB > this.config.thresholds.memoryGrowthMB * 2 ? 'critical' : 'warning',
          message: `Memory usage increased by ${memoryGrowthMB.toFixed(2)}MB since startup`,
          data: {
            baseline: this.baselineMemory,
            current: currentMemory,
            growth: memoryGrowthMB
          }
        });
      }
    }

    return leaks;
  }

  /**
   * Track component render for performance monitoring
   */
  trackRender(componentName: string): void {
    if (!this.config.performanceTracking) return;

    const current = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, current + 1);
  }

  /**
   * Get recent memory leak reports
   */
  getReports(limit?: number): MemoryLeakReport[] {
    return limit ? this.reports.slice(-limit) : [...this.reports];
  }

  /**
   * Get memory leak summary
   */
  getSummary(): {
    totalReports: number;
    totalLeaks: number;
    criticalLeaks: number;
    commonLeakTypes: Array<{ type: string; count: number }>;
    averageSubscriptions: number;
  } {
    const allLeaks = this.reports.flatMap(report => report.leaks);
    const criticalLeaks = allLeaks.filter(leak => leak.severity === 'critical');
    
    // Count leak types
    const leakTypeCounts: Record<string, number> = {};
    allLeaks.forEach(leak => {
      leakTypeCounts[leak.type] = (leakTypeCounts[leak.type] || 0) + 1;
    });

    const commonLeakTypes = Object.entries(leakTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const averageSubscriptions = this.reports.length > 0
      ? this.reports.reduce((sum, report) => sum + report.subscriptions.total, 0) / this.reports.length
      : 0;

    return {
      totalReports: this.reports.length,
      totalLeaks: allLeaks.length,
      criticalLeaks: criticalLeaks.length,
      commonLeakTypes,
      averageSubscriptions
    };
  }

  /**
   * Clear all reports (for memory management)
   */
  clearReports(): void {
    this.reports = [];
    this.renderCounts.clear();
  }

  /**
   * Emergency cleanup - force cleanup all subscriptions
   */
  emergencyCleanup(): void {
    console.warn('[MemoryLeakDetector] Performing emergency cleanup');
    
    const cleanedSubscriptions = subscriptionManager.cleanupAll();
    
    console.log(`[MemoryLeakDetector] Emergency cleanup completed: ${cleanedSubscriptions} subscriptions cleaned`);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MemoryMonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart monitoring with new config
    if (this.checkInterval || this.reportInterval) {
      this.stop();
      this.start();
    }
  }
}

// Singleton instance
export const memoryLeakDetector = new MemoryLeakDetector();

/**
 * Setup memory leak detection with default configuration
 */
export function setupMemoryLeakDetection(config?: Partial<MemoryMonitoringConfig>): void {
  if (config) {
    memoryLeakDetector.updateConfig(config);
  }
  
  memoryLeakDetector.start();
  
  // Global error handler for cleanup on errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message?.includes('subscription')) {
        console.warn('[MemoryLeakDetector] Potential subscription-related error detected');
        memoryLeakDetector.performCheck();
      }
    });
  }
}

/**
 * Hook for components to track renders
 */
export function useRenderTracking(componentName: string): void {
  memoryLeakDetector.trackRender(componentName);
}

/**
 * Hook for components to manage subscription cleanup
 */
export function useSubscriptionCleanup(componentKey: string, deps: any[] = []) {
  const [subscriptionKey] = React.useState(() => `${componentKey}_${Date.now()}`);
  
  React.useEffect(() => {
    // Cleanup function
    return () => {
      subscriptionManager.cleanup(subscriptionKey);
    };
  }, deps);

  const addSubscription = React.useCallback((
    unsubscribe: () => void,
    type: string = 'unknown',
    target: string = 'unknown'
  ) => {
    subscriptionManager.add(subscriptionKey, unsubscribe, { type, target });
  }, [subscriptionKey]);

  const getSubscriptionCount = React.useCallback(() => {
    const stats = subscriptionManager.getStats();
    // Count subscriptions for this component
    let count = 0;
    // This is a simplified version - in production you'd track per-component counts
    return count;
  }, [subscriptionKey]);

  return {
    addSubscription,
    getSubscriptionCount
  };
}

// Export singleton
export default memoryLeakDetector;