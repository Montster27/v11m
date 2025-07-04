// /Users/montysharma/v11m2/src/utils/monitoringAndAlerts.ts
// Monitoring and alerts system for production health

import { Features } from '../config/featureFlags';
import { getFlagGeneratorStats } from './flagGenerator';
import subscriptionManager from './subscriptionManager';
import { memoryLeakDetector } from './memoryLeakDetector';
import rollbackManager from './rollbackPlan';

interface PerformanceMetric {
  name: string;
  value: number;
  threshold: number;
  timestamp: number;
  unit: string;
}

interface AlertConfig {
  name: string;
  condition: () => boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  action?: () => void;
  cooldownMs: number;
  lastTriggered: number;
}

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'error' | 'critical';
  metrics: PerformanceMetric[];
  issues: string[];
  timestamp: number;
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error' | 'critical';
  components: HealthCheckResult[];
  alerts: Alert[];
  timestamp: number;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  component: string;
  resolved: boolean;
  resolvedAt?: number;
}

class MonitoringSystem {
  private alerts: Map<string, Alert> = new Map();
  private alertConfigs: AlertConfig[] = [];
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeAlertConfigs();
    this.startPerformanceTracking();
  }

  private initializeAlertConfigs(): void {
    this.alertConfigs = [
      // Save System Alerts
      {
        name: 'save_failure_rate',
        condition: () => this.getSaveFailureRate() > 0.1, // 10% failure rate
        severity: 'error',
        message: 'High save failure rate detected',
        action: () => rollbackManager.executeRollback('save-system-failure'),
        cooldownMs: 300000, // 5 minutes
        lastTriggered: 0
      },
      
      {
        name: 'save_duration_high',
        condition: () => this.getAverageSaveDuration() > 1000, // 1 second
        severity: 'warning',
        message: 'Save operations taking too long',
        cooldownMs: 60000, // 1 minute
        lastTriggered: 0
      },

      // Performance Alerts
      {
        name: 'flag_generation_slow',
        condition: () => {
          const stats = getFlagGeneratorStats();
          const avgTime = stats.totalGenerationTime / (stats.cacheHits + stats.cacheMisses);
          return avgTime > 50; // 50ms
        },
        severity: 'warning',
        message: 'Flag generation performance degraded',
        action: () => console.warn('Consider clearing flag cache'),
        cooldownMs: 120000, // 2 minutes
        lastTriggered: 0
      },

      {
        name: 'cache_hit_rate_low',
        condition: () => {
          const stats = getFlagGeneratorStats();
          const hitRate = stats.cacheHits / (stats.cacheHits + stats.cacheMisses);
          return hitRate < 0.7; // Less than 70% hit rate
        },
        severity: 'info',
        message: 'Flag cache hit rate is low',
        cooldownMs: 300000, // 5 minutes
        lastTriggered: 0
      },

      // Memory Alerts
      {
        name: 'memory_usage_high',
        condition: () => {
          const usage = this.getMemoryUsage();
          return usage > 100 * 1024 * 1024; // 100MB
        },
        severity: 'warning',
        message: 'High memory usage detected',
        cooldownMs: 180000, // 3 minutes
        lastTriggered: 0
      },

      {
        name: 'memory_leak_detected',
        condition: () => {
          const report = memoryLeakDetector.generateReport();
          return (report.warnings || []).some(w => w.severity === 'high');
        },
        severity: 'error',
        message: 'Memory leak detected',
        action: () => rollbackManager.executeRollback('memory-leak-critical'),
        cooldownMs: 600000, // 10 minutes
        lastTriggered: 0
      },

      // Subscription Alerts
      {
        name: 'subscription_leak',
        condition: () => {
          const leaks = subscriptionManager.detectLeaks();
          return leaks.some(leak => leak.severity === 'high');
        },
        severity: 'error',
        message: 'Subscription leak detected',
        action: () => {
          console.warn('Cleaning up leaked subscriptions');
          const leaks = subscriptionManager.detectLeaks();
          leaks.forEach(leak => {
            if (leak.severity === 'high') {
              subscriptionManager.cleanup(leak.componentKey);
            }
          });
        },
        cooldownMs: 300000, // 5 minutes
        lastTriggered: 0
      },

      {
        name: 'high_subscription_count',
        condition: () => {
          const stats = subscriptionManager.getStats();
          return stats.totalSubscriptions > 500; // Threshold for concern
        },
        severity: 'warning',
        message: 'High number of active subscriptions',
        cooldownMs: 300000, // 5 minutes
        lastTriggered: 0
      },

      // Browser/Environment Alerts
      {
        name: 'localStorage_unavailable',
        condition: () => {
          try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return false;
          } catch {
            return true;
          }
        },
        severity: 'critical',
        message: 'localStorage is unavailable',
        action: () => rollbackManager.executeRollback('save-system-failure'),
        cooldownMs: 60000, // 1 minute
        lastTriggered: 0
      },

      {
        name: 'low_performance',
        condition: () => {
          return this.getFrameRate() < 30; // Less than 30 FPS
        },
        severity: 'warning',
        message: 'Low frame rate detected',
        action: () => rollbackManager.executeRollback('performance-degradation'),
        cooldownMs: 300000, // 5 minutes
        lastTriggered: 0
      },

      // Error Rate Alerts
      {
        name: 'high_error_rate',
        condition: () => this.getErrorRate() > 0.05, // 5% error rate
        severity: 'error',
        message: 'High JavaScript error rate',
        action: () => rollbackManager.executeRollback('complete-system-failure'),
        cooldownMs: 300000, // 5 minutes
        lastTriggered: 0
      }
    ];
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 Monitoring system started');

    // Check alerts every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkAlerts();
      this.collectMetrics();
    }, 30000);

    // Setup error tracking
    this.setupErrorTracking();
    
    // Setup performance tracking
    this.setupPerformanceTracking();

    // Initial health check
    this.performHealthCheck();
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('📊 Monitoring system stopped');
  }

  private checkAlerts(): void {
    const now = Date.now();

    this.alertConfigs.forEach(config => {
      // Check cooldown
      if (now - config.lastTriggered < config.cooldownMs) {
        return;
      }

      // Check condition
      try {
        if (config.condition()) {
          this.triggerAlert(config);
          config.lastTriggered = now;
        }
      } catch (error) {
        console.error(`Error checking alert condition for ${config.name}:`, error);
      }
    });
  }

  private triggerAlert(config: AlertConfig): void {
    const alert: Alert = {
      id: `${config.name}_${Date.now()}`,
      severity: config.severity,
      message: config.message,
      timestamp: Date.now(),
      component: config.name,
      resolved: false
    };

    this.alerts.set(alert.id, alert);

    // Log alert
    console.log(`🚨 Alert [${config.severity.toUpperCase()}]: ${config.message}`);

    // Execute action if provided
    if (config.action) {
      try {
        config.action();
      } catch (error) {
        console.error(`Error executing alert action for ${config.name}:`, error);
      }
    }

    // Send to external monitoring service
    this.sendAlertToExternalService(alert);
  }

  private collectMetrics(): void {
    const timestamp = Date.now();

    // Memory metrics
    const memoryUsage = this.getMemoryUsage();
    this.addMetric('memory_usage', {
      name: 'Memory Usage',
      value: memoryUsage,
      threshold: 100 * 1024 * 1024, // 100MB
      timestamp,
      unit: 'bytes'
    });

    // Performance metrics
    const frameRate = this.getFrameRate();
    this.addMetric('frame_rate', {
      name: 'Frame Rate',
      value: frameRate,
      threshold: 30,
      timestamp,
      unit: 'fps'
    });

    // Flag generation metrics
    const flagStats = getFlagGeneratorStats();
    this.addMetric('flag_cache_size', {
      name: 'Flag Cache Size',
      value: flagStats.cacheSize,
      threshold: 1000,
      timestamp,
      unit: 'entries'
    });

    // Subscription metrics
    const subscriptionStats = subscriptionManager.getStats();
    this.addMetric('subscription_count', {
      name: 'Active Subscriptions',
      value: subscriptionStats.totalSubscriptions,
      threshold: 500,
      timestamp,
      unit: 'count'
    });

    // Error rate metrics
    const errorRate = this.getErrorRate();
    this.addMetric('error_rate', {
      name: 'Error Rate',
      value: errorRate,
      threshold: 0.05,
      timestamp,
      unit: 'percentage'
    });
  }

  private addMetric(key: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(metric);

    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  public performHealthCheck(): SystemHealth {
    const timestamp = Date.now();
    const components: HealthCheckResult[] = [];

    // Save System Health
    components.push(this.checkSaveSystemHealth());

    // Performance Health
    components.push(this.checkPerformanceHealth());

    // Memory Health
    components.push(this.checkMemoryHealth());

    // Subscription Health
    components.push(this.checkSubscriptionHealth());

    // Browser Environment Health
    components.push(this.checkBrowserHealth());

    // Determine overall health
    const statuses = components.map(c => c.status);
    let overall: SystemHealth['overall'] = 'healthy';

    if (statuses.includes('critical')) {
      overall = 'critical';
    } else if (statuses.includes('error')) {
      overall = 'error';
    } else if (statuses.includes('warning')) {
      overall = 'warning';
    }

    const health: SystemHealth = {
      overall,
      components,
      alerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
      timestamp
    };

    console.log(`💚 System Health: ${overall.toUpperCase()}`);
    return health;
  }

  private checkSaveSystemHealth(): HealthCheckResult {
    const metrics: PerformanceMetric[] = [];
    const issues: string[] = [];
    let status: HealthCheckResult['status'] = 'healthy';

    try {
      // Test localStorage
      localStorage.setItem('health_check', 'test');
      localStorage.removeItem('health_check');

      // Check save failure rate
      const failureRate = this.getSaveFailureRate();
      metrics.push({
        name: 'Save Failure Rate',
        value: failureRate,
        threshold: 0.1,
        timestamp: Date.now(),
        unit: 'percentage'
      });

      if (failureRate > 0.1) {
        issues.push('High save failure rate');
        status = 'error';
      } else if (failureRate > 0.05) {
        issues.push('Elevated save failure rate');
        status = 'warning';
      }

      // Check save duration
      const avgDuration = this.getAverageSaveDuration();
      metrics.push({
        name: 'Average Save Duration',
        value: avgDuration,
        threshold: 1000,
        timestamp: Date.now(),
        unit: 'ms'
      });

      if (avgDuration > 1000) {
        issues.push('Slow save operations');
        if (status === 'healthy') status = 'warning';
      }

    } catch (error) {
      issues.push('localStorage unavailable');
      status = 'critical';
    }

    return {
      component: 'Save System',
      status,
      metrics,
      issues,
      timestamp: Date.now()
    };
  }

  private checkPerformanceHealth(): HealthCheckResult {
    const metrics: PerformanceMetric[] = [];
    const issues: string[] = [];
    let status: HealthCheckResult['status'] = 'healthy';

    // Check flag generation performance
    const flagStats = getFlagGeneratorStats();
    const hitRate = flagStats.cacheHits / (flagStats.cacheHits + flagStats.cacheMisses) || 0;

    metrics.push({
      name: 'Flag Cache Hit Rate',
      value: hitRate,
      threshold: 0.7,
      timestamp: Date.now(),
      unit: 'percentage'
    });

    if (hitRate < 0.5) {
      issues.push('Very low cache hit rate');
      status = 'warning';
    } else if (hitRate < 0.7) {
      issues.push('Low cache hit rate');
      if (status === 'healthy') status = 'warning';
    }

    // Check frame rate
    const frameRate = this.getFrameRate();
    metrics.push({
      name: 'Frame Rate',
      value: frameRate,
      threshold: 30,
      timestamp: Date.now(),
      unit: 'fps'
    });

    if (frameRate < 20) {
      issues.push('Very low frame rate');
      status = 'error';
    } else if (frameRate < 30) {
      issues.push('Low frame rate');
      if (status === 'healthy') status = 'warning';
    }

    return {
      component: 'Performance',
      status,
      metrics,
      issues,
      timestamp: Date.now()
    };
  }

  private checkMemoryHealth(): HealthCheckResult {
    const metrics: PerformanceMetric[] = [];
    const issues: string[] = [];
    let status: HealthCheckResult['status'] = 'healthy';

    // Check memory usage
    const memoryUsage = this.getMemoryUsage();
    metrics.push({
      name: 'Memory Usage',
      value: memoryUsage,
      threshold: 100 * 1024 * 1024,
      timestamp: Date.now(),
      unit: 'bytes'
    });

    if (memoryUsage > 200 * 1024 * 1024) { // 200MB
      issues.push('Very high memory usage');
      status = 'error';
    } else if (memoryUsage > 100 * 1024 * 1024) { // 100MB
      issues.push('High memory usage');
      status = 'warning';
    }

    // Check for memory leaks
    const leakReport = memoryLeakDetector.generateReport();
    const highSeverityWarnings = (leakReport.warnings || []).filter(w => w.severity === 'high');

    if (highSeverityWarnings.length > 0) {
      issues.push(`${highSeverityWarnings.length} high-severity memory warnings`);
      status = 'error';
    }

    return {
      component: 'Memory',
      status,
      metrics,
      issues,
      timestamp: Date.now()
    };
  }

  private checkSubscriptionHealth(): HealthCheckResult {
    const metrics: PerformanceMetric[] = [];
    const issues: string[] = [];
    let status: HealthCheckResult['status'] = 'healthy';

    const subscriptionStats = subscriptionManager.getStats();
    
    metrics.push({
      name: 'Total Subscriptions',
      value: subscriptionStats.totalSubscriptions,
      threshold: 500,
      timestamp: Date.now(),
      unit: 'count'
    });

    if (subscriptionStats.totalSubscriptions > 1000) {
      issues.push('Very high subscription count');
      status = 'error';
    } else if (subscriptionStats.totalSubscriptions > 500) {
      issues.push('High subscription count');
      status = 'warning';
    }

    // Check for subscription leaks
    const leaks = subscriptionManager.detectLeaks();
    const highSeverityLeaks = leaks.filter(leak => leak.severity === 'high');

    if (highSeverityLeaks.length > 0) {
      issues.push(`${highSeverityLeaks.length} high-severity subscription leaks`);
      status = 'error';
    }

    return {
      component: 'Subscriptions',
      status,
      metrics,
      issues,
      timestamp: Date.now()
    };
  }

  private checkBrowserHealth(): HealthCheckResult {
    const metrics: PerformanceMetric[] = [];
    const issues: string[] = [];
    let status: HealthCheckResult['status'] = 'healthy';

    // Check localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      issues.push('localStorage unavailable');
      status = 'critical';
    }

    // Check if we're in a supported browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isSupported = !userAgent.includes('msie') && 
                       (userAgent.includes('chrome') || 
                        userAgent.includes('firefox') || 
                        userAgent.includes('safari') || 
                        userAgent.includes('edge'));

    if (!isSupported) {
      issues.push('Unsupported browser detected');
      status = 'warning';
    }

    return {
      component: 'Browser Environment',
      status,
      metrics,
      issues,
      timestamp: Date.now()
    };
  }

  // Utility methods for metrics
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getFrameRate(): number {
    // Simple frame rate estimation
    // In a real implementation, this would track actual frame rates
    return 60; // Placeholder
  }

  private getSaveFailureRate(): number {
    // This would track actual save failures
    // For now, return 0 as placeholder
    return 0;
  }

  private getAverageSaveDuration(): number {
    // This would track actual save durations
    // For now, return a reasonable value
    return 100;
  }

  private getErrorRate(): number {
    // This would track JavaScript errors
    // For now, return 0 as placeholder
    return 0;
  }

  private setupErrorTracking(): void {
    let errorCount = 0;
    let totalOperations = 0;

    window.addEventListener('error', (event) => {
      errorCount++;
      console.error('🚨 JavaScript error tracked:', event.error);
      
      // Update error rate
      const errorRate = errorCount / Math.max(totalOperations, 1);
      this.addMetric('error_rate', {
        name: 'Error Rate',
        value: errorRate,
        threshold: 0.05,
        timestamp: Date.now(),
        unit: 'percentage'
      });
    });

    // Track operations (placeholder)
    setInterval(() => {
      totalOperations++;
    }, 1000);
  }

  private setupPerformanceTracking(): void {
    // Track long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Long task threshold
              console.warn(`⚠️ Long task detected: ${entry.duration}ms`);
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported');
      }
    }
  }

  private startPerformanceTracking(): void {
    // Track performance metrics periodically
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute
  }

  private sendAlertToExternalService(alert: Alert): void {
    // In a real implementation, this would send to an external monitoring service
    // For now, just log
    console.log('📤 Alert would be sent to external service:', alert);
  }

  public getMetrics(key?: string): Map<string, PerformanceMetric[]> | PerformanceMetric[] {
    if (key) {
      return this.metrics.get(key) || [];
    }
    return this.metrics;
  }

  public getAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      return true;
    }
    return false;
  }
}

// Create singleton instance
const monitoringSystem = new MonitoringSystem();

// Start monitoring if enabled
if (Features.isPerformanceMonitoringEnabled()) {
  monitoringSystem.startMonitoring();
}

export default monitoringSystem;

// Utility exports
export function showUserNotification(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
  // Simple user notification
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '15px';
  notification.style.borderRadius = '5px';
  notification.style.color = 'white';
  notification.style.zIndex = '10000';
  notification.style.maxWidth = '300px';
  notification.textContent = message;

  switch (type) {
    case 'error':
      notification.style.backgroundColor = '#dc3545';
      break;
    case 'warning':
      notification.style.backgroundColor = '#ffc107';
      notification.style.color = 'black';
      break;
    default:
      notification.style.backgroundColor = '#007bff';
  }

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

export function getSystemHealth(): SystemHealth {
  return monitoringSystem.performHealthCheck();
}

export function forceHealthCheck(): void {
  const health = monitoringSystem.performHealthCheck();
  console.log('🏥 Forced health check results:', health);
  
  if (health.overall !== 'healthy') {
    showUserNotification(
      `System health: ${health.overall}. Check console for details.`,
      health.overall === 'critical' ? 'error' : 'warning'
    );
  }
}