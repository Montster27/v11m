// Backup Scheduler Service
// Handles automated backup scheduling and execution

import { ContentExportService } from './ContentExportService';
import { StorageAdapter } from './storage/StorageAdapter';

export type ScheduleInterval = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface BackupSchedule {
  id: string;
  name: string;
  enabled: boolean;
  interval: ScheduleInterval;
  nextRun: Date;
  lastRun?: Date;
  options: {
    format: 'json' | 'compressed';
    includeMetadata: boolean;
    compressionLevel?: number;
    retentionCount: number; // How many backups to keep
    contentTypes?: string[];
  };
  stats: {
    totalRuns: number;
    successfulRuns: number;
    lastDuration?: number;
    averageDuration: number;
    lastError?: string;
  };
}

export interface SchedulerOptions {
  storageAdapter: StorageAdapter;
  checkInterval?: number; // How often to check for due schedules (ms)
  onScheduledBackup?: (schedule: BackupSchedule, success: boolean, error?: string) => void;
  onError?: (error: string) => void;
}

export class BackupSchedulerService {
  private storageAdapter: StorageAdapter;
  private exportService: ContentExportService;
  private schedules: Map<string, BackupSchedule> = new Map();
  private checkInterval: number;
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private onScheduledBackup?: (schedule: BackupSchedule, success: boolean, error?: string) => void;
  private onError?: (error: string) => void;

  constructor(options: SchedulerOptions) {
    this.storageAdapter = options.storageAdapter;
    this.exportService = new ContentExportService(options.storageAdapter);
    this.checkInterval = options.checkInterval || 60000; // 1 minute default
    this.onScheduledBackup = options.onScheduledBackup;
    this.onError = options.onError;
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Backup scheduler already running');
      return;
    }

    this.isRunning = true;
    await this.loadSchedules();

    // Start the check interval
    this.intervalId = setInterval(() => {
      this.checkSchedules();
    }, this.checkInterval);

    console.log(`⏰ Backup scheduler started (check interval: ${this.checkInterval}ms)`);
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    await this.saveSchedules();
    console.log('⏰ Backup scheduler stopped');
  }

  /**
   * Create a new backup schedule
   */
  createSchedule(
    name: string,
    interval: ScheduleInterval,
    options: BackupSchedule['options']
  ): string {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const schedule: BackupSchedule = {
      id: scheduleId,
      name,
      enabled: true,
      interval,
      nextRun: this.calculateNextRun(interval),
      options: {
        retentionCount: 10, // Default to keeping 10 backups
        ...options
      },
      stats: {
        totalRuns: 0,
        successfulRuns: 0,
        averageDuration: 0
      }
    };

    this.schedules.set(scheduleId, schedule);
    this.saveSchedules();

    console.log(`📅 Created backup schedule: ${name} (${interval})`);
    return scheduleId;
  }

  /**
   * Update an existing schedule
   */
  updateSchedule(scheduleId: string, updates: Partial<Omit<BackupSchedule, 'id' | 'stats'>>): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    const updatedSchedule = { ...schedule, ...updates };
    
    // Recalculate next run if interval changed
    if (updates.interval && updates.interval !== schedule.interval) {
      updatedSchedule.nextRun = this.calculateNextRun(updates.interval);
    }

    this.schedules.set(scheduleId, updatedSchedule);
    this.saveSchedules();

    console.log(`📅 Updated backup schedule: ${schedule.name}`);
    return true;
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    this.schedules.delete(scheduleId);
    this.saveSchedules();

    console.log(`🗑️ Deleted backup schedule: ${schedule.name}`);
    return true;
  }

  /**
   * Enable/disable a schedule
   */
  toggleSchedule(scheduleId: string, enabled?: boolean): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    schedule.enabled = enabled !== undefined ? enabled : !schedule.enabled;
    this.schedules.set(scheduleId, schedule);
    this.saveSchedules();

    console.log(`📅 ${schedule.enabled ? 'Enabled' : 'Disabled'} backup schedule: ${schedule.name}`);
    return true;
  }

  /**
   * Get all schedules
   */
  getSchedules(): BackupSchedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get a specific schedule
   */
  getSchedule(scheduleId: string): BackupSchedule | null {
    return this.schedules.get(scheduleId) || null;
  }

  /**
   * Run a schedule immediately
   */
  async runScheduleNow(scheduleId: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    return this.executeSchedule(schedule);
  }

  /**
   * Get next scheduled backup time across all schedules
   */
  getNextScheduledBackup(): { schedule: BackupSchedule; nextRun: Date } | null {
    const enabledSchedules = Array.from(this.schedules.values())
      .filter(s => s.enabled)
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());

    return enabledSchedules.length > 0 ? {
      schedule: enabledSchedules[0],
      nextRun: enabledSchedules[0].nextRun
    } : null;
  }

  // Private methods

  private async checkSchedules(): Promise<void> {
    const now = new Date();
    
    for (const schedule of this.schedules.values()) {
      if (schedule.enabled && schedule.nextRun <= now) {
        try {
          await this.executeSchedule(schedule);
        } catch (error) {
          console.error(`Failed to execute scheduled backup ${schedule.name}:`, error);
          if (this.onError) {
            this.onError(`Scheduled backup failed: ${schedule.name}`);
          }
        }
      }
    }
  }

  private async executeSchedule(schedule: BackupSchedule): Promise<boolean> {
    const startTime = Date.now();
    
    console.log(`🔄 Executing scheduled backup: ${schedule.name}`);

    try {
      // Update stats
      schedule.stats.totalRuns++;
      schedule.lastRun = new Date();

      // Prepare export options
      const exportOptions = {
        format: schedule.options.format,
        includeMetadata: schedule.options.includeMetadata,
        compressionLevel: schedule.options.compressionLevel,
        contentTypes: schedule.options.contentTypes,
        validateDependencies: true,
        includePreferences: true
      };

      // Execute the backup
      const result = await this.exportService.exportProject(exportOptions);

      // Save the backup with schedule info
      const backupKey = `scheduled_backup_${schedule.id}_${Date.now()}`;
      await this.storageAdapter.setItem(backupKey, JSON.stringify({
        ...result,
        metadata: {
          ...result.metadata,
          scheduleName: schedule.name,
          scheduleId: schedule.id,
          automated: true
        }
      }));

      // Update success stats
      schedule.stats.successfulRuns++;
      const duration = Date.now() - startTime;
      schedule.stats.lastDuration = duration;
      schedule.stats.averageDuration = 
        ((schedule.stats.averageDuration * (schedule.stats.totalRuns - 1)) + duration) / schedule.stats.totalRuns;

      // Clean up old backups if needed
      await this.cleanupOldBackups(schedule);

      // Schedule next run
      schedule.nextRun = this.calculateNextRun(schedule.interval, schedule.lastRun);
      schedule.stats.lastError = undefined;

      this.schedules.set(schedule.id, schedule);
      await this.saveSchedules();

      console.log(`✅ Scheduled backup completed: ${schedule.name} (${duration}ms)`);

      if (this.onScheduledBackup) {
        this.onScheduledBackup(schedule, true);
      }

      return true;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update error stats
      schedule.stats.lastError = errorMessage;
      schedule.stats.lastDuration = duration;

      // Still schedule next run even if this one failed
      schedule.nextRun = this.calculateNextRun(schedule.interval, schedule.lastRun);

      this.schedules.set(schedule.id, schedule);
      await this.saveSchedules();

      console.error(`❌ Scheduled backup failed: ${schedule.name} - ${errorMessage}`);

      if (this.onScheduledBackup) {
        this.onScheduledBackup(schedule, false, errorMessage);
      }

      return false;
    }
  }

  private calculateNextRun(interval: ScheduleInterval, from?: Date): Date {
    const base = from || new Date();
    const next = new Date(base);

    switch (interval) {
      case 'hourly':
        next.setHours(next.getHours() + 1);
        break;
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }

  private async cleanupOldBackups(schedule: BackupSchedule): Promise<void> {
    try {
      // Get all backup keys for this schedule
      const allKeys = await this.storageAdapter.getAllKeys();
      const scheduleBackupKeys = allKeys
        .filter(key => key.startsWith(`scheduled_backup_${schedule.id}_`))
        .sort() // Sort by timestamp (embedded in key)
        .reverse(); // Newest first

      // Keep only the specified number of backups
      const keysToDelete = scheduleBackupKeys.slice(schedule.options.retentionCount);

      for (const key of keysToDelete) {
        await this.storageAdapter.removeItem(key);
      }

      if (keysToDelete.length > 0) {
        console.log(`🧹 Cleaned up ${keysToDelete.length} old backups for schedule: ${schedule.name}`);
      }

    } catch (error) {
      console.warn(`Failed to cleanup old backups for schedule ${schedule.name}:`, error);
    }
  }

  private async loadSchedules(): Promise<void> {
    try {
      const schedulesData = await this.storageAdapter.getItem('backup_schedules');
      if (schedulesData) {
        const parsed = JSON.parse(schedulesData);
        
        // Convert date strings back to Date objects
        for (const schedule of parsed) {
          schedule.nextRun = new Date(schedule.nextRun);
          if (schedule.lastRun) {
            schedule.lastRun = new Date(schedule.lastRun);
          }
          this.schedules.set(schedule.id, schedule);
        }

        console.log(`📂 Loaded ${this.schedules.size} backup schedules`);
      }
    } catch (error) {
      console.warn('Could not load backup schedules:', error);
    }
  }

  private async saveSchedules(): Promise<void> {
    try {
      const schedulesArray = Array.from(this.schedules.values());
      await this.storageAdapter.setItem('backup_schedules', JSON.stringify(schedulesArray));
    } catch (error) {
      console.warn('Could not save backup schedules:', error);
    }
  }
}

// Utility function to get human-readable schedule description
export function getScheduleDescription(schedule: BackupSchedule): string {
  const formatTime = (date: Date) => date.toLocaleString();
  
  let description = `${schedule.interval} backup`;
  if (schedule.lastRun) {
    description += ` (last: ${formatTime(schedule.lastRun)})`;
  }
  description += ` | next: ${formatTime(schedule.nextRun)}`;
  
  return description;
}

// Utility function to calculate schedule health
export function getScheduleHealth(schedule: BackupSchedule): {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
} {
  if (!schedule.enabled) {
    return { status: 'warning', message: 'Schedule is disabled' };
  }

  if (schedule.stats.totalRuns === 0) {
    return { status: 'warning', message: 'Never executed' };
  }

  const successRate = schedule.stats.successfulRuns / schedule.stats.totalRuns;
  
  if (successRate < 0.5) {
    return { status: 'critical', message: `Low success rate: ${(successRate * 100).toFixed(0)}%` };
  }
  
  if (successRate < 0.8) {
    return { status: 'warning', message: `Moderate success rate: ${(successRate * 100).toFixed(0)}%` };
  }

  // Check if schedule is overdue
  const now = new Date();
  const overdue = schedule.nextRun < now;
  
  if (overdue) {
    const minutesOverdue = Math.floor((now.getTime() - schedule.nextRun.getTime()) / (1000 * 60));
    return { status: 'warning', message: `Overdue by ${minutesOverdue} minutes` };
  }

  return { status: 'healthy', message: 'Running normally' };
}