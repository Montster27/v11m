// React hook for backup monitoring integration
// Provides real-time monitoring data and controls

import { useState, useEffect, useRef, useCallback } from 'react';
import { BackupMonitoringService, BackupMetrics, BackupEvent, MonitoringOptions } from '../services/BackupMonitoringService';
import { StorageAdapter } from '../services/storage/StorageAdapter';

interface UseBackupMonitoringOptions {
  autoStart?: boolean;
  updateInterval?: number;
  onAlert?: (alert: { type: 'warning' | 'critical'; message: string }) => void;
}

interface UseBackupMonitoringReturn {
  // State
  isMonitoring: boolean;
  metrics: BackupMetrics | null;
  recentEvents: BackupEvent[];
  
  // Controls
  startMonitoring: () => void;
  stopMonitoring: () => void;
  recordEvent: (event: Omit<BackupEvent, 'id' | 'timestamp'>) => void;
  
  // Helpers
  getStorageTrend: (hours?: number) => Array<{ timestamp: Date; usage: number }>;
  getEventsByType: (type: BackupEvent['type'], hours?: number) => BackupEvent[];
  isHealthy: () => boolean;
}

export function useBackupMonitoring(
  storageAdapter?: StorageAdapter,
  options: UseBackupMonitoringOptions = {}
): UseBackupMonitoringReturn {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<BackupMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<BackupEvent[]>([]);
  
  const monitoringService = useRef<BackupMonitoringService | null>(null);

  // Initialize monitoring service
  useEffect(() => {
    if (!storageAdapter) {
      // Use default IndexedDB adapter if none provided
      import('../services/storage/StorageAdapter').then(({ StorageAdapter }) => {
        const adapter = new StorageAdapter('indexeddb');
        initializeService(adapter);
      });
    } else {
      initializeService(storageAdapter);
    }

    return () => {
      if (monitoringService.current) {
        monitoringService.current.stop();
      }
    };
  }, [storageAdapter]);

  const initializeService = useCallback((adapter: StorageAdapter) => {
    const monitoringOptions: Partial<MonitoringOptions> = {
      updateInterval: options.updateInterval || 30000,
      onMetricsUpdate: (newMetrics) => {
        setMetrics(newMetrics);
        // Update recent events when metrics update
        if (monitoringService.current) {
          setRecentEvents(monitoringService.current.getRecentEvents(20));
        }
      },
      onAlert: options.onAlert
    };

    monitoringService.current = new BackupMonitoringService(adapter, monitoringOptions);

    if (options.autoStart !== false) {
      startMonitoring();
    }
  }, [options]);

  const startMonitoring = useCallback(() => {
    if (monitoringService.current && !isMonitoring) {
      monitoringService.current.start();
      setIsMonitoring(true);
    }
  }, [isMonitoring]);

  const stopMonitoring = useCallback(() => {
    if (monitoringService.current && isMonitoring) {
      monitoringService.current.stop();
      setIsMonitoring(false);
    }
  }, [isMonitoring]);

  const recordEvent = useCallback((event: Omit<BackupEvent, 'id' | 'timestamp'>) => {
    if (monitoringService.current) {
      monitoringService.current.recordEvent(event);
    }
  }, []);

  const getStorageTrend = useCallback((hours: number = 24) => {
    if (monitoringService.current) {
      return monitoringService.current.getStorageTrend(hours);
    }
    return [];
  }, []);

  const getEventsByType = useCallback((type: BackupEvent['type'], hours: number = 24) => {
    if (monitoringService.current) {
      return monitoringService.current.getEventsByType(type, hours);
    }
    return [];
  }, []);

  const isHealthy = useCallback(() => {
    return metrics?.health.status === 'healthy';
  }, [metrics]);

  return {
    isMonitoring,
    metrics,
    recentEvents,
    startMonitoring,
    stopMonitoring,
    recordEvent,
    getStorageTrend,
    getEventsByType,
    isHealthy
  };
}

// Standalone monitoring status hook for simple use cases
export function useBackupStatus(storageAdapter?: StorageAdapter) {
  const { metrics, isHealthy } = useBackupMonitoring(storageAdapter, { 
    autoStart: true,
    updateInterval: 60000 // 1 minute for status checks
  });

  return {
    storageUsed: metrics?.storage.used || 0,
    storageUsagePercentage: metrics?.storage.usagePercentage || 0,
    lastBackupTime: metrics?.backups.lastBackupTime,
    isHealthy: isHealthy(),
    issues: metrics?.health.issues || [],
    status: metrics?.health.status || 'healthy'
  };
}