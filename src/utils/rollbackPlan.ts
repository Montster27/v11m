// /Users/montysharma/v11m2/src/utils/rollbackPlan.ts
// Emergency rollback plan for critical issues

import { setFeatureFlagOverride, clearFeatureFlagOverrides } from '../config/featureFlags';

interface RollbackState {
  timestamp: number;
  localStorage: Record<string, string>;
  featureFlags: Record<string, boolean>;
  userAgent: string;
  version: string;
}

interface RollbackPlan {
  trigger: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: Array<() => Promise<void>>;
  description: string;
}

class RollbackManager {
  private backups: Map<string, RollbackState> = new Map();
  private rollbackPlans: Map<string, RollbackPlan> = new Map();

  constructor() {
    this.initializeRollbackPlans();
    this.createInitialBackup();
  }

  private initializeRollbackPlans(): void {
    // Plan 1: Save System Issues
    this.rollbackPlans.set('save-system-failure', {
      trigger: 'Save system failure detected',
      severity: 'critical',
      description: 'Disable all save system optimizations and restore backup',
      actions: [
        async () => {
          console.log('🔄 Rolling back save system...');
          setFeatureFlagOverride('USE_ATOMIC_SAVES', false);
          setFeatureFlagOverride('USE_COMPRESSED_SAVES', false);
          setFeatureFlagOverride('USE_SAVE_VALIDATION', false);
          await this.restoreLocalStorageBackup();
        }
      ]
    });

    // Plan 2: Performance Issues
    this.rollbackPlans.set('performance-degradation', {
      trigger: 'Severe performance degradation detected',
      severity: 'high',
      description: 'Disable performance optimizations that may cause issues',
      actions: [
        async () => {
          console.log('🔄 Rolling back performance optimizations...');
          setFeatureFlagOverride('USE_MEMOIZED_FLAGS', false);
          setFeatureFlagOverride('USE_BATCHED_STORYLET_EVALUATION', false);
          setFeatureFlagOverride('USE_IDLE_CALLBACK_OPTIMIZATION', false);
          setFeatureFlagOverride('USE_FLAG_CACHE_PREWARMING', false);
        }
      ]
    });

    // Plan 3: Memory Issues
    this.rollbackPlans.set('memory-leak-critical', {
      trigger: 'Critical memory leak detected',
      severity: 'critical',
      description: 'Disable memory management features and perform emergency cleanup',
      actions: [
        async () => {
          console.log('🔄 Rolling back memory management...');
          setFeatureFlagOverride('USE_RENDER_TRACKING', false);
          setFeatureFlagOverride('USE_MEMORY_LEAK_DETECTION', false);
          await this.performEmergencyCleanup();
        }
      ]
    });

    // Plan 4: Complete System Rollback
    this.rollbackPlans.set('complete-system-failure', {
      trigger: 'Complete system failure',
      severity: 'critical',
      description: 'Disable all new features and restore to safe state',
      actions: [
        async () => {
          console.log('🔄 Complete system rollback...');
          await this.disableAllNewFeatures();
          await this.restoreLocalStorageBackup();
          await this.performEmergencyCleanup();
          window.location.reload();
        }
      ]
    });

    // Plan 5: Experimental Feature Issues
    this.rollbackPlans.set('experimental-failure', {
      trigger: 'Experimental feature failure',
      severity: 'medium',
      description: 'Disable all experimental features',
      actions: [
        async () => {
          console.log('🔄 Rolling back experimental features...');
          setFeatureFlagOverride('EXPERIMENTAL_SAVE_COMPRESSION', false);
          setFeatureFlagOverride('EXPERIMENTAL_PARALLEL_PROCESSING', false);
          setFeatureFlagOverride('EXPERIMENTAL_ADVANCED_CACHING', false);
        }
      ]
    });
  }

  private createInitialBackup(): void {
    try {
      const backup: RollbackState = {
        timestamp: Date.now(),
        localStorage: this.captureLocalStorage(),
        featureFlags: {},
        userAgent: navigator.userAgent,
        version: process.env.REACT_APP_VERSION || 'unknown'
      };

      this.backups.set('initial', backup);
      console.log('📦 Initial backup created');
    } catch (error) {
      console.error('❌ Failed to create initial backup:', error);
    }
  }

  public createBackup(name: string): void {
    try {
      const backup: RollbackState = {
        timestamp: Date.now(),
        localStorage: this.captureLocalStorage(),
        featureFlags: this.captureFeatureFlags(),
        userAgent: navigator.userAgent,
        version: process.env.REACT_APP_VERSION || 'unknown'
      };

      this.backups.set(name, backup);
      console.log(`📦 Backup '${name}' created`);
    } catch (error) {
      console.error(`❌ Failed to create backup '${name}':`, error);
    }
  }

  private captureLocalStorage(): Record<string, string> {
    const storage: Record<string, string> = {};
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storage[key] = localStorage.getItem(key) || '';
        }
      }
    } catch (error) {
      console.error('❌ Failed to capture localStorage:', error);
    }
    
    return storage;
  }

  private captureFeatureFlags(): Record<string, boolean> {
    // This would capture current feature flag state
    // Implementation depends on how feature flags are stored
    return {};
  }

  public async executeRollback(planName: string): Promise<boolean> {
    const plan = this.rollbackPlans.get(planName);
    
    if (!plan) {
      console.error(`❌ Rollback plan '${planName}' not found`);
      return false;
    }

    console.log(`🚨 Executing rollback plan: ${planName}`);
    console.log(`🚨 Severity: ${plan.severity.toUpperCase()}`);
    console.log(`🚨 Description: ${plan.description}`);

    try {
      // Create backup before rollback
      this.createBackup(`pre-rollback-${Date.now()}`);

      // Execute rollback actions
      for (const action of plan.actions) {
        await action();
      }

      console.log(`✅ Rollback plan '${planName}' executed successfully`);
      
      // Log rollback event
      this.logRollbackEvent(planName, plan.severity, true);
      
      return true;
    } catch (error) {
      console.error(`❌ Rollback plan '${planName}' failed:`, error);
      this.logRollbackEvent(planName, plan.severity, false, error);
      return false;
    }
  }

  private async restoreLocalStorageBackup(backupName: string = 'initial'): Promise<void> {
    const backup = this.backups.get(backupName);
    
    if (!backup) {
      throw new Error(`Backup '${backupName}' not found`);
    }

    try {
      // Clear current localStorage
      localStorage.clear();

      // Restore from backup
      Object.entries(backup.localStorage).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error(`❌ Failed to restore localStorage item '${key}':`, error);
        }
      });

      console.log(`✅ localStorage restored from backup '${backupName}'`);
    } catch (error) {
      console.error(`❌ Failed to restore localStorage from backup '${backupName}':`, error);
      throw error;
    }
  }

  private async disableAllNewFeatures(): Promise<void> {
    const newFeatures = [
      'USE_ATOMIC_SAVES',
      'USE_COMPRESSED_SAVES',
      'USE_MEMOIZED_FLAGS',
      'USE_BATCHED_STORYLET_EVALUATION',
      'USE_SUBSCRIPTION_MANAGER',
      'USE_MEMORY_LEAK_DETECTION',
      'EXPERIMENTAL_SAVE_COMPRESSION',
      'EXPERIMENTAL_PARALLEL_PROCESSING',
      'EXPERIMENTAL_ADVANCED_CACHING'
    ];

    newFeatures.forEach(feature => {
      setFeatureFlagOverride(feature as any, false);
    });

    console.log('🔄 All new features disabled');
  }

  private async performEmergencyCleanup(): Promise<void> {
    try {
      // Clear any potential memory leaks
      if (typeof window !== 'undefined') {
        // Clear intervals and timeouts
        let id = window.setTimeout(() => {}, 0);
        while (id--) {
          window.clearTimeout(id);
        }

        // Clear any global variables that might be leaking
        const globalKeys = Object.keys(window).filter(key => 
          key.startsWith('__') || key.includes('leak') || key.includes('temp')
        );
        
        globalKeys.forEach(key => {
          try {
            delete (window as any)[key];
          } catch (error) {
            // Ignore errors for non-configurable properties
          }
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      console.log('✅ Emergency cleanup performed');
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
    }
  }

  public detectCriticalIssues(): string[] {
    const issues: string[] = [];

    try {
      // Check localStorage availability
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      issues.push('save-system-failure');
    }

    // Check memory usage
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      if (memoryUsage > 0.9) {
        issues.push('memory-leak-critical');
      }
    }

    // Check for performance issues
    const now = performance.now();
    setTimeout(() => {
      const delay = performance.now() - now;
      if (delay > 100) {
        issues.push('performance-degradation');
      }
    }, 0);

    return issues;
  }

  public monitorAndAutoRollback(): void {
    // Set up automatic monitoring
    setInterval(() => {
      const issues = this.detectCriticalIssues();
      
      issues.forEach(issue => {
        console.warn(`🚨 Critical issue detected: ${issue}`);
        this.executeRollback(issue);
      });
    }, 30000); // Check every 30 seconds

    // Monitor for JavaScript errors
    window.addEventListener('error', (event) => {
      if (this.isCriticalError(event.error)) {
        console.error('🚨 Critical JavaScript error detected:', event.error);
        this.executeRollback('complete-system-failure');
      }
    });

    // Monitor for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isCriticalError(event.reason)) {
        console.error('🚨 Critical unhandled rejection:', event.reason);
        this.executeRollback('complete-system-failure');
      }
    });
  }

  private isCriticalError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    const criticalKeywords = [
      'localStorage',
      'save',
      'memory',
      'out of memory',
      'maximum call stack',
      'cannot read property'
    ];

    return criticalKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword)
    );
  }

  private logRollbackEvent(
    planName: string,
    severity: string,
    success: boolean,
    error?: any
  ): void {
    const event = {
      timestamp: new Date().toISOString(),
      plan: planName,
      severity,
      success,
      error: error ? error.message : null,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.log('📊 Rollback event logged:', event);

    // Store rollback log
    try {
      const logs = JSON.parse(localStorage.getItem('rollback_logs') || '[]');
      logs.push(event);
      
      // Keep only last 10 rollback events
      if (logs.length > 10) {
        logs.splice(0, logs.length - 10);
      }
      
      localStorage.setItem('rollback_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('❌ Failed to log rollback event:', error);
    }
  }

  public getRollbackLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('rollback_logs') || '[]');
    } catch (error) {
      console.error('❌ Failed to get rollback logs:', error);
      return [];
    }
  }

  public listAvailableBackups(): string[] {
    return Array.from(this.backups.keys());
  }

  public getBackupInfo(name: string): RollbackState | undefined {
    return this.backups.get(name);
  }
}

// Create singleton instance
const rollbackManager = new RollbackManager();

// Export utility functions
export async function immediateRollback(): Promise<void> {
  console.log('🚨 IMMEDIATE ROLLBACK INITIATED');
  
  // Restore localStorage backup
  const backup = JSON.parse(localStorage.getItem('game_state_backup') || '{}');
  Object.entries(backup).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, value as string);
    } catch (error) {
      console.error(`Failed to restore ${key}:`, error);
    }
  });
  
  // Clear feature flag overrides
  clearFeatureFlagOverrides();
  
  // Reload page
  window.location.reload();
}

export function createEmergencyBackup(): void {
  try {
    const backup: Record<string, string> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        backup[key] = localStorage.getItem(key) || '';
      }
    }
    
    localStorage.setItem('game_state_backup', JSON.stringify(backup));
    console.log('📦 Emergency backup created');
  } catch (error) {
    console.error('❌ Failed to create emergency backup:', error);
  }
}

export function setupMonitoring(): void {
  // Monitor save failures
  const originalSetItem = localStorage.setItem;
  let saveFailureCount = 0;
  
  localStorage.setItem = function(key: string, value: string) {
    try {
      return originalSetItem.call(this, key, value);
    } catch (error) {
      saveFailureCount++;
      console.error('🚨 localStorage save failed:', error);
      
      if (saveFailureCount >= 3) {
        console.error('🚨 Multiple save failures detected - triggering rollback');
        rollbackManager.executeRollback('save-system-failure');
      }
      
      throw error;
    }
  };
  
  // Monitor for memory issues
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    setInterval(() => {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 90) {
        console.warn('🚨 High memory usage detected:', usagePercent.toFixed(1) + '%');
        rollbackManager.executeRollback('memory-leak-critical');
      }
    }, 60000); // Check every minute
  }
  
  // Start automatic monitoring
  rollbackManager.monitorAndAutoRollback();
}

export default rollbackManager;