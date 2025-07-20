// Backup Schedule Manager Component
// Interface for creating and managing automated backup schedules

import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { useBackupScheduler } from '../../hooks/useBackupScheduler';
import { BackupSchedule, ScheduleInterval } from '../../services/BackupSchedulerService';
import { StorageAdapter } from '../../services/storage/StorageAdapter';

interface BackupScheduleManagerProps {
  storageAdapter?: StorageAdapter;
  className?: string;
}

interface ScheduleFormData {
  name: string;
  interval: ScheduleInterval;
  format: 'json' | 'compressed';
  includeMetadata: boolean;
  compressionLevel: number;
  retentionCount: number;
  contentTypes: string[];
}

export const BackupScheduleManager: React.FC<BackupScheduleManagerProps> = ({
  storageAdapter,
  className = ''
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{ type: 'success' | 'error'; message: string; id: string }>>([]);

  const {
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
    getScheduleHealth
  } = useBackupScheduler({
    storageAdapter,
    autoStart: true,
    onScheduledBackup: (schedule, success, error) => {
      addNotification(
        success ? 'success' : 'error',
        success 
          ? `Scheduled backup "${schedule.name}" completed successfully`
          : `Scheduled backup "${schedule.name}" failed: ${error}`
      );
    },
    onError: (error) => {
      addNotification('error', `Scheduler error: ${error}`);
    }
  });

  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    interval: 'daily',
    format: 'compressed',
    includeMetadata: true,
    compressionLevel: 3,
    retentionCount: 10,
    contentTypes: []
  });

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { type, message, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleCreateSchedule = async () => {
    if (!formData.name.trim()) {
      addNotification('error', 'Schedule name is required');
      return;
    }

    try {
      const options = {
        format: formData.format,
        includeMetadata: formData.includeMetadata,
        compressionLevel: formData.compressionLevel,
        retentionCount: formData.retentionCount,
        contentTypes: formData.contentTypes.length > 0 ? formData.contentTypes : undefined
      };

      createSchedule(formData.name, formData.interval, options);
      setShowCreateForm(false);
      setFormData({
        name: '',
        interval: 'daily',
        format: 'compressed',
        includeMetadata: true,
        compressionLevel: 3,
        retentionCount: 10,
        contentTypes: []
      });
      addNotification('success', `Schedule "${formData.name}" created successfully`);
    } catch (error) {
      addNotification('error', `Failed to create schedule: ${error}`);
    }
  };

  const handleDeleteSchedule = (scheduleId: string, scheduleName: string) => {
    if (window.confirm(`Are you sure you want to delete the schedule "${scheduleName}"?`)) {
      if (deleteSchedule(scheduleId)) {
        addNotification('success', `Schedule "${scheduleName}" deleted`);
      } else {
        addNotification('error', 'Failed to delete schedule');
      }
    }
  };

  const handleRunNow = async (scheduleId: string, scheduleName: string) => {
    try {
      const success = await runScheduleNow(scheduleId);
      addNotification(
        success ? 'success' : 'error',
        success 
          ? `Manual backup "${scheduleName}" completed` 
          : `Manual backup "${scheduleName}" failed`
      );
    } catch (error) {
      addNotification('error', `Failed to run backup: ${error}`);
    }
  };

  const getIntervalDisplay = (interval: ScheduleInterval): string => {
    const displays = {
      hourly: 'Every Hour',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    };
    return displays[interval];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Backup Scheduling</h2>
          <p className="text-sm text-gray-600">Automate your backup processes</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isRunning ? 'Scheduler Active' : 'Scheduler Stopped'}
            </span>
          </div>
          <Button
            onClick={isRunning ? stopScheduler : startScheduler}
            variant={isRunning ? 'outline' : 'primary'}
            size="sm"
          >
            {isRunning ? 'Stop' : 'Start'} Scheduler
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-md text-sm ${
                notification.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Next Backup Info */}
      {nextScheduledBackup && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-blue-900">Next Scheduled Backup</h3>
              <p className="text-sm text-blue-700">
                "{nextScheduledBackup.schedule.name}" - {nextScheduledBackup.nextRun.toLocaleString()}
              </p>
            </div>
            <div className="text-sm text-blue-600">
              {Math.round((nextScheduledBackup.nextRun.getTime() - Date.now()) / (1000 * 60))} minutes
            </div>
          </div>
        </Card>
      )}

      {/* Create Schedule Button */}
      {!showCreateForm && (
        <Button
          onClick={() => setShowCreateForm(true)}
          variant="primary"
          className="w-full md:w-auto"
        >
          📅 Create New Schedule
        </Button>
      )}

      {/* Create Schedule Form */}
      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Backup Schedule</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Daily Content Backup"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.interval}
                  onChange={(e) => setFormData(prev => ({ ...prev, interval: e.target.value as ScheduleInterval }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="hourly">Every Hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as 'json' | 'compressed' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="json">JSON (Readable)</option>
                  <option value="compressed">Compressed (Smaller)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keep Backups
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.retentionCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, retentionCount: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {formData.format === 'compressed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compression Level (1=Fast, 5=Best)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.compressionLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, compressionLevel: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600">Level {formData.compressionLevel}</div>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.includeMetadata}
                  onChange={(e) => setFormData(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Include metadata and dependencies</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button onClick={handleCreateSchedule} variant="primary">
              Create Schedule
            </Button>
            <Button 
              onClick={() => setShowCreateForm(false)} 
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Schedules List */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <h3 className="text-lg font-medium mb-2">No Schedules Yet</h3>
              <p className="text-sm">Create your first automated backup schedule to get started.</p>
            </div>
          </Card>
        ) : (
          schedules.map((schedule) => {
            const health = getScheduleHealth(schedule);
            
            return (
              <Card key={schedule.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{schedule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
                        {health.status}
                      </span>
                      {!schedule.enabled && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Disabled
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{getIntervalDisplay(schedule.interval)} • {schedule.options.format} format</div>
                      <div>Next run: {schedule.nextRun.toLocaleString()}</div>
                      {schedule.lastRun && (
                        <div>Last run: {schedule.lastRun.toLocaleString()}</div>
                      )}
                      <div>
                        Success rate: {schedule.stats.totalRuns > 0 ? 
                          `${Math.round((schedule.stats.successfulRuns / schedule.stats.totalRuns) * 100)}%` : 
                          'No runs yet'
                        } ({schedule.stats.totalRuns} total runs)
                      </div>
                      {health.message && (
                        <div className={health.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}>
                          {health.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => toggleSchedule(schedule.id)}
                      variant="outline"
                      size="sm"
                    >
                      {schedule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      onClick={() => handleRunNow(schedule.id, schedule.name)}
                      variant="outline"
                      size="sm"
                      disabled={!isRunning}
                    >
                      Run Now
                    </Button>
                    <Button
                      onClick={() => handleDeleteSchedule(schedule.id, schedule.name)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BackupScheduleManager;