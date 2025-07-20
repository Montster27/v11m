// Enhanced Backup Panel - Phase 5 with advanced features
// Compression, progress tracking, scheduling, analytics, and real-time monitoring

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button } from '../ui';
import { useContentExport } from './shared/useContentExport';
import { ProgressTracker, createExportProgressStages, createImportProgressStages, ProgressUpdate } from '../../services/ProgressTracker';
import { CompressionService } from '../../services/compression/CompressionService';
import type { ExportOptions, ImportOptions } from '../../services/ContentExportService';

interface EnhancedBackupState {
  // Core state
  isExporting: boolean;
  isImporting: boolean;
  
  // Progress tracking
  exportProgress?: ProgressUpdate;
  importProgress?: ProgressUpdate;
  
  // Real-time monitoring
  realTimeStats: {
    storageUsed: number;
    lastBackup?: Date;
    autoBackupEnabled: boolean;
    backupCount: number;
    averageBackupSize: number;
  };
  
  // Analytics
  analytics: {
    exportHistory: Array<{
      timestamp: Date;
      size: number;
      compressionRatio: number;
      duration: number;
      format: string;
    }>;
    performanceMetrics: {
      compressionStats: any[];
      throughputHistory: Array<{ timestamp: Date; bytesPerSecond: number }>;
    };
  };
  
  // Scheduling
  schedule: {
    enabled: boolean;
    interval: 'hourly' | 'daily' | 'weekly';
    lastScheduledBackup?: Date;
    nextScheduledBackup?: Date;
  };
}

interface ExportOptionsState extends ExportOptions {
  compressionAlgorithm: 'lz-string' | 'gzip-like' | 'json-pack';
  enableAnalytics: boolean;
  enableRealTimeMonitoring: boolean;
}

export const EnhancedBackupPanel: React.FC = () => {
  const {
    // State from useContentExport
    isExporting: baseIsExporting,
    isImporting: baseIsImporting,
    error,
    lastExportDate,
    lastImportDate,
    
    // Functions
    exportContent,
    importContent,
    exportAllContent,
    exportCompressed,
    resetState,
    getStorageInfo
  } = useContentExport();

  // Enhanced state
  const [enhancedState, setEnhancedState] = useState<EnhancedBackupState>({
    isExporting: false,
    isImporting: false,
    realTimeStats: {
      storageUsed: 0,
      autoBackupEnabled: false,
      backupCount: 0,
      averageBackupSize: 0
    },
    analytics: {
      exportHistory: [],
      performanceMetrics: {
        compressionStats: [],
        throughputHistory: []
      }
    },
    schedule: {
      enabled: false,
      interval: 'daily'
    }
  });

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Enhanced export options
  const [exportOptions, setExportOptions] = useState<ExportOptionsState>({
    format: 'compressed',
    includeMetadata: true,
    validateDependencies: true,
    includePreferences: true,
    compressionLevel: 3,
    compressionAlgorithm: 'lz-string',
    enableAnalytics: true,
    enableRealTimeMonitoring: true
  });

  // Services
  const [compressionService] = useState(() => new CompressionService());
  const exportProgressTracker = useRef<ProgressTracker | null>(null);
  const importProgressTracker = useRef<ProgressTracker | null>(null);
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize real-time monitoring
  useEffect(() => {
    if (exportOptions.enableRealTimeMonitoring) {
      startRealTimeMonitoring();
    } else {
      stopRealTimeMonitoring();
    }

    return () => stopRealTimeMonitoring();
  }, [exportOptions.enableRealTimeMonitoring]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const storageInfo = await getStorageInfo();
      if (storageInfo) {
        setEnhancedState(prev => ({
          ...prev,
          realTimeStats: {
            ...prev.realTimeStats,
            storageUsed: storageInfo.usage
          }
        }));
      }

      // Load analytics from localStorage
      const savedAnalytics = localStorage.getItem('backup_analytics');
      if (savedAnalytics) {
        const analytics = JSON.parse(savedAnalytics);
        setEnhancedState(prev => ({
          ...prev,
          analytics: {
            ...prev.analytics,
            ...analytics
          }
        }));
      }

      // Load schedule settings
      const savedSchedule = localStorage.getItem('backup_schedule');
      if (savedSchedule) {
        const schedule = JSON.parse(savedSchedule);
        setEnhancedState(prev => ({
          ...prev,
          schedule: {
            ...prev.schedule,
            ...schedule
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const startRealTimeMonitoring = () => {
    monitoringInterval.current = setInterval(async () => {
      try {
        const storageInfo = await getStorageInfo();
        if (storageInfo) {
          setEnhancedState(prev => ({
            ...prev,
            realTimeStats: {
              ...prev.realTimeStats,
              storageUsed: storageInfo.usage
            }
          }));
        }
      } catch (error) {
        console.warn('Real-time monitoring error:', error);
      }
    }, 5000); // Update every 5 seconds
  };

  const stopRealTimeMonitoring = () => {
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  };

  // Enhanced export with progress tracking
  const handleEnhancedExport = useCallback(async () => {
    setEnhancedState(prev => ({ ...prev, isExporting: true }));

    // Create progress tracker
    exportProgressTracker.current = new ProgressTracker(
      createExportProgressStages(),
      {
        onUpdate: (update) => {
          setEnhancedState(prev => ({
            ...prev,
            exportProgress: update
          }));
        },
        enableThroughputTracking: true,
        enableTimeEstimation: true
      }
    );

    const startTime = Date.now();

    try {
      exportProgressTracker.current.start();
      exportProgressTracker.current.startStage('init');

      // Enhanced export options with progress
      const enhancedOptions: ExportOptions = {
        ...exportOptions,
        onProgress: (progress, stage) => {
          if (exportProgressTracker.current) {
            const currentStage = exportProgressTracker.current.getProgress().currentStage;
            exportProgressTracker.current.updateStage(currentStage.id, progress);
          }
        }
      };

      exportProgressTracker.current.completeStage('init');
      exportProgressTracker.current.startStage('gather');

      const result = await exportContent(enhancedOptions);

      exportProgressTracker.current.completeStage('finalize');
      exportProgressTracker.current.complete();

      // Record analytics
      if (exportOptions.enableAnalytics && result) {
        const exportRecord = {
          timestamp: new Date(),
          size: result.metadata.totalSize,
          compressionRatio: result.compressionInfo?.compressedSize ? 
            result.compressionInfo.compressedSize / result.compressionInfo.originalSize : 1,
          duration: Date.now() - startTime,
          format: exportOptions.format
        };

        setEnhancedState(prev => {
          const newHistory = [...prev.analytics.exportHistory, exportRecord].slice(-50); // Keep last 50
          const updatedAnalytics = {
            ...prev.analytics,
            exportHistory: newHistory
          };
          
          // Save to localStorage
          localStorage.setItem('backup_analytics', JSON.stringify(updatedAnalytics));
          
          return {
            ...prev,
            analytics: updatedAnalytics,
            realTimeStats: {
              ...prev.realTimeStats,
              lastBackup: new Date(),
              backupCount: prev.realTimeStats.backupCount + 1,
              averageBackupSize: newHistory.reduce((sum, record) => sum + record.size, 0) / newHistory.length
            }
          };
        });
      }

    } catch (error) {
      if (exportProgressTracker.current) {
        const currentStage = exportProgressTracker.current.getProgress().currentStage;
        exportProgressTracker.current.failStage(currentStage.id, error instanceof Error ? error.message : 'Unknown error');
      }
      console.error('Enhanced export failed:', error);
    } finally {
      setEnhancedState(prev => ({ ...prev, isExporting: false, exportProgress: undefined }));
    }
  }, [exportOptions, exportContent]);

  // Compression analysis
  const analyzeCompression = useCallback(async () => {
    try {
      const sampleData = JSON.stringify({
        storylets: Array(10).fill(null).map((_, i) => ({ id: `test_${i}`, title: 'Sample', content: 'x'.repeat(100) })),
        npcs: Array(5).fill(null).map((_, i) => ({ id: `npc_${i}`, name: 'Sample NPC' }))
      });

      const stats = await compressionService.getCompressionStats(sampleData);
      
      setEnhancedState(prev => ({
        ...prev,
        analytics: {
          ...prev.analytics,
          performanceMetrics: {
            ...prev.analytics.performanceMetrics,
            compressionStats: stats
          }
        }
      }));

      console.log('Compression analysis:', stats);
    } catch (error) {
      console.error('Compression analysis failed:', error);
    }
  }, [compressionService]);

  // Scheduling functions
  const toggleScheduledBackups = useCallback(() => {
    setEnhancedState(prev => {
      const newSchedule = {
        ...prev.schedule,
        enabled: !prev.schedule.enabled
      };
      
      localStorage.setItem('backup_schedule', JSON.stringify(newSchedule));
      
      return {
        ...prev,
        schedule: newSchedule
      };
    });
  }, []);

  const updateScheduleInterval = useCallback((interval: 'hourly' | 'daily' | 'weekly') => {
    setEnhancedState(prev => {
      const newSchedule = {
        ...prev.schedule,
        interval
      };
      
      localStorage.setItem('backup_schedule', JSON.stringify(newSchedule));
      
      return {
        ...prev,
        schedule: newSchedule
      };
    });
  }, []);

  // File drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => 
      file.type === 'application/json' || file.name.endsWith('.json')
    );
    
    if (jsonFile) {
      handleImportFile(jsonFile);
    }
  }, []);

  const handleImportFile = useCallback(async (file: File) => {
    setEnhancedState(prev => ({ ...prev, isImporting: true }));

    // Create import progress tracker
    importProgressTracker.current = new ProgressTracker(
      createImportProgressStages(),
      {
        onUpdate: (update) => {
          setEnhancedState(prev => ({
            ...prev,
            importProgress: update
          }));
        }
      }
    );

    try {
      importProgressTracker.current.start();
      importProgressTracker.current.startStage('init');

      await importContent(file);

      importProgressTracker.current.complete();
    } catch (error) {
      if (importProgressTracker.current) {
        const currentStage = importProgressTracker.current.getProgress().currentStage;
        importProgressTracker.current.failStage(currentStage.id, error instanceof Error ? error.message : 'Unknown error');
      }
      console.error('Import failed:', error);
    } finally {
      setEnhancedState(prev => ({ ...prev, isImporting: false, importProgress: undefined }));
    }
  }, [importContent]);

  return (
    <div className="p-6 space-y-8">
      {/* Header with Real-time Stats */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enhanced Backup & Export</h2>
        <p className="text-gray-600 mb-4">
          Advanced backup system with compression, progress tracking, and analytics
        </p>
        
        {/* Real-time Stats Bar */}
        {exportOptions.enableRealTimeMonitoring && (
          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Storage: {Math.round(enhancedState.realTimeStats.storageUsed / 1024)}KB</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Backups: {enhancedState.realTimeStats.backupCount}</span>
            </div>
            {enhancedState.realTimeStats.lastBackup && (
              <div className="flex items-center space-x-2">
                <span>Last: {enhancedState.realTimeStats.lastBackup.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Export Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Export</h3>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button
            onClick={handleEnhancedExport}
            disabled={enhancedState.isExporting}
            variant="primary"
            className="text-sm"
          >
            🚀 Enhanced Export
          </Button>
          <Button
            onClick={exportAllContent}
            disabled={enhancedState.isExporting}
            variant="outline"
            className="text-sm"
          >
            📦 Standard Export
          </Button>
          <Button
            onClick={exportCompressed}
            disabled={enhancedState.isExporting}
            variant="outline"
            className="text-sm"
          >
            🗜️ Super Compressed
          </Button>
          <Button
            onClick={analyzeCompression}
            disabled={enhancedState.isExporting}
            variant="outline"
            className="text-sm"
          >
            📊 Analyze Compression
          </Button>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 text-sm hover:text-blue-800"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compression Algorithm
                  </label>
                  <select
                    value={exportOptions.compressionAlgorithm}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      compressionAlgorithm: e.target.value as any
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="lz-string">LZ-String (Fastest)</option>
                    <option value="gzip-like">GZIP-like (Balanced)</option>
                    <option value="json-pack">JSON Pack (Best)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compression Level
                  </label>
                  <select
                    value={exportOptions.compressionLevel}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      compressionLevel: parseInt(e.target.value) as any
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value={1}>1 - Fastest</option>
                    <option value={2}>2 - Fast</option>
                    <option value={3}>3 - Balanced</option>
                    <option value={4}>4 - Better</option>
                    <option value={5}>5 - Best</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.enableAnalytics}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      enableAnalytics: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable analytics tracking</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.enableRealTimeMonitoring}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      enableRealTimeMonitoring: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Enable real-time monitoring</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Progress Display */}
        {(enhancedState.isExporting && enhancedState.exportProgress) && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>{enhancedState.exportProgress.currentStage.name}</span>
              <span>{Math.round(enhancedState.exportProgress.overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${enhancedState.exportProgress.overallProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 grid grid-cols-3 gap-4">
              <span>Stage: {enhancedState.exportProgress.completedStages + 1}/{enhancedState.exportProgress.totalStages}</span>
              <span>Elapsed: {Math.round(enhancedState.exportProgress.elapsedTime / 1000)}s</span>
              {enhancedState.exportProgress.estimatedTimeRemaining && (
                <span>ETA: {Math.round(enhancedState.exportProgress.estimatedTimeRemaining / 1000)}s</span>
              )}
            </div>
            {enhancedState.exportProgress.throughput && (
              <div className="text-xs text-gray-500">
                Throughput: {Math.round(enhancedState.exportProgress.throughput.itemsPerSecond)} items/s
                {enhancedState.exportProgress.throughput.bytesPerSecond && (
                  <span>, {Math.round(enhancedState.exportProgress.throughput.bytesPerSecond / 1024)} KB/s</span>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Import Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enhanced Import</h3>
        
        {/* Enhanced Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragOver 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="space-y-4">
            <div className="text-4xl">{dragOver ? '📥' : '📁'}</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {dragOver ? 'Drop your file here!' : 'Drop your export file here'}
              </p>
              <p className="text-sm text-gray-600">
                Supports JSON exports with automatic decompression
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
              className="hidden"
              id="enhanced-file-upload"
            />
            <label htmlFor="enhanced-file-upload">
              <Button as="span" variant="outline">
                Choose File
              </Button>
            </label>
          </div>
        </div>

        {/* Import Progress */}
        {(enhancedState.isImporting && enhancedState.importProgress) && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span>{enhancedState.importProgress.currentStage.name}</span>
              <span>{Math.round(enhancedState.importProgress.overallProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${enhancedState.importProgress.overallProgress}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Scheduling Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Backup Scheduling</h3>
          <button
            onClick={() => setShowScheduling(!showScheduling)}
            className="text-blue-600 text-sm hover:text-blue-800"
          >
            {showScheduling ? 'Hide' : 'Show'} Scheduling
          </button>
        </div>

        {showScheduling && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enhancedState.schedule.enabled}
                  onChange={toggleScheduledBackups}
                  className="rounded"
                />
                <span className="text-sm font-medium">Enable automatic backups</span>
              </label>
            </div>

            {enhancedState.schedule.enabled && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Frequency
                  </label>
                  <div className="space-x-4">
                    {(['hourly', 'daily', 'weekly'] as const).map(interval => (
                      <label key={interval} className="inline-flex items-center">
                        <input
                          type="radio"
                          value={interval}
                          checked={enhancedState.schedule.interval === interval}
                          onChange={() => updateScheduleInterval(interval)}
                          className="rounded"
                        />
                        <span className="ml-2 text-sm capitalize">{interval}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {enhancedState.schedule.nextScheduledBackup && (
                  <div className="text-sm text-blue-700">
                    Next backup: {enhancedState.schedule.nextScheduledBackup.toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Analytics Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Backup Analytics</h3>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="text-blue-600 text-sm hover:text-blue-800"
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
        </div>

        {showAnalytics && (
          <div className="space-y-4">
            {/* Export History */}
            {enhancedState.analytics.exportHistory.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recent Exports</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Size</th>
                        <th className="text-left p-2">Compression</th>
                        <th className="text-left p-2">Duration</th>
                        <th className="text-left p-2">Format</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedState.analytics.exportHistory.slice(-5).map((record, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{record.timestamp.toLocaleTimeString()}</td>
                          <td className="p-2">{Math.round(record.size / 1024)}KB</td>
                          <td className="p-2">{Math.round(record.compressionRatio * 100)}%</td>
                          <td className="p-2">{Math.round(record.duration / 1000)}s</td>
                          <td className="p-2">{record.format}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Compression Stats */}
            {enhancedState.analytics.performanceMetrics.compressionStats.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Compression Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enhancedState.analytics.performanceMetrics.compressionStats.map((stat, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">{stat.algorithm}</div>
                      <div className="text-sm text-gray-600">
                        {Math.round(stat.ratio * 100)}% compression, {stat.time}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <Button onClick={resetState} variant="outline" size="sm">
              Dismiss
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancedBackupPanel;