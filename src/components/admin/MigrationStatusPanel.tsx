// /Users/montysharma/v11m2/src/components/admin/MigrationStatusPanel.tsx
// Admin panel for monitoring and controlling store migrations to V2 architecture
// Provides visual feedback and manual migration controls

import React, { useState, useEffect } from 'react';
import { useMigrationStatus } from '../../utils/storeMigrationHelper';
import { usePersistenceActions } from '../../stores/middleware/unifiedPersistenceMiddleware';

interface MigrationProgress {
  phase: string;
  percentage: number;
  message: string;
}

const MigrationStatusPanel: React.FC = () => {
  const {
    status,
    migrateAll,
    migrateSingle,
    isComplete,
    completedCount,
    totalCount
  } = useMigrationStatus();
  
  const { getStats, listBackups } = usePersistenceActions('migration-panel');
  
  const [isLoading, setIsLoading] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  
  useEffect(() => {
    loadStats();
    loadBackups();
  }, []);
  
  const loadStats = async () => {
    try {
      const statsData = await getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };
  
  const loadBackups = async () => {
    try {
      const backupData = await listBackups();
      setBackups(backupData);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };
  
  const handleMigrateAll = async () => {
    setIsLoading(true);
    setMigrationLogs([]);
    
    try {
      setMigrationProgress({
        phase: 'Starting migration',
        percentage: 0,
        message: 'Preparing to migrate all stores...'
      });
      
      const results = await migrateAll();
      
      const logs = results.map(result => 
        `${result.success ? '✅' : '❌'} ${result.storeName}: ${
          result.success 
            ? `Migrated ${result.itemsMigrated} items in ${result.duration}ms`
            : `Failed - ${result.error}`
        }`
      );
      
      setMigrationLogs(logs);
      
      setMigrationProgress({
        phase: 'Complete',
        percentage: 100,
        message: `Migration completed: ${results.filter(r => r.success).length}/${results.length} successful`
      });
      
      // Refresh data
      await loadStats();
      await loadBackups();
      
    } catch (error) {
      setMigrationLogs([`❌ Migration failed: ${error}`]);
      setMigrationProgress({
        phase: 'Failed',
        percentage: 0,
        message: 'Migration encountered an error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMigrateSingle = async (storeName: string) => {
    setIsLoading(true);
    
    try {
      const result = await migrateSingle(storeName);
      
      const message = result.success 
        ? `✅ ${storeName} migrated successfully`
        : `❌ ${storeName} migration failed: ${result.error}`;
      
      setMigrationLogs(prev => [...prev, message]);
      
      // Refresh data
      await loadStats();
      await loadBackups();
      
    } catch (error) {
      setMigrationLogs(prev => [...prev, `❌ ${storeName} migration error: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusIcon = (migrated: boolean) => {
    return migrated ? '✅' : '⏳';
  };
  
  const getStatusColor = (migrated: boolean) => {
    return migrated 
      ? 'text-green-600 bg-green-50 border-green-200' 
      : 'text-orange-600 bg-orange-50 border-orange-200';
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Migration Status Panel
        </h2>
        <div className="text-sm text-gray-500">
          Phase 2: Store Integration & Error Handling
        </div>
      </div>
      
      {/* Overall Progress */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Overall Progress</h3>
          <span className="text-sm font-medium text-gray-700">
            {completedCount}/{totalCount} Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
        
        {isComplete && (
          <div className="text-sm text-green-600 font-medium">
            🎉 All stores have been migrated to V2!
          </div>
        )}
      </div>
      
      {/* Store Status Grid */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Store Migration Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(status).map(([storeName, migrated]) => (
            <div
              key={storeName}
              className={`border rounded-lg p-3 ${getStatusColor(migrated)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStatusIcon(migrated)}</span>
                  <span className="font-medium capitalize">
                    {storeName.replace('-', ' ')}
                  </span>
                </div>
                
                {!migrated && (
                  <button
                    onClick={() => handleMigrateSingle(storeName)}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Migrate
                  </button>
                )}
              </div>
              
              <div className="text-xs mt-1">
                {migrated ? 'V2 Architecture' : 'Legacy Store'}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Migration Controls */}
      {!isComplete && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Migration Controls</h3>
            <button
              onClick={handleMigrateAll}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Migrating...' : 'Migrate All Stores'}
            </button>
          </div>
          
          {migrationProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">{migrationProgress.phase}</span>
                <span className="text-sm text-blue-700">{migrationProgress.percentage}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${migrationProgress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-blue-800">{migrationProgress.message}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Migration Logs */}
      {migrationLogs.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Migration Logs</h3>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-48 overflow-y-auto">
            <div className="space-y-1 font-mono text-sm">
              {migrationLogs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
        {/* Persistence Statistics */}
        {stats && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Persistence Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Backups:</span>
                <span className="font-medium">{stats.totalBackups}</span>
              </div>
              <div className="flex justify-between">
                <span>Auto Backups:</span>
                <span className="font-medium">{stats.autoBackups}</span>
              </div>
              <div className="flex justify-between">
                <span>Manual Backups:</span>
                <span className="font-medium">{stats.manualBackups}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Size:</span>
                <span className="font-medium">
                  {(stats.totalSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Backup:</span>
                <span className="font-medium">
                  {stats.newestBackup ? new Date(stats.newestBackup.timestamp).toLocaleDateString() : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Recent Backups */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Recent Backups</h3>
          <div className="space-y-2">
            {backups.slice(0, 5).map((backup) => (
              <div key={backup.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{backup.label}</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(backup.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="ml-2 flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    backup.type === 'manual' 
                      ? 'bg-blue-100 text-blue-800'
                      : backup.type === 'auto'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {backup.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(backup.size / 1024).toFixed(1)}KB
                  </span>
                </div>
              </div>
            ))}
            
            {backups.length === 0 && (
              <div className="text-sm text-gray-500 italic">
                No backups available
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Architecture Info */}
      <div className="border-t pt-6">
        <h3 className="font-medium text-gray-900 mb-3">V2 Architecture Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="font-medium text-green-900">✅ Error Handling</div>
            <div className="text-green-700">Automatic retry & recovery</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="font-medium text-blue-900">💾 Auto Backups</div>
            <div className="text-blue-700">Pre-action safety nets</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="font-medium text-purple-900">📦 Chunking</div>
            <div className="text-purple-700">Large data support</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="font-medium text-orange-900">🔄 Migration</div>
            <div className="text-orange-700">Safe format upgrades</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationStatusPanel;