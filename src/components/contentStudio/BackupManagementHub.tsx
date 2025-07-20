// Backup Management Hub
// Unified interface for all backup-related functionality

import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { StorageAdapter } from '../../services/storage/StorageAdapter';
import { EnhancedBackupPanel } from './EnhancedBackupPanel';
import { BackupMonitoringDashboard } from './BackupMonitoringDashboard';
import { BackupScheduleManager } from './BackupScheduleManager';
import { BackupAnalyticsDashboard } from './BackupAnalyticsDashboard';
import { useBackupStatus } from '../../hooks/useBackupMonitoring';

interface BackupManagementHubProps {
  storageAdapter?: StorageAdapter;
  className?: string;
}

type TabId = 'backup' | 'monitoring' | 'scheduling' | 'analytics';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'backup',
    label: 'Backup & Export',
    icon: '💾',
    description: 'Create and manage backups'
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: '📊',
    description: 'Real-time system health'
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    icon: '⏰',
    description: 'Automated backup schedules'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    description: 'Performance insights'
  }
];

export const BackupManagementHub: React.FC<BackupManagementHubProps> = ({
  storageAdapter,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('backup');
  
  // Get basic status for the header
  const {
    storageUsed,
    storageUsagePercentage,
    lastBackupTime,
    isHealthy,
    status
  } = useBackupStatus(storageAdapter);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'backup':
        return <EnhancedBackupPanel storageAdapter={storageAdapter} />;
      case 'monitoring':
        return <BackupMonitoringDashboard storageAdapter={storageAdapter} />;
      case 'scheduling':
        return <BackupScheduleManager storageAdapter={storageAdapter} />;
      case 'analytics':
        return <BackupAnalyticsDashboard storageAdapter={storageAdapter} />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with System Status */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Backup Management</h1>
        <p className="text-gray-600 mb-4">
          Comprehensive backup, monitoring, and analytics platform
        </p>

        {/* Quick Status Bar */}
        <Card className="p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">System Health:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {isHealthy ? '✅ Healthy' : `⚠️ ${status}`}
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Storage Used:</span>
              <span className="font-medium text-sm">
                {formatBytes(storageUsed)} ({storageUsagePercentage.toFixed(1)}%)
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Last Backup:</span>
              <span className="font-medium text-sm">
                {lastBackupTime ? lastBackupTime.toLocaleDateString() : 'Never'}
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Active Monitoring</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Card className="p-1">
        <div className="flex space-x-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-4 py-3 text-center rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <div className="hidden sm:block">
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <div className="min-h-screen">
        {renderTabContent()}
      </div>

      {/* Quick Actions Footer */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          <div>
            <h3 className="font-medium text-blue-900">Quick Actions</h3>
            <p className="text-sm text-blue-700">Common backup operations</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setActiveTab('backup')}
              variant={activeTab === 'backup' ? 'primary' : 'outline'}
              size="sm"
            >
              🚀 Quick Backup
            </Button>
            
            <Button
              onClick={() => setActiveTab('monitoring')}
              variant={activeTab === 'monitoring' ? 'primary' : 'outline'}
              size="sm"
            >
              📊 View Status
            </Button>
            
            <Button
              onClick={() => setActiveTab('scheduling')}
              variant={activeTab === 'scheduling' ? 'primary' : 'outline'}
              size="sm"
            >
              ⏰ Schedule Backup
            </Button>
            
            <Button
              onClick={() => setActiveTab('analytics')}
              variant={activeTab === 'analytics' ? 'primary' : 'outline'}
              size="sm"
            >
              📈 View Analytics
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BackupManagementHub;