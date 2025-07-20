// Real-time Backup Monitoring Service
// Monitors storage usage, backup frequency, and system health

import { StorageAdapter } from './storage/StorageAdapter';

export interface BackupMetrics {
  storage: {
    used: number;
    available: number;
    usagePercentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  backups: {
    totalCount: number;
    lastBackupTime?: Date;
    averageSize: number;
    frequency: number; // backups per day
    successRate: number; // percentage
  };
  performance: {
    averageExportTime: number;
    averageImportTime: number;
    compressionRatio: number;
    errorRate: number;
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  };
}

export interface BackupEvent {
  id: string;
  type: 'export' | 'import' | 'error' | 'cleanup';
  timestamp: Date;
  duration?: number;
  size?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface MonitoringOptions {
  updateInterval: number; // milliseconds
  retentionDays: number; // how long to keep events
  thresholds: {
    storageWarning: number; // percentage
    storageCritical: number; // percentage
    maxErrorRate: number; // percentage
    minBackupFrequency: number; // days
  };
  onMetricsUpdate?: (metrics: BackupMetrics) => void;
  onAlert?: (alert: { type: 'warning' | 'critical'; message: string }) => void;
}

export class BackupMonitoringService {
  private storageAdapter: StorageAdapter;
  private options: MonitoringOptions;
  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;
  private events: BackupEvent[] = [];
  private lastMetrics?: BackupMetrics;

  constructor(storageAdapter: StorageAdapter, options: Partial<MonitoringOptions> = {}) {
    this.storageAdapter = storageAdapter;
    this.options = {
      updateInterval: 30000, // 30 seconds
      retentionDays: 30,
      thresholds: {
        storageWarning: 75,
        storageCritical: 90,
        maxErrorRate: 10,
        minBackupFrequency: 7 // warn if no backup in 7 days
      },
      ...options
    };
  }

  /**
   * Start real-time monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Backup monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('📊 Starting backup monitoring service...');

    // Load existing events
    this.loadEvents();

    // Initial metrics calculation
    this.updateMetrics();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, this.options.updateInterval);

    console.log(`✅ Backup monitoring started (update interval: ${this.options.updateInterval}ms)`);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Save events before stopping
    this.saveEvents();

    console.log('📊 Backup monitoring stopped');
  }

  /**
   * Record a backup event
   */
  recordEvent(event: Omit<BackupEvent, 'id' | 'timestamp'>): void {
    const fullEvent: BackupEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...event
    };

    this.events.push(fullEvent);

    // Clean up old events
    this.cleanupOldEvents();

    // Save events
    this.saveEvents();

    // Trigger immediate metrics update
    this.updateMetrics();

    console.log(`📝 Recorded backup event: ${fullEvent.type} (${fullEvent.success ? 'success' : 'failure'})`);
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): BackupMetrics | null {
    return this.lastMetrics || null;
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): BackupEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: BackupEvent['type'], hours: number = 24): BackupEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.events.filter(event => 
      event.type === type && 
      event.timestamp >= cutoff
    );
  }

  /**
   * Get storage usage trend
   */
  getStorageTrend(hours: number = 24): Array<{ timestamp: Date; usage: number }> {
    // For now, return mock data - in a real implementation this would 
    // track storage usage over time
    const now = new Date();
    const trend = [];
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      // Mock usage data - would be real storage measurements
      const usage = Math.random() * 1000000 + 500000; // 500KB - 1.5MB
      trend.push({ timestamp, usage });
    }
    
    return trend;
  }

  // Private methods
  private async updateMetrics(): Promise<void> {
    try {
      const metrics = await this.calculateMetrics();
      this.lastMetrics = metrics;

      // Check for alerts
      this.checkAlerts(metrics);

      // Notify listeners
      if (this.options.onMetricsUpdate) {
        this.options.onMetricsUpdate(metrics);
      }

    } catch (error) {
      console.error('Failed to update backup metrics:', error);
    }
  }

  private async calculateMetrics(): Promise<BackupMetrics> {
    // Calculate storage metrics
    const storageInfo = await this.getStorageUsage();
    const usagePercentage = storageInfo.available > 0 ? 
      (storageInfo.used / storageInfo.available) * 100 : 0;

    // Calculate backup metrics
    const backupEvents = this.getEventsByType('export', 24 * 7); // Last week
    const successfulBackups = backupEvents.filter(e => e.success);
    const lastBackup = backupEvents.length > 0 ? 
      backupEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] : null;

    const averageSize = successfulBackups.length > 0 ?
      successfulBackups.reduce((sum, event) => sum + (event.size || 0), 0) / successfulBackups.length : 0;

    const frequency = backupEvents.length / 7; // per day
    const successRate = backupEvents.length > 0 ? 
      (successfulBackups.length / backupEvents.length) * 100 : 100;

    // Calculate performance metrics
    const allEvents = this.events.filter(e => e.duration !== undefined);
    const exportEvents = allEvents.filter(e => e.type === 'export' && e.success);
    const importEvents = allEvents.filter(e => e.type === 'import' && e.success);
    const errorEvents = this.getEventsByType('error', 24);

    const averageExportTime = exportEvents.length > 0 ?
      exportEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / exportEvents.length : 0;

    const averageImportTime = importEvents.length > 0 ?
      importEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / importEvents.length : 0;

    const totalEvents = this.events.filter(e => 
      e.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    const errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;

    // Determine health status
    const health = this.assessHealth(usagePercentage, errorRate, frequency, successRate);

    return {
      storage: {
        used: storageInfo.used,
        available: storageInfo.available,
        usagePercentage,
        trend: this.calculateStorageTrend()
      },
      backups: {
        totalCount: this.events.filter(e => e.type === 'export').length,
        lastBackupTime: lastBackup?.timestamp,
        averageSize,
        frequency,
        successRate
      },
      performance: {
        averageExportTime,
        averageImportTime,
        compressionRatio: 0.65, // Mock value - would calculate from actual compression data
        errorRate
      },
      health
    };
  }

  private async getStorageUsage(): Promise<{ used: number; available: number }> {
    try {
      // Try to get IndexedDB storage quota if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0
        };
      }

      // Fallback: estimate based on stored data
      let used = 0;
      try {
        const keys = ['mmv-narrative-store', 'mmv-social-store', 'content_clues', 'content_arcs'];
        for (const key of keys) {
          const data = await this.storageAdapter.getItem(key);
          if (data) {
            used += new Blob([data]).size;
          }
        }
      } catch (error) {
        console.warn('Could not estimate storage usage:', error);
      }

      return {
        used,
        available: 50 * 1024 * 1024 * 1024 // 50GB default for IndexedDB
      };
    } catch (error) {
      console.warn('Could not get storage usage:', error);
      return { used: 0, available: 0 };
    }
  }

  private calculateStorageTrend(): 'increasing' | 'decreasing' | 'stable' {
    // Simple trend calculation based on recent events
    const recentBackups = this.getEventsByType('export', 24).slice(-5);
    if (recentBackups.length < 2) return 'stable';

    const sizes = recentBackups
      .map(e => e.size || 0)
      .filter(size => size > 0);

    if (sizes.length < 2) return 'stable';

    const recent = sizes.slice(-2);
    const older = sizes.slice(0, -2);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private assessHealth(
    usagePercentage: number, 
    errorRate: number, 
    frequency: number, 
    successRate: number
  ): BackupMetrics['health'] {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Storage checks
    if (usagePercentage >= this.options.thresholds.storageCritical) {
      status = 'critical';
      issues.push(`Storage usage critical: ${usagePercentage.toFixed(1)}%`);
      recommendations.push('Delete old backups or increase storage capacity');
    } else if (usagePercentage >= this.options.thresholds.storageWarning) {
      status = 'warning';
      issues.push(`Storage usage high: ${usagePercentage.toFixed(1)}%`);
      recommendations.push('Consider cleaning up old backups');
    }

    // Error rate checks
    if (errorRate >= this.options.thresholds.maxErrorRate) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
      recommendations.push('Check system logs for recurring issues');
    }

    // Backup frequency checks
    const daysSinceLastBackup = frequency > 0 ? 1 / frequency : Infinity;
    if (daysSinceLastBackup >= this.options.thresholds.minBackupFrequency) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`No recent backups: ${daysSinceLastBackup.toFixed(1)} days ago`);
      recommendations.push('Create a backup to ensure data safety');
    }

    // Success rate checks
    if (successRate < 90) {
      status = status === 'critical' ? 'critical' : 'warning';
      issues.push(`Low backup success rate: ${successRate.toFixed(1)}%`);
      recommendations.push('Investigate backup failures');
    }

    return { status, issues, recommendations };
  }

  private checkAlerts(metrics: BackupMetrics): void {
    if (!this.options.onAlert) return;

    if (metrics.health.status === 'critical') {
      this.options.onAlert({
        type: 'critical',
        message: `Critical backup system issues: ${metrics.health.issues.join(', ')}`
      });
    } else if (metrics.health.status === 'warning') {
      this.options.onAlert({
        type: 'warning',
        message: `Backup system warnings: ${metrics.health.issues.join(', ')}`
      });
    }
  }

  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - this.options.retentionDays * 24 * 60 * 60 * 1000);
    const originalLength = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= cutoff);
    
    if (this.events.length < originalLength) {
      console.log(`🧹 Cleaned up ${originalLength - this.events.length} old backup events`);
    }
  }

  private async loadEvents(): Promise<void> {
    try {
      const eventsData = await this.storageAdapter.getItem('backup_monitoring_events');
      if (eventsData) {
        const parsed = JSON.parse(eventsData);
        this.events = parsed.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
        console.log(`📂 Loaded ${this.events.length} backup monitoring events`);
      }
    } catch (error) {
      console.warn('Could not load monitoring events:', error);
      this.events = [];
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      await this.storageAdapter.setItem(
        'backup_monitoring_events', 
        JSON.stringify(this.events)
      );
    } catch (error) {
      console.warn('Could not save monitoring events:', error);
    }
  }
}

// Export types for external use
export type { BackupMetrics, BackupEvent, MonitoringOptions };