// Real-time Backup Monitoring Dashboard
// Displays storage usage, backup health, and system metrics

import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { useBackupMonitoring } from '../../hooks/useBackupMonitoring';
import { StorageAdapter } from '../../services/storage/StorageAdapter';

interface BackupMonitoringDashboardProps {
  storageAdapter?: StorageAdapter;
  className?: string;
}

export const BackupMonitoringDashboard: React.FC<BackupMonitoringDashboardProps> = ({
  storageAdapter,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ type: 'warning' | 'critical'; message: string; timestamp: Date }>>([]);

  const {
    isMonitoring,
    metrics,
    recentEvents,
    startMonitoring,
    stopMonitoring,
    getEventsByType,
    isHealthy
  } = useBackupMonitoring(storageAdapter, {
    autoStart: true,
    onAlert: (alert) => {
      setAlerts(prev => [...prev, { ...alert, timestamp: new Date() }].slice(-10));
    }
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getHealthStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStorageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Backup Monitoring</h2>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
            </span>
          </div>
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? 'outline' : 'primary'}
            size="sm"
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
        </div>
      </div>

      {/* Health Status */}
      {metrics && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">System Health</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(metrics.health.status)}`}>
              {metrics.health.status.charAt(0).toUpperCase() + metrics.health.status.slice(1)}
            </span>
          </div>

          {metrics.health.issues.length > 0 && (
            <div className="space-y-2 mb-3">
              <h4 className="text-sm font-medium text-red-600">Issues:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                {metrics.health.issues.map((issue, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {metrics.health.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-600">Recommendations:</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                {metrics.health.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span>💡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Storage Usage */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Storage Usage</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                metrics.storage.trend === 'increasing' ? 'bg-red-100 text-red-600' :
                metrics.storage.trend === 'decreasing' ? 'bg-green-100 text-green-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {metrics.storage.trend}
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-900">
                {formatBytes(metrics.storage.used)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStorageColor(metrics.storage.usagePercentage)}`}
                  style={{ width: `${Math.min(metrics.storage.usagePercentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">
                {metrics.storage.usagePercentage.toFixed(1)}% of {formatBytes(metrics.storage.available)}
              </div>
            </div>
          </Card>

          {/* Backup Stats */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Backup Statistics</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total backups:</span>
                <span className="font-medium">{metrics.backups.totalCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success rate:</span>
                <span className={`font-medium ${metrics.backups.successRate >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {metrics.backups.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frequency:</span>
                <span className="font-medium">{metrics.backups.frequency.toFixed(1)}/day</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg size:</span>
                <span className="font-medium">{formatBytes(metrics.backups.averageSize)}</span>
              </div>
            </div>
          </Card>

          {/* Performance */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Performance</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Export time:</span>
                <span className="font-medium">{formatDuration(metrics.performance.averageExportTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Import time:</span>
                <span className="font-medium">{formatDuration(metrics.performance.averageImportTime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Compression:</span>
                <span className="font-medium">{(metrics.performance.compressionRatio * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Error rate:</span>
                <span className={`font-medium ${metrics.performance.errorRate <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.performance.errorRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Last Backup */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Last Backup</h3>
            <div className="space-y-2">
              {metrics.backups.lastBackupTime ? (
                <>
                  <div className="text-lg font-semibold text-gray-900">
                    {metrics.backups.lastBackupTime.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {metrics.backups.lastBackupTime.toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round((Date.now() - metrics.backups.lastBackupTime.getTime()) / (1000 * 60 * 60))} hours ago
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">No backups recorded</div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Recent Alerts</h3>
            <Button onClick={() => setAlerts([])} variant="outline" size="sm">
              Clear All
            </Button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  alert.type === 'critical' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="flex-1">{alert.message}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detailed Events */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size="sm"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        {showDetails && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentEvents.length > 0 ? (
              recentEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${event.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <div>
                      <span className="text-sm font-medium capitalize">{event.type}</span>
                      {event.duration && (
                        <span className="text-xs text-gray-500 ml-2">
                          ({formatDuration(event.duration)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default BackupMonitoringDashboard;