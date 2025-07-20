// React hook for content export/import functionality
// Provides easy-to-use interface for components

import { useState, useCallback, useMemo } from 'react';
import { 
  ContentExportService, 
  ExportOptions, 
  ImportOptions, 
  ExportPackage, 
  ImportResult 
} from '../../../services/ContentExportService';
import { StorageAdapter } from '../../../services/storage/StorageAdapter';
import { StorageFactory } from '../../../services/storage/StorageFactory';

export interface ExportState {
  isExporting: boolean;
  isImporting: boolean;
  progress: number;
  stage: string;
  error: string | null;
  lastExportDate: Date | null;
  lastImportDate: Date | null;
}

export interface UseContentExportOptions {
  storageAdapter?: StorageAdapter;
  onExportComplete?: (exportPackage: ExportPackage) => void;
  onImportComplete?: (result: ImportResult) => void;
  onError?: (error: string) => void;
  enableMonitoring?: boolean;
}

export const useContentExport = (options: UseContentExportOptions = {}) => {
  // State management
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    isImporting: false,
    progress: 0,
    stage: '',
    error: null,
    lastExportDate: null,
    lastImportDate: null
  });

  // Get storage adapter
  const storageAdapter = useMemo(() => {
    return options.storageAdapter || StorageFactory.getPreferredAdapter();
  }, [options.storageAdapter]);

  // Create export service instance
  const exportService = useMemo(() => {
    return new ContentExportService(storageAdapter);
  }, [storageAdapter]);

  // Update state helper
  const updateState = useCallback((updates: Partial<ExportState>) => {
    setExportState(prev => ({ ...prev, ...updates }));
  }, []);

  // Export content function
  const exportContent = useCallback(async (exportOptions: ExportOptions): Promise<ExportPackage | null> => {
    if (exportState.isExporting) {
      throw new Error('Export already in progress');
    }

    updateState({
      isExporting: true,
      progress: 0,
      stage: 'Starting export...',
      error: null
    });

    try {
      const optionsWithProgress: ExportOptions = {
        ...exportOptions,
        onProgress: (progress, stage) => {
          updateState({ progress, stage });
          if (exportOptions.onProgress) {
            exportOptions.onProgress(progress, stage);
          }
        }
      };

      const result = await exportService.exportProject(optionsWithProgress);

      updateState({
        isExporting: false,
        progress: 100,
        stage: 'Export complete',
        lastExportDate: new Date()
      });

      // Trigger download if format is JSON or structured
      if (exportOptions.format === 'json' || exportOptions.format === 'structured') {
        downloadJSON(result, `content-export-${Date.now()}.json`);
      }

      if (options.onExportComplete) {
        options.onExportComplete(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      updateState({
        isExporting: false,
        error: errorMessage,
        stage: 'Export failed'
      });

      if (options.onError) {
        options.onError(errorMessage);
      }

      throw error;
    }
  }, [exportState.isExporting, exportService, options, updateState]);

  // Import content function
  const importContent = useCallback(async (
    packageData: ExportPackage | File, 
    importOptions: ImportOptions = {}
  ): Promise<ImportResult | null> => {
    if (exportState.isImporting) {
      throw new Error('Import already in progress');
    }

    updateState({
      isImporting: true,
      progress: 0,
      stage: 'Preparing import...',
      error: null
    });

    try {
      let parsedPackage: ExportPackage;

      // Handle file input
      if (packageData instanceof File) {
        updateState({ stage: 'Reading file...' });
        const fileContent = await readFileAsText(packageData);
        parsedPackage = JSON.parse(fileContent);
      } else {
        parsedPackage = packageData;
      }

      const optionsWithProgress: ImportOptions = {
        ...importOptions,
        onProgress: (progress, stage) => {
          updateState({ progress, stage });
          if (importOptions.onProgress) {
            importOptions.onProgress(progress, stage);
          }
        }
      };

      const result = await exportService.importProject(parsedPackage, optionsWithProgress);

      updateState({
        isImporting: false,
        progress: 100,
        stage: result.success ? 'Import complete' : 'Import completed with errors',
        lastImportDate: new Date(),
        error: result.success ? null : result.errors?.join(', ') || 'Import failed'
      });

      if (options.onImportComplete) {
        options.onImportComplete(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
      updateState({
        isImporting: false,
        error: errorMessage,
        stage: 'Import failed'
      });

      if (options.onError) {
        options.onError(errorMessage);
      }

      throw error;
    }
  }, [exportState.isImporting, exportService, options, updateState]);

  // Quick export presets
  const exportAllContent = useCallback(() => {
    return exportContent({
      format: 'json',
      includeMetadata: true,
      validateDependencies: true,
      includePreferences: true
    });
  }, [exportContent]);

  const exportStorylets = useCallback(() => {
    return exportContent({
      format: 'json',
      includeMetadata: true,
      contentTypes: ['storylets'],
      validateDependencies: true
    });
  }, [exportContent]);

  const exportCharacters = useCallback(() => {
    return exportContent({
      format: 'json',
      includeMetadata: true,
      contentTypes: ['npcs'],
      validateDependencies: false
    });
  }, [exportContent]);

  const exportCompressed = useCallback(() => {
    return exportContent({
      format: 'compressed',
      includeMetadata: true,
      validateDependencies: true,
      includePreferences: true,
      compressionLevel: 3
    });
  }, [exportContent]);

  // Quick import with validation
  const importWithValidation = useCallback((packageData: ExportPackage | File) => {
    return importContent(packageData, {
      validateContent: true,
      ignoreMissingDependencies: false,
      overwriteExisting: false
    });
  }, [importContent]);

  // Import with overwrite
  const importWithOverwrite = useCallback((packageData: ExportPackage | File) => {
    return importContent(packageData, {
      validateContent: true,
      ignoreMissingDependencies: true,
      overwriteExisting: true
    });
  }, [importContent]);

  // Dry run import (validation only)
  const validateImport = useCallback((packageData: ExportPackage | File) => {
    return importContent(packageData, {
      dryRun: true,
      validateContent: true
    });
  }, [importContent]);

  // Reset state
  const resetState = useCallback(() => {
    setExportState({
      isExporting: false,
      isImporting: false,
      progress: 0,
      stage: '',
      error: null,
      lastExportDate: null,
      lastImportDate: null
    });
  }, []);

  // Get storage info
  const getStorageInfo = useCallback(async () => {
    try {
      return await storageAdapter.getStorageInfo();
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }, [storageAdapter]);

  return {
    // State
    ...exportState,
    
    // Core functions
    exportContent,
    importContent,
    
    // Quick actions
    exportAllContent,
    exportStorylets,
    exportCharacters,
    exportCompressed,
    importWithValidation,
    importWithOverwrite,
    validateImport,
    
    // Utilities
    resetState,
    getStorageInfo,
    
    // Service access (for advanced usage)
    exportService,
    storageAdapter
  };
};

// Helper functions
function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
}

export default useContentExport;