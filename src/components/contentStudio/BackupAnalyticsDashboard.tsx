// Backup Analytics Dashboard
// Comprehensive analytics and reporting for backup system performance

import React, { useState, useMemo } from 'react';
import { Card, Button } from '../ui';
import { useBackupMonitoring } from '../../hooks/useBackupMonitoring';
import { useBackupScheduler } from '../../hooks/useBackupScheduler';
import { StorageAdapter } from '../../services/storage/StorageAdapter';

interface BackupAnalyticsDashboardProps {
  storageAdapter?: StorageAdapter;
  className?: string;
}

interface TimeRange {
  label: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: '24 Hours', days: 1 },
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 }
];

export const BackupAnalyticsDashboard: React.FC<BackupAnalyticsDashboardProps> = ({
  storageAdapter,
  className = ''
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>(TIME_RANGES[1]); // 7 days default
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false);

  const { metrics, recentEvents, getEventsByType } = useBackupMonitoring(storageAdapter, {
    autoStart: true
  });

  const { schedules } = useBackupScheduler({
    storageAdapter,
    autoStart: true
  });

  // Calculate analytics for the selected time range
  const analytics = useMemo(() => {
    if (!metrics) return null;

    const hoursInRange = selectedTimeRange.days * 24;
    const exportEvents = getEventsByType('export', hoursInRange);
    const importEvents = getEventsByType('import', hoursInRange);
    const errorEvents = getEventsByType('error', hoursInRange);

    const successfulExports = exportEvents.filter(e => e.success);
    const successfulImports = importEvents.filter(e => e.success);
    const totalOperations = exportEvents.length + importEvents.length;
    const successfulOperations = successfulExports.length + successfulImports.length;

    // Performance metrics
    const exportTimes = successfulExports
      .filter(e => e.duration)
      .map(e => e.duration!);
    
    const importTimes = successfulImports
      .filter(e => e.duration)
      .map(e => e.duration!);

    const exportSizes = successfulExports
      .filter(e => e.size)
      .map(e => e.size!);

    // Trends (compare first half vs second half of period)
    const midpoint = Date.now() - (hoursInRange * 60 * 60 * 1000) / 2;
    const recentEvents = exportEvents.filter(e => e.timestamp.getTime() > midpoint);
    const olderEvents = exportEvents.filter(e => e.timestamp.getTime() <= midpoint);

    const recentAvgTime = recentEvents.length > 0 ? 
      recentEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / recentEvents.length : 0;
    const olderAvgTime = olderEvents.length > 0 ?
      olderEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / olderEvents.length : 0;

    const performanceTrend = recentAvgTime === 0 || olderAvgTime === 0 ? 'stable' :
      recentAvgTime < olderAvgTime * 0.9 ? 'improving' :
      recentAvgTime > olderAvgTime * 1.1 ? 'degrading' : 'stable';

    return {
      timeRange: selectedTimeRange,
      summary: {
        totalOperations,
        successfulOperations,
        failedOperations: totalOperations - successfulOperations,
        successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
        totalExports: exportEvents.length,
        totalImports: importEvents.length,
        totalErrors: errorEvents.length
      },
      performance: {
        avgExportTime: exportTimes.length > 0 ? exportTimes.reduce((a, b) => a + b, 0) / exportTimes.length : 0,
        avgImportTime: importTimes.length > 0 ? importTimes.reduce((a, b) => a + b, 0) / importTimes.length : 0,
        avgExportSize: exportSizes.length > 0 ? exportSizes.reduce((a, b) => a + b, 0) / exportSizes.length : 0,
        fastestExport: exportTimes.length > 0 ? Math.min(...exportTimes) : 0,
        slowestExport: exportTimes.length > 0 ? Math.max(...exportTimes) : 0,
        largestExport: exportSizes.length > 0 ? Math.max(...exportSizes) : 0,
        smallestExport: exportSizes.length > 0 ? Math.min(...exportSizes) : 0,
        performanceTrend
      },
      frequency: {
        exportsPerDay: (exportEvents.length / selectedTimeRange.days),
        importsPerDay: (importEvents.length / selectedTimeRange.days),
        errorsPerDay: (errorEvents.length / selectedTimeRange.days),
        peakHour: this.calculatePeakHour(exportEvents)
      },
      scheduling: {
        totalSchedules: schedules.length,
        activeSchedules: schedules.filter(s => s.enabled).length,
        healthySchedules: schedules.filter(s => {
          const successRate = s.stats.totalRuns > 0 ? s.stats.successfulRuns / s.stats.totalRuns : 1;
          return successRate >= 0.8;
        }).length
      }
    };
  }, [metrics, selectedTimeRange, getEventsByType, schedules]);

  const calculatePeakHour = (events: any[]): number => {
    const hourCounts = new Array(24).fill(0);
    events.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour]++;
    });
    return hourCounts.indexOf(Math.max(...hourCounts));
  };

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

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'improving': return '📈';
      case 'degrading': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'degrading': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!analytics) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-lg font-medium mb-2">Loading Analytics</h3>
          <p className="text-sm">Gathering backup performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Backup Analytics</h2>
          <p className="text-sm text-gray-600">Performance insights and trends</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Period:</span>
          <select
            value={selectedTimeRange.label}
            onChange={(e) => {
              const range = TIME_RANGES.find(r => r.label === e.target.value);
              if (range) setSelectedTimeRange(range);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {TIME_RANGES.map(range => (
              <option key={range.label} value={range.label}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Total Operations</h3>
              <div className="text-2xl font-bold text-gray-900">{analytics.summary.totalOperations}</div>
              <div className="text-xs text-gray-500">
                {analytics.summary.totalExports} exports, {analytics.summary.totalImports} imports
              </div>
            </div>
            <div className="text-2xl">💾</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Success Rate</h3>
              <div className="text-2xl font-bold text-gray-900">
                {analytics.summary.successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {analytics.summary.failedOperations} failures
              </div>
            </div>
            <div className="text-2xl">{analytics.summary.successRate >= 95 ? '✅' : analytics.summary.successRate >= 80 ? '⚠️' : '❌'}</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Avg Export Time</h3>
              <div className="text-2xl font-bold text-gray-900">
                {formatDuration(analytics.performance.avgExportTime)}
              </div>
              <div className={`text-xs flex items-center space-x-1 ${getTrendColor(analytics.performance.performanceTrend)}`}>
                <span>{getTrendIcon(analytics.performance.performanceTrend)}</span>
                <span>{analytics.performance.performanceTrend}</span>
              </div>
            </div>
            <div className="text-2xl">⏱️</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Avg Export Size</h3>
              <div className="text-2xl font-bold text-gray-900">
                {formatBytes(analytics.performance.avgExportSize)}
              </div>
              <div className="text-xs text-gray-500">
                {analytics.frequency.exportsPerDay.toFixed(1)}/day
              </div>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </Card>
      </div>

      {/* Performance Details */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance Analysis</h3>
          <Button
            onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
            variant="outline"
            size="sm"
          >
            {showDetailedMetrics ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Timing Stats */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Timing Statistics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Fastest Export:</span>
                <span className="font-medium">{formatDuration(analytics.performance.fastestExport)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Slowest Export:</span>
                <span className="font-medium">{formatDuration(analytics.performance.slowestExport)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Import Time:</span>
                <span className="font-medium">{formatDuration(analytics.performance.avgImportTime)}</span>
              </div>
            </div>
          </div>

          {/* Size Stats */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Size Statistics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Largest Export:</span>
                <span className="font-medium">{formatBytes(analytics.performance.largestExport)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Smallest Export:</span>
                <span className="font-medium">{formatBytes(analytics.performance.smallestExport)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Storage Efficiency:</span>
                <span className="font-medium">{((metrics?.performance.compressionRatio || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Frequency Stats */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Activity Patterns</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Peak Hour:</span>
                <span className="font-medium">{analytics.frequency.peakHour}:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Errors/Day:</span>
                <span className="font-medium">{analytics.frequency.errorsPerDay.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Import Rate:</span>
                <span className="font-medium">{analytics.frequency.importsPerDay.toFixed(1)}/day</span>
              </div>
            </div>
          </div>
        </div>

        {showDetailedMetrics && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">Detailed Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">Storage Metrics</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Current Usage:</span>
                    <span>{formatBytes(metrics?.storage.used || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage Trend:</span>
                    <span className="capitalize">{metrics?.storage.trend}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Space:</span>
                    <span>{formatBytes(metrics?.storage.available || 0)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-600 mb-2">System Health</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Health Status:</span>
                    <span className="capitalize">{metrics?.health.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Issues:</span>
                    <span>{metrics?.health.issues.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Backup:</span>
                    <span>{metrics?.backups.lastBackupTime?.toLocaleTimeString() || 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Scheduling Analytics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduling Performance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analytics.scheduling.totalSchedules}</div>
            <div className="text-sm text-gray-600">Total Schedules</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{analytics.scheduling.activeSchedules}</div>
            <div className="text-sm text-gray-600">Active Schedules</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{analytics.scheduling.healthySchedules}</div>
            <div className="text-sm text-gray-600">Healthy Schedules</div>
          </div>
        </div>

        {analytics.scheduling.totalSchedules > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">
              Health Rate: {((analytics.scheduling.healthySchedules / analytics.scheduling.totalSchedules) * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        
        {recentEvents.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentEvents.slice(0, 10).map((event, index) => (
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
                    {event.size && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatBytes(event.size)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {event.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm">No recent activity to display</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BackupAnalyticsDashboard;