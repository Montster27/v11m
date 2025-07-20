# Content Studio Backup/Export System Implementation Plan

## Overview

This plan addresses critical limitations in the Content Studio backup system, migrating from localStorage (5MB limit) to IndexedDB, unifying fragmented export implementations, and ensuring no functionality is lost during the transition.

## Pre-Implementation Checklist

### Current Functionality Inventory

- [ ] Document all existing backup/export features across components
- [ ] List all data types being backed up (storylets, NPCs, clues, arcs)
- [ ] Map current user workflows for backup/restore
- [ ] Identify all components using localStorage directly
- [ ] Create test cases for each existing feature

### Testing Infrastructure

```typescript
// Create test utilities before starting
// /src/test/contentStudio/backupTestUtils.ts

export const createTestContent = () => ({
  storylets: generateTestStorylets(50),
  npcs: generateTestNPCs(20),
  clues: generateTestClues(30),
  arcs: generateTestArcs(10)
});

export const validateBackupIntegrity = (original: any, restored: any) => {
  // Deep comparison logic
};
```

## Phase 1: Storage Adapter Pattern (Days 1-3)

### Objective

Create storage abstraction layer without changing any functionality.

### Implementation Steps

1. **Create Storage Adapter Interface**

```typescript
// /src/services/storage/StorageAdapter.ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getKeys(): Promise<string[]>;
  getStorageInfo(): Promise<{
    usage: number;
    quota: number;
    available: number;
  }>;
}
```

2. **Implement LocalStorage Adapter (maintains current behavior)**

```typescript
// /src/services/storage/LocalStorageAdapter.ts
export class LocalStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }
  
  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }
  
  // ... other methods
}
```

3. **Implement IndexedDB Adapter**

```typescript
// /src/services/storage/IndexedDBAdapter.ts
export class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'ContentStudioDB';
  private storeName = 'backups';
  private db: IDBDatabase | null = null;
  
  async initialize(): Promise<void> {
    // Open/create IndexedDB
  }
  
  async getItem(key: string): Promise<string | null> {
    // Retrieve from IndexedDB
  }
  
  // ... implement all methods
}
```

4. **Update useStudioPersistence Hook**

```typescript
// /src/components/contentStudio/shared/useStudioPersistence.ts
interface PersistenceConfig<T> {
  storageAdapter?: StorageAdapter; // New option
  // ... existing config
}

// Default to LocalStorageAdapter for backward compatibility
const defaultAdapter = new LocalStorageAdapter();
```

### Testing Phase 1

```typescript
// /src/test/contentStudio/phase1.test.ts
describe('Phase 1: Storage Adapter Pattern', () => {
  it('LocalStorageAdapter maintains exact current behavior', async () => {
    const adapter = new LocalStorageAdapter();
    const testData = { test: 'data' };
    
    await adapter.setItem('test', JSON.stringify(testData));
    const retrieved = await adapter.getItem('test');
    
    expect(JSON.parse(retrieved)).toEqual(testData);
    expect(localStorage.getItem('test')).toEqual(retrieved);
  });
  
  it('IndexedDBAdapter provides same interface', async () => {
    const adapter = new IndexedDBAdapter();
    await adapter.initialize();
    
    const testData = createTestContent();
    await adapter.setItem('backup', JSON.stringify(testData));
    const retrieved = await adapter.getItem('backup');
    
    expect(JSON.parse(retrieved)).toEqual(testData);
  });
  
  it('useStudioPersistence works with both adapters', async () => {
    // Test with LocalStorageAdapter
    // Test with IndexedDBAdapter
    // Verify identical behavior
  });
});
```

### Rollback Plan

- Keep LocalStorageAdapter as default
- Feature flag for IndexedDB: `ENABLE_INDEXEDDB_STORAGE=false`
- No changes to component code yet

## Phase 2: Migration Strategy (Days 4-6)

### Objective

Implement seamless migration from localStorage to IndexedDB without data loss.

### Implementation Steps

1. **Create Migration Service**

```typescript
// /src/services/storage/StorageMigrationService.ts
export class StorageMigrationService {
  async migrateFromLocalStorage(): Promise<MigrationResult> {
    const localStorage = new LocalStorageAdapter();
    const indexedDB = new IndexedDBAdapter();
    
    // 1. Initialize IndexedDB
    await indexedDB.initialize();
    
    // 2. Get all localStorage keys
    const keys = await localStorage.getKeys();
    const backupKeys = keys.filter(k => 
      k.startsWith('content_backup_') || 
      k.startsWith('studio_data')
    );
    
    // 3. Copy each item to IndexedDB
    const migrated: string[] = [];
    const failed: string[] = [];
    
    for (const key of backupKeys) {
      try {
        const data = await localStorage.getItem(key);
        if (data) {
          await indexedDB.setItem(key, data);
          migrated.push(key);
        }
      } catch (error) {
        failed.push(key);
        console.error(`Failed to migrate ${key}:`, error);
      }
    }
    
    return { migrated, failed, total: backupKeys.length };
  }
  
  async verifyMigration(): Promise<boolean> {
    // Compare data in both stores
  }
}
```

2. **Add Migration UI Component**

```typescript
// /src/components/contentStudio/StorageMigration.tsx
export const StorageMigration: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<
    'pending' | 'migrating' | 'complete' | 'failed'
  >('pending');
  
  const handleMigrate = async () => {
    setMigrationStatus('migrating');
    const service = new StorageMigrationService();
    
    try {
      const result = await service.migrateFromLocalStorage();
      if (result.failed.length === 0) {
        setMigrationStatus('complete');
        // Set flag to use IndexedDB going forward
        localStorage.setItem('storage_migrated', 'true');
      }
    } catch (error) {
      setMigrationStatus('failed');
    }
  };
  
  // UI for migration with progress and retry
};
```

3. **Update ContentStudio to Check Migration Status**

```typescript
// /src/components/ContentStudio.tsx
const ContentStudio: React.FC = () => {
  const [storageAdapter, setStorageAdapter] = useState<StorageAdapter>();
  
  useEffect(() => {
    const checkStorage = async () => {
      const migrated = localStorage.getItem('storage_migrated');
      
      if (migrated === 'true') {
        const adapter = new IndexedDBAdapter();
        await adapter.initialize();
        setStorageAdapter(adapter);
      } else {
        setStorageAdapter(new LocalStorageAdapter());
      }
    };
    
    checkStorage();
  }, []);
  
  // Show migration prompt if not migrated
  if (!storageAdapter) {
    return <StorageMigration />;
  }
  
  // Rest of component
};
```

### Testing Phase 2

```typescript
describe('Phase 2: Storage Migration', () => {
  beforeEach(() => {
    // Populate localStorage with test data
    localStorage.clear();
    const testData = createTestContent();
    localStorage.setItem('content_backup_1', JSON.stringify(testData));
    localStorage.setItem('studio_data', JSON.stringify(testData));
  });
  
  it('migrates all backup data from localStorage to IndexedDB', async () => {
    const service = new StorageMigrationService();
    const result = await service.migrateFromLocalStorage();
    
    expect(result.migrated.length).toBe(2);
    expect(result.failed.length).toBe(0);
    
    // Verify data integrity
    const indexedDB = new IndexedDBAdapter();
    await indexedDB.initialize();
    
    const backup1 = await indexedDB.getItem('content_backup_1');
    expect(JSON.parse(backup1)).toEqual(
      JSON.parse(localStorage.getItem('content_backup_1'))
    );
  });
  
  it('handles partial migration failures gracefully', async () => {
    // Test with corrupted data
    localStorage.setItem('bad_backup', 'corrupted');
    
    const service = new StorageMigrationService();
    const result = await service.migrateFromLocalStorage();
    
    expect(result.failed).toContain('bad_backup');
    // Other backups should still migrate
  });
  
  it('preserves all functionality after migration', async () => {
    // Run full user workflow tests
    // Create backup, restore, export, import
    // Verify identical behavior
  });
});
```

### Rollback Plan

- Keep localStorage data intact during migration
- Add "Use Legacy Storage" option in settings
- Clear migration flag to revert: `localStorage.removeItem('storage_migrated')`

## Phase 3: Unified Export Service (Days 7-10)

### Objective

Replace fragmented export implementations with unified service.

### Implementation Steps

1. **Create Unified Export Service**

```typescript
// /src/services/ContentExportService.ts
export interface ExportOptions {
  format: 'json' | 'compressed' | 'structured';
  includeMetadata: boolean;
  contentTypes?: ('storylets' | 'npcs' | 'clues' | 'arcs')[];
}

export interface ExportPackage {
  version: string;
  timestamp: string;
  metadata: {
    schemaVersion: number;
    contentCounts: Record<string, number>;
    dependencies: ContentDependency[];
    exportOptions: ExportOptions;
  };
  data: {
    storylets?: Storylet[];
    npcs?: NPC[];
    clues?: Clue[];
    arcs?: StoryArc[];
  };
}

export class ContentExportService {
  constructor(
    private narrativeStore: NarrativeStore,
    private socialStore: SocialStore,
    private storageAdapter: StorageAdapter
  ) {}
  
  async exportProject(options: ExportOptions): Promise<ExportPackage> {
    const pack: ExportPackage = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      metadata: {
        schemaVersion: 1,
        contentCounts: {},
        dependencies: [],
        exportOptions: options
      },
      data: {}
    };
    
    // Gather data from stores
    if (!options.contentTypes || options.contentTypes.includes('storylets')) {
      pack.data.storylets = await this.gatherStorylets();
      pack.metadata.contentCounts.storylets = pack.data.storylets.length;
    }
    
    // Build dependency graph
    pack.metadata.dependencies = await this.analyzeDependencies(pack.data);
    
    // Compress if requested
    if (options.format === 'compressed') {
      return this.compressPackage(pack);
    }
    
    return pack;
  }
  
  async importProject(
    packageData: ExportPackage,
    options: ImportOptions
  ): Promise<ImportResult> {
    // Validate schema version
    if (packageData.metadata.schemaVersion > CURRENT_SCHEMA_VERSION) {
      throw new Error('Package requires newer version');
    }
    
    // Check dependencies
    const missingDeps = await this.checkDependencies(
      packageData.metadata.dependencies
    );
    
    if (missingDeps.length > 0 && !options.ignoreMissingDependencies) {
      return {
        success: false,
        errors: missingDeps.map(d => `Missing ${d.type}: ${d.id}`)
      };
    }
    
    // Import with transaction support
    const transaction = new ImportTransaction(this.storageAdapter);
    
    try {
      await transaction.begin();
      
      // Import each content type
      if (packageData.data.storylets) {
        await this.importStorylets(
          packageData.data.storylets,
          transaction
        );
      }
      
      await transaction.commit();
      
      return { success: true, imported: packageData.metadata.contentCounts };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
```

2. **Update Components to Use Export Service**

```typescript
// /src/components/contentStudio/shared/useContentExport.ts
export const useContentExport = () => {
  const narrativeStore = useNarrativeStore();
  const socialStore = useSocialStore();
  const storageAdapter = useStorageAdapter(); // From context
  
  const exportService = useMemo(
    () => new ContentExportService(narrativeStore, socialStore, storageAdapter),
    [narrativeStore, socialStore, storageAdapter]
  );
  
  const exportContent = useCallback(async (options: ExportOptions) => {
    try {
      const package = await exportService.exportProject(options);
      
      // Handle download
      if (options.format === 'json') {
        downloadJSON(package, `content-export-${Date.now()}.json`);
      }
      
      return package;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }, [exportService]);
  
  return { exportContent, importContent };
};
```

3. **Deprecate Old Export Functions**

```typescript
// /src/components/ContentStudio.tsx
const createBackup = () => {
  /**
   * @deprecated Use ContentExportService instead
   * This function will be removed in v3.0
   */
  console.warn('createBackup is deprecated. Use ContentExportService');
  
  // Redirect to new service
  const exportService = new ContentExportService(/* ... */);
  exportService.exportProject({ 
    format: 'json',
    includeMetadata: true 
  });
};
```

### Testing Phase 3

```typescript
describe('Phase 3: Unified Export Service', () => {
  let exportService: ContentExportService;
  
  beforeEach(() => {
    // Setup test stores and adapter
    exportService = new ContentExportService(/* ... */);
  });
  
  it('exports all content types with correct structure', async () => {
    const package = await exportService.exportProject({
      format: 'json',
      includeMetadata: true
    });
    
    expect(package.version).toBe('2.0');
    expect(package.metadata.schemaVersion).toBe(1);
    expect(package.data.storylets).toBeDefined();
    expect(package.data.npcs).toBeDefined();
  });
  
  it('maintains backward compatibility with old exports', async () => {
    // Load old format export
    const oldExport = loadTestFixture('v1-export.json');
    
    // Should import successfully
    const result = await exportService.importProject(oldExport, {
      allowLegacyFormat: true
    });
    
    expect(result.success).toBe(true);
  });
  
  it('validates dependencies on import', async () => {
    const package = createTestPackageWithMissingDeps();
    
    const result = await exportService.importProject(package, {
      ignoreMissingDependencies: false
    });
    
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Missing npc: missing-npc-123');
  });
  
  it('provides identical functionality to old system', async () => {
    // Compare outputs
    const oldBackup = createOldStyleBackup();
    const newExport = await exportService.exportProject({
      format: 'json',
      includeMetadata: false // Match old format
    });
    
    expect(normalizeExport(newExport)).toEqual(
      normalizeExport(oldBackup)
    );
  });
});
```

## Phase 4: Complete V2 Store Migration (Days 11-13)

### Objective

Remove all legacy store references and complete V2 migration.

### Implementation Steps

1. **Run One-Time Migration**

```typescript
// /src/migrations/v2StoreMigration.ts
export const runV2Migration = async () => {
  const migrationKey = 'v2_store_migration_complete';
  
  if (localStorage.getItem(migrationKey) === 'true') {
    return; // Already migrated
  }
  
  try {
    // Get legacy data
    const legacyStore = useStoryletCatalogStore.getState();
    const narrativeStore = useNarrativeStore.getState();
    
    // Migrate storylets
    await narrativeStore.migrateFromLegacyStores();
    
    // Verify migration
    const allMigrated = legacyStore.allStorylets.every(
      storylet => narrativeStore.getStorylet(storylet.id)
    );
    
    if (allMigrated) {
      localStorage.setItem(migrationKey, 'true');
      console.log('V2 migration complete');
    }
  } catch (error) {
    console.error('V2 migration failed:', error);
  }
};
```

2. **Remove Legacy Store Imports**

```typescript
// Update all components
// Before:
import { useStoryletCatalogStore } from '../store/useStoryletCatalogStore';

// After:
import { useNarrativeStore } from '../stores/v2/useNarrativeStore';
```

3. **Update All Store References**

```typescript
// Before:
const catalogStore = useStoryletCatalogStore();
const storylets = catalogStore.allStorylets;

// After:
const narrativeStore = useNarrativeStore();
const storylets = narrativeStore.getStorylets();
```

### Testing Phase 4

```typescript
describe('Phase 4: V2 Store Migration', () => {
  it('migrates all data from legacy stores', async () => {
    // Setup legacy data
    setupLegacyTestData();
    
    // Run migration
    await runV2Migration();
    
    // Verify all data migrated
    const narrativeStore = useNarrativeStore.getState();
    const legacyStorylets = getLegacyStorylets();
    
    legacyStorylets.forEach(storylet => {
      expect(narrativeStore.getStorylet(storylet.id)).toEqual(storylet);
    });
  });
  
  it('application works without legacy stores', async () => {
    // Mock legacy stores to throw errors
    jest.mock('../store/useStoryletCatalogStore', () => {
      throw new Error('Legacy store should not be used');
    });
    
    // Run full application test suite
    // Should pass without accessing legacy stores
  });
});
```

## Phase 5: Enhanced Features (Days 14-16)

### Objective

Add compression, chunking, and improved UI.

### Implementation Steps

1. **Add Compression Support**

```typescript
// /src/services/compression/CompressionService.ts
import pako from 'pako';

export class CompressionService {
  async compress(data: string): Promise<Uint8Array> {
    return pako.deflate(data);
  }
  
  async decompress(data: Uint8Array): Promise<string> {
    return pako.inflate(data, { to: 'string' });
  }
  
  async compressJSON(obj: any): Promise<Uint8Array> {
    const json = JSON.stringify(obj);
    return this.compress(json);
  }
}
```

2. **Implement Progress Tracking**

```typescript
// /src/components/contentStudio/ExportProgress.tsx
export const ExportProgress: React.FC<{
  operation: 'export' | 'import';
  progress: number;
  stage: string;
}> = ({ operation, progress, stage }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">
          {operation === 'export' ? 'Exporting Content' : 'Importing Content'}
        </h3>
        
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">{stage}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          {progress}% complete
        </div>
      </div>
    </div>
  );
};
```

3. **Add Export/Import UI Tab**

```typescript
// /src/components/contentStudio/BackupPanel.tsx
export const BackupPanel: React.FC = () => {
  const { exportContent, importContent } = useContentExport();
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleExport = async () => {
    setShowProgress(true);
    
    try {
      await exportContent({
        format: 'compressed',
        includeMetadata: true,
        onProgress: (p) => setProgress(p)
      });
    } finally {
      setShowProgress(false);
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Backup & Export</h2>
      
      {/* Export section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Export Content</h3>
        <div className="space-y-4">
          <ExportOptions />
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Export Project
          </button>
        </div>
      </div>
      
      {/* Import section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Import Content</h3>
        <ImportDropzone onImport={handleImport} />
      </div>
      
      {showProgress && <ExportProgress progress={progress} />}
    </div>
  );
};
```

### Testing Phase 5

```typescript
describe('Phase 5: Enhanced Features', () => {
  it('compresses large exports efficiently', async () => {
    const largeContent = createTestContent();
    // Make it large
    for (let i = 0; i < 1000; i++) {
      largeContent.storylets.push(generateTestStorylet());
    }
    
    const uncompressed = JSON.stringify(largeContent);
    const compressed = await new CompressionService().compress(uncompressed);
    
    expect(compressed.length).toBeLessThan(uncompressed.length * 0.3);
  });
  
  it('shows accurate progress during export', async () => {
    const progressUpdates: number[] = [];
    
    await exportService.exportProject({
      format: 'compressed',
      onProgress: (p) => progressUpdates.push(p)
    });
    
    expect(progressUpdates.length).toBeGreaterThan(5);
    expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
  });
});
```

## Final Integration Testing

### Complete System Test Suite

```typescript
describe('Complete Backup System Integration', () => {
  it('preserves all v1 functionality', async () => {
    // Test every feature from original system
    const tests = [
      'create manual backup',
      'auto-save functionality',
      'restore from backup',
      'export story arc',
      'import story arc',
      'backup rotation (keep 5)',
      'cooldown tracking'
    ];
    
    for (const test of tests) {
      expect(await runFeatureTest(test)).toBe(true);
    }
  });
  
  it('handles edge cases gracefully', async () => {
    // Corrupt data
    // Missing dependencies  
    // Large files
    // Concurrent operations
    // Storage quota exceeded
  });
  
  it('provides better performance', async () => {
    const largeProject = createLargeTestProject(); // 10MB+
    
    // Old system would fail here
    const start = Date.now();
    await exportService.exportProject({ format: 'compressed' });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // Under 1 second
  });
});
```

## Deployment Strategy

### Feature Flags

```typescript
// /src/config/features.ts
export const FEATURES = {
  USE_INDEXEDDB: process.env.REACT_APP_USE_INDEXEDDB === 'true',
  ENABLE_COMPRESSION: process.env.REACT_APP_ENABLE_COMPRESSION === 'true',
  SHOW_BACKUP_TAB: process.env.REACT_APP_SHOW_BACKUP_TAB === 'true'
};
```

### Gradual Rollout

1. **Week 1**: Deploy with features off, test migration flow
2. **Week 2**: Enable for 10% of users
3. **Week 3**: Enable for 50% of users
4. **Week 4**: Full rollout

### Monitoring

```typescript
// Add telemetry
window.analytics?.track('backup_export', {
  format: options.format,
  size: package.size,
  duration: exportDuration,
  storageType: adapter.type
});
```

## Success Metrics

- **No data loss**: 100% successful migrations
- **Performance**: 10x larger projects supported
- **User satisfaction**: Reduced support tickets about lost work
- **Code quality**: 70% less code duplication
- **Test coverage**: >95% for all backup operations

## Rollback Procedures

Each phase has independent rollback:

1. **Phase 1**: Switch back to direct localStorage
2. **Phase 2**: Clear migration flag, use legacy storage
3. **Phase 3**: Restore deprecated functions temporarily
4. **Phase 4**: Re-enable legacy stores via feature flag
5. **Phase 5**: Disable enhanced features via config

## Timeline Summary

- **Days 1-3**: Storage adapter pattern
- **Days 4-6**: Migration infrastructure
- **Days 7-10**: Unified export service
- **Days 11-13**: V2 store completion
- **Days 14-16**: Enhanced features
- **Days 17-18**: Integration testing
- **Days 19-20**: Documentation & deployment prep

Total: 4 weeks from start to production-ready

## Post-Launch Enhancements

- Cloud backup integration
- Collaborative editing support
- Version control for content
- Differential backups
- Real-time sync across devices