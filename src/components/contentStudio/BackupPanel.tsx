// Enhanced Backup & Export Panel
// Provides unified interface for content export/import with modern UI

import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { useContentExport } from './shared/useContentExport';
import type { ExportOptions, ImportOptions } from '../../services/ContentExportService';

interface ExportOptionsState {
  format: ExportOptions['format'];
  includeMetadata: boolean;
  contentTypes: ExportOptions['contentTypes'];
  validateDependencies: boolean;
  includePreferences: boolean;
  compressionLevel: ExportOptions['compressionLevel'];
}

interface ImportOptionsState {
  allowLegacyFormat: boolean;
  ignoreMissingDependencies: boolean;
  overwriteExisting: boolean;
  validateContent: boolean;
}

export const BackupPanel: React.FC = () => {
  const {
    // State
    isExporting,
    isImporting,
    progress,
    stage,
    error,
    lastExportDate,
    lastImportDate,
    
    // Functions
    exportContent,
    importContent,
    exportAllContent,
    exportStorylets,
    exportCharacters,
    exportCompressed,
    validateImport,
    resetState,
    getStorageInfo
  } = useContentExport({
    onExportComplete: (result) => {
      console.log('Export completed:', result);
      setShowSuccess(true);
    },
    onImportComplete: (result) => {
      console.log('Import completed:', result);
      setShowSuccess(true);
    },
    onError: (error) => {
      console.error('Export/Import error:', error);
    }
  });

  // UI State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  // Export options
  const [exportOptions, setExportOptions] = useState<ExportOptionsState>({
    format: 'json',
    includeMetadata: true,
    contentTypes: undefined, // All types
    validateDependencies: true,
    includePreferences: true,
    compressionLevel: 3
  });

  // Import options
  const [importOptions, setImportOptions] = useState<ImportOptionsState>({
    allowLegacyFormat: true,
    ignoreMissingDependencies: false,
    overwriteExisting: false,
    validateContent: true
  });

  // Load storage info on mount
  React.useEffect(() => {
    const loadStorageInfo = async () => {
      const info = await getStorageInfo();
      setStorageInfo(info);
    };
    loadStorageInfo();
  }, [getStorageInfo]);

  // Export handlers
  const handleCustomExport = async () => {
    try {
      await exportContent(exportOptions);
    } catch (error) {
      console.error('Custom export failed:', error);
    }
  };

  // File drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => 
      file.type === 'application/json' || file.name.endsWith('.json')
    );
    
    if (jsonFile) {
      handleImportFile(jsonFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportFile(file);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      if (importOptions.validateContent) {
        // Validate first
        const validation = await validateImport(file);
        if (!validation?.success) {
          if (confirm(`Import validation found issues: ${validation?.errors?.join(', ')}. Continue anyway?`)) {
            await importContent(file, { ...importOptions, validateContent: false });
          }
          return;
        }
      }
      
      await importContent(file, importOptions);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  // Reset and cleanup
  const handleReset = () => {
    resetState();
    setShowSuccess(false);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Backup & Export</h2>
        <p className="text-gray-600">
          Manage your content with advanced export/import capabilities
        </p>
      </div>

      {/* Storage Information */}
      {storageInfo && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Storage Status</h3>
              <p className="text-sm text-blue-700">
                Using {Math.round(storageInfo.usage / 1024)}KB of {Math.round(storageInfo.quota / 1024 / 1024)}MB available
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-900">
                {Math.round((storageInfo.usage / storageInfo.quota) * 100)}% used
              </div>
              <div className="w-24 bg-blue-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min((storageInfo.usage / storageInfo.quota) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Export Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Content</h3>
        
        {/* Quick Export Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button
            onClick={exportAllContent}
            disabled={isExporting}
            variant="primary"
            className="text-sm"
          >
            📦 All Content
          </Button>
          <Button
            onClick={exportStorylets}
            disabled={isExporting}
            variant="outline"
            className="text-sm"
          >
            📚 Storylets Only
          </Button>
          <Button
            onClick={exportCharacters}
            disabled={isExporting}
            variant="outline"
            className="text-sm"
          >
            👥 Characters Only
          </Button>
          <Button
            onClick={exportCompressed}
            disabled={isExporting}
            variant="outline"
            className="text-sm"
          >
            🗜️ Compressed
          </Button>
        </div>

        {/* Advanced Export Options */}
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
                    Format
                  </label>
                  <select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      format: e.target.value as ExportOptions['format']
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="json">JSON</option>
                    <option value="compressed">Compressed</option>
                    <option value="structured">Structured</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Types
                  </label>
                  <select
                    value={exportOptions.contentTypes?.join(',') || 'all'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setExportOptions(prev => ({ 
                        ...prev, 
                        contentTypes: value === 'all' ? undefined : value.split(',') as ExportOptions['contentTypes']
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Content</option>
                    <option value="storylets">Storylets Only</option>
                    <option value="npcs">NPCs Only</option>
                    <option value="clues">Clues Only</option>
                    <option value="arcs">Story Arcs Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeMetadata: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include metadata</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.validateDependencies}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      validateDependencies: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Validate dependencies</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includePreferences}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includePreferences: e.target.checked 
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Include preferences</span>
                </label>
              </div>

              <Button
                onClick={handleCustomExport}
                disabled={isExporting}
                variant="primary"
                className="w-full"
              >
                Export with Custom Options
              </Button>
            </div>
          )}
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stage}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Import Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Content</h3>
        
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="space-y-4">
            <div className="text-4xl">📁</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your export file here
              </p>
              <p className="text-sm text-gray-600">
                or click to browse files
              </p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button as="span" variant="outline">
                Choose File
              </Button>
            </label>
          </div>
        </div>

        {/* Import Options */}
        <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-gray-900 mb-3">Import Options</h4>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={importOptions.allowLegacyFormat}
              onChange={(e) => setImportOptions(prev => ({ 
                ...prev, 
                allowLegacyFormat: e.target.checked 
              }))}
              className="rounded"
            />
            <span className="text-sm">Allow legacy format imports</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={importOptions.ignoreMissingDependencies}
              onChange={(e) => setImportOptions(prev => ({ 
                ...prev, 
                ignoreMissingDependencies: e.target.checked 
              }))}
              className="rounded"
            />
            <span className="text-sm">Ignore missing dependencies</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={importOptions.overwriteExisting}
              onChange={(e) => setImportOptions(prev => ({ 
                ...prev, 
                overwriteExisting: e.target.checked 
              }))}
              className="rounded"
            />
            <span className="text-sm">Overwrite existing content</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={importOptions.validateContent}
              onChange={(e) => setImportOptions(prev => ({ 
                ...prev, 
                validateContent: e.target.checked 
              }))}
              className="rounded"
            />
            <span className="text-sm">Validate content before import</span>
          </label>
        </div>

        {/* Import Progress */}
        {isImporting && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stage}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* History */}
      {(lastExportDate || lastImportDate) && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-2">Recent Activity</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {lastExportDate && (
              <div>Last export: {lastExportDate.toLocaleString()}</div>
            )}
            {lastImportDate && (
              <div>Last import: {lastImportDate.toLocaleString()}</div>
            )}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <Button onClick={handleReset} variant="outline" size="sm">
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-green-900">Success</h3>
              <p className="text-green-700 text-sm mt-1">
                Operation completed successfully!
              </p>
            </div>
            <Button onClick={() => setShowSuccess(false)} variant="outline" size="sm">
              Dismiss
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BackupPanel;