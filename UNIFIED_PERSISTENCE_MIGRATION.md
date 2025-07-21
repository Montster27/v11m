# Migration Guide: Unified Persistence System

## Overview

The V11M2 project has consolidated all persistence functionality into a unified system that replaces multiple fragmented implementations with a single, comprehensive service.

## What Was Replaced

### Before (Fragmented)
- `ContentStudio.tsx` local `createBackup()` function
- `useStudioPersistence` hook with custom backup logic
- `ArcExportImport` component with manual file operations
- Multiple storage key patterns and retention policies

### After (Unified)
- `UnifiedPersistenceService` - Single service for all persistence operations
- `useUnifiedPersistence` hook - React integration with enhanced features
- `ChunkedStorageAdapter` - Automatic chunking for large data (>1MB)
- Consistent backup management and retention policies

## Migration Steps

### 1. Replace useStudioPersistence

**Old Code:**
```typescript
import { useStudioPersistence } from '../shared/useStudioPersistence';

const MyComponent = () => {
  const {
    save,
    load,
    createBackup,
    isDirty,
    isSaving
  } = useStudioPersistence(initialData, {
    autoSaveEnabled: true,
    storageKey: 'my_component_data'
  });
  
  return (
    <div>
      {isDirty && <span>Unsaved changes</span>}
      <button onClick={() => createBackup(data, 'Manual backup')}>
        Backup
      </button>
    </div>
  );
};
```

**New Code:**
```typescript
import { useUnifiedPersistence } from '../hooks/useUnifiedPersistence';

const MyComponent = () => {
  const {
    createBackup,
    isDirty,
    isSaving,
    markDirty,
    exportProject
  } = useUnifiedPersistence({
    autoSaveEnabled: true,
    maxBackups: 10,
    defaultExportOptions: {
      format: 'compressed',
      includeMetadata: true
    }
  });
  
  return (
    <div>
      {isDirty && <span>Unsaved changes</span>}
      <button onClick={() => createBackup('Manual backup')}>
        Backup
      </button>
    </div>
  );
};
```

### 2. Replace ContentStudio createBackup()

**Old Code:**
```typescript
const createBackup = async () => {
  try {
    // Manual ContentExportService usage
    const exportService = new ContentExportService(storageAdapter);
    const exportPackage = await exportService.exportProject({...});
    
    // Manual retention management
    await storageAdapter.setItem(backupKey, JSON.stringify(exportPackage));
    // ... retention logic
  } catch (error) {
    // Error handling
  }
};
```

**New Code:**
```typescript
const {
  createBackup,
  createPreActionBackup
} = useUnifiedPersistence({
  storageAdapter,
  autoSaveEnabled: true,
  onBackupCreated: (backup) => {
    console.log(`Backup created: ${backup.label}`);
    onBackupCreate?.();
  }
});

// Simple backup creation
await createBackup('Manual backup');

// Pre-action backup (before destructive operations)
await createPreActionBackup('Delete storylet');
```

### 3. Replace ArcExportImport

**Old Code:**
```typescript
import ArcExportImport from './ArcExportImport';

const VisualEditor = () => {
  const handleExport = (arc) => {
    // Manual JSON export
    const exportData = { arc, timestamp: new Date() };
    // File download logic
  };
  
  return (
    <ArcExportImport
      currentArc={arc}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
};
```

**New Code:**
```typescript
import { useUnifiedPersistence } from '../hooks/useUnifiedPersistence';

const VisualEditor = () => {
  const { exportProject, importProject, createBackup } = useUnifiedPersistence();
  
  const handleExport = async () => {
    const exportData = await exportProject({
      format: 'json',
      contentTypes: ['arcs'], // Export only arcs
      includeMetadata: true
    });
    
    if (exportData) {
      // Automatic file download or sharing
      const blob = new Blob([JSON.stringify(exportData, null, 2)], 
        { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-arc-${Date.now()}.json`;
      a.click();
    }
  };
  
  return (
    <div>
      <button onClick={handleExport}>Export Arc</button>
      <button onClick={() => createBackup('Arc checkpoint')}>
        Save Checkpoint
      </button>
    </div>
  );
};
```

## New Features Available

### 1. Automatic Chunking
Large backups (>1MB) are automatically chunked for storage efficiency:
```typescript
const { getStorageInfo } = useUnifiedPersistence();

const info = await getStorageInfo();
console.log(`Storage used: ${info.used} / ${info.quota} bytes`);
```

### 2. Advanced Backup Management
```typescript
const {
  listBackups,
  restoreBackup,
  deleteBackup,
  getStats
} = useUnifiedPersistence();

// List all backups
const backups = await listBackups();

// Restore from backup
await restoreBackup(backups[0].id);

// Get backup statistics
const stats = await getStats();
console.log(`Total backups: ${stats.totalBackups}`);
console.log(`Total size: ${stats.totalSize} bytes`);
```

### 3. Pre-Action Backups
Automatic backups before destructive operations:
```typescript
const handleDeleteStorylet = async (id) => {
  // Automatically creates backup before deletion
  await createPreActionBackup('Delete storylet');
  
  // Perform deletion
  deleteStorylet(id);
};
```

### 4. Enhanced Auto-Save
```typescript
const {
  enableAutoSave,
  disableAutoSave,
  forceAutoSave,
  markDirty
} = useUnifiedPersistence({
  autoSaveEnabled: true,
  autoSaveIntervalMs: 30000, // 30 seconds
  autoSaveDebounceMs: 2000,  // 2 seconds after changes
});

// Mark data as changed (triggers auto-save)
markDirty();

// Force immediate auto-save
await forceAutoSave();
```

## Configuration Options

### UnifiedPersistenceService Config
```typescript
interface UnifiedPersistenceConfig {
  storageAdapter?: StorageAdapter;        // Custom storage adapter
  autoSaveEnabled?: boolean;              // Enable auto-save (default: true)
  autoSaveIntervalMs?: number;            // Auto-save interval (default: 30s)
  autoSaveDebounceMs?: number;            // Debounce delay (default: 2s)
  maxBackups?: number;                    // Max backups to keep (default: 10)
  backupIntervalMs?: number;              // Backup interval (default: 5min)
  defaultExportOptions?: ExportOptions;   // Default export settings
  onBackupCreated?: (backup) => void;     // Backup creation callback
  onError?: (error) => void;              // Error callback
}
```

### Storage Adapter with Chunking
```typescript
import { StorageFactory } from '../services/storage/StorageFactory';

const adapter = await StorageFactory.createAdapter({
  type: 'auto',                    // Auto-select best adapter
  enableChunking: true,            // Enable automatic chunking
  chunkingOptions: {
    chunkSizeBytes: 1024 * 1024,   // 1MB chunks
    maxChunks: 500,                // Support up to 500MB
    compressionEnabled: false      // Let ContentExportService compress
  }
});
```

## Benefits of Migration

### 1. Performance
- **Large Data Handling**: Automatic chunking supports 50MB+ datasets
- **Compression**: Built-in compression reduces storage usage by 60-80%
- **Efficient Storage**: IndexedDB with chunking vs localStorage limits

### 2. Reliability
- **Atomic Operations**: Backup/restore operations are atomic
- **Error Recovery**: Comprehensive error handling and rollback
- **Data Integrity**: Validation and checksum verification

### 3. Developer Experience
- **Single API**: One interface for all persistence operations
- **React Integration**: Optimized hooks with state management
- **Comprehensive Logging**: Detailed operation logging and monitoring

### 4. Features
- **Pre-Action Backups**: Automatic safety before destructive operations
- **Backup Management**: List, restore, delete backups with metadata
- **Statistics**: Storage usage and backup analytics
- **Auto-Save**: Intelligent auto-save with debouncing

## Backwards Compatibility

The migration is designed to be gradual:

1. **Phase 1**: New components use UnifiedPersistenceService
2. **Phase 2**: Existing components migrate when convenient
3. **Phase 3**: Deprecated components removed after full migration

Old components continue to work during the transition period.

## Testing

The unified system includes comprehensive test coverage:

```bash
# Run unified persistence tests
npm test -- unifiedPersistenceService.test.ts

# Run chunked storage tests  
npm test -- chunkedStorageAdapter.test.ts
```

## Support

For migration assistance or questions:
1. Check existing component implementations using the new system
2. Refer to the comprehensive test suite for usage examples
3. Review the Phase 2 implementation documentation

The unified persistence system represents a significant improvement in data management, storage efficiency, and developer experience while maintaining full backwards compatibility during migration.