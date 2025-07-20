// React hook for backup scheduling
// Provides scheduling management and controls

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BackupSchedulerService, 
  BackupSchedule, 
  ScheduleInterval,
  getScheduleDescription,
  getScheduleHealth
} from '../services/BackupSchedulerService';
import { StorageAdapter } from '../services/storage/StorageAdapter';

interface UseBackupSchedulerOptions {
  storageAdapter?: StorageAdapter;
  autoStart?: boolean;
  onScheduledBackup?: (schedule: BackupSchedule, success: boolean, error?: string) => void;
  onError?: (error: string) => void;
}

interface UseBackupSchedulerReturn {
  // State
  isRunning: boolean;
  schedules: BackupSchedule[];
  nextScheduledBackup: { schedule: BackupSchedule; nextRun: Date } | null;
  
  // Controls
  startScheduler: () => Promise<void>;
  stopScheduler: () => Promise<void>;
  
  // Schedule management
  createSchedule: (
    name: string,
    interval: ScheduleInterval,
    options: BackupSchedule['options']
  ) => string;
  updateSchedule: (scheduleId: string, updates: Partial<BackupSchedule>) => boolean;
  deleteSchedule: (scheduleId: string) => boolean;
  toggleSchedule: (scheduleId: string, enabled?: boolean) => boolean;
  runScheduleNow: (scheduleId: string) => Promise<boolean>;
  
  // Utilities
  getScheduleDescription: (schedule: BackupSchedule) => string;
  getScheduleHealth: (schedule: BackupSchedule) => {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
  };
  refreshSchedules: () => void;
}

export function useBackupScheduler(
  options: UseBackupSchedulerOptions = {}
): UseBackupSchedulerReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [nextScheduledBackup, setNextScheduledBackup] = useState<{ schedule: BackupSchedule; nextRun: Date } | null>(null);
  
  const schedulerService = useRef<BackupSchedulerService | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize scheduler service
  useEffect(() => {
    const initializeScheduler = async () => {
      if (!options.storageAdapter) {
        // Use default IndexedDB adapter if none provided
        const { StorageAdapter } = await import('../services/storage/StorageAdapter');
        const adapter = new StorageAdapter('indexeddb');
        createSchedulerService(adapter);
      } else {
        createSchedulerService(options.storageAdapter);
      }
    };

    initializeScheduler();

    return () => {
      if (schedulerService.current) {
        schedulerService.current.stop();
      }
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [options.storageAdapter]);

  const createSchedulerService = useCallback((adapter: StorageAdapter) => {
    schedulerService.current = new BackupSchedulerService({
      storageAdapter: adapter,
      checkInterval: 60000, // Check every minute
      onScheduledBackup: (schedule, success, error) => {
        // Refresh schedules when a backup runs
        refreshSchedules();
        if (options.onScheduledBackup) {
          options.onScheduledBackup(schedule, success, error);
        }
      },
      onError: options.onError
    });

    if (options.autoStart !== false) {
      startScheduler();
    }

    // Set up periodic refresh
    refreshInterval.current = setInterval(() => {
      refreshSchedules();
    }, 30000); // Refresh every 30 seconds
  }, [options]);

  const startScheduler = useCallback(async () => {
    if (schedulerService.current && !isRunning) {
      await schedulerService.current.start();
      setIsRunning(true);
      refreshSchedules();
    }
  }, [isRunning]);

  const stopScheduler = useCallback(async () => {
    if (schedulerService.current && isRunning) {
      await schedulerService.current.stop();
      setIsRunning(false);
    }
  }, [isRunning]);

  const refreshSchedules = useCallback(() => {
    if (schedulerService.current) {
      const currentSchedules = schedulerService.current.getSchedules();
      setSchedules([...currentSchedules]); // Create new array to trigger re-render
      
      const nextBackup = schedulerService.current.getNextScheduledBackup();
      setNextScheduledBackup(nextBackup);
    }
  }, []);

  const createSchedule = useCallback((
    name: string,
    interval: ScheduleInterval,
    options: BackupSchedule['options']
  ): string => {
    if (!schedulerService.current) {
      throw new Error('Scheduler service not initialized');
    }

    const scheduleId = schedulerService.current.createSchedule(name, interval, options);
    refreshSchedules();
    return scheduleId;
  }, [refreshSchedules]);

  const updateSchedule = useCallback((
    scheduleId: string,
    updates: Partial<BackupSchedule>
  ): boolean => {
    if (!schedulerService.current) return false;

    const result = schedulerService.current.updateSchedule(scheduleId, updates);
    if (result) {
      refreshSchedules();
    }
    return result;
  }, [refreshSchedules]);

  const deleteSchedule = useCallback((scheduleId: string): boolean => {
    if (!schedulerService.current) return false;

    const result = schedulerService.current.deleteSchedule(scheduleId);
    if (result) {
      refreshSchedules();
    }
    return result;
  }, [refreshSchedules]);

  const toggleSchedule = useCallback((scheduleId: string, enabled?: boolean): boolean => {
    if (!schedulerService.current) return false;

    const result = schedulerService.current.toggleSchedule(scheduleId, enabled);
    if (result) {
      refreshSchedules();
    }
    return result;
  }, [refreshSchedules]);

  const runScheduleNow = useCallback(async (scheduleId: string): Promise<boolean> => {
    if (!schedulerService.current) return false;

    const result = await schedulerService.current.runScheduleNow(scheduleId);
    refreshSchedules(); // Refresh after running
    return result;
  }, [refreshSchedules]);

  return {
    isRunning,
    schedules,
    nextScheduledBackup,
    startScheduler,
    stopScheduler,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleSchedule,
    runScheduleNow,
    getScheduleDescription,
    getScheduleHealth,
    refreshSchedules
  };
}

// Simple hook for schedule status display
export function useScheduleStatus(storageAdapter?: StorageAdapter) {
  const { schedules, nextScheduledBackup, isRunning } = useBackupScheduler({
    storageAdapter,
    autoStart: true
  });

  const enabledSchedules = schedules.filter(s => s.enabled);
  const healthySchedules = schedules.filter(s => getScheduleHealth(s).status === 'healthy');

  return {
    totalSchedules: schedules.length,
    enabledSchedules: enabledSchedules.length,
    healthySchedules: healthySchedules.length,
    nextBackupTime: nextScheduledBackup?.nextRun,
    isSchedulerRunning: isRunning
  };
}